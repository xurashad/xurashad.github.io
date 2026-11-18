"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, X, ArrowRight, Compass, Atom, BookOpen, Database,
  FileText, User, Sun, Moon, Download, CornerDownLeft,
} from "lucide-react";

type ItemGroup = "Actions" | "Pages" | "Apps" | "Blog" | "Datasets" | "Documents" | "CV";

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  group: ItemGroup;
  keywords: string;
  href?: string;
  download?: string;
  action?: () => void;
}

const PAGES_AND_CONTENT: Omit<PaletteItem, "action">[] = [
  // Pages
  { id: "page-home", title: "Home", subtitle: "Portfolio & research overview", group: "Pages", keywords: "home hero physics quantum", href: "/" },
  { id: "page-apps", title: "Apps & Tools", subtitle: "23 interactive browser applications", group: "Pages", keywords: "apps tools lab software interactive", href: "/apps" },
  { id: "page-datasets", title: "Datasets", subtitle: "Open scientific datasets (CC0)", group: "Pages", keywords: "datasets data json primes particles elements", href: "/datasets" },
  { id: "page-blog", title: "Blog", subtitle: "Long-form physics, cosmology & mental model essays", group: "Pages", keywords: "blog articles essays writing", href: "/blog" },
  { id: "page-documents", title: "Documents", subtitle: "Mathematica notebooks & academic papers", group: "Pages", keywords: "documents mathematica notebooks pdf papers", href: "/documents" },
  { id: "page-art", title: "Art Gallery", subtitle: "AI-generated visual artwork and music", group: "Pages", keywords: "art gallery images music ai", href: "/art" },
  { id: "page-art-images", title: "AI Image Generations", subtitle: "Curated diffusion & generative visual gallery", group: "Pages", keywords: "art ai images gallery prompts", href: "/art/ai-images" },
  { id: "page-art-music", title: "AI Music Generations", subtitle: "Levantine & Celtic ambient compositions", group: "Pages", keywords: "art ai music audio tracks", href: "/art/ai-music" },
  { id: "page-cv", title: "Curriculum Vitae", subtitle: "Academic profile, publications, talks & coursework", group: "Pages", keywords: "cv resume durham publications education", href: "/cv" },
  { id: "page-contact", title: "Contact", subtitle: "Collaborations, postdoc & direct channels", group: "Pages", keywords: "contact email github linkedin message", href: "/contact" },

  // Apps (all 23)
  { id: "app-fractal", title: "Fractal Explorer", subtitle: "Mandelbrot & Julia sets with Web Workers", group: "Apps", keywords: "fractal mandelbrot julia math visualizer", href: "/apps/fractal-explorer" },
  { id: "app-particle", title: "Particle Physics Visualizer", subtitle: "Standard Model, SUSY & 49 particles", group: "Apps", keywords: "particle physics standard model susy", href: "/apps/particle-physics" },
  { id: "app-periodic", title: "Interactive Periodic Table", subtitle: "118 elements, Bohr models & configurations", group: "Apps", keywords: "periodic table chemistry elements", href: "/apps/periodic-table" },
  { id: "app-feynman", title: "Feynman Diagram Generator", subtitle: "QFT diagrams with TikZ LaTeX & SVG export", group: "Apps", keywords: "feynman diagram qft latex tikz svg", href: "/apps/feynman-diagram" },
  { id: "app-earth", title: "Earth Explorer", subtitle: "Interactive 3D globe via CesiumJS", group: "Apps", keywords: "earth globe 3d cesium maps", href: "/apps/earth-explorer" },
  { id: "app-fibonacci", title: "Fibonacci Generator", subtitle: "Arbitrary-precision BigInt sequences", group: "Apps", keywords: "fibonacci sequence bigint math json", href: "/apps/fibonacci" },
  { id: "app-prime", title: "Prime Sequence Generator", subtitle: "Optimised sieve prime generator", group: "Apps", keywords: "prime numbers sieve math json", href: "/apps/prime" },
  { id: "app-wb", title: "Website Builder Pro", subtitle: "Visual drag-and-drop builder & ZIP export", group: "Apps", keywords: "website builder wysiwyg no code html", href: "/apps/website-builder" },
  { id: "app-img-edit", title: "Image Editor", subtitle: "Client-side crop, filters, adjustments & drawing", group: "Apps", keywords: "image editor photo filters crop canvas", href: "/apps/image-editor" },
  { id: "app-imgen", title: "ArtForge AI Image Generator", subtitle: "25+ styles & multi-model text-to-image", group: "Apps", keywords: "ai image generator artforge pollinations", href: "/apps/imgen" },
  { id: "app-chat", title: "AI Chatbot", subtitle: "20+ LLMs, reasoning, vision & markdown", group: "Apps", keywords: "ai chatbot llm coding reasoning", href: "/apps/ai-chatbot" },
  { id: "app-jummal", title: "Hisab Al-Jummal (حساب الجُمَّل)", subtitle: "Arabic Abjad gematria & chronogram solver", group: "Apps", keywords: "hisab jummal arabic abjad gematria", href: "/apps/hisab-jummal" },
  { id: "app-plag", title: "Plagiarism Checker", subtitle: "Text similarity & originality analysis", group: "Apps", keywords: "plagiarism checker nlp text academic", href: "/apps/plagiarism" },
  { id: "app-unicode", title: "Unicode Explorer", subtitle: "Browse all scripts, symbols & emoji", group: "Apps", keywords: "unicode explorer characters symbols", href: "/apps/unicode" },
  { id: "app-pdf", title: "PDF Tools", subtitle: "Extract, merge & convert PDF/images", group: "Apps", keywords: "pdf tools merge extract converter", href: "/apps/pdf-tools" },
  { id: "app-base64", title: "Multimedia Base64 Converter", subtitle: "Encode & decode multimedia Base64", group: "Apps", keywords: "base64 encoder decoder files", href: "/apps/base64" },
  { id: "app-font", title: "Unicode Font Generator", subtitle: "Bold, italic, script, fraktur & monospace", group: "Apps", keywords: "unicode font generator typography", href: "/apps/font-generator" },
  { id: "app-qr", title: "QR Code Generator", subtitle: "Customisable QR codes & error correction", group: "Apps", keywords: "qr code generator", href: "/apps/qr-generator" },
  { id: "app-graph", title: "Graphing Calculator", subtitle: "Real-time explicit & implicit SVG plotter", group: "Apps", keywords: "graphing calculator plot equations math", href: "/apps/graphing-calculator" },
  { id: "app-2048", title: "2048 Tile", subtitle: "Classic sliding tile math puzzle", group: "Apps", keywords: "2048 game puzzle", href: "/apps/2048" },
  { id: "app-chess", title: "Celestial Chess", subtitle: "2D/3D chess with full rules & AI", group: "Apps", keywords: "chess game 3d strategy", href: "/apps/chess" },
  { id: "app-celestia", title: "Celestia", subtitle: "3D space simulation (external viewer)", group: "Apps", keywords: "celestia astronomy 3d space", href: "/apps/celestia" },
  { id: "app-stellarium", title: "Stellarium", subtitle: "Web planetarium & night sky (external viewer)", group: "Apps", keywords: "stellarium planetarium stars sky", href: "/apps/stellarium" },

  // Blog posts
  { id: "blog-reading", title: "The Theoretical Physicist's Roadmap", subtitle: "Recommended books & papers across physics domains", group: "Blog", keywords: "reading list books papers cft integrability gr susy", href: "/blog/recommended-physics-reading-list" },
  { id: "blog-scale", title: "From Planck to the Cosmic Web", subtitle: "62 orders of magnitude from quantum foam to multiverse", group: "Blog", keywords: "scale universe planck cosmic web cosmology", href: "/blog/scale-of-the-universe" },
  { id: "blog-calendar", title: "The Cosmic Calendar", subtitle: "13.8 billion years compressed into one cosmic year", group: "Blog", keywords: "cosmic calendar carl sagan cosmology timeline", href: "/blog/the-cosmic-calendar" },
  { id: "blog-toolkit", title: "The Physicist's Toolkit: 7 Sanity Checks", subtitle: "Dimensional analysis, limits, Noether & toy models", group: "Blog", keywords: "physicist toolkit sanity checks mental models limits", href: "/blog/physicists-toolkit-sanity-checks" },

  // Datasets
  { id: "ds-particles", title: "Fundamental & Supersymmetric Particles", subtitle: "61 particles · 24 SUSY partners (JSON, CC0)", group: "Datasets", keywords: "dataset particles susy physics json", href: "/datasets" },
  { id: "ds-primes", title: "First 1M Prime Numbers", subtitle: "1,000,000 primes up to 15,485,863 (JSON, CC0)", group: "Datasets", keywords: "dataset prime numbers mathematics json", href: "/datasets" },
  { id: "ds-elements", title: "Chemical Elements", subtitle: "118 periodic table elements & properties (JSON, CC0)", group: "Datasets", keywords: "dataset chemical elements chemistry periodic", href: "/datasets" },

  // Documents
  { id: "doc-defect", title: "Defect Sum (Mathematica)", subtitle: "Twist function zeros, poles, levels & defect sum", group: "Documents", keywords: "defect sum twist function integrability notebook", href: "/documents" },
  { id: "doc-twisted", title: "SU(2) Twisted η/λ Sigma Models", subtitle: "Lax matrix, Lagrangian & metric notebooks (JHEP 2025)", group: "Documents", keywords: "su2 eta lambda twisted sigma model jhep notebook", href: "/documents" },
  { id: "doc-metric", title: "General Relativity Metric Calculator", subtitle: "Christoffel, Riemann, Ricci & Einstein tensors (.nb)", group: "Documents", keywords: "metric general relativity tensors riemann notebook", href: "/documents" },
  { id: "doc-sun", title: "SU(N) Generators (Mathematica)", subtitle: "Fundamental representation, structure constants & d-coefficients", group: "Documents", keywords: "su n lie algebra generators notebook", href: "/documents" },
  { id: "doc-academic", title: "Academic Exams & Problem Sets", subtitle: "QED, QFT I/II, GR, Group Theory, Standard Model PDFs", group: "Documents", keywords: "academic homework exam qed qft gr standard model pdf", href: "/documents" },

  // CV sections
  { id: "cv-profile", title: "CV: Research Profile & Interests", subtitle: "Integrable sigma models, QFT & string theory", group: "CV", keywords: "cv profile research interests", href: "/cv#profile" },
  { id: "cv-education", title: "CV: Education & Degrees", subtitle: "PhD & MSc Durham University, BSc Birzeit University", group: "CV", keywords: "cv education phd msc bsc durham birzeit", href: "/cv#education" },
  { id: "cv-publications", title: "CV: Publications & Preprints", subtitle: "Twists of Trigonometric Sigma Models (JHEP 2025)", group: "CV", keywords: "cv publications jhep arxiv paper", href: "/cv#publications" },
  { id: "cv-experience", title: "CV: Experience & Teaching", subtitle: "7 physics & math modules taught at Durham", group: "CV", keywords: "cv teaching assistant durham experience", href: "/cv#experience" },
  { id: "cv-awards", title: "CV: Honours, Awards & Grants", subtitle: "UKRI STFC Studentship, Global Masters, Distinction", group: "CV", keywords: "cv awards grants stfc scholarship", href: "/cv#awards-grants" },
  { id: "cv-skills", title: "CV: Technical & Scientific Skills", subtitle: "Mathematica, Python, TypeScript, Next.js & physics", group: "CV", keywords: "cv skills technical python mathematica", href: "/cv#skills" },
  { id: "cv-referees", title: "CV: Academic Referees", subtitle: "Faculty contacts & references", group: "CV", keywords: "cv referees references contacts", href: "/cv#referees" },
];

