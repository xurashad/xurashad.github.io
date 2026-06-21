"use client";

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Atom, FlaskConical, History, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import type { Element } from "../lib/types";
import { getCategoryInfo } from "../lib/types";
import { ELEMENTS } from "../lib/elements";
import { getPhaseIcon } from "../lib/atomUtils";

// Dynamically import the 3D component to avoid SSR issues with Three.js
const AtomModel3D = dynamic(
  () => import("./AtomModel3D").then((m) => ({ default: m.AtomModel3D })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    ),
  }
);

interface Props {
  element: Element;
  onClose: () => void;
  onNavigate: (el: Element) => void;
}

type Tab = "overview" | "properties" | "electron" | "history";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Atom size={15} /> },
  { id: "properties", label: "Properties", icon: <FlaskConical size={15} /> },
  { id: "electron", label: "Electrons", icon: <Layers size={15} /> },
  { id: "history", label: "History", icon: <History size={15} /> },
];

function fmt(v: number | null | undefined, unit = ""): string {
  if (v === null || v === undefined) return "—";
  return `${typeof v === "number" ? v.toLocaleString() : v}${unit}`;
}

/* ---------- Property bar visualization ---------- */
function PropertyBar({
  label,
  value,
  max,
  color,
  unit = "",
}: {
  label: string;
  value: number | null;
  max: number;
  color: string;
  unit?: string;
}) {
  const pct = value !== null ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-foreground/50">{label}</span>
        <span className="text-foreground/80 font-mono">{fmt(value, ` ${unit}`)}</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
        />
      </div>
    </div>
  );
}

