"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Download,
  Info,
  Target,
} from "lucide-react";
import type {
  DocumentAnalytics,
  EditorTheme,
  MarkdownDiagnostic,
  PreviewTheme,
} from "../lib/types";

export interface BottomDrawerProps {
  open: boolean;
  onToggleOpen: () => void;
  activeTab: "problems" | "analytics" | "html";
  onChangeTab: (tab: "problems" | "analytics" | "html") => void;
  diagnostics: MarkdownDiagnostic[];
  analytics: DocumentAnalytics;
  compiledHtml: string;
  wordGoal: number;
  onUpdateWordGoal: (goal: number) => void;
  cursorLine: number;
  cursorCol: number;
  editorTheme: EditorTheme;
  previewTheme: PreviewTheme;
  renderTimeMs: number;
  onJumpToLine: (line: number) => void;
  onDownloadHtml: () => void;
}

export function BottomDrawer(props: BottomDrawerProps) {
  const [copiedHtml, setCopiedHtml] = useState(false);

  const errorCount = props.diagnostics.filter((d) => d.severity === "error").length;
  const warnCount = props.diagnostics.filter((d) => d.severity === "warning").length;
  const infoCount = props.diagnostics.filter((d) => d.severity === "info").length;

  const goalPct =
    props.wordGoal > 0
      ? Math.min(100, Math.round((props.analytics.words / props.wordGoal) * 100))
      : 0;

  const maxKeywordCount = Math.max(
    1,
    ...props.analytics.topKeywords.map((k) => k.count),
  );

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(props.compiledHtml);
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 1600);
    } catch {
      // Clipboard ignored
    }
  };

  return (
    <div className="border-t border-slate-700/60 bg-[#080a19]/95 backdrop-blur-md z-20 select-none">
      {/* Expanded Drawer Content */}
      {props.open && (
        <div className="h-60 border-b border-slate-700/60 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-black/30">
            <div className="flex items-center gap-1">
              {(
                [
                  {
                    id: "problems",
                    label: `Problems (${props.diagnostics.length})`,
                    icon: AlertTriangle,
                  },
                  {
                    id: "analytics",
                    label: "Analytics & Readability",
                    icon: BarChart3,
                  },
                  {
                    id: "html",
                    label: "Compiled HTML",
                    icon: Code2,
                  },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => props.onChangeTab(id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    props.activeTab === id
                      ? "bg-violet-500/20 text-cyan-200 border border-cyan-400/30"
                      : "text-slate-400 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <Icon size={12} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={props.onToggleOpen}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Close drawer"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto md-scroll p-3">
            {/* PROBLEMS TAB */}
            {props.activeTab === "problems" && (
              <div className="space-y-1.5">
                {props.diagnostics.length === 0 ? (
                  <div className="py-8 text-center text-xs font-mono text-emerald-300/80">
                    No Markdown lint issues found — document structure looks clean!
                  </div>
                ) : (
                  props.diagnostics.map((diag) => (
                    <button
                      key={diag.id}
                      type="button"
                      onClick={() => props.onJumpToLine(diag.line)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-slate-800 bg-white/[0.02] hover:bg-white/[0.06] text-left text-xs cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {diag.severity === "error" ? (
                          <AlertCircle size={14} className="text-rose-400 shrink-0" />
                        ) : diag.severity === "warning" ? (
                          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                        ) : (
                          <Info size={14} className="text-cyan-400 shrink-0" />
                        )}
                        <span className="text-slate-200 truncate">{diag.message}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {diag.rule}
                        </span>
                        <span className="text-cyan-300">Ln {diag.line}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ANALYTICS TAB */}
            {props.activeTab === "analytics" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Words", val: props.analytics.words.toLocaleString() },
                    { label: "Characters", val: props.analytics.chars.toLocaleString() },
                    { label: "Read Time", val: `${props.analytics.readingTimeMin} min` },
                    { label: "Speak Time", val: `${props.analytics.speakingTimeMin} min` },
                    { label: "Paragraphs", val: props.analytics.paragraphs.toString() },
                    { label: "Sentences", val: props.analytics.sentences.toString() },
                    { label: "Flesch Score", val: `${props.analytics.fleschScore}/100` },
                    { label: "Vocabulary", val: `${props.analytics.lexicalDiversity}%` },
                    { label: "Lines", val: props.analytics.lines.toString() },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="p-2 rounded-lg border border-slate-800 bg-white/[0.02]"
                    >
                      <div className="text-[10px] font-mono text-slate-400">{kpi.label}</div>
                      <div className="text-sm font-semibold text-cyan-200 mt-0.5">{kpi.val}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-white/[0.02] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Target size={13} className="text-violet-300" />
                      Word Goal &amp; Structure
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 text-[11px]">Goal:</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={props.wordGoal}
                        onChange={(e) =>
                          props.onUpdateWordGoal(Math.max(0, Number(e.target.value) || 0))
                        }
                        className="w-20 px-1.5 py-0.5 text-xs font-mono rounded bg-black/50 border border-slate-700 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Grade level: <span className="text-slate-200">{props.analytics.fleschGrade}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono text-slate-300 pt-1">
                    <div>H: {props.analytics.headingsCount}</div>
                    <div>Code: {props.analytics.codeBlocksCount}</div>
                    <div>Math: {props.analytics.mathCount}</div>
                    <div>Tables: {props.analytics.tablesCount}</div>
                    <div>Links: {props.analytics.linksCount}</div>
                    <div>Imgs: {props.analytics.imagesCount}</div>
                    <div>Notes: {props.analytics.footnotesCount}</div>
                    <div>
                      Tasks: {props.analytics.tasksDone}/{props.analytics.tasksTotal}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-800 bg-white/[0.02] space-y-1.5">
                  <div className="text-xs font-semibold text-slate-200 mb-1">
                    Top Keywords
                  </div>
                  {props.analytics.topKeywords.length === 0 ? (
                    <div className="text-xs text-slate-500">Write prose to see keywords.</div>
                  ) : (
                    props.analytics.topKeywords.map((kw) => (
                      <div key={kw.word} className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="w-24 truncate text-slate-300">{kw.word}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                            style={{ width: `${(kw.count / maxKeywordCount) * 100}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-slate-400">{kw.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* COMPILED HTML TAB */}
            {props.activeTab === "html" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Live Sanitized HTML Output ({props.compiledHtml.length.toLocaleString()} chars)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyHtml}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 cursor-pointer"
                    >
                      {copiedHtml ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedHtml ? "Copied" : "Copy HTML"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={props.onDownloadHtml}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Download .html</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-xl border border-slate-800 bg-black/50 text-[11.5px] font-mono text-emerald-200/90 overflow-x-auto max-h-36 select-text">
                  {props.compiledHtml}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Always-visible slim status bar */}
      <div className="px-3 py-1 flex items-center justify-between gap-3 text-[11px] font-mono text-slate-400 overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              props.onChangeTab("problems");
              if (!props.open) props.onToggleOpen();
            }}
            className="flex items-center gap-2 hover:text-white cursor-pointer"
          >
            <span className={errorCount > 0 ? "text-rose-400" : ""}>
              ✕ {errorCount}
            </span>
            <span className={warnCount > 0 ? "text-amber-300" : ""}>
              ⚠ {warnCount}
            </span>
            <span className={infoCount > 0 ? "text-cyan-300" : ""}>
              ℹ {infoCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              props.onChangeTab("analytics");
              if (!props.open) props.onToggleOpen();
            }}
            className="hover:text-cyan-200 cursor-pointer"
          >
            {props.analytics.words.toLocaleString()} words · {props.analytics.readingTimeMin} min read
          </button>

          {props.analytics.tasksTotal > 0 && (
            <span className="hidden sm:inline text-emerald-300/90">
              Tasks {props.analytics.tasksDone}/{props.analytics.tasksTotal}
            </span>
          )}

          {props.wordGoal > 0 && (
            <span className="hidden md:inline-flex items-center gap-1.5">
              <span>Goal {goalPct}%</span>
              <span className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden inline-block">
                <span
                  className="block h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                  style={{ width: `${goalPct}%` }}
                />
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span>
            Ln {props.cursorLine}, Col {props.cursorCol}
          </span>
          <span className="hidden sm:inline text-slate-500">
            {props.renderTimeMs}ms
          </span>
          <span className="hidden lg:inline text-violet-300/80">
            {props.editorTheme} / {props.previewTheme}
          </span>
          <button
            type="button"
            onClick={props.onToggleOpen}
            className="flex items-center gap-1 text-slate-300 hover:text-cyan-300 cursor-pointer"
          >
            <span>{props.open ? "Hide" : "Inspector"}</span>
            {props.open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}
