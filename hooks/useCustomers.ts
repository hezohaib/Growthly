"use client";

import { useMemo } from "react";
import type { Customer } from "@/lib/types";
import { useCustomerStore } from "@/store/customers";
import { useAnalytics } from "./useAnalytics";

/** API customers + the ones you added, minus deleted ones, with your edits applied. */
export function useCustomers(): Customer[] {
  const { data } = useAnalytics();
  const added = useCustomerStore((s) => s.added);
  const patches = useCustomerStore((s) => s.patches);
  const removed = useCustomerStore((s) => s.removed);

  return useMemo(() => {
    const base = data?.customers ?? [];
    return [...base, ...added]
      .filter((c) => !removed.includes(c.id))
      .map((c) => (patches[c.id] ? { ...c, ...patches[c.id] } : c));
  }, [data, added, patches, removed]);
}
