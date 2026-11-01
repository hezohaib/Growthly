# HANDOFF: Growthly v2 upgrade (all pages written, needs first typecheck)

Paste this file's content to the new Claude session together with the zip.

## Project
Next.js (App Router) + TypeScript + Tailwind v4 + Zustand + TanStack Query + Framer Motion + Zod + next-themes + Vitest.
SaaS analytics dashboard "Growthly". v1 (single page) already ran fine on the user's PC (Node 24, `npm install`, `npm run dev`).
The user said v1 was "too simple", so v2 adds: sidebar layout, more pages, more charts, pro features. Style: Modern SaaS (clean, Linear/Vercel-like).
The user writes in Roman Urdu/Hinglish; reply in the same style (casual, "bro").

NOTE: the sandbox had no npm access, so nothing was built or typechecked there. Only pure logic in `lib/` was run with Node (26/26 tests passed via a shim). Run `npm install && npm run typecheck && npm test` first and fix whatever it reports.

## DONE (files exist)
- `lib/`: constants, utils, types, schema (zod + add/edit form schema), data (seeded, customers have id/email/country), format, customer (health score, mrrHistory, invoices, activity), selectors (KPIs with sparkline data, filter/sort with plan+status+query, planBreakdown, topCustomers, atRiskCustomers, recentActivity), reports (monthlyTotals, weeklyFlow, cohortRetention, goalProgress), csv, chart (niceMax), cn, analytics-query
- `store/`: dashboard (range, metric, compare, goal, filters, sort, page; persisted prefs), customers (added/patches/removed, persisted), ui (palette, sidebar, drawer, toasts)
- `hooks/`: useAnalytics, useCustomers (API + local changes), useDebounce
- `tests/logic.test.ts`
- `app/`: layout (Inter font), providers (rehydrates both persisted stores), globals.css (new tokens + .panel .btn .btn-primary .btn-danger .icon-btn .field), not-found, error, api/analytics/route.ts, `(app)/layout.tsx` (server prefetch + AppShell)
- `components/layout/`: AppShell, Sidebar, Topbar, CommandPalette (Ctrl+K), CustomerDrawer (add/edit form with zod), Toaster
- `components/ui/`: Icon, Avatar, Pills (StatusPill, PlanPill, HealthPill), PageHeader
- `components/charts/`: Sparkline, ProgressRing, DonutChart, BarChart, CohortHeatmap, TrendChart (with compare-to-previous)
- `components/`: Segmented, RangeToggle, ThemeToggle, DataGate (skeleton/error/retry), DashboardSkeleton, AnimatedNumber

## ALSO DONE since the first handoff
KpiCards, components/overview/OverviewCards.tsx, components/pages/{OverviewView,CustomersView,CustomerDetailView,ReportsView,SettingsView}.tsx, and the thin route files in app/(app)/{page,customers/page,customers/[id]/page,reports/page,settings/page}.tsx. README updated.

## TODO
1. On the user's PC run `npm install && npm run typecheck && npm test && npm run dev` and fix whatever is reported (nothing was ever compiled in the sandbox).
2. Click through every page: overview, customers (search / filters / sort / add / edit / delete + Undo / CSV), customer detail, reports, settings, Ctrl+K palette, theme toggle, mobile width.
3. Optional polish: delete the unused "sparkles" icon in components/ui/Icon.tsx, add page-level tests, deploy to Vercel.

## Known caveats to check
- Tailwind v4: `bg-linear-to-br` requires v4.1+, otherwise use `bg-gradient-to-br`.
- `components/ui/Icon.tsx` "sparkles" icon is unused and may look odd; safe to delete.
- Old v1 files were deleted on purpose (app/page.tsx, Dashboard, Header, KpiCards, TrendChart in components/, PlanBreakdown, CustomerTable, HowItsBuilt, lib/selectors old API). If the user extracts this zip over an old copy, delete those leftovers or extract into a fresh folder.
- The user keeps their original vanilla files in a `legacy/` folder on their PC (not part of this zip).
