'use client';

import { useActionState } from 'react';
import { completeOnboarding, type OnboardingState } from '@/app/(app)/onboarding/actions';
import { VoiceProfileFields } from '@/components/voice-profile/VoiceProfileFields';

const initial: OnboardingState = { status: 'idle' };

export function OnboardingForm() {
  const [state, action, pending] = useActionState(completeOnboarding, initial);

  return (
    <form action={action} className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink-900">معلومات المطعم</h2>
        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-ink-700">
            اسم المطعم *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="مطعم..."
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div>
          <label htmlFor="nameEn" className="mb-1 block text-sm text-ink-700">
            الاسم بالإنجليزية (اختياري)
          </label>
          <input
            id="nameEn"
            name="nameEn"
            type="text"
            placeholder="Restaurant..."
            dir="ltr"
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
      </section>

      <VoiceProfileFields />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-ink-900 px-6 py-3 font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? 'جارٍ الحفظ...' : 'متابعة إلى صندوق الوارد ←'}
      </button>

      {state.status === 'error' && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}
    </form>
  );
}
