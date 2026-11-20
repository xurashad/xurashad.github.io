"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, ArrowRightLeft, Atom, ChevronDown } from "lucide-react";
import {
  ORIGIN_INFO,
  getCategoryInfo,
  getPredictedCategoryLabel,
  type Element,
  type TemperatureUnit,
} from "../lib/types";
import { getElementExtra } from "../lib/elementExtras";
import {
  formatAtomicMass,
  formatDensityCompact,
  formatDiscoveryYear,
  formatTemperature,
  getElementPropertyValue,
  getPhaseAtTemperature,
} from "../lib/atomUtils";
import { EmissionSpectrumBar } from "./QuantumVisuals";

type SortField =
  | "number"
  | "name"
  | "atomic_mass"
  | "atomic_radius"
  | "density"
  | "melt"
  | "boil"
  | "electronegativity_pauling"
  | "first_ionization"
  | "discovery_year";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "number", label: "Atomic Number" },
  { value: "name", label: "Name" },
  { value: "atomic_mass", label: "Atomic Mass" },
  { value: "atomic_radius", label: "Atomic Radius" },
  { value: "density", label: "Density" },
  { value: "melt", label: "Melting Point" },
  { value: "boil", label: "Boiling Point" },
  { value: "electronegativity_pauling", label: "Electronegativity" },
  { value: "first_ionization", label: "1st Ionization Energy" },
  { value: "discovery_year", label: "Discovery Year" },
];

interface Props {
  elements: Element[];
  tempK: number;
  tempUnit: TemperatureUnit;
  compareA: Element | null;
  compareB: Element | null;
  onSelectElement: (el: Element) => void;
  onCompareSelect: (el: Element) => void;
}

export function ElementCardsView({
  elements,
  tempK,
  tempUnit,
  compareA,
  compareB,
  onSelectElement,
  onCompareSelect,
}: Props) {
  const [sortBy, setSortBy] = useState<SortField>("number");
  const [desc, setDesc] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...elements];
    copy.sort((a, b) => {
      if (sortBy === "name") {
        return desc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      }
      const getVal = (el: Element): number | null => {
        if (sortBy === "number") return el.number;
        if (sortBy === "discovery_year") return getElementExtra(el.number).discoveryYear;
        return getElementPropertyValue(el, sortBy);
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va === null && vb === null) return a.number - b.number;
      if (va === null) return 1;
      if (vb === null) return -1;
      return desc ? vb - va : va - vb;
    });
    return copy;
  }, [elements, sortBy, desc]);

  return (
    <div className="space-y-4">
      {/* Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-white/80 dark:bg-white/[0.025]">
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Showing <strong className="text-slate-900 dark:text-white">{sorted.length}</strong> elements
        </span>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              aria-label="Sort element cards"
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  className="bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white"
                >
                  Sort: {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setDesc((d) => !d)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
          >
            <ArrowDownUp size={12} />
            {desc ? "Desc" : "Asc"}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {sorted.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] text-sm text-slate-500 dark:text-slate-400">
          No elements match the active search or filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {sorted.map((el) => {
            const cat = getCategoryInfo(el.category);
            const pred = getPredictedCategoryLabel(el.category);
            const extra = getElementExtra(el.number);
            const origin = ORIGIN_INFO[extra.origin];
            const phase = getPhaseAtTemperature(el, tempK);
            const isComp =
              compareA?.number === el.number || compareB?.number === el.number;

            return (
              <div
                key={el.number}
                className={`group rounded-2xl border p-3.5 flex flex-col justify-between gap-3 transition-all hover:-translate-y-0.5 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-sm ${
                  isComp
                    ? "border-cyan-500 ring-1 ring-cyan-500/40"
                    : "border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                }`}
              >
                {/* Top row */}
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectElement(el)}
                    className="w-14 h-14 shrink-0 rounded-xl border flex flex-col items-center justify-center transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${cat.hex}1c`,
                      borderColor: `${cat.hex}50`,
                      color: cat.hex,
                    }}
                  >
                    <span className="text-[9px] font-mono opacity-80 leading-none">
                      {el.number}
                    </span>
                    <span className="text-xl font-bold leading-tight">
                      {el.symbol}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectElement(el)}
                        className="text-sm font-bold text-slate-900 dark:text-white truncate hover:text-cyan-600 dark:hover:text-cyan-300 text-left"
                      >
                        {el.name}
                      </button>
                      {extra.radioactive && (
                        <span
                          className="text-[10px] text-rose-500 shrink-0"
                          title="Radioactive"
                        >
                          ☢
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[11px] font-medium truncate"
                      style={{ color: cat.hex }}
                    >
                      {pred ? `Predicted ${pred}` : cat.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {el.electron_configuration_semantic}
                    </p>
                  </div>
                </div>

                {/* Mini metrics */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="px-2 py-1 rounded-lg bg-slate-100/80 dark:bg-white/[0.04]">
                    <div className="text-[8.5px] uppercase text-slate-500 dark:text-slate-400">
                      Mass
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {formatAtomicMass(el)}
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-slate-100/80 dark:bg-white/[0.04]">
                    <div className="text-[8.5px] uppercase text-slate-500 dark:text-slate-400">
                      State
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {phase}
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded-lg bg-slate-100/80 dark:bg-white/[0.04]">
                    <div className="text-[8.5px] uppercase text-slate-500 dark:text-slate-400">
                      Melt
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {el.sublimes
                        ? "Subl."
                        : formatTemperature(el.melt, tempUnit, 0)}
                    </div>
                  </div>
                </div>

                {/* Spectrum & meta */}
                <div className="space-y-1.5">
                  <EmissionSpectrumBar element={el} height={14} compact />
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <span>{formatDiscoveryYear(extra.discoveryYear)}</span>
                    <span style={{ color: origin.hex }}>{origin.shortLabel}</span>
                  </div>
                </div>

                {/* Uses + Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {extra.uses[0] ?? formatDensityCompact(el.density)}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onCompareSelect(el)}
                      className={`p-1.5 rounded-lg border text-[10px] transition-colors ${
                        isComp
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-600 dark:text-cyan-300"
                          : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                      }`}
                      title="Compare element"
                      aria-label={`Compare ${el.name}`}
                    >
                      <ArrowRightLeft size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectElement(el)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-white/10 text-white text-[11px] font-medium hover:bg-slate-800 dark:hover:bg-white/20 transition-colors"
                    >
                      <Atom size={12} />
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
