"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Props {
  /** 0 to 100 */
  value: number;
  size?: number;
  stroke?: number;
  /** a Tailwind stroke class, e.g. "stroke-good" */
  className?: string;
  children?: ReactNode;
}

export function ProgressRing({ value, size = 96, stroke = 8, className = "stroke-accent", children }: Props) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={className}
          strokeDasharray={c}
          initial={{ strokeDashoffset: reduce ? c * (1 - clamped / 100) : c }}
          animate={{ strokeDashoffset: c * (1 - clamped / 100) }}
          transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
