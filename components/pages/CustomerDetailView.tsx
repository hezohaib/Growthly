"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCustomers } from "@/hooks/useCustomers";
import { useCustomerStore } from "@/store/customers";
import { useUi } from "@/store/ui";
import { activity, healthLabel, healthScore, healthTone, invoices, mrrHistory, type HealthTone } from "@/lib/customer";
import { compactUsd, fullDate, usd } from "@/lib/format";
import { cn } from "@/lib/cn";
import { DataGate } from "@/components/DataGate";
import { BarChart } from "@/components/charts/BarChart";
import { ProgressRing } from "@/components/charts/ProgressRing";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { PlanPill, StatusPill } from "@/components/ui/Pills";
import type { Customer } from "@/lib/types";

const RING: Record<HealthTone, string> = { good: "stroke-good", warn: "stroke-warn", bad: "stroke-bad" };
const TONE_DOT = { good: "bg-good", bad: "bg-bad", neutral: "bg-muted" } as const;
const INVOICE_STYLE = { Paid: "bg-good/10 text-good", Pending: "bg-warn/10 text-warn", Failed: "bg-bad/10 text-bad" } as const;

export function CustomerDetailView() {
  return <DataGate>{() => <Detail />}</DataGate>;
}

function BackLink() {
  return (
    <Link href="/customers" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-fg">
      <Icon name="arrowLeft" />
      Customers
    </Link>
  );
}

function Detail() {
  const params = useParams<{ id: string }>();
  const customers = useCustomers();
  const customer = customers.find((c) => c.id === params.id);

  if (!customer) {
    return (
      <>
        <BackLink />
        <div className="panel py-12 text-center">
          <p className="font-medium">Customer not found</p>
          <p className="mt-1 text-sm text-muted">It may have been deleted. You can undo a delete from the toast right after it happens.</p>
          <Link href="/customers" className="btn mt-4">
            Back to customers
          </Link>
        </div>
      </>
    );
  }

  return <CustomerProfile customer={customer} />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{value}</p>
    </div>
  );
}

function CustomerProfile({ customer: c }: { customer: Customer }) {
  const router = useRouter();
  const openDrawer = useUi((s) => s.openDrawer);
  const toast = useUi((s) => s.toast);
  const removeCustomer = useCustomerStore((s) => s.remove);
  const restoreCustomer = useCustomerStore((s) => s.restore);

  const history = useMemo(() => mrrHistory(c), [c]);
  const bills = useMemo(() => invoices(c), [c]);
  const events = useMemo(() => activity(c), [c]);
  const score = healthScore(c);

  function onDelete() {
    removeCustomer(c.id);
    toast({ message: `${c.name} deleted`, tone: "info", action: { label: "Undo", onClick: () => restoreCustomer(c.id) } });
    router.push("/customers");
  }

  return (
    <>
      <BackLink />

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={c.name} size={56} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{c.name}</h1>
              <PlanPill plan={c.plan} />
              <StatusPill status={c.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {c.email} · {c.country}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={() => openDrawer({ mode: "edit", id: c.id })}>
            <Icon name="edit" />
            Edit
          </button>
          <button type="button" className="btn-danger" onClick={onDelete}>
            <Icon name="trash" />
            Delete
          </button>
        </div>
      </div>

      <section className="mb-3 grid grid-cols-2 gap-3 min-[900px]:grid-cols-4">
        <Stat label="Monthly revenue" value={usd(c.mrr)} />
        <Stat label="Seats" value={String(c.seats)} />
        <Stat label="Customer since" value={fullDate(c.joined)} />
        <Stat label="Yearly value" value={c.status === "Active" ? usd(c.mrr * 12) : usd(0)} />
      </section>

      <section className="mb-3 grid grid-cols-1 gap-3 min-[1000px]:grid-cols-[2fr_1fr]">
        <div className="panel">
          <h2 className="mb-3 text-[15px] font-semibold">Revenue, last 6 months</h2>
          <BarChart
            labels={history.map((h) => h.label)}
            series={[{ name: "Revenue", values: history.map((h) => h.value), className: "fill-chart-1", dotClassName: "bg-chart-1" }]}
            format={usd}
            formatAxis={compactUsd}
            ariaLabel={`Monthly revenue of ${c.name} over the last 6 months`}
          />
        </div>

        <div className="panel flex flex-col">
          <h2 className="mb-3 text-[15px] font-semibold">Account health</h2>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ProgressRing value={score} size={128} stroke={10} className={RING[healthTone(score)]}>
              <span className="text-2xl font-semibold tabular-nums">{score}</span>
              <span className="text-xs text-muted">out of 100</span>
            </ProgressRing>
            <p className="text-sm font-medium">{healthLabel(score)}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 min-[1000px]:grid-cols-[3fr_2fr]">
        <div className="panel">
          <h2 className="mb-3 text-[15px] font-semibold">Invoices</h2>
          {bills.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[13px] text-muted">
                    <th className="border-b border-line px-2 py-2 font-medium">Invoice</th>
                    <th className="border-b border-line px-2 py-2 font-medium">Date</th>
                    <th className="border-b border-line px-2 py-2 text-right font-medium">Amount</th>
                    <th className="border-b border-line px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b) => (
                    <motion.tr
                      key={b.id}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="transition-colors duration-150 hover:bg-accent-soft/60"
                    >
                      <td className="border-b border-line px-2 py-2.5 tabular-nums">{b.id}</td>
                      <td className="border-b border-line px-2 py-2.5 text-muted">{fullDate(b.date)}</td>
                      <td className="border-b border-line px-2 py-2.5 text-right font-medium tabular-nums">{usd(b.amount)}</td>
                      <td className="border-b border-line px-2 py-2.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", INVOICE_STYLE[b.status])}>{b.status}</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <h2 className="mb-3 text-[15px] font-semibold">Activity</h2>
          <ol className="relative ml-1.5 space-y-4 border-l border-line pl-5">
            {events.map((e, i) => (
              <motion.li
                key={e.id}
                className="relative"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <span className={cn("absolute -left-[26px] top-1.5 size-2.5 rounded-full ring-4 ring-surface", TONE_DOT[e.tone])} />
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted">{fullDate(e.date)}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
