'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, restaurants, reviews, drafts, voiceProfiles } from '@/db';
import { analyzeReview } from '@/ai/analyzer';
import { draftResponse, type VoiceProfileInput } from '@/ai/drafter';
import { qualityCheck } from '@/ai/quality';
import { requireUser } from '@/lib/auth-utils';
import { revalidatePath } from 'next/cache';

const schema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  authorName: z.string().trim().max(120).optional(),
  reviewText: z.string().trim().min(5).max(4000),
});

export type ManualReviewState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'quota'; message: string };

export async function createManualReview(
  _prev: ManualReviewState,
  formData: FormData
): Promise<ManualReviewState> {
  const { user, isDemo } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
    with: { voiceProfile: true },
  });
  if (!restaurant) redirect('/onboarding');

  const parsed = schema.safeParse({
    rating: formData.get('rating'),
    authorName: formData.get('authorName') || undefined,
    reviewText: formData.get('reviewText'),
  });
  if (!parsed.success) {
    return { status: 'error', message: 'تحقق من البيانات' };
  }

  // Insert review (pending analysis)
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

  // Analyze + draft (the slow part — 6–10s on Gemini Flash with backoff)
  try {
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
        severity: analysis.severity,
        status: 'drafted',
      })
      .where(eq(reviews.id, review.id));

    const voiceProfile = restaurant.voiceProfile
      ? (restaurant.voiceProfile as unknown as VoiceProfileInput)
      : ({
          formality: 'warm',
          useReligiousPhrases: true,
          arabicDialect: 'gulf',
          signoff: null,
          customInstructions: null,
          sampleResponses: null,
        } satisfies VoiceProfileInput);

    const draft = await draftResponse({
      reviewText: parsed.data.reviewText,
      rating: parsed.data.rating,
      authorName: parsed.data.authorName,
      analysis,
      voiceProfile,
      restaurantName: restaurant.name,
    });

    // Best-effort meta-grade. If this fails (429 / parse error), the draft
    // still saves with null qualityCheck and the UI hides the card.
    let qc: Awaited<ReturnType<typeof qualityCheck>> | null = null;
    try {
      qc = await qualityCheck({
        reviewText: parsed.data.reviewText,
        rating: parsed.data.rating,
        analysis,
        draftText: draft.draftText,
      });
    } catch (qcErr) {
      console.warn('qualityCheck skipped:', qcErr instanceof Error ? qcErr.message : qcErr);
    }

    await db.insert(drafts).values({
      reviewId: review.id,
      draftText: draft.draftText,
      language: draft.language,
      model: draft.model,
      promptVersion: draft.promptVersion,
      qualityCheck: qc,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Quota or transient error — leave the review in 'pending' and surface a friendly message
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return {
        status: 'quota',
        message:
          isDemo
            ? 'الحصة اليومية المجانية انتهت لليوم. جرّب التقييمات المحمّلة مسبقاً في الصندوق، أو ارجع غداً.'
            : 'الحصة اليومية المجانية لـ Gemini انتهت. جرّب غداً أو أضف وسيلة دفع لرفع الحد.',
      };
    }
    console.error('createManualReview AI step failed:', err);
    return {
      status: 'error',
      message: 'حدث خطأ في إنشاء المسودة. التقييم محفوظ، حاول إعادة المعالجة لاحقاً.',
    };
  }

  revalidatePath('/inbox');
  redirect(`/inbox/${review.id}`);
}
