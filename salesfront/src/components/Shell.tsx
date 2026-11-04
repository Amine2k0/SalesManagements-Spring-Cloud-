import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LogOut, Menu, Package, PanelsTopLeft, ReceiptText, Users, X } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { initials } from '../lib/format'
import { Wordmark } from './brand'
import { IconButton, cx } from './ui'

const nav = [
  { to: '/', label: 'Overview', icon: PanelsTopLeft, end: true },
  { to: '/sales', label: 'Sales', icon: ReceiptText, end: false },
  { to: '/products', label: 'Products', icon: Package, end: false },
  { to: '/customers', label: 'Customers', icon: Users, end: false },
]

function Rail({ onNavigate }: { onNavigate?: () => void }) {
  const { session, signOut } = useAuth()
  const username = session?.username ?? ''
  return (
    <div className="flex h-full flex-col bg-carbon-900 text-carbon-200">
      <div className="flex h-16 items-center px-5">
        <Wordmark />
      </div>

      <nav aria-label="Main" className="mt-4 flex flex-col gap-1 pl-3">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'group relative flex h-10 items-center gap-3 rounded-l-md pr-5 pl-3 text-[0.9375rem] font-semibold transition-colors duration-150 focus-visible:outline-canary',
                isActive ? 'bg-ground text-carbon-900' : 'text-carbon-200 hover:bg-white/8 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cx('size-[1.125rem]', isActive ? 'text-carbon-700' : 'text-carbon-300')} aria-hidden />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 px-3 py-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-1.5">
          <span
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-carbon-700 text-xs font-bold text-white ring-1 ring-white/15"
            aria-hidden
          >
            {initials(username) || '·'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{username}</p>
            <p className="text-xs text-carbon-300">Signed in</p>
          </div>
          <IconButton label="Sign out" tone="onDark" onClick={signOut}>
            <LogOut className="size-4" aria-hidden />
          </IconButton>
        </div>
      </div>
    </div>
  )
}

export function Shell() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="min-h-dvh lg:pl-60">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-sheet focus:px-3 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">
        <Rail />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between bg-carbon-900 px-4 lg:hidden">
        <Wordmark />
        <IconButton label="Open menu" tone="onDark" onClick={() => setOpen(true)} aria-expanded={open}>
          <Menu className="size-5" aria-hidden />
        </IconButton>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            className="animate-fade absolute inset-0 bg-carbon-950/50"
            onClick={() => setOpen(false)}
          />
          <div className="animate-panel absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-[8px_0_32px_-8px_rgb(14_26_64/0.45)]">
            <Rail onNavigate={() => setOpen(false)} />
            <IconButton label="Close menu" tone="onDark" className="absolute top-4 right-3" onClick={() => setOpen(false)}>
              <X className="size-5" aria-hidden />
            </IconButton>
          </div>
        </div>
      )}

      <main id="main" className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-8">
        <Outlet />
      </main>
    </div>
  )
}

export function PageHeader({
  title,
  meta,
  actions,
}: {
  title: string
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 lg:mb-8">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] leading-tight font-bold text-ink sm:text-[2rem]" style={{ fontStretch: '95%', letterSpacing: '-0.01em', wordSpacing: '0.05em' }}>
          {title}
        </h1>
        {meta && <div className="mt-1 text-sm text-ink-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
