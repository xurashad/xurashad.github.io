"use client";

import { useMemo, useState } from "react";
import { TrendingUp, ChevronDown } from "lucide-react";
import {
  HEATMAP_PROPERTIES,
  getCategoryInfo,
  type Element,
  type HeatmapProperty,
  type TemperatureUnit,
} from "../lib/types";
import {
  convertTemperature,
  formatDensity,
  formatTemperature,
  getElementPropertyValue,
} from "../lib/atomUtils";

interface Props {
  elements: Element[];
  matchingIds: Set<number> | null;
  tempUnit: TemperatureUnit;
  onSelectElement: (el: Element) => void;
}

const PERIOD_BANDS = [
  { period: 1, start: 1, end: 2 },
  { period: 2, start: 3, end: 10 },
  { period: 3, start: 11, end: 18 },
  { period: 4, start: 19, end: 36 },
  { period: 5, start: 37, end: 54 },
  { period: 6, start: 55, end: 86 },
  { period: 7, start: 87, end: 118 },
];

export function PeriodicTrendsChart({
  elements,
  matchingIds,
  tempUnit,
  onSelectElement,
}: Props) {
  const [property, setProperty] = useState<HeatmapProperty>("atomic_radius");
  const [logScale, setLogScale] = useState(false);
  const [hoveredEl, setHoveredEl] = useState<Element | null>(null);

  const propMeta = HEATMAP_PROPERTIES.find((p) => p.key === property)!;

  const { points, yMin, yMax, canUseLog } = useMemo(() => {
    const raw = elements
      .map((el) => {
        let v = getElementPropertyValue(el, property);
        if (v !== null && (property === "melt" || property === "boil")) {
          v = convertTemperature(v, tempUnit);
        }
        return { el, val: v };
      })
      .filter((item): item is { el: Element; val: number } => item.val !== null);

    const vals = raw.map((d) => d.val);
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 1;
    const supportsLog = Boolean(propMeta.supportsLog && min > 0);

    return {
      points: raw,
      yMin: min,
      yMax: max,
      canUseLog: supportsLog,
    };
  }, [elements, property, tempUnit, propMeta.supportsLog]);

  const effectiveLog = canUseLog && logScale;

  // SVG coordinate system
  const W = 1000;
  const H = 400;
  const padL = 62;
  const padR = 24;
  const padT = 34;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xForZ = (z: number) => padL + ((z - 1) / 117) * plotW;
  const yForVal = (val: number) => {
    if (effectiveLog && yMin > 0 && val > 0) {
      const lMin = Math.log10(yMin);
      const lMax = Math.log10(yMax);
      const t = lMax === lMin ? 0.5 : (Math.log10(val) - lMin) / (lMax - lMin);
      return padT + (1 - t) * plotH;
    }
    const span = yMax - yMin;
    const t = span === 0 ? 0.5 : (val - yMin) / span;
    return padT + (1 - t) * plotH;
  };

  // Build line paths per period so discontinuities across periods stay legible
  const periodPaths = useMemo(() => {
    const byPeriod = new Map<number, { x: number; y: number }[]>();
    for (const pt of points) {
      const arr = byPeriod.get(pt.el.period) ?? [];
      arr.push({ x: xForZ(pt.el.number), y: yForVal(pt.val) });
      byPeriod.set(pt.el.period, arr);
    }
    return Array.from(byPeriod.entries()).map(([period, coords]) => ({
      period,
      d: coords.map((c, idx) => `${idx === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" "),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, yMin, yMax, effectiveLog]);

  const yTicks = useMemo(() => {
    const count = 5;
    const out: { val: number; y: number }[] = [];
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      let val: number;
      if (effectiveLog && yMin > 0) {
        const lMin = Math.log10(yMin);
        const lMax = Math.log10(yMax);
        val = Math.pow(10, lMin + t * (lMax - lMin));
      } else {
        val = yMin + t * (yMax - yMin);
      }
      out.push({ val, y: padT + (1 - t) * plotH });
    }
    return out;
  }, [effectiveLog, yMin, yMax, plotH]);

  const formatDetailedVal = (el: Element) => {
    const raw = getElementPropertyValue(el, property);
    if (raw === null) return "—";
    if (property === "melt" || property === "boil") return formatTemperature(raw, tempUnit, 1);
    if (property === "density") return formatDensity(raw, el.phase);
    const unit = propMeta.unit ? ` ${propMeta.unit}` : "";
    return `${Number(raw.toFixed(3))}${unit}`;
  };

  const displayUnit =
    property === "melt" || property === "boil"
      ? tempUnit === "K"
        ? "K"
        : `°${tempUnit}`
      : propMeta.unit;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-4 sm:p-5 space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-300">
            <TrendingUp size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Periodic Trends Across Atomic Number (Z = 1–118)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore periodicity across shells and periods. Click any point to inspect the element in 3D.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={property}
              onChange={(e) => setProperty(e.target.value as HeatmapProperty)}
              aria-label="Trend Y-axis property"
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:border-cyan-500/50"
            >
              {HEATMAP_PROPERTIES.map((p) => (
                <option
                  key={p.key}
                  value={p.key}
                  className="bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white"
                >
                  {p.label} {p.unit ? `(${p.unit})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {canUseLog && (
            <button
              type="button"
              onClick={() => setLogScale((s) => !s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                effectiveLog
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400"
              }`}
            >
              {effectiveLog ? "Log Y" : "Linear Y"}
            </button>
          )}
        </div>
      </div>

      {/* Live readout strip */}
      <div className="min-h-[34px] px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-white/8 bg-slate-50/80 dark:bg-white/[0.03] flex flex-wrap items-center justify-between gap-2 text-xs">
        {hoveredEl ? (
          <>
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded font-mono font-bold text-slate-950"
                style={{ backgroundColor: getCategoryInfo(hoveredEl.category).hex }}
              >
                {hoveredEl.number} {hoveredEl.symbol}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {hoveredEl.name}
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                (Period {hoveredEl.period}, Group {hoveredEl.group})
              </span>
            </div>
            <div className="font-mono font-semibold text-cyan-700 dark:text-cyan-300">
              {propMeta.label}: {formatDetailedVal(hoveredEl)}
            </div>
          </>
        ) : (
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
            Hover over any plotted element ({points.length} of 118 elements have data for {propMeta.label})
          </span>
        )}
      </div>

      {/* Responsive SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[640px] h-auto select-none"
          role="img"
          aria-label={`Periodic trend of ${propMeta.label}`}
        >
          {/* Period alternating shading bands */}
          {PERIOD_BANDS.map((b, idx) => {
            const x1 = xForZ(b.start) - (b.start === 1 ? 0 : 4);
            const x2 = xForZ(b.end) + (b.end === 118 ? 0 : 4);
            return (
              <g key={b.period}>
                <rect
                  x={x1}
                  y={padT}
                  width={Math.max(4, x2 - x1)}
                  height={plotH}
                  className={
                    idx % 2 === 0
                      ? "fill-slate-100/60 dark:fill-white/[0.02]"
                      : "fill-transparent"
                  }
                />
                <text
                  x={(x1 + x2) / 2}
                  y={padT - 10}
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px]"
                >
                  P{b.period}
                </text>
              </g>
            );
          })}

          {/* Horizontal Gridlines & Y Ticks */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1={padL}
                y1={t.y}
                x2={W - padR}
                y2={t.y}
                className="stroke-slate-200 dark:stroke-white/[0.07]"
                strokeDasharray="3 3"
              />
              <text
                x={padL - 8}
                y={t.y + 3.5}
                textAnchor="end"
                className="fill-slate-500 dark:fill-slate-400 font-mono text-[10px]"
              >
                {Math.abs(t.val) >= 1000
                  ? `${(t.val / 1000).toFixed(1)}k`
                  : Math.abs(t.val) < 0.01 && t.val !== 0
                    ? t.val.toExponential(1)
                    : Number(t.val.toFixed(2))}
              </text>
            </g>
          ))}

          {/* Y axis unit label */}
          {displayUnit && (
            <text
              x={14}
              y={padT + plotH / 2}
              transform={`rotate(-90 14 ${padT + plotH / 2})`}
              textAnchor="middle"
              className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px]"
            >
              {propMeta.label} ({displayUnit})
            </text>
          )}

          {/* X axis labels */}
          {[1, 10, 18, 36, 54, 71, 86, 103, 118].map((z) => (
            <text
              key={z}
              x={xForZ(z)}
              y={H - 14}
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-400 font-mono text-[10px]"
            >
              {z}
            </text>
          ))}
          <text
            x={padL + plotW / 2}
            y={H - 2}
            textAnchor="middle"
            className="fill-slate-400 dark:fill-slate-500 font-mono text-[10px]"
          >
            Atomic Number (Z)
          </text>

          {/* Period trend polylines */}
          {periodPaths.map((p) => (
            <path
              key={p.period}
              d={p.d}
              fill="none"
              className="stroke-cyan-500/40 dark:stroke-cyan-400/35"
              strokeWidth={1.6}
            />
          ))}

          {/* Hover crosshair */}
          {hoveredEl && (() => {
            const found = points.find((p) => p.el.number === hoveredEl.number);
            if (!found) return null;
            const cx = xForZ(found.el.number);
            const cy = yForVal(found.val);
            return (
              <g pointerEvents="none">
                <line
                  x1={cx}
                  y1={padT}
                  x2={cx}
                  y2={padT + plotH}
                  className="stroke-cyan-500/50"
                  strokeDasharray="3 3"
                />
                <line
                  x1={padL}
                  y1={cy}
                  x2={W - padR}
                  y2={cy}
                  className="stroke-cyan-500/50"
                  strokeDasharray="3 3"
                />
              </g>
            );
          })()}

          {/* Element scatter points */}
          {points.map(({ el, val }) => {
            const cx = xForZ(el.number);
            const cy = yForVal(val);
            const cat = getCategoryInfo(el.category);
            const dimmed = matchingIds !== null && !matchingIds.has(el.number);
            const isHovered = hoveredEl?.number === el.number;

            return (
              <g
                key={el.number}
                onMouseEnter={() => setHoveredEl(el)}
                onClick={() => onSelectElement(el)}
                className="cursor-pointer"
                style={{ opacity: dimmed ? 0.16 : 1 }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 4.2}
                  fill={cat.hex}
                  stroke="#090d16"
                  strokeWidth={isHovered ? 1.8 : 0.8}
                />
                {isHovered && (
                  <text
                    x={cx}
                    y={cy - 11}
                    textAnchor="middle"
                    className="fill-slate-900 dark:fill-white font-mono text-[11px] font-bold"
                  >
                    {el.symbol}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
