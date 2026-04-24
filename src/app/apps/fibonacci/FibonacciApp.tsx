"use client";

import { useState, useCallback, useMemo } from "react";
import { Download, Loader2, Lock, Unlock, Infinity as InfinityIcon, Hash, List, AlertCircle } from "lucide-react";
import {
  generateSequence, getNthFibonacci, downloadJSON,
  DEFAULT_MAX, type OutputFormat,
} from "./lib/fibonacci";

/* ── small helpers ────────────────────────────────────────────────────────── */
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
        className="h-full rounded-full bg-gradient-to-r from-quantum to-olive-400 transition-all duration-150 ease-linear"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ModeButton({
  active, onClick, icon: Icon, label, sublabel,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.FC<{ size?: number; className?: string }>;
  label: string;
  sublabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border text-center transition-all ${
        active
          ? "bg-quantum/15 border-quantum/40 text-quantum shadow-[0_0_20px_rgba(0,195,245,0.08)]"
          : "border-white/8 bg-white/3 text-foreground/40 hover:border-white/15 hover:text-foreground/60"
      }`}
    >
      <Icon size={20} className={active ? "text-quantum" : undefined} />
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[10px] font-mono text-foreground/35 mt-0.5">{sublabel}</div>
      </div>
    </button>
  );
}

/* ── stat card for preview panel ─────────────────────────────────────────── */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-3 flex flex-col gap-0.5">
      <span className="text-[10px] font-mono text-foreground/30 uppercase tracking-wider">{label}</span>
      <span className="text-sm font-semibold text-foreground/80 break-all">{value}</span>
    </div>
  );
}

/* ── main app ─────────────────────────────────────────────────────────────── */
export function FibonacciApp() {
  const [n, setN] = useState("");
  const [format, setFormat] = useState<OutputFormat>("full");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const baseMax = DEFAULT_MAX[format];
  const maxLimit = unlocked ? Number.MAX_SAFE_INTEGER : baseMax;

  const numN = useMemo(() => {
    const v = parseInt(n, 10);
    return isNaN(v) ? 0 : v;
  }, [n]);

  const isValid = numN >= 1 && numN <= maxLimit;
  const isDisabled = loading || !n || !isValid;

  /* Preview: first few terms of the sequence (up to 7) */
  const previewTerms = useMemo(() => {
    const terms: string[] = [];
    let a = BigInt(0), b = BigInt(1);
    for (let i = 0; i < Math.min(numN, 7); i++) {
      terms.push(i === 0 ? "0" : i === 1 ? "1" : (a + b).toString().slice(0, 12) + (String(a + b).length > 12 ? "…" : ""));
      if (i >= 1) { const t = a + b; a = b; b = t; }
    }
    return terms;
  }, [numN]);

  /* Approximate digit count for Nth Fibonacci: ~n × log10(φ) */
  const approxDigits = useMemo(() => {
    if (!numN || numN < 1) return null;
    const digits = Math.ceil(numN * Math.log10(1.6180339887));
    return digits;
  }, [numN]);

  const handleFormatChange = useCallback((f: OutputFormat) => {
    if (!unlocked) {
      const newMax = DEFAULT_MAX[f];
      if (numN > newMax) setN(String(newMax));
    }
    setFormat(f);
    setError("");
  }, [unlocked, numN]);

  const handleGenerate = useCallback(async () => {
    setError("");
    setLoading(true);
    setProgress(0);

    try {
      if (format === "full") {
        const seq = await generateSequence(numN, setProgress);
        const data = seq.map((v, i) => ({ n: i, Fibonacci: v.toString() }));
        downloadJSON(data, `fibonacci_sequence_n${numN}.json`);
      } else {
        const nth = await getNthFibonacci(numN, setProgress);
        downloadJSON({ n: numN - 1, Fibonacci: nth.toString() }, `fibonacci_nth_${numN}.json`);
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [format, numN]);

  return (
    <div className="grid lg:grid-cols-5 gap-8 items-start max-w-5xl mx-auto">

      {/* ── LEFT: Controls ── */}
      <div className="lg:col-span-3 space-y-6">

        {/* Mode selector */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">Output mode</h2>
          <div className="flex gap-3">
            <ModeButton
              active={format === "full"}
              onClick={() => handleFormatChange("full")}
              icon={List}
              label="Full sequence"
              sublabel={`First n terms (max ${DEFAULT_MAX.full.toLocaleString()})`}
            />
            <ModeButton
              active={format === "nth"}
              onClick={() => handleFormatChange("nth")}
              icon={Hash}
              label="Only the Nth"
              sublabel={`Single value (max ${DEFAULT_MAX.nth.toLocaleString()})`}
            />
          </div>
        </div>

        {/* Input */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">
            {format === "full" ? "Number of terms (n)" : "Which Fibonacci number? (n)"}
          </h2>

          <div>
            <input
              id="fib-n-input"
              type="number"
              value={n}
              onChange={(e) => { setError(""); setN(e.target.value); }}
              onKeyDown={(e) => e.key === "Enter" && !isDisabled && handleGenerate()}
              placeholder={format === "full" ? "e.g. 1000" : "e.g. 1000000"}
              min={1}
              max={unlocked ? undefined : baseMax}
              className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/10 text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-quantum/40 focus:ring-2 focus:ring-quantum/10 transition-all text-lg font-mono"
              aria-describedby={error ? "fib-error" : undefined}
            />
            {error && (
              <div id="fib-error" className="flex items-center gap-2 mt-2 text-sm text-crimson/80">
                <AlertCircle size={13} />
                {error}
              </div>
            )}
            {n && !isValid && !error && (
              <p className="mt-2 text-xs text-foreground/40">
                Value must be between 1 and {unlocked ? "∞" : baseMax.toLocaleString()}.
              </p>
            )}
          </div>

          {/* Unlock toggle */}
          <button
            onClick={() => setUnlocked((u) => !u)}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
              unlocked
                ? "border-crimson/30 bg-crimson/10 text-crimson/70 hover:bg-crimson/15"
                : "border-white/10 bg-white/4 text-foreground/35 hover:border-quantum/25 hover:text-foreground/55"
            }`}
          >
            {unlocked ? <Unlock size={12} /> : <Lock size={12} />}
            {unlocked ? "Limits unlocked — tread carefully" : "Unlock limits"}
            {unlocked && <InfinityIcon size={11} className="ml-1" />}
          </button>
        </div>

        {/* Generate button + progress */}
        <div className="glass-card p-5 space-y-4">
          <button
            onClick={handleGenerate}
            disabled={isDisabled}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all
              bg-quantum/15 border border-quantum/30 text-quantum
              hover:bg-quantum/25 hover:shadow-[0_0_24px_rgba(0,195,245,0.15)]
              disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-quantum/15 disabled:hover:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating… {progress}%
              </>
            ) : (
              <>
                <Download size={16} />
                {format === "full" ? `Download sequence JSON` : `Download Nth Fibonacci JSON`}
              </>
            )}
          </button>

          {loading && <ProgressBar value={progress} />}

          <p className="text-[11px] text-foreground/25 text-center">
            All computation happens locally in your browser — no data is uploaded.
          </p>
        </div>
      </div>

      {/* ── RIGHT: Info + preview ── */}
      <div className="lg:col-span-2 space-y-5">

        {/* Stats */}
        <div className="glass-card p-5 space-y-3">
          <h3 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">Estimates</h3>
          {numN >= 1 ? (
            <div className="space-y-2">
              <StatCard label="Term index (0-based)" value={String(numN - 1)} />
              <StatCard label="Approx. digits in F(n)" value={approxDigits ? `~${approxDigits.toLocaleString()}` : "—"} />
              {format === "full" && (
                <StatCard label="Terms in JSON" value={numN.toLocaleString()} />
              )}
              <StatCard label="Mode" value={format === "full" ? "Full sequence" : "Single value"} />
            </div>
          ) : (
            <p className="text-sm text-foreground/25">Enter a number to see estimates.</p>
          )}
        </div>

        {/* Live preview of first few terms */}
        {numN >= 1 && (
          <div className="glass-card p-5 space-y-3">
            <h3 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">
              First {Math.min(numN, 7)} terms
            </h3>
            <div className="space-y-1">
              {previewTerms.map((v, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-foreground/25 w-6 text-right">{i}</span>
                  <span className="font-mono text-foreground/70">{v}</span>
                </div>
              ))}
              {numN > 7 && (
                <div className="text-xs text-foreground/25 font-mono pl-9 mt-1">… {(numN - 7).toLocaleString()} more</div>
              )}
            </div>
          </div>
        )}

        {/* Did you know */}
        <div className="glass-card p-5 space-y-2 border-quantum/10">
          <h3 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">Did you know?</h3>
          <ul className="space-y-2 text-xs text-foreground/40 leading-relaxed">
            <li>• F(1000) has <strong className="text-foreground/55">209 digits</strong>.</li>
            <li>• F(10000) has approximately <strong className="text-foreground/55">2090 digits</strong>.</li>
            <li>• The ratio of consecutive terms converges to <strong className="text-foreground/55">φ ≈ 1.618</strong> (the golden ratio).</li>
            <li>• Uses <strong className="text-foreground/55">BigInt</strong> arithmetic — no precision loss, ever.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
