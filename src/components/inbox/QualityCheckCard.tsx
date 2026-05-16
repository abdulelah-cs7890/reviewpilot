import type { QualityCheckResult } from '@/db';

/**
 * Inline AI quality-check display. Server-rendered, no client JS.
 * Returns null if no check was generated (best-effort failure or pre-Phase-4
 * legacy draft).
 */
export function QualityCheckCard({ check }: { check: QualityCheckResult | null }) {
  if (!check) return null;

  const score = Math.max(0, Math.min(100, Math.round(check.overallScore)));
  const tone =
    score >= 80 ? 'positive' : score >= 50 ? 'neutral' : 'warn';
  const toneCls = {
    positive: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
    warn: 'bg-amber-50 text-amber-800 ring-amber-200',
  }[tone];

  return (
    <div
      className="mt-4 rounded-2xl border border-ink-100 bg-white/70 p-4"
      dir={check.language === 'en' ? 'ltr' : 'rtl'}
      lang={check.language}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-ink-500">
          {check.language === 'en' ? 'AI quality check' : 'تقييم جودة الرد'}
        </span>
        <span
          className={`rounded-full px-3 py-0.5 text-sm font-medium ring-1 ${toneCls}`}
        >
          {score}/100
        </span>
      </div>

      {check.checks.length === 0 ? (
        <p className="text-sm text-ink-500">
          {check.language === 'en'
            ? 'No concrete issues raised — score reflects warmth and specificity.'
            : 'لا توجد ملاحظات محددة — التقييم يعكس الدفء والتفاعل مع كلام العميل.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {check.checks.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span
                className={
                  c.addressed
                    ? 'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700'
                    : 'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700'
                }
                aria-hidden="true"
              >
                {c.addressed ? '✓' : '✗'}
              </span>
              <div className="min-w-0">
                <span className={c.addressed ? 'text-ink-800' : 'text-ink-900 font-medium'}>
                  {c.issue}
                </span>
                {!c.addressed && c.note && (
                  <span className="ms-2 text-xs text-ink-500">— {c.note}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
