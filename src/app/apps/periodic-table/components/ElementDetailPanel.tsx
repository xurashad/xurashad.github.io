"use client";

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Atom,
  FlaskConical,
  History,
  Layers,
  Sparkles,
  ArrowRightLeft,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  BLOCK_INFO,
  ORIGIN_INFO,
  getCategoryInfo,
  getPredictedCategoryLabel,
  type Element,
  type TemperatureUnit,
} from "../lib/types";
import { ELEMENTS } from "../lib/elements";
import { getElementExtra } from "../lib/elementExtras";
import {
  expandFullConfiguration,
  formatAtomicMass,
  formatDensity,
  formatDiscoveryYear,
  formatTemperature,
  getDiscoveryEra,
  getPhaseAtTemperature,
  getPhaseIcon,
  wavelengthToRGB,
} from "../lib/atomUtils";
import {
  BohrDiagramSVG,
  EmissionSpectrumBar,
  IonizationChart,
  OrbitalFillingDiagram,
  SHELL_PALETTE,
} from "./QuantumVisuals";

const AtomModel3D = dynamic(
  () => import("./AtomModel3D").then((m) => ({ default: m.AtomModel3D })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    ),
  }
);

interface Props {
  element: Element;
  tempK: number;
  tempUnit: TemperatureUnit;
  compareSlot: "A" | "B" | null;
  onClose: () => void;
  onNavigate: (el: Element) => void;
  onCompareSelect: (el: Element) => void;
}

type Tab = "overview" | "properties" | "quantum" | "spectrum" | "history";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Atom size={14} /> },
  { id: "properties", label: "Properties", icon: <FlaskConical size={14} /> },
  { id: "quantum", label: "Quantum", icon: <Layers size={14} /> },
  { id: "spectrum", label: "Spectrum", icon: <Sparkles size={14} /> },
  { id: "history", label: "History", icon: <History size={14} /> },
];

