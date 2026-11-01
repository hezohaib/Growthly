"use client";

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
          <>
            <KpiCards series={series} />

            <section className="mb-3 grid grid-cols-1 gap-3 min-[1000px]:grid-cols-[2fr_1fr]">
              <TrendChart series={series} />
              <PlanDonutCard customers={customers} />
            </section>

            <section className="mb-3 grid grid-cols-1 gap-3 min-[1000px]:grid-cols-3">
              <GoalCard series={series} />
              <TopCustomersCard customers={customers} />
              <AtRiskCard customers={customers} />
            </section>

            <ActivityCard customers={customers} />
          </>
        )}
      </DataGate>
    </>
  );
}
