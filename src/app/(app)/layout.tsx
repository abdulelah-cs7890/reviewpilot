import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, restaurants } from '@/db';
import { getCurrentUser } from '@/lib/auth-utils';
import { SignOutButton } from '@/components/SignOutButton';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const result = await getCurrentUser();
  if (!result) {
    redirect('/login');
  }

  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, result.user.id),
  });

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-ink-50 text-ink-800">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-3">
              <Link href="/inbox" className="text-lg font-semibold tracking-tight text-ink-900">
                ReviewPilot
              </Link>
              {restaurant && (
                <span className="hidden text-sm text-ink-600 sm:inline">
                  · {restaurant.name}
                </span>
              )}
              {result.isDemo && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent-dark">
                  تجريبي
                </span>
              )}
            </div>
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              {restaurant && (
                <>
                  <Link href="/inbox" className="text-ink-600 hover:text-ink-900">
                    التقييمات
                  </Link>
                  <Link href="/dashboard" className="text-ink-600 hover:text-ink-900">
                    اللوحة
                  </Link>
                  <Link href="/settings" className="text-ink-600 hover:text-ink-900">
                    الإعدادات
                  </Link>
                  <Link
                    href="/inbox/new"
                    className="rounded-lg bg-ink-100 px-3 py-1 text-ink-700 hover:bg-ink-200"
                  >
                    + إضافة
                  </Link>
                </>
              )}
              <SignOutButton />
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
