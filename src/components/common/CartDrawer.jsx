import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/context/ConfirmContext'
import { useCartDrawerStore } from '@/store/cartDrawerStore'
import { useCartStore } from '@/store/cartStore'
import { cn, formatMMK } from '@/lib/utils'
import QuantityStepper from '@/components/common/QuantityStepper'

const FREE_SHIPPING_THRESHOLD = 5000000

export default function CartDrawer() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const confirm = useConfirm()
  const open = useCartDrawerStore((state) => state.open)
  const closeCart = useCartDrawerStore((state) => state.closeCart)

  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const removeItem = useCartStore((state) => state.removeItem)
  const addItem = useCartStore((state) => state.addItem)
  const clear = useCartStore((state) => state.clear)

  const closeButtonRef = useRef(null)
  const previousFocusRef = useRef(null)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  )
  const remainingForFreeShipping = Math.max(
    FREE_SHIPPING_THRESHOLD - subtotal,
    0,
  )

  useEffect(() => {
    closeCart()
  }, [pathname, closeCart])

  useEffect(() => {
    if (!open) return undefined

    previousFocusRef.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus()
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus?.()
    }
  }, [open, closeCart])

  const remove = (item) => {
    removeItem(item.variantId)
    toast.success(`${item.productName} removed`, {
      action: {
        label: 'Undo',
        onClick: () => addItem(item, item.quantity),
      },
    })
  }

  const clearCart = async () => {
    const confirmed = await confirm({
      title: 'Clear your cart?',
      description: `All ${itemCount} item${itemCount === 1 ? '' : 's'} will be removed from your bag.`,
      confirmLabel: 'Clear cart',
      cancelLabel: 'Keep items',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    clear()
    toast.success('Cart cleared')
  }

  const goToCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80]',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        onClick={closeCart}
        aria-label="Close cart"
        className={cn(
          'absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={cn(
          'absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-surface shadow-[var(--shadow-float)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:max-w-[420px]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-4 pb-4 pt-5 sm:px-5">
          <div>
            <p className="eyebrow">Your bag</p>
            <h2
              id="cart-drawer-title"
              className="mt-1 text-xl font-bold tracking-tight text-ink"
            >
              Shopping cart
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted">
              <span>
                {itemCount} item{itemCount === 1 ? '' : 's'}
              </span>
              {items.length > 0 && (
                <>
                  <span aria-hidden>·</span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="font-medium transition-colors hover:text-danger"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            className="btn-icon -mr-1 -mt-1 shrink-0"
            aria-label="Close cart"
          >
            <X size={19} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-soft text-muted">
              <ShoppingBag size={24} />
            </span>
            <h3 className="mt-4 text-base font-bold text-ink">
              Your cart is empty
            </h3>
            <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-muted">
              Add an iPhone or accessory and it will show up here, ready for
              checkout.
            </p>
            <Link
              to="/shop"
              onClick={closeCart}
              className="btn-primary mt-5"
            >
              Start shopping
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5">
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <li key={item.variantId} className="flex gap-3 py-4">
                    <Link
                      to={`/product/${item.productSlug}`}
                      onClick={closeCart}
                      className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-soft"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <ShoppingBag size={22} className="text-muted" />
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/product/${item.productSlug}`}
                            onClick={closeCart}
                            className="line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors hover:text-brand"
                          >
                            {item.productName}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {[item.storage, item.color]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          {item.stock != null && item.stock <= 5 && (
                            <p className="mt-1 text-[10px] font-medium text-warning">
                              Only {item.stock} left
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(item)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2.5">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          max={item.stock || 99}
                          onChange={(value) =>
                            setQuantity(item.variantId, value)
                          }
                        />
                        <div className="text-right">
                          <p className="text-sm font-bold text-ink">
                            {formatMMK(
                              Number(item.price) * item.quantity,
                            )}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-[10px] text-muted">
                              {formatMMK(item.price)} each
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mb-4 mt-1 flex items-start gap-2 rounded-xl bg-soft/70 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
                <Truck size={14} className="mt-0.5 shrink-0 text-ink" />
                {remainingForFreeShipping > 0 ? (
                  <span>
                    Add{' '}
                    <span className="font-semibold text-ink">
                      {formatMMK(remainingForFreeShipping)}
                    </span>{' '}
                    more for free standard delivery.
                  </span>
                ) : (
                  <span>You have unlocked free standard delivery.</span>
                )}
              </div>
            </div>

            <footer className="shrink-0 border-t border-line bg-surface px-4 pb-3 pt-4 safe-bottom sm:px-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-ink">
                    {formatMMK(subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Delivery</dt>
                  <dd className="font-medium text-ink">
                    Calculated at checkout
                  </dd>
                </div>
              </dl>
              <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-sm font-semibold text-ink">Total</span>
                <span className="text-xl font-bold tracking-tight text-ink">
                  {formatMMK(subtotal)}
                </span>
              </div>
              <button
                type="button"
                onClick={goToCheckout}
                className="btn-primary mt-4 w-full"
              >
                Checkout
                <ArrowRight size={16} />
              </button>
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-muted">
                <ShieldCheck size={12} />
                Secure checkout · Card, Apple Pay, or COD
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                {['VISA', 'Mastercard', 'Apple Pay', 'COD'].map((label) => (
                  <span
                    key={label}
                    className="rounded border border-line bg-soft px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-muted"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
