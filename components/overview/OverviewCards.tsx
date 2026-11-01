"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Customer, DayPoint } from "@/lib/types";
import { atRiskCustomers, planBreakdown, recentActivity, topCustomers } from "@/lib/selectors";
import { goalProgress } from "@/lib/reports";
import { fullDate, num, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useDashboard } from "@/store/dashboard";
import { DonutChart, type Slice } from "@/components/charts/DonutChart";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { Avatar } from "@/components/ui/Avatar";
import { HealthPill, PlanPill } from "@/components/ui/Pills";
import type { Plan } from "@/lib/types";

const PLAN_STYLE: Record<Plan, { stroke: string; dot: string }> = {
  Starter: { stroke: "stroke-chart-3", dot: "bg-chart-3" },
  Pro: { stroke: "stroke-chart-1", dot: "bg-chart-1" },
  Business: { stroke: "stroke-chart-2", dot: "bg-chart-2" },
};

/** Donut: recurring revenue share per plan. */
export function PlanDonutCard({ customers }: { customers: Customer[] }) {
  const { rows, total } = useMemo(() => planBreakdown(customers), [customers]);
  const slices: Slice[] = rows.map((r) => ({ label: r.plan, value: r.mrr, className: PLAN_STYLE[r.plan].stroke }));

  return (
    <div className="panel">
      <h2 className="mb-4 text-[15px] font-semibold">Revenue by plan</h2>
      <div className="flex flex-wrap items-center justify-center gap-6">
        <DonutChart slices={slices}>
          <span className="text-xl font-semibold tabular-nums">{usd(total)}</span>
          <span className="text-xs text-muted">per month</span>
        </DonutChart>
        <ul className="min-w-[150px] flex-1 space-y-3">
          {rows.map((r) => (
            <li key={r.plan} className="text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2">
                  <span className={cn("size-2.5 rounded-full", PLAN_STYLE[r.plan].dot)} />
                  {r.plan}
                </span>
                <strong className="tabular-nums">{usd(r.mrr)}</strong>
              </div>
              <p className="ml-[18px] text-xs text-muted">
                {r.count} accounts · {r.share.toFixed(0)}%
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Ring: last 30 days of revenue against the monthly goal from Settings. */
export function GoalCard({ series }: { series: DayPoint[] }) {
  const goal = useDashboard((s) => s.goal);
  const p = useMemo(() => goalProgress(series, goal), [series, goal]);

  return (
    <div className="panel flex flex-col">
      <h2 className="mb-4 text-[15px] font-semibold">Monthly revenue goal</h2>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <ProgressRing value={p.pct} size={128} stroke={10} className={p.reached ? "stroke-good" : "stroke-accent"}>
          <span className="text-2xl font-semibold tabular-nums">{Math.round(p.pct)}%</span>
        </ProgressRing>
        <div>
          <p className="text-sm">
            <strong className="tabular-nums">{usd(p.current)}</strong>
            <span className="text-muted"> of {usd(p.goal)}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {p.reached ? "Goal reached for the last 30 days" : `${usd(Math.max(p.goal - p.current, 0))} to go (last 30 days)`}
          </p>
        </div>
        <Link href="/settings" className="text-[13px] font-medium text-accent hover:underline">
          Change goal
        </Link>
      </div>
    </div>
  );
}

function EmptyNote({ children }: { children: string }) {
  return <p className="py-6 text-center text-sm text-muted">{children}</p>;
}

export function TopCustomersCard({ customers }: { customers: Customer[] }) {
  const top = useMemo(() => topCustomers(customers, 5), [customers]);

  return (
    <div className="panel">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">Top customers</h2>
        <Link href="/customers" className="text-[13px] font-medium text-accent hover:underline">
          View all
        </Link>
      </div>
      {top.length === 0 ? (
        <EmptyNote>No active customers yet.</EmptyNote>
      ) : (
        <ul className="divide-y divide-line">
          {top.map((c) => (
            <li key={c.id}>
              <Link href={`/customers/${c.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent-soft">
                <Avatar name={c.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="block text-xs text-muted">{c.seats} seats</span>
                </span>
                <PlanPill plan={c.plan} />
                <span className="w-16 text-right text-sm font-semibold tabular-nums">{usd(c.mrr)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AtRiskCard({ customers }: { customers: Customer[] }) {
  const risky = useMemo(() => atRiskCustomers(customers, 4), [customers]);

  return (
    <div className="panel">
      <h2 className="mb-3 text-[15px] font-semibold">Accounts at risk</h2>
      {risky.length === 0 ? (
        <EmptyNote>No at-risk accounts. Nice work.</EmptyNote>
      ) : (
        <ul className="divide-y divide-line">
          {risky.map(({ customer: c, score }) => (
            <li key={c.id}>
              <Link href={`/customers/${c.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-accent-soft">
                <Avatar name={c.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="block text-xs text-muted">{usd(c.mrr)} / month</span>
                </span>
                <HealthPill score={score} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const TONE_DOT = { good: "bg-good", bad: "bg-bad", neutral: "bg-muted" } as const;

export function ActivityCard({ customers }: { customers: Customer[] }) {
  const feed = useMemo(() => recentActivity(customers, 6), [customers]);

  return (
    <div className="panel">
      <h2 className="mb-3 text-[15px] font-semibold">Recent activity</h2>
      {feed.length === 0 ? (
        <EmptyNote>Nothing has happened yet.</EmptyNote>
      ) : (
        <ul className="space-y-1">
          {feed.map(({ customer: c, event: e }, i) => (
            <motion.li
              key={`${c.id}-${e.id}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
            >
              <Link href={`/customers/${c.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent-soft">
                <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[e.tone])} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  <strong className="font-medium">{c.name}</strong> <span className="text-muted">{e.title}</span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted">{fullDate(e.date)}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted">{num(customers.length)} customers tracked</p>
    </div>
  );
}
