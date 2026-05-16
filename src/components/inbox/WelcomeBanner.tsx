'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

const DISMISS_KEY = 'reviewpilot_demo_intro_seen';

/**
 * One-time welcome banner for demo-mode visitors. Orients them on what's
 * pre-loaded and what's worth clicking. Dismissed state persists in
 * localStorage; hidden entirely for non-demo users.
 */
export function WelcomeBanner({ isDemo }: { isDemo: boolean }) {
  const [visible, setVisible] = useState(false);

  // Hydration-safe: read localStorage after mount, otherwise SSR mismatches.
  useEffect(() => {
    if (!isDemo) return;
    const dismissed = window.localStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, [isDemo]);

  if (!visible) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  return (
    <div className="mb-6 rounded-3xl border border-accent/30 bg-accent/5 p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-dark">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="mb-1 text-base font-semibold tracking-tight text-ink-900">
              أهلاً بك في النسخة التجريبية
            </h2>
            <p className="mb-3 text-sm text-ink-700">
              هذا مطعم تجريبي محمّل مسبقاً بـ ٨ تقييمات حقيقية. كل التقييمات هنا محلّلة بالذكاء الاصطناعي ولها مسودات ردود جاهزة. جرّب:
            </p>
            <ul className="space-y-1.5 text-sm text-ink-700">
              <li>
                ←&nbsp; <span className="text-ink-900">اضغط أي تقييم</span> لتشوف الرد المقترح + تقييم جودته
              </li>
              <li>
                ←&nbsp; جرّب زر <span className="text-ink-900">«اقترح صياغة أخرى»</span> داخل تفاصيل التقييم
              </li>
              <li>
                ←&nbsp; شوف <span className="text-ink-900">لوحة المعلومات</span> فوق — رسوم بيانات حقيقية
              </li>
            </ul>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="إخفاء"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
