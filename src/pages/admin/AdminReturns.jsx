import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Clock3,
  RotateCcw,
  Search,
  Wallet,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import useRealtime from '@/hooks/useRealtime'
import { logAudit } from '@/lib/audit'
import {
  formatDate,
  formatDateTime,
  formatMMK,
  RETURN_STATUS_META,
  returnReasonLabel,
} from '@/lib/utils'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Modal from '@/components/common/Modal'
import StatCard from '@/components/admin/StatCard'

const statusTabs = [
  { id: 'all', label: 'All requests' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'refunded', label: 'Refunded' },
]

const actionMeta = {
  approved: {
    title: 'Approve this return?',
    description: 'The customer will see that their return was approved. You can add instructions below.',
    confirmLabel: 'Approve return',
    tone: 'neutral',
    icon: CheckCircle2,
  },
  rejected: {
    title: 'Reject this return?',
    description: 'The customer will be notified and can contact support if they need more help.',
    confirmLabel: 'Reject request',
    tone: 'danger',
    icon: XCircle,
  },
  refunded: {
    title: 'Mark this return as refunded?',
    description: 'This also marks the order as refunded. Confirm the refund has been sent before continuing.',
    confirmLabel: 'Mark refunded',
    tone: 'warning',
    icon: Wallet,
  },
}

