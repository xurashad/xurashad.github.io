"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Code2,
  Columns2,
  Command,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileCode2,
  FileJson,
  FilePlus2,
  FileText,
  FolderInput,
  FolderOpen,
  GitBranch,
  HardDrive,
  HelpCircle,
  History,
  ListTree,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Presentation,
  Printer,
  Redo2,
  RefreshCw,
  Save,
  Settings,
  Share2,
  Sigma,
  Sparkles,
  Table,
  Tag,
  Undo2,
  Unlink,
  Upload,
  Wand2,
} from "lucide-react";
import type { LayoutMode, SaveStatus } from "../lib/types";

export interface TopBarProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  layoutMode: LayoutMode;
  onChangeLayout: (mode: LayoutMode) => void;
  zenMode: boolean;
  onToggleZenMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFormat: () => void;
  onOpenTemplates: () => void;
  onOpenHistory: () => void;
  onOpenTableWizard: () => void;
  onOpenMermaidBuilder: () => void;
  onOpenMathBuilder: () => void;
  onOpenFrontmatter: () => void;
  onOpenCalloutBadge: () => void;
  onOpenHtmlImport: () => void;
  onInsertSnippet: (snippet: string, cursorOffset?: number) => void;
  onOpenCommandPalette: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onDownloadMarkdown: () => void;
  onExportHtml: () => void;
  onPrintPdf: () => void;
  onExportZip: () => void;
  onExportPlainText: () => void;
  onExportJson: () => void;
  onCopyRichHtml: () => void;
  onCopyMarkdown: () => void;
  onShareUrl: () => void;
  onTriggerUpload: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
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
      className="md-topbar px-2.5 sm:px-3.5 py-2 flex items-center justify-between gap-2 flex-wrap z-30 select-none"
    >
      {/* Left: Back, Sidebar Toggle, Brand & Workspace Name */}
      <div className="flex items-center gap-2 shrink-0 min-w-0">
        <Link
          href="/apps/markdown-studio"
          title="Back to Markdown Studio Overview"
          className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors"
        >
          <ArrowLeft size={15} />
        </Link>

        <button
          type="button"
          onClick={props.onToggleSidebar}
          title={props.sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white hover:border-violet-400/40 transition-colors cursor-pointer"
        >
          {props.sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-[0_0_16px_rgba(0,195,245,0.35)]">
            M
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-300/80">
              Markdown Studio
            </span>
          </div>
        </div>

        <span className="text-slate-600 hidden sm:inline">/</span>

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
            className="px-2 py-0.5 text-xs font-medium rounded-md bg-slate-900 border border-cyan-400/60 text-white focus:outline-none max-w-[180px]"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftName(props.projectName);
              setEditingName(true);
            }}
            title="Click to rename workspace"
            className="px-2 py-1 rounded-md text-xs font-medium text-slate-100 hover:bg-white/[0.06] truncate max-w-[160px] sm:max-w-[210px] cursor-pointer"
          >
            {props.projectName}
          </button>
        )}

        {props.localFolderName && (
          <span
            title={
              props.localFolderConnected
                ? `Synced to folder "${props.localFolderName}"`
                : `Imported from "${props.localFolderName}"`
            }
            className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
              props.localFolderConnected
                ? "bg-emerald-500/12 text-emerald-300 border-emerald-400/30"
                : "bg-amber-500/10 text-amber-300 border-amber-400/25"
            }`}
          >
            <HardDrive size={10} />
            <span className="max-w-[95px] truncate">{props.localFolderName}</span>
          </span>
        )}
      </div>

      {/* Center: Menus, Layout Modes, Quick Actions */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Workspace Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("workspace")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
              openMenu === "workspace"
                ? "bg-violet-500/20 border-violet-400/45 text-white"
                : "border-slate-500/25 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
            }`}
          >
            <span>Workspace</span>
            <ChevronDown size={12} />
          </button>

          {openMenu === "workspace" && (
            <div className="absolute left-0 mt-1.5 w-64 rounded-xl border border-slate-500/30 bg-[#0b0d1f] shadow-2xl p-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => menuAction(props.onOpenTemplates)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-violet-500/20 hover:text-white cursor-pointer"
              >
                <BookOpen size={14} className="text-violet-300" />
                <span>Templates &amp; Workspaces…</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onOpenHistory)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-violet-500/20 hover:text-white cursor-pointer"
              >
                <History size={14} className="text-cyan-300" />
                <span>Version History &amp; Diff…</span>
              </button>
              <div className="my-1 border-t border-slate-700/60" />
              <button
                type="button"
                onClick={() => menuAction(props.onOpenLocalFolder)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-200 cursor-pointer"
              >
                <FolderOpen size={14} className="text-emerald-400" />
                <span>Open Local Disk Folder…</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onBindSaveToLocalFolder)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-emerald-500/15 hover:text-emerald-200 cursor-pointer"
              >
                <FolderInput size={14} className="text-emerald-300" />
                <span>Sync Workspace to Folder…</span>
              </button>
              {props.localFolderConnected && (
                <>
                  <button
                    type="button"
                    onClick={() => menuAction(props.onReloadFromLocalFolder)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
                  >
                    <RefreshCw size={14} className="text-cyan-300" />
                    <span>Reload from Disk</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => menuAction(props.onDisconnectLocalFolder)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-amber-300 hover:bg-amber-500/15 cursor-pointer"
                  >
                    <Unlink size={14} />
                    <span>Disconnect Local Folder</span>
                  </button>
                </>
              )}
              <div className="my-1 border-t border-slate-700/60" />
              <button
                type="button"
                onClick={() => menuAction(props.onTriggerUpload)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <Upload size={14} className="text-sky-300" />
                <span>Import Files / Images…</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onOpenHtmlImport)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <FilePlus2 size={14} className="text-pink-300" />
                <span>HTML → Markdown Importer…</span>
              </button>
            </div>
          )}
        </div>

        {/* Insert / Wizards Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("insert")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
              openMenu === "insert"
                ? "bg-cyan-500/20 border-cyan-400/45 text-white"
                : "border-slate-500/25 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
            }`}
          >
            <Wand2 size={13} className="text-cyan-300" />
            <span>Insert</span>
            <ChevronDown size={12} />
          </button>

          {openMenu === "insert" && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-xl border border-slate-500/30 bg-[#0b0d1f] shadow-2xl p-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => menuAction(props.onOpenTableWizard)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/15 hover:text-white cursor-pointer"
              >
                <Table size={14} className="text-cyan-300" />
                <span>Visual Table Builder…</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onOpenMermaidBuilder)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/15 hover:text-white cursor-pointer"
              >
                <GitBranch size={14} className="text-emerald-300" />
                <span>Mermaid &amp; Chart Studio…</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onOpenMathBuilder)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/15 hover:text-white cursor-pointer"
              >
                <Sigma size={14} className="text-pink-300" />
                <span>KaTeX Equation Builder…</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onOpenFrontmatter)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/15 hover:text-white cursor-pointer"
              >
                <Tag size={14} className="text-violet-300" />
                <span>Frontmatter Editor…</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onOpenCalloutBadge)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/15 hover:text-white cursor-pointer"
              >
                <Award size={14} className="text-amber-300" />
                <span>Callout &amp; Badge Builder…</span>
              </button>
              <div className="my-1 border-t border-slate-700/60" />
              <button
                type="button"
                onClick={() => menuAction(() => props.onInsertSnippet("[[TOC]]\n\n"))}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <ListTree size={14} className="text-sky-300" />
                <span>Table of Contents ([[TOC]])</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  menuAction(() =>
                    props.onInsertSnippet(
                      "<details>\n<summary>Click to expand</summary>\n\nDetails here.\n\n</details>\n\n",
                    ),
                  )
                }
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <FileCode2 size={14} className="text-indigo-300" />
                <span>Collapsible Section</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  menuAction(() =>
                    props.onInsertSnippet(
                      "[^1]\n\n[^1]: Reference note.",
                    ),
                  )
                }
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <FileText size={14} className="text-slate-300" />
                <span>Footnote Reference</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  menuAction(() =>
                    props.onInsertSnippet(new Date().toISOString().slice(0, 10)),
                  )
                }
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <Calendar size={14} className="text-emerald-300" />
                <span>Insert Today&apos;s Date</span>
              </button>
            </div>
          )}
        </div>

        {/* Layout Mode Switcher */}
        <div className="hidden md:flex items-center p-0.5 rounded-lg border border-slate-500/25 bg-black/35">
          {(
            [
              { id: "editor", label: "Editor", icon: Code2 },
              { id: "split", label: "Split", icon: Columns2 },
              { id: "preview", label: "Preview", icon: Eye },
              { id: "slides", label: "Slides", icon: Presentation },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = props.layoutMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => props.onChangeLayout(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  active
                    ? "md-primary-pill text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Undo / Redo / Format / Zen */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={props.onUndo}
            disabled={!props.canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={props.onRedo}
            disabled={!props.canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white disabled:opacity-35 cursor-pointer"
          >
            <Redo2 size={14} />
          </button>
          <button
            type="button"
            onClick={props.onFormat}
            title="Prettify & Align Tables (Alt+Shift+F)"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-200 hover:border-cyan-400/40 hover:text-white text-xs cursor-pointer"
          >
            <Sparkles size={13} className="text-cyan-300" />
            <span className="hidden xl:inline">Format</span>
          </button>
          <button
            type="button"
            onClick={props.onToggleZenMode}
            title="Zen Mode (Distraction-Free)"
            className={`px-2 py-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              props.zenMode
                ? "bg-violet-500/25 border-violet-400/50 text-violet-200"
                : "border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white"
            }`}
          >
            Zen
          </button>
        </div>

        {/* Export Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleMenu("export")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
              openMenu === "export"
                ? "bg-cyan-500/20 border-cyan-400/45 text-white"
                : "md-primary-pill border-transparent text-white hover:brightness-110"
            }`}
          >
            <Download size={13} />
            <span>Export</span>
            <ChevronDown size={12} />
          </button>

          {openMenu === "export" && (
            <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-slate-500/30 bg-[#0b0d1f] shadow-2xl p-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => menuAction(props.onDownloadMarkdown)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/15 hover:text-white cursor-pointer"
              >
                <FileText size={14} className="text-cyan-300" />
                <span>Download Markdown (.md)</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onExportHtml)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/15 hover:text-white cursor-pointer"
              >
                <FileCode2 size={14} className="text-violet-300" />
                <span>Export Styled HTML (.html)</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onPrintPdf)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/15 hover:text-white cursor-pointer"
              >
                <Printer size={14} className="text-emerald-300" />
                <span>Print / Save Vector PDF</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onExportZip)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-cyan-500/15 hover:text-white cursor-pointer"
              >
                <FileArchive size={14} className="text-amber-300" />
                <span>Download Workspace (.zip)</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onExportPlainText)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <FileText size={14} className="text-slate-300" />
                <span>Export Plain Text (.txt)</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onExportJson)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <FileJson size={14} className="text-sky-300" />
                <span>Export AST &amp; Analytics (.json)</span>
              </button>
              <div className="my-1 border-t border-slate-700/60" />
              <button
                type="button"
                onClick={() => menuAction(props.onCopyRichHtml)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <Copy size={14} className="text-cyan-300" />
                <span>Copy Rich HTML (Docs/Notion)</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onCopyMarkdown)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <Copy size={14} className="text-slate-300" />
                <span>Copy Raw Markdown</span>
              </button>
              <button
                type="button"
                onClick={() => menuAction(props.onShareUrl)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-200 hover:bg-white/[0.07] cursor-pointer"
              >
                <Share2 size={14} className="text-violet-300" />
                <span>Copy Shareable URL</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Save Status, Command Palette, Settings, Shortcuts, Fullscreen */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={props.onSaveNow}
          title={
            props.lastSavedAt
              ? `Last saved ${new Date(props.lastSavedAt).toLocaleTimeString()} (Ctrl+S)`
              : "Save Now (Ctrl+S)"
          }
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
            props.saveStatus === "saved"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
              : props.saveStatus === "saving"
                ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                : "border-amber-500/35 bg-amber-500/12 text-amber-200"
          }`}
        >
          {props.saveStatus === "saved" ? <Check size={12} /> : <Save size={12} />}
          <span>
            {props.saveStatus === "saved"
              ? "Saved"
              : props.saveStatus === "saving"
                ? "Saving…"
                : "Unsaved"}
          </span>
        </button>

        <button
          type="button"
          onClick={props.onOpenCommandPalette}
          title="Command Palette (Ctrl+Shift+P)"
          className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white hover:border-cyan-400/40 cursor-pointer"
        >
          <Command size={14} />
        </button>

        <button
          type="button"
          onClick={props.onOpenSettings}
          title="Studio Settings"
          className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white hover:border-violet-400/40 cursor-pointer"
        >
          <Settings size={14} />
        </button>

        <button
          type="button"
          onClick={props.onOpenShortcuts}
          title="Keyboard Shortcuts & Markdown Syntax Guide"
          className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white hover:border-cyan-400/40 cursor-pointer"
        >
          <HelpCircle size={14} />
        </button>

        <button
          type="button"
          onClick={props.onToggleFullscreen}
          title={props.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          className="p-1.5 rounded-lg border border-slate-500/25 bg-white/[0.04] text-slate-300 hover:text-white hover:border-cyan-400/40 cursor-pointer"
        >
          {props.isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>
      </div>
    </header>
  );
}
