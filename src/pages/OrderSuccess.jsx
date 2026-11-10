import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Clock,
  Mail,
  MapPin,
  PackageCheck,
  Truck,
} from 'lucide-react'
import { supabase } from '@/supabaseClient'
import { formatDate, formatMMK, PAYMENT_METHODS } from '@/lib/utils'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Seo from '@/components/common/Seo'

export default function OrderSuccess() {
  const { orderNumber } = useParams()
  const location = useLocation()
  const stateOrder = location.state?.order
  const stateShipping = location.state?.shippingAddress
  const statePayment = location.state?.paymentMethod
  const stateDelivery = location.state?.deliveryMethod

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('order_number', orderNumber)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error(error)
        setOrder(data)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [orderNumber])

  if (loading && !stateOrder) return <Loader full label="Loading your order…" />

  const summary = order || stateOrder
  if (!summary) {
    return (
      <div className="wrap py-16">
        <EmptyState
          icon={PackageCheck}
          title="Order not found"
          description="We could not find this order. Check your order history for the latest status."
          action={<Link to="/orders" className="btn-primary">View my orders</Link>}
        />
      </div>
    )
  }

  const items = order?.order_items || []
  const paymentLabel = PAYMENT_METHODS[statePayment || order?.payment_method]?.label
  const deliveryLabel = (stateDelivery || order?.delivery_method) === 'express' ? 'Express delivery' : 'Standard delivery'

  return (
    <div className="wrap py-10 sm:py-16">
      <Seo title="Order confirmed" noindex />
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success animate-fade-up">
            <Check size={30} strokeWidth={3} />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your order is confirmed and being prepared. We will keep you updated.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink">
            <PackageCheck size={15} className="text-brand" />
            {summary.order_number}
          </span>
        </div>

        <div className="card mt-8 overflow-hidden">
          <div className="grid gap-4 border-b border-line p-5 sm:grid-cols-3 sm:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Estimated delivery</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {order?.estimated_delivery ? formatDate(order.estimated_delivery) : summary.estimated_delivery ? formatDate(summary.estimated_delivery) : '2–4 business days'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Delivery</p>
              <p className="mt-1 text-sm font-semibold text-ink">{deliveryLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Payment</p>
              <p className="mt-1 text-sm font-semibold text-ink">{paymentLabel || 'Cash on Delivery'}</p>
            </div>
          </div>

          {items.length > 0 && (
            <ul className="divide-y divide-line px-5 sm:px-6">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3.5">
                  <span className="grid h-14 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <PackageCheck size={17} className="text-muted" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{item.product_name}</span>
                    <span className="block text-xs text-muted">
                      {[item.variant_storage, item.variant_color].filter(Boolean).join(' · ')} · Qty {item.quantity}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {formatMMK(Number(item.unit_price) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <dl className="space-y-2.5 border-t border-line p-5 text-sm sm:p-6">
            <div className="flex justify-between text-muted">
              <dt>Subtotal</dt>
              <dd className="font-medium text-ink">{formatMMK(summary.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Delivery</dt>
              <dd className="font-medium text-ink">
                {Number(summary.shipping_fee) > 0 ? formatMMK(summary.shipping_fee) : 'Free'}
              </dd>
            </div>
            {Number(summary.discount) > 0 && (
              <div className="flex justify-between text-success">
                <dt>Coupon discount</dt>
                <dd className="font-medium">− {formatMMK(summary.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-3">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="text-lg font-bold text-ink">{formatMMK(summary.total ?? summary.total_amount)}</dd>
            </div>
          </dl>
        </div>

        <div className="card mt-3 p-5 sm:p-6">
          <h2 className="text-sm font-bold text-ink">Delivery address</h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted">
            <MapPin size={15} className="mt-0.5 shrink-0" />
            <span>
              {order?.customer_name || stateShipping?.full_name}
              {order?.customer_phone || stateShipping?.phone ? ` · ${order?.customer_phone || stateShipping?.phone}` : ''}
              <br />
              {order?.address || stateShipping?.address}, {order?.township || stateShipping?.township},{' '}
              {order?.region || stateShipping?.region}
            </span>
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <Mail size={13} />
            A confirmation has been sent to your email.
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <Clock size={13} />
            You can track every status update in your order history.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Link to={order?.id ? `/orders/${order.id}` : '/orders'} className="btn-primary flex-1">
            <Truck size={16} />
            Track your order
          </Link>
          <Link to="/shop" className="btn-outline flex-1">
            Continue shopping
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  )
}