export default function AdminReturns() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [resolving, setResolving] = useState(null)
  const [note, setNote] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data, error } = await supabase
      .from('return_requests')
      .select(
        '*, orders(order_number, customer_name, customer_email, customer_phone, total_amount, status, payment_status)',
      )
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtime({ table: 'return_requests', onChange: load })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return requests.filter((request) => {
      if (status !== 'all' && request.status !== status) return false
      if (!term) return true
      const haystack = `${request.orders?.order_number || ''} ${
        request.orders?.customer_name || ''
      } ${request.orders?.customer_email || ''} ${request.orders?.customer_phone || ''} ${
        returnReasonLabel(request.reason)
      }`
      return haystack.toLowerCase().includes(term)
    })
  }, [requests, status, search])

  const counts = statusTabs.reduce((acc, tab) => {
    acc[tab.id] =
      tab.id === 'all'
        ? requests.length
        : requests.filter((request) => request.status === tab.id).length
    return acc
  }, {})

  const stats = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === 'pending').length,
      refunded: requests.filter((request) => request.status === 'refunded').length,
      refundValue: requests
        .filter((request) => request.status === 'refunded')
        .reduce((sum, request) => sum + Number(request.refund_amount || 0), 0),
    }),
    [requests],
  )

  const openResolve = (request, nextStatus) => {
    setResolving({ request, status: nextStatus })
    setNote('')
    setRefundAmount(
      nextStatus === 'approved' || nextStatus === 'refunded'
        ? String(Number(request.orders?.total_amount || 0))
        : '',
    )
  }

  const resolve = async (event) => {
    event.preventDefault()
    if (!resolving) return
    setSaving(true)
    const { error } = await supabase.rpc('resolve_return_request', {
      p_id: resolving.request.id,
      p_status: resolving.status,
      p_admin_note: note.trim() || null,
      p_refund_amount:
        resolving.status === 'approved' || resolving.status === 'refunded'
          ? Math.max(0, Number(refundAmount) || 0)
          : null,
    })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(
      resolving.status === 'approved'
        ? 'Return approved'
        : resolving.status === 'rejected'
          ? 'Return request rejected'
          : 'Return marked as refunded',
    )
    void logAudit({
      action: `return.${resolving.status}`,
      entityType: 'return_request',
      entityId: resolving.request.id,
      details: {
        order_number: resolving.request.orders?.order_number,
        note: note.trim() || null,
        refund_amount: refundAmount || null,
      },
    })
    setResolving(null)
    load()
  }

  if (loading) return <Loader label="Loading return requests…" />

  const renderActions = (request, compact = false) => {
    if (request.status === 'pending') {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => openResolve(request, 'approved')}
            className={compact ? 'btn-outline btn-sm' : 'text-[11px] font-semibold text-success hover:underline'}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => openResolve(request, 'rejected')}
            className={compact ? 'btn-ghost btn-sm text-danger' : 'text-[11px] font-semibold text-danger hover:underline'}
          >
            Reject
          </button>
        </div>
      )
    }
    if (request.status === 'approved') {
      return (
        <button
          type="button"
          onClick={() => openResolve(request, 'refunded')}
          className={compact ? 'btn-primary btn-sm' : 'text-[11px] font-semibold text-brand hover:underline'}
        >
          Mark refunded
        </button>
      )
    }
    return <span className="text-[11px] text-muted">Closed</span>
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Customer care</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Returns & refunds</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          Review return requests, approve them, and record refunds.
          <span className="inline-flex items-center gap-1.5 rounded-pill bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Live
          </span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Open requests" value={stats.pending} icon={RotateCcw} tone="warning" />
        <StatCard label="Refunded returns" value={stats.refunded} icon={CheckCircle2} tone="success" />
        <StatCard label="Refund value" value={formatMMK(stats.refundValue)} icon={Wallet} />
      </div>

      <div className="card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order number, customer, or reason…"
            className="field h-10 py-2 pl-9 text-xs"
          />
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatus(tab.id)}
              className={`shrink-0 rounded-pill border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                status === tab.id
                  ? 'border-ink bg-ink text-surface'
                  : 'border-line bg-surface text-muted hover:text-ink'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-[10px] ${status === tab.id ? 'text-surface/60' : 'text-muted'}`}>
                {counts[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No return requests"
          description="Requests submitted by customers will appear here in real time."
        />
      ) : (
        <>
          <div className="card divide-y divide-line overflow-hidden md:hidden">
            {filtered.map((request) => (
              <article key={request.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/orders/${request.order_id}`}
                      className="text-sm font-bold text-ink hover:text-brand"
                    >
                      {request.orders?.order_number || 'Order'}
                    </Link>
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {request.orders?.customer_name || 'Customer'} ·{' '}
                      {request.orders?.customer_phone || request.orders?.customer_email || 'No contact'}
                    </p>
                  </div>
                  <span className={RETURN_STATUS_META[request.status]?.tone || 'badge-neutral'}>
                    {RETURN_STATUS_META[request.status]?.label || request.status}
                  </span>
                </div>
                <p className="mt-2 rounded-lg bg-soft px-3 py-2 text-[11px] font-medium text-ink">
                  {returnReasonLabel(request.reason)}
                </p>
                {request.details && (
                  <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-muted">
                    {request.details}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={11} />
                    {formatDateTime(request.created_at)}
                  </span>
                  <span className="font-semibold text-ink">
                    {formatMMK(request.refund_amount ?? request.orders?.total_amount ?? 0)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                  {renderActions(request, true)}
                  <Link to={`/admin/orders/${request.order_id}`} className="btn-ghost btn-sm">
                    View order
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead>
                  <tr className="table-head">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Refund</th>
                    <th className="px-4 py-3">Requested</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((request) => (
                    <tr key={request.id} className="transition-colors hover:bg-soft/50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${request.order_id}`}
                          className="font-semibold text-ink hover:text-brand"
                        >
                          {request.orders?.order_number || 'Order'}
                        </Link>
                        <p className="mt-0.5 text-[10px] text-muted">
                          Order {request.orders?.status || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{request.orders?.customer_name || 'Customer'}</p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {request.orders?.customer_phone || request.orders?.customer_email}
                        </p>
                      </td>
                      <td className="max-w-[240px] px-4 py-3">
                        <p className="font-medium text-ink">{returnReasonLabel(request.reason)}</p>
                        {request.details && (
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted">
                            {request.details}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={RETURN_STATUS_META[request.status]?.tone || 'badge-neutral'}>
                          {RETURN_STATUS_META[request.status]?.label || request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {formatMMK(request.refund_amount ?? request.orders?.total_amount ?? 0)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <p>{formatDate(request.created_at)}</p>
                        <p className="mt-0.5 text-[10px]">{formatDateTime(request.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">{renderActions(request)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal
        open={Boolean(resolving)}
        onClose={() => setResolving(null)}
        title={resolving ? actionMeta[resolving.status]?.title : ''}
        description={resolving ? actionMeta[resolving.status]?.description : ''}
      >
        {resolving && (
          <form onSubmit={resolve} className="space-y-4">
            <div className="rounded-xl border border-line bg-soft/60 p-3 text-xs">
              <p className="font-semibold text-ink">
                {resolving.request.orders?.order_number} · {resolving.request.orders?.customer_name}
              </p>
              <p className="mt-1 text-muted">
                {returnReasonLabel(resolving.request.reason)} · Requested{' '}
                {formatDateTime(resolving.request.created_at)}
              </p>
              {resolving.request.details && (
                <p className="mt-2 leading-relaxed text-muted">{resolving.request.details}</p>
              )}
            </div>

            {(resolving.status === 'approved' || resolving.status === 'refunded') && (
              <div>
                <label className="label" htmlFor="refund_amount">Refund amount (MMK)</label>
                <input
                  id="refund_amount"
                  type="number"
                  min="0"
                  step="1000"
                  className="field"
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                />
                <p className="mt-1 text-[10px] text-muted">
                  Order total is {formatMMK(resolving.request.orders?.total_amount || 0)}. Adjust for
                  partial refunds if needed.
                </p>
              </div>
            )}

            <div>
              <label className="label" htmlFor="admin_note">Note to customer (optional)</label>
              <textarea
                id="admin_note"
                rows={3}
                className="field resize-none"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={
                  resolving.status === 'rejected'
                    ? 'Explain why this return cannot be accepted…'
                    : 'Share return instructions or confirmation details…'
                }
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" onClick={() => setResolving(null)} className="btn-ghost btn-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={resolving.status === 'rejected' ? 'btn-danger btn-sm' : 'btn-primary btn-sm'}
              >
                {saving ? 'Saving…' : actionMeta[resolving.status]?.confirmLabel}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
