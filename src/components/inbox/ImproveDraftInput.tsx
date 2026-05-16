'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Wand2 } from 'lucide-react';
import { improveDraftAction } from '@/app/(app)/inbox/[id]/improve-action';

interface Labels {
  heading: string;
  placeholder: string;
  apply: string;
  applying: string;
  examples: string[];
  successToast: string;
}

const LABELS: Record<'ar' | 'en', Labels> = {
  ar: {
    heading: 'حسّن هذه المسودة',
    placeholder: 'مثلاً: اجعلها أقصر، أضف عرض حلى مجاني، خفّف من الاعتذار...',
    apply: 'طبّق',
    applying: 'جارٍ التطبيق...',
    examples: ['اجعلها أقصر', 'أكثر اعتذاراً', 'أضف عرض زيارة قادمة'],
    successToast: 'صياغة محسّنة جاهزة',
  },
  en: {
    heading: 'Improve this draft',
    placeholder: 'e.g. "make it shorter", "offer a free dessert", "less apologetic"...',
    apply: 'Apply',
    applying: 'Applying...',
    examples: ['Make it shorter', 'More apologetic', 'Offer a return visit'],
    successToast: 'Improved draft is ready',
  },
};

export function ImproveDraftInput({
  reviewId,
  locale = 'ar',
}: {
  reviewId: string;
  locale?: 'ar' | 'en';
}) {
  const t = LABELS[locale];
  const [instruction, setInstruction] = useState('');
  const [pending, startTransition] = useTransition();

  function submit(input: string) {
    const value = input.trim();
    if (!value) return;
    startTransition(async () => {
      const result = await improveDraftAction(reviewId, value);
      if (result.ok) {
        toast.success(t.successToast);
        setInstruction('');
      } else if (result.reason === 'quota') {
        toast.warning(result.message);
      } else if (result.reason === 'empty') {
        toast.info(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="mt-4 rounded-2xl border border-ink-100 bg-white/60 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-accent-dark" />
        <span className="text-sm font-medium text-ink-900">{t.heading}</span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(instruction);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          disabled={pending}
          placeholder={t.placeholder}
          maxLength={400}
          className="flex-1 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder-ink-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || instruction.trim().length === 0}
          className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-50"
        >
          {pending ? t.applying : t.apply}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {t.examples.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={pending}
            onClick={() => {
              setInstruction(ex);
              submit(ex);
            }}
            className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs text-ink-700 hover:bg-ink-200 disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
