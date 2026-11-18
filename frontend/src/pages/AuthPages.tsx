import { Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Layout'
import { useToast } from '../components/Toast'
import { ErrorBanner, Spinner } from '../components/ui'
import { ApiError } from '../lib/api'
import { firstName } from '../lib/human'
import type { User } from '../lib/types'

/** Public demo logins (kept in sync by the backend seeder: ADMIN_PASSWORD / DEMO_PASSWORD). */
const DEMO_ACCOUNTS = [
  { label: 'Customer', email: 'demo@drivexpress.com', password: 'demo1234' },
  { label: 'Admin', email: 'admin@drivexpress.com', password: 'admin1234' },
]

const SIDE_IMG ='https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80'

function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-12">
      <div className="card animate-rise grid overflow-hidden p-2 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden rounded-[1.25rem] lg:block">
          <img src={SIDE_IMG} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-900/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white">
            <Sparkles className="size-6 text-amber-300" />
            <p className="mt-3 text-2xl font-bold leading-snug">“The best trips start with a car you don't have to worry about.”</p>
            <p className="mt-3 text-sm text-stone-300">Every DriveXpress car is checked by a real person after every single trip.</p>
          </div>
        </div>
        <div className="px-5 py-8 sm:px-10 sm:py-12">
          <Logo />
          <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-stone-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}

function PasswordInput({ id, value, onChange, autoComplete }: { id: string; value: string; onChange: (e: ChangeEvent<HTMLInputElement>) => void; autoComplete: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} autoComplete={autoComplete} required className="input pr-11" value={value} onChange={onChange} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:text-stone-700"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

/**
 * Where to go once a user is signed in: the ?next= page they came from (same-site paths only),
 * otherwise the admin dashboard or the homepage. Rendering <Navigate> when `user` becomes set is
 * the single redirect path, so it can't race with a second navigate() call.
 */
function useAfterAuthTarget() {
  const [params] = useSearchParams()
  const next = params.get('next')
  return (user: User) => {
    const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null
    return safeNext ?? (user.role === 'ADMIN' ? '/admin' : '/')
  }
}

export function LoginPage() {
  const { user, login } = useAuth()
  const toast = useToast()
  const target = useAfterAuthTarget()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={target(user)} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const signedIn = await login(email, password)
      toast(`Welcome back, ${firstName(signedIn.fullName)}! Good to see you.`)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back 👋"
      subtitle={
        <>
          New to DriveXpress? <Link to={`/register?${params}`} className="font-semibold text-orange-600 hover:underline">Create a free account</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" required className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy && <Spinner className="size-4" />} Log in
        </button>
      </form>

      <div className="mt-8 rounded-2xl border border-dashed border-stone-300/80 bg-white/40 p-4 text-xs text-stone-500">
        <div className="mb-2 font-semibold text-stone-700">Just exploring? Try a demo account</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.label}
              type="button"
              className="rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-left transition hover:bg-white"
              onClick={() => {
                setEmail(a.email)
                setPassword(a.password)
              }}
            >
              <div className="font-semibold text-ink">{a.label}</div>
              <div className="font-mono text-[11px] text-stone-500">{a.email} / {a.password}</div>
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  )
}

function passwordStrength(pw: string): { score: number; text: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  return { score, text: ['Too short', 'Okay', 'Decent', 'Strong', 'Excellent'][score] }
}

export function RegisterPage() {
  const { user, register } = useAuth()
  const toast = useToast()
  const target = useAfterAuthTarget()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={target(user)} replace />

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value })
  const strength = passwordStrength(form.password)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (form.password !== form.confirm) {
      setFieldErrors({ confirm: "These passwords don't match yet" })
      return
    }
    setBusy(true)
    try {
      const created = await register(form.fullName, form.email, form.password)
      toast(`Welcome aboard, ${firstName(created.fullName)}! 🎉`)
    } catch (err) {
      setError((err as Error).message)
      if (err instanceof ApiError) setFieldErrors(err.fieldErrors)
      setBusy(false)
    }
  }

  const fieldError = (k: string) => fieldErrors[k] && <p className="mt-1 text-xs text-rose-600">{fieldErrors[k]}</p>

  return (
    <AuthShell
      title="Let's get you on the road"
      subtitle={
        <>
          Already have an account? <Link to={`/login?${params}`} className="font-semibold text-orange-600 hover:underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <div>
          <label htmlFor="fullName" className="label">What should we call you?</label>
          <input id="fullName" autoComplete="name" required className="input" placeholder="Your full name" value={form.fullName} onChange={set('fullName')} />
          {fieldError('fullName')}
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" required className="input" placeholder="you@example.com" value={form.email} onChange={set('email')} />
          {fieldError('email')}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="label">Password</label>
            <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
            {fieldError('password') || (
              form.password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={`h-1 flex-1 rounded-full ${i < strength.score ? ['bg-rose-400', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-500'][strength.score - 1] : 'bg-stone-200'}`} />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{strength.text}</p>
                </div>
              )
            )}
          </div>
          <div>
            <label htmlFor="confirm" className="label">Type it again</label>
            <PasswordInput id="confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
            {fieldError('confirm')}
          </div>
        </div>
        <p className="text-xs text-stone-500">At least 8 characters. A mix of letters, numbers and symbols makes it stronger.</p>
        <button type="submit" disabled={busy} className="btn-primary w-full py-3">
          {busy && <Spinner className="size-4" />} Create my account
        </button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500">
          <ShieldCheck className="size-3.5 text-emerald-500" /> Your password is encrypted. We never store it in plain text.
        </p>
      </form>
    </AuthShell>
  )
}
