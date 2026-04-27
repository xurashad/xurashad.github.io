"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  FileText, Download, Eye, ExternalLink, Box,
  Search, BookOpen, Apple, Atom, GraduationCap,
  Notebook,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type DocCategory = "Integrability" | "General Relativity" | "Academic" | "Lie Groups and Lie Algebras";
type DocFormat = "Notebook" | "PDF";

interface DocLink {
  label: string;
  href: string;
  type: "download" | "view";
}

interface Doc {
  id: string;
  title: string;
  desc: string;
  category: DocCategory;
  format: DocFormat;
  accent: "quantum" | "olive" | "crimson";
  featured?: boolean;
  reference?: string;
  refLink?: string;
  links: DocLink[];
}

/* ─── Real Data ───────────────────────────────────────────────────────────── */
const DOCS: Doc[] = [

  /* ── Integrability ────────────────────────────────────────────────────── */
  {
    id: "defect-sum",
    title: "Defect Sum",
    desc: "Give a twist function and the code will calculate the zeros, poles, levels, and the defect sum.",
    category: "Integrability",
    format: "Notebook",
    accent: "quantum",
    featured: true,
    links: [
      { label: "Download (.nb)", href: "/documents/defect.nb", type: "download" },
    ],
  },
  {
    id: "eta-model-eta-def",
    title: "SU(2) η-Deformed ℤ₂-Twisted η-Model",
    desc: "For given SU(2) generators, a general field element of SU(2), R-matrix that satisfies the modified classical Yang-Baxter equation, and ℤ₂ automorphism, the code computes the currents j=g⁻¹∂g, the Lax matrix, the Lagrangian, equations of motion, flatness of the Lax, and the metric and B-field.",
    category: "Integrability",
    format: "Notebook",
    accent: "quantum",
    featured: true,
    reference: "Hamidi, R., Hoare, B. Twists of trigonometric sigma models. J. High Energ. Phys. 2025, 90 (2025).",
    refLink: "https://doi.org/10.1007/JHEP08(2025)090",
    links: [
      { label: "Download (.nb)", href: "/documents/eta_model_eta_def.nb", type: "download" },
    ],
  },
  {
    id: "lambda-model-eta-def",
    title: "SU(2) λ-Deformed ℤ₂-Twisted η-Model",
    desc: "For given SU(2) generators, a general field element of SU(2), R-matrix that satisfies the modified classical Yang-Baxter equation, and ℤ₂ automorphism, the code computes the currents j=g⁻¹∂g, the Lax matrix, the Lagrangian, equations of motion, flatness of the Lax, and the metric and B-field.",
    category: "Integrability",
    format: "Notebook",
    accent: "quantum",
    reference: "Hamidi, R., Hoare, B. Twists of trigonometric sigma models. J. High Energ. Phys. 2025, 90 (2025).",
    refLink: "https://doi.org/10.1007/JHEP08(2025)090",
    links: [
      { label: "Download (.nb)", href: "/documents/lambda_model_eta_def.nb", type: "download" },
    ],
  },
  {
    id: "eta-model-lambda-def",
    title: "SU(2) η-Deformed ℤ₂-Twisted λ-Model",
    desc: "For given SU(2) generators, a general field element of SU(2), R-matrix that satisfies the modified classical Yang-Baxter equation, and ℤ₂ automorphism, the code computes the currents j=g⁻¹∂g, the Lax matrix, the Lagrangian, equations of motion, flatness of the Lax, and the metric and B-field.",
    category: "Integrability",
    format: "Notebook",
    accent: "quantum",
    reference: "Hamidi, R., Hoare, B. Twists of trigonometric sigma models. J. High Energ. Phys. 2025, 90 (2025).",
    refLink: "https://doi.org/10.1007/JHEP08(2025)090",
    links: [
      { label: "Download (.nb)", href: "/documents/eta_model_lambda_def.nb", type: "download" },
    ],
  },
  {
    id: "lambda-model-lambda-def",
    title: "SU(2) λ-Deformed ℤ₂-Twisted λ-Model",
    desc: "For given SU(2) generators, a general field element of SU(2), R-matrix that satisfies the modified classical Yang-Baxter equation, and ℤ₂ automorphism, the code computes the currents j=g⁻¹∂g, the Lax matrix, the Lagrangian, equations of motion, flatness of the Lax, and the metric and B-field.",
    category: "Integrability",
    format: "Notebook",
    accent: "quantum",
    reference: "Hamidi, R., Hoare, B. Twists of trigonometric sigma models. J. High Energ. Phys. 2025, 90 (2025).",
    refLink: "https://doi.org/10.1007/JHEP08(2025)090",
    links: [
      { label: "Download (.nb)", href: "/documents/lambda_model_lambda_def.nb", type: "download" },
    ],
  },

  /* ── General Relativity ───────────────────────────────────────────────── */
  {
    id: "metric",
    title: "Metric",
    desc: "Give the dimension of the manifold, the coordinates, and the metric — the code calculates the inverse metric, Christoffel symbols, Riemann curvature tensor, Ricci tensor, scalar curvature, and Einstein tensor.",
    category: "General Relativity",
    format: "Notebook",
    accent: "olive",
    featured: true,
    links: [
      { label: "Download (.nb)", href: "/documents/metric.nb", type: "download" },
    ],
  },

  /* ── Lie Groups and Lie Algebras ──────────────────────────────────────── */
  {
    id: "su-n-generators",
    title: "SU(N) Generators",
    desc: "Generators of the SU(N) Lie algebra in the fundamental representation, including the structure constants and the d-coefficients.",
    category: "Lie Groups and Lie Algebras",
    format: "Notebook",
    accent: "olive",
    featured: true,
    links: [
      { label: "Download (.nb)", href: "/documents/alg_nb/su_n_generators.nb", type: "download" },
    ],
  },

  /* ── Academic ─────────────────────────────────────────────────────────── */
  {
    id: "final-exam-comp-phys",
    title: "Final Exam: Computational Physics",
    desc: "Final exam paper for the Computational Physics module.",
    category: "Academic",
    format: "PDF",
    accent: "crimson",
    links: [
      { label: "View (PDF)", href: "/documents/final_exam_comp_phys.pdf", type: "view" },
    ],
  },
  {
    id: "hw-qed",
    title: "Homework: Quantum Electrodynamics",
    desc: "Homework assignment for the Quantum Electrodynamics module.",
    category: "Academic",
    format: "PDF",
    accent: "crimson",
    links: [
      { label: "View (PDF)", href: "/documents/qed_hw.pdf", type: "view" },
    ],
  },
  {
    id: "hw-gr",
    title: "Homework: General Relativity",
    desc: "Homework assignment for the General Relativity module.",
    category: "Academic",
    format: "PDF",
    accent: "crimson",
    links: [
      { label: "View (PDF)", href: "/documents/gr_hw.pdf", type: "view" },
    ],
  },
  {
    id: "hw-group-theory",
    title: "Homework: Group Theory",
    desc: "Homework assignment for the Group Theory module.",
    category: "Academic",
    format: "PDF",
    accent: "crimson",
    links: [
      { label: "View (PDF)", href: "/documents/grp_hw.pdf", type: "view" },
    ],
  },
  {
    id: "hw-qft",
    title: "Homework: Quantum Field Theory",
    desc: "Homework assignments for the Quantum Field Theory module, split into two parts.",
    category: "Academic",
    format: "PDF",
    accent: "crimson",
    links: [
      { label: "View Part I (PDF)", href: "/documents/qfti_hw.pdf", type: "view" },
      { label: "View Part II (PDF)", href: "/documents/qftii_hw.pdf", type: "view" },
    ],
  },
  {
    id: "hw-sm",
    title: "Homework: Standard Model",
    desc: "Homework assignment for the Standard Model module.",
    category: "Academic",
    format: "PDF",
    accent: "crimson",
    links: [
      { label: "View (PDF)", href: "/documents/sm_hw.pdf", type: "view" },
    ],
  },
];

