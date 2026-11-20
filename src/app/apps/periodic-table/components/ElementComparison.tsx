"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { X, ArrowRightLeft, Orbit, Sparkles, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  ORIGIN_INFO,
  getCategoryInfo,
  type Element,
  type TemperatureUnit,
} from "../lib/types";
import { ELEMENTS } from "../lib/elements";
import { getElementExtra } from "../lib/elementExtras";
import {
  formatAtomicMass,
  formatDensity,
  formatDiscoveryYear,
  formatTemperature,
  getPhaseIcon,
} from "../lib/atomUtils";
import type { AtomViewMode } from "./AtomModel3D";
import { EmissionSpectrumBar } from "./QuantumVisuals";

const AtomModel3D = dynamic(
  () => import("./AtomModel3D").then((m) => ({ default: m.AtomModel3D })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    ),
  }
);

interface Props {
  elementA: Element;
  elementB: Element;
  tempUnit: TemperatureUnit;
  onChangeA: (el: Element) => void;
  onChangeB: (el: Element) => void;
  onSwap: () => void;
  onClose: () => void;
}

function ButterflyRow({
  label,
  valueA,
  valueB,
  numA,
  numB,
  maxScale,
  colorA,
  colorB,
}: {
  label: string;
  valueA: string;
  valueB: string;
  numA?: number | null;
  numB?: number | null;
  maxScale?: number;
  colorA: string;
  colorB: string;
}) {
  const validA = numA !== null && numA !== undefined && !Number.isNaN(numA);
  const validB = numB !== null && numB !== undefined && !Number.isNaN(numB);
  const aHigher = validA && validB && numA > numB;
  const bHigher = validA && validB && numB > numA;

  const denom =
    maxScale ??
    Math.max(
      validA ? Math.abs(numA) : 0,
      validB ? Math.abs(numB) : 0,
      1
    );
  const pctA = validA ? Math.min(100, (Math.abs(numA) / denom) * 100) : 0;
  const pctB = validB ? Math.min(100, (Math.abs(numB) / denom) * 100) : 0;

  return (
    <div className="py-2 border-b border-slate-200/70 dark:border-white/[0.05] last:border-0 space-y-1">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <span
            className={`text-xs sm:text-sm font-mono ${
              aHigher
                ? "font-bold text-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400"
            }`}
            style={{ color: aHigher ? colorA : undefined }}
          >
            {valueA}
          </span>
        </div>

        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center px-2 min-w-[115px]">
          {label}
        </div>

        <div className="text-left">
          <span
            className={`text-xs sm:text-sm font-mono ${
              bHigher
                ? "font-bold text-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400"
            }`}
            style={{ color: bHigher ? colorB : undefined }}
          >
            {valueB}
          </span>
        </div>
      </div>

      {/* Butterfly proportional bars */}
      {(validA || validB) && (
        <div className="grid grid-cols-2 gap-1.5 items-center">
          <div className="h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] flex justify-end overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pctA}%`, backgroundColor: colorA }}
            />
          </div>
          <div className="h-1.5 rounded-full bg-slate-200/80 dark:bg-white/[0.06] flex justify-start overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pctB}%`, backgroundColor: colorB }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ElementComparison({
  elementA,
  elementB,
  tempUnit,
  onChangeA,
  onChangeB,
  onSwap,
  onClose,
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [shared3DMode, setShared3DMode] = useState<AtomViewMode>("bohr");

  const catA = getCategoryInfo(elementA.category);
  const catB = getCategoryInfo(elementB.category);
  const extraA = getElementExtra(elementA.number);
  const extraB = getElementExtra(elementB.number);

  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [handleEsc]);

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 280 }}
        className="w-full max-w-5xl max-h-[92vh] bg-white/95 dark:bg-[#0a0d18]/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <ArrowRightLeft size={17} className="text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Element Comparison
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Shared 3D Mode Switch */}
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShared3DMode("bohr")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  shared3DMode === "bohr"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Orbit size={11} />
                Bohr 3D
              </button>
              <button
                type="button"
                onClick={() => setShared3DMode("quantum")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  shared3DMode === "quantum"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Sparkles size={11} />
                Orbital Cloud
              </button>
            </div>

            <button
              type="button"
              onClick={onSwap}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title="Swap elements A and B"
            >
              <ArrowRightLeft size={12} />
              Swap
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400"
              aria-label="Close comparison"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* 3D Models + Element Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 dark:bg-white/[0.06] border-b border-slate-200 dark:border-white/[0.06]">
            {[
              {
                el: elementA,
                cat: catA,
                slot: "A",
                onSelect: onChangeA,
              },
              {
                el: elementB,
                cat: catB,
                slot: "B",
                onSelect: onChangeB,
              },
            ].map(({ el, cat, slot, onSelect }) => (
              <div key={slot} className="bg-white dark:bg-[#0a0d18] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 shrink-0 flex flex-col items-center justify-center rounded-lg"
                      style={{
                        background: `${cat.hex}20`,
                        border: `1px solid ${cat.hex}45`,
                        color: cat.hex,
                      }}
                    >
                      <span className="text-[8px] font-mono opacity-80 leading-none">
                        {el.number}
                      </span>
                      <span className="text-lg font-bold leading-tight">
                        {el.symbol}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold">
                          {slot}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {el.name}
                        </h3>
                      </div>
                      <p className="text-[11px] truncate" style={{ color: cat.hex }}>
                        {cat.name} · {el.phase} {getPhaseIcon(el.phase)}
                      </p>
                    </div>
                  </div>

                  {/* Quick element switcher */}
                  <div className="relative shrink-0">
                    <select
                      value={el.number}
                      onChange={(e) => {
                        const found = ELEMENTS.find(
                          (item) => item.number === Number(e.target.value)
                        );
                        if (found) onSelect(found);
                      }}
                      aria-label={`Select Element ${slot}`}
                      className="appearance-none pl-2.5 pr-7 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 cursor-pointer max-w-[140px]"
                    >
                      {ELEMENTS.map((item) => (
                        <option
                          key={item.number}
                          value={item.number}
                          className="bg-white dark:bg-[#0c101d] text-slate-900 dark:text-white"
                        >
                          {item.number}. {item.symbol} — {item.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                {/* 3D Viewport */}
                <div className="h-44 rounded-xl bg-slate-950 border border-slate-200/50 dark:border-white/[0.06] overflow-hidden">
                  <AtomModel3D
                    element={el}
                    mode={shared3DMode}
                    showControls={false}
                  />
                </div>

                {/* Aligned Emission Spectrum Strip */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>Optical Emission (380–780 nm)</span>
                    <span>{getElementExtra(el.number).emissionLines.length} lines</span>
                  </div>
                  <EmissionSpectrumBar element={el} height={22} compact />
                </div>
              </div>
            ))}
          </div>

          {/* Butterfly Property Comparison Table */}
          <div className="px-5 py-4">
            <ButterflyRow
              label="Atomic Mass"
              valueA={`${formatAtomicMass(elementA)} u`}
              valueB={`${formatAtomicMass(elementB)} u`}
              numA={elementA.atomic_mass}
              numB={elementB.atomic_mass}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Atomic Radius"
              valueA={extraA.atomicRadius ? `${extraA.atomicRadius} pm` : "—"}
              valueB={extraB.atomicRadius ? `${extraB.atomicRadius} pm` : "—"}
              numA={extraA.atomicRadius}
              numB={extraB.atomicRadius}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Density"
              valueA={formatDensity(elementA.density, elementA.phase)}
              valueB={formatDensity(elementB.density, elementB.phase)}
              numA={elementA.density}
              numB={elementB.density}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Melting Point"
              valueA={formatTemperature(elementA.melt, tempUnit, 1)}
              valueB={formatTemperature(elementB.melt, tempUnit, 1)}
              numA={elementA.melt}
              numB={elementB.melt}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Boiling Point"
              valueA={formatTemperature(elementA.boil, tempUnit, 1)}
              valueB={formatTemperature(elementB.boil, tempUnit, 1)}
              numA={elementA.boil}
              numB={elementB.boil}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Electronegativity"
              valueA={
                elementA.electronegativity_pauling !== null
                  ? String(elementA.electronegativity_pauling)
                  : "—"
              }
              valueB={
                elementB.electronegativity_pauling !== null
                  ? String(elementB.electronegativity_pauling)
                  : "—"
              }
              numA={elementA.electronegativity_pauling}
              numB={elementB.electronegativity_pauling}
              maxScale={4.0}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="1st Ionization"
              valueA={
                elementA.ionization_energies[0] !== undefined
                  ? `${elementA.ionization_energies[0].toLocaleString()} kJ/mol`
                  : "—"
              }
              valueB={
                elementB.ionization_energies[0] !== undefined
                  ? `${elementB.ionization_energies[0].toLocaleString()} kJ/mol`
                  : "—"
              }
              numA={elementA.ionization_energies[0] ?? null}
              numB={elementB.ionization_energies[0] ?? null}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Electron Affinity"
              valueA={
                elementA.electron_affinity !== null
                  ? `${elementA.electron_affinity} kJ/mol`
                  : "—"
              }
              valueB={
                elementB.electron_affinity !== null
                  ? `${elementB.electron_affinity} kJ/mol`
                  : "—"
              }
              numA={elementA.electron_affinity}
              numB={elementB.electron_affinity}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Electron Config"
              valueA={elementA.electron_configuration_semantic}
              valueB={elementB.electron_configuration_semantic}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Oxidation States"
              valueA={
                extraA.oxidationStates.length
                  ? extraA.oxidationStates.map((o) => (o > 0 ? `+${o}` : o)).join(", ")
                  : "—"
              }
              valueB={
                extraB.oxidationStates.length
                  ? extraB.oxidationStates.map((o) => (o > 0 ? `+${o}` : o)).join(", ")
                  : "—"
              }
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Crystal Lattice"
              valueA={extraA.crystalStructure}
              valueB={extraB.crystalStructure}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Cosmic Origin"
              valueA={ORIGIN_INFO[extraA.origin].shortLabel}
              valueB={ORIGIN_INFO[extraB.origin].shortLabel}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Discovered"
              valueA={formatDiscoveryYear(extraA.discoveryYear)}
              valueB={formatDiscoveryYear(extraB.discoveryYear)}
              colorA={catA.hex}
              colorB={catB.hex}
            />
            <ButterflyRow
              label="Position"
              valueA={`P${elementA.period} · G${elementA.group} · ${elementA.block}-blk`}
              valueB={`P${elementB.period} · G${elementB.group} · ${elementB.block}-blk`}
              colorA={catA.hex}
              colorB={catB.hex}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
