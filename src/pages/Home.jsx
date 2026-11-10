import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import ProductCard from '@/components/product/ProductCard'
import Loader from '@/components/common/Loader'
import Reveal from '@/components/common/Reveal'
import Seo from '@/components/common/Seo'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { fetchBanners, fetchProducts } from '@/lib/api'
import { formatMMK } from '@/lib/utils'

const perks = [
  { icon: ShieldCheck, title: '100% genuine', text: 'Official Apple products only.' },
  { icon: Truck, title: 'Fast delivery', text: 'Yangon same-day on express.' },
  { icon: RotateCcw, title: '7-day returns', text: 'No questions, no hassle.' },
  { icon: CreditCard, title: 'Flexible payment', text: 'Card, Apple Pay, or COD.' },
]

export default function Home() {
  const { shipping } = useSiteSettings()
  const [products, setProducts] = useState([])
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const freeShippingLabel = formatMMK(Number(shipping.free_threshold) || 0)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [productRows, bannerRows] = await Promise.all([
          fetchProducts(),
          fetchBanners(),
        ])
        if (!active) return
        setProducts(productRows)
        setBanners(bannerRows)
      } catch (error) {
        console.error(error)
        toast.error('Could not load the storefront. Please refresh.')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const featured = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.featured && product.categories?.slug !== 'accessories',
        )
        .slice(0, 8),
    [products],
  )
  const accessories = useMemo(
    () =>
      products
        .filter((product) => product.categories?.slug === 'accessories')
        .slice(0, 3),
    [products],
  )

  const primaryBanner = banners[0]
  const secondaryBanner = banners[1]

  return (
    <div>
      <Seo
        title="iPhone Hub — Premium iPhones & Accessories in Myanmar"
        description={`Shop the latest iPhone 18 Pro, iPhone Air and genuine Apple accessories at iPhone Hub. Free delivery over ${freeShippingLabel}, 7-day returns and 1-year warranty across Myanmar.`}
        url="/"
        keywords="iPhone Myanmar, buy iPhone Yangon, iPhone 18 Pro price, Apple accessories Myanmar"
      />
      <section className="wrap pt-5 sm:pt-7">
        <div className="grid gap-3 lg:grid-cols-3">
          <Link
            to={primaryBanner?.cta_link || '/product/iphone-18-pro'}
            className="group relative min-h-[300px] overflow-hidden rounded-[28px] bg-[#0a0a0b] sm:min-h-[420px] lg:col-span-2 lg:min-h-[460px]"
          >
            <img
              src={primaryBanner?.image || '/images/hero/iphone-18-pro-hero-v2.webp'}
              alt={primaryBanner?.title || 'iPhone 18 Pro'}
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-[78%_center] opacity-95 transition-transform duration-700 group-hover:scale-[1.03] sm:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/5 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/40 sm:to-transparent" />
            <div className="relative z-10 flex h-full flex-col justify-end p-5 text-white sm:max-w-lg sm:justify-center sm:p-9">
              <span className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-pill border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] backdrop-blur">
                <Sparkles size={12} />
                New arrival
              </span>
              <h1 className="text-balance text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
                {primaryBanner?.title || 'iPhone 18 Pro'}
              </h1>
              <p className="mt-2.5 max-w-sm text-[13px] leading-relaxed text-white/70 sm:mt-3 sm:text-base">
                {primaryBanner?.subtitle || 'Powered by Apple Intelligence.'} A20 Pro chip,
                pro camera system, and the most advanced iPhone display ever.
              </p>
              <p className="mt-3 text-sm font-medium text-white/80">
                From {formatMMK(4799000)}
              </p>
              <span className="mt-5 inline-flex h-10 w-fit items-center gap-2 rounded-pill bg-white px-4 text-sm font-semibold text-black transition-transform group-hover:scale-[1.02] sm:mt-6 sm:h-11 sm:px-5">
                {primaryBanner?.cta_label || 'Shop now'}
                <ArrowRight size={15} />
              </span>
            </div>
          </Link>

          <Link
            to={secondaryBanner?.cta_link || '/product/iphone-air'}
            className="group relative flex min-h-[200px] flex-col overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-[#eef6fb] to-[#dfedf7] p-6 text-ink dark:from-[#101820] dark:via-[#0d141b] dark:to-[#0b1016] sm:min-h-[220px] lg:min-h-0"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                Ultra thin
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {secondaryBanner?.title || 'iPhone Air'}
              </h2>
              <p className="mt-1.5 max-w-[210px] text-sm text-muted">
                {secondaryBanner?.subtitle || 'Impossibly thin. Incredibly powerful.'}
              </p>
            </div>
            <div className="relative mt-auto flex items-end justify-between gap-3 pt-5">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                {secondaryBanner?.cta_label || 'Explore'}
                <ChevronRight size={15} />
              </span>
              <img
                src={secondaryBanner?.image || '/images/products/iphone-air-skyblue.webp'}
                alt="iPhone Air"
                loading="lazy"
                decoding="async"
                className="hidden h-56 w-auto object-contain drop-shadow-xl transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:scale-[1.03] lg:block xl:h-64"
              />
            </div>
          </Link>
        </div>
      </section>

      {/* <section className="wrap mt-8 sm:mt-10">
        <Reveal className="mb-4 flex items-end justify-between">
          <div>
            <p className="eyebrow">Browse</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Shop by series
            </h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-1 text-sm font-semibold text-brand sm:flex">
            View all <ChevronRight size={15} />
          </Link>
        </Reveal>
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
          {categories.map((category, index) => {
            const style = categoryStyles[category.slug] || fallbackCategoryStyle
            const Icon = style.icon
            return (
              <Reveal key={category.id} delay={index * 45} className="h-full">
                <Link
                  to={`/shop?category=${category.slug}`}
                  className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-line bg-surface p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-sm"
                >
                  <span
                    className={`grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br sm:h-16 sm:w-16 ${style.tone}`}
                  >
                    <Icon size={22} strokeWidth={1.8} className="transition-transform duration-300 group-hover:scale-110" />
                  </span>
                  <span className="line-clamp-1 text-[11px] font-semibold text-ink sm:text-xs">
                    {category.name}
                  </span>
                </Link>
              </Reveal>
            )
          })}
        </div>
      </section> */}

      <section className="wrap mt-12">
        <Reveal className="mb-5 flex items-end justify-between">
          <div>
            <p className="eyebrow">Handpicked</p>
            <h2 className="section-title mt-1">Featured iPhones</h2>
          </div>
          <Link to="/shop" className="flex items-center gap-1 text-sm font-semibold text-brand">
            Shop all <ChevronRight size={15} />
          </Link>
        </Reveal>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                revealDelay={(index % 4) * 65}
              />
            ))}
          </div>
        )}
      </section>

      <Reveal as="section" className="wrap mt-12">
        <div className="grid gap-3 rounded-[24px] border border-line bg-surface p-5 sm:grid-cols-2 sm:gap-6 sm:p-7 lg:grid-cols-4">
          {perks.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-soft text-ink">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {accessories.length > 0 && (
        <section className="wrap mt-12">
          <Reveal className="mb-5 flex items-end justify-between">
            <div>
              <p className="eyebrow">Complete the setup</p>
              <h2 className="section-title mt-1">Essential accessories</h2>
            </div>
            <Link
              to="/shop?category=accessories"
              className="flex items-center gap-1 text-sm font-semibold text-brand"
            >
              View all <ChevronRight size={15} />
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {accessories.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                revealDelay={(index % 3) * 65}
              />
            ))}
          </div>
        </section>
      )}

      <Reveal as="section" className="wrap mt-12">
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-soft p-6 sm:p-10">
          <div className="relative z-10 max-w-md">
            <p className="eyebrow">Why iPhone Hub</p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              The easiest way to get a new iPhone in Myanmar.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Authentic devices, honest prices, and delivery you can track from checkout to
              your door. Pay with card, Apple Pay, or cash on delivery.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">
                Shop the lineup
                <ArrowRight size={15} />
              </Link>
              <Link to="/orders" className="btn-outline">
                Track an order
              </Link>
            </div>
          </div>
          <img
            src="/images/products/iphone-18-pro-max-burgundy.webp"
            alt="iPhone 18 Pro Max"
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute -bottom-10 right-0 hidden h-[115%] w-auto rotate-[-8deg] object-contain opacity-90 sm:block lg:right-10"
          />
        </div>
      </Reveal>
    </div>
  )
}
