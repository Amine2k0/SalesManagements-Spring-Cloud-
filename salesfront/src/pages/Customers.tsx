import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Pencil, Phone, Plus, ReceiptText, Search, Trash2, X } from 'lucide-react'
import { PageHeader } from '../components/Shell'
import { slipLink } from '../lib/links'
import { EmptyState, FormError, ServiceNotice } from '../components/status'
import { Button, Field, IconButton, Input, Sheet, SheetHeader, SkeletonRows, SortHeader, Th, cx, type SortDir } from '../components/ui'
import { ApiError } from '../lib/api'
import { count, dh, formatDay, fullName, initials, serial } from '../lib/format'
import { useClients, useDeleteClient, useSaveClient, useVentes, useVentesForClient } from '../lib/queries'
import { amountOf, newestFirst, salesByClient } from '../lib/stats'
import type { Client } from '../lib/types'

type SortKey = 'name' | 'sales' | 'total' | 'last'
type Panel = { mode: 'view'; client: Client } | { mode: 'edit'; client: Client } | { mode: 'new' } | null

export function CustomersPage() {
  const [params, setParams] = useSearchParams()
  const clients = useClients()
  const ventes = useVentes()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'name', dir: 'asc' })
  const [panel, setPanel] = useState<Panel>(params.get('new') === '1' ? { mode: 'new' } : null)
  const [savedId, setSavedId] = useState<number | null>(null)

  useEffect(() => {
    if (params.get('new') === '1') {
      setPanel({ mode: 'new' })
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const list = useMemo(() => clients.data ?? [], [clients.data])
  const stats = useMemo(() => salesByClient(ventes.data ?? []), [ventes.data])

  // The open card follows refreshed data; a just-created customer may not be listed until
  // the refetch lands, so it falls back to the record the save returned.
  const panelClient = panel && panel.mode !== 'new' ? (list.find((c) => c.id === panel.client.id) ?? panel.client) : null

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const dir = sort.dir === 'asc' ? 1 : -1
    return list
      .filter((c) => !q || [fullName(c), c.email, c.tel ?? '', serial(c.id)].some((f) => f.toLowerCase().includes(q)))
      .sort((a, b) => {
        const sa = stats.get(a.id)
        const sb = stats.get(b.id)
        const by: Record<SortKey, number> = {
          name: fullName(a).localeCompare(fullName(b)),
          sales: (sa?.count ?? 0) - (sb?.count ?? 0),
          total: (sa?.total ?? 0) - (sb?.total ?? 0),
          last: (sa?.last ?? '').localeCompare(sb?.last ?? ''),
        }
        return by[sort.key] * dir
      })
  }, [list, query, sort, stats])

  function onSort(key: SortKey) {
    setSort((current) => (current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))
  }

  const selectedId = panel && panel.mode !== 'new' ? panel.client.id : null

  return (
    <>
      <PageHeader
        title="Customers"
        meta={clients.isSuccess ? `${count(list.length)} on file` : 'Customer accounts'}
        actions={
          <Button variant="primary" icon={<Plus className="size-4" aria-hidden />} onClick={() => setPanel({ mode: 'new' })}>
            Add customer
          </Button>
        }
      />

      <div className={cx('grid items-start gap-6', panel && 'xl:grid-cols-[minmax(0,1fr)_400px]')}>
        {panel && (
          <div className="xl:sticky xl:top-8 xl:order-2">
            {panel.mode === 'view' && panelClient ? (
              <CustomerCard
                client={panelClient}
                onClose={() => setPanel(null)}
                onEdit={() => setPanel({ mode: 'edit', client: panelClient })}
                onDeleted={() => setPanel(null)}
              />
            ) : (
              <CustomerForm
                key={panel.mode === 'new' ? 'new' : panel.client.id}
                client={panel.mode === 'edit' ? panelClient : null}
                existing={list}
                onClose={() => setPanel(panel.mode === 'edit' && panelClient ? { mode: 'view', client: panelClient } : null)}
                onSaved={(c) => {
                  setSavedId(c.id)
                  setPanel({ mode: 'view', client: c })
                }}
              />
            )}
          </div>
        )}

        <Sheet className="min-w-0 xl:order-1">
          <SheetHeader title="Customer accounts">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <Input
                type="search"
                aria-label="Search customers"
                placeholder="Search name, email, phone"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-9 text-sm"
              />
            </div>
          </SheetHeader>

          {clients.isError ? (
            <ServiceNotice error={clients.error} onRetry={() => clients.refetch()} />
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full sm:min-w-[640px] text-sm">
                <caption className="sr-only">Customers</caption>
                <thead>
                  <tr>
                    <SortHeader label="Customer" sortKey="name" sort={sort} onSort={onSort} />
                    <Th className="hidden lg:table-cell">Phone</Th>
                    <SortHeader label="Sales" sortKey="sales" sort={sort} onSort={onSort} align="right" className="hidden sm:table-cell" />
                    <SortHeader label="Total spent" sortKey="total" sort={sort} onSort={onSort} align="right" />
                    <SortHeader label="Last sale" sortKey="last" sort={sort} onSort={onSort} align="right" className="hidden sm:table-cell" />
                  </tr>
                </thead>
                <tbody>
                  {clients.isPending ? (
                    <SkeletonRows cols={5} />
                  ) : (
                    rows.map((c) => {
                      const s = stats.get(c.id)
                      const selected = selectedId === c.id
                      return (
                        <tr
                          key={c.id}
                          className={cx(
                            'cursor-pointer border-t border-rule transition-colors hover:bg-carbon-50/60',
                            selected && 'bg-canary-tint/60 hover:bg-canary-tint/60',
                            savedId === c.id && 'animate-filed',
                          )}
                          onClick={() => setPanel({ mode: 'view', client: c })}
                        >
                          <td className="h-14 w-full max-w-0 pr-4 pl-5 sm:w-auto sm:max-w-none">
                            <button
                              type="button"
                              className="flex w-full min-w-0 items-center gap-3 text-left"
                              aria-pressed={selected}
                              onClick={(e) => {
                                e.stopPropagation()
                                setPanel({ mode: 'view', client: c })
                              }}
                            >
                              <span
                                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-carbon-100 text-xs font-bold text-carbon-800"
                                aria-hidden
                              >
                                {initials(fullName(c))}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-semibold text-ink">{fullName(c)}</span>
                                <span className="block truncate text-xs text-ink-3">{c.email}</span>
                              </span>
                            </button>
                          </td>
                          <td className="figures hidden px-4 text-ink-2 lg:table-cell">{c.tel || '—'}</td>
                          <td className="figures hidden px-4 text-right text-ink-2 sm:table-cell">{ventes.isSuccess ? count(s?.count ?? 0) : '—'}</td>
                          <td className="figures px-4 text-right font-semibold whitespace-nowrap text-ink">
                            {ventes.isSuccess ? dh(s?.total ?? 0) : '—'}
                          </td>
                          <td className="figures hidden pr-5 pl-4 text-right whitespace-nowrap text-ink-2 sm:table-cell">
                            {s?.last ? formatDay(s.last) : <span className="text-ink-3">No sales</span>}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
              {clients.isSuccess && list.length === 0 && (
                <EmptyState
                  title="No customers yet"
                  action={
                    <Button variant="primary" icon={<Plus className="size-4" aria-hidden />} onClick={() => setPanel({ mode: 'new' })}>
                      Add the first customer
                    </Button>
                  }
                >
                  Every sale is written to a customer account, so add who you sell to before recording sales.
                </EmptyState>
              )}
              {clients.isSuccess && list.length > 0 && rows.length === 0 && (
                <EmptyState title="No customers match">Nothing matches “{query}”.</EmptyState>
              )}
            </div>
          )}
        </Sheet>
      </div>
    </>
  )
}

function CustomerCard({
  client,
  onClose,
  onEdit,
  onDeleted,
}: {
  client: Client
  onClose: () => void
  onEdit: () => void
  onDeleted: () => void
}) {
  const history = useVentesForClient(client.id)
  const remove = useDeleteClient()
  const [confirming, setConfirming] = useState(false)
  const slips = useMemo(() => [...(history.data ?? [])].sort(newestFirst), [history.data])
  const total = slips.reduce((sum, v) => sum + amountOf(v), 0)
  const blocked = history.isSuccess && slips.length > 0

  return (
    <Sheet className="animate-panel">
      <SheetHeader title={fullName(client)}>
        <IconButton label="Close" onClick={onClose}>
          <X className="size-4" aria-hidden />
        </IconButton>
      </SheetHeader>

      <div className="flex flex-col gap-1.5 px-5 pt-4 text-sm">
        <a href={`mailto:${client.email}`} className="inline-flex items-center gap-2 text-ink-2 hover:text-carbon-700">
          <Mail className="size-4 text-ink-3" aria-hidden />
          {client.email}
        </a>
        {client.tel ? (
          <a href={`tel:${client.tel}`} className="figures inline-flex items-center gap-2 text-ink-2 hover:text-carbon-700">
            <Phone className="size-4 text-ink-3" aria-hidden />
            {client.tel}
          </a>
        ) : (
          <span className="inline-flex items-center gap-2 text-ink-3">
            <Phone className="size-4" aria-hidden />
            No phone number
          </span>
        )}
      </div>

      <dl className="mx-5 mt-4 grid grid-cols-2 divide-x divide-rule rounded-md ring-1 ring-rule">
        <div className="px-3 py-2.5">
          <dt className="form-label">Sales</dt>
          <dd className="figures mt-0.5 text-lg font-bold text-carbon-900">{history.isSuccess ? count(slips.length) : '—'}</dd>
        </div>
        <div className="px-3 py-2.5">
          <dt className="form-label">Total spent</dt>
          <dd className="figures mt-0.5 text-lg font-bold text-carbon-900">{history.isSuccess ? dh(total) : '—'}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 px-5 pt-4">
        <Link
          to={slipLink({ client: client.id })}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-carbon-700 px-3 text-[0.8125rem] font-semibold text-white transition-colors hover:bg-carbon-800"
        >
          <ReceiptText className="size-3.5" aria-hidden />
          Record sale
        </Link>
        <Button size="sm" icon={<Pencil className="size-3.5" aria-hidden />} onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="hover:!bg-numero-tint hover:!text-numero" icon={<Trash2 className="size-3.5" aria-hidden />} onClick={() => setConfirming(true)}>
          Delete
        </Button>
      </div>

      {confirming && (
        <div className="mx-5 mt-3 rounded-md bg-numero-tint/70 p-3 text-sm" role="alert">
          {blocked ? (
            <p className="text-ink">
              {fullName(client)} has {slips.length} {slips.length === 1 ? 'sale' : 'sales'} on record, so the account can't be deleted.
            </p>
          ) : remove.error ? (
            <p className="text-numero-deep">
              {remove.error instanceof ApiError && remove.error.unavailable
                ? "Customers didn't respond. Nothing was deleted."
                : "The account couldn't be deleted. It may have sales on record."}
            </p>
          ) : (
            <p className="text-ink">Delete {fullName(client)}'s account? This can't be undone.</p>
          )}
          <div className="mt-2.5 flex gap-2">
            <Button size="sm" onClick={() => setConfirming(false)}>
              {blocked ? 'Close' : 'Cancel'}
            </Button>
            {!blocked && (
              <Button size="sm" variant="danger" busy={remove.isPending} onClick={() => remove.mutate(client.id, { onSuccess: onDeleted })}>
                Delete account
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-rule">
        <h3 className="form-label px-5 pt-4 pb-2">Sales history</h3>
        {history.isError ? (
          <ServiceNotice error={history.error} onRetry={() => history.refetch()} compact />
        ) : history.isPending ? (
          <p className="px-5 pb-5 text-sm text-ink-3">Loading…</p>
        ) : slips.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-ink-2">No sales recorded for this customer yet.</p>
        ) : (
          <ul className="max-h-[22rem] overflow-y-auto pb-2">
            {slips.map((v) => (
              <li key={v.id} className="grid grid-cols-[4.75rem_3px_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-2.5">
                <span className="flex flex-col">
                  <span className="numero text-sm">N° {serial(v.id)}</span>
                  <span className="figures text-xs text-ink-3">{formatDay(v.date)}</span>
                </span>
                <span className="perforation-y h-full" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ink">{v.produit?.nom}</span>
                  <span className="figures block text-xs text-ink-3">× {v.quantite}</span>
                </span>
                <span className="figures text-sm font-semibold whitespace-nowrap text-carbon-900">{dh(amountOf(v))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Sheet>
  )
}

function CustomerForm({
  client,
  existing,
  onClose,
  onSaved,
}: {
  client: Client | null
  existing: Client[]
  onClose: () => void
  onSaved: (c: Client) => void
}) {
  const save = useSaveClient()
  const [prenom, setPrenom] = useState(client?.prenom ?? '')
  const [nom, setNom] = useState(client?.nom ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [tel, setTel] = useState(client?.tel ?? '')
  const [password, setPassword] = useState('')
  const [reveal, setReveal] = useState(false)
  const [touched, setTouched] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => firstRef.current?.focus(), [])

  const emailTaken = existing.some((c) => c.id !== client?.id && c.email.toLowerCase() === email.trim().toLowerCase())
  const errors = {
    prenom: !prenom.trim() ? 'Enter the first name.' : prenom.length > 100 ? 'Keep it under 100 characters.' : null,
    nom: !nom.trim() ? 'Enter the last name.' : nom.length > 100 ? 'Keep it under 100 characters.' : null,
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? 'Enter an email address like name@example.com.'
      : emailTaken
        ? 'Another customer already uses this email.'
        : null,
    tel: tel.trim().length > 15 ? 'Use at most 15 characters.' : null,
    password:
      !client && password.length < 6
        ? 'Set a password of at least 6 characters.'
        : client && password && password.length < 6
          ? 'Use at least 6 characters, or leave it blank.'
          : null,
  }
  const valid = Object.values(errors).every((e) => !e)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!valid) return
    try {
      const saved = await save.mutateAsync({
        id: client?.id,
        input: { prenom: prenom.trim(), nom: nom.trim(), email: email.trim(), tel, password: password || undefined },
      })
      onSaved(saved)
    } catch {
      // Rendered from save.error.
    }
  }

  return (
    <Sheet className="animate-panel">
      <SheetHeader title={client ? `Edit ${fullName(client)}` : 'New customer'}>
        <IconButton label="Close" onClick={onClose}>
          <X className="size-4" aria-hidden />
        </IconButton>
      </SheetHeader>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={touched ? errors.prenom : null}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} ref={firstRef} aria-describedby={describedBy} aria-invalid={invalid} value={prenom} onChange={(e) => setPrenom(e.target.value)} autoComplete="off" />
            )}
          </Field>
          <Field label="Last name" error={touched ? errors.nom : null}>
            {({ id, describedBy, invalid }) => (
              <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="off" />
            )}
          </Field>
        </div>
        <Field label="Email" error={touched || emailTaken ? errors.email : null}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} type="email" aria-describedby={describedBy} aria-invalid={invalid} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="off" />
          )}
        </Field>
        <Field label="Phone" hint="Optional" error={touched ? errors.tel : null}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} type="tel" aria-describedby={describedBy} aria-invalid={invalid} value={tel} onChange={(e) => setTel(e.target.value)} placeholder="06 12 34 56 78" className="figures" autoComplete="off" />
          )}
        </Field>
        <Field
          label={client ? 'New password' : 'Account password'}
          hint={client ? 'Leave blank to keep the current password.' : 'At least 6 characters.'}
          error={touched ? errors.password : null}
        >
          {({ id, describedBy, invalid }) => (
            <div className="relative">
              <Input
                id={id}
                type={reveal ? 'text' : 'password'}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <IconButton label={reveal ? 'Hide password' : 'Show password'} className="absolute top-1 right-1" onClick={() => setReveal((r) => !r)}>
                {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </IconButton>
            </div>
          )}
        </Field>
        {save.error && (
          <FormError>
            {save.error instanceof ApiError && save.error.unavailable
              ? "Customers didn't respond, so nothing was saved. Try again in a moment."
              : client && !password
                ? "The changes weren't saved. If this keeps happening, set a new password and save again."
                : `The customer wasn't saved: ${save.error.message}`}
          </FormError>
        )}
        <div className="flex gap-2 pt-1">
          <Button type="submit" variant="primary" busy={save.isPending} className="flex-1">
            {client ? 'Save changes' : 'Add customer'}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Sheet>
  )
}
