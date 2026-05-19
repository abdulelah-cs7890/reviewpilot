'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { db, user, restaurants } from '@/db';
import { getCurrentUser } from '@/lib/auth-utils';
import { auth } from '@/lib/auth';

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: 'demo' | 'not-found' | 'error' };

/**
 * Permanently deletes the current user and all their data.
 * Cascade-deletes via FK: user → restaurants → voiceProfiles + reviews → drafts.
 * Demo users are blocked.
 */
export async function deleteAccountAction(): Promise<DeleteAccountResult> {
  const result = await getCurrentUser();
  if (!result) return { ok: false, reason: 'not-found' };
  if (result.isDemo) return { ok: false, reason: 'demo' };

  try {
    // Drizzle FK cascades handle restaurants, voiceProfiles, reviews, drafts.
    // BetterAuth session + account tables also cascade off user.
    await db.delete(user).where(eq(user.id, result.user.id));

    // Clear BetterAuth session cookies
    const cookieStore = await cookies();
    cookieStore.delete('better-auth.session_token');
    cookieStore.delete('better-auth.session_data');
    cookieStore.delete('reviewpilot_demo');
    cookieStore.delete('reviewpilot_locale');

    return { ok: true };
  } catch (err) {
    console.error('deleteAccount failed:', err);
    return { ok: false, reason: 'error' };
  }
}

export type ChangeEmailResult =
  | { ok: true; newEmail: string }
  | { ok: false; reason: 'demo' | 'invalid-email' | 'already-taken' | 'error' };

const emailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email().max(254),
});

/**
 * Changes the current user's email to the given address.
 * Future magic-link sign-ins will use the new email.
 * Demo users are blocked.
 */
export async function changeEmailAction(formData: FormData): Promise<ChangeEmailResult> {
  const result = await getCurrentUser();
  if (!result) return { ok: false, reason: 'error' };
  if (result.isDemo) return { ok: false, reason: 'demo' };

  const parsed = emailSchema.safeParse({ newEmail: formData.get('newEmail') });
  if (!parsed.success) return { ok: false, reason: 'invalid-email' };
  const { newEmail } = parsed.data;
  if (newEmail === result.user.email) return { ok: true, newEmail };

  const existing = await db.query.user.findFirst({ where: eq(user.email, newEmail) });
  if (existing && existing.id !== result.user.id) {
    return { ok: false, reason: 'already-taken' };
  }

  try {
    await db
      .update(user)
      .set({ email: newEmail, updatedAt: new Date() })
      .where(eq(user.id, result.user.id));
    revalidatePath('/settings');
    return { ok: true, newEmail };
  } catch (err) {
    console.error('changeEmail failed:', err);
    return { ok: false, reason: 'error' };
  }
}

export type RenameRestaurantResult =
  | { ok: true }
  | { ok: false; reason: 'demo' | 'not-found' | 'invalid' | 'error' };

const renameSchema = z.object({
  name: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().max(120).optional(),
});

/**
 * Updates the restaurant's Arabic name + optional English name.
 * Demo users are blocked.
 */
export async function renameRestaurantAction(formData: FormData): Promise<RenameRestaurantResult> {
  const result = await getCurrentUser();
  if (!result) return { ok: false, reason: 'error' };
  if (result.isDemo) return { ok: false, reason: 'demo' };

  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, result.user.id),
  });
  if (!restaurant) return { ok: false, reason: 'not-found' };

  const parsed = renameSchema.safeParse({
    name: formData.get('name'),
    nameEn: formData.get('nameEn') || undefined,
  });
  if (!parsed.success) return { ok: false, reason: 'invalid' };

  try {
    await db
      .update(restaurants)
      .set({
        name: parsed.data.name,
        nameEn: parsed.data.nameEn,
        updatedAt: new Date(),
      })
      .where(eq(restaurants.id, restaurant.id));
    revalidatePath('/settings');
    revalidatePath('/inbox');
    return { ok: true };
  } catch (err) {
    console.error('renameRestaurant failed:', err);
    return { ok: false, reason: 'error' };
  }
}

// Avoid unused-import warning when auth isn't directly called (BetterAuth's
// session cookie names are referenced as strings above). We still keep the
// import so future signOut-on-delete code can reuse it.
void auth;
