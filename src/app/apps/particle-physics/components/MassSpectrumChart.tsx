"use client";

import { useMemo, useState } from "react";
import { Layers, Sparkles } from "lucide-react";
import {
  ALL_PARTICLES,
  getLogMassFraction,
  type Particle,
  type ParticleFamily,
  type ViewTab,
} from "../lib/particles";

interface Props {
  tab: ViewTab;
  particles: Particle[];
  selectedId: string;
  antimatter?: boolean;
  onSelect: (p: Particle) => void;
  onJumpToParticleId: (id: string) => void;
}

type TrackId = "Quarks" | "Leptons" | "Bosons" | "Baryons" | "Mesons" | "SUSY";

function getTrackId(family: ParticleFamily): TrackId {
  switch (family) {
    case "Quark":
      return "Quarks";
    case "Lepton":
      return "Leptons";
    case "Gauge Boson":
    case "Scalar Boson":
      return "Bosons";
    case "Baryon":
      return "Baryons";
    case "Meson":
      return "Mesons";
    case "Squark":
    case "Slepton":
    case "Gaugino":
    case "Higgsino":
      return "SUSY";
  }
}

const TRACK_COLORS: Record<TrackId, string> = {
  Quarks: "#22d3ee",
  Leptons: "#34d399",
  Bosons: "#facc15",
  Baryons: "#fb923c",
  Mesons: "#f472b6",
  SUSY: "#a78bfa",
};

const SCALE_TICKS = [
  { label: "0.1 eV", logMeV: -7 },
  { label: "1 eV",   logMeV: -6 },
  { label: "1 keV",  logMeV: -3 },
  { label: "1 MeV",  logMeV: 0 },
  { label: "1 GeV",  logMeV: 3 },
  { label: "1 TeV",  logMeV: 6 },
  { label: "10 TeV", logMeV: 7 },
];

const LANDMARKS = [
  { label: "e⁻ (0.511 MeV)", logMeV: Math.log10(0.511), color: "#34d399" },
  { label: "QCD ~1 GeV", logMeV: 3, color: "#fb923c" },
  { label: "EW ~100 GeV", logMeV: 5, color: "#facc15" },
  { label: "SUSY >1 TeV", logMeV: 6, color: "#a78bfa" },
];

function logToPct(logMeV: number): number {
  return ((logMeV - -7) / 14) * 100;
}

function formatElectronRatio(massMeV: number | null): string {
  if (massMeV === null) return "Model-dependent";
  if (massMeV === 0) return "0 × mₑ (massless)";
  const ratio = massMeV / 0.511;
  if (ratio >= 1000) return `~${Math.round(ratio).toLocaleString()} × mₑ`;
  if (ratio >= 1) return `${ratio.toFixed(1)} × mₑ`;
  return `${ratio.toExponential(1)} × mₑ`;
}

interface PositionedNode {
  particle: Particle;
  region: "massless" | "log" | "varies";
  xPct: number;
  yOffsetPx: number;
  xOffsetPx: number;
}

interface TrackLayout {
  id: TrackId;
  heightPx: number;
  nodes: PositionedNode[];
}

