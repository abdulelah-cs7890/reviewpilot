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
  locale = 'ar',
}: {
  draftId: string;
  reviewId: string;
  initialText: string;
  language: 'ar' | 'en' | 'mixed';
  locale?: 'ar' | 'en';
}) {
  const labels =
    locale === 'en'
      ? {
          savedToast: 'Saved',
          saveError: 'Could not save, try again',
          respondedToast: 'Marked as responded',
          respondError: 'Update failed',
          save: 'Save edit',
          saving: 'Saving...',
          markResponded: '✓ Mark as responded',
        }
      : {
          savedToast: 'تم حفظ التعديل',
          saveError: 'تعذّر الحفظ، حاول مرة ثانية',
          respondedToast: 'تم تحديث حالة التقييم',
          respondError: 'تعذّر التحديث',
          save: 'حفظ التعديل',
          saving: 'جارٍ الحفظ...',
          markResponded: '✓ تم الرد',
        };
  const [text, setText] = useState(initialText);
  const [saving, startSave] = useTransition();
  const [responding, startRespond] = useTransition();
  const dirty = text !== initialText;

  async function onSave() {
    try {
      await saveDraftEdit(draftId, text);
      toast.success(labels.savedToast);
    } catch {
      toast.error(labels.saveError);
    }
  }

  async function onMarkResponded() {
    try {
      await markAsResponded(reviewId);
      toast.success(labels.respondedToast);
    } catch {
      toast.error(labels.respondError);
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
          {saving ? labels.saving : labels.save}
        </button>
        <button
          type="button"
          disabled={responding}
          onClick={() => startRespond(onMarkResponded)}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          {responding ? '...' : labels.markResponded}
        </button>
      </div>
    </div>
  );
}
