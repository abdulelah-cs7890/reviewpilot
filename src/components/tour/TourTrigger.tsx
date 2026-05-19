'use client';

import { HelpCircle } from 'lucide-react';

export function TourTrigger({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  function start() {
    window.dispatchEvent(new CustomEvent('reviewpilot:start-tour'));
  }
  return (
    <button
      type="button"
      onClick={start}
      aria-label={locale === 'en' ? 'Take a quick tour' : 'جولة سريعة'}
      title={locale === 'en' ? 'Take a quick tour' : 'جولة سريعة'}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
    >
      <HelpCircle className="h-4 w-4" />
    </button>
  );
}
