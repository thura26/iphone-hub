import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-soft text-muted">
        <Compass className="h-8 w-8" />
      </span>
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-muted">
        The page you are looking for may have moved or no longer exists.
      </p>
      <Link to="/" className="btn-primary mt-7">Back to home</Link>
    </div>
  )
}
