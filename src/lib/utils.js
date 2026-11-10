import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const mmkFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

export function formatMMK(amount) {
  const value = Number(amount || 0)
  return `Ks ${mmkFormatter.format(value)}`
}

export function formatNumber(value) {
  return mmkFormatter.format(Number(value || 0))
}

export function formatDate(value, options = {}) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value)
    .toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/\b(am|pm)\b/gi, (meridiem) => meridiem.toUpperCase())
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function initials(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'IH'
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function variantLabel(variant) {
  if (!variant) return ''
  return [variant.storage, variant.color].filter(Boolean).join(' · ')
}

export const DELIVERY_METHODS = {
  standard: { label: 'Standard delivery', eta: '2–4 business days' },
  express: { label: 'Express delivery', eta: 'Next business day' },
}

export const PAYMENT_METHODS = {
  cod: { label: 'Cash on Delivery', description: 'Pay when your order arrives.' },
  card: { label: 'Credit / Debit Card', description: 'Mock checkout — no real charge.' },
  apple_pay: { label: 'Apple Pay', description: 'Demo only — no real payment is taken.' },
}

export const ORDER_STATUS_FLOW = ['pending', 'confirmed', 'packed', 'shipped', 'delivered']

export const ORDER_STATUS_META = {
  pending: { label: 'Pending', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'info' },
  packed: { label: 'Packed', tone: 'info' },
  shipped: { label: 'Shipped', tone: 'brand' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export function cartLineKey(variantId) {
  return `variant:${variantId}`
}
