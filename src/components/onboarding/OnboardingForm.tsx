'use client';

import { useActionState } from 'react';
import { completeOnboarding, type OnboardingState } from '@/app/(app)/onboarding/actions';

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

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-ink-900">نغمة الردود</h2>

        <div>
          <span className="mb-2 block text-sm text-ink-700">طبيعة الردود</span>
          <div className="flex gap-2">
            {(['warm', 'formal', 'casual'] as const).map((v) => (
              <label key={v} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-accent-dark">
                <input type="radio" name="formality" value={v} defaultChecked={v === 'warm'} className="sr-only" />
                {v === 'warm' ? 'ودودة' : v === 'formal' ? 'رسمية' : 'عفوية'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-2 block text-sm text-ink-700">اللهجة العربية المفضلة</span>
          <div className="flex gap-2">
            {(['gulf', 'msa', 'mixed'] as const).map((v) => (
              <label key={v} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-accent-dark">
                <input type="radio" name="arabicDialect" value={v} defaultChecked={v === 'gulf'} className="sr-only" />
                {v === 'gulf' ? 'خليجية' : v === 'msa' ? 'فصحى' : 'مختلطة'}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" name="useReligiousPhrases" defaultChecked className="h-4 w-4 rounded border-ink-300" />
          استخدام عبارات دينية (الله يعطيك العافية، إن شاء الله...)
        </label>

        <div>
          <label htmlFor="signoff" className="mb-1 block text-sm text-ink-700">
            توقيع الردود (اختياري)
          </label>
          <input
            id="signoff"
            name="signoff"
            type="text"
            defaultValue="إدارة المطعم"
            className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
      </section>

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
