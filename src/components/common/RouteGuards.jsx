import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Loader from '@/components/common/Loader'
import { useAuth } from '@/context/AuthContext'
import { Link } from 'react-router-dom'

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader full label="Checking your account…" />
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?mode=login&redirect=${redirect}`} replace />
  }
  return children ?? <Outlet />
}

export function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) return <Loader full label="Checking permissions…" />
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?mode=login&redirect=${redirect}`} replace />
  }
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="card max-w-md p-8 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-danger/10 text-danger">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h1 className="text-xl font-bold text-ink">Admin access required</h1>
          <p className="mt-2 text-sm text-muted">
            This area is restricted. Sign in with an administrator account to continue.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/" className="btn-outline">Back to store</Link>
            <Link to="/auth?mode=login" className="btn-primary">Sign in</Link>
          </div>
        </div>
      </div>
    )
  }
  return children ?? <Outlet />
}
