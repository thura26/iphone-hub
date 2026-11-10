import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RotateCcw,
  ScrollText,
  ShoppingCart,
  Star,
  Store,
  Tags,
  TicketPercent,
  Users,
  Settings,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { subscribeToTable } from '@/lib/realtime'
import { useAuth } from '@/context/AuthContext'
import { useConfirm } from '@/context/ConfirmContext'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import Avatar from '@/components/common/Avatar'
import Loader from '@/components/common/Loader'
import ThemeToggle from '@/components/common/ThemeToggle'
import { cn } from '@/lib/utils'

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
  { to: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
  { to: '/admin/audit-log', label: 'Audit log', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { profile, user, displayName, signOut } = useAuth()
  const { store } = useSiteSettings()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [pendingReturns, setPendingReturns] = useState(0)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let active = true
    const loadCounts = () => {
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .then(({ count }) => {
          if (active) setPendingOrders(count || 0)
        })
      supabase
        .from('return_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .then(({ count }) => {
          if (active) setPendingReturns(count || 0)
        })
    }
    loadCounts()
    const unsubscribeOrders = subscribeToTable({ table: 'orders', onChange: loadCounts })
    const unsubscribeReturns = subscribeToTable({
      table: 'return_requests',
      onChange: loadCounts,
    })
    return () => {
      active = false
      unsubscribeOrders()
      unsubscribeReturns()
    }
  }, [])

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: 'Sign out of the admin dashboard?',
      description: 'You will be returned to the storefront sign-in page.',
      confirmLabel: 'Sign out',
      tone: 'neutral',
      icon: LogOut,
    })
    if (!confirmed) return
    await signOut()
    toast.success('Signed out')
    navigate('/auth?mode=login')
  }

  return (
    <div className="min-h-screen bg-bg">
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-ink text-surface">
              <Store size={17} strokeWidth={2.4} />
            </span>
            <span>
              <span className="block text-[15px] font-bold leading-tight tracking-tight text-ink">{store.name}</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-brand">Admin</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-icon -mr-2 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('admin-nav-link', isActive && 'admin-nav-link-active')
              }
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {label === 'Orders' && pendingOrders > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white">
                  {pendingOrders}
                </span>
              )}
              {label === 'Returns' && pendingReturns > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-warning px-1.5 text-[10px] font-bold text-white">
                  {pendingReturns}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
            <Avatar src={profile?.avatar_url} alt="" size="xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink">{displayName}</p>
              <p className="truncate text-[10px] text-muted">{profile?.email || user?.email}</p>
            </div>
          </div>
          <Link
            to="/"
            className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-muted transition-colors hover:bg-soft hover:text-ink"
          >
            <ExternalLink size={14} />
            View storefront
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line glass px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-icon -ml-2 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Store administration</p>
            <p className="text-sm font-bold text-ink">{store.name}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link to="/" className="btn-icon" aria-label="View storefront">
              <ExternalLink size={18} />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div key={location.pathname} className="page-enter">
            <Suspense fallback={<Loader label="Loading…" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
