import { supabase } from '@/supabaseClient'

export const PRODUCT_SELECT = '*, categories(id,name,slug), product_variants(*)'

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map((product) => ({
    ...product,
    product_variants: [...(product.product_variants || [])].sort(
      (a, b) => Number(a.sort_order) - Number(b.sort_order),
    ),
  }))
}

export async function fetchProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    ...data,
    product_variants: [...(data.product_variants || [])].sort(
      (a, b) => Number(a.sort_order) - Number(b.sort_order),
    ),
  }
}

export async function fetchCategories({ activeOnly = true } = {}) {
  let query = supabase.from('categories').select('*').order('sort_order', { ascending: true })
  if (activeOnly) query = query.eq('active', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchBanners({ activeOnly = true } = {}) {
  let query = supabase.from('banners').select('*').order('sort_order', { ascending: true })
  if (activeOnly) query = query.eq('active', true)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchSettings() {
  const { data, error } = await supabase.from('settings').select('*')
  if (error) throw error
  return Object.fromEntries((data || []).map((row) => [row.key, row.value]))
}

export async function fetchReviews(productId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export function minVariantPrice(product) {
  const prices = (product.product_variants || [])
    .filter((variant) => variant.active !== false)
    .map((variant) => Number(variant.price))
  if (prices.length === 0) return Number(product.base_price || 0)
  return Math.min(...prices)
}

export function totalStock(product) {
  return (product.product_variants || []).reduce(
    (sum, variant) => sum + Number(variant.stock || 0),
    0,
  )
}
