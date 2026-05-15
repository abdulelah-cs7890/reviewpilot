/**
 * Server-side helpers for resolving the current user.
 *
 * Two auth paths are supported:
 * 1. BetterAuth session (real magic-link sign-in) — the primary path
 * 2. demo_session cookie (portfolio demo) — instant access to a pre-seeded
 *    demo restaurant without burning Gemini quota on the analyzer/drafter
 *
 * The demo path is intentionally simple: a signed cookie containing the demo
 * user ID, validated with an HMAC tied to BETTER_AUTH_SECRET so a visitor can
 * not forge a session as some other user.
 *
 * THIS WOULD NOT SHIP IN A REAL APP. It exists so portfolio reviewers can try
 * the app end-to-end without setting up email.
 */

import { cookies, headers } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db, user } from '@/db';
import { auth } from './auth';

export const DEMO_USER_EMAIL = 'demo@reviewpilot.example';
const DEMO_COOKIE_NAME = 'reviewpilot_demo';
const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(value: string): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('BETTER_AUTH_SECRET not set');
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function verifyDemoCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  const [userId, sig] = raw.split('.');
  if (!userId || !sig) return null;
  const expected = sign(userId);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    return timingSafeEqual(a, b) ? userId : null;
  } catch {
    return null;
  }
}

export async function setDemoCookie(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE_NAME, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: DEMO_COOKIE_MAX_AGE,
  });
}

export async function clearDemoCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE_NAME);
}

/**
 * Returns the current user row (from either BetterAuth session or demo cookie),
 * plus an `isDemo` flag so UI can show a small banner if desired.
 */
export async function getCurrentUser() {
  // BetterAuth path (real auth)
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    const row = await db.query.user.findFirst({ where: eq(user.id, session.user.id) });
    if (row) return { user: row, isDemo: false as const };
  }

  // Demo cookie path
  const cookieStore = await cookies();
  const demoUserId = verifyDemoCookie(cookieStore.get(DEMO_COOKIE_NAME)?.value);
  if (demoUserId) {
    const row = await db.query.user.findFirst({ where: eq(user.id, demoUserId) });
    if (row) return { user: row, isDemo: true as const };
  }

  return null;
}

export async function requireUser() {
  const result = await getCurrentUser();
  if (!result) {
    const { redirect } = await import('next/navigation');
    redirect('/login');
  }
  return result;
}
