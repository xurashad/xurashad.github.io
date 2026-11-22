"use client";

import katex from "katex";
import { useMemo, useState } from "react";
import {
  BookOpen,
  Calculator,
  Check,
  Clock,
  FolderOpen,
  History,
  Keyboard,
  Loader2,
  Plus,
  RotateCcw,
  Settings,
  Sparkles,
  Table,
  Trash2,
  X,
} from "lucide-react";
import { computeLineDiff } from "../lib/formatter";
import { WETEX_TEMPLATES } from "../lib/templates";
import type {
  BibliographyStyle,
  CloudEngine,
  EditorSettings,
  EditorTheme,
  PaperLayout,
  PaperTheme,
  PreviewEngine,
  WeTeXProject,
} from "../lib/types";

function ModalShell({
  title,
  icon: Icon,
  onClose,
  maxWidth = "max-w-3xl",
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="wt-modal-backdrop" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWidth} max-h-[88vh] rounded-2xl bg-[#0a0c1e] border border-slate-600/40 shadow-2xl flex flex-col overflow-hidden text-slate-100`}
      >
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0e1129]">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <Icon size={16} className="text-cyan-400" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto wt-scroll p-5">{children}</div>
      </div>
    </div>
  );
}

/* ── 1. Templates & Projects Modal ─────────────────────────────────────── */
export function TemplatesProjectsModal({
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onCreateFromTemplate,
  onClose,
}: {
  projects: WeTeXProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onCreateFromTemplate: (templateId: string, customName?: string) => void;
  onClose: () => void;
}) {
  const [customTitle, setCustomTitle] = useState("");
  const [category, setCategory] = useState<string>("All");
  const categories = ["All", "Physics", "Academic", "Presentation", "CV", "General"];

  const filtered = WETEX_TEMPLATES.filter(
    (t) => category === "All" || t.category === category,
  );

  return (
    <ModalShell title="Projects & LaTeX Templates Gallery" icon={FolderOpen} maxWidth="max-w-4xl" onClose={onClose}>
      {/* Saved Local Projects */}
      <div className="mb-6">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5">
          Saved Browser Projects ({projects.length})
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {projects.map((p) => {
            const active = p.id === activeProjectId;
            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProject(p.id);
                  onClose();
                }}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  active
                    ? "bg-indigo-500/20 border-indigo-400/50"
                    : "bg-white/[0.03] border-slate-700/50 hover:border-cyan-400/40"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{p.name}</div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {p.files.length} files · {new Date(p.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {active && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      Active
                    </span>
                  )}
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create from Template */}
      <div className="border-t border-slate-800 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-violet-400" />
            Create New Project from Template
          </div>
          <input
            type="text"
            placeholder="Optional custom project name…"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400 w-60"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs border cursor-pointer ${
                category === cat
                  ? "bg-violet-500/25 border-violet-400/50 text-white"
                  : "border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-xl bg-white/[0.03] border border-slate-700/60 hover:border-cyan-400/50 flex flex-col justify-between gap-3 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm text-white">{tpl.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                    {tpl.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono text-slate-500">
                  {tpl.files.length} file{tpl.files.length > 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onCreateFromTemplate(tpl.id, customTitle);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 2. Visual Table Generator Modal ───────────────────────────────────── */
export function TableWizardModal({
  onInsert,
  onClose,
}: {
  onInsert: (tex: string) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [aligns, setAligns] = useState<Array<"l" | "c" | "r">>(["l", "c", "c"]);
  const [grid, setGrid] = useState<string[][]>([
    ["Method", "Accuracy", "Time (ms)"],
    ["Baseline", "$91.2\\%$", "142"],
    ["Proposed", "$97.8\\%$", "68"],
  ]);
  const [useBooktabs, setUseBooktabs] = useState(true);
  const [caption, setCaption] = useState("Experimental comparison.");
  const [label, setLabel] = useState("tab:results");

  const resizeGrid = (nextR: number, nextC: number) => {
    const r = Math.max(1, Math.min(12, nextR));
    const c = Math.max(1, Math.min(8, nextC));
    setRows(r);
    setCols(c);
    setAligns((prev) =>
      Array.from({ length: c }, (_, j) => prev[j] ?? "c"),
    );
    setGrid((prev) =>
      Array.from({ length: r }, (_, i) =>
        Array.from({ length: c }, (__, j) => prev[i]?.[j] ?? `Cell ${i + 1},${j + 1}`),
      ),
    );
  };

  const generatedTex = useMemo(() => {
    const spec = useBooktabs ? aligns.join("") : `|${aligns.join("|")}|`;
    const bodyLines: string[] = [];
    if (useBooktabs) bodyLines.push("    \\toprule");
    else bodyLines.push("    \\hline");

    grid.forEach((row, rIdx) => {
      bodyLines.push(`    ${row.join(" & ")} \\\\`);
      if (rIdx === 0) {
        bodyLines.push(useBooktabs ? "    \\midrule" : "    \\hline");
      } else if (!useBooktabs) {
        bodyLines.push("    \\hline");
      }
    });
    if (useBooktabs) bodyLines.push("    \\bottomrule");

    return `\\begin{table}[htbp]\n  \\centering\n  \\caption{${caption}}\n  \\label{${label}}\n  \\begin{tabular}{${spec}}\n${bodyLines.join("\n")}\n  \\end{tabular}\n\\end{table}\n`;
  }, [aligns, caption, grid, label, useBooktabs]);

  return (
    <ModalShell title="Visual LaTeX Table Generator" icon={Table} maxWidth="max-w-3xl" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5">
            Rows:
            <input
              type="number"
              min={1}
              max={12}
              value={rows}
              onChange={(e) => resizeGrid(parseInt(e.target.value, 10) || 2, cols)}
              className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
            />
          </label>
          <label className="flex items-center gap-1.5">
            Cols:
            <input
              type="number"
              min={1}
              max={8}
              value={cols}
              onChange={(e) => resizeGrid(rows, parseInt(e.target.value, 10) || 2)}
              className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
            />
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useBooktabs}
              onChange={(e) => setUseBooktabs(e.target.checked)}
            />
            <span>Booktabs style</span>
          </label>
          <input
            type="text"
            placeholder="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="flex-1 min-w-[160px] px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white"
          />
          <input
            type="text"
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-32 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono"
          />
        </div>

        {/* Column Alignments */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {aligns.map((al, cIdx) => (
                  <th key={cIdx} className="p-1">
                    <div className="flex justify-center gap-1">
                      {(["l", "c", "r"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setAligns((prev) => prev.map((v, i) => (i === cIdx ? opt : v)))
                          }
                          className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase cursor-pointer ${
                            al === opt
                              ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/50"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-1">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGrid((prev) =>
                            prev.map((r, ri) =>
                              ri === rIdx ? r.map((v, ci) => (ci === cIdx ? val : v)) : r,
                            ),
                          );
                        }}
                        className={`w-full px-2 py-1.5 rounded bg-slate-900 border text-xs outline-none focus:border-cyan-400 ${
                          rIdx === 0
                            ? "border-indigo-500/40 font-semibold text-cyan-100"
                            : "border-slate-700/70 text-slate-200"
                        }`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <pre className="p-3 rounded-xl bg-black/50 border border-slate-800 text-[11.5px] font-mono text-cyan-200 overflow-x-auto">
          {generatedTex}
        </pre>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onInsert(generatedTex);
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold cursor-pointer"
          >
            Insert Table into Editor
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 3. Equation & Matrix Builder Modal ────────────────────────────────── */
const FORMULA_PRESETS = [
  { name: "Einstein Field Eq.", tex: "G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}" },
  { name: "Schrödinger Eq.", tex: "i\\hbar\\frac{\\partial}{\\partial t}\\ket{\\psi(t)} = \\hat{H}\\ket{\\psi(t)}" },
  { name: "Dirac Lagrangian", tex: "\\mathcal{L} = \\bar{\\psi}(i\\gamma^\\mu\\partial_\\mu - m)\\psi" },
  { name: "Path Integral", tex: "Z[J] = \\int \\mathcal{D}\\phi \\exp\\!\\left(\\frac{i}{\\hbar}\\int d^4x\\,[\\mathcal{L}(\\phi) + J\\phi]\\right)" },
  { name: "Euler-Lagrange", tex: "\\frac{\\partial \\mathcal{L}}{\\partial q_i} - \\frac{d}{dt}\\frac{\\partial \\mathcal{L}}{\\partial \\dot{q}_i} = 0" },
  { name: "Fourier Transform", tex: "\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x)\\,e^{-2\\pi i x \\xi}\\,dx" },
];

export function EquationBuilderModal({
  onInsert,
  onClose,
}: {
  onInsert: (tex: string) => void;
  onClose: () => void;
}) {
  const [tex, setTex] = useState("G_{\\mu\\nu} + \\Lambda g_{\\mu\\nu} = \\frac{8\\pi G}{c^4} T_{\\mu\\nu}");
  const [mode, setMode] = useState<"equation" | "align" | "inline">("equation");
  const [mRows, setMRows] = useState(2);
  const [mCols, setMCols] = useState(2);
  const [mEnv, setMEnv] = useState<"pmatrix" | "bmatrix" | "vmatrix" | "cases">("pmatrix");
  const [matrix, setMatrix] = useState<string[][]>([
    ["a", "b"],
    ["c", "d"],
  ]);

  const previewHtml = useMemo(() => {
    return katex.renderToString(tex || "\\,", {
      displayMode: mode !== "inline",
      throwOnError: false,
      macros: {
        "\\ket": "|#1\\rangle",
        "\\bra": "\\langle#1|",
        "\\braket": "\\langle#1|#2\\rangle",
      },
    });
  }, [tex, mode]);

  const applyMatrixToTex = () => {
    const rowsStr = matrix.map((r) => `  ${r.join(" & ")}`).join(" \\\\\n");
    setTex(`\\begin{${mEnv}}\n${rowsStr}\n\\end{${mEnv}}`);
  };

  const resizeMat = (nr: number, nc: number) => {
    const r = Math.max(1, Math.min(6, nr));
    const c = Math.max(1, Math.min(6, nc));
    setMRows(r);
    setMCols(c);
    setMatrix((prev) =>
      Array.from({ length: r }, (_, i) =>
        Array.from({ length: c }, (__, j) => prev[i]?.[j] ?? (i === j ? "1" : "0")),
      ),
    );
  };

  const finalInsert = () => {
    if (mode === "inline") return `$${tex}$`;
    if (mode === "align") return `\\begin{align}\n  ${tex}\n\\end{align}\n`;
    return `\\begin{equation}\n  ${tex}\n\\end{equation}\n`;
  };

  return (
    <ModalShell title="Visual Equation & Matrix Builder" icon={Calculator} maxWidth="max-w-3xl" onClose={onClose}>
      <div className="space-y-4">
        {/* Presets */}
        <div>
          <div className="text-[11px] font-mono text-slate-400 uppercase mb-1.5">
            Curated Physics & Math Presets
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FORMULA_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setTex(p.tex)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-indigo-500/25 border border-slate-700 text-xs text-slate-200 cursor-pointer"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Live KaTeX Preview */}
        <div className="p-5 rounded-xl bg-white text-slate-900 min-h-[84px] flex items-center justify-center overflow-x-auto shadow-inner">
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>

        {/* LaTeX Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase">LaTeX Expression</span>
            <div className="flex gap-1">
              {(["equation", "align", "inline"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border cursor-pointer ${
                    mode === m
                      ? "bg-cyan-500/25 border-cyan-400 text-cyan-200"
                      : "border-slate-700 text-slate-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={3}
            value={tex}
            onChange={(e) => setTex(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-cyan-200 outline-none focus:border-cyan-400"
          />
        </div>

        {/* Matrix Sub-builder */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-slate-800 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-violet-300">Matrix Generator:</span>
            <select
              value={mEnv}
              onChange={(e) => setMEnv(e.target.value as typeof mEnv)}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
            >
              <option value="pmatrix">pmatrix ( )</option>
              <option value="bmatrix">bmatrix [ ]</option>
              <option value="vmatrix">vmatrix | |</option>
              <option value="cases">cases &#123;</option>
            </select>
            <input
              type="number"
              min={1}
              max={6}
              value={mRows}
              onChange={(e) => resizeMat(parseInt(e.target.value, 10) || 2, mCols)}
              className="w-14 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
            />
            <span>×</span>
            <input
              type="number"
              min={1}
              max={6}
              value={mCols}
              onChange={(e) => resizeMat(mRows, parseInt(e.target.value, 10) || 2)}
              className="w-14 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
            />
            <button
              type="button"
              onClick={applyMatrixToTex}
              className="ml-auto px-3 py-1 rounded-lg bg-violet-500/30 hover:bg-violet-500/45 border border-violet-400/40 text-xs text-white cursor-pointer"
            >
              Load Matrix into Box
            </button>
          </div>
          <div
            style={{ gridTemplateColumns: `repeat(${mCols}, minmax(0, 1fr))` }}
            className="grid gap-1.5"
          >
            {matrix.map((r, ri) =>
              r.map((val, ci) => (
                <input
                  key={`${ri}-${ci}`}
                  type="text"
                  value={val}
                  onChange={(e) => {
                    const nextV = e.target.value;
                    setMatrix((prev) =>
                      prev.map((row, rIdx) =>
                        rIdx === ri ? row.map((v, cIdx) => (cIdx === ci ? nextV : v)) : row,
                      ),
                    );
                  }}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-xs text-center text-white outline-none focus:border-cyan-400"
                />
              )),
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onInsert(finalInsert());
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold cursor-pointer"
          >
            Insert into Editor
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 4. BibTeX / DOI Citation Wizard Modal ─────────────────────────────── */
export function BibWizardModal({
  existingKeys,
  onAddBibAndCite,
  onInsertCiteOnly,
  onClose,
}: {
  existingKeys: string[];
  onAddBibAndCite: (bibEntryRaw: string, citeKey: string) => void;
  onInsertCiteOnly: (citeKey: string) => void;
  onClose: () => void;
}) {
  const [doi, setDoi] = useState("");
  const [loadingDoi, setLoadingDoi] = useState(false);
  const [doiError, setDoiError] = useState("");

  const [entryType, setEntryType] = useState("article");
  const [citeKey, setCiteKey] = useState("author2026");
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [year, setYear] = useState("2026");
  const [rawBibOverride, setRawBibOverride] = useState("");

  const fetchDoiBib = async () => {
    const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    if (!clean) return;
    setLoadingDoi(true);
    setDoiError("");
    try {
      const res = await fetch(
        `https://api.crossref.org/works/${encodeURIComponent(clean)}/transform/application/x-bibtex`,
      );
      if (!res.ok) throw new Error(`DOI lookup failed (${res.status})`);
      const bibText = await res.text();
      const keyMatch = bibText.match(/@[A-Za-z]+\{([^,]+),/);
      if (keyMatch) setCiteKey(keyMatch[1].trim());
      setRawBibOverride(bibText.trim());
    } catch (err) {
      setDoiError(
        err instanceof Error ? err.message : "Could not fetch DOI metadata.",
      );
    } finally {
      setLoadingDoi(false);
    }
  };

  const generatedBib =
    rawBibOverride ||
    `@${entryType}{${citeKey || "ref2026"},
  author  = {${author || "Author Name"}},
  title   = {${title || "Paper Title"}},
  ${entryType === "book" ? "publisher" : "journal"} = {${venue || "Journal of Physics"}},
  year    = {${year || "2026"}}${doi.trim() ? `,\n  doi     = {${doi.trim()}}` : ""}
}`;

  return (
    <ModalShell title="BibTeX & DOI Citation Wizard" icon={BookOpen} maxWidth="max-w-2xl" onClose={onClose}>
      <div className="space-y-4 text-xs">
        {/* Quick insert existing key */}
        {existingKeys.length > 0 && (
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase mb-1.5">
              Quick Cite Existing Bibliography Keys
            </div>
            <div className="flex flex-wrap gap-1.5">
              {existingKeys.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    onInsertCiteOnly(k);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/35 text-emerald-200 font-mono cursor-pointer"
                >
                  \cite&#123;{k}&#125;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DOI Resolver */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-slate-800 space-y-2">
          <div className="font-semibold text-cyan-300">Import via DOI (CrossRef API)</div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 10.1103/PhysRevLett.116.061102"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={fetchDoiBib}
              disabled={loadingDoi}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-100 flex items-center gap-1.5 cursor-pointer"
            >
              {loadingDoi && <Loader2 size={12} className="animate-spin" />}
              Fetch BibTeX
            </button>
          </div>
          {doiError && <div className="text-rose-400 text-[11px]">{doiError}</div>}
        </div>

        {/* Manual Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="space-y-1">
            <span className="text-slate-400">Entry Type</span>
            <select
              value={entryType}
              onChange={(e) => {
                setRawBibOverride("");
                setEntryType(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white"
            >
              <option value="article">@article</option>
              <option value="book">@book</option>
              <option value="inproceedings">@inproceedings</option>
              <option value="phdthesis">@phdthesis</option>
              <option value="misc">@misc</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-slate-400">Cite Key</span>
            <input
              type="text"
              value={citeKey}
              onChange={(e) => {
                setRawBibOverride("");
                setCiteKey(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white font-mono"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-slate-400">Authors</span>
            <input
              type="text"
              placeholder="A. Einstein and N. Rosen"
              value={author}
              onChange={(e) => {
                setRawBibOverride("");
                setAuthor(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-slate-400">Title</span>
            <input
              type="text"
              placeholder="Title of the work"
              value={title}
              onChange={(e) => {
                setRawBibOverride("");
                setTitle(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400">Journal / Publisher</span>
            <input
              type="text"
              placeholder="Physical Review D"
              value={venue}
              onChange={(e) => {
                setRawBibOverride("");
                setVenue(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400">Year</span>
            <input
              type="text"
              value={year}
              onChange={(e) => {
                setRawBibOverride("");
                setYear(e.target.value);
              }}
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-white"
            />
          </label>
        </div>

        <pre className="p-3 rounded-xl bg-black/50 border border-slate-800 font-mono text-[11px] text-emerald-200 overflow-x-auto">
          {generatedBib}
        </pre>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 cursor-pointer">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onAddBibAndCite(generatedBib, citeKey || "ref2026");
              onClose();
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
          >
            Add to .bib &amp; Insert \cite
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 5. Version History & Diff Modal ───────────────────────────────────── */
export function HistoryModal({
  project,
  onSaveSnapshot,
  onRestoreSnapshot,
  onClose,
}: {
  project: WeTeXProject;
  onSaveSnapshot: (label: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [selectedId, setSelectedId] = useState<string>(project.snapshots[0]?.id ?? "");
  const [diffFile, setDiffFile] = useState<string>(project.mainFilePath);

  const selectedSnap =
    project.snapshots.find((s) => s.id === selectedId) ?? project.snapshots[0];

  const diffRows = useMemo(() => {
    if (!selectedSnap) return [];
    const oldContent =
      selectedSnap.files.find((f) => f.path === diffFile)?.content ?? "";
    const curContent =
      project.files.find((f) => f.path === diffFile)?.content ?? "";
    return computeLineDiff(oldContent, curContent);
  }, [selectedSnap, project.files, diffFile]);

  return (
    <ModalShell title="Version History & Line Diff" icon={History} maxWidth="max-w-4xl" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Checkpoint label (e.g. Before referee edits)…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-cyan-400"
          />
          <button
            type="button"
            onClick={() => {
              onSaveSnapshot(label.trim() || `Checkpoint ${project.snapshots.length + 1}`);
              setLabel("");
            }}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={13} /> Save Snapshot Now
          </button>
        </div>

        {project.snapshots.length === 0 ? (
          <div className="py-10 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-800 rounded-xl">
            No snapshots saved yet. Save a snapshot above to track changes and compare diffs.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4 space-y-1.5 max-h-80 overflow-y-auto wt-scroll">
              {project.snapshots.map((snap) => (
                <button
                  key={snap.id}
                  type="button"
                  onClick={() => setSelectedId(snap.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs cursor-pointer ${
                    selectedSnap?.id === snap.id
                      ? "bg-indigo-500/20 border-indigo-400/50 text-white"
                      : "bg-white/[0.03] border-slate-800 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <div className="font-medium truncate">{snap.label}</div>
                  <div className="text-[10.5px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(snap.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>

            <div className="md:col-span-8 flex flex-col border border-slate-800 rounded-xl overflow-hidden bg-black/40">
              <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 text-xs">
                <select
                  value={diffFile}
                  onChange={(e) => setDiffFile(e.target.value)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                >
                  {project.files
                    .filter((f) => f.kind !== "image")
                    .map((f) => (
                      <option key={f.id} value={f.path}>
                        {f.path}
                      </option>
                    ))}
                </select>
                {selectedSnap && (
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreSnapshot(selectedSnap.id);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Restore Snapshot
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto wt-scroll font-mono text-[11px] leading-relaxed">
                {diffRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-0.5 whitespace-pre-wrap break-all ${
                      row.type === "add"
                        ? "bg-emerald-500/15 text-emerald-200"
                        : row.type === "remove"
                          ? "bg-rose-500/15 text-rose-200"
                          : "text-slate-400"
                    }`}
                  >
                    <span className="inline-block w-4 select-none opacity-70">
                      {row.type === "add" ? "+" : row.type === "remove" ? "-" : " "}
                    </span>
                    {row.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* ── 6. Settings & Shortcuts Modals ────────────────────────────────────── */
export function SettingsModal({
  settings,
  onUpdate,
  onReset,
  onClose,
}: {
  settings: EditorSettings;
  onUpdate: (patch: Partial<EditorSettings>) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title="WeTeX Editor & Compiler Settings" icon={Settings} maxWidth="max-w-2xl" onClose={onClose}>
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-slate-400">Editor Theme</span>
            <select
              value={settings.editorTheme}
              onChange={(e) => onUpdate({ editorTheme: e.target.value as EditorTheme })}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="cosmos-dark">Cosmos Dark</option>
              <option value="obsidian">Obsidian</option>
              <option value="aurora-midnight">Aurora Midnight</option>
              <option value="paper-light">Paper Light</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Paper Preview Theme</span>
            <select
              value={settings.paperTheme}
              onChange={(e) => onUpdate({ paperTheme: e.target.value as PaperTheme })}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="classic">Classic Crisp White</option>
              <option value="cream">Academic Cream</option>
              <option value="sepia">Warm Sepia</option>
              <option value="night">Night Reading</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Font Size ({settings.fontSize}px)</span>
            <input
              type="range"
              min={11}
              max={20}
              value={settings.fontSize}
              onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Auto-Compile Debounce ({settings.compileDelayMs} ms)</span>
            <input
              type="range"
              min={150}
              max={1200}
              step={50}
              value={settings.compileDelayMs}
              onChange={(e) => onUpdate({ compileDelayMs: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Auto-Save Delay ({settings.autoSaveDelayMs} ms)</span>
            <input
              type="range"
              min={500}
              max={5000}
              step={250}
              value={settings.autoSaveDelayMs}
              onChange={(e) => onUpdate({ autoSaveDelayMs: parseInt(e.target.value, 10) })}
              className="w-full"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Default Bibliography Style</span>
            <select
              value={settings.bibliographyStyle}
              onChange={(e) =>
                onUpdate({ bibliographyStyle: e.target.value as BibliographyStyle })
              }
              className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="plain">plain (Sorted numeric)</option>
              <option value="unsrt">unsrt (Appearance order)</option>
              <option value="alpha">alpha (Author-year tags)</option>
              <option value="ieee">ieee (IEEE numeric)</option>
              <option value="apalike">apalike (Author, Year)</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Preview Engine</span>
            <select
              value={settings.previewEngine}
              onChange={(e) =>
                onUpdate({ previewEngine: e.target.value as PreviewEngine })
              }
              className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="real-pdf">Real PDF (TeX Live 2026)</option>
              <option value="instant">Instant Preview (Offline KaTeX)</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">TeX Engine</span>
            <select
              value={settings.cloudEngine}
              onChange={(e) => onUpdate({ cloudEngine: e.target.value as CloudEngine })}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="pdflatex">pdfLaTeX</option>
              <option value="xelatex">XeLaTeX</option>
              <option value="lualatex">LuaLaTeX</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">PDF Export Page Size</span>
            <select
              value={settings.pageSize}
              onChange={(e) => onUpdate({ pageSize: e.target.value as "a4" | "letter" })}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="a4">A4 (210 × 297 mm)</option>
              <option value="letter">US Letter (8.5 × 11 in)</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Preview Layout</span>
            <select
              value={settings.paperLayout}
              onChange={(e) => onUpdate({ paperLayout: e.target.value as PaperLayout })}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
            >
              <option value="paginated">Paper Sheet</option>
              <option value="continuous">Compact Scroll</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
          {(
            [
              ["autoSave", "Auto-Save Workspace"],
              ["autoCompile", "Auto-Compile"],
              ["wordWrap", "Word Wrap"],
              ["lineNumbers", "Line Numbers"],
              ["autoCloseBrackets", "Auto-Close Braces & $"],
              ["highlightActiveLine", "Highlight Active Line"],
              ["liveMathBar", "Live Formula Bar"],
              ["spellCheck", "Browser Spellcheck"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-slate-800 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                onChange={(e) => onUpdate({ [key]: e.target.checked })}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export interface StudioSnippetDef {
  id: string;
  label: string;
  detail: string;
  snippet: string;
  cursorOffset?: number;
}

export const STUDIO_SNIPPETS: StudioSnippetDef[] = [
  {
    id: "snip-figure",
    label: "Figure Block",
    detail: "figure + includegraphics + caption + label",
    snippet:
      "\n\\begin{figure}[htbp]\n  \\centering\n  \\includegraphics[width=0.72\\textwidth]{figures/example.png}\n  \\caption{Caption describing the figure.}\n  \\label{fig:example}\n\\end{figure}\n",
  },
  {
    id: "snip-tikz",
    label: "TikZ Diagram",
    detail: "tikzpicture coordinate axes + smooth curve",
    snippet:
      "\n\\begin{figure}[htbp]\n  \\centering\n  \\begin{tikzpicture}[scale=1.0]\n    \\draw[->] (-2.2,0) -- (2.4,0) node[right] {$x$};\n    \\draw[->] (0,-1.5) -- (0,2.0) node[above] {$y$};\n    \\draw[cyan, very thick] (-1.8,0.6) .. controls (-0.4,-0.8) and (0.6,1.4) .. (2.0,0.4);\n  \\end{tikzpicture}\n  \\caption{Vector diagram rendered with TikZ.}\n  \\label{fig:tikz}\n\\end{figure}\n",
  },
  {
    id: "snip-subfigures",
    label: "Side-by-Side Subfigures",
    detail: "Two minipage figures in one float",
    snippet:
      "\n\\begin{figure}[htbp]\n  \\centering\n  \\begin{minipage}{0.48\\textwidth}\n    \\centering\n    \\includegraphics[width=\\linewidth]{figures/left.png}\n    \\caption{Left panel.}\n    \\label{fig:left}\n  \\end{minipage}\\hfill\n  \\begin{minipage}{0.48\\textwidth}\n    \\centering\n    \\includegraphics[width=\\linewidth]{figures/right.png}\n    \\caption{Right panel.}\n    \\label{fig:right}\n  \\end{minipage}\n\\end{figure}\n",
  },
  {
    id: "snip-theorem",
    label: "Theorem & Proof",
    detail: "amsthm theorem + proof environment",
    snippet:
      "\n\\begin{theorem}[Main Result]\\label{thm:main}\nLet $\\mathcal{M}$ be a smooth manifold. Then the claim holds.\n\\end{theorem}\n\\begin{proof}\nDirect computation completes the argument.\n\\end{proof}\n",
  },
  {
    id: "snip-listing",
    label: "Code Listing",
    detail: "lstlisting Python code block",
    snippet:
      "\n\\begin{lstlisting}[language=Python, caption={Example routine}]\ndef compute(x: float) -> float:\n    return x * x + 1.0\n\\end{lstlisting}\n",
  },
  {
    id: "snip-algorithm",
    label: "Algorithm Pseudocode",
    detail: "algorithm + algorithmic float",
    snippet:
      "\n\\begin{algorithm}[htbp]\n  \\caption{Iterative Solver}\\label{alg:solver}\n  \\begin{algorithmic}[1]\n    \\State Initialize $x_0 \\gets 0$\n    \\For{$k = 1$ to $N$}\n      \\State $x_k \\gets x_{k-1} - \\eta \\nabla f(x_{k-1})$\n    \\EndFor\n    \\State \\Return $x_N$\n  \\end{algorithmic}\n\\end{algorithm}\n",
  },
  {
    id: "snip-callout",
    label: "Callout Box",
    detail: "tcolorbox highlighted note",
    snippet:
      "\n\\begin{tcolorbox}[title=Key Observation]\nSummarize the essential takeaway or lemma here.\n\\end{tcolorbox}\n",
  },
];

export interface CommandPaletteEntry {
  id: string;
  group: "Action" | "File" | "Outline" | "Snippet";
  label: string;
  detail?: string;
  shortcut?: string;
  run: () => void;
}

const GROUP_BADGE_CLASS: Record<CommandPaletteEntry["group"], string> = {
  Action: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
  File: "bg-cyan-500/20 text-cyan-200 border-cyan-400/30",
  Outline: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  Snippet: "bg-violet-500/20 text-violet-200 border-violet-400/30",
};

export function StudioCommandPaletteModal({
  items,
  onClose,
}: {
  items: CommandPaletteEntry[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 36);
    return items
      .filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          it.group.toLowerCase().includes(q) ||
          (it.detail && it.detail.toLowerCase().includes(q)),
      )
      .slice(0, 36);
  }, [items, query]);

  const activeIdx = Math.min(selectedIdx, Math.max(0, filtered.length - 1));

  const executeEntry = (entry?: CommandPaletteEntry) => {
    if (!entry) return;
    onClose();
    entry.run();
  };

  return (
    <div className="wt-modal-backdrop" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-[#0a0c1e]/98 border border-slate-600/45 shadow-2xl overflow-hidden text-slate-100"
      >
        <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2.5 bg-[#0e1129]">
          <Sparkles size={15} className="text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (filtered.length > 0) setSelectedIdx((activeIdx + 1) % filtered.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (filtered.length > 0) {
                  setSelectedIdx((activeIdx - 1 + filtered.length) % filtered.length);
                }
              } else if (e.key === "Enter") {
                e.preventDefault();
                executeEntry(filtered[activeIdx]);
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Search actions, files, sections, or LaTeX snippets…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-96 overflow-y-auto wt-scroll py-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-slate-500">
              No matching commands, files, or snippets.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setSelectedIdx(idx)}
                onClick={() => executeEntry(item)}
                className={`w-full px-4 py-2 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                  idx === activeIdx ? "bg-indigo-500/20 text-white" : "text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono uppercase border shrink-0 ${GROUP_BADGE_CLASS[item.group]}`}
                  >
                    {item.group}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{item.label}</div>
                    {item.detail && (
                      <div className="text-[11px] text-slate-400 truncate">{item.detail}</div>
                    )}
                  </div>
                </div>
                {item.shortcut && (
                  <kbd className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 font-mono text-[10px] text-cyan-300 shrink-0">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const rows: Array<[string, string]> = [
    ["Ctrl/⌘ + K", "Open Studio Command Palette"],
    ["Ctrl/⌘ + Enter", "Recompile Document Immediately"],
    ["Ctrl/⌘ + S", "Save (Browser / Disk) & Recompile"],
    ["Ctrl/⌘ + B", "Wrap selection with \\textbf{...}"],
    ["Ctrl/⌘ + I", "Wrap selection with \\textit{...}"],
    ["Ctrl/⌘ + M", "Wrap selection with inline math $...$"],
    ["Ctrl/⌘ + /", "Toggle % comment on line(s)"],
    ["Ctrl/⌘ + Shift + D", "Duplicate current line or selection"],
    ["Alt + ↑ / ↓", "Move current line up / down"],
    ["Ctrl/⌘ + F", "Open Find & Replace bar"],
    ["Alt + F", "Format & auto-indent LaTeX source"],
    ["Tab / Shift+Tab", "Indent / unindent selection or accept autocomplete"],
    ["Double-Click Preview", "SyncTeX jump to exact source file & line"],
  ];
  return (
    <ModalShell title="Keyboard Shortcuts & SyncTeX Guide" icon={Keyboard} maxWidth="max-w-lg" onClose={onClose}>
      <div className="space-y-2 text-xs">
        {rows.map(([keys, desc]) => (
          <div
            key={keys}
            className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-white/[0.03] border border-slate-800"
          >
            <span className="text-slate-300">{desc}</span>
            <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-cyan-300 shrink-0">
              {keys}
            </kbd>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
