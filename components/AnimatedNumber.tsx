"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";

interface Props {
  value: number;
  /** must be a stable reference (module-level function) */
  format: (n: number) => string;
}

/** Counts up from 0 on first render, then tweens between values when `value` changes. */
export function AnimatedNumber({ value, format }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();

  // write the animated value straight into the DOM (no React re-render per frame)
  useEffect(() => {
    return mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = format(v);
    });
  }, [mv, format]);

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.7, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, value, reduce]);

  return <span ref={ref}>{format(value)}</span>;
}
