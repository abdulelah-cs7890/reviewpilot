'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, restaurants, voiceProfiles } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { tuneVoiceProfile, type ProfileField, type ProfileSuggestion } from '@/ai/profile-tuner';
import { getOwnerEditExamples } from '@/ai/owner-edits';
import type { VoiceProfileInput } from '@/ai/drafter';

export type RequestSuggestionsResult =
  | { ok: true; suggestions: ProfileSuggestion[] }
  | { ok: false; reason: 'no-profile' | 'no-edits' | 'quota' | 'error' };

export type ApplyProfileChangeResult =
  | { ok: true }
  | { ok: false; reason: 'no-profile' | 'invalid-value' };

export async function requestProfileSuggestions(): Promise<RequestSuggestionsResult> {
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
    with: { voiceProfile: true },
  });
  if (!restaurant?.voiceProfile) {
    return { ok: false, reason: 'no-profile' };
  }

  const edits = await getOwnerEditExamples(restaurant.id);
  if (edits.length === 0) {
    return { ok: false, reason: 'no-edits' };
  }

  const profile: VoiceProfileInput = {
    formality: restaurant.voiceProfile.formality,
    useReligiousPhrases: restaurant.voiceProfile.useReligiousPhrases,
    arabicDialect: restaurant.voiceProfile.arabicDialect,
    customInstructions: restaurant.voiceProfile.customInstructions,
    signoff: restaurant.voiceProfile.signoff,
    sampleResponses: restaurant.voiceProfile.sampleResponses,
  };

  try {
    const suggestions = await tuneVoiceProfile({ currentProfile: profile, recentEdits: edits });
    return { ok: true, suggestions };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate_limit')) {
      return { ok: false, reason: 'quota' };
    }
    console.error('requestProfileSuggestions failed:', err);
    return { ok: false, reason: 'error' };
  }
}

export async function applyProfileChange(
  field: ProfileField,
  value: string
): Promise<ApplyProfileChangeResult> {
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
    with: { voiceProfile: true },
  });
  if (!restaurant?.voiceProfile) return { ok: false, reason: 'no-profile' };

  const update: Record<string, unknown> = { updatedAt: new Date() };

  if (field === 'formality') {
    if (!['warm', 'formal', 'casual'].includes(value)) return { ok: false, reason: 'invalid-value' };
    update.formality = value;
  } else if (field === 'arabicDialect') {
    if (!['gulf', 'msa', 'mixed'].includes(value)) return { ok: false, reason: 'invalid-value' };
    update.arabicDialect = value;
  } else if (field === 'useReligiousPhrases') {
    update.useReligiousPhrases = value === 'true';
  } else if (field === 'signoff') {
    update.signoff = value.slice(0, 80);
  } else if (field === 'customInstructions') {
    // Append rather than replace; keeps history of accepted suggestions.
    const current = restaurant.voiceProfile.customInstructions ?? '';
    const appended = current ? `${current}\n• ${value}` : `• ${value}`;
    // Cap total customInstructions length to keep drafter prompt bounded
    update.customInstructions = appended.slice(0, 800);
  }

  await db
    .update(voiceProfiles)
    .set(update)
    .where(eq(voiceProfiles.restaurantId, restaurant.id));

  revalidatePath('/settings');
  return { ok: true };
}
