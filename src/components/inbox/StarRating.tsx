import { Star } from 'lucide-react';

/** Renders 5 stars in amber; the first `rating` of them are filled. */
export function StarRating({
  rating,
  size = 16,
}: {
  rating: number;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${rating} نجوم من ٥`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
