import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Plan, Status } from "@/lib/types";
import type { Metric, Range, SortKey, SortState } from "@/lib/selectors";

const DEFAULTS = {
  range: 30 as Range,
  metric: "revenue" as Metric,
  compare: false,
  goal: 150_000,
  query: "",
  plan: "All" as Plan | "All",
  status: "All" as Status | "All",
  sort: { key: "mrr", dir: "desc" } as SortState,
  page: 1,
};

interface DashboardState {
  range: Range;
  metric: Metric;
  /** draw the previous period as a dashed line on the trend chart */
  compare: boolean;
  /** monthly revenue goal in USD */
  goal: number;

  // customers table
  query: string;
  plan: Plan | "All";
  status: Status | "All";
  sort: SortState;
  page: number;

  setRange: (range: Range) => void;
  setMetric: (metric: Metric) => void;
  setCompare: (compare: boolean) => void;
  setGoal: (goal: number) => void;
  setQuery: (query: string) => void;
  setPlan: (plan: Plan | "All") => void;
  setStatus: (status: Status | "All") => void;
  toggleSort: (key: SortKey) => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  resetPreferences: () => void;
}

export const useDashboard = create<DashboardState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setRange: (range) => set({ range }),
      setMetric: (metric) => set({ metric }),
      setCompare: (compare) => set({ compare }),
      setGoal: (goal) => set({ goal }),
      // returning the same state object makes zustand skip the update (no re-render)
      setQuery: (query) => set((s) => (s.query === query ? s : { query, page: 1 })),
      setPlan: (plan) => set({ plan, page: 1 }),
      setStatus: (status) => set({ status, page: 1 }),
      toggleSort: (key) =>
        set((s) => ({
          sort:
            s.sort.key === key
              ? { key, dir: s.sort.dir === "asc" ? "desc" : "asc" }
              : { key, dir: "asc" },
          page: 1,
        })),
      setPage: (page) => set({ page }),
      clearFilters: () => set({ query: "", plan: "All", status: "All", page: 1 }),
      resetPreferences: () =>
        set({ range: DEFAULTS.range, metric: DEFAULTS.metric, compare: DEFAULTS.compare, goal: DEFAULTS.goal, sort: DEFAULTS.sort }),
    }),
    {
      name: "Growthly-dashboard",
      // only preferences are saved; filters and page start fresh
      partialize: (s) => ({ range: s.range, metric: s.metric, compare: s.compare, goal: s.goal, sort: s.sort }),
      // rehydrated manually after mount (see Providers) so SSR and first client render match
      skipHydration: true,
    },
  ),
);
