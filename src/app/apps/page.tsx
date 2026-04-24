"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Atom, LayoutGrid, Zap, GitFork, TrendingUp,
  Hash, Binary, Globe, Star, FileText, Bot,
  Search, BookOpen, Download, Shuffle, Type,
  QrCode, Gamepad2, Crown, ExternalLink,
  LayoutList, Filter, Sparkles, Braces, Infinity,
} from "lucide-react";
import { WaveDivider } from "@/components/ui";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type Category =
  | "All"
  | "Scientific"
  | "Generators"
  | "Professional"
  | "AI"
  | "Utilities"
  | "Games"
  | "External";

type Accent = "quantum" | "olive" | "crimson";

interface App {
  id: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  category: Category;
  accent: Accent;
  tags: string[];
  mine: boolean;
  featured?: boolean;
  links: { label: string; href: string }[];
}

/* ─── Real Data ───────────────────────────────────────────────────────────── */
const APPS: App[] = [
  /* ── Scientific ──────────────────────────────────── */
  {
    id: "fractal-explorer",
    title: "Fractal Explorer",
    desc: "Explore the Mandelbrot and Julia sets with multi-threaded Web Worker rendering, 12 colour palettes, infinite pan/zoom, undo history, and PNG export.",
    icon: Infinity,
    category: "Scientific",
    accent: "quantum",
    tags: ["Fractal", "Mandelbrot", "Julia", "Mathematics", "Visualizer"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/fractal-explorer" }],
  },
  {
    id: "particle-physics-visualizer",
    title: "Particle Physics Visualizer",
    desc: "Explore the fundamental building blocks of the universe — Standard Model, Supersymmetry, and Hadrons. Search, filter, and sort 49 particles by mass, charge, spin, and family.",
    icon: Atom,
    category: "Scientific",
    accent: "quantum",
    featured: true,
    tags: ["Physics", "Standard Model", "Particles", "Science", "Visualizer"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/particle-physics" }],
  },
  {
    id: "interactive-periodic-table",
    title: "Interactive Periodic Table",
    desc: "Explore all 118 elements with an interactive periodic table. Click any element for detailed properties, Bohr model, electron configuration, ionization energies, and more. Search and filter by category.",
    icon: LayoutGrid,
    category: "Scientific",
    accent: "quantum",
    featured: true,
    tags: ["Chemistry", "Elements", "Interactive", "Education", "Science"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/periodic-table" }],
  },

  {
    id: "feynman-diagram-generator",
    title: "Feynman Diagram Generator",
    desc: "A tool for creating Feynman diagrams easily and intuitively. Export your diagrams directly as TikZ LaTeX code for use in papers, or as high-quality SVGs.",
    icon: GitFork,
    category: "Scientific",
    accent: "quantum",
    featured: true,
    tags: ["Physics", "QFT", "LaTeX", "SVG", "Diagrams"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/feynman-diagram" }],
  },


  /* ── Generators ──────────────────────────────────── */
  {
    id: "fibonacci-generator",
    title: "Fibonacci Generator",
    desc: "Generate Fibonacci sequences of arbitrary size using BigInt arithmetic. Download the full sequence or just the Nth number as a JSON file.",
    icon: Hash,
    category: "Generators",
    accent: "olive",
    tags: ["Fibonacci", "Mathematics", "JSON", "Generator"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/fibonacci" }],
  },
  {
    id: "prime-generator",
    title: "Prime Sequence Generator",
    desc: "Generate the first n prime numbers using an optimised sieve. Preview results in-browser and download the full sequence as a JSON file.",
    icon: Zap,
    category: "Generators",
    accent: "olive",
    tags: ["Primes", "Mathematics", "JSON", "Generator"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/prime" }],
  },

  /* ── Professional ────────────────────────────────── */
  {
    id: "website-builder-pro",
    title: "Website Builder Pro",
    desc: "A full-featured visual website builder: drag-and-drop sections, rich text editing, 10 pre-built components, multi-page support, theme customization, asset management, and one-click ZIP export.",
    icon: Braces,
    category: "Professional",
    accent: "quantum",
    featured: true,
    tags: ["Web Dev", "No-Code", "Professional", "Builder", "WYSIWYG"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/website-builder" }],
  },

  /* ── AI ──────────────────────────────────────────── */
  {
    id: "ai-chatbot",
    title: "AI Chatbot",
    desc: "Multi-model AI chatbot with 25+ LLMs: reasoning, coding, vision, and Pixazo AI image generation. Full chat history, markdown rendering, and HTML export.",
    icon: Bot,
    category: "AI",
    accent: "crimson",
    featured: true,
    tags: ["AI", "LLM", "Chatbot", "Multi-modal", "Vision", "Image Gen"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/ai-chatbot" }],
  },

  /* ── Utilities ───────────────────────────────────── */
  {
    id: "plagiarism-checker",
    title: "Plagiarism Checker",
    desc: "Check your text for potential plagiarism and ensure originality. Advanced analysis to identify similar passages and flag suspicious content.",
    icon: Search,
    category: "Utilities",
    accent: "olive",
    tags: ["Text Analysis", "Writing", "Academic", "NLP"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/plagiarism" }],
  },
  {
    id: "unicode-explorer",
    title: "Unicode Explorer",
    desc: "Explore and visualise Unicode characters and their properties. Search the full Unicode library covering all scripts, symbols, and emoji.",
    icon: BookOpen,
    category: "Utilities",
    accent: "quantum",
    tags: ["Unicode", "Characters", "Typography", "Database"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/unicode" }],
  },
  {
    id: "pdf-tools",
    title: "PDF Tools",
    desc: "Your all-in-one tool for PDF and image conversion. Extract pages, convert image to PDF or PDF to image, and merge multiple PDF documents.",
    icon: Download,
    category: "Utilities",
    accent: "olive",
    tags: ["PDF", "Converter", "Images", "Documents"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/pdf-tools" }],
  },
  {
    id: "base64-converter",
    title: "Multimedia Base64 Converter",
    desc: "Encode files to Base64 and decode Base64 strings back to files. Supports all common multimedia formats with drag-and-drop interface.",
    icon: Shuffle,
    category: "Utilities",
    accent: "olive",
    tags: ["Encoding", "Base64", "Files", "Converter"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/base64" }],
  },
  {
    id: "unicode-font-generator",
    title: "Unicode Font Generator",
    desc: "Generate text in various Unicode font styles — bold, italic, script, fraktur, monospace, and more. Works across all platforms and copy-paste ready.",
    icon: Type,
    category: "Utilities",
    accent: "quantum",
    tags: ["Unicode", "Typography", "Fonts", "Text"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/font-generator" }],
  },
  {
    id: "qr-code-generator",
    title: "QR Code Generator",
    desc: "Generate QR codes easily and quickly with full customisation — size, colours, error-correction level, and download in multiple formats.",
    icon: QrCode,
    category: "Utilities",
    accent: "olive",
    tags: ["QR Code", "Generator", "Utility", "Encoding"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/qr-generator" }],
  },
  {
    id: "graphing-calculator",
    title: "Graphing Calculator",
    desc: "Plot explicit and implicit equations on a real-time SVG canvas. Pan, zoom, toggle the grid, add unlimited equations with custom colours, and export as PNG or SVG.",
    icon: TrendingUp,
    category: "Utilities",
    accent: "quantum",
    tags: ["Graphing", "Mathematics", "Calculator", "Equations", "Visualizer"],
    mine: true,
    links: [{ label: "Open App", href: "/apps/graphing-calculator" }],
  },

  /* ── Games ───────────────────────────────────────── */
  {
    id: "2048-tile",
    title: "2048 Tile",
    desc: "Slide numbered tiles on the grid to combine them and create a tile with the number 2048. A classic puzzle that tests spatial reasoning.",
    icon: Gamepad2,
    category: "Games",
    accent: "crimson",
    tags: ["Game", "Puzzle", "Mathematics", "Casual"],
    mine: true,
    links: [{ label: "Play", href: "/apps/2048" }],
  },
  {
    id: "celestial-chess",
    title: "Celestial Chess",
    desc: "A strategic chess game set in a beautiful celestial theme. Full rules engine with all standard moves, castling, en passant, and promotion.",
    icon: Crown,
    category: "Games",
    accent: "quantum",
    featured: true,
    tags: ["Chess", "Game", "Strategy", "Celestial"],
    mine: true,
    links: [{ label: "Play", href: "/apps/chess" }],
  },

  /* ── External ─────────────────────────────────────── */
  {
    id: "celestia",
    title: "Celestia",
    desc: "Real-time 3D space simulation by the Celestia Development Team. Explore the universe in three dimensions at any point in space and time. Screened and embedded for convenience — not affiliated with this site.",
    icon: Globe,
    category: "External",
    accent: "quantum",
    tags: ["Astronomy", "3D", "Simulation", "Space", "External"],
    mine: false,
    links: [
      { label: "Launch", href: "/apps/celestia" },
      { label: "Project Site", href: "https://celestiaproject.space/" },
    ],
  },
  {
    id: "stellarium",
    title: "Stellarium",
    desc: "Open-source web planetarium by the Stellarium Team. Renders a realistic sky in 3D — stars, constellations, planets and deep-sky objects. Screened and embedded for convenience — not affiliated with this site.",
    icon: Star,
    category: "External",
    accent: "olive",
    tags: ["Astronomy", "Planetarium", "Sky", "Open Source", "External"],
    mine: false,
    links: [
      { label: "Launch", href: "/apps/stellarium" },
      { label: "Project Site", href: "https://stellarium.org/" },
    ],
  },
];

/* ─── Category config ─────────────────────────────────────────────────────── */
const CATEGORIES: { label: Category; emoji: string; desc: string }[] = [
  { label: "All", emoji: "⚛️", desc: `All ${APPS.length} projects` },
  { label: "Scientific", emoji: "🔬", desc: "Physics, maths & science tools" },
  { label: "Generators", emoji: "♾️", desc: "Mathematical sequence generators" },
  { label: "Professional", emoji: "💼", desc: "Professional-grade builders" },
  { label: "AI", emoji: "🤖", desc: "AI-powered applications" },
  { label: "Utilities", emoji: "🔧", desc: "Practical everyday tools" },
  { label: "Games", emoji: "🎮", desc: "Interactive games & puzzles" },
  { label: "External", emoji: "🌐", desc: "Third-party projects I recommend" },
];

/* ─── App Card ────────────────────────────────────────────────────────────── */
const ACCENT = {
  quantum: {
    border: "hover:border-quantum/40 hover:shadow-[0_0_28px_rgba(0,195,245,0.13)]",
    icon: "bg-quantum/12  text-quantum",
    link: "bg-quantum/12 text-quantum hover:bg-quantum/22 border-quantum/20",
    glow: "bg-quantum/20",
    tag: "bg-quantum/10 text-quantum border-quantum/20",
  },
  olive: {
    border: "hover:border-olive/40 hover:shadow-[0_0_28px_rgba(107,143,39,0.11)]",
    icon: "bg-olive/12    text-olive-400",
    link: "bg-olive/12 text-olive-400 hover:bg-olive/22 border-olive/20",
    glow: "bg-olive/15",
    tag: "bg-olive/10 text-olive-400 border-olive/20",
  },
  crimson: {
    border: "hover:border-crimson/40 hover:shadow-[0_0_28px_rgba(220,20,60,0.11)]",
    icon: "bg-crimson/12  text-crimson",
    link: "bg-crimson/12 text-crimson hover:bg-crimson/22 border-crimson/20",
    glow: "bg-crimson/15",
    tag: "bg-crimson/10 text-crimson border-crimson/20",
  },
};

function AppCard({ app, index }: { app: App; index: number }) {
  const Icon = app.icon;
  const ac = ACCENT[app.accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.055, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -6 }}
      className={`glass-card border border-white/6 p-5 flex flex-col h-full transition-all duration-300 ${ac.border} relative overflow-hidden group`}
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
        {app.featured && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-quantum/12 text-quantum border border-quantum/20 uppercase tracking-widest">
            Featured
          </span>
        )}
        {!app.mine && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/6 text-foreground/35 border border-white/10 uppercase tracking-widest">
            External
          </span>
        )}
      </div>

      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl ${ac.icon} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={22} />
      </div>

      {/* Category label */}
      <div className={`text-[10px] font-mono uppercase tracking-widest mb-1.5 ${ac.icon.split(" ")[1]}`}>
        {app.category}
      </div>

      {/* Title & desc */}
      <h3 className="font-semibold text-sm leading-snug mb-2">{app.title}</h3>
      <p className="text-xs text-foreground/45 leading-relaxed flex-1 mb-4">{app.desc}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-4">
        {app.tags.slice(0, 3).map((t) => (
          <span key={t} className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${ac.tag}`}>
            {t}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {app.links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all duration-200 ${l.label === "Open App" || l.label === "Play"
              ? ac.link
              : "bg-white/5 text-foreground/40 hover:text-foreground/70 hover:bg-white/8 border-white/8"
              }`}
          >
            <ExternalLink size={10} />
            {l.label}
          </a>
        ))}
      </div>

      {/* Glow corner */}
      <div className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${ac.glow}`} />
    </motion.div>
  );
}

/* ─── List row ────────────────────────────────────────────────────────────── */
function AppRow({ app, index }: { app: App; index: number }) {
  const Icon = app.icon;
  const ac = ACCENT[app.accent];

  return (
    <motion.div
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className={`glass-card border border-white/6 p-4 transition-all duration-300 ${ac.border}`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl ${ac.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{app.title}</span>
              {!app.mine && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 text-foreground/30 border border-white/8">External</span>
              )}
            </div>
            <span className={`text-[10px] font-mono uppercase ${ac.icon.split(" ")[1]}`}>{app.category}</span>
          </div>
          <p className="text-xs text-foreground/45 mb-2 line-clamp-1">{app.desc}</p>
          <div className="flex flex-wrap gap-1">
            {app.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/5 text-foreground/30 border border-white/8">{t}</span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0">
          <a
            href={app.links[0].href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${ac.link}`}
          >
            <ExternalLink size={10} /> {app.links[0].label}
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function AppsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  const filtered = APPS.filter((a) => {
    const matchCat = category === "All" || a.category === category;
    const matchSearch = !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.desc.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const featured = APPS.filter((a) => a.featured && (category === "All" || a.category === category));

  return (
    <div className="min-h-screen keffiyeh-bg">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[100px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/5 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Applications
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Apps & Tools</span>
          </h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">
            A collection of web applications spanning physics visualisation, mathematics, AI, utilities,
            and games. All accessible directly in the browser — no installation required.
          </p>

          {/* Aggregate stats */}
          <div className="flex flex-wrap gap-6 mt-5">
            {[
              { label: `${APPS.filter((a) => a.mine).length} own apps` },
              { label: `${APPS.filter((a) => !a.mine).length} recommended` },
              { label: `${APPS.filter((a) => a.featured).length} featured` },
              { label: "100% browser-based" },
            ].map(({ label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-foreground/40">
                <Sparkles size={12} className="text-quantum/50" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Category tabs ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {CATEGORIES.map((cat) => {
            const count = cat.label === "All" ? APPS.length : APPS.filter((a) => a.category === cat.label).length;
            const active = category === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setCategory(cat.label)}
                className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-xl border transition-all duration-200 ${active
                  ? "bg-quantum/15 text-quantum border-quantum/35 shadow-[0_0_15px_rgba(0,195,245,0.12)]"
                  : "border-white/8 text-foreground/40 hover:border-white/18 hover:text-foreground/65"
                  }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className={`text-[10px] opacity-60 ${active ? "text-quantum" : ""}`}>({count})</span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Search + view toggle ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3 mb-8"
        >
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
            <input
              type="text"
              placeholder="Search apps, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/8 bg-transparent text-sm text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 glass rounded-xl p-1 border border-white/8">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`p-2 rounded-lg transition-all duration-200 ${view === v ? "bg-quantum/20 text-quantum" : "text-foreground/40 hover:text-foreground/70"}`}
                aria-label={v === "grid" ? "Grid view" : "List view"}
              >
                {v === "grid" ? <LayoutGrid size={15} /> : <LayoutList size={15} />}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Results count ─────────────────────────────────────────────── */}
        <div className="text-xs font-mono text-foreground/30 mb-6 flex items-center gap-3">
          <Filter size={11} className="text-foreground/20" />
          Showing {filtered.length} of {APPS.length} apps
          {(search || category !== "All") && (
            <button
              onClick={() => { setSearch(""); setCategory("All"); }}
              className="text-quantum/60 hover:text-quantum underline transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <WaveDivider variant="quantum" />

        {/* ── Featured row (only when "All" category & no search) ────────── */}
        <AnimatePresence mode="wait">
          {category === "All" && !search && featured.length > 0 && (
            <motion.div
              key="featured"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-12"
            >
              <div className="text-xs font-mono text-foreground/30 uppercase tracking-widest mb-5">
                // Featured
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {featured.map((app, i) => (
                  <AppCard key={app.id} app={app} index={i} />
                ))}
              </div>
              <WaveDivider variant="olive" />
              <div className="text-xs font-mono text-foreground/30 uppercase tracking-widest mb-5">
                // All Applications
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main grid / list ──────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 text-foreground/30 font-mono"
            >
              <Atom size={40} className="mx-auto mb-4 text-foreground/15" />
              <p>No apps match your query.</p>
              <p className="text-xs mt-1">The wavefunction collapsed — try different parameters.</p>
            </motion.div>
          ) : (
            <motion.div
              key={`${view}-${category}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" : "flex flex-col gap-3"}
            >
              {filtered.map((app, i) =>
                view === "grid"
                  ? <AppCard key={app.id} app={app} index={i} />
                  : <AppRow key={app.id} app={app} index={i} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer note ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-xs font-mono text-foreground/20">
            All apps run directly in the browser — no installation required.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
