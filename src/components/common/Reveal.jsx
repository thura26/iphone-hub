import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

const useSafeLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  className,
  children,
  once = true,
  style,
  ...props
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  // Content already on screen at mount should be visible immediately,
  // without a flash of hidden content before the observer fires.
  useSafeLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) observer.unobserve(entry.target)
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold: 0.02, rootMargin: '0px 0px -24px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once])

  return (
    <Tag
      ref={ref}
      className={cn('reveal', visible && 'reveal-visible', className)}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  )
}
