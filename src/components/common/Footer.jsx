import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/common/Logo'

export default function Footer() {
  const [email, setEmail] = useState('')

  const subscribe = (event) => {
    event.preventDefault()
    if (!email.trim()) return
    toast.success('Thanks for subscribing! Watch your inbox for new drops.')
    setEmail('')
  }

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="wrap py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Premium iPhones and accessories, delivered across Myanmar. Genuine products,
              transparent pricing, and a checkout that takes seconds.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { label: 'f', name: 'Facebook' },
                { label: 'IG', name: 'Instagram' },
                { label: 'X', name: 'X' },
              ].map((social) => (
                <button
                  key={social.name}
                  type="button"
                  onClick={() => toast.info('Social links are for demo only')}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-[11px] font-bold text-muted transition-colors hover:border-ink hover:text-ink"
                  aria-label={social.name}
                >
                  {social.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink">Shop</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><Link className="hover:text-ink" to="/shop?category=iphone-18">iPhone 18</Link></li>
              <li><Link className="hover:text-ink" to="/shop?category=iphone-17">iPhone 17</Link></li>
              <li><Link className="hover:text-ink" to="/shop?category=iphone-air">iPhone Air</Link></li>
              <li><Link className="hover:text-ink" to="/shop?category=accessories">Accessories</Link></li>
              <li><Link className="hover:text-ink" to="/shop">Shop all</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink">Support</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><Link className="hover:text-ink" to="/orders">Track your order</Link></li>
              <li><Link className="hover:text-ink" to="/profile/addresses">Shipping & delivery</Link></li>
              <li><Link className="hover:text-ink" to="/about">About iPhone Hub</Link></li>
              <li><Link className="hover:text-ink" to="/contact">Contact us</Link></li>
              <li><Link className="hover:text-ink" to="/profile">Your account</Link></li>
              <li><button type="button" className="hover:text-ink" onClick={() => toast.info('Returns policy: 7 days, unused items only.')}>Returns & refunds</button></li>
              <li><button type="button" className="hover:text-ink" onClick={() => toast.info('Warranty: 1 year official Apple warranty.')}>Warranty</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink">Stay in the loop</h4>
            <p className="mt-4 text-sm text-muted">New launches and exclusive offers, no spam.</p>
            <form onSubmit={subscribe} className="mt-3 flex overflow-hidden rounded-pill border border-line bg-soft/60 p-1">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted"
                aria-label="Email address"
              />
              <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-surface" aria-label="Subscribe">
                <ArrowRight size={15} />
              </button>
            </form>
            <div className="mt-5 space-y-2 text-sm text-muted">
              <p className="flex items-center gap-2"><Phone size={14} /> 09459038758</p>
              <p className="flex items-center gap-2"><Mail size={14} /> hello@iphonehub.com</p>
              <p className="flex items-center gap-2"><MapPin size={14} /> Yangon, Myanmar</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} iPhone Hub. Developed by Thura Linn Thant.</p>
          <div className="flex items-center gap-2">
            {['VISA', 'Mastercard', 'Apple Pay', 'COD'].map((label) => (
              <span key={label} className="rounded-md border border-line bg-soft px-2.5 py-1 text-[10px] font-semibold text-muted">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
