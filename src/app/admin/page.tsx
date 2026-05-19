/**
 * Operator admin dashboard. Gated by ADMIN_EMAILS env var (comma-separated
 * allowlist of email addresses that can view it).
 *
 * Counts only — no PII, no review content. Reads:
 * - Total users (BetterAuth user table)
 * - Total restaurants
 * - Total reviews + draft count
 * - AI provider distribution (parses drafts.model = `${provider}:${tier}`)
 * - 24h activity: new reviews + drafts in the last day
 */

import { redirect, notFound } from 'next/navigation';
import { sql, gte } from 'drizzle-orm';
import { db, user, restaurants, reviews, drafts } from '@/db';
import { getCurrentUser } from '@/lib/auth-utils';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Admin · ReviewPilot' };

function isAllowedAdmin(email: string): boolean {
  const allowlist = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const result = await getCurrentUser();
  if (!result) redirect('/login');
  if (!isAllowedAdmin(result.user.email)) notFound();

  // Aggregate counts
  const [users, restaurantCount, reviewCount, draftCount] = await Promise.all([
    db.$count(user),
    db.$count(restaurants),
    db.$count(reviews),
    db.$count(drafts),
  ]);

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recentReviews, recentDrafts] = await Promise.all([
    db.$count(reviews, gte(reviews.fetchedAt, dayAgo)),
    db.$count(drafts, gte(drafts.generatedAt, dayAgo)),
  ]);

  // AI provider distribution — drafts.model format is `${provider}:${tier}`
  // for current drafts, or a raw model name for legacy rows.
  const providerRows = await db
    .select({
      model: drafts.model,
      count: sql<number>`count(*)::int`,
    })
    .from(drafts)
    .groupBy(drafts.model);

  const providerMix = new Map<string, number>();
  for (const row of providerRows) {
    const key = row.model.includes(':') ? row.model.split(':')[0] : 'legacy';
    providerMix.set(key, (providerMix.get(key) ?? 0) + row.count);
  }

  // Status breakdown
  const statusRows = await db
    .select({
      status: reviews.status,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .groupBy(reviews.status);

  return (
    <main dir="ltr" className="min-h-screen bg-ink-50 text-ink-800">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink-900">
          Admin · ReviewPilot
        </h1>
        <p className="mb-8 text-sm text-ink-500">
          Internal counts only. Allowlisted via <code>ADMIN_EMAILS</code> env.
        </p>

        {/* Top-line counts */}
        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Users" value={users} />
          <Stat label="Restaurants" value={restaurantCount} />
          <Stat label="Reviews" value={reviewCount} />
          <Stat label="Drafts" value={draftCount} />
        </section>

        {/* 24h activity */}
        <section className="mb-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-ink-900">Last 24 hours</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="New reviews" value={recentReviews} />
            <Stat label="New drafts" value={recentDrafts} />
          </div>
        </section>

        {/* AI provider distribution */}
        <section className="mb-8 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-ink-900">AI provider distribution</h2>
          {providerMix.size === 0 ? (
            <p className="text-sm text-ink-500">No drafts yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...providerMix.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([provider, count]) => (
                  <li
                    key={provider}
                    className="flex items-center justify-between gap-2 rounded-xl bg-ink-50/40 px-4 py-2"
                  >
                    <span className="font-mono text-ink-800">{provider}</span>
                    <span className="text-ink-600">{count} drafts</span>
                  </li>
                ))}
            </ul>
          )}
        </section>

        {/* Review status breakdown */}
        <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-ink-900">Reviews by status</h2>
          {statusRows.length === 0 ? (
            <p className="text-sm text-ink-500">No reviews yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {statusRows.map((row) => (
                <li
                  key={row.status}
                  className="flex items-center justify-between gap-2 rounded-xl bg-ink-50/40 px-4 py-2"
                >
                  <span className="font-mono text-ink-800">{row.status}</span>
                  <span className="text-ink-600">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4">
      <div className="text-xs uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">{value}</div>
    </div>
  );
}
