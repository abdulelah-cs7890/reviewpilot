'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Could wire to a telemetry hook here in a real app.
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <main dir="rtl" lang="ar" className="min-h-screen bg-ink-50 text-ink-800">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink-900">
          ReviewPilot
        </Link>
      </header>
      <section className="mx-auto max-w-md px-6 py-16 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">صار شيء غلط</h1>
        <p className="mb-6 text-ink-600">
          ما قدرنا نعرض هذه الصفحة الحين. جرّب تعيد المحاولة، أو ارجع لصندوق التقييمات.
        </p>
        {error.digest && (
          <p className="mb-6 font-mono text-xs text-ink-400">رمز الخطأ: {error.digest}</p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50 hover:bg-ink-800"
          >
            إعادة المحاولة
          </button>
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
