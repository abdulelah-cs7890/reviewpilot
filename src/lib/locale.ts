/**
 * UI locale resolution. Distinct from review/draft language (those are
 * per-review, intrinsic to the content). UI locale only controls the
 * app chrome — nav, page headings, button labels, etc.
 *
 * Persisted in a cookie (`reviewpilot_locale`) so the choice survives
 * across sessions. Defaults to 'ar' (Saudi audience).
 */

import { cookies } from 'next/headers';

export type UiLocale = 'ar' | 'en';

const COOKIE_NAME = 'reviewpilot_locale';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function getUiLocale(): Promise<UiLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return value === 'en' ? 'en' : 'ar';
}

export async function setUiLocale(locale: UiLocale) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale, {
    httpOnly: false, // readable by client too, for future client-side use
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

/** Direction for the html/body wrapper. */
export function dirFor(locale: UiLocale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
