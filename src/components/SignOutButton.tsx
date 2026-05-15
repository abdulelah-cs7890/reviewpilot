'use client';

import { useTransition } from 'react';
import { signOutAction } from '@/app/(auth)/login/actions';

export function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => signOutAction())}
      className="text-sm text-ink-600 hover:text-ink-900 disabled:opacity-60"
    >
      {pending ? '...' : 'تسجيل الخروج'}
    </button>
  );
}
