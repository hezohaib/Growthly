"use client";

import type { ReactNode } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { AnalyticsData } from "@/lib/types";

interface Props {
  children: (data: AnalyticsData) => ReactNode;
}

/** Renders immediately from the preloaded cache or shows an error retry panel if data fails to load. */
export function DataGate({ children }: Props) {
  const { data, error, refetch } = useAnalytics();

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
