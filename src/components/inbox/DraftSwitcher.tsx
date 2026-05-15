'use client';

import { useState } from 'react';
import { DraftEditor } from './DraftEditor';

interface Draft {
  id: string;
  draftText: string;
  editedText: string | null;
  language: 'ar' | 'en' | 'mixed';
  model: string;
  promptVersion: string;
  generatedAt: Date;
}

export function DraftSwitcher({
  reviewId,
  drafts,
}: {
  reviewId: string;
  drafts: Draft[];
}) {
  // Drafts arrive ordered newest-first. The "current" default is the newest.
  const [idx, setIdx] = useState(0);
  const current = drafts[idx];

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
            ← الأقدم
          </button>
          <span className="text-ink-500">
            صياغة {idx + 1} من {drafts.length}
            {idx === 0 && <span className="ms-1 text-accent-dark">(الأحدث)</span>}
          </span>
          <button
            type="button"
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="text-ink-600 hover:text-ink-900 disabled:opacity-30"
          >
            الأحدث →
          </button>
        </div>
      )}
      <DraftEditor
        key={current.id}
        draftId={current.id}
        reviewId={reviewId}
        initialText={current.editedText ?? current.draftText}
        language={current.language}
      />
      <p className="text-xs text-ink-400">
        {current.model} · {current.promptVersion} ·{' '}
        {new Date(current.generatedAt).toLocaleString('ar')}
      </p>
    </div>
  );
}
