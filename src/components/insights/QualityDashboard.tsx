import Link from 'next/link';
import { eq, desc, sql, and, isNotNull } from 'drizzle-orm';
import { db, drafts, reviews, type QualityCheckResult } from '@/db';
import { TrendingUp, AlertCircle, Hash } from 'lucide-react';

const LABELS = {
  ar: {
    coverage: (scored: number, total: number) => `${scored} من ${total} مسودة لها تقييم جودة`,
    emptyHeading: 'لا توجد بيانات جودة بعد',
    emptySub:
      'بمجرد ما تُنشأ مسودات في الصندوق، الذكاء الاصطناعي يقيّم كل مسودة (٠–١٠٠) ويظهر الأرقام هنا.',
    distHeading: 'توزيع الدرجات',
    distSub: 'كم مسودة في كل شريحة من ١٠٠ نقطة',
    lowHeading: 'مسودات بحاجة لتحسين',
    lowSub: 'أحدث ١٠ مسودات بدرجة أقل من ٧٠، مع المشاكل التي فاتت',
    topIssuesHeading: 'المشاكل الأكثر تكراراً',
    topIssuesSub: 'المشاكل اللي المسوّد ما تطرّق لها — مع تكرارها عبر المسودات',
    noLow: 'كل المسودات الحديثة درجتها ≥ ٧٠. ممتاز.',
    noIssues: 'ما فيه مشاكل متكررة — كل مسودة عالجت ما طُرح فيها.',
    issueLabel: 'المشكلة',
    countLabel: 'مرات',
    addressed: 'تم تناولها',
    missed: 'لم تُعالج',
    viewReview: 'افتح التقييم',
    mean: 'متوسط',
    min: 'أدنى',
    max: 'أعلى',
  },
  en: {
    coverage: (scored: number, total: number) => `${scored} of ${total} drafts have a quality score`,
    emptyHeading: 'No quality data yet',
    emptySub:
      'Once drafts are generated in the inbox, the AI grades each one (0–100) and the numbers show up here.',
    distHeading: 'Score distribution',
    distSub: 'How many drafts fall into each 10-point bucket',
    lowHeading: 'Drafts needing attention',
    lowSub: '10 most recent drafts scoring under 70, with the issues that were missed',
    topIssuesHeading: 'Most-recurring missed issues',
    topIssuesSub:
      "Issues the meta-grader flagged as not addressed — grouped across drafts, ordered by frequency",
    noLow: 'All recent drafts score ≥ 70. Nice.',
    noIssues: "No recurring unaddressed issues — every flagged issue got addressed in its draft.",
    issueLabel: 'Issue',
    countLabel: 'times',
    addressed: 'addressed',
    missed: 'missed',
    viewReview: 'Open review',
    mean: 'mean',
    min: 'min',
    max: 'max',
  },
};

interface DraftWithReview {
  draftId: string;
  draftText: string;
  qualityCheck: QualityCheckResult | null;
  generatedAt: Date;
  reviewId: string;
  reviewText: string;
  reviewRating: number;
}

