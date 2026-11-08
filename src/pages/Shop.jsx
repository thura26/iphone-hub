import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { toast } from 'sonner'
import ProductCard from '@/components/product/ProductCard'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Select from '@/components/common/Select'
import { fetchCategories, fetchProducts, minVariantPrice } from '@/lib/api'
import { cn } from '@/lib/utils'

const priceRanges = [
  { value: 'all', label: 'All prices', test: () => true },
  { value: 'under-2m', label: 'Under Ks 2,000,000', test: (price) => price < 2000000 },
  { value: '2m-3m', label: 'Ks 2M – 3M', test: (price) => price >= 2000000 && price < 3000000 },
  { value: '3m-5m', label: 'Ks 3M – 5M', test: (price) => price >= 3000000 && price < 5000000 },
  { value: 'over-5m', label: 'Over Ks 5,000,000', test: (price) => price >= 5000000 },
]

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'newest', label: 'Newest' },
]

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = searchParams.get('category') || 'all'
  const queryParam = searchParams.get('q') || ''
  const [search, setSearch] = useState(queryParam)
  const [sort, setSort] = useState('featured')
  const [priceRange, setPriceRange] = useState('all')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSearch(queryParam)
  }, [queryParam])

  useEffect(() => {
    let active = true
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([productRows, categoryRows]) => {
        if (!active) return
        setProducts(productRows)
        setCategories(categoryRows)
      })
      .catch((error) => {
        console.error(error)
        toast.error('Could not load products')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const selectCategory = (slug) => {
    const next = new URLSearchParams(searchParams)
    if (slug === 'all') next.delete('category')
    else next.set('category', slug)
    setSearchParams(next, { replace: true })
  }

  const activeCategory = categories.find((category) => category.slug === categorySlug)
  const activePriceRange = priceRanges.find((range) => range.value === priceRange) || priceRanges[0]

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = products.filter((product) => {
      if (categorySlug !== 'all' && product.categories?.slug !== categorySlug) return false
      if (term) {
        const haystack = `${product.name} ${product.description || ''} ${product.categories?.name || ''}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      if (!activePriceRange.test(minVariantPrice(product))) return false
      return true
    })

    switch (sort) {
      case 'price-asc':
        return list.sort((a, b) => minVariantPrice(a) - minVariantPrice(b))
      case 'price-desc':
        return list.sort((a, b) => minVariantPrice(b) - minVariantPrice(a))
      case 'rating':
        return list.sort((a, b) => Number(b.rating) - Number(a.rating))
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      default:
        return list.sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            new Date(a.created_at) - new Date(b.created_at),
        )
    }
  }, [products, categorySlug, search, sort, activePriceRange])

  const resetFilters = () => {
    setSearch('')
    setSort('featured')
    setPriceRange('all')
    setSearchParams({}, { replace: true })
  }

  const hasFilters = search || categorySlug !== 'all' || priceRange !== 'all' || sort !== 'featured'

  return (
    <div className="wrap py-6 sm:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">iPhone Hub</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {activeCategory ? activeCategory.name : 'Shop all products'}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {activeCategory
              ? `Explore the ${activeCategory.name} lineup, available with flexible storage and colors.`
              : 'Every iPhone and accessory in one place. Genuine Apple products with local warranty.'}
          </p>
        </div>
        <div className="text-sm text-muted sm:text-right">
          <span className="font-semibold text-ink">{filtered.length}</span> product
          {filtered.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="relative mt-6 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by model, color, or accessory…"
          className="field pl-11 pr-10"
          aria-label="Search products"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink"
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => selectCategory('all')}
          className={cn('pill shrink-0', categorySlug === 'all' && 'border-ink bg-ink text-surface')}
        >
          All products
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => selectCategory(category.slug)}
            className={cn(
              'pill shrink-0',
              categorySlug === category.slug && 'border-ink bg-ink text-surface',
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl border border-line bg-surface px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
          <SlidersHorizontal size={14} />
          Filters
        </span>
        <Select
          value={sort}
          onChange={setSort}
          options={sortOptions}
          size="sm"
          aria-label="Sort products"
        />
        <Select
          value={priceRange}
          onChange={setPriceRange}
          options={priceRanges}
          size="sm"
          aria-label="Filter by price"
        />
        {hasFilters && (
          <button type="button" onClick={resetFilters} className="ml-auto text-xs font-semibold text-brand">
            Clear all
          </button>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader label="Loading products…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No products found"
            description="Try a different search term, category, or price range."
            action={
              <button type="button" onClick={resetFilters} className="btn-primary">
                Reset filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {filtered.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                revealDelay={(index % 4) * 55}
              />
            ))}
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-10 rounded-2xl border border-line bg-soft px-5 py-4 text-sm text-muted">
          Not sure which model to choose?{' '}
          <Link to="/product/iphone-18-pro" className="font-semibold text-brand">
            Explore iPhone 18 Pro
          </Link>{' '}
          or{' '}
          <button
            type="button"
            className="font-semibold text-brand"
            onClick={() => toast.info('Call us at +95 9 000 000 000 — 9am to 6pm daily.')}
          >
            talk to our team
          </button>
          .
        </div>
      )}
    </div>
  )
}
