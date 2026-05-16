import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, and, sql, desc } from 'drizzle-orm';
import { db, restaurants, reviews, drafts } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { getUiLocale, dirFor } from '@/lib/locale';
import { appCopy } from '@/lib/app-copy';
import { normalizeAuthorName } from '@/lib/customer-name';
import { StarRating } from '@/components/inbox/StarRating';
import { SentimentTag } from '@/components/inbox/SentimentTag';
import { UrgencyBadge } from '@/components/inbox/UrgencyBadge';

export default async function CustomerTimelinePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const decoded = decodeURIComponent(name);
  const normalized = normalizeAuthorName(decoded);

  const { user } = await requireUser();
  const locale = await getUiLocale();
  const t = appCopy[locale];

  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  // Match by case-insensitive trimmed author name. Author names with no
  // text (null) don't appear because we don't link them in the inbox.
  const rows = await db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.restaurantId, restaurant.id),
        sql`lower(trim(${reviews.authorName})) = ${normalized}`
      )
    )
    .orderBy(desc(reviews.postedAt));

  // Per-row latest-draft lookup. N is small (one customer's history); skip
  // a complex CTE for clarity.
  const enriched = await Promise.all(
    rows.map(async (review) => {
      const draft = await db.query.drafts.findFirst({
        where: eq(drafts.reviewId, review.id),
        orderBy: [desc(drafts.generatedAt)],
      });
      return {
        review,
        draftText: draft ? draft.editedText ?? draft.draftText : null,
        draftLanguage: draft?.language ?? null,
      };
    })
  );

  // Aggregate stats
  const total = enriched.length;
  const avgRating =
    total === 0
      ? 0
      : enriched.reduce((sum, e) => sum + e.review.rating, 0) / total;
  const lastVisit =
    total === 0
      ? null
      : Math.floor(
          (Date.now() - new Date(enriched[0].review.postedAt).getTime()) /
            (24 * 60 * 60 * 1000)
        );

  // Display name: use the casing from the most recent review, not the URL slug
  const displayName = enriched[0]?.review.authorName ?? decoded;

  const labels =
    locale === 'en'
      ? {
          back: '← Back to inbox',
          stats: (n: number, avg: number, days: number | null) =>
            `${n} ${n === 1 ? 'review' : 'reviews'} · avg ${avg.toFixed(1)} ★${
              days !== null ? ` · last visit ${days} days ago` : ''
            }`,
          empty: 'No reviews from this customer.',
          replyHeading: 'Reply',
          noReply: 'No reply drafted',
        }
      : {
          back: '← الرجوع للصندوق',
          stats: (n: number, avg: number, days: number | null) =>
            `${n} تقييم · بمتوسط ${avg.toFixed(1)} ★${
              days !== null ? ` · آخر زيارة قبل ${days} يوم` : ''
            }`,
          empty: 'لا توجد تقييمات من هذا العميل.',
          replyHeading: 'الرد',
          noReply: 'لا يوجد رد',
        };

  return (
    <div dir={dirFor(locale)} className="mx-auto max-w-3xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        {labels.back}
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
          {displayName}
        </h1>
        {total > 0 && (
          <p className="mt-2 text-sm text-ink-600">
            {labels.stats(total, avgRating, lastVisit)}
          </p>
        )}
      </header>

      {enriched.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-8 text-center text-ink-500">
          {labels.empty}
        </p>
      ) : (
        <ol className="space-y-4">
          {enriched.map((entry) => (
            <li key={entry.review.id}>
              <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/inbox/${entry.review.id}`}
                    className="text-sm font-medium text-ink-900 hover:text-accent-dark"
                  >
                    {entry.review.postedAt.toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Link>
                  <StarRating rating={entry.review.rating} />
                  <UrgencyBadge urgency={entry.review.urgency} locale={locale} />
                  <SentimentTag sentiment={entry.review.sentiment} locale={locale} />
                </div>

                <p
                  dir={entry.review.language === 'en' ? 'ltr' : 'rtl'}
                  className="text-ink-800"
                >
                  {entry.review.reviewText}
                </p>

                <div className="mt-3 rounded-xl border border-accent/20 bg-accent/5 p-3">
                  <p className="mb-1 text-xs uppercase tracking-wider text-accent-dark">
                    {labels.replyHeading}
                  </p>
                  {entry.draftText ? (
                    <p
                      dir={entry.draftLanguage === 'en' ? 'ltr' : 'rtl'}
                      className="text-sm text-ink-700"
                    >
                      {entry.draftText}
                    </p>
                  ) : (
                    <p className="text-sm italic text-ink-400">{labels.noReply}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
