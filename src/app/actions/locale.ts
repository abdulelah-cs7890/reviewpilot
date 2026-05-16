'use server';

import { revalidatePath } from 'next/cache';
import { setUiLocale, type UiLocale } from '@/lib/locale';

export async function switchLocale(locale: UiLocale) {
  await setUiLocale(locale);
  // Revalidate the whole tree so server components re-render with new locale
  revalidatePath('/', 'layout');
}
