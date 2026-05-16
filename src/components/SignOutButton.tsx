'use client';

import { useTransition } from 'react';
import { signOutAction } from '@/app/(auth)/login/actions';

export function SignOutButton({ label = 'تسجيل الخروج' }: { label?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
      className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-60"
    >
      {pending ? '...' : label}
    </button>
  );
}
