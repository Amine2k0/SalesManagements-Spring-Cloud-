---
name: Carnet
description: The sales book for a shop, drawn from the carbon-copy receipt book.
colors:
  carbon-ink: "#24418f"
  carbon-ink-deep: "#1d3579"
  carbon-cover: "#172b66"
  carbon-night: "#0e1a40"
  carbon-bright: "#2f52ae"
  carbon-haze: "#9db0e3"
  carbon-mist: "#c5d1f0"
  carbon-wash: "#e4e9f7"
  carbon-whisper: "#f2f4fb"
  numero-red: "#c0392b"
  numero-red-deep: "#9a2a1f"
  numero-tint: "#fbeae7"
  canary-copy: "#f6e27f"
  canary-tint: "#fcf5d2"
  canary-ink: "#574500"
  pink-copy: "#f2b8c6"
  pink-tint: "#fce8ee"
  pink-ink: "#7a2440"
  ground: "#f3f4f7"
  sheet: "#ffffff"
  ink: "#161b2e"
  ink-secondary: "#474e6b"
  ink-tertiary: "#656c8a"
  rule: "#dfe2ea"
  rule-strong: "#bcc1d2"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.375rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 90"
  headline:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
    fontVariation: "\"wdth\" 95"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.5
    fontVariation: "\"wdth\" 95"
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.08em"
    fontVariation: "\"wdth\" 87.5"
  numero:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 700
    letterSpacing: "0.02em"
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 87.5"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "24px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.carbon-ink-deep}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.carbon-whisper}"
  button-danger:
    backgroundColor: "{colors.numero-red}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "40px"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.lg}"
    padding: "20px"
  nav-rail:
    backgroundColor: "{colors.carbon-cover}"
    textColor: "{colors.carbon-mist}"
    width: "240px"
  nav-item-active:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.carbon-cover}"
    rounded: "{rounded.md}"
    height: "40px"
  segmented-active:
    backgroundColor: "{colors.carbon-ink}"
    textColor: "{colors.sheet}"
    rounded: "5px"
    height: "32px"
  badge-low-stock:
    backgroundColor: "{colors.pink-tint}"
    textColor: "{colors.pink-ink}"
    rounded: "{rounded.sm}"
    height: "24px"
  badge-out-of-stock:
    backgroundColor: "{colors.numero-tint}"
    textColor: "{colors.numero-red-deep}"
    rounded: "{rounded.sm}"
    height: "24px"
  sales-slip:
    backgroundColor: "{colors.canary-tint}"
    textColor: "{colors.canary-ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: Carnet

## Overview

**Creative North Star: "The Duplicate Book"**

Carnet is drawn from the *carnet à souches*, the numbered carbon-copy receipt book kept at shop counters across Morocco. The world appears only through the book's own materials: carbon-blue ink and a carbon-blue cover, white original sheets, the canary and pink of the copy sheets beneath, the red serial a numbering machine prints on every slip, perforated stubs, and the rubber stamp that marks a sale as done. The page structure is an ordinary, legible working app: a navigation rail, sheets of data, standard controls. The world never supplies the layout. It supplies type, palette, density and one signature moment.

The density is that of a well-kept ledger. Hairline rules divide content instead of gaps and shadows. Every amount is set in tabular figures. Printed field labels are semi-condensed caps, the way a pre-printed form labels its boxes. Entered values (amounts, totals, quantities) are written in carbon ink, so what the user put on the page reads differently from the page's own printing.

The system rejects the generic admin template (identical KPI tiles, soft-shadowed cards, an indigo accent), flashy effects, and the bare spreadsheet. It has one authored motion: the stamp that lands when a sale is recorded.

**Key Characteristics:**
- Carbon-blue cover rail and carbon-ink values on white sheets over a cool grey ground.
- Red numbering-machine serials (N° 0006) on every sales slip, never on anything else.
- Canary copy for the slip being written and for selection; pink copy for low stock.
- Flat sheets with hairline rules. Perforated rules mark the stub. Totals get an accountant's double rule.
- One typeface (Archivo) across its width axis: semi-condensed caps for labels, normal width for reading.

