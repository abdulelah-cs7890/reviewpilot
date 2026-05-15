'use server';

import { z } from 'zod';
import { db, waitlist } from '@/db';

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  restaurantName: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
});

export type WaitlistState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; field?: 'email' | 'generic' };

export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData
): Promise<WaitlistState> {
  const parsed = waitlistSchema.safeParse({
    email: formData.get('email'),
    restaurantName: formData.get('restaurantName') || undefined,
    city: formData.get('city') || undefined,
  });

  if (!parsed.success) {
    const emailIssue = parsed.error.issues.find((i) => i.path[0] === 'email');
    return { status: 'error', field: emailIssue ? 'email' : 'generic' };
  }

  try {
    await db
      .insert(waitlist)
      .values({
        email: parsed.data.email,
        restaurantName: parsed.data.restaurantName,
        city: parsed.data.city,
      })
      .onConflictDoNothing({ target: waitlist.email });
    return { status: 'success' };
  } catch (err) {
    console.error('joinWaitlist failed:', err);
    return { status: 'error', field: 'generic' };
  }
}
