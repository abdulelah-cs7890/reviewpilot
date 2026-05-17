/**
 * Heatmap: rows = topics, columns = sentiment buckets, cell intensity = count.
 * Server-rendered SVG, no client JS.
 */

import type { UiLocale } from '@/lib/locale';

const TOPIC_LABELS: Record<UiLocale, Record<string, string>> = {
  ar: {
    food_quality: 'جودة الطعام',
    food_taste: 'الطعم',
    food_temperature: 'حرارة الطعام',
    portion_size: 'الكمية',
    service_speed: 'سرعة الخدمة',
    service_attitude: 'تعامل الموظفين',
    staff_friendliness: 'لطف الطاقم',
    wait_time: 'الانتظار',
    cleanliness: 'النظافة',
    hygiene: 'الصحة',
    ambiance: 'الأجواء',
    price_value: 'السعر/القيمة',
    parking: 'المواقف',
    delivery: 'التوصيل',
    packaging: 'التغليف',
  },
  en: {
    food_quality: 'Food quality',
    food_taste: 'Taste',
    food_temperature: 'Food temp',
    portion_size: 'Portion',
    service_speed: 'Service speed',
    service_attitude: 'Staff attitude',
    staff_friendliness: 'Friendliness',
    wait_time: 'Wait time',
    cleanliness: 'Cleanliness',
    hygiene: 'Hygiene',
    ambiance: 'Ambiance',
    price_value: 'Price/value',
    parking: 'Parking',
    delivery: 'Delivery',
    packaging: 'Packaging',
  },
};

const BUCKETS = [
  { key: 'veryNeg', label: '-2', minSent: -2, maxSent: -2 },
  { key: 'neg', label: '-1', minSent: -1, maxSent: -1 },
  { key: 'neutral', label: '0', minSent: 0, maxSent: 0 },
  { key: 'pos', label: '+1', minSent: 1, maxSent: 1 },
  { key: 'veryPos', label: '+2', minSent: 2, maxSent: 2 },
] as const;

type BucketKey = (typeof BUCKETS)[number]['key'];

export function TopicHeatmap({
  data,
  locale = 'ar',
}: {
  data: Record<string, Record<BucketKey, number>>;
  locale?: UiLocale;
}) {
  const labels = TOPIC_LABELS[locale];
  const topics = Object.keys(data).filter((t) =>
    Object.values(data[t]).some((v) => v > 0)
  );
  if (topics.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        {locale === 'en' ? 'Not enough data yet.' : 'لا توجد بيانات كافية بعد.'}
      </p>
    );
  }
  const maxVal = Math.max(
    1,
    ...topics.flatMap((t) => BUCKETS.map((b) => data[t][b.key] ?? 0))
  );

  const cellW = 60;
  const cellH = 28;
  const labelW = 110;
  const headerH = 28;
  const W = labelW + cellW * BUCKETS.length;
  const H = headerH + cellH * topics.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={locale === 'en' ? 'Topic × sentiment heatmap' : 'خريطة الموضوعات والمشاعر'}
      direction="ltr"
      className="block h-auto w-full"
    >
      {/* Column headers (sentiment buckets) */}
      {BUCKETS.map((b, i) => (
        <text
          key={b.key}
          x={labelW + cellW * i + cellW / 2}
          y={headerH - 8}
          textAnchor="middle"
          fontSize="11"
          fill="#7a7768"
        >
          {b.label}
        </text>
      ))}

      {/* Rows */}
      {topics.map((topic, rowIdx) => (
        <g key={topic}>
          <text
            x={labelW - 8}
            y={headerH + cellH * rowIdx + cellH / 2 + 4}
            textAnchor="end"
            fontSize="11"
            fill="#54513f"
          >
            {labels[topic] ?? topic}
          </text>
          {BUCKETS.map((b, colIdx) => {
            const v = data[topic][b.key] ?? 0;
            const intensity = v / maxVal;
            // Negative buckets red, positive green, neutral grey
            const isNeg = b.minSent < 0;
            const isPos = b.minSent > 0;
            const base = isNeg ? '#dc2626' : isPos ? '#059669' : '#a8a597';
            return (
              <g key={b.key}>
                <rect
                  x={labelW + cellW * colIdx + 2}
                  y={headerH + cellH * rowIdx + 2}
                  width={cellW - 4}
                  height={cellH - 4}
                  rx={4}
                  fill={base}
                  opacity={v === 0 ? 0.05 : 0.15 + intensity * 0.7}
                />
                {v > 0 && (
                  <text
                    x={labelW + cellW * colIdx + cellW / 2}
                    y={headerH + cellH * rowIdx + cellH / 2 + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fill={intensity > 0.5 ? 'white' : '#1a1813'}
                    fontWeight="500"
                  >
                    {v}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
