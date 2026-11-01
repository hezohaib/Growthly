"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUi, type DrawerState } from "@/store/ui";
import { useCustomerStore } from "@/store/customers";
import { useCustomers } from "@/hooks/useCustomers";
import { calcMrr } from "@/lib/customer";
import { customerFormSchema } from "@/lib/schema";
import { COUNTRIES, PLANS, PLAN_PRICE, STATUSES, type Plan, type Status } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { usd } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

interface FormState {
  name: string;
  email: string;
  country: string;
  plan: Plan;
  seats: string;
  status: Status;
}

const EMPTY: FormState = { name: "", email: "", country: "United States", plan: "Starter", seats: "1", status: "Active" };

/** Slide-over form used to add a customer or edit an existing one. */
export function CustomerDrawer() {
  const drawer = useUi((s) => s.drawer);
  return (
    <AnimatePresence>
      {drawer && <DrawerPanel key={drawer.mode === "edit" ? drawer.id : "add"} drawer={drawer} />}
    </AnimatePresence>
  );
}

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[13px] font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1 text-xs text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

function DrawerPanel({ drawer }: { drawer: Exclude<DrawerState, null> }) {
  const close = useUi((s) => s.closeDrawer);
  const toast = useUi((s) => s.toast);
  const addCustomer = useCustomerStore((s) => s.add);
  const updateCustomer = useCustomerStore((s) => s.update);
  const customers = useCustomers();

  const editing = drawer.mode === "edit" ? customers.find((c) => c.id === drawer.id) : undefined;
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          email: editing.email,
          country: editing.country,
          plan: editing.plan,
          seats: String(editing.seats),
          status: editing.status,
        }
      : EMPTY,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Esc closes the drawer
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  // the customer being edited was deleted meanwhile
  useEffect(() => {
    if (drawer.mode === "edit" && !editing) close();
  }, [drawer.mode, editing, close]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: "" } : e));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const seats = Number(form.seats);
    if (form.seats.trim() === "" || Number.isNaN(seats)) {
      setErrors({ seats: "Enter a number" });
      return;
    }

    const parsed = customerFormSchema.safeParse({ ...form, seats });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    const v = parsed.data;
    const mrr = calcMrr(v.plan, v.seats);

    if (editing) {
      updateCustomer(editing.id, { ...v, mrr });
      toast({ message: `${v.name} updated` });
    } else {
      // unique id, also avoiding ids of customers that were deleted earlier
      const taken = new Set([...customers.map((c) => c.id), ...useCustomerStore.getState().removed]);
      const base = slugify(v.name) || "customer";
      let id = base;
      let n = 2;
      while (taken.has(id)) id = `${base}-${n++}`;
      addCustomer({ id, ...v, mrr, joined: new Date().toISOString().slice(0, 10) });
      toast({ message: `${v.name} added` });
    }
    close();
  }

  const seatsNum = Number(form.seats);
  const previewMrr = Number.isInteger(seatsNum) && seatsNum > 0 ? calcMrr(form.plan, seatsNum) : null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit customer" : "Add customer"}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.35 }}
        className="flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold">{editing ? "Edit customer" : "Add customer"}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={close}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <form onSubmit={submit} noValidate className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 px-5 py-5">
            <Field label="Company name" htmlFor="cf-name" error={errors.name}>
              <input
                id="cf-name"
                autoFocus
                className="field"
                value={form.name}
                aria-invalid={Boolean(errors.name)}
                placeholder="e.g. Acme Labs"
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>

            <Field label="Billing email" htmlFor="cf-email" error={errors.email}>
              <input
                id="cf-email"
                type="email"
                className="field"
                value={form.email}
                aria-invalid={Boolean(errors.email)}
                placeholder="billing@company.com"
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>

            <Field label="Country" htmlFor="cf-country" error={errors.country}>
              <select id="cf-country" className="field" value={form.country} onChange={(e) => set("country", e.target.value)}>
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Plan" htmlFor="cf-plan">
                <select id="cf-plan" className="field" value={form.plan} onChange={(e) => set("plan", e.target.value as Plan)}>
                  {PLANS.map((p) => (
                    <option key={p} value={p}>
                      {p} ({usd(PLAN_PRICE[p])})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Seats" htmlFor="cf-seats" error={errors.seats}>
                <input
                  id="cf-seats"
                  inputMode="numeric"
                  className="field"
                  value={form.seats}
                  aria-invalid={Boolean(errors.seats)}
                  onChange={(e) => set("seats", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Status" htmlFor="cf-status">
              <select id="cf-status" className="field" value={form.status} onChange={(e) => set("status", e.target.value as Status)}>
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>

            <div className="rounded-lg border border-line bg-bg px-3 py-2.5 text-sm">
              <span className="text-muted">Monthly revenue: </span>
              <strong className="tabular-nums">{previewMrr === null ? "-" : usd(previewMrr)}</strong>
              <p className="mt-0.5 text-xs text-muted">Plan price plus $5 per seat on paid plans.</p>
            </div>
          </div>

          <div className="mt-auto flex justify-end gap-2 border-t border-line px-5 py-4">
            <button type="button" className="btn" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editing ? "Save changes" : "Add customer"}
            </button>
          </div>
        </form>
      </motion.aside>
    </motion.div>
  );
}
