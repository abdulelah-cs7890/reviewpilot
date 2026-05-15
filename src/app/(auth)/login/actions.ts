'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, user } from '@/db';
import { DEMO_USER_EMAIL, setDemoCookie, clearDemoCookie } from '@/lib/auth-utils';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function startDemoSession() {
  const demoUser = await db.query.user.findFirst({
    where: eq(user.email, DEMO_USER_EMAIL),
  });
  if (!demoUser) {
    throw new Error('Demo user not seeded. Run `npm run db:seed` first.');
  }
  await setDemoCookie(demoUser.id);
  redirect('/inbox');
}

export async function signOutAction() {
  await clearDemoCookie();
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore: no BetterAuth session active (e.g. demo-only flow)
  }
  redirect('/login');
}
