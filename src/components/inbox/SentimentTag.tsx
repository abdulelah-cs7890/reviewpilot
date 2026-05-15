export function SentimentTag({ sentiment }: { sentiment: number | null }) {
  if (sentiment === null || sentiment === undefined) return null;
  let label: string;
  let cls: string;
  if (sentiment <= -1) {
    label = sentiment === -2 ? 'سلبي جداً' : 'سلبي';
    cls = 'bg-red-50 text-red-700';
  } else if (sentiment === 0) {
    label = 'محايد';
    cls = 'bg-ink-100 text-ink-600';
  } else {
    label = sentiment === 2 ? 'إيجابي جداً' : 'إيجابي';
    cls = 'bg-emerald-50 text-emerald-700';
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>{label}</span>
  );
}
