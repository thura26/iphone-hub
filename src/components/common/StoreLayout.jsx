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

function BackToTop() {
  const visible = useBackToTopVisible()

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      title="Back to top"
      className={cn(
        'fixed bottom-5 right-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-[var(--shadow-float)] backdrop-blur transition-all duration-300 hover:bg-soft sm:bottom-6 sm:right-6',
        visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp size={18} />
    </button>
  )
}

function useBackToTopVisible() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return visible
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
