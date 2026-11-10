import { supabase } from '@/supabaseClient'

let channelSequence = 0

/**
 * Subscribe to a Postgres table and return an unsubscribe function.
 * Row Level Security is applied by Supabase Realtime using the signed-in user.
 */
export function subscribeToTable({ table, event = '*', filter, onChange }) {
  const channelName = `live-${table}-${Date.now()}-${(channelSequence += 1)}`
  const channel = supabase.channel(channelName)

  channel.on(
    'postgres_changes',
    {
      event,
      schema: 'public',
      table,
      ...(filter ? { filter } : {}),
    },
    (payload) => onChange?.(payload),
  )

  channel.subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
