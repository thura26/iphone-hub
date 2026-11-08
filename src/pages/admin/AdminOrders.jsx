import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { formatDate, formatMMK } from '@/lib/utils'
import StatusBadge from '@/components/common/StatusBadge'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import { cn } from '@/lib/utils'

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'packed', label: 'Packed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

const paymentLabel = {
  cod: 'COD',
  card: 'Card',
  apple_pay: 'Apple Pay',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) toast.error(error.message)
        setOrders(data || [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return orders.filter((order) => {
      if (status !== 'all' && order.status !== status) return false
      if (!term) return true
      return `${order.order_number} ${order.customer_name || ''} ${order.customer_email || ''} ${order.customer_phone || ''}`
        .toLowerCase()
        .includes(term)
    })
  }, [orders, status, search])

  if (loading) return <Loader label="Loading orders…" />

  const counts = statusTabs.reduce((acc, tab) => {
    acc[tab.id] =
      tab.id === 'all'
        ? orders.length
        : orders.filter((order) => order.status === tab.id).length
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Fulfilment</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-muted">
            {orders.filter((order) => order.status === 'pending').length} pending · {orders.length} total orders
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Revenue</p>
          <p className="text-lg font-bold text-ink">
            {formatMMK(
              orders
                .filter((order) => order.status !== 'cancelled')
                .reduce((sum, order) => sum + Number(order.total_amount), 0),
            )}
          </p>
        </div>
      </div>

      <div className="card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search order, customer, email, phone…"
              className="field h-10 py-2 pl-9 text-xs"
            />
          </div>
          <span className="text-xs text-muted">{filtered.length} shown</span>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              className={cn(
                'shrink-0 rounded-pill border px-3 py-1.5 text-[11px] font-semibold transition-colors',
                status === tab.id
                  ? 'border-ink bg-ink text-surface'
                  : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {tab.label}
              <span className={cn('ml-1.5 text-[10px]', status === tab.id ? 'text-surface/60' : 'text-muted')}>
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders found"
          description="Orders will appear here when customers complete checkout."
        />
      ) : (
        <>
          <div className="card divide-y divide-line overflow-hidden md:hidden">
            {filtered.map((order) => {
              const itemCount = (order.order_items || []).reduce(
                (sum, item) => sum + item.quantity,
                0,
              )
              return (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="block p-4 transition-colors active:bg-soft/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold text-ink">
                      {order.order_number}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {formatDate(order.created_at)} · {itemCount} item{itemCount === 1 ? '' : 's'}
                  </p>
                  <div className="mt-2.5 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">
                        {order.customer_name || 'Customer'}
                      </p>
                      <p className="truncate text-[10px] text-muted">
                        {order.customer_phone || order.customer_email || 'No contact'}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-ink">
                      {formatMMK(order.total_amount)}
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                    <span className="text-[10px] text-muted">
                      {paymentLabel[order.payment_method] || order.payment_method} ·{' '}
                      <span className={order.payment_status === 'paid' ? 'text-success' : ''}>
                        {order.payment_status}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
                      View order
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead>
                  <tr className="table-head">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((order) => {
                    const itemCount = (order.order_items || []).reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    )
                    return (
                      <tr key={order.id} className="transition-colors hover:bg-soft/50">
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
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">
                            {order.customer_name || 'Customer'}
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted">
                            {order.customer_phone || order.customer_email}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-muted">{itemCount}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-ink">
                            {paymentLabel[order.payment_method] || order.payment_method}
                          </span>
                          <p
                            className={cn(
                              'mt-0.5 text-[10px] capitalize',
                              order.payment_status === 'paid' ? 'text-success' : 'text-muted',
                            )}
                          >
                            {order.payment_status}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-ink">
                          {formatMMK(order.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-soft hover:text-ink"
                            aria-label={`View ${order.order_number}`}
                          >
                            <ChevronRight size={15} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
