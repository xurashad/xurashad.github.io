"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  Hash,
  Link2,
  Maximize2,
  Minimize2,
  NotebookPen,
  RefreshCw,
  Tag,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type {
  PreviewTheme,
  PreviewWidth,
  RenderResult,
} from "../lib/types";

export interface PreviewPaneProps {
  result: RenderResult;
  slideMode: boolean;
  previewTheme: PreviewTheme;
  onChangePreviewTheme: (theme: PreviewTheme) => void;
  previewWidth: PreviewWidth;
  onChangePreviewWidth: (width: PreviewWidth) => void;
  zoom: number;
  onChangeZoom: (zoom: number) => void;
  scrollSync: boolean;
  onToggleScrollSync: () => void;
  autoNumberHeadings: boolean;
  onToggleAutoNumber: () => void;
  onToggleTaskLine: (line: number) => void;
  onOpenWikiTarget: (target: string) => void;
  onDoubleClickLine: (line: number) => void;
  onOpenFrontmatterModal: () => void;
  onCopyRichHtml: () => void;
  externalScrollRatio: number | null;
  onPreviewScrollRatio: (ratio: number) => void;
}

const PREVIEW_THEMES: Array<{ id: PreviewTheme; label: string }> = [
  { id: "celestial", label: "Celestial Dark" },
  { id: "github-dark", label: "GitHub Dark" },
  { id: "github-light", label: "GitHub Light" },
  { id: "academic", label: "Academic Paper" },
  { id: "sepia", label: "Warm Sepia" },
  { id: "obsidian", label: "Obsidian Violet" },
];

const WIDTH_OPTIONS: Array<{ id: PreviewWidth; label: string; maxWidth: string }> = [
  { id: "document", label: "Doc", maxWidth: "780px" },
  { id: "wide", label: "Wide", maxWidth: "1020px" },
  { id: "full", label: "Full", maxWidth: "100%" },
  { id: "mobile", label: "Mobile", maxWidth: "410px" },
];

