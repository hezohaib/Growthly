import { monthName, shortDate } from "./format";
import type { DayPoint } from "./types";
import { mulberry32 } from "./utils";

export interface MonthRow {
  /** "2026-10" */
  key: string;
  label: string;
  revenue: number;
  signups: number;
}

/** Revenue and signups per calendar month (UTC). */
export function monthlyTotals(series: DayPoint[]): MonthRow[] {
  const map = new Map<string, MonthRow>();
  for (const d of series) {
    const key = d.date.slice(0, 7);
    const row = map.get(key) ?? { key, label: monthName(`${key}-01`), revenue: 0, signups: 0 };
    row.revenue += d.revenue;
    row.signups += d.signups;
    map.set(key, row);
  }
  return [...map.values()];
}

export interface WeekRow {
  label: string;
  signups: number;
  churned: number;
}

/** Full 7-day weeks counted back from the last day, oldest first. */
export function weeklyFlow(series: DayPoint[]): WeekRow[] {
  const weeks = Math.floor(series.length / 7);
  return Array.from({ length: weeks }, (_, i) => {
    const end = series.length - (weeks - 1 - i) * 7;
    const slice = series.slice(end - 7, end);
    return {
      label: shortDate(slice[0].date),
      signups: slice.reduce((t, d) => t + d.signups, 0),
      churned: slice.reduce((t, d) => t + d.churned, 0),
    };
  });
}

export interface CohortRow {
  label: string;
  size: number;
  /** % of the cohort still active in month 0..5; null = not observed yet */
  values: Array<number | null>;
}

/** Monthly signup cohorts with a retention curve. Seeded, so it never changes between loads. */
export function cohortRetention(series: DayPoint[]): CohortRow[] {
  const months = monthlyTotals(series).slice(-6);
  const rand = mulberry32(2026);
  return months.map((m, i) => {
    const observed = months.length - i;
    const decay = 0.88 + rand() * 0.06;
    return {
      label: m.label,
      size: m.signups,
      values: Array.from({ length: 6 }, (_, k) => (k < observed ? Math.round(100 * Math.pow(decay, k)) : null)),
    };
  });
}

export interface GoalProgress {
  current: number;
  goal: number;
  pct: number;
  reached: boolean;
}

/** Revenue of the last 30 days against a monthly goal. */
export function goalProgress(series: DayPoint[], goal: number): GoalProgress {
  const current = series.slice(-30).reduce((t, d) => t + d.revenue, 0);
  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0;
  return { current, goal, pct, reached: goal > 0 && current >= goal };
}
