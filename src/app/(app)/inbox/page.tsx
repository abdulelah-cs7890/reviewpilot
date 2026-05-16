import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, sql, desc, and, gte, lte, type SQL } from 'drizzle-orm';
import { db, restaurants, reviews } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { getUiLocale } from '@/lib/locale';
import { appCopy } from '@/lib/app-copy';
import { UrgencyBadge } from '@/components/inbox/UrgencyBadge';
import { SentimentTag } from '@/components/inbox/SentimentTag';
import { StatusBadge } from '@/components/inbox/StatusBadge';
import { InboxFilters } from '@/components/inbox/InboxFilters';
import { WelcomeBanner } from '@/components/inbox/WelcomeBanner';
import { StarRating } from '@/components/inbox/StarRating';
import { customerHref } from '@/lib/customer-name';

const SNIPPET_LEN = 140;

const URGENCY_VALUES = new Set(['high', 'medium', 'low']);
const LANGUAGE_VALUES = new Set(['ar', 'en', 'mixed']);
const STATUS_VALUES = new Set(['pending', 'drafted', 'responded', 'ignored']);

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user, isDemo } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  const locale = await getUiLocale();
  const t = appCopy[locale];

  const sp = await searchParams;
  const urgency = typeof sp.urgency === 'string' && URGENCY_VALUES.has(sp.urgency) ? sp.urgency : null;
  const sentiment = typeof sp.sentiment === 'string' ? sp.sentiment : null;
  const language = typeof sp.language === 'string' && LANGUAGE_VALUES.has(sp.language) ? sp.language : null;
  const status = typeof sp.status === 'string' && STATUS_VALUES.has(sp.status) ? sp.status : null;

  const conditions: SQL[] = [eq(reviews.restaurantId, restaurant.id)];
  if (urgency) conditions.push(sql`${reviews.urgency} = ${urgency}`);
  if (language) conditions.push(sql`${reviews.language} = ${language}`);
  if (status) conditions.push(sql`${reviews.status} = ${status}`);
  if (sentiment === 'positive') conditions.push(gte(reviews.sentiment, 1));
  if (sentiment === 'negative') conditions.push(lte(reviews.sentiment, -1));
  if (sentiment === 'neutral') conditions.push(eq(reviews.sentiment, 0));

  const rows = await db
    .select()
    .from(reviews)
    .where(and(...conditions))
    .orderBy(
      sql`CASE ${reviews.urgency} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
      desc(reviews.postedAt)
    );

  const totalCount = await db.$count(reviews, eq(reviews.restaurantId, restaurant.id));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {t.inbox.title}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {t.inbox.countWith(rows.length, totalCount)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/inbox/bulk"
            className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100"
          >
            {locale === 'en' ? '+ Bulk add' : '+ إضافة دفعة'}
          </Link>
          <Link
            href="/inbox/new"
            className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50 hover:bg-ink-800"
          >
            {t.inbox.addBtn}
          </Link>
        </div>
      </div>

      <WelcomeBanner isDemo={isDemo} t={t.welcomeBanner} />

      <div className="mb-6 rounded-2xl border border-ink-100 bg-white p-4">
        <InboxFilters t={t.filters} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-ink-600">{t.inbox.emptyTitle}</p>
          <p className="mt-2 text-sm text-ink-500">
            {t.inbox.emptyHint}{' '}
            <Link href="/inbox/new" className="text-accent-dark underline">
              {t.inbox.emptyCta}
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const urgencyBorder =
              r.urgency === 'high'
                ? 'border-s-4 border-s-red-400'
                : r.urgency === 'medium'
                  ? 'border-s-4 border-s-amber-400'
                  : '';
            const authorHref = r.authorName ? customerHref(r.authorName) : null;
            return (
              <li
                key={r.id}
                className={`group relative rounded-2xl border border-ink-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-md ${urgencyBorder}`}
              >
                {/* Whole-card click target — sits BEHIND the inner content so
                    nested Links (author → /customer) still receive clicks. */}
                <Link
                  href={`/inbox/${r.id}`}
                  aria-label={`Open review by ${r.authorName ?? 'anonymous'}`}
                  className="absolute inset-0 z-0 rounded-2xl"
                />
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {r.authorName && authorHref ? (
                        <Link
                          href={authorHref}
                          className="text-sm font-medium text-ink-900 hover:text-accent-dark hover:underline"
                        >
                          {r.authorName}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-ink-900">
                          {r.authorName || t.inbox.anonymous}
                        </span>
                      )}
                      <StarRating rating={r.rating} />
                      <UrgencyBadge urgency={r.urgency} locale={locale} />
                      <SentimentTag sentiment={r.sentiment} locale={locale} />
                      <StatusBadge status={r.status} locale={locale} />
                    </div>
                    <p
                      dir={r.language === 'en' ? 'ltr' : 'rtl'}
                      className="pointer-events-none text-ink-700"
                    >
                      {r.reviewText.length > SNIPPET_LEN
                        ? r.reviewText.slice(0, SNIPPET_LEN) + '…'
                        : r.reviewText}
                    </p>
                  </div>
                  <time className="pointer-events-none shrink-0 text-xs text-ink-400">
                    {formatRelative(r.postedAt, t.time)}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatRelative(date: Date, t: (typeof appCopy)['ar']['time']): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return t.today;
  if (days === 1) return t.yesterday;
  if (days < 7) return t.daysAgo(days);
  if (days < 30) return t.weeksAgo(Math.floor(days / 7));
  return t.monthsAgo(Math.floor(days / 30));
}
