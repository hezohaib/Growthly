import { describe, expect, it } from "vitest";
import { DAYS } from "@/lib/constants";
import { getAnalytics } from "@/lib/data";
import { activity, calcMrr, healthScore, initials, invoices, mrrHistory } from "@/lib/customer";
import { customersToCsv, toCsv } from "@/lib/csv";
import { cohortRetention, goalProgress, monthlyTotals, weeklyFlow } from "@/lib/reports";
import {
  atRiskCustomers,
  computeKpis,
  filterSortCustomers,
  getPeriods,
  pctChange,
  planBreakdown,
  recentActivity,
  topCustomers,
} from "@/lib/selectors";
import { slugify } from "@/lib/utils";

const { series, customers } = getAnalytics();
const ALL = { query: "", plan: "All", status: "All" } as const;

describe("data", () => {
  it("is deterministic and covers 180 days ending 2026-10-31", () => {
    expect(series).toHaveLength(DAYS);
    expect(series[0].date).toBe("2026-05-05");
    expect(series.at(-1)?.date).toBe("2026-10-31");
    expect(customers).toHaveLength(30);
  });

  it("gives every customer a unique id, an email and a country", () => {
    expect(new Set(customers.map((c) => c.id)).size).toBe(customers.length);
    for (const c of customers) {
      expect(c.email).toContain("@");
      expect(c.country.length).toBeGreaterThan(0);
      expect(c.mrr).toBe(calcMrr(c.plan, c.seats));
    }
  });
});

describe("utils", () => {
  it("slugifies names", () => {
    expect(slugify("Cedar & Co")).toBe("cedar-co");
    expect(slugify("  Acme Labs ")).toBe("acme-labs");
  });
  it("makes initials", () => {
    expect(initials("Acme Labs")).toBe("AL");
    expect(initials("Northwind")).toBe("NO");
  });
});

describe("getPeriods / computeKpis", () => {
  it("returns two equal-length, back-to-back windows", () => {
    for (const range of [7, 30, 90] as const) {
      const { cur, prev } = getPeriods(series, range);
      expect(cur).toHaveLength(range);
      expect(prev).toHaveLength(range);
      expect(prev.at(-1)!.date < cur[0].date).toBe(true);
    }
  });

  it("revenue KPI equals the sum of the selected days and compares to the previous period", () => {
    const { cur, prev } = getPeriods(series, 30);
    const revenue = computeKpis(series, 30)[0];
    const sumCur = cur.reduce((t, d) => t + d.revenue, 0);
    const sumPrev = prev.reduce((t, d) => t + d.revenue, 0);
    expect(revenue.value).toBe(sumCur);
    expect(revenue.delta).toBeCloseTo(pctChange(sumCur, sumPrev));
    expect(revenue.spark).toHaveLength(30);
  });

  it("marks churn as lower-is-better", () => {
    expect(computeKpis(series, 7)[3].lowerIsBetter).toBe(true);
  });

  it("guards against dividing by zero", () => {
    expect(pctChange(10, 0)).toBe(0);
    expect(pctChange(150, 100)).toBe(50);
  });
});

describe("filterSortCustomers", () => {
  it("filters by name, case-insensitively", () => {
    const rows = filterSortCustomers(customers, { ...ALL, query: "  ATL" }, { key: "name", dir: "asc" });
    expect(rows.map((r) => r.name)).toEqual(["Atlas"]);
  });

  it("filters by plan and status", () => {
    const pro = filterSortCustomers(customers, { ...ALL, plan: "Pro" }, { key: "name", dir: "asc" });
    expect(pro.every((c) => c.plan === "Pro")).toBe(true);
    const churned = filterSortCustomers(customers, { ...ALL, status: "Churned" }, { key: "name", dir: "asc" });
    expect(churned.every((c) => c.status === "Churned")).toBe(true);
    expect(churned.length + filterSortCustomers(customers, { ...ALL, status: "Active" }, { key: "name", dir: "asc" }).length).toBe(
      customers.length,
    );
  });

  it("sorts by revenue, descending then ascending", () => {
    const desc = filterSortCustomers(customers, ALL, { key: "mrr", dir: "desc" }).map((r) => r.mrr);
    const asc = filterSortCustomers(customers, ALL, { key: "mrr", dir: "asc" }).map((r) => r.mrr);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
  });

  it("sorts joined dates chronologically", () => {
    const rows = filterSortCustomers(customers, ALL, { key: "joined", dir: "asc" });
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].joined <= rows[i].joined).toBe(true);
  });
});

