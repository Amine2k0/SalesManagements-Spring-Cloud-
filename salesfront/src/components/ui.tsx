import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, LoaderCircle } from 'lucide-react'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const variants: Record<Variant, string> = {
  primary:
    'bg-carbon-700 text-white hover:bg-carbon-800 active:bg-carbon-900 disabled:bg-carbon-300 disabled:text-white/90',
  secondary:
    'bg-sheet text-ink ring-1 ring-inset ring-rule-strong hover:bg-carbon-50 hover:ring-carbon-300 active:bg-carbon-100 disabled:text-ink-3 disabled:ring-rule',
  ghost: 'text-ink-2 hover:bg-carbon-50 hover:text-ink active:bg-carbon-100 disabled:text-ink-3',
  danger: 'bg-numero text-white hover:bg-numero-deep active:bg-numero-deep disabled:opacity-60',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3 text-[0.8125rem]',
  md: 'h-10 gap-2 px-4 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  busy?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, busy = false, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-md font-semibold whitespace-nowrap transition-colors duration-150 select-none disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
})

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: 'default' | 'danger' | 'onDark'
}

export function IconButton({ label, tone = 'default', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'default' && 'text-ink-3 hover:bg-carbon-50 hover:text-carbon-700',
        tone === 'danger' && 'text-ink-3 hover:bg-numero-tint hover:text-numero',
        tone === 'onDark' && 'text-carbon-200 hover:bg-white/10 hover:text-white focus-visible:outline-canary',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

interface FieldProps {
  label: string
  hint?: ReactNode
  error?: string | null
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
  className?: string
  trailing?: ReactNode
}

export function Field({ label, hint, error, children, className, trailing }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const describedBy = error || hint ? hintId : undefined
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="form-label">
          {label}
        </label>
        {trailing}
      </div>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={hintId} className="text-[0.8125rem] font-medium text-numero">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[0.8125rem] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const control =
  'h-10 w-full rounded-md bg-sheet px-3 text-[0.9375rem] text-ink ring-1 ring-inset ring-rule-strong transition-shadow duration-150 placeholder:text-ink-3 hover:ring-carbon-300 focus:outline-none focus:ring-2 focus:ring-carbon-600 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-numero disabled:bg-ground disabled:text-ink-3'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={cx(control, className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cx(control, 'appearance-none pr-9', className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
    </div>
  )
})

export interface SegmentOption<T extends string> {
  value: T
  label: string
  count?: number
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex self-start rounded-md bg-sheet p-0.5 ring-1 ring-inset ring-rule-strong">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex h-8 items-center gap-1.5 rounded-[5px] px-3 text-[0.8125rem] font-semibold transition-colors duration-150',
              active ? 'bg-carbon-700 text-white' : 'text-ink-2 hover:bg-carbon-50 hover:text-ink',
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={cx('figures text-xs font-medium', active ? 'text-carbon-200' : 'text-ink-3')}>
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export type SortDir = 'asc' | 'desc'

export function SortHeader<K extends string>({
  label,
  sortKey,
  sort,
  onSort,
  align = 'left',
  className,
}: {
  label: string
  sortKey: K
  sort: { key: K; dir: SortDir }
  onSort: (key: K) => void
  align?: 'left' | 'right'
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cx('px-4 py-0 first:pl-5 last:pr-5', align === 'right' ? 'text-right' : 'text-left', className)}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cx(
          'form-label inline-flex h-10 items-center gap-1 whitespace-nowrap transition-colors hover:text-ink',
          align === 'right' && 'flex-row-reverse',
          active && 'text-ink',
        )}
      >
        {label}
        <Icon className={cx('size-3.5', active ? 'text-carbon-700' : 'text-rule-strong')} aria-hidden />
      </button>
    </th>
  )
}

export function Th({ children, align = 'left', className }: { children?: ReactNode; align?: 'left' | 'right'; className?: string }) {
  return (
    <th
      scope="col"
      className={cx('form-label h-10 px-4 whitespace-nowrap first:pl-5 last:pr-5', align === 'right' ? 'text-right' : 'text-left', className)}
    >
      {children}
    </th>
  )
}

export function Sheet({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-lg bg-sheet ring-1 ring-rule', className)}>{children}</section>
}

export function SheetHeader({ title, children, id }: { title: string; children?: ReactNode; id?: string }) {
  return (
    <header className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule px-5 py-3">
      <h2 id={id} className="text-[0.9375rem] font-semibold text-ink" style={{ fontStretch: '95%' }}>
        {title}
      </h2>
      {children}
    </header>
  )
}

export function SkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="border-t border-rule">
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="h-13 px-4 first:pl-5 last:pr-5">
              <span
                className="block h-3 animate-pulse rounded-sm bg-ground"
                style={{ width: `${40 + ((r * 7 + c * 13) % 45)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
