import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db, restaurants } from '@/db';
import { getUiLocale } from '@/lib/locale';
import { requireUser } from '@/lib/auth-utils';
import { countOwnerEdits } from '@/ai/owner-edits';
import { StreamingManualReviewForm } from '@/components/StreamingManualReviewForm';

export default async function NewReviewPage() {
  const locale = await getUiLocale();
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  const editsCount = restaurant ? await countOwnerEdits(restaurant.id) : 0;

  const copy =
    locale === 'en'
      ? {
          back: '← Back to inbox',
          title: 'Add a new review',
          sub: 'Paste the review text and pick the stars. The AI will analyze and draft a reply you can post.',
        }
      : {
          back: '← الرجوع للصندوق',
          title: 'إضافة تقييم جديد',
          sub: 'الصق نص التقييم وحدّد عدد النجوم. سنحلّله وننشئ مسودة رد جاهزة للنشر.',
        };

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        {copy.back}
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">
        {copy.title}
      </h1>
      <p className="mb-6 text-sm text-ink-600">{copy.sub}</p>
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <StreamingManualReviewForm locale={locale} editsCount={editsCount} />
      </div>
    </div>
  );
}
