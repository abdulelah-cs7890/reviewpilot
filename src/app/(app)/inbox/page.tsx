import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, sql, desc } from 'drizzle-orm';
import { db, restaurants, reviews } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { UrgencyBadge } from '@/components/inbox/UrgencyBadge';
import { SentimentTag } from '@/components/inbox/SentimentTag';
import { StatusBadge } from '@/components/inbox/StatusBadge';

const SNIPPET_LEN = 140;

export default async function InboxPage() {
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.restaurantId, restaurant.id))
    .orderBy(
      sql`CASE ${reviews.urgency} WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END`,
      desc(reviews.postedAt)
    );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">صندوق التقييمات</h1>
          <p className="mt-1 text-sm text-ink-600">{rows.length} تقييم</p>
        </div>
        <Link
          href="/inbox/new"
          className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50 hover:bg-ink-800"
        >
          + إضافة تقييم
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-ink-600">ما عندك تقييمات بعد.</p>
          <p className="mt-2 text-sm text-ink-500">
            أضف تقييمك الأول بالضغط على{' '}
            <Link href="/inbox/new" className="text-accent-dark underline">
              إضافة تقييم
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Link
                href={`/inbox/${r.id}`}
                className="block rounded-2xl border border-ink-100 bg-white p-5 transition hover:border-ink-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink-900">
                        {r.authorName || 'مجهول'}
                      </span>
                      <span className="text-amber-500">
                        {'★'.repeat(r.rating)}
                        <span className="text-ink-200">{'★'.repeat(5 - r.rating)}</span>
                      </span>
                      <UrgencyBadge urgency={r.urgency} />
                      <SentimentTag sentiment={r.sentiment} />
                      <StatusBadge status={r.status} />
                    </div>
                    <p
                      dir={r.language === 'en' ? 'ltr' : 'rtl'}
                      className="text-ink-700"
                    >
                      {r.reviewText.length > SNIPPET_LEN
                        ? r.reviewText.slice(0, SNIPPET_LEN) + '…'
                        : r.reviewText}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-ink-400">
                    {formatRelative(r.postedAt)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days === 0) return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.floor(days / 7)} أسابيع`;
  return `قبل ${Math.floor(days / 30)} شهور`;
}
