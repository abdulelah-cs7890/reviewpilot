import type { UiLocale } from '@/lib/locale';

const LABELS: Record<UiLocale, { vneg: string; neg: string; neutral: string; pos: string; vpos: string }> = {
  ar: {
    vneg: 'سلبي جداً',
    neg: 'سلبي',
    neutral: 'محايد',
    pos: 'إيجابي',
    vpos: 'إيجابي جداً',
  },
  en: {
    vneg: 'Very negative',
    neg: 'Negative',
    neutral: 'Neutral',
    pos: 'Positive',
    vpos: 'Very positive',
  },
};

export function SentimentTag({
  sentiment,
  locale = 'ar',
}: {
  sentiment: number | null;
  locale?: UiLocale;
}) {
  if (sentiment === null || sentiment === undefined) return null;
  const t = LABELS[locale];
  let label: string;
  let cls: string;
  if (sentiment <= -1) {
    label = sentiment === -2 ? t.vneg : t.neg;
    cls = 'bg-red-50 text-red-700';
  } else if (sentiment === 0) {
    label = t.neutral;
    cls = 'bg-ink-100 text-ink-600';
  } else {
    label = sentiment === 2 ? t.vpos : t.pos;
    cls = 'bg-emerald-50 text-emerald-700';
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>
  );
}
