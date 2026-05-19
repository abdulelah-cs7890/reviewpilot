'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const COMPLETED_KEY = 'reviewpilot_tour_completed';

interface TourStep {
  /** Selector that matches a `data-tour` attribute on the target element. */
  target: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="inbox-title"]',
    titleAr: 'صندوق التقييمات',
    titleEn: 'Your review inbox',
    bodyAr:
      'هنا تظهر كل تقييماتك مع وسوم الإلحاح والمشاعر والخطورة. التقييمات العاجلة تطلع أولاً.',
    bodyEn:
      'Every review lands here, tagged with urgency, sentiment, and severity. Urgent ones surface to the top.',
  },
  {
    target: '[data-tour="add-button"]',
    titleAr: 'أضف تقييم جديد',
    titleEn: 'Add a review',
    bodyAr:
      'انسخ تقييم من Google واضغط هنا. الذكاء الاصطناعي يحلله ويكتب لك مسودة رد خلال ثوانٍ. للكميات الكبيرة جرّب «إضافة دفعة» أو «استيراد CSV».',
    bodyEn:
      'Paste a Google review and click here. The AI analyzes it and writes a reply draft in seconds. For bulk, use "Bulk add" or "Import CSV".',
  },
  {
    target: '[data-tour="language-toggle"]',
    titleAr: 'تبديل اللغة',
    titleEn: 'Language toggle',
    bodyAr: 'بدّل بين العربية والإنجليزية لواجهة التطبيق في أي وقت. لا يؤثر على لغة الردود نفسها.',
    bodyEn:
      'Switch the app UI between Arabic and English anytime. Doesn\'t affect the reply language itself.',
  },
  {
    target: '[data-tour="insights"]',
    titleAr: 'التحليلات',
    titleEn: 'AI insights',
    bodyAr:
      'الذكاء الاصطناعي يستخرج سياسات ردودك المتكررة ويعرض درجات جودة المسودات. اكتشف نمطك واحفظه في نغمة الردود.',
    bodyEn:
      'The AI extracts your recurring reply policies and shows draft quality scores. See your pattern and lock it into your voice profile.',
  },
  {
    target: '[data-tour="settings"]',
    titleAr: 'الإعدادات',
    titleEn: 'Settings',
    bodyAr:
      'اضبط نغمة الردود (اللهجة، الرسمية، العبارات الدينية). من هنا تقدر أيضاً تغيّر البريد، تستورد البيانات، أو تحذف الحساب.',
    bodyEn:
      'Tune the reply voice (dialect, formality, religious phrases). Also: change email, export data, or delete account.',
  },
];

interface UiCopy {
  next: string;
  back: string;
  done: string;
  skip: string;
  stepOf: (cur: number, total: number) => string;
}

const COPY: Record<'ar' | 'en', UiCopy> = {
  ar: {
    next: 'التالي',
    back: 'رجوع',
    done: 'تم',
    skip: 'تخطي',
    stepOf: (cur, total) => `الخطوة ${cur} من ${total}`,
  },
  en: {
    next: 'Next',
    back: 'Back',
    done: 'Done',
    skip: 'Skip',
    stepOf: (cur, total) => `Step ${cur} of ${total}`,
  },
};

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
  cardTop: number;
  cardLeft: number;
  cardSide: 'top' | 'bottom' | 'left' | 'right';
}

const CARD_WIDTH = 320;
const CARD_GAP = 12;

function computePosition(rect: DOMRect): Position {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceBelow = vh - rect.bottom;
  const spaceAbove = rect.top;

  // Prefer below, fall back to above, then left, then right.
  let side: Position['cardSide'] = 'bottom';
  if (spaceBelow >= 180) side = 'bottom';
  else if (spaceAbove >= 180) side = 'top';
  else if (rect.left > CARD_WIDTH + CARD_GAP) side = 'left';
  else side = 'right';

  let cardTop = 0;
  let cardLeft = 0;
  if (side === 'bottom') {
    cardTop = rect.bottom + CARD_GAP;
    cardLeft = Math.min(
      Math.max(8, rect.left + rect.width / 2 - CARD_WIDTH / 2),
      vw - CARD_WIDTH - 8
    );
  } else if (side === 'top') {
    cardTop = rect.top - CARD_GAP - 180;
    cardLeft = Math.min(
      Math.max(8, rect.left + rect.width / 2 - CARD_WIDTH / 2),
      vw - CARD_WIDTH - 8
    );
  } else if (side === 'left') {
    cardTop = Math.max(8, rect.top + rect.height / 2 - 90);
    cardLeft = rect.left - CARD_WIDTH - CARD_GAP;
  } else {
    cardTop = Math.max(8, rect.top + rect.height / 2 - 90);
    cardLeft = rect.right + CARD_GAP;
  }
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    cardTop,
    cardLeft,
    cardSide: side,
  };
}

