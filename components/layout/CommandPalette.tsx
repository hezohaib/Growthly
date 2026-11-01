"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { useUi } from "@/store/ui";
import { useDashboard } from "@/store/dashboard";
import { useCustomers } from "@/hooks/useCustomers";
import { customersToCsv, downloadFile } from "@/lib/csv";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";

interface Command {
  id: string;
  group: "Navigate" | "Actions" | "Customers";
  label: string;
  hint?: string;
  icon: IconName;
  run: () => void;
}

/** Ctrl/Cmd + K: jump to a page, run an action, or open a customer. */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  // the dialog is mounted only while open, so its query and selection reset every time
  return <AnimatePresence>{open && <PaletteDialog />}</AnimatePresence>;
}

function PaletteDialog() {
  const setPalette = useUi((s) => s.setPalette);
  const openDrawer = useUi((s) => s.openDrawer);
  const toast = useUi((s) => s.toast);
  const setRange = useDashboard((s) => s.setRange);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const customers = useCustomers();

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => router.push(href);
    const dark = resolvedTheme === "dark";
    return [
      { id: "nav-overview", group: "Navigate", label: "Go to Overview", icon: "dashboard", run: go("/") },
      { id: "nav-customers", group: "Navigate", label: "Go to Customers", icon: "users", run: go("/customers") },
      { id: "nav-reports", group: "Navigate", label: "Go to Reports", icon: "chart", run: go("/reports") },
      { id: "nav-settings", group: "Navigate", label: "Go to Settings", icon: "settings", run: go("/settings") },
      { id: "act-add", group: "Actions", label: "Add customer", icon: "plus", run: () => openDrawer({ mode: "add" }) },
      {
        id: "act-export",
        group: "Actions",
        label: "Export customers as CSV",
        icon: "download",
        run: () => {
          downloadFile("Growthly-customers.csv", customersToCsv(customers));
          toast({ message: `Exported ${customers.length} customers` });
        },
      },
      {
        id: "act-theme",
        group: "Actions",
        label: dark ? "Switch to light theme" : "Switch to dark theme",
        icon: dark ? "sun" : "moon",
        run: () => setTheme(dark ? "light" : "dark"),
      },
      { id: "act-r7", group: "Actions", label: "Show last 7 days", icon: "chart", run: () => setRange(7) },
      { id: "act-r30", group: "Actions", label: "Show last 30 days", icon: "chart", run: () => setRange(30) },
      { id: "act-r90", group: "Actions", label: "Show last 90 days", icon: "chart", run: () => setRange(90) },
    ];
  }, [router, resolvedTheme, setTheme, openDrawer, toast, setRange, customers]);

  const q = query.trim().toLowerCase();
  const results = useMemo<Command[]>(() => {
    const base = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
    const people: Command[] = q
      ? customers
          .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
          .slice(0, 6)
          .map((c) => ({
            id: `cust-${c.id}`,
            group: "Customers" as const,
            label: c.name,
            hint: `${c.plan} · ${c.email}`,
            icon: "users" as const,
            run: () => router.push(`/customers/${c.id}`),
          }))
      : [];
    return [...base, ...people];
  }, [commands, customers, q, router]);

  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function run(cmd: Command | undefined) {
    if (!cmd) return;
    setPalette(false);
    cmd.run();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[activeIndex]);
    } else if (e.key === "Escape") {
      setPalette(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[15vh] backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setPalette(false);
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-line px-4 text-muted">
          <Icon name="search" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search customers..."
            aria-label="Command palette search"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results.length ? `palette-opt-${activeIndex}` : undefined}
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
          <kbd>Esc</kbd>
        </div>

        <div ref={listRef} id="palette-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted">No results for “{query}”</p>}
          {results.map((cmd, i) => (
            <div key={cmd.id}>
              {(i === 0 || results[i - 1].group !== cmd.group) && (
                <p className="px-3 pb-1 pt-2 text-xs font-medium text-muted">{cmd.group}</p>
              )}
              <button
                type="button"
                id={`palette-opt-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                data-index={i}
                onMouseMove={() => setActive(i)}
                onClick={() => run(cmd)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                  i === activeIndex ? "bg-accent-soft text-accent" : "text-fg",
                )}
              >
                <Icon name={cmd.icon} />
                <span className="flex-1 truncate">{cmd.label}</span>
                {cmd.hint && <span className="truncate text-xs text-muted">{cmd.hint}</span>}
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
