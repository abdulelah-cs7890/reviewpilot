'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, and } from 'drizzle-orm';
import { db, reviews, drafts, restaurants } from '@/db';
import { requireUser } from '@/lib/auth-utils';

async function ownsReview(userId: string, reviewId: string): Promise<boolean> {
  const row = await db
    .select({ id: reviews.id })
    .from(reviews)
    .innerJoin(restaurants, eq(reviews.restaurantId, restaurants.id))
    .where(and(eq(reviews.id, reviewId), eq(restaurants.userId, userId)))
    .limit(1);
  return row.length > 0;
}

export async function markAsResponded(reviewId: string) {
  const { user } = await requireUser();
  if (!(await ownsReview(user.id, reviewId))) {
    throw new Error('Not authorized');
  }
  await db.update(reviews).set({ status: 'responded' }).where(eq(reviews.id, reviewId));
  revalidatePath('/inbox');
  revalidatePath(`/inbox/${reviewId}`);
}

export async function markAsIgnored(reviewId: string) {
  const { user } = await requireUser();
  if (!(await ownsReview(user.id, reviewId))) {
    throw new Error('Not authorized');
  }
  await db.update(reviews).set({ status: 'ignored' }).where(eq(reviews.id, reviewId));
  revalidatePath('/inbox');
  redirect('/inbox');
}

export async function saveDraftEdit(draftId: string, editedText: string) {
  const { user } = await requireUser();
  // Authorization: walk draft → review → restaurant → user
  const row = await db
    .select({ id: drafts.id })
    .from(drafts)
    .innerJoin(reviews, eq(drafts.reviewId, reviews.id))
    .innerJoin(restaurants, eq(reviews.restaurantId, restaurants.id))
    .where(and(eq(drafts.id, draftId), eq(restaurants.userId, user.id)))
    .limit(1);
  if (row.length === 0) throw new Error('Not authorized');

  await db.update(drafts).set({ editedText }).where(eq(drafts.id, draftId));
  return { ok: true };
}

async function ownsDraft(userId: string, draftId: string): Promise<{ reviewId: string } | null> {
  const row = await db
    .select({ reviewId: drafts.reviewId })
    .from(drafts)
    .innerJoin(reviews, eq(drafts.reviewId, reviews.id))
    .innerJoin(restaurants, eq(reviews.restaurantId, restaurants.id))
    .where(and(eq(drafts.id, draftId), eq(restaurants.userId, userId)))
    .limit(1);
  return row[0] ?? null;
}

export async function scheduleDraftAction(draftId: string, scheduledFor: string) {
  const { user } = await requireUser();
  const owned = await ownsDraft(user.id, draftId);
  if (!owned) return { ok: false as const, message: 'Not authorized' };

  const when = new Date(scheduledFor);
  if (Number.isNaN(when.getTime())) return { ok: false as const, message: 'Invalid date' };
  if (when.getTime() <= Date.now()) {
    return { ok: false as const, message: 'Pick a future time' };
  }

  await db.update(drafts).set({ scheduledFor: when }).where(eq(drafts.id, draftId));
  revalidatePath(`/inbox/${owned.reviewId}`);
  return { ok: true as const };
}

export async function cancelScheduleAction(draftId: string) {
  const { user } = await requireUser();
  const owned = await ownsDraft(user.id, draftId);
  if (!owned) return { ok: false as const, message: 'Not authorized' };

  await db.update(drafts).set({ scheduledFor: null }).where(eq(drafts.id, draftId));
  revalidatePath(`/inbox/${owned.reviewId}`);
  return { ok: true as const };
}
