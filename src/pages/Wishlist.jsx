import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { useWishlist } from '@/hooks/useWishlist'
import { useWishlistStore } from '@/store/wishlistStore'
import { fetchProducts } from '@/lib/api'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import ProductCard from '@/components/product/ProductCard'

export default function Wishlist() {
  const { user } = useAuth()
  const { ids } = useWishlist()
  const clear = useWishlistStore((state) => state.clear)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchProducts()
      .then((rows) => setProducts(rows.filter((product) => ids.includes(product.id))))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')])

  return (
    <div className="wrap py-6 sm:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Saved for later</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Wishlist</h1>
          <p className="mt-1.5 text-sm text-muted">
            {ids.length} saved product{ids.length === 1 ? '' : 's'}
            {!user && ' · Sign in to sync across devices'}
          </p>
        </div>
        {ids.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clear()
              toast.success('Wishlist cleared')
            }}
            className="btn-ghost btn-sm text-muted hover:text-danger"
          >
            <Trash2 size={14} />
            Clear wishlist
          </button>
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader label="Loading your wishlist…" />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here for later."
            action={<Link to="/shop" className="btn-primary">Find something you love</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                revealDelay={(index % 4) * 55}
              />
            ))}
          </div>
        )}
      </div>

      {!user && products.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-soft px-5 py-4 text-sm text-muted">
          <span>Sign in to keep your wishlist in sync and access it from any device.</span>
          <Link to="/auth?mode=login" className="btn-primary btn-sm">Sign in</Link>
        </div>
      )}
    </div>
  )
}
