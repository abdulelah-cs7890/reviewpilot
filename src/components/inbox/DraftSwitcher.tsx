'use client';

import { useState } from 'react';
import { DraftEditor } from './DraftEditor';
import { QualityCheckCard } from './QualityCheckCard';
import type { QualityCheckResult } from '@/db';
import type { UiLocale } from '@/lib/locale';

interface Draft {
  id: string;
  draftText: string;
  editedText: string | null;
  language: 'ar' | 'en' | 'mixed';
  model: string;
  promptVersion: string;
  generatedAt: Date;
  qualityCheck: QualityCheckResult | null;
}

export function DraftSwitcher({
  reviewId,
  drafts,
  locale = 'ar',
}: {
  reviewId: string;
  drafts: Draft[];
  locale?: UiLocale;
}) {
  // Drafts arrive ordered newest-first. The "current" default is the newest.
  const [idx, setIdx] = useState(0);
  const current = drafts[idx];

  const labels =
    locale === 'en'
      ? {
          older: '← Older',
          newer: 'Newer →',
          count: (cur: number, total: number) => `Draft ${cur} of ${total}`,
          latest: '(latest)',
        }
      : {
          older: '← الأقدم',
          newer: 'الأحدث →',
          count: (cur: number, total: number) => `صياغة ${cur} من ${total}`,
          latest: '(الأحدث)',
        };

  return (
    <div className="space-y-3">
      {drafts.length > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-ink-100 bg-white/60 px-3 py-2 text-sm">
          <button
            type="button"
            onClick={() => setIdx(Math.min(drafts.length - 1, idx + 1))}
            disabled={idx >= drafts.length - 1}
            className="text-ink-600 hover:text-ink-900 disabled:opacity-30"
          >
            {labels.older}
          </button>
          <span className="text-ink-500">
            {labels.count(idx + 1, drafts.length)}
            {idx === 0 && <span className="ms-1 text-accent-dark">{labels.latest}</span>}
          </span>
          <button
            type="button"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="text-ink-600 hover:text-ink-900 disabled:opacity-30"
          >
            {labels.newer}
          </button>
        </div>
      )}
      <DraftEditor
        key={current.id}
        draftId={current.id}
        reviewId={reviewId}
        initialText={current.editedText ?? current.draftText}
        language={current.language}
        locale={locale}
      />
      <QualityCheckCard check={current.qualityCheck} />
      <p className="text-xs text-ink-400">
        {current.model} · {current.promptVersion} ·{' '}
        {new Date(current.generatedAt).toLocaleString(locale)}
      </p>
    </div>
  );
}