export function ProductTour({ locale = 'ar' }: { locale?: 'ar' | 'en' }) {
  const t = COPY[locale];
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [pos, setPos] = useState<Position | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Listen for the "start tour" custom event dispatched from GettingStartedPanel
  useEffect(() => {
    function onStart() {
      setStepIdx(0);
      setActive(true);
    }
    window.addEventListener('reviewpilot:start-tour', onStart);
    return () => window.removeEventListener('reviewpilot:start-tour', onStart);
  }, []);

  // Re-measure the current step's target whenever the step changes or window resizes
  useEffect(() => {
    if (!active) {
      setPos(null);
      return;
    }
    function measure() {
      const step = STEPS[stepIdx];
      const el = document.querySelector(step.target);
      if (!el) {
        setPos(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      setPos(computePosition(rect));
    }
    // Initial measure on next frame so layout has settled
    const raf = requestAnimationFrame(measure);
    // Re-measure briefly in case fonts/images shift things
    intervalRef.current = window.setInterval(measure, 300);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(raf);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, stepIdx]);

  function finish() {
    window.localStorage.setItem(COMPLETED_KEY, '1');
    setActive(false);
    setStepIdx(0);
  }

  function next() {
    if (stepIdx >= STEPS.length - 1) finish();
    else setStepIdx(stepIdx + 1);
  }

  function back() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  if (!active) return null;

  const step = STEPS[stepIdx];
  const total = STEPS.length;
  const isLast = stepIdx === total - 1;

  return (
    <div
      className="fixed inset-0 z-[1000]"
      role="dialog"
      aria-modal="true"
      aria-label={locale === 'en' ? 'Product tour' : 'جولة في الواجهة'}
    >
      {/* Dim backdrop. Click closes the tour. */}
      <button
        type="button"
        onClick={finish}
        aria-label={t.skip}
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
      />

      {/* Spotlight cutout (subtle ring around the target) */}
      {pos && (
        <div
          className="pointer-events-none absolute rounded-xl ring-4 ring-accent ring-offset-2 ring-offset-transparent transition-all"
          style={{
            top: pos.top - 4,
            left: pos.left - 4,
            width: pos.width + 8,
            height: pos.height + 8,
          }}
        />
      )}

      {/* Tooltip card */}
      {pos && (
        <div
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          className="absolute rounded-2xl border border-ink-100 bg-white p-5 shadow-2xl"
          style={{
            top: pos.cardTop,
            left: pos.cardLeft,
            width: CARD_WIDTH,
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
              {t.stepOf(stepIdx + 1, total)}
            </span>
            <button
              type="button"
              onClick={finish}
              aria-label={t.skip}
              className="-mt-1 -me-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="mb-2 text-base font-semibold text-ink-900">
            {locale === 'en' ? step.titleEn : step.titleAr}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-ink-700">
            {locale === 'en' ? step.bodyEn : step.bodyAr}
          </p>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={back}
              disabled={stepIdx === 0}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-ink-600 hover:bg-ink-100 disabled:opacity-30"
            >
              {locale === 'ar' ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
              {t.back}
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1 rounded-lg bg-ink-900 px-4 py-1.5 text-sm font-medium text-ink-50 hover:bg-ink-800"
            >
              {isLast ? t.done : t.next}
              {!isLast &&
                (locale === 'ar' ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ))}
            </button>
          </div>
        </div>
      )}

      {/* If we couldn't find the target (e.g. wrong route), show a fallback card centered */}
      {!pos && (
        <div className="absolute left-1/2 top-1/2 w-80 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink-100 bg-white p-5 shadow-2xl">
          <p className="mb-3 text-sm text-ink-700">
            {locale === 'en'
              ? "This step's target isn't on the current page. Visit the inbox to see all tour stops."
              : 'هذي الخطوة في صفحة ثانية. ارجع للصندوق لتشوف كل النقاط.'}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={finish}
              className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100"
            >
              {t.skip}
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-ink-900 px-3 py-1.5 text-sm text-ink-50 hover:bg-ink-800"
            >
              {isLast ? t.done : t.next}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
