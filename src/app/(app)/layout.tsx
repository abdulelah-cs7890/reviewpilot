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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/inbox" className="text-lg font-semibold tracking-tight text-ink-900">
              ReviewPilot
            </Link>
            {restaurant && (
              <span className="text-sm text-ink-600">· {restaurant.name}</span>
            )}
            {result.isDemo && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent-dark">
                وضع تجريبي
              </span>
            )}
          </div>
          <nav className="flex items-center gap-4 text-sm">
            {restaurant && (
              <>
                <Link href="/inbox" className="text-ink-600 hover:text-ink-900">
                  التقييمات
                </Link>
                <Link href="/inbox/new" className="text-ink-600 hover:text-ink-900">
                  + إضافة تقييم
                </Link>
              </>
            )}
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
