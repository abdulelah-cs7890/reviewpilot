'use client';

import { useTransition } from 'react';
import { startDemoSession } from '@/app/(auth)/login/actions';

export function DemoButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => startDemoSession())}
      className="w-full rounded-xl border border-ink-200 bg-white px-6 py-3 font-medium text-ink-700 transition hover:bg-ink-100 disabled:opacity-60"
    >
      {pending ? 'جارٍ الفتح...' : 'جرّب العرض التجريبي ←'}
    </button>
  );
}
