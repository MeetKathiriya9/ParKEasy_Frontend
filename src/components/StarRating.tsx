import { Star } from 'lucide-react';

interface StarRatingProps {
  /** The average, 0-5. Null or undefined means "not rated yet". */
  rating: number | null | undefined;
  /** How many ratings the average is drawn from. */
  reviewCount?: number | null;
  size?: number;
  /** Hide the numeric average and the count, leaving the stars alone. */
  compact?: boolean;
  className?: string;
}

/**
 * A facility's standing, as stars.
 *
 * A facility that has not been rated says so rather than showing five empty
 * stars, which would read as a score of zero. The count is shown next to the
 * average so a single review does not look like a well-established rating.
 */
export function StarRating({
  rating,
  reviewCount,
  size = 14,
  compact = false,
  className = '',
}: StarRatingProps) {
  if (rating === null || rating === undefined || !Number.isFinite(rating)) {
    return <span className={`text-xs text-[#5a6a8a] ${className}`}>Not rated yet</span>;
  }

  // Round rather than truncate, so 4.6 shows as five stars - the same rule a
  // shopper expects from a rating badge.
  const filled = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <Star
            key={step}
            size={size}
            className={step <= filled ? 'text-[#f59e0b]' : 'text-[#2a3a5c]'}
            fill={step <= filled ? 'currentColor' : 'none'}
          />
        ))}
      </span>
      {!compact && <span className="text-sm font-semibold">{rating.toFixed(1)}</span>}
      {reviewCount !== null && reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-xs text-[#5a6a8a]">({reviewCount})</span>
      )}
    </span>
  );
}
