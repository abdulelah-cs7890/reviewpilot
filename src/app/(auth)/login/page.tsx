import Link from 'next/link';
import { MagicLinkForm } from '@/components/auth/MagicLinkForm';
import { DemoButton } from '@/components/auth/DemoButton';

export default function LoginPage() {
  return (
    <main dir="rtl" lang="ar" className="min-h-screen bg-ink-50 text-ink-800">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink-900">
          ReviewPilot
        </Link>
      </header>

      <section className="mx-auto max-w-md px-6 py-12">
        <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">
            تسجيل الدخول
          </h1>
          <p className="mb-6 text-sm text-ink-600">
            سنرسل لك رابطاً سحرياً، اضغط عليه ودخّل مباشرة.
          </p>

          <MagicLinkForm />

          <div className="my-6 flex items-center gap-3 text-xs text-ink-400">
            <span className="h-px flex-1 bg-ink-100" />
            <span>أو</span>
            <span className="h-px flex-1 bg-ink-100" />
          </div>

          <DemoButton />

          <p className="mt-4 text-center text-xs text-ink-500">
            العرض التجريبي يدخلك على مطعم تجريبي محمّل مسبقاً بتقييمات وردود.
          </p>
        </div>
      </section>
    </main>
  );
}
