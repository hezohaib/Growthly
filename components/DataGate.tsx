"use client";

import type { ReactNode } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { AnalyticsData } from "@/lib/types";
import { DashboardSkeleton } from "./DashboardSkeleton";

/** Shows a skeleton while loading and a retry panel on error; otherwise hands the data to its child. */
export function DataGate({ children }: { children: (data: AnalyticsData) => ReactNode }) {
  const { data, isPending, error, refetch } = useAnalytics();

  if (isPending) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="panel text-center" role="alert">
        <h2 className="text-[15px] font-semibold">Could not load analytics</h2>
        <p className="mt-1 text-sm text-muted">{error?.message ?? "Unknown error"}</p>
        <button className="btn mt-4" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return <>{children(data)}</>;
}
