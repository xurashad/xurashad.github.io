"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Atom, Hash, FlaskConical,
  Download, ExternalLink, Search,
  LayoutGrid, Table2, Code2,
  FileJson, Eye, Star,
} from "lucide-react";
import { WaveDivider } from "@/components/ui";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type DCategory = "All" | "Physics" | "Mathematics" | "Chemistry";
type DFormat   = "JSON" | "CSV" | "Python";
type DLicense  = "CC0" | "CC-BY 4.0" | "MIT";

interface DatasetLink { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; href: string }
interface Dataset {
  id:       string;
  title:    string;
  desc:     string;
  fields?:  string[];
  icon:     React.ComponentType<{ size?: number; className?: string }>;
  category: Exclude<DCategory, "All">;
  format:   DFormat[];
  license:  DLicense;
  records:  string;
  size:     string;
  accent:   "quantum" | "olive" | "crimson";
  links:    DatasetLink[];
  featured?: boolean;
}

/* ─── Real Data ───────────────────────────────────────────────────────────── */
const DATASETS: Dataset[] = [
  /* ── Physics ── */
  {
    id:       "particles",
    title:    "Fundamental & Supersymmetric Particles",
    desc:     "A dataset containing information about fundamental particles and their supersymmetric counterparts. Covers the Standard Model particle zoo alongside their SUSY partners — squarks, sleptons, gauginos, and more.",
    fields:   [
      "name", "symbol", "type", "mass", "charge", "spin",
      "susy_partner", "susy_mass", "lifetime", "discovery_year",
    ],
    icon:     Atom,
    category: "Physics",
    format:   ["JSON"],
    license:  "CC0",
    records:  "61 particles · 24 SUSY partners",
    size:     "~42 KB",
    accent:   "quantum",
    featured: true,
    links: [
      { label: "Download", icon: Download,     href: "/datasets/particle_physics.json" },
      { label: "View",     icon: Eye,          href: "/datasets/particle_physics.json" },
    ],
  },

  /* ── Mathematics ── */
  {
    id:       "primes-1m",
    title:    "First 1M Prime Numbers",
    desc:     "A dataset of the first 1,000,000 prime numbers, from 2 to 15,485,863. Generated via an optimised Sieve of Eratosthenes. Useful for number theory research, cryptography benchmarks, and machine learning experiments.",
    icon:     Hash,
    category: "Mathematics",
    format:   ["JSON", "Python"],
    license:  "CC0",
    records:  "1,000,000 primes",
    size:     "~8.2 MB",
    accent:   "olive",
    featured: true,
    links: [
      { label: "Download",  icon: Download, href: "/datasets/prime_numbers.json"   },
      { label: "View",      icon: Eye,      href: "/datasets/prime_numbers.json"   },
      { label: "Code (.py)",icon: Code2,    href: "/apps/prime.html"                   },
    ],
  },

  /* ── Chemistry ── */
  {
    id:       "elements",
    title:    "Chemical Elements",
    desc:     "A comprehensive dataset of all chemical elements in the periodic table. Each entry includes physical properties, thermodynamic constants, electron configuration, and a Bohr model image.",
    fields:   [
      "name", "symbol", "number", "atomic_mass", "category", "period", "group",
      "phase", "density", "melt", "boil", "discovery", "summary",
      "electron_configuration", "electron_affinity", "electronegativity_pauling",
      "ionization_energies", "shells", "xpos", "ypos", "bohr_model_image",
    ],
    icon:     FlaskConical,
    category: "Chemistry",
    format:   ["JSON"],
    license:  "CC0",
    records:  "118 elements",
    size:     "~1.1 MB",
    accent:   "crimson",
    featured: true,
    links: [
      { label: "Download", icon: Download,     href: "/datasets/chemical_elements.json" },
      { label: "View",     icon: Eye,          href: "/datasets/chemical_elements.json" },
    ],
  },
];

