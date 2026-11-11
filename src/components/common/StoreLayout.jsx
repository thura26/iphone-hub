import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import CartDrawer from '@/components/common/CartDrawer'
import Loader from '@/components/common/Loader'
import { cn } from '@/lib/utils'

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
        'group fixed bottom-5 right-4 z-30 grid h-12 w-12 place-items-center rounded-full border border-line bg-surface/90 text-ink shadow-[var(--shadow-float)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-soft active:scale-95 sm:bottom-6 sm:right-6',
        visible
          ? 'back-to-top-in translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-4 scale-75 opacity-0',
      )}
    >
      <ArrowUp
        size={18}
        className="transition-transform duration-300 group-hover:-translate-y-1"
      />
    </button>
  )
}

function useBackToTopVisible() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return visible
}

export default function StoreLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <ScrollToTop />
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
