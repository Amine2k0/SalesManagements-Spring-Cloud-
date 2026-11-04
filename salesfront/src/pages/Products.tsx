import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Pencil, Plus, ReceiptText, Search, Trash2, X } from 'lucide-react'
import { PageHeader } from '../components/Shell'
import { slipLink } from '../lib/links'
import { EmptyState, FormError, ServiceNotice, StockBadge } from '../components/status'
import {
  Button,
  Field,
  IconButton,
  Input,
  Segmented,
  Sheet,
  SheetHeader,
  SkeletonRows,
  SortHeader,
  Th,
  cx,
  type SortDir,
} from '../components/ui'
import { ApiError } from '../lib/api'
import { count, dh, serial } from '../lib/format'
import { useDeleteProduit, useProduits, useSaveProduit, useVentes } from '../lib/queries'
import { salesByProduct, stockLevel } from '../lib/stats'
import type { Produit } from '../lib/types'

type Filter = 'all' | 'low' | 'out'
type SortKey = 'nom' | 'prix' | 'stock' | 'sold'

export function ProductsPage() {
  const [params, setParams] = useSearchParams()
  const produits = useProduits()
  const ventes = useVentes()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'nom', dir: 'asc' })
  const [editing, setEditing] = useState<Produit | 'new' | null>(params.get('new') === '1' ? 'new' : null)
  const [confirming, setConfirming] = useState<number | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)

  useEffect(() => {
    if (params.get('new') === '1') {
      setEditing('new')
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const list = useMemo(() => produits.data ?? [], [produits.data])
  const sold = useMemo(() => salesByProduct(ventes.data ?? []), [ventes.data])
  const counts = useMemo(
    () => ({
      all: list.length,
      low: list.filter((p) => stockLevel(p.qteStock) === 'low').length,
      out: list.filter((p) => stockLevel(p.qteStock) === 'out').length,
    }),
    [list],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const dir = sort.dir === 'asc' ? 1 : -1
    return list
      .filter((p) => filter === 'all' || stockLevel(p.qteStock) === filter)
      .filter((p) => !q || p.nom.toLowerCase().includes(q) || p.marque.toLowerCase().includes(q) || serial(p.id).includes(q))
      .sort((a, b) => {
        const by: Record<SortKey, number> = {
          nom: a.nom.localeCompare(b.nom),
          prix: a.prix - b.prix,
          stock: a.qteStock - b.qteStock,
          sold: (sold.get(a.id)?.units ?? 0) - (sold.get(b.id)?.units ?? 0),
        }
        return by[sort.key] * dir
      })
  }, [list, filter, query, sort, sold])

  function onSort(key: SortKey) {
    setSort((current) => (current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'nom' ? 'asc' : 'desc' }))
  }

  const panelOpen = editing !== null

  return (
    <>
      <PageHeader
        title="Products"
        meta={produits.isSuccess ? `${count(list.length)} in the catalogue` : 'The catalogue'}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing('new')}>
            Add product
          </Button>
        }
      />

      <div className={cx('grid items-start gap-6', panelOpen && 'xl:grid-cols-[minmax(0,1fr)_380px]')}>
        {panelOpen && (
          <div className="xl:sticky xl:top-8 xl:order-2">
            <ProductForm
              key={editing === 'new' ? 'new' : editing.id}
              produit={editing === 'new' ? null : editing}
              onClose={() => setEditing(null)}
              onSaved={(p) => {
                setSavedId(p.id)
                setEditing(null)
              }}
            />
          </div>
        )}

        <Sheet className="min-w-0 xl:order-1">
          <SheetHeader title="Catalogue">
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-60">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
                <Input
                  type="search"
                  aria-label="Search products"
                  placeholder="Search name or brand"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <Segmented
                label="Stock"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: 'All', count: counts.all },
                  { value: 'low', label: 'Low', count: counts.low },
                  { value: 'out', label: 'Out', count: counts.out },
                ]}
              />
            </div>
          </SheetHeader>

          {produits.isError ? (
            <ServiceNotice error={produits.error} onRetry={() => produits.refetch()} />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full sm:min-w-[680px] text-sm">
                <caption className="sr-only">Products</caption>
                <thead>
                  <tr>
                    <Th className="hidden w-20 sm:table-cell">Ref</Th>
                    <SortHeader label="Product" sortKey="nom" sort={sort} onSort={onSort} />
                    <SortHeader label="Price" sortKey="prix" sort={sort} onSort={onSort} align="right" />
                    <SortHeader label="Stock" sortKey="stock" sort={sort} onSort={onSort} className="hidden sm:table-cell" />
                    <SortHeader label="Sold" sortKey="sold" sort={sort} onSort={onSort} align="right" className="hidden sm:table-cell" />
                    <Th align="right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {produits.isPending ? (
                    <SkeletonRows cols={6} />
                  ) : (
                    rows.map((p) =>
                      confirming === p.id ? (
                        <DeleteRow
                          key={p.id}
                          produit={p}
                          salesCount={ventes.isSuccess ? (sold.get(p.id)?.count ?? 0) : null}
                          onDone={() => setConfirming(null)}
                        />
                      ) : (
                        <tr
                          key={p.id}
                          className={cx(
                            'group border-t border-rule transition-colors hover:bg-carbon-50/60',
                            editing !== 'new' && editing?.id === p.id && 'bg-canary-tint/60',
                            savedId === p.id && 'animate-filed',
                          )}
                        >
                          <td className="figures hidden h-14 pr-4 pl-5 text-ink-3 sm:table-cell">#{serial(p.id)}</td>
                          <td className="h-16 px-4 sm:h-14">
                            <span className="block font-semibold text-ink sm:whitespace-nowrap">{p.nom}</span>
                            <span className="block text-xs text-ink-3 sm:whitespace-nowrap">{p.marque}</span>
                            <StockBadge qte={p.qteStock} className="mt-1 text-xs sm:hidden" />
                          </td>
                          <td className="figures px-4 text-right font-semibold whitespace-nowrap text-ink">{dh(p.prix)}</td>
                          <td className="hidden px-4 sm:table-cell">
                            <StockBadge qte={p.qteStock} />
                          </td>
                          <td className="figures hidden px-4 text-right text-ink-2 sm:table-cell">
                            {ventes.isSuccess ? count(sold.get(p.id)?.units ?? 0) : '—'}
                          </td>
                          <td className="pr-3 pl-2">
                            <div className="flex justify-end gap-0.5">
                              <Link
                                to={slipLink({ product: p.id })}
                                aria-label={`Record a sale of ${p.nom}`}
                                title="Record a sale"
                                className="hidden size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-carbon-50 hover:text-carbon-700 sm:inline-flex"
                              >
                                <ReceiptText className="size-4" aria-hidden />
                              </Link>
                              <IconButton label={`Edit ${p.nom}`} onClick={() => setEditing(p)}>
                                <Pencil className="size-4" aria-hidden />
                              </IconButton>
                              <IconButton label={`Delete ${p.nom}`} tone="danger" onClick={() => setConfirming(p.id)}>
                                <Trash2 className="size-4" aria-hidden />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      ),
                    )
                  )}
                </tbody>
              </table>
              {produits.isSuccess && list.length === 0 && (
                <EmptyState
                  title="No products yet"
                  action={
                    <Button variant="primary" icon={<Plus className="size-4" aria-hidden />} onClick={() => setEditing('new')}>
                      Add the first product
                    </Button>
                  }
                >
                  Add what you sell, with its brand, price and the stock you hold. Products appear on sales slips once added.
                </EmptyState>
              )}
              {produits.isSuccess && list.length > 0 && rows.length === 0 && (
                <EmptyState title="No products match">
                  {filter === 'low' ? 'No product is running low.' : filter === 'out' ? 'Nothing is out of stock.' : `Nothing matches “${query}”.`}
                </EmptyState>
              )}
            </div>
          )}
        </Sheet>
      </div>
    </>
  )
}

