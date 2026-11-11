import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ArrowUp, Truck } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import CartDrawer from '@/components/common/CartDrawer'
import Loader from '@/components/common/Loader'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { cn, formatMMK } from '@/lib/utils'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

const RING_RADIUS = 20
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function BackToTop() {
  const { visible, progress } = useBackToTop()

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      title="Back to top"
      className={cn(
        'group fixed bottom-5 right-4 z-30 grid h-12 w-12 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-[var(--shadow-float)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-soft active:scale-95 sm:bottom-6 sm:right-6',
        visible
          ? 'back-to-top-in translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 scale-75 opacity-0',
      )}
    >
      <svg
        viewBox="0 0 48 48"
        className="absolute inset-0 h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-line"
        />
        <circle
          cx="24"
          cy="24"
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
          className="text-brand transition-[stroke-dashoffset] duration-150 ease-out"
        />
      </svg>
      <ArrowUp
        size={17}
        className="relative transition-transform duration-300 group-hover:-translate-y-1"
      />
    </button>
  )
}

function useBackToTop() {
  const [state, setState] = useState({ visible: false, progress: 0 })

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      setState({ visible: window.scrollY > 480, progress })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return state
}

export default function StoreLayout() {
  const { pathname } = useLocation()
  const { shipping, announcement } = useSiteSettings()
  const freeThreshold = Number(shipping.free_threshold) || 0
  const hideAnnouncement =
    announcement.enabled === false ||
    pathname === '/checkout' ||
    pathname.startsWith('/order-success')

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <ScrollToTop />
      {!hideAnnouncement && (
        <div className="border-b border-line bg-surface">
          <div className="wrap flex min-h-9 items-center justify-center gap-1.5 py-1 text-center text-[11px] text-muted">
            <Truck size={13} className="shrink-0 text-brand" />
            {freeThreshold > 0 ? (
              <span>
                Free standard delivery on orders over{' '}
                <strong className="font-semibold text-ink">{formatMMK(freeThreshold)}</strong>
              </span>
            ) : (
              <span>Free standard delivery on every order</span>
            )}
            <span className="mx-1 hidden text-line sm:inline">|</span>
            <span className="hidden sm:inline">7-day easy returns</span>
          </div>
        </div>
      )}
      <Header />
      <main className="flex-1">
        <div key={pathname} className="page-enter">
          <Suspense fallback={<Loader label="Loading…" />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <Footer />
      <CartDrawer />
      <BackToTop />
    </div>
  )
}
