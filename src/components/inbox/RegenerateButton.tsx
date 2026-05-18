'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { regenerateDraft, type RegenerateResult } from '@/app/(app)/inbox/[id]/regenerate-action';

type Reason = Extract<RegenerateResult, { ok: false }>['reason'];

const ERROR_LABELS: Record<'ar' | 'en', Record<Reason, string>> = {
  ar: {
    'not-found': 'لم يتم العثور على التقييم',
    quota: 'الحصة اليومية لـ AI انتهت. جرّب لاحقاً.',
    error: 'تعذّر إنشاء صياغة جديدة. حاول لاحقاً.',
  },
  en: {
    'not-found': 'Review not found',
    quota: 'Daily AI quota reached. Try again later.',
    error: "Couldn't create a new draft. Try again later.",
  },
};

export function RegenerateButton({
  reviewId,
  label = '↻ اقترح صياغة أخرى',
  pendingLabel = 'جارٍ إنشاء صياغة...',
  locale = 'ar',
}: {
  reviewId: string;
  label?: string;
  pendingLabel?: string;
  locale?: 'ar' | 'en';
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result: RegenerateResult = await regenerateDraft(reviewId);
      if (result.ok) {
        toast.success('✓');
      } else if (result.reason === 'quota') {
        toast.warning(ERROR_LABELS[locale][result.reason]);
      } else {
        toast.error(ERROR_LABELS[locale][result.reason]);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
