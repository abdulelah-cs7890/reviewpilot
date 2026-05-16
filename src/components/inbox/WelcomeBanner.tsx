'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

const DISMISS_KEY = 'reviewpilot_demo_intro_seen';

interface BannerCopy {
  title: string;
  sub: string;
  bullet1Prefix: string;
  bullet1Action: string;
  bullet1Suffix: string;
  bullet2Prefix: string;
  bullet2Pre: string;
  bullet2Action: string;
  bullet2Suffix: string;
  bullet3Prefix: string;
  bullet3Pre: string;
  bullet3Action: string;
  bullet3Suffix: string;
  dismiss: string;
}

/**
 * One-time welcome banner for demo-mode visitors. Orients them on what's
 * pre-loaded and what's worth clicking. Dismissed state persists in
 * localStorage; hidden entirely for non-demo users.
 */
export function WelcomeBanner({ isDemo, t }: { isDemo: boolean; t: BannerCopy }) {
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
              {t.title}
            </h2>
            <p className="mb-3 text-sm text-ink-700">{t.sub}</p>
            <ul className="space-y-1.5 text-sm text-ink-700">
              <li>
                {t.bullet1Prefix}&nbsp;{' '}
                <span className="text-ink-900">{t.bullet1Action}</span> {t.bullet1Suffix}
              </li>
              <li>
                {t.bullet2Prefix}&nbsp; {t.bullet2Pre}{' '}
                <span className="text-ink-900">{t.bullet2Action}</span> {t.bullet2Suffix}
              </li>
              <li>
                {t.bullet3Prefix}&nbsp; {t.bullet3Pre}{' '}
                <span className="text-ink-900">{t.bullet3Action}</span> {t.bullet3Suffix}
              </li>
            </ul>
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
    </div>
  );
}
