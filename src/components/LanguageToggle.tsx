'use client';

import { useTransition } from 'react';
import { Languages } from 'lucide-react';
import { switchLocale } from '@/app/actions/locale';
import type { UiLocale } from '@/lib/locale';

/**
 * Small button that flips the UI locale and refreshes the tree.
 * Renders as "EN" when current locale is Arabic (clicking switches to English),
 * and as "العربية" when current locale is English.
 */
export function LanguageToggle({ locale }: { locale: UiLocale }) {
  const [pending, startTransition] = useTransition();
  const next: UiLocale = locale === 'ar' ? 'en' : 'ar';
  const label = next === 'en' ? 'EN' : 'العربية';

  return (
    <button
      type="button"
      onClick={() => startTransition(() => switchLocale(next))}
      disabled={pending}
      title={next === 'en' ? 'Switch to English' : 'التبديل إلى العربية'}
      className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2 py-1 text-xs text-ink-700 hover:bg-ink-100 disabled:opacity-50"
    >
      <Languages className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
