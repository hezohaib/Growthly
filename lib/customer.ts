import { END, END_ISO, DAY_MS } from "./constants";
import { PLAN_PRICE, type Customer, type Plan } from "./types";
import { hashString, isoDay, mulberry32 } from "./utils";

/** Monthly price: base plan price plus $5 per seat on paid plans. */
export const calcMrr = (plan: Plan, seats: number) => PLAN_PRICE[plan] + (plan === "Starter" ? 0 : seats * 5);

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// ---------- health ----------
export type HealthTone = "good" | "warn" | "bad";

/** 0-100 score. Stable per customer, and churned accounts score low. */
export function healthScore(c: Customer): number {
  const r = mulberry32(hashString(`${c.id}:health`))();
  return c.status === "Churned" ? Math.round(8 + r * 22) : Math.round(38 + r * 60);
}

export const healthTone = (score: number): HealthTone => (score >= 70 ? "good" : score >= 50 ? "warn" : "bad");
export const healthLabel = (score: number) =>
  score >= 70 ? "Healthy" : score >= 50 ? "Needs attention" : "At risk";

// ---------- MRR history ----------
export interface MrrPoint {
  /** first day of the month, ISO */
  date: string;
  label: string;
  value: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Last 6 months of recurring revenue for one customer. */
export function mrrHistory(c: Customer): MrrPoint[] {
  const rand = mulberry32(hashString(`${c.id}:mrr`));
  const end = new Date(`${END_ISO}T00:00:00Z`);
  const joinedAt = new Date(`${c.joined}T00:00:00Z`);
  const joinedMonth = Date.UTC(joinedAt.getUTCFullYear(), joinedAt.getUTCMonth(), 1);

  return Array.from({ length: 6 }, (_, i) => {
    const t = Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (5 - i), 1);
    const d = new Date(t);
    let value = Math.round(c.mrr * (0.6 + 0.4 * (i / 5)) * (0.96 + rand() * 0.08));
    if (i === 5) value = c.status === "Churned" ? 0 : c.mrr;
    if (t < joinedMonth) value = 0; // not a customer yet
    return { date: isoDay(t), label: MONTHS[d.getUTCMonth()], value };
  });
}

// ---------- invoices ----------
export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "Paid" | "Pending" | "Failed";
}

export function invoices(c: Customer): Invoice[] {
  const base = (hashString(c.id) % 9000) + 1000;
  return mrrHistory(c)
    .filter((p) => p.value > 0)
    .reverse() // newest first
    .map((p, i) => ({
      id: `INV-${base}-${p.date.slice(5, 7)}`,
      date: p.date,
      amount: p.value,
      status: i === 0 ? (c.status === "Active" ? "Pending" : "Failed") : "Paid",
    }));
}

// ---------- activity ----------
export type ActivityTone = "good" | "bad" | "neutral";
export interface ActivityEvent {
  id: string;
  date: string;
  title: string;
  tone: ActivityTone;
}

const EVENT_POOL: Array<[string, ActivityTone]> = [
  ["Invoice paid", "good"],
  ["Added team seats", "good"],
  ["Invited a teammate", "good"],
  ["Support ticket resolved", "neutral"],
  ["Exported usage report", "neutral"],
  ["Updated billing details", "neutral"],
];

/** A small, stable activity timeline (newest first). */
export function activity(c: Customer): ActivityEvent[] {
  const rand = mulberry32(hashString(`${c.id}:activity`));
  const start = Date.parse(`${c.joined}T00:00:00Z`);
  const end = Math.max(start, END);
  const churned = c.status === "Churned";
  const churnAt = start + Math.floor((end - start) * (0.75 + rand() * 0.2));
  const limit = churned ? churnAt : end;
  const span = Math.max(0, limit - start);

  const events: ActivityEvent[] = Array.from({ length: 4 }, (_, i) => {
    const [title, tone] = EVENT_POOL[Math.floor(rand() * EVENT_POOL.length)];
    const t = start + Math.floor(rand() * span);
    return { id: `${c.id}-${i}`, date: isoDay(t), title, tone };
  });

  events.push({ id: `${c.id}-join`, date: c.joined, title: `Subscribed to ${c.plan}`, tone: "good" });
  if (churned) {
    events.push({ id: `${c.id}-churn`, date: isoDay(churnAt), title: "Cancelled subscription", tone: "bad" });
  }

  // newest first; ties keep a stable order through the id
  return events.sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? 1 : -1));
}

/** Handy for tests: how many days ago an ISO date was, relative to the demo "today". */
export const daysAgo = (iso: string) => Math.round((END - Date.parse(`${iso}T00:00:00Z`)) / DAY_MS);
