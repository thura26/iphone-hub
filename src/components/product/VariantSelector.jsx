import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

function storageSize(value) {
  const match = String(value).match(/(\d+(?:\.\d+)?)\s*(TB|GB|MB)/i)
  if (!match) return Number.POSITIVE_INFINITY
  const amount = Number.parseFloat(match[1])
  const unit = match[2].toUpperCase()
  if (unit === 'TB') return amount * 1024
  if (unit === 'MB') return amount / 1024
  return amount
}

export default function VariantSelector({ variants = [], selected, onChange }) {
  if (!variants.length) return null

  const colorMap = new Map()
  variants.forEach((variant) => {
    if (!colorMap.has(variant.color)) {
      colorMap.set(variant.color, {
        color: variant.color,
        hex: variant.color_hex,
        image: variant.image,
      })
    }
  })
  const colors = Array.from(colorMap.values())
  const storages = variants
    .filter((variant) => variant.color === selected?.color)
    .sort((a, b) => storageSize(a.storage) - storageSize(b.storage))

  const pickColor = (color) => {
    const sameStorage = variants.find(
      (variant) => variant.color === color && variant.storage === selected?.storage,
    )
    const fallback = variants.find((variant) => variant.color === color)
    onChange?.(sameStorage || fallback)
  }

  const pickStorage = (storage) => {
    const match = variants.find(
      (variant) => variant.color === selected?.color && variant.storage === storage,
    )
    if (match) onChange?.(match)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink">Color</span>
          <span className="text-sm text-muted">{selected?.color || 'Choose a color'}</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {colors.map(({ color, hex, image }) => {
            const active = selected?.color === color
            return (
              <button
                key={color}
                type="button"
                onClick={() => pickColor(color)}
                className={cn(
                  'relative grid h-11 w-11 place-items-center rounded-full border transition-all',
                  active
                    ? 'border-ink ring-2 ring-ink/15'
                    : 'border-line hover:border-ink/40',
                )}
                title={color}
                aria-label={`Select ${color}`}
                aria-pressed={active}
              >
                {image ? (
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="h-7 w-7 rounded-full border border-black/5"
                    style={{ backgroundColor: hex || '#d4d4d8' }}
                  />
                )}
                {active && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-ink text-surface">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink">Storage</span>
          <span className="text-sm text-muted">{selected?.storage || 'Choose storage'}</span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {storages.map((variant) => {
            const active = selected?.storage === variant.storage
            const out = Number(variant.stock) <= 0
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => pickStorage(variant.storage)}
                className={cn(
                  'relative rounded-xl border px-3 py-3 text-sm font-semibold transition-colors',
                  active
                    ? 'border-ink bg-soft text-ink'
                    : 'border-line bg-surface text-ink hover:border-ink/40',
                  out && 'opacity-45',
                )}
                aria-pressed={active}
              >
                {variant.storage}
                {out && (
                  <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted">
                    Out of stock
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
