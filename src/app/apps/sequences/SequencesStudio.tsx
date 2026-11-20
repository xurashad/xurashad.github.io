"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Infinity as InfinityIcon,
  Layers,
  Loader2,
  Lock,
  Search,
  Sparkles,
  Square,
  Unlock,
  Zap,
} from "lucide-react";
import {
  CONSTANT_CATEGORIES,
  CONSTANTS,
  SEQUENCE_CATEGORIES,
  SEQUENCES,
  getConstantMeta,
  getSequenceMeta,
} from "./lib/catalog";
import type {
  ConstantCategory,
  ConstantId,
  ConstantResult,
  ExportFormat,
  SequenceCategory,
  SequenceId,
  SequenceMode,
  SequenceResult,
  StudioTab,
} from "./lib/types";
import { MathComputeEngine } from "./lib/workerEngine";
import { exportSequenceData } from "./lib/numberTheory";
import { MathFormula } from "./components/MathFormula";
import { SequenceVisualizer } from "./components/SequenceVisualizer";
import { ConstantAnalyzer } from "./components/ConstantAnalyzer";
import { NumberTheoryLab } from "./components/NumberTheoryLab";
import "./sequences.css";

const TERMS_PER_PAGE = 120;

export function SequencesStudio() {
  const searchParams = useSearchParams();

  // Read initial route state cleanly once via lazy useState initializers
  const [activeTab, setActiveTab] = useState<StudioTab>(() => {
    const t = searchParams.get("tab");
    if (t === "constants" || t === "lab" || t === "sequences") return t;
    if (searchParams.get("const")) return "constants";
    return "sequences";
  });

  const [seqId, setSeqId] = useState<SequenceId>(() => {
    const s = searchParams.get("seq") as SequenceId | null;
    return s && SEQUENCES.some((x) => x.id === s) ? s : "fibonacci";
  });

  const [constId, setConstId] = useState<ConstantId>(() => {
    const c = searchParams.get("const") as ConstantId | null;
    return c && CONSTANTS.some((x) => x.id === c) ? c : "pi";
  });

  // Catalog filters
  const [seqCategory, setSeqCategory] = useState<SequenceCategory | "all">("all");
  const [constCategory, setConstCategory] = useState<ConstantCategory | "all">("all");

  // Sequence controls
  const seqMeta = useMemo(() => getSequenceMeta(seqId), [seqId]);
  const [seqMode, setSeqMode] = useState<SequenceMode>("full");
  const [seqCountStr, setSeqCountStr] = useState<string>(() =>
    String(getSequenceMeta(seqId).defaultCount)
  );
  const [seqNthStr, setSeqNthStr] = useState<string>("100");
  const [rangeStartStr, setRangeStartStr] = useState<string>("1");
  const [rangeEndStr, setRangeEndStr] = useState<string>("5000");
  const [seqUnlocked, setSeqUnlocked] = useState(false);

  // Constant controls
  const constMeta = useMemo(() => getConstantMeta(constId), [constId]);
  const [digitsStr, setDigitsStr] = useState<string>(() =>
    String(getConstantMeta(constId).defaultDigits)
  );
  const [customSqrtK, setCustomSqrtK] = useState<string>("5");
  const [constUnlocked, setConstUnlocked] = useState(false);

  // Execution state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [seqResult, setSeqResult] = useState<SequenceResult | null>(null);
  const [constResult, setConstResult] = useState<ConstantResult | null>(null);

  // Results inspection pagination & filtering
  const [termFilter, setTermFilter] = useState("");
  const [termPage, setTermPage] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const engineRef = useRef<MathComputeEngine | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new MathComputeEngine();
    }
    return engineRef.current;
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.terminate();
    };
  }, []);

  // Filtered catalog lists
  const visibleSequences = useMemo(
    () =>
      seqCategory === "all"
        ? SEQUENCES
        : SEQUENCES.filter((s) => s.category === seqCategory),
    [seqCategory]
  );

  const visibleConstants = useMemo(
    () =>
      constCategory === "all"
        ? CONSTANTS
        : CONSTANTS.filter((c) => c.category === constCategory),
    [constCategory]
  );

  const handleSelectSequence = (nextId: SequenceId) => {
    const nextMeta = getSequenceMeta(nextId);
    setSeqId(nextId);
    setSeqMode("full");
    setSeqCountStr(String(nextMeta.defaultCount));
    setSeqNthStr(nextId === "primes" ? "10000" : nextMeta.id === "bell" || nextMeta.id === "factorials" ? "100" : "1000");
    setError("");
    setTermFilter("");
    setTermPage(0);
  };

  const handleSelectConstant = (nextId: ConstantId) => {
    const nextMeta = getConstantMeta(nextId);
    setConstId(nextId);
    setDigitsStr(String(nextMeta.defaultDigits));
    setError("");
  };

  const effectiveMode: SequenceMode =
    seqMode === "nth" && !seqMeta.supportsNth
      ? "full"
      : seqMode === "range" && !seqMeta.supportsRange
        ? "full"
        : seqMode;

  const numCount = parseInt(seqCountStr, 10) || 0;
  const numNth = parseInt(seqNthStr, 10);
  const numRangeStart = parseInt(rangeStartStr, 10) || 0;
  const numRangeEnd = parseInt(rangeEndStr, 10) || 0;

  const maxSeqCount = seqUnlocked ? seqMeta.unlockedMaxFull : seqMeta.defaultMaxFull;
  const maxSeqNth = seqUnlocked ? seqMeta.defaultMaxNth * 2 : seqMeta.defaultMaxNth;

  const seqInputValid = useMemo(() => {
    if (effectiveMode === "full") {
      return numCount >= 1 && numCount <= maxSeqCount;
    }
    if (effectiveMode === "nth") {
      const minIdx = seqMeta.startIndex;
      return !Number.isNaN(numNth) && numNth >= minIdx && numNth <= maxSeqNth;
    }
    return (
      numRangeStart >= seqMeta.startIndex &&
      numRangeEnd >= numRangeStart &&
      numRangeEnd - numRangeStart <= (seqUnlocked ? 25_000_000 : 5_000_000)
    );
  }, [
    effectiveMode,
    numCount,
    maxSeqCount,
    seqMeta.startIndex,
    numNth,
    maxSeqNth,
    numRangeStart,
    numRangeEnd,
    seqUnlocked,
  ]);

  const numDigits = parseInt(digitsStr, 10) || 0;
  const numSqrtK = parseInt(customSqrtK, 10) || 5;
  const maxDigits = constUnlocked
    ? constMeta.unlockedMaxDigits
    : constMeta.maxDefaultDigits;
  const constInputValid =
    numDigits >= 10 &&
    numDigits <= maxDigits &&
    (!constMeta.hasCustomParam || (numSqrtK >= 2 && numSqrtK <= 1_000_000_000));

  const handleStop = () => {
    engineRef.current?.terminate();
    setLoading(false);
    setProgress(0);
  };

  const handleRunSequence = async () => {
    if (!seqInputValid || loading) return;
    setError("");
    setLoading(true);
    setProgress(0);
    setTermPage(0);
    setTermFilter("");

    try {
      const res = await getEngine().runSequence(
        {
          sequenceId: seqId,
          mode: effectiveMode,
          count: numCount,
          nthIndex: Number.isNaN(numNth) ? seqMeta.startIndex : numNth,
          rangeStart: numRangeStart,
          rangeEnd: numRangeEnd,
        },
        setProgress
      );
      setSeqResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to compute sequence.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleRunConstant = async () => {
    if (!constInputValid || loading) return;
    setError("");
    setLoading(true);
    setProgress(0);

    try {
      const res = await getEngine().runConstant(
        {
          constantId: constId,
          digits: numDigits,
          customParam: constMeta.hasCustomParam ? numSqrtK : undefined,
        },
        setProgress
      );
      setConstResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to compute constant.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // Paginated & filtered terms for SequenceResult
  const matchingTerms = useMemo(() => {
    if (!seqResult || seqResult.mode === "nth") return [];
    if (!termFilter.trim()) {
      return seqResult.terms.map((val, idx) => ({
        idx: seqResult.startIndex + idx,
        val,
      }));
    }
    const q = termFilter.trim();
    const out: { idx: number; val: string }[] = [];
    for (let i = 0; i < seqResult.terms.length; i++) {
      if (seqResult.terms[i].includes(q)) {
        out.push({ idx: seqResult.startIndex + i, val: seqResult.terms[i] });
        if (out.length >= 2000) break;
      }
    }
    return out;
  }, [seqResult, termFilter]);

  const totalTermPages = Math.max(
    1,
    Math.ceil(matchingTerms.length / TERMS_PER_PAGE)
  );
  const safeTermPage = Math.min(termPage, totalTermPages - 1);
  const pagedTerms = matchingTerms.slice(
    safeTermPage * TERMS_PER_PAGE,
    (safeTermPage + 1) * TERMS_PER_PAGE
  );

  const handleCopyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // clipboard blocked
    }
  };

  const sequencePresets = useMemo(() => {
    const candidates =
      effectiveMode === "nth"
        ? [10, 100, 1000, 10000, 100000, 1000000]
        : [15, 50, 100, 1000, 10000, 100000, 1000000];
    const cap = effectiveMode === "nth" ? maxSeqNth : maxSeqCount;
    return candidates.filter((v) => v <= cap && v >= (effectiveMode === "nth" ? seqMeta.startIndex : 1));
  }, [effectiveMode, maxSeqNth, maxSeqCount, seqMeta.startIndex]);

  const constantPresets = useMemo(() => {
    return [100, 500, 1000, 5000, 10000, 25000, 50000].filter(
      (v) => v <= maxDigits
    );
  }, [maxDigits]);

  const activeSeqResult =
    seqResult && seqResult.sequenceId === seqId ? seqResult : null;
  const activeConstResult =
    constResult && constResult.constantId === constId ? constResult : null;

  return (
    <div className="space-y-5">
      {/* ── Top Studio Mode Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap rounded-2xl p-1 bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
          {[
            {
              id: "sequences" as StudioTab,
              label: "Famous Sequences (19)",
              icon: <Layers size={14} />,
            },
            {
              id: "constants" as StudioTab,
              label: "Irrational Constants (15)",
              icon: <Sparkles size={14} />,
            },
            {
              id: "lab" as StudioTab,
              label: "Number Theory Lab",
              icon: <FlaskConical size={14} />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setError("");
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <Zap size={13} className="text-cyan-600 dark:text-cyan-400" />
          <span>Multi-threaded Web Worker · Arbitrary-Precision BigInt</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: FAMOUS SEQUENCES                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "sequences" && (
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Sequence Catalog */}
          <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-3.5 space-y-3">
            <div className="flex flex-wrap gap-1">
              {SEQUENCE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSeqCategory(cat.id)}
                  className={`px-2 py-1 rounded-lg text-[10.5px] font-mono border transition-colors ${
                    seqCategory === cat.id
                      ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold"
                      : "border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="max-h-[300px] lg:max-h-[640px] overflow-y-auto space-y-1.5 pr-1">
              {visibleSequences.map((item) => {
                const active = item.id === seqId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSequence(item.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                      active
                        ? "border-cyan-500/55 bg-cyan-500/12 shadow-sm"
                        : "border-slate-200/75 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                      <span
                        className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 shrink-0"
                        style={{
                          borderLeft: `2px solid ${item.accentHex}`,
                        }}
                      >
                        {item.oeis}
                      </span>
                    </div>
                    <div className="text-[10.5px] font-mono text-slate-500 dark:text-slate-400 truncate mt-1">
                      {item.preview}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT: Sequence Workbench */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-5 min-w-0">
            {/* Formula & Facts Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-5 space-y-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {seqMeta.name}
                    </h2>
                    <a
                      href={`https://oeis.org/${seqMeta.oeis}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:border-cyan-500/50"
                    >
                      {seqMeta.oeis}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {seqMeta.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className="text-[10px] font-mono px-2.5 py-1 rounded-full border inline-block"
                    style={{
                      borderColor: `${seqMeta.accentHex}45`,
                      backgroundColor: `${seqMeta.accentHex}15`,
                      color: seqMeta.accentHex,
                    }}
                  >
                    {effectiveMode === "nth" && seqMeta.algorithmNth
                      ? seqMeta.algorithmNth
                      : seqMeta.algorithmFull}
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 mt-1">
                    Growth: {seqMeta.growthNote}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/90 dark:bg-black/30 text-slate-900 dark:text-slate-100 overflow-x-auto">
                <MathFormula tex={seqMeta.formulaTex} displayMode />
              </div>

              <ul className="grid sm:grid-cols-2 gap-1.5 text-[11.5px] text-slate-600 dark:text-slate-400">
                {seqMeta.facts.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span style={{ color: seqMeta.accentHex }}>•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compute Controls Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-5 space-y-4">
              {/* Mode selector */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSeqMode("full")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      effectiveMode === "full"
                        ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    First N Terms
                  </button>
                  {seqMeta.supportsNth && (
                    <button
                      type="button"
                      onClick={() => setSeqMode("nth")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        effectiveMode === "nth"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Exact Nth Term
                    </button>
                  )}
                  {seqMeta.supportsRange && (
                    <button
                      type="button"
                      onClick={() => setSeqMode("range")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        effectiveMode === "range"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      Range [A, B]
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSeqUnlocked((u) => !u)}
                  className={`flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-xl border transition-colors ${
                    seqUnlocked
                      ? "border-rose-500/45 bg-rose-500/12 text-rose-700 dark:text-rose-300"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {seqUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                  {seqUnlocked ? "Extended limits active" : "Unlock limits"}
                  {seqUnlocked && <InfinityIcon size={11} />}
                </button>
              </div>

              {/* Input Row */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                {effectiveMode === "full" && (
                  <input
                    type="number"
                    value={seqCountStr}
                    min={1}
                    max={maxSeqCount}
                    onChange={(e) => {
                      setError("");
                      setSeqCountStr(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleRunSequence()}
                    placeholder={`Terms count (1 – ${maxSeqCount.toLocaleString()})`}
                    aria-label="Number of terms"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-50/80 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:border-cyan-500/50"
                  />
                )}

                {effectiveMode === "nth" && (
                  <input
                    type="number"
                    value={seqNthStr}
                    min={seqMeta.startIndex}
                    max={maxSeqNth}
                    onChange={(e) => {
                      setError("");
                      setSeqNthStr(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleRunSequence()}
                    placeholder={`Index n (${seqMeta.startIndex} – ${maxSeqNth.toLocaleString()})`}
                    aria-label="Target index n"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-50/80 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:border-cyan-500/50"
                  />
                )}

                {effectiveMode === "range" && (
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={rangeStartStr}
                      min={seqMeta.startIndex}
                      onChange={(e) => {
                        setError("");
                        setRangeStartStr(e.target.value);
                      }}
                      placeholder="Start A"
                      aria-label="Range start"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-50/80 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                    <input
                      type="number"
                      value={rangeEndStr}
                      min={seqMeta.startIndex}
                      onChange={(e) => {
                        setError("");
                        setRangeEndStr(e.target.value);
                      }}
                      placeholder="End B"
                      aria-label="Range end"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-50/80 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                )}

                {loading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="px-5 py-2.5 rounded-xl border border-rose-500/45 bg-rose-500/15 text-rose-700 dark:text-rose-300 text-sm font-semibold hover:bg-rose-500/25 flex items-center justify-center gap-2 shrink-0"
                  >
                    <Square size={14} />
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRunSequence}
                    disabled={!seqInputValid}
                    className="px-5 py-2.5 rounded-xl border border-cyan-500/45 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 text-sm font-semibold hover:bg-cyan-500/25 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                  >
                    <Zap size={15} />
                    Generate
                  </button>
                )}
              </div>

              {/* Presets */}
              {effectiveMode !== "range" && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 mr-1">
                    PRESETS:
                  </span>
                  {sequencePresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        effectiveMode === "nth"
                          ? setSeqNthStr(String(p))
                          : setSeqCountStr(String(p))
                      }
                      className="px-2 py-0.5 rounded-md text-[10.5px] font-mono border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {p.toLocaleString()}
                    </button>
                  ))}
                  <span className="text-[10px] font-mono text-slate-400 ml-auto">
                    Max: {(effectiveMode === "nth" ? maxSeqNth : maxSeqCount).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Validation / Progress */}
              {!seqInputValid && (
                <p className="text-xs font-mono text-amber-600 dark:text-amber-400">
                  {effectiveMode === "range"
                    ? `Enter a valid range A ≥ ${seqMeta.startIndex}, B ≥ A (span ≤ ${(seqUnlocked ? 25_000_000 : 5_000_000).toLocaleString()}).`
                    : `Value must be between ${effectiveMode === "nth" ? seqMeta.startIndex : 1} and ${(effectiveMode === "nth" ? maxSeqNth : maxSeqCount).toLocaleString()}.`}
                </p>
              )}
              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {loading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin text-cyan-500" />
                      Computing in Web Worker…
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sequence Output Card */}
            {activeSeqResult && !loading && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeSeqResult.mode === "nth"
                        ? `Term #${activeSeqResult.nthIndex?.toLocaleString()}`
                        : `${activeSeqResult.totalCount.toLocaleString()} term${activeSeqResult.totalCount !== 1 ? "s" : ""} generated`}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {activeSeqResult.algorithmUsed} ·{" "}
                      <strong className="text-cyan-700 dark:text-cyan-300">
                        {activeSeqResult.elapsedMs} ms
                      </strong>
                      {activeSeqResult.mode === "nth" && activeSeqResult.nthValue
                        ? ` · ${activeSeqResult.nthValue.length.toLocaleString()} digits`
                        : activeSeqResult.elapsedMs > 0
                          ? ` · ${Math.round((activeSeqResult.totalCount / activeSeqResult.elapsedMs) * 1000).toLocaleString()} terms/sec`
                          : ""}
                    </div>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          "seq",
                          activeSeqResult.mode === "nth"
                            ? activeSeqResult.nthValue ?? ""
                            : activeSeqResult.terms.slice(0, 10_000).join(", ")
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                      {copiedKey === "seq" ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copiedKey === "seq" ? "Copied" : "Copy"}
                    </button>
                    {(["json", "csv", "txt"] as ExportFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() =>
                          exportSequenceData(activeSeqResult, seqMeta, fmt)
                        }
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border uppercase ${
                          fmt === "json"
                            ? "border-cyan-500/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20"
                            : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                        }`}
                      >
                        {fmt === "json" ? (
                          <Download size={12} />
                        ) : fmt === "csv" ? (
                          <FileSpreadsheet size={12} />
                        ) : (
                          <FileText size={12} />
                        )}
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {activeSeqResult.mode === "nth" ? (
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/80 dark:bg-black/30 font-mono text-xs sm:text-sm text-slate-900 dark:text-slate-100 break-all max-h-64 overflow-y-auto">
                    {activeSeqResult.nthValue && activeSeqResult.nthValue.length > 20_000
                      ? `${activeSeqResult.nthValue.slice(0, 10_000)}\n\n… [${(activeSeqResult.nthValue.length - 20_000).toLocaleString()} middle digits omitted in preview — use Copy or Export for full value] …\n\n${activeSeqResult.nthValue.slice(-10_000)}`
                      : activeSeqResult.nthValue}
                  </div>
                ) : (
                  <>
                    {/* Term Filter */}
                    <div className="relative">
                      <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        value={termFilter}
                        onChange={(e) => {
                          setTermFilter(e.target.value);
                          setTermPage(0);
                        }}
                        placeholder="Filter generated terms by digits…"
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/25 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/40"
                      />
                    </div>

                    {/* Paginated Term Grid */}
                    <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50/80 dark:bg-black/30 p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 font-mono text-xs">
                      {pagedTerms.map((item) => (
                        <div
                          key={item.idx}
                          className="px-2 py-1 rounded-md bg-white/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.05] flex items-baseline gap-1.5 truncate"
                          title={`[${item.idx}] ${item.val}`}
                        >
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {item.idx}:
                          </span>
                          <span className="text-slate-900 dark:text-slate-100 truncate">
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Bar */}
                    {totalTermPages > 1 && (
                      <div className="flex items-center justify-between text-xs font-mono">
                        <button
                          type="button"
                          onClick={() => setTermPage((p) => Math.max(0, p - 1))}
                          disabled={safeTermPage === 0}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-30 text-slate-700 dark:text-slate-200"
                        >
                          <ChevronLeft size={13} /> Prev
                        </button>
                        <span className="text-slate-500 dark:text-slate-400">
                          Page {safeTermPage + 1} / {totalTermPages.toLocaleString()} ({matchingTerms.length.toLocaleString()} matched)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setTermPage((p) => Math.min(totalTermPages - 1, p + 1))
                          }
                          disabled={safeTermPage >= totalTermPages - 1}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-30 text-slate-700 dark:text-slate-200"
                        >
                          Next <ChevronRight size={13} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Sequence Geometry & Analytics */}
            {activeSeqResult && !loading && (
              <SequenceVisualizer meta={seqMeta} result={activeSeqResult} />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: IRRATIONAL & TRANSCENDENTAL CONSTANTS                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "constants" && (
        <div className="grid lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: Constant Catalog */}
          <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-3.5 space-y-3">
            <div className="flex flex-wrap gap-1">
              {CONSTANT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setConstCategory(cat.id)}
                  className={`px-2 py-1 rounded-lg text-[10.5px] font-mono border transition-colors ${
                    constCategory === cat.id
                      ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold"
                      : "border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="max-h-[300px] lg:max-h-[640px] overflow-y-auto space-y-1.5 pr-1">
              {visibleConstants.map((item) => {
                const active = item.id === constId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectConstant(item.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                      active
                        ? "border-cyan-500/55 bg-cyan-500/12 shadow-sm"
                        : "border-slate-200/75 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/80 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center font-serif text-base font-bold border"
                      style={{
                        backgroundColor: `${item.accentHex}18`,
                        borderColor: `${item.accentHex}45`,
                        color: item.accentHex,
                      }}
                    >
                      {item.symbol}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.referencePrefix.slice(0, 18)}…
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT: Constant Workbench */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-5 min-w-0">
            {/* Formula & Facts Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-5 space-y-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center font-serif text-2xl font-bold border"
                    style={{
                      backgroundColor: `${constMeta.accentHex}18`,
                      borderColor: `${constMeta.accentHex}45`,
                      color: constMeta.accentHex,
                    }}
                  >
                    {constMeta.symbol}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {constMeta.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {constMeta.description}
                    </p>
                  </div>
                </div>

                <span
                  className="text-[10px] font-mono px-2.5 py-1 rounded-full border shrink-0"
                  style={{
                    borderColor: `${constMeta.accentHex}45`,
                    backgroundColor: `${constMeta.accentHex}15`,
                    color: constMeta.accentHex,
                  }}
                >
                  {constMeta.algorithm}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/[0.07] bg-slate-50/90 dark:bg-black/30 text-slate-900 dark:text-slate-100 overflow-x-auto">
                <MathFormula tex={constMeta.formulaTex} displayMode />
              </div>

              <ul className="grid sm:grid-cols-2 gap-1.5 text-[11.5px] text-slate-600 dark:text-slate-400">
                {constMeta.facts.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span style={{ color: constMeta.accentHex }}>•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Precision Controls */}
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-[#0b0f1c]/90 backdrop-blur-md p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Decimal Precision (digits after decimal point)
                </span>
                <button
                  type="button"
                  onClick={() => setConstUnlocked((u) => !u)}
                  className={`flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-xl border transition-colors ${
                    constUnlocked
                      ? "border-rose-500/45 bg-rose-500/12 text-rose-700 dark:text-rose-300"
                      : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {constUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
                  {constUnlocked ? "Extended digits unlocked" : "Unlock limits"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                {constMeta.hasCustomParam && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-50/80 dark:bg-black/30">
                    <span className="text-xs font-mono text-slate-500">k =</span>
                    <input
                      type="number"
                      value={customSqrtK}
                      min={2}
                      max={1_000_000_000}
                      onChange={(e) => setCustomSqrtK(e.target.value)}
                      aria-label="Square root radicand k"
                      className="w-24 bg-transparent font-mono text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}

                <input
                  type="number"
                  value={digitsStr}
                  min={10}
                  max={maxDigits}
                  onChange={(e) => {
                    setError("");
                    setDigitsStr(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleRunConstant()}
                  placeholder={`Decimal digits (10 – ${maxDigits.toLocaleString()})`}
                  aria-label="Decimal precision digits"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-50/80 dark:bg-black/30 text-slate-900 dark:text-white font-mono text-base focus:outline-none focus:border-cyan-500/50"
                />

                {loading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="px-5 py-2.5 rounded-xl border border-rose-500/45 bg-rose-500/15 text-rose-700 dark:text-rose-300 text-sm font-semibold hover:bg-rose-500/25 flex items-center justify-center gap-2 shrink-0"
                  >
                    <Square size={14} />
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleRunConstant}
                    disabled={!constInputValid}
                    className="px-5 py-2.5 rounded-xl border border-cyan-500/45 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 text-sm font-semibold hover:bg-cyan-500/25 disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
                  >
                    <Sparkles size={15} />
                    Compute Digits
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 mr-1">
                  PRESETS:
                </span>
                {constantPresets.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDigitsStr(String(p))}
                    className="px-2 py-0.5 rounded-md text-[10.5px] font-mono border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    {p.toLocaleString()}
                  </button>
                ))}
                <span className="text-[10px] font-mono text-slate-400 ml-auto">
                  Max: {maxDigits.toLocaleString()} digits
                </span>
              </div>

              {!constInputValid && (
                <p className="text-xs font-mono text-amber-600 dark:text-amber-400">
                  Digits must be between 10 and {maxDigits.toLocaleString()}.
                </p>
              )}
              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              {loading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <Loader2 size={13} className="animate-spin text-cyan-500" />
                      Computing arbitrary-precision digits…
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-400 transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {activeConstResult && !loading && (
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70 dark:border-white/[0.06]">
                  <span>
                    Computed <strong>{activeConstResult.totalDigits.toLocaleString()}</strong> digits in{" "}
                    <strong className="text-cyan-700 dark:text-cyan-300">
                      {activeConstResult.elapsedMs} ms
                    </strong>
                  </span>
                  {activeConstResult.elapsedMs > 0 && (
                    <span>
                      ~{Math.round((activeConstResult.totalDigits / activeConstResult.elapsedMs) * 1000).toLocaleString()} digits/sec
                    </span>
                  )}
                </div>
              )}
            </div>

            {activeConstResult && !loading && (
              <ConstantAnalyzer meta={constMeta} result={activeConstResult} />
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: NUMBER THEORY LAB                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === "lab" && <NumberTheoryLab />}
    </div>
  );
}
