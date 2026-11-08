import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  HeartHandshake,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import Reveal from '@/components/common/Reveal'

const stats = [
  { value: '10k+', label: 'Orders delivered' },
  { value: '100%', label: 'Genuine Apple products' },
  { value: '24h', label: 'Average dispatch time' },
  { value: '7 days', label: 'Easy returns' },
]

const values = [
  {
    icon: ShieldCheck,
    title: '100% genuine',
    text: 'Every device is sealed, official, and backed by Apple’s standard warranty. No grey imports, ever.',
  },
  {
    icon: BadgeCheck,
    title: 'Honest pricing',
    text: 'The price you see is the price you pay. No hidden fees, no surprise charges at checkout.',
  },
  {
    icon: Truck,
    title: 'Fast delivery',
    text: 'Same-day delivery in Yangon and 2–4 business days nationwide, with tracking at every step.',
  },
  {
    icon: HeartHandshake,
    title: 'Real support',
    text: 'Talk to actual people before and after your purchase — by phone, email, or in our showroom.',
  },
]

const milestones = [
  { year: '2021', title: 'A small counter in Yangon', text: 'We started helping friends and family find genuine iPhones at fair prices.' },
  { year: '2023', title: 'Nationwide delivery', text: 'iPhone Hub began shipping to every state and region across Myanmar.' },
  { year: '2025', title: '10,000 customers', text: 'A milestone made possible by word of mouth and repeat customers.' },
  { year: '2026', title: 'The online store', text: 'The full iPhone Hub experience — browse, compare, and check out in minutes.' },
]

export default function About() {
  return (
    <div className="pb-2">
      <section className="wrap pt-6 sm:pt-9">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">About iPhone Hub</p>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              The easiest way to get a new iPhone in Myanmar.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              We built iPhone Hub around a simple idea: buying a premium phone should
              feel premium too. Genuine devices, transparent prices, and delivery you
              can follow from checkout to your door.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">
                Shop the lineup
                <ArrowRight size={15} />
              </Link>
              <Link to="/contact" className="btn-outline">
                Talk to us
              </Link>
            </div>
          </Reveal>

          <Reveal delay={100} className="relative">
            <div className="relative overflow-hidden rounded-[32px] border border-line bg-gradient-to-br from-[#eef5ff] via-[#e6eef8] to-[#dbe6f2] px-6 pb-6 pt-10 sm:px-10 sm:pt-12">
              <div
                aria-hidden
                className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/70 blur-2xl"
              />
              <img
                src="/images/products/iphone-18-pro-glacier.webp"
                alt="iPhone 18 Pro in Glacier"
                className="relative mx-auto h-[300px] w-auto object-contain drop-shadow-[0_30px_45px_rgba(16,24,40,0.22)] sm:h-[360px]"
              />
              <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-surface/85 px-4 py-3 backdrop-blur">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-brand">
                    <ShieldCheck size={16} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-ink">Official Apple warranty</p>
                    <p className="text-[10px] text-muted">Every device, every time</p>
                  </div>
                </div>
                <span className="rounded-pill bg-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Sealed & genuine
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Reveal as="section" className="wrap mt-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-line bg-surface px-4 py-5 text-center sm:px-5 sm:py-6"
            >
              <p className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted sm:text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      <section className="wrap mt-14 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="card p-6 sm:p-8">
          <p className="eyebrow">Our story</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Built for how Myanmar shops.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Buying a phone should not require a dozen phone calls. We put the entire
            catalogue online — storage, colour, price, and stock — so you can decide
            with confidence. When you are ready, checkout takes less than a minute.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Behind the website is a small team in Yangon that checks every order,
            packages every device, and answers every message. We are customers too,
            so we treat each order the way we would want ours handled.
          </p>

          <ol className="mt-8 space-y-5 border-l border-line pl-5">
            {milestones.map((milestone) => (
              <li key={milestone.year} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-surface bg-brand" />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
                  {milestone.year}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{milestone.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{milestone.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {values.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * 70}>
              <div className="card h-full p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-soft text-ink">
                  <Icon size={18} />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className="wrap mt-14">
        <div className="relative overflow-hidden rounded-[28px] border border-line bg-ink px-6 py-10 text-surface sm:px-10 sm:py-14">
          <div
            aria-hidden
            className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/30 blur-3xl"
          />
          <div className="relative max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-surface/60">
              Ready when you are
            </p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Find the iPhone that fits your everyday.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-surface/70">
              Compare the full lineup, or tell us what you need and we will point you
              in the right direction.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/shop" className="btn bg-surface text-ink hover:opacity-90">
                Shop all iPhones
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/contact"
                className="btn border border-white/25 text-surface hover:bg-white/10"
              >
                Contact the team
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}
