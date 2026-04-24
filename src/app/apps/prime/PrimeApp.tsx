"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  Download, Loader2, Lock, Unlock, AlertCircle,
  Infinity as InfinityIcon, ChevronRight, Search,
} from "lucide-react";
import {
  generatePrimesAsync, downloadJSON, approxNthPrime,
  type PrimeEntry,
} from "./lib/primes";

const DEFAULT_LIMIT = 1_000_000;

/* ── shared helpers ─────────────────────────────────────────────────────── */

function ProgressBar({ value }: { value: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full h-2 rounded-full bg-white/8 overflow-hidden"
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-olive-400 to-quantum transition-all duration-100 ease-linear"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-3 space-y-0.5">
      <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-semibold text-foreground/80 break-all">{value}</div>
    </div>
  );
}

/* ── main app ───────────────────────────────────────────────────────────── */

export function PrimeApp() {
  const [input, setInput] = useState("100");
  const [primes, setPrimes] = useState<PrimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [filterText, setFilterText] = useState("");
  const abortRef = useRef(false);

  const numN = useMemo(() => {
    const v = parseInt(input, 10);
    return isNaN(v) ? 0 : v;
  }, [input]);

  const maxLimit = unlocked ? Number.MAX_SAFE_INTEGER : DEFAULT_LIMIT;
  const isValid = numN >= 1 && numN <= maxLimit;
  const isDisabled = loading || !isValid;

  /* Approx value of the nth prime (for tooltip) */
  const approxMax = useMemo(() => (numN >= 1 ? approxNthPrime(numN) : null), [numN]);

  /* Filtered preview */
  const visiblePrimes = useMemo(() => {
    if (!filterText) return primes.slice(0, 500);
    const q = parseInt(filterText, 10);
    if (!isNaN(q)) return primes.filter((p) => String(p.prime).includes(filterText)).slice(0, 200);
    return primes.slice(0, 500);
  }, [primes, filterText]);

  const handleGenerate = useCallback(async () => {
    setError("");
    setPrimes([]);
    setProgress(0);
    abortRef.current = false;

    if (!isValid) {
      setError(`Enter a number between 1 and ${unlocked ? "∞" : DEFAULT_LIMIT.toLocaleString()}.`);
      return;
    }

    setLoading(true);
    try {
      const result = await generatePrimesAsync(numN, (pct) => {
        if (!abortRef.current) setProgress(pct);
      });
      if (!abortRef.current) setPrimes(result);
    } catch (e) {
      console.error(e);
      setError("An error occurred during generation.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [numN, isValid, unlocked]);

  const handleStop = () => {
    abortRef.current = true;
    setLoading(false);
    setProgress(0);
  };

  const handleDownload = useCallback(() => {
    if (!primes.length) return;
    downloadJSON(primes, `primes_first_${primes.length}.json`);
  }, [primes]);

  return (
    <div className="grid lg:grid-cols-5 gap-8 items-start max-w-5xl mx-auto">

      {/* ── LEFT: Controls ── */}
      <div className="lg:col-span-3 space-y-5">

        {/* Input + generate */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">
            How many primes?
          </h2>

          <div className="flex gap-2">
            <input
              id="prime-n-input"
              type="number"
              value={input}
              onChange={(e) => { setError(""); setInput(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && !isDisabled && handleGenerate()}
              placeholder="e.g. 1000"
              min={1}
              max={unlocked ? undefined : DEFAULT_LIMIT}
              className="flex-1 px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-quantum/40 focus:ring-2 focus:ring-quantum/10 transition-all text-lg font-mono"
              aria-label="Number of primes to generate"
              aria-describedby={error ? "prime-error" : undefined}
            />
            {loading ? (
              <button
                onClick={handleStop}
                className="px-5 py-3 rounded-xl border border-crimson/30 bg-crimson/10 text-crimson text-sm font-semibold hover:bg-crimson/20 transition-all"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isDisabled}
                className="px-5 py-3 rounded-xl border border-quantum/30 bg-quantum/15 text-quantum text-sm font-semibold hover:bg-quantum/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <ChevronRight size={15} />
                Generate
              </button>
            )}
          </div>

          {error && (
            <div id="prime-error" className="flex items-center gap-2 text-sm text-crimson/80">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          {input && !isValid && !error && (
            <p className="text-xs text-foreground/35">
              Value must be between 1 and {unlocked ? "∞" : DEFAULT_LIMIT.toLocaleString()}.
            </p>
          )}

          {/* Unlock */}
          <button
            onClick={() => setUnlocked((u) => !u)}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
              unlocked
                ? "border-crimson/30 bg-crimson/10 text-crimson/70 hover:bg-crimson/15"
                : "border-white/10 bg-white/4 text-foreground/35 hover:border-quantum/25 hover:text-foreground/55"
            }`}
          >
            {unlocked ? <Unlock size={12} /> : <Lock size={12} />}
            {unlocked ? "Limits unlocked — tread carefully" : "Unlock limits (>1 M)"}
            {unlocked && <InfinityIcon size={11} className="ml-1" />}
          </button>
          {unlocked && (
            <p className="text-[11px] text-foreground/30 -mt-2">
              Very large sequences may make your browser unresponsive.
            </p>
          )}
        </div>

        {/* Progress */}
        {loading && (
          <div className="glass-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-foreground/50">
              <Loader2 size={14} className="animate-spin text-quantum" />
              Generating… {progress}%
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        {/* Results panel */}
        {primes.length > 0 && !loading && (
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">
                Results — {primes.length.toLocaleString()} prime{primes.length !== 1 ? "s" : ""}
              </h3>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-quantum/30 bg-quantum/10 text-quantum hover:bg-quantum/20 transition-all"
              >
                <Download size={13} />
                Download JSON
              </button>
            </div>

            {/* Search/filter */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/25 pointer-events-none" />
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter primes…"
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-black/20 border border-white/8 text-foreground/60 placeholder:text-foreground/20 focus:outline-none focus:border-quantum/30 transition-all"
              />
            </div>

            {/* Prime grid */}
            <div className="max-h-64 overflow-y-auto rounded-xl bg-black/20 border border-white/5 p-3">
              <p className="text-sm font-mono text-foreground/65 leading-relaxed break-words">
                {visiblePrimes.map((p) => p.prime).join(", ")}
                {visiblePrimes.length < primes.length && (
                  <span className="text-foreground/25">
                    {" "}… and {(primes.length - visiblePrimes.length).toLocaleString()} more
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Info ── */}
      <div className="lg:col-span-2 space-y-5">

        {/* Stats */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">Estimates</h3>
          {numN >= 1 ? (
            <div className="space-y-2">
              <StatCard label="Primes to generate" value={numN.toLocaleString()} />
              {approxMax && (
                <StatCard label="Approx. value of P(n)" value={`~${approxMax.toLocaleString()}`} />
              )}
              {primes.length > 0 && (
                <>
                  <StatCard label="Largest prime found" value={primes[primes.length - 1].prime.toLocaleString()} />
                  <StatCard label="Smallest prime" value={primes[0].prime.toLocaleString()} />
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-foreground/25">Enter a number to see estimates.</p>
          )}
        </div>

        {/* Did you know */}
        <div className="glass-card p-5 space-y-2">
          <h3 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">Did you know?</h3>
          <ul className="space-y-2 text-xs text-foreground/40 leading-relaxed">
            <li>• There are <strong className="text-foreground/55">78,498</strong> primes below 1,000,000.</li>
            <li>• The 1,000th prime is <strong className="text-foreground/55">7,919</strong>.</li>
            <li>• By the Prime Number Theorem, P(n) ≈ <strong className="text-foreground/55">n ln n</strong>.</li>
            <li>• Twin primes differ by 2 (e.g. 11 &amp; 13). Infinitely many are conjectured to exist.</li>
            <li>• The largest known prime (2024) has over <strong className="text-foreground/55">41 million digits</strong>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
