"use client";

import {
  FAMILY_COLOURS,
  DEFAULT_COLOUR,
  FORCE_META,
  QUARK_COLOR_HEX,
  flipQuarkColor,
  formatEffectiveCharge,
  getLogMassFraction,
  type FundamentalForce,
  type Particle,
} from "./lib/particles";
import { ParticleGlyph } from "./components/ParticleGlyph";

interface Props {
  particle: Particle;
  selected?: boolean;
  antimatter?: boolean;
  onSelect?: (p: Particle) => void;
}

const ALL_FORCES: FundamentalForce[] = [
  "Strong",
  "Electromagnetic",
  "Weak",
  "Higgs",
  "Gravity",
];

export function ParticleCard({
  particle,
  selected = false,
  antimatter = false,
  onSelect,
}: Props) {
  const col = FAMILY_COLOURS[particle.family] ?? DEFAULT_COLOUR;
  const genLabel = particle.generation ? ` · Gen ${particle.generation}` : "";
  const isFermion = particle.classification === "Fermion";
  const effectiveAnti = antimatter && !particle.selfConjugate;
  const displayName = effectiveAnti ? particle.antiparticle : particle.name;
  const displaySymbol = effectiveAnti ? particle.antiparticleSymbol : particle.symbol;
  const displayCharge = formatEffectiveCharge(particle, effectiveAnti);
  const logMassFrac = getLogMassFraction(particle.massMeV);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(particle)}
      aria-pressed={selected}
      className={`
        relative flex flex-col h-full w-full text-left
        bg-white/85 dark:bg-black/35 backdrop-blur-md rounded-2xl border ${col.border}
        p-4 shadow-lg ${col.shadow}
        hover:shadow-2xl hover:-translate-y-1
        transition-all duration-300 group cursor-pointer
        ${selected ? "ring-2 ring-quantum/75 border-quantum/80 shadow-[0_0_28px_rgba(0,195,245,0.2)]" : ""}
      `}
    >
      {/* Top Quantum Glyph Viewport (always dark stage) */}
      <div className="relative w-full h-28 rounded-xl bg-[#060916]/95 border border-black/15 dark:border-white/8 overflow-hidden flex items-center justify-center mb-3.5">
        <div
          className="absolute inset-0 pointer-events-none opacity-45 group-hover:opacity-75 transition-opacity"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${particle.hex}2b 0%, transparent 72%)`,
          }}
        />
        <ParticleGlyph
          particle={particle}
          size={88}
          antimatter={antimatter}
          active={selected}
        />

        {/* Top-left Inspect 3D pill */}
        <span
          className={`absolute top-2 left-2 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border transition-all ${selected
              ? "bg-quantum/25 text-quantum border-quantum/50 opacity-100"
              : "bg-black/60 text-white/70 border-white/15 opacity-0 group-hover:opacity-100"
            }`}
        >
          {selected ? "Active 3D" : "Inspect 3D"}
        </span>

        {/* Top-right symbol badge */}
        <span
          className="absolute top-2 right-2.5 text-xl font-black font-mono leading-none"
          style={{ color: particle.hex }}
        >
          {displaySymbol}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-foreground/95 leading-tight mb-2">
        {displayName}
      </h3>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${col.badge}`}>
          {particle.family}{genLabel}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isFermion
              ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/35 dark:border-blue-400/30"
              : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35 dark:border-rose-400/30"
            }`}
        >
          {particle.classification}
        </span>
      </div>

      {/* Properties */}
      <dl className="space-y-1.5 text-xs text-foreground/75 flex-grow">
        <div className="flex gap-2">
          <dt className="font-semibold text-foreground/45 w-14 shrink-0">Mass</dt>
          <dd className="font-mono">{particle.mass}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold text-foreground/45 w-14 shrink-0">Charge</dt>
          <dd className="font-mono">{displayCharge}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-semibold text-foreground/45 w-14 shrink-0">Spin</dt>
          <dd className="font-mono">{particle.spin}</dd>
        </div>
        {particle.quarks && particle.quarks.length > 0 ? (
          <div className="flex items-center gap-2">
            <dt className="font-semibold text-foreground/45 w-14 shrink-0">Quarks</dt>
            <dd className="flex flex-wrap items-center gap-1">
              {particle.isSuperposition ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-700 dark:text-pink-200 border border-pink-500/30 dark:border-pink-400/25">
                  qq̄ mix
                </span>
              ) : (
                particle.quarks.map((q, idx) => {
                  const effCol = effectiveAnti ? flipQuarkColor(q.color) : q.color;
                  const isAntiQ = effectiveAnti ? !q.anti : q.anti;
                  const hex = QUARK_COLOR_HEX[effCol];
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/5 border border-black/10 dark:border-white/10"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                      {isAntiQ ? `${q.flavor}\u0304` : q.flavor}
                    </span>
                  );
                })
              )}
            </dd>
          </div>
        ) : particle.composition ? (
          <div className="flex gap-2">
            <dt className="font-semibold text-foreground/45 w-14 shrink-0">Quarks</dt>
            <dd className="font-mono">{particle.composition}</dd>
          </div>
        ) : null}
      </dl>

      {/* Log-mass indicator + Force coupling dots */}
      <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/8 space-y-2 w-full">
        <div className="h-1 rounded-full bg-black/10 dark:bg-white/8 overflow-hidden w-full">
          <div
            className="h-full rounded-full"
            style={{
              width:
                logMassFrac === null
                  ? "50%"
                  : logMassFrac === 0
                    ? "4%"
                    : `${Math.max(4, Math.round(logMassFrac * 100))}%`,
              background:
                logMassFrac === null
                  ? `repeating-linear-gradient(90deg, ${particle.hex}99 0 5px, transparent 5px 8px)`
                  : `linear-gradient(90deg, ${particle.hex}, ${particle.accentHex})`,
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5" title="Forces: Strong · EM · Weak · Higgs · Gravity">
            {ALL_FORCES.map((f) => {
              const activeForce = particle.forces.includes(f);
              const meta = FORCE_META[f];
              return (
                <span
                  key={f}
                  title={`${meta.label}: ${activeForce ? "Couples" : "Does not couple"}`}
                  className={`text-[9px] font-mono px-1 py-0.2 rounded ${activeForce ? "font-semibold" : "text-foreground/20"
                    }`}
                  style={
                    activeForce
                      ? {
                        color: meta.hex,
                        backgroundColor: `${meta.hex}18`,
                      }
                      : undefined
                  }
                >
                  {f === "Strong" ? "S" : f === "Electromagnetic" ? "EM" : f === "Weak" ? "W" : f === "Higgs" ? "H" : "G"}
                </span>
              );
            })}
          </div>
          <span className="text-[9px] font-mono text-foreground/45 truncate">
            {particle.meanLifetime}
          </span>
        </div>

        <p className="text-[11px] text-foreground/55 leading-relaxed">
          {particle.description}
        </p>
      </div>
    </button>
  );
}
