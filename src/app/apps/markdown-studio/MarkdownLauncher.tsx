"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckSquare,
  Clock,
  ExternalLink,
  FileCode2,
  FileText,
  FolderSync,
  GitBranch,
  History,
  Layers,
  Presentation,
  Sigma,
  Sparkles,
  Wand2,
} from "lucide-react";
import { MARKDOWN_TEMPLATES } from "./lib/templates";
import type { MarkdownProject } from "./lib/types";

interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  fileCount: number;
  localFolderName?: string;
  storageMode?: "browser" | "local-folder";
}

const EMPTY_PROJECTS: ProjectSummary[] = [];
let cachedRaw: string | null | undefined;
let cachedProjects: ProjectSummary[] = EMPTY_PROJECTS;

const subscribeStorage = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

function getRecentProjectsSnapshot(): ProjectSummary[] {
  if (typeof window === "undefined") return EMPTY_PROJECTS;
  const raw = window.localStorage.getItem("mdstudio_projects_v1");
  if (raw === cachedRaw) return cachedProjects;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as MarkdownProject[]) : [];
    cachedProjects = [...parsed]
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        name: p.name,
        updatedAt: p.updatedAt,
        fileCount: Array.isArray(p.files) ? p.files.length : 1,
        localFolderName: p.localFolderName,
        storageMode: p.storageMode,
      }));
  } catch {
    cachedProjects = EMPTY_PROJECTS;
  }
  return cachedProjects;
}

const getServerProjectsSnapshot = () => EMPTY_PROJECTS;

const CAPABILITIES = [
  {
    icon: Sparkles,
    title: "Complete GFM & Extended Syntax",
    desc: "Tables, task lists, footnotes, 13 callout types, collapsible <details>, ==highlights==, <kbd>, abbreviations, [[Wiki Links]], and [[TOC]].",
  },
  {
    icon: Sigma,
    title: "Instant KaTeX Mathematical Typesetting",
    desc: "Write inline $...$ and block $$...$$ equations with live cursor formula preview bar and an interactive Equation Builder.",
  },
  {
    icon: GitBranch,
    title: "Client-Side Mermaid & Chart SVG",
    desc: "Render Flowcharts, Sequence, State, Pie, Gantt diagrams, and Bar/Line Charts directly in browser without external network calls.",
  },
  {
    icon: Presentation,
    title: "Interactive Tasks & Slide Deck Mode",
    desc: "Toggle task checkboxes straight in the preview or switch to 16:9 Slide Presentation mode with speaker notes and filmstrip navigation.",
  },
  {
    icon: Wand2,
    title: "Visual Wizards & Smart IDE",
    desc: "Slash commands (/), emoji autocomplete (:), table builder, YAML/TOML frontmatter editor, HTML → Markdown converter, and clipboard image paste.",
  },
  {
    icon: BarChart3,
    title: "Linter & Readability Analytics",
    desc: "Real-time heading/link/image linter, Flesch Reading Ease score, word goal progress, keyword density, and live HTML inspector.",
  },
  {
    icon: FolderSync,
    title: "Multi-File & Local Disk Folder Sync",
    desc: "Organize nested folders, sync offline directories via File System Access API, and auto-save workspaces in your browser.",
  },
  {
    icon: History,
    title: "Version Checkpoints & Visual Diff",
    desc: "Capture named snapshots and inspect line-by-line additions and deletions before restoring previous document versions.",
  },
  {
    icon: CheckSquare,
    title: "Rich Multi-Format Export",
    desc: "Export .md, standalone styled .html, print/vector PDF, plain .txt, AST .json, multi-file .zip archives, rich HTML clipboard, and share URLs.",
  },
];

