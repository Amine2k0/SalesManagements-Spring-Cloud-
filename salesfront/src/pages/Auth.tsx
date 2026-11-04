import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Wordmark } from '../components/brand'
import { FormError } from '../components/status'
import { Button, Field, IconButton, Input } from '../components/ui'
import { ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'

type Mode = 'signin' | 'register'

function messageFor(error: unknown, mode: Mode): string {
  if (error instanceof ApiError) {
    if (error.unavailable) return 'Sign-in is unavailable right now. Try again in a moment.'
    if (error.status === 401) return "That username and password don't match. Check them and try again."
    if (error.status === 409) return 'That username is already taken. Choose another, or sign in instead.'
  }
  return mode === 'signin' ? "You couldn't be signed in. Try again." : "The account couldn't be created. Try again."
}

export function AuthPage({ mode }: { mode: Mode }) {
  const { status, signIn, register, notice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [reveal, setReveal] = useState(false)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setError(null)
    setTouched(false)
    setConfirm('')
    firstRef.current?.focus()
  }, [mode])

  if (status === 'signed-in') return <Navigate to={from} replace />

  const errors = {
    username: !username.trim()
      ? 'Enter your username.'
      : mode === 'register' && !/^[A-Za-z0-9._-]{3,32}$/.test(username.trim())
        ? 'Use 3 to 32 letters, numbers, dots, dashes or underscores.'
        : null,
    password: !password
      ? 'Enter your password.'
      : mode === 'register' && password.length < 6
        ? 'Use at least 6 characters.'
        : null,
    confirm: mode === 'register' && confirm !== password ? "The passwords don't match." : null,
  }
  const valid = !errors.username && !errors.password && !errors.confirm

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    setError(null)
    if (!valid) return
    setBusy(true)
    try {
      if (mode === 'signin') await signIn(username.trim(), password)
      else await register(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(messageFor(err, mode))
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-carbon-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Wordmark />
        <BlankSlip />
        <div className="max-w-md">
          <p className="text-[1.75rem] leading-tight font-bold text-white" style={{ fontStretch: '95%', letterSpacing: '-0.01em', wordSpacing: '0.05em' }}>
            The sales book for your shop.
          </p>
          <p className="mt-3 text-carbon-200">Products, customers and every sale, numbered and on record.</p>
        </div>
      </aside>

      <main className="flex flex-col">
        {/* Below desktop the cover of the book sits on top, its copy sheets peeking out beneath. */}
        <div className="lg:hidden">
          <div className="bg-carbon-900 px-5 pt-5 pb-7 sm:px-10">
            <Wordmark />
            <p className="mt-7 text-[1.375rem] leading-tight font-bold text-white" style={{ fontStretch: '95%', letterSpacing: '-0.01em', wordSpacing: '0.05em' }}>
              The sales book for your shop.
            </p>
            <p className="mt-1.5 text-sm text-carbon-200">Products, customers and every sale, numbered and on record.</p>
          </div>
          <div className="mx-3 h-2 rounded-b-md bg-canary sm:mx-8" aria-hidden />
          <div className="mx-6 h-2 rounded-b-md bg-pink sm:mx-12" aria-hidden />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-start px-5 pt-8 pb-10 sm:px-0 lg:justify-center lg:py-10">
          <h1 className="text-[1.75rem] leading-tight font-bold text-ink" style={{ fontStretch: '95%', letterSpacing: '-0.01em', wordSpacing: '0.05em' }}>
            {mode === 'signin' ? 'Sign in' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-ink-2">
            {mode === 'signin' ? 'Welcome back. Pick up where the book left off.' : 'One account for the shop: products, customers and sales.'}
          </p>

          {notice && mode === 'signin' && (
            <p className="mt-5 rounded-md bg-canary-tint px-3 py-2.5 text-sm text-canary-ink ring-1 ring-[#e9d98f]" role="status">
              {notice}
            </p>
          )}

          <form onSubmit={submit} noValidate className="mt-7 flex flex-col gap-4">
            <Field label="Username" error={touched ? errors.username : null}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  ref={firstRef}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              )}
            </Field>
            <Field label="Password" error={touched ? errors.password : null}>
              {({ id, describedBy, invalid }) => (
                <div className="relative">
                  <Input
                    id={id}
                    type={reveal ? 'text' : 'password'}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="pr-10"
                  />
                  <IconButton
                    label={reveal ? 'Hide password' : 'Show password'}
                    className="absolute top-1 right-1"
                    onClick={() => setReveal((r) => !r)}
                  >
                    {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </IconButton>
                </div>
              )}
            </Field>
            {mode === 'register' && (
              <Field label="Confirm password" error={touched ? errors.confirm : null}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type={reveal ? 'text' : 'password'}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                )}
              </Field>
            )}

            {error && <FormError>{error}</FormError>}

            <Button type="submit" variant="primary" busy={busy} className="mt-1 w-full">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-ink-2">
            {mode === 'signin' ? (
              <>
                New here?{' '}
                <Link to="/register" state={location.state} className="font-semibold text-carbon-700 underline hover:text-carbon-900">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/signin" state={location.state} className="font-semibold text-carbon-700 underline hover:text-carbon-900">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}

/** An unwritten slip with its copies beneath it: the object the app keeps. */
function BlankSlip() {
  return (
    <div className="relative mx-auto my-10 w-full max-w-[22rem]" aria-hidden>
      <div className="absolute inset-0 translate-x-5 translate-y-5 rotate-[3deg] rounded-lg bg-pink" />
      <div className="absolute inset-0 translate-x-2.5 translate-y-2.5 rotate-[1.5deg] rounded-lg bg-canary" />
      <div className="relative -rotate-[1.5deg] rounded-lg bg-sheet">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <span className="font-semibold text-carbon-900" style={{ fontStretch: '92%' }}>
            Sales slip
          </span>
          <span className="numero text-lg opacity-40">N° ····</span>
        </div>
        <div className="perforation-x" />
        <div className="flex flex-col gap-4 px-6 pt-5 pb-6">
          {['Customer', 'Product', 'Quantity'].map((label) => (
            <div key={label}>
              <span className="form-label">{label}</span>
              <span className="mt-2 block h-px bg-rule-strong" />
            </div>
          ))}
          <div className="mt-2 flex items-end justify-between rounded-md px-3 py-3 ring-1 ring-rule">
            <span className="form-label">Total</span>
            <span className="figures text-xl font-bold text-rule-strong">DH</span>
          </div>
        </div>
      </div>
    </div>
  )
}
