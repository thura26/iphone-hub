import { useEffect, useRef } from 'react'
import { subscribeToTable } from '@/lib/realtime'

/**
 * Live-refresh helper. The callback ref avoids re-subscribing every render.
 */
export default function useRealtime({ table, event = '*', filter, onChange, enabled = true }) {
  const callbackRef = useRef(onChange)

  useEffect(() => {
    callbackRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!enabled || !table) return undefined
    return subscribeToTable({
      table,
      event,
      filter,
      onChange: (payload) => callbackRef.current?.(payload),
    })
  }, [table, event, filter, enabled])
}
