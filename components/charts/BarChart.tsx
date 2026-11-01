"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { niceMax } from "@/lib/chart";

export interface BarSeries {
  name: string;
  values: number[];
  /** a Tailwind fill class, e.g. "fill-chart-1" */
  className: string;
  /** a Tailwind background class for the legend dot, e.g. "bg-chart-1" */
  dotClassName: string;
}

interface Props {
  labels: string[];
  series: BarSeries[];
  /** formats numbers in the tooltip */
  format: (n: number) => string;
  /** formats the y-axis labels (defaults to plain rounded numbers) */
  formatAxis?: (n: number) => string;
  /** show every n-th x label (useful when there are many bars) */
  labelEvery?: number;
  ariaLabel: string;
}

const W = 640;
const H = 240;
const P = { l: 48, r: 8, t: 12, b: 26 };

/** Bar chart with one or more series per group, hover tooltip and a grow-in animation. */
export function BarChart({ labels, series, format, formatAxis = (n) => String(Math.round(n)), labelEvery = 1, ariaLabel }: Props) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  const n = labels.length;
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)));
  const innerW = W - P.l - P.r;
  const innerH = H - P.t - P.b;
  const groupW = innerW / n;
  const gap = 2;
  const barW = Math.min(32, (groupW * 0.72) / series.length - gap);
  const groupInner = barW * series.length + gap * (series.length - 1);
  const base = H - P.b;
  const y = (v: number) => P.t + (1 - v / max) * innerH;

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-4 text-xs text-muted">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${s.dotClassName}`} />
              {s.name}
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel} className="block h-auto w-full overflow-visible">
          <g className="fill-muted" fontSize={11}>
            {[0, 1, 2, 3, 4].map((t) => {
              const v = (max / 4) * t;
              return (
                <g key={t}>
                  <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} className="stroke-line" />
                  <text x={P.l - 8} y={y(v) + 4} textAnchor="end">
                    {formatAxis(v)}
                  </text>
                </g>
              );
            })}
            {labels.map((l, i) =>
              i % labelEvery === 0 ? (
                <text key={`${l}-${i}`} x={P.l + (i + 0.5) * groupW} y={H - 6} textAnchor="middle">
                  {l}
                </text>
              ) : null,
            )}
          </g>

          {hover !== null && (
            <rect x={P.l + hover * groupW} y={P.t} width={groupW} height={innerH} className="fill-accent" opacity={0.07} />
          )}

          {series.map((s, si) =>
            s.values.map((v, i) => {
              const h = Math.max(base - y(v), 0);
              const x = P.l + i * groupW + (groupW - groupInner) / 2 + si * (barW + gap);
              return (
                <motion.rect
                  key={`${s.name}-${i}`}
                  x={x}
                  width={Math.max(barW, 1)}
                  rx={3}
                  className={s.className}
                  initial={{ y: reduce ? base - h : base, height: reduce ? h : 0 }}
                  animate={{ y: base - h, height: h }}
                  transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.02, ease: "easeOut" }}
                />
              );
            }),
          )}

          {labels.map((l, i) => (
            <rect
              key={`hit-${l}-${i}`}
              x={P.l + i * groupW}
              y={P.t}
              width={groupW}
              height={innerH}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            />
          ))}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md bg-fg px-2 py-1.5 text-xs text-bg"
            style={{ left: `${((P.l + (hover + 0.5) * groupW) / W) * 100}%` }}
          >
            <span className="font-medium">{labels[hover]}</span>
            {series.map((s) => (
              <span key={s.name} className="ml-2">
                {series.length > 1 ? `${s.name}: ` : ""}
                {format(s.values[hover])}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
