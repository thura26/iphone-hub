import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { ConfirmProvider } from '@/context/ConfirmContext'
import StoreLayout from '@/components/common/StoreLayout'
import WishlistSync from '@/components/common/WishlistSync'
import { RequireAdmin, RequireAuth } from '@/components/common/RouteGuards'
import Welcome from '@/pages/Welcome'
import Home from '@/pages/Home'
import Shop from '@/pages/Shop'
import ProductDetail from '@/pages/ProductDetail'
import About from '@/pages/About'
import Contact from '@/pages/Contact'
import Checkout from '@/pages/Checkout'
import OrderSuccess from '@/pages/OrderSuccess'
import Orders from '@/pages/Orders'
import OrderDetail from '@/pages/OrderDetail'
import Profile from '@/pages/Profile'
import Addresses from '@/pages/Addresses'
import Wishlist from '@/pages/Wishlist'
import Auth from '@/pages/Auth'
import NotFound from '@/pages/NotFound'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminProductForm from '@/pages/admin/AdminProductForm'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminOrderDetail from '@/pages/admin/AdminOrderDetail'
import AdminCustomers from '@/pages/admin/AdminCustomers'
import AdminCategories from '@/pages/admin/AdminCategories'
import AdminBanners from '@/pages/admin/AdminBanners'
import AdminReviews from '@/pages/admin/AdminReviews'
import AdminCoupons from '@/pages/admin/AdminCoupons'
import AdminSettings from '@/pages/admin/AdminSettings'

function AppToaster() {
  return (
    <Toaster
      position="top-center"
      theme="light"
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
    <AuthProvider>
      <BrowserRouter>
        <ConfirmProvider>
          <WishlistSync />
          <AppToaster />
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
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
        </ConfirmProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
