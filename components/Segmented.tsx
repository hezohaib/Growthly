"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Option<T> {
  value: T;
  label: string;
}

interface Props<T extends string | number> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Button group with a highlight that slides between options. */
export function Segmented<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  const id = useId();

  return (
    <div role="group" aria-label={label} className="inline-flex overflow-hidden rounded-lg border border-line bg-surface">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative px-3 py-1.5 text-[13px] focus-visible:-outline-offset-2",
              on ? "font-semibold text-accent" : "text-muted hover:text-fg",
            )}
          >
            {on && (
              <motion.span
                layoutId={id}
                className="absolute inset-0 bg-accent-soft"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
