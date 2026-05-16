import type { UiLocale } from '@/lib/locale';

type Status = 'pending' | 'drafted' | 'responded' | 'ignored';

const LABELS: Record<UiLocale, Record<Status, string>> = {
  ar: {
    pending: 'بانتظار التحليل',
    drafted: 'مسودة جاهزة',
    responded: 'تم الرد',
    ignored: 'متجاهَل',
  },
  en: {
    pending: 'Pending analysis',
    drafted: 'Draft ready',
    responded: 'Responded',
    ignored: 'Ignored',
  },
};

const CLASSES: Record<Status, string> = {
  pending: 'bg-ink-100 text-ink-600',
  drafted: 'bg-accent/10 text-accent-dark',
  responded: 'bg-emerald-50 text-emerald-700',
  ignored: 'bg-ink-50 text-ink-400 line-through',
};

export function StatusBadge({
  status,
  locale = 'ar',
}: {
  status: Status;
  locale?: UiLocale;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES[status]}`}
    >
      {LABELS[locale][status]}
    </span>
  );
}
