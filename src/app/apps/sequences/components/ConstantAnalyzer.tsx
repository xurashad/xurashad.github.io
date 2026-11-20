"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";
import type { ConstantMeta, ConstantResult, ExportFormat } from "../lib/types";
import { exportConstantData } from "../lib/numberTheory";

interface Props {
  meta: ConstantMeta;
  result: ConstantResult;
}

const DIGITS_PER_PAGE = 1000;
const DIGITS_PER_LINE = 50;

export function ConstantAnalyzer({ meta, result }: Props) {
  const [subTab, setSubTab] = useState<"digits" | "frequency" | "walk" | "cf">("digits");
  const [page, setPage] = useState(0);
  const [pattern, setPattern] = useState("");
  const [copied, setCopied] = useState(false);
  const [walkLimit, setWalkLimit] = useState(10_000);
  const walkCanvasRef = useRef<HTMLCanvasElement>(null);

  const frac = result.fractionalDigits;
  const totalPages = Math.max(1, Math.ceil(frac.length / DIGITS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);

  // Pattern search across computed fractional digits
  const searchStats = useMemo(() => {
    const q = pattern.replace(/\D/g, "");
    if (!q) return null;
    let firstIdx = -1;
    let count = 0;
    let pos = frac.indexOf(q);
    while (pos !== -1) {
      if (firstIdx === -1) firstIdx = pos;
      count++;
      pos = frac.indexOf(q, pos + 1);
    }
    return { query: q, firstIdx, count };
  }, [frac, pattern]);

  // Digit frequency & Chi-Square / Shannon entropy
  const freqStats = useMemo(() => {
    const counts = Array(10).fill(0);
    for (let i = 0; i < frac.length; i++) {
      const code = frac.charCodeAt(i) - 48;
      if (code >= 0 && code <= 9) counts[code]++;
    }
    const n = Math.max(1, frac.length);
    const expected = n / 10;
    let chi2 = 0;
    let entropy = 0;
    for (let d = 0; d < 10; d++) {
      chi2 += ((counts[d] - expected) ** 2) / expected;
      const p = counts[d] / n;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    const maxCount = Math.max(...counts, 1);
    return { counts, chi2, entropy, maxCount, n };
  }, [frac]);

  // Render 2D Digit Walk Cosmic Art
  useEffect(() => {
    if (subTab !== "walk") return;
    const canvas = walkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 480;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#060913";
    ctx.fillRect(0, 0, size, size);

    const steps = Math.min(frac.length, walkLimit);
    if (steps === 0) return;

    // Precompute bounding box
    const xs = new Float32Array(steps + 1);
    const ys = new Float32Array(steps + 1);
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    let x = 0, y = 0;
    for (let i = 0; i < steps; i++) {
      const d = frac.charCodeAt(i) - 48;
      const angle = (d * 36 * Math.PI) / 180 - Math.PI / 2;
      x += Math.cos(angle);
      y += Math.sin(angle);
      xs[i + 1] = x;
      ys[i + 1] = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const pad = 28;
    const scale = (size - pad * 2) / Math.max(spanX, spanY);
    const offsetX = pad + ((size - pad * 2) - spanX * scale) / 2 - minX * scale;
    const offsetY = pad + ((size - pad * 2) - spanY * scale) / 2 - minY * scale;

    ctx.lineWidth = steps > 12000 ? 0.9 : 1.25;
    ctx.lineCap = "round";

    const chunkSize = Math.max(20, Math.floor(steps / 120));
    for (let start = 0; start < steps; start += chunkSize) {
      const end = Math.min(steps, start + chunkSize);
      const hue = 185 + (start / steps) * 145; // cyan -> violet -> magenta
      ctx.strokeStyle = `hsla(${hue}, 88%, 62%, 0.72)`;
      ctx.beginPath();
      ctx.moveTo(offsetX + xs[start] * scale, offsetY + ys[start] * scale);
      for (let i = start + 1; i <= end; i++) {
        ctx.lineTo(offsetX + xs[i] * scale, offsetY + ys[i] * scale);
      }
      ctx.stroke();
    }

    // Start & end markers
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(offsetX, offsetY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(offsetX + xs[steps] * scale, offsetY + ys[steps] * scale, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [subTab, frac, walkLimit]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${result.integerPart}.${frac}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked
    }
  };

  const handleExport = (fmt: ExportFormat) => {
    exportConstantData(result, meta, fmt);
  };

  const handleDownloadWalk = () => {
    const c = walkCanvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `${meta.id}_digit_walk_${Math.min(frac.length, walkLimit)}.png`;
    a.click();
  };

  // Current page lines (50 digits per line)
  const pageStart = safePage * DIGITS_PER_PAGE;
  const pageSlice = frac.slice(pageStart, pageStart + DIGITS_PER_PAGE);
  const lines = useMemo(() => {
    const out: { offset: number; text: string }[] = [];
    for (let i = 0; i < pageSlice.length; i += DIGITS_PER_LINE) {
      out.push({
        offset: pageStart + i + 1,
        text: pageSlice.slice(i, i + DIGITS_PER_LINE),
      });
    }
    return out;
  }, [pageSlice, pageStart]);

  const renderLineWithHighlight = (text: string, lineStartOffset: number) => {
    const blocks = text.match(/.{1,10}/g) ?? [text];
    if (!searchStats || !searchStats.query) {
      return blocks.join(" ");
    }
    const q = searchStats.query;
    const lineGlobalStart = lineStartOffset - 1;
    const lineGlobalEnd = lineGlobalStart + text.length;

    // Collect match spans intersecting this line
    const hitMask = new Uint8Array(text.length);
    const scanFrom = Math.max(0, lineGlobalStart - q.length + 1);
    let pos = frac.indexOf(q, scanFrom);
    while (pos !== -1 && pos < lineGlobalEnd) {
      const mStart = Math.max(0, pos - lineGlobalStart);
      const mEnd = Math.min(text.length, pos + q.length - lineGlobalStart);
      for (let k = mStart; k < mEnd; k++) hitMask[k] = 1;
      pos = frac.indexOf(q, pos + 1);
    }

    return blocks.map((blk, bIdx) => {
      const base = bIdx * 10;
      const nodes: React.ReactNode[] = [];
      let curRun = "";
      let curHit = hitMask[base] === 1;
      for (let j = 0; j < blk.length; j++) {
        const isHit = hitMask[base + j] === 1;
        if (isHit !== curHit) {
          nodes.push(
            curHit ? (
              <mark key={`${bIdx}-${j}`} className="seq-digit-match font-bold">
                {curRun}
              </mark>
            ) : (
              curRun
            )
          );
          curRun = blk[j];
          curHit = isHit;
        } else {
          curRun += blk[j];
        }
      }
      if (curRun) {
        nodes.push(
          curHit ? (
            <mark key={`${bIdx}-end`} className="seq-digit-match font-bold">
              {curRun}
            </mark>
          ) : (
            curRun
          )
        );
      }
      return (
        <span key={bIdx} className="mr-2.5 inline-block">
          {nodes}
        </span>
      );
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-4 sm:p-5 space-y-4">
      {/* Top Export + SubTab Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-white/8">
        <div className="flex flex-wrap gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
          {[
            { id: "digits" as const, label: "Digits & Search", icon: <Search size={12} /> },
            { id: "frequency" as const, label: "Normality (0–9)", icon: <BarChart3 size={12} /> },
            { id: "walk" as const, label: "2D Digit Walk", icon: <Sparkles size={12} /> },
            { id: "cf" as const, label: "Continued Fraction", icon: <ChevronRight size={12} /> },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                subTab === t.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("json")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-cyan-500/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20"
          >
            <Download size={12} />
            JSON
          </button>
          <button
            type="button"
            onClick={() => handleExport("csv")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <FileSpreadsheet size={12} />
            CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport("txt")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <FileText size={12} />
            TXT
          </button>
        </div>
      </div>

      {/* SubTab 1: Digit Explorer & Pattern Search */}
      {subTab === "digits" && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[210px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={pattern}
                onChange={(e) => {
                  const val = e.target.value;
                  setPattern(val);
                  const clean = val.replace(/\D/g, "");
                  if (clean) {
                    const idx = frac.indexOf(clean);
                    if (idx !== -1) setPage(Math.floor(idx / DIGITS_PER_PAGE));
                  }
                }}
                placeholder={`Find digits (e.g. birthday 0704) inside ${meta.symbol}…`}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/25 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {searchStats && (
              <div className="text-xs font-mono px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200">
                {searchStats.firstIdx === -1 ? (
                  <span className="text-rose-500">Not found in {result.totalDigits.toLocaleString()} digits</span>
                ) : (
                  <span>
                    First at digit <strong className="text-cyan-600 dark:text-cyan-300">#{(searchStats.firstIdx + 1).toLocaleString()}</strong> · {searchStats.count} match{searchStats.count !== 1 ? "es" : ""}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Integer + Grouped Digits Display */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/80 dark:bg-black/30 font-mono text-xs sm:text-[13px] leading-relaxed overflow-x-auto">
            <div className="mb-2 pb-2 border-b border-slate-200/80 dark:border-white/8 flex items-center justify-between">
              <span className="text-slate-800 dark:text-slate-100 font-bold text-sm">
                {meta.symbol} = {result.integerPart}.<span className="text-slate-400 font-normal">…</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Showing digits {(pageStart + 1).toLocaleString()}–{Math.min(frac.length, pageStart + DIGITS_PER_PAGE).toLocaleString()} of {frac.length.toLocaleString()}
              </span>
            </div>

            <div className="space-y-1">
              {lines.map((ln) => (
                <div key={ln.offset} className="flex items-baseline gap-3">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 w-14 text-right shrink-0 select-none">
                    +{ln.offset}
                  </span>
                  <div className="text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {renderLineWithHighlight(ln.text, ln.offset)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs font-mono">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-30 text-slate-700 dark:text-slate-200"
              >
                <ChevronLeft size={13} /> Prev 1,000
              </button>
              <span className="text-slate-500 dark:text-slate-400">
                Page {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-30 text-slate-700 dark:text-slate-200"
              >
                Next 1,000 <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* SubTab 2: Normality & Digit Frequency */}
      {subTab === "frequency" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
              <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Sample Size
              </div>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-white">
                {freqStats.n.toLocaleString()} digits
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03]">
              <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Pearson χ² (df=9)
              </div>
              <div className="text-base font-mono font-bold text-cyan-700 dark:text-cyan-300">
                {freqStats.chi2.toFixed(2)}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03] col-span-2 sm:col-span-1">
              <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">
                Shannon Entropy
              </div>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-white">
                {freqStats.entropy.toFixed(5)} <span className="text-[10px] font-normal text-slate-400">/ 3.32193 bits</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-10 gap-2 h-44 pt-5 px-3 pb-2 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.02] relative">
            {freqStats.counts.map((c, d) => {
              const pct = ((c / freqStats.n) * 100).toFixed(2);
              const barH = Math.max(8, (c / freqStats.maxCount) * 100);
              return (
                <div key={d} className="flex flex-col items-center justify-end gap-1 h-full">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                    {pct}%
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${barH}%`,
                      background: `linear-gradient(180deg, ${meta.accentHex}, ${meta.accentHex}75)`,
                    }}
                    title={`Digit ${d}: ${c.toLocaleString()} (${pct}%)`}
                  />
                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100">
                    {d}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SubTab 3: 2D Digit Walk Cosmic Art */}
      {subTab === "walk" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
              {[1000, 5000, 15000, 50000].map((lim) => (
                <button
                  key={lim}
                  type="button"
                  onClick={() => setWalkLimit(lim)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono ${
                    walkLimit === lim
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {lim >= 1000 ? `${lim / 1000}k` : lim} steps
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDownloadWalk}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Download size={12} />
              Save PNG
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <canvas
              ref={walkCanvasRef}
              className="w-[300px] sm:w-[340px] h-[300px] sm:h-[340px] rounded-xl border border-slate-200 dark:border-white/12 shadow-lg shrink-0"
            />
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">Base-10 Random Walk:</strong>{" "}
                Each decimal digit d ∈ &#123;0…9&#125; rotates direction by d × 36° and steps forward 1 unit, tracing a continuous path colored from cyan (start, green dot) to magenta (end, red dot).
              </p>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                Rendering {Math.min(frac.length, walkLimit).toLocaleString()} decimal steps of {meta.symbol}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: Continued Fraction & Rational Convergents */}
      {subTab === "cf" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/70 dark:bg-white/[0.03] space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Simple Continued Fraction Expansion
            </div>
            <div className="font-mono text-sm text-slate-900 dark:text-white break-all">
              [{result.continuedFraction[0]}; {result.continuedFraction.slice(1).join(", ")}, …]
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead className="bg-slate-100/80 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="text-left py-2 px-3">k</th>
                  <th className="text-left py-2 px-3">a_k</th>
                  <th className="text-left py-2 px-3">Convergent p_k / q_k</th>
                  <th className="text-left py-2 px-3">Decimal Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                {result.convergents.map((conv, k) => {
                  const approx = Number(conv.num) / Number(conv.den);
                  return (
                    <tr key={k}>
                      <td className="py-1.5 px-3 text-slate-400">{k}</td>
                      <td className="py-1.5 px-3 text-cyan-700 dark:text-cyan-300 font-semibold">
                        {result.continuedFraction[k]}
                      </td>
                      <td className="py-1.5 px-3 text-slate-900 dark:text-white font-semibold">
                        {conv.num} / {conv.den}
                      </td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-300">
                        {Number.isFinite(approx) ? approx.toPrecision(12) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
