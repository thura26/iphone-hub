import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  ImageOff,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useConfirm } from '@/context/ConfirmContext'
import { logAudit } from '@/lib/audit'
import { cn, formatMMK } from '@/lib/utils'
import { totalStock } from '@/lib/api'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Select from '@/components/common/Select'

export default function AdminProducts() {
  const confirm = useConfirm()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)

  const load = async () => {
    const [productResult, categoryResult] = await Promise.all([
      supabase
        .from('products')
        .select('*, categories(id,name,slug), product_variants(*)')
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
    ])
    if (productResult.error) toast.error(productResult.error.message)
    if (categoryResult.error) console.error(categoryResult.error)
    setProducts(productResult.data || [])
    setCategories(categoryResult.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((product) => {
      if (category !== 'all' && product.category_id !== category) return false
      if (!term) return true
      return `${product.name} ${product.slug}`.toLowerCase().includes(term)
    })
  }, [products, search, category])

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((product) => selected.has(product.id))

  const toggleSelected = (id) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        filtered.forEach((product) => next.delete(product.id))
      } else {
        filtered.forEach((product) => next.add(product.id))
      }
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const toggleField = async (product, field) => {
    const { error } = await supabase
      .from('products')
      .update({ [field]: !product[field] })
      .eq('id', product.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setProducts((current) =>
      current.map((row) => (row.id === product.id ? { ...row, [field]: !product[field] } : row)),
    )
    void logAudit({
      action: `product.${field}_toggled`,
      entityType: 'product',
      entityId: product.id,
      details: { name: product.name, [field]: !product[field] },
    })
  }

  const remove = async (product) => {
    const confirmed = await confirm({
      title: `Delete “${product.name}”?`,
      description: 'This also deletes all of its variants. Orders that already contain it are not affected.',
      confirmLabel: 'Delete product',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Product deleted')
    void logAudit({
      action: 'product.deleted',
      entityType: 'product',
      entityId: product.id,
      details: { name: product.name, slug: product.slug },
    })
    setProducts((current) => current.filter((row) => row.id !== product.id))
    setSelected((current) => {
      const next = new Set(current)
      next.delete(product.id)
      return next
    })
  }

  const bulkUpdate = async (patch, label, action, details = {}) => {
    if (selected.size === 0) return
    const ids = [...selected]
    setBulkBusy(true)
    const { error } = await supabase.from('products').update(patch).in('id', ids)
    setBulkBusy(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setProducts((current) =>
      current.map((product) => (selected.has(product.id) ? { ...product, ...patch } : product)),
    )
    toast.success(
      `${ids.length} product${ids.length === 1 ? '' : 's'} ${label}`,
    )
    void logAudit({
      action,
      entityType: 'product',
      details: { ids, count: ids.length, ...details },
    })
    clearSelection()
  }

  const applyBulkCategory = () => {
    if (!bulkCategory) return
    const target = categories.find((item) => item.id === bulkCategory)
    void bulkUpdate(
      { category_id: bulkCategory },
      `moved to ${target?.name || 'the selected category'}`,
      'product.bulk_category_changed',
      { category_id: bulkCategory, category_name: target?.name || null },
    )
    setBulkCategory('')
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    const ids = [...selected]
    const confirmed = await confirm({
      title: `Delete ${ids.length} product${ids.length === 1 ? '' : 's'}?`,
      description:
        'All selected products and their variants will be permanently deleted. Existing orders are not affected.',
      confirmLabel: `Delete ${ids.length} product${ids.length === 1 ? '' : 's'}`,
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    setBulkBusy(true)
    const { error } = await supabase.from('products').delete().in('id', ids)
    setBulkBusy(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(`${ids.length} product${ids.length === 1 ? '' : 's'} deleted`)
    void logAudit({
      action: 'product.bulk_deleted',
      entityType: 'product',
      details: { ids, count: ids.length },
    })
    setProducts((current) => current.filter((product) => !selected.has(product.id)))
    clearSelection()
  }

  if (loading) return <Loader label="Loading products…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} products · {products.reduce((sum, product) => sum + (product.product_variants?.length || 0), 0)} variants
          </p>
        </div>
        <Link to="/admin/products/new" className="btn-primary btn-sm">
          <Plus size={15} />
          Add product
        </Link>
      </div>

      <div className="card p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products…"
              className="field h-10 py-2 pl-9 text-xs"
            />
          </div>
          <Select
            value={category}
            onChange={setCategory}
            options={[
              { value: 'all', label: 'All categories' },
              ...categories.map((item) => ({ value: item.id, label: item.name })),
            ]}
            size="xs"
            className="h-10 w-auto"
            aria-label="Filter by category"
          />
          <span className="ml-auto text-xs text-muted">{filtered.length} shown</span>
          <label className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-line accent-[var(--color-brand)]"
            />
            Select all
          </label>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="card flex flex-wrap items-center gap-2 border-brand/30 bg-brand/[0.03] p-3">
          <span className="text-xs font-bold text-ink">
            {selected.size} selected
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="text-[11px] font-semibold text-muted hover:text-ink"
          >
            Clear
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulkUpdate({ active: true }, 'activated', 'product.bulk_activated')}
              className="btn-outline btn-sm"
            >
              Activate
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulkUpdate({ active: false }, 'hidden', 'product.bulk_hidden')}
              className="btn-outline btn-sm"
            >
              Hide
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulkUpdate({ featured: true }, 'featured', 'product.bulk_featured')}
              className="btn-outline btn-sm"
            >
              Feature
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => bulkUpdate({ featured: false }, 'unfeatured', 'product.bulk_unfeatured')}
              className="btn-outline btn-sm"
            >
              Unfeature
            </button>
            <Select
              value={bulkCategory}
              onChange={setBulkCategory}
              options={[
                { value: '', label: 'Move to category…' },
                ...categories.map((item) => ({ value: item.id, label: item.name })),
              ]}
              size="sm"
              className="w-44"
              aria-label="Bulk move to category"
            />
            <button
              type="button"
              disabled={!bulkCategory || bulkBusy}
              onClick={applyBulkCategory}
              className="btn-primary btn-sm"
            >
              Apply
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={bulkDelete}
              className="btn-danger btn-sm"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageOff}
          title="No products found"
          description="Adjust your search or add a new product to the catalog."
          action={<Link to="/admin/products/new" className="btn-primary">Add product</Link>}
        />
      ) : (
        <>
          <div className="card divide-y divide-line overflow-hidden md:hidden">
            {filtered.map((product) => {
              const image = product.images?.[0] || product.product_variants?.[0]?.image
              const stock = totalStock(product)
              return (
                <div key={product.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelected(product.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-line accent-[var(--color-brand)]"
                      aria-label={`Select ${product.name}`}
                    />
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-soft">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <ImageOff size={18} className="text-muted" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
                          <p className="truncate text-[10px] text-muted">
                            {product.categories?.name || 'Uncategorised'} · /{product.slug}
                          </p>
                        </div>
                        <span
                          className={
                            stock === 0
                              ? 'badge-danger'
                              : stock <= 10
                                ? 'badge-warning'
                                : 'badge-success'
                          }
                        >
                          {stock} in stock
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-ink">
                          {formatMMK(product.base_price)}
                        </p>
                        <p className="text-[10px] text-muted">
                          {product.product_variants?.length || 0} variants
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleField(product, 'active')}
                          className={product.active ? 'badge-success' : 'badge-neutral'}
                        >
                          {product.active ? 'Active' : 'Hidden'}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleField(product, 'featured')}
                          className={product.featured ? 'badge-brand' : 'badge-neutral'}
                        >
                          <Star size={9} fill={product.featured ? 'currentColor' : 'none'} />
                          {product.featured ? 'Featured' : 'Standard'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-1 border-t border-line pt-2.5">
                    <Link
                      to={`/product/${product.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost btn-sm"
                    >
                      <ExternalLink size={13} />
                      View
                    </Link>
                    <Link to={`/admin/products/${product.id}/edit`} className="btn-ghost btn-sm">
                      <Pencil size={13} />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(product)}
                      className="btn-ghost btn-sm text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-xs">
                <thead>
                  <tr className="table-head">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-line accent-[var(--color-brand)]"
                        aria-label="Select all visible products"
                      />
                    </th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Variants</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((product) => {
                    const image = product.images?.[0] || product.product_variants?.[0]?.image
                    const stock = totalStock(product)
                    return (
                      <tr
                        key={product.id}
                        className={cn(
                          'transition-colors hover:bg-soft/50',
                          selected.has(product.id) && 'bg-brand/[0.04]',
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selected.has(product.id)}
                            onChange={() => toggleSelected(product.id)}
                            className="h-4 w-4 rounded border-line accent-[var(--color-brand)]"
                            aria-label={`Select ${product.name}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
                              {image ? (
                                <img
                                  src={image}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <ImageOff size={16} className="text-muted" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-ink">
                                {product.name}
                              </p>
                              <p className="truncate text-[10px] text-muted">/{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {product.categories?.name || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-ink">
                          {formatMMK(product.base_price)}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {product.product_variants?.length || 0}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              stock === 0
                                ? 'badge-danger'
                                : stock <= 10
                                  ? 'badge-warning'
                                  : 'badge-success'
                            }
                          >
                            {stock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleField(product, 'active')}
                              className={product.active ? 'badge-success' : 'badge-neutral'}
                              title="Toggle visibility"
                            >
                              {product.active ? 'Active' : 'Hidden'}
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleField(product, 'featured')}
                              className={product.featured ? 'badge-brand' : 'badge-neutral'}
                              title="Toggle featured"
                            >
                              <Star
                                size={9}
                                fill={product.featured ? 'currentColor' : 'none'}
                              />
                              {product.featured ? 'Featured' : 'Standard'}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              to={`/product/${product.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink"
                              aria-label={`View ${product.name}`}
                            >
                              <ExternalLink size={14} />
                            </Link>
                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink"
                              aria-label={`Edit ${product.name}`}
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              type="button"
                              onClick={() => remove(product)}
                              className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
