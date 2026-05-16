/**
 * Learn-from-edits: pulls the owner's recent corrections to AI drafts and
 * formats them as additional few-shot examples for the next drafter call.
 *
 * Each entry is a (review, ai_original, owner_edit) triple. The drafter sees
 * these as a "style guide" and shifts its output toward the owner's
 * preferences (shorter, more personal, removes AI clichés the owner doesn't
 * like, etc.) without retraining or fine-tuning.
 *
 * Capped at 5 examples and ~150 tokens each — keeps prompt overhead bounded.
 */

import { eq, isNotNull, ne, and, desc, sql } from 'drizzle-orm';
import { db, reviews, drafts } from '@/db';

export interface OwnerEditExample {
  reviewText: string;
  rating: number;
  originalDraft: string;
  ownerEdit: string;
}

const MAX_EDITS_FOR_PROMPT = 5;
const MAX_REVIEW_CHARS = 240;
const MAX_DRAFT_CHARS = 320;

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + '…';
}

/**
 * Fetch the most recent drafts where the owner edited the AI's output.
 * Joined to reviews to get the original review text + rating.
 */
export async function getOwnerEditExamples(
  restaurantId: string,
  limit = MAX_EDITS_FOR_PROMPT
): Promise<OwnerEditExample[]> {
  const rows = await db
    .select({
      reviewText: reviews.reviewText,
      rating: reviews.rating,
      originalDraft: drafts.draftText,
      ownerEdit: drafts.editedText,
    })
    .from(drafts)
    .innerJoin(reviews, eq(drafts.reviewId, reviews.id))
    .where(
      and(
        eq(reviews.restaurantId, restaurantId),
        isNotNull(drafts.editedText),
        // Drizzle doesn't let us reference editedText as non-null in `ne`
        // directly; using raw SQL for the !== draftText guard.
        sql`${drafts.editedText} <> ${drafts.draftText}`
      )
    )
    .orderBy(desc(drafts.generatedAt))
    .limit(limit);

  return rows
    .filter((r): r is { reviewText: string; rating: number; originalDraft: string; ownerEdit: string } =>
      r.ownerEdit !== null
    )
    .map((r) => ({
      reviewText: truncate(r.reviewText, MAX_REVIEW_CHARS),
      rating: r.rating,
      originalDraft: truncate(r.originalDraft, MAX_DRAFT_CHARS),
      ownerEdit: truncate(r.ownerEdit, MAX_DRAFT_CHARS),
    }));
}

/**
 * Count how many learn-from-edits examples exist for a restaurant — used
 * to render the "Learning from N past edits" indicator in the UI without
 * having to fetch the full content.
 */
export async function countOwnerEdits(restaurantId: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(drafts)
    .innerJoin(reviews, eq(drafts.reviewId, reviews.id))
    .where(
      and(
        eq(reviews.restaurantId, restaurantId),
        isNotNull(drafts.editedText),
        sql`${drafts.editedText} <> ${drafts.draftText}`
      )
    );
  return result[0]?.count ?? 0;
}

/**
 * Render the edits as a markdown block to append to the drafter system prompt.
 * Empty string if no edits — caller can concatenate unconditionally.
 */
export function formatEditsForPrompt(examples: OwnerEditExample[]): string {
  if (examples.length === 0) return '';

  const blocks = examples
    .map(
      (ex, i) => `— Example ${i + 1} —
Review (${ex.rating}★): "${ex.reviewText}"
Your original draft: "${ex.originalDraft}"
Owner's edit: "${ex.ownerEdit}"`
    )
    .join('\n\n');

  return `

## Style guide from owner edits

The owner has revised drafts you wrote in the past. Adopt their style preferences — they know their voice better than your priors. Notice what they keep, remove, shorten, or rephrase, and apply those patterns to the new response below.

${blocks}

When generating the response, prefer the owner's edit patterns over your defaults.`;
}
