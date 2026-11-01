"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cohortRetention, monthlyTotals, weeklyFlow } from "@/lib/reports";
import { toCsv, downloadFile } from "@/lib/csv";
import { compactUsd, num, usd } from "@/lib/format";
import type { DayPoint } from "@/lib/types";
import { useUi } from "@/store/ui";
import { DataGate } from "@/components/DataGate";
import { BarChart } from "@/components/charts/BarChart";
import { CohortHeatmap } from "@/components/charts/CohortHeatmap";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";

export function ReportsView() {
  return <DataGate>{({ series }) => <Reports series={series} />}</DataGate>;
}

function Reports({ series }: { series: DayPoint[] }) {
  const toast = useUi((s) => s.toast);
  const months = useMemo(() => monthlyTotals(series), [series]);
  const weeks = useMemo(() => weeklyFlow(series), [series]);
  const cohorts = useMemo(() => cohortRetention(series), [series]);

  function exportMonths() {
    const csv = toCsv(
      ["Month", "Revenue (USD)", "Signups"],
      months.map((m) => [m.key, m.revenue, m.signups]),
    );
    downloadFile("Growthly-monthly-report.csv", csv);
    toast({ message: "Monthly report exported" });
  }

  const totalRevenue = months.reduce((t, m) => t + m.revenue, 0);
  const totalSignups = months.reduce((t, m) => t + m.signups, 0);

  return (
    <>
      <PageHeader title="Reports" subtitle="Monthly revenue, weekly customer flow and cohort retention">
        <button type="button" className="btn" onClick={exportMonths}>
          <Icon name="download" />
          Export monthly CSV
        </button>
      </PageHeader>

      <section className="panel mb-3">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold">Revenue by month</h2>
          <p className="text-[13px] text-muted">
            {usd(totalRevenue)} in total · {num(totalSignups)} signups
          </p>
        </div>
        <BarChart
          labels={months.map((m) => m.label)}
          series={[{ name: "Revenue", values: months.map((m) => m.revenue), className: "fill-chart-1", dotClassName: "bg-chart-1" }]}
          format={usd}
          formatAxis={compactUsd}
          ariaLabel="Revenue per month"
        />
      </section>

      <section className="panel mb-3">
        <h2 className="mb-3 text-[15px] font-semibold">Weekly signups vs churn</h2>
        <BarChart
          labels={weeks.map((w) => w.label)}
          series={[
            { name: "Signups", values: weeks.map((w) => w.signups), className: "fill-chart-1", dotClassName: "bg-chart-1" },
            { name: "Churned", values: weeks.map((w) => w.churned), className: "fill-chart-2", dotClassName: "bg-chart-2" },
          ]}
          format={num}
          labelEvery={3}
          ariaLabel="New signups and churned customers per week"
        />
      </section>

      <section className="panel mb-3">
        <h2 className="mb-1 text-[15px] font-semibold">Cohort retention</h2>
        <p className="mb-3 text-[13px] text-muted">Share of each signup month that is still active. Darker means more users kept.</p>
        <CohortHeatmap rows={cohorts} />
      </section>

      <section className="panel">
        <h2 className="mb-3 text-[15px] font-semibold">Monthly summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[13px] text-muted">
                <th className="border-b border-line px-2 py-2 font-medium">Month</th>
                <th className="border-b border-line px-2 py-2 text-right font-medium">Revenue</th>
                <th className="border-b border-line px-2 py-2 text-right font-medium">Signups</th>
              </tr>
            </thead>
            <tbody>
              {[...months].reverse().map((m) => (
                <motion.tr
                  key={m.key}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="transition-colors duration-150 hover:bg-accent-soft/60"
                >
                  <td className="border-b border-line px-2 py-2.5 font-medium">{m.label}</td>
                  <td className="border-b border-line px-2 py-2.5 text-right tabular-nums">{usd(m.revenue)}</td>
                  <td className="border-b border-line px-2 py-2.5 text-right tabular-nums">{num(m.signups)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
