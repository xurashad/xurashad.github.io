"use client";

import { motion } from "framer-motion";
import type { Element } from "../lib/types";
import { getCategoryInfo } from "../lib/types";
import { getPhaseIcon } from "../lib/atomUtils";

interface Props {
  element: Element;
  position: { x: number; y: number };
}

export function ElementHoverCard({ element: el, position }: Props) {
  const cat = getCategoryInfo(el.category);

  // Calculate position to keep card in viewport
  const style: React.CSSProperties = {
    left: Math.min(position.x + 16, window.innerWidth - 280),
    top: Math.min(position.y - 60, window.innerHeight - 200),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 5 }}
      transition={{ duration: 0.15 }}
      className="fixed z-40 pointer-events-none"
      style={style}
    >
      <div
        className="w-60 rounded-xl border bg-[#0c0e18]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
        style={{ borderColor: `${cat.hex}30` }}
      >
        {/* Top accent */}
        <div
          className="h-0.5 w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${cat.hex}, transparent)` }}
        />

        <div className="p-3">
          {/* Header row */}
          <div className="flex items-start gap-3">
            {/* Mini element tile */}
            <div
              className="w-12 h-12 flex-shrink-0 flex flex-col items-center justify-center rounded-lg"
              style={{
                background: `${cat.hex}18`,
                border: `1px solid ${cat.hex}35`,
              }}
            >
              <span className="text-[8px] font-mono opacity-60" style={{ color: cat.hex }}>
                {el.number}
              </span>
              <span className="text-lg font-bold leading-none" style={{ color: cat.hex }}>
                {el.symbol}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground/90 truncate">{el.name}</h4>
              <p className="text-[10px] mt-0.5" style={{ color: `${cat.hex}90` }}>
                {el.category}
              </p>
            </div>

            <span className="text-lg opacity-40" title={el.phase}>
              {getPhaseIcon(el.phase)}
            </span>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/[0.06]">
            {[
              { label: "Mass", value: el.atomic_mass.toFixed(2) },
              { label: "e⁻ neg", value: el.electronegativity_pauling?.toFixed(2) || "—" },
              { label: "Density", value: el.density?.toFixed(2) || "—" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[8px] text-foreground/30 uppercase tracking-wider">{s.label}</div>
                <div className="text-[11px] font-mono text-foreground/65 mt-0.5">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Shell preview */}
          <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-white/[0.04]">
            <span className="text-[8px] text-foreground/25 mr-1">SHELLS</span>
            {el.shells.map((count, i) => (
              <span
                key={i}
                className="text-[9px] font-mono px-1 py-0.5 rounded"
                style={{
                  background: `${cat.hex}12`,
                  color: `${cat.hex}90`,
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
