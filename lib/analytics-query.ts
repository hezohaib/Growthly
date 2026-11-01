import { analyticsSchema } from "./schema";
import type { AnalyticsData } from "./types";

/** Shared by the server (prefetch) and the client (useQuery) so they hit the same cache entry. */
export const ANALYTICS_KEY = ["analytics"] as const;

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error(`Could not load analytics (HTTP ${res.status})`);
  return analyticsSchema.parse(await res.json());
}
