'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createManualReview, type ManualReviewState } from '@/app/(app)/inbox/new/actions';

const initial: ManualReviewState = { status: 'idle' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-ink-900 px-6 py-3 font-medium text-ink-50 transition hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? 'جارٍ التحليل وإنشاء المسودة... (٦–١٠ ثوانٍ)' : 'حلّل وأنشئ مسودة'}
    </button>
  );
}

export function ManualReviewForm() {
  const [state, action] = useActionState(createManualReview, initial);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm text-ink-700">التقييم *</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white py-3 text-lg has-[:checked]:border-accent has-[:checked]:bg-accent/5 has-[:checked]:text-accent-dark"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                defaultChecked={n === 5}
                className="sr-only"
              />
              {'★'.repeat(n)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="authorName" className="mb-1 block text-sm text-ink-700">
          اسم العميل (اختياري)
        </label>
        <input
          id="authorName"
          name="authorName"
          type="text"
          placeholder="مثلاً: فهد"
          className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <div>
        <label htmlFor="reviewText" className="mb-1 block text-sm text-ink-700">
          نص التقييم *
        </label>
        <textarea
          id="reviewText"
          name="reviewText"
          required
          rows={6}
          placeholder="انسخ نص التقييم هنا..."
          className="w-full resize-y rounded-xl border border-ink-200 bg-white px-4 py-3 text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      <SubmitButton />

      {state.status === 'error' && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.reason === 'validation' ? 'تحقق من البيانات' : 'حدث خطأ. حاول لاحقاً.'}
        </p>
      )}
      {state.status === 'quota' && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {state.isDemo
            ? 'الحصة اليومية المجانية انتهت. جرّب التقييمات المحمّلة مسبقاً.'
            : 'الحصة اليومية لـ AI انتهت. جرّب لاحقاً.'}
        </p>
      )}
    </form>
  );
}
