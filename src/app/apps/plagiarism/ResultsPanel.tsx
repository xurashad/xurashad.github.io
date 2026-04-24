"use client";

import { useState } from "react";
import { SatelliteDish, Printer, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import type { ScanReport, MatchGroup } from "./lib/scanner";
import { ProofModal } from "./ProofModal";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ResultsPanelProps {
  phase: "idle" | "scanning" | "done" | "cancelled";
  progress: number;
  progressMessage: string;
  report: ScanReport | null;
}

interface ModalState {
  matchGroup: MatchGroup;
  sourceIndex: number;
}

/* ─── Donut Chart ─────────────────────────────────────────────────────────── */
function DonutChart({ percent }: { percent: number }) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color =
    percent > 40
      ? "var(--color-crimson, #dc143c)"
      : percent > 10
      ? "#f59e0b"
      : "var(--color-olive, #6b8f27)";

  return (
    <svg width="140" height="140" viewBox="0 0 120 120" aria-label={`${percent}% plagiarised`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

/* ─── Source badge ────────────────────────────────────────────────────────── */
function SourceBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    Wikipedia: "bg-quantum/10 text-quantum border-quantum/20",
    "Academic Journal": "bg-olive/10 text-olive-400 border-olive/20",
    "Web Article": "bg-white/6 text-foreground/40 border-white/10",
  };
  return (
    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${map[type] ?? map["Web Article"]}`}>
      {type}
    </span>
  );
}

/* ─── Match group list item ───────────────────────────────────────────────── */
function MatchItem({
  match,
  index,
  onOpenProof,
}: {
  match: MatchGroup;
  index: number;
  onOpenProof: (sourceIdx: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li
      id={`ref-group-${index}`}
      className={`rounded-xl border p-3 space-y-2 transition-colors ${
        match.isExact
          ? "border-crimson/25 bg-crimson/5"
          : "border-olive/25 bg-olive/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-foreground/65 leading-relaxed flex-1">
          &ldquo;{match.sentence}&rdquo;
        </p>
        <span
          className={`shrink-0 text-[9px] font-mono px-2 py-0.5 rounded-full border ${
            match.isExact
              ? "bg-crimson/15 text-crimson border-crimson/30"
              : "bg-olive/15 text-olive-400 border-olive/30"
          }`}
        >
          {match.isExact ? "Exact Copy" : "Paraphrased"}
        </span>
      </div>

      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center gap-1 text-[11px] text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {match.sources.length} source{match.sources.length !== 1 ? "s" : ""}
      </button>

      {expanded && (
        <ul className="space-y-1.5 pl-2">
          {match.sources.map((src, si) => (
            <li
              key={si}
              onClick={() => onOpenProof(si)}
              className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-white/5 transition-colors group"
              title="Click to view proof comparison"
            >
              <SourceBadge type={src.sourceType} />
              <span className="text-[11px] text-foreground/55 group-hover:text-quantum transition-colors flex-1 truncate">
                {src.title}
              </span>
              <span className="text-[10px] font-mono text-foreground/30">
                {Math.round(src.similarity * 100)}%
              </span>
              <ExternalLink size={10} className="text-foreground/25 group-hover:text-quantum" />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export function ResultsPanel({
  phase,
  progress,
  progressMessage,
  report,
}: ResultsPanelProps) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);

  /* ── Idle state ── */
  if (phase === "idle") {
    return (
      <div className="glass-card flex flex-col items-center justify-center h-full min-h-64 gap-4 text-center p-8">
        <div className="w-20 h-20 rounded-full bg-quantum/10 border border-quantum/20 flex items-center justify-center animate-glow-pulse">
          <SatelliteDish size={30} className="text-quantum" />
        </div>
        <h3 className="font-semibold text-foreground/60">Ready to Scan</h3>
        <p className="text-xs text-foreground/35 max-w-xs">
          Queries Wikipedia, OpenAlex academic journals, and the global web via
          SearXNG. All checks run client-side in your browser.
        </p>
      </div>
    );
  }

  /* ── Scanning state ── */
  if (phase === "scanning") {
    return (
      <div className="glass-card flex flex-col items-center justify-center h-full min-h-64 gap-5 p-8">
        {/* Radar spinner */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-quantum/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-quantum animate-spin" />
          <div className="absolute inset-2 rounded-full border border-quantum/10 animate-ping" />
        </div>
        <h3 className="font-semibold text-foreground/60">Crawling Databases…</h3>
        <div className="w-full max-w-sm space-y-2">
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-quantum to-quantum/50 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs font-mono text-foreground/30 text-center">
            {progressMessage || `${progress}% complete`}
          </p>
        </div>
      </div>
    );
  }

  /* ── Cancelled state ── */
  if (phase === "cancelled") {
    return (
      <div className="glass-card flex flex-col items-center justify-center h-full min-h-64 gap-3 p-8 text-center">
        <StopCircleIcon />
        <h3 className="font-semibold text-foreground/60">Scan Cancelled</h3>
        <p className="text-xs text-foreground/35">Submit the form again to start a new scan.</p>
      </div>
    );
  }

  /* ── Results state ── */
  if (!report) return null;

  const plagPct = report.plagiarizedPercent;
  const uniqPct = 100 - plagPct;

  return (
    <>
      <div className="glass-card flex flex-col gap-5 p-5 h-full">
        {/* Report header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground/70">Scan Report</span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-foreground/50 hover:bg-white/8 hover:text-foreground/70 transition-all"
          >
            <Printer size={13} /> Export PDF
          </button>
        </div>

        {/* Score overview */}
        <div className="flex items-center gap-6">
          <DonutChart percent={plagPct} />
          <div className="flex flex-col gap-3">
            <div>
              <div
                className={`text-3xl font-bold font-mono ${
                  plagPct > 40
                    ? "text-crimson"
                    : plagPct > 10
                    ? "text-amber-400"
                    : "text-olive-400"
                }`}
              >
                {plagPct}%
              </div>
              <div className="text-xs text-foreground/40 font-mono">Plagiarised</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-foreground/60">{uniqPct}%</div>
              <div className="text-xs text-foreground/40 font-mono">Original</div>
            </div>
          </div>
        </div>

        {/* Highlighted document */}
        <div className="p-4 rounded-xl bg-black/20 border border-white/8 text-sm leading-relaxed text-foreground/70">
          {report.sentences.map((s, i) => {
            if (!s.isPlagiarized) {
              return <span key={i}>{s.text} </span>;
            }
            const groupIdx = s.matchGroupIndex ?? 0;
            const isHovered = hoveredGroup === groupIdx;
            return (
              <span
                key={i}
                className={`cursor-pointer rounded px-0.5 transition-colors ${
                  s.isExact
                    ? `bg-crimson/20 text-crimson ${isHovered ? "ring-1 ring-crimson/50" : ""}`
                    : `bg-olive/20 text-olive-400 ${isHovered ? "ring-1 ring-olive/50" : ""}`
                }`}
                title={`Found in ${report.matches[groupIdx]?.sources.length ?? 0} source(s)`}
                onMouseEnter={() => setHoveredGroup(groupIdx)}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => {
                  const el = document.getElementById(`ref-group-${groupIdx}`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                {s.text}{" "}
              </span>
            );
          })}
        </div>

        {/* Source list */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono text-foreground/35 uppercase tracking-widest">
            All Matches Found
          </h4>
          {report.matches.length === 0 ? (
            <p className="text-xs text-olive-400 font-mono">
              ✓ 100% original — no matches found on the internet.
            </p>
          ) : (
            <ul className="space-y-2">
              {report.matches.map((match, idx) => (
                <MatchItem
                  key={idx}
                  match={match}
                  index={idx}
                  onOpenProof={(srcIdx) =>
                    setModal({ matchGroup: match, sourceIndex: srcIdx })
                  }
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Proof modal */}
      {modal && (
        <ProofModal
          matchGroup={modal.matchGroup}
          sourceIndex={modal.sourceIndex}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

function StopCircleIcon() {
  return (
    <div className="w-16 h-16 rounded-full bg-crimson/10 border border-crimson/20 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-crimson" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="10" />
        <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none" />
      </svg>
    </div>
  );
}