/* ─── Category config ─────────────────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<Exclude<DCategory, "All">, { icon: typeof Atom; color: string; bg: string; border: string }> = {
  Physics:     { icon: Atom,         color: "text-quantum",    bg: "bg-quantum/12",  border: "border-quantum/30"  },
  Mathematics: { icon: Hash,         color: "text-olive-400",  bg: "bg-olive/12",    border: "border-olive/30"    },
  Chemistry:   { icon: FlaskConical, color: "text-crimson",    bg: "bg-crimson/12",  border: "border-crimson/30"  },
};

const FORMAT_BADGE: Record<DFormat, string> = {
  JSON:   "bg-quantum/12   text-quantum   border-quantum/25",
  CSV:    "bg-emerald-500/12 text-emerald-400 border-emerald-500/25",
  Python: "bg-yellow-500/12 text-yellow-400  border-yellow-500/25",
};

const LICENSE_COLOR: Record<DLicense, string> = {
  "CC0":       "text-emerald-400",
  "CC-BY 4.0": "text-quantum",
  "MIT":       "text-yellow-400",
};

/* ─── Dataset Card ────────────────────────────────────────────────────────── */
function DatasetCard({ dataset, index }: { dataset: Dataset; index: number }) {
  const Icon = dataset.icon;
  const cfg  = CATEGORY_CONFIG[dataset.category];
  const ac   = {
    quantum: "hover:border-quantum/40 hover:shadow-[0_0_28px_rgba(0,195,245,0.13)]",
    olive:   "hover:border-olive/40   hover:shadow-[0_0_28px_rgba(107,143,39,0.11)]",
    crimson: "hover:border-crimson/40 hover:shadow-[0_0_28px_rgba(220,20,60,0.11)]",
  }[dataset.accent];
  const glow = { quantum: "bg-quantum/20", olive: "bg-olive/15", crimson: "bg-crimson/15" }[dataset.accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -5 }}
      className={`glass-card border border-white/6 p-6 flex flex-col h-full relative overflow-hidden group transition-all duration-300 ${ac}`}
    >
      {/* Featured badge */}
      {dataset.featured && (
        <div className="absolute top-4 right-4">
          <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-quantum/12 text-quantum border border-quantum/20 uppercase tracking-widest">
            <Star size={8} /> Featured
          </span>
        </div>
      )}

      {/* Icon + category */}
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-12 h-12 rounded-xl ${cfg.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} className={cfg.color} />
        </div>
        <div>
          <span className={`text-[10px] font-mono uppercase tracking-widest ${cfg.color}`}>{dataset.category}</span>
          <div className="flex gap-1 mt-1">
            {dataset.format.map((f) => (
              <span key={f} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${FORMAT_BADGE[f]}`}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-base leading-snug mb-3">{dataset.title}</h3>

      {/* Description */}
      <p className="text-xs text-foreground/50 leading-relaxed flex-1 mb-4">{dataset.desc}</p>

      {/* Fields list */}
      {dataset.fields && (
        <div className="mb-4">
          <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-2">Fields</div>
          <div className="flex flex-wrap gap-1">
            {dataset.fields.map((f) => (
              <span key={f} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/4 text-foreground/30 border border-white/6">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metadata row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 mb-5 text-[11px] font-mono">
        <span className="text-foreground/35"><span className="text-foreground/20">Records:</span> {dataset.records}</span>
        <span className="text-foreground/35"><span className="text-foreground/20">Size:</span> {dataset.size}</span>
        <span className={`${LICENSE_COLOR[dataset.license]}`}>{dataset.license}</span>
      </div>

      {/* Action links */}
      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5">
        {dataset.links.map((l) => {
          const LIcon = l.icon;
          const isPrimary = l.label === "Download";
          return (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                isPrimary
                  ? `${cfg.bg} ${cfg.color} ${cfg.border} hover:opacity-80`
                  : "bg-white/5 text-foreground/45 border-white/8 hover:text-foreground/75 hover:bg-white/8"
              }`}
            >
              <LIcon size={11} />
              {l.label}
            </a>
          );
        })}
      </div>

      {/* Glow */}
      <div className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${glow}`} />
    </motion.div>
  );
}

/* ─── Dataset Table Row ───────────────────────────────────────────────────── */
function DatasetRow({ dataset, index }: { dataset: Dataset; index: number }) {
  const Icon = dataset.icon;
  const cfg  = CATEGORY_CONFIG[dataset.category];

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="border-b border-white/5 hover:bg-white/2 transition-colors group"
    >
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon size={15} className={cfg.color} />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground/85 group-hover:text-foreground transition-colors">
              {dataset.title}
            </div>
            <div className="text-xs text-foreground/30 mt-0.5 font-mono">{dataset.records}</div>
          </div>
        </div>
      </td>
      <td className="py-4 pr-4 hidden sm:table-cell">
        <span className={`text-xs font-mono ${cfg.color}`}>{dataset.category}</span>
      </td>
      <td className="py-4 pr-4 hidden md:table-cell">
        <div className="flex gap-1">
          {dataset.format.map((f) => (
            <span key={f} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${FORMAT_BADGE[f]}`}>{f}</span>
          ))}
        </div>
      </td>
      <td className="py-4 pr-4 hidden lg:table-cell">
        <span className="text-xs font-mono text-foreground/40">{dataset.size}</span>
      </td>
      <td className="py-4 pr-4 hidden lg:table-cell">
        <span className={`text-xs font-mono ${LICENSE_COLOR[dataset.license]}`}>{dataset.license}</span>
      </td>
      <td className="py-4">
        <div className="flex gap-2">
          {dataset.links.map((l) => {
            const LIcon = l.icon;
            return (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all border ${
                  l.label === "Download"
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : "bg-white/5 text-foreground/40 border-white/8 hover:text-foreground/65"
                }`}
              >
                <LIcon size={10} />
                <span className="hidden sm:inline">{l.label}</span>
              </a>
            );
          })}
        </div>
      </td>
    </motion.tr>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function DatasetsPage() {
  const [view,     setView]     = useState<"grid" | "table">("grid");
  const [category, setCategory] = useState<DCategory>("All");
  const [search,   setSearch]   = useState("");

  const filtered = DATASETS.filter((d) => {
    const matchCat    = category === "All" || d.category === category;
    const matchSearch = !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.desc.toLowerCase().includes(search.toLowerCase()) ||
      (d.fields ?? []).some((f) => f.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const totalRecordsLabel = "1M+ data points";

  return (
    <div className="min-h-screen keffiyeh-bg">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-quantum/3 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-olive/4 blur-[120px]" />
        <div className="absolute top-2/3 left-2/3 w-64 h-64 rounded-full bg-crimson/3 blur-[100px]" />
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
            // Open Research Data
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Datasets</span>
          </h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">
            A collection of curated open datasets spanning physics, mathematics, and chemistry.
            All freely available under open licenses — science belongs to everyone.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { icon: Atom,         label: "3 Datasets"                          },
              { icon: FileJson,     label: "JSON format (all)"                   },
              { icon: Download,     label: `${totalRecordsLabel} total`          },
              { icon: Star,         label: "CC0 (fully open)"                    },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-foreground/40">
                <Icon size={14} className="text-quantum/60" />
                {label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Category tabs ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {(["All", "Physics", "Mathematics", "Chemistry"] as DCategory[]).map((cat) => {
            const count = cat === "All" ? DATASETS.length : DATASETS.filter((d) => d.category === cat).length;
            const config = cat !== "All" ? CATEGORY_CONFIG[cat] : null;
            const active = category === cat;

            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-xl border transition-all duration-200 ${
                  active
                    ? cat === "All"
                      ? "bg-quantum/15 text-quantum border-quantum/35"
                      : `${config!.bg} ${config!.color} ${config!.border}`
                    : "border-white/8 text-foreground/40 hover:border-white/20 hover:text-foreground/65"
                }`}
              >
                {cat === "All"       && <span>⚗️</span>}
                {cat === "Physics"    && <Atom         size={12} />}
                {cat === "Mathematics"&& <Hash         size={12} />}
                {cat === "Chemistry"  && <FlaskConical size={12} />}
                <span>{cat}</span>
                <span className="opacity-60">({count})</span>
              </button>
            );
          })}
        </motion.div>

        {/* ── Controls ──────────────────────────────────────────────────── */}
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
              placeholder="Search datasets, fields…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/8 bg-transparent text-sm text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 transition-all"
            />
          </div>
          <div className="flex items-center gap-1 glass rounded-xl p-1 border border-white/8">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-quantum/20 text-quantum" : "text-foreground/40 hover:text-foreground/70"}`}
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("table")}
              className={`p-2 rounded-lg transition-all ${view === "table" ? "bg-quantum/20 text-quantum" : "text-foreground/40 hover:text-foreground/70"}`}
              aria-label="Table view"
            >
              <Table2 size={15} />
            </button>
          </div>
        </motion.div>

        <WaveDivider variant="quantum" />

        {/* Results count */}
        <div className="text-xs font-mono text-foreground/30 mb-8">
          Showing {filtered.length} of {DATASETS.length} datasets
          {(search || category !== "All") && (
            <button
              onClick={() => { setSearch(""); setCategory("All"); }}
              className="ml-3 text-quantum/60 hover:text-quantum underline transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 text-foreground/30 font-mono"
            >
              <FlaskConical size={40} className="mx-auto mb-4 text-foreground/15" />
              <p>No datasets match your query.</p>
            </motion.div>
          ) : view === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filtered.map((d, i) => <DatasetCard key={d.id} dataset={d} index={i} />)}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card border border-white/6 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/8">
                      {["Dataset", "Category", "Format", "Size", "License", "Actions"].map((h) => (
                        <th key={h} className={`text-left py-3 px-4 text-[11px] font-mono text-foreground/35 uppercase tracking-widest ${h === "Category" ? "hidden sm:table-cell" : h === "Format" || h === "Actions" ? "hidden md:table-cell" : h === "Size" || h === "License" ? "hidden lg:table-cell" : ""} ${h === "Actions" ? "table-cell" : ""}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d, i) => <DatasetRow key={d.id} dataset={d} index={i} />)}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category sections (grid only, when "All") ────────────────── */}
        {view === "grid" && category === "All" && !search && (
          <>
            <WaveDivider variant="olive" />

            {/* Per-category detail cards */}
            <div className="space-y-16 mt-8">
              {(["Physics", "Mathematics", "Chemistry"] as Exclude<DCategory, "All">[]).map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const CatIcon = cfg.icon;
                const catDatasets = DATASETS.filter((d) => d.category === cat);

                return (
                  <motion.section
                    key={cat}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                        <CatIcon size={18} className={cfg.color} />
                      </div>
                      <div>
                        <h2 className="font-serif font-bold text-xl">{cat} Datasets</h2>
                        <p className="text-xs text-foreground/35 font-mono">{catDatasets.length} dataset{catDatasets.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </motion.section>
                );
              })}
            </div>
          </>
        )}

        {/* ── Footer note ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-xs font-mono text-foreground/20">
            All datasets are available at{" "}
            <a
              href="https://xurashad.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-quantum/50 hover:text-quantum underline transition-colors"
            >
              xurashad.github.io
            </a>
            {" "}under open licenses. Science belongs to everyone.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
