import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Clock,
  Copy,
  Pencil,
  Percent,
  Plus,
  Tag,
  TicketPercent,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useConfirm } from '@/context/ConfirmContext'
import { cn, formatDate, formatMMK, formatNumber } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Select from '@/components/common/Select'
import StatCard from '@/components/admin/StatCard'

const blank = {
  code: '',
  type: 'percent',
  value: '',
  min_spend: '0',
  usage_limit: '',
  expires_at: '',
  active: true,
}

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10)
}

function couponState(coupon) {
  if (!coupon.active) return { label: 'Inactive', tone: 'badge-neutral' }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { label: 'Expired', tone: 'badge-danger' }
  }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
    return { label: 'Used up', tone: 'badge-warning' }
  }
  return { label: 'Active', tone: 'badge-success' }
}

export default function AdminCoupons() {
  const confirm = useConfirm()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setCoupons(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    return {
      active: coupons.filter(
        (coupon) =>
          coupon.active &&
          (!coupon.expires_at || new Date(coupon.expires_at) >= now) &&
          (coupon.usage_limit == null || coupon.used_count < coupon.usage_limit),
      ).length,
      redemptions: coupons.reduce((sum, coupon) => sum + Number(coupon.used_count || 0), 0),
    }
  }, [coupons])

  const openNew = () => {
    setEditing(null)
    setForm(blank)
    setOpen(true)
  }

  const openEdit = (coupon) => {
    setEditing(coupon)
    setForm({
      code: coupon.code || '',
      type: coupon.type || 'percent',
      value: String(coupon.value ?? ''),
      min_spend: String(coupon.min_spend ?? 0),
      usage_limit: coupon.usage_limit == null ? '' : String(coupon.usage_limit),
      expires_at: toDateInput(coupon.expires_at),
      active: coupon.active !== false,
    })
    setOpen(true)
  }

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const save = async (event) => {
    event.preventDefault()
    const code = form.code.trim().toUpperCase().replace(/\s+/g, '')
    if (!code) return toast.error('Coupon code is required')
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) {
      return toast.error('Use 3–24 letters, numbers, dashes, or underscores')
    }
    if (form.value === '' || Number(form.value) <= 0) return toast.error('Enter a discount value')
    if (form.type === 'percent' && Number(form.value) > 100) {
      return toast.error('Percentage discount cannot exceed 100')
    }
    if (form.usage_limit !== '' && Number(form.usage_limit) < 0) {
      return toast.error('Usage limit cannot be negative')
    }

    setSaving(true)
    const payload = {
      code,
      type: form.type,
      value: Number(form.value),
      min_spend: Math.max(0, Number(form.min_spend) || 0),
      usage_limit: form.usage_limit === '' ? null : Math.max(0, Math.floor(Number(form.usage_limit))),
      expires_at: form.expires_at
        ? new Date(`${form.expires_at}T23:59:59`).toISOString()
        : null,
      active: form.active,
    }
    const result = editing
      ? await supabase.from('coupons').update(payload).eq('id', editing.id)
      : await supabase.from('coupons').insert(payload)
    setSaving(false)
    if (result.error) {
      toast.error(
        result.error.code === '23505'
          ? 'A coupon with that code already exists'
          : result.error.message,
      )
      return
    }
    toast.success(editing ? 'Coupon updated' : 'Coupon created')
    setOpen(false)
    load()
  }

  const toggleActive = async (coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ active: !coupon.active })
      .eq('id', coupon.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setCoupons((current) =>
      current.map((row) => (row.id === coupon.id ? { ...row, active: !row.active } : row)),
    )
    toast.success(coupon.active ? 'Coupon deactivated' : 'Coupon activated')
  }

  const remove = async (coupon) => {
    const confirmed = await confirm({
      title: `Delete coupon “${coupon.code}”?`,
      description: 'Customers will no longer be able to use this code at checkout.',
      confirmLabel: 'Delete coupon',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    const { error } = await supabase.from('coupons').delete().eq('id', coupon.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Coupon deleted')
    setCoupons((current) => current.filter((row) => row.id !== coupon.id))
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(`${code} copied`)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  if (loading) return <Loader label="Loading coupons…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Promotions</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Coupons</h1>
          <p className="mt-1 text-sm text-muted">
            Create discount codes customers can apply at checkout.
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary btn-sm">
          <Plus size={15} />
          New coupon
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Coupons" value={coupons.length} icon={Tag} tone="brand" />
        <StatCard label="Active now" value={stats.active} icon={CheckCircle2} tone="success" />
        <StatCard
          label="Total redemptions"
          value={formatNumber(stats.redemptions)}
          icon={TicketPercent}
        />
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title="No coupons yet"
          description="Create your first promotion to boost sales."
          action={
            <button type="button" onClick={openNew} className="btn-primary">
              <Plus size={15} />
              Create coupon
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.map((coupon) => {
            const state = couponState(coupon)
            const usagePct =
              coupon.usage_limit != null && coupon.usage_limit > 0
                ? Math.min(100, (Number(coupon.used_count) / Number(coupon.usage_limit)) * 100)
                : null
            return (
              <article key={coupon.id} className="card overflow-hidden">
                <div className="flex items-start justify-between gap-2 border-b border-dashed border-line p-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyCode(coupon.code)}
                        className="inline-flex items-center gap-1.5 font-mono text-sm font-bold tracking-wide text-ink hover:text-brand"
                        title="Copy coupon code"
                      >
                        {coupon.code}
                        <Copy size={11} className="text-muted" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-lg font-bold tracking-tight text-ink">
                      {coupon.type === 'percent'
                        ? `${formatNumber(coupon.value)}% off`
                        : `${formatMMK(coupon.value)} off`}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      Min spend {formatMMK(coupon.min_spend)}
                    </p>
                  </div>
                  <span className={state.tone}>{state.label}</span>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {coupon.expires_at ? `Expires ${formatDate(coupon.expires_at)}` : 'No expiry'}
                    </span>
                    <span>
                      {coupon.used_count}
                      {coupon.usage_limit != null ? ` / ${coupon.usage_limit}` : ''} used
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-soft">
                    <div
                      className={cn('h-full rounded-full', usagePct != null && usagePct >= 100 ? 'bg-danger' : 'bg-brand')}
                      style={{ width: `${usagePct ?? 0}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(coupon)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted transition-colors hover:text-ink"
                    >
                      {coupon.active ? (
                        <>
                          <XCircle size={13} /> Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} /> Activate
                        </>
                      )}
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openEdit(coupon)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink"
                        aria-label={`Edit ${coupon.code}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(coupon)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                        aria-label={`Delete ${coupon.code}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${editing.code}` : 'New coupon'}
        description="Coupons are validated on the server during checkout."
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="coupon_code">Code *</label>
            <input
              id="coupon_code"
              className="field font-mono uppercase"
              value={form.code}
              onChange={(event) => update('code', event.target.value.toUpperCase().replace(/\s+/g, ''))}
              placeholder="WELCOME10"
              maxLength={24}
            />
          </div>
          <div>
            <label className="label" htmlFor="coupon_type">Type</label>
            <Select
              id="coupon_type"
              value={form.type}
              onChange={(value) => update('type', value)}
              options={[
                { value: 'percent', label: 'Percentage (%)' },
                { value: 'fixed', label: 'Fixed amount (MMK)' },
              ]}
            />
          </div>
          <div>
            <label className="label" htmlFor="coupon_value">
              Value * {form.type === 'percent' ? '(%)' : '(MMK)'}
            </label>
            <div className="relative">
              {form.type === 'percent' ? (
                <Percent className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              ) : null}
              <input
                id="coupon_value"
                type="number"
                min="0"
                step={form.type === 'percent' ? '1' : '1000'}
                className="field"
                value={form.value}
                onChange={(event) => update('value', event.target.value)}
                placeholder={form.type === 'percent' ? '10' : '50000'}
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="coupon_min">Minimum spend (MMK)</label>
            <input
              id="coupon_min"
              type="number"
              min="0"
              step="1000"
              className="field"
              value={form.min_spend}
              onChange={(event) => update('min_spend', event.target.value)}
              placeholder="1000000"
            />
          </div>
          <div>
            <label className="label" htmlFor="coupon_limit">Usage limit</label>
            <input
              id="coupon_limit"
              type="number"
              min="0"
              className="field"
              value={form.usage_limit}
              onChange={(event) => update('usage_limit', event.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="coupon_expiry">Expiry date</label>
            <input
              id="coupon_expiry"
              type="date"
              className="field"
              value={form.expires_at}
              onChange={(event) => update('expires_at', event.target.value)}
            />
            <p className="mt-1 text-[10px] text-muted">Leave blank for a coupon that never expires.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => update('active', event.target.checked)}
              className="h-4 w-4 rounded border-line accent-[var(--color-brand)]"
            />
            Active and redeemable
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create coupon'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
