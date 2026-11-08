import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Headphones,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/common/Logo'
import Avatar from '@/components/common/Avatar'
import { useAuth } from '@/context/AuthContext'
import { useConfirm } from '@/context/ConfirmContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/shop?category=accessories', label: 'Accessories', icon: Headphones, category: 'accessories' },
  { to: '/contact', label: 'Contact', icon: MessageSquare },
  { to: '/about', label: 'About', icon: Info },
]

export default function MobileMenu({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, isAdmin, displayName, signOut } = useAuth()
  const confirm = useConfirm()

  const closeButtonRef = useRef(null)
  const previousFocusRef = useRef(null)
  const previousPathRef = useRef(`${location.pathname}${location.search}`)

  const [query, setQuery] = useState('')

  const currentCategory = new URLSearchParams(location.search).get('category')

  const isActive = (item) => {
    if (item.category) {
      return location.pathname === '/shop' && currentCategory === item.category
    }
    if (item.to === '/shop') {
      return location.pathname === '/shop' && !currentCategory
    }
    return location.pathname === item.to
  }

  useEffect(() => {
    if (!open) return undefined

    previousFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  useEffect(() => {
    const key = `${location.pathname}${location.search}`
    if (previousPathRef.current !== key) {
      previousPathRef.current = key
      if (open) onClose()
    }
  }, [location.pathname, location.search, open, onClose])

  const submitSearch = (event) => {
    event.preventDefault()
    const term = query.trim()
    navigate(term ? `/shop?q=${encodeURIComponent(term)}` : '/shop')
    setQuery('')
    onClose()
  }

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: 'Sign out of iPhone Hub?',
      description: 'You will need to sign in again to see your orders, wishlist, and saved addresses.',
      confirmLabel: 'Sign out',
      tone: 'neutral',
      icon: LogOut,
    })
    if (!confirmed) return
    const { error } = await signOut()
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Signed out')
    onClose()
    navigate('/')
  }

  const accountLinks = [
    { to: '/profile', label: 'Profile', icon: UserRound },
    { to: '/orders', label: 'My orders', icon: Package },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    { to: '/profile/addresses', label: 'Addresses', icon: MapPin },
  ]

  return (
    <div
      className={cn(
        'fixed inset-0 z-[75] lg:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={onClose}
        aria-label="Close menu"
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={cn(
          'absolute inset-y-0 right-0 flex w-[86%] max-w-[360px] flex-col border-l border-line bg-surface shadow-[var(--shadow-float)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3.5">
          <Logo />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="btn-icon -mr-1"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
          <form onSubmit={submitSearch} className="mt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search iPhones, accessories…"
                className="field pl-10"
                aria-label="Search products"
              />
            </div>
          </form>

          <nav className="mt-5 space-y-0.5" aria-label="Mobile navigation">
            {navItems.map(({ to, label, icon: Icon, category }) => {
              const active = isActive({ to, category })
              return (
                <Link
                  key={label}
                  to={to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-soft text-ink'
                      : 'text-muted hover:bg-soft hover:text-ink',
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2.3 : 2} />
                  <span className="flex-1">{label}</span>
                  <ChevronRight
                    size={15}
                    className={cn('text-muted/70', active && 'text-ink/40')}
                  />
                </Link>
              )
            })}
          </nav>

          <div className="my-5 border-t border-line" />

          {user ? (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-soft px-3 py-3">
                <Avatar src={profile?.avatar_url} alt="" size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                  <p className="truncate text-[11px] text-muted">{user.email}</p>
                </div>
              </div>

              <nav className="mt-2 space-y-0.5" aria-label="Account">
                {accountLinks.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-soft hover:text-ink"
                  >
                    <Icon size={18} />
                    <span className="flex-1">{label}</span>
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-soft hover:text-ink"
                  >
                    <LayoutDashboard size={18} />
                    <span className="flex-1">Admin dashboard</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/5"
                >
                  <LogOut size={18} />
                  Sign out
                </button>
              </nav>
            </>
          ) : (
            <div className="space-y-2">
              <Link to="/auth?mode=login" onClick={onClose} className="btn-primary w-full">
                Sign in
              </Link>
              <Link to="/auth?mode=signup" onClick={onClose} className="btn-outline w-full">
                Create an account
              </Link>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-line bg-soft/70 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
              Need a hand?
            </p>
            <div className="mt-2 space-y-1.5 text-xs text-muted">
              <a href="mailto:hello@iphonehub.com" className="flex items-center gap-2 hover:text-ink">
                <Mail size={13} />
                hello@iphonehub.com
              </a>
              <a href="tel:+959000000000" className="flex items-center gap-2 hover:text-ink">
                <MessageSquare size={13} />
                +95 9 000 000 000
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
