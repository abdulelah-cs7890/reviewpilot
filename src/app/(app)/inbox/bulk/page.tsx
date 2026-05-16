import Link from 'next/link';
import { getUiLocale } from '@/lib/locale';
import { BulkPasteForm } from '@/components/BulkPasteForm';

export default async function BulkPastePage() {
  const locale = await getUiLocale();
  const copy =
    locale === 'en'
      ? {
          back: '← Back to inbox',
          title: 'Bulk add reviews',
          sub: 'Paste multiple reviews at once. They\'ll be analyzed and drafted sequentially.',
        }
      : {
          back: '← الرجوع للصندوق',
          title: 'إضافة دفعة تقييمات',
          sub: 'الصق عدة تقييمات دفعة واحدة. سيتم تحليلها وكتابة مسوداتها بالتتابع.',
        };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        {copy.back}
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">
        {copy.title}
      </h1>
      <p className="mb-6 text-sm text-ink-600">{copy.sub}</p>
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <BulkPasteForm locale={locale} />
      </div>
    </div>
  );
}
