'use client';

import { useState, useTransition } from 'react';
import { regenerateDraft, type RegenerateResult } from '@/app/(app)/inbox/[id]/regenerate-action';

export function RegenerateButton({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const result: RegenerateResult = await regenerateDraft(reviewId);
      if (!result.ok) {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50"
      >
        {pending ? 'جارٍ إنشاء صياغة...' : '↻ اقترح صياغة أخرى'}
      </button>
      {error && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>
      )}
    </div>
  );
}