export function MarkdownLauncher() {
  const [launchedTab, setLaunchedTab] = useState(false);
  const recentProjects = useSyncExternalStore(
    subscribeStorage,
    getRecentProjectsSnapshot,
    getServerProjectsSnapshot,
  );

  // Route shared #md= / #mdz= hashes directly into Focus Studio
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    if (h.startsWith("#md=") || h.startsWith("#mdz=")) {
      window.location.replace(`/apps/markdown-studio/editor${h}`);
    }
  }, []);

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen py-14 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-violet-500/12 blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-cyan-500/12 blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Hero Card */}
        <div className="glass-card border border-foreground/10 dark:border-white/10 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-violet-500/12 text-violet-600 dark:text-cyan-300 border border-violet-500/25 dark:border-cyan-400/25 mb-5">
            <FileText size={13} />
            <span>GFM · KaTeX · Mermaid SVG · Slide Decks</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-violet-700 via-indigo-600 to-cyan-600 dark:from-white dark:via-violet-200 dark:to-cyan-200 bg-clip-text text-transparent">
            Markdown Studio
          </h1>

          <p className="text-base sm:text-lg text-foreground/65 max-w-2xl mx-auto leading-relaxed mb-8">
            Write, visualize, lint, and publish rich Markdown workspaces in a distraction-free cosmic IDE — complete with live KaTeX math, client-side Mermaid &amp; Chart SVG, interactive tasks, slide presentation mode, and multi-format export.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/apps/markdown-studio/editor"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setLaunchedTab(true)}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 hover:brightness-110 shadow-[0_8px_28px_rgba(99,102,241,0.38)] transition-all"
            >
              <span>Open Markdown Studio</span>
              <ExternalLink size={16} />
            </a>

            <Link
              href="/apps/markdown-studio/editor"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-foreground/80 bg-foreground/5 hover:bg-foreground/10 border border-foreground/15 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 transition-all"
            >
              <span>Open in Current Tab</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {launchedTab && (
            <p className="mt-3 text-xs text-foreground/50">
              Opened Markdown Studio in a dedicated browser tab.
            </p>
          )}

          {/* Thematic Studio Preview Frame */}
          <div className="mt-10 rounded-2xl border border-white/12 bg-[#070816]/95 overflow-hidden shadow-2xl text-left">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 text-[11px] text-white/60 font-mono bg-[#0b0d20]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/75" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/75" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/75" />
                <span className="ml-2 text-white/80 font-semibold">Markdown Studio IDE</span>
              </div>
              <span className="text-cyan-300/80">/apps/markdown-studio/editor</span>
            </div>
            <div className="relative aspect-[16/8] max-h-[360px] w-full overflow-hidden">
              <Image
                src="/images/apps_backgrounds/markdown-studio.jfif"
                alt="Markdown Studio workspace preview"
                fill
                sizes="(max-width: 1024px) 100vw, 960px"
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070816]/85 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200/90 font-mono">
                <span>gfm · katex · mermaid · charts · slides</span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/35 text-cyan-200 text-[11px]">
                  100% Browser-Native · Local Folder Sync
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Recent Workspaces */}
        {recentProjects.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono uppercase tracking-wider text-foreground/60 flex items-center gap-2">
                <Clock size={14} className="text-violet-500 dark:text-cyan-400" />
                <span>Resume Recent Workspaces</span>
              </h2>
              <span className="text-xs text-foreground/45">{recentProjects.length} saved locally</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentProjects.map((proj) => (
                <a
                  key={proj.id}
                  href={`/apps/markdown-studio/editor?project=${encodeURIComponent(proj.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card border border-foreground/10 dark:border-white/10 hover:border-cyan-400/45 rounded-xl p-4 flex items-center justify-between transition-all group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground/90 truncate group-hover:text-violet-600 dark:group-hover:text-cyan-300 transition-colors">
                        {proj.name}
                      </span>
                      {proj.storageMode === "local-folder" && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
                          Disk
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-foreground/45 mt-0.5">
                      {proj.fileCount} {proj.fileCount === 1 ? "file" : "files"} · Updated{" "}
                      {formatDate(proj.updatedAt)}
                    </div>
                  </div>
                  <ExternalLink
                    size={14}
                    className="text-foreground/40 group-hover:text-violet-600 dark:group-hover:text-cyan-300 shrink-0 transition-colors"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quick-Start Templates */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-foreground/60 flex items-center gap-2">
              <Layers size={14} className="text-violet-500 dark:text-violet-400" />
              <span>Launch From Starter Template</span>
            </h2>
            <span className="text-xs text-foreground/45">
              {MARKDOWN_TEMPLATES.length} templates · opens in Focus Studio tab
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {MARKDOWN_TEMPLATES.map((tpl) => (
              <a
                key={tpl.id}
                href={`/apps/markdown-studio/editor?template=${encodeURIComponent(tpl.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card border border-foreground/10 dark:border-white/10 hover:border-violet-400/45 rounded-2xl p-4 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/12 text-violet-600 dark:text-violet-300 border border-violet-500/20">
                      {tpl.badge}
                    </span>
                    <span className="text-[10px] font-mono text-foreground/45">
                      {tpl.category} · {tpl.files.length}{" "}
                      {tpl.files.length === 1 ? "file" : "files"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground/90 group-hover:text-violet-600 dark:group-hover:text-cyan-300 transition-colors mb-1">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-foreground/55 leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>
                </div>
                <div className="mt-3 pt-2.5 border-t border-foreground/10 dark:border-white/8 flex items-center justify-between text-[11px] font-medium text-foreground/60 group-hover:text-violet-600 dark:group-hover:text-cyan-300">
                  <span className="inline-flex items-center gap-1">
                    <FileText size={12} /> Open Template
                  </span>
                  <ExternalLink size={12} />
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass-card border border-foreground/10 dark:border-white/10 rounded-2xl p-5"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/12 text-violet-600 dark:text-cyan-300 flex items-center justify-center mb-3.5">
                <Icon size={19} />
              </div>
              <h3 className="font-semibold text-sm text-foreground/90 mb-1.5">{title}</h3>
              <p className="text-xs text-foreground/55 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center text-xs font-mono text-foreground/40 flex items-center justify-center gap-2">
          <FileCode2 size={13} />
          <span>100% browser-native · Auto-saves locally · Zero external runtime lock-in</span>
        </div>
      </div>
    </div>
  );
}
