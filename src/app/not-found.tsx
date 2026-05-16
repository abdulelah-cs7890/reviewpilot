import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <main dir="rtl" lang="ar" className="min-h-screen bg-ink-50 text-ink-800">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink-900">
          ReviewPilot
        </Link>
      </header>
      <section className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-ink-900">٤٠٤</h1>
        <p className="mb-6 text-ink-600">الصفحة اللي تدوّر عليها مو موجودة.</p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800"
          >
            الرئيسية
          </Link>
          <Link
            href="/inbox"
            className="rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm text-ink-700 hover:bg-ink-100"
          >
            صندوق التقييمات
          </Link>
        </div>
      </section>
    </main>
  );
}
