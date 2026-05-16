/**
 * Cron job: promote scheduled drafts to "responded" when their time has come.
 *
 * Vercel cron hits this hourly with `Authorization: Bearer ${CRON_SECRET}`.
 * The handler finds drafts where `scheduledFor <= NOW()` and `sentAt IS NULL`,
 * sets `sentAt = NOW()` on each, and flips the parent review's status to
 * 'responded'.
 *
 * NOTE: in a real product this would also POST the draft text to Google
 * Business Profile. Here it's a status-only flip (documented in README).
 */

import { NextResponse, type NextRequest } from 'next/server';
import { and, eq, lte, isNull, isNotNull } from 'drizzle-orm';
import { db, drafts, reviews } from '@/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Auth: Vercel cron sets `Authorization: Bearer <CRON_SECRET>` automatically
  // when CRON_SECRET is configured on the project.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const header = req.headers.get('authorization');
  if (header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Find drafts where scheduled time has passed and not yet sent.
  const due = await db
    .select({ draftId: drafts.id, reviewId: drafts.reviewId })
    .from(drafts)
    .where(
      and(
        isNotNull(drafts.scheduledFor),
        lte(drafts.scheduledFor, now),
        isNull(drafts.sentAt)
      )
    );

  if (due.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // For each: mark draft sent, flip parent review status to 'responded'.
  for (const row of due) {
    await db
      .update(drafts)
      .set({ sentAt: now, finalText: null })
      .where(eq(drafts.id, row.draftId));
    await db
      .update(reviews)
      .set({ status: 'responded' })
      .where(eq(reviews.id, row.reviewId));
  }

  return NextResponse.json({ ok: true, processed: due.length, at: now.toISOString() });
}
