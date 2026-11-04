import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PageHeader } from '../components/Shell'
import { Slip } from '../components/Slip'
import { EmptyState, ServiceNotice } from '../components/status'
import { Input, Segmented, Sheet, SheetHeader, SkeletonRows, SortHeader, Th, type SortDir } from '../components/ui'
import { count, dh, formatDay, fullName, serial } from '../lib/format'
import { useVentes } from '../lib/queries'
import { amountOf, inPeriod, newestFirst, type Period } from '../lib/stats'
import type { Vente } from '../lib/types'

type SortKey = 'date' | 'customer' | 'amount'

export function SalesPage() {
  const [params] = useSearchParams()
  const ventes = useVentes()
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState<Period>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'date', dir: 'desc' })
  const [filedId, setFiledId] = useState<number | null>(null)

  const initialClient = Number(params.get('client')) || null
  const initialProduct = Number(params.get('product')) || null
  const wantsNew = params.get('new') === '1'

  const all = useMemo(() => ventes.data ?? [], [ventes.data])
  const periodRows = useMemo(() => inPeriod(all, period), [all, period])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^n°\s*/, '')
    const filtered = q
      ? periodRows.filter((v) =>
          [serial(v.id), String(v.id), fullName(v.client ?? {}), v.client?.email, v.produit?.nom, v.produit?.marque]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(q)),
        )
      : periodRows
    const dir = sort.dir === 'asc' ? 1 : -1
    const compare: Record<SortKey, (a: Vente, b: Vente) => number> = {
      date: (a, b) => -newestFirst(a, b),
      customer: (a, b) => fullName(a.client ?? {}).localeCompare(fullName(b.client ?? {})),
      amount: (a, b) => amountOf(a) - amountOf(b),
    }
    return [...filtered].sort((a, b) => compare[sort.key](a, b) * dir)
  }, [periodRows, query, sort])

  const totals = useMemo(
    () => rows.reduce((acc, v) => ({ amount: acc.amount + amountOf(v), units: acc.units + v.quantite }), { amount: 0, units: 0 }),
    [rows],
  )

  function onSort(key: SortKey) {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'customer' ? 'asc' : 'desc' },
    )
  }

  return (
    <>
      <PageHeader
        title="Sales"
        meta={ventes.isSuccess ? `${count(all.length)} ${all.length === 1 ? 'slip' : 'slips'} in the register` : 'The register'}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="xl:sticky xl:top-8 xl:order-2">
          <Slip
            key={`${initialClient ?? ''}:${initialProduct ?? ''}`}
            initialClientId={initialClient}
            initialProduitId={initialProduct}
            autoFocus={wantsNew}
            onRecorded={(vente) => {
              setFiledId(vente.id)
              setQuery('')
            }}
          />
        </div>

        <Sheet className="min-w-0 xl:order-1">
          <SheetHeader title="Register">
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
                <Input
                  type="search"
                  aria-label="Search sales"
                  placeholder="Search N°, customer, product"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <Segmented
                label="Period"
                value={period}
                onChange={setPeriod}
                options={[
                  { value: '7d', label: '7 days' },
                  { value: '30d', label: '30 days' },
                  { value: 'all', label: 'All' },
                ]}
              />
            </div>
          </SheetHeader>

          {ventes.isError ? (
            <ServiceNotice error={ventes.error} onRetry={() => ventes.refetch()} />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full sm:min-w-[600px] text-sm">
                <caption className="sr-only">Sales register</caption>
                <thead>
                  <tr>
                    <SortHeader label="Slip" sortKey="date" sort={sort} onSort={onSort} className="sm:w-36" />
                    <SortHeader label="Customer" sortKey="customer" sort={sort} onSort={onSort} />
                    <Th className="hidden sm:table-cell">Product</Th>
                    <Th align="right" className="hidden sm:table-cell">Qty</Th>
                    <SortHeader label="Amount" sortKey="amount" sort={sort} onSort={onSort} align="right" />
                  </tr>
                </thead>
                <tbody>
                  {ventes.isPending ? (
                    <SkeletonRows cols={5} />
                  ) : (
                    rows.map((v) => (
                      <tr
                        key={v.id}
                        className={`border-t border-rule transition-colors hover:bg-carbon-50/60 ${v.id === filedId ? 'animate-filed' : ''}`}
                      >
                        <td className="h-15 pr-2 pl-5 sm:pr-4">
                          <span className="flex items-stretch gap-3">
                            <span className="flex flex-col justify-center">
                              <span className="numero">N° {serial(v.id)}</span>
                              <span className="figures text-xs whitespace-nowrap text-ink-3">{formatDay(v.date)}</span>
                            </span>
                            <span className="perforation-y ml-auto" aria-hidden />
                          </span>
                        </td>
                        <td className="w-full max-w-0 px-3 sm:w-auto sm:max-w-none sm:px-4">
                          <span className="block truncate font-semibold text-ink">{fullName(v.client ?? {})}</span>
                          <span className="hidden truncate text-xs text-ink-3 sm:block">{v.client?.email}</span>
                          <span className="block truncate text-xs text-ink-3 sm:hidden">
                            {v.quantite} × {v.produit?.nom}
                          </span>
                        </td>
                        <td className="hidden max-w-[15rem] px-4 sm:table-cell">
                          <span className="block truncate text-ink" title={v.produit?.nom}>{v.produit?.nom}</span>
                          <span className="figures block truncate text-xs text-ink-3">
                            {v.produit?.marque} · {dh(v.produit?.prix ?? 0)}
                          </span>
                        </td>
                        <td className="figures hidden px-4 text-right font-semibold text-ink sm:table-cell">{v.quantite}</td>
                        <td className="figures pr-5 pl-4 text-right font-semibold whitespace-nowrap text-carbon-900">
                          {dh(amountOf(v))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {ventes.isSuccess && rows.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-rule-strong bg-ground/60">
                      <td colSpan={2} className="h-12 pr-4 pl-5 text-sm text-ink-2">
                        {count(rows.length)} {rows.length === 1 ? 'slip' : 'slips'}
                        {query || period !== 'all' ? ' shown' : ''}
                      </td>
                      <td className="hidden sm:table-cell" />
                      <td className="figures hidden px-4 text-right font-semibold text-ink sm:table-cell">{count(totals.units)}</td>
                      <td className="figures pr-5 pl-4 text-right font-bold whitespace-nowrap text-carbon-900">{dh(totals.amount)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {ventes.isSuccess && all.length === 0 && (
                <EmptyState title="The register is empty">
                  Record the first sale with the slip{' '}
                  <span className="hidden xl:inline">on the right</span>
                  <span className="xl:hidden">above</span>. Each sale gets its own number and is filed here.
                </EmptyState>
              )}
              {ventes.isSuccess && all.length > 0 && rows.length === 0 && (
                <EmptyState title="No sales match">
                  {query ? <>Nothing matches “{query}”</> : 'No sales'} {period === '7d' ? 'in the last 7 days' : period === '30d' ? 'in the last 30 days' : ''}.
                </EmptyState>
              )}
            </div>
          )}
          <p className="border-t border-rule px-5 py-3 text-xs text-ink-3">Amounts use each product's current list price.</p>
        </Sheet>
      </div>
    </>
  )
}
