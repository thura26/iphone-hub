import { useEffect, useState } from 'react'
import { Image, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useConfirm } from '@/context/ConfirmContext'
import Modal from '@/components/common/Modal'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'

const blank = {
  title: '',
  subtitle: '',
  cta_label: 'Shop Now',
  cta_link: '/shop',
  image: '',
  sort_order: 0,
  active: true,
}

export default function AdminBanners() {
  const confirm = useConfirm()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data, error } = await supabase.from('banners').select('*').order('sort_order')
    if (error) toast.error(error.message)
    setBanners(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ ...blank, sort_order: banners.length + 1 })
    setOpen(true)
  }

  const openEdit = (banner) => {
    setEditing(banner)
    setForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      cta_label: banner.cta_label || 'Shop Now',
      cta_link: banner.cta_link || '/shop',
      image: banner.image || '',
      sort_order: banner.sort_order ?? 0,
      active: banner.active !== false,
    })
    setOpen(true)
  }

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const save = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return toast.error('Banner title is required')
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      cta_label: form.cta_label.trim() || 'Shop Now',
      cta_link: form.cta_link.trim() || '/shop',
      image: form.image.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
    }
    const result = editing
      ? await supabase.from('banners').update(payload).eq('id', editing.id)
      : await supabase.from('banners').insert(payload)
    setSaving(false)
    if (result.error) {
      toast.error(result.error.message)
      return
    }
    toast.success(editing ? 'Banner updated' : 'Banner created')
    setOpen(false)
    load()
  }

  const toggleActive = async (banner) => {
    const { error } = await supabase
      .from('banners')
      .update({ active: !banner.active })
      .eq('id', banner.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setBanners((current) =>
      current.map((row) => (row.id === banner.id ? { ...row, active: !row.active } : row)),
    )
  }

  const remove = async (banner) => {
    const confirmed = await confirm({
      title: `Delete the “${banner.title}” banner?`,
      description: 'This banner will disappear from the storefront immediately.',
      confirmLabel: 'Delete banner',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    const { error } = await supabase.from('banners').delete().eq('id', banner.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Banner deleted')
    load()
  }

  if (loading) return <Loader label="Loading banners…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Storefront</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Banners</h1>
          <p className="mt-1 text-sm text-muted">
            The first two active banners appear in the homepage hero.
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary btn-sm">
          <Plus size={15} />
          Add banner
        </button>
      </div>

      {banners.length === 0 ? (
        <EmptyState
          icon={Image}
          title="No banners yet"
          description="Add a hero banner to showcase a launch or promotion."
          action={<button type="button" onClick={openNew} className="btn-primary">Add banner</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => (
            <article key={banner.id} className="card overflow-hidden">
              <div className="relative aspect-[16/9] bg-soft">
                {banner.image ? (
                  <img src={banner.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">
                    <Image size={26} />
                  </div>
                )}
                <span className="absolute left-2.5 top-2.5 rounded-pill bg-black/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">
                  Order {banner.sort_order}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-ink">{banner.title}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{banner.subtitle || 'No subtitle'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(banner)}
                    className={banner.active ? 'badge-success' : 'badge-neutral'}
                  >
                    {banner.active ? 'Live' : 'Hidden'}
                  </button>
                </div>
                <p className="mt-2 truncate text-[10px] text-muted">
                  {banner.cta_label} → {banner.cta_link}
                </p>
                <div className="mt-3 flex justify-end gap-1 border-t border-line pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(banner)}
                    className="btn-ghost btn-sm"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(banner)}
                    className="btn-ghost btn-sm text-danger hover:bg-danger/10"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit banner' : 'New banner'}
        description="Banners are used on the homepage hero and promotions."
      >
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="banner_title">Title *</label>
            <input
              id="banner_title"
              className="field"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              placeholder="iPhone 18 Pro"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="banner_subtitle">Subtitle</label>
            <input
              id="banner_subtitle"
              className="field"
              value={form.subtitle}
              onChange={(event) => update('subtitle', event.target.value)}
              placeholder="Powered by Apple Intelligence."
            />
          </div>
          <div>
            <label className="label" htmlFor="banner_cta">CTA label</label>
            <input
              id="banner_cta"
              className="field"
              value={form.cta_label}
              onChange={(event) => update('cta_label', event.target.value)}
              placeholder="Shop Now"
            />
          </div>
          <div>
            <label className="label" htmlFor="banner_link">CTA link</label>
            <input
              id="banner_link"
              className="field"
              value={form.cta_link}
              onChange={(event) => update('cta_link', event.target.value)}
              placeholder="/product/iphone-18-pro"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="banner_image">Image URL</label>
            <input
              id="banner_image"
              className="field"
              value={form.image}
              onChange={(event) => update('image', event.target.value)}
              placeholder="/images/hero/iphone-18-pro-hero.webp"
            />
          </div>
          {form.image && (
            <div className="sm:col-span-2 overflow-hidden rounded-xl border border-line bg-soft">
              <img src={form.image} alt="Banner preview" className="h-36 w-full object-cover" />
            </div>
          )}
          <div>
            <label className="label" htmlFor="banner_sort">Sort order</label>
            <input
              id="banner_sort"
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
            Show on the homepage
          </label>
          <div className="flex justify-end gap-2 border-t border-line pt-4 sm:col-span-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost btn-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary btn-sm">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create banner'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