describe("planBreakdown, topCustomers, atRiskCustomers", () => {
  it("only counts active accounts and shares add up to 100%", () => {
    const { rows, total } = planBreakdown(customers);
    const active = customers.filter((c) => c.status === "Active");
    expect(rows.reduce((t, r) => t + r.count, 0)).toBe(active.length);
    expect(total).toBe(active.reduce((t, c) => t + c.mrr, 0));
    expect(rows.reduce((t, r) => t + r.share, 0)).toBeCloseTo(100);
  });

  it("lists the biggest active accounts first", () => {
    const top = topCustomers(customers, 5);
    expect(top).toHaveLength(5);
    expect(top.every((c) => c.status === "Active")).toBe(true);
    for (let i = 1; i < top.length; i++) expect(top[i - 1].mrr >= top[i].mrr).toBe(true);
  });

  it("lists at-risk accounts with the lowest score first", () => {
    const risky = atRiskCustomers(customers, 10);
    for (const r of risky) expect(r.score).toBeLessThan(55);
    for (let i = 1; i < risky.length; i++) expect(risky[i - 1].score <= risky[i].score).toBe(true);
  });
});

describe("customer detail data", () => {
  const active = customers.find((c) => c.status === "Active")!;
  const churned = customers.find((c) => c.status === "Churned");

  it("health score is stable and low for churned accounts", () => {
    expect(healthScore(active)).toBe(healthScore(active));
    if (churned) expect(healthScore(churned)).toBeLessThan(40);
  });

  it("MRR history has 6 months and ends at the current MRR", () => {
    const h = mrrHistory(active);
    expect(h).toHaveLength(6);
    expect(h.at(-1)!.value).toBe(active.mrr);
    if (churned) expect(mrrHistory(churned).at(-1)!.value).toBe(0);
  });

  it("invoices are newest first and the oldest ones are paid", () => {
    const inv = invoices(active);
    for (let i = 1; i < inv.length; i++) expect(inv[i - 1].date > inv[i].date).toBe(true);
    expect(inv.slice(1).every((i) => i.status === "Paid")).toBe(true);
  });

  it("activity is newest first, starts at the join date, and churned accounts show a cancellation", () => {
    const events = activity(active);
    for (let i = 1; i < events.length; i++) expect(events[i - 1].date >= events[i].date).toBe(true);
    expect(events.some((e) => e.date === active.joined)).toBe(true);
    if (churned) expect(activity(churned).some((e) => e.tone === "bad")).toBe(true);
  });

  it("recentActivity returns one entry per customer, newest first", () => {
    const feed = recentActivity(customers, 6);
    expect(feed).toHaveLength(6);
    expect(new Set(feed.map((f) => f.customer.id)).size).toBe(6);
    for (let i = 1; i < feed.length; i++) expect(feed[i - 1].event.date >= feed[i].event.date).toBe(true);
  });
});

describe("reports", () => {
  it("monthly totals add up to the whole series", () => {
    const months = monthlyTotals(series);
    expect(months).toHaveLength(6);
    expect(months.reduce((t, m) => t + m.revenue, 0)).toBe(series.reduce((t, d) => t + d.revenue, 0));
    expect(months[0].label).toBe("May");
    expect(months.at(-1)!.label).toBe("Oct");
  });

  it("weekly flow has only full weeks", () => {
    const weeks = weeklyFlow(series);
    expect(weeks).toHaveLength(25);
    const last7 = series.slice(-7);
    expect(weeks.at(-1)!.signups).toBe(last7.reduce((t, d) => t + d.signups, 0));
  });

  it("cohorts form a triangle that starts at 100%", () => {
    const rows = cohortRetention(series);
    expect(rows).toHaveLength(6);
    rows.forEach((r, i) => {
      expect(r.values[0]).toBe(100);
      expect(r.values.filter((v) => v !== null)).toHaveLength(6 - i);
      const seen = r.values.filter((v): v is number => v !== null);
      for (let k = 1; k < seen.length; k++) expect(seen[k] <= seen[k - 1]).toBe(true);
    });
  });

  it("goal progress is capped at 100%", () => {
    const hit = goalProgress(series, 1000);
    expect(hit.pct).toBe(100);
    expect(hit.reached).toBe(true);
    const miss = goalProgress(series, 10_000_000);
    expect(miss.reached).toBe(false);
    expect(miss.pct).toBeGreaterThan(0);
  });
});

describe("csv", () => {
  it("escapes commas, quotes and new lines", () => {
    expect(toCsv(["a", "b"], [['he said "hi"', "x,y"]])).toBe('a,b\n"he said ""hi""","x,y"');
  });

  it("exports one line per customer plus the header", () => {
    const csv = customersToCsv(customers);
    expect(csv.split("\n")).toHaveLength(customers.length + 1);
    expect(csv.startsWith("Name,Email,Country,Plan,Seats")).toBe(true);
  });
});
