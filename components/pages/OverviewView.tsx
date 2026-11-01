"use client";

import { motion, type Variants } from "framer-motion";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useCustomers } from "@/hooks/useCustomers";
import { useDashboard } from "@/store/dashboard";
import { periodLabel } from "@/lib/selectors";
import { shortDate, year } from "@/lib/format";
import { DataGate } from "@/components/DataGate";
import { KpiCards } from "@/components/KpiCards";
import { RangeToggle } from "@/components/RangeToggle";
import { TrendChart } from "@/components/charts/TrendChart";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActivityCard, AtRiskCard, GoalCard, PlanDonutCard, TopCustomersCard } from "@/components/overview/OverviewCards";

const overviewContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
};

const overviewItem: Variants = {
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

export function OverviewView() {
  const { data } = useAnalytics();
  const range = useDashboard((s) => s.range);
  const customers = useCustomers();

  let subtitle = "Revenue, signups and customer health";
  if (data) {
    const { from, to } = periodLabel(data.series, range);
    subtitle = `${shortDate(from)} to ${shortDate(to)}, ${year(to)}`;
  }

  return (
    <>
      <PageHeader title="Overview" subtitle={subtitle}>
        <RangeToggle />
      </PageHeader>

      <DataGate>
        {({ series }) => (
          <motion.div
            variants={overviewContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            <motion.div variants={overviewItem}>
              <KpiCards series={series} />
            </motion.div>

            <motion.section variants={overviewItem} className="grid grid-cols-1 gap-3 min-[1000px]:grid-cols-[2fr_1fr]">
              <TrendChart series={series} />
              <PlanDonutCard customers={customers} />
            </motion.section>

            <motion.section variants={overviewItem} className="grid grid-cols-1 gap-3 min-[1000px]:grid-cols-3">
              <GoalCard series={series} />
              <TopCustomersCard customers={customers} />
              <AtRiskCard customers={customers} />
            </motion.section>

            <motion.div variants={overviewItem}>
              <ActivityCard customers={customers} />
            </motion.div>
          </motion.div>
        )}
      </DataGate>
    </>
  );
}
