export function StatCard({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'default' | 'positive' | 'negative' | 'warn';
}) {
  const toneCls: Record<typeof tone, string> = {
    default: 'text-ink-900',
    positive: 'text-emerald-700',
    negative: 'text-red-700',
    warn: 'text-amber-700',
  } as const;
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <p className="mb-2 text-xs uppercase tracking-wider text-ink-400">{label}</p>
      <p className={`text-3xl font-semibold tracking-tight ${toneCls[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
    </div>
  );
}
