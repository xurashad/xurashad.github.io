"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  BarChart2,
  Download,
  Orbit,
  Sparkles,
} from "lucide-react";
import type { SequenceMeta, SequenceResult } from "../lib/types";

type VisualizerTab = "growth" | "spiral" | "arcs" | "gaps";

interface Props {
  meta: SequenceMeta;
  result: SequenceResult;
}

/** Parse primary integer string (handles twin pairs like "3, 5") */
function primaryTermStr(raw: string): string {
  const comma = raw.indexOf(",");
  return (comma >= 0 ? raw.slice(0, comma) : raw).trim();
}

/** Exact log10 approximation for arbitrary-length positive integer strings */
function bigStrLog10(s: string): number {
  if (!s || s === "0") return 0;
  const clean = s.startsWith("-") ? s.slice(1) : s;
  const head = clean.slice(0, 15);
  const headNum = Number(head);
  if (!headNum || headNum <= 0) return 0;
  return clean.length - head.length + Math.log10(headNum);
}

/** Compute ratio a / b for arbitrary-length positive integer strings */
function bigStrRatio(aStr: string, bStr: string): number | null {
  if (!aStr || !bStr || bStr === "0" || aStr === "0") return null;
  const diffLen = aStr.length - bStr.length;
  if (Math.abs(diffLen) > 12) return null;
  const aLead = Number(aStr.slice(0, 15)) / Math.pow(10, Math.min(aStr.length, 15) - 1);
  const bLead = Number(bStr.slice(0, 15)) / Math.pow(10, Math.min(bStr.length, 15) - 1);
  if (!bLead) return null;
  return (aLead / bLead) * Math.pow(10, diffLen);
}

/** Fast local integer set helper up to N for spiral preview */
function buildSpiralSet(
  meta: SequenceMeta,
  result: SequenceResult,
  limitN: number
): Set<number> {
  const set = new Set<number>();
  for (let i = 0; i < result.terms.length; i++) {
    const val = Number(primaryTermStr(result.terms[i]));
    if (Number.isFinite(val) && val > 0 && val <= limitN) {
      set.add(val);
    } else if (val > limitN && meta.id !== "recaman" && meta.id !== "collatz_steps") {
      break;
    }
  }
  // If user only generated e.g. 500 terms, enrich prime/fibonacci spirals up to limitN
  if (set.size < 30 && limitN <= 25_000) {
    if (meta.id === "primes" || meta.id === "twin_primes" || meta.id === "sophie_germain") {
      const comp = new Uint8Array(limitN + 1);
      for (let i = 2; i * i <= limitN; i++) {
        if (!comp[i]) {
          for (let j = i * i; j <= limitN; j += i) comp[j] = 1;
        }
      }
      if (meta.id === "primes") {
        for (let i = 2; i <= limitN; i++) if (!comp[i]) set.add(i);
      } else if (meta.id === "twin_primes") {
        for (let i = 3; i + 2 <= limitN; i += 2) {
          if (!comp[i] && !comp[i + 2]) set.add(i);
        }
      } else if (meta.id === "sophie_germain") {
        const isPrimeSmall = (x: number) => {
          if (x <= limitN) return !comp[x];
          if (x % 2 === 0 || x % 3 === 0) return false;
          for (let d = 5; d * d <= x; d += 6) {
            if (x % d === 0 || x % (d + 2) === 0) return false;
          }
          return true;
        };
        for (let i = 2; i <= limitN; i++) {
          if (!comp[i] && isPrimeSmall(2 * i + 1)) set.add(i);
        }
      }
    } else if (meta.id === "triangular") {
      for (let k = 1; (k * (k + 1)) / 2 <= limitN; k++) {
        set.add((k * (k + 1)) / 2);
      }
    }
  }
  return set;
}

