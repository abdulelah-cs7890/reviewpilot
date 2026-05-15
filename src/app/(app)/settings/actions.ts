'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, restaurants, voiceProfiles } from '@/db';
import { requireUser } from '@/lib/auth-utils';

const schema = z.object({
  formality: z.enum(['warm', 'formal', 'casual']),
  useReligiousPhrases: z.coerce.boolean(),
  arabicDialect: z.enum(['gulf', 'msa', 'mixed']),
  signoff: z.string().trim().max(80).optional(),
});

export type SettingsState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'saved' };

export async function updateVoiceProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const { user } = await requireUser();

  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) {
    return { status: 'error', message: 'لم يتم العثور على مطعم. أكمل التهيئة أولاً.' };
  }

  const parsed = schema.safeParse({
    formality: formData.get('formality'),
    useReligiousPhrases: formData.get('useReligiousPhrases') === 'on',
    arabicDialect: formData.get('arabicDialect'),
    signoff: formData.get('signoff') || undefined,
  });

  if (!parsed.success) {
    return { status: 'error', message: 'تحقق من البيانات' };
  }

  await db
    .update(voiceProfiles)
    .set({
      formality: parsed.data.formality,
      useReligiousPhrases: parsed.data.useReligiousPhrases,
      arabicDialect: parsed.data.arabicDialect,
      signoff: parsed.data.signoff,
      updatedAt: new Date(),
    })
    .where(eq(voiceProfiles.restaurantId, restaurant.id));

  revalidatePath('/settings');
  return { status: 'saved' };
}
