import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ReceiptText } from 'lucide-react'
import { PageHeader } from '../components/Shell'
import { EmptyState, ServiceNotice, StockBadge } from '../components/status'
import { Segmented, Sheet, SheetHeader, cx } from '../components/ui'
import { count, dh, dhCompact, formatDay, formatLongDay, formatMonth, formatShortDay, fullName, serial } from '../lib/format'
import { useClients, useProduits, useVentes } from '../lib/queries'
import { amountOf, buckets, inPeriod, newestFirst, rankProducts, stockLevel, type Bucket, type Period } from '../lib/stats'

const periodLabel: Record<Period, string> = {
  '7d': 'last 7 days',
  '14d': 'last 14 days',
  '30d': 'last 30 days',
  all: 'all time',
}

export function OverviewPage() {
  const ventes = useVentes()
  const produits = useProduits()
  const clients = useClients()
  const [period, setPeriod] = useState<Period>('14d')
  const [today] = useState(() => new Date())

  const scoped = useMemo(() => inPeriod(ventes.data ?? [], period), [ventes.data, period])
  const totals = useMemo(() => {
    const customers = new Set<number>()
    let revenue = 0
    let units = 0
    for (const v of scoped) {
      revenue += amountOf(v)
      units += v.quantite
      if (v.client) customers.add(v.client.id)
    }
    return { revenue, units, sales: scoped.length, customers: customers.size }
  }, [scoped])

  const series = useMemo(() => buckets(scoped, period), [scoped, period])
  const latest = useMemo(() => [...(ventes.data ?? [])].sort(newestFirst).slice(0, 6), [ventes.data])
  const ranking = useMemo(() => rankProducts(scoped).slice(0, 5), [scoped])
  const watch = useMemo(
    () =>
      [...(produits.data ?? [])]
        .filter((p) => stockLevel(p.qteStock) !== 'ok')
        .sort((a, b) => a.qteStock - b.qteStock || a.nom.localeCompare(b.nom))
        .slice(0, 6),
    [produits.data],
  )

  const firstRun =
    ventes.isSuccess && (ventes.data?.length ?? 0) === 0 && produits.isSuccess && clients.isSuccess

  return (
    <>
      <PageHeader
        title="Overview"
        meta={formatLongDay(today)}
        actions={
          <>
            <Segmented
              label="Period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: '7d', label: '7 days' },
                { value: '14d', label: '14 days' },
                { value: '30d', label: '30 days' },
                { value: 'all', label: '12 months' },
              ]}
            />
            <Link
              to="/sales?new=1"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-carbon-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-carbon-800"
            >
              <ReceiptText className="size-4" aria-hidden />
              Record sale
            </Link>
          </>
        }
      />

      {firstRun && <GettingStarted products={produits.data!.length} customers={clients.data!.length} />}

      {ventes.isError ? (
        <Sheet className="mb-6">
          <ServiceNotice error={ventes.error} onRetry={() => ventes.refetch()} />
        </Sheet>
      ) : (
        <>
          {/* The totals line at the foot of an invoice: counts ruled off, the takings set last and double-ruled. */}
          <Sheet className="mb-6 overflow-hidden">
            <dl className="flex flex-col lg:flex-row">
              <div className="order-2 grid grid-cols-3 border-t border-rule lg:order-1 lg:flex-1 lg:border-t-0 lg:border-r">
                <Count label="Sales" value={ventes.isPending ? null : count(totals.sales)} />
                <Count label="Units sold" value={ventes.isPending ? null : count(totals.units)} />
                <Count label="Customers served" value={ventes.isPending ? null : count(totals.customers)} />
              </div>
              <div className="order-1 flex items-end justify-between gap-6 px-5 pt-4 pb-5 lg:order-2 lg:min-w-[25rem] lg:pt-5">
                <dt className="min-w-0">
                  <span className="form-label block">Takings</span>
                  <span className="mt-1 block text-xs text-ink-3">{periodLabel[period]}, at list prices</span>
                </dt>
                <dd className="text-right">
                  {ventes.isPending ? (
                    <span className="block h-9 w-44 animate-pulse rounded-sm bg-ground" />
                  ) : (
                    <span
                      className="figures inline-block border-b-[4px] border-double border-carbon-900 pb-1 text-[1.875rem] leading-none font-bold whitespace-nowrap text-carbon-900 sm:text-[2.375rem]"
                      style={{ fontStretch: '90%', letterSpacing: '-0.01em' }}
                    >
                      {dh(totals.revenue)}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </Sheet>

          <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Sheet className="min-w-0">
              <SheetHeader title={period === 'all' ? 'Takings by month' : 'Takings by day'}>
                <span className="figures text-sm text-ink-2">{ventes.isPending ? '' : `${dh(totals.revenue)} total`}</span>
              </SheetHeader>
              <TakingsChart series={series} period={period} loading={ventes.isPending} />
            </Sheet>

            <Sheet className="flex min-w-0 flex-col">
              <SheetHeader title="Latest slips">
                <Link to="/sales" className="inline-flex items-center gap-1 text-sm font-semibold text-carbon-700 hover:text-carbon-900">
                  Register
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </SheetHeader>
              {ventes.isPending ? (
                <p className="px-5 py-6 text-sm text-ink-3">Loading…</p>
              ) : latest.length === 0 ? (
                <EmptyState title="No sales yet">Recorded sales are filed here, newest first.</EmptyState>
              ) : (
                <ul className="divide-y divide-rule">
                  {latest.map((v) => (
                    <li key={v.id} className="grid grid-cols-[4.5rem_3px_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3">
                      <span className="flex flex-col">
                        <span className="numero text-sm">N° {serial(v.id)}</span>
                        <span className="figures text-xs text-ink-3">{formatDay(v.date)}</span>
                      </span>
                      <span className="perforation-y h-full" aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">{fullName(v.client ?? {})}</span>
                        <span className="block truncate text-xs text-ink-3">
                          {v.produit?.nom} × {v.quantite}
                        </span>
                      </span>
                      <span className="figures text-sm font-semibold whitespace-nowrap text-carbon-900">{dh(amountOf(v))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Sheet>
          </div>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Sheet className="min-w-0">
          <SheetHeader title="Stock to watch">
            <Link to="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-carbon-700 hover:text-carbon-900">
              Products
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </SheetHeader>
          {produits.isError ? (
            <ServiceNotice error={produits.error} onRetry={() => produits.refetch()} compact />
          ) : produits.isPending ? (
            <p className="px-5 py-6 text-sm text-ink-3">Loading…</p>
          ) : (produits.data?.length ?? 0) === 0 ? (
            <EmptyState title="No products yet">Products running low or out of stock will be listed here.</EmptyState>
          ) : watch.length === 0 ? (
            <EmptyState title="Stock is healthy">Every product has more than 5 units on hand.</EmptyState>
          ) : (
            <ul className="divide-y divide-rule">
              {watch.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{p.nom}</span>
                    <span className="block truncate text-xs text-ink-3">{p.marque}</span>
                  </span>
                  <StockBadge qte={p.qteStock} />
                </li>
              ))}
            </ul>
          )}
        </Sheet>

        <Sheet className="min-w-0">
          <SheetHeader title="Top products">
            <span className="text-sm text-ink-2">By units, {periodLabel[period]}</span>
          </SheetHeader>
          {ventes.isError ? (
            <ServiceNotice error={ventes.error} onRetry={() => ventes.refetch()} compact />
          ) : ventes.isPending ? (
            <p className="px-5 py-6 text-sm text-ink-3">Loading…</p>
          ) : ranking.length === 0 ? (
            <EmptyState title="Nothing sold in this period">Products are ranked here once sales are recorded.</EmptyState>
          ) : (
            <ol className="flex flex-col gap-3.5 px-5 py-4">
              {ranking.map((r, index) => (
                <li key={r.produit.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                  <span className="figures text-sm font-semibold text-ink-3">{index + 1}</span>
                  <span className="min-w-0 truncate text-sm">
                    <span className="font-semibold text-ink">{r.produit.nom}</span>
                    <span className="text-ink-3"> · {r.produit.marque}</span>
                  </span>
                  <span className="figures text-sm text-ink-2">
                    <span className="font-semibold text-ink">{count(r.units)}</span> units
                  </span>
                  <span aria-hidden />
                  <span className="h-2 overflow-hidden rounded-sm bg-carbon-100">
                    <span
                      className="block h-full rounded-sm bg-carbon-700"
                      style={{ width: `${Math.max(3, (r.units / ranking[0]!.units) * 100)}%` }}
                    />
                  </span>
                  <span className="figures text-xs text-ink-3">{dh(r.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Sheet>
      </div>
    </>
  )
}

/** One counted line of the totals: printed label on the left, the figure on the right. */
function Count({ label, value }: { label: string; value: ReactNode | null }) {
  return (
    <div className="flex flex-col gap-1 border-rule px-4 py-3 [&+&]:border-l sm:px-5 lg:flex-row lg:items-baseline lg:justify-between lg:gap-3 lg:py-5">
      <dt className="form-label leading-tight">{label}</dt>
      <dd className="figures mt-auto text-xl leading-none font-bold text-carbon-900 lg:mt-0 lg:text-[1.375rem]">
        {value === null ? <span className="inline-block h-5 w-8 animate-pulse rounded-sm bg-ground align-middle" /> : value}
      </dd>
    </div>
  )
}

function niceCeiling(value: number): number {
  if (value <= 0) return 1000
  const magnitude = 10 ** Math.floor(Math.log10(value))
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * magnitude >= value) return step * magnitude
  }
  return 10 * magnitude
}

function TakingsChart({ series, period, loading }: { series: Bucket[]; period: Period; loading: boolean }) {
  const max = niceCeiling(Math.max(...series.map((b) => b.total), 0))
  const ticks = [1, 0.75, 0.5, 0.25, 0]
  const empty = series.every((b) => b.total === 0)
  const labelEvery = period === '30d' ? 5 : period === '14d' ? 2 : 1
  // With few active days, print each column's figure so sparse real data still reads.
  const showValues = series.filter((b) => b.total > 0).length <= 8

  return (
    <div className="px-5 pt-5 pb-4">
      <div className="relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-3">
        <div className="relative h-56" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="figures absolute right-0 -translate-y-1/2 text-[0.6875rem] text-ink-3" style={{ top: `${(1 - t) * 100}%` }}>
              {t === 0 ? '0' : dhCompact(max * t).replace(' DH', '')}
            </span>
          ))}
        </div>
        <div className="relative h-56">
          {ticks.map((t) => (
            <span
              key={t}
              aria-hidden
              className={cx('absolute inset-x-0 h-px', t === 0 ? 'bg-rule-strong' : 'bg-rule')}
              style={{ top: `${(1 - t) * 100}%` }}
            />
          ))}
          <ol className="absolute inset-0 flex items-end gap-[3px] sm:gap-1" aria-label="Takings per period">
            {series.map((b, i) => {
              const height = loading ? 0 : (b.total / max) * 100
              const label = period === 'all' ? formatMonth(b.start) : formatShortDay(b.start)
              const isLast = i === series.length - 1
              return (
                <li key={b.key} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                  <span
                    tabIndex={0}
                    aria-label={`${period === 'all' ? b.start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : formatDay(b.start)}: ${dh(b.total)}, ${b.count} ${b.count === 1 ? 'sale' : 'sales'}`}
                    className={cx(
                      'block w-full max-w-10 rounded-t-[3px] transition-[height,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-carbon-600',
                      b.total > 0 ? (isLast ? 'bg-carbon-900 group-hover:bg-carbon-950' : 'bg-carbon-600 group-hover:bg-carbon-900') : 'bg-transparent',
                    )}
                    style={{ height: b.total > 0 ? `max(${height}%, 3px)` : '100%' }}
                  />
                  {showValues && b.total > 0 && !loading && (
                    <span
                      aria-hidden
                      className="figures pointer-events-none absolute left-1/2 -translate-x-1/2 text-[0.6875rem] font-semibold whitespace-nowrap text-carbon-900 group-hover:invisible"
                      style={{ bottom: `calc(${height}% + 0.3rem)` }}
                    >
                      {dhCompact(b.total).replace(' DH', '')}
                    </span>
                  )}
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-md bg-carbon-950 px-2.5 py-1.5 text-xs whitespace-nowrap text-white group-focus-within:block group-hover:block"
                    style={{ bottom: b.total > 0 ? `calc(${height}% + 0.5rem)` : '1rem' }}
                  >
                    <span className="block font-semibold">{label}</span>
                    <span className="figures block text-carbon-200">
                      {dh(b.total)} · {b.count} {b.count === 1 ? 'sale' : 'sales'}
                    </span>
                  </span>
                </li>
              )
            })}
          </ol>
          {empty && !loading && (
            <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-ink-3">No takings in this period.</p>
          )}
        </div>
        <span aria-hidden />
        <div className="mt-2 flex gap-[3px] sm:gap-1" aria-hidden>
          {series.map((b, i) => {
            const show = (series.length - 1 - i) % labelEvery === 0
            return (
              <span key={b.key} className="figures relative h-4 min-w-0 flex-1 text-[0.6875rem] text-ink-3">
                {show && (
                  <span className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {period === 'all'
                      ? formatMonth(b.start)
                      : period === '7d'
                        ? b.start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
                        : formatShortDay(b.start)}
                  </span>
                )}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GettingStarted({ products, customers }: { products: number; customers: number }) {
  const steps = [
    { done: products > 0, title: 'Add a product', body: 'What you sell, its price and the stock you hold.', to: '/products?new=1' },
    { done: customers > 0, title: 'Add a customer', body: 'Every sale is written to a customer account.', to: '/customers?new=1' },
    { done: false, title: 'Record the first sale', body: 'Write a slip; it is numbered and filed in the register.', to: '/sales?new=1' },
  ]
  return (
    <Sheet className="mb-6">
      <SheetHeader title="Set up your book" />
      <ol className="grid divide-y divide-rule md:grid-cols-3 md:divide-x md:divide-y-0">
        {steps.map((step, i) => (
          <li key={step.title}>
            <Link to={step.to} className="group flex h-full items-start gap-3 px-5 py-4 transition-colors hover:bg-carbon-50/70">
              <span
                className={cx(
                  'figures mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  step.done ? 'bg-carbon-700 text-white' : 'text-carbon-700 ring-1 ring-carbon-300',
                )}
              >
                {step.done ? <Check className="size-3.5" aria-label="Done" /> : i + 1}
              </span>
              <span>
                <span className={cx('block font-semibold', step.done ? 'text-ink-3 line-through decoration-rule-strong' : 'text-ink group-hover:text-carbon-700')}>
                  {step.title}
                </span>
                <span className="block text-sm text-ink-2">{step.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </Sheet>
  )
}
