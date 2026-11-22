"use client";

import { useEffect, useRef } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloud,
  ExternalLink,
  FileCode2,
  FileDown,
  Loader2,
  Printer,
  RefreshCw,
  Terminal,
  WifiOff,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { TEXLIVE_IFRAME_NAME } from "../lib/cloudCompiler";
import type {
  CloudCompileState,
  CompileResult,
  EditorSettings,
  PaperTheme,
  PreviewEngine,
} from "../lib/types";

export interface PreviewPaneProps {
  result: CompileResult;
  cloudState: CloudCompileState;
  settings: EditorSettings;
  onUpdateSettings: (patch: Partial<EditorSettings>) => void;
  onSwitchPreviewEngine: (engine: PreviewEngine) => void;
  onRetryCloud: () => void;
  onCloudFrameLoad: () => void;
  isPdfStale?: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  syncTarget: { file: string; line: number; token: number } | null;
  onJumpToSource: (file: string, line: number) => void;
  onDownloadPdf: () => void;
  onPrintInstant: () => void;
  onOpenPdfTab: () => void;
  onOpenTeXLog: () => void;
  onExportHtml: () => void;
  onOpenTeXLiveNet: () => void;
  logsOpen: boolean;
  onToggleLogs: () => void;
  logsTab: "problems" | "log" | "stats";
  onLogsTabChange: (tab: "problems" | "log" | "stats") => void;
  isDownloadingPdf: boolean;
}

