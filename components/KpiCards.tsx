"use client";

import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import type { DayPoint } from "@/lib/types";
import { computeKpis, type KpiKind } from "@/lib/selectors";
import { num, percent, usd } from "@/lib/format";
import { useDashboard } from "@/store/dashboard";
import { cn } from "@/lib/cn";
import { AnimatedNumber } from "./AnimatedNumber";
import { Sparkline } from "./charts/Sparkline";
import { Icon } from "./ui/Icon";

const FORMATTERS: Record<KpiKind, (n: number) => string> = { usd, int: num, percent };

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export function KpiCards({ series }: { series: DayPoint[] }) {
  const range = useDashboard((s) => s.range);
  const kpis = useMemo(() => computeKpis(series, range), [series, range]);

  return (
    <motion.section
      aria-label="Key metrics"
      className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {kpis.map((k) => {
        const good = k.lowerIsBetter ? k.delta <= 0 : k.delta >= 0;
        return (
          <motion.div key={k.label} variants={item} className="panel">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted">{k.label}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
                  good ? "bg-good/10 text-good" : "bg-bad/10 text-bad",
                )}
              >
                <Icon name={k.delta >= 0 ? "arrowUp" : "arrowDown"} size={12} />
                {Math.abs(k.delta).toFixed(1)}%
              </span>
            </div>
            <div className="mb-2 mt-1 text-[26px] font-semibold tracking-tight tabular-nums">
              <AnimatedNumber value={k.value} format={FORMATTERS[k.kind]} />
            </div>
            <Sparkline values={k.spark} />
            <p className="mt-1 text-xs text-muted">vs previous {range} days</p>
          </motion.div>
        );
      })}
    </motion.section>
  );
}