## Colors

A restrained neutral ground carrying one committed ink colour and three functional copy-sheet colours.

### Primary
- **Carbon Ink** (#24418f): primary buttons, the active segmented option, entered values and totals, links, chart columns, and the RECORDED stamp. The colour of what is written on the page.
- **Carbon Cover** (#172b66): the navigation rail, the sign-in cover panel, and the darkest figures (totals, takings). The book's cover.
- **Carbon Wash / Whisper** (#e4e9f7 / #f2f4fb): row hover, avatar fills, and bar-chart tracks.

### Secondary
- **Numbering-Machine Red** (#c0392b): sales slip serials only, plus destructive actions and error text. The deep variant (#9a2a1f) is for text on the red tint (#fbeae7), as in out-of-stock badges and error banners.

### Tertiary
- **Canary Copy** (#f6e27f, tint #fcf5d2, ink #574500): the sales slip being written, the "just filed" row glow, the selected row, and text selection.
- **Pink Copy** (#f2b8c6, tint #fce8ee, ink #7a2440): low-stock state. On the sign-in cover, canary and pink also appear as the stacked copy sheets.

### Neutral
- **Cool Ground** (#f3f4f7): the app background behind every sheet. It is cool, never cream.
- **Original Sheet** (#ffffff): every content surface.
- **Ink** (#161b2e): headings and primary text. **Secondary Ink** (#474e6b) for supporting text, **Tertiary Ink** (#656c8a) for captions and labels. All three pass 4.5:1 on white.
- **Rule** (#dfe2ea) for hairlines and sheet outlines; **Strong Rule** (#bcc1d2) for control outlines, totals rules and perforation dots.

### Named Rules
**The Numbering Machine Rule.** Red serials belong to sales slips. Product and customer references stay in tertiary ink, so red always means a slip number or something gone wrong.

**The Copy Sheet Rule.** Canary means "being written or just written"; pink means "running low". Neither is decoration.

## Typography

**Display Font:** Archivo Variable (self-hosted; ui-sans-serif, system-ui fallback)
**Body Font:** Archivo Variable
**Label Font:** Archivo Variable at semi-condensed width

**Character:** One grotesque across its width axis, like a printer's forms set from one family: condensed caps for the printed labels, normal width for what people read.

### Hierarchy
- **Display** (700, 2.375rem, line-height 1, width 90, tabular): the takings figure on the Overview totals line.
- **Headline** (700, 1.75rem mobile to 2rem, line-height 1.25, width 95): page titles and the sign-in heading.
- **Title** (600, 0.9375rem, width 95): sheet headers such as "Register", "Latest slips" and "Sales slip".
- **Body** (400, 0.9375rem, line-height 1.5): table cells, form values and prose. Secondary lines use 0.75rem in tertiary ink.
- **Label** (600, 0.6875rem, letter-spacing 0.08em, uppercase, width 87.5): field labels, table headers and totals labels.
- **Numero** (700, width 87.5, tabular, red): slip serials.

### Named Rules
**The Tabular Rule.** Every number that can sit in a column (amounts, quantities, dates, counts) uses tabular figures.

**The Printed Label Rule.** Labels are printed by the form, so they are small semi-condensed caps. Headings are never uppercase.

## Layout

The shell is a fixed 240px carbon-blue rail on the left from 1024px up. Below that, a 56px carbon-blue top bar opens the same rail as a drawer. Content sits in a column of at most 1440px with 40px side padding on desktop, 24px on tablet and 16px on mobile. Each page opens with its title, a one-line count or date, and the primary action at the top right.

Content is arranged as sheets separated by 24px gaps. From 1280px, work panels (the sales slip, product and customer forms, the customer card) take a sticky 380–400px column on the right of their list. Below that they stack above the list. Sheet headers are at least 56px high with 20px side padding, and table rows are 56–60px.

Tables follow a column priority on phones. Below 640px they drop secondary columns and fold that information into the main cell (product × quantity under the customer; stock under the product), so money columns are never cut off.

## Elevation & Depth

The system is flat. Sheets sit on the ground with a 1px hairline outline and no shadow; depth comes from the ground/sheet contrast and from colour fields (the carbon cover, the canary slip). The one shadow is the mobile navigation drawer, which floats over content.

### Shadow Vocabulary
- **Drawer** (`box-shadow: 8px 0 32px -8px rgb(14 26 64 / 0.45)`): the mobile navigation drawer only.

### Named Rules
**The Flat Sheet Rule.** No card shadows and no gradients. A surface is separated by a hairline or a colour field, never by a blur.

## Shapes

Corners are gently rounded and consistent by size: sheets 8px, buttons and inputs 6px, badges and the stamp 4px. Avatars are round. Two book-specific forms recur:
- **The perforation:** a dotted rule of 2.2px dots every 7px between a stub and its slip, with half-punched holes at the ends of the sales slip.
- **The double rule:** under the Overview takings figure, as an accountant rules off a total.

## Components

### Buttons
- **Shape:** gently rounded (6px), 40px tall (32px small), semibold 0.875rem labels.
- **Primary:** carbon ink fill with white text; darkens to the deep ink on hover and to the cover on press.
- **Secondary:** a white sheet with a strong-rule inset outline; on hover the fill turns carbon whisper and the outline carbon haze.
- **Danger:** numbering-machine red. Used only to confirm a destructive action.
- **Focus:** a 2px carbon-bright outline offset by 2px (canary on the dark rail).

### Segmented control
A white sheet with an outline holding 32px options. The active option is filled with carbon ink in white text, and optional counts follow in a lighter tone. It is used for period and stock filters.

### Cards / Containers (Sheets)
- **Corner Style:** 8px.
- **Background:** white on the cool ground.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px rule outline; hairline dividers inside.
- **Internal Padding:** 20px horizontal; headers 12px vertical.

### Inputs / Fields
- **Style:** white fill, 1px strong-rule inset outline, 6px corners, 40px tall, with a printed label above.
- **Focus:** the outline becomes a 2px carbon-bright ring.
- **Error / Disabled:** errors turn the ring red and put a short red message below, naming the fix. Disabled fields take the ground fill.
- **Date:** shown the way the slip writes dates (4 Nov 2026), with the native picker underneath.

### Navigation
The carbon cover rail holds the wordmark and four items with icons, in mist-coloured text. The active item is a tab filled with the page's ground colour that runs into the page edge, like an index tab. The user's avatar and sign-out sit at the foot. On mobile the rail becomes a drawer.

### Status badges
Stock is ink text when healthy, a pink-copy badge "Low · n left" at 5 units or fewer, and a red-tint badge "Out of stock" at zero.

### Sales Slip (signature)
The canary copy of a slip: a stub header with "Sales slip" and the serial (dotted N° ···· until recorded), a perforation with punched ends, the customer/product/quantity/date fields, a live line-item preview written in carbon ink, and a TOTAL box. Recording it prints the red serial, lands a carbon-ink RECORDED stamp dated with the sale over the quantity/amount area (340ms, expo ease-out, about −9°, multiplied onto the paper), and files the row at the top of the register with a canary glow that fades over 2.2s.

## Do's and Don'ts

### Do:
- **Do** set every amount in tabular figures with the DH suffix (7,999.00 DH).
- **Do** keep red for slip serials, destructive actions and errors.
- **Do** use canary for the record being written or just written, and pink only for low stock.
- **Do** separate content with hairline rules (#dfe2ea) on white sheets over the cool ground (#f3f4f7).
- **Do** label fields and columns with the semi-condensed caps label style.
- **Do** keep the stamp as the only authored motion; everything else is instant or a 150ms fade.

### Don't:
- **Don't** add card shadows, gradients or glass; depth is flat.
- **Don't** build rows of identical stat tiles (caps label over a big number). Totals are a ruled totals line, with the final figure double-ruled.
- **Don't** use a cream or warm paper ground; the ground is cool.
- **Don't** let the receipt-book world supply the layout or controls: no ruled-paper tables, no fake handwriting. Tables, buttons and inputs stay standard.
- **Don't** show a number the API didn't provide.
