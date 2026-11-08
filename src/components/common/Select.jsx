import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizeClasses = {
  md: 'h-11 rounded-btn px-4 pr-11 text-sm',
  sm: 'h-9 rounded-pill pl-3 pr-9 text-xs font-medium',
  xs: 'h-9 rounded-btn pl-3 pr-9 text-xs',
}

const chevronPositions = {
  md: 'right-3.5',
  sm: 'right-3',
  xs: 'right-3',
}

const sameValue = (a, b) => String(a ?? '') === String(b ?? '')

export default function Select({
  id,
  value = '',
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
  name,
}) {
  const autoId = useId()
  const selectId = id || `select-${autoId}`

  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const listRef = useRef(null)
  const typeaheadRef = useRef({ buffer: '', timer: null })

  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [panelStyle, setPanelStyle] = useState(null)
  const [placement, setPlacement] = useState('down')

  const selectedIndex = options.findIndex((option) =>
    sameValue(option.value, value),
  )
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const margin = 8
    const gap = 6
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const width = Math.min(
      Math.max(rect.width, 180),
      viewportWidth - margin * 2,
    )
    const left = Math.min(
      Math.max(rect.left, margin),
      viewportWidth - width - margin,
    )

    const spaceBelow = viewportHeight - rect.bottom - gap - margin
    const spaceAbove = rect.top - gap - margin
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow
    const maxHeight = Math.max(
      120,
      Math.min(272, openUp ? spaceAbove : spaceBelow),
    )

    setPlacement(openUp ? 'up' : 'down')
    setPanelStyle({
      left,
      width,
      maxHeight,
      ...(openUp
        ? { bottom: viewportHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    })
  }, [])

  const closeMenu = useCallback((focusTrigger = false) => {
    setOpen(false)
    setActiveIndex(-1)
    if (focusTrigger) triggerRef.current?.focus()
  }, [])

  const openMenu = useCallback(() => {
    if (disabled) return
    updatePosition()
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }, [disabled, selectedIndex, updatePosition])

  const chooseOption = useCallback(
    (index) => {
      const option = options[index]
      if (!option || option.disabled) return
      if (!sameValue(option.value, value)) onChange?.(option.value, option)
      closeMenu(true)
    },
    [closeMenu, onChange, options, value],
  )

  const findEnabledIndex = useCallback(
    (start, direction) => {
      if (options.length === 0) return -1
      let index = start
      for (let step = 0; step < options.length; step += 1) {
        index = (index + direction + options.length) % options.length
        if (!options[index]?.disabled) return index
      }
      return start
    },
    [options],
  )

  // Reposition while open and close on outside pointer interaction.
  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        panelRef.current?.contains(event.target)
      ) {
        return
      }
      closeMenu()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [closeMenu, open, updatePosition])

  // Keep the highlighted row visible while navigating with the keyboard.
  useLayoutEffect(() => {
    if (!open || activeIndex < 0) return
    const option = listRef.current?.children[activeIndex]
    option?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open, updatePosition])

  useEffect(
    () => () => {
      if (typeaheadRef.current.timer) {
        window.clearTimeout(typeaheadRef.current.timer)
      }
    },
    [],
  )

  const handleKeyDown = (event) => {
    if (disabled) return

    if (!open) {
      if (
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp' ||
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault()
        openMenu()
      }
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => findEnabledIndex(current, 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => findEnabledIndex(current, -1))
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(findEnabledIndex(-1, 1))
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(findEnabledIndex(options.length, -1))
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (activeIndex >= 0) chooseOption(activeIndex)
      else closeMenu(true)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeMenu(true)
      return
    }

    if (event.key === 'Tab') {
      closeMenu()
      return
    }

    if (
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      const state = typeaheadRef.current
      state.buffer += event.key.toLowerCase()
      if (state.timer) window.clearTimeout(state.timer)
      state.timer = window.setTimeout(() => {
        state.buffer = ''
      }, 500)

      const match = options.findIndex(
        (option) =>
          !option.disabled &&
          String(option.label).toLowerCase().startsWith(state.buffer),
      )
      if (match >= 0) setActiveIndex(match)
    }
  }

  const listboxId = `${selectId}-listbox`
  const optionId = (index) => `${selectId}-option-${index}`
  const triggerLabel = selectedOption ? selectedOption.label : placeholder
  const isPlaceholder = !selectedOption

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? optionId(activeIndex) : undefined
        }
        aria-label={ariaLabel}
        name={name}
        disabled={disabled}
        onClick={() => (open ? closeMenu(true) : openMenu())}
        onKeyDown={handleKeyDown}
        className={cn(
          'group relative inline-flex w-full items-center justify-between gap-2 border border-line bg-surface text-left text-ink shadow-[0_1px_2px_rgba(16,24,40,0.03)] outline-none transition-all duration-200',
          'hover:border-ink/20 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/10',
          sizeClasses[size] || sizeClasses.md,
          open && 'border-brand ring-4 ring-brand/10',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <span
          className={cn(
            'min-w-0 truncate',
            isPlaceholder && 'text-muted/80',
          )}
        >
          {triggerLabel}
        </span>
        <ChevronDown
          size={size === 'md' ? 17 : 15}
          strokeWidth={2}
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted transition-transform duration-200',
            chevronPositions[size] || chevronPositions.md,
            open && 'rotate-180 text-ink',
          )}
        />
      </button>

      {open &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            data-placement={placement}
            style={{
              position: 'fixed',
              left: panelStyle.left,
              width: panelStyle.width,
              maxHeight: panelStyle.maxHeight,
              ...(placement === 'up'
                ? { bottom: panelStyle.bottom }
                : { top: panelStyle.top }),
            }}
            className="select-panel z-[95] overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-[0_24px_60px_-24px_rgba(16,24,40,0.4),0_2px_8px_-2px_rgba(16,24,40,0.08)]"
          >
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel || placeholder}
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: panelStyle.maxHeight - 12 }}
            >
              {options.map((option, index) => {
                const isSelected = sameValue(option.value, value)
                const isActive = index === activeIndex
                return (
                  <li
                    key={`${option.value}-${index}`}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onPointerEnter={() => {
                      if (!option.disabled) setActiveIndex(index)
                    }}
                    onClick={() => chooseOption(index)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                      isActive && 'bg-soft',
                      isSelected && 'bg-brand/[0.06] font-semibold text-ink',
                      option.disabled && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {isSelected && (
                      <Check
                        size={15}
                        strokeWidth={2.6}
                        className="shrink-0 text-brand"
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  )
}
