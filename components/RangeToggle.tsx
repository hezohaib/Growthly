"use client";

import { useDashboard } from "@/store/dashboard";
import type { Range } from "@/lib/selectors";
import { Segmented } from "./Segmented";

const RANGES: { value: Range; label: string }[] = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

export function RangeToggle() {
  const range = useDashboard((s) => s.range);
  const setRange = useDashboard((s) => s.setRange);
  return <Segmented label="Date range" options={RANGES} value={range} onChange={setRange} />;
}
