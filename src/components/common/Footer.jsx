import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Loader2, Mail, MapPin, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import Logo from '@/components/common/Logo'
import SocialIcon from '@/components/common/SocialIcon'
import { useSiteSettings } from '@/context/SiteSettingsContext'

const currentYear = new Date().getFullYear()

const socials = [
  { name: 'facebook', label: 'Facebook' },
  { name: 'instagram', label: 'Instagram' },
  { name: 'x', label: 'X' },
  { name: 'telegram', label: 'Telegram' },
]

export default function Footer() {
  const { store } = useSiteSettings()
  const [email, setEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  const subscribe = async (event) => {
    event.preventDefault()
    const normalized = email.trim().toLowerCase()
    if (!normalized) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      toast.error('Please enter a valid email address')
      return
    }
    setSubscribing(true)
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: normalized, source: 'footer' })
    setSubscribing(false)
    if (error) {
      toast.error(
        error.code === '23505'
          ? 'You are already on the list — thanks for sticking with us!'
          : error.message,
      )
      return
    }
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
              {store.tagline} Genuine Apple products, transparent pricing, and delivery
              across Myanmar.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {socials.map((social) => (
                <button
                  key={social.name}
                  type="button"
                  onClick={() => toast.info('Social links are for demo only')}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-ink hover:text-ink"
                  aria-label={social.label}
                  title={social.label}
                >
                  <SocialIcon name={social.name} size={16} />
                </button>
              ))}
            </div>

            <div className="mt-6 w-full max-w-none lg:max-w-xs">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                Newsletter
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                New launches and exclusive offers, no spam.
              </p>
              <form
                onSubmit={subscribe}
                className="mt-2.5 flex w-full overflow-hidden rounded-pill border border-line bg-soft/60 p-1"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-muted"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-surface disabled:opacity-60"
                  aria-label="Subscribe to the newsletter"
                >
                  {subscribing ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                </button>
              </form>
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
            <h4 className="text-sm font-semibold text-ink">Get in touch</h4>
            <p className="mt-4 text-sm text-muted">We reply within one business day.</p>
            <div className="mt-4 space-y-2.5 text-sm text-muted">
              <a href={`tel:${store.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 hover:text-ink">
                <Phone size={14} />
                {store.phone}
              </a>
              <a href={`mailto:${store.email}`} className="flex items-center gap-2 hover:text-ink">
                <Mail size={14} />
                {store.email}
              </a>
              <p className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                {store.address}
              </p>
            </div>
            <Link to="/contact" className="mt-4 inline-flex text-xs font-semibold text-brand hover:underline">
              Send us a message
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-xs text-muted">
          <p>© {currentYear} {store.name}. Developed by Thura Linn Thant.</p>
        </div>
      </div>
    </footer>
  )
}
