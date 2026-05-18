'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Save, Check } from 'lucide-react';
import { savePolicyToProfile } from '@/app/(app)/insights/actions';
import type { ReplyPolicy } from '@/ai/policy-generator';

interface Labels {
  scenarioLabel: string;
  conditionsLabel: string;
  actionsLabel: string;
  evidence: (n: number) => string;
  save: string;
  saving: string;
  saved: string;
  toastSaved: string;
  saveError: string;
}

const LABELS: Record<'ar' | 'en', Labels> = {
  ar: {
    scenarioLabel: 'الحالة',
    conditionsLabel: 'الشروط',
    actionsLabel: 'الإجراءات',
    evidence: (n) => `بناءً على ${n} مثال`,
    save: 'احفظ في نغمة الردود',
    saving: 'جارٍ الحفظ...',
    saved: 'محفوظ',
    toastSaved: 'تمت إضافة السياسة',
    saveError: 'تعذّر الحفظ. تأكد من ملف الصوت.',
  },
  en: {
    scenarioLabel: 'Scenario',
    conditionsLabel: 'Conditions',
    actionsLabel: 'Actions',
    evidence: (n) => `Based on ${n} example${n === 1 ? '' : 's'}`,
    save: 'Save to voice profile',
    saving: 'Saving...',
    saved: 'Saved',
    toastSaved: 'Policy added to voice profile',
    saveError: "Couldn't save. Make sure your voice profile exists.",
  },
};

export function PolicyCard({
  policy,
  alreadySaved = false,
  locale = 'ar',
}: {
  policy: ReplyPolicy;
  alreadySaved?: boolean;
  locale?: 'ar' | 'en';
}) {
  const t = LABELS[locale];
  const [pending, startTransition] = useTransition();
  // Track local "just saved" state separately so the UI flips immediately.
  const isSaved = alreadySaved;

  function onSave() {
    startTransition(async () => {
      const res = await savePolicyToProfile(policy);
      if (res.ok) toast.success(t.toastSaved);
      else toast.error(t.saveError);
    });
  }

  return (
    <article className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight text-ink-900">
          {policy.scenario}
        </h3>
        <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
          {t.evidence(policy.evidenceCount)}
        </span>
      </div>

      <div className="mb-3">
        <p className="mb-1 text-xs uppercase tracking-wider text-ink-400">
          {t.conditionsLabel}
        </p>
        <p className="text-sm text-ink-700">{policy.conditions}</p>
      </div>

      <div className="mb-4">
        <p className="mb-1 text-xs uppercase tracking-wider text-ink-400">{t.actionsLabel}</p>
        <ul className="space-y-1 text-sm text-ink-700">
          {policy.actions.map((a, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-accent-dark" />
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onSave}
        disabled={pending || isSaved}
        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
          isSaved
            ? 'bg-emerald-50 text-emerald-700 cursor-default'
            : 'bg-ink-900 text-ink-50 hover:bg-ink-800'
        }`}
      >
        {isSaved ? (
          <>
            <Check className="h-3 w-3" />
            {t.saved}
          </>
        ) : (
          <>
            <Save className="h-3 w-3" />
            {pending ? t.saving : t.save}
          </>
        )}
      </button>
    </article>
  );
}
