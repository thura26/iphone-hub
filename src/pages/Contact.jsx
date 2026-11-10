import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  PackageSearch,
  Phone,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import Reveal from '@/components/common/Reveal'
import Select from '@/components/common/Select'

const topics = [
  { value: 'order', label: 'Order status' },
  { value: 'advice', label: 'Product advice' },
  { value: 'delivery', label: 'Delivery question' },
  { value: 'warranty', label: 'Warranty & repairs' },
  { value: 'returns', label: 'Returns & refunds' },
  { value: 'other', label: 'Something else' },
]

const channels = [
  {
    icon: Phone,
    title: 'Call us',
    line1: '+95 9 000 000 000',
    line2: 'Mon–Sat, 9:00 AM – 7:00 PM',
    href: 'tel:+959000000000',
  },
  {
    icon: Mail,
    title: 'Email us',
    line1: 'hello@iphonehub.com',
    line2: 'Replies within one business day',
    href: 'mailto:hello@iphonehub.com',
  },
  {
    icon: MapPin,
    title: 'Visit the showroom',
    line1: 'No. 88, Pyay Road',
    line2: 'Kamayut, Yangon',
    href: '#showroom',
  },
  {
    icon: PackageSearch,
    title: 'Track an order',
    line1: 'Check your delivery status',
    line2: 'Sign in to view your orders',
    href: '/orders',
    internal: true,
  },
]

const faqs = [
  {
    question: 'How long does delivery take?',
    answer:
      'Standard delivery arrives in 2–4 business days across Myanmar. Express delivery is next business day, and Yangon orders placed before 3pm are usually delivered the same day.',
  },
  {
    question: 'Can I pay cash on delivery?',
    answer:
      'Yes. Cash on delivery is available nationwide. You can also pay by credit or debit card, or Apple Pay — card payments in this demo store are simulated.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'Unused devices in their original packaging can be returned within 7 days of delivery. Contact us first and we will arrange the pickup and inspection.',
  },
  {
    question: 'Are the iPhones genuine?',
    answer:
      'Every iPhone is sealed, genuine, and covered by Apple’s standard one-year warranty. Accessories carry a 6-month warranty.',
  },
  {
    question: 'Do you offer trade-ins?',
    answer:
      'We do. Send us your current model, storage, and condition through this form and our team will come back with an estimate.',
  },
]

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  topic: 'order',
  message: '',
}

