import type { UiLocale } from '@/lib/locale';

type Urgency = 'low' | 'medium' | 'high' | null | undefined;

const LABELS: Record<UiLocale, Record<NonNullable<Urgency>, string>> = {
  ar: { high: 'عاجل', medium: 'مهم', low: 'عادي' },
  en: { high: 'Urgent', medium: 'Important', low: 'Normal' },
};

const CLASSES: Record<NonNullable<Urgency>, string> = {
  high: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  medium: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  low: 'bg-ink-100 text-ink-600',
};

export function UrgencyBadge({
  urgency,
  locale = 'ar',
}: {
  urgency: Urgency;
  locale?: UiLocale;
}) {
  if (!urgency) return null;
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${CLASSES[urgency]}`}
    >
      {LABELS[locale][urgency]}
    </span>
  );
}
