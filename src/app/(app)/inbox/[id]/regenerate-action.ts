'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { db, restaurants, reviews, drafts, voiceProfiles } from '@/db';
import { draftResponse, type VoiceProfileInput } from '@/ai/drafter';
import { qualityCheck } from '@/ai/quality';
import type { ReviewAnalysis } from '@/ai/analyzer';
import { requireUser } from '@/lib/auth-utils';

export type RegenerateResult =
  | { ok: true; draftId: string }
  | { ok: false; reason: 'quota' | 'error'; message: string };

export async function regenerateDraft(reviewId: string): Promise<RegenerateResult> {
  const { user } = await requireUser();

  // Walk: review → restaurant → must belong to user
  const review = await db
    .select({
      review: reviews,
      restaurant: restaurants,
    })
    .from(reviews)
    .innerJoin(restaurants, eq(reviews.restaurantId, restaurants.id))
    .where(and(eq(reviews.id, reviewId), eq(restaurants.userId, user.id)))
    .limit(1);

  if (review.length === 0) {
    return { ok: false, reason: 'error', message: 'لم يتم العثور على التقييم' };
  }

  const { review: r, restaurant } = review[0];

  const profile = await db.query.voiceProfiles.findFirst({
    where: eq(voiceProfiles.restaurantId, restaurant.id),
  });

  const voiceProfile: VoiceProfileInput = profile
    ? {
        formality: profile.formality,
        useReligiousPhrases: profile.useReligiousPhrases,
        arabicDialect: profile.arabicDialect,
        customInstructions: profile.customInstructions,
        signoff: profile.signoff,
        sampleResponses: profile.sampleResponses,
      }
    : {
        formality: 'warm',
        useReligiousPhrases: true,
        arabicDialect: 'gulf',
        signoff: null,
        customInstructions: null,
        sampleResponses: null,
      };

  // Reconstruct the analysis from the saved review row. We don't have
  // dialect/mentions/ownerSummary persisted, but the drafter prompt works
  // fine without them; the review text is the primary signal.
  const analysis: ReviewAnalysis = {
    language: r.language ?? 'ar',
    sentiment: (r.sentiment ?? 0) as ReviewAnalysis['sentiment'],
    topics: r.topics ?? [],
    urgency: r.urgency ?? 'low',
    mentions: {},
    ownerSummary: '',
  };

  try {
    const result = await draftResponse({
      reviewText: r.reviewText,
      rating: r.rating,
      authorName: r.authorName ?? undefined,
      analysis,
      voiceProfile,
      restaurantName: restaurant.name,
      temperature: 0.9, // higher than default (0.7) — encourage a meaningfully different draft
    });

    // Best-effort meta-grade. Failure here doesn't block the regenerate.
    let qc: Awaited<ReturnType<typeof qualityCheck>> | null = null;
    try {
      qc = await qualityCheck({
        reviewText: r.reviewText,
        rating: r.rating,
        analysis,
        draftText: result.draftText,
      });
    } catch (qcErr) {
      console.warn('qualityCheck skipped (regenerate):', qcErr instanceof Error ? qcErr.message : qcErr);
    }

    const [inserted] = await db
      .insert(drafts)
      .values({
        reviewId: r.id,
        draftText: result.draftText,
        language: result.language,
        model: result.model,
        promptVersion: result.promptVersion + '-regen',
        qualityCheck: qc,
      })
      .returning();

    revalidatePath(`/inbox/${reviewId}`);
    return { ok: true, draftId: inserted.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return {
        ok: false,
        reason: 'quota',
        message: 'الحصة اليومية لـ Gemini انتهت. جرّب غداً.',
      };
    }
    console.error('regenerateDraft failed:', err);
    return { ok: false, reason: 'error', message: 'تعذّر إنشاء صياغة جديدة. حاول لاحقاً.' };
  }
}
