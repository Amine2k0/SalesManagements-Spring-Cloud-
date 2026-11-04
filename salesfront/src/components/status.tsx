import type { ReactNode } from 'react'
import { CloudOff, RotateCw, TriangleAlert } from 'lucide-react'
import { ApiError } from '../lib/api'
import type { Area } from '../lib/types'
import { stockLevel } from '../lib/stats'
import { Button, cx } from './ui'

const areaName: Record<Area, string> = {
  auth: 'Sign-in',
  products: 'Products',
  customers: 'Customers',
  sales: 'Sales',
}

const others: Record<Area, string> = {
  auth: 'Your data is safe; try again in a moment.',
  products: 'Customers and sales still work.',
  customers: 'Products and sales still work.',
  sales: 'Products and customers still work.',
}

/** Shown in place of one area's content when its service fails, so the rest of the app carries on. */
export function ServiceNotice({
  error,
  onRetry,
  compact = false,
  className,
}: {
  error: unknown
  onRetry?: () => void
  compact?: boolean
  className?: string
}) {
  const apiError = error instanceof ApiError ? error : null
  const area = apiError?.area ?? 'sales'
  const unavailable = apiError ? apiError.unavailable : true
  const title = unavailable ? `${areaName[area]} ${area === 'auth' ? 'is' : 'are'} unavailable right now` : `${areaName[area]} could not load`
  const body = unavailable
    ? `${areaName[area]} didn't respond. ${others[area]}`
    : `The server answered with an error (${apiError?.status ?? 'unknown'}). ${others[area]}`
  const Icon = unavailable ? CloudOff : TriangleAlert

  return (
    <div role="alert" className={cx('flex items-start gap-3', compact ? 'px-5 py-5' : 'px-6 py-10', className)}>
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-numero-tint text-numero">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-2">{body}</p>
        {onRetry && (
          <Button size="sm" className="mt-3" icon={<RotateCw className="size-3.5" aria-hidden />} onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-col items-start gap-1 px-5 py-10 sm:px-8', className)}>
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="max-w-[52ch] text-sm text-ink-2">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function StockBadge({ qte, className }: { qte: number; className?: string }) {
  const level = stockLevel(qte)
  if (level === 'ok') {
    return <span className={cx('figures text-sm text-ink-2', className)}>{qte} in stock</span>
  }
  return (
    <span
      className={cx(
        'figures inline-flex h-6 items-center rounded-sm px-2 text-[0.8125rem] font-semibold whitespace-nowrap',
        level === 'low' ? 'bg-pink-tint text-pink-ink' : 'bg-numero-tint text-numero-deep',
        className,
      )}
    >
      {level === 'low' ? `Low · ${qte} left` : 'Out of stock'}
    </span>
  )
}

/** Form-level error banner for a rejected save. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md bg-numero-tint px-3 py-2.5 text-sm text-numero-deep">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  )
}