function DeleteRow({ produit, salesCount, onDone }: { produit: Produit; salesCount: number | null; onDone: () => void }) {
  const remove = useDeleteProduit()
  const blocked = salesCount !== null && salesCount > 0
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => cancelRef.current?.focus(), [])

  return (
    <tr className="border-t border-rule bg-numero-tint/50">
      <td colSpan={6} className="px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3" role="alert">
          <p className="text-sm text-ink">
            {blocked ? (
              <>
                <strong className="font-semibold">{produit.nom}</strong> is on {salesCount} {salesCount === 1 ? 'sale' : 'sales'}, so it
                can't be deleted. Set its stock to 0 to stop selling it.
              </>
            ) : remove.error ? (
              <span className="text-numero-deep">
                {remove.error instanceof ApiError && remove.error.unavailable
                  ? "Products didn't respond. Nothing was deleted."
                  : `${produit.nom} couldn't be deleted. It may be on a sale.`}
              </span>
            ) : (
              <>
                Delete <strong className="font-semibold">{produit.nom}</strong> ({produit.marque})? This can't be undone.
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button ref={cancelRef} size="sm" onClick={onDone}>
              {blocked ? 'Close' : 'Cancel'}
            </Button>
            {!blocked && (
              <Button
                size="sm"
                variant="danger"
                busy={remove.isPending}
                onClick={() => remove.mutate(produit.id, { onSuccess: onDone })}
              >
                Delete product
              </Button>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

function ProductForm({
  produit,
  onClose,
  onSaved,
}: {
  produit: Produit | null
  onClose: () => void
  onSaved: (p: Produit) => void
}) {
  const save = useSaveProduit()
  const [nom, setNom] = useState(produit?.nom ?? '')
  const [marque, setMarque] = useState(produit?.marque ?? '')
  const [prix, setPrix] = useState(produit ? String(produit.prix) : '')
  const [stock, setStock] = useState(produit ? String(produit.qteStock) : '')
  const [touched, setTouched] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => firstRef.current?.focus(), [])

  const price = Number(prix.replace(',', '.').replace(/\s/g, ''))
  const qte = Number(stock)
  const errors = {
    nom: !nom.trim() ? 'Enter the product name.' : null,
    marque: !marque.trim() ? 'Enter the brand.' : null,
    prix: prix.trim() === '' || !Number.isFinite(price) || price < 0 ? 'Enter a price of 0 or more, like 249.90.' : null,
    stock: stock.trim() === '' || !Number.isInteger(qte) || qte < 0 ? 'Enter a whole number of units, 0 or more.' : null,
  }
  const valid = Object.values(errors).every((e) => !e)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!valid) return
    try {
      const saved = await save.mutateAsync({
        id: produit?.id,
        input: { nom: nom.trim(), marque: marque.trim(), prix: Math.round(price * 100) / 100, qteStock: qte },
      })
      onSaved(saved)
    } catch {
      // Rendered from save.error.
    }
  }

  return (
    <Sheet className="animate-panel">
      <SheetHeader title={produit ? `Edit ${produit.nom}` : 'New product'}>
        <IconButton label="Close" onClick={onClose}>
          <X className="size-4" aria-hidden />
        </IconButton>
      </SheetHeader>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-5">
        <Field label="Name" error={touched ? errors.nom : null}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              ref={firstRef}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="e.g. Laptop 14 inch"
              autoComplete="off"
            />
          )}
        </Field>
        <Field label="Brand" error={touched ? errors.marque : null}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={marque}
              onChange={(e) => setMarque(e.target.value)}
              placeholder="e.g. Dell"
              autoComplete="off"
            />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (DH)" error={touched ? errors.prix : null}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                inputMode="decimal"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                placeholder="0.00"
                className="figures text-right"
              />
            )}
          </Field>
          <Field label="In stock" error={touched ? errors.stock : null}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                inputMode="numeric"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="figures text-right"
              />
            )}
          </Field>
        </div>
        {save.error && (
          <FormError>
            {save.error instanceof ApiError && save.error.unavailable
              ? "Products didn't respond, so nothing was saved. Try again in a moment."
              : `The product wasn't saved: ${save.error.message}`}
          </FormError>
        )}
        <div className="flex gap-2 pt-1">
          <Button type="submit" variant="primary" busy={save.isPending} className="flex-1">
            {produit ? 'Save changes' : 'Add product'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Sheet>
  )
}
