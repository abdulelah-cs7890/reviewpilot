'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { regenerateDraft, type RegenerateResult } from '@/app/(app)/inbox/[id]/regenerate-action';

export function RegenerateButton({
  reviewId,
  label = '↻ اقترح صياغة أخرى',
  pendingLabel = 'جارٍ إنشاء صياغة...',
}: {
  reviewId: string;
  label?: string;
  pendingLabel?: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result: RegenerateResult = await regenerateDraft(reviewId);
      if (result.ok) {
        toast.success('✓');
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
      {pending ? pendingLabel : label}
    </button>
  );
}
