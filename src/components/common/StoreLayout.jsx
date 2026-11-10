import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import CartDrawer from '@/components/common/CartDrawer'
import Loader from '@/components/common/Loader'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
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
    </div>
  )
}