export function SequenceVisualizer({ meta, result }: Props) {
  const [userTab, setUserTab] = useState<{
    seqId: string;
    tab: VisualizerTab;
  } | null>(null);
  const [growthMetric, setGrowthMetric] = useState<"log10" | "ratio">("log10");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Spiral controls
  const [spiralType, setSpiralType] = useState<"ulam" | "sacks">("ulam");
  const [spiralLimit, setSpiralLimit] = useState<number>(10_000);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeTab: VisualizerTab =
    userTab?.seqId === meta.id ? userTab.tab : meta.defaultVisualizer;

  // Sample up to 220 evenly spaced terms for SVG charts
  const sampled = useMemo(() => {
    const n = result.terms.length;
    if (n === 0) return [];
    const maxPts = 220;
    const step = n <= maxPts ? 1 : n / maxPts;
    const out: {
      idx: number;
      raw: string;
      primary: string;
      log10: number;
      digits: number;
      ratio: number | null;
    }[] = [];

    for (let k = 0; k < Math.min(n, maxPts); k++) {
      const i = Math.min(n - 1, Math.floor(k * step));
      const raw = result.terms[i];
      const primary = primaryTermStr(raw);
      const prevPrimary = i > 0 ? primaryTermStr(result.terms[i - 1]) : "";
      out.push({
        idx: result.startIndex + i,
        raw,
        primary,
        log10: bigStrLog10(primary),
        digits: primary.length,
        ratio: i > 0 ? bigStrRatio(primary, prevPrimary) : null,
      });
    }
    return out;
  }, [result]);

  const lastRatio = useMemo(() => {
    for (let i = sampled.length - 1; i >= 0; i--) {
      if (sampled[i].ratio !== null && Number.isFinite(sampled[i].ratio!)) {
        return sampled[i].ratio!;
      }
    }
    return null;
  }, [sampled]);

  // Gap distribution (for integer sequences within JS safe integer range)
  const gapHistogram = useMemo(() => {
    if (activeTab !== "gaps") return [];
    const counts = new Map<number, number>();
    const lim = Math.min(result.terms.length, 100_000);
    for (let i = 1; i < lim; i++) {
      const a = Number(primaryTermStr(result.terms[i - 1]));
      const b = Number(primaryTermStr(result.terms[i]));
      if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a || b > 1e14) continue;
      const g = b - a;
      if (g <= 120) {
        counts.set(g, (counts.get(g) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(0, 30)
      .map(([gap, count]) => ({ gap, count }));
  }, [activeTab, result.terms]);

  // Render Ulam / Sacks Spiral Canvas
  useEffect(() => {
    if (activeTab !== "spiral") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 460;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Dark cosmic canvas backdrop
    ctx.fillStyle = "#060a14";
    ctx.fillRect(0, 0, size, size);

    const set = buildSpiralSet(meta, result, spiralLimit);

    if (spiralType === "ulam") {
      const side = Math.ceil(Math.sqrt(spiralLimit));
      const cell = size / side;
      const cx = Math.floor(side / 2);
      const cy = Math.floor(side / 2);

      let x = 0;
      let y = 0;
      let dx = 1;
      let dy = 0;
      let segLen = 1;
      let segPassed = 0;
      let turns = 0;

      for (let n = 1; n <= spiralLimit; n++) {
        const px = (cx + x) * cell;
        const py = (cy - y) * cell;

        if (n === 1) {
          ctx.fillStyle = "#f43f5e";
          ctx.fillRect(px, py, Math.max(1.8, cell), Math.max(1.8, cell));
        } else if (set.has(n)) {
          ctx.fillStyle = meta.accentHex;
          const r = Math.max(1.3, cell * 0.88);
          ctx.fillRect(px, py, r, r);
        }

        x += dx;
        y += dy;
        segPassed++;
        if (segPassed === segLen) {
          segPassed = 0;
          const tmp = dx;
          dx = -dy;
          dy = tmp;
          turns++;
          if (turns % 2 === 0) segLen++;
        }
      }
    } else {
      // Sacks Archimedean Polar Spiral: r = sqrt(n), theta = 2*pi*sqrt(n)
      const maxR = Math.sqrt(spiralLimit);
      const scale = (size * 0.46) / maxR;
      const center = size / 2;

      for (let n = 1; n <= spiralLimit; n++) {
        if (!set.has(n)) continue;
        const r = Math.sqrt(n) * scale;
        const theta = 2 * Math.PI * Math.sqrt(n);
        const px = center + r * Math.cos(theta);
        const py = center - r * Math.sin(theta);

        ctx.fillStyle = meta.accentHex;
        ctx.beginPath();
        ctx.arc(px, py, spiralLimit <= 2500 ? 2.2 : 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [activeTab, spiralType, spiralLimit, meta, result]);

  const handleDownloadSpiral = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.id}_${spiralType}_spiral.png`;
    a.click();
  };

  if (result.mode === "nth" || result.terms.length < 2) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-4 sm:p-5 space-y-4">
      {/* Header + Visualizer Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Interactive Geometry &amp; Analytics
          </h3>
        </div>

        <div className="flex flex-wrap gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
          {[
            { id: "growth" as VisualizerTab, label: "Growth & Ratio", icon: <Activity size={12} /> },
            { id: "spiral" as VisualizerTab, label: "Ulam / Sacks Spiral", icon: <Orbit size={12} /> },
            { id: "arcs" as VisualizerTab, label: "Arc Diagram", icon: <Sparkles size={12} /> },
            { id: "gaps" as VisualizerTab, label: "Gap Histogram", icon: <BarChart2 size={12} /> },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setUserTab({ seqId: meta.id, tab: t.id })}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Growth & Ratio Convergence Chart */}
      {activeTab === "growth" && (() => {
        const W = 820;
        const H = 260;
        const padL = 52;
        const padR = 20;
        const padT = 22;
        const padB = 30;
        const pW = W - padL - padR;
        const pH = H - padT - padB;

        const pts = sampled
          .map((d, i) => ({
            ...d,
            yVal: growthMetric === "log10" ? d.log10 : d.ratio,
            x: padL + (i / Math.max(1, sampled.length - 1)) * pW,
          }))
          .filter((d): d is typeof d & { yVal: number } => d.yVal !== null && Number.isFinite(d.yVal));

        const yVals = pts.map((p) => p.yVal);
        const yMin = yVals.length ? Math.min(...yVals) : 0;
        const yMax = yVals.length ? Math.max(...yVals) : 1;
        const span = Math.max(1e-6, yMax - yMin);
        const yFor = (v: number) => padT + (1 - (v - yMin) / span) * pH;

        const pathD = pts
          .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${yFor(p.yVal).toFixed(1)}`)
          .join(" ");

        const activePt = hoveredIdx !== null && pts[hoveredIdx] ? pts[hoveredIdx] : pts[pts.length - 1];

        return (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setGrowthMetric("log10")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono ${
                    growthMetric === "log10"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  log₁₀(aₙ) Magnitude
                </button>
                <button
                  type="button"
                  onClick={() => setGrowthMetric("ratio")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono ${
                    growthMetric === "ratio"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Ratio aₙ / aₙ₋₁
                </button>
              </div>

              {lastRatio !== null && (
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                  Latest ratio aₙ/aₙ₋₁ ≈{" "}
                  <strong className="text-cyan-600 dark:text-cyan-300">
                    {lastRatio.toFixed(8)}
                  </strong>
                </span>
              )}
            </div>

            {activePt && (
              <div className="px-3 py-1.5 rounded-lg bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-slate-700 dark:text-slate-200">
                  Index <strong>{activePt.idx.toLocaleString()}</strong> ({activePt.digits.toLocaleString()} digits)
                </span>
                <span className="text-cyan-700 dark:text-cyan-300 truncate max-w-md">
                  {activePt.raw.length > 36
                    ? `${activePt.raw.slice(0, 18)}…${activePt.raw.slice(-10)}`
                    : activePt.raw}
                </span>
              </div>
            )}

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
              {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                const y = padT + (1 - t) * pH;
                const val = yMin + t * span;
                return (
                  <g key={t}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={W - padR}
                      y2={y}
                      className="stroke-slate-200 dark:stroke-white/[0.07]"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-400 font-mono text-[10px]"
                    >
                      {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={meta.accentHex}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
              )}

              {pts.map((p, i) => (
                <circle
                  key={p.idx}
                  cx={p.x}
                  cy={yFor(p.yVal)}
                  r={hoveredIdx === i ? 5 : 2.5}
                  fill={meta.accentHex}
                  opacity={hoveredIdx === i ? 1 : 0.65}
                  onMouseEnter={() => setHoveredIdx(i)}
                  className="cursor-pointer"
                />
              ))}
            </svg>
          </div>
        );
      })()}

      {/* 2. Ulam & Sacks Prime Spiral */}
      {activeTab === "spiral" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
                {(["ulam", "sacks"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSpiralType(t)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ${
                      spiralType === t
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {t === "ulam" ? "Ulam Square Spiral" : "Sacks Polar Spiral"}
                  </button>
                ))}
              </div>

              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
                {[2500, 10000, 25000].map((lim) => (
                  <button
                    key={lim}
                    type="button"
                    onClick={() => setSpiralLimit(lim)}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono ${
                      spiralLimit === lim
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {lim.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadSpiral}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Download size={12} />
              Save PNG
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <canvas
              ref={canvasRef}
              className="w-[300px] sm:w-[340px] h-[300px] sm:h-[340px] rounded-xl border border-slate-200 dark:border-white/12 shadow-lg shrink-0"
            />
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">
                  {spiralType === "ulam" ? "Ulam Spiral (1963):" : "Sacks Spiral (1994):"}
                </strong>{" "}
                {spiralType === "ulam"
                  ? "Integers wind outward from the red center (1) on a square grid. Highlighted dots reveal diagonal quadratic prime-generating polynomials like n² + n + 41."
                  : "Integers map in polar coordinates r = √n, θ = 2π√n. Perfect squares align along the positive horizontal ray while prime-rich curves sweep smoothly outward."}
              </p>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Plotting integers 1…{spiralLimit.toLocaleString()} colored in{" "}
                <span style={{ color: meta.accentHex }}>{meta.name}</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Semicircular Arc Diagram (Recaman & bounded walks) */}
      {activeTab === "arcs" && (() => {
        const subset = result.terms
          .slice(0, 80)
          .map((t) => Number(primaryTermStr(t)))
          .filter((v) => Number.isFinite(v) && v >= 0 && v < 1e7);

        if (subset.length < 2) {
          return (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Arc diagram is optimized for bounded integer sequences (such as Recamán, Primes, Collatz, or Triangular numbers).
            </p>
          );
        }

        const maxVal = Math.max(...subset, 1);
        const W = 820;
        const H = 260;
        const padX = 20;
        const midY = H / 2;
        const xFor = (v: number) => padX + (v / maxVal) * (W - padX * 2);

        return (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Alternating semicircular hops connecting consecutive terms aₙ₋₁ → aₙ (first {subset.length} terms)
            </p>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
              <line
                x1={padX}
                y1={midY}
                x2={W - padX}
                y2={midY}
                className="stroke-slate-300 dark:stroke-white/15"
              />
              {subset.slice(1).map((v, i) => {
                const prev = subset[i];
                const x1 = xFor(prev);
                const x2 = xFor(v);
                const r = Math.abs(x2 - x1) / 2;
                if (r < 0.5) return null;
                const upper = i % 2 === 0;
                const sweep = upper ? (x2 > x1 ? 1 : 0) : (x2 > x1 ? 0 : 1);
                const hue = (i * 5) % 360;
                return (
                  <path
                    key={i}
                    d={`M ${x1.toFixed(1)} ${midY} A ${r.toFixed(1)} ${Math.min(r, midY - 8).toFixed(1)} 0 0 ${sweep} ${x2.toFixed(1)} ${midY}`}
                    fill="none"
                    stroke={`hsl(${hue}, 82%, 60%)`}
                    strokeWidth={1.5}
                    strokeOpacity={0.8}
                  />
                );
              })}
            </svg>
          </div>
        );
      })()}

      {/* 4. Consecutive Gap Distribution Histogram */}
      {activeTab === "gaps" && (
        <div className="space-y-3">
          {gapHistogram.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No consecutive positive gaps ≤ 120 found in the generated range (try Primes, Twin Primes, or Palindromic Primes).
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Frequency of consecutive differences d = aₙ₊₁ − aₙ (notice multiples of 6 dominating prime gaps!).
              </p>
              <div className="flex items-end gap-1.5 h-36 pt-4 px-2 pb-1 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.02] overflow-x-auto">
                {(() => {
                  const maxC = Math.max(...gapHistogram.map((g) => g.count), 1);
                  return gapHistogram.map((g) => {
                    const pct = Math.max(8, (g.count / maxC) * 100);
                    const isMult6 = g.gap % 6 === 0;
                    return (
                      <div
                        key={g.gap}
                        className="flex-1 min-w-[20px] h-full flex flex-col items-center justify-end gap-1"
                        title={`Gap ${g.gap}: ${g.count.toLocaleString()} occurrences`}
                      >
                        <span className="text-[9px] font-mono text-slate-400">
                          {g.count >= 1000 ? `${(g.count / 1000).toFixed(1)}k` : g.count}
                        </span>
                        <div
                          className="w-full rounded-t-sm transition-all"
                          style={{
                            height: `${pct}%`,
                            backgroundColor: isMult6 ? "#00c3f5" : meta.accentHex,
                            opacity: isMult6 ? 0.95 : 0.6,
                          }}
                        />
                        <span className="text-[9px] font-mono text-slate-600 dark:text-slate-300">
                          {g.gap}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
