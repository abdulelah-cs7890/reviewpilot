import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, restaurants } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { getUiLocale } from '@/lib/locale';
import { CsvImportForm } from '@/components/inbox/CsvImportForm';

export default async function ImportPage() {
  const { user } = await requireUser();
  const locale = await getUiLocale();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  const labels =
    locale === 'en'
      ? {
          back: '← Back to inbox',
          title: 'Import reviews from CSV',
          sub: 'Bring your real GBP reviews into ReviewPilot. The analyzer runs on each row so the inbox shows real sentiment, topics, urgency and severity. Drafts are not generated automatically — you pick which historical reviews to draft replies for.',
        }
      : {
          back: '← الرجوع للصندوق',
          title: 'استيراد تقييمات من CSV',
          sub: 'اجلب تقييماتك الحقيقية إلى ReviewPilot. المحلّل يشتغل على كل صف عشان الصندوق يعرض المشاعر والمواضيع والإلحاح بشكل صحيح. المسودات ما تُنشأ تلقائياً — أنت تختار أي تقييم سابق تكتب له ردًا.',
        };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        {labels.back}
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">
        {labels.title}
      </h1>
      <p className="mb-6 text-sm text-ink-600">{labels.sub}</p>
      <CsvImportForm locale={locale} />
    </div>
  );
}
