'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Wand2, Check, X } from 'lucide-react';
import {
  requestProfileSuggestions,
  applyProfileChange,
} from '@/app/(app)/settings/profile-tuner-actions';
import type { ProfileSuggestion } from '@/ai/profile-tuner';

interface Labels {
  heading: string;
  sub: string;
  cta: string;
  generating: string;
  applying: string;
  apply: string;
  skip: string;
  current: string;
  proposed: string;
  rationale: string;
  applied: string;
  none: string;
  noEdits: string;
}

const LABELS: Record<'ar' | 'en', Labels> = {
  ar: {
    heading: 'اقتراحات لتحسين نغمتك',
    sub: 'الذكاء الاصطناعي يقرأ تعديلاتك السابقة ويقترح تغييرات على إعدادات نغمة الردود.',
    cta: '✨ اقترح تغييرات',
    generating: 'جارٍ التحليل...',
    applying: 'جارٍ التطبيق...',
    apply: 'طبّق',
    skip: 'تجاهل',
    current: 'الحالي',
    proposed: 'المقترح',
    rationale: 'السبب',
    applied: 'تم التطبيق',
    none: 'ما فيه اقتراحات حالياً. عدّل بعض المسودات وحاول ثانية.',
    noEdits: 'تحتاج تعدّل مسودة على الأقل قبل ما نقدر نقترح تحسينات.',
  },
  en: {
    heading: 'Voice profile suggestions',
    sub: 'The AI reads your past edits and proposes voice-profile tweaks that match your style.',
    cta: '✨ Suggest changes',
    generating: 'Analyzing...',
    applying: 'Applying...',
    apply: 'Apply',
    skip: 'Skip',
    current: 'Current',
    proposed: 'Proposed',
    rationale: 'Why',
    applied: 'Applied',
    none: "No suggestions right now. Edit a few drafts and try again.",
    noEdits: 'Edit at least one draft so the AI has something to learn from.',
  },
};

const FIELD_LABELS: Record<'ar' | 'en', Record<string, string>> = {
  ar: {
    formality: 'طبيعة الردود',
    arabicDialect: 'اللهجة العربية',
    useReligiousPhrases: 'العبارات الدينية',
    signoff: 'التوقيع',
    customInstructions: 'تعليمات خاصة',
  },
  en: {
    formality: 'Reply tone',
    arabicDialect: 'Arabic dialect',
    useReligiousPhrases: 'Religious phrases',
    signoff: 'Signoff',
    customInstructions: 'Custom instructions',
  },
};

export function ProfileTunerPanel({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const t = LABELS[locale];
  const fLabels = FIELD_LABELS[locale];
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[] | null>(null);
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [applied, setApplied] = useState<Set<number>>(new Set());
  const [pending, startTransition] = useTransition();

  function onGenerate() {
    startTransition(async () => {
      const res = await requestProfileSuggestions();
      if (res.ok) {
        setSuggestions(res.suggestions);
        setSkipped(new Set());
        setApplied(new Set());
        if (res.suggestions.length === 0) toast.info(t.none);
      } else if (res.reason === 'no-edits') {
        toast.info(t.noEdits);
      } else if (res.reason === 'quota') {
        toast.warning(res.message);
      } else {
        toast.error(res.message);
      }
    });
  }

  function onApply(i: number, s: ProfileSuggestion) {
    startTransition(async () => {
      const res = await applyProfileChange(s.field, s.proposedValue);
      if (res.ok) {
        setApplied((prev) => new Set(prev).add(i));
        toast.success(t.applied);
      } else {
        toast.error(res.message ?? 'Failed');
      }
    });
  }

  function onSkip(i: number) {
    setSkipped((prev) => new Set(prev).add(i));
  }

  return (
    <div className="mt-6 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-3 flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-accent-dark" />
        <h2 className="text-sm font-medium text-ink-900">{t.heading}</h2>
      </div>
      <p className="mb-4 text-sm text-ink-600">{t.sub}</p>

      <button
        type="button"
        onClick={onGenerate}
        disabled={pending}
        className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-60"
      >
        {pending && suggestions === null ? t.generating : t.cta}
      </button>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 space-y-3">
          {suggestions.map((s, i) => {
            const isSkipped = skipped.has(i);
            const isApplied = applied.has(i);
            if (isSkipped) return null;
            const conf =
              s.confidence === 'high'
                ? 'bg-emerald-50 text-emerald-700'
                : s.confidence === 'medium'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-ink-100 text-ink-600';
            return (
              <div
                key={i}
                className={`rounded-2xl border p-4 ${
                  isApplied
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-ink-100 bg-ink-50/40'
                }`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">
                    {fLabels[s.field] ?? s.field}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${conf}`}>
                    {s.confidence}
                  </span>
                </div>
                <div className="mb-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-ink-400">
                      {t.current}
                    </span>
                    <span className="text-ink-600">{s.currentValue || '(none)'}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-accent-dark">
                      {t.proposed}
                    </span>
                    <span className="text-ink-900">{s.proposedValue}</span>
                  </div>
                </div>
                <p className="mb-3 text-xs text-ink-500">
                  <span className="font-medium">{t.rationale}: </span>
                  {s.rationale}
                </p>
                {!isApplied && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onApply(i, s)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      {pending ? t.applying : t.apply}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSkip(i)}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-100 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      {t.skip}
                    </button>
                  </div>
                )}
                {isApplied && (
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <Check className="h-3 w-3" />
                    {t.applied}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
