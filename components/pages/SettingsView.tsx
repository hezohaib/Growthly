"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { useDashboard } from "@/store/dashboard";
import { useCustomerStore } from "@/store/customers";
import { useUi } from "@/store/ui";
import { usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { RangeToggle } from "@/components/RangeToggle";
import { Segmented } from "@/components/Segmented";

type ThemeChoice = "light" | "dark" | "system";
const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const MIN_GOAL = 1_000;
const MAX_GOAL = 10_000_000;

function Row({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4 last:border-b-0">
      <div className="max-w-md">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted">{hint}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const compare = useDashboard((s) => s.compare);
  const setCompare = useDashboard((s) => s.setCompare);
  const goal = useDashboard((s) => s.goal);
  const resetPreferences = useDashboard((s) => s.resetPreferences);

  const added = useCustomerStore((s) => s.added.length);
  const edited = useCustomerStore((s) => Object.keys(s.patches).length);
  const removed = useCustomerStore((s) => s.removed.length);
  const resetCustomers = useCustomerStore((s) => s.reset);
  const toast = useUi((s) => s.toast);

  // next-themes only knows the real theme in the browser, so wait until mounted to avoid a hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const themeValue: ThemeChoice = mounted && (theme === "light" || theme === "dark") ? theme : "system";

  const changes = added + edited + removed;

  function onResetCustomers() {
    if (!window.confirm("Remove all customers you added, undo all edits and bring back deleted customers?")) return;
    resetCustomers();
    toast({ message: "Customer changes reset", tone: "info" });
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Preferences are saved in this browser" />

      <section className="panel mb-3">
        <h2 className="text-[15px] font-semibold">Appearance</h2>
        <Row title="Theme" hint="Choose light, dark, or follow your device.">
          <Segmented
            label="Theme"
            options={THEMES}
            value={themeValue}
            onChange={(val) => {
              setTheme(val);
              toast({ message: `Theme switched to ${val}`, tone: "success" });
            }}
          />
        </Row>
      </section>

      <section className="panel mb-3">
        <h2 className="text-[15px] font-semibold">Dashboard</h2>
        <Row title="Default date range" hint="Used by the Overview page. It is remembered the next time you visit.">
          <RangeToggle />
        </Row>
        <Row title="Compare to previous period" hint="Draw the previous period as a dashed line on the trend chart.">
          <button
            type="button"
            role="switch"
            aria-checked={compare}
            aria-label="Compare to previous period"
            onClick={() => {
              setCompare(!compare);
              toast({
                message: !compare ? "Comparison period enabled" : "Comparison period disabled",
                tone: "info",
              });
            }}
            className={cn(
              "relative h-6 w-11 rounded-full border border-line transition-colors",
              compare ? "bg-accent" : "bg-line/70",
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 size-[18px] rounded-full bg-white shadow transition-transform",
                compare && "translate-x-5",
              )}
            />
          </button>
        </Row>
        <Row title="Monthly revenue goal" hint={`Shown as a progress ring on Overview. Between ${usd(MIN_GOAL)} and ${usd(MAX_GOAL)}.`}>
          {/* key remounts the form when the saved goal loads or changes, so the input is always in sync */}
          <GoalForm key={goal} initial={goal} />
        </Row>
      </section>

      <section className="panel">
        <h2 className="text-[15px] font-semibold">Data</h2>
        <Row title="Reset preferences" hint="Go back to the default range, metric, sort order, compare setting and goal.">
          <button
            type="button"
            className="btn"
            onClick={() => {
              resetPreferences();
              toast({ message: "Preferences reset", tone: "info" });
            }}
          >
            Reset preferences
          </button>
        </Row>
        <Row
          title="Reset customer changes"
          hint={
            changes === 0
              ? "You have not added, edited or deleted any customers."
              : `${added} added, ${edited} edited, ${removed} deleted. They are stored only in this browser.`
          }
        >
          <button type="button" className="btn-danger" disabled={changes === 0} onClick={onResetCustomers}>
            Reset customers
          </button>
        </Row>
      </section>
    </>
  );
}

function GoalForm({ initial }: { initial: number }) {
  const setGoal = useDashboard((s) => s.setGoal);
  const toast = useUi((s) => s.toast);
  const [value, setValue] = useState(String(initial));
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(value.replace(/[,\s$]/g, ""));
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      setError("Enter a whole number");
      return;
    }
    if (n < MIN_GOAL || n > MAX_GOAL) {
      setError(`Choose between ${usd(MIN_GOAL)} and ${usd(MAX_GOAL)}`);
      return;
    }
    setError("");
    setGoal(n);
    toast({ message: "Settings updated successfully", tone: "success" });
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex items-center gap-2">
        <input
          aria-label="Monthly revenue goal in US dollars"
          inputMode="numeric"
          className="field w-36"
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
        />
        <button type="submit" className="btn-primary">
          Save
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1 text-xs text-bad">
          {error}
        </p>
      )}
    </form>
  );
}
