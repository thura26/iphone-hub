import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useConfirm } from '@/context/ConfirmContext'
import Modal from '@/components/common/Modal'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Select from '@/components/common/Select'

const regions = [
  'Yangon', 'Mandalay', 'Naypyidaw', 'Bago', 'Ayeyarwady', 'Magway', 'Sagaing',
  'Shan', 'Mon', 'Kayin', 'Rakhine', 'Kachin', 'Kayah', 'Chin', 'Tanintharyi',
]

const blankForm = {
  label: 'Home',
  recipient_name: '',
  phone: '',
  address: '',
  township: '',
  region: 'Yangon',
  postal_code: '',
  is_default: false,
}

export default function Addresses() {
  const { user, profile } = useAuth()
  const confirm = useConfirm()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)

  const loadAddresses = async () => {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) toast.error('Could not load addresses')
    setAddresses(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm({
      ...blankForm,
      recipient_name: profile?.full_name || '',
      phone: profile?.phone || '',
      is_default: addresses.length === 0,
    })
    setModalOpen(true)
  }

  const openEdit = (address) => {
    setEditing(address)
    setForm({
      label: address.label || 'Home',
      recipient_name: address.recipient_name || '',
      phone: address.phone || '',
      address: address.address || '',
      township: address.township || '',
      region: address.region || 'Yangon',
      postal_code: address.postal_code || '',
      is_default: Boolean(address.is_default),
    })
    setModalOpen(true)
  }

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const save = async (event) => {
    event.preventDefault()
    if (!form.recipient_name.trim()) return toast.error('Enter the recipient name')
    if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())) return toast.error('Enter a valid phone number')
    if (!form.address.trim()) return toast.error('Enter the street address')
    if (!form.township.trim()) return toast.error('Enter the township')

    setSaving(true)
    try {
      if (form.is_default) {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
      }
      const payload = {
        user_id: user.id,
        label: form.label.trim() || 'Home',
        recipient_name: form.recipient_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        township: form.township.trim(),
        region: form.region,
        postal_code: form.postal_code.trim() || null,
        is_default: form.is_default,
      }
      const result = editing
        ? await supabase.from('addresses').update(payload).eq('id', editing.id)
        : await supabase.from('addresses').insert(payload)
      if (result.error) throw result.error
      toast.success(editing ? 'Address updated' : 'Address added')
      setModalOpen(false)
      loadAddresses()
    } catch (error) {
      toast.error(error.message || 'Could not save address')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (address) => {
    const confirmed = await confirm({
      title: `Delete the ${address.label || 'saved'} address?`,
      description: 'This address will be removed from your saved delivery addresses.',
      confirmLabel: 'Delete address',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    const { error } = await supabase.from('addresses').delete().eq('id', address.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Address deleted')
    loadAddresses()
  }

  const makeDefault = async (address) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', address.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Default address updated')
    loadAddresses()
  }

  return (
    <div className="wrap py-6 sm:py-9">
      <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={15} />
        Back to profile
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Delivery</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Saved addresses</h1>
          <p className="mt-1.5 text-sm text-muted">Manage where your orders are delivered.</p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary btn-sm">
          <Plus size={15} />
          Add address
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <Loader />
        ) : addresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No saved addresses"
            description="Add an address to speed up checkout next time."
            action={
              <button type="button" onClick={openNew} className="btn-primary">
                <Plus size={15} />
                Add your first address
              </button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {addresses.map((address) => (
              <article key={address.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-soft text-ink">
                      <MapPin size={15} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-ink">{address.label || 'Address'}</p>
                      {address.is_default && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                          <Star size={9} fill="currentColor" />
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink"
                      aria-label="Edit address"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(address)}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Delete address"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-sm text-muted">
                  <p className="font-semibold text-ink">{address.recipient_name}</p>
                  <p>{address.phone}</p>
                  <p className="mt-1 leading-relaxed">
                    {address.address}, {address.township}, {address.region}
                    {address.postal_code ? ` ${address.postal_code}` : ''}
                  </p>
                </div>

                {!address.is_default && (
                  <button
                    type="button"
                    onClick={() => makeDefault(address)}
                    className="mt-4 text-xs font-semibold text-brand"
                  >
                    Set as default
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit address' : 'Add a new address'}
        description="We use this information to deliver your orders."
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="address_label">Label</label>
            <input
              id="address_label"
              className="field"
              value={form.label}
              onChange={(event) => update('label', event.target.value)}
              placeholder="Home, Office…"
            />
          </div>
          <div>
            <label className="label" htmlFor="address_phone">Phone</label>
            <input
              id="address_phone"
              className="field"
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="+95 9 000 000 000"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address_name">Recipient name</label>
            <input
              id="address_name"
              className="field"
              value={form.recipient_name}
              onChange={(event) => update('recipient_name', event.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address_street">Street address</label>
            <textarea
              id="address_street"
              className="field resize-none"
              rows={2}
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
              placeholder="Building, street, ward"
            />
          </div>
          <div>
            <label className="label" htmlFor="address_township">Township</label>
            <input
              id="address_township"
              className="field"
              value={form.township}
              onChange={(event) => update('township', event.target.value)}
              placeholder="e.g. Kamayut"
            />
          </div>
          <div>
            <label className="label" htmlFor="address_region">Region / State</label>
            <Select
              id="address_region"
              value={form.region}
              onChange={(value) => update('region', value)}
              options={regions.map((region) => ({
                value: region,
                label: region,
              }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="address_postal">Postal code</label>
            <input
              id="address_postal"
              className="field"
              value={form.postal_code}
              onChange={(event) => update('postal_code', event.target.value)}
              placeholder="Optional"
            />
          </div>
          <label className="flex items-end gap-2 pb-3 text-xs text-muted">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(event) => update('is_default', event.target.checked)}
              className="h-4 w-4 rounded border-line accent-[var(--color-brand)]"
            />
            Set as default address
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add address'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
