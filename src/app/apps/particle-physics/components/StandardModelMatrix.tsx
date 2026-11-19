"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  formatEffectiveCharge,
  formatEffectiveComposition,
  getCoupledParticleIds,
  getParticleById,
  type Particle,
  type ViewTab,
} from "../lib/particles";
import { ParticleGlyph } from "./ParticleGlyph";

interface Props {
  tab: ViewTab;
  matchingIds: Set<string> | null;
  selectedId: string;
  antimatter: boolean;
  onSelect: (p: Particle) => void;
  onClearFilters?: () => void;
}

function MatrixTile({
  particle,
  selected,
  antimatter,
  dimmedByFilter,
  coupledState,
  showPartnerChip,
  glyphSize = 44,
  onSelect,
  onHover,
}: {
  particle: Particle;
  selected: boolean;
  antimatter: boolean;
  dimmedByFilter: boolean;
  coupledState: "none" | "lit" | "dim";
  showPartnerChip?: boolean;
  glyphSize?: number;
  onSelect: (p: Particle) => void;
  onHover?: (p: Particle | null) => void;
}) {
  const effectiveAnti = antimatter && !particle.selfConjugate;
  const displaySymbol = effectiveAnti ? particle.antiparticleSymbol : particle.symbol;
  const displayName = effectiveAnti ? particle.antiparticle : particle.name;
  const displayCharge = formatEffectiveCharge(particle, effectiveAnti);
  const displayComp = formatEffectiveComposition(particle, effectiveAnti);
  const partner = showPartnerChip && particle.superpartnerId
    ? getParticleById(particle.superpartnerId)
    : undefined;

  let opacityClass = "opacity-100";
  if (dimmedByFilter) {
    opacityClass = "opacity-20";
  } else if (coupledState === "dim") {
    opacityClass = "opacity-30";
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(particle)}
      onMouseEnter={() => onHover?.(particle)}
      onMouseLeave={() => onHover?.(null)}
      className={`group relative flex flex-col justify-between text-left rounded-xl p-2.5 border transition-all duration-200 bg-[#070b18]/92 hover:bg-[#0b1126] ${opacityClass} ${
        selected
          ? "ring-2 ring-quantum/80 border-quantum/70 shadow-[0_0_24px_rgba(0,195,245,0.2)]"
          : coupledState === "lit"
            ? "border-white/40 shadow-lg"
            : "border-black/15 dark:border-white/10 hover:border-white/25"
      }`}
      style={
        coupledState === "lit" && !selected
          ? {
              borderColor: `${particle.hex}aa`,
              boxShadow: `0 0 18px ${particle.hex}2b`,
            }
          : undefined
      }
    >
      {/* Top row: mass & partner chip */}
      <div className="flex items-center justify-between gap-1 w-full">
        <span className="text-[9px] font-mono text-white/50 truncate">
          {particle.mass}
        </span>
        {partner ? (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-400/25 shrink-0">
            ↔ {partner.symbol}
          </span>
        ) : (
          <span className="text-[9px] font-mono text-white/50 shrink-0">
            {displayCharge}
          </span>
        )}
      </div>

      {/* Center: Live SVG glyph + symbol */}
      <div className="flex items-center gap-2 my-1.5">
        <ParticleGlyph
          particle={particle}
          size={glyphSize}
          antimatter={antimatter}
          active={selected}
        />
        <div className="min-w-0">
          <div
            className="text-lg font-black font-mono leading-none"
            style={{ color: particle.hex }}
          >
            {displaySymbol}
          </div>
          <div className="text-xs font-semibold text-white/90 mt-1 truncate">
            {displayName}
          </div>
          {displayComp && (
            <div className="text-[10px] font-mono text-white/50 truncate">
              {displayComp}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: spin / family */}
      <div className="flex items-center justify-between text-[9px] font-mono text-white/45 pt-1 border-t border-white/8 w-full">
        <span className="truncate">{particle.family}</span>
        <span className="shrink-0">s={particle.spin}</span>
      </div>
    </button>
  );
}

