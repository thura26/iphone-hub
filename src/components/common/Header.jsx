import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Heart,
  LayoutDashboard,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import Logo from '@/components/common/Logo'
import MobileMenu from '@/components/common/MobileMenu'
import HeaderSearch from '@/components/common/HeaderSearch'
import ThemeToggle from '@/components/common/ThemeToggle'
import Avatar from '@/components/common/Avatar'
import { useAuth } from '@/context/AuthContext'
import { useCartDrawerStore } from '@/store/cartDrawerStore'
import { useCartStore } from '@/store/cartStore'
import { useWishlistStore } from '@/store/wishlistStore'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?category=accessories', label: 'Accessories', category: 'accessories' },
  { to: '/contact', label: 'Contact' },
  { to: '/about', label: 'About' },
]

export default function Header() {
  const { user, profile, isAdmin } = useAuth()
  const openCart = useCartDrawerStore((state) => state.openCart)
  const location = useLocation()
  const items = useCartStore((state) => state.items)
  const wishlistIds = useWishlistStore((state) => state.ids)
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const currentCategory = new URLSearchParams(location.search).get('category')

  const isActive = (link) => {
    if (link.category) {
      return location.pathname === '/shop' && currentCategory === link.category
    }
    if (link.to === '/shop') {
      return location.pathname === '/shop' && !currentCategory
    }
    return location.pathname === link.to
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 glass">
        <div className="wrap flex h-16 items-center gap-4">
          <Logo />

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={cn(
                  'rounded-pill px-3.5 py-2 text-[13px] font-medium transition-colors',
                  isActive(link) ? 'bg-ink/[0.07] text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <HeaderSearch
            className="ml-auto hidden w-48 transition-[width] duration-200 focus-within:w-64 md:block"
            ariaLabel="Search products"
          />

          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((current) => !current)}
              className="btn-icon md:hidden"
              aria-label={mobileSearchOpen ? 'Close search' : 'Search'}
              aria-expanded={mobileSearchOpen}
            >
              {mobileSearchOpen ? <X size={19} /> : <Search size={19} />}
            </button>

            <ThemeToggle className="hidden sm:inline-flex" />

            {isAdmin && (
              <Link
                to="/admin"
                className="btn-icon hidden sm:inline-flex"
                aria-label="Admin dashboard"
                title="Admin dashboard"
              >
                <LayoutDashboard size={19} />
              </Link>
            )}

            <Link to="/wishlist" className="btn-icon relative" aria-label="Wishlist">
              <Heart size={19} />
              {wishlistIds.length > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface" />
              )}
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="btn-icon relative"
              aria-label="Open cart"
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {user ? (
              <Link
                to="/profile"
                className="ml-1 hidden rounded-full transition-transform hover:scale-105 lg:inline-grid"
                aria-label="Your account"
                title={profile?.full_name || user.email}
              >
                <Avatar
                  src={profile?.avatar_url}
                  alt=""
                  size="xs"
                  className="h-8 w-8 ring-2 ring-line/70"
                />
              </Link>
            ) : (
              <Link
                to="/auth?mode=login"
                className="ml-1 hidden items-center gap-1.5 rounded-pill bg-ink px-4 py-2 text-xs font-semibold text-surface transition-opacity hover:opacity-90 lg:inline-flex"
              >
                <UserRound size={14} />
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="btn-icon ml-0.5 lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="border-t border-line bg-surface px-4 py-2.5 md:hidden">
            <HeaderSearch
              autoFocus
              onNavigate={() => setMobileSearchOpen(false)}
              ariaLabel="Search products on mobile"
            />
          </div>
        )}
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
