'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from '@/lib/auth-client';

type State =
  | { status: 'idle' }
  | { status: 'sending' }
  | { status: 'sent' }
  | { status: 'error'; message: string };

export function MagicLinkForm() {
  const [state, setState] = useState<State>({ status: 'idle' });
  const [email, setEmail] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ status: 'sending' });
    const { error } = await signIn.magicLink({ email, callbackURL: '/inbox' });
    if (error) {
      setState({ status: 'error', message: error.message ?? 'حدث خطأ، حاول مرة ثانية' });
      return;
    }
    setState({ status: 'sent' });
  }

  if (state.status === 'sent') {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center text-ink-700">
        <p className="text-lg font-medium">تم إرسال رابط الدخول إلى {email}</p>
        <p className="mt-2 text-sm text-ink-500">
          (في وضع التطوير: الرابط مطبوع في سجل الخادم — راجع طرفية npm run dev)
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label htmlFor="email" className="block text-sm font-medium text-ink-700">
        البريد الإلكتروني
      </label>
      <input
        id="email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@restaurant.com"
        dir="ltr"
        className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      <button
        type="submit"
        disabled={state.status === 'sending'}
        className="w-full rounded-xl bg-ink-900 px-6 py-3 font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
      >
        {state.status === 'sending' ? 'جارٍ الإرسال...' : 'أرسل رابط الدخول'}
      </button>
      {state.status === 'error' && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
    </form>
  );
}
