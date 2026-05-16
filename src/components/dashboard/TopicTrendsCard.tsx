/**
 * Topic trends panel for the dashboard.
 *
 * Compares the last 7 days of topic mentions against the prior 28-day
 * weekly baseline, surfaces the topics with the largest absolute delta.
 * Color-codes by whether the topic is generally "negative" (hygiene,
 * service_attitude, etc.) or "positive" (staff_friendliness, etc.) — a
 * spike in a negative topic gets red; a spike in a positive topic gets green.
 *
 * Pure server-side aggregation; no AI calls.
 */

import { ArrowUp, ArrowDown, ArrowRight, Sparkles } from 'lucide-react';
import type { UiLocale } from '@/lib/locale';

interface Review {
  postedAt: Date;
  topics: string[] | null;
}

const NEGATIVE_TOPICS = new Set([
  'food_temperature',
  'service_speed',
  'service_attitude',
  'wait_time',
  'cleanliness',
  'hygiene',
  'reservation_issue',
]);

const POSITIVE_TOPICS = new Set([
  'food_quality',
  'food_taste',
  'food_presentation',
  'staff_friendliness',
  'staff_knowledge',
  'ambiance',
]);

const TOPIC_LABELS: Record<UiLocale, Record<string, string>> = {
  ar: {
    food_quality: 'جودة الطعام',
    food_taste: 'الطعم',
    food_temperature: 'حرارة الطعام',
    food_presentation: 'تقديم الطعام',
    portion_size: 'الكمية',
    service_speed: 'سرعة الخدمة',
    service_attitude: 'تعامل الموظفين',
    staff_friendliness: 'لطف الطاقم',
    staff_knowledge: 'معرفة الطاقم',
    wait_time: 'الانتظار',
    cleanliness: 'النظافة',
    hygiene: 'الصحة',
    ambiance: 'الأجواء',
    price_value: 'السعر/القيمة',
    parking: 'المواقف',
    delivery: 'التوصيل',
    packaging: 'التغليف',
    reservation_issue: 'الحجز',
    payment_issue: 'الدفع',
    music_noise: 'الموسيقى',
    seating: 'الجلوس',
  },
  en: {
    food_quality: 'Food quality',
    food_taste: 'Taste',
    food_temperature: 'Food temperature',
    food_presentation: 'Presentation',
    portion_size: 'Portion',
    service_speed: 'Service speed',
    service_attitude: 'Staff attitude',
    staff_friendliness: 'Friendliness',
    staff_knowledge: 'Staff knowledge',
    wait_time: 'Wait time',
    cleanliness: 'Cleanliness',
    hygiene: 'Hygiene',
    ambiance: 'Ambiance',
    price_value: 'Price/value',
    parking: 'Parking',
    delivery: 'Delivery',
    packaging: 'Packaging',
    reservation_issue: 'Reservation',
    payment_issue: 'Payment',
    music_noise: 'Music/noise',
    seating: 'Seating',
  },
};

interface TrendRow {
  topic: string;
  last7d: number;
  weeklyAvg: number;
  deltaPct: number | null; // null = no prior data
  isNew: boolean;
}

function computeTrends(reviews: Review[]): TrendRow[] {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * DAY;
  const thirtyFiveDaysAgo = now - 35 * DAY;

  const last7Counts: Record<string, number> = {};
  const prior28Counts: Record<string, number> = {};

  for (const r of reviews) {
    if (!r.topics) continue;
    const t = new Date(r.postedAt).getTime();
    if (t >= sevenDaysAgo) {
      for (const topic of r.topics) {
        last7Counts[topic] = (last7Counts[topic] ?? 0) + 1;
      }
    } else if (t >= thirtyFiveDaysAgo) {
      for (const topic of r.topics) {
        prior28Counts[topic] = (prior28Counts[topic] ?? 0) + 1;
      }
    }
  }

  const topics = new Set([...Object.keys(last7Counts), ...Object.keys(prior28Counts)]);
  const rows: TrendRow[] = [];

  for (const topic of topics) {
    const last7d = last7Counts[topic] ?? 0;
    const prior28 = prior28Counts[topic] ?? 0;
    const weeklyAvg = prior28 / 4;

    if (last7d === 0 && weeklyAvg === 0) continue;

    let deltaPct: number | null;
    let isNew = false;
    if (weeklyAvg === 0 && last7d > 0) {
      deltaPct = null;
      isNew = true;
    } else if (weeklyAvg === 0) {
      deltaPct = 0;
    } else {
      deltaPct = ((last7d - weeklyAvg) / weeklyAvg) * 100;
    }

    rows.push({ topic, last7d, weeklyAvg, deltaPct, isNew });
  }

  // Sort: 'new' topics first, then by absolute delta descending
  rows.sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return Math.abs(b.deltaPct ?? 0) - Math.abs(a.deltaPct ?? 0);
  });

  return rows.slice(0, 5);
}

