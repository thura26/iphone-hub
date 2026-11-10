import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Clock, Loader2, Search, X } from 'lucide-react'
import { supabase } from '@/supabaseClient'
import { cn, formatMMK } from '@/lib/utils'

const RECENT_KEY = 'iphonehub:recent-searches'

const popular = ['iPhone 18 Pro', 'iPhone Air', 'Cases', 'AirPods']

function readRecent() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string').slice(0, 5) : []
  } catch {
    return []
  }
}

function saveRecent(term) {
  const clean = term.trim()
  if (!clean) return readRecent()
  const next = [
    clean,
    ...readRecent().filter((item) => item.toLowerCase() !== clean.toLowerCase()),
  ].slice(0, 5)
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // Storage may be unavailable in private mode.
  }
  return next
}

export default function HeaderSearch({
  className,
  inputClassName,
  autoFocus = false,
  onNavigate,
  ariaLabel = 'Search products',
}) {
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [recent, setRecent] = useState(readRecent)
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open])

  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  useEffect(() => {
    if (!open) {
      setResults([])
      setLoading(false)
      return undefined
    }

    const term = query.trim()
    setActiveIndex(-1)
    if (term.length < 2) {
      setResults([])
      setLoading(false)
      return undefined
    }

    let active = true
    setLoading(true)
    const timer = window.setTimeout(async () => {
      const safe = term.replace(/[,()]/g, ' ').trim()
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, images, base_price, categories(name)')
        .eq('active', true)
        .or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
        .order('featured', { ascending: false })
        .order('name')
        .limit(6)

      if (!active) return
      setLoading(false)
      if (error) {
        console.error(error)
        setResults([])
        return
      }
      setResults(data || [])
    }, 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query, open])

  const showRecents = query.trim().length < 2
  const choices = showRecents ? recent : results

  const remember = (term) => {
    const next = saveRecent(term)
    setRecent(next)
  }

  const goToProduct = (product) => {
    remember(product.name)
    setOpen(false)
    setQuery('')
    onNavigate?.()
    navigate(`/product/${product.slug}`)
  }

  const goToSearch = (term) => {
    const clean = term.trim()
    if (!clean) {
      navigate('/shop')
    } else {
      remember(clean)
      navigate(`/shop?q=${encodeURIComponent(clean)}`)
    }
    setOpen(false)
    setQuery('')
    onNavigate?.()
  }

  const submit = (event) => {
    event.preventDefault()
    const choice = choices[activeIndex]
    if (choice) {
      if (showRecents) {
        setQuery(choice)
        inputRef.current?.focus()
      } else {
        goToProduct(choice)
      }
      return
    }
    goToSearch(query)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
      return
    }
    if (!choices.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActiveIndex((current) => (current + 1) % choices.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current <= 0 ? choices.length - 1 : current - 1))
    }
  }

  const clearRecent = () => {
    try {
      window.localStorage.removeItem(RECENT_KEY)
    } catch {
      // Ignore storage errors.
    }
    setRecent([])
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <form onSubmit={submit} role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search iPhones, accessories…"
            className={cn(
              'h-10 w-full rounded-pill border border-line bg-soft/70 pl-9 pr-9 text-sm text-ink outline-none transition-all placeholder:text-muted focus:border-brand focus:bg-surface',
              inputClassName,
            )}
            aria-label={ariaLabel}
            autoFocus={autoFocus}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[70] min-w-[320px] overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-float)]">
          {showRecents ? (
            <div className="p-2">
              {recent.length > 0 ? (
                <>
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Recent searches
                    </p>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-[10px] font-semibold text-muted hover:text-ink"
                    >
                      Clear
                    </button>
                  </div>
                  <ul>
                    {recent.map((term, index) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => {
                            setQuery(term)
                            inputRef.current?.focus()
                          }}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-soft',
                            activeIndex === index && 'bg-soft',
                          )}
                        >
                          <Clock size={14} className="shrink-0 text-muted" />
                          <span className="min-w-0 flex-1 truncate">{term}</span>
                          <ArrowUpRight size={13} className="shrink-0 text-muted" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="px-2 py-1.5">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
                    Popular right now
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 px-1 pb-1">
                    {popular.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setQuery(term)
                          inputRef.current?.focus()
                        }}
                        className="pill"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted">
              <Loader2 size={15} className="animate-spin" />
              Searching…
            </div>
          ) : results.length > 0 ? (
            <div>
              <p className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider text-muted">
                Products
              </p>
              <ul className="p-1.5">
                {results.map((product, index) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => goToProduct(product)}
                      onPointerEnter={() => setActiveIndex(index)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-soft',
                        activeIndex === index && 'bg-soft',
                      )}
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <Search size={14} className="text-muted" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-ink">
                          {product.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted">
                          {product.categories?.name || 'iPhone'} · from{' '}
                          {formatMMK(product.base_price)}
                        </span>
                      </span>
                      <ArrowUpRight size={14} className="shrink-0 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => goToSearch(query)}
                className="flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-left text-[11px] font-semibold text-brand hover:bg-soft"
              >
                View all results for “{query.trim()}”
                <ArrowUpRight size={13} />
              </button>
            </div>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-semibold text-ink">No products found</p>
              <p className="mt-1 text-xs text-muted">
                Nothing matched “{query.trim()}”. Try a different keyword.
              </p>
              <button
                type="button"
                onClick={() => goToSearch(query)}
                className="btn-outline btn-sm mt-3"
              >
                Search all products
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
