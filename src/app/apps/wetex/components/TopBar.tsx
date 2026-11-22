"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Columns2,
  Command,
  Download,
  Eye,
  FileArchive,
  FileCode2,
  FileDown,
  FolderInput,
  FolderOpen,
  HardDrive,
  HelpCircle,
  History,
  Loader2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Printer,
  Redo2,
  RefreshCw,
  Save,
  Settings,
  Share2,
  Sparkles,
  Table,
  Undo2,
  Unlink,
  Upload,
  Wand2,
} from "lucide-react";
import { STUDIO_SNIPPETS } from "./Modals";
import type { CloudEngine, PreviewEngine, SaveStatus } from "../lib/types";

export interface TopBarProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  layoutMode: "code" | "split" | "preview";
  onChangeLayout: (mode: "code" | "split" | "preview") => void;
  autoCompile: boolean;
  onToggleAutoCompile: () => void;
  isCompiling: boolean;
  onRecompile: () => void;
  previewEngine: PreviewEngine;
  onChangePreviewEngine: (engine: PreviewEngine) => void;
  cloudEngine: CloudEngine;
  onChangeCloudEngine: (engine: CloudEngine) => void;
  onOpenTeXLiveNet: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFormat: () => void;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
  onOpenTableWizard: () => void;
  onOpenEquationBuilder: () => void;
  onOpenBibWizard: () => void;
  onInsertSnippet: (snippet: string, cursorOffset?: number) => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onDownloadPdf: () => void;
  onPrintInstant: () => void;
  onExportHtml: () => void;
  onExportZip: () => void;
  onExportActiveFile: () => void;
  onTriggerUpload: () => void;
  onShareUrl: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  errorCount: number;
  warningCount: number;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  autoSave: boolean;
  onToggleAutoSave: () => void;
  onSaveNow: () => void;
  localFolderName?: string;
  localFolderConnected?: boolean;
  onOpenLocalFolder: () => void;
  onBindSaveToLocalFolder: () => void;
  onReloadFromLocalFolder: () => void;
  onDisconnectLocalFolder: () => void;
}

