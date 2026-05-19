import Link from 'next/link';
import { copy, type Locale } from '@/lib/copy';
import { WaitlistForm } from './WaitlistForm';
import { DemoButton } from './auth/DemoButton';

export function LandingPage({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const otherLocaleHref = locale === 'ar' ? '/en' : '/';

  return (
    <main dir={dir} lang={locale} className="min-h-screen bg-ink-50 text-ink-800">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-lg font-semibold tracking-tight text-ink-900">ReviewPilot</div>
        <nav className="flex items-center gap-6 text-sm text-ink-600">
          <Link href={otherLocaleHref} className="hover:text-ink-900">
            {t.nav.switchLang}
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-20 text-center sm:pt-24">
        <p className="mb-4 inline-block rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs text-accent-dark">
          {t.hero.eyebrow}
        </p>
        <h1 className="mx-auto max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-ink-900 sm:text-5xl">
          {t.hero.title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-600">
          {t.hero.sub}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="w-full max-w-sm">
            <DemoButton variant="hero" label={t.hero.demoCta} />
          </div>
          <a
            href="#waitlist"
            className="text-sm text-ink-500 underline-offset-4 hover:text-ink-700 hover:underline"
          >
            {t.hero.cta}
          </a>
        </div>
        <p className="mt-4 text-xs text-ink-400">{t.hero.demoCtaSub}</p>
      </section>

      {/* Sample draft preview — concrete product proof */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight text-ink-900">
          {t.sample.heading}
        </h2>
        <div className="grid gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-ink-400">
              {t.sample.reviewLabel}
            </p>
            <p dir="rtl" lang="ar" className="font-arabic text-lg leading-relaxed text-ink-800">
              {t.sample.reviewText}
            </p>
          </div>
          <div className="border-t border-ink-100 pt-4">
            <p className="mb-2 text-xs uppercase tracking-wider text-ink-400">
              {t.sample.analysisLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {t.sample.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-accent/5 p-5 ring-1 ring-accent/20">
            <p className="mb-2 text-xs uppercase tracking-wider text-accent-dark">
              {t.sample.draftLabel}
            </p>
            <p dir="rtl" lang="ar" className="font-arabic text-lg leading-relaxed text-ink-900">
              {t.sample.draftText}
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight text-ink-900">
          {t.how.heading}
        </h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {t.how.steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-sm font-medium text-ink-50">
                {i + 1}
              </div>
              <h3 className="mb-2 text-lg font-medium text-ink-900">{step.title}</h3>
              <p className="text-sm leading-relaxed text-ink-600">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="mx-auto max-w-2xl px-6 pb-24">
        <div className="rounded-3xl border border-ink-100 bg-white p-8 shadow-sm sm:p-10">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-ink-900">
            {t.waitlist.heading}
          </h2>
          <p className="mb-6 text-ink-600">{t.waitlist.sub}</p>
          <WaitlistForm t={t.waitlist} />
        </div>
      </section>

      <footer className="border-t border-ink-100 py-8 text-center text-sm text-ink-500">
        <div>© {new Date().getFullYear()} · {t.footer.tagline}</div>
        <div className="mt-2 flex justify-center gap-4 text-xs">
          <a href="/privacy" className="hover:text-ink-800">
            {locale === 'en' ? 'Privacy' : 'الخصوصية'}
          </a>
          <span aria-hidden="true">·</span>
          <a href="/terms" className="hover:text-ink-800">
            {locale === 'en' ? 'Terms' : 'الشروط'}
          </a>
        </div>
      </footer>
    </main>
  );
}
