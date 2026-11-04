const amount = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('en-US')

/** Moroccan dirham, written the way a till slip writes it: 7,999.00 DH */
export function dh(value: number): string {
  return `${amount.format(value)} DH`
}

export function dhCompact(value: number): string {
  return `${compact.format(value)} DH`
}

export function count(value: number): string {
  return integer.format(value)
}

/** Slip and record numbers, zero-padded like a numbering machine prints them. */
export function serial(id: number, width = 4): string {
  return String(id).padStart(width, '0')
}

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const shortDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const longDay = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short' })

/** Parses the service's yyyy-MM-dd (or a full timestamp) as a local calendar day. */
export function parseDay(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatDay(value: string | Date): string {
  return dayFormat.format(typeof value === 'string' ? parseDay(value) : value)
}

export function formatShortDay(value: Date): string {
  return shortDay.format(value)
}

export function formatLongDay(value: Date): string {
  return longDay.format(value)
}

export function formatMonth(value: Date): string {
  return monthFormat.format(value)
}

export function fullName(client: { prenom?: string | null; nom?: string | null }): string {
  return [client.prenom, client.nom].filter(Boolean).join(' ') || 'Unnamed customer'
}

export function initials(name: string): string {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}
