'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { regenerateDraft, type RegenerateResult } from '@/app/(app)/inbox/[id]/regenerate-action';

export function RegenerateButton({ reviewId }: { reviewId: string }) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result: RegenerateResult = await regenerateDraft(reviewId);
      if (result.ok) {
        toast.success('صياغة جديدة جاهزة');
      } else if (result.reason === 'quota') {
        toast.warning(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50"
    >
      {pending ? 'جارٍ إنشاء صياغة...' : '↻ اقترح صياغة أخرى'}
    </button>
  );
}
