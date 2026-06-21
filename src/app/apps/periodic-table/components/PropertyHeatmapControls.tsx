"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { RotateCcw, ChevronDown } from "lucide-react";
import { HEATMAP_PROPERTIES, type HeatmapProperty } from "../lib/types";
import { ELEMENTS } from "../lib/elements";
import { getHeatmapColor, getPropertyRange } from "../lib/atomUtils";

interface Props {
  property: HeatmapProperty;
  onPropertyChange: (p: HeatmapProperty) => void;
  rangeMin: number;
  rangeMax: number;
  filterMin: number;
  filterMax: number;
  onFilterChange: (min: number, max: number) => void;
  onReset: () => void;
}

export function PropertyHeatmapControls({
  property,
  onPropertyChange,
  rangeMin,
  rangeMax,
  filterMin,
  filterMax,
  onFilterChange,
  onReset,
}: Props) {
  const isCategory = property === "category";
  const currentProp = HEATMAP_PROPERTIES.find((p) => p.key === property);

  // Generate gradient bar
  const gradientStops = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      stops.push(`${getHeatmapColor(t)} ${t * 100}%`);
    }
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white/[0.02] border border-white/6 rounded-xl"
    >
      {/* Property selector */}
      <div className="relative">
        <select
          value={property}
          onChange={(e) => onPropertyChange(e.target.value as HeatmapProperty)}
          className="appearance-none pl-3 pr-8 py-2 text-xs font-medium bg-white/[0.06] border border-white/10 rounded-lg text-foreground/80 cursor-pointer hover:bg-white/[0.08] transition-colors focus:outline-none focus:border-cyan-500/30"
        >
          {HEATMAP_PROPERTIES.map((p) => (
            <option key={p.key} value={p.key} className="bg-[#0c0e18] text-white">
              {p.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none"
        />
      </div>

      {/* Gradient bar + range slider (only for numeric properties) */}
      {!isCategory && (
        <div className="flex-1 flex items-center gap-3 min-w-0 w-full sm:w-auto">
          {/* Min label */}
          <span className="text-[10px] font-mono text-foreground/40 flex-shrink-0 w-14 text-right">
            {filterMin.toFixed(0)}
            {currentProp?.unit ? ` ${currentProp.unit}` : ""}
          </span>

          {/* Gradient + dual range */}
          <div className="flex-1 relative min-w-[200px]">
            {/* Gradient bar */}
            <div
              className="h-2 rounded-full"
              style={{ background: gradientStops }}
            />

            {/* Range slider - min */}
            <input
              type="range"
              min={rangeMin}
              max={rangeMax}
              step={(rangeMax - rangeMin) / 100}
              value={filterMin}
              onChange={(e) => onFilterChange(parseFloat(e.target.value), filterMax)}
              className="absolute inset-0 w-full h-2 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cyan-400/50"
              style={{ pointerEvents: "auto" }}
            />

            {/* Range slider - max */}
            <input
              type="range"
              min={rangeMin}
              max={rangeMax}
              step={(rangeMax - rangeMin) / 100}
              value={filterMax}
              onChange={(e) => onFilterChange(filterMin, parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-2 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cyan-400/50"
              style={{ pointerEvents: "auto" }}
            />
          </div>

          {/* Max label */}
          <span className="text-[10px] font-mono text-foreground/40 flex-shrink-0 w-14">
            {filterMax.toFixed(0)}
            {currentProp?.unit ? ` ${currentProp.unit}` : ""}
          </span>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={onReset}
        className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/8 text-foreground/50 hover:text-foreground/70 hover:bg-white/[0.08] transition-colors flex-shrink-0"
      >
        <RotateCcw size={11} />
        Reset
      </button>
    </motion.div>
  );
}
