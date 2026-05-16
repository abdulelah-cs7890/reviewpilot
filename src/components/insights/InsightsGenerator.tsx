'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { generateRestaurantPolicies } from '@/app/(app)/insights/actions';
import type { ReplyPolicy } from '@/ai/policy-generator';
import { PolicyCard } from './PolicyCard';

const LABELS = {
  ar: {
    cta: '✨ ولّد سياسات الردود',
    generating: 'جارٍ التحليل...',
    nothingYet: 'اضغط الزر لتحليل سجل ردودك.',
    none: 'ما قدرنا نستخرج سياسات. جرّب بعد إضافة تقييمات وردود أكثر.',
  },
  en: {
    cta: '✨ Generate reply policies',
    generating: 'Analyzing...',
    nothingYet: 'Click the button to analyze your reply history.',
    none: "Couldn't extract policies yet. Try after more reviews + replies are added.",
  },
};

export function InsightsGenerator({
  locale = 'ar',
  savedSignatures,
}: {
  locale?: 'ar' | 'en';
  savedSignatures: string[];
}) {
  const t = LABELS[locale];
  const [policies, setPolicies] = useState<ReplyPolicy[] | null>(null);
  const [pending, startTransition] = useTransition();

  function onGenerate() {
    startTransition(async () => {
      const res = await generateRestaurantPolicies();
      if (res.ok) {
        setPolicies(res.policies);
        if (res.policies.length === 0) toast.info(t.none);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={pending}
        className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-60"
      >
        {pending ? t.generating : t.cta}
      </button>

      <div className="mt-6">
        {policies === null && (
          <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-sm text-ink-500">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-accent-dark" />
            {t.nothingYet}
          </p>
        )}
        {policies && policies.length > 0 && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {policies.map((p, i) => {
              const sig = `${p.scenario}::${p.conditions}`.slice(0, 60);
              const alreadySaved = savedSignatures.some((s) => sig.startsWith(s.slice(0, 40)));
              return (
                <PolicyCard
                  key={i}
                  policy={p}
                  alreadySaved={alreadySaved}
                  locale={locale}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
