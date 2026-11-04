import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Minus, Plus, ReceiptText } from 'lucide-react'
import { ApiError } from '../lib/api'
import { dayKey, dh, formatDay, fullName, serial } from '../lib/format'
import { useClients, useProduits, useRecordVente } from '../lib/queries'
import { stockLevel } from '../lib/stats'
import type { Vente } from '../lib/types'
import { FormError } from './status'
import { Button, Field, Select } from './ui'

interface SlipProps {
  initialClientId?: number | null
  initialProduitId?: number | null
  autoFocus?: boolean
  onRecorded?: (vente: Vente) => void
}

/**
 * The yellow copy of a sales slip. It fills in as the fields change; recording it stamps the
 * slip, prints its number, and files the stub into the register.
 */
export function Slip({ initialClientId = null, initialProduitId = null, autoFocus = false, onRecorded }: SlipProps) {
  const clients = useClients()
  const produits = useProduits()
  const record = useRecordVente()

  const [clientId, setClientId] = useState<string>(initialClientId ? String(initialClientId) : '')
  const [produitId, setProduitId] = useState<string>(initialProduitId ? String(initialProduitId) : '')
  const [quantite, setQuantite] = useState('1')
  const [date, setDate] = useState(() => dayKey(new Date()))
  const [touched, setTouched] = useState(false)
  const [recorded, setRecorded] = useState<Vente | null>(null)
  const customerRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (autoFocus) customerRef.current?.focus()
  }, [autoFocus])

  const sortedClients = useMemo(
    () => [...(clients.data ?? [])].sort((a, b) => fullName(a).localeCompare(fullName(b))),
    [clients.data],
  )
  const sortedProduits = useMemo(
    () => [...(produits.data ?? [])].sort((a, b) => a.nom.localeCompare(b.nom)),
    [produits.data],
  )

  const client = sortedClients.find((c) => String(c.id) === clientId) ?? null
  const produit = sortedProduits.find((p) => String(p.id) === produitId) ?? null
  const qty = Number.parseInt(quantite, 10)
  const qtyValid = Number.isInteger(qty) && qty >= 1
  const total = produit && qtyValid ? produit.prix * qty : 0
  const overStock = produit && qtyValid && qty > produit.qteStock

  const errors = {
    client: !client ? 'Choose the customer this sale is for.' : null,
    produit: !produit ? 'Choose the product sold.' : null,
    quantite: !qtyValid ? 'Enter a quantity of at least 1.' : null,
    date: !date ? 'Enter the date of the sale.' : null,
  }
  const valid = !errors.client && !errors.produit && !errors.quantite && !errors.date
  const locked = recorded !== null

  function step(delta: number) {
    const next = Math.max(1, (qtyValid ? qty : 0) + delta)
    setQuantite(String(next))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!valid || !client || !produit) return
    try {
      const vente = await record.mutateAsync({
        client: { id: client.id },
        produit: { id: produit.id },
        quantite: qty,
        date,
      })
      // The service echoes the references by id only; keep the details this slip already shows.
      const filed: Vente = { ...vente, client, produit, date }
      setRecorded(filed)
      onRecorded?.(filed)
    } catch {
      // Shown below from record.error.
    }
  }

  function startNew() {
    setRecorded(null)
    setProduitId('')
    setQuantite('1')
    setTouched(false)
    record.reset()
    requestAnimationFrame(() => customerRef.current?.focus())
  }

  const noClients = clients.isSuccess && sortedClients.length === 0
  const noProduits = produits.isSuccess && sortedProduits.length === 0
  const saveError = record.error
  const loadError = clients.error ?? produits.error

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby="slip-title"
      className="relative overflow-hidden rounded-lg bg-canary-tint ring-1 ring-[#e9d98f]"
    >
      {/* The stub: what stays in the book. */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 id="slip-title" className="flex items-center gap-2 font-semibold text-canary-ink" style={{ fontStretch: '92%' }}>
          <ReceiptText className="size-4" aria-hidden />
          Sales slip
        </h2>
        <p className="text-sm text-canary-ink/80" aria-live="polite">
          {recorded ? (
            <span className="numero animate-numero text-base" key={recorded.id}>
              N° {serial(recorded.id)}
            </span>
          ) : (
            <span className="numero text-base opacity-35" aria-label="Number assigned when recorded">
              N° ····
            </span>
          )}
        </p>
      </div>
      <div className="relative">
        <div className="perforation-x mx-0" />
        <span className="absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full bg-ground ring-1 ring-[#e9d98f]" aria-hidden />
        <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full bg-ground ring-1 ring-[#e9d98f]" aria-hidden />
      </div>

      <fieldset disabled={locked} className="flex flex-col gap-4 px-5 pt-4 pb-5">
        {loadError ? (
          <FormError>
            {loadError instanceof ApiError && loadError.area === 'customers'
              ? 'Customers are unavailable, so a sale cannot be written right now.'
              : 'Products are unavailable, so a sale cannot be written right now.'}
          </FormError>
        ) : null}

        <Field
          label="Customer"
          error={touched ? errors.client : null}
          hint={
            noClients ? (
              <>
                No customers yet. <Link to="/customers?new=1" className="font-semibold text-carbon-700 underline">Add a customer</Link> first.
              </>
            ) : undefined
          }
        >
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              ref={customerRef}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={clients.isPending || noClients}
            >
              <option value="">{clients.isPending ? 'Loading customers…' : 'Select a customer'}</option>
              {sortedClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {fullName(c)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label="Product"
          error={touched ? errors.produit : null}
          hint={
            noProduits ? (
              <>
                No products yet. <Link to="/products?new=1" className="font-semibold text-carbon-700 underline">Add a product</Link> first.
              </>
            ) : produit ? (
              <>
                {produit.marque} ·{' '}
                <span className={stockLevel(produit.qteStock) === 'ok' ? '' : 'font-semibold text-numero-deep'}>
                  {stockLevel(produit.qteStock) === 'out' ? 'out of stock' : `${produit.qteStock} in stock`}
                </span>
              </>
            ) : undefined
          }
        >
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              value={produitId}
              onChange={(e) => setProduitId(e.target.value)}
              disabled={produits.isPending || noProduits}
            >
              <option value="">{produits.isPending ? 'Loading products…' : 'Select a product'}</option>
              {sortedProduits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} · {dh(p.prix)}
                  {stockLevel(p.qteStock) === 'out' ? ' (out of stock)' : ''}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3">
          <Field label="Quantity" error={touched ? errors.quantite : null}>
            {({ id, describedBy, invalid }) => (
              <div className="flex h-10 items-stretch rounded-md bg-sheet ring-1 ring-inset ring-rule-strong focus-within:ring-2 focus-within:ring-carbon-600">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => step(-1)}
                  className="w-9 shrink-0 rounded-l-md text-ink-3 hover:bg-carbon-50 hover:text-carbon-700 disabled:opacity-40"
                  disabled={qtyValid && qty <= 1}
                >
                  <Minus className="mx-auto size-4" aria-hidden />
                </button>
                <input
                  id={id}
                  inputMode="numeric"
                  type="number"
                  min={1}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  className="figures w-full min-w-0 bg-transparent text-center font-semibold text-carbon-900 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => step(1)}
                  className="w-9 shrink-0 rounded-r-md text-ink-3 hover:bg-carbon-50 hover:text-carbon-700"
                >
                  <Plus className="mx-auto size-4" aria-hidden />
                </button>
              </div>
            )}
          </Field>
          <Field label="Date" error={touched ? errors.date : null}>
            {({ id, describedBy, invalid }) => (
              // The visible value is written the way the slip writes dates (4 Nov 2026); the
              // native date input sits on top, invisible, so clicks and keys still reach it.
              <div className="relative flex h-10 items-center justify-between gap-2 rounded-md bg-sheet px-3 ring-1 ring-inset ring-rule-strong transition-shadow focus-within:ring-2 focus-within:ring-carbon-600 hover:ring-carbon-300 has-[:disabled]:bg-ground">
                <span className="figures truncate text-[0.9375rem] text-ink" aria-hidden>
                  {date ? formatDay(date) : 'Choose a date'}
                </span>
                <CalendarDays className="size-4 shrink-0 text-ink-3" aria-hidden />
                <input
                  id={id}
                  type="date"
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </Field>
        </div>

        {/* The slip body, written in carbon ink as the fields change. */}
        <div className="relative rounded-md bg-sheet/70 ring-1 ring-[#eee2a8]">
          <table className="w-full text-sm">
            <caption className="sr-only">Slip preview</caption>
            <thead>
              <tr className="border-b border-[#efe4b0]">
                <th scope="col" className="form-label px-3 py-2 text-left">Item</th>
                <th scope="col" className="form-label px-2 py-2 text-right">Qty</th>
                <th scope="col" className="form-label px-3 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2.5 align-top">
                  {produit ? (
                    <>
                      <span className="block font-semibold text-carbon-900">{produit.nom}</span>
                      <span className="figures block text-xs text-ink-2">
                        {produit.marque} · {dh(produit.prix)} each
                      </span>
                    </>
                  ) : (
                    <span className="text-ink-3">—</span>
                  )}
                </td>
                <td className="figures px-2 py-2.5 text-right align-top font-semibold text-carbon-900">
                  {produit && qtyValid ? qty : <span className="text-ink-3">—</span>}
                </td>
                <td className="figures px-3 py-2.5 text-right align-top font-semibold text-carbon-900">
                  {produit && qtyValid ? dh(total) : <span className="text-ink-3">—</span>}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="flex items-end justify-between gap-3 border-t border-[#efe4b0] px-3 py-3">
            <div className="min-w-0">
              <span className="form-label block">Total</span>
              <span className="block truncate text-xs text-ink-2">
                {client ? fullName(client) : 'No customer'} · {date ? formatDay(date) : 'No date'}
              </span>
            </div>
            <span
              className="figures text-[1.625rem] leading-none font-bold text-carbon-900"
              style={{ fontStretch: '92%' }}
            >
              {dh(total)}
            </span>
          </div>
          {locked && (
            <div
              key={recorded.id}
              aria-hidden
              className="animate-stamp pointer-events-none absolute top-[40%] left-[68%] rounded-sm border-[3px] border-carbon-700/80 px-4 py-1.5 text-carbon-700/90 mix-blend-multiply"
              style={{ transform: 'translate(-50%, -50%) rotate(-9deg)' }}
            >
              <span className="block text-center text-[1.625rem] leading-none font-extrabold tracking-[0.14em]" style={{ fontStretch: '80%' }}>
                RECORDED
              </span>
              <span className="figures mt-1 block border-t-2 border-carbon-700/70 pt-1 text-center text-xs font-bold tracking-[0.18em]">
                {formatDay(recorded.date).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {overStock && !locked && (
          <p className="rounded-md bg-pink-tint px-3 py-2 text-[0.8125rem] text-pink-ink">
            Only {produit!.qteStock} in stock. The sale can still be recorded, but stock on hand won't cover it.
          </p>
        )}

        {saveError && !locked && (
          <FormError>
            {saveError instanceof ApiError && saveError.unavailable
              ? "Sales didn't respond, so this slip wasn't recorded. Try again in a moment."
              : `This slip wasn't recorded: ${saveError.message}`}
          </FormError>
        )}

        {!locked && (
          <Button type="submit" variant="primary" busy={record.isPending} className="w-full">
            Record sale
          </Button>
        )}
      </fieldset>

      {locked && (
        <div className="flex flex-col gap-2 px-5 pb-5">
          <p className="text-sm text-canary-ink" role="status">
            Filed in the register as N° {serial(recorded.id)}.
          </p>
          <Button variant="secondary" onClick={startNew} className="w-full">
            Start a new slip
          </Button>
        </div>
      )}

    </form>
  )
}

