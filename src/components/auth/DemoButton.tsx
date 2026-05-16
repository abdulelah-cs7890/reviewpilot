'use client';

import { useTransition } from 'react';
import { startDemoSession } from '@/app/(auth)/login/actions';

export function DemoButton({
  variant = 'default',
  label,
}: {
  variant?: 'default' | 'hero';
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const defaultLabel = 'جرّب العرض التجريبي ←';
  const finalLabel = label ?? defaultLabel;

  const styles =
    variant === 'hero'
      ? 'w-full rounded-xl bg-ink-900 px-7 py-4 text-lg font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60'
      : 'w-full rounded-xl border border-ink-200 bg-white px-6 py-3 font-medium text-ink-700 transition hover:bg-ink-100 disabled:opacity-60';

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => startDemoSession())}
      className={styles}
    >
      {pending ? 'جارٍ الفتح...' : finalLabel}
    </button>
  );
}
