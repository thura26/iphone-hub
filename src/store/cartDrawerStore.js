import { create } from 'zustand'

export const useCartDrawerStore = create((set) => ({
  open: false,
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
}))
