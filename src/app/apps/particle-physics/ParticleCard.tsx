"use client";

import { FAMILY_COLOURS, DEFAULT_COLOUR, type Particle } from "./lib/particles";

interface Props {
  particle: Particle;
}

export function ParticleCard({ particle }: Props) {
  const col = FAMILY_COLOURS[particle.family] ?? DEFAULT_COLOUR;
  const genLabel = particle.generation ? ` · Gen ${particle.generation}` : "";
  const isFermion = particle.classification === "Fermion";

  return (
    <div
      className={`
        relative flex flex-col h-full
        bg-black/30 backdrop-blur-md rounded-2xl border ${col.border}
        p-5 shadow-lg ${col.shadow}
        hover:shadow-2xl hover:-translate-y-1
        transition-all duration-300 group
      `}
    >
      {/* Header row: name + symbol */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-base font-bold text-foreground/90 leading-tight">{particle.name}</h3>
        <span
          className={`text-3xl font-black font-mono leading-none opacity-35 group-hover:opacity-80 transition-opacity duration-300 shrink-0 ${col.text}`}
        >
          {particle.symbol}
        </span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${col.badge}`}>
          {particle.family}{genLabel}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isFermion
              ? "bg-blue-500/15 text-blue-300 border-blue-400/30"
              : "bg-rose-500/15 text-rose-300 border-rose-400/30"
          }`}
        >
          {particle.classification}
        </span>
      </div>

      {/* Properties */}
      <dl className="space-y-1.5 text-xs text-foreground/65 flex-grow">
        <div className="flex gap-2">
          <dt className="font-semibold text-foreground/40 w-14 shrink-0">Mass</dt>
          <dd className="font-mono">{particle.mass}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold text-foreground/40 w-14 shrink-0">Charge</dt>
          <dd className="font-mono">{particle.charge}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold text-foreground/40 w-14 shrink-0">Spin</dt>
          <dd className="font-mono">{particle.spin}</dd>
        </div>
        {particle.composition && (
          <div className="flex gap-2">
            <dt className="font-semibold text-foreground/40 w-14 shrink-0">Quarks</dt>
            <dd className="font-mono">{particle.composition}</dd>
          </div>
        )}
      </dl>

      {/* Description */}
      <p className="mt-4 pt-3 border-t border-white/8 text-[11px] text-foreground/40 leading-relaxed">
        {particle.description}
      </p>
    </div>
  );
}
