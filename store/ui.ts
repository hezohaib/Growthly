import { create } from "zustand";

export type DrawerState = { mode: "add" } | { mode: "edit"; id: string } | null;

export interface Toast {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
  action?: { label: string; onClick: () => void };
}

interface UiState {
  paletteOpen: boolean;
  sidebarOpen: boolean;
  drawer: DrawerState;
  toasts: Toast[];

  setPalette: (open: boolean) => void;
  togglePalette: () => void;
  setSidebar: (open: boolean) => void;
  openDrawer: (drawer: Exclude<DrawerState, null>) => void;
  closeDrawer: () => void;
  toast: (t: Omit<Toast, "id" | "tone"> & { tone?: Toast["tone"] }) => void;
  dismissToast: (id: number) => void;
}

let nextToastId = 1;

/** UI-only state (never saved). */
export const useUi = create<UiState>()((set) => ({
  paletteOpen: false,
  sidebarOpen: false,
  drawer: null,
  toasts: [],

  setPalette: (paletteOpen) => set({ paletteOpen }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  openDrawer: (drawer) => set({ drawer }),
  closeDrawer: () => set({ drawer: null }),
  toast: (t) =>
    set((s) => {
      // typed as Toast so "success" stays a literal and does not widen to string
      const toast: Toast = { tone: "success", ...t, id: nextToastId++ };
      // keep at most 3 on screen
      return { toasts: [...s.toasts, toast].slice(-3) };
    }),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));