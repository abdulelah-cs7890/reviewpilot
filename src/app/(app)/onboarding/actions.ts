'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db, restaurants, voiceProfiles } from '@/db';
import { requireUser } from '@/lib/auth-utils';

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().max(120).optional(),
  formality: z.enum(['warm', 'formal', 'casual']),
  useReligiousPhrases: z.coerce.boolean(),
  arabicDialect: z.enum(['gulf', 'msa', 'mixed']),
  signoff: z.string().trim().max(80).optional(),
});

export type OnboardingState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success' };

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const { user } = await requireUser();

  const parsed = schema.safeParse({
    name: formData.get('name'),
    nameEn: formData.get('nameEn') || undefined,
    formality: formData.get('formality'),
    useReligiousPhrases: formData.get('useReligiousPhrases') === 'on',
    arabicDialect: formData.get('arabicDialect'),
    signoff: formData.get('signoff') || undefined,
  });

  if (!parsed.success) {
    return { status: 'error', message: 'تحقق من البيانات' };
  }

  const [restaurant] = await db
    .insert(restaurants)
    .values({
      userId: user.id,
      name: parsed.data.name,
      nameEn: parsed.data.nameEn,
      defaultLanguage: 'ar',
      timezone: 'Asia/Riyadh',
    })
    .returning();

  await db.insert(voiceProfiles).values({
    restaurantId: restaurant.id,
    formality: parsed.data.formality,
    useReligiousPhrases: parsed.data.useReligiousPhrases,
    arabicDialect: parsed.data.arabicDialect,
    signoff: parsed.data.signoff,
  });

  redirect('/inbox');
}