export default function Contact() {
  const [form, setForm] = useState(emptyForm)
  const [sending, setSending] = useState(false)
  const timerRef = useRef(null)

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const submit = (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Please add your name, email, and message.')
      return
    }
    setSending(true)
    timerRef.current = window.setTimeout(() => {
      setSending(false)
      toast.success('Thanks for reaching out — we will reply within one business day.')
      setForm(emptyForm)
    }, 700)
  }

  return (
    <div className="pb-2">
      <section className="wrap pt-6 sm:pt-9">
        <div className="grid items-end gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <Reveal>
            <p className="eyebrow">Contact</p>
            <h1 className="mt-3 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              We are here to help.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Questions about an order, a trade-in, or which iPhone fits you best?
              Send us a message and a real person will get back to you within one
              business day.
            </p>
          </Reveal>

          <Reveal delay={100} className="justify-self-start lg:justify-self-end">
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5">
              <span className="relative grid h-10 w-10 place-items-center rounded-full bg-success/10 text-success">
                <MessageSquare size={17} />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">Usually replies in under a day</p>
                <p className="text-[11px] text-muted">Mon–Sat, 9:00 AM – 7:00 PM</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="wrap mt-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map(({ icon: Icon, title, line1, line2, href, internal }, index) => {
            const body = (
              <>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-soft text-ink transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                  <Icon size={17} />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1 text-xs font-medium text-ink/80">{line1}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{line2}</p>
              </>
            )

            return (
              <Reveal key={title} delay={index * 60} className="h-full">
                {internal ? (
                  <Link
                    to={href}
                    className="group flex h-full flex-col rounded-card border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                  >
                    {body}
                  </Link>
                ) : (
                  <a
                    href={href}
                    className="group flex h-full flex-col rounded-card border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
                  >
                    {body}
                  </a>
                )}
              </Reveal>
            )
          })}
        </div>
      </section>

      <section className="wrap mt-10">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <Reveal className="card p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <Send size={17} className="text-brand" />
              <h2 className="text-base font-bold text-ink">Send a message</h2>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Fill in the form and we will route it to the right person.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="contact_name">Full name</label>
                  <input
                    id="contact_name"
                    className="field"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="contact_email">Email address</label>
                  <input
                    id="contact_email"
                    type="email"
                    className="field"
                    value={form.email}
                    onChange={(event) => update('email', event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="contact_phone">Phone (optional)</label>
                  <input
                    id="contact_phone"
                    className="field"
                    value={form.phone}
                    onChange={(event) => update('phone', event.target.value)}
                    placeholder="+95 9 000 000 000"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="contact_topic">What can we help with?</label>
                  <Select
                    id="contact_topic"
                    value={form.topic}
                    onChange={(value) => update('topic', value)}
                    options={topics}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="contact_message">Message</label>
                <textarea
                  id="contact_message"
                  rows={5}
                  className="field resize-y"
                  value={form.message}
                  onChange={(event) => update('message', event.target.value)}
                  placeholder="Tell us a little about what you need…"
                  required
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted">
                  By sending, you agree to be contacted about your enquiry.
                </p>
                <button type="submit" className="btn-primary" disabled={sending}>
                  {sending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send message
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </Reveal>

          <div className="space-y-4">
            <Reveal delay={80} className="card overflow-hidden">
              <div
                className="relative h-36 border-b border-line bg-soft"
                style={{
                  backgroundImage:
                    'linear-gradient(#e3e3e6 1px, transparent 1px), linear-gradient(90deg, #e3e3e6 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              >
                <div className="absolute left-1/3 top-0 h-full w-6 -rotate-12 bg-white/70" />
                <div className="absolute left-0 top-1/2 h-5 w-full -rotate-6 bg-white/70" />
                <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-surface shadow-lg">
                  <MapPin size={18} />
                </span>
              </div>
              <div className="p-5" id="showroom">
                <h3 className="text-sm font-bold text-ink">iPhone Hub showroom</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  No. 88, Pyay Road, Kamayut Township, Yangon, Myanmar.
                </p>
                <dl className="mt-4 space-y-1.5 text-[11px] text-muted">
                  <div className="flex items-center justify-between gap-3">
                    <dt>Monday – Friday</dt>
                    <dd className="font-medium text-ink">9:00 AM – 7:00 PM</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Saturday</dt>
                    <dd className="font-medium text-ink">9:00 AM – 5:00 PM</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt>Sunday</dt>
                    <dd className="font-medium text-ink">Closed</dd>
                  </div>
                </dl>
              </div>
            </Reveal>

            <Reveal delay={120} className="rounded-card border border-line bg-soft p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <Clock size={14} />
                Need an answer right now?
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                Our team is on the phone during showroom hours. For order updates,
                have your order number ready.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <a href="tel:+959000000000" className="btn-primary btn-sm">
                  <Phone size={14} />
                  Call +95 9 000 000 000
                </a>
                <a href="mailto:hello@iphonehub.com" className="btn-outline btn-sm">
                  <Mail size={14} />
                  Email us
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="wrap mt-14">
        <Reveal className="mb-5">
          <p className="eyebrow">Answers</p>
          <h2 className="section-title mt-1">Frequently asked questions</h2>
        </Reveal>
        <Reveal className="overflow-hidden rounded-card border border-line bg-surface">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-line px-5 py-4 last:border-b-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-ink">
                {faq.question}
                <ChevronDown
                  size={16}
                  className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="mt-2.5 max-w-3xl pr-6 text-sm leading-relaxed text-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </Reveal>
      </section>
    </div>
  )
}
