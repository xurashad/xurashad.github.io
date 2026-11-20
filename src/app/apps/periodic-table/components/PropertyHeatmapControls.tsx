"use client";

import { useMemo } from "react";
import { RotateCcw, ChevronDown } from "lucide-react";
import {
  HEATMAP_PROPERTIES,
  type HeatmapPalette,
  type HeatmapProperty,
  type TemperatureUnit,
} from "../lib/types";
import {
  formatPropertyCompact,
  getHeatmapColor,
} from "../lib/atomUtils";

interface Props {
  property: HeatmapProperty;
  onPropertyChange: (p: HeatmapProperty) => void;
  palette: HeatmapPalette;
  onPaletteChange: (pal: HeatmapPalette) => void;
  logScale: boolean;
  onLogScaleChange: (log: boolean) => void;
  tempUnit: TemperatureUnit;
  rangeMin: number;
  rangeMax: number;
  filterMin: number;
  filterMax: number;
  onFilterChange: (min: number, max: number) => void;
  onReset: () => void;
}

const PALETTES: { id: HeatmapPalette; label: string }[] = [
  { id: "viridis", label: "Viridis" },
  { id: "plasma", label: "Plasma" },
  { id: "cividis", label: "Cividis" },
];

export function PropertyHeatmapControls({
  property,
  onPropertyChange,
  palette,
  onPaletteChange,
  logScale,
  onLogScaleChange,
  tempUnit,
  rangeMin,
  rangeMax,
  filterMin,
  filterMax,
  onFilterChange,
  onReset,
}: Props) {
  const currentProp = HEATMAP_PROPERTIES.find((p) => p.key === property);
  const canUseLog = Boolean(currentProp?.supportsLog && rangeMin > 0);
  const effectiveStep = Math.max((rangeMax - rangeMin) / 200, 1e-6);

  const gradientStops = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      stops.push(`${getHeatmapColor(t, palette).rgb} ${t * 100}%`);
    }
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }, [palette]);

  const span = rangeMax - rangeMin;
  const minPct = span === 0 ? 0 : ((filterMin - rangeMin) / span) * 100;
  const maxPct = span === 0 ? 100 : ((filterMax - rangeMin) / span) * 100;

  const displayUnit =
    property === "melt" || property === "boil"
      ? tempUnit === "K"
        ? "K"
        : `°${tempUnit}`
      : currentProp?.unit ?? "";

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-white/8 bg-white/80 dark:bg-white/[0.025] backdrop-blur-sm">
      {/* Property selector */}
      <div className="relative">
        <select
          value={property}
          onChange={(e) => onPropertyChange(e.target.value as HeatmapProperty)}
          aria-label="Heatmap property"
          className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/[0.09] transition-colors focus:outline-none focus:border-cyan-500/50"
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

      {/* Palette selector */}
      <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
        {PALETTES.map((pal) => (
          <button
            key={pal.id}
            type="button"
            onClick={() => onPaletteChange(pal.id)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              palette === pal.id
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {pal.label}
          </button>
        ))}
      </div>

      {/* Linear / Log Scale */}
      {canUseLog && (
        <button
          type="button"
          onClick={() => onLogScaleChange(!logScale)}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-colors ${
            logScale
              ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold"
              : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400"
          }`}
          title="Toggle logarithmic color scaling"
        >
          {logScale ? "Log Scale" : "Linear"}
        </button>
      )}

      {/* Dual-thumb range filter */}
      <div className="flex-1 flex items-center gap-3 min-w-[240px]">
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 shrink-0 min-w-[54px] text-right">
          {formatPropertyCompact(filterMin, property, tempUnit)}
          {displayUnit && property !== "melt" && property !== "boil" && property !== "density"
            ? ` ${displayUnit}`
            : ""}
        </span>

        <div className="flex-1 relative h-5 flex items-center min-w-[140px]">
          {/* Base dim track */}
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
            {/* Active gradient window */}
            <div
              className="absolute top-0 bottom-0 rounded-full"
              style={{
                left: `${minPct}%`,
                right: `${100 - maxPct}%`,
                background: gradientStops,
              }}
            />
          </div>

          {/* Min thumb */}
          <input
            type="range"
            min={rangeMin}
            max={rangeMax}
            step={effectiveStep}
            value={filterMin}
            aria-label="Minimum property filter"
            onChange={(e) => {
              const v = Math.min(parseFloat(e.target.value), filterMax);
              onFilterChange(v, filterMax);
            }}
            className="pt-range-input absolute inset-0 w-full h-full m-0"
          />

          {/* Max thumb */}
          <input
            type="range"
            min={rangeMin}
            max={rangeMax}
            step={effectiveStep}
            value={filterMax}
            aria-label="Maximum property filter"
            onChange={(e) => {
              const v = Math.max(parseFloat(e.target.value), filterMin);
              onFilterChange(filterMin, v);
            }}
            className="pt-range-input absolute inset-0 w-full h-full m-0"
          />
        </div>

        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 shrink-0 min-w-[54px]">
          {formatPropertyCompact(filterMax, property, tempUnit)}
          {displayUnit && property !== "melt" && property !== "boil" && property !== "density"
            ? ` ${displayUnit}`
            : ""}
        </span>
      </div>

      {/* Reset button */}
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors shrink-0"
      >
        <RotateCcw size={11} />
        Reset
      </button>
    </div>
  );
}
