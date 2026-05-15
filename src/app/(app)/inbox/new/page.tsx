import Link from 'next/link';
import { ManualReviewForm } from '@/components/ManualReviewForm';

export default function NewReviewPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/inbox" className="mb-6 inline-block text-sm text-ink-600 hover:text-ink-900">
        ← الرجوع للصندوق
      </Link>
      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">
        إضافة تقييم جديد
      </h1>
      <p className="mb-6 text-sm text-ink-600">
        الصق نص التقييم وحدّد عدد النجوم. سنحلّله وننشئ مسودة رد جاهزة للنشر.
      </p>
      <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <ManualReviewForm />
      </div>
    </div>
  );
}
