import { cn } from '@/lib/utils'

export default function StatCard({ label, value, icon: Icon, hint, tone = 'default' }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
        </div>
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-full',
            tone === 'brand' && 'bg-brand/10 text-brand',
            tone === 'success' && 'bg-success/10 text-success',
            tone === 'warning' && 'bg-warning/10 text-warning',
            tone === 'danger' && 'bg-danger/10 text-danger',
            tone === 'default' && 'bg-soft text-ink',
          )}
        >
          <Icon size={18} />
        </span>
      </div>
      {hint && <p className="mt-3 text-[11px] text-muted">{hint}</p>}
    </div>
  )
}
