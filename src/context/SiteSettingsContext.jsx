import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchSettings } from '@/lib/api'
import { subscribeToTable } from '@/lib/realtime'

export const DEFAULT_STORE = {
  name: 'iPhone Hub',
  tagline: 'Premium iPhones. Always.',
  email: 'hello@iphonehub.com',
  phone: '09459038758',
  address: 'Yangon, Myanmar',
}

export const DEFAULT_SHIPPING = {
  standard: 0,
  express: 15000,
  free_threshold: 5000000,
}

export const DEFAULT_ANNOUNCEMENT = {
  enabled: true,
}

const FALLBACKS = {
  store: DEFAULT_STORE,
  shipping: DEFAULT_SHIPPING,
  announcement: DEFAULT_ANNOUNCEMENT,
}

const SiteSettingsContext = createContext({
  store: DEFAULT_STORE,
  shipping: DEFAULT_SHIPPING,
  announcement: DEFAULT_ANNOUNCEMENT,
  refresh: async () => {},
})

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    store: DEFAULT_STORE,
    shipping: DEFAULT_SHIPPING,
    announcement: DEFAULT_ANNOUNCEMENT,
  })

  const applySettings = (data) => {
    setSettings({
      store: { ...DEFAULT_STORE, ...(data.store || {}) },
      shipping: { ...DEFAULT_SHIPPING, ...(data.shipping || {}) },
      announcement: { ...DEFAULT_ANNOUNCEMENT, ...(data.announcement || {}) },
    })
  }

  const refresh = async () => {
    try {
      const data = await fetchSettings()
      applySettings(data)
    } catch (error) {
      console.error('Could not refresh store settings', error)
    }
  }

  useEffect(() => {
    let active = true

    fetchSettings()
      .then((data) => {
        if (active) applySettings(data)
      })
      .catch((error) => console.error('Could not load store settings', error))

    const unsubscribe = subscribeToTable({
      table: 'settings',
      onChange: (payload) => {
        const row = payload.new || {}
        const fallback = FALLBACKS[row.key]
        if (fallback) {
          setSettings((current) => ({
            ...current,
            [row.key]: {
              ...fallback,
              ...(row.value || {}),
            },
          }))
        }
      },
    })

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', refresh)

    return () => {
      active = false
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const value = useMemo(() => ({ ...settings, refresh }), [settings])

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext)
}
