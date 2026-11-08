import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  Database,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Store,
  Truck,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { formatMMK } from '@/lib/utils'
import Loader from '@/components/common/Loader'

const defaultStore = {
  name: 'iPhone Hub',
  tagline: 'Premium iPhones. Always.',
  email: 'hello@iphonehub.com',
  phone: '+95 9 000 000 000',
  address: 'Yangon, Myanmar',
}

const defaultShipping = {
  standard: 0,
  express: 15000,
  free_threshold: 5000000,
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [store, setStore] = useState(defaultStore)
  const [shipping, setShipping] = useState(defaultShipping)
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    let active = true
    supabase
      .from('settings')
      .select('*')
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error(error)
          toast.error('Could not load settings')
          return
        }
        const rows = data || []
        const map = Object.fromEntries(rows.map((row) => [row.key, row.value]))
        setStore({ ...defaultStore, ...(map.store || {}) })
        setShipping({ ...defaultShipping, ...(map.shipping || {}) })
        const timestamps = rows
          .map((row) => row.updated_at)
          .filter(Boolean)
          .sort()
        if (timestamps.length > 0) setLastUpdated(timestamps[timestamps.length - 1])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const updateStore = (field, value) => setStore((current) => ({ ...current, [field]: value }))
  const updateShipping = (field, value) => setShipping((current) => ({ ...current, [field]: value }))

  const previewShipping = useMemo(
    () => [
      {
        id: 'standard',
        label: 'Standard delivery',
        eta: '2–4 business days',
        fee: Number(shipping.standard) || 0,
      },
      {
        id: 'express',
        label: 'Express delivery',
        eta: 'Next business day',
        fee: Number(shipping.express) || 0,
      },
    ],
    [shipping],
  )

  const save = async (event) => {
    event.preventDefault()
    if (!store.name.trim()) return toast.error('Store name is required')
    if (store.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.email.trim())) {
      return toast.error('Enter a valid support email')
    }
    const rates = ['standard', 'express', 'free_threshold']
    if (rates.some((rate) => shipping[rate] === '' || Number(shipping[rate]) < 0)) {
      return toast.error('Shipping rates must be zero or greater')
    }

    setSaving(true)
    try {
      const now = new Date().toISOString()
      const { error } = await supabase.from('settings').upsert(
        [
          {
            key: 'store',
            value: {
              name: store.name.trim(),
              tagline: store.tagline.trim(),
              email: store.email.trim(),
              phone: store.phone.trim(),
              address: store.address.trim(),
            },
            updated_at: now,
          },
          {
            key: 'shipping',
            value: {
              standard: Math.max(0, Number(shipping.standard) || 0),
              express: Math.max(0, Number(shipping.express) || 0),
              free_threshold: Math.max(0, Number(shipping.free_threshold) || 0),
            },
            updated_at: now,
          },
        ],
        { onConflict: 'key' },
      )
      if (error) throw error
      setLastUpdated(now)
      toast.success('Store settings saved')
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Could not save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader label="Loading settings…" />

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Configuration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Store identity and delivery pricing used across the storefront and checkout.
          </p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary btn-sm">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="card p-5">
            <div className="flex items-center gap-2">
              <Store size={17} className="text-brand" />
              <h2 className="text-sm font-bold text-ink">Store profile</h2>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Shown in the footer and used for customer support contact details.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="store_name">Store name *</label>
                <input
                  id="store_name"
                  className="field"
                  value={store.name}
                  onChange={(event) => updateStore('name', event.target.value)}
                  placeholder="iPhone Hub"
                />
              </div>
              <div>
                <label className="label" htmlFor="store_tagline">Tagline</label>
                <input
                  id="store_tagline"
                  className="field"
                  value={store.tagline}
                  onChange={(event) => updateStore('tagline', event.target.value)}
                  placeholder="Premium iPhones. Always."
                />
              </div>
              <div>
                <label className="label" htmlFor="store_email">Support email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="store_email"
                    type="email"
                    className="field pl-10"
                    value={store.email}
                    onChange={(event) => updateStore('email', event.target.value)}
                    placeholder="hello@iphonehub.com"
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="store_phone">Support phone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="store_phone"
                    type="tel"
                    className="field pl-10"
                    value={store.phone}
                    onChange={(event) => updateStore('phone', event.target.value)}
                    placeholder="+95 9 000 000 000"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="store_address">Store address</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
                  <input
                    id="store_address"
                    className="field pl-10"
                    value={store.address}
                    onChange={(event) => updateStore('address', event.target.value)}
                    placeholder="Yangon, Myanmar"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2">
              <Truck size={17} className="text-brand" />
              <h2 className="text-sm font-bold text-ink">Shipping & delivery</h2>
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Fees are charged in MMK and are applied during checkout and stored with each order.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="shipping_standard">Standard fee</label>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="shipping_standard"
                    type="number"
                    min="0"
                    step="500"
                    className="field pl-10"
                    value={shipping.standard}
                    onChange={(event) => updateShipping('standard', event.target.value)}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted">2–4 business days</p>
              </div>
              <div>
                <label className="label" htmlFor="shipping_express">Express fee</label>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="shipping_express"
                    type="number"
                    min="0"
                    step="500"
                    className="field pl-10"
                    value={shipping.express}
                    onChange={(event) => updateShipping('express', event.target.value)}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted">Next business day</p>
              </div>
              <div>
                <label className="label" htmlFor="shipping_threshold">Free delivery over</label>
                <div className="relative">
                  <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    id="shipping_threshold"
                    type="number"
                    min="0"
                    step="10000"
                    className="field pl-10"
                    value={shipping.free_threshold}
                    onChange={(event) => updateShipping('free_threshold', event.target.value)}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted">Displayed in the announcement bar</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-line bg-soft/60 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Checkout preview
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {previewShipping.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
                  >
                    <div>
                      <p className="text-xs font-semibold text-ink">{method.label}</p>
                      <p className="text-[10px] text-muted">{method.eta}</p>
                    </div>
                    <p className="text-xs font-semibold text-ink">
                      {method.fee > 0 ? formatMMK(method.fee) : 'Free'}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Free standard delivery on orders over{' '}
                <span className="font-semibold text-ink">
                  {formatMMK(shipping.free_threshold)}
                </span>
                . Express fees still apply.
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink">Storefront snapshot</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-surface">
                <Building2 size={19} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{store.name || 'iPhone Hub'}</p>
                <p className="truncate text-[11px] text-muted">{store.tagline || 'No tagline'}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Email</dt>
                <dd className="truncate font-medium text-ink">{store.email || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Phone</dt>
                <dd className="truncate font-medium text-ink">{store.phone || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Location</dt>
                <dd className="truncate font-medium text-ink">{store.address || '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink">Integrations</h2>
            <dl className="mt-3 space-y-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-success/10 text-success">
                  <Database size={14} />
                </span>
                <div>
                  <dt className="font-semibold text-ink">Supabase</dt>
                  <dd className="text-[10px] text-muted">Authentication, catalog, and orders connected</dd>
                </div>
                <CheckCircle2 size={14} className="ml-auto text-success" />
              </div>
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-success/10 text-success">
                  <Globe2 size={14} />
                </span>
                <div>
                  <dt className="font-semibold text-ink">Storefront</dt>
                  <dd className="text-[10px] text-muted">Customer app with live catalog data</dd>
                </div>
                <CheckCircle2 size={14} className="ml-auto text-success" />
              </div>
            </dl>
            <p className="mt-3 border-t border-line pt-3 text-[10px] leading-relaxed text-muted">
              Payments are simulated in this demo. Card, Apple Pay, and COD selections are recorded
              with each order but no real charge is made.
            </p>
          </section>

          <section className="rounded-card border border-line bg-soft/60 p-4 text-[11px] leading-relaxed text-muted">
            <p className="font-semibold text-ink">About settings</p>
            <p className="mt-1.5">
              Values are stored as JSON in the Supabase <span className="font-mono">settings</span>{' '}
              table. The shipping rates here feed the checkout totals.
            </p>
            {lastUpdated && (
              <p className="mt-2 text-[10px]">
                Last saved{' '}
                {new Date(lastUpdated).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </section>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </aside>
      </div>
    </form>
  )
}
