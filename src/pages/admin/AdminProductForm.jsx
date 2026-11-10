import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ImageOff,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useConfirm } from '@/context/ConfirmContext'
import { cn, formatMMK, slugify } from '@/lib/utils'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Select from '@/components/common/Select'

const emptyVariant = {
  storage: '',
  color: '',
  color_hex: '#1c1c1e',
  sku: '',
  price: '',
  stock: '0',
  image: '',
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-2.5 text-left"
      role="switch"
      aria-checked={checked}
    >
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[11px] text-muted">{description}</span>}
      </span>
      <span
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-line',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </span>
    </button>
  )
}

export default function AdminProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const confirm = useConfirm()
  const fileInputRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '',
    slug: '',
    category_id: '',
    description: '',
    base_price: '',
    highlightsText: '',
    featured: false,
    active: true,
    images: [],
  })
  const [variants, setVariants] = useState([{ ...emptyVariant, stock: '10' }])
  const [imageUrl, setImageUrl] = useState('')
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      const categoryResult = await supabase.from('categories').select('*').order('sort_order')
      if (!active) return
      if (categoryResult.error) console.error(categoryResult.error)
      setCategories(categoryResult.data || [])

      if (isEdit) {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_variants(*)')
          .eq('id', id)
          .maybeSingle()
        if (!active) return
        if (error) {
          console.error(error)
          toast.error(error.message)
        }
        if (!data) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          category_id: data.category_id || '',
          description: data.description || '',
          base_price: String(data.base_price ?? ''),
          highlightsText: (data.highlights || []).join('\n'),
          featured: Boolean(data.featured),
          active: Boolean(data.active),
          images: data.images || [],
        })
        const rows = [...(data.product_variants || [])].sort(
          (a, b) => Number(a.sort_order) - Number(b.sort_order),
        )
        setVariants(
          rows.length > 0
            ? rows.map((variant) => ({
                id: variant.id,
                storage: variant.storage || '',
                color: variant.color || '',
                color_hex: variant.color_hex || '#1c1c1e',
                sku: variant.sku || '',
                price: String(variant.price ?? ''),
                stock: String(variant.stock ?? 0),
                image: variant.image || '',
                active: variant.active !== false,
              }))
            : [{ ...emptyVariant, stock: '10' }],
        )
      }
      setLoading(false)
    }
    load()
    return () => {
      active = false
    }
  }, [id, isEdit])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const updateName = (value) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }))
  }

  const updateVariant = (index, field, value) => {
    setVariants((current) =>
      current.map((variant, itemIndex) =>
        itemIndex === index ? { ...variant, [field]: value } : variant,
      ),
    )
  }

  const addVariant = () => {
    setVariants((current) => [
      ...current,
      { ...emptyVariant, price: form.base_price || '', stock: '10' },
    ])
  }

  const removeVariant = async (index) => {
    const isSaved = Boolean(variants[index]?.id)
    const confirmed = await confirm({
      title: `Remove variant ${index + 1}?`,
      description: isSaved
        ? 'This variant will be deleted when you save the product. Orders already placed keep their records.'
        : 'This unsaved variant will be removed from the form.',
      confirmLabel: 'Remove variant',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const addImageUrl = () => {
    const url = imageUrl.trim()
    if (!url) return
    if (!url.startsWith('http') && !url.startsWith('/')) {
      toast.error('Enter a valid image URL or path')
      return
    }
    if (form.images.includes(url)) {
      toast.error('That image is already added')
      return
    }
    update('images', [...form.images, url])
    setImageUrl('')
  }

  const removeImage = (url) => {
    update('images', form.images.filter((image) => image !== url))
    setVariants((current) =>
      current.map((variant) => (variant.image === url ? { ...variant, image: '' } : variant)),
    )
  }

  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length === 0) return
    setUploading(true)
    const uploaded = []
    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 5MB`)
          continue
        }
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${slugify(
          file.name.replace(/\.[^.]+$/, ''),
        )}.${extension}`
        const { error } = await supabase.storage
          .from('product-images')
          .upload(path, file, { cacheControl: '31536000', upsert: false })
        if (error) {
          toast.error(error.message)
          continue
        }
        const { data } = supabase.storage.from('product-images').getPublicUrl(path)
        uploaded.push(data.publicUrl)
      }
      if (uploaded.length > 0) {
        setForm((current) => ({ ...current, images: [...current.images, ...uploaded] }))
        toast.success(`${uploaded.length} image${uploaded.length === 1 ? '' : 's'} uploaded`)
      }
    } finally {
      setUploading(false)
    }
  }

  const totalVariantStock = useMemo(
    () => variants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0),
    [variants],
  )

  const save = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return toast.error('Product name is required')
    if (!form.slug.trim()) return toast.error('Slug is required')
    if (form.base_price === '' || Number(form.base_price) < 0) return toast.error('Enter a valid base price')
    const usableVariants = variants.filter(
      (variant) => variant.storage.trim() && variant.color.trim(),
    )
    if (usableVariants.length === 0) return toast.error('Add at least one variant with storage and color')
    if (usableVariants.some((variant) => variant.price === '' || Number(variant.price) < 0)) {
      return toast.error('Every variant needs a valid price')
    }
    const duplicate = usableVariants.find((variant, index) => {
      const key = `${variant.storage.trim().toLowerCase()}||${variant.color.trim().toLowerCase()}`
      return usableVariants.findIndex((other) => `${other.storage.trim().toLowerCase()}||${other.color.trim().toLowerCase()}` === key) !== index
    })
    if (duplicate) {
      return toast.error(`Duplicate variant: ${duplicate.storage} · ${duplicate.color}`)
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: slugify(form.slug),
        category_id: form.category_id || null,
        description: form.description.trim(),
        base_price: Number(form.base_price),
        highlights: form.highlightsText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        images: form.images,
        featured: form.featured,
        active: form.active,
      }

      let productId = id
      if (isEdit) {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw error
        productId = data.id
      }

      const existingIds = variants.map((variant) => variant.id).filter(Boolean)
      for (const [index, variant] of usableVariants.entries()) {
        const sku =
          variant.sku.trim() ||
          `${slugify(payload.slug).replace(/-/g, '').toUpperCase()}-${slugify(
            variant.storage,
          ).toUpperCase()}-${slugify(variant.color).toUpperCase()}`
        const variantPayload = {
          product_id: productId,
          storage: variant.storage.trim(),
          color: variant.color.trim(),
          color_hex: variant.color_hex || null,
          sku,
          price: Number(variant.price),
          stock: Math.max(0, Math.floor(Number(variant.stock) || 0)),
          image: variant.image || form.images[0] || null,
          sort_order: index + 1,
          active: true,
        }
        if (variant.id) {
          const { error } = await supabase
            .from('product_variants')
            .update(variantPayload)
            .eq('id', variant.id)
          if (error) throw error
        } else {
          const { error } = await supabase.from('product_variants').insert(variantPayload)
          if (error) throw error
        }
      }

      const keptIds = usableVariants.map((variant) => variant.id).filter(Boolean)
      const idsToDelete = existingIds.filter((existingId) => !keptIds.includes(existingId))
      if (idsToDelete.length > 0) {
        const { error } = await supabase.from('product_variants').delete().in('id', idsToDelete)
        if (error) throw error
      }

      toast.success(isEdit ? 'Product updated' : 'Product created')
      navigate('/admin/products')
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Could not save the product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader label="Loading product…" />

  if (notFound) {
    return (
      <EmptyState
        title="Product not found"
        description="It may have been deleted. Return to the product list to continue."
        action={<Link to="/admin/products" className="btn-primary">Back to products</Link>}
      />
    )
  }

  return (
    <form id="product-form" onSubmit={save} className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="btn-icon -ml-2" aria-label="Back to products">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="eyebrow">Catalog</p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-ink">
              {isEdit ? 'Edit product' : 'New product'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/products" className="btn-outline btn-sm">Cancel</Link>
          <button type="submit" disabled={saving || uploading} className="btn-primary btn-sm">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink">Basic details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor="product_name">Product name *</label>
                <input
                  id="product_name"
                  className="field"
                  value={form.name}
                  onChange={(event) => updateName(event.target.value)}
                  placeholder="iPhone 18 Pro"
                />
              </div>
              <div>
                <label className="label" htmlFor="product_slug">Slug *</label>
                <input
                  id="product_slug"
                  className="field"
                  value={form.slug}
                  onChange={(event) => {
                    setSlugTouched(true)
                    update('slug', event.target.value)
                  }}
                  placeholder="iphone-18-pro"
                />
                <p className="mt-1 text-[10px] text-muted">Used in the product URL: /product/{form.slug || 'slug'}</p>
              </div>
              <div>
                <label className="label" htmlFor="product_category">Category</label>
                <Select
                  id="product_category"
                  value={form.category_id}
                  onChange={(value) => update('category_id', value)}
                  options={[
                    { value: '', label: 'Uncategorised' },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
              </div>
              <div>
                <label className="label" htmlFor="product_price">Base price (MMK) *</label>
                <input
                  id="product_price"
                  type="number"
                  min="0"
                  step="1000"
                  className="field"
                  value={form.base_price}
                  onChange={(event) => update('base_price', event.target.value)}
                  placeholder="4799000"
                />
                <p className="mt-1 text-[10px] text-muted">
                  {form.base_price ? formatMMK(form.base_price) : 'Shown when no variant is selected.'}
                </p>
              </div>
              <div>
                <label className="label" htmlFor="product_description">Description</label>
                <textarea
                  id="product_description"
                  rows={4}
                  className="field resize-none"
                  value={form.description}
                  onChange={(event) => update('description', event.target.value)}
                  placeholder="A short product description for the product page."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="product_highlights">Highlights (one per line)</label>
                <textarea
                  id="product_highlights"
                  rows={4}
                  className="field resize-none"
                  value={form.highlightsText}
                  onChange={(event) => update('highlightsText', event.target.value)}
                  placeholder={'6.3-inch Super Retina XDR display\nA20 Pro chip\n48MP camera system'}
                />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-ink">Images</h2>
                <p className="mt-0.5 text-[11px] text-muted">The first image is used as the product card image.</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-outline btn-sm"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                hidden
                onChange={uploadImages}
              />
            </div>

            {form.images.length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-soft/50 px-4 py-10 text-center">
                <ImageOff size={24} className="text-muted" />
                <p className="mt-2 text-xs font-medium text-ink">No images yet</p>
                <p className="text-[11px] text-muted">Upload files or add an image URL below.</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {form.images.map((image) => (
                  <div key={image} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-soft">
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain p-1.5"
                        />
                    <button
                      type="button"
                      onClick={() => removeImage(image)}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white transition-opacity hover:bg-danger"
                      aria-label="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                className="field h-10 py-2 text-xs"
                placeholder="https://… or /images/products/…"
              />
              <button type="button" onClick={addImageUrl} className="btn-outline btn-sm shrink-0">
                <Plus size={14} />
                Add
              </button>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-ink">Variants</h2>
                <p className="mt-0.5 text-[11px] text-muted">Storage, color, price, and stock per combination.</p>
              </div>
              <button type="button" onClick={addVariant} className="btn-outline btn-sm">
                <Plus size={14} />
                Add variant
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {variants.map((variant, index) => (
                <div key={variant.id || `new-${index}`} className="rounded-xl border border-line bg-soft/40 p-3.5">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Variant {index + 1}
                      {variant.id ? '' : ' · new'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Remove variant"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                    <div>
                      <label className="label">Storage *</label>
                      <input
                        className="field h-9 py-1.5 text-xs"
                        value={variant.storage}
                        onChange={(event) => updateVariant(index, 'storage', event.target.value)}
                        placeholder="256GB"
                      />
                    </div>
                    <div>
                      <label className="label">Color *</label>
                      <input
                        className="field h-9 py-1.5 text-xs"
                        value={variant.color}
                        onChange={(event) => updateVariant(index, 'color', event.target.value)}
                        placeholder="Black"
                      />
                    </div>
                    <div>
                      <label className="label">Color hex</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={variant.color_hex || '#1c1c1e'}
                          onChange={(event) => updateVariant(index, 'color_hex', event.target.value)}
                          className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-0.5"
                          aria-label="Color swatch"
                        />
                        <input
                          className="field h-9 min-w-0 py-1.5 text-xs"
                          value={variant.color_hex}
                          onChange={(event) => updateVariant(index, 'color_hex', event.target.value)}
                          placeholder="#1c1c1e"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Price (MMK) *</label>
                      <input
                        type="number"
                        min="0"
                        className="field h-9 py-1.5 text-xs"
                        value={variant.price}
                        onChange={(event) => updateVariant(index, 'price', event.target.value)}
                        placeholder="4799000"
                      />
                    </div>
                    <div>
                      <label className="label">Stock</label>
                      <input
                        type="number"
                        min="0"
                        className="field h-9 py-1.5 text-xs"
                        value={variant.stock}
                        onChange={(event) => updateVariant(index, 'stock', event.target.value)}
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label className="label">Image</label>
                      <Select
                        value={variant.image}
                        onChange={(value) => updateVariant(index, 'image', value)}
                        options={[
                          { value: '', label: 'Use default' },
                          ...form.images.map((image, imageIndex) => ({
                            value: image,
                            label: `Image ${imageIndex + 1}`,
                          })),
                        ]}
                        size="xs"
                        aria-label="Variant image"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-3 lg:col-span-6">
                      <label className="label">SKU</label>
                      <input
                        className="field h-9 py-1.5 text-xs"
                        value={variant.sku}
                        onChange={(event) => updateVariant(index, 'sku', event.target.value)}
                        placeholder="Leave blank to generate automatically"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink">Visibility</h2>
            <div className="mt-2 divide-y divide-line">
              <ToggleRow
                label="Active"
                description="Show this product in the storefront."
                checked={form.active}
                onChange={(value) => update('active', value)}
              />
              <ToggleRow
                label="Featured"
                description="Highlight it on the homepage."
                checked={form.featured}
                onChange={(value) => update('featured', value)}
              />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold text-ink">Summary</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-muted">
                <dt>Variants</dt>
                <dd className="font-semibold text-ink">{variants.length}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Total stock</dt>
                <dd className={cn('font-semibold', totalVariantStock > 0 ? 'text-ink' : 'text-danger')}>
                  {totalVariantStock}
                </dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Images</dt>
                <dd className="font-semibold text-ink">{form.images.length}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Status</dt>
                <dd className="font-semibold text-ink">{form.active ? 'Active' : 'Hidden'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-card border border-line bg-soft/60 p-4 text-[11px] leading-relaxed text-muted">
            <p className="font-semibold text-ink">Tips</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              <li>Uploaded images are stored in the product-images bucket.</li>
              <li>Variant combinations must be unique per product.</li>
              <li>Stock is reduced automatically when orders are placed.</li>
              <li>Sold-out variants stay visible with an out-of-stock label.</li>
            </ul>
          </section>

          <button type="submit" disabled={saving || uploading} className="btn-primary w-full">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </aside>
      </div>
    </form>
  )
}