const GROUP_ICON: Record<ItemGroup, typeof Compass> = {
  Actions: Sun,
  Pages: Compass,
  Apps: Atom,
  Blog: BookOpen,
  Datasets: Database,
  Documents: FileText,
  CV: User,
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

function CommandPaletteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items: PaletteItem[] = useMemo(() => {
    const isDark = resolvedTheme !== "light";
    const actionItems: PaletteItem[] = [
      {
        id: "action-theme",
        title: `Switch to ${isDark ? "Light" : "Dark"} Theme`,
        subtitle: "Toggle Celestial Mirage colour scheme",
        group: "Actions",
        keywords: "theme dark light mode toggle switch",
        action: () => setTheme(isDark ? "light" : "dark"),
      },
      {
        id: "action-cv-full",
        title: "Download Full CV (PDF)",
        subtitle: "Rashad_Hamidi_CV.pdf",
        group: "Actions",
        keywords: "download full cv pdf resume",
        href: "/documents/cv.pdf",
        download: "Rashad_Hamidi_CV.pdf",
      },
      {
        id: "action-cv-short",
        title: "Download Short CV (PDF)",
        subtitle: "Rashad_Hamidi_CV_Short.pdf",
        group: "Actions",
        keywords: "download short concise cv pdf",
        href: "/documents/cv-short.pdf",
        download: "Rashad_Hamidi_CV_Short.pdf",
      },
    ];
    return [...actionItems, ...PAGES_AND_CONTENT];
  }, [resolvedTheme, setTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const terms = q.split(/\s+/);
    return items.filter((item) => {
      const hay = `${item.title} ${item.subtitle} ${item.group} ${item.keywords}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [items, query]);

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector<HTMLElement>(`[data-palette-index="${selectedIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const executeItem = useCallback(
    (item: PaletteItem) => {
      onClose();
      if (item.action) {
        item.action();
        return;
      }
      if (item.download && item.href) {
        const a = document.createElement("a");
        a.href = item.href;
        a.download = item.download;
        a.click();
        return;
      }
      if (item.href) {
        router.push(item.href);
      }
    },
    [onClose, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = filtered[selectedIndex];
        if (target) executeItem(target);
      }
    },
    [filtered, selectedIndex, executeItem, onClose]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -12 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Quantum Command Palette"
        className="relative z-10 w-full max-w-2xl glass-card border border-nebula/30 dark:border-quantum/25 shadow-2xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-foreground/10 dark:border-white/10">
          <Search size={17} className="text-quantum flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search apps, essays, datasets, CV sections, or actions..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/35 focus:outline-none font-sans"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelectedIndex(0);
              }}
              className="p-1 text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-mono px-2 py-1 rounded-md bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 text-foreground/50 hover:text-foreground cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[58vh] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-foreground/40">
              No matching destinations or actions for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === selectedIndex;
              const GroupIcon =
                item.id === "action-theme"
                  ? resolvedTheme !== "light"
                    ? Sun
                    : Moon
                  : item.download
                    ? Download
                    : GROUP_ICON[item.group];

              return (
                <button
                  key={item.id}
                  type="button"
                  data-palette-index={idx}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => executeItem(item)}
                  className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                    active
                      ? "bg-quantum/15 border border-quantum/35"
                      : "border border-transparent hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      active
                        ? "bg-quantum/20 text-quantum"
                        : "bg-white/5 text-foreground/50"
                    }`}
                  >
                    <GroupIcon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-foreground/45 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-foreground/45 flex-shrink-0">
                    {item.group}
                  </span>
                  {active && (
                    <ArrowRight size={13} className="text-quantum flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2.5 border-t border-foreground/10 dark:border-white/8 bg-foreground/[0.04] dark:bg-black/20 flex items-center justify-between text-[11px] font-mono text-foreground/45">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft size={11} /> Open
            </span>
          </div>
          <span>{filtered.length} results</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  return (
    <AnimatePresence>
      {open && <CommandPaletteDialog onClose={onClose} />}
    </AnimatePresence>
  );
}
