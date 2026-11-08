import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item, quantity = 1) => {
        const qty = Math.max(1, Number(quantity) || 1)
        const existing = get().items.find((entry) => entry.variantId === item.variantId)
        if (existing) {
          const max = Number(item.stock ?? existing.stock ?? 99)
          set({
            items: get().items.map((entry) =>
              entry.variantId === item.variantId
                ? { ...entry, quantity: Math.min(entry.quantity + qty, Math.max(1, max)) }
                : entry,
            ),
          })
          return
        }
        set({ items: [...get().items, { ...item, quantity: qty }] })
      },

      removeItem: (variantId) =>
        set({ items: get().items.filter((entry) => entry.variantId !== variantId) }),

      setQuantity: (variantId, quantity) => {
        const qty = Number(quantity)
        if (qty <= 0) {
          get().removeItem(variantId)
          return
        }
        set({
          items: get().items.map((entry) =>
            entry.variantId === variantId
              ? { ...entry, quantity: Math.min(qty, Math.max(1, entry.stock || 99)) }
              : entry,
          ),
        })
      },

      clear: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, entry) => sum + entry.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, entry) => sum + Number(entry.price) * entry.quantity, 0),
    }),
    {
      name: 'iphonehub-cart',
      version: 1,
    },
  ),
)
