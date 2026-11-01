"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface Slice {
  label: string;
  value: number;
  /** a Tailwind stroke class, e.g. "stroke-chart-1" */
  className: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  stroke?: number;
  /** shown in the middle of the ring */
  children?: ReactNode;
}

export function DonutChart({ slices, size = 168, stroke = 20, children }: Props) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((t, s) => t + s.value, 0) || 1;
  const gap = slices.length > 1 ? 3 : 0;

  // where each arc starts along the circle
  const starts: number[] = [];
  slices.reduce((acc, s) => {
    starts.push(acc);
    return acc + (s.value / total) * c;
  }, 0);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label="Revenue share by plan">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line" />
        {slices.map((s, i) => {
          const len = Math.max((s.value / total) * c - gap, 0);
          return (
            <motion.circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              className={s.className}
              strokeDashoffset={-starts[i]}
              initial={{ strokeDasharray: reduce ? `${len} ${c}` : `0 ${c}` }}
              animate={{ strokeDasharray: `${len} ${c}` }}
              transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : i * 0.12, ease: "easeOut" }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
