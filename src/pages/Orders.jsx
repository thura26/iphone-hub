import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Download, PackageCheck, Truck, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useConfirm } from '@/context/ConfirmContext'
import useRealtime from '@/hooks/useRealtime'
import { downloadInvoice } from '@/lib/invoice'
import { formatDate, formatMMK } from '@/lib/utils'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Seo from '@/components/common/Seo'
import StatusBadge from '@/components/common/StatusBadge'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'all', label: 'All orders' },
  { id: 'active', label: 'In progress' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

export default function Orders() {
  const confirm = useConfirm()
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [downloadingId, setDownloadingId] = useState(null)

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (error) {
      toast.error('Could not load your orders')
      console.error(error)
    }
    setOrders(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtime({
    table: 'orders',
    filter: user?.id ? `user_id=eq.${user.id}` : undefined,
    onChange: loadOrders,
    enabled: Boolean(user?.id),
  })

  const filtered = useMemo(() => {
    if (tab === 'all') return orders
    if (tab === 'active') {
      return orders.filter((order) => !['delivered', 'cancelled'].includes(order.status))
    }
    return orders.filter((order) => order.status === tab)
  }, [orders, tab])

  const cancelOrder = async (order) => {
    const confirmed = await confirm({
      title: `Cancel order ${order.order_number}?`,
      description: 'The order will be cancelled and its stock returned to the store. This cannot be undone.',
      confirmLabel: 'Cancel order',
      cancelLabel: 'Keep order',
      tone: 'warning',
      icon: XCircle,
    })
    if (!confirmed) return
    const { error } = await supabase.rpc('cancel_order', { p_order_id: order.id })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Order cancelled')
    loadOrders()
  }

  const handleInvoice = async (order) => {
    setDownloadingId(order.id)
    try {
      await downloadInvoice(order)
    } catch (error) {
      console.error(error)
      toast.error('Could not generate the invoice')
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) return <Loader full label="Loading your orders…" />

  return (
    <div className="wrap py-6 sm:py-9">
      <Seo
        title="My orders"
        description="Track iPhone Hub orders, follow delivery progress, download invoices and request returns."
        noindex
      />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">My orders</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            Track deliveries, view receipts, and manage orders.
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Live updates
            </span>
          </p>
        </div>
        <Link to="/shop" className="btn-outline btn-sm">Continue shopping</Link>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn('pill shrink-0', tab === item.id && 'border-ink bg-ink text-surface')}
          >
            {item.label}
            <span className={cn('text-[10px]', tab === item.id ? 'text-surface/60' : 'text-muted')}>
              {item.id === 'all'
                ? orders.length
                : item.id === 'active'
                  ? orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length
                  : orders.filter((order) => order.status === item.id).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={PackageCheck}
            title={orders.length === 0 ? 'No orders yet' : 'No orders in this view'}
            description={
              orders.length === 0
                ? 'When you place an order it will appear here with live tracking.'
                : 'Try another filter to see your other orders.'
            }
            action={<Link to="/shop" className="btn-primary">Start shopping</Link>}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.map((order) => {
            const items = order.order_items || []
            const cancellable = ['pending', 'confirmed'].includes(order.status)
            return (
              <article key={order.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-ink">{order.order_number}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Placed {formatDate(order.created_at)} · {items.reduce((sum, item) => sum + item.quantity, 0)} item
                      {items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold tracking-tight text-ink">{formatMMK(order.total_amount)}</p>
                    <p className="text-[11px] text-muted">
                      {order.payment_method === 'cod'
                        ? 'Cash on delivery'
                        : order.payment_method === 'apple_pay'
                          ? 'Apple Pay'
                          : 'Card'}
                      {' · '}
                      {order.payment_status}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="flex items-center gap-2">
                    {items.slice(0, 4).map((item) => (
                      <span key={item.id} className="grid h-12 w-10 place-items-center overflow-hidden rounded-lg bg-soft">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <PackageCheck size={15} className="text-muted" />
                        )}
                      </span>
                    ))}
                    {items.length > 4 && (
                      <span className="grid h-12 w-10 place-items-center rounded-lg bg-soft text-[10px] font-semibold text-muted">
                        +{items.length - 4}
                      </span>
                    )}
                    <div className="ml-1 hidden sm:block">
                      <p className="max-w-[220px] truncate text-xs font-medium text-ink">
                        {items.map((item) => item.product_name).join(', ')}
                      </p>
                      {order.estimated_delivery && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                          <Truck size={11} />
                          ETA {formatDate(order.estimated_delivery)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleInvoice(order)}
                      disabled={downloadingId === order.id}
                      className="btn-ghost btn-sm"
                    >
                      <Download size={13} />
                      {downloadingId === order.id ? 'Generating…' : 'Invoice'}
                    </button>
                    {cancellable && (
                      <button
                        type="button"
                        onClick={() => cancelOrder(order)}
                        className="btn-ghost btn-sm text-danger hover:bg-danger/10"
                      >
                        Cancel
                      </button>
                    )}
                    <Link to={`/orders/${order.id}`} className="btn-outline btn-sm">
                      View details
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