export function PreviewPane(props: PreviewPaneProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const paperContentRef = useRef<HTMLDivElement>(null);

  const isRealPdf = props.settings.previewEngine === "real-pdf";
  const activeDiagnostics =
    isRealPdf &&
    (props.cloudState.status === "error" || props.cloudState.diagnostics.length > 0)
      ? props.cloudState.diagnostics
      : props.result.diagnostics;

  const activeLogLines =
    isRealPdf && props.cloudState.logLines.length > 0
      ? [...props.cloudState.logLines, "--- Local Outline & Math Pass ---", ...props.result.logLines]
      : props.result.logLines;

  const errorCount = activeDiagnostics.filter((d) => d.severity === "error").length;
  const warningCount = activeDiagnostics.filter((d) => d.severity === "warning").length;

  useEffect(() => {
    if (!props.syncTarget || !paperContentRef.current || isRealPdf) return;
    const nodes = Array.from(
      paperContentRef.current.querySelectorAll<HTMLElement>("[data-source-file][data-source-line]"),
    );
    let bestEl: HTMLElement | null = null;
    let bestDist = Infinity;

    for (const el of nodes) {
      const f = el.dataset.sourceFile;
      const ln = parseInt(el.dataset.sourceLine || "0", 10);
      if (f === props.syncTarget.file && ln > 0) {
        const dist = Math.abs(ln - props.syncTarget.line);
        if (dist < bestDist) {
          bestDist = dist;
          bestEl = el;
        }
      }
    }

    if (bestEl) {
      bestEl.scrollIntoView({ behavior: "smooth", block: "center" });
      bestEl.classList.remove("wt-synctex-flash");
      void bestEl.offsetWidth;
      bestEl.classList.add("wt-synctex-flash");
    }
  }, [props.syncTarget, isRealPdf]);

  const handlePaperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href") || "";
    if (href.startsWith("#") && paperContentRef.current) {
      e.preventDefault();
      const targetId = href.slice(1);
      const targetEl = paperContentRef.current.querySelector<HTMLElement>(
        `[id="${CSS.escape(targetId)}"]`,
      );
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
        targetEl.classList.remove("wt-synctex-flash");
        void targetEl.offsetWidth;
        targetEl.classList.add("wt-synctex-flash");
      }
    }
  };

  const handlePaperDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const block = (e.target as HTMLElement).closest<HTMLElement>("[data-source-file][data-source-line]");
    if (!block) return;
    const file = block.dataset.sourceFile;
    const line = parseInt(block.dataset.sourceLine || "1", 10);
    if (file && Number.isFinite(line)) {
      props.onJumpToSource(file, line);
    }
  };

  const scrollSlide = (dir: -1 | 1) => {
    if (!paperContentRef.current) return;
    const slides = Array.from(paperContentRef.current.querySelectorAll<HTMLElement>(".wt-beamer-slide"));
    if (slides.length === 0 || !scrollContainerRef.current) return;
    const viewMid = scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight / 2;
    let curIdx = 0;
    let bestD = Infinity;
    slides.forEach((s, idx) => {
      const d = Math.abs(s.offsetTop + s.offsetHeight / 2 - viewMid);
      if (d < bestD) {
        bestD = d;
        curIdx = idx;
      }
    });
    const next = Math.max(0, Math.min(slides.length - 1, curIdx + dir));
    slides[next].scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const showInstantFallback =
    !isRealPdf || props.cloudState.status === "offline";

  return (
    <div className="h-full flex flex-col min-w-0 bg-[#0b0d1d]">
      {/* Preview Toolbar */}
      <div className="px-2.5 py-1.5 border-b border-slate-700/50 bg-[#0d1024]/90 flex items-center gap-1.5 flex-wrap text-xs">
        {/* Preview Engine Mode Toggle */}
        <div className="flex items-center rounded-lg bg-white/[0.04] border border-slate-600/35 p-0.5">
          <button
            type="button"
            onClick={() => props.onSwitchPreviewEngine("real-pdf")}
            title="Show authentic compiled PDF from TeX Live 2026 (1:1 identical to Download PDF)"
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all ${
              isRealPdf
                ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40"
                : "text-slate-400 hover:text-white border border-transparent"
            }`}
          >
            <Cloud size={11} />
            <span>Real PDF</span>
          </button>
          <button
            type="button"
            onClick={() => props.onSwitchPreviewEngine("instant")}
            title="Offline instant KaTeX + TikZ preview with SyncTeX & paper themes"
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all ${
              !isRealPdf
                ? "bg-indigo-500/30 text-white border border-indigo-400/40"
                : "text-slate-400 hover:text-white border border-transparent"
            }`}
          >
            <span>Instant</span>
          </button>
        </div>

        {/* Real PDF Status Pill */}
        {isRealPdf && (
          <div className="flex items-center gap-1.5 text-[10.5px] font-mono">
            {props.cloudState.status === "compiling" && (
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" />
                Compiling {props.settings.cloudEngine}…
              </span>
            )}
            {props.cloudState.status === "success" && (
              props.isPdfStale ? (
                <button
                  type="button"
                  onClick={props.onRetryCloud}
                  title="Document edited since last PDF build — click to recompile Real PDF"
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/35 cursor-pointer transition-colors"
                >
                  <RefreshCw size={10} />
                  <span>Edited · Update PDF</span>
                </button>
              ) : (
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
                  TeX Live 2026 · {props.settings.cloudEngine} ·{" "}
                  {props.cloudState.compileTimeMs} ms
                </span>
              )
            )}
          </div>
        )}

        {/* Instant Preview Controls */}
        {showInstantFallback && (
          <>
            <div className="flex items-center gap-0.5 rounded-lg bg-white/[0.04] border border-slate-600/30 p-0.5">
              <button
                type="button"
                onClick={() => props.onZoomChange(Math.max(50, props.zoom - 10))}
                title="Zoom Out"
                className="p-1 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                <ZoomOut size={13} />
              </button>
              <span className="px-1.5 font-mono text-[11px] text-slate-200 min-w-[40px] text-center">
                {props.zoom}%
              </span>
              <button
                type="button"
                onClick={() => props.onZoomChange(Math.min(180, props.zoom + 10))}
                title="Zoom In"
                className="p-1 rounded hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                <ZoomIn size={13} />
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-0.5 rounded-lg bg-white/[0.04] border border-slate-600/30 p-0.5">
              {(["classic", "cream", "sepia", "night"] as PaperTheme[]).map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => props.onUpdateSettings({ paperTheme: theme })}
                  className={`px-2 py-0.5 rounded text-[10.5px] capitalize cursor-pointer transition-colors ${
                    props.settings.paperTheme === theme
                      ? "bg-indigo-500/30 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>

            {props.result.isBeamer && (
              <div className="flex items-center gap-1 rounded-lg bg-violet-500/15 border border-violet-400/30 px-1.5 py-0.5">
                <button type="button" onClick={() => scrollSlide(-1)} className="p-0.5 text-violet-200 hover:text-white cursor-pointer">
                  <ChevronLeft size={13} />
                </button>
                <span className="text-[10px] font-mono text-violet-200">
                  {props.result.pageCount} slides
                </span>
                <button type="button" onClick={() => scrollSlide(1)} className="p-0.5 text-violet-200 hover:text-white cursor-pointer">
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </>
        )}

        <div className="flex-1" />

        {/* Download Real PDF (exact 1:1 match with previewed PDF) */}
        <button
          type="button"
          onClick={props.onDownloadPdf}
          disabled={props.isDownloadingPdf}
          title="Download exact compiled PDF (.pdf)"
          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-100 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-60"
        >
          {props.isDownloadingPdf ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <FileDown size={13} />
          )}
          <span>Download PDF</span>
        </button>

        {isRealPdf && props.cloudState.status !== "offline" && (
          <>
            <div
              className="hidden sm:flex items-center rounded-lg bg-white/[0.04] border border-slate-600/35 p-0.5"
              title="Choose PDF viewer rendering mode"
            >
              {(["pdfjs", "native"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => props.onUpdateSettings({ pdfViewerMode: mode })}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-mono cursor-pointer transition-colors ${
                    props.settings.pdfViewerMode === mode
                      ? "bg-indigo-500/30 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode === "pdfjs" ? "PDF.js" : "Native"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={props.onOpenTeXLog}
              title="Open Raw TeX Live 2026 Build Log (.log)"
              className="hidden sm:flex px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-slate-600/30 text-slate-200 text-[11px] items-center gap-1 cursor-pointer"
            >
              <Terminal size={12} className="text-cyan-300" />
              <span>Log</span>
            </button>

            <button
              type="button"
              onClick={props.onOpenPdfTab}
              title="Open Compiled Raw PDF in New Browser Tab"
              className="hidden sm:flex px-2 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-slate-600/30 text-slate-200 text-[11px] items-center gap-1 cursor-pointer"
            >
              <ExternalLink size={12} />
            </button>
          </>
        )}

        {!isRealPdf && (
          <button
            type="button"
            onClick={props.onPrintInstant}
            title="Print Instant Preview"
            className="hidden sm:flex px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-slate-600/30 text-slate-300 text-[11px] font-medium items-center gap-1 cursor-pointer"
          >
            <Printer size={12} />
            <span>Print</span>
          </button>
        )}

        <button
          type="button"
          onClick={props.onExportHtml}
          title="Export Standalone HTML"
          className="hidden md:flex px-2 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-slate-600/30 text-slate-300 text-[11px] font-medium items-center gap-1 cursor-pointer transition-colors"
        >
          <FileCode2 size={12} />
          <span>HTML</span>
        </button>
      </div>

      {/* Cloud Status Banners (Error / Offline) */}
      {isRealPdf && props.cloudState.status === "error" && (() => {
        const firstErr = props.cloudState.diagnostics.find(
          (d) => d.severity === "error",
        );
        return (
          <div className="px-3 py-2 bg-rose-950/60 border-b border-rose-500/35 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-100">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
              {firstErr ? (
                <button
                  type="button"
                  onClick={() => props.onJumpToSource(firstErr.file, firstErr.line)}
                  title={`Jump to ${firstErr.file}:${firstErr.line}`}
                  className="truncate font-mono text-[11px] text-left hover:underline text-rose-100 cursor-pointer"
                >
                  {firstErr.file}:{firstErr.line} — {firstErr.message}
                </button>
              ) : (
                <span className="truncate font-mono text-[11px]">
                  {props.cloudState.errorMessage || "TeX Live compilation failed."}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  props.onLogsTabChange("problems");
                  if (!props.logsOpen) props.onToggleLogs();
                }}
                className="px-2 py-0.5 rounded bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400/40 text-[11px] cursor-pointer"
              >
                View Errors
              </button>
              <button
                type="button"
                onClick={() => props.onSwitchPreviewEngine("instant")}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] cursor-pointer"
              >
                Instant Preview
              </button>
            </div>
          </div>
        );
      })()}

      {isRealPdf && props.cloudState.status === "offline" && (
        <div className="px-3 py-2 bg-amber-950/50 border-b border-amber-500/35 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-100">
          <div className="flex items-center gap-2">
            <WifiOff size={14} className="text-amber-300 shrink-0" />
            <span className="text-[11px]">
              {props.cloudState.errorMessage ||
                "Real PDF cloud compiler unavailable — showing Instant Offline Preview."}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={props.onRetryCloud}
              className="px-2 py-0.5 rounded bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/40 text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={10} /> Retry
            </button>
            <button
              type="button"
              onClick={props.onOpenTeXLiveNet}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[11px] cursor-pointer"
            >
              TeXLive.net
            </button>
          </div>
        </div>
      )}

      {/* Viewport Area */}
      {isRealPdf && props.cloudState.status !== "offline" ? (
        <div className="flex-1 min-h-0 relative bg-[#323639]">
          <iframe
            name={TEXLIVE_IFRAME_NAME}
            title="Compiled LaTeX PDF Preview (TeX Live 2026)"
            onLoad={props.onCloudFrameLoad}
            className="wt-pdf-frame"
          />
          {!props.cloudState.frameReady && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0b0d1d] text-slate-300 p-6">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <div className="text-xs font-mono uppercase tracking-wider text-cyan-300 text-center">
                Compiling real PDF via TeX Live 2026 ({props.settings.cloudEngine})…
              </div>
              <button
                type="button"
                onClick={() => props.onSwitchPreviewEngine("instant")}
                className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
              >
                Switch to Instant Offline Preview
              </button>
            </div>
          )}
          {props.cloudState.frameReady && props.cloudState.status === "compiling" && (
            <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full bg-[#0a0c1e]/90 border border-indigo-400/40 text-[11px] font-mono text-indigo-200 flex items-center gap-1.5 shadow-lg">
              <Loader2 size={12} className="animate-spin text-cyan-300" />
              Updating PDF…
            </div>
          )}
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="wt-preview-stage flex-1 overflow-auto wt-scroll p-4 sm:p-6"
        >
          <div
            style={{
              transform: `scale(${props.zoom / 100})`,
              transformOrigin: "top center",
              width: props.zoom > 100 ? `${100 / (props.zoom / 100)}%` : "100%",
            }}
            className="mx-auto transition-transform duration-150"
          >
            {props.result.isBeamer ? (
              <div
                ref={paperContentRef}
                onClick={handlePaperClick}
                onDoubleClick={handlePaperDoubleClick}
                className={`wt-paper wt-paper-${props.settings.paperTheme}`}
                title="Double-click any element to jump to its source line (SyncTeX)"
                dangerouslySetInnerHTML={{ __html: props.result.html }}
              />
            ) : (
              <article
                ref={paperContentRef}
                onClick={handlePaperClick}
                onDoubleClick={handlePaperDoubleClick}
                title="Double-click any paragraph, equation, or figure to jump to its source line (SyncTeX)"
                className={`wt-paper wt-paper-${props.settings.paperTheme} wt-paper-sheet ${
                  props.settings.paperLayout === "continuous" ? "wt-paper-continuous" : ""
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: props.result.html }} />
                <div className="mt-10 pt-4 text-center text-xs opacity-50 font-serif">
                  — {props.result.pageCount}{" "}
                  {props.result.pageCount === 1 ? "page" : "pages"} estimated · Double-click text to sync source —
                </div>
              </article>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Bottom Diagnostics / Build Log / Stats Drawer */}
      {props.logsOpen && (
        <div className="h-48 border-t border-slate-700/60 bg-[#070816] flex flex-col">
          <div className="px-3 py-1.5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {(
                [
                  {
                    id: "problems",
                    label: `Problems (${activeDiagnostics.length})`,
                    icon: AlertTriangle,
                  },
                  { id: "log", label: "Build Log", icon: Terminal },
                  { id: "stats", label: "Stats", icon: BarChart3 },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => props.onLogsTabChange(id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono flex items-center gap-1.5 cursor-pointer ${
                    props.logsTab === id
                      ? "bg-indigo-500/25 text-white border border-indigo-400/35"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={props.onToggleLogs}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto wt-scroll p-2.5 text-xs font-mono">
            {props.logsTab === "problems" &&
              (activeDiagnostics.length === 0 ? (
                <div className="text-emerald-400/90 py-4 text-center">
                  No errors or warnings detected — clean build!
                </div>
              ) : (
                <div className="space-y-1.5">
                  {activeDiagnostics.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => props.onJumpToSource(d.file, d.line)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-slate-800 flex items-start gap-2 cursor-pointer"
                    >
                      {d.severity === "error" ? (
                        <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={14} className="text-amber-300 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-slate-200">{d.message}</div>
                        <div className="text-[10.5px] text-cyan-300/80 mt-0.5">
                          {d.file}:{d.line}
                          {d.context ? ` · ${d.context}` : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}

            {props.logsTab === "log" && (
              <div className="space-y-0.5 text-[11px] text-slate-300/90">
                {activeLogLines.map((ln, idx) => (
                  <div
                    key={idx}
                    className={
                      ln.startsWith("[ERROR]") || ln.includes(": error:") || ln.startsWith("!")
                        ? "text-rose-400"
                        : ln.startsWith("[WARNING]") || ln.includes("Warning:")
                          ? "text-amber-300"
                          : ln.startsWith("Output generated") || ln.startsWith("TeX Live 2026")
                            ? "text-emerald-300 font-semibold pt-0.5"
                            : ""
                    }
                  >
                    {ln}
                  </div>
                ))}
              </div>
            )}

            {props.logsTab === "stats" && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: "Words", val: props.result.stats.wordCount },
                  { label: "Characters", val: props.result.stats.charCount },
                  { label: "Math Exprs", val: props.result.stats.mathCount },
                  { label: "Equations", val: props.result.stats.equationCount },
                  { label: "Figures", val: props.result.stats.figureCount },
                  { label: "Tables", val: props.result.stats.tableCount },
                  { label: "Citations", val: props.result.stats.citationCount },
                  { label: "Footnotes", val: props.result.stats.footnoteCount },
                  {
                    label: props.result.isBeamer ? "Slides" : "Est. Pages",
                    val: props.result.stats.estimatedPages,
                  },
                  {
                    label: isRealPdf ? "TeX Live Time" : "Instant Time",
                    val: `${isRealPdf && props.cloudState.compileTimeMs > 0 ? props.cloudState.compileTimeMs : props.result.stats.compileTimeMs} ms`,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="p-2 rounded-lg bg-white/[0.03] border border-slate-800"
                  >
                    <div className="text-[10px] text-slate-400 uppercase">{s.label}</div>
                    <div className="text-sm font-semibold text-cyan-200 mt-0.5">
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Status Bar */}
      <footer className="px-3 py-1 border-t border-slate-800/90 bg-[#060714] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={props.onToggleLogs}
            className="flex items-center gap-1.5 hover:text-white cursor-pointer"
          >
            <Activity
              size={12}
              className={
                errorCount > 0
                  ? "text-rose-400"
                  : isRealPdf && props.cloudState.status === "compiling"
                    ? "text-cyan-400 animate-pulse"
                    : "text-emerald-400"
              }
            />
            <span>
              {errorCount > 0
                ? `${errorCount} error${errorCount > 1 ? "s" : ""}`
                : warningCount > 0
                  ? `${warningCount} warning${warningCount > 1 ? "s" : ""}`
                  : isRealPdf
                    ? props.cloudState.status === "compiling"
                      ? "Compiling PDF…"
                      : "PDF Ready"
                    : "Compiled"}
            </span>
            <span className="text-slate-500">
              (
              {isRealPdf && props.cloudState.compileTimeMs > 0
                ? props.cloudState.compileTimeMs
                : props.result.stats.compileTimeMs}{" "}
              ms)
            </span>
            {props.logsOpen ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          </button>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">
            {props.result.documentClass}
            {props.result.isTwoColumn ? " (2-col)" : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span>{props.result.stats.wordCount} words</span>
          <span className="hidden sm:inline">
            {props.result.stats.estimatedPages}{" "}
            {props.result.isBeamer
              ? "slides"
              : props.result.stats.estimatedPages === 1
                ? "page"
                : "pages"}
          </span>
        </div>
      </footer>
    </div>
  );
}
