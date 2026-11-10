import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Loader2,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
  Truck,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useConfirm } from '@/context/ConfirmContext'
import useRealtime from '@/hooks/useRealtime'
import { logAudit } from '@/lib/audit'
import { downloadInvoice } from '@/lib/invoice'
import {
  formatDate,
  formatDateTime,
  formatMMK,
  ORDER_STATUS_META,
  PAYMENT_METHODS,
  RETURN_STATUS_META,
  returnReasonLabel,
} from '@/lib/utils'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Select from '@/components/common/Select'
import StatusBadge from '@/components/common/StatusBadge'

const allStatuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']

export default function AdminOrderDetail() {
  const { id } = useParams()
  const confirm = useConfirm()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nextStatus, setNextStatus] = useState('')
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState('unpaid')
  const [savingPayment, setSavingPayment] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [returnRequest, setReturnRequest] = useState(null)

  const load = async () => {
    const [orderResult, returnResult] = await Promise.all([
      supabase
        .from('orders')
        .select('*, order_items(*), order_status_history(*)')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('return_requests')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false })
        .limit(1),
    ])
    if (orderResult.error) {
      toast.error(orderResult.error.message)
      console.error(orderResult.error)
    }
    const data = orderResult.data
    setOrder(data)
    setReturnRequest(returnResult.data?.[0] || null)
    if (data) {
      setNextStatus(data.status)
      setPaymentStatus(data.payment_status)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useRealtime({ table: 'orders', filter: `id=eq.${id}`, onChange: load, enabled: Boolean(id) })
  useRealtime({
    table: 'order_status_history',
    filter: `order_id=eq.${id}`,
    onChange: load,
    enabled: Boolean(id),
  })
  useRealtime({
    table: 'return_requests',
    filter: `order_id=eq.${id}`,
    onChange: load,
    enabled: Boolean(id),
  })

  const history = useMemo(
    () =>
      [...(order?.order_status_history || [])].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at),
      ),
    [order],
  )

  const updateStatus = async () => {
    if (nextStatus === order.status && !note.trim()) {
      toast.info('Choose a new status or add a note')
      return
    }
    if (nextStatus === 'cancelled' && order.status !== 'cancelled') {
      const confirmed = await confirm({
        title: 'Cancel this order?',
        description: 'Its stock will be returned to inventory. This action cannot be undone.',
        confirmLabel: 'Cancel order',
        cancelLabel: 'Keep order',
        tone: 'warning',
        icon: XCircle,
      })
      if (!confirmed) return
    }
    setUpdating(true)
    const { error } = await supabase.rpc('update_order_status', {
      p_order_id: order.id,
      p_status: nextStatus,
      p_note: note.trim() || null,
    })
    setUpdating(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Order status updated')
    void logAudit({
      action: 'order.status_updated',
      entityType: 'order',
      entityId: order.id,
      details: {
        order_number: order.order_number,
        from: order.status,
        to: nextStatus,
        note: note.trim() || null,
      },
    })
    setNote('')
    load()
  }

  const updatePayment = async () => {
    setSavingPayment(true)
    const previous = order.payment_status
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', order.id)
    setSavingPayment(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Payment status updated')
    void logAudit({
      action: 'order.payment_updated',
      entityType: 'order',
      entityId: order.id,
      details: {
        order_number: order.order_number,
        from: previous,
        to: paymentStatus,
      },
    })
    setOrder((current) => ({ ...current, payment_status: paymentStatus }))
  }

  const handleInvoice = async () => {
    setDownloading(true)
    try {
      await downloadInvoice(order)
    } catch (error) {
      console.error(error)
      toast.error('Could not generate the invoice')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <Loader label="Loading order…" />

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may have been deleted."
        action={<Link to="/admin/orders" className="btn-primary">Back to orders</Link>}
      />
    )
  }

  const items = order.order_items || []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link to="/admin/orders" className="btn-icon -ml-2 mt-1" aria-label="Back to orders">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-ink">{order.order_number}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              Placed {formatDateTime(order.created_at)} · {items.reduce((sum, item) => sum + item.quantity, 0)} items
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Order total</p>
            <p className="text-xl font-bold text-ink">{formatMMK(order.total_amount)}</p>
          </div>
          <button
            type="button"
            onClick={handleInvoice}
            disabled={downloading}
            className="btn-outline btn-sm"
          >
            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {downloading ? 'Preparing…' : 'Invoice PDF'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-bold text-ink">Items</h2>
              <span className="badge-neutral">{items.length} line items</span>
            </div>
            <ul className="divide-y divide-line sm:hidden">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
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
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-ink">{item.product_name}</p>
                      <p className="shrink-0 text-xs font-semibold text-ink">
                        {formatMMK(Number(item.unit_price) * item.quantity)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {[item.variant_storage, item.variant_color].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-1 text-[10px] text-muted">
                      {item.quantity} × {formatMMK(item.unit_price)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead>
                  <tr className="table-head">
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Unit price</th>
                    <th className="px-4 py-2.5">Qty</th>
                    <th className="px-4 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
                            {item.image ? (
                              <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-1"
                      />
                            ) : (
                              <PackageCheck size={14} className="text-muted" />
                            )}
                          </span>
                          <div>
                            <p className="font-semibold text-ink">{item.product_name}</p>
                            <p className="text-[10px] text-muted">
                              {[item.variant_storage, item.variant_color].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatMMK(item.unit_price)}</td>
                      <td className="px-4 py-3 text-muted">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">
                        {formatMMK(Number(item.unit_price) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="space-y-2 border-t border-line px-4 py-4 text-xs">
              <div className="flex justify-between text-muted">
                <dt>Subtotal</dt>
                <dd className="font-medium text-ink">{formatMMK(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Delivery</dt>
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
              <div className="flex justify-between border-t border-line pt-2.5">
                <dt className="font-semibold text-ink">Total</dt>
                <dd className="text-base font-bold text-ink">{formatMMK(order.total_amount)}</dd>
              </div>
            </dl>
          </section>

          {order.note && (
            <section className="card p-4">
              <h2 className="text-sm font-bold text-ink">Customer note</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{order.note}</p>
            </section>
          )}

          <section className="card p-4">
            <h2 className="text-sm font-bold text-ink">Status history</h2>
            {history.length === 0 ? (
              <p className="mt-2 text-xs text-muted">No status updates recorded yet.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {[...history].reverse().map((entry) => (
                  <li key={entry.id} className="flex items-start gap-3">
                    <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-soft text-[9px] font-bold text-muted">
                      {ORDER_STATUS_META[entry.status]?.label?.[0] || '?'}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        {ORDER_STATUS_META[entry.status]?.label || entry.status}
                        {entry.note && <span className="font-normal text-muted"> — {entry.note}</span>}
                      </p>
                      <p className="text-[10px] text-muted">{formatDateTime(entry.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="text-sm font-bold text-ink">Update status</h2>
            <div className="mt-3 space-y-2.5">
              <Select
                value={nextStatus}
                onChange={setNextStatus}
                options={allStatuses.map((status) => ({
                  value: status,
                  label: ORDER_STATUS_META[status].label,
                }))}
                size="xs"
                className="h-10"
                aria-label="Update order status"
              />
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder="Optional note for the customer timeline…"
                className="field resize-none text-xs"
              />
              <button
                type="button"
                onClick={updateStatus}
                disabled={updating}
                className="btn-primary btn-sm w-full"
              >
                {updating ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {updating ? 'Updating…' : 'Update order'}
              </button>
              {nextStatus === 'cancelled' && order.status !== 'cancelled' && (
                <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-danger">
                  <XCircle size={12} className="mt-0.5 shrink-0" />
                  Cancelling returns all item stock to inventory.
                </p>
              )}
            </div>
          </section>

          <section className="card p-4">
            <h2 className="text-sm font-bold text-ink">Customer</h2>
            <p className="mt-2 text-sm font-semibold text-ink">{order.customer_name || 'Guest'}</p>
            <div className="mt-2 space-y-1.5 text-xs text-muted">
              {order.customer_email && (
                <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 hover:text-ink">
                  <Mail size={13} />
                  {order.customer_email}
                </a>
              )}
              {order.customer_phone && (
                <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 hover:text-ink">
                  <Phone size={13} />
                  {order.customer_phone}
                </a>
              )}
            </div>
          </section>

          <section className="card p-4">
            <h2 className="text-sm font-bold text-ink">Delivery</h2>
            <div className="mt-2 flex items-start gap-2 text-xs text-muted">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                {order.address}, {order.township}, {order.region}
                {order.postal_code ? ` ${order.postal_code}` : ''}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-soft px-2.5 py-2 text-[11px] text-muted">
              <Truck size={13} className="text-ink" />
              {order.delivery_method === 'express' ? 'Express delivery' : 'Standard delivery'}
              {order.estimated_delivery ? ` · ETA ${formatDate(order.estimated_delivery)}` : ''}
            </div>
          </section>

          <section className="card p-4">
            <h2 className="text-sm font-bold text-ink">Payment</h2>
            <p className="mt-2 text-xs text-muted">
              Method: <span className="font-semibold text-ink">{PAYMENT_METHODS[order.payment_method]?.label || order.payment_method}</span>
            </p>
            <div className="mt-3 flex gap-2">
              <Select
                value={paymentStatus}
                onChange={setPaymentStatus}
                options={[
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'refunded', label: 'Refunded' },
                ]}
                size="xs"
                className="flex-1"
                aria-label="Payment status"
              />
              <button
                type="button"
                onClick={updatePayment}
                disabled={savingPayment || paymentStatus === order.payment_status}
                className="btn-outline btn-sm shrink-0"
              >
                {savingPayment ? 'Saving…' : 'Save'}
              </button>
            </div>
          </section>

          {returnRequest && (
            <section className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <RotateCcw size={14} />
                  Return request
                </h2>
                <span className={RETURN_STATUS_META[returnRequest.status]?.tone || 'badge-neutral'}>
                  {RETURN_STATUS_META[returnRequest.status]?.label || returnRequest.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                {returnReasonLabel(returnRequest.reason)}
              </p>
              {returnRequest.details && (
                <p className="mt-2 rounded-lg bg-soft px-2.5 py-2 text-[11px] leading-relaxed text-muted">
                  {returnRequest.details}
                </p>
              )}
              <p className="mt-2 text-[10px] text-muted">
                Requested {formatDateTime(returnRequest.created_at)}
              </p>
              <Link to="/admin/returns" className="btn-outline btn-sm mt-3 w-full">
                Manage in Returns
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