export function TopicTrendsCard({
  reviews,
  locale = 'ar',
}: {
  reviews: Review[];
  locale?: UiLocale;
}) {
  const rows = computeTrends(reviews);
  const labels = TOPIC_LABELS[locale];

  const t =
    locale === 'en'
      ? {
          heading: 'Topic trends (last 7 days)',
          sub: 'Topics that moved most vs the prior 4-week baseline.',
          empty: 'Not enough data yet to compute trends.',
          new: 'new',
          vsBaseline: 'vs baseline',
        }
      : {
          heading: 'اتجاهات الموضوعات (آخر ٧ أيام)',
          sub: 'الموضوعات اللي تحركت أكثر مقارنة بمتوسط الأسابيع الأربعة الماضية.',
          empty: 'لا توجد بيانات كافية لحساب الاتجاهات.',
          new: 'جديد',
          vsBaseline: 'مقابل المعدل',
        };

  return (
    <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-medium text-ink-900">{t.heading}</h2>
      <p className="mb-4 text-xs text-ink-500">{t.sub}</p>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-500">{t.empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const isNeg = NEGATIVE_TOPICS.has(row.topic);
            const isPos = POSITIVE_TOPICS.has(row.topic);
            const direction =
              row.deltaPct === null
                ? 'new'
                : row.deltaPct > 10
                  ? 'up'
                  : row.deltaPct < -10
                    ? 'down'
                    : 'flat';
            // A surge in a negative topic = red; surge in positive topic = green;
            // drop in negative = green (good!); drop in positive = red (bad).
            const tone =
              direction === 'new'
                ? isNeg
                  ? 'red'
                  : isPos
                    ? 'green'
                    : 'ink'
                : direction === 'up'
                  ? isNeg
                    ? 'red'
                    : isPos
                      ? 'green'
                      : 'ink'
                  : direction === 'down'
                    ? isNeg
                      ? 'green'
                      : isPos
                        ? 'red'
                        : 'ink'
                    : 'ink';
            const toneCls =
              tone === 'red'
                ? 'text-red-700'
                : tone === 'green'
                  ? 'text-emerald-700'
                  : 'text-ink-500';

            return (
              <li
                key={row.topic}
                className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2"
              >
                <span className="text-sm text-ink-800">{labels[row.topic] ?? row.topic}</span>
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-ink-500">
                    {row.last7d} {locale === 'en' ? 'this week' : 'هذا الأسبوع'}
                  </span>
                  {row.isNew ? (
                    <span className={`inline-flex items-center gap-1 font-medium ${toneCls}`}>
                      <Sparkles className="h-3 w-3" />
                      {t.new}
                    </span>
                  ) : direction === 'up' ? (
                    <span className={`inline-flex items-center gap-1 font-medium ${toneCls}`}>
                      <ArrowUp className="h-3 w-3" />
                      {Math.abs(row.deltaPct ?? 0).toFixed(0)}%
                    </span>
                  ) : direction === 'down' ? (
                    <span className={`inline-flex items-center gap-1 font-medium ${toneCls}`}>
                      <ArrowDown className="h-3 w-3" />
                      {Math.abs(row.deltaPct ?? 0).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-ink-500">
                      <ArrowRight className="h-3 w-3" />
                      {t.vsBaseline}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
