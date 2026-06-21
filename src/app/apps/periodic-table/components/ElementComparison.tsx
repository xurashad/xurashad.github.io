"use client";

import { useEffect, useCallback, useRef } from "react";
import { X, ArrowRightLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import type { Element } from "../lib/types";
import { getCategoryInfo } from "../lib/types";
import { getPhaseIcon } from "../lib/atomUtils";

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
  elementA: Element;
  elementB: Element;
  onClose: () => void;
}

function fmt(v: number | null | undefined, unit = ""): string {
  if (v === null || v === undefined) return "—";
  return `${typeof v === "number" ? v.toLocaleString() : v}${unit}`;
}

interface ComparisonRowProps {
  label: string;
  valueA: string;
  valueB: string;
  numA?: number | null;
  numB?: number | null;
  colorA: string;
  colorB: string;
}

function ComparisonRow({ label, valueA, valueB, numA, numB, colorA, colorB }: ComparisonRowProps) {
  // Determine which is "winning" for visual emphasis
  const aHigher = numA !== null && numA !== undefined && numB !== null && numB !== undefined && numA > numB;
  const bHigher = numA !== null && numA !== undefined && numB !== null && numB !== undefined && numB > numA;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <div className="text-right">
        <span
          className={`text-sm font-mono ${aHigher ? "font-semibold" : "opacity-60"}`}
          style={{ color: aHigher ? colorA : undefined }}
        >
          {valueA}
        </span>
      </div>
      <div className="text-[10px] text-foreground/35 uppercase tracking-wider text-center px-2 min-w-[100px]">
        {label}
      </div>
      <div className="text-left">
        <span
          className={`text-sm font-mono ${bHigher ? "font-semibold" : "opacity-60"}`}
          style={{ color: bHigher ? colorB : undefined }}
        >
          {valueB}
        </span>
      </div>
    </div>
  );
}

export function ElementComparison({ elementA, elementB, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const catA = getCategoryInfo(elementA.category);
  const catB = getCategoryInfo(elementB.category);

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="w-full max-w-5xl bg-[#0a0c14]/95 border border-white/8 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
          <div className="flex items-center gap-3">
            <ArrowRightLeft size={18} className="text-foreground/40" />
            <h2 className="text-lg font-bold text-foreground/80">Element Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-foreground/50"
          >
            <X size={18} />
          </button>
        </div>

        {/* 3D Models side by side */}
        <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
          {[
            { el: elementA, cat: catA },
            { el: elementB, cat: catB },
          ].map(({ el, cat }, idx) => (
            <div key={idx} className="bg-[#0a0c14] p-4">
              {/* Element header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-12 h-12 flex flex-col items-center justify-center rounded-lg"
                  style={{ background: `${cat.hex}18`, border: `1px solid ${cat.hex}35` }}
                >
                  <span className="text-[8px] font-mono" style={{ color: `${cat.hex}80` }}>
                    {el.number}
                  </span>
                  <span className="text-xl font-bold" style={{ color: cat.hex }}>
                    {el.symbol}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground/85">{el.name}</h3>
                  <p className="text-[10px]" style={{ color: `${cat.hex}90` }}>
                    {el.category} · {el.phase} {getPhaseIcon(el.phase)}
                  </p>
                </div>
              </div>

              {/* 3D Atom */}
              <div className="h-48 rounded-xl bg-black/30 border border-white/[0.04] overflow-hidden">
                <AtomModel3D element={el} />
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="px-6 py-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          <ComparisonRow
            label="Atomic Mass"
            valueA={fmt(elementA.atomic_mass, " u")}
            valueB={fmt(elementB.atomic_mass, " u")}
            numA={elementA.atomic_mass}
            numB={elementB.atomic_mass}
            colorA={catA.hex}
            colorB={catB.hex}
          />
          <ComparisonRow
            label="Melting Point"
            valueA={fmt(elementA.melt, " K")}
            valueB={fmt(elementB.melt, " K")}
            numA={elementA.melt}
            numB={elementB.melt}
            colorA={catA.hex}
            colorB={catB.hex}
          />
          <ComparisonRow
            label="Boiling Point"
            valueA={fmt(elementA.boil, " K")}
            valueB={fmt(elementB.boil, " K")}
            numA={elementA.boil}
            numB={elementB.boil}
            colorA={catA.hex}
            colorB={catB.hex}
          />
          <ComparisonRow
            label="Density"
            valueA={fmt(elementA.density, " g/cm³")}
            valueB={fmt(elementB.density, " g/cm³")}
            numA={elementA.density}
            numB={elementB.density}
            colorA={catA.hex}
            colorB={catB.hex}
          />
          <ComparisonRow
            label="Electronegativity"
            valueA={fmt(elementA.electronegativity_pauling)}
            valueB={fmt(elementB.electronegativity_pauling)}
            numA={elementA.electronegativity_pauling}
            numB={elementB.electronegativity_pauling}
            colorA={catA.hex}
            colorB={catB.hex}
          />
          <ComparisonRow
            label="Electron Affinity"
            valueA={fmt(elementA.electron_affinity, " kJ/mol")}
            valueB={fmt(elementB.electron_affinity, " kJ/mol")}
            numA={elementA.electron_affinity}
            numB={elementB.electron_affinity}
            colorA={catA.hex}
            colorB={catB.hex}
          />
          <ComparisonRow
            label="Electron Config"
            valueA={elementA.electron_configuration_semantic}
            valueB={elementB.electron_configuration_semantic}
            colorA={catA.hex}
            colorB={catB.hex}
          />
          <ComparisonRow
            label="Shells"
            valueA={elementA.shells.join(", ")}
            valueB={elementB.shells.join(", ")}
            colorA={catA.hex}
            colorB={catB.hex}
          />
          <ComparisonRow
            label="Block"
            valueA={elementA.block.toUpperCase()}
            valueB={elementB.block.toUpperCase()}
            colorA={catA.hex}
            colorB={catB.hex}
          />
          <ComparisonRow
            label="Period / Group"
            valueA={`P${elementA.period} G${elementA.group}`}
            valueB={`P${elementB.period} G${elementB.group}`}
            colorA={catA.hex}
            colorB={catB.hex}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
