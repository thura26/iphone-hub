import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Package,
  ShoppingCart,
  Star,
  Users,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '@/supabaseClient'
import { formatDate, formatMMK } from '@/lib/utils'
import StatCard from '@/components/admin/StatCard'
import StatusBadge from '@/components/common/StatusBadge'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'

function buildSalesSeries(orders) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      total: 0,
      orders: 0,
    }
  })
  const map = new Map(days.map((day) => [day.key, day]))
  orders
    .filter((order) => order.status !== 'cancelled')
    .forEach((order) => {
      const key = new Date(order.created_at).toISOString().slice(0, 10)
      const day = map.get(key)
      if (day) {
        day.total += Number(order.total_amount)
        day.orders += 1
      }
    })
  return days
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState([])
  const [profiles, setProfiles] = useState([])
  const [products, setProducts] = useState([])
  const [pendingReviews, setPendingReviews] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*, product_variants(*), categories(name)').order('name'),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('approved', false),
    ])
      .then(([orderResult, profileResult, productResult, reviewResult]) => {
        if (!active) return
        if (orderResult.error) console.error(orderResult.error)
        if (profileResult.error) console.error(profileResult.error)
        if (productResult.error) console.error(productResult.error)
        setOrders(orderResult.data || [])
        setProfiles(profileResult.data || [])
        setProducts(productResult.data || [])
        setPendingReviews(reviewResult.count || 0)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const stats = useMemo(() => {
    const validOrders = orders.filter((order) => order.status !== 'cancelled')
    const revenue = validOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)
    const customers = profiles.filter((profile) => profile.role === 'customer').length
    const lowStock = products.flatMap((product) =>
      (product.product_variants || [])
        .filter((variant) => variant.active && Number(variant.stock) <= 5)
        .map((variant) => ({ ...variant, productName: product.name, productId: product.id })),
    )
    return { revenue, customers, lowStock }
  }, [orders, profiles, products])

  const salesSeries = useMemo(() => buildSalesSeries(orders), [orders])

  const topProducts = useMemo(() => {
    const map = new Map()
    orders
      .filter((order) => order.status !== 'cancelled')
      .forEach((order) => {
        ;(order.order_items || []).forEach((item) => {
          const key = item.product_name
          const current = map.get(key) || { name: key, quantity: 0, revenue: 0 }
          current.quantity += item.quantity
          current.revenue += Number(item.unit_price) * item.quantity
          map.set(key, current)
        })
      })
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [orders])

  if (loading) return <Loader label="Loading dashboard…" />

  const weekRevenue = salesSeries.reduce((sum, day) => sum + day.total, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Overview</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Here is how iPhone Hub is performing today.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/admin/products/new" className="btn-primary btn-sm">
            <Package size={14} />
            Add product
          </Link>
          <Link to="/admin/orders" className="btn-outline btn-sm">
            View orders
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatMMK(stats.revenue)}
          icon={BadgeDollarSign}
          tone="success"
          hint={`${formatMMK(weekRevenue)} in the last 7 days`}
        />
        <StatCard
          label="Orders"
          value={orders.length}
          icon={ShoppingCart}
          tone="brand"
          hint={`${orders.filter((order) => order.status === 'pending').length} awaiting confirmation`}
        />
        <StatCard
          label="Customers"
          value={stats.customers}
          icon={Users}
          hint={`${profiles.filter((profile) => profile.role === 'admin').length} admin account(s)`}
        />
        <StatCard
          label="Low stock"
          value={stats.lowStock.length}
          icon={AlertTriangle}
          tone={stats.lowStock.length > 0 ? 'warning' : 'default'}
          hint="Variants with 5 or fewer units"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-ink">Sales overview</h2>
              <p className="mt-0.5 text-xs text-muted">Revenue from non-cancelled orders, last 7 days</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tracking-tight text-ink">{formatMMK(weekRevenue)}</p>
              <p className="text-[11px] text-muted">{salesSeries.reduce((sum, day) => sum + day.orders, 0)} orders</p>
            </div>
          </div>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesSeries} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => (value >= 1000000 ? `${Math.round(value / 1000000)}M` : value)}
                />
                <Tooltip
                  formatter={(value, name) => [name === 'total' ? formatMMK(value) : value, name === 'total' ? 'Revenue' : 'Orders']}
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'var(--color-ink)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-brand)"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="space-y-3">
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Pending reviews</h2>
              <Link to="/admin/reviews" className="text-[11px] font-semibold text-brand">Review</Link>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-warning/10 text-warning">
                <Star size={18} />
              </span>
              <div>
                <p className="text-xl font-bold text-ink">{pendingReviews}</p>
                <p className="text-[11px] text-muted">Awaiting approval</p>
              </div>
            </div>
          </section>

          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">Low stock alerts</h2>
              <Link to="/admin/products" className="text-[11px] font-semibold text-brand">Manage</Link>
            </div>
            {stats.lowStock.length === 0 ? (
              <p className="mt-3 rounded-lg bg-success/5 px-3 py-2 text-xs text-success">
                All variants are well stocked.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-line">
                {stats.lowStock.slice(0, 5).map((variant) => (
                  <li key={variant.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">{variant.productName}</p>
                      <p className="text-[10px] text-muted">{variant.storage} · {variant.color}</p>
                    </div>
                    <span className={variant.stock === 0 ? 'badge-danger' : 'badge-warning'}>
                      {variant.stock === 0 ? 'Out' : `${variant.stock} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-card border border-line bg-soft/60 p-4">
            <h2 className="text-sm font-bold text-ink">Quick actions</h2>
            <div className="mt-2 grid gap-1.5">
              {[
                { to: '/admin/orders', label: 'Process pending orders' },
                { to: '/admin/coupons', label: 'Create a coupon' },
                { to: '/admin/banners', label: 'Update homepage banners' },
                { to: '/admin/categories', label: 'Organise categories' },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  {action.label}
                  <ArrowRight size={12} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-bold text-ink">Recent orders</h2>
            <Link to="/admin/orders" className="text-[11px] font-semibold text-brand">View all</Link>
          </div>
          {orders.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No orders yet" description="Orders will appear here as customers check out." className="border-0 py-8" />
            </div>
          ) : (
            <>
              <ul className="divide-y divide-line sm:hidden">
                {orders.slice(0, 5).map((order) => (
                  <li key={order.id}>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-soft/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink">
                          {order.order_number}
                        </p>
                        <p className="truncate text-[10px] text-muted">
                          {order.customer_name || 'Guest'} · {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-semibold text-ink">
                          {formatMMK(order.total_amount)}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="table-head">
                      <th className="px-4 py-2.5">Order</th>
                      <th className="px-4 py-2.5">Customer</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-soft/60">
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="font-semibold text-ink hover:text-brand"
                          >
                            {order.order_number}
                          </Link>
                          <p className="mt-0.5 text-[10px] text-muted">
                            {formatDate(order.created_at)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {order.customer_name || 'Guest'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-ink">
                          {formatMMK(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-bold text-ink">Top products</h2>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No sales data" description="Top products appear once orders are placed." className="border-0 py-8" />
            </div>
          ) : (
            <ul className="divide-y divide-line px-4">
              {topProducts.map((product, index) => (
                <li key={product.name} className="flex items-center gap-3 py-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-soft text-[10px] font-bold text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{product.name}</p>
                    <p className="text-[10px] text-muted">{product.quantity} sold</p>
                  </div>
                  <span className="text-xs font-semibold text-ink">{formatMMK(product.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
