import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from '@/components/common/Header'
import Footer from '@/components/common/Footer'
import CartDrawer from '@/components/common/CartDrawer'

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
          <Outlet />
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
