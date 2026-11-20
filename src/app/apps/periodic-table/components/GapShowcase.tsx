"use client";

import { ORIGIN_INFO, getCategoryInfo, getPredictedCategoryLabel, type Element, type TemperatureUnit } from "../lib/types";
import { getElementExtra } from "../lib/elementExtras";
import {
  formatAtomicMass,
  formatDensityCompact,
  formatDiscoveryYear,
  formatTemperature,
  getPhaseAtTemperature,
} from "../lib/atomUtils";
import { BohrDiagramSVG, EmissionSpectrumBar } from "./QuantumVisuals";

interface Props {
  element: Element;
  tempK: number;
  tempUnit: TemperatureUnit;
  isIdlePreview: boolean;
  gridColumn?: string;
  gridRow?: string;
  onInspect: (el: Element) => void;
}

export function GapShowcase({
  element: el,
  tempK,
  tempUnit,
  isIdlePreview,
  gridColumn = "4 / 14",
  gridRow = "2 / 5",
  onInspect,
}: Props) {
  const cat = getCategoryInfo(el.category);
  const predictedCat = getPredictedCategoryLabel(el.category);
  const extra = getElementExtra(el.number);
  const origin = ORIGIN_INFO[extra.origin];
  const dynamicPhase = getPhaseAtTemperature(el, tempK);
  const firstIE = el.ionization_energies[0] ?? null;

  return (
    <div
      className="relative w-full h-full min-h-0 hidden md:block"
      style={{ gridColumn, gridRow }}
    >
      <div
        onClick={() => onInspect(el)}
        role="button"
        tabIndex={-1}
        className="absolute inset-0.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/85 dark:bg-[#0c101d]/90 backdrop-blur-md p-2.5 lg:p-3 flex items-center gap-3 overflow-hidden cursor-pointer hover:border-cyan-400/50 transition-colors shadow-sm"
        style={{
          backgroundImage: `radial-gradient(circle at 12% 20%, ${cat.hex}18, transparent 55%)`,
        }}
      >
        {/* Left: Styled Element Badge */}
        <div
          className="w-20 lg:w-24 h-full max-h-[156px] shrink-0 rounded-xl border flex flex-col justify-between p-2 select-none"
          style={{
            backgroundColor: `${cat.hex}18`,
            borderColor: `${cat.hex}50`,
          }}
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-[color:var(--l)] dark:text-[color:var(--d)]"
            style={{
              ["--l" as string]: cat.lightText,
              ["--d" as string]: cat.darkText,
            }}
          >
            <span>{el.number}</span>
            <span>{el.block}-blk</span>
          </div>
          <div
            className="text-center font-bold text-2xl lg:text-3xl leading-none text-[color:var(--l)] dark:text-[color:var(--d)]"
            style={{
              ["--l" as string]: cat.lightText,
              ["--d" as string]: cat.darkText,
            }}
          >
            {el.symbol}
          </div>
          <div className="text-center">
            <div className="text-[10px] font-semibold truncate text-slate-800 dark:text-slate-100">
              {el.name}
            </div>
            <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
              {formatAtomicMass(el)} u
            </div>
          </div>
        </div>

        {/* Center: Details, Metrics & Spectrum Strip */}
        <div className="flex-1 min-w-0 h-full flex flex-col justify-between py-0.5 gap-1.5">
          {/* Header line */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border truncate"
                style={{
                  backgroundColor: `${cat.hex}18`,
                  borderColor: `${cat.hex}45`,
                  color: cat.hex,
                }}
              >
                {predictedCat ? `Predicted ${predictedCat}` : cat.name}
              </span>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border hidden lg:inline-flex items-center gap-1"
                style={{
                  backgroundColor: `${origin.hex}15`,
                  borderColor: `${origin.hex}40`,
                  color: origin.hex,
                }}
              >
                {origin.shortLabel}
              </span>
              {extra.radioactive && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30">
                  ☢ Radioactive
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
              {isIdlePreview ? "Hover or arrow-key any element" : "Click tile for 3D lab"}
            </span>
          </div>

          {/* 6 Quick Metrics Grid */}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5">
            {[
              { label: "State", value: dynamicPhase },
              {
                label: "Melt",
                value: el.sublimes
                  ? "Sublimes"
                  : formatTemperature(el.melt, tempUnit, 0),
              },
              { label: "Boil", value: formatTemperature(el.boil, tempUnit, 0) },
              {
                label: "Density",
                value: formatDensityCompact(el.density),
              },
              {
                label: "χ Pauling",
                value:
                  el.electronegativity_pauling !== null
                    ? el.electronegativity_pauling.toFixed(2)
                    : "—",
              },
              {
                label: "1st IE",
                value: firstIE !== null ? `${Math.round(firstIE)}` : "—",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="px-2 py-1 rounded-lg bg-slate-100/75 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06]"
              >
                <div className="text-[8.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {m.label}
                </div>
                <div className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Electron config + Spectral bar */}
          <div className="flex items-center gap-3">
            <div className="shrink-0 max-w-[44%]">
              <div className="text-[10px] font-mono font-medium text-slate-700 dark:text-slate-200 truncate">
                {el.electron_configuration_semantic}
              </div>
              <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate">
                Discovered: {formatDiscoveryYear(extra.discoveryYear)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <EmissionSpectrumBar element={el} height={18} compact />
            </div>
          </div>
        </div>

        {/* Right: 2D Bohr Shell Diagram */}
        <div className="hidden xl:flex shrink-0 items-center justify-center pl-1">
          <BohrDiagramSVG
            element={el}
            size={128}
            accentColor={cat.hex}
            compact
          />
        </div>
      </div>
    </div>
  );
}
