import { activity, healthScore, type ActivityEvent } from "./customer";
import { PLANS, type Customer, type DayPoint, type Plan, type Status } from "./types";

export type Range = 7 | 30 | 90;
export type Metric = "revenue" | "signups" | "active";
export type SortKey = "name" | "plan" | "seats" | "mrr" | "joined" | "status";
export type SortDir = "asc" | "desc";
export interface SortState {
  key: SortKey;
  dir: SortDir;
}

export type KpiKind = "usd" | "int" | "percent";
export interface Kpi {
  label: string;
  kind: KpiKind;
  value: number;
  /** % change versus the equal-length period before */
  delta: number;
  lowerIsBetter?: boolean;
  /** one value per day of the selected period, for the sparkline */
  spark: number[];
}

type Numeric = keyof Omit<DayPoint, "date">;
const sum = (rows: DayPoint[], key: Numeric) => rows.reduce((t, r) => t + r[key], 0);

export const pctChange = (cur: number, prev: number) => (prev ? ((cur - prev) / prev) * 100 : 0);

/** The selected period and the equal-length period right before it. */
export function getPeriods(series: DayPoint[], range: Range) {
  const n = series.length;
  return {
    cur: series.slice(n - range),
    prev: series.slice(n - 2 * range, n - range),
  };
}

export function periodLabel(series: DayPoint[], range: Range) {
  const { cur } = getPeriods(series, range);
  return { from: cur[0].date, to: cur[cur.length - 1].date };
}

export function computeKpis(series: DayPoint[], range: Range): Kpi[] {
  const { cur, prev } = getPeriods(series, range);
  const churnRate = (p: DayPoint[]) => (sum(p, "churned") / (sum(p, "active") / p.length)) * 100;
  const lastCur = cur[cur.length - 1];
  const lastPrev = prev[prev.length - 1];

  return [
    {
      label: "Revenue",
      kind: "usd",
      value: sum(cur, "revenue"),
      delta: pctChange(sum(cur, "revenue"), sum(prev, "revenue")),
      spark: cur.map((d) => d.revenue),
    },
    {
      label: "New signups",
      kind: "int",
      value: sum(cur, "signups"),
      delta: pctChange(sum(cur, "signups"), sum(prev, "signups")),
      spark: cur.map((d) => d.signups),
    },
    {
      label: "Active users",
      kind: "int",
      value: lastCur.active,
      delta: pctChange(lastCur.active, lastPrev.active),
      spark: cur.map((d) => d.active),
    },
    {
      label: "Churn rate",
      kind: "percent",
      value: churnRate(cur),
      delta: pctChange(churnRate(cur), churnRate(prev)),
      lowerIsBetter: true,
      spark: cur.map((d) => (d.churned / d.active) * 100),
    },
  ];
}

export interface CustomerFilters {
  query: string;
  plan: Plan | "All";
  status: Status | "All";
}

/** filter -> sort. (Pagination is a separate step in the table component.) */
export function filterSortCustomers(customers: Customer[], filters: CustomerFilters, sort: SortState): Customer[] {
  const q = filters.query.trim().toLowerCase();
  const rows = customers.filter(
    (c) =>
      (filters.plan === "All" || c.plan === filters.plan) &&
      (filters.status === "All" || c.status === filters.status) &&
      (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)),
  );
  const { key, dir } = sort;
  rows.sort((a, b) => {
    const x = a[key];
    const y = b[key];
    // joined is an ISO date string, so plain string comparison is chronological
    const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
    return dir === "asc" ? r : -r;
  });
  return rows;
}

export interface PlanRow {
  plan: Plan;
  count: number;
  mrr: number;
  share: number;
}

/** Recurring revenue per plan, active accounts only. */
export function planBreakdown(customers: Customer[]): { rows: PlanRow[]; total: number } {
  const active = customers.filter((c) => c.status === "Active");
  const total = active.reduce((t, c) => t + c.mrr, 0);
  const rows = PLANS.map((plan) => {
    const list = active.filter((c) => c.plan === plan);
    const mrr = list.reduce((t, c) => t + c.mrr, 0);
    return { plan, count: list.length, mrr, share: total ? (mrr / total) * 100 : 0 };
  });
  return { rows, total };
}

export function topCustomers(customers: Customer[], n: number): Customer[] {
  return customers
    .filter((c) => c.status === "Active")
    .sort((a, b) => b.mrr - a.mrr)
    .slice(0, n);
}

/** Active accounts with a low health score, worst first. */
export function atRiskCustomers(customers: Customer[], n: number): Array<{ customer: Customer; score: number }> {
  return customers
    .filter((c) => c.status === "Active")
    .map((customer) => ({ customer, score: healthScore(customer) }))
    .filter((x) => x.score < 55)
    .sort((a, b) => a.score - b.score)
    .slice(0, n);
}

/** Latest event of every customer, newest first. */
export function recentActivity(customers: Customer[], n: number): Array<{ customer: Customer; event: ActivityEvent }> {
  return customers
    .map((customer) => ({ customer, event: activity(customer)[0] }))
    .sort((a, b) => (a.event.date < b.event.date ? 1 : a.event.date > b.event.date ? -1 : 0))
    .slice(0, n);
}
