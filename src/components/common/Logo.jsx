import { Link } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import { useSiteSettings } from '@/context/SiteSettingsContext'
import { cn } from '@/lib/utils'

export default function Logo({ compact = false, light = false, to = '/', className }) {
  const { store } = useSiteSettings()

  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)} aria-label={`${store.name} home`}>
      <span
        className={cn(
          'grid h-9 w-9 place-items-center rounded-[11px] shadow-sm',
          light ? 'bg-white text-black' : 'bg-ink text-surface',
        )}
      >
        <Smartphone size={17} strokeWidth={2.4} />
      </span>
      {!compact && (
        <span className={cn('text-[17px] font-bold tracking-tight', light ? 'text-white' : 'text-ink')}>
          {store.name}
        </span>
      )}
    </Link>
  )
}
