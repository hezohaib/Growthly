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
  const isFirstMount = useRef(true);
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
      if (ref.current) ref.current.textContent = format(value);
      return;
    }

    if (isFirstMount.current) {
      isFirstMount.current = false;
      mv.set(0);
      if (ref.current) ref.current.textContent = format(0);
      const controls = animate(mv, value, {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1], // premium smooth custom easeOut
      });
      return () => controls.stop();
    }

    const controls = animate(mv, value, {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [mv, value, reduce, format]);

  return <span ref={ref}>{format(0)}</span>;
}
