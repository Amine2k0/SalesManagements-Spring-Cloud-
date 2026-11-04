# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript + Tailwind CSS, in `salesfront/`, dev server on port 4200 (the
gateway's CORS default, `CORS_ORIGINS=http://localhost:4200`). Talks only to the API gateway
at `http://localhost:8989`.

## Users

Portfolio / school project. The primary audience is the people the project is demonstrated
to: teachers, juries and recruiters evaluating a Spring Cloud microservices backend. They see
it in a live demo or a short walkthrough, usually driven by the author, and judge it in the
first minutes. The secondary user is the author running that demo: registering, logging in,
creating products, customers and sales in front of an audience without anything breaking.

Confirmed by the user: it must not read as a project built only for a jury or an interviewer.
It must look and behave like a real, shipping sales application.

## Product Purpose

A sales management console over a microservices backend: manage a product catalogue
(produits), a customer base (clients), and record sales (ventes) that link a customer to a
product with a quantity and date. Success means the demo runs the whole flow end to end,
reads as a credible, real professional tool.

## Positioning

A real sales application whose backend happens to be a Spring Cloud system: four Spring Boot
services behind a Spring Cloud Gateway, discovered through Consul, with JWT auth. The
architecture is not showcased in the UI. It surfaces only where a real product would surface
it: honest, specific messages when one area's service is unavailable while the others keep
working (products from MicroService1, customers from MicroService2, sales from MicroService3,
auth from MicroServiceAuth).

## Operating Context

- Demonstrated on a laptop, often projected or screen-shared; desktop first, must still work
  on a narrow window or phone.
- Backend started locally: `docker compose up -d` for MySQL + Consul, then the five services.
- Data starts empty or near-empty, so first-run and empty states are part of every demo.

## Capabilities and Constraints

API (all through the gateway, `:8989`):

- Auth: `POST /api/auth/register` (201, 409 if taken), `POST /api/auth/login` (200 `{jwt,
  message}`, 401), `GET /api/auth/me` (`{username}` with a Bearer token). HS256, 10h expiry.
- Products: `GET /api/produits`, `GET/PUT/DELETE /api/produits/{id}`, `POST
  /api/produits/add`, `DELETE /api/produits/vider`. Fields: `id, nom, marque, prix,
  qteStock`.
- Customers: `GET /api/clients`, `GET/PUT/DELETE /api/clients/{id}`, `POST /api/clients/add`.
  Fields: `id, nom, prenom, tel, email` (+ write-only `password`, required; email unique).
- Sales: `GET /api/ventes`, `GET /api/ventes/client/{clientId}`, `POST /api/ventes/add` with
  `{client:{id}, produit:{id}, quantite}`; date defaults to now. No update or delete.

Known backend limits the UI must respect, not paper over:

- Only auth checks the token; the domain services accept anonymous calls. The UI still gates
  its screens behind login.
- Recording a sale does not decrement `qteStock`.
- The create-sale response returns client and product with only ids; re-fetch for details.
- Deleting a customer or product that has sales fails on a foreign key.
- No server-side validation; bad input surfaces as a raw 500.

Terminology: UI is in English (Products, Customers, Sales); API field names stay French.

## Brand Commitments

No existing name, logo or brand. Prices are Moroccan dirham (MAD, shown as DH).

## Evidence on Hand

No real customers, sales figures, testimonials or screenshots exist. Any numbers shown must
come from the live API, never invented.

## Product Principles

1. Every number on screen is real API data; empty is shown as empty, never faked.
2. The demo path (register → login → add product → add customer → record sale) must be
   obvious and fail-safe, with clear errors when a service is down.
3. A real product, not a showcase: no demo banners, architecture diagrams or "built with"
   badges; partial outages degrade one area, never the whole app.
4. Read as a professional operational tool, not a template: not a generic admin kit, not
   flashy, not a bare spreadsheet.
