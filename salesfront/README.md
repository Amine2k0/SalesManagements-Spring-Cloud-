# Carnet — sales frontend

The React client for the Sales Management backend: sign in, keep the product catalogue and
customer accounts, and record sales on numbered slips. Every figure on screen comes from the
API; nothing is mocked.

Vite · React 19 · TypeScript · Tailwind CSS v4 · TanStack Query · React Router · Lucide icons ·
Archivo (self-hosted through `@fontsource-variable/archivo`).

## Running it

The backend must be up first (see the root README: `docker compose up -d`, then the five
Spring services). Then:

```bash
cd salesfront
npm install
npm run dev        # http://localhost:4200
```

The dev server listens on port 4200 and proxies `/api/*` to the gateway on
`http://localhost:8989`, so the browser never makes a cross-origin call. Point it at another
gateway with `GATEWAY_URL=http://host:port npm run dev`.

Production build:

```bash
npm run build      # type-checks, then writes dist/
npm run preview    # serves dist/ on :4200 with the same /api proxy
```

To serve `dist/` from elsewhere and call the gateway directly, build with
`VITE_API_URL=http://localhost:8989` and make sure that origin is in the gateway's
`CORS_ORIGINS`.

## Screens

| Route | What it does |
| --- | --- |
| `/signin`, `/register` | Account access against `MicroServiceAuth`. The JWT is kept in `localStorage`, checked with `/api/auth/me` on load, and the session ends when the token expires. |
| `/` | Overview: revenue, sales, units and customers served for 7 days / 30 days / 12 months, takings per day or month, latest slips, stock to watch, top products. A setup checklist shows until the first sale. |
| `/sales` | The register (search, period filter, sortable) and the sales slip used to record a sale. The slip fills in as you pick a customer, product and quantity; on save it is stamped, gets its number, and its row is filed at the top of the register. |
| `/products` | Catalogue with stock filters (all / low ≤ 5 / out), add and edit in a side panel, delete with confirmation. |
| `/customers` | Customer accounts with sales count, total spent and last sale; a card per customer with their sales history. |

Each area loads from its own service through the gateway. If one service is down, only that
area shows an "unavailable" notice with a retry; the rest of the app keeps working.

## Behaviour that follows the backend

- **Amounts use current list prices.** A sale stores only product, quantity and date, so its
  amount is computed from the product's price today. The UI says so where totals appear.
- **Recording a sale does not change stock.** The sales service does not decrement
  `qteStock`; the slip warns when a quantity exceeds stock on hand but still records it.
- **Sales keep the day, not the time.** The sales service stores a `DATE` column.
- **Products and customers with sales can't be deleted** (foreign keys from `vente`). The UI
  checks first and explains instead of letting the request fail.
- **Editing a customer without a new password** relies on `MicroService2` keeping the stored
  password when the update omits it (see `ClientController.updateClient`).

## Layout

```
src/
  main.tsx            providers: React Query, router, auth
  App.tsx             routes and the signed-in guard
  index.css           Tailwind theme tokens, base styles, the stamp motion
  lib/                api client, auth context, queries, formatting, derived stats
  components/         app shell, form controls, status and empty states, the sales slip
  pages/              Auth, Overview, Sales, Products, Customers
```

The product name lives in one constant, `APP_NAME` in `src/components/brand.tsx`.
