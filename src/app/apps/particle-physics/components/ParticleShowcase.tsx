"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  Compass,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  FAMILY_COLOURS,
  DEFAULT_COLOUR,
  FORCE_META,
  QUARK_COLOR_HEX,
  flipQuarkColor,
  formatEffectiveCharge,
  getLogMassFraction,
  getParticleById,
  getQuarkParticleId,
  type FundamentalForce,
  type Particle,
} from "../lib/particles";
import type { CameraPreset } from "./ParticleModel3D";

const ParticleModel3D = dynamic(
  () => import("./ParticleModel3D").then((m) => m.ParticleModel3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-quantum/60">
        <div className="w-14 h-14 rounded-full border-2 border-quantum/25 border-t-quantum animate-spin" />
        <span className="text-[11px] font-mono tracking-wider uppercase">
          Initializing 3D Quantum Chamber…
        </span>
      </div>
    ),
  },
);

interface Props {
  particle: Particle;
  particlesInTab: Particle[];
  antimatter: boolean;
  onToggleAntimatter: () => void;
  onSelectParticle: (particle: Particle) => void;
  onJumpToParticleId: (id: string) => void;
}

const ALL_FORCES: FundamentalForce[] = [
  "Strong",
  "Electromagnetic",
  "Weak",
  "Higgs",
  "Gravity",
];

const SPEEDS = [0.5, 1, 2] as const;

const subscribeReducedMotion = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => { };
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
};

const getReducedMotionSnapshot = () =>
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

const getServerReducedMotion = () => false;

function getSpinSymmetryLabel(spinNum: number): string {
  if (spinNum === 0) return "Isotropic Scalar (360° invariant)";
  if (spinNum === 0.5) return "720° Fermion Spinor";
  if (spinNum === 1) return "360° Vector Gauge Boson";
  if (spinNum === 1.5) return "Spin-3/2 Rarita–Schwinger";
  return `Spin ${spinNum}`;
}

