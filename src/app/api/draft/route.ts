/**
 * Streaming draft generation endpoint.
 *
 * Accepts a review (text + rating + optional author), runs the analyzer
 * synchronously, then streams the drafter's response chunk-by-chunk over
 * SSE. After the stream completes, runs the quality check and persists
 * everything. The client uses fetch + ReadableStream to render the
 * draft text as it types itself.
 *
 * Event types:
 *   - 'analysis' — analyzer output, sent before draft streaming starts
 *   - 'chunk'    — incremental draft text deltas
 *   - 'draft'    — final saved draft with DB id
 *   - 'quality'  — meta-grading result (sent after draft saved)
 *   - 'done'     — terminal event with the review id (client navigates)
 *   - 'error'    — quota / generic failure (terminal)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, restaurants, reviews, drafts } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { analyzeReview } from '@/ai/analyzer';
import {
  buildDrafterUserPrompt,
  DRAFTER_SYSTEM_PROMPT_TEXT,
  type VoiceProfileInput,
} from '@/ai/drafter';
import { qualityCheck } from '@/ai/quality';
import { ai, MODELS, PROMPT_VERSIONS } from '@/ai/client';

export const runtime = 'nodejs';
export const maxDuration = 60; // streaming + 3 AI calls can take 30s+; default 10s won't fit

const bodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  authorName: z.string().trim().max(120).optional(),
  reviewText: z.string().trim().min(5).max(4000),
});

export async function POST(req: NextRequest) {
  // Auth gate
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
    with: { voiceProfile: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: 'no restaurant' }, { status: 400 });
  }

  // Validate body
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 });
  }

  // Persist the review row up front so the URL we redirect to exists
  const [review] = await db
    .insert(reviews)
    .values({
      restaurantId: restaurant.id,
      source: 'manual',
      authorName: parsed.data.authorName,
      rating: parsed.data.rating,
      reviewText: parsed.data.reviewText,
      postedAt: new Date(),
      status: 'pending',
    })
    .returning();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      function fail(reason: 'quota' | 'error', message: string) {
        send('error', { reason, message });
        controller.close();
      }

      try {
        // 1) Analysis (blocking — we need the language/topics before streaming)
        const analysis = await analyzeReview({
          reviewText: parsed.data.reviewText,
          rating: parsed.data.rating,
          authorName: parsed.data.authorName,
        });

        await db
          .update(reviews)
          .set({
            language: analysis.language,
            sentiment: analysis.sentiment,
            topics: analysis.topics,
            urgency: analysis.urgency,
            status: 'drafted',
          })
          .where(eq(reviews.id, review.id));

        send('analysis', analysis);

        // 2) Streamed drafter call
        const voiceProfile: VoiceProfileInput = restaurant.voiceProfile
          ? (restaurant.voiceProfile as unknown as VoiceProfileInput)
          : {
              formality: 'warm',
              useReligiousPhrases: true,
              arabicDialect: 'gulf',
              signoff: null,
              customInstructions: null,
              sampleResponses: null,
            };

        const userPrompt = buildDrafterUserPrompt({
          reviewText: parsed.data.reviewText,
          rating: parsed.data.rating,
          authorName: parsed.data.authorName,
          analysis,
          voiceProfile,
          restaurantName: restaurant.name,
        });

        let fullText = '';
        try {
          const streamResp = await ai.models.generateContentStream({
            model: MODELS.smart,
            contents: userPrompt,
            config: {
              systemInstruction: DRAFTER_SYSTEM_PROMPT_TEXT,
              maxOutputTokens: 2048,
              temperature: 0.7,
            },
          });

          for await (const chunk of streamResp) {
            const text = chunk.text;
            if (text) {
              fullText += text;
              send('chunk', { text });
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
            return fail(
              'quota',
              'الحصة اليومية لـ Gemini انتهت. جرّب غداً.'
            );
          }
          throw err;
        }

        // Trim a trailing newline / whitespace + any stray quotes the model might add
        const draftText = fullText.trim().replace(/^["']|["']$/g, '');

        // 3) Persist the draft
        const [insertedDraft] = await db
          .insert(drafts)
          .values({
            reviewId: review.id,
            draftText,
            language: analysis.language,
            model: MODELS.smart,
            promptVersion: `${PROMPT_VERSIONS.draft}-stream`,
          })
          .returning();

        send('draft', {
          id: insertedDraft.id,
          draftText,
          language: analysis.language,
        });

        // 4) Quality check (best-effort)
        try {
          const qc = await qualityCheck({
            reviewText: parsed.data.reviewText,
            rating: parsed.data.rating,
            analysis,
            draftText,
          });
          await db
            .update(drafts)
            .set({ qualityCheck: qc })
            .where(eq(drafts.id, insertedDraft.id));
          send('quality', qc);
        } catch (qcErr) {
          console.warn(
            'qualityCheck skipped (stream):',
            qcErr instanceof Error ? qcErr.message : qcErr
          );
        }

        send('done', { reviewId: review.id });
        controller.close();
      } catch (err) {
        console.error('draft stream failed:', err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
          fail('quota', 'الحصة اليومية لـ Gemini انتهت. جرّب غداً.');
        } else {
          fail('error', 'تعذّر إنشاء المسودة. حاول لاحقاً.');
        }
      }
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