export function MassSpectrumChart({
  tab,
  particles,
  selectedId,
  antimatter = false,
  onSelect,
  onJumpToParticleId,
}: Props) {
  const [compareAll, setCompareAll] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sourceParticles = compareAll ? ALL_PARTICLES : particles;

  const { tracks, hoveredParticle } = useMemo(() => {
    const grouped = new Map<TrackId, Particle[]>();
    const order: TrackId[] = ["Quarks", "Leptons", "Bosons", "Baryons", "Mesons", "SUSY"];
    for (const tid of order) grouped.set(tid, []);
    for (const p of sourceParticles) {
      grouped.get(getTrackId(p.family))?.push(p);
    }

    const activeTracks: TrackLayout[] = [];

    for (const tid of order) {
      const list = grouped.get(tid) ?? [];
      if (list.length === 0) continue;

      const massless = list.filter((p) => p.massMeV === 0);
      const varies = list.filter((p) => p.massMeV === null);
      const measured = list
        .filter((p) => p.massMeV !== null && p.massMeV > 0)
        .sort((a, b) => (a.massMeV ?? 0) - (b.massMeV ?? 0));

      const nodes: PositionedNode[] = [];

      // Massless column nodes (0 eV) in clean 2-column grid
      const masslessRows = Math.max(1, Math.ceil(massless.length / 2));
      massless.forEach((p, idx) => {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        const yOff = (row - (masslessRows - 1) / 2) * 34;
        const xOff = massless.length > 1 ? (col === 0 ? -24 : 24) : 0;
        nodes.push({
          particle: p,
          region: "massless",
          xPct: 50,
          yOffsetPx: yOff,
          xOffsetPx: xOff,
        });
      });

      // Varies column nodes in clean 2-column grid (52px horiz, 34px vert)
      const variesRows = Math.max(1, Math.ceil(varies.length / 2));
      varies.forEach((p, idx) => {
        const row = Math.floor(idx / 2);
        const col = idx % 2;
        const yOff = (row - (variesRows - 1) / 2) * 34;
        const xOff = varies.length > 1 ? (col === 0 ? -26 : 26) : 0;
        nodes.push({
          particle: p,
          region: "varies",
          xPct: 50,
          yOffsetPx: yOff,
          xOffsetPx: xOff,
        });
      });

      // Greedy collision-free lane assignment across log scale
      const laneLastX: number[] = [];
      const tempLogNodes: { particle: Particle; xPct: number; lane: number }[] = [];

      measured.forEach((p) => {
        const frac = getLogMassFraction(p.massMeV) ?? 0.5;
        const rawXPct = frac * 100;

        let assignedLane = -1;
        for (let l = 0; l < laneLastX.length; l++) {
          if (rawXPct - laneLastX[l] >= 7.5) {
            assignedLane = l;
            laneLastX[l] = rawXPct;
            break;
          }
        }
        if (assignedLane === -1) {
          assignedLane = laneLastX.length;
          laneLastX.push(rawXPct);
        }

        tempLogNodes.push({ particle: p, xPct: rawXPct, lane: assignedLane });
      });

      const logLaneCount = Math.max(1, laneLastX.length);
      tempLogNodes.forEach(({ particle, xPct, lane }) => {
        const yOff = (lane - (logLaneCount - 1) / 2) * 34;
        nodes.push({
          particle,
          region: "log",
          xPct,
          yOffsetPx: yOff,
          xOffsetPx: 0,
        });
      });

      const maxLanes = Math.max(
        1,
        logLaneCount,
        massless.length > 0 ? masslessRows : 0,
        varies.length > 0 ? variesRows : 0,
      );
      const heightPx = Math.max(68, maxLanes * 36 + 22);

      activeTracks.push({ id: tid, heightPx, nodes });
    }

    const hParticle = hoveredId
      ? sourceParticles.find((p) => p.id === hoveredId) ?? null
      : null;

    return { tracks: activeTracks, hoveredParticle: hParticle };
  }, [sourceParticles, hoveredId]);

  const handleNodeClick = (p: Particle) => {
    if (p.tab === tab) {
      onSelect(p);
    } else {
      onJumpToParticleId(p.id);
    }
  };

  const renderOrb = (node: PositionedNode) => {
    const { particle: p, xPct, yOffsetPx, xOffsetPx } = node;
    const isSelected = selectedId === p.id;
    const isHovered = hoveredId === p.id;
    const effectiveAnti = antimatter && !p.selfConjugate;
    const displaySymbol = effectiveAnti ? p.antiparticleSymbol : p.symbol;
    const isBound = Boolean(p.massQualifier);

    return (
      <button
        key={p.id}
        type="button"
        onClick={() => handleNodeClick(p)}
        onMouseEnter={() => setHoveredId(p.id)}
        onMouseLeave={() => setHoveredId(null)}
        style={{
          left: `${xPct}%`,
          top: "50%",
          transform: `translate(calc(-50% + ${xOffsetPx}px), calc(-50% + ${yOffsetPx}px))`,
          borderColor: isSelected ? "#ffffff" : `${p.hex}aa`,
          backgroundColor: `${p.hex}24`,
          boxShadow: isSelected || isHovered ? `0 0 18px ${p.hex}88` : `0 0 8px ${p.hex}33`,
        }}
        className={`absolute z-10 inline-flex items-center justify-center gap-0.5 min-w-8 h-7 px-1.5 rounded-full border font-mono font-bold whitespace-nowrap transition-all duration-150 ${
          isBound ? "border-dashed" : ""
        } ${
          isSelected
            ? "text-xs ring-2 ring-quantum/80 z-20"
            : isHovered
              ? "text-xs scale-110 z-20"
              : "text-[10px] hover:scale-110"
        }`}
        title={`${effectiveAnti ? p.antiparticle : p.name} (${displaySymbol}) — ${p.mass}`}
      >
        {p.massQualifier === "<" && (
          <span className="text-[8px] text-white/65 leading-none">←</span>
        )}
        <span style={{ color: "#f8fafc" }}>{displaySymbol}</span>
        {p.massQualifier === ">" && (
          <span className="text-[8px] text-white/65 leading-none">→</span>
        )}
      </button>
    );
  };

  return (
    <div className="rounded-2xl bg-[#060916]/95 border border-black/15 dark:border-white/10 p-4 sm:p-5 space-y-4 shadow-2xl">
      {/* Header & Compare Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-serif font-bold text-white/95 flex items-center gap-2">
            <Sparkles size={16} className="text-quantum" />
            Logarithmic Mass & Energy Spectrum
          </h3>
          <p className="text-xs text-white/55 mt-0.5">
            Spanning 14 orders of magnitude from sub-eV neutrinos to multi-TeV supersymmetric bounds · Dashed pills denote experimental bounds
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCompareAll((v) => !v)}
          aria-pressed={compareAll}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono border transition-all ${
            compareAll
              ? "bg-quantum/20 text-quantum border-quantum/40 shadow-[0_0_16px_rgba(0,195,245,0.15)]"
              : "bg-white/5 text-white/75 border-white/15 hover:text-white/95 hover:border-white/30"
          }`}
        >
          <Layers size={13} />
          {compareAll ? "Showing All 49 Particles" : "Compare All 49 Particles"}
        </button>
      </div>

      {/* Live Hover Telemetry Pill */}
      <div className="min-h-9 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {hoveredParticle ? (
          <>
            <div className="flex items-center gap-2.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: hoveredParticle.hex }}
              />
              <span className="font-bold text-white/95">
                {antimatter && !hoveredParticle.selfConjugate
                  ? `${hoveredParticle.antiparticle} (${hoveredParticle.antiparticleSymbol})`
                  : `${hoveredParticle.name} (${hoveredParticle.symbol})`}
              </span>
              <span className="text-white/50">· {hoveredParticle.family}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/75">
              <span>
                Mass: <strong className="text-white">{hoveredParticle.mass}</strong>
                {hoveredParticle.massQualifier === "<" && (
                  <span className="text-sky-300/85 ml-1">(upper bound)</span>
                )}
                {hoveredParticle.massQualifier === ">" && (
                  <span className="text-violet-300/85 ml-1">(lower bound)</span>
                )}
              </span>
              <span className="text-quantum/90">{formatElectronRatio(hoveredParticle.massMeV)}</span>
              <span>q: {hoveredParticle.charge}</span>
              <span>s: {hoveredParticle.spin}</span>
            </div>
          </>
        ) : (
          <span className="text-[11px] text-white/50">
            Hover over any particle orb for mass ratio (m / mₑ), experimental bound status, spin, and electric charge telemetry
          </span>
        )}
      </div>

      {/* Spectrum Chart */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[820px] space-y-1">
          {/* Column Header */}
          <div className="grid grid-cols-[92px_96px_1fr_128px] gap-2 items-end pb-2 border-b border-white/10 text-[10px] font-mono text-white/55">
            <div className="pl-2 uppercase tracking-wider">Family</div>
            <div className="text-center text-sky-300/85">Massless<br />0 eV/c²</div>
            <div className="px-6">
              <div className="relative h-8 w-full">
                {SCALE_TICKS.map((tick) => (
                  <span
                    key={tick.label}
                    className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-white/65"
                    style={{ left: `${logToPct(tick.logMeV)}%` }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-center text-violet-300/85">Model-Dep.<br />Varies</div>
          </div>

          {/* Family Tracks */}
          <div className="relative space-y-1.5 pt-1">
            {tracks.map((track) => {
              const masslessNodes = track.nodes.filter((n) => n.region === "massless");
              const logNodes = track.nodes.filter((n) => n.region === "log");
              const variesNodes = track.nodes.filter((n) => n.region === "varies");

              return (
                <div
                  key={track.id}
                  style={{ height: `${track.heightPx}px` }}
                  className="grid grid-cols-[92px_96px_1fr_128px] gap-2 items-center rounded-xl bg-white/[0.025] border border-white/[0.06]"
                >
                  {/* Track Label */}
                  <div className="pl-3 pr-1 flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: TRACK_COLORS[track.id] }}
                    />
                    <span className="text-xs font-semibold text-white/85 truncate">
                      {track.id}
                    </span>
                  </div>

                  {/* Massless 0 eV lane */}
                  <div className="relative h-full border-x border-dashed border-white/10 bg-sky-500/[0.02]">
                    {masslessNodes.map(renderOrb)}
                  </div>

                  {/* Logarithmic scale lane */}
                  <div className="h-full px-6">
                    <div className="relative h-full w-full">
                      {SCALE_TICKS.map((tick) => (
                        <div
                          key={tick.label}
                          className="absolute top-0 bottom-0 w-px bg-white/[0.06]"
                          style={{ left: `${logToPct(tick.logMeV)}%` }}
                        />
                      ))}
                      {logNodes.map(renderOrb)}
                    </div>
                  </div>

                  {/* Varies lane */}
                  <div className="relative h-full border-l border-dashed border-white/10 bg-violet-500/[0.02]">
                    {variesNodes.map(renderOrb)}
                  </div>
                </div>
              );
            })}

            {/* Physics scale landmarks footer row */}
            <div className="grid grid-cols-[92px_96px_1fr_128px] gap-2 pt-2">
              <div />
              <div />
              <div className="px-6">
                <div className="relative h-7 w-full">
                  {LANDMARKS.map((lm) => (
                    <div
                      key={lm.label}
                      className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${logToPct(lm.logMeV)}%` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lm.color }} />
                      <span
                        className="text-[9px] font-mono whitespace-nowrap mt-0.5"
                        style={{ color: lm.color }}
                      >
                        {lm.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div />
            </div>
          </div>
        </div>
      </div>

      {/* Physics Insight Footnote */}
      <div className="pt-2 border-t border-white/10 text-[11px] text-white/55 leading-relaxed flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="text-white/80">Scale insight:</strong> The Top quark (172.7 GeV) is ~338,000× heavier than the Electron (0.511 MeV), while ~99% of a Proton&apos;s 938.3 MeV mass arises from QCD gluon field energy rather than its ~9 MeV valence quarks.
        </span>
      </div>
    </div>
  );
}
