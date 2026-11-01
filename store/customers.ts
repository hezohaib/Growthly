import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Customer } from "@/lib/types";

/**
 * Local changes on top of the API data: customers you added, edits, and deletions.
 * They live in localStorage, so the "database" survives a refresh without a backend.
 */
interface CustomerState {
  added: Customer[];
  patches: Record<string, Partial<Customer>>;
  removed: string[];

  add: (customer: Customer) => void;
  update: (id: string, patch: Partial<Customer>) => void;
  remove: (id: string) => void;
  restore: (id: string) => void;
  reset: () => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      added: [],
      patches: {},
      removed: [],

      add: (customer) => set((s) => ({ added: [...s.added, customer] })),
      update: (id, patch) => set((s) => ({ patches: { ...s.patches, [id]: { ...s.patches[id], ...patch } } })),
      remove: (id) => set((s) => (s.removed.includes(id) ? s : { removed: [...s.removed, id] })),
      restore: (id) => set((s) => ({ removed: s.removed.filter((r) => r !== id) })),
      reset: () => set({ added: [], patches: {}, removed: [] }),
    }),
    { name: "Growthly-customers", skipHydration: true },
  ),
);
