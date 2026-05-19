'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Circle, Sparkles, X, ArrowRight, ArrowLeft } from 'lucide-react';

const DISMISS_KEY = 'reviewpilot_gs_dismissed';

export type ChecklistItemId = 'restaurant' | 'paste' | 'edit' | 'tune' | 'import';

export interface ChecklistItem {
  id: ChecklistItemId;
  done: boolean;
  optional?: boolean;
}

interface ItemCopy {
  label: string;
  subDone: string;
  subTodo: string;
  cta: string;
}

interface Copy {
  title: string;
  sub: string;
  items: Record<ChecklistItemId, ItemCopy>;
  takeTour: string;
  dismiss: string;
  optional: string;
}

const COPY: Record<'ar' | 'en', Copy> = {
  ar: {
    title: 'البداية',
    sub: 'خمس خطوات سريعة عشان تستفيد من التطبيق.',
    items: {
      restaurant: {
        label: 'إعداد المطعم',
        subDone: 'تم — مطعمك جاهز',
        subTodo: 'أكمل التهيئة',
        cta: 'إعداد',
      },
      paste: {
        label: 'أضف أول تقييم',
        subDone: 'تم — أول تقييم موجود',
        subTodo: 'انسخ تقييم من Google وشف الذكاء الاصطناعي يحلله ويصيغ الرد',
        cta: 'أضف تقييم ←',
      },
      edit: {
        label: 'عدّل مسودة الذكاء الاصطناعي',
        subDone: 'تم — التطبيق بدأ يتعلم منك',
        subTodo: 'افتح أي تقييم، عدّل المسودة واحفظ — هذا يعلّم الذكاء أسلوبك',
        cta: 'افتح تقييم ←',
      },
      tune: {
        label: 'اضبط نغمة الردود',
        subDone: 'تم — النغمة محفوظة',
        subTodo: 'حدّد اللهجة والرسمية والعبارات الدينية من الإعدادات',
        cta: 'فتح الإعدادات ←',
      },
      import: {
        label: 'استورد تقييماتك السابقة',
        subDone: 'تم — التقييمات السابقة محمّلة',
        subTodo: 'حمّل ملف CSV من Google Takeout أو أي مصدر',
        cta: 'استورد CSV ←',
      },
    },
    takeTour: '↗ جولة سريعة في الواجهة',
    dismiss: 'إخفاء',
    optional: 'اختياري',
  },
  en: {
    title: 'Getting started',
    sub: 'Five quick steps to get value from the app.',
    items: {
      restaurant: {
        label: 'Set up your restaurant',
        subDone: 'Done — your restaurant is ready',
        subTodo: 'Finish onboarding',
        cta: 'Set up',
      },
      paste: {
        label: 'Add your first review',
        subDone: 'Done — your first review is in',
        subTodo: 'Paste a Google review and watch the AI analyze + draft a reply',
        cta: 'Add a review →',
      },
      edit: {
        label: 'Edit an AI draft',
        subDone: 'Done — the AI is learning from you',
        subTodo: "Open any review, edit the draft and save — that's how it learns your voice",
        cta: 'Open a review →',
      },
      tune: {
        label: 'Tune the reply voice',
        subDone: 'Done — voice saved',
        subTodo: 'Pick dialect, formality, and religious phrasing in Settings',
        cta: 'Open settings →',
      },
      import: {
        label: 'Import historical reviews',
        subDone: 'Done — past reviews loaded',
        subTodo: 'Upload a CSV from Google Takeout or any other source',
        cta: 'Import CSV →',
      },
    },
    takeTour: '↗ Quick tour of the UI',
    dismiss: 'Hide',
    optional: 'optional',
  },
};

const ITEM_LINKS: Record<ChecklistItemId, (firstReviewId: string | null) => string> = {
  restaurant: () => '/onboarding',
  paste: () => '/inbox/new',
  edit: (firstReviewId) => (firstReviewId ? `/inbox/${firstReviewId}` : '/inbox/new'),
  tune: () => '/settings',
  import: () => '/inbox/import',
};

export function GettingStartedPanel({
  items,
  locale = 'ar',
  firstReviewId,
}: {
  items: ChecklistItem[];
  locale?: 'ar' | 'en';
  firstReviewId: string | null;
}) {
  const t = COPY[locale];
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (window.localStorage.getItem(DISMISS_KEY) === '1') setDismissed(true);
  }, []);

  const requiredItems = items.filter((i) => !i.optional);
  const allRequiredDone = requiredItems.every((i) => i.done);
  if (!hydrated) return null;
  if (dismissed || allRequiredDone) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  function launchTour() {
    window.dispatchEvent(new CustomEvent('reviewpilot:start-tour'));
  }

  const Arrow = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="mb-6 rounded-3xl border border-accent/30 bg-accent/5 p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-dark">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="mb-1 text-base font-semibold tracking-tight text-ink-900">
              {t.title}
            </h2>
            <p className="text-sm text-ink-700">{t.sub}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t.dismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="space-y-2.5">
        {items.map((item) => {
          const copy = t.items[item.id];
          const href = ITEM_LINKS[item.id](firstReviewId);
          return (
            <li
              key={item.id}
              className={`flex items-start gap-3 rounded-xl p-3 transition ${
                item.done ? 'bg-emerald-50/40' : 'bg-white'
              }`}
            >
              <div
                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  item.done
                    ? 'bg-emerald-500 text-white'
                    : 'border border-ink-200 bg-white text-ink-300'
                }`}
                aria-hidden="true"
              >
                {item.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      item.done ? 'text-ink-500 line-through' : 'text-ink-900'
                    }`}
                  >
                    {copy.label}
                  </span>
                  {item.optional && !item.done && (
                    <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-500">
                      {t.optional}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-ink-600">
                  {item.done ? copy.subDone : copy.subTodo}
                </p>
                {!item.done && (
                  <Link
                    href={href}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-accent-dark hover:text-accent"
                  >
                    {copy.cta}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={launchTour}
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ink-600 hover:text-ink-900"
      >
        <Arrow className="h-3 w-3" />
        {t.takeTour}
      </button>
    </div>
  );
}
