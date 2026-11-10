import { useEffect, useMemo, useState } from 'react'
import { Check, MessageSquare, Search, Star, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useConfirm } from '@/context/ConfirmContext'
import { cn, formatDateTime, initials } from '@/lib/utils'
import RatingStars from '@/components/common/RatingStars'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import StatCard from '@/components/admin/StatCard'

const tabs = [
  { id: 'all', label: 'All reviews' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
]

export default function AdminReviews() {
  const confirm = useConfirm()
  const [reviews, setReviews] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    const [reviewResult, profileResult] = await Promise.all([
      supabase
        .from('reviews')
        .select('*, products(id,name,slug,images)')
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,full_name,email'),
    ])
    if (reviewResult.error) toast.error(reviewResult.error.message)
    if (profileResult.error) console.error(profileResult.error)
    setReviews(reviewResult.data || [])
    setProfiles(profileResult.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  )

  const counts = useMemo(
    () => ({
      all: reviews.length,
      pending: reviews.filter((review) => !review.approved).length,
      approved: reviews.filter((review) => review.approved).length,
    }),
    [reviews],
  )

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '0.0'
    return (
      reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
    ).toFixed(1)
  }, [reviews])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return reviews.filter((review) => {
      if (tab === 'pending' && review.approved) return false
      if (tab === 'approved' && !review.approved) return false
      if (!term) return true
      const customer = profileMap.get(review.user_id)
      return `${review.products?.name || ''} ${review.comment || ''} ${customer?.full_name || ''} ${customer?.email || ''}`
        .toLowerCase()
        .includes(term)
    })
  }, [reviews, tab, search, profileMap])

  const setApproved = async (review, approved) => {
    setBusyId(review.id)
    const { error } = await supabase
      .from('reviews')
      .update({ approved })
      .eq('id', review.id)
    setBusyId(null)
    if (error) {
      toast.error(error.message)
      return
    }
    setReviews((current) =>
      current.map((row) => (row.id === review.id ? { ...row, approved } : row)),
    )
    toast.success(approved ? 'Review approved and published' : 'Review hidden from the storefront')
  }

  const remove = async (review) => {
    const confirmed = await confirm({
      title: 'Delete this review permanently?',
      description: 'The review and its rating contribution will be removed from the product page.',
      confirmLabel: 'Delete review',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    setBusyId(review.id)
    const { error } = await supabase.from('reviews').delete().eq('id', review.id)
    setBusyId(null)
    if (error) {
      toast.error(error.message)
      return
    }
    setReviews((current) => current.filter((row) => row.id !== review.id))
    toast.success('Review deleted')
  }

  if (loading) return <Loader label="Loading reviews…" />

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Feedback</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Reviews</h1>
        <p className="mt-1 text-sm text-muted">
          Approve customer reviews before they appear on product pages. Approving updates each
          product&apos;s rating automatically.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending approval" value={counts.pending} icon={MessageSquare} tone="warning" />
        <StatCard label="Approved" value={counts.approved} icon={Check} tone="success" />
        <StatCard label="Average rating" value={averageRating} icon={Star} tone="brand" hint="Across all reviews" />
      </div>

      <div className="card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product, customer, or comment…"
              className="field h-10 py-2 pl-9 text-xs"
            />
          </div>
          <span className="text-xs text-muted">{filtered.length} shown</span>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'shrink-0 rounded-pill border px-3 py-1.5 text-[11px] font-semibold transition-colors',
                tab === item.id
                  ? 'border-ink bg-ink text-surface'
                  : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {item.label}
              <span className={cn('ml-1.5 text-[10px]', tab === item.id ? 'text-surface/60' : 'text-muted')}>
                {counts[item.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={tab === 'pending' ? 'No reviews waiting for approval' : 'No reviews found'}
          description={
            tab === 'pending'
              ? 'New customer reviews will appear here for moderation.'
              : 'Adjust the filter or search term to see more reviews.'
          }
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {filtered.map((review) => {
            const customer = profileMap.get(review.user_id)
            const customerName = customer?.full_name || customer?.email || 'Customer'
            const productImage = review.products?.images?.[0]
            return (
              <article
                key={review.id}
                className={cn(
                  'card p-4',
                  !review.approved && 'border-warning/30 bg-warning/[0.02]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-surface">
                      {initials(customerName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink">{customerName}</p>
                      <p className="text-[10px] text-muted">{formatDateTime(review.created_at)}</p>
                    </div>
                  </div>
                  <span className={review.approved ? 'badge-success' : 'badge-warning'}>
                    {review.approved ? 'Approved' : 'Pending'}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {productImage ? (
                    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-soft">
                      <img
                        src={productImage}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-0.5"
                      />
                    </span>
                  ) : (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-soft text-muted">
                      <MessageSquare size={14} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">
                      {review.products?.name || 'Deleted product'}
                    </p>
                    <RatingStars rating={review.rating} size={11} showValue />
                  </div>
                </div>

                <p className="mt-3 rounded-lg bg-soft/70 px-3 py-2.5 text-xs leading-relaxed text-muted">
                  {review.comment || 'No comment provided.'}
                </p>

                <div className="mt-3 flex items-center justify-end gap-2 border-t border-line pt-3">
                  {review.approved ? (
                    <button
                      type="button"
                      onClick={() => setApproved(review, false)}
                      disabled={busyId === review.id}
                      className="btn-outline btn-sm"
                    >
                      <X size={13} />
                      Unapprove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setApproved(review, true)}
                      disabled={busyId === review.id}
                      className="btn-primary btn-sm"
                    >
                      <Check size={13} />
                      {busyId === review.id ? 'Saving…' : 'Approve'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(review)}
                    disabled={busyId === review.id}
                    className="btn-ghost btn-sm text-danger hover:bg-danger/10"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
