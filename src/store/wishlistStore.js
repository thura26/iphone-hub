import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      ids: [],

      has: (productId) => get().ids.includes(productId),

      add: (productId) => {
        if (!productId || get().ids.includes(productId)) return
        set({ ids: [...get().ids, productId] })
      },

      remove: (productId) => set({ ids: get().ids.filter((id) => id !== productId) }),

      toggle: (productId) => {
        if (get().ids.includes(productId)) {
          set({ ids: get().ids.filter((id) => id !== productId) })
          return false
        }
        set({ ids: [...get().ids, productId] })
        return true
      },

      setIds: (ids) => set({ ids: Array.from(new Set(ids.filter(Boolean))) }),

      clear: () => set({ ids: [] }),
    }),
    {
      name: 'iphonehub-wishlist',
      version: 1,
    },
  ),
)
