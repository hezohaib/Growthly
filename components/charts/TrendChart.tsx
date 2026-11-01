"use client";

import { useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { DayPoint } from "@/lib/types";
import { getPeriods, type Metric } from "@/lib/selectors";
import { niceMax } from "@/lib/chart";
import { compactUsd, num, shortDate, usd } from "@/lib/format";
import { useDashboard } from "@/store/dashboard";
import { cn } from "@/lib/cn";
import { Segmented } from "@/components/Segmented";

const METRICS: { value: Metric; label: string }[] = [
  { value: "revenue", label: "Revenue" },
  { value: "signups", label: "Signups" },
  { value: "active", label: "Active users" },
];

const W = 640;
const H = 260;
const P = { l: 48, r: 12, t: 12, b: 26 };

export function TrendChart({ series }: { series: DayPoint[] }) {
  const range = useDashboard((s) => s.range);
  const metric = useDashboard((s) => s.metric);
  const compare = useDashboard((s) => s.compare);
  const setMetric = useDashboard((s) => s.setMetric);
  const setCompare = useDashboard((s) => s.setCompare);
  const reduce = useReducedMotion();
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geo = useMemo(() => {
    const { cur, prev } = getPeriods(series, range);
    const vals = cur.map((d) => d[metric]);
    const prevVals = prev.map((d) => d[metric]);
    const n = vals.length;
    const max = niceMax(Math.max(...vals, ...(compare ? prevVals : [])));
    const x = (i: number) => P.l + (i / (n - 1)) * (W - P.l - P.r);
    const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
    const path = (vs: number[]) => vs.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");

    const line = path(vals);
    const area = `${line}L${x(n - 1).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`;
    const grid = [0, 1, 2, 3, 4].map((t) => {
      const v = (max / 4) * t;
      return { y: y(v), label: metric === "revenue" ? compactUsd(v) : num(v) };
    });
    const ticks = [0, 0.33, 0.66, 1].map((f) => {
      const i = Math.round(f * (n - 1));
      return {
        x: x(i),
        label: shortDate(cur[i].date),
        anchor: f === 0 ? "start" : f === 1 ? "end" : "middle",
      } as const;
    });
    return { cur, vals, prevVals, n, x, y, line, area, prevLine: path(prevVals), grid, ticks };
  }, [series, range, metric, compare]);

  const { cur, vals, prevVals, n, x, y } = geo;
  const fmt = metric === "revenue" ? usd : num;

  function onMove(e: ReactPointerEvent<SVGRectElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (n - 1))));
    setHover(i);
  }

  return (
    <div className="panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold">Trend</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={compare}
            onClick={() => setCompare(!compare)}
            className={cn("btn", compare && "border-accent/60 bg-accent-soft text-accent")}
          >
            Compare to previous
          </button>
          <Segmented label="Metric" options={METRICS} value={metric} onChange={setMetric} />
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${metric} over the last ${n} days`}
          className="block h-auto w-full overflow-visible"
        >
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.28 }} />
              <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>

          <g className="fill-muted" fontSize={11}>
            {geo.grid.map((g) => (
              <g key={g.y}>
                <line x1={P.l} x2={W - P.r} y1={g.y} y2={g.y} className="stroke-line" />
                <text x={P.l - 8} y={g.y + 4} textAnchor="end">
                  {g.label}
                </text>
              </g>
            ))}
            {geo.ticks.map((t) => (
              <text key={t.x} x={t.x} y={H - 6} textAnchor={t.anchor}>
                {t.label}
              </text>
            ))}
          </g>

          {compare && (
            <path d={geo.prevLine} className="fill-none stroke-muted" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.7} />
          )}

          {/* keyed so the draw-in animation replays when metric or range changes */}
          <g key={`${metric}-${range}`}>
            <motion.path
              d={geo.area}
              fill={`url(#${gid})`}
              initial={{ opacity: reduce ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.3 }}
            />
            <motion.path
              d={geo.line}
              className="fill-none stroke-accent"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 0.9, ease: "easeInOut" }}
            />
          </g>

          {hover !== null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} className="stroke-muted" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(vals[hover])} r={4} strokeWidth={2} className="fill-accent stroke-surface" />
            </>
          )}

          <rect
            x={P.l}
            y={P.t}
            width={W - P.l - P.r}
            height={H - P.t - P.b}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-md bg-fg px-2 py-1.5 text-xs text-bg"
            style={{ left: `${(x(hover) / W) * 100}%` }}
          >
            {shortDate(cur[hover].date)}: <span className="font-semibold">{fmt(vals[hover])}</span>
            {compare && <span className="opacity-70"> · prev {fmt(prevVals[hover])}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
