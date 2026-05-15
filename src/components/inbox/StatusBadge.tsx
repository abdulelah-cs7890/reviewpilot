type Status = 'pending' | 'drafted' | 'responded' | 'ignored';

const styles: Record<Status, { label: string; cls: string }> = {
  pending: { label: 'بانتظار التحليل', cls: 'bg-ink-100 text-ink-600' },
  drafted: { label: 'مسودة جاهزة', cls: 'bg-accent/10 text-accent-dark' },
  responded: { label: 'تم الرد', cls: 'bg-emerald-50 text-emerald-700' },
  ignored: { label: 'متجاهَل', cls: 'bg-ink-50 text-ink-400 line-through' },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = styles[status];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
