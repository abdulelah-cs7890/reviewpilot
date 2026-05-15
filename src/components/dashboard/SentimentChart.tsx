/**
 * Server-rendered line chart of average daily sentiment for the last N days.
 * SVG only — no client JS, no chart lib. Renders cleanly at 320px+ widths.
 */

interface Point {
  day: number; // 0 = today, N-1 = N days ago
  avg: number | null; // null = no reviews that day
  count: number;
}

export function SentimentChart({ points, days = 30 }: { points: Point[]; days?: number }) {
  // SVG geometry
  const W = 720;
  const H = 220;
  const padX = 40;
  const padY = 24;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  // Y maps sentiment -2..2 → innerH..0 (inverted)
  const y = (s: number) => padY + ((2 - s) / 4) * innerH;
  // X maps day (oldest=days-1 on left, today=0 on right) → padX..padX+innerW.
  // For RTL feel: oldest on right, today on left. We'll let the parent flip
  // visually with CSS if needed; chart itself uses LTR time progression.
  const x = (d: number) => padX + innerW - (d / Math.max(1, days - 1)) * innerW;

  const linePoints = points
    .filter((p) => p.avg !== null)
    .map((p) => `${x(p.day).toFixed(1)},${y(p.avg!).toFixed(1)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="مخطط متوسط المشاعر عبر آخر ٣٠ يوم"
      className="block h-auto w-full"
    >
      {/* Y grid lines */}
      {[2, 1, 0, -1, -2].map((s) => (
        <g key={s}>
          <line
            x1={padX}
            x2={W - padX}
            y1={y(s)}
            y2={y(s)}
            stroke={s === 0 ? '#a8a597' : '#e8e7e1'}
            strokeWidth={s === 0 ? 1 : 0.5}
            strokeDasharray={s === 0 ? '0' : '3,3'}
          />
          <text x={padX - 8} y={y(s) + 4} textAnchor="end" fontSize="11" fill="#7a7768">
            {s > 0 ? `+${s}` : s}
          </text>
        </g>
      ))}

      {/* X axis ticks */}
      {[0, 7, 14, 21, days - 1].map((d) => (
        <g key={d}>
          <line x1={x(d)} x2={x(d)} y1={H - padY} y2={H - padY + 4} stroke="#a8a597" />
          <text x={x(d)} y={H - padY + 16} textAnchor="middle" fontSize="10" fill="#7a7768">
            {d === 0 ? 'اليوم' : `قبل ${d}ي`}
          </text>
        </g>
      ))}

      {/* Line + points */}
      {linePoints && (
        <polyline
          points={linePoints}
          fill="none"
          stroke="#c9885e"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {points
        .filter((p) => p.avg !== null)
        .map((p) => (
          <circle
            key={p.day}
            cx={x(p.day)}
            cy={y(p.avg!)}
            r={Math.min(7, 3 + p.count)}
            fill="#c9885e"
            opacity={0.85}
          />
        ))}
    </svg>
  );
}
