import { ORDER_STATUS_META } from '@/lib/utils'

const tones = {
  brand: 'badge-brand',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-brand',
  neutral: 'badge-neutral',
}

export default function StatusBadge({ status, className }) {
  const meta = ORDER_STATUS_META[status] || {
    label: status || 'Unknown',
    tone: 'neutral',
  }
  return <span className={`${tones[meta.tone] || tones.neutral} ${className || ''}`}>{meta.label}</span>
}
