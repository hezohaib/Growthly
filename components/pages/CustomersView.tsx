"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCustomers } from "@/hooks/useCustomers";
import { useDebounce } from "@/hooks/useDebounce";
import { useDashboard } from "@/store/dashboard";
import { useCustomerStore } from "@/store/customers";
import { useUi } from "@/store/ui";
import { filterSortCustomers, type SortKey } from "@/lib/selectors";
import { customersToCsv, downloadFile } from "@/lib/csv";
import { fullDate, usd } from "@/lib/format";
import { PLANS, STATUSES, type Plan, type Status } from "@/lib/types";
import { cn } from "@/lib/cn";
import { DataGate } from "@/components/DataGate";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlanPill, StatusPill } from "@/components/ui/Pills";

const PAGE_SIZE = 8;

const COLS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "name", label: "Customer" },
  { key: "plan", label: "Plan" },
  { key: "seats", label: "Seats", numeric: true },
  { key: "mrr", label: "Monthly revenue", numeric: true },
  { key: "joined", label: "Joined" },
  { key: "status", label: "Status" },
];

const cell = "border-b border-line px-3 py-3";

export function CustomersView() {
  return (
    <DataGate>
      {() => <CustomersTable />}
    </DataGate>
  );
}

function CustomersTable() {
  const router = useRouter();
  const customers = useCustomers();

  const query = useDashboard((s) => s.query);
  const plan = useDashboard((s) => s.plan);
  const status = useDashboard((s) => s.status);
  const sort = useDashboard((s) => s.sort);
  const pageState = useDashboard((s) => s.page);
  const setQuery = useDashboard((s) => s.setQuery);
  const setPlan = useDashboard((s) => s.setPlan);
  const setStatus = useDashboard((s) => s.setStatus);
  const toggleSort = useDashboard((s) => s.toggleSort);
  const setPage = useDashboard((s) => s.setPage);
  const clearFilters = useDashboard((s) => s.clearFilters);

  const removeCustomer = useCustomerStore((s) => s.remove);
  const restoreCustomer = useCustomerStore((s) => s.restore);
  const openDrawer = useUi((s) => s.openDrawer);
  const toast = useUi((s) => s.toast);

  // The input is local so typing is instant; the store (and table) update after 150ms.
  const [input, setInput] = useState(query);
  const debounced = useDebounce(input, 150);
  useEffect(() => {
    setQuery(debounced);
  }, [debounced, setQuery]);

  // filter -> sort -> paginate
  const rows = useMemo(
    () => filterSortCustomers(customers, { query, plan, status }, sort),
    [customers, query, plan, status, sort],
  );
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(pageState, pages);
  const start = (page - 1) * PAGE_SIZE;
  const view = rows.slice(start, start + PAGE_SIZE);
  const filtered = query.trim() !== "" || plan !== "All" || status !== "All";

  function reset() {
    setInput("");
    clearFilters();
  }

  function exportCsv() {
    downloadFile("Growthly-customers.csv", customersToCsv(rows));
    toast({ message: `Exported ${rows.length} customer${rows.length === 1 ? "" : "s"}` });
  }

  function onDelete(id: string, name: string) {
    removeCustomer(id);
    toast({ message: `${name} deleted`, tone: "info", action: { label: "Undo", onClick: () => restoreCustomer(id) } });
  }

  return (
    <>
      <PageHeader title="Customers" subtitle={`${customers.length} accounts in total`}>
        <button type="button" className="btn" onClick={exportCsv} disabled={rows.length === 0}>
          <Icon name="download" />
          Export CSV
        </button>
        <button type="button" className="btn-primary" onClick={() => openDrawer({ mode: "add" })}>
          <Icon name="plus" />
          Add customer
        </button>
      </PageHeader>

      <section className="panel" aria-label="Customers">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <Icon name="search" />
            </span>
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search customers"
              className="field pl-9"
            />
          </div>
          <select
            aria-label="Filter by plan"
            className="field w-auto"
            value={plan}
            onChange={(e) => setPlan(e.target.value as Plan | "All")}
          >
            <option value="All">All plans</option>
            {PLANS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <select
            aria-label="Filter by status"
            className="field w-auto"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status | "All")}
          >
            <option value="All">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {filtered && (
            <button type="button" className="btn" onClick={reset}>
              Clear filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr>
                {COLS.map((c) => {
                  const on = sort.key === c.key;
                  const aria = on ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
                  return (
                    <th
                      key={c.key}
                      aria-sort={aria}
                      className={cn(cell, "whitespace-nowrap text-[13px] font-medium text-muted", c.numeric ? "text-right" : "text-left")}
                    >
                      <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-fg">
                        {c.label}
                        {on && <Icon name={sort.dir === "asc" ? "arrowUp" : "arrowDown"} size={12} />}
                      </button>
                    </th>
                  );
                })}
                <th className={cell}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {view.map((c) => (
                // `layout` makes rows glide to their new position when the sort or filter changes
                <motion.tr
                  key={c.id}
                  layout="position"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={() => router.push(`/customers/${c.id}`)}
                  className="group cursor-pointer transition-colors duration-150 hover:bg-accent-soft/70"
                >
                  <td className={cell}>
                    <Link
                      href={`/customers/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-3"
                    >
                      <Avatar name={c.name} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{c.name}</span>
                        <span className="block truncate text-xs text-muted">{c.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className={cell}>
                    <PlanPill plan={c.plan} />
                  </td>
                  <td className={cn(cell, "text-right tabular-nums")}>{c.seats}</td>
                  <td className={cn(cell, "text-right font-medium tabular-nums")}>{usd(c.mrr)}</td>
                  <td className={cn(cell, "whitespace-nowrap text-muted")}>{fullDate(c.joined)}</td>
                  <td className={cell}>
                    <StatusPill status={c.status} />
                  </td>
                  <td className={cn(cell, "whitespace-nowrap text-right")}>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Edit ${c.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDrawer({ mode: "edit", id: c.id });
                      }}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      className="icon-btn hover:text-bad"
                      aria-label={`Delete ${c.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(c.id, c.name);
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {view.length === 0 && (
            <div className="py-12 text-center">
              <p className="font-medium">{customers.length === 0 ? "No customers yet" : "No customers match your filters"}</p>
              <p className="mt-1 text-sm text-muted">
                {customers.length === 0 ? "Add your first customer to get started." : "Try a shorter search or clear the filters."}
              </p>
              <div className="mt-4">
                {customers.length === 0 ? (
                  <button type="button" className="btn-primary" onClick={() => openDrawer({ mode: "add" })}>
                    <Icon name="plus" />
                    Add customer
                  </button>
                ) : (
                  <button type="button" className="btn" onClick={reset}>
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[13px] text-muted">
          <span aria-live="polite">
            {rows.length ? `${start + 1} to ${start + view.length} of ${rows.length}` : "0 results"}
          </span>
          <span className="flex items-center gap-2">
            <span className="tabular-nums">
              Page {page} of {pages}
            </span>
            <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <Icon name="chevronLeft" />
              Previous
            </button>
            <button type="button" className="btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              Next
              <Icon name="chevronRight" />
            </button>
          </span>
        </div>
      </section>
    </>
  );
}
