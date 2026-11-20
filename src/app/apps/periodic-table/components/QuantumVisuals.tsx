"use client";

import { useMemo, useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import type { Element } from "../lib/types";
import { getElementExtra } from "../lib/elementExtras";
import {
  isAnomalousConfig,
  parseElectronConfiguration,
  wavelengthToRGB,
} from "../lib/atomUtils";

export const SHELL_PALETTE = [
  "#38bdf8", // K - sky
  "#34d399", // L - emerald
  "#a78bfa", // M - violet
  "#f472b6", // N - pink
  "#fbbf24", // O - amber
  "#fb923c", // P - orange
  "#22d3ee", // Q - cyan
];

/* -------------------------------------------------------------------------- */
/* 1. 2D Concentric Bohr Model SVG                                             */
/* -------------------------------------------------------------------------- */
export function BohrDiagramSVG({
  element,
  size = 200,
  accentColor,
  compact = false,
}: {
  element: Element;
  size?: number;
  accentColor?: string;
  compact?: boolean;
}) {
  const shells = element.shells;
  const center = size / 2;
  const maxRadius = size * 0.44;
  const nucleusR = Math.max(compact ? 11 : 16, size * 0.085);
  const shellCount = shells.length;

  const radii = useMemo(() => {
    if (shellCount === 0) return [];
    const startR = nucleusR + (compact ? 10 : 14);
    const span = Math.max(12, maxRadius - startR);
    return shells.map((_, i) =>
      shellCount === 1 ? startR + span * 0.6 : startR + (i / (shellCount - 1)) * span
    );
  }, [shells, shellCount, nucleusR, maxRadius, compact]);

  const nucColor = accentColor || element.cpk_hex || "#38bdf8";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="select-none overflow-visible"
      role="img"
      aria-label={`2D Bohr shell diagram of ${element.name}`}
    >
      <defs>
        <radialGradient id={`nuc-${element.number}-${compact ? "c" : "f"}`} cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="45%" stopColor={nucColor} stopOpacity="0.95" />
          <stop offset="100%" stopColor={nucColor} stopOpacity="0.65" />
        </radialGradient>
      </defs>

      {/* Shell rings + electrons */}
      {shells.map((electronCount, sIdx) => {
        const r = radii[sIdx];
        const isValence = sIdx === shellCount - 1;
        const ringColor = SHELL_PALETTE[sIdx % SHELL_PALETTE.length];
        const dotR = compact
          ? isValence
            ? 2.4
            : 1.8
          : isValence
            ? 3.8
            : 2.7;

        return (
          <g key={sIdx}>
            <circle
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke={ringColor}
              strokeWidth={isValence ? 1.3 : 0.9}
              strokeOpacity={isValence ? 0.55 : 0.3}
              strokeDasharray={isValence ? undefined : "2.5 2.5"}
            />
            {Array.from({ length: electronCount }).map((_, eIdx) => {
              const angle =
                (eIdx / electronCount) * Math.PI * 2 - Math.PI / 2 + sIdx * 0.25;
              const ex = center + Math.cos(angle) * r;
              const ey = center + Math.sin(angle) * r;
              return (
                <g key={eIdx}>
                  {isValence && !compact && (
                    <circle
                      cx={ex}
                      cy={ey}
                      r={dotR * 1.9}
                      fill={ringColor}
                      fillOpacity={0.22}
                    />
                  )}
                  <circle
                    cx={ex}
                    cy={ey}
                    r={dotR}
                    fill={ringColor}
                    stroke="#090d16"
                    strokeOpacity={0.25}
                    strokeWidth={0.5}
                  />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* Nucleus */}
      <circle
        cx={center}
        cy={center}
        r={nucleusR + 4}
        fill={nucColor}
        fillOpacity={0.14}
      />
      <circle
        cx={center}
        cy={center}
        r={nucleusR}
        fill={`url(#nuc-${element.number}-${compact ? "c" : "f"})`}
        stroke={nucColor}
        strokeWidth={1}
        strokeOpacity={0.7}
      />
      <text
        x={center}
        y={center + (compact ? 3 : 4)}
        textAnchor="middle"
        fontSize={compact ? 9 : 12}
        fontWeight="700"
        className="fill-slate-950 font-mono"
      >
        {element.symbol}
      </text>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Aufbau / Hund's Rule Orbital Filling Diagram                            */
/* -------------------------------------------------------------------------- */
const SUBSHELL_ORBITAL_COUNT: Record<"s" | "p" | "d" | "f", number> = {
  s: 1,
  p: 3,
  d: 5,
  f: 7,
};

export function OrbitalFillingDiagram({
  element,
  accentColor = "#38bdf8",
}: {
  element: Element;
  accentColor?: string;
}) {
  const parsed = useMemo(
    () => parseElectronConfiguration(element.electron_configuration_semantic),
    [element.electron_configuration_semantic]
  );
  const anomalous = isAnomalousConfig(element.number);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {parsed.core && (
          <div className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.05] text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">
            [{parsed.core}] Core
          </div>
        )}

        {parsed.subshells.map((sub, idx) => {
          const boxCount = SUBSHELL_ORBITAL_COUNT[sub.l];
          const boxes = Array.from({ length: boxCount }).map((_, bIdx) => {
            const hasUp = sub.count > bIdx;
            const hasDown = sub.count > boxCount + bIdx;
            return { hasUp, hasDown };
          });

          return (
            <div
              key={`${sub.label}-${idx}`}
              className="flex flex-col items-center gap-1 p-2 rounded-xl border border-slate-200/80 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.025]"
            >
              <div className="flex gap-1">
                {boxes.map((box, bIdx) => {
                  const unpaired = box.hasUp && !box.hasDown;
                  return (
                    <div
                      key={bIdx}
                      className="w-6 h-7 rounded-md border flex items-center justify-center text-[11px] font-mono font-bold transition-colors"
                      style={{
                        borderColor: box.hasUp
                          ? unpaired
                            ? accentColor
                            : `${accentColor}75`
                          : undefined,
                        backgroundColor: box.hasUp
                          ? `${accentColor}16`
                          : undefined,
                        color: box.hasUp ? accentColor : undefined,
                      }}
                      title={
                        box.hasUp && box.hasDown
                          ? "Spin-paired orbital (↑↓)"
                          : box.hasUp
                            ? "Unpaired electron (↑)"
                            : "Empty orbital"
                      }
                    >
                      {box.hasUp ? (box.hasDown ? "↑↓" : "↑") : ""}
                    </div>
                  );
                })}
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {sub.label}
                <sup>{sub.count}</sup>
              </span>
            </div>
          );
        })}
      </div>

      {anomalous && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[11px] text-amber-800 dark:text-amber-300">
          <Sparkles size={13} className="shrink-0 mt-0.5" />
          <span>
            <strong>Aufbau Exception:</strong> Ground-state orbitals deviate from strict Madelung ordering due to subshell exchange/relativistic stabilization.
          </span>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Physically Rendered Optical Emission / Absorption Spectrum              */
/* -------------------------------------------------------------------------- */
const SPEC_MIN = 380;
const SPEC_MAX = 780;

export function EmissionSpectrumBar({
  element,
  height = 48,
  compact = false,
  interactive = false,
}: {
  element: Element;
  height?: number;
  compact?: boolean;
  interactive?: boolean;
}) {
  const extra = getElementExtra(element.number);
  const lines = extra.emissionLines;
  const [mode, setMode] = useState<"emission" | "absorption">("emission");
  const [activeNm, setActiveNm] = useState<number | null>(null);

  const visibleRainbowGradient = useMemo(() => {
    const stops: string[] = [];
    for (let nm = SPEC_MIN; nm <= SPEC_MAX; nm += 20) {
      const pct = ((nm - SPEC_MIN) / (SPEC_MAX - SPEC_MIN)) * 100;
      stops.push(`${wavelengthToRGB(nm)} ${pct.toFixed(1)}%`);
    }
    return `linear-gradient(90deg, ${stops.join(", ")})`;
  }, []);

  if (lines.length === 0) {
    if (compact) {
      return (
        <div
          className="w-full rounded-md bg-slate-900/90 border border-slate-300/20 dark:border-white/10 flex items-center justify-center text-[9px] font-mono text-slate-400"
          style={{ height }}
        >
          No experimental optical lines (short-lived synthetic)
        </div>
      );
    }
    return (
      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-600 dark:text-slate-400">
        No empirical optical emission lines have been measured for{" "}
        <strong>{element.name}</strong> due to extreme nuclear instability and atom-at-a-time production.
      </div>
    );
  }

  const selectedLine = activeNm ?? lines[0];
  const photonEv = (1239.84198 / selectedLine).toFixed(2);

  return (
    <div className="space-y-2.5">
      {interactive && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
            {(["emission", "absorption"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors ${
                  mode === m
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className="w-3 h-3 rounded-full border border-white/30 inline-block"
              style={{ backgroundColor: wavelengthToRGB(selectedLine) }}
            />
            <span className="text-slate-800 dark:text-slate-200 font-semibold">
              {selectedLine.toFixed(1)} nm
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              ({photonEv} eV)
            </span>
          </div>
        </div>
      )}

      {/* Spectroscope bar */}
      <div
        className="relative w-full rounded-lg overflow-hidden border border-slate-300 dark:border-white/15 shadow-inner"
        style={{
          height,
          background:
            mode === "emission" ? "#04060c" : visibleRainbowGradient,
        }}
      >
        {/* Faint continuous spectrum hint at bottom in emission mode */}
        {mode === "emission" && !compact && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 opacity-45"
            style={{ background: visibleRainbowGradient }}
          />
        )}

        {lines.map((nm) => {
          const pct = Math.max(
            0.5,
            Math.min(99.5, ((nm - SPEC_MIN) / (SPEC_MAX - SPEC_MIN)) * 100)
          );
          const color = wavelengthToRGB(nm);
          const isSelected = interactive && activeNm === nm;
          return (
            <button
              key={nm}
              type="button"
              disabled={!interactive}
              onMouseEnter={() => interactive && setActiveNm(nm)}
              onFocus={() => interactive && setActiveNm(nm)}
              onClick={() => interactive && setActiveNm(nm)}
              aria-label={`${nm} nanometers spectral line`}
              className={`absolute top-0 bottom-0 -translate-x-1/2 ${
                interactive ? "cursor-pointer group" : "cursor-default"
              }`}
              style={{ left: `${pct}%`, width: interactive ? 10 : 4 }}
            >
              <span
                className="block mx-auto h-full transition-all"
                style={{
                  width: isSelected ? 3 : compact ? 2 : 2.5,
                  backgroundColor: mode === "emission" ? color : "#05070d",
                  boxShadow:
                    mode === "emission"
                      ? `0 0 ${isSelected ? 12 : 7}px ${color}, 0 0 2px #ffffff`
                      : "0 0 3px rgba(0,0,0,0.8)",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Wavelength axis ticks */}
      {!compact && (
        <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 px-0.5">
          <span>380 nm (Violet)</span>
          <span>500 nm</span>
          <span>580 nm</span>
          <span>650 nm</span>
          <span>780 nm (Red)</span>
        </div>
      )}

      {/* Line chips */}
      {interactive && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {lines.map((nm) => {
            const c = wavelengthToRGB(nm);
            const active = selectedLine === nm;
            return (
              <button
                key={nm}
                type="button"
                onClick={() => setActiveNm(nm)}
                className={`px-2 py-1 rounded-md text-[11px] font-mono border transition-all flex items-center gap-1.5 ${
                  active
                    ? "border-slate-400 dark:border-white/40 bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-semibold"
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}` }}
                />
                {nm} nm
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Log-Scale Ionization Energy Chart with Valence-Core Jump Detection      */
/* -------------------------------------------------------------------------- */
export function IonizationChart({
  energies,
  color = "#38bdf8",
}: {
  energies: number[];
  color?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const subset = energies.slice(0, 12);

  // Detect largest multiplicative jump (marks valence -> core shell boundary)
  const coreJump = useMemo(() => {
    let maxRatio = 1;
    let jumpIndex = -1;
    for (let i = 1; i < subset.length; i++) {
      const ratio = subset[i] / subset[i - 1];
      if (ratio > maxRatio) {
        maxRatio = ratio;
        jumpIndex = i;
      }
    }
    return maxRatio >= 2.2 ? { index: jumpIndex, ratio: maxRatio } : null;
  }, [subset]);

  if (subset.length === 0) return null;

  const minLog = Math.log10(Math.max(100, Math.min(...subset) * 0.75));
  const maxLog = Math.log10(Math.max(...subset) * 1.15);

  const activeIdx = hoveredIdx ?? 0;
  const activeVal = subset[activeIdx];
  const activeEv = (activeVal * 0.010364).toFixed(2);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 font-semibold">
            IE{activeIdx + 1}
          </span>
          <span className="text-slate-800 dark:text-slate-100 font-semibold">
            {activeVal.toLocaleString()} kJ/mol
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            ({activeEv} eV)
          </span>
        </div>

        {coreJump && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Zap size={10} />
            Core jump at IE{coreJump.index + 1} (×{coreJump.ratio.toFixed(1)})
          </span>
        )}
      </div>

      {/* Log-scale bars */}
      <div className="flex items-end gap-1.5 h-28 pt-3 px-2 pb-1 rounded-xl border border-slate-200/80 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.02]">
        {subset.map((ie, i) => {
          const norm =
            maxLog === minLog
              ? 0.5
              : (Math.log10(ie) - minLog) / (maxLog - minLog);
          const heightPct = Math.max(12, Math.min(100, norm * 100));
          const isJump = coreJump?.index === i;
          const isActive = activeIdx === i;

          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoveredIdx(i)}
              onFocus={() => setHoveredIdx(i)}
              onClick={() => setHoveredIdx(i)}
              className="flex-1 h-full flex flex-col items-center justify-end gap-1 group"
              title={`IE${i + 1}: ${ie.toLocaleString()} kJ/mol`}
            >
              <div
                className="w-full rounded-t-sm transition-all duration-200 relative"
                style={{
                  height: `${heightPct}%`,
                  background: isJump
                    ? "linear-gradient(180deg, #f59e0b, #d97706)"
                    : `linear-gradient(180deg, ${color}, ${color}80)`,
                  opacity: isActive ? 1 : 0.72,
                  boxShadow: isActive ? `0 0 10px ${isJump ? "#f59e0b" : color}60` : undefined,
                }}
              />
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                {i + 1}
              </span>
            </button>
          );
        })}
      </div>

      {energies.length > 12 && (
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
          Showing first 12 of {energies.length} ionization energies (logarithmic scale).
        </p>
      )}
    </div>
  );
}
