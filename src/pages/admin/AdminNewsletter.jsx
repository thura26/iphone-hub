import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Download,
  Mail,
  Search,
  Trash2,
  UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { useConfirm } from '@/context/ConfirmContext'
import { logAudit } from '@/lib/audit'
import { dateStamp, downloadCsv } from '@/lib/csv'
import { formatDate, formatDateTime } from '@/lib/utils'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import StatCard from '@/components/admin/StatCard'

export default function AdminNewsletter() {
  const confirm = useConfirm()
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error(error.message)
    setSubscribers(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return subscribers
    return subscribers.filter((subscriber) =>
      `${subscriber.email} ${subscriber.source}`.toLowerCase().includes(term),
    )
  }, [subscribers, search])

  const stats = useMemo(() => {
    const now = new Date()
    return {
      total: subscribers.length,
      active: subscribers.filter((subscriber) => subscriber.active).length,
      thisMonth: subscribers.filter((subscriber) => {
        const created = new Date(subscriber.created_at)
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        )
      }).length,
    }
  }, [subscribers])

  const toggleActive = async (subscriber) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ active: !subscriber.active })
      .eq('id', subscriber.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setSubscribers((current) =>
      current.map((row) =>
        row.id === subscriber.id ? { ...row, active: !row.active } : row,
      ),
    )
    toast.success(subscriber.active ? 'Subscriber paused' : 'Subscriber reactivated')
    void logAudit({
      action: 'newsletter.status_changed',
      entityType: 'newsletter',
      entityId: subscriber.id,
      details: { email: subscriber.email, active: !subscriber.active },
    })
  }

  const remove = async (subscriber) => {
    const confirmed = await confirm({
      title: `Remove ${subscriber.email}?`,
      description: 'This address will be permanently removed from the newsletter list.',
      confirmLabel: 'Remove subscriber',
      tone: 'danger',
      icon: Trash2,
    })
    if (!confirmed) return
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', subscriber.id)
    if (error) {
      toast.error(error.message)
      return
    }
    setSubscribers((current) => current.filter((row) => row.id !== subscriber.id))
    toast.success('Subscriber removed')
    void logAudit({
      action: 'newsletter.removed',
      entityType: 'newsletter',
      entityId: subscriber.id,
      details: { email: subscriber.email },
    })
  }

  const exportSubscribers = () => {
    if (filtered.length === 0) {
      toast.info('There are no subscribers to export')
      return
    }
    downloadCsv(
      `newsletter-subscribers-${dateStamp()}.csv`,
      [
        { label: 'Email', value: (subscriber) => subscriber.email },
        { label: 'Source', value: (subscriber) => subscriber.source },
        { label: 'Active', value: (subscriber) => (subscriber.active ? 'Yes' : 'No') },
        { label: 'Subscribed at', value: (subscriber) => formatDateTime(subscriber.created_at) },
      ],
      filtered,
    )
    toast.success(`Exported ${filtered.length} subscriber${filtered.length === 1 ? '' : 's'}`)
  }

  if (loading) return <Loader label="Loading newsletter subscribers…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Marketing</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Newsletter</h1>
          <p className="mt-1 text-sm text-muted">
            People who signed up for new launches and exclusive offers.
          </p>
        </div>
        <button type="button" onClick={exportSubscribers} className="btn-outline btn-sm">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Subscribers" value={stats.total} icon={Mail} tone="brand" />
        <StatCard label="Active" value={stats.active} icon={CheckCircle2} tone="success" />
        <StatCard label="New this month" value={stats.thisMonth} icon={UserPlus} />
      </div>

      <div className="card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by email or source…"
            className="field h-10 py-2 pl-9 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={subscribers.length === 0 ? 'No subscribers yet' : 'No subscribers found'}
          description={
            subscribers.length === 0
              ? 'Signups from the storefront footer will appear here.'
              : 'Try a different search term.'
          }
        />
      ) : (
        <>
          <div className="card divide-y divide-line overflow-hidden md:hidden">
            {filtered.map((subscriber) => (
              <div key={subscriber.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{subscriber.email}</p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {subscriber.source} · joined {formatDate(subscriber.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleActive(subscriber)}
                    className={subscriber.active ? 'badge-success' : 'badge-neutral'}
                  >
                    {subscriber.active ? 'Active' : 'Paused'}
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 border-t border-line pt-2.5">
                  <button
                    type="button"
                    onClick={() => remove(subscriber)}
                    className="btn-ghost btn-sm text-danger hover:bg-danger/10"
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="table-head">
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Subscribed</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((subscriber) => (
                    <tr key={subscriber.id} className="transition-colors hover:bg-soft/50">
                      <td className="px-4 py-3 font-medium text-ink">{subscriber.email}</td>
                      <td className="px-4 py-3 capitalize text-muted">{subscriber.source}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(subscriber)}
                          className={subscriber.active ? 'badge-success' : 'badge-neutral'}
                          title={subscriber.active ? 'Pause subscriber' : 'Reactivate subscriber'}
                        >
                          {subscriber.active ? 'Active' : 'Paused'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <p>{formatDate(subscriber.created_at)}</p>
                        <p className="mt-0.5 text-[10px]">{formatDateTime(subscriber.created_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => remove(subscriber)}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                          aria-label={`Remove ${subscriber.email}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
