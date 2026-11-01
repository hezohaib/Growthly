import type { Plan, Status } from "@/lib/types";
import { healthLabel, healthTone, type HealthTone } from "@/lib/customer";
import { cn } from "@/lib/cn";

const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={cn(base, status === "Active" ? "bg-good/10 text-good" : "bg-bad/10 text-bad")}>
      <span aria-hidden="true" className={cn("mr-1.5 size-1.5 rounded-full", status === "Active" ? "bg-good" : "bg-bad")} />
      {status}
    </span>
  );
}

const PLAN_STYLES: Record<Plan, string> = {
  Starter: "bg-line/60 text-muted",
  Pro: "bg-accent-soft text-accent",
  Business: "bg-chart-2/15 text-chart-2",
};

export function PlanPill({ plan }: { plan: Plan }) {
  return <span className={cn(base, PLAN_STYLES[plan])}>{plan}</span>;
}

const TONES: Record<HealthTone, string> = {
  good: "bg-good/10 text-good",
  warn: "bg-warn/10 text-warn",
  bad: "bg-bad/10 text-bad",
};

export function HealthPill({ score }: { score: number }) {
  return (
    <span className={cn(base, "tabular-nums", TONES[healthTone(score)])}>
      {score} · {healthLabel(score)}
    </span>
  );
}
