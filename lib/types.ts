export const PLANS = ["Starter", "Pro", "Business"] as const;
export type Plan = (typeof PLANS)[number];

export const STATUSES = ["Active", "Churned"] as const;
export type Status = (typeof STATUSES)[number];

export const PLAN_PRICE: Record<Plan, number> = { Starter: 29, Pro: 99, Business: 299 };

export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "Canada",
  "Pakistan",
  "India",
  "Australia",
  "France",
  "Netherlands",
  "United Arab Emirates",
] as const;

export interface DayPoint {
  /** ISO calendar date, e.g. "2026-10-31" */
  date: string;
  revenue: number;
  signups: number;
  active: number;
  churned: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  country: string;
  plan: Plan;
  seats: number;
  mrr: number;
  status: Status;
  /** ISO calendar date */
  joined: string;
}

export interface AnalyticsData {
  series: DayPoint[];
  customers: Customer[];
}
