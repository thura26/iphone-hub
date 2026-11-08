import { Link } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { cn, formatMMK } from '@/lib/utils'
import RatingStars from '@/components/common/RatingStars'
import Reveal from '@/components/common/Reveal'
import { useWishlist } from '@/hooks/useWishlist'
import { useCartStore } from '@/store/cartStore'

function cheapestVariant(variants = []) {
  return [...variants]
    .filter((variant) => variant.active !== false)
    .sort((a, b) => Number(a.price) - Number(b.price))[0]
}

export default function ProductCard({ product, className, revealDelay = 0 }) {
  const { has, toggle } = useWishlist()
  const addItem = useCartStore((state) => state.addItem)
  const variants = product.product_variants || product.variants || []
  const cheapest = cheapestVariant(variants)
  const inStock = variants.some((variant) => Number(variant.stock) > 0)
  const colors = Array.from(
    new Map(
      variants
        .filter((variant) => variant.color)
        .map((variant) => [variant.color, variant]),
    ).values(),
  ).slice(0, 5)
  const wished = has(product.id)

  const quickAdd = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (!cheapest || Number(cheapest.stock) <= 0) {
      toast.error('This product is currently out of stock')
      return
    }
    addItem(
      {
        variantId: cheapest.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        storage: cheapest.storage,
        color: cheapest.color,
        colorHex: cheapest.color_hex,
        price: Number(cheapest.price),
        image: cheapest.image || product.images?.[0] || '',
        stock: Number(cheapest.stock),
      },
      1,
    )
    toast.success(`${product.name} added to cart`)
  }

  return (
    <Reveal delay={revealDelay} className={cn('h-full', className)}>
      <Link
        to={`/product/${product.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface p-3 transition-all duration-300 hover:-translate-y-1 hover:border-ink/15 hover:shadow-[var(--shadow-card)]"
      >
      <div className="relative aspect-square overflow-hidden rounded-[14px] bg-soft">
        {(product.images?.[0] || cheapest?.image) ? (
          <img
            src={product.images?.[0] || cheapest?.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.featured && (
            <span className="rounded-pill bg-ink px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-surface">
              Featured
            </span>
          )}
          {!inStock && (
            <span className="rounded-pill bg-danger px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Out of stock
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toggle(product.id)
            toast.success(wished ? 'Removed from wishlist' : 'Saved to wishlist')
          }}
          className={cn(
            'absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full border border-line bg-surface/90 backdrop-blur transition-all hover:scale-105',
            wished ? 'text-rose-500' : 'text-muted hover:text-ink',
          )}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3.5">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted">
          {product.categories?.name || 'iPhone'}
        </p>
        <h3 className="line-clamp-1 text-sm font-semibold text-ink">{product.name}</h3>
        <div className="mt-1.5">
          <RatingStars
            rating={product.rating}
            count={product.review_count}
            showValue
            size={12}
          />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted">From</p>
            <p className="text-sm font-bold text-ink">
              {formatMMK(cheapest?.price ?? product.base_price)}
            </p>
          </div>
          {colors.length > 0 && (
            <div className="flex -space-x-1 pb-1">
              {colors.map((variant) => (
                <span
                  key={variant.color}
                  className="h-3.5 w-3.5 rounded-full border border-line ring-1 ring-surface"
                  style={{ backgroundColor: variant.color_hex || '#d4d4d8' }}
                  title={variant.color}
                />
              ))}
            </div>
          )}
        </div>

        {inStock ? (
          <button
            type="button"
            onClick={quickAdd}
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-pill bg-ink text-xs font-semibold text-surface transition-all duration-200 hover:bg-black hover:shadow-[0_6px_16px_-8px_rgba(16,24,40,0.6)] active:scale-[0.98]"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingBag size={13} />
            Add to cart
          </button>
        ) : (
          <span className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-pill bg-soft text-xs font-semibold text-muted">
            Out of stock
          </span>
        )}
      </div>
      </Link>
    </Reveal>
  )
}
