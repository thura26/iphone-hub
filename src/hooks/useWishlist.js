import { useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/supabaseClient'
import { useWishlistStore } from '@/store/wishlistStore'

export function useWishlist() {
  const { user } = useAuth()
  const ids = useWishlistStore((state) => state.ids)
  const add = useWishlistStore((state) => state.add)
  const remove = useWishlistStore((state) => state.remove)

  const has = useCallback((productId) => ids.includes(productId), [ids])

  const toggle = useCallback(
    async (productId) => {
      if (!productId) return false
      const exists = ids.includes(productId)
      if (exists) {
        remove(productId)
        if (user) {
          const { error } = await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId)
          if (error) console.error('Could not remove wishlist item:', error.message)
        }
        return false
      }

      add(productId)
      if (user) {
        const { error } = await supabase.from('wishlists').upsert(
          { user_id: user.id, product_id: productId },
          { onConflict: 'user_id,product_id', ignoreDuplicates: true },
        )
        if (error) console.error('Could not save wishlist item:', error.message)
      }
      return true
    },
    [add, ids, remove, user],
  )

  return { ids, has, toggle, count: ids.length }
}
