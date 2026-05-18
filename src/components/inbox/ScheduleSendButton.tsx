'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Clock, X } from 'lucide-react';
import { scheduleDraftAction, cancelScheduleAction } from '@/app/(app)/inbox/actions';

interface Labels {
  schedule: string;
  scheduling: string;
  scheduledFor: (when: string) => string;
  cancel: string;
  pickTime: string;
  save: string;
  pastError: string;
  successToast: string;
  cancelToast: string;
  unauthorizedError: string;
  invalidDateError: string;
}

const LABELS: Record<'ar' | 'en', Labels> = {
  ar: {
    schedule: '⏱ جدولة',
    scheduling: 'جارٍ الحفظ...',
    scheduledFor: (when) => `مجدوَل لـ ${when}`,
    cancel: 'إلغاء الجدولة',
    pickTime: 'اختر وقت النشر',
    save: 'جدوَل',
    pastError: 'الوقت يجب أن يكون مستقبلي',
    successToast: 'تمت جدولة الرد',
    cancelToast: 'تم إلغاء الجدولة',
    unauthorizedError: 'غير مصرّح به',
    invalidDateError: 'تاريخ غير صالح',
  },
  en: {
    schedule: '⏱ Schedule',
    scheduling: 'Saving...',
    scheduledFor: (when) => `Scheduled for ${when}`,
    cancel: 'Cancel schedule',
    pickTime: 'Pick a publish time',
    save: 'Schedule',
    pastError: 'Time must be in the future',
    successToast: 'Reply scheduled',
    cancelToast: 'Schedule cancelled',
    unauthorizedError: 'Not authorized',
    invalidDateError: 'Invalid date',
  },
};

export function ScheduleSendButton({
  draftId,
  scheduledFor,
  locale = 'ar',
}: {
  draftId: string;
  scheduledFor: Date | null;
  locale?: 'ar' | 'en';
}) {
  const t = LABELS[locale];
  const [isOpen, setIsOpen] = useState(false);
  const [when, setWhen] = useState('');
  const [pending, startTransition] = useTransition();

  if (scheduledFor) {
    const formatted = new Date(scheduledFor).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
        <Clock className="h-3 w-3" />
        <span>{t.scheduledFor(formatted)}</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await cancelScheduleAction(draftId);
              if (res.ok) toast.success(t.cancelToast);
              else toast.error(t.unauthorizedError);
            })
          }
          className="inline-flex items-center gap-1 text-xs text-amber-700 underline hover:text-amber-900 disabled:opacity-50"
        >
          <X className="h-3 w-3" />
          {t.cancel}
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100"
      >
        {t.schedule}
      </button>
    );
  }

  function onSave() {
    if (!when) return;
    startTransition(async () => {
      const res = await scheduleDraftAction(draftId, when);
      if (res.ok) {
        toast.success(t.successToast);
        setIsOpen(false);
        setWhen('');
      } else if (res.reason === 'past-date') {
        toast.error(t.pastError);
      } else if (res.reason === 'invalid-date') {
        toast.error(t.invalidDateError);
      } else {
        toast.error(t.unauthorizedError);
      }
    });
  }

  // Default to tomorrow at 9am local
  const defaultWhen = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    // datetime-local format: yyyy-mm-ddThh:mm
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 bg-white p-2">
      <Clock className="h-4 w-4 text-ink-500" />
      <label className="sr-only" htmlFor={`schedule-${draftId}`}>
        {t.pickTime}
      </label>
      <input
        id={`schedule-${draftId}`}
        type="datetime-local"
        value={when || defaultWhen}
        onChange={(e) => setWhen(e.target.value)}
        disabled={pending}
        className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-sm text-ink-900 focus:border-accent focus:outline-none"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={pending}
        className="rounded-lg bg-ink-900 px-3 py-1 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-50"
      >
        {pending ? t.scheduling : t.save}
      </button>
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          setWhen('');
        }}
        disabled={pending}
        className="text-xs text-ink-500 hover:text-ink-900 disabled:opacity-50"
      >
        ×
      </button>
    </div>
  );
}