export function PreviewPane(props: PreviewPaneProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const ignoringScrollRef = useRef(false);

  const [fmCollapsed, setFmCollapsed] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const [notesOpen, setNotesOpen] = useState(true);
  const [slideFullscreen, setSlideFullscreen] = useState(false);

  const totalSlides = Math.max(1, props.result.slides.length);
  const clampedSlideIdx = Math.min(slideIdx, totalSlides - 1);
  const currentSlide = props.result.slides[clampedSlideIdx] ?? props.result.slides[0];

  // Sync preview scroll from editor
  useEffect(() => {
    if (!props.scrollSync || props.slideMode || props.externalScrollRatio === null) {
      return;
    }
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    ignoringScrollRef.current = true;
    el.scrollTop = props.externalScrollRatio * maxScroll;
    const id = requestAnimationFrame(() => {
      ignoringScrollRef.current = false;
    });
    return () => cancelAnimationFrame(id);
  }, [props.externalScrollRatio, props.scrollSync, props.slideMode]);

  // Keyboard navigation in Slide Mode
  useEffect(() => {
    if (!props.slideMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === "TEXTAREA" ||
          active.tagName === "INPUT" ||
          active.tagName === "SELECT")
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setSlideIdx((i) => Math.min(totalSlides - 1, i + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setSlideIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Escape" && slideFullscreen) {
        setSlideFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [props.slideMode, totalSlides, slideFullscreen]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Copy code button
    const copyBtn = target.closest<HTMLElement>("[data-copy-code]");
    if (copyBtn) {
      const code = copyBtn.getAttribute("data-copy-code") ?? "";
      navigator.clipboard?.writeText(code).catch(() => {});
      const prev = copyBtn.textContent;
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = prev || "Copy";
      }, 1300);
      return;
    }

    // 2. Wiki link navigation
    const wikiLink = target.closest<HTMLElement>("[data-wiki-target]");
    if (wikiLink) {
      e.preventDefault();
      const wikiTarget = wikiLink.getAttribute("data-wiki-target");
      if (wikiTarget) props.onOpenWikiTarget(wikiTarget);
      return;
    }

    // 3. Internal anchor navigation (#slug or #fn-*)
    const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
    if (anchor) {
      const id = decodeURIComponent(anchor.getAttribute("href")?.slice(1) ?? "");
      if (id && scrollContainerRef.current) {
        const dest = scrollContainerRef.current.querySelector<HTMLElement>(
          `#${CSS.escape(id)}`,
        );
        if (dest) {
          e.preventDefault();
          dest.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  const handleContainerChange = (e: React.ChangeEvent<HTMLDivElement>) => {
    const target = e.target as HTMLInputElement;
    if (target.classList.contains("md-task-checkbox")) {
      const lineStr = target.getAttribute("data-task-line");
      if (lineStr) {
        const line = Number.parseInt(lineStr, 10);
        if (!Number.isNaN(line)) props.onToggleTaskLine(line);
      }
    }
  };

  const handleContainerDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const block = target.closest<HTMLElement>("[data-line]");
    if (!block) return;
    const lineStr = block.getAttribute("data-line");
    if (!lineStr) return;
    const line = Number.parseInt(lineStr, 10);
    if (!Number.isNaN(line)) props.onDoubleClickLine(line);
  };

  const widthCfg =
    WIDTH_OPTIONS.find((w) => w.id === props.previewWidth) ?? WIDTH_OPTIONS[0];

  const fm = props.result.frontmatter;
  const fmEntries = fm ? Object.entries(fm.fields) : [];

  return (
    <section
      className={`h-full flex flex-col overflow-hidden md-preview-stage ${
        slideFullscreen ? "fixed inset-0 z-[9200]" : ""
      }`}
    >
      {/* Top Preview Toolbar */}
      <div className="px-3 py-1.5 border-b border-slate-700/60 bg-[#0b0d1e]/90 flex items-center justify-between gap-2 flex-wrap text-xs select-none">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={props.previewTheme}
            onChange={(e) => props.onChangePreviewTheme(e.target.value as PreviewTheme)}
            aria-label="Preview document theme"
            className="px-2 py-1 rounded-lg bg-black/45 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            {PREVIEW_THEMES.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#0b0d1f]">
                {t.label}
              </option>
            ))}
          </select>

          {!props.slideMode && (
            <div className="flex items-center rounded-lg border border-slate-700/70 bg-black/35 p-0.5">
              {WIDTH_OPTIONS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => props.onChangePreviewWidth(w.id)}
                  className={`px-2 py-0.5 rounded-md text-[11px] cursor-pointer transition-colors ${
                    props.previewWidth === w.id
                      ? "bg-violet-500/25 text-cyan-200"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={props.onToggleAutoNumber}
            title="Toggle automatic heading numbering (1.1, 1.2…)"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] cursor-pointer transition-colors ${
              props.autoNumberHeadings
                ? "bg-cyan-500/20 border-cyan-400/45 text-cyan-200"
                : "border-slate-700/70 bg-black/35 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Hash size={11} />
            <span className="hidden sm:inline">Numbered</span>
          </button>

          {!props.slideMode && (
            <button
              type="button"
              onClick={props.onToggleScrollSync}
              title="Toggle scroll synchronization between editor and preview"
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                props.scrollSync
                  ? "bg-violet-500/20 border-violet-400/45 text-violet-200"
                  : "border-slate-700/70 bg-black/35 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Link2 size={11} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!props.slideMode && (
            <div className="flex items-center gap-1 border border-slate-700/70 rounded-lg bg-black/35 px-1.5 py-0.5">
              <button
                type="button"
                onClick={() => props.onChangeZoom(Math.max(60, props.zoom - 10))}
                className="text-slate-400 hover:text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={12} />
              </button>
              <button
                type="button"
                onClick={() => props.onChangeZoom(100)}
                className="text-[11px] font-mono text-slate-300 w-9 text-center cursor-pointer"
                title="Reset Zoom"
              >
                {props.zoom}%
              </button>
              <button
                type="button"
                onClick={() => props.onChangeZoom(Math.min(160, props.zoom + 10))}
                className="text-slate-400 hover:text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={12} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={props.onCopyRichHtml}
            title="Copy formatted HTML to paste into Google Docs, Word, or Notion"
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-700/70 bg-black/35 text-slate-300 hover:text-cyan-200 hover:border-cyan-400/40 text-[11px] cursor-pointer"
          >
            <Copy size={11} />
            <span className="hidden sm:inline">Copy HTML</span>
          </button>

          {props.slideMode && (
            <button
              type="button"
              onClick={() => setSlideFullscreen((v) => !v)}
              title={slideFullscreen ? "Exit Slide Presentation" : "Present Fullscreen"}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 text-[11px] cursor-pointer"
            >
              {slideFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{slideFullscreen ? "Exit" : "Present"}</span>
            </button>
          )}
        </div>
      </div>

      {/* DOCUMENT PREVIEW MODE */}
      {!props.slideMode ? (
        <div
          ref={scrollContainerRef}
          onScroll={() => {
            if (!props.scrollSync || ignoringScrollRef.current) return;
            const el = scrollContainerRef.current;
            if (!el) return;
            const maxScroll = el.scrollHeight - el.clientHeight;
            if (maxScroll > 0) {
              props.onPreviewScrollRatio(el.scrollTop / maxScroll);
            }
          }}
          onClick={handleContainerClick}
          onChange={handleContainerChange}
          onDoubleClick={handleContainerDoubleClick}
          className="flex-1 overflow-y-auto md-scroll p-4 sm:p-6"
        >
          <div
            style={{
              maxWidth: widthCfg.maxWidth,
              width: "100%",
              margin: "0 auto",
              zoom: props.zoom / 100,
            }}
          >
            {/* Frontmatter Card */}
            {fm && fmEntries.length > 0 && (
              <div className="mb-4 rounded-xl border border-violet-400/25 bg-[#0e1229]/90 overflow-hidden text-xs">
                <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/[0.07]">
                  <button
                    type="button"
                    onClick={() => setFmCollapsed((v) => !v)}
                    className="flex items-center gap-2 text-cyan-300 font-mono uppercase tracking-wider text-[10px] cursor-pointer"
                  >
                    <Tag size={12} />
                    <span>{fm.format.toUpperCase()} Frontmatter</span>
                    <span className="text-slate-500">
                      ({fmCollapsed ? "collapsed" : `${fmEntries.length} fields`})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={props.onOpenFrontmatterModal}
                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-cyan-300 cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>Edit</span>
                  </button>
                </div>

                {!fmCollapsed && (
                  <div className="p-3.5 space-y-2">
                    {typeof fm.fields.title === "string" && (
                      <div className="text-base font-bold text-white">
                        {fm.fields.title}
                      </div>
                    )}
                    {typeof fm.fields.description === "string" && (
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {fm.fields.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {fmEntries
                        .filter(([k]) => k !== "title" && k !== "description")
                        .map(([k, v]) => (
                          <div
                            key={k}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11px]"
                          >
                            <span className="font-mono text-violet-300">{k}:</span>
                            {Array.isArray(v) ? (
                              <span className="flex flex-wrap gap-1">
                                {v.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-200 font-mono text-[10px]"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </span>
                            ) : (
                              <span className="text-slate-200">{String(v)}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rendered HTML Body */}
            <article
              className={`md-preview-doc md-preview-${props.previewTheme}`}
              dangerouslySetInnerHTML={{ __html: props.result.html }}
            />
          </div>
        </div>
      ) : (
        /* SLIDE DECK PRESENTATION MODE */
        <div
          onClick={handleContainerClick}
          onChange={handleContainerChange}
          onDoubleClick={handleContainerDoubleClick}
          className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 gap-4"
        >
          {/* Progress Bar */}
          <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={clampedSlideIdx <= 0}
                onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-white/[0.05] text-slate-200 disabled:opacity-35 cursor-pointer"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="font-mono text-cyan-300">
                Slide {clampedSlideIdx + 1} / {totalSlides}
              </span>
              <button
                type="button"
                disabled={clampedSlideIdx >= totalSlides - 1}
                onClick={() => setSlideIdx((i) => Math.min(totalSlides - 1, i + 1))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-700 bg-white/[0.05] text-slate-200 disabled:opacity-35 cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                  notesOpen
                    ? "bg-amber-500/15 border-amber-400/35 text-amber-200"
                    : "border-slate-700 bg-white/[0.04] text-slate-400"
                }`}
              >
                <NotebookPen size={12} />
                <span>Speaker Notes</span>
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx(0)}
                title="Jump to first slide"
                className="p-1.5 rounded-lg border border-slate-700 bg-white/[0.04] text-slate-300 hover:text-white cursor-pointer"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          </div>

          {/* Slide Stage */}
          <div className="flex-1 flex items-center justify-center overflow-y-auto md-scroll">
            <div className="max-w-5xl w-full">
              <div
                className={`md-preview-doc md-preview-${props.previewTheme} min-h-[420px] flex flex-col justify-center`}
                dangerouslySetInnerHTML={{
                  __html: currentSlide?.html ?? "<p>Add <code>---</code> separators to create slides.</p>",
                }}
              />
            </div>
          </div>

          {/* Speaker Notes Drawer */}
          {notesOpen && currentSlide?.notes && (
            <div className="max-w-5xl w-full mx-auto p-3 rounded-xl border border-amber-400/30 bg-amber-500/10 text-xs text-amber-100">
              <div className="font-mono text-[10px] uppercase tracking-wider text-amber-300 mb-1">
                Speaker Notes (Slide {clampedSlideIdx + 1})
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{currentSlide.notes}</p>
            </div>
          )}

          {/* Filmstrip Dots */}
          <div className="max-w-5xl w-full mx-auto flex items-center gap-1.5 overflow-x-auto pb-1">
            {props.result.slides.map((sl, idx) => (
              <button
                key={sl.index}
                type="button"
                onClick={() => setSlideIdx(idx)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono shrink-0 transition-all cursor-pointer ${
                  idx === clampedSlideIdx
                    ? "md-primary-pill border-transparent text-white"
                    : "border-slate-700/70 bg-white/[0.04] text-slate-400 hover:text-white"
                }`}
              >
                {idx + 1}. {sl.title ? sl.title.slice(0, 18) : `Slide ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
