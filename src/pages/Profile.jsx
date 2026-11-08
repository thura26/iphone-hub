import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Camera,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  PackageCheck,
  Pencil,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useConfirm } from '@/context/ConfirmContext'
import Avatar from '@/components/common/Avatar'
import { formatDate, formatMMK } from '@/lib/utils'

export default function Profile() {
  const navigate = useNavigate()
  const { user, profile, isAdmin, displayName, signOut, updateProfile } = useAuth()
  const confirm = useConfirm()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [orders, setOrders] = useState([])
  const avatarInputRef = useRef(null)

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setPhone(profile?.phone || '')
  }, [profile])

  useEffect(() => {
    let active = true
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error(error)
        setOrders(data || [])
      })
    return () => {
      active = false
    }
  }, [])

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!fullName.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setSaving(true)
    const { error } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
    })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Profile updated')
  }

  const removeStoredAvatar = async (url) => {
    const marker = '/storage/v1/object/public/avatars/'
    if (!url?.includes(marker)) return
    const path = decodeURIComponent(url.split(marker)[1]?.split('?')[0] || '')
    if (!path) return
    await supabase.storage.from('avatars').remove([path])
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Choose a JPG, PNG, WebP, or GIF image.')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image must be 3 MB or smaller.')
      return
    }

    setAvatarBusy(true)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/avatar-${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        })
      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path)
      const { error: updateError } = await updateProfile({
        avatar_url: publicData.publicUrl,
      })
      if (updateError) {
        await supabase.storage.from('avatars').remove([path])
        throw updateError
      }

      await removeStoredAvatar(profile?.avatar_url)
      toast.success('Profile photo updated')
    } catch (error) {
      toast.error(error.message || 'Could not update your photo.')
    } finally {
      setAvatarBusy(false)
    }
  }

  const removeAvatar = async () => {
    if (!profile?.avatar_url) return
    const confirmed = await confirm({
      title: 'Remove profile photo?',
      description: 'Your profile will go back to the default avatar. This cannot be undone.',
      confirmLabel: 'Remove photo',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    setAvatarBusy(true)
    try {
      const currentAvatar = profile.avatar_url
      const { error } = await updateProfile({ avatar_url: null })
      if (error) throw error
      await removeStoredAvatar(currentAvatar)
      toast.success('Profile photo removed')
    } catch (error) {
      toast.error(error.message || 'Could not remove your photo.')
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleSignOut = async () => {
    const confirmed = await confirm({
      title: 'Sign out of iPhone Hub?',
      description: 'You will need to sign in again to see your orders, wishlist, and saved addresses.',
      confirmLabel: 'Sign out',
      tone: 'neutral',
      icon: LogOut,
    })
    if (!confirmed) return
    await signOut()
    toast.success('Signed out')
    navigate('/')
  }

  const totalSpent = orders
    .filter((order) => order.status !== 'cancelled')
    .reduce((sum, order) => sum + Number(order.total_amount), 0)

  return (
    <div className="wrap py-6 sm:py-9">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">Profile</h1>
        </div>
        <button type="button" onClick={handleSignOut} className="btn-outline btn-sm text-danger">
          <LogOut size={14} />
          Sign out
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <Avatar
                  src={profile?.avatar_url}
                  alt={displayName}
                  size="lg"
                  className="h-[72px] w-[72px]"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarBusy}
                  className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-ink text-surface shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
                  aria-label="Change profile photo"
                  title="Change profile photo"
                >
                  {avatarBusy ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Camera size={13} />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-xl font-bold tracking-tight text-ink">{displayName}</h2>
                  {isAdmin && <span className="badge-brand">Admin</span>}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted">{user?.email}</p>
                <p className="mt-0.5 text-xs text-muted">
                  Member since {formatDate(profile?.created_at || user?.created_at)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarBusy}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand transition-opacity hover:opacity-80 disabled:opacity-60"
                  >
                    <Camera size={12} />
                    {profile?.avatar_url ? 'Change photo' : 'Upload photo'}
                  </button>
                  {profile?.avatar_url && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      disabled={avatarBusy}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition-colors hover:text-danger disabled:opacity-60"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={saveProfile} className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="profile_name">Full name</label>
                <input
                  id="profile_name"
                  className="field"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="label" htmlFor="profile_phone">Phone</label>
                <input
                  id="profile_phone"
                  className="field"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+95 9 000 000 000"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="profile_email">Email</label>
                <input
                  id="profile_email"
                  className="field bg-soft text-muted"
                  value={user?.email || ''}
                  disabled
                />
              </div>
              <div className="flex items-center justify-between gap-3 sm:col-span-2">
                <Link to="/auth?mode=reset" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand">
                  <ShieldCheck size={14} />
                  Change password
                </Link>
                <button type="submit" disabled={saving} className="btn-primary btn-sm">
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Orders', value: orders.length, icon: PackageCheck },
              { label: 'Total spent', value: formatMMK(totalSpent), icon: Wallet },
              { label: 'Loyalty', value: orders.length >= 3 ? 'Gold' : 'Member', icon: Heart },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card p-4">
                <Icon size={17} className="text-brand" />
                <p className="mt-3 text-lg font-bold tracking-tight text-ink">{value}</p>
                <p className="text-xs text-muted">{label}</p>
              </div>
            ))}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Recent activity</h2>
            {orders.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">
                No orders yet.{' '}
                <Link to="/shop" className="font-semibold text-brand">Start shopping</Link>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {orders.slice(0, 3).map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Order {order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-muted">
                        {formatDate(order.created_at)} · {order.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink">{formatMMK(order.total_amount)}</span>
                      <Link to={`/orders/${order.id}`} className="text-xs font-semibold text-brand">View</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-3">
          <div className="card overflow-hidden">
            {[
              { to: '/orders', label: 'My orders', description: 'Track and manage orders', icon: ShoppingBag },
              { to: '/profile/addresses', label: 'Saved addresses', description: 'Delivery details', icon: MapPin },
              { to: '/wishlist', label: 'Wishlist', description: 'Products you love', icon: Heart },
              ...(isAdmin
                ? [{ to: '/admin', label: 'Admin dashboard', description: 'Manage the store', icon: LayoutDashboard }]
                : []),
            ].map(({ to, label, description, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 border-b border-line px-4 py-3.5 transition-colors last:border-0 hover:bg-soft"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-soft text-ink">
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{label}</span>
                  <span className="block text-[11px] text-muted">{description}</span>
                </span>
                <ArrowRight size={14} className="text-muted" />
              </Link>
            ))}
          </div>

          <div className="rounded-card border border-line bg-soft/60 p-4 text-[11px] leading-relaxed text-muted">
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <Pencil size={13} />
              Need to update something?
            </p>
            <p className="mt-1.5">
              You can change your name, phone number, and password here. For email changes,
              contact support.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
