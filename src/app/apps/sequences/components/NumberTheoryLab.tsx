"use client";

import { useMemo, useState } from "react";
import { Activity, CheckCircle2, FlaskConical, ShieldAlert } from "lucide-react";
import {
  checkSpecialMembership,
  computeCollatzTrajectory,
  divisorCount,
  eulerTotient,
  factorizeBigInt,
  isPrimeBigInt,
  nextPrimeBigInt,
  prevPrimeBigInt,
} from "../lib/numberTheory";

const INSPECTOR_PRESETS = [
  { label: "2³¹−1 (Mersenne)", val: "2147483647" },
  { label: "10⁹+7", val: "1000000007" },
  { label: "F(50)", val: "12586269025" },
  { label: "Euler #3", val: "600851475143" },
  { label: "Carmichael 561", val: "561" },
];

const COLLATZ_PRESETS = ["27", "871", "6171", "77031", "837799"];

export function NumberTheoryLab() {
  const [numInput, setNumInput] = useState("600851475143");
  const [collatzInput, setCollatzInput] = useState("27");

  const parsedNum = useMemo(() => {
    const clean = numInput.replace(/[^\d]/g, "");
    if (!clean) return null;
    try {
      const b = BigInt(clean);
      if (b < 1n || clean.length > 26) return null;
      return b;
    } catch {
      return null;
    }
  }, [numInput]);

  const inspection = useMemo(() => {
    if (parsedNum === null) return null;
    const prime = isPrimeBigInt(parsedNum);
    const factors = parsedNum >= 2n ? factorizeBigInt(parsedNum) : [];
    const tau = parsedNum === 1n ? 1n : divisorCount(factors);
    const phi = parsedNum === 1n ? 1n : eulerTotient(factors);
    const nextP = nextPrimeBigInt(parsedNum);
    const prevP = prevPrimeBigInt(parsedNum);
    const special = checkSpecialMembership(parsedNum);
    return { prime, factors, tau, phi, nextP, prevP, special };
  }, [parsedNum]);

  const collatz = useMemo(() => {
    const clean = collatzInput.replace(/[^\d]/g, "");
    if (!clean) return null;
    try {
      const seed = BigInt(clean);
      if (seed < 1n || clean.length > 18) return null;
      return computeCollatzTrajectory(seed, 1200);
    } catch {
      return null;
    }
  }, [collatzInput]);

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* LEFT: Primality, Factorization & Special Properties */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/35 flex items-center justify-center text-cyan-600 dark:text-cyan-300">
            <FlaskConical size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Primality &amp; Factorization Inspector
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Miller–Rabin + Brent Pollard&apos;s Rho BigInt analyzer (up to 26 digits)
            </p>
          </div>
        </div>

        <input
          type="text"
          value={numInput}
          onChange={(e) => setNumInput(e.target.value)}
          placeholder="Enter a positive integer…"
          aria-label="Integer to inspect"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-50/80 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:border-cyan-500/50"
        />

        <div className="flex flex-wrap gap-1.5">
          {INSPECTOR_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setNumInput(p.val)}
              className="px-2 py-1 rounded-lg text-[10px] font-mono border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              {p.label}
            </button>
          ))}
        </div>

        {!inspection || parsedNum === null ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter a positive integer up to 26 digits to inspect its arithmetic structure.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Verdict banner */}
            <div
              className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${
                parsedNum === 1n
                  ? "border-slate-300 dark:border-white/15 bg-slate-100/70 dark:bg-white/[0.04]"
                  : inspection.prime
                    ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                    : "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                {inspection.prime ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <ShieldAlert size={16} />
                )}
                {parsedNum === 1n
                  ? "1 is the Multiplicative Unit"
                  : inspection.prime
                    ? "Prime Number"
                    : "Composite Number"}
              </div>
              <span className="text-[11px] font-mono opacity-80">
                {parsedNum.toString().length} digits
              </span>
            </div>

            {/* Prime factorization */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03] space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Prime Factorization
              </div>
              <div className="font-mono text-sm text-slate-900 dark:text-white break-all">
                {parsedNum === 1n
                  ? "1 (empty product)"
                  : inspection.factors
                      .map((f) =>
                        f.exp === 1
                          ? f.prime.toString()
                          : `${f.prime.toString()}^${f.exp}`
                      )
                      .join(" × ")}
              </div>
            </div>

            {/* Arithmetic metrics */}
            <div className="grid grid-cols-2 gap-2.5 font-mono">
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Divisor Count τ(n)
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {inspection.tau.toString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Euler&apos;s Totient φ(n)
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {inspection.phi.toString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Previous Prime
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                  {inspection.prevP ? inspection.prevP.toString() : "—"}
                </div>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Next Prime
                </div>
                <div className="text-xs font-bold text-cyan-700 dark:text-cyan-300 mt-0.5 truncate">
                  {inspection.nextP.toString()}
                </div>
              </div>
            </div>

            {/* Special memberships */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Sequence &amp; Structural Badges
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Fibonacci", hit: inspection.special.isFibonacci },
                  { label: "Triangular", hit: inspection.special.isTriangular },
                  { label: "Perfect Square", hit: inspection.special.isSquare },
                  { label: "Perfect Cube", hit: inspection.special.isCube },
                  { label: "Power of 2", hit: inspection.special.isPowerOfTwo },
                  { label: "Palindrome", hit: inspection.special.isPalindrome },
                ].map((b) => (
                  <span
                    key={b.label}
                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono border ${
                      b.hit
                        ? "border-cyan-500/45 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold"
                        : "border-slate-200 dark:border-white/8 bg-slate-100/60 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 line-through"
                    }`}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Collatz 3n + 1 Trajectory Explorer */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/35 flex items-center justify-center text-rose-600 dark:text-rose-300">
            <Activity size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Collatz (3n + 1) Hailstone Explorer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inspect exact BigInt stopping times, peak altitudes, and flight curves
            </p>
          </div>
        </div>

        <input
          type="text"
          value={collatzInput}
          onChange={(e) => setCollatzInput(e.target.value)}
          placeholder="Starting seed n ≥ 1…"
          aria-label="Collatz seed"
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-50/80 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:border-rose-500/50"
        />

        <div className="flex flex-wrap gap-1.5">
          {COLLATZ_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setCollatzInput(s)}
              className={`px-2 py-1 rounded-lg text-[10px] font-mono border ${
                collatzInput === s
                  ? "border-rose-500 bg-rose-500/15 text-rose-700 dark:text-rose-300 font-semibold"
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300"
              }`}
            >
              n = {Number(s).toLocaleString()}
            </button>
          ))}
        </div>

        {!collatz ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter a positive integer seed (up to 18 digits).
          </p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 font-mono">
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Stopping Time
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {collatz.steps} steps
                </div>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Peak Altitude
                </div>
                <div className="text-sm font-bold text-rose-600 dark:text-rose-300 truncate">
                  {collatz.peak.toString()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Odd / Even
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {collatz.oddSteps} / {collatz.evenSteps}
                </div>
              </div>
            </div>

            {/* Hailstone trajectory SVG */}
            {(() => {
              const W = 520;
              const H = 190;
              const pad = 16;
              const logs = collatz.trajectory.map((s) => Math.log10(Math.max(1, Number(s))));
              const maxL = Math.max(...logs, 0.5);
              const pts = logs.map((l, i) => {
                const x = pad + (i / Math.max(1, logs.length - 1)) * (W - pad * 2);
                const y = H - pad - (l / maxL) * (H - pad * 2);
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              });
              return (
                <div className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-black/25 p-2">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
                    <path
                      d={pts.join(" ")}
                      fill="none"
                      stroke="#fb7185"
                      strokeWidth={1.8}
                    />
                  </svg>
                </div>
              );
            })()}

            <div className="max-h-28 overflow-y-auto p-3 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-black/25 text-xs font-mono text-slate-600 dark:text-slate-300 leading-relaxed">
              {collatz.trajectory.slice(0, 120).join(" → ")}
              {collatz.trajectory.length > 120 && " → … → 1"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
