import { cx } from './ui'

/** Product name in one place; rename here. */
export const APP_NAME = 'Carnet'

/** A slip with its perforated stub and the numbering machine's red dot. */
export function Mark({ className, tone = 'onDark' }: { className?: string; tone?: 'onDark' | 'onLight' }) {
  const sheet = tone === 'onDark' ? '#ffffff' : '#24418F'
  const line = tone === 'onDark' ? '#172B66' : '#ffffff'
  return (
    <svg viewBox="0 0 24 24" className={cx('shrink-0', className)} aria-hidden>
      <path d="M5 3.5h14v17H5z" fill={sheet} />
      <path d="M5 8.6h14" stroke={line} strokeWidth="1.2" strokeDasharray="1.4 1.4" />
      <path d="M8 12.5h8M8 15.5h5" stroke={tone === 'onDark' ? '#9DB0E3' : '#C5D1F0'} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16" cy="6" r="1.15" fill="#C0392B" />
    </svg>
  )
}

export function Wordmark({ tone = 'onDark', className }: { tone?: 'onDark' | 'onLight'; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <Mark className="size-7" tone={tone} />
      <span
        className={cx('text-[1.3125rem] leading-none font-bold', tone === 'onDark' ? 'text-white' : 'text-carbon-900')}
        style={{ fontStretch: '100%', letterSpacing: '0.01em' }}
      >
        {APP_NAME}
      </span>
    </span>
  )
}
