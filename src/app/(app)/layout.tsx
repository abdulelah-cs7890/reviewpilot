import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db, restaurants, reviews } from '@/db';
import { getCurrentUser } from '@/lib/auth-utils';
import { getUiLocale, dirFor } from '@/lib/locale';
import { appCopy } from '@/lib/app-copy';
import { SignOutButton } from '@/components/SignOutButton';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ProductTour } from '@/components/tour/ProductTour';
import { TourTrigger } from '@/components/tour/TourTrigger';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const result = await getCurrentUser();
  if (!result) {
    redirect('/login');
  }

  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, result.user.id),
  });

  // Unread count for the nav badge — reviews the owner hasn't opened yet
  // and that aren't already ignored. Cheap count query.
  const unreadCount = restaurant
    ? await db.$count(
        reviews,
        and(
          eq(reviews.restaurantId, restaurant.id),
          isNull(reviews.seenAt),
          sql`${reviews.status} != 'ignored'`
        )
      )
    : 0;

  const locale = await getUiLocale();
  const t = appCopy[locale];

  return (
    <div dir={dirFor(locale)} lang={locale} className="min-h-screen bg-ink-50 text-ink-800">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-3">
              <Link href="/inbox" className="text-lg font-semibold tracking-tight text-ink-900">
                ReviewPilot
              </Link>
              {restaurant && (
                <span className="hidden text-sm text-ink-600 sm:inline">
                  · {locale === 'en' && restaurant.nameEn ? restaurant.nameEn : restaurant.name}
                </span>
              )}
              {result.isDemo && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent-dark">
                  {t.nav.demoBadge}
                </span>
              )}
            </div>
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {restaurant && (
                <>
                  <Link
                    href="/inbox"
                    className="inline-flex items-center gap-1.5 text-ink-600 hover:text-ink-900"
                  >
                    {t.nav.reviews}
                    {unreadCount > 0 && (
                      <span
                        className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white"
                        aria-label={
                          locale === 'en'
                            ? `${unreadCount} unread reviews`
                            : `${unreadCount} تقييم غير مقروء`
                        }
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link href="/dashboard" className="text-ink-600 hover:text-ink-900">
                    {t.nav.dashboard}
                  </Link>
                  <Link
                    href="/insights"
                    data-tour="insights"
                    className="text-ink-600 hover:text-ink-900"
                  >
                    {locale === 'en' ? 'Insights' : 'تحليلات'}
                  </Link>
                  <Link
                    href="/settings"
                    data-tour="settings"
                    className="text-ink-600 hover:text-ink-900"
                  >
                    {t.nav.settings}
                  </Link>
                  <Link
                    href="/inbox/new"
                    data-tour="add-button"
                    className="rounded-lg bg-ink-100 px-3 py-1 text-ink-700 hover:bg-ink-200"
                  >
                    {t.nav.addReview}
                  </Link>
                </>
              )}
              <div data-tour="language-toggle">
                <LanguageToggle locale={locale} />
              </div>
              <TourTrigger locale={locale} />
              <SignOutButton label={t.nav.signOut} />
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <ProductTour locale={locale} />
    </div>
  );
}
