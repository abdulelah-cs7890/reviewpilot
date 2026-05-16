'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { db, restaurants, reviews, drafts, voiceProfiles } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { generatePolicies, type ReplyPolicy, type PolicyExample } from '@/ai/policy-generator';

export type GeneratePoliciesResult =
  | { ok: true; policies: ReplyPolicy[] }
  | { ok: false; reason: 'insufficient-data' | 'quota' | 'error'; message: string };

const MAX_EXAMPLES = 20;

export async function generateRestaurantPolicies(): Promise<GeneratePoliciesResult> {
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) return { ok: false, reason: 'error', message: 'No restaurant' };

  // Pull the latest N reviews + their latest draft (preferring editedText)
  const recentReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.restaurantId, restaurant.id))
    .orderBy(desc(reviews.postedAt))
    .limit(MAX_EXAMPLES);

  const examples: PolicyExample[] = [];
  for (const r of recentReviews) {
    const draft = await db.query.drafts.findFirst({
      where: eq(drafts.reviewId, r.id),
      orderBy: [desc(drafts.generatedAt)],
    });
    if (!draft) continue;
    examples.push({
      reviewText: r.reviewText,
      rating: r.rating,
      language: r.language ?? 'ar',
      finalDraftText: draft.editedText ?? draft.draftText,
    });
  }

  if (examples.length < 2) {
    return {
      ok: false,
      reason: 'insufficient-data',
      message: 'Need at least 2 reviews with drafts to generate policies.',
    };
  }

  try {
    const policies = await generatePolicies({ examples });
    return { ok: true, policies };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return { ok: false, reason: 'quota', message: 'Daily Gemini quota exhausted. Try tomorrow.' };
    }
    console.error('generateRestaurantPolicies failed:', err);
    return { ok: false, reason: 'error', message: 'Could not generate policies.' };
  }
}

/**
 * Append a single policy's actions to the voice profile's customInstructions.
 * Capped to keep the drafter prompt size bounded.
 */
export async function savePolicyToProfile(policy: ReplyPolicy): Promise<{ ok: boolean; message?: string }> {
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
    with: { voiceProfile: true },
  });
  if (!restaurant?.voiceProfile) return { ok: false, message: 'No voice profile' };

  const block = `When ${policy.conditions.trim().replace(/\.$/, '')}: ${policy.actions
    .map((a) => a.trim().replace(/\.$/, ''))
    .join('; ')}.`;
  const current = restaurant.voiceProfile.customInstructions ?? '';
  if (current.includes(block.slice(0, 40))) {
    // Avoid dupes
    return { ok: true };
  }
  const next = current ? `${current}\n• ${block}` : `• ${block}`;
  const capped = next.slice(0, 1200);

  await db
    .update(voiceProfiles)
    .set({ customInstructions: capped, updatedAt: new Date() })
    .where(eq(voiceProfiles.restaurantId, restaurant.id));

  revalidatePath('/settings');
  revalidatePath('/insights');
  return { ok: true };
}
