import { useEffect, useMemo, useState } from 'react'
import { ImageOff, Pencil, Plus, Tags, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useConfirm } from '@/context/ConfirmContext'
import { slugify } from '@/lib/utils'
import Modal from '@/components/common/Modal'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'

const blank = { name: '', slug: '', image: '', sort_order: 0, active: true }

export default function AdminCategories() {
  const confirm = useConfirm()
  const [categories, setCategories] = useState([])
  const [productCounts, setProductCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [slugTouched, setSlugTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [categoryResult, productResult] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('category_id'),
    ])
    if (categoryResult.error) toast.error(categoryResult.error.message)
    setCategories(categoryResult.data || [])
    const counts = {}
    ;(productResult.data || []).forEach((product) => {
      if (product.category_id) counts[product.category_id] = (counts[product.category_id] || 0) + 1
    })
    setProductCounts(counts)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const totalProducts = useMemo(
    () => Object.values(productCounts).reduce((sum, count) => sum + count, 0),
    [productCounts],
  )

  const openNew = () => {
    setEditing(null)
    setForm({ ...blank, sort_order: categories.length + 1 })
    setSlugTouched(false)
    setOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      image: category.image || '',
      sort_order: category.sort_order ?? 0,
      active: category.active !== false,
    })
    setSlugTouched(true)
    setOpen(true)
  }

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const save = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return toast.error('Category name is required')
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      image: form.image.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
    }
    const result = editing
      ? await supabase.from('categories').update(payload).eq('id', editing.id)
      : await supabase.from('categories').insert(payload)
    setSaving(false)
    if (result.error) {
      toast.error(result.error.message)
      return
    }
    toast.success(editing ? 'Category updated' : 'Category created')
    setOpen(false)
    load()
  }

  const toggleActive = async (category) => {
    const { error } = await supabase
      .from('categories')
      .update({ active: !category.active })
      .eq('id', category.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setCategories((current) =>
      current.map((row) => (row.id === category.id ? { ...row, active: !row.active } : row)),
    )
  }

  const remove = async (category) => {
    const confirmed = await confirm({
      title: `Delete “${category.name}”?`,
      description: 'Products in this category will become uncategorised. This cannot be undone.',
      confirmLabel: 'Delete category',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    const { error } = await supabase.from('categories').delete().eq('id', category.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Category deleted')
    load()
  }

  if (loading) return <Loader label="Loading categories…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-muted">
            {categories.length} categories · {totalProducts} assigned products
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary btn-sm">
          <Plus size={15} />
          Add category
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Create categories to organise the storefront navigation."
          action={<button type="button" onClick={openNew} className="btn-primary">Add category</button>}
        />
      ) : (
        <>
          <div className="card divide-y divide-line overflow-hidden md:hidden">
            {categories.map((category) => (
              <div key={category.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-soft">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt=""
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <ImageOff size={16} className="text-muted" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{category.name}</p>
                    <p className="truncate text-[10px] text-muted">/{category.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(category)}
                    className={category.active ? 'badge-success' : 'badge-neutral'}
                  >
                    {category.active ? 'Active' : 'Hidden'}
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                  <p className="text-[11px] text-muted">
                    {productCounts[category.id] || 0} products · order {category.sort_order}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(category)}
                      className="btn-ghost btn-sm"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(category)}
                      className="btn-ghost btn-sm text-danger hover:bg-danger/10"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-xs">
                <thead>
                  <tr className="table-head">
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3 text-center">Products</th>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {categories.map((category) => (
                    <tr key={category.id} className="transition-colors hover:bg-soft/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt=""
                                className="h-full w-full object-contain p-1"
                              />
                            ) : (
                              <ImageOff size={15} className="text-muted" />
                            )}
                          </span>
                          <span className="font-semibold text-ink">{category.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">/{category.slug}</td>
                      <td className="px-4 py-3 text-center font-medium text-ink">
                        {productCounts[category.id] || 0}
                      </td>
                      <td className="px-4 py-3 text-muted">{category.sort_order}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(category)}
                          className={category.active ? 'badge-success' : 'badge-neutral'}
                        >
                          {category.active ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(category)}
                            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft hover:text-ink"
                            aria-label={`Edit ${category.name}`}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(category)}
                            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        description="Categories power the storefront navigation and shop filters."
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="category_name">Name *</label>
            <input
              id="category_name"
              className="field"
              value={form.name}
              onChange={(event) => {
                const value = event.target.value
                update('name', value)
                if (!slugTouched) update('slug', slugify(value))
              }}
              placeholder="iPhone 18"
            />
          </div>
          <div>
            <label className="label" htmlFor="category_slug">Slug *</label>
            <input
              id="category_slug"
              className="field"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true)
                update('slug', event.target.value)
              }}
              placeholder="iphone-18"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="category_image">Image URL</label>
            <input
              id="category_image"
              className="field"
              value={form.image}
              onChange={(event) => update('image', event.target.value)}
              placeholder="/images/products/iphone-18-pro-black.webp"
            />
          </div>
          <div>
            <label className="label" htmlFor="category_sort">Sort order</label>
            <input
              id="category_sort"
              type="number"
              className="field"
              value={form.sort_order}
              onChange={(event) => update('sort_order', event.target.value)}
            />
          </div>
          <label className="flex items-end gap-2 pb-3 text-xs text-muted">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => update('active', event.target.checked)}
              className="h-4 w-4 rounded border-line accent-[var(--color-brand)]"
            />
            Visible in the storefront
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