function EmptyFilterNotice({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs">
      <span className="text-foreground/80">
        No particles match your active search or filter criteria.
      </span>
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="font-mono text-quantum hover:underline font-semibold"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export function StandardModelMatrix({
  tab,
  matchingIds,
  selectedId,
  antimatter,
  onSelect,
  onClearFilters,
}: Props) {
  const [hoveredParticle, setHoveredParticle] = useState<Particle | null>(null);

  const couplingInfo =
    tab === "standard_model" && hoveredParticle
      ? getCoupledParticleIds(hoveredParticle)
      : null;

  const isEmptyMatch = matchingIds !== null && matchingIds.size === 0;

  const isDimmed = (id: string) =>
    matchingIds !== null && !matchingIds.has(id);

  const getCoupledState = (id: string): "none" | "lit" | "dim" => {
    if (!couplingInfo) return "none";
    return couplingInfo.ids.has(id) ? "lit" : "dim";
  };

  if (tab === "standard_model") {
    const rows = [
      { label: "Quarks", sub: "+2/3", ids: ["up", "charm", "top"], bosonId: "gluon" },
      { label: "Quarks", sub: "−1/3", ids: ["down", "strange", "bottom"], bosonId: "photon" },
      { label: "Leptons", sub: "−1", ids: ["electron", "muon", "tau"], bosonId: "z-boson" },
      { label: "Neutrinos", sub: "0", ids: ["electron-neutrino", "muon-neutrino", "tau-neutrino"], bosonId: "w-boson" },
    ];
    const higgs = getParticleById("higgs");

    return (
      <div className="space-y-4">
        {isEmptyMatch && <EmptyFilterNotice onClearFilters={onClearFilters} />}

        {/* Live Force-Coupling Interaction Banner */}
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-white/80 dark:bg-black/40 border-black/10 dark:border-white/10 backdrop-blur-md text-xs transition-all"
          style={{
            borderColor: hoveredParticle ? `${hoveredParticle.hex}77` : undefined,
          }}
        >
          <Sparkles
            size={14}
            className="shrink-0"
            style={{ color: hoveredParticle ? hoveredParticle.hex : "#00a8d6" }}
          />
          <span className="text-foreground/80 font-mono text-[11px] leading-snug">
            {couplingInfo
              ? couplingInfo.summary
              : "Hover any boson or fermion to illuminate its fundamental force couplings · Click to inspect in 3D"}
          </span>
        </div>

        {/* 6-Track Standard Model Table (Row labels + 5 columns) */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[840px] grid grid-cols-[100px_repeat(5,minmax(0,1fr))] gap-3">
            {/* Corner spacer + Column Headers */}
            <div className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-lg text-center border border-black/10 dark:border-white/8 bg-black/[0.04] dark:bg-white/[0.03] text-foreground/45">
              Sector
            </div>
            {[
              "Generation I",
              "Generation II",
              "Generation III",
              "Gauge Bosons",
              "Scalar Boson",
            ].map((header, i) => (
              <div
                key={header}
                className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-lg text-center border ${
                  i === 4
                    ? "border-amber-500/35 dark:border-yellow-400/25 bg-yellow-500/12 dark:bg-yellow-500/8 text-amber-700 dark:text-yellow-300/85"
                    : i === 3
                      ? "border-red-500/35 dark:border-red-400/25 bg-red-500/12 dark:bg-red-500/8 text-red-700 dark:text-red-300/85"
                      : "border-black/10 dark:border-white/8 bg-black/[0.04] dark:bg-white/[0.03] text-foreground/60"
                }`}
              >
                {header}
              </div>
            ))}

            {/* Rows 1-4 */}
            {rows.map((row, rowIdx) => (
              <div key={`${row.label}-${row.sub}`} className="contents">
                {/* Row label */}
                <div className="flex flex-col items-center justify-center text-center px-2 py-2 rounded-xl border border-black/10 dark:border-white/8 bg-black/[0.03] dark:bg-white/[0.02]">
                  <span className="text-[11px] font-semibold text-foreground/75 leading-tight">
                    {row.label}
                  </span>
                  <span className="text-[10px] font-mono text-foreground/45 mt-0.5">
                    q = {antimatter ? (row.sub === "+2/3" ? "−2/3" : row.sub === "−1/3" ? "+1/3" : row.sub === "−1" ? "+1" : "0") : row.sub}
                  </span>
                </div>

                {row.ids.map((pid) => {
                  const p = getParticleById(pid);
                  if (!p) return <div key={pid} />;
                  return (
                    <MatrixTile
                      key={p.id}
                      particle={p}
                      selected={selectedId === p.id}
                      antimatter={antimatter}
                      dimmedByFilter={isDimmed(p.id)}
                      coupledState={getCoupledState(p.id)}
                      onSelect={onSelect}
                      onHover={setHoveredParticle}
                    />
                  );
                })}

                {/* Column 4: Gauge Boson */}
                {(() => {
                  const b = getParticleById(row.bosonId);
                  if (!b) return <div />;
                  return (
                    <MatrixTile
                      key={b.id}
                      particle={b}
                      selected={selectedId === b.id}
                      antimatter={antimatter}
                      dimmedByFilter={isDimmed(b.id)}
                      coupledState={getCoupledState(b.id)}
                      onSelect={onSelect}
                      onHover={setHoveredParticle}
                    />
                  );
                })()}

                {/* Column 5: Higgs spans rows cleanly */}
                {rowIdx === 0 && higgs && (
                  <div className="row-span-4 flex flex-col justify-center">
                    <div className="p-1.5 rounded-2xl border border-amber-500/40 dark:border-yellow-400/35 bg-yellow-500/[0.06]">
                      <MatrixTile
                        particle={higgs}
                        selected={selectedId === higgs.id}
                        antimatter={antimatter}
                        dimmedByFilter={isDimmed(higgs.id)}
                        coupledState={getCoupledState(higgs.id)}
                        glyphSize={54}
                        onSelect={onSelect}
                        onHover={setHoveredParticle}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tab === "supersymmetry") {
    const susyRows = [
      { ids: ["sup", "scharm", "stop"], gauginoId: "gluino", fifthId: "higgsino" },
      { ids: ["sdown", "sstrange", "sbottom"], gauginoId: "photino", fifthId: "gravitino" },
      { ids: ["selectron", "smuon", "stau"], gauginoId: "zino", fifthId: null },
      { ids: ["electron-sneutrino", "muon-sneutrino", "tau-sneutrino"], gauginoId: "wino", fifthId: null },
    ];

    return (
      <div className="space-y-4">
        {isEmptyMatch && <EmptyFilterNotice onClearFilters={onClearFilters} />}

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[780px] grid grid-cols-5 gap-3">
            {[
              "Gen I Sfermions",
              "Gen II Sfermions",
              "Gen III Sfermions",
              "Gauginos",
              "Higgsino & SUGRA",
            ].map((header, i) => (
              <div
                key={header}
                className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-lg text-center border ${
                  i >= 3
                    ? "border-purple-500/35 dark:border-purple-400/25 bg-purple-500/12 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300/85"
                    : "border-violet-500/35 dark:border-violet-400/25 bg-violet-500/10 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300/80"
                }`}
              >
                {header}
              </div>
            ))}

            {susyRows.map((row, rIdx) => (
              <div key={rIdx} className="contents">
                {row.ids.map((pid) => {
                  const p = getParticleById(pid);
                  if (!p) return <div key={pid} />;
                  return (
                    <MatrixTile
                      key={p.id}
                      particle={p}
                      selected={selectedId === p.id}
                      antimatter={antimatter}
                      dimmedByFilter={isDimmed(p.id)}
                      coupledState="none"
                      showPartnerChip
                      onSelect={onSelect}
                    />
                  );
                })}

                {(() => {
                  const g = getParticleById(row.gauginoId);
                  if (!g) return <div />;
                  return (
                    <MatrixTile
                      key={g.id}
                      particle={g}
                      selected={selectedId === g.id}
                      antimatter={antimatter}
                      dimmedByFilter={isDimmed(g.id)}
                      coupledState="none"
                      showPartnerChip
                      onSelect={onSelect}
                    />
                  );
                })()}

                {row.fifthId ? (
                  (() => {
                    const f = getParticleById(row.fifthId);
                    if (!f) return <div />;
                    return (
                      <MatrixTile
                        key={f.id}
                        particle={f}
                        selected={selectedId === f.id}
                        antimatter={antimatter}
                        dimmedByFilter={isDimmed(f.id)}
                        coupledState="none"
                        showPartnerChip
                        onSelect={onSelect}
                      />
                    );
                  })()
                ) : (
                  <div className="rounded-xl border border-dashed border-black/10 dark:border-white/6 bg-black/[0.02] dark:bg-white/[0.01]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Hadrons tab
  const spinHalfBaryons = ["proton", "neutron", "lambda", "sigma-plus", "xi-zero"];
  const spin32Baryons = ["delta-plusplus", "omega-minus"];
  const spinZeroMesons = ["pion-plus", "kaon-plus", "eta", "d-meson", "b-meson"];
  const spinOneMesons = ["rho-plus", "j-psi"];

  const renderGroup = (title: string, badge: string, ids: string[]) => (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-serif font-bold text-foreground/85">{title}</h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-foreground/60">
          {badge}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {ids.map((id) => {
          const p = getParticleById(id);
          if (!p) return null;
          return (
            <MatrixTile
              key={p.id}
              particle={p}
              selected={selectedId === p.id}
              antimatter={antimatter}
              dimmedByFilter={isDimmed(p.id)}
              coupledState="none"
              glyphSize={54}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isEmptyMatch && <EmptyFilterNotice onClearFilters={onClearFilters} />}

      <div className="p-4 rounded-2xl border border-orange-500/30 dark:border-orange-400/20 bg-orange-500/[0.05] dark:bg-orange-500/[0.03] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 dark:border-white/8 pb-2.5">
          <span className="text-xs font-mono uppercase tracking-widest text-orange-700 dark:text-orange-300">
            Baryons · 3 Valence Quarks · Fermions
          </span>
          <span className="text-[11px] font-mono text-foreground/55">
            Color-neutral R + G + B bound states
          </span>
        </div>
        {renderGroup("Spin 1/2 Octet States", "s = 1/2", spinHalfBaryons)}
        {renderGroup("Spin 3/2 Decuplet Resonances", "s = 3/2", spin32Baryons)}
      </div>

      <div className="p-4 rounded-2xl border border-pink-500/30 dark:border-pink-400/20 bg-pink-500/[0.05] dark:bg-pink-500/[0.03] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 dark:border-white/8 pb-2.5">
          <span className="text-xs font-mono uppercase tracking-widest text-pink-700 dark:text-pink-300">
            Mesons · Quark–Antiquark Pairs · Bosons
          </span>
          <span className="text-[11px] font-mono text-foreground/55">
            Color + Anticolor QCD dipoles
          </span>
        </div>
        {renderGroup("Spin 0 Pseudoscalar Mesons", "s = 0", spinZeroMesons)}
        {renderGroup("Spin 1 Vector Mesons", "s = 1", spinOneMesons)}
      </div>
    </div>
  );
}
