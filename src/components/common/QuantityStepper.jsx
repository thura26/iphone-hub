import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  className,
}) {
  const dec = () => onChange(Math.max(min, Number(value) - 1))
  const inc = () => onChange(Math.min(max, Number(value) + 1))

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-pill border border-line bg-surface',
        size === 'sm' ? 'h-8' : 'h-11',
        className,
      )}
    >
      <button
        type="button"
        onClick={dec}
        disabled={Number(value) <= min}
        className={cn(
          'grid place-items-center rounded-l-pill text-ink transition-colors hover:bg-soft disabled:opacity-35',
          size === 'sm' ? 'h-8 w-8' : 'h-11 w-11',
        )}
        aria-label="Decrease quantity"
      >
        <Minus size={size === 'sm' ? 13 : 15} />
      </button>
      <span
        className={cn(
          'min-w-8 text-center font-semibold tabular-nums text-ink',
          size === 'sm' ? 'text-xs' : 'text-sm',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={Number(value) >= max}
        className={cn(
          'grid place-items-center rounded-r-pill text-ink transition-colors hover:bg-soft disabled:opacity-35',
          size === 'sm' ? 'h-8 w-8' : 'h-11 w-11',
        )}
        aria-label="Increase quantity"
      >
        <Plus size={size === 'sm' ? 13 : 15} />
      </button>
    </div>
  )
}
