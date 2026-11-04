---
version: 1
slug: "salesfront-src-app-tsx"
primary_target: "salesfront/src/App.tsx"
related_targets: []
---

# Surface: Carnet sales app (salesfront)

Scope: the whole React app in `salesfront/`: sign-in/register, Overview, Sales, Products,
Customers. Visitor mode: Operate.

Audience and job: shop staff or a manager keeping the sales book; in practice demonstrated to
a jury or interviewer, but it must read as a real shipping product. Task path: sign in, add a
product, add a customer, record a sale, read takings and stock. Constraints: every figure from
the live API; per-area outage messages; backend limits listed in PRODUCT.md.

## Direction contract

THESIS: Carnet treats every sale as a numbered slip in the shop's duplicate book: recording a sale writes a slip and files its stub into the register. It refuses the category default of a sidebar, identical KPI cards and a line chart.

OWN-WORLD: The carnet à souches. White sheet surfaces on a cool grey ground, a carbon-blue rail and ink for navigation, primary actions and entered values, numbering-machine red for slip and record numbers and destructive states, canary copy for the slip being written and selection, pink copy for low stock. Archivo throughout: semi-condensed caps for printed field labels, tabular figures for every amount. A perforated rule separates stub from slip. Flat colour and hairlines; no gradients, no soft card shadows.

STORY: The visitor sees a working shop book: takings, latest slips, stock to watch. They add a product and a customer, record a sale on a canary slip, watch it stamped and filed, and trust that every figure is real.

FIRST VIEWPORT: Overview at 1440: carbon-blue rail 240px left (Carnet wordmark, Overview, Sales, Products, Customers; user and sign out at the foot). Main: title "Overview" with today's date, primary "Record sale" top right. A ruled totals strip (revenue in DH largest, then sales, units, customers) like an invoice totals line. Below, left two thirds: daily takings for the last 14 days as columns on a ruled axis; right third: the six latest slips as stubs (red N°, customer, amount). Then stock to watch and top products ranked on one bar ramp.

FORM: Duplicate receipt book (carnet à souches), rank 1 of my 7, chosen by the user as the pick over assigned rank 3; seed key d81c7e1e. Signature interaction: the record-sale slip fills live as fields change; on save a carbon-blue RECORDED stamp lands once (ease-out, about 300ms) and the stub files into the top of the register. All other motion is instant or a short fade; reduced motion drops the stamp travel.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Product name "Carnet" is authored, not a user commitment; rename freely.
