type Urgency = 'low' | 'medium' | 'high' | null | undefined;

const styles: Record<NonNullable<Urgency>, { label: string; cls: string }> = {
  high: { label: 'عاجل', cls: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  medium: { label: 'مهم', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  low: { label: 'عادي', cls: 'bg-ink-100 text-ink-600' },
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  if (!urgency) return null;
  const s = styles[urgency];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
