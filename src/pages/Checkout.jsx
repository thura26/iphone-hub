import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Tag,
  Truck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useCartStore } from '@/store/cartStore'
import { useCartDrawerStore } from '@/store/cartDrawerStore'
import { fetchSettings } from '@/lib/api'
import { cn, formatMMK, PAYMENT_METHODS } from '@/lib/utils'
import EmptyState from '@/components/common/EmptyState'
import Select from '@/components/common/Select'

const steps = [
  { id: 1, label: 'Shipping' },
  { id: 2, label: 'Payment' },
  { id: 3, label: 'Review' },
]

const regions = [
  'Yangon',
  'Mandalay',
  'Naypyidaw',
  'Bago',
  'Ayeyarwady',
  'Magway',
  'Sagaing',
  'Shan',
  'Mon',
  'Kayin',
  'Rakhine',
  'Kachin',
  'Kayah',
  'Chin',
  'Tanintharyi',
]

const emptyForm = {
  full_name: '',
  phone: '',
  address: '',
  township: '',
  region: 'Yangon',
  postal_code: '',
}

export default function Checkout() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clear)
  const openCart = useCartDrawerStore((state) => state.openCart)

  const [step, setStep] = useState(1)
  const [settings, setSettings] = useState(null)
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [saveAddress, setSaveAddress] = useState(true)
  const [deliveryMethod, setDeliveryMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' })
  const [coupon, setCoupon] = useState('')
  const [couponResult, setCouponResult] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [note, setNote] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(false)

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [items],
  )
  const shippingSettings = settings?.shipping || {}
  const standardFee = Number(shippingSettings.standard ?? 0)
  const expressFee = Number(shippingSettings.express ?? 15000)
  const shippingFee = deliveryMethod === 'express' ? expressFee : standardFee
  const discount = couponResult?.valid ? Number(couponResult.discount || 0) : 0
  const total = Math.max(subtotal + shippingFee - discount, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const [settingsData, addressResult] = await Promise.all([
          fetchSettings(),
          supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false }),
        ])
        if (!active) return
        setSettings(settingsData)
        const addressRows = addressResult.data || []
        if (addressResult.error) console.error(addressResult.error)
        setSavedAddresses(addressRows)
        const preferred = addressRows.find((address) => address.is_default) || addressRows[0]
        if (preferred) {
          setSelectedAddressId(preferred.id)
          setForm({
            full_name: preferred.recipient_name || profile?.full_name || '',
            phone: preferred.phone || profile?.phone || '',
            address: preferred.address || '',
            township: preferred.township || '',
            region: preferred.region || 'Yangon',
            postal_code: preferred.postal_code || '',
          })
          setSaveAddress(false)
        } else {
          setForm((current) => ({
            ...current,
            full_name: profile?.full_name || '',
            phone: profile?.phone || '',
          }))
        }
      } catch (error) {
        console.error(error)
      }
    }
    load()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const selectSavedAddress = (address) => {
    setSelectedAddressId(address.id)
    setForm({
      full_name: address.recipient_name || '',
      phone: address.phone || '',
      address: address.address || '',
      township: address.township || '',
      region: address.region || 'Yangon',
      postal_code: address.postal_code || '',
    })
    setSaveAddress(false)
  }

  const validateShipping = () => {
    if (!form.full_name.trim()) return 'Please enter the recipient name'
    if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())) return 'Please enter a valid phone number'
    if (!form.address.trim()) return 'Please enter a delivery address'
    if (!form.township.trim()) return 'Please enter your township'
    if (!form.region.trim()) return 'Please select a region'
    return null
  }

  const validateCard = () => {
    if (paymentMethod !== 'card') return null
    const digits = card.number.replace(/\D/g, '')
    if (digits.length !== 16) return 'Enter a 16-digit card number'
    if (!card.name.trim()) return 'Enter the name on the card'
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return 'Enter expiry as MM/YY'
    if (!/^\d{3,4}$/.test(card.cvc)) return 'Enter a valid CVC'
    return null
  }

  const goNext = () => {
    if (step === 1) {
      const error = validateShipping()
      if (error) {
        toast.error(error)
        return
      }
    }
    if (step === 2) {
      const error = validateCard()
      if (error) {
        toast.error(error)
        return
      }
    }
    setStep((current) => Math.min(3, current + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    setStep((current) => Math.max(1, current - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const applyCoupon = async () => {
    const code = coupon.trim()
    if (!code) return
    setCouponLoading(true)
    const { data, error } = await supabase.rpc('validate_coupon', {
      p_code: code,
      p_subtotal: subtotal,
    })
    setCouponLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    if (!data?.valid) {
      setCouponResult(null)
      toast.error(data?.message || 'Invalid coupon code')
      return
    }
    setCouponResult(data)
    setCoupon(data.code)
    toast.success(`${data.code} applied — you save ${formatMMK(data.discount)}`)
  }

  const placeOrder = async () => {
    if (items.length === 0) return
    const startedAt = Date.now()
    setPlacing(true)
    try {
      const { data, error } = await supabase.rpc('create_order', {
        p_items: items.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
        p_address: form.address.trim(),
        p_township: form.township.trim(),
        p_region: form.region.trim(),
        p_postal_code: form.postal_code.trim(),
        p_phone: form.phone.trim(),
        p_customer_name: form.full_name.trim(),
        p_delivery_method: deliveryMethod,
        p_payment_method: paymentMethod,
        p_coupon_code: couponResult?.valid ? couponResult.code : null,
        p_note: note.trim() || null,
      })

      if (error) throw error

      if (saveAddress) {
        const duplicate = savedAddresses.some(
          (address) =>
            address.address === form.address.trim() &&
            address.township === form.township.trim(),
        )
        if (!duplicate) {
          const { error: addressError } = await supabase.from('addresses').insert({
            user_id: user.id,
            label: 'Home',
            recipient_name: form.full_name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            township: form.township.trim(),
            region: form.region.trim(),
            postal_code: form.postal_code.trim() || null,
            is_default: savedAddresses.length === 0,
          })
          if (addressError) console.error('Could not save address:', addressError.message)
        }
      }

      setPlaced(true)
      clearCart()

      // Give the confirmation animation a moment to land before showing the receipt.
      const remaining = Math.max(0, 3600 - (Date.now() - startedAt))
      if (remaining > 0) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, remaining)
        })
      }

      navigate(`/order-success/${data.order_number}`, {
        replace: true,
        state: {
          order: data,
          paymentMethod,
          deliveryMethod,
          shippingAddress: form,
        },
      })
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Could not place your order. Please try again.')
      setPlacing(false)
    }
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="wrap py-16">
        <EmptyState
          icon={PackageCheck}
          title="Nothing to check out"
          description="Your cart is empty. Add a product before continuing to checkout."
          action={
            <Link to="/shop" className="btn-primary">
              Browse the shop
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="wrap py-6 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Secure checkout</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Checkout</h1>
          </div>
          <p className="text-sm text-muted">
            {itemCount} item{itemCount === 1 ? '' : 's'} · {formatMMK(subtotal)}
          </p>
        </div>

        <ol className="mt-7 flex items-center justify-center gap-2 sm:gap-3">
          {steps.map((item, index) => {
            const done = step > item.id
            const active = step === item.id
            return (
              <li key={item.id} className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => done && setStep(item.id)}
                  className={cn(
                    'flex items-center gap-2 text-left',
                    done && 'cursor-pointer',
                    !done && 'cursor-default',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors',
                      active && 'border-ink bg-ink text-surface',
                      done && 'border-success bg-success/10 text-success',
                      !active && !done && 'border-line bg-surface text-muted',
                    )}
                  >
                    {done ? <Check size={14} strokeWidth={3} /> : item.id}
                  </span>
                  <span
                    className={cn(
                      'hidden text-sm font-semibold sm:block',
                      active || done ? 'text-ink' : 'text-muted',
                    )}
                  >
                    {item.label}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <span
                    className={cn(
                      'h-px w-8 sm:w-14',
                      step > item.id ? 'bg-success/50' : 'bg-line',
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {step === 1 && (
              <section className="card animate-fade-up p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-brand" />
                  <h2 className="text-base font-bold text-ink">Delivery address</h2>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {savedAddresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => selectSavedAddress(address)}
                        className={cn(
                          'rounded-xl border p-3 text-left text-xs transition-colors',
                          selectedAddressId === address.id
                            ? 'border-ink bg-soft'
                            : 'border-line bg-surface hover:border-ink/30',
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-ink">
                            {address.label || 'Address'}
                            {address.is_default && (
                              <span className="ml-1.5 rounded-pill bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-brand">
                                Default
                              </span>
                            )}
                          </span>
                          {selectedAddressId === address.id && <Check size={14} className="text-success" />}
                        </span>
                        <span className="mt-1 block leading-relaxed text-muted">
                          {address.recipient_name} · {address.phone}
                          <br />
                          {address.address}, {address.township}, {address.region}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="full_name">Full name</label>
                    <input
                      id="full_name"
                      className="field"
                      value={form.full_name}
                      onChange={(event) => updateForm('full_name', event.target.value)}
                      placeholder="Recipient name"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="phone">Phone number</label>
                    <input
                      id="phone"
                      className="field"
                      value={form.phone}
                      onChange={(event) => updateForm('phone', event.target.value)}
                      placeholder="+95 9 000 000 000"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label" htmlFor="address">Street address</label>
                    <textarea
                      id="address"
                      className="field resize-none"
                      rows={2}
                      value={form.address}
                      onChange={(event) => updateForm('address', event.target.value)}
                      placeholder="Building, street, ward"
                      autoComplete="street-address"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="township">Township</label>
                    <input
                      id="township"
                      className="field"
                      value={form.township}
                      onChange={(event) => updateForm('township', event.target.value)}
                      placeholder="e.g. Kamayut"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="region">Region / State</label>
                    <Select
                      id="region"
                      value={form.region}
                      onChange={(value) => updateForm('region', value)}
                      options={regions.map((region) => ({
                        value: region,
                        label: region,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="postal_code">Postal code (optional)</label>
                    <input
                      id="postal_code"
                      className="field"
                      value={form.postal_code}
                      onChange={(event) => updateForm('postal_code', event.target.value)}
                      placeholder="11041"
                      autoComplete="postal-code"
                    />
                  </div>
                  <label className="flex items-end gap-2 pb-3 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={saveAddress}
                      onChange={(event) => setSaveAddress(event.target.checked)}
                      className="h-4 w-4 rounded border-line accent-[var(--color-brand)]"
                    />
                    Save this address for next time
                  </label>
                </div>

                <div className="mt-6 border-t border-line pt-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Truck size={16} className="text-brand" />
                    Delivery method
                  </h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[
                      {
                        id: 'standard',
                        title: 'Standard delivery',
                        eta: '2–4 business days',
                        fee: standardFee,
                      },
                      {
                        id: 'express',
                        title: 'Express delivery',
                        eta: 'Next business day',
                        fee: expressFee,
                      },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setDeliveryMethod(option.id)}
                        className={cn(
                          'flex items-center justify-between rounded-xl border p-3.5 text-left transition-colors',
                          deliveryMethod === option.id
                            ? 'border-ink bg-soft'
                            : 'border-line bg-surface hover:border-ink/30',
                        )}
                      >
                        <span>
                          <span className="block text-sm font-semibold text-ink">{option.title}</span>
                          <span className="mt-0.5 block text-xs text-muted">{option.eta}</span>
                        </span>
                        <span className="text-sm font-semibold text-ink">
                          {option.fee > 0 ? formatMMK(option.fee) : 'Free'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="card animate-fade-up p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-brand" />
                  <h2 className="text-base font-bold text-ink">Payment method</h2>
                </div>
                <p className="mt-1 text-xs text-muted">
                  This is a demo checkout. No real payment will be taken.
                </p>

                <div className="mt-4 space-y-2.5">
                  {[
                    { id: 'cod', icon: Banknote },
                    { id: 'card', icon: CreditCard },
                    { id: 'apple_pay', icon: Smartphone },
                  ].map(({ id, icon: Icon }) => {
                    const meta = PAYMENT_METHODS[id]
                    const active = paymentMethod === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPaymentMethod(id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                          active ? 'border-ink bg-soft' : 'border-line bg-surface hover:border-ink/30',
                        )}
                      >
                        <span
                          className={cn(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-full',
                            active ? 'bg-ink text-surface' : 'bg-soft text-muted',
                          )}
                        >
                          <Icon size={17} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink">{meta.label}</span>
                          <span className="mt-0.5 block text-xs text-muted">{meta.description}</span>
                        </span>
                        <span
                          className={cn(
                            'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                            active ? 'border-ink bg-ink text-surface' : 'border-line',
                          )}
                        >
                          {active && <Check size={11} strokeWidth={3} />}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {paymentMethod === 'card' && (
                  <div className="mt-5 rounded-xl border border-line bg-soft/60 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="label" htmlFor="card_number">Card number</label>
                        <input
                          id="card_number"
                          inputMode="numeric"
                          className="field bg-surface"
                          placeholder="4242 4242 4242 4242"
                          value={card.number}
                          onChange={(event) =>
                            setCard((current) => ({
                              ...current,
                              number: event.target.value
                                .replace(/\D/g, '')
                                .slice(0, 16)
                                .replace(/(.{4})/g, '$1 ')
                                .trim(),
                            }))
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label" htmlFor="card_name">Name on card</label>
                        <input
                          id="card_name"
                          className="field bg-surface"
                          placeholder="AUNG AUNG"
                          value={card.name}
                          onChange={(event) => setCard((current) => ({ ...current, name: event.target.value.toUpperCase() }))}
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="card_expiry">Expiry</label>
                        <input
                          id="card_expiry"
                          inputMode="numeric"
                          className="field bg-surface"
                          placeholder="12/28"
                          value={card.expiry}
                          onChange={(event) => {
                            const digits = event.target.value.replace(/\D/g, '').slice(0, 4)
                            setCard((current) => ({
                              ...current,
                              expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
                            }))
                          }}
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="card_cvc">CVC</label>
                        <input
                          id="card_cvc"
                          inputMode="numeric"
                          className="field bg-surface"
                          placeholder="123"
                          value={card.cvc}
                          onChange={(event) =>
                            setCard((current) => ({
                              ...current,
                              cvc: event.target.value.replace(/\D/g, '').slice(0, 4),
                            }))
                          }
                        />
                      </div>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                      <Lock size={12} />
                      Demo only. Do not enter a real card number.
                    </p>
                  </div>
                )}

                {paymentMethod === 'apple_pay' && (
                  <div className="mt-5 rounded-xl bg-black p-5 text-center text-white">
                    <p className="text-sm font-semibold">Apple Pay</p>
                    <p className="mt-1 text-xs text-white/60">
                      A secure sheet would open here. This demo does not process payment.
                    </p>
                    <button
                      type="button"
                      onClick={() => toast.info('Apple Pay is simulated in this demo.')}
                      className="mx-auto mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-black"
                    >
                      <Smartphone size={15} />
                      Pay with Apple Pay
                    </button>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="mt-5 rounded-xl border border-success/20 bg-success/5 p-4 text-xs leading-relaxed text-muted">
                    <p className="font-semibold text-success">Pay when it arrives</p>
                    <p className="mt-1">
                      Please prepare the exact amount. Our courier will contact you before delivery.
                    </p>
                  </div>
                )}
              </section>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-fade-up">
                <section className="card p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-ink">Delivery address</h2>
                    <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-brand">
                      Edit
                    </button>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink">{form.full_name} · {form.phone}</p>
                  <p className="mt-1 text-sm text-muted">
                    {form.address}, {form.township}, {form.region}
                    {form.postal_code ? ` ${form.postal_code}` : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="badge-neutral">
                      {deliveryMethod === 'express' ? 'Express delivery' : 'Standard delivery'}
                    </span>
                    <span className="badge-neutral">{PAYMENT_METHODS[paymentMethod]?.label}</span>
                  </div>
                </section>

                <section className="card p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-ink">Items ({itemCount})</h2>
                    <button type="button" onClick={() => setStep(2)} className="text-xs font-semibold text-brand">
                      Edit payment
                    </button>
                  </div>
                  <ul className="mt-3 divide-y divide-line">
                    {items.map((item) => (
                      <li key={item.variantId} className="flex items-center gap-3 py-3">
                        <span className="grid h-14 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
                          {item.image ? (
                            <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
                          ) : (
                            <PackageCheck size={18} className="text-muted" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{item.productName}</span>
                          <span className="block text-xs text-muted">
                            {[item.storage, item.color].filter(Boolean).join(' · ')} · Qty {item.quantity}
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-ink">
                          {formatMMK(Number(item.price) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="card p-5 sm:p-6">
                  <h2 className="text-base font-bold text-ink">Coupon & note</h2>
                  <div className="mt-3">
                    <label className="label" htmlFor="coupon">Coupon code</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                          id="coupon"
                          value={coupon}
                          onChange={(event) => {
                            setCoupon(event.target.value.toUpperCase())
                            setCouponResult(null)
                          }}
                          placeholder="WELCOME10"
                          className="field pl-9 uppercase"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponLoading || !coupon.trim()}
                        className="btn-outline btn-sm shrink-0"
                      >
                        {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponResult?.valid && (
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Check size={13} />
                          {couponResult.code} applied — {formatMMK(couponResult.discount)} off
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCouponResult(null)
                            setCoupon('')
                          }}
                          className="text-success/70 hover:text-success"
                          aria-label="Remove coupon"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-muted">
                      Try WELCOME10 (10% off over Ks 1,000,000) or IPHONE50K (Ks 50,000 off).
                    </p>
                  </div>
                  <div className="mt-4">
                    <label className="label" htmlFor="note">Order note (optional)</label>
                    <textarea
                      id="note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={2}
                      placeholder="Delivery instructions, preferred time…"
                      className="field resize-none"
                    />
                  </div>
                </section>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              {step > 1 ? (
                <button type="button" onClick={goBack} className="btn-outline">
                  <ArrowLeft size={16} />
                  Back
                </button>
              ) : (
                <button type="button" onClick={openCart} className="btn-ghost">
                  <ArrowLeft size={16} />
                  Cart
                </button>
              )}

              {step < 3 ? (
                <button type="button" onClick={goNext} className="btn-primary">
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={placing}
                  className="btn-brand min-w-[170px]"
                >
                  {placing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    <>
                      Place order · {formatMMK(total)}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <aside className="h-fit space-y-3 lg:sticky lg:top-24">
            <div className="card p-5">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-base font-bold text-ink">Order summary</h2>
                <span className="text-[11px] font-medium text-muted">
                  {itemCount} item{itemCount === 1 ? '' : 's'}
                </span>
              </div>
              <ul className="mt-3 max-h-72 divide-y divide-line overflow-y-auto">
                {items.map((item) => {
                  const lineTotal = Number(item.price) * item.quantity
                  return (
                    <li key={item.variantId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="grid h-14 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-soft">
                        {item.image ? (
                          <img src={item.image} alt="" className="h-full w-full object-contain p-1" />
                        ) : (
                          <PackageCheck size={15} className="text-muted" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-semibold text-ink">
                            {item.productName}
                          </p>
                          <p className="shrink-0 text-sm font-bold text-ink">
                            {formatMMK(lineTotal)}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {[item.storage, item.color].filter(Boolean).join(' · ')}
                        </p>
                        <p className="mt-1.5 text-[11px] text-muted">
                          Qty <span className="font-semibold text-ink">{item.quantity}</span>
                          <span className="mx-1.5" aria-hidden>·</span>
                          {formatMMK(item.price)} each
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-ink">{formatMMK(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Delivery</dt>
                  <dd className="font-medium text-ink">
                    {shippingFee > 0 ? formatMMK(shippingFee) : 'Free'}
                  </dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Coupon discount</dt>
                    <dd className="font-medium">− {formatMMK(discount)}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-sm font-semibold text-ink">Total</span>
                <span className="text-xl font-bold tracking-tight text-ink">{formatMMK(total)}</span>
              </div>
              <p className="mt-1 text-right text-[10px] text-muted">Inclusive of all taxes</p>
            </div>

            <div className="rounded-card border border-line bg-soft/60 p-4 text-[11px] leading-relaxed text-muted">
              <p className="flex items-center gap-1.5 font-semibold text-ink">
                <ShieldCheck size={14} />
                Secure demo checkout
              </p>
              <p className="mt-1.5">
                Card and Apple Pay payments are simulated. Cash on delivery orders are paid to
                the courier. Your data is stored securely in Supabase.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {placing && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-surface/90 px-6 backdrop-blur-md animate-fade-in"
          role="status"
          aria-live="polite"
          aria-label="Placing your order"
        >
          <div className="w-full max-w-sm text-center">
            <div className="relative mx-auto grid h-24 w-24 place-items-center">
              <span className="absolute inset-0 rounded-full border border-brand/20" />
              <span className="absolute inset-0 animate-ping rounded-full bg-brand/10 [animation-duration:2s]" />
              <span className="absolute inset-1 animate-spin rounded-full border-2 border-transparent border-t-brand [animation-duration:1.4s]" />
              <span className="relative grid h-16 w-16 place-items-center rounded-full bg-ink text-surface shadow-[0_18px_40px_-18px_rgba(16,24,40,0.65)]">
                <PackageCheck size={26} />
              </span>
            </div>
            <h2 className="mt-6 text-xl font-bold tracking-tight text-ink">
              Placing your order…
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Confirming stock and preparing your order.
            </p>
            <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-soft">
              <div className="order-progress h-full w-full rounded-full bg-brand" />
            </div>
            <p className="mt-4 text-[11px] font-medium text-muted">
              Please keep this window open.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
