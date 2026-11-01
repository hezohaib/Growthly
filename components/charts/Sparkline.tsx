"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

const W = 100;
const H = 32;

/** Tiny trend line with a soft gradient underneath. */
export function Sparkline({ values, className = "stroke-accent" }: { values: number[]; className?: string }) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotion();

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const n = values.length;
  const pts = values.map((v, i) => [(i / (n - 1)) * W, H - 2 - ((v - min) / span) * (H - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join("");
  const area = `${line}L${W},${H}L0,${H}Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-8 w-full overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.22 }} />
          <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <motion.path
        d={line}
        fill="none"
        className={className}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}