function PropertyBar({
  label,
  displayValue,
  value,
  max,
  color,
}: {
  label: string;
  displayValue: string;
  value: number | null;
  max: number;
  color: string;
}) {
  const pct =
    value !== null && max > 0
      ? Math.max(0, Math.min((value / max) * 100, 100))
      : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline text-xs gap-2">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-slate-900 dark:text-slate-100 font-mono font-medium">
          {displayValue}
        </span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-white/[0.07] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}85, ${color})` }}
        />
      </div>
    </div>
  );
}

/** Centered zero-baseline bar for signed Electron Affinity (-250 to +350 kJ/mol) */
function SignedAffinityBar({ value }: { value: number | null }) {
  const minVal = -250;
  const maxVal = 350;
  const zeroPct = ((0 - minVal) / (maxVal - minVal)) * 100; // ~41.67%

  const barStyle = (() => {
    if (value === null) return { left: `${zeroPct}%`, width: "0%" };
    const clamped = Math.max(minVal, Math.min(maxVal, value));
    const valPct = ((clamped - minVal) / (maxVal - minVal)) * 100;
    if (clamped >= 0) {
      return { left: `${zeroPct}%`, width: `${valPct - zeroPct}%` };
    }
    return { left: `${valPct}%`, width: `${zeroPct - valPct}%` };
  })();

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline text-xs">
        <span className="text-slate-600 dark:text-slate-400">
          Electron Affinity
        </span>
        <span className="text-slate-900 dark:text-slate-100 font-mono font-medium">
          {value !== null ? `${value} kJ/mol` : "—"}
        </span>
      </div>
      <div className="h-2 bg-slate-200 dark:bg-white/[0.07] rounded-full relative overflow-hidden">
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-400 dark:bg-white/40 z-10"
          style={{ left: `${zeroPct}%` }}
        />
        {value !== null && (
          <div
            className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
            style={{
              ...barStyle,
              backgroundColor: value >= 0 ? "#10b981" : "#f59e0b",
            }}
          />
        )}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-slate-400 dark:text-slate-500">
        <span>−250 (Endothermic)</span>
        <span>0</span>
        <span>+350 kJ/mol (Exothermic)</span>
      </div>
    </div>
  );
}

/** Visual 0..6500 K thermal state timeline */
function ThermalStateGauge({
  element,
  tempK,
  tempUnit,
}: {
  element: Element;
  tempK: number;
  tempUnit: TemperatureUnit;
}) {
  const maxT = 6500;
  const pct = (v: number) => Math.max(0, Math.min(100, (v / maxT) * 100));
  const meltPct = element.melt !== null ? pct(element.melt) : null;
  const boilPct = element.boil !== null ? pct(element.boil) : null;
  const curPct = pct(tempK);
  const state = getPhaseAtTemperature(element, tempK);

  const spans = (() => {
    if (element.number === 2) {
      const b = boilPct ?? 0.1;
      return {
        solid: { left: 0, width: 0 },
        liquid: { left: 0, width: b },
        gas: { left: b, width: 100 - b },
      };
    }
    if (element.sublimes && boilPct !== null) {
      return {
        solid: { left: 0, width: boilPct },
        liquid: { left: 0, width: 0 },
        gas: { left: boilPct, width: 100 - boilPct },
      };
    }
    const m = meltPct ?? 0;
    const b = boilPct ?? 100;
    return {
      solid: { left: 0, width: element.melt !== null ? m : 0 },
      liquid: {
        left: element.melt !== null ? m : 0,
        width:
          element.melt !== null && element.boil !== null
            ? Math.max(0, b - m)
            : 0,
      },
      gas: {
        left: element.boil !== null ? b : 100,
        width: element.boil !== null ? 100 - b : 0,
      },
    };
  })();

  return (
    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] space-y-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-800 dark:text-slate-100">
          Thermal Phase Gauge
        </span>
        <span className="font-mono text-[11px] text-cyan-700 dark:text-cyan-300">
          At {formatTemperature(tempK, tempUnit, 0)}: <strong>{state}</strong>
        </span>
      </div>

      <div className="relative h-3.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
        {spans.solid.width > 0 && (
          <div
            className="absolute top-0 bottom-0 bg-blue-500/75"
            style={{
              left: `${spans.solid.left}%`,
              width: `${spans.solid.width}%`,
            }}
            title="Solid phase region"
          />
        )}
        {spans.liquid.width > 0 && (
          <div
            className="absolute top-0 bottom-0 bg-cyan-400/80"
            style={{
              left: `${spans.liquid.left}%`,
              width: `${spans.liquid.width}%`,
            }}
            title="Liquid phase region"
          />
        )}
        {spans.gas.width > 0 && (
          <div
            className="absolute top-0 bottom-0 bg-purple-500/70"
            style={{
              left: `${spans.gas.left}%`,
              width: `${spans.gas.width}%`,
            }}
            title="Gas phase region"
          />
        )}
        {/* Current temperature needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-slate-950 dark:bg-white shadow-[0_0_6px_#fff]"
          style={{ left: `${curPct}%` }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Solid
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Liquid
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Gas
          </span>
        </div>
        <span>
          {element.sublimes
            ? `Sublimes: ${formatTemperature(element.boil, tempUnit, 0)}`
            : `MP: ${formatTemperature(element.melt, tempUnit, 0)} · BP: ${formatTemperature(element.boil, tempUnit, 0)}`}
        </span>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-slate-200/70 dark:border-white/[0.05] last:border-0 gap-3">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`text-xs sm:text-sm text-slate-900 dark:text-slate-100 text-right ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function ElementDetailPanel({
  element: el,
  tempK,
  tempUnit,
  compareSlot,
  onClose,
  onNavigate,
  onCompareSelect,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const overlayRef = useRef<HTMLDivElement>(null);

  const cat = getCategoryInfo(el.category);
  const predictedCat = getPredictedCategoryLabel(el.category);
  const extra = getElementExtra(el.number);
  const origin = ORIGIN_INFO[extra.origin];
  const era = getDiscoveryEra(extra.discoveryYear);
  const block = BLOCK_INFO[el.block];
  const dynamicPhase = getPhaseAtTemperature(el, tempK);
  const fullConfig = useMemo(() => expandFullConfiguration(el), [el]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = ELEMENTS.find((x) => x.number === el.number + 1);
        if (next) onNavigate(next);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = ELEMENTS.find((x) => x.number === el.number - 1);
        if (prev) onNavigate(prev);
      }
    },
    [el.number, onClose, onNavigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const prevEl = useMemo(
    () => ELEMENTS.find((x) => x.number === el.number - 1),
    [el.number]
  );
  const nextEl = useMemo(
    () => ELEMENTS.find((x) => x.number === el.number + 1),
    [el.number]
  );

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-950/60 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-5xl bg-white/95 dark:bg-[#0a0d18]/95 border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/8"
          style={{
            background: `linear-gradient(135deg, ${cat.hex}18, transparent 60%)`,
          }}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex flex-col items-center justify-center rounded-xl shadow-sm"
              style={{
                background: `${cat.hex}20`,
                border: `1px solid ${cat.hex}50`,
                color: cat.hex,
              }}
            >
              <span className="text-[10px] font-mono opacity-80 leading-none">
                {el.number}
              </span>
              <span className="text-xl sm:text-2xl font-bold leading-tight">
                {el.symbol}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                  {el.name}
                </h2>
                <span
                  className="text-sm text-slate-500 dark:text-slate-400"
                  title={`State at ${formatTemperature(tempK, tempUnit, 0)}: ${dynamicPhase}`}
                >
                  {getPhaseIcon(dynamicPhase)}
                </span>
                {extra.radioactive && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    <Radio size={10} /> Radioactive
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5 font-medium" style={{ color: cat.hex }}>
                {predictedCat ? `Unknown (Predicted ${predictedCat})` : cat.name} · Period {el.period} · Group {el.group} · {block.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onCompareSelect(el)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                compareSlot
                  ? "border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                  : "border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
              }`}
              title="Add to side-by-side comparison"
            >
              <ArrowRightLeft size={13} />
              <span className="hidden sm:inline">
                {compareSlot ? `Slot ${compareSlot}` : "Compare"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => prevEl && onNavigate(prevEl)}
              disabled={!prevEl}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/8 disabled:opacity-25 transition-colors text-slate-600 dark:text-slate-300"
              title={prevEl ? `Previous: ${prevEl.name}` : ""}
              aria-label="Previous element"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => nextEl && onNavigate(nextEl)}
              disabled={!nextEl}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/8 disabled:opacity-25 transition-colors text-slate-600 dark:text-slate-300"
              title={nextEl ? `Next: ${nextEl.name}` : ""}
              aria-label="Next element"
            >
              <ChevronRight size={18} />
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1" />

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Responsive Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* LEFT: 3D Atom Stage */}
          <div className="w-full lg:w-[46%] shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-white/[0.06] bg-slate-950/[0.97]">
            <div className="h-[290px] sm:h-[340px] lg:h-auto lg:flex-1 relative">
              <AtomModel3D element={el} />
            </div>

            {/* Quick stats below 3D model */}
            <div className="grid grid-cols-3 gap-px border-t border-white/10 bg-white/[0.04]">
              {[
                { label: "Mass", value: `${formatAtomicMass(el)} u` },
                { label: "State", value: dynamicPhase },
                {
                  label: "Density",
                  value:
                    el.density !== null
                      ? el.density < 0.01
                        ? `${(el.density * 1000).toFixed(2)} g/L`
                        : `${el.density.toFixed(2)} g/cm³`
                      : "—",
                },
              ].map((item) => (
                <div key={item.label} className="px-3 py-2.5 text-center bg-slate-950/80">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-slate-100 mt-0.5 truncate">
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Tabbed Details */}
          <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden">
            {/* Tab Bar */}
            <div className="flex overflow-x-auto border-b border-slate-200 dark:border-white/[0.07] px-3 sm:px-4 shrink-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium whitespace-nowrap transition-all relative ${
                    activeTab === tab.id
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="pt-detail-tab-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ background: cat.hex }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Scroll Area */}
            <div className="flex-1 lg:overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${el.number}-${activeTab}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                >
                  {activeTab === "overview" && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Summary
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {el.summary}
                        </p>
                      </div>

                      {extra.uses.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Key Applications
                          </h3>
                          <div className="flex flex-wrap gap-1.5">
                            {extra.uses.map((u) => (
                              <span
                                key={u}
                                className="text-xs px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200"
                              >
                                {u}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {el.appearance && (
                          <div className="p-3 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Appearance
                            </span>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-0.5 capitalize">
                              {el.appearance}
                            </p>
                          </div>
                        )}

                        <div
                          className="p-3 rounded-xl border"
                          style={{
                            borderColor: `${origin.hex}40`,
                            backgroundColor: `${origin.hex}12`,
                          }}
                        >
                          <span
                            className="text-[10px] uppercase tracking-wider font-semibold"
                            style={{ color: origin.hex }}
                          >
                            Cosmic Origin
                          </span>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                            {origin.label}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                            {origin.description}
                          </p>
                        </div>
                      </div>

                      {/* Key facts grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          { label: "Atomic Number", value: String(el.number) },
                          { label: "Atomic Mass", value: `${formatAtomicMass(el)} u` },
                          { label: "Crystal Lattice", value: extra.crystalStructure },
                          {
                            label: "State (Current T)",
                            value: `${dynamicPhase}${el.phase_predicted ? " (pred.)" : ""}`,
                          },
                          {
                            label: "State (STP 298 K)",
                            value: `${el.phase}${el.phase_predicted ? " (pred.)" : ""}`,
                          },
                          {
                            label: "Atomic Radius",
                            value: extra.atomicRadius ? `${extra.atomicRadius} pm` : "—",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]"
                          >
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {item.label}
                            </div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {extra.oxidationStates.length > 0 && (
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                            Common Oxidation States
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {extra.oxidationStates.map((ox) => (
                              <span
                                key={ox}
                                className="px-2 py-0.5 rounded-md font-mono text-xs font-semibold border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100"
                              >
                                {ox > 0 ? `+${ox}` : ox}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "properties" && (
                    <div className="space-y-5">
                      <ThermalStateGauge
                        element={el}
                        tempK={tempK}
                        tempUnit={tempUnit}
                      />

                      {(el.thermal_note || el.phase_predicted) && (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                          <span>
                            {el.thermal_note ??
                              "Superheavy element: bulk physical phase and thermal constants are theoretically predicted rather than directly measured."}
                          </span>
                        </div>
                      )}

                      <div className="space-y-3.5">
                        <PropertyBar
                          label="Melting Point"
                          displayValue={
                            el.sublimes
                              ? "Sublimes at 1 atm"
                              : formatTemperature(el.melt, tempUnit, 1)
                          }
                          value={el.melt}
                          max={3850}
                          color="#f97316"
                        />
                        <PropertyBar
                          label="Boiling Point"
                          displayValue={formatTemperature(el.boil, tempUnit, 1)}
                          value={el.boil}
                          max={6250}
                          color="#ef4444"
                        />
                        <PropertyBar
                          label="Density"
                          displayValue={formatDensity(el.density, el.phase)}
                          value={el.density}
                          max={22.6}
                          color="#3b82f6"
                        />
                        <PropertyBar
                          label="Atomic Radius"
                          displayValue={
                            extra.atomicRadius !== null
                              ? `${extra.atomicRadius} pm`
                              : "—"
                          }
                          value={extra.atomicRadius}
                          max={348}
                          color="#06b6d4"
                        />
                        <PropertyBar
                          label="Electronegativity (Pauling)"
                          displayValue={
                            el.electronegativity_pauling !== null
                              ? String(el.electronegativity_pauling)
                              : "—"
                          }
                          value={el.electronegativity_pauling}
                          max={3.98}
                          color="#8b5cf6"
                        />
                        <PropertyBar
                          label="1st Ionization Energy"
                          displayValue={
                            el.ionization_energies[0] !== undefined
                              ? `${el.ionization_energies[0].toLocaleString()} kJ/mol`
                              : "—"
                          }
                          value={el.ionization_energies[0] ?? null}
                          max={2373}
                          color="#10b981"
                        />
                        <SignedAffinityBar value={el.electron_affinity} />
                      </div>
                    </div>
                  )}

                  {activeTab === "quantum" && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Shorthand Configuration
                          </div>
                          <div className="font-mono text-base font-semibold text-slate-900 dark:text-white mt-1">
                            {el.electron_configuration_semantic}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
                          <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Full Configuration
                          </div>
                          <div className="font-mono text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed">
                            {fullConfig}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                          Aufbau / Hund&apos;s Rule Valence Orbitals
                        </h3>
                        <OrbitalFillingDiagram element={el} accentColor={cat.hex} />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02]">
                        <BohrDiagramSVG
                          element={el}
                          size={156}
                          accentColor={cat.hex}
                        />
                        <div className="flex-1 space-y-2 w-full">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Shell Distribution ({el.shells.reduce((a, b) => a + b, 0)} e⁻)
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {el.shells.map((count, i) => {
                              const sc = SHELL_PALETTE[i % SHELL_PALETTE.length];
                              return (
                                <div
                                  key={i}
                                  className="px-2.5 py-1.5 rounded-lg border text-center min-w-[44px]"
                                  style={{
                                    borderColor: `${sc}55`,
                                    backgroundColor: `${sc}18`,
                                  }}
                                >
                                  <div
                                    className="text-[10px] font-mono opacity-80"
                                    style={{ color: sc }}
                                  >
                                    {["K", "L", "M", "N", "O", "P", "Q"][i]}
                                  </div>
                                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                                    {count}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {el.ionization_energies.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                            Successive Ionization Energies
                          </h3>
                          <IonizationChart
                            energies={el.ionization_energies}
                            color={cat.hex}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "spectrum" && (
                    <div className="space-y-5">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Visible Optical Spectrum (380 – 780 nm)
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                          Atomic emission occurs when excited electrons drop to lower energy levels, releasing photons of characteristic wavelengths; absorption removes the exact same wavelengths from white light.
                        </p>
                        <EmissionSpectrumBar
                          element={el}
                          height={76}
                          interactive
                        />
                      </div>

                      {extra.emissionLines.length > 0 && (
                        <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-100/80 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 font-mono">
                              <tr>
                                <th className="text-left py-2 px-3">Color</th>
                                <th className="text-left py-2 px-3">Wavelength</th>
                                <th className="text-left py-2 px-3">Photon Energy</th>
                                <th className="text-left py-2 px-3">Wavenumber</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.06] font-mono">
                              {extra.emissionLines.map((nm) => (
                                <tr key={nm}>
                                  <td className="py-2 px-3">
                                    <span
                                      className="inline-block w-4 h-4 rounded-full border border-white/25"
                                      style={{
                                        backgroundColor: wavelengthToRGB(nm),
                                      }}
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-slate-900 dark:text-white font-semibold">
                                    {nm.toFixed(1)} nm
                                  </td>
                                  <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                                    {(1239.84198 / nm).toFixed(2)} eV
                                  </td>
                                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                                    {Math.round(1e7 / nm).toLocaleString()} cm⁻¹
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "history" && (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
                        <DataRow
                          label="Discovery Year"
                          value={formatDiscoveryYear(extra.discoveryYear)}
                          mono
                        />
                        <DataRow label="Historical Era" value={era.label} />
                        <DataRow
                          label="Discovered By"
                          value={el.discovered_by || "Unknown"}
                        />
                        <DataRow
                          label="Occurrence"
                          value={
                            extra.synthetic
                              ? "Synthetic (Human-made)"
                              : "Primordial / Naturally occurring"
                          }
                        />
                      </div>

                      <div
                        className="p-4 rounded-xl border"
                        style={{
                          borderColor: `${origin.hex}40`,
                          backgroundColor: `${origin.hex}12`,
                        }}
                      >
                        <div className="text-xs font-semibold" style={{ color: origin.hex }}>
                          Astrophysical Origin: {origin.label}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                          {origin.description}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Historical & Chemical Context
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {el.summary}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
