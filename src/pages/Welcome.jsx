import { Link } from 'react-router-dom'
import { ArrowRight, RotateCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import Logo from '@/components/common/Logo'

const perks = [
  { icon: ShieldCheck, label: 'Genuine Apple' },
  { icon: Truck, label: 'Fast delivery' },
  { icon: RotateCcw, label: '7-day returns' },
]

export default function Welcome() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#050506] text-white">
      <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand/20 blur-[120px]" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-rose-500/10 blur-[110px]" />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo light />
        <Link
          to="/"
          className="rounded-pill border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white"
        >
          Skip
        </Link>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-12">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-pill border border-white/15 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur">
            <Sparkles size={13} />
            New season · iPhone 18 Pro
          </span>
          <h1 className="mt-5 text-balance text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            The iPhone
            <br />
            you have been
            <br />
            <span className="bg-gradient-to-r from-[#2997ff] via-white to-[#f5c6d0] bg-clip-text text-transparent">
              waiting for.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/60 lg:mx-0">
            Shop the newest iPhone 18 and iPhone 17 lineup, plus genuine accessories.
            Delivered across Myanmar with transparent pricing.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Link
              to="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-pill bg-white px-7 text-sm font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/shop"
              className="inline-flex h-12 items-center justify-center rounded-pill border border-white/20 px-7 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/5"
            >
              Browse the lineup
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-5 text-[11px] font-medium text-white/50 lg:justify-start">
            {perks.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon size={14} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <div className="relative mx-auto max-w-sm lg:max-w-none">
            <div className="absolute inset-8 rounded-full bg-brand/25 blur-[70px]" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] p-2 shadow-2xl">
              <img
                src="/images/hero/iphone-18-pro-hero.webp"
                alt="iPhone 18 Pro"
                fetchPriority="high"
                decoding="async"
                className="aspect-[4/5] w-full rounded-[26px] object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 rounded-b-[26px] bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                  iPhone 18 Pro
                </p>
                <p className="mt-1 text-lg font-semibold">Titanium. Intelligent. Unstoppable.</p>
                <p className="mt-1 text-xs text-white/60">From Ks 4,799,000</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