/* ─── Category config ─────────────────────────────────────────────────────── */
const CATEGORIES: { id: DocCategory; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: "Integrability", label: "Integrability", icon: Atom },
  { id: "General Relativity", label: "General Relativity", icon: Apple },
  { id: "Lie Groups and Lie Algebras", label: "Lie Groups and Lie Algebras", icon: Box },
  { id: "Academic", label: "Academic", icon: GraduationCap },
];

const ACCENT = {
  quantum: {
    border: "hover:border-quantum/40",
    bg: "bg-quantum/10",
    text: "text-quantum",
    pill: "bg-quantum/15 text-quantum border-quantum/25",
    header: "text-quantum/70",
  },
  olive: {
    border: "hover:border-olive/40",
    bg: "bg-olive/10",
    text: "text-olive-400",
    pill: "bg-olive/15 text-olive-400 border-olive/25",
    header: "text-olive-400/70",
  },
  crimson: {
    border: "hover:border-crimson/40",
    bg: "bg-crimson/10",
    text: "text-crimson",
    pill: "bg-crimson/15 text-crimson border-crimson/25",
    header: "text-crimson/70",
  },
};

/* ─── Document Card ───────────────────────────────────────────────────────── */
function DocCard({ doc, index }: { doc: Doc; index: number }) {
  const a = ACCENT[doc.accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className={`glass-card border border-white/6 transition-all duration-300 ${a.border} p-5`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${a.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          {doc.format === "Notebook"
            ? <Notebook size={18} className={a.text} />
            : <FileText size={18} className={a.text} />
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${a.pill}`}>
              {doc.format === "Notebook" ? "Mathematica Notebook" : "PDF"}
            </span>
            {doc.featured && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-quantum/12 text-quantum border border-quantum/20 uppercase tracking-widest">
                Featured
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug mb-2">{doc.title}</h3>

          {/* Description */}
          <p className="text-xs text-foreground/50 leading-relaxed mb-3">{doc.desc}</p>

          {/* Reference */}
          {doc.reference && (
            <div className="mb-3 text-[11px] text-foreground/35 font-mono leading-relaxed">
              <span className="text-foreground/25">For mathematics, see: </span>
              {doc.refLink ? (
                <a
                  href={doc.refLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-quantum/60 hover:text-quantum transition-colors underline underline-offset-2"
                >
                  {doc.reference}
                </a>
              ) : (
                <span>{doc.reference}</span>
              )}
            </div>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2">
            {doc.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                target={l.type === "view" ? "_blank" : undefined}
                rel={l.type === "view" ? "noopener noreferrer" : undefined}
                download={l.type === "download" ? true : undefined}
                className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 ${a.bg} ${a.text} border-current/20 hover:opacity-80`}
              >
                {l.type === "download"
                  ? <Download size={11} />
                  : <Eye size={11} />
                }
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setCategory] = useState<DocCategory | null>(null);

  const filtered = DOCS.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      d.title.toLowerCase().includes(q) ||
      d.desc.toLowerCase().includes(q);
    const matchCat = !activeCategory || d.category === activeCategory;
    return matchSearch && matchCat;
  });

  /* Group by category for sectioned render */
  const grouped = (activeCategory
    ? CATEGORIES.filter((c) => c.id === activeCategory)
    : CATEGORIES
  ).map((cat) => ({
    ...cat,
    docs: filtered.filter((d) => d.category === cat.id),
  })).filter((g) => g.docs.length > 0);

  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-quantum/3 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-olive/4  blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Research &amp; Academic Vault
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Documents</span>
          </h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">
            Mathematica notebooks, problem sets, and academic documents spanning integrable models,
            general relativity, and theoretical physics coursework.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-6">
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const count = DOCS.filter((d) => d.category === id).length;
              return (
                <div key={id} className="flex items-center gap-2 text-sm text-foreground/40">
                  <Icon size={13} className="text-foreground/25" />
                  <span className="text-foreground/70 font-semibold">{count}</span> {label}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Controls ────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-10"
        >
          {/* Search */}
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
            <input
              type="text"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/8 bg-transparent text-sm text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 transition-all"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${activeCategory === null
                ? "bg-quantum/15 text-quantum border-quantum/30"
                : "border-white/8 text-foreground/35 hover:border-white/20"
                }`}
            >
              All ({DOCS.length})
            </button>
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCategory(activeCategory === id ? null : id)}
                className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${activeCategory === id
                  ? "bg-quantum/15 text-quantum border-quantum/30"
                  : "border-white/8 text-foreground/35 hover:border-white/20"
                  }`}
              >
                <Icon size={11} />
                {label} ({DOCS.filter((d) => d.category === id).length})
              </button>
            ))}
            {(search || activeCategory) && (
              <button
                onClick={() => { setSearch(""); setCategory(null); }}
                className="text-xs font-mono px-3 py-1.5 text-foreground/30 hover:text-quantum transition-colors"
              >
                Clear ×
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Grouped document sections ──────────────────────────────────── */}
        {grouped.length === 0 ? (
          <div className="text-center py-20 text-foreground/25 font-mono">
            <BookOpen size={36} className="mx-auto mb-3 opacity-30" />
            <p>No documents match your query.</p>
          </div>
        ) : (
          <div className="space-y-14">
            {grouped.map(({ id, label, icon: CatIcon, docs }) => (
              <section key={id}>
                {/* Section heading */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-quantum/10 flex items-center justify-center">
                    <CatIcon size={15} className="text-quantum" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold">{label} Documents</h2>
                    <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest">
                      {docs.length} file{docs.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex-1 h-px bg-white/5 ml-2" />
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {docs.map((doc, i) => (
                    <DocCard key={doc.id} doc={doc} index={i} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
