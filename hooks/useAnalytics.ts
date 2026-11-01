"use client";

import { useQuery } from "@tanstack/react-query";
import { ANALYTICS_KEY, fetchAnalytics } from "@/lib/analytics-query";

export function useAnalytics() {
  return useQuery({ queryKey: ANALYTICS_KEY, queryFn: fetchAnalytics });
}
