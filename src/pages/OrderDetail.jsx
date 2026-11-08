import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Circle,
  CreditCard,
  MapPin,
  PackageCheck,
  Truck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useConfirm } from '@/context/ConfirmContext'
import {
  cn,
  formatDate,
  formatDateTime,
  formatMMK,
  ORDER_STATUS_FLOW,
  ORDER_STATUS_META,
  PAYMENT_METHODS,
} from '@/lib/utils'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import StatusBadge from '@/components/common/StatusBadge'

export default function OrderDetail() {
  const { id } = useParams()
  const confirm = useConfirm()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  const loadOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), order_status_history(*)')
      .eq('id', id)
      .maybeSingle()
    if (error) {
      toast.error('Could not load this order')
      console.error(error)
    }
    setOrder(data)
    setLoading(false)
  }

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const history = useMemo(
    () =>
      [...(order?.order_status_history || [])].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      ),
    [order],
  )

  const cancelOrder = async () => {
    const confirmed = await confirm({
      title: `Cancel order ${order.order_number}?`,
      description: 'The order will be cancelled and its stock returned to the store. This cannot be undone.',
      confirmLabel: 'Cancel order',
      cancelLabel: 'Keep order',
      tone: 'warning',
      icon: XCircle,
    })
    if (!confirmed) return
    setCancelling(true)
    const { error } = await supabase.rpc('cancel_order', { p_order_id: order.id })
    setCancelling(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Order cancelled')
    loadOrder()
  }

  if (loading) return <Loader full label="Loading order…" />

  if (!order) {
    return (
      <div className="wrap py-16">
        <EmptyState
          icon={PackageCheck}
          title="Order not found"
          description="This order may not exist or belongs to another account."
          action={<Link to="/orders" className="btn-primary">Back to orders</Link>}
        />
      </div>
    )
  }

  const items = order.order_items || []
  const cancellable = ['pending', 'confirmed'].includes(order.status)
  const cancelled = order.status === 'cancelled'
  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status)
  const statusTime = (status) =>
    history.find((entry) => entry.status === status)?.created_at

  return (
    <div className="wrap py-6 sm:py-9">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={15} />
        All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{order.order_number}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Placed {formatDateTime(order.created_at)} · {items.length} product{items.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cancellable && (
            <button type="button" onClick={cancelOrder} disabled={cancelling} className="btn-danger btn-sm">
              {cancelling ? 'Cancelling…' : 'Cancel order'}
            </button>
          )}
          <Link to="/shop" className="btn-outline btn-sm">Shop again</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-ink">Order tracking</h2>
              {order.estimated_delivery && !cancelled && (
                <span className="text-xs text-muted">
                  ETA <span className="font-semibold text-ink">{formatDate(order.estimated_delivery)}</span>
                </span>
              )}
            </div>

            {cancelled ? (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4">
                <XCircle size={20} className="mt-0.5 shrink-0 text-danger" />
                <div>
                  <p className="text-sm font-semibold text-ink">Order cancelled</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {statusTime('cancelled')
                      ? `Cancelled on ${formatDateTime(statusTime('cancelled'))}.`
                      : 'This order has been cancelled.'}{' '}
                    Any reserved stock has been returned.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <div className="flex items-start">
                  {ORDER_STATUS_FLOW.map((status, index) => {
                    const complete = index <= currentIndex
                    const current = index === currentIndex
                    return (
                      <div key={status} className="relative flex flex-1 flex-col items-center text-center">
                        {index < ORDER_STATUS_FLOW.length - 1 && (
                          <span
                            className={cn(
                              'absolute left-[calc(50%+14px)] top-3.5 h-0.5 w-[calc(100%-28px)]',
                              index < currentIndex ? 'bg-success' : 'bg-line',
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            'relative z-10 grid h-7 w-7 place-items-center rounded-full border text-[10px] font-bold',
                            complete
                              ? 'border-success bg-success text-white'
                              : 'border-line bg-surface text-muted',
                            current && 'ring-4 ring-success/15',
                          )}
                        >
                          {complete ? <Check size={13} strokeWidth={3} /> : <Circle size={8} fill="currentColor" />}
                        </span>
                        <span className={cn('mt-2 text-[10px] font-semibold sm:text-xs', complete ? 'text-ink' : 'text-muted')}>
                          {ORDER_STATUS_META[status].label}
                        </span>
                        {statusTime(status) && (
                          <span className="mt-0.5 hidden text-[9px] text-muted sm:block">
                            {formatDate(statusTime(status))}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-6 space-y-3 border-t border-line pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Activity</h3>
                {[...history].reverse().map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-ink">
                        {ORDER_STATUS_META[entry.status]?.label || entry.status}
                        {entry.note ? <span className="font-normal text-muted"> — {entry.note}</span> : null}
                      </p>
                      <p className="text-[10px] text-muted">{formatDateTime(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Items</h2>
            <ul className="mt-3 divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3.5">
                  <span className="grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                      <PackageCheck size={18} className="text-muted" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink">{item.product_name}</span>
                    <span className="block text-xs text-muted">
                      {[item.variant_storage, item.variant_color].filter(Boolean).join(' · ')}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {formatMMK(item.unit_price)} × {item.quantity}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {formatMMK(Number(item.unit_price) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd className="font-medium text-ink">{formatMMK(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Delivery ({order.delivery_method})</dt>
                <dd className="font-medium text-ink">
                  {Number(order.shipping_fee) > 0 ? formatMMK(order.shipping_fee) : 'Free'}
                </dd>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Coupon {order.coupon_code ? `(${order.coupon_code})` : ''}</dt>
                  <dd className="font-medium">− {formatMMK(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-3">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="text-lg font-bold text-ink">{formatMMK(order.total_amount)}</dd>
              </div>
            </dl>
          </section>

          {order.note && (
            <section className="card p-5">
              <h2 className="text-sm font-bold text-ink">Order note</h2>
              <p className="mt-1.5 text-sm text-muted">{order.note}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink">Delivery</h2>
            <div className="mt-3 flex items-start gap-2.5 text-sm text-muted">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-ink">{order.customer_name}</p>
                <p className="mt-0.5">{order.customer_phone}</p>
                <p className="mt-1 leading-relaxed">
                  {order.address}, {order.township}, {order.region}
                  {order.postal_code ? ` ${order.postal_code}` : ''}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-soft px-3 py-2 text-xs text-muted">
              <Truck size={14} className="text-ink" />
              {order.delivery_method === 'express' ? 'Express · next business day' : 'Standard · 2–4 business days'}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink">Payment</h2>
            <div className="mt-3 flex items-center gap-2.5 text-sm">
              <CreditCard size={16} className="text-muted" />
              <span className="font-medium text-ink">
                {PAYMENT_METHODS[order.payment_method]?.label || order.payment_method}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Status: <span className="font-semibold capitalize text-ink">{order.payment_status}</span>
            </p>
            {order.coupon_code && (
              <p className="mt-2 ms-6 text-xs text-muted">
                Coupon: <span className="font-semibold text-ink">{order.coupon_code}</span>
              </p>
            )}
          </section>

          <section className="rounded-card border border-line bg-soft/60 p-4 text-[11px] leading-relaxed text-muted">
            Need help with this order? Contact us at{' '}
            <span className="font-semibold text-ink">hello@iphonehub.com</span> mentioning {order.order_number}.
          </section>
        </aside>
      </div>
    </div>
  )
}
