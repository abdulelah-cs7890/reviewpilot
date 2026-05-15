import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db, restaurants, reviews } from '@/db';
import { requireUser } from '@/lib/auth-utils';
import { StatCard } from '@/components/dashboard/StatCard';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import { TopicHeatmap } from '@/components/dashboard/TopicHeatmap';
import { UrgencySplit } from '@/components/dashboard/UrgencySplit';

const TRACKED_TOPICS = [
  'food_quality',
  'food_taste',
  'food_temperature',
  'service_speed',
  'service_attitude',
  'wait_time',
  'cleanliness',
  'hygiene',
  'ambiance',
  'price_value',
  'parking',
  'delivery',
];

const DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type BucketKey = 'veryNeg' | 'neg' | 'neutral' | 'pos' | 'veryPos';

function sentimentBucket(s: number): BucketKey {
  if (s <= -2) return 'veryNeg';
  if (s === -1) return 'neg';
  if (s === 0) return 'neutral';
  if (s === 1) return 'pos';
  return 'veryPos';
}

export default async function DashboardPage() {
  const { user } = await requireUser();
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, user.id),
  });
  if (!restaurant) redirect('/onboarding');

  const all = await db
    .select()
    .from(reviews)
    .where(eq(reviews.restaurantId, restaurant.id));

  // ----- Stat cards -----
  const total = all.length;
  const respondedCount = all.filter((r) => r.status === 'responded').length;
  const responseRate = total > 0 ? Math.round((respondedCount / total) * 100) : 0;
  const urgentCount = all.filter((r) => r.urgency === 'high').length;
  const avgSentiment =
    total > 0
      ? all.reduce((sum, r) => sum + (r.sentiment ?? 0), 0) / total
      : 0;

  // ----- Sentiment over time -----
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: DAYS }, () => ({ sum: 0, count: 0 }));
  for (const r of all) {
    const reviewDay = new Date(r.postedAt);
    reviewDay.setHours(0, 0, 0, 0);
    const dayIdx = Math.floor((startOfToday.getTime() - reviewDay.getTime()) / DAY_MS);
    if (dayIdx >= 0 && dayIdx < DAYS) {
      buckets[dayIdx].sum += r.sentiment ?? 0;
      buckets[dayIdx].count += 1;
    }
  }
  const sentimentPoints = buckets.map((b, day) => ({
    day,
    avg: b.count > 0 ? b.sum / b.count : null,
    count: b.count,
  }));

  // ----- Topic heatmap -----
  const heatmapData: Record<string, Record<BucketKey, number>> = {};
  for (const t of TRACKED_TOPICS) {
    heatmapData[t] = { veryNeg: 0, neg: 0, neutral: 0, pos: 0, veryPos: 0 };
  }
  for (const r of all) {
    if (!r.topics || r.sentiment === null) continue;
    const bucket = sentimentBucket(r.sentiment);
    for (const topic of r.topics) {
      if (heatmapData[topic]) {
        heatmapData[topic][bucket] += 1;
      }
    }
  }

  // ----- Urgency split -----
  const urgencyCounts = { high: 0, medium: 0, low: 0 };
  for (const r of all) {
    if (r.urgency) urgencyCounts[r.urgency] += 1;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            لوحة المعلومات
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            ملخص آخر ٣٠ يوم لـ {restaurant.name}
          </p>
        </div>
        <Link
          href="/inbox"
          className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100"
        >
          عرض الصندوق
        </Link>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="إجمالي التقييمات" value={total} />
        <StatCard
          label="معدل الرد"
          value={`${responseRate}%`}
          sub={`${respondedCount} من ${total}`}
          tone={responseRate >= 70 ? 'positive' : responseRate >= 40 ? 'default' : 'warn'}
        />
        <StatCard
          label="تقييمات عاجلة"
          value={urgentCount}
          tone={urgentCount > 0 ? 'warn' : 'default'}
        />
        <StatCard
          label="متوسط المشاعر"
          value={avgSentiment.toFixed(1)}
          sub="على مقياس -٢ إلى +٢"
          tone={avgSentiment >= 0.5 ? 'positive' : avgSentiment <= -0.5 ? 'negative' : 'default'}
        />
      </div>

      {/* Sentiment over time */}
      <section className="mb-6 rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-sm font-medium text-ink-900">المشاعر عبر الزمن</h2>
        <p className="mb-4 text-xs text-ink-500">
          متوسط مشاعر التقييمات لكل يوم. حجم النقطة يعكس عدد التقييمات في اليوم.
        </p>
        <SentimentChart points={sentimentPoints} days={DAYS} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Topic heatmap */}
        <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-1 text-sm font-medium text-ink-900">الموضوعات والمشاعر</h2>
          <p className="mb-4 text-xs text-ink-500">
            توزيع التقييمات حسب الموضوع ومستوى المشاعر.
          </p>
          <TopicHeatmap data={heatmapData} />
        </section>

        {/* Urgency split */}
        <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-medium text-ink-900">توزيع الإلحاح</h2>
          <p className="mb-4 text-xs text-ink-500">
            كم تقييم يحتاج رداً سريعاً.
          </p>
          <UrgencySplit
            high={urgencyCounts.high}
            medium={urgencyCounts.medium}
            low={urgencyCounts.low}
          />
        </section>
      </div>
    </div>
  );
}
