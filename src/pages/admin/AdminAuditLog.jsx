import { useEffect, useMemo, useState } from 'react'
import { Download, ScrollText, Search } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import useRealtime from '@/hooks/useRealtime'
import { dateStamp, downloadCsv } from '@/lib/csv'
import { formatDateTime, initials } from '@/lib/utils'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Select from '@/components/common/Select'

const entityTypes = [
  { value: 'all', label: 'All activity' },
  { value: 'product', label: 'Products' },
  { value: 'order', label: 'Orders' },
  { value: 'return_request', label: 'Returns' },
  { value: 'coupon', label: 'Coupons' },
  { value: 'category', label: 'Categories' },
  { value: 'banner', label: 'Banners' },
  { value: 'review', label: 'Reviews' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'settings', label: 'Settings' },
]

function humanizeAction(action = '') {
  const text = action.replace(/[._]/g, ' ').trim()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function detailPairs(details) {
  if (!details || typeof details !== 'object') return []
  return Object.entries(details)
    .filter(([, value]) => value != null && value !== '' && typeof value !== 'object')
    .slice(0, 4)
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entity, setEntity] = useState('all')

  const load = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) toast.error(error.message)
    setLogs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtime({ table: 'audit_logs', onChange: load })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return logs.filter((log) => {
      if (entity !== 'all' && log.entity_type !== entity) return false
      if (!term) return true
      const detailText = JSON.stringify(log.details || {})
      return `${log.actor_name || ''} ${log.actor_email || ''} ${log.action} ${
        log.entity_type
      } ${log.entity_id || ''} ${detailText}`
        .toLowerCase()
        .includes(term)
    })
  }, [logs, search, entity])

  const exportLogs = () => {
    if (filtered.length === 0) {
      toast.info('There is no activity to export')
      return
    }
    downloadCsv(
      `audit-log-${dateStamp()}.csv`,
      [
        { label: 'Timestamp', value: (log) => formatDateTime(log.created_at) },
        { label: 'Admin', value: (log) => log.actor_name || '' },
        { label: 'Email', value: (log) => log.actor_email || '' },
        { label: 'Action', value: (log) => log.action },
        { label: 'Entity type', value: (log) => log.entity_type },
        { label: 'Entity ID', value: (log) => log.entity_id || '' },
        { label: 'Details', value: (log) => JSON.stringify(log.details || {}) },
      ],
      filtered,
    )
    toast.success(`Exported ${filtered.length} activit${filtered.length === 1 ? 'y' : 'ies'}`)
  }

  if (loading) return <Loader label="Loading audit log…" />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Accountability</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Audit log</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            Every admin change, in one place. Showing the latest {logs.length} events.
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Live
            </span>
          </p>
        </div>
        <button type="button" onClick={exportLogs} className="btn-outline btn-sm">
          <Download size={14} />
          Export CSV
        </button>
      </div>

      <div className="card p-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search admin, action, or details…"
              className="field h-10 py-2 pl-9 text-xs"
            />
          </div>
          <Select
            value={entity}
            onChange={setEntity}
            options={entityTypes}
            size="xs"
            className="h-10 w-auto"
            aria-label="Filter by entity type"
          />
          <span className="text-xs text-muted">{filtered.length} shown</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No activity found"
          description={
            logs.length === 0
              ? 'Admin actions will be recorded here automatically.'
              : 'Try a different search or activity filter.'
          }
        />
      ) : (
        <>
          <div className="card divide-y divide-line overflow-hidden md:hidden">
            {filtered.map((log) => (
              <article key={log.id} className="p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-soft text-[10px] font-bold text-ink">
                    {initials(log.actor_name || log.actor_email || 'Admin')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">{humanizeAction(log.action)}</p>
                    <p className="mt-0.5 truncate text-[10px] text-muted">
                      {log.actor_name || 'Admin'} · {formatDateTime(log.created_at)}
                    </p>
                  </div>
                  <span className="badge-neutral shrink-0">{log.entity_type}</span>
                </div>
                {detailPairs(log.details).length > 0 && (
                  <dl className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-lg bg-soft/70 px-3 py-2 text-[10px]">
                    {detailPairs(log.details).map(([key, value]) => (
                      <div key={key} className="min-w-0">
                        <dt className="capitalize text-muted">{key.replace(/_/g, ' ')}</dt>
                        <dd className="truncate font-medium text-ink">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </article>
            ))}
          </div>

          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-xs">
                <thead>
                  <tr className="table-head">
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3 text-right">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-soft/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft text-[9px] font-bold text-ink">
                            {initials(log.actor_name || log.actor_email || 'Admin')}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">
                              {log.actor_name || 'Admin'}
                            </p>
                            <p className="truncate text-[10px] text-muted">{log.actor_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{humanizeAction(log.action)}</p>
                        <p className="mt-0.5 font-mono text-[9px] text-muted">{log.action}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge-neutral">{log.entity_type}</span>
                        {log.entity_id && (
                          <p className="mt-1 max-w-[150px] truncate font-mono text-[9px] text-muted">
                            {log.entity_id}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {detailPairs(log.details).length === 0 ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <div className="flex max-w-[280px] flex-wrap gap-1">
                            {detailPairs(log.details).map(([key, value]) => (
                              <span
                                key={key}
                                className="rounded bg-soft px-1.5 py-0.5 text-[9px] text-muted"
                                title={`${key}: ${String(value)}`}
                              >
                                <span className="capitalize">{key.replace(/_/g, ' ')}</span>:{' '}
                                <span className="font-medium text-ink">{String(value)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted">
                        {formatDateTime(log.created_at)}
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
