/**
 * CSV-import streaming endpoint.
 *
 * Takes a parsed batch of rows from the CSV import form, inserts them as
 * `source: 'import'` reviews in `status: 'pending'`, then runs the analyzer
 * over each row sequentially (no drafter — owner picks which historical
 * reviews to draft replies for later via the existing per-review flow).
 *
 * Streams progress via SSE:
 *   - 'inserted' — { count } — initial insert is done, ready to analyze
 *   - 'progress' — { index, reviewId, ok: true } — row analyzed successfully
 *   - 'progress' — { index, reviewId, ok: false, reason } — row failed (kept as pending)
 *   - 'done'     — { analyzed, failed, total }
 *   - 'error'    — { reason, message } — terminal (quota or other)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, restaurants, reviews } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { analyzeReview } from '@/ai/analyzer';

export const runtime = 'nodejs';
export const maxDuration = 300; // up to 500 rows × ~2s/row = ~17m worst case; cap at 5min

const rowSchema = z.object({
  reviewText: z.string().trim().min(5).max(4000),
  rating: z.coerce.number().int().min(1).max(5),
  authorName: z.string().trim().max(120).optional(),
  postedAt: z.string().datetime().optional(),
  language: z.enum(['ar', 'en', 'mixed']).optional(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

export async function POST(req: NextRequest) {
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) {
    return NextResponse.json({ error: 'no restaurant' }, { status: 400 });
  }

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  }

  const inputRows = parsed.data.rows;
  const restaurantId = restaurant.id;

  // Bulk-insert all rows first so analyzer failures don't lose data.
  const inserted = await db
    .insert(reviews)
    .values(
      inputRows.map((r) => ({
        restaurantId,
        source: 'import' as const,
        authorName: r.authorName,
        rating: r.rating,
        reviewText: r.reviewText,
        postedAt: r.postedAt ? new Date(r.postedAt) : new Date(),
        status: 'pending' as const,
        language: r.language,
      }))
    )
    .returning({ id: reviews.id, reviewText: reviews.reviewText, rating: reviews.rating });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      send('inserted', { count: inserted.length });

      let analyzed = 0;
      let failed = 0;

      for (let i = 0; i < inserted.length; i++) {
        const row = inserted[i];
        try {
          const analysis = await analyzeReview({
            reviewText: row.reviewText,
            rating: row.rating,
            authorName: inputRows[i].authorName,
          });
          await db
            .update(reviews)
            .set({
              language: analysis.language,
              sentiment: analysis.sentiment,
              topics: analysis.topics,
              urgency: analysis.urgency,
              severity: analysis.severity,
              // status stays 'pending' — owner draft-generates on demand
            })
            .where(eq(reviews.id, row.id));
          analyzed++;
          send('progress', { index: i, reviewId: row.id, ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate_limit')) {
            send('error', {
              reason: 'quota',
              analyzed,
              failed,
              remaining: inserted.length - i,
            });
            controller.close();
            return;
          }
          failed++;
          send('progress', {
            index: i,
            reviewId: row.id,
            ok: false,
            reason: msg.slice(0, 200),
          });
        }
      }

      send('done', { analyzed, failed, total: inserted.length });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
