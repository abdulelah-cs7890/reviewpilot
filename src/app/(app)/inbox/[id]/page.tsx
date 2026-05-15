import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq, and, desc } from 'drizzle-orm';
import { db, reviews, restaurants, drafts } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { UrgencyBadge } from '@/components/inbox/UrgencyBadge';
import { SentimentTag } from '@/components/inbox/SentimentTag';
import { StatusBadge } from '@/components/inbox/StatusBadge';
import { DraftSwitcher } from '@/components/inbox/DraftSwitcher';
import { RegenerateButton } from '@/components/inbox/RegenerateButton';

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user } = await requireUser();

  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  const review = await db.query.reviews.findFirst({
    where: and(eq(reviews.id, id), eq(reviews.restaurantId, restaurant.id)),
  });
  if (!review) notFound();

  const allDrafts = await db.query.drafts.findMany({
    where: eq(drafts.reviewId, review.id),
    orderBy: [desc(drafts.generatedAt)],
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        ← الرجوع للصندوق
      </Link>

      {/* The review */}
      <section className="mb-6 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink-900">{review.authorName || 'مجهول'}</span>
          <span className="text-amber-500">
            {'★'.repeat(review.rating)}
            <span className="text-ink-200">{'★'.repeat(5 - review.rating)}</span>
          </span>
          <UrgencyBadge urgency={review.urgency} />
          <SentimentTag sentiment={review.sentiment} />
          <StatusBadge status={review.status} />
        </div>
        <p
          dir={review.language === 'en' ? 'ltr' : 'rtl'}
          className="whitespace-pre-wrap text-lg leading-relaxed text-ink-800"
        >
          {review.reviewText}
        </p>
        {review.topics && review.topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
            <span className="text-xs uppercase tracking-wider text-ink-400">الموضوعات</span>
            {review.topics.map((t) => (
              <span key={t} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs text-ink-600">
                {t}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* The draft(s) */}
      <section className="rounded-3xl border border-accent/30 bg-accent/5 p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm uppercase tracking-wider text-accent-dark">مسودة الرد</h2>
          <RegenerateButton reviewId={review.id} />
        </div>
        {allDrafts.length > 0 ? (
          <DraftSwitcher reviewId={review.id} drafts={allDrafts} />
        ) : (
          <p className="text-ink-600">لم يتم إنشاء مسودة بعد لهذا التقييم.</p>
        )}
      </section>
    </div>
  );
}
