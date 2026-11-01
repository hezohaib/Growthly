# Growthly Analytics

SaaS analytics dashboard built with a modern frontend stack. Started as plain HTML/CSS/JS (kept in `legacy/`), then ported to Next.js.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | KPI cards with sparklines, trend chart (compare to previous period), revenue-by-plan donut, monthly goal ring, top customers, accounts at risk, recent activity |
| `/customers` | Search, plan/status filters, sortable columns, pagination, add / edit / delete (with Undo), CSV export |
| `/customers/[id]` | Profile, 6-month revenue chart, account health ring, invoices, activity timeline |
| `/reports` | Monthly revenue, weekly signups vs churn, cohort retention heatmap, CSV export |
| `/settings` | Theme, default range, compare toggle, revenue goal, reset buttons |

Extra: `Ctrl/Cmd + K` command palette, toasts, light/dark theme, responsive sidebar.

## Stack

| Tech | Where it is used |
| --- | --- |
| **Next.js (App Router)** + **TypeScript** | Route group `app/(app)`, server prefetch in `app/(app)/layout.tsx`, Route Handler `app/api/analytics/route.ts`, dynamic route `customers/[id]` |
| **React** | `components/`, `hooks/` |
| **Tailwind CSS v4** | Theme tokens in `app/globals.css` (`bg-surface`, `text-muted`, `border-line`, `fill-chart-1` ...) |
| **Zustand** | `store/dashboard.ts` (preferences, filters, sort), `store/customers.ts` (added / edited / deleted customers, saved in localStorage), `store/ui.ts` (palette, drawer, toasts) |
| **TanStack Query** | `hooks/useAnalytics.ts`, prefetched on the server and hydrated on the client |
| **Framer Motion** | KPI count-up and stagger, chart draw-in, sliding tabs and nav highlight, donut / ring / bar animations, drawer, palette, toasts, table row layout animation |
| **Zod** | `lib/schema.ts`: API response and the add / edit customer form |
| **next-themes** | Light / dark / system |
| **Vitest** | `tests/logic.test.ts` (KPI maths, filtering, sorting, reports, CSV) |

All charts are hand-built SVG (no chart library).

## Run

Needs Node 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
npm test
npm run typecheck
npm run build && npm start
```

## Structure

```
app/(app)/        pages: overview, customers, customers/[id], reports, settings
app/api/          analytics Route Handler
components/       layout/ (shell, sidebar, palette, drawer, toasts), charts/, ui/, pages/, overview/
lib/              data (seeded), types, schema, selectors, customer, reports, csv, format
store/            zustand stores
hooks/            useAnalytics, useCustomers, useDebounce
tests/            vitest
```

## Notes

- Data comes from a seeded generator, so numbers are identical on every load.
- Dates are ISO calendar days formatted in UTC, so server and browser never disagree.
- Persisted Zustand stores rehydrate after mount (`skipHydration`) to avoid SSR hydration mismatches.
- Customers you add / edit / delete are stored in localStorage (no database). Settings has a reset button.
- Deploy: push to GitHub and import the repo in Vercel.
