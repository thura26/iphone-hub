import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

export default function ThemeToggle({ className, withLabel = false }) {
  const { isDark, toggleTheme } = useTheme()
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full text-ink transition-colors hover:bg-soft',
        withLabel ? 'h-10 px-3.5 text-xs font-semibold' : 'h-10 w-10',
        className,
      )}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      {withLabel && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  )
}
