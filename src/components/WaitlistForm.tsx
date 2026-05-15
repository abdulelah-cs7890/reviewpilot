'use client';

import { useActionState } from 'react';
import { joinWaitlist, type WaitlistState } from '@/app/actions/waitlist';
import type { copy } from '@/lib/copy';

const initial: WaitlistState = { status: 'idle' };

export function WaitlistForm({ t }: { t: (typeof copy)['ar']['waitlist'] }) {
  const [state, formAction, pending] = useActionState(joinWaitlist, initial);

  if (state.status === 'success') {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center text-ink-700">
        <p className="text-lg font-medium">{t.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <div className="sm:col-span-2">
        <label htmlFor="email" className="sr-only">
          {t.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={t.emailPlaceholder}
          aria-invalid={state.status === 'error' && state.field === 'email'}
          className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <div>
        <label htmlFor="restaurantName" className="sr-only">
          {t.restaurantLabel}
        </label>
        <input
          id="restaurantName"
          name="restaurantName"
          type="text"
          placeholder={t.restaurantPlaceholder}
          className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <div>
        <label htmlFor="city" className="sr-only">
          {t.cityLabel}
        </label>
        <input
          id="city"
          name="city"
          type="text"
          placeholder={t.cityPlaceholder}
          className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-ink-900 px-6 py-3 font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60 sm:col-span-3"
      >
        {pending ? t.submitting : t.submit}
      </button>
      {state.status === 'error' && (
        <p className="text-sm text-red-600 sm:col-span-3">
          {state.field === 'email' ? t.errorEmail : t.errorGeneric}
        </p>
      )}
    </form>
  );
}
