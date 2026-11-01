"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CohortRow } from "@/lib/reports";
import { num } from "@/lib/format";

/** Rows are signup months, columns are months since signup. Darker cell = more users kept. */
export function CohortHeatmap({ rows }: { rows: CohortRow[] }) {
  const reduce = useReducedMotion();
  const columns = rows[0]?.values.length ?? 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-separate border-spacing-1 text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th className="px-2 py-1 text-left font-medium">Cohort</th>
            <th className="px-2 py-1 text-right font-medium">Users</th>
            {Array.from({ length: columns }, (_, k) => (
              <th key={k} className="px-2 py-1 text-center font-medium">
                {k === 0 ? "Month 0" : `+${k}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.label}>
              <td className="px-2 py-1 font-medium">{row.label}</td>
              <td className="px-2 py-1 text-right tabular-nums text-muted">{num(row.size)}</td>
              {row.values.map((v, k) =>
                v === null ? (
                  <td key={k} className="rounded-md border border-dashed border-line" />
                ) : (
                  <motion.td
                    key={k}
                    initial={{ opacity: reduce ? 1 : 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: reduce ? 0 : i * 0.05 + k * 0.04, duration: 0.3 }}
                    className="rounded-md px-2 py-2 text-center text-xs font-medium tabular-nums"
                    style={{
                      backgroundColor: `color-mix(in srgb, var(--accent) ${Math.round(v * 0.85)}%, transparent)`,
                      color: v >= 70 ? "var(--on-accent)" : "var(--text)",
                    }}
                  >
                    {v}%
                  </motion.td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
