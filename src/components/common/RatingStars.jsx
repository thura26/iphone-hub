import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RatingStars({ rating = 0, size = 14, showValue = false, count, className }) {
  const rounded = Math.round(Number(rating) || 0)
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            width={size}
            height={size}
            className={cn(
              star <= rounded ? 'text-amber-400' : 'text-line',
              'shrink-0',
            )}
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </span>
      {showValue && (
        <span className="ml-1 text-xs font-medium text-muted">
          {(Number(rating) || 0).toFixed(1)}
          {typeof count === 'number' ? ` (${count})` : ''}
        </span>
      )}
    </span>
  )
}