export async function QualityDashboard({
  restaurantId,
  locale,
}: {
  restaurantId: string;
  locale: 'ar' | 'en';
}) {
  const t = LABELS[locale];

  const rows = await db
    .select({
      draftId: drafts.id,
      draftText: drafts.draftText,
      qualityCheck: drafts.qualityCheck,
      generatedAt: drafts.generatedAt,
      reviewId: reviews.id,
      reviewText: reviews.reviewText,
      reviewRating: reviews.rating,
    })
    .from(drafts)
    .innerJoin(reviews, eq(drafts.reviewId, reviews.id))
    .where(eq(reviews.restaurantId, restaurantId));

  const all: DraftWithReview[] = rows.map((r) => ({
    ...r,
    qualityCheck: r.qualityCheck as QualityCheckResult | null,
  }));
  const scored = all.filter((r) => r.qualityCheck && typeof r.qualityCheck.overallScore === 'number');

  if (scored.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center">
        <BarEmpty />
        <h2 className="mt-4 text-lg font-medium text-ink-900">{t.emptyHeading}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{t.emptySub}</p>
      </div>
    );
  }

  // Histogram: 10 buckets
  const buckets: number[] = new Array(10).fill(0);
  for (const r of scored) {
    const s = r.qualityCheck!.overallScore;
    const idx = Math.min(9, Math.max(0, Math.floor(s / 10)));
    buckets[idx]++;
  }
  const maxCount = Math.max(...buckets, 1);
  const mean = Math.round(
    (scored.reduce((sum, r) => sum + r.qualityCheck!.overallScore, 0) / scored.length) * 10
  ) / 10;
  const min = Math.min(...scored.map((r) => r.qualityCheck!.overallScore));
  const max = Math.max(...scored.map((r) => r.qualityCheck!.overallScore));

  // Low-scoring recent drafts
  const lowDrafts = scored
    .filter((r) => r.qualityCheck!.overallScore < 70)
    .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
    .slice(0, 10);

  // Top recurring missed issues
  const issueCounts = new Map<string, number>();
  for (const r of scored) {
    for (const c of r.qualityCheck!.checks) {
      if (!c.addressed) {
        const key = c.issue.trim().toLowerCase();
        issueCounts.set(key, (issueCounts.get(key) ?? 0) + 1);
      }
    }
  }
  const topIssues = [...issueCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-600">{t.coverage(scored.length, all.length)}</p>

      {/* Distribution */}
      <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent-dark" />
          <h2 className="text-sm font-medium text-ink-900">{t.distHeading}</h2>
        </header>
        <p className="mb-4 text-xs text-ink-500">{t.distSub}</p>

        <div className="flex items-end gap-1 sm:gap-2" dir="ltr">
          {buckets.map((count, i) => {
            const heightPct = (count / maxCount) * 100;
            const low = i * 10;
            const high = i === 9 ? 100 : i * 10 + 9;
            const fillClass =
              low >= 80
                ? 'bg-emerald-500'
                : low >= 60
                  ? 'bg-emerald-300'
                  : low >= 40
                    ? 'bg-amber-300'
                    : 'bg-red-400';
            return (
              <div key={i} className="flex flex-1 flex-col items-center">
                <div
                  className="relative flex w-full items-end justify-center"
                  style={{ height: 120 }}
                  title={`${low}-${high}: ${count}`}
                >
                  <div
                    className={`w-full rounded-t-md ${fillClass} transition-all`}
                    style={{ height: count === 0 ? 0 : `${Math.max(4, heightPct)}%` }}
                  />
                  {count > 0 && (
                    <span
                      className="absolute -top-5 text-[10px] font-medium text-ink-700"
                      style={{ lineHeight: 1 }}
                    >
                      {count}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[10px] tracking-tight text-ink-400">
                  {low}-{high}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
          <span>
            <strong className="font-medium text-ink-700">{t.mean}:</strong> {mean}
          </span>
          <span>
            <strong className="font-medium text-ink-700">{t.min}:</strong> {min}
          </span>
          <span>
            <strong className="font-medium text-ink-700">{t.max}:</strong> {max}
          </span>
        </div>
      </section>

      {/* Top recurring issues */}
      <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-2 flex items-center gap-2">
          <Hash className="h-4 w-4 text-accent-dark" />
          <h2 className="text-sm font-medium text-ink-900">{t.topIssuesHeading}</h2>
        </header>
        <p className="mb-4 text-xs text-ink-500">{t.topIssuesSub}</p>
        {topIssues.length === 0 ? (
          <p className="rounded-2xl bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
            {t.noIssues}
          </p>
        ) : (
          <ul className="space-y-2">
            {topIssues.map(([issue, count], i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/40 px-4 py-2 text-sm"
              >
                <span
                  className="text-ink-800"
                  dir={/[؀-ۿ]/.test(issue) ? 'rtl' : 'ltr'}
                >
                  {issue}
                </span>
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {count}× {t.countLabel}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Low-scoring drafts */}
      <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-accent-dark" />
          <h2 className="text-sm font-medium text-ink-900">{t.lowHeading}</h2>
        </header>
        <p className="mb-4 text-xs text-ink-500">{t.lowSub}</p>
        {lowDrafts.length === 0 ? (
          <p className="rounded-2xl bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
            {t.noLow}
          </p>
        ) : (
          <ul className="space-y-3">
            {lowDrafts.map((d) => (
              <li
                key={d.draftId}
                className="rounded-2xl border border-ink-100 bg-ink-50/30 p-4 text-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      d.qualityCheck!.overallScore < 40
                        ? 'bg-red-100 text-red-700'
                        : d.qualityCheck!.overallScore < 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {d.qualityCheck!.overallScore}/100
                  </span>
                  <span className="text-xs text-ink-500">
                    {'★'.repeat(d.reviewRating)}
                  </span>
                  <Link
                    href={`/inbox/${d.reviewId}`}
                    className="ms-auto text-xs text-accent-dark hover:underline"
                  >
                    {t.viewReview} →
                  </Link>
                </div>
                <p
                  dir={/[؀-ۿ]/.test(d.reviewText) ? 'rtl' : 'ltr'}
                  className="mb-2 line-clamp-2 text-xs text-ink-600"
                >
                  {d.reviewText}
                </p>
                {d.qualityCheck!.checks.length > 0 && (
                  <ul className="space-y-1">
                    {d.qualityCheck!.checks
                      .filter((c) => !c.addressed)
                      .slice(0, 4)
                      .map((c, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs"
                          dir={/[؀-ۿ]/.test(c.issue) ? 'rtl' : 'ltr'}
                        >
                          <span className="mt-0.5 text-red-600">✗</span>
                          <span className="text-ink-700">{c.issue}</span>
                          {c.note && (
                            <span className="text-ink-400">— {c.note}</span>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BarEmpty() {
  return (
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink-100">
      <BarChart3Small />
    </div>
  );
}
function BarChart3Small() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-500">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

// Silence unused-binding warnings on imports that may not be used in some code paths.
void desc;
void sql;
void and;
void isNotNull;
