import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, UserPlus, Users, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/supabaseClient'
import { formatDate, formatMMK, initials } from '@/lib/utils'
import StatCard from '@/components/admin/StatCard'
import Loader from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'

export default function AdminCustomers() {
  const [profiles, setProfiles] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('id, user_id, total_amount, status, created_at'),
    ])
      .then(([profileResult, orderResult]) => {
        if (!active) return
        if (profileResult.error) toast.error(profileResult.error.message)
        if (orderResult.error) console.error(orderResult.error)
        setProfiles(profileResult.data || [])
        setOrders(orderResult.data || [])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const customers = useMemo(() => {
    const orderMap = new Map()
    orders
      .filter((order) => order.status !== 'cancelled')
      .forEach((order) => {
        const current = orderMap.get(order.user_id) || { count: 0, spent: 0 }
        current.count += 1
        current.spent += Number(order.total_amount)
        orderMap.set(order.user_id, current)
      })
    return profiles.map((profile) => ({
      ...profile,
      orderCount: orderMap.get(profile.id)?.count || 0,
      spent: orderMap.get(profile.id)?.spent || 0,
    }))
  }, [profiles, orders])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return customers
    return customers.filter((customer) =>
      `${customer.full_name || ''} ${customer.email || ''} ${customer.phone || ''}`
        .toLowerCase()
        .includes(term),
    )
  }, [customers, search])

  if (loading) return <Loader label="Loading customers…" />

  const customerCount = profiles.filter((profile) => profile.role === 'customer').length
  const adminCount = profiles.filter((profile) => profile.role === 'admin').length
  const newThisMonth = profiles.filter((profile) => {
    const created = new Date(profile.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  }).length
  const totalSpent = customers.reduce((sum, customer) => sum + customer.spent, 0)

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">People</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Customers</h1>
        <p className="mt-1 text-sm text-muted">Accounts registered on iPhone Hub.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={customerCount} icon={Users} tone="brand" />
        <StatCard label="Admins" value={adminCount} icon={ShieldCheck} />
        <StatCard label="New this month" value={newThisMonth} icon={UserPlus} tone="success" />
        <StatCard label="Customer spend" value={formatMMK(totalSpent)} icon={Wallet} tone="success" />
      </div>

      <div className="card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or phone…"
            className="field h-10 py-2 pl-9 text-xs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Try a different search term." />
      ) : (
        <>
          <div className="card divide-y divide-line overflow-hidden md:hidden">
            {filtered.map((customer) => (
              <div key={customer.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-surface">
                    {initials(customer.full_name || customer.email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {customer.full_name || 'Unnamed customer'}
                    </p>
                    <p className="truncate text-[11px] text-muted">{customer.email}</p>
                  </div>
                  <span className={customer.role === 'admin' ? 'badge-brand' : 'badge-neutral'}>
                    {customer.role}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-soft/60 px-3 py-2.5 text-[11px]">
                  <div>
                    <dt className="text-muted">Phone</dt>
                    <dd className="mt-0.5 truncate font-medium text-ink">
                      {customer.phone || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Joined</dt>
                    <dd className="mt-0.5 font-medium text-ink">
                      {formatDate(customer.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted">Orders</dt>
                    <dd className="mt-0.5 font-medium text-ink">{customer.orderCount}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Total spent</dt>
                    <dd className="mt-0.5 font-semibold text-ink">
                      {formatMMK(customer.spent)}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>

          <div className="card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="table-head">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-center">Orders</th>
                    <th className="px-4 py-3 text-right">Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((customer) => (
                    <tr key={customer.id} className="transition-colors hover:bg-soft/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-[10px] font-bold text-surface">
                            {initials(customer.full_name || customer.email)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-ink">
                              {customer.full_name || 'Unnamed customer'}
                            </p>
                            <p className="truncate text-[10px] text-muted">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">{customer.phone || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={customer.role === 'admin' ? 'badge-brand' : 'badge-neutral'}
                        >
                          {customer.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(customer.created_at)}</td>
                      <td className="px-4 py-3 text-center font-medium text-ink">
                        {customer.orderCount}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-ink">
                        {formatMMK(customer.spent)}
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
