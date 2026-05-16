'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { saveDraftEdit, markAsResponded } from '@/app/(app)/inbox/actions';
import { CopyButton } from './CopyButton';

export function DraftEditor({
  draftId,
  reviewId,
  initialText,
  language,
}: {
  draftId: string;
  reviewId: string;
  initialText: string;
  language: 'ar' | 'en' | 'mixed';
}) {
  const [text, setText] = useState(initialText);
  const [saving, startSave] = useTransition();
  const [responding, startRespond] = useTransition();
  const dirty = text !== initialText;

  async function onSave() {
    try {
      await saveDraftEdit(draftId, text);
      toast.success('تم حفظ التعديل');
    } catch {
      toast.error('تعذّر الحفظ، حاول مرة ثانية');
    }
  }

  async function onMarkResponded() {
    try {
      await markAsResponded(reviewId);
      toast.success('تم تحديث حالة التقييم');
    } catch {
      toast.error('تعذّر التحديث');
    }
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        dir={language === 'en' ? 'ltr' : 'rtl'}
        rows={6}
        className="w-full resize-y rounded-2xl border border-ink-100 bg-white p-4 text-lg leading-relaxed text-ink-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={text} />
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => startSave(onSave)}
          className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50"
        >
          {saving ? 'جارٍ الحفظ...' : 'حفظ التعديل'}
        </button>
        <button
          type="button"
          disabled={responding}
          onClick={() => startRespond(onMarkResponded)}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          {responding ? '...' : '✓ تم الرد'}
        </button>
      </div>
    </div>
  );
}
