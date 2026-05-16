'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, desc } from 'drizzle-orm';
import { db, restaurants, reviews, drafts, voiceProfiles } from '@/db';
import { improveDraft } from '@/ai/improve';
import { qualityCheck } from '@/ai/quality';
import type { ReviewAnalysis } from '@/ai/analyzer';
import type { VoiceProfileInput } from '@/ai/drafter';
import { requireUser } from '@/lib/auth-utils';

export type ImproveResult =
  | { ok: true; draftId: string }
  | { ok: false; reason: 'quota' | 'error' | 'empty'; message: string };

export async function improveDraftAction(
  reviewId: string,
  instruction: string
): Promise<ImproveResult> {
  const trimmed = instruction.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: 'empty', message: 'اكتب تعليمة أولاً' };
  }
  if (trimmed.length > 400) {
    return { ok: false, reason: 'error', message: 'التعليمة طويلة جداً (الحد ٤٠٠ حرف)' };
  }

  const { user } = await requireUser();

  // Auth-check: review must belong to user's restaurant
  const rows = await db
    .select({ review: reviews, restaurant: restaurants })
    .from(reviews)
    .innerJoin(restaurants, eq(reviews.restaurantId, restaurants.id))
    .where(and(eq(reviews.id, reviewId), eq(restaurants.userId, user.id)))
    .limit(1);
  if (rows.length === 0) {
    return { ok: false, reason: 'error', message: 'لم يتم العثور على التقييم' };
  }
  const { review: r, restaurant } = rows[0];

  // Latest draft is what gets improved
  const latest = await db.query.drafts.findFirst({
    where: eq(drafts.reviewId, r.id),
    orderBy: [desc(drafts.generatedAt)],
  });
  if (!latest) {
    return { ok: false, reason: 'error', message: 'لا توجد مسودة لتحسينها' };
  }

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

  const analysis: ReviewAnalysis = {
    language: r.language ?? 'ar',
    sentiment: (r.sentiment ?? 0) as ReviewAnalysis['sentiment'],
    topics: r.topics ?? [],
    urgency: r.urgency ?? 'low',
    mentions: {},
    ownerSummary: '',
  };

  try {
    const improved = await improveDraft({
      originalDraftText: latest.editedText ?? latest.draftText,
      instruction: trimmed,
      reviewText: r.reviewText,
      rating: r.rating,
      analysis,
      voiceProfile,
      restaurantName: restaurant.name,
    });

    // Best-effort quality check on the improved draft
    let qc: Awaited<ReturnType<typeof qualityCheck>> | null = null;
    try {
      qc = await qualityCheck({
        reviewText: r.reviewText,
        rating: r.rating,
        analysis,
        draftText: improved.draftText,
      });
    } catch (qcErr) {
      console.warn(
        'qualityCheck skipped (improve):',
        qcErr instanceof Error ? qcErr.message : qcErr
      );
    }

    const [inserted] = await db
      .insert(drafts)
      .values({
        reviewId: r.id,
        draftText: improved.draftText,
        language: improved.language,
        model: improved.model,
        promptVersion: improved.promptVersion,
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
    console.error('improveDraftAction failed:', err);
    return { ok: false, reason: 'error', message: 'تعذّر تطبيق التعليمة. حاول لاحقاً.' };
  }
}
