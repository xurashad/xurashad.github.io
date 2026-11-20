"use client";

import { motion } from "framer-motion";
import { getCategoryInfo, type Element } from "../lib/types";
import {
  formatAtomicMass,
  formatDensityCompact,
  getPhaseAtTemperature,
  getPhaseIcon,
} from "../lib/atomUtils";

interface Props {
  element: Element;
  tempK: number;
  position: { x: number; y: number };
}

export function ElementHoverCard({ element: el, tempK, position }: Props) {
  const cat = getCategoryInfo(el.category);
  const phase = getPhaseAtTemperature(el, tempK);

  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  const style: React.CSSProperties = {
    left: Math.max(12, Math.min(position.x + 18, vw - 268)),
    top: Math.max(12, Math.min(position.y - 68, vh - 210)),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 4 }}
      transition={{ duration: 0.14 }}
      className="fixed z-40 pointer-events-none"
      style={style}
    >
      <div
        className="w-64 rounded-xl border bg-white/95 dark:bg-[#0c101d]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ borderColor: `${cat.hex}45` }}
      >
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${cat.hex}, transparent)`,
          }}
        />

        <div className="p-3">
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 shrink-0 flex flex-col items-center justify-center rounded-lg"
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

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {el.name}
              </h4>
              <p className="text-[11px] font-medium truncate" style={{ color: cat.hex }}>
                {cat.name}
              </p>
              <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {el.electron_configuration_semantic}
              </p>
            </div>

            <span
              className="text-base text-slate-500 dark:text-slate-400"
              title={phase}
            >
              {getPhaseIcon(phase)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.07]">
            {[
              { label: "Mass", value: formatAtomicMass(el) },
              {
                label: "χ Pauling",
                value: el.electronegativity_pauling?.toFixed(2) ?? "—",
              },
              { label: "Density", value: formatDensityCompact(el.density) },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[8.5px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {s.label}
                </div>
                <div className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-100 mt-0.5 truncate">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.05]">
            <span className="text-[8.5px] font-mono text-slate-400 dark:text-slate-500 mr-1">
              SHELLS
            </span>
            {el.shells.map((count, i) => (
              <span
                key={i}
                className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded"
                style={{
                  background: `${cat.hex}1c`,
                  color: cat.hex,
                }}
              >
                {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
