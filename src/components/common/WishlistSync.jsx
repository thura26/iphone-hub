import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/supabaseClient'
import { useWishlistStore } from '@/store/wishlistStore'

/**
 * Merges the local guest wishlist with the user's saved wishlist after login.
 */
export default function WishlistSync() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return undefined
    let active = true

    async function sync() {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id')
        .eq('user_id', user.id)

      if (!active) return
      if (error) {
        console.error('Could not sync wishlist:', error.message)
        return
      }

      const localIds = useWishlistStore.getState().ids
      const remoteIds = (data || []).map((row) => row.product_id)
      const merged = Array.from(new Set([...localIds, ...remoteIds]))
      useWishlistStore.getState().setIds(merged)

      if (merged.length > 0) {
        const { error: upsertError } = await supabase.from('wishlists').upsert(
          merged.map((productId) => ({ user_id: user.id, product_id: productId })),
          { onConflict: 'user_id,product_id', ignoreDuplicates: true },
        )
        if (upsertError) {
          console.error('Could not merge wishlist:', upsertError.message)
        }
      }
    }

    sync()
    return () => {
      active = false
    }
  }, [user?.id])

  return null
}