export function ParticleShowcase({
  particle,
  particlesInTab,
  antimatter,
  onToggleAntimatter,
  onSelectParticle,
  onJumpToParticleId,
}: Props) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotion,
  );

  const [showField, setShowField] = useState(true);
  const [showSpin, setShowSpin] = useState(true);
  const [showCloud, setShowCloud] = useState(true);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("angled");
  const [cameraSignal, setCameraSignal] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const playing = userPlaying ?? !reducedMotion;

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const col = FAMILY_COLOURS[particle.family] ?? DEFAULT_COLOUR;
  const effectiveAnti = antimatter && !particle.selfConjugate;
  const displayName = effectiveAnti ? particle.antiparticle : particle.name;
  const displaySymbol = effectiveAnti ? particle.antiparticleSymbol : particle.symbol;
  const displayCharge = formatEffectiveCharge(particle, effectiveAnti);
  const numericCharge = effectiveAnti ? -particle.chargeNum : particle.chargeNum;

  const currentIdx = useMemo(
    () => particlesInTab.findIndex((p) => p.id === particle.id),
    [particlesInTab, particle.id],
  );

  const handleCycle = (delta: number) => {
    if (particlesInTab.length === 0) return;
    const base = currentIdx >= 0 ? currentIdx : 0;
    const nextIdx = (base + delta + particlesInTab.length) % particlesInTab.length;
    onSelectParticle(particlesInTab[nextIdx]);
  };

  const logMassFraction = getLogMassFraction(particle.massMeV);
  const superpartner = particle.superpartnerId
    ? getParticleById(particle.superpartnerId)
    : undefined;

  // Bidirectional charge bar from -1 to +2 (zero sits at 33.33%)
  const zeroPct = (1 / 3) * 100;
  const clampedCharge = Math.max(-1, Math.min(2, numericCharge));
  const chargePct = ((clampedCharge + 1) / 3) * 100;
  const barLeft = Math.min(zeroPct, chargePct);
  const barWidth = Math.abs(chargePct - zeroPct);

  const handleCycleSpeed = () => {
    const idx = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
  };

  return (
    <>
      {isFullscreen && (
        <div
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ── LEFT: 3D Quantum Chamber ────────────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            className={
              isFullscreen
                ? "fixed inset-3 sm:inset-6 z-50 rounded-2xl overflow-hidden bg-[#060916] border border-white/15 shadow-2xl flex flex-col"
                : "relative w-full min-h-[390px] sm:min-h-[480px] lg:h-full flex-1 rounded-2xl overflow-hidden bg-[#060916] border border-white/10 shadow-2xl"
            }
          >
            {/* Subtle radial spotlight tinted to active particle family */}
            <div
              className="absolute inset-0 pointer-events-none opacity-35"
              style={{
                background: `radial-gradient(circle at 50% 48%, ${particle.hex}26 0%, ${particle.accentHex}0d 38%, transparent 72%)`,
              }}
            />

            {/* Single mounted WebGL Canvas */}
            <div className="relative w-full h-full">
              <ParticleModel3D
                particle={particle}
                showField={showField}
                showSpin={showSpin}
                showCloud={showCloud}
                antimatter={effectiveAnti}
                playing={playing}
                speed={speed}
                cameraPreset={cameraPreset}
                cameraSignal={cameraSignal}
              />
            </div>

            {/* Top-left HUD badge */}
            <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/10">
                <span
                  className="text-sm font-black font-mono"
                  style={{ color: particle.hex }}
                >
                  {displaySymbol}
                </span>
                <span className="text-[11px] font-mono text-white/75">
                  {particle.archetypeLabel}
                </span>
              </div>

              {antimatter && !particle.selfConjugate && (
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 backdrop-blur-md">
                  Antimatter
                </span>
              )}
              {antimatter && particle.selfConjugate && (
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-200 border border-amber-400/30 backdrop-blur-md">
                  Self-conjugate
                </span>
              )}
            </div>

            {/* Top-right Camera & Fullscreen controls */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 p-1 rounded-xl bg-black/65 backdrop-blur-md border border-white/10">
                {(
                  [
                    { id: "angled", label: "3D" },
                    { id: "top", label: "Top" },
                    { id: "side", label: "Side" },
                  ] as const
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      setCameraPreset(cam.id);
                      setCameraSignal((s) => s + 1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${cameraPreset === cam.id
                        ? "bg-quantum/25 text-quantum border border-quantum/40"
                        : "text-white/55 hover:text-white/90"
                      }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen((f) => !f)}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen 3D chamber"}
                className="p-2 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-all"
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>

            {/* Top-left Hadron Valence Quark Legend (below archetype HUD pill) */}
            {particle.quarks && particle.quarks.length > 0 && (
              <div className="flex absolute top-14 left-3 z-20 items-center gap-2 px-3 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/10 pointer-events-none">
                {particle.isSuperposition ? (
                  <span className="text-[10px] font-mono text-pink-200/85">
                    uū / dd̄ / ss̄ quantum mix
                  </span>
                ) : (
                  particle.quarks.map((q, idx) => {
                    const effCol = effectiveAnti ? flipQuarkColor(q.color) : q.color;
                    const isAntiQ = effectiveAnti ? !q.anti : q.anti;
                    const hex = QUARK_COLOR_HEX[effCol];
                    return (
                      <span
                        key={idx}
                        className="flex items-center gap-1 text-[10px] font-mono text-white/80"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: hex, boxShadow: `0 0 6px ${hex}` }}
                        />
                        {isAntiQ ? `${q.flavor}\u0304` : q.flavor}
                      </span>
                    );
                  })
                )}
              </div>
            )}

            {/* Bottom-left Physics Layer & Antimatter Toggles */}
            <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowField((v) => !v)}
                aria-pressed={showField}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-mono border backdrop-blur-md transition-all ${showField
                    ? "bg-sky-500/20 text-sky-200 border-sky-400/40"
                    : "bg-black/60 text-white/45 border-white/10 hover:text-white/75"
                  }`}
              >
                <Zap size={11} />
                Field
              </button>

              <button
                type="button"
                onClick={() => setShowSpin((v) => !v)}
                aria-pressed={showSpin}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-mono border backdrop-blur-md transition-all ${showSpin
                    ? "bg-amber-500/20 text-amber-200 border-amber-400/40"
                    : "bg-black/60 text-white/45 border-white/10 hover:text-white/75"
                  }`}
              >
                <Compass size={11} />
                Spin
              </button>

              <button
                type="button"
                onClick={() => setShowCloud((v) => !v)}
                aria-pressed={showCloud}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-mono border backdrop-blur-md transition-all ${showCloud
                    ? "bg-violet-500/20 text-violet-200 border-violet-400/40"
                    : "bg-black/60 text-white/45 border-white/10 hover:text-white/75"
                  }`}
              >
                <Cloud size={11} />
                Cloud
              </button>

              <button
                type="button"
                onClick={onToggleAntimatter}
                aria-pressed={antimatter}
                title={
                  particle.selfConjugate
                    ? "Self-conjugate particle (identical to its antiparticle)"
                    : "Toggle Matter ↔ Antimatter state"
                }
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-mono border backdrop-blur-md transition-all ${antimatter
                    ? "bg-rose-500/25 text-rose-200 border-rose-400/45 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                    : "bg-black/60 text-white/60 border-white/10 hover:text-white/90"
                  }`}
              >
                <RefreshCw size={11} />
                {antimatter ? "Antimatter" : "Matter"}
              </button>
            </div>

            {/* Bottom-right Playback & Speed */}
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setUserPlaying(!playing)}
                aria-label={playing ? "Pause simulation" : "Play simulation"}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white/75 hover:text-white hover:border-white/25 transition-all"
              >
                {playing ? <Pause size={11} /> : <Play size={11} />}
                {playing ? "Pause" : "Play"}
              </button>

              <button
                type="button"
                onClick={handleCycleSpeed}
                title="Cycle simulation speed"
                className="px-2.5 py-1.5 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 text-[10px] font-mono text-quantum/85 hover:text-quantum hover:border-quantum/40 transition-all"
              >
                {speed}×
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Live Quantum Telemetry Inspector ─────────────────────── */}
        <div
          className={`lg:col-span-5 flex flex-col justify-between gap-4 rounded-2xl bg-white/85 dark:bg-black/35 backdrop-blur-md border ${col.border} p-5 shadow-xl`}
        >
          {/* Header with Prev / Next particle switcher */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/50 flex items-center gap-1">
                    <Sparkles size={10} className="text-quantum" />
                    Quantum Inspector
                  </span>
                  {particlesInTab.length > 0 && currentIdx >= 0 && (
                    <span className="text-[10px] font-mono text-foreground/40">
                      {currentIdx + 1}/{particlesInTab.length}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground/95 leading-tight truncate">
                  {displayName}
                </h2>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${col.badge}`}>
                    {particle.family}
                    {particle.generation ? ` · Gen ${particle.generation}` : ""}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${particle.classification === "Fermion"
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/35 dark:border-blue-400/30"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35 dark:border-rose-400/30"
                      }`}
                  >
                    {particle.classification}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleCycle(-1)}
                    aria-label="Previous particle"
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-foreground/65 hover:text-foreground transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCycle(1)}
                    aria-label="Next particle"
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 text-foreground/65 hover:text-foreground transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center border font-mono text-2xl font-black bg-[#070b18]/95"
                  style={{
                    color: particle.hex,
                    borderColor: `${particle.hex}55`,
                    boxShadow: `0 0 22px ${particle.hex}28`,
                  }}
                >
                  {displaySymbol}
                </div>
              </div>
            </div>

            {/* Quantum Numbers Meters */}
            <div className="mt-4 space-y-3 pt-3 border-t border-black/10 dark:border-white/8">
              {/* Mass log-scale meter */}
              <div>
                <div className="flex items-baseline justify-between gap-2 text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground/55 font-medium">Rest Mass (log₁₀)</span>
                    {particle.massQualifier && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/8 text-foreground/60 border border-black/10 dark:border-white/10">
                        {particle.massQualifier === "<" ? "Upper bound" : "Lower bound"}
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-foreground/85">{particle.mass}</span>
                </div>
                <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width:
                        logMassFraction === null
                          ? "55%"
                          : logMassFraction === 0
                            ? "4%"
                            : `${Math.max(4, Math.round(logMassFraction * 100))}%`,
                      background:
                        logMassFraction === null
                          ? `repeating-linear-gradient(90deg, ${particle.hex}99 0 6px, transparent 6px 10px)`
                          : `linear-gradient(90deg, ${particle.hex}, ${particle.accentHex})`,
                    }}
                  />
                </div>
              </div>

              {/* Electric Charge bidirectional meter */}
              <div>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="text-foreground/55 font-medium">Electric Charge</span>
                  <span className="font-mono font-semibold text-foreground/85">{displayCharge} e</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-black/10 dark:bg-white/8 overflow-hidden">
                  {/* Zero marker */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-black/30 dark:bg-white/35 z-10"
                    style={{ left: `${zeroPct}%` }}
                  />
                  {particle.bipolarCharge ? (
                    <>
                      <div
                        className="absolute top-0 bottom-0 rounded-l-full transition-all duration-300"
                        style={{
                          left: "0%",
                          width: `${zeroPct}%`,
                          backgroundColor: effectiveAnti ? "#38bdf8" : "#fb7185",
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 rounded-r-full transition-all duration-300"
                        style={{
                          left: `${zeroPct}%`,
                          width: `${zeroPct}%`,
                          backgroundColor: effectiveAnti ? "#fb7185" : "#38bdf8",
                        }}
                      />
                      {particle.charge.includes("0") && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] z-20"
                          style={{ left: `${zeroPct}%` }}
                        />
                      )}
                    </>
                  ) : (
                    barWidth > 0 && (
                      <div
                        className="absolute top-0 bottom-0 rounded-full transition-all duration-300"
                        style={{
                          left: `${barLeft}%`,
                          width: `${barWidth}%`,
                          backgroundColor: numericCharge >= 0 ? "#38bdf8" : "#fb7185",
                        }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Spin & Color Charge */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/8 dark:border-white/6">
                  <div className="text-[10px] text-foreground/45 uppercase tracking-wider">Spin</div>
                  <div className="font-mono font-semibold text-foreground/85 mt-0.5">
                    {particle.spin} ℏ
                  </div>
                  <div className="text-[10px] text-foreground/50 mt-0.5 truncate">
                    {getSpinSymmetryLabel(particle.spinNum)}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/8 dark:border-white/6">
                  <div className="text-[10px] text-foreground/45 uppercase tracking-wider">
                    Color Charge
                  </div>
                  {particle.colorCharge ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[11px] font-mono text-foreground/80">
                        {particle.id === "gluon" || particle.id === "gluino"
                          ? "8-Octet"
                          : effectiveAnti
                            ? "Anti-RGB"
                            : "R / G / B"}
                      </span>
                    </div>
                  ) : particle.quarks ? (
                    <div className="text-[11px] font-mono text-amber-700 dark:text-amber-300/85 mt-1">
                      Color-Neutral (QCD Bag)
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-foreground/55 mt-1">
                      Colorless
                    </div>
                  )}
                </div>
              </div>

              {/* Mean Lifetime & Discovery */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/8 dark:border-white/6">
                  <div className="text-[10px] text-foreground/45 uppercase tracking-wider">
                    Mean Lifetime
                  </div>
                  <div className="font-mono text-foreground/80 mt-0.5 truncate">
                    {particle.meanLifetime}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/8 dark:border-white/6">
                  <div className="text-[10px] text-foreground/45 uppercase tracking-wider">
                    Discovered
                  </div>
                  <div className="font-mono text-foreground/80 mt-0.5 truncate">
                    {particle.discovered}
                  </div>
                </div>
              </div>
            </div>

            {/* Fundamental Forces */}
            <div className="mt-3.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/45 mb-1.5">
                Fundamental Forces
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_FORCES.map((force) => {
                  const activeForce = particle.forces.includes(force);
                  const meta = FORCE_META[force];
                  return (
                    <span
                      key={force}
                      title={meta.description}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${activeForce
                          ? "font-semibold"
                          : "border-black/10 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.02] text-foreground/25"
                        }`}
                      style={
                        activeForce
                          ? {
                            color: meta.hex,
                            borderColor: `${meta.hex}55`,
                            backgroundColor: `${meta.hex}18`,
                          }
                          : undefined
                      }
                    >
                      {meta.short}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Clickable Constituent Quarks (Hadrons) */}
            {particle.quarks && particle.quarks.length > 0 && (
              <div className="mt-3.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-foreground/45 mb-1.5">
                  {particle.isSuperposition
                    ? "Quantum Superposition: (uū + dd̄ − 2ss̄)/√6 (click to inspect)"
                    : "Constituent Quarks (click to inspect)"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {particle.isSuperposition
                    ? (
                      [
                        { id: "up", pair: "u / ū", name: "Up", color: QUARK_COLOR_HEX.red },
                        { id: "down", pair: "d / d̄", name: "Down", color: QUARK_COLOR_HEX.green },
                        { id: "strange", pair: "s / s̄", name: "Strange", color: QUARK_COLOR_HEX.blue },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onJumpToParticleId(item.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.08] dark:hover:bg-white/10 border border-black/10 dark:border-white/10 hover:border-cyan-500/40 text-xs font-mono transition-all"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-bold text-foreground/90">{item.pair}</span>
                        <span className="text-[10px] text-foreground/50">({item.name})</span>
                      </button>
                    ))
                    : particle.quarks.map((q, i) => {
                      const effCol = effectiveAnti ? flipQuarkColor(q.color) : q.color;
                      const isAntiQ = effectiveAnti ? !q.anti : q.anti;
                      const hex = QUARK_COLOR_HEX[effCol];
                      const targetQuark = getParticleById(getQuarkParticleId(q.flavor));
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onJumpToParticleId(getQuarkParticleId(q.flavor))}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/5 hover:bg-black/[0.08] dark:hover:bg-white/10 border border-black/10 dark:border-white/10 hover:border-cyan-500/40 text-xs font-mono transition-all"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="font-bold text-foreground/90">
                            {isAntiQ ? `${q.flavor}\u0304` : q.flavor}
                          </span>
                          {targetQuark && (
                            <span className="text-[10px] text-foreground/50">
                              ({isAntiQ ? `anti-${targetQuark.name.toLowerCase()}` : targetQuark.name})
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Clickable SM <-> SUSY Superpartner Link */}
            {superpartner && (
              <div className="mt-3.5">
                <button
                  type="button"
                  onClick={() => onJumpToParticleId(superpartner.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 dark:border-violet-400/25 hover:border-violet-500/50 text-xs transition-all group"
                >
                  <span className="text-foreground/65 font-mono text-[11px]">
                    SUSY Superpartner
                  </span>
                  <span className="flex items-center gap-2 font-semibold text-violet-700 dark:text-violet-300 group-hover:text-violet-900 dark:group-hover:text-violet-200">
                    <span className="font-mono text-sm">{superpartner.symbol}</span>
                    {superpartner.name}
                    <ChevronRight size={13} />
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Description + Antiparticle footer */}
          <div className="pt-3 border-t border-black/10 dark:border-white/8 text-xs text-foreground/60 leading-relaxed space-y-1">
            <p>{particle.description}</p>
            <p className="text-[11px] font-mono text-foreground/45">
              {effectiveAnti ? "Matter counterpart" : "Antiparticle"}:{" "}
              <span className="text-foreground/75">
                {effectiveAnti
                  ? `${particle.name} (${particle.symbol})`
                  : `${particle.antiparticle} (${particle.antiparticleSymbol})`}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
