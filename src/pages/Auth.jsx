import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/common/Logo'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

function Field({ label, icon: Icon, ...props }) {
  return (
    <div>
      <label className="label" htmlFor={props.id}>{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        )}
        <input className={cn('field', Icon && 'pl-10')} {...props} />
      </div>
    </div>
  )
}

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'login'
  const navigate = useNavigate()
  const { user, signIn, signUp, resetPassword, updatePassword, loading } = useAuth()

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  useEffect(() => {
    document.title = mode === 'signup' ? 'Create account — iPhone Hub' : 'Sign in — iPhone Hub'
  }, [mode])

  useEffect(() => {
    if (loading) return
    if (user && !(mode === 'reset' && !sentTo)) {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, mode])

  const update = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  const switchMode = (nextMode) => {
    const next = new URLSearchParams(searchParams)
    next.set('mode', nextMode)
    setSearchParams(next)
    setError('')
    setSentTo('')
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.email.trim() || !form.password) {
      setError('Enter your email and password.')
      return
    }
    setSubmitting(true)
    const { error: signInError } = await signIn(form.email.trim(), form.password)
    setSubmitting(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    toast.success('Welcome back!')
    navigate('/', { replace: true })
  }

  const handleSignup = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    const { data, error: signUpError } = await signUp({
      email: form.email.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
    })
    setSubmitting(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    if (data?.session) {
      toast.success('Account created. Welcome to iPhone Hub!')
      navigate('/', { replace: true })
      return
    }
    setSentTo(form.email.trim())
    toast.success('Account created. Check your email to confirm your address.')
  }

  const handleResetRequest = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.email.trim()) {
      setError('Enter the email address for your account.')
      return
    }
    setSubmitting(true)
    const { error: resetError } = await resetPassword(form.email.trim())
    setSubmitting(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setSentTo(form.email.trim())
    toast.success('Password reset link sent. Check your inbox.')
  }

  const handlePasswordUpdate = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    const { error: updateError } = await updatePassword(form.password)
    setSubmitting(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    toast.success('Password updated. You are signed in.')
    navigate('/', { replace: true })
  }

  const fillDemo = (account) => {
    update('email', account.email)
    update('password', account.password)
    switchMode('login')
  }

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#050506] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand/25 blur-[120px]" />
        <div className="relative z-10">
          <Logo light />
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            iPhone Hub
          </p>
          <h1 className="mt-3 max-w-md text-balance text-5xl font-bold leading-[1.05] tracking-tight">
            Your next iPhone is one sign-in away.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            Save your wishlist, track every delivery, and check out faster with a saved address.
          </p>
          <div className="mt-8 flex items-center gap-5 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Secure auth</span>
            <span className="inline-flex items-center gap-1.5"><Lock size={14} /> Private by default</span>
          </div>
        </div>
        <img
          src="/images/products/iphone-18-pro-burgundy.webp"
          alt="iPhone 18 Pro"
          className="pointer-events-none absolute -bottom-10 -right-16 h-[70%] w-auto rotate-6 object-contain opacity-90"
        />
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:px-10">
          <div className="lg:hidden">
            <Logo />
          </div>
          <Link to="/" className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink">
            <ArrowLeft size={14} />
            Back to store
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 pt-4">
          <div className="w-full max-w-md">
            <div className="mb-7">
              <p className="eyebrow">
                {mode === 'signup' ? 'Join iPhone Hub' : mode === 'reset' ? 'Account recovery' : 'Welcome back'}
              </p>
              <h2 className="mt-1.5 text-3xl font-bold tracking-tight text-ink">
                {mode === 'signup'
                  ? 'Create your account'
                  : mode === 'reset'
                    ? sentTo
                      ? 'Check your email'
                      : user
                        ? 'Set a new password'
                        : 'Reset your password'
                    : 'Sign in to iPhone Hub'}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {mode === 'signup'
                  ? 'One account for orders, wishlists, and fast checkout.'
                  : mode === 'reset'
                    ? sentTo
                      ? `We sent a recovery link to ${sentTo}. Open it on this device to continue.`
                      : user
                        ? 'Choose a strong password you have not used before.'
                        : 'Enter your account email and we will send a recovery link.'
                    : 'Track orders, save favourites, and check out in seconds.'}
              </p>
            </div>

            {sentTo && mode === 'signup' && (
              <div className="rounded-card border border-success/20 bg-success/5 p-5 text-sm text-muted">
                <p className="flex items-center gap-2 font-semibold text-success">
                  <Mail size={16} />
                  Confirm your email
                </p>
                <p className="mt-2 leading-relaxed">
                  We sent a confirmation link to <span className="font-semibold text-ink">{sentTo}</span>.
                  Click the link to activate your account, then sign in.
                </p>
                <button type="button" onClick={() => switchMode('login')} className="btn-primary btn-sm mt-4">
                  Back to sign in
                </button>
              </div>
            )}

            {sentTo && mode === 'reset' && !user && (
              <div className="rounded-card border border-line bg-surface p-5 text-sm text-muted">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <Mail size={16} />
                  Recovery email sent
                </p>
                <p className="mt-2 leading-relaxed">
                  Open the link in your inbox to set a new password. If it does not arrive in a few
                  minutes, check spam or try again.
                </p>
                <button type="button" onClick={() => setSentTo('')} className="btn-outline btn-sm mt-4">
                  Send again
                </button>
              </div>
            )}

            {mode === 'login' && !sentTo && (
              <form onSubmit={handleLogin} className="space-y-4">
                <Field
                  id="login_email"
                  label="Email address"
                  icon={Mail}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                />
                <div>
                  <label className="label" htmlFor="login_password">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      id="login_password"
                      type={showPassword ? 'text' : 'password'}
                      className="field pl-10 pr-11"
                      placeholder="Your password"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(event) => update('password', event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={() => switchMode('reset')} className="text-xs font-semibold text-brand">
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-medium text-danger">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Signing in…' : 'Sign in'}
                  {!submitting && <ArrowRight size={15} />}
                </button>

                <p className="text-center text-sm text-muted">
                  New to iPhone Hub?{' '}
                  <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-brand">
                    Create an account
                  </button>
                </p>
              </form>
            )}

            {mode === 'signup' && !sentTo && (
              <form onSubmit={handleSignup} className="space-y-4">
                <Field
                  id="signup_name"
                  label="Full name"
                  icon={UserRound}
                  placeholder="Aung Aung"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={(event) => update('fullName', event.target.value)}
                />
                <Field
                  id="signup_email"
                  label="Email address"
                  icon={Mail}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                />
                <Field
                  id="signup_phone"
                  label="Phone number (optional)"
                  icon={UserRound}
                  type="tel"
                  placeholder="+95 9 000 000 000"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="signup_password">Password</label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        id="signup_password"
                        type={showPassword ? 'text' : 'password'}
                        className="field pl-10 pr-10"
                        placeholder="8+ characters"
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) => update('password', event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </div>
                  </div>
                  <Field
                    id="signup_confirm"
                    label="Confirm password"
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) => update('confirmPassword', event.target.value)}
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-medium text-danger">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Creating account…' : 'Create account'}
                  {!submitting && <ArrowRight size={15} />}
                </button>

                <p className="text-center text-sm text-muted">
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="font-semibold text-brand">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {mode === 'reset' && !sentTo && !user && (
              <form onSubmit={handleResetRequest} className="space-y-4">
                <Field
                  id="reset_email"
                  label="Email address"
                  icon={Mail}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                />
                {error && (
                  <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-medium text-danger">
                    {error}
                  </p>
                )}
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Sending…' : 'Send recovery link'}
                </button>
                <p className="text-center text-sm text-muted">
                  Remembered it?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="font-semibold text-brand">
                    Back to sign in
                  </button>
                </p>
              </form>
            )}

            {mode === 'reset' && user && (
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <Field
                  id="new_password"
                  label="New password"
                  icon={Lock}
                  type="password"
                  placeholder="8+ characters"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                />
                <Field
                  id="new_password_confirm"
                  label="Confirm new password"
                  icon={Lock}
                  type="password"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(event) => update('confirmPassword', event.target.value)}
                />
                {error && (
                  <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-medium text-danger">
                    {error}
                  </p>
                )}
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Updating…' : 'Update password'}
                </button>
              </form>
            )}

            {mode === 'login' && (
              <div className="mt-8 rounded-card border border-dashed border-line bg-surface p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Demo accounts
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => fillDemo({ email: 'demo@iphonehub.com', password: 'Demo@12345' })}
                    className="rounded-xl bg-soft px-3 py-2 text-left text-[11px] transition-colors hover:bg-line/60"
                  >
                    <span className="block font-semibold text-ink">Customer</span>
                    <span className="block text-muted">demo@iphonehub.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemo({ email: 'admin@iphonehub.com', password: 'Admin@12345' })}
                    className="rounded-xl bg-soft px-3 py-2 text-left text-[11px] transition-colors hover:bg-line/60"
                  >
                    <span className="block font-semibold text-ink">Admin</span>
                    <span className="block text-muted">admin@iphonehub.com</span>
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-muted">
                  Passwords: Demo@12345 / Admin@12345
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
