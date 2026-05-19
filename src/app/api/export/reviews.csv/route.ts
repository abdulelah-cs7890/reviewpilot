/**
 * CSV export of the current user's reviews + their latest draft.
 *
 * Streams a UTF-8 CSV (with BOM so Excel reads Arabic correctly). One row
 * per review. Includes the analyzer fields + the latest draft text +
 * quality score.
 */

import { type NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { db, restaurants, reviews, drafts } from '@/db';
import { requireUser } from '@/lib/auth-utils';

export const runtime = 'nodejs';

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(cells: unknown[]): string {
  return cells.map(csvEscape).join(',');
}

export async function GET(_req: NextRequest) {
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) {
    return new Response('No restaurant for this user', { status: 400 });
  }

  // Pull all reviews + their latest draft (left join, keep nulls)
  const rows = await db
    .select({
      reviewId: reviews.id,
      externalId: reviews.externalId,
      source: reviews.source,
      authorName: reviews.authorName,
      rating: reviews.rating,
      reviewText: reviews.reviewText,
      language: reviews.language,
      postedAt: reviews.postedAt,
      sentiment: reviews.sentiment,
      topics: reviews.topics,
      urgency: reviews.urgency,
      severity: reviews.severity,
      status: reviews.status,
    })
    .from(reviews)
    .where(eq(reviews.restaurantId, restaurant.id))
    .orderBy(desc(reviews.postedAt));

  // For each review, pull the latest draft. Done sequentially to keep
  // memory bounded; N is small (single restaurant).
  const enriched = await Promise.all(
    rows.map(async (r) => {
      const draft = await db.query.drafts.findFirst({
        where: eq(drafts.reviewId, r.reviewId),
        orderBy: [desc(drafts.generatedAt)],
      });
      return {
        ...r,
        draftText: draft ? draft.editedText ?? draft.draftText : null,
        draftLanguage: draft?.language ?? null,
        qualityScore: draft?.qualityCheck?.overallScore ?? null,
      };
    })
  );

  const header = row([
    'review_id',
    'external_id',
    'source',
    'author',
    'rating',
    'review_text',
    'review_language',
    'posted_at',
    'sentiment',
    'topics',
    'urgency',
    'severity',
    'status',
    'draft_text',
    'draft_language',
    'quality_score',
  ]);

  const lines = [
    header,
    ...enriched.map((r) =>
      row([
        r.reviewId,
        r.externalId,
        r.source,
        r.authorName,
        r.rating,
        r.reviewText,
        r.language,
        r.postedAt instanceof Date ? r.postedAt.toISOString() : r.postedAt,
        r.sentiment,
        Array.isArray(r.topics) ? r.topics.join('|') : '',
        r.urgency,
        r.severity,
        r.status,
        r.draftText,
        r.draftLanguage,
        r.qualityScore,
      ])
    ),
  ];

  // Prepend UTF-8 BOM so Excel decodes Arabic correctly on Windows
  const body = '﻿' + lines.join('\r\n');
  const today = new Date().toISOString().slice(0, 10);
  const filename = `reviewpilot-${restaurant.name.replace(/[^\w-]+/g, '_').slice(0, 40) || 'export'}-${today}.csv`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