/* ---------- Shell diagram (2D) ---------- */
function ShellDiagram({ shells, color }: { shells: number[]; color: string }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {shells.map((count, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className="rounded-full border-2 flex items-center justify-center text-xs font-bold"
            style={{
              width: 32 + i * 8,
              height: 32 + i * 8,
              borderColor: `${color}60`,
              color: color,
              background: `${color}10`,
            }}
          >
            {count}
          </div>
          <span className="text-[9px] text-foreground/40 font-mono">
            {["K", "L", "M", "N", "O", "P", "Q"][i] || `S${i + 1}`}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Data row ---------- */
function DataRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-foreground/45">{label}</span>
      <span className={`text-sm text-foreground/85 text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

/* ---------- Main detail panel ---------- */
export function ElementDetailPanel({ element: el, onClose, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const overlayRef = useRef<HTMLDivElement>(null);

  const cat = getCategoryInfo(el.category);

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        const next = ELEMENTS.find((x) => x.number === el.number + 1);
        if (next) onNavigate(next);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
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

  const prevEl = useMemo(() => ELEMENTS.find((x) => x.number === el.number - 1), [el.number]);
  const nextEl = useMemo(() => ELEMENTS.find((x) => x.number === el.number + 1), [el.number]);

  // Max values for property bars
  const maxMelt = 6000;
  const maxBoil = 6500;
  const maxDensity = 23;
  const maxElectronegativity = 4;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/60 backdrop-blur-md"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      >
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="w-full max-w-5xl bg-[#0a0c14]/95 border-l border-white/8 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ---- Top bar ---- */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-white/6"
            style={{ background: `linear-gradient(135deg, ${cat.hex}12, transparent 60%)` }}
          >
            <div className="flex items-center gap-4">
              {/* Element badge */}
              <div
                className="w-16 h-16 flex flex-col items-center justify-center rounded-xl shadow-lg"
                style={{ background: `${cat.hex}20`, border: `1px solid ${cat.hex}40` }}
              >
                <span className="text-[10px] font-mono opacity-70" style={{ color: cat.hex }}>
                  {el.number}
                </span>
                <span className="text-2xl font-bold" style={{ color: cat.hex }}>
                  {el.symbol}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {el.name}
                  <span className="text-sm font-normal opacity-40 ml-1" title={el.phase}>
                    {getPhaseIcon(el.phase)}
                  </span>
                </h2>
                <p className="text-xs mt-0.5" style={{ color: `${cat.hex}bb` }}>
                  {el.category} · Period {el.period} · Group {el.group} · Block {el.block.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Nav arrows */}
              <button
                onClick={() => prevEl && onNavigate(prevEl)}
                disabled={!prevEl}
                className="p-2 rounded-lg hover:bg-white/8 disabled:opacity-20 transition-colors text-foreground/60"
                title={prevEl ? `Previous: ${prevEl.name}` : ""}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => nextEl && onNavigate(nextEl)}
                disabled={!nextEl}
                className="p-2 rounded-lg hover:bg-white/8 disabled:opacity-20 transition-colors text-foreground/60"
                title={nextEl ? `Next: ${nextEl.name}` : ""}
              >
                <ChevronRight size={18} />
              </button>

              <div className="w-px h-6 bg-white/10 mx-1" />

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-foreground/50 hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ---- Main content ---- */}
          <div className="flex-1 flex overflow-hidden">
            {/* LEFT: 3D Model */}
            <div className="w-full lg:w-[45%] flex flex-col border-r border-white/[0.04]">
              <div className="flex-1 relative">
                <AtomModel3D element={el} />

                {/* Shell info overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-1.5">
                  {el.shells.map((count, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-foreground/40"
                    >
                      {["K", "L", "M", "N", "O", "P", "Q"][i]}={count}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick stats below model */}
              <div className="grid grid-cols-3 gap-px border-t border-white/[0.06] bg-white/[0.02]">
                {[
                  { label: "Mass", value: `${el.atomic_mass.toFixed(3)} u` },
                  { label: "Phase", value: el.phase },
                  { label: "Density", value: el.density ? `${el.density} g/cm³` : "—" },
                ].map((item) => (
                  <div key={item.label} className="px-3 py-2.5 text-center">
                    <div className="text-[10px] text-foreground/35 uppercase tracking-wider">{item.label}</div>
                    <div className="text-sm font-mono text-foreground/75 mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Tabbed info */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Tab bar */}
              <div className="flex border-b border-white/[0.06] px-4">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all relative ${
                      activeTab === tab.id
                        ? "text-foreground/90"
                        : "text-foreground/40 hover:text-foreground/60"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                        style={{ background: cat.hex }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-white/10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "overview" && (
                      <div className="space-y-5">
                        {/* Summary */}
                        <div>
                          <h3 className="text-sm font-semibold text-foreground/70 mb-2">About</h3>
                          <p className="text-sm text-foreground/55 leading-relaxed">{el.summary}</p>
                        </div>

                        {/* Appearance */}
                        {el.appearance && (
                          <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                            <span className="text-xs text-foreground/40">Appearance</span>
                            <p className="text-sm text-foreground/70 mt-0.5 capitalize">{el.appearance}</p>
                          </div>
                        )}

                        {/* Key facts grid */}
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Atomic Number", value: String(el.number) },
                            { label: "Atomic Mass", value: `${el.atomic_mass.toFixed(4)} u` },
                            { label: "Period", value: String(el.period) },
                            { label: "Group", value: String(el.group) },
                            { label: "Block", value: el.block.toUpperCase() },
                            { label: "Phase (STP)", value: el.phase },
                          ].map((item) => (
                            <div
                              key={item.label}
                              className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]"
                            >
                              <div className="text-[10px] text-foreground/35 uppercase tracking-wider">
                                {item.label}
                              </div>
                              <div className="text-sm font-semibold text-foreground/80 mt-1">{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === "properties" && (
                      <div className="space-y-5">
                        {/* Thermal */}
                        <div>
                          <h3 className="text-sm font-semibold text-foreground/70 mb-3">Thermal Properties</h3>
                          <div className="space-y-3">
                            <PropertyBar
                              label="Melting Point"
                              value={el.melt}
                              max={maxMelt}
                              color="#f97316"
                              unit="K"
                            />
                            <PropertyBar
                              label="Boiling Point"
                              value={el.boil}
                              max={maxBoil}
                              color="#ef4444"
                              unit="K"
                            />
                          </div>
                        </div>

                        {/* Physical */}
                        <div>
                          <h3 className="text-sm font-semibold text-foreground/70 mb-3">Physical Properties</h3>
                          <div className="space-y-3">
                            <PropertyBar
                              label="Density"
                              value={el.density}
                              max={maxDensity}
                              color="#3b82f6"
                              unit="g/cm³"
                            />
                            <PropertyBar
                              label="Electronegativity"
                              value={el.electronegativity_pauling}
                              max={maxElectronegativity}
                              color="#8b5cf6"
                            />
                          </div>
                        </div>

                        {/* Additional data */}
                        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
                          <h3
                            className="text-xs font-semibold mb-3 pb-2 border-b border-white/[0.06]"
                            style={{ color: cat.hex }}
                          >
                            Additional Data
                          </h3>
                          <DataRow label="Electron Affinity" value={fmt(el.electron_affinity, " kJ/mol")} mono />
                          <DataRow label="Atomic Mass" value={fmt(el.atomic_mass, " u")} mono />
                          <DataRow label="Density" value={fmt(el.density, " g/cm³")} mono />
                        </div>
                      </div>
                    )}

                    {activeTab === "electron" && (
                      <div className="space-y-5">
                        {/* Configuration */}
                        <div>
                          <h3 className="text-sm font-semibold text-foreground/70 mb-2">
                            Electron Configuration
                          </h3>
                          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06] font-mono text-lg text-foreground/80">
                            {el.electron_configuration_semantic}
                          </div>
                        </div>

                        {/* Shell diagram */}
                        <div>
                          <h3 className="text-sm font-semibold text-foreground/70 mb-3">Electron Shells</h3>
                          <ShellDiagram shells={el.shells} color={cat.hex} />
                          <p className="text-xs text-foreground/40 mt-2 font-mono">
                            {el.shells.join(", ")} ({el.shells.reduce((a, b) => a + b, 0)} electrons)
                          </p>
                        </div>

                        {/* Ionization energies */}
                        {el.ionization_energies.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-foreground/70 mb-2">
                              Ionization Energies (kJ/mol)
                            </h3>
                            <div className="space-y-1.5">
                              {el.ionization_energies.slice(0, 8).map((ie, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <span className="text-[10px] text-foreground/30 font-mono w-6">
                                    IE{i + 1}
                                  </span>
                                  <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${Math.min(
                                          (ie / (el.ionization_energies[el.ionization_energies.length - 1] || ie)) *
                                            100,
                                          100
                                        )}%`,
                                      }}
                                      transition={{ duration: 0.6, delay: i * 0.05 }}
                                      className="h-full rounded-full"
                                      style={{
                                        background: `linear-gradient(90deg, ${cat.hex}60, ${cat.hex})`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-foreground/60 font-mono w-20 text-right">
                                    {ie.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                              {el.ionization_energies.length > 8 && (
                                <p className="text-[10px] text-foreground/30 mt-1">
                                  + {el.ionization_energies.length - 8} more energies
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "history" && (
                      <div className="space-y-5">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground/70 mb-2">Discovery</h3>
                          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                            <DataRow label="Discovered By" value={el.discovered_by || "Unknown"} />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-foreground/70 mb-2">About {el.name}</h3>
                          <p className="text-sm text-foreground/55 leading-relaxed">{el.summary}</p>
                        </div>

                        {/* Bohr model image */}
                        {el.bohr_model_image && (
                          <div>
                            <h3 className="text-sm font-semibold text-foreground/70 mb-2">Bohr Model</h3>
                            <div className="p-4 bg-black/40 rounded-xl border border-white/[0.06] flex justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={el.bohr_model_image}
                                alt={`Bohr model of ${el.name}`}
                                className="max-w-[200px] h-auto"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
