'use client';
// ============================================================
// Website Builder Pro — Studio Launcher Page
// ============================================================

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import {
  Layout, Sparkles, Code2, ShieldCheck, Smartphone, Package,
  Layers, ArrowRight, ExternalLink, Clock, Palette, Command,
} from 'lucide-react';
import type { ProjectMeta } from './lib/persistence';

const EMPTY_PROJECTS: ProjectMeta[] = [];
let cachedRaw: string | null | undefined;
let cachedProjects: ProjectMeta[] = EMPTY_PROJECTS;

const subscribeStorage = (cb: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
};

function getProjectsSnapshot(): ProjectMeta[] {
  if (typeof window === 'undefined') return EMPTY_PROJECTS;
  const raw = localStorage.getItem('wb_project_index');
  if (raw === cachedRaw) return cachedProjects;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as ProjectMeta[]) : [];
    cachedProjects = [...parsed].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6);
  } catch {
    cachedProjects = EMPTY_PROJECTS;
  }
  return cachedProjects;
}

const getServerProjectsSnapshot = () => EMPTY_PROJECTS;

const CAPABILITIES = [
  { icon: Layout, title: '27 Modular Elements', desc: 'Cards, accordions, tabs, dynamic forms, KPI stats, tables, SVG/HTML & nested containers.' },
  { icon: Layers, title: '24 Section Templates', desc: 'Bento grids, split heroes, pricing tiers, FAQs, testimonials & reusable saved blocks.' },
  { icon: Smartphone, title: 'Responsive Breakpoints', desc: 'Desktop, Tablet & Mobile canvas reflow with per-device style overrides & grid overlay.' },
  { icon: Palette, title: '8 Curated Theme Kits', desc: 'Light & dark color tokens, 20 Google Fonts, gradient builder, and SVG shape dividers.' },
  { icon: ShieldCheck, title: 'Built-In Site Audit', desc: 'Live SEO, accessibility, heading hierarchy, alt-text & asset weight diagnostics.' },
  { icon: Code2, title: 'Live Code & ZIP Export', desc: 'Inspect HTML/CSS/JS live, download single-file HTML, or export multi-page ZIP + sitemap.' },
];

export default function WebBuilderLauncher() {
  const [launchedWindow, setLaunchedWindow] = useState(false);
  const recentProjects = useSyncExternalStore(subscribeStorage, getProjectsSnapshot, getServerProjectsSnapshot);

  const openNewWindow = () => {
    const w = window.open('/apps/website-builder/editor', 'WebBuilderPro', 'noopener');
    if (w) setLaunchedWindow(true);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen py-14 px-4 sm:px-6 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Hero Card */}
        <div className="glass-card border border-foreground/10 dark:border-white/10 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-indigo-500/12 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 dark:border-indigo-400/25 mb-5">
            <Sparkles size={13} />
            <span>Visual Studio 2.0 · Client-Side</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-indigo-700 via-violet-600 to-cyan-600 dark:from-white dark:via-indigo-200 dark:to-cyan-200 bg-clip-text text-transparent">
            Website Builder Pro
          </h1>

          <p className="text-base sm:text-lg text-foreground/65 max-w-2xl mx-auto leading-relaxed mb-8">
            Design multi-page responsive websites with a real-time 12-column grid canvas, inline rich-text formatting, interactive widgets, SEO auditing, and clean production ZIP export.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/apps/website-builder/editor"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 shadow-[0_8px_28px_rgba(99,102,241,0.35)] transition-all"
            >
              <span>Launch Builder Studio</span>
              <ArrowRight size={17} />
            </Link>

            <button
              type="button"
              onClick={openNewWindow}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-foreground/80 bg-foreground/5 hover:bg-foreground/10 border border-foreground/15 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 transition-all cursor-pointer"
            >
              <ExternalLink size={16} />
              <span>{launchedWindow ? 'Open Window Again' : 'Open in New Window'}</span>
            </button>
          </div>

          {launchedWindow && (
            <p className="mt-3 text-xs text-foreground/45">
              Opened in a separate window. Allow pop-ups if your browser blocked it.
            </p>
          )}

          {/* Studio Mockup Preview Strip */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-[#0b0b12]/90 p-3 text-left shadow-2xl">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 text-[11px] text-white/50 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                <span className="ml-2 text-white/75">◆ WebBuilder Studio</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><Command size={11} /> ⌘K Palette</span>
                <span>1440px · 100%</span>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-2 pt-3">
              <div className="hidden sm:block col-span-3 rounded-lg bg-white/[0.03] border border-white/5 p-2.5 space-y-2">
                <div className="h-2 w-16 bg-indigo-400/40 rounded" />
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="h-9 rounded bg-white/[0.05] border border-white/5" />
                  <div className="h-9 rounded bg-white/[0.05] border border-white/5" />
                  <div className="h-9 rounded bg-white/[0.05] border border-white/5" />
                  <div className="h-9 rounded bg-white/[0.05] border border-white/5" />
                </div>
              </div>
              <div className="col-span-12 sm:col-span-6 rounded-lg bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-400/20 p-5 text-center space-y-2.5">
                <div className="h-2.5 w-24 mx-auto rounded-full bg-indigo-400/35" />
                <div className="h-5 w-4/5 mx-auto rounded bg-white/20" />
                <div className="h-2.5 w-3/5 mx-auto rounded bg-white/10" />
                <div className="flex justify-center gap-2 pt-1">
                  <div className="h-7 w-20 rounded-md bg-indigo-500/80" />
                  <div className="h-7 w-20 rounded-md border border-white/15" />
                </div>
              </div>
              <div className="hidden sm:block col-span-3 rounded-lg bg-white/[0.03] border border-white/5 p-2.5 space-y-2">
                <div className="h-2 w-14 bg-emerald-400/40 rounded" />
                <div className="h-14 rounded bg-white/[0.04] border border-white/5" />
                <div className="h-7 rounded bg-white/[0.04] border border-white/5" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects (when saved in localStorage) */}
        {recentProjects.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono uppercase tracking-wider text-foreground/60 flex items-center gap-2">
                <Clock size={14} className="text-indigo-500 dark:text-indigo-400" />
                <span>Resume Recent Projects</span>
              </h2>
              <span className="text-xs text-foreground/40">{recentProjects.length} saved locally</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentProjects.map(proj => (
                <Link
                  key={proj.id}
                  href={`/apps/website-builder/editor?project=${encodeURIComponent(proj.id)}`}
                  className="glass-card border border-foreground/10 dark:border-white/10 hover:border-indigo-400/45 rounded-xl p-4 flex items-center justify-between transition-all group"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-foreground/90 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {proj.name}
                    </div>
                    <div className="text-xs text-foreground/45 mt-0.5">
                      Updated {formatDate(proj.updatedAt)}
                    </div>
                  </div>
                  <ArrowRight size={15} className="text-foreground/40 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card border border-foreground/10 dark:border-white/10 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/12 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mb-3.5">
                <Icon size={19} />
              </div>
              <h3 className="font-semibold text-sm text-foreground/90 mb-1.5">{title}</h3>
              <p className="text-xs text-foreground/55 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center text-xs font-mono text-foreground/35 flex items-center justify-center gap-2">
          <Package size={13} />
          <span>100% browser-based · Auto-saves locally · Zero external lock-in</span>
        </div>
      </div>
    </div>
  );
}
