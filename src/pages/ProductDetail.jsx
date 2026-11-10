import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronRight,
  Check,
  CreditCard,
  Heart,
  PackageCheck,
  RotateCcw,
  Share2,
  ShieldCheck,
  Star,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useCartStore } from '@/store/cartStore'
import { useCartDrawerStore } from '@/store/cartDrawerStore'
import { useWishlist } from '@/hooks/useWishlist'
import { fetchProductBySlug, fetchProducts, fetchReviews } from '@/lib/api'
import { cn, formatDate, formatMMK, initials } from '@/lib/utils'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import RatingStars from '@/components/common/RatingStars'
import Reveal from '@/components/common/Reveal'
import QuantityStepper from '@/components/common/QuantityStepper'
import Seo from '@/components/common/Seo'
import ProductGallery from '@/components/product/ProductGallery'
import VariantSelector from '@/components/product/VariantSelector'
import ProductCard from '@/components/product/ProductCard'

function ReviewForm({ productId, onSubmitted, onCancel }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!comment.trim()) {
      toast.error('Please write a short review')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      rating,
      comment: comment.trim(),
      approved: false,
    })
    setSaving(false)
    if (error) {
      toast.error(
        error.code === '23505'
          ? 'You have already reviewed this product'
          : error.message,
      )
      return
    }
    toast.success('Thanks! Your review is awaiting approval.')
    setComment('')
    onSubmitted?.()
  }

  return (
    <form onSubmit={submit} className="rounded-card border border-line bg-surface p-5">
      <h4 className="text-sm font-semibold text-ink">Write a review</h4>
      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="p-0.5 text-amber-400 transition-transform hover:scale-110"
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
          >
            <Star
              size={22}
              fill={star <= rating ? 'currentColor' : 'none'}
              className={star <= rating ? 'text-amber-400' : 'text-line'}
            />
          </button>
        ))}
        <span className="ml-2 text-xs font-medium text-muted">{rating} / 5</span>
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        placeholder="What do you like about this product?"
        className="field mt-3 resize-none"
        maxLength={800}
      />
      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-ghost btn-sm">
          Cancel
        </button>
        <button type="submit" className="btn-primary btn-sm" disabled={saving}>
          {saving ? 'Submitting…' : 'Submit review'}
        </button>
      </div>
    </form>
  )
}

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useCartDrawerStore((state) => state.openCart)
  const { has, toggle } = useWishlist()

  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [related, setRelated] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotFound(false)
    setProduct(null)
    setSelectedVariant(null)
    setQty(1)

    async function load() {
      try {
        const found = await fetchProductBySlug(slug)
        if (!active) return
        if (!found) {
          setNotFound(true)
          return
        }
        setProduct(found)
        const variants = found.product_variants || []
        setSelectedVariant(variants.find((variant) => Number(variant.stock) > 0) || variants[0] || null)

        const [reviewRows, allProducts] = await Promise.all([
          fetchReviews(found.id),
          fetchProducts(),
        ])
        if (!active) return
        setReviews(reviewRows)
        setRelated(
          allProducts
            .filter(
              (item) =>
                item.id !== found.id &&
                item.categories?.slug === found.categories?.slug,
            )
            .slice(0, 4),
        )
      } catch (error) {
        console.error(error)
        toast.error('Could not load this product')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [slug])

  const approvedReviews = useMemo(
    () => reviews.filter((review) => review.approved),
    [reviews],
  )
  const ownReview = useMemo(
    () => reviews.find((review) => review.user_id === user?.id),
    [reviews, user?.id],
  )

  const ratingBreakdown = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => {
      const count = approvedReviews.filter((review) => review.rating === star).length
      const pct = approvedReviews.length > 0 ? (count / approvedReviews.length) * 100 : 0
      return { star, count, pct }
    })
  }, [approvedReviews])

  if (loading) return <Loader full label="Loading product…" />

  if (notFound || !product) {
    return (
      <div className="wrap py-16">
        <Seo title="Product not found" noindex />
        <EmptyState
          icon={PackageCheck}
          title="Product not found"
          description="This product may be unavailable or the link is incorrect."
          action={
            <Link to="/shop" className="btn-primary">
              Browse the shop
            </Link>
          }
        />
      </div>
    )
  }

  const variants = product.product_variants || []
  const price = Number(selectedVariant?.price ?? product.base_price)
  const stock = Number(selectedVariant?.stock ?? 0)
  const wishlisted = has(product.id)
  const images = Array.from(
    new Set([selectedVariant?.image, ...(product.images || [])].filter(Boolean)),
  )
  const canBuy = Boolean(selectedVariant) && stock > 0

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `Buy ${product.name} at iPhone Hub in Myanmar.`,
    image: images,
    sku: product.id,
    category: product.categories?.name || 'iPhone',
    brand: { '@type': 'Brand', name: 'Apple' },
    aggregateRating:
      Number(product.review_count) > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(product.rating || 0).toFixed(1),
            reviewCount: Number(product.review_count),
          }
        : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'MMK',
      price,
      availability: canBuy ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `/product/${product.slug}`,
      seller: { '@type': 'Organization', name: 'iPhone Hub' },
    },
  }

  const buildCartItem = () => ({
    variantId: selectedVariant.id,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    storage: selectedVariant.storage,
    color: selectedVariant.color,
    colorHex: selectedVariant.color_hex,
    price: Number(selectedVariant.price),
    image: selectedVariant.image || product.images?.[0] || '',
    stock: Number(selectedVariant.stock),
  })

  const addToCart = () => {
    if (!canBuy) {
      toast.error('Please choose an in-stock configuration')
      return
    }
    addItem(buildCartItem(), qty)
    toast.success(`${product.name} added to cart`, {
      action: { label: 'View cart', onClick: openCart },
    })
  }

  const buyNow = () => {
    if (!canBuy) {
      toast.error('Please choose an in-stock configuration')
      return
    }
    addItem(buildCartItem(), qty)
    navigate('/checkout')
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard')
      }
    } catch {
      // User cancelled the share sheet.
    }
  }

  return (
    <div className="wrap py-5 sm:py-8">
      <Seo
        title={`${product.name} — ${formatMMK(price)}`}
        description={
          product.description ||
          `Buy the ${product.name} at iPhone Hub. Genuine Apple product with local warranty, fast delivery and 7-day returns across Myanmar.`
        }
        image={product.images?.[0]}
        url={`/product/${product.slug}`}
        type="product"
        keywords={`${product.name}, ${product.name} price Myanmar, buy ${product.name} Yangon`}
        jsonLd={productJsonLd}
      />
      <nav className="mb-4 flex items-center gap-1.5 overflow-x-auto text-xs text-muted no-scrollbar">
        <Link to="/" className="hover:text-ink">Home</Link>
        <ChevronRight size={12} />
        <Link to="/shop" className="hover:text-ink">Shop</Link>
        <ChevronRight size={12} />
        <Link to={`/shop?category=${product.categories?.slug || ''}`} className="hover:text-ink">
          {product.categories?.name || 'iPhone'}
        </Link>
        <ChevronRight size={12} />
        <span className="truncate font-medium text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery
            images={images}
            alt={product.name}
            activeImage={selectedVariant?.image || product.images?.[0]}
          />
        </div>

        <Reveal delay={80}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-brand">{product.categories?.name || 'iPhone'}</span>
            {product.featured && <span className="badge-neutral">Best seller</span>}
            {stock > 0 && stock <= 5 && <span className="badge-warning">Only {stock} left</span>}
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={product.rating} count={product.review_count} showValue size={15} />
            <a href="#reviews" className="text-xs font-medium text-brand">
              Read reviews
            </a>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">{product.description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight text-ink">{formatMMK(price)}</span>
            {selectedVariant && (
              <span className="text-xs text-muted">
                {selectedVariant.storage} · {selectedVariant.color}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">Inclusive of all taxes. Free standard delivery over Ks 5,000,000.</p>

          <div className="mt-7">
            <VariantSelector variants={variants} selected={selectedVariant} onChange={setSelectedVariant} />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantityStepper
              value={qty}
              onChange={setQty}
              max={Math.max(1, stock || 1)}
              className="shrink-0"
            />
            <button
              type="button"
              onClick={addToCart}
              disabled={!canBuy}
              className="btn-primary min-w-[160px] flex-1"
            >
              Add to cart
            </button>
            <button
              type="button"
              onClick={() => {
                toggle(product.id)
                toast.success(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist')
              }}
              className={cn('btn-outline h-11 w-11 shrink-0 !p-0', wishlisted && 'border-rose-300 text-rose-500')}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={share}
              className="btn-outline h-11 w-11 shrink-0 !p-0"
              aria-label="Share product"
            >
              <Share2 size={17} />
            </button>
          </div>

          <button
            type="button"
            onClick={buyNow}
            disabled={!canBuy}
            className="btn-brand mt-3 w-full"
          >
            Buy now
          </button>

          {!canBuy && (
            <p className="mt-2 text-center text-xs font-medium text-danger">
              This configuration is currently out of stock.
            </p>
          )}

          <div className="mt-7 grid grid-cols-2 gap-3 rounded-card border border-line bg-surface p-4 sm:grid-cols-4">
            {[
              { icon: Truck, label: 'Free delivery' },
              { icon: RotateCcw, label: '7-day returns' },
              { icon: ShieldCheck, label: '1-year warranty' },
              { icon: CreditCard, label: 'Secure payment' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-[11px] font-medium text-muted">
                <Icon size={16} className="shrink-0 text-ink" />
                {label}
              </div>
            ))}
          </div>

          {product.highlights?.length > 0 && (
            <div className="mt-7">
              <h3 className="text-sm font-bold text-ink">Highlights</h3>
              <ul className="mt-3 grid gap-2.5">
                {product.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2.5 text-sm text-muted">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-7 divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
            {[
              {
                title: 'Delivery & returns',
                body: 'Standard delivery takes 2–4 business days and is free on orders over Ks 5,000,000. Express delivery arrives next business day for Ks 15,000. Returns accepted within 7 days for unused items in original packaging.',
              },
              {
                title: 'Warranty',
                body: 'Every iPhone includes a 1-year official Apple warranty. Accessories carry a 6-month warranty. Keep your order number for warranty claims.',
              },
              {
                title: 'Payment options',
                body: 'Pay with cash on delivery, a credit or debit card, or Apple Pay. Card and Apple Pay checkout in this demo are simulated — no real charges are made.',
              },
            ].map((item) => (
              <details key={item.title} className="group px-4 py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink">
                  {item.title}
                  <ChevronRight size={16} className="text-muted transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.body}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>

      <Reveal
        as="section"
        id="reviews"
        className="mt-14 scroll-mt-24 border-t border-line pt-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Customer feedback</p>
            <h2 className="section-title mt-1">Reviews</h2>
          </div>
          {!user ? (
            <Link to="/auth?mode=login" className="btn-outline btn-sm">
              Sign in to review
            </Link>
          ) : ownReview ? (
            <span className="badge-neutral">
              {ownReview.approved ? 'You reviewed this product' : 'Review pending approval'}
            </span>
          ) : (
            <button type="button" onClick={() => setShowReviewForm(true)} className="btn-outline btn-sm">
              Write a review
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="rounded-card border border-line bg-surface p-5">
            <div className="flex items-end gap-3">
              <span className="text-5xl font-bold tracking-tight text-ink">
                {(Number(product.rating) || 0).toFixed(1)}
              </span>
              <div className="pb-1.5">
                <RatingStars rating={product.rating} size={14} />
                <p className="mt-1 text-xs text-muted">
                  Based on {approvedReviews.length || product.review_count || 0} review
                  {(approvedReviews.length || product.review_count) === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-2.5">
              {ratingBreakdown.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-2 text-xs text-muted">
                  <span className="w-3 text-right">{star}</span>
                  <Star size={11} className="text-amber-400" fill="currentColor" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-soft">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4 text-right tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {showReviewForm && (
              <ReviewForm
                productId={product.id}
                onCancel={() => setShowReviewForm(false)}
                onSubmitted={async () => {
                  setShowReviewForm(false)
                  const rows = await fetchReviews(product.id)
                  setReviews(rows)
                }}
              />
            )}

            {approvedReviews.length === 0 && !showReviewForm ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Be the first to share your experience with this product."
                className="bg-surface"
              />
            ) : (
              approvedReviews.map((review) => (
                <article key={review.id} className="rounded-card border border-line bg-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-soft text-[11px] font-bold text-ink">
                        {initials('Verified Buyer')}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink">Verified Buyer</p>
                        <p className="text-[11px] text-muted">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <RatingStars rating={review.rating} size={13} />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{review.comment}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </Reveal>

      {related.length > 0 && (
        <Reveal as="section" className="mt-14">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="eyebrow">You may also like</p>
              <h2 className="section-title mt-1">More from {product.categories?.name || 'the lineup'}</h2>
            </div>
            <Link to={`/shop?category=${product.categories?.slug || ''}`} className="text-sm font-semibold text-brand">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {related.map((item, index) => (
              <ProductCard
                key={item.id}
                product={item}
                revealDelay={(index % 4) * 55}
              />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  )
}
