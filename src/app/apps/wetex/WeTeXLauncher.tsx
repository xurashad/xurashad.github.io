"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Code2,
  ExternalLink,
  FileCode2,
  FileText,
  History,
  Layers,
  Sigma,
  Sparkles,
  Wand2,
} from "lucide-react";
import { WETEX_TEMPLATES } from "./lib/templates";
import type { WeTeXProject } from "./lib/types";

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
  if (typeof window === "undefined") return () => { };
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

function getRecentProjectsSnapshot(): ProjectSummary[] {
  if (typeof window === "undefined") return EMPTY_PROJECTS;
  const raw =
    window.localStorage.getItem("wetex_projects_v3") ??
    window.localStorage.getItem("wetex_projects_v2");
  if (raw === cachedRaw) return cachedProjects;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as WeTeXProject[]) : [];
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
    title: "Real TeX Live 2026 PDF",
    desc: "Compile authentic vector PDFs in pdflatex, xelatex, or lualatex with exact 1:1 preview and download parity.",
  },
  {
    icon: Sigma,
    title: "Instant KaTeX & TikZ",
    desc: "Sub-20ms offline preview with KaTeX math typesetting, TikZ vector graphics, Beamer slides, and live formula bar.",
  },
  {
    icon: BookOpen,
    title: "Multi-File & BibTeX/DOI",
    desc: "Manage \\input chapters, figures, .bib files, DOI metadata lookup, and automated citation formatting.",
  },
  {
    icon: Code2,
    title: "SyncTeX & Smart IDE",
    desc: "Double-click navigation between source and preview, LaTeX command autocomplete, Find/Replace, and formatter.",
  },
  {
    icon: Wand2,
    title: "Visual TeX Wizards",
    desc: "Generate booktabs tables, multi-line equation alignments, and BibTeX entries through interactive builders.",
  },
  {
    icon: History,
    title: "Autosave, Local Folders & Export",
    desc: "Auto-saves locally and syncs to offline disk folders via File System Access, with diffs, ZIP, HTML, and PDF.",
  },
];

export function WeTeXLauncher() {
  const [launchedTab, setLaunchedTab] = useState(false);
  const recentProjects = useSyncExternalStore(
    subscribeStorage,
    getRecentProjectsSnapshot,
    getServerProjectsSnapshot,
  );

  // Preserve shared hash links (#wt= / #wtz=) by routing them into Focus Mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    if (h.startsWith("#wt=") || h.startsWith("#wtz=")) {
      window.location.replace(`/apps/wetex/editor${h}`);
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
            <Sigma size={13} />
            <span>TeX Live 2026 · Distraction-Free Focus Studio</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-violet-700 via-indigo-600 to-cyan-600 dark:from-white dark:via-violet-200 dark:to-cyan-200 bg-clip-text text-transparent">
            WeTeX — Online LaTeX Studio
          </h1>

          <p className="text-base sm:text-lg text-foreground/65 max-w-2xl mx-auto leading-relaxed mb-8">
            Write, edit, and compile multi-file LaTeX papers in a full-viewport Focus Mode IDE with Real TeX Live 2026 PDF rendering, instant offline KaTeX/TikZ preview, BibTeX &amp; DOI citations, and 9 academic templates.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/apps/wetex/editor"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setLaunchedTab(true)}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 hover:brightness-110 shadow-[0_8px_28px_rgba(99,102,241,0.38)] transition-all"
            >
              <span>Open WeTeX Studio</span>
              <ExternalLink size={16} />
            </a>

            <Link
              href="/apps/wetex/editor"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-foreground/80 bg-foreground/5 hover:bg-foreground/10 border border-foreground/15 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 transition-all"
            >
              <span>Open in Current Tab</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {launchedTab && (
            <p className="mt-3 text-xs text-foreground/50">
              Opened WeTeX Focus Studio in a dedicated browser tab.
            </p>
          )}

          {/* Thematic Studio Preview Frame */}
          <div className="mt-10 rounded-2xl border border-white/12 bg-[#070816]/95 overflow-hidden shadow-2xl text-left">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 text-[11px] text-white/60 font-mono bg-[#0b0d20]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/75" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/75" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/75" />
                <span className="ml-2 text-white/80 font-semibold">WeTeX Focus Studio</span>
              </div>
              <span className="text-cyan-300/80">/apps/wetex/editor</span>
            </div>
            <div className="relative aspect-[16/8] max-h-[340px] w-full overflow-hidden">
              <Image
                src="/images/apps_backgrounds/wetex.jfif"
                alt="WeTeX Online LaTeX Studio workspace preview"
                fill
                sizes="(max-width: 1024px) 100vw, 960px"
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070816]/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200/90 font-mono">
                <span>pdflatex · xelatex · lualatex · bibtex</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 text-[11px]">
                  1:1 Real PDF + Instant Preview
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Recent Projects (when saved locally) */}
        {recentProjects.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono uppercase tracking-wider text-foreground/60 flex items-center gap-2">
                <Clock size={14} className="text-violet-500 dark:text-cyan-400" />
                <span>Resume Recent Projects</span>
              </h2>
              <span className="text-xs text-foreground/45">{recentProjects.length} saved locally</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentProjects.map((proj) => (
                <a
                  key={proj.id}
                  href={`/apps/wetex/editor?project=${encodeURIComponent(proj.id)}`}
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
                      {proj.fileCount} files · Updated {formatDate(proj.updatedAt)}
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
            <span className="text-xs text-foreground/45">{WETEX_TEMPLATES.length} templates · opens in Focus Studio tab</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {WETEX_TEMPLATES.map((tpl) => (
              <a
                key={tpl.id}
                href={`/apps/wetex/editor?template=${encodeURIComponent(tpl.id)}`}
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
                      {tpl.category} · {tpl.files.length} {tpl.files.length === 1 ? "file" : "files"}
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
          <span>100% browser workspace · Auto-saves locally · Authentic TeX Live 2026 PDFs</span>
        </div>
      </div>
    </div>
  );
}
