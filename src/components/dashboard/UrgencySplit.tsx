/**
 * Horizontal bar chart of review counts by urgency level.
 * Server-rendered SVG.
 */

export function UrgencySplit({
  high,
  medium,
  low,
}: {
  high: number;
  medium: number;
  low: number;
}) {
  const total = high + medium + low;
  if (total === 0) {
    return <p className="text-sm text-ink-500">لا توجد بيانات.</p>;
  }
  const max = Math.max(high, medium, low, 1);
  const rows = [
    { key: 'high', label: 'عاجل', value: high, color: '#dc2626' },
    { key: 'medium', label: 'مهم', value: medium, color: '#d97706' },
    { key: 'low', label: 'عادي', value: low, color: '#a8a597' },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const pct = (row.value / max) * 100;
        return (
          <div key={row.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-ink-700">{row.label}</span>
              <span className="text-ink-500">
                {row.value} ({total > 0 ? Math.round((row.value / total) * 100) : 0}%)
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: row.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