export function TopBar(props: TopBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(props.projectName);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenu(null);
    };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const commitName = () => {
    setEditingName(false);
    const cleaned = draftName.trim();
    if (cleaned && cleaned !== props.projectName) {
      props.onRenameProject(cleaned);
    } else {
      setDraftName(props.projectName);
    }
  };

  const toggleMenu = (key: string) =>
    setOpenMenu((prev) => (prev === key ? null : key));

  const menuAction = (fn: () => void) => {
    setOpenMenu(null);
    fn();
  };

  return (
    <header
      ref={barRef}
      className="wt-topbar px-2.5 sm:px-3.5 py-2 flex items-center gap-2 flex-wrap z-30 select-none"
    >
      {/* Brand + Launcher Back + Sidebar toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/apps/wetex"
          title="Back to WeTeX Launcher"
          className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>

        <button
          type="button"
          onClick={props.onToggleSidebar}
          title={props.sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors cursor-pointer"
        >
          {props.sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>

        <div className="flex items-center gap-2 pr-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 via-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_0_16px_rgba(124,58,237,0.4)] text-white font-serif font-bold text-xs">
            W
          </div>
          <div className="leading-tight hidden sm:block">
            <span className="font-serif font-bold text-sm tracking-tight text-white">
              We<span className="text-cyan-300">T</span>
              <span className="inline-block translate-y-[1.5px] text-violet-300">E</span>
              <span className="text-cyan-300">X</span>
            </span>
          </div>
        </div>
      </div>

      {/* Project Title Badge / Switcher */}
      <div className="flex items-center gap-1 min-w-0 max-w-[220px]">
        {editingName ? (
          <input
            type="text"
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitName();
              if (e.key === "Escape") {
                setDraftName(props.projectName);
                setEditingName(false);
              }
            }}
            className="px-2 py-1 text-xs rounded-md bg-slate-900/90 border border-cyan-400/60 text-white outline-none w-44"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftName(props.projectName);
              setEditingName(true);
            }}
            title="Click to rename project"
            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-slate-500/20 text-xs font-medium text-slate-200 truncate cursor-pointer transition-colors"
          >
            {props.projectName}
          </button>
        )}
        <button
          type="button"
          onClick={props.onOpenTemplates}
          title="Projects & Templates Gallery"
          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.09] border border-slate-500/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <FolderOpen size={13} />
        </button>
      </div>

      {/* Menu bar (File / Edit / Insert) */}
      <div className="hidden md:flex items-center gap-1 relative">
        {/* File Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("file")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              openMenu === "file"
                ? "bg-indigo-500/25 text-white"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            File <ChevronDown size={11} />
          </button>
          {openMenu === "file" && (
            <div className="absolute left-0 top-full mt-1.5 w-60 rounded-xl bg-[#0b0d1e]/95 backdrop-blur-xl border border-slate-500/25 shadow-2xl py-1.5 z-50">
              <button type="button" onClick={() => menuAction(props.onOpenTemplates)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <Sparkles size={13} className="text-violet-400" /> New / Templates Gallery…
              </button>
              <button type="button" onClick={() => menuAction(props.onOpenLocalFolder)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <FolderInput size={13} className="text-emerald-400" /> Open Offline Local Folder…
              </button>
              <button type="button" onClick={() => menuAction(props.onBindSaveToLocalFolder)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <HardDrive size={13} className="text-cyan-400" /> Save Project to Local Folder…
              </button>
              {props.localFolderConnected && (
                <>
                  <button type="button" onClick={() => menuAction(props.onReloadFromLocalFolder)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                    <RefreshCw size={13} className="text-emerald-300" /> Reload from {props.localFolderName || "Disk"}
                  </button>
                  <button type="button" onClick={() => menuAction(props.onDisconnectLocalFolder)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                    <Unlink size={13} className="text-rose-400" /> Disconnect Local Folder
                  </button>
                </>
              )}
              <div className="my-1 border-t border-slate-700/60" />
              <button type="button" onClick={() => menuAction(props.onSaveNow)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center justify-between gap-2 cursor-pointer">
                <span className="flex items-center gap-2"><Save size={13} className="text-emerald-400" /> Save Now</span>
                <kbd className="text-[10px] text-slate-400">Ctrl+S</kbd>
              </button>
              <button type="button" onClick={() => menuAction(props.onToggleAutoSave)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center justify-between gap-2 cursor-pointer">
                <span>Auto-Save</span>
                <span className={props.autoSave ? "text-emerald-400 font-mono text-[10px]" : "text-slate-500 font-mono text-[10px]"}>
                  {props.autoSave ? "ON" : "OFF"}
                </span>
              </button>
              <button type="button" onClick={() => menuAction(props.onTriggerUpload)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <Upload size={13} className="text-cyan-400" /> Import .tex / .bib / .zip / Images…
              </button>
              <div className="my-1 border-t border-slate-700/60" />
              <button type="button" onClick={() => menuAction(props.onDownloadPdf)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <FileDown size={13} className="text-emerald-400" /> Download Real PDF (.pdf)
              </button>
              <button type="button" onClick={() => menuAction(props.onPrintInstant)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <Printer size={13} className="text-cyan-300" /> Print Instant Preview…
              </button>
              <button type="button" onClick={() => menuAction(props.onOpenTeXLiveNet)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <Cloud size={13} className="text-sky-400" /> Open in TeXLive.net
              </button>
              <button type="button" onClick={() => menuAction(props.onExportHtml)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <FileCode2 size={13} className="text-amber-400" /> Export Standalone HTML
              </button>
              <button type="button" onClick={() => menuAction(props.onExportActiveFile)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <Download size={13} className="text-slate-300" /> Download Active File
              </button>
              <button type="button" onClick={() => menuAction(props.onExportZip)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <FileArchive size={13} className="text-violet-300" /> Download Source Project (.zip)
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("edit")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              openMenu === "edit"
                ? "bg-indigo-500/25 text-white"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            Edit <ChevronDown size={11} />
          </button>
          {openMenu === "edit" && (
            <div className="absolute left-0 top-full mt-1.5 w-48 rounded-xl bg-[#0b0d1e]/95 backdrop-blur-xl border border-slate-500/25 shadow-2xl py-1.5 z-50">
              <button type="button" disabled={!props.canUndo} onClick={() => menuAction(props.onUndo)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 disabled:opacity-40 flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2"><Undo2 size={13} /> Undo</span>
                <kbd className="text-[10px] text-slate-400">Ctrl+Z</kbd>
              </button>
              <button type="button" disabled={!props.canRedo} onClick={() => menuAction(props.onRedo)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 disabled:opacity-40 flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2"><Redo2 size={13} /> Redo</span>
                <kbd className="text-[10px] text-slate-400">Ctrl+Y</kbd>
              </button>
              <div className="my-1 border-t border-slate-700/60" />
              <button type="button" onClick={() => menuAction(props.onFormat)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2"><Wand2 size={13} className="text-cyan-400" /> Format LaTeX</span>
                <kbd className="text-[10px] text-slate-400">Alt+F</kbd>
              </button>
            </div>
          )}
        </div>

        {/* Insert Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("insert")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              openMenu === "insert"
                ? "bg-indigo-500/25 text-white"
                : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            Insert <ChevronDown size={11} />
          </button>
          {openMenu === "insert" && (
            <div className="absolute left-0 top-full mt-1.5 w-52 rounded-xl bg-[#0b0d1e]/95 backdrop-blur-xl border border-slate-500/25 shadow-2xl py-1.5 z-50">
              <button type="button" onClick={() => menuAction(props.onOpenTableWizard)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <Table size={13} className="text-cyan-400" /> Visual Table Generator…
              </button>
              <button type="button" onClick={() => menuAction(props.onOpenEquationBuilder)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <Calculator size={13} className="text-violet-400" /> Equation & Matrix Builder…
              </button>
              <button type="button" onClick={() => menuAction(props.onOpenBibWizard)} className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center gap-2 cursor-pointer">
                <BookOpen size={13} className="text-emerald-400" /> BibTeX / DOI Citation Wizard…
              </button>
              <div className="my-1 border-t border-slate-700/60" />
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Quick LaTeX Blocks
              </div>
              {STUDIO_SNIPPETS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => menuAction(() => props.onInsertSnippet(s.snippet, s.cursorOffset))}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-indigo-500/20 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span>{s.label}</span>
                  <span className="text-[10px] font-mono text-slate-500">+Block</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Layout Mode Switcher (desktop) */}
      <div className="hidden lg:flex items-center rounded-lg bg-white/[0.04] border border-slate-500/20 p-0.5 ml-1">
        {(
          [
            { id: "code", label: "Code", icon: Code2 },
            { id: "split", label: "Split", icon: Columns2 },
            { id: "preview", label: "Preview", icon: Eye },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => props.onChangeLayout(id)}
            className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer ${
              props.layoutMode === id
                ? "bg-indigo-500/30 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon size={12} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-w-1" />

      {/* Diagnostics summary badge */}
      {(props.errorCount > 0 || props.warningCount > 0) && (
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.04] border border-slate-500/20 text-[11px] font-mono">
          {props.errorCount > 0 && (
            <span className="text-rose-400 flex items-center gap-1">
              <AlertTriangle size={11} /> {props.errorCount}
            </span>
          )}
          {props.warningCount > 0 && (
            <span className="text-amber-300">{props.warningCount} warn</span>
          )}
        </div>
      )}

      {/* Command Palette, History & Share */}
      <button
        type="button"
        onClick={props.onOpenCommandPalette}
        title="Studio Command Palette (Ctrl/⌘ + K)"
        className="px-2 py-1.5 rounded-lg border border-slate-500/20 bg-white/[0.04] hover:bg-white/[0.09] text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Command size={12} className="text-cyan-300" />
        <span className="hidden xl:inline font-mono text-[11px] text-slate-300">⌘K</span>
      </button>

      <button
        type="button"
        onClick={props.onOpenHistory}
        title="Version History & Diff"
        className="px-2.5 py-1.5 rounded-lg border border-slate-500/20 bg-white/[0.04] hover:bg-white/[0.09] text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <History size={13} className="text-violet-300" />
        <span className="hidden xl:inline">History</span>
      </button>

      <button
        type="button"
        onClick={props.onShareUrl}
        title="Copy Shareable Project URL"
        className="px-2.5 py-1.5 rounded-lg border border-slate-500/20 bg-white/[0.04] hover:bg-white/[0.09] text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <Share2 size={13} className="text-cyan-300" />
        <span className="hidden xl:inline">Share</span>
      </button>

      {/* Save status pill */}
      <button
        type="button"
        onClick={props.onSaveNow}
        title={
          props.lastSavedAt
            ? `Last saved at ${new Date(props.lastSavedAt).toLocaleTimeString()} — Click to save now (Ctrl+S)`
            : "Click to save now (Ctrl+S)"
        }
        className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
          props.saveStatus === "error"
            ? "border-rose-400/45 bg-rose-500/15 text-rose-200"
            : props.saveStatus === "unsaved"
              ? "border-amber-400/40 bg-amber-500/12 text-amber-200"
              : "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
        }`}
      >
        {props.localFolderConnected ? (
          <HardDrive size={11} className="text-emerald-300" />
        ) : props.saveStatus === "saving" ? (
          <Loader2 size={11} className="animate-spin text-cyan-300" />
        ) : props.saveStatus === "saved" ? (
          <Check size={11} className="text-emerald-300" />
        ) : (
          <Save size={11} />
        )}
        <span>
          {props.saveStatus === "saving"
            ? "Saving…"
            : props.saveStatus === "unsaved"
              ? "Unsaved"
              : props.saveStatus === "error"
                ? "Save Error"
                : props.localFolderConnected
                  ? "Synced"
                  : "Saved"}
        </span>
      </button>

      {/* Auto-compile toggle */}
      <button
        type="button"
        onClick={props.onToggleAutoCompile}
        title={props.autoCompile ? "Auto-Compile is ON" : "Auto-Compile is OFF"}
        className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
          props.autoCompile
            ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-300"
            : "border-slate-500/25 bg-white/[0.04] text-slate-400"
        }`}
      >
        <Play size={11} />
        <span>Auto</span>
      </button>

      {/* Recompile Split Button */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={props.onRecompile}
          title="Recompile Document (Ctrl+Enter)"
          className="wt-recompile-btn px-3 py-1.5 rounded-l-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={props.isCompiling ? "animate-spin" : ""} />
          <span>Recompile</span>
        </button>
        <button
          type="button"
          onClick={() => toggleMenu("compile")}
          title="Compiler Engine Options"
          className="wt-recompile-btn px-1.5 py-1.5 rounded-r-lg border-l border-white/20 text-white cursor-pointer"
        >
          <ChevronDown size={12} />
        </button>

        {openMenu === "compile" && (
          <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-[#0b0d1e]/95 backdrop-blur-xl border border-slate-500/25 shadow-2xl py-2 px-2.5 z-50 text-xs">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 px-1">
              Preview Engine
            </div>
            <div className="grid grid-cols-2 gap-1 mb-2 px-1">
              <button
                type="button"
                onClick={() => props.onChangePreviewEngine("real-pdf")}
                className={`py-1 px-2 rounded text-[10.5px] font-medium border cursor-pointer ${
                  props.previewEngine === "real-pdf"
                    ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                    : "border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                Real PDF
              </button>
              <button
                type="button"
                onClick={() => props.onChangePreviewEngine("instant")}
                className={`py-1 px-2 rounded text-[10.5px] font-medium border cursor-pointer ${
                  props.previewEngine === "instant"
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                    : "border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                Instant (Offline)
              </button>
            </div>

            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 px-1">
              TeX Live 2026 Compiler
            </div>
            <div className="flex gap-1 mb-2 px-1">
              {(["pdflatex", "xelatex", "lualatex"] as const).map((eng) => (
                <button
                  key={eng}
                  type="button"
                  onClick={() => props.onChangeCloudEngine(eng)}
                  className={`flex-1 py-1 rounded text-[10px] font-mono border cursor-pointer ${
                    props.cloudEngine === eng
                      ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200"
                      : "border-slate-600/40 text-slate-400 hover:text-white"
                  }`}
                >
                  {eng}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => menuAction(props.onRecompile)}
              className="w-full px-2 py-1.5 rounded-lg text-left text-slate-200 hover:bg-indigo-500/20 flex items-center justify-between cursor-pointer"
            >
              <span>Compile Now</span>
              <kbd className="text-[10px] text-slate-400">Ctrl+Enter</kbd>
            </button>
            <button
              type="button"
              onClick={() => menuAction(props.onToggleAutoCompile)}
              className="w-full px-2 py-1.5 rounded-lg text-left text-slate-200 hover:bg-indigo-500/20 flex items-center justify-between cursor-pointer"
            >
              <span>Auto-Compile</span>
              <span className={props.autoCompile ? "text-emerald-400" : "text-slate-500"}>
                {props.autoCompile ? "ON" : "OFF"}
              </span>
            </button>

            <div className="my-1.5 border-t border-slate-700/60" />
            <button
              type="button"
              onClick={() => menuAction(props.onOpenTeXLiveNet)}
              className="w-full px-2 py-1.5 rounded-lg text-left text-sky-300 hover:bg-sky-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Cloud size={13} /> Fallback: Open TeXLive.net
            </button>
          </div>
        )}
      </div>

      {/* Settings, Shortcuts, Fullscreen */}
      <button
        type="button"
        onClick={props.onOpenSettings}
        title="Editor & Compiler Settings"
        className="p-1.5 rounded-lg border border-slate-500/20 bg-white/[0.04] hover:bg-white/[0.09] text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <Settings size={14} />
      </button>
      <button
        type="button"
        onClick={props.onOpenShortcuts}
        title="Keyboard Shortcuts (?)"
        className="p-1.5 rounded-lg border border-slate-500/20 bg-white/[0.04] hover:bg-white/[0.09] text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <HelpCircle size={14} />
      </button>
      <button
        type="button"
        onClick={props.onToggleFullscreen}
        title={props.isFullscreen ? "Exit Fullscreen" : "Studio Fullscreen"}
        className="p-1.5 rounded-lg border border-slate-500/20 bg-white/[0.04] hover:bg-white/[0.09] text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
      >
        {props.isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
    </header>
  );
}
