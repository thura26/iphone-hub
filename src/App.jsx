import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { ConfirmProvider } from '@/context/ConfirmContext'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import { SiteSettingsProvider } from '@/context/SiteSettingsContext'
import StoreLayout from '@/components/common/StoreLayout'
import WishlistSync from '@/components/common/WishlistSync'
import { RequireAdmin, RequireAuth } from '@/components/common/RouteGuards'
import Loader from '@/components/common/Loader'
import AdminLayout from '@/components/admin/AdminLayout'

const Welcome = lazy(() => import('@/pages/Welcome'))
const Home = lazy(() => import('@/pages/Home'))
const Shop = lazy(() => import('@/pages/Shop'))
const ProductDetail = lazy(() => import('@/pages/ProductDetail'))
const About = lazy(() => import('@/pages/About'))
const Contact = lazy(() => import('@/pages/Contact'))
const Checkout = lazy(() => import('@/pages/Checkout'))
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'))
const Orders = lazy(() => import('@/pages/Orders'))
const OrderDetail = lazy(() => import('@/pages/OrderDetail'))
const Profile = lazy(() => import('@/pages/Profile'))
const Addresses = lazy(() => import('@/pages/Addresses'))
const Wishlist = lazy(() => import('@/pages/Wishlist'))
const Auth = lazy(() => import('@/pages/Auth'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'))
const AdminProductForm = lazy(() => import('@/pages/admin/AdminProductForm'))
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'))
const AdminOrderDetail = lazy(() => import('@/pages/admin/AdminOrderDetail'))
const AdminCustomers = lazy(() => import('@/pages/admin/AdminCustomers'))
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'))
const AdminBanners = lazy(() => import('@/pages/admin/AdminBanners'))
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews'))
const AdminCoupons = lazy(() => import('@/pages/admin/AdminCoupons'))
const AdminReturns = lazy(() => import('@/pages/admin/AdminReturns'))
const AdminAuditLog = lazy(() => import('@/pages/admin/AdminAuditLog'))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'))

function AppToaster() {
  const { isDark } = useTheme()
  return (
    <Toaster
      position="top-center"
      theme={isDark ? 'dark' : 'light'}
      richColors
      closeButton
      toastOptions={{
        style: { borderRadius: '14px' },
      }}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SiteSettingsProvider>
        <AuthProvider>
          <BrowserRouter>
            <ConfirmProvider>
              <WishlistSync />
              <AppToaster />
              <Suspense fallback={<Loader full label="Loading iPhone Hub…" />}>
                <Routes>
                  <Route path="/welcome" element={<Welcome />} />

                  <Route element={<StoreLayout />}>
                    <Route index element={<Home />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="product/:slug" element={<ProductDetail />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route
                      path="checkout"
                      element={
                        <RequireAuth>
                          <Checkout />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="order-success/:orderNumber"
                      element={
                        <RequireAuth>
                          <OrderSuccess />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="orders"
                      element={
                        <RequireAuth>
                          <Orders />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="orders/:id"
                      element={
                        <RequireAuth>
                          <OrderDetail />
                        </RequireAuth>
                      }
                    />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route
                      path="profile"
                      element={
                        <RequireAuth>
                          <Profile />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="profile/addresses"
                      element={
                        <RequireAuth>
                          <Addresses />
                        </RequireAuth>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  <Route path="/auth" element={<Auth />} />

                  <Route
                    path="/admin"
                    element={
                      <RequireAdmin>
                        <AdminLayout />
                      </RequireAdmin>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route path="products/:id/edit" element={<AdminProductForm />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:id" element={<AdminOrderDetail />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="banners" element={<AdminBanners />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="returns" element={<AdminReturns />} />
                    <Route path="audit-log" element={<AdminAuditLog />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </ConfirmProvider>
          </BrowserRouter>
        </AuthProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  )
}
