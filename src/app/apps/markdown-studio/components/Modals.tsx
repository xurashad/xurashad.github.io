"use client";

import katex from "katex";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Copy,
  FileText,
  GitBranch,
  History,
  Keyboard,
  Plus,
  Search,
  Settings,
  Sigma,
  Table,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { htmlToMarkdown } from "../lib/formatter";
import { renderChartBlockToSvg, renderMermaidToSvg } from "../lib/mermaidRenderer";
import { MARKDOWN_TEMPLATES } from "../lib/templates";
import type {
  EditorFontFamily,
  EditorSettings,
  EditorTheme,
  FrontmatterData,
  MarkdownProject,
  PreviewTheme,
  PreviewWidth,
} from "../lib/types";
import { computeLineDiff, formatRelativeTime } from "../lib/utils";

function ModalShell({
  title,
  icon,
  onClose,
  maxWidth = "max-w-2xl",
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9500] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidth} max-h-[88vh] rounded-2xl border border-slate-500/30 bg-[#0b0d1f] text-slate-100 shadow-2xl flex flex-col overflow-hidden`}
      >
        <div className="px-5 py-3.5 border-b border-slate-700/60 flex items-center justify-between gap-3 bg-white/[0.02]">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
            {icon}
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto md-scroll p-5">{children}</div>
      </div>
    </div>
  );
}

/* ── 1. Templates & Workspaces Modal ──────────────────────────────────────── */
export function TemplatesWorkspacesModal({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateFromTemplate,
  onDuplicateProject,
  onDeleteProject,
  onClose,
}: {
  projects: MarkdownProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateFromTemplate: (templateId: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onClose: () => void;
}) {
  const [catFilter, setCatFilter] = useState<string>("All");
  const categories = ["All", "Showcase", "Engineering", "Academic", "Writing", "Presentation"];

  const filteredTemplates = MARKDOWN_TEMPLATES.filter(
    (t) => catFilter === "All" || t.category === catFilter,
  );

  return (
    <ModalShell
      title="Workspaces & Starter Templates"
      icon={<BookOpen size={17} className="text-violet-300" />}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Saved Workspaces */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
            Saved Browser Workspaces ({projects.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {projects.map((p) => {
              const isActive = p.id === activeProjectId;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    isActive
                      ? "bg-violet-500/15 border-cyan-400/45"
                      : "bg-white/[0.03] border-slate-700/60"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className="flex-1 text-left min-w-0 cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-white truncate">
                      {p.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {p.files.length} files · {formatRelativeTime(p.updatedAt)}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onDuplicateProject(p.id)}
                      title="Duplicate Workspace"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/[0.06] cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                    {projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteProject(p.id)}
                        title="Delete Workspace"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
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

        {/* Starter Templates */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Create From Template ({MARKDOWN_TEMPLATES.length})
            </h3>
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatFilter(cat)}
                  className={`px-2 py-0.5 rounded-md text-[11px] cursor-pointer ${
                    catFilter === cat
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/35"
                      : "text-slate-400 hover:text-white border border-transparent"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onCreateFromTemplate(tpl.id);
                  onClose();
                }}
                className="text-left p-3.5 rounded-xl border border-slate-700/60 bg-white/[0.03] hover:border-cyan-400/50 hover:bg-violet-500/12 transition-all flex flex-col justify-between gap-2 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200">
                      {tpl.badge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {tpl.files.length} {tpl.files.length === 1 ? "file" : "files"}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white mb-1">{tpl.name}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{tpl.description}</p>
                </div>
                <div className="text-[11px] font-medium text-cyan-300 flex items-center gap-1 pt-1">
                  <span>Use Template</span>
                  <ArrowRight size={11} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 2. Visual GFM Table Builder Modal ────────────────────────────────────── */
export function TableWizardModal({
  onInsert,
  onClose,
}: {
  onInsert: (md: string) => void;
  onClose: () => void;
}) {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [aligns, setAligns] = useState<Array<"left" | "center" | "right">>([
    "left",
    "center",
    "right",
  ]);
  const [cells, setCells] = useState<string[][]>([
    ["Feature", "Status", "Notes"],
    ["Live GFM", "Ready", "Instant"],
    ["KaTeX Math", "Ready", "Offline"],
    ["Mermaid SVG", "Ready", "Client"],
  ]);
  const [csvPaste, setCsvPaste] = useState("");

  const resize = (nextRows: number, nextCols: number) => {
    const r = Math.max(1, Math.min(12, nextRows));
    const c = Math.max(1, Math.min(8, nextCols));
    setRows(r);
    setCols(c);
    setAligns((prev) =>
      Array.from({ length: c }, (_u, idx) => prev[idx] ?? "left"),
    );
    setCells((prev) =>
      Array.from({ length: r + 1 }, (_u, ri) =>
        Array.from(
          { length: c },
          (_v, ci) => prev[ri]?.[ci] ?? (ri === 0 ? `Col ${ci + 1}` : ""),
        ),
      ),
    );
  };

  const importCsv = () => {
    const lines = csvPaste
      .trim()
      .split(/\r?\n/)
      .filter(Boolean);
    if (lines.length === 0) return;
    const sep = lines[0].includes("\t") ? "\t" : ",";
    const matrix = lines.slice(0, 13).map((l) =>
      l
        .split(sep)
        .slice(0, 8)
        .map((s) => s.trim().replace(/^"|"$/g, "")),
    );
    const maxCols = Math.max(1, ...matrix.map((m) => m.length));
    setCols(maxCols);
    setRows(Math.max(1, matrix.length - 1));
    setAligns(Array.from({ length: maxCols }, () => "left"));
    setCells(
      matrix.map((m) =>
        Array.from({ length: maxCols }, (_u, ci) => m[ci] ?? ""),
      ),
    );
    setCsvPaste("");
  };

  const generated = useMemo(() => {
    const header = `| ${Array.from({ length: cols }, (_u, ci) => cells[0]?.[ci] || `Col ${ci + 1}`).join(" | ")} |`;
    const delim = `| ${Array.from({ length: cols }, (_u, ci) => {
      const a = aligns[ci] ?? "left";
      return a === "center" ? ":---:" : a === "right" ? "---:" : ":---";
    }).join(" | ")} |`;
    const body = Array.from({ length: rows }, (_u, ri) =>
      `| ${Array.from({ length: cols }, (_v, ci) => cells[ri + 1]?.[ci] || " ").join(" | ")} |`,
    );
    return `${[header, delim, ...body].join("\n")}\n\n`;
  }, [cells, aligns, cols, rows]);

  return (
    <ModalShell
      title="Visual GFM Table Builder"
      icon={<Table size={17} className="text-cyan-300" />}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5">
              <span className="text-slate-400">Rows:</span>
              <input
                type="number"
                min={1}
                max={12}
                value={rows}
                onChange={(e) => resize(Number(e.target.value), cols)}
                className="w-14 px-2 py-1 rounded bg-black/50 border border-slate-700 text-white"
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-slate-400">Columns:</span>
              <input
                type="number"
                min={1}
                max={8}
                value={cols}
                onChange={(e) => resize(rows, Number(e.target.value))}
                className="w-14 px-2 py-1 rounded bg-black/50 border border-slate-700 text-white"
              />
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Paste CSV / TSV line to import…"
              value={csvPaste}
              onChange={(e) => setCsvPaste(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-black/50 border border-slate-700 text-white w-52"
            />
            <button
              type="button"
              onClick={importCsv}
              className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 cursor-pointer"
            >
              Parse CSV
            </button>
          </div>
        </div>

        {/* Editable Grid */}
        <div className="overflow-x-auto border border-slate-700/70 rounded-xl p-2 bg-black/30">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {Array.from({ length: cols }, (_u, ci) => (
                  <th key={ci} className="p-1">
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={cells[0]?.[ci] ?? ""}
                        onChange={(e) =>
                          setCells((prev) =>
                            prev.map((row, ri) =>
                              ri === 0
                                ? row.map((v, k) => (k === ci ? e.target.value : v))
                                : row,
                            ),
                          )
                        }
                        className="w-full px-2 py-1 rounded bg-violet-500/15 border border-violet-400/35 text-white font-semibold"
                      />
                      <select
                        value={aligns[ci] ?? "left"}
                        onChange={(e) =>
                          setAligns((prev) =>
                            prev.map((a, k) =>
                              k === ci
                                ? (e.target.value as "left" | "center" | "right")
                                : a,
                            ),
                          )
                        }
                        className="w-full px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 text-[10px] font-mono text-cyan-300"
                      >
                        <option value="left">Align Left</option>
                        <option value="center">Center</option>
                        <option value="right">Align Right</option>
                      </select>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_u, ri) => (
                <tr key={ri}>
                  {Array.from({ length: cols }, (_v, ci) => (
                    <td key={ci} className="p-1">
                      <input
                        type="text"
                        value={cells[ri + 1]?.[ci] ?? ""}
                        onChange={(e) =>
                          setCells((prev) =>
                            prev.map((row, rIdx) =>
                              rIdx === ri + 1
                                ? row.map((v, k) => (k === ci ? e.target.value : v))
                                : row,
                            ),
                          )
                        }
                        className="w-full px-2 py-1 rounded bg-black/50 border border-slate-700 text-slate-200"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <pre className="p-3 rounded-xl bg-black/50 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
          {generated}
        </pre>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onInsert(generated);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-white font-semibold md-primary-pill cursor-pointer"
          >
            Insert Table
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 3. Frontmatter Metadata Modal ────────────────────────────────────────── */
export function FrontmatterModal({
  current,
  onApply,
  onClose,
}: {
  current: FrontmatterData | null;
  onApply: (frontmatterBlock: string, replaceExisting: boolean) => void;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<"yaml" | "toml">(() => current?.format ?? "yaml");
  const [title, setTitle] = useState(() =>
    typeof current?.fields.title === "string" ? current.fields.title : "",
  );
  const [author, setAuthor] = useState(() =>
    typeof current?.fields.author === "string" ? current.fields.author : "",
  );
  const [date, setDate] = useState(() =>
    typeof current?.fields.date === "string"
      ? current.fields.date
      : new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState(() =>
    typeof current?.fields.description === "string" ? current.fields.description : "",
  );
  const [tagsText, setTagsText] = useState(() =>
    Array.isArray(current?.fields.tags)
      ? current.fields.tags.join(", ")
      : typeof current?.fields.tags === "string"
        ? current.fields.tags
        : "",
  );
  const [draft, setDraft] = useState(() => Boolean(current?.fields.draft));
  const [customPairs, setCustomPairs] = useState<Array<{ key: string; value: string }>>(() => {
    if (!current) return [];
    const known = new Set(["title", "author", "date", "description", "tags", "draft"]);
    return Object.entries(current.fields)
      .filter(([k]) => !known.has(k))
      .map(([key, val]) => ({
        key,
        value: Array.isArray(val) ? val.join(", ") : String(val),
      }));
  });

  const buildOutput = () => {
    const tags = tagsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const delim = format === "yaml" ? "---" : "+++";
    const eq = format === "yaml" ? ":" : " =";
    const lines: string[] = [delim];
    if (title.trim()) lines.push(`title${eq} "${title.trim()}"`);
    if (author.trim()) lines.push(`author${eq} "${author.trim()}"`);
    if (date.trim()) lines.push(`date${eq} "${date.trim()}"`);
    if (description.trim()) lines.push(`description${eq} "${description.trim()}"`);
    if (tags.length > 0) {
      lines.push(
        `tags${eq} [${tags.map((t) => (format === "toml" ? `"${t}"` : t)).join(", ")}]`,
      );
    }
    lines.push(`draft${eq} ${draft}`);
    for (const pair of customPairs) {
      if (pair.key.trim()) {
        lines.push(`${pair.key.trim()}${eq} "${pair.value.trim()}"`);
      }
    }
    lines.push(delim, "");
    return lines.join("\n");
  };

  return (
    <ModalShell
      title="Frontmatter Metadata Editor"
      icon={<Tag size={17} className="text-violet-300" />}
      onClose={onClose}
    >
      <div className="space-y-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Format:</span>
          {(["yaml", "toml"] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setFormat(fmt)}
              className={`px-3 py-1 rounded-lg font-mono uppercase text-[11px] border cursor-pointer ${
                format === fmt
                  ? "bg-violet-500/25 border-violet-400/50 text-white"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              {fmt} ({fmt === "yaml" ? "---" : "+++"})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-slate-400">Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400">Author</span>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400">Date</span>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400">Tags (comma separated)</span>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="markdown, physics, docs"
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-slate-400">Description</span>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
          />
        </label>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={draft}
            onChange={(e) => setDraft(e.target.checked)}
            className="accent-cyan-400"
          />
          <span>Mark as Draft</span>
        </label>

        {/* Custom Fields */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono">Custom Fields</span>
            <button
              type="button"
              onClick={() =>
                setCustomPairs((prev) => [...prev, { key: "", value: "" }])
              }
              className="flex items-center gap-1 px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-cyan-300 cursor-pointer"
            >
              <Plus size={12} /> Add Field
            </button>
          </div>
          {customPairs.map((pair, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="key"
                value={pair.key}
                onChange={(e) =>
                  setCustomPairs((prev) =>
                    prev.map((p, k) => (k === idx ? { ...p, key: e.target.value } : p)),
                  )
                }
                className="w-1/3 px-2 py-1 rounded bg-black/50 border border-slate-700 text-white font-mono"
              />
              <input
                type="text"
                placeholder="value"
                value={pair.value}
                onChange={(e) =>
                  setCustomPairs((prev) =>
                    prev.map((p, k) => (k === idx ? { ...p, value: e.target.value } : p)),
                  )
                }
                className="flex-1 px-2 py-1 rounded bg-black/50 border border-slate-700 text-white"
              />
              <button
                type="button"
                onClick={() =>
                  setCustomPairs((prev) => prev.filter((_p, k) => k !== idx))
                }
                className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(buildOutput(), Boolean(current));
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-white font-semibold md-primary-pill cursor-pointer"
          >
            {current ? "Update Frontmatter" : "Insert Frontmatter"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 4. Mermaid & Chart Visual Studio Modal ──────────────────────────────── */
const DIAGRAM_PRESETS = [
  {
    id: "flow",
    label: "Flowchart",
    lang: "mermaid",
    code: `flowchart LR\n  Input([User Input]) --> Parser[Markdown AST]\n  Parser --> Check{Valid?}\n  Check -->|Yes| Render([Live Preview])\n  Check -->|No| Lint[Diagnostics]`,
  },
  {
    id: "seq",
    label: "Sequence",
    lang: "mermaid",
    code: `sequenceDiagram\n  participant Browser\n  participant Studio\n  Browser->>Studio: Edit Markdown\n  Studio-->>Browser: Instant KaTeX & SVG`,
  },
  {
    id: "state",
    label: "State Machine",
    lang: "mermaid",
    code: `stateDiagram-v2\n  [*] --> Draft\n  Draft --> Review : Submit\n  Review --> Published : Approve\n  Published --> [*]`,
  },
  {
    id: "pie",
    label: "Pie Chart",
    lang: "mermaid",
    code: `pie title Content Breakdown\n  "Prose" : 55\n  "Code" : 25\n  "Diagrams & Math" : 20`,
  },
  {
    id: "gantt",
    label: "Gantt",
    lang: "mermaid",
    code: `gantt\n  title Release Roadmap\n  section Core\n  Parser Engine : 5d\n  Mermaid SVG : 3d\n  Export PDF : 2d`,
  },
  {
    id: "bar",
    label: "Bar Chart",
    lang: "chart",
    code: `type: bar\ntitle: Quarterly Output\nlabels: [Q1, Q2, Q3, Q4]\nvalues: [140, 210, 290, 360]`,
  },
  {
    id: "line",
    label: "Line Chart",
    lang: "chart",
    code: `type: line\ntitle: Latency (ms)\nlabels: [Mon, Tue, Wed, Thu, Fri]\nvalues: [42, 35, 29, 24, 18]`,
  },
];

export function MermaidBuilderModal({
  onInsert,
  onClose,
}: {
  onInsert: (md: string) => void;
  onClose: () => void;
}) {
  const [lang, setLang] = useState<"mermaid" | "chart">("mermaid");
  const [source, setSource] = useState(DIAGRAM_PRESETS[0].code);

  const preview = useMemo(
    () => (lang === "chart" ? renderChartBlockToSvg(source) : renderMermaidToSvg(source)),
    [lang, source],
  );

  return (
    <ModalShell
      title="Mermaid & SVG Chart Studio"
      icon={<GitBranch size={17} className="text-emerald-300" />}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {DIAGRAM_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setLang(p.lang as "mermaid" | "chart");
                setSource(p.code);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-700 bg-white/[0.04] hover:border-cyan-400/50 text-slate-200 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea
            rows={11}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full p-3 rounded-xl bg-black/60 border border-slate-700 font-mono text-xs text-emerald-200 focus:outline-none focus:border-cyan-400/60"
          />
          <div className="p-4 rounded-xl border border-slate-700/70 bg-[#0d1126] flex items-center justify-center min-h-[240px] overflow-auto">
            {preview.error ? (
              <div className="text-rose-300 font-mono text-xs">{preview.error}</div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: preview.svg }} />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onInsert(`\`\`\`${lang}\n${source.trim()}\n\`\`\`\n\n`);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-white font-semibold md-primary-pill cursor-pointer"
          >
            Insert Diagram
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 5. KaTeX Equation Builder Modal ──────────────────────────────────────── */
const MATH_CHIPS = [
  { label: "Fraction", tex: "\\frac{a}{b}" },
  { label: "Integral", tex: "\\int_{a}^{b} f(x)\\,\\mathrm{d}x" },
  { label: "Sum", tex: "\\sum_{n=1}^{\\infty} a_n" },
  { label: "Matrix", tex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
  { label: "Bra-Ket", tex: "\\langle \\psi | \\hat{H} | \\phi \\rangle" },
  { label: "Partial", tex: "\\frac{\\partial \\mathcal{L}}{\\partial \\phi}" },
  { label: "Sqrt", tex: "\\sqrt{x^2 + y^2}" },
  { label: "Limit", tex: "\\lim_{x \\to \\infty} f(x)" },
];

export function MathBuilderModal({
  onInsert,
  onClose,
}: {
  onInsert: (md: string) => void;
  onClose: () => void;
}) {
  const [displayMode, setDisplayMode] = useState(true);
  const [tex, setTex] = useState("\\int_{-\\infty}^{\\infty} e^{-x^2}\\,\\mathrm{d}x = \\sqrt{\\pi}");

  const previewHtml = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        macros: {
          "\\ket": "|#1\\rangle",
          "\\bra": "\\langle#1|",
        },
      }),
    [tex, displayMode],
  );

  return (
    <ModalShell
      title="KaTeX Equation Builder"
      icon={<Sigma size={17} className="text-pink-300" />}
      onClose={onClose}
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDisplayMode(false)}
            className={`px-3 py-1 rounded-lg border cursor-pointer ${
              !displayMode
                ? "bg-pink-500/20 border-pink-400/50 text-pink-200"
                : "border-slate-700 text-slate-400"
            }`}
          >
            Inline ($...$)
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode(true)}
            className={`px-3 py-1 rounded-lg border cursor-pointer ${
              displayMode
                ? "bg-pink-500/20 border-pink-400/50 text-pink-200"
                : "border-slate-700 text-slate-400"
            }`}
          >
            Display Block ($$...$$)
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {MATH_CHIPS.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => setTex((prev) => `${prev ? prev + " " : ""}${c.tex}`)}
              className="px-2.5 py-1 rounded-lg border border-slate-700 bg-white/[0.04] hover:border-pink-400/50 text-slate-200 cursor-pointer"
            >
              {c.label}
            </button>
          ))}
        </div>

        <textarea
          rows={4}
          value={tex}
          onChange={(e) => setTex(e.target.value)}
          className="w-full p-3 rounded-xl bg-black/60 border border-slate-700 font-mono text-xs text-pink-200 focus:outline-none focus:border-pink-400/60"
        />

        <div className="p-4 rounded-xl border border-slate-700/70 bg-[#0d1126] min-h-[90px] flex items-center justify-center overflow-x-auto">
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onInsert(displayMode ? `$$\n${tex.trim()}\n$$\n\n` : `$${tex.trim()}$`);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-white font-semibold md-primary-pill cursor-pointer"
          >
            Insert Equation
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 6. Callout & Shields Badge Builder Modal ─────────────────────────────── */
export function CalloutBadgeModal({
  onInsert,
  onClose,
}: {
  onInsert: (md: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"callout" | "badge">("callout");
  const [calloutType, setCalloutType] = useState("TIP");
  const [calloutTitle, setCalloutTitle] = useState("Pro Tip");
  const [foldState, setFoldState] = useState<"" | "+" | "-">("");
  const [calloutBody, setCalloutBody] = useState("Write clear, concise advice for readers here.");

  const [badgeLabel, setBadgeLabel] = useState("Status");
  const [badgeMessage, setBadgeMessage] = useState("Ready");
  const [badgeColor, setBadgeColor] = useState("00c3f5");
  const [badgeLink, setBadgeLink] = useState("");

  const calloutMd = `> [!${calloutType}]${foldState} ${calloutTitle}\n${calloutBody
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n")}\n\n`;

  const badgeUrl = `https://img.shields.io/badge/${encodeURIComponent(
    badgeLabel || "label",
  )}-${encodeURIComponent(badgeMessage || "value")}-${badgeColor.replace("#", "")}`;
  const imgMd = `![${badgeLabel}: ${badgeMessage}](${badgeUrl})`;
  const badgeMd = badgeLink.trim() ? `[${imgMd}](${badgeLink.trim()}) ` : `${imgMd} `;

  return (
    <ModalShell
      title="Callout & Badge Builder"
      icon={<Award size={17} className="text-amber-300" />}
      onClose={onClose}
    >
      <div className="space-y-4 text-xs">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("callout")}
            className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
              tab === "callout"
                ? "bg-amber-500/20 border-amber-400/50 text-amber-200"
                : "border-slate-700 text-slate-400"
            }`}
          >
            Callout Banner
          </button>
          <button
            type="button"
            onClick={() => setTab("badge")}
            className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
              tab === "badge"
                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                : "border-slate-700 text-slate-400"
            }`}
          >
            Shields Badge
          </button>
        </div>

        {tab === "callout" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={calloutType}
                onChange={(e) => setCalloutType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
              >
                {[
                  "NOTE",
                  "TIP",
                  "IMPORTANT",
                  "WARNING",
                  "CAUTION",
                  "ABSTRACT",
                  "INFO",
                  "SUCCESS",
                  "QUESTION",
                  "FAILURE",
                  "BUG",
                  "EXAMPLE",
                  "QUOTE",
                ].map((k) => (
                  <option key={k} value={k} className="bg-[#0b0d1f]">
                    {k}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={calloutTitle}
                onChange={(e) => setCalloutTitle(e.target.value)}
                placeholder="Callout title"
                className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
              />
              <select
                value={foldState}
                onChange={(e) => setFoldState(e.target.value as "" | "+" | "-")}
                className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
              >
                <option value="" className="bg-[#0b0d1f]">Standard</option>
                <option value="+" className="bg-[#0b0d1f]">Collapsible (Open)</option>
                <option value="-" className="bg-[#0b0d1f]">Collapsible (Closed)</option>
              </select>
            </div>
            <textarea
              rows={3}
              value={calloutBody}
              onChange={(e) => setCalloutBody(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/50 border border-slate-700 text-white"
            />
            <pre className="p-3 rounded-xl bg-black/50 border border-slate-800 font-mono text-[11px] text-amber-200 overflow-x-auto">
              {calloutMd}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onInsert(calloutMd);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-white font-semibold md-primary-pill cursor-pointer"
              >
                Insert Callout
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={badgeLabel}
                onChange={(e) => setBadgeLabel(e.target.value)}
                placeholder="Left label"
                className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
              />
              <input
                type="text"
                value={badgeMessage}
                onChange={(e) => setBadgeMessage(e.target.value)}
                placeholder="Right value"
                className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
              />
              <select
                value={badgeColor}
                onChange={(e) => setBadgeColor(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
              >
                <option value="00c3f5" className="bg-[#0b0d1f]">Quantum Cyan</option>
                <option value="9333ea" className="bg-[#0b0d1f]">Nebula Violet</option>
                <option value="10b981" className="bg-[#0b0d1f]">Emerald Green</option>
                <option value="f59e0b" className="bg-[#0b0d1f]">Amber Gold</option>
                <option value="ef4444" className="bg-[#0b0d1f]">Crimson Red</option>
              </select>
            </div>
            <input
              type="text"
              value={badgeLink}
              onChange={(e) => setBadgeLink(e.target.value)}
              placeholder="Optional click URL (https://...)"
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            />
            <div className="p-3 rounded-xl border border-slate-800 bg-black/40 flex items-center justify-between gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badgeUrl} alt={`${badgeLabel}: ${badgeMessage}`} />
              <code className="text-[11px] text-cyan-300 truncate">{badgeMd}</code>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onInsert(badgeMd);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-white font-semibold md-primary-pill cursor-pointer"
              >
                Insert Badge
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

/* ── 7. HTML to Markdown Importer Modal ───────────────────────────────────── */
export function HtmlImportModal({
  onInsert,
  onCreateNewFile,
  onClose,
}: {
  onInsert: (md: string) => void;
  onCreateNewFile: (filename: string, content: string) => void;
  onClose: () => void;
}) {
  const [rawHtml, setRawHtml] = useState(
    "<h1>Converted Document</h1>\n<p>Paste <strong>HTML</strong> or upload an <code>.html</code> file to turn it into clean Markdown.</p>\n<ul><li>Fast conversion</li><li>Preserves tables, links &amp; code</li></ul>",
  );
  const [newFilename, setNewFilename] = useState("imported-page.md");

  const converted = useMemo(() => htmlToMarkdown(rawHtml), [rawHtml]);

  return (
    <ModalShell
      title="HTML → Markdown Converter"
      icon={<FileText size={17} className="text-pink-300" />}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-slate-400 font-mono">Input HTML</span>
            <textarea
              rows={11}
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/60 border border-slate-700 font-mono text-xs text-slate-200 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-slate-400 font-mono">Converted GFM Markdown</span>
            <pre className="h-[234px] p-3 rounded-xl bg-black/60 border border-slate-700 font-mono text-xs text-emerald-300 overflow-auto">
              {converted}
            </pre>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newFilename}
              onChange={(e) => setNewFilename(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 font-mono text-white"
            />
            <button
              type="button"
              onClick={() => {
                onCreateNewFile(newFilename.trim() || "imported.md", converted);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/15 text-cyan-200 cursor-pointer"
            >
              Save as New File
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onInsert(converted);
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-white font-semibold md-primary-pill cursor-pointer"
            >
              Insert at Cursor
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 8. Version History & Visual Diff Modal ───────────────────────────────── */
export function HistoryDiffModal({
  project,
  activeFilePath,
  onCreateSnapshot,
  onRestoreSnapshot,
  onClose,
}: {
  project: MarkdownProject;
  activeFilePath: string;
  onCreateSnapshot: (label: string) => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    () => project.snapshots[0]?.id ?? null,
  );

  const selectedSnap =
    project.snapshots.find((s) => s.id === selectedId) ?? project.snapshots[0] ?? null;

  const diffLines = useMemo(() => {
    if (!selectedSnap) return [];
    const oldFile =
      selectedSnap.files.find((f) => f.path === activeFilePath) ?? selectedSnap.files[0];
    const curFile =
      project.files.find((f) => f.path === activeFilePath) ?? project.files[0];
    return computeLineDiff(oldFile?.content ?? "", curFile?.content ?? "");
  }, [selectedSnap, project.files, activeFilePath]);

  return (
    <ModalShell
      title="Version History & Visual Diff"
      icon={<History size={17} className="text-cyan-300" />}
      onClose={onClose}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Checkpoint label (e.g., Before refactoring intro)…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
          />
          <button
            type="button"
            onClick={() => {
              onCreateSnapshot(label.trim() || "Manual Checkpoint");
              setLabel("");
            }}
            className="px-3.5 py-1.5 rounded-lg text-white font-semibold md-primary-pill cursor-pointer"
          >
            Save Checkpoint
          </button>
        </div>

        {project.snapshots.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            No snapshots saved yet. Create a checkpoint above to compare future edits.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 max-h-80 overflow-y-auto md-scroll">
              {project.snapshots.map((snap) => {
                const active = snap.id === selectedSnap?.id;
                return (
                  <button
                    key={snap.id}
                    type="button"
                    onClick={() => setSelectedId(snap.id)}
                    className={`w-full text-left p-2.5 rounded-xl border cursor-pointer ${
                      active
                        ? "bg-violet-500/20 border-cyan-400/45 text-white"
                        : "bg-white/[0.03] border-slate-800 text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="font-semibold truncate">{snap.label}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {new Date(snap.createdAt).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="md:col-span-2 flex flex-col gap-2">
              {selectedSnap && (
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400">
                    Diff ({activeFilePath}): Snapshot vs Current
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreSnapshot(selectedSnap.id);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 cursor-pointer"
                  >
                    Restore This Snapshot
                  </button>
                </div>
              )}
              <div className="max-h-72 overflow-auto md-scroll rounded-xl border border-slate-800 bg-black/55 p-2 font-mono text-[11px]">
                {diffLines.map((dl, idx) => (
                  <div
                    key={idx}
                    className={`px-2 py-0.5 whitespace-pre-wrap ${
                      dl.type === "add"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : dl.type === "del"
                          ? "bg-rose-500/15 text-rose-300"
                          : "text-slate-400"
                    }`}
                  >
                    {dl.type === "add" ? "+ " : dl.type === "del" ? "- " : "  "}
                    {dl.text}
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

/* ── 9. Studio Settings Modal ─────────────────────────────────────────────── */
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
    <ModalShell
      title="Markdown Studio Settings"
      icon={<Settings size={17} className="text-violet-300" />}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-slate-400">Editor Theme</span>
            <select
              value={settings.editorTheme}
              onChange={(e) => onUpdate({ editorTheme: e.target.value as EditorTheme })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            >
              <option value="cosmos-dark" className="bg-[#0b0d1f]">Cosmos Dark</option>
              <option value="obsidian" className="bg-[#0b0d1f]">Obsidian Slate</option>
              <option value="aurora-midnight" className="bg-[#0b0d1f]">Aurora Midnight</option>
              <option value="nord-dusk" className="bg-[#0b0d1f]">Nord Dusk</option>
              <option value="paper-light" className="bg-[#0b0d1f]">Paper Light</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Preview Theme</span>
            <select
              value={settings.previewTheme}
              onChange={(e) => onUpdate({ previewTheme: e.target.value as PreviewTheme })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            >
              <option value="celestial" className="bg-[#0b0d1f]">Celestial Dark</option>
              <option value="github-dark" className="bg-[#0b0d1f]">GitHub Dark</option>
              <option value="github-light" className="bg-[#0b0d1f]">GitHub Light</option>
              <option value="academic" className="bg-[#0b0d1f]">Academic Paper</option>
              <option value="sepia" className="bg-[#0b0d1f]">Warm Sepia</option>
              <option value="obsidian" className="bg-[#0b0d1f]">Obsidian Violet</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Editor Font Family</span>
            <select
              value={settings.editorFontFamily}
              onChange={(e) =>
                onUpdate({ editorFontFamily: e.target.value as EditorFontFamily })
              }
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            >
              <option value="mono" className="bg-[#0b0d1f]">JetBrains Mono</option>
              <option value="sans" className="bg-[#0b0d1f]">Inter Sans</option>
              <option value="serif" className="bg-[#0b0d1f]">Playfair Serif</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Preview Width</span>
            <select
              value={settings.previewWidth}
              onChange={(e) => onUpdate({ previewWidth: e.target.value as PreviewWidth })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            >
              <option value="document" className="bg-[#0b0d1f]">Document (780px)</option>
              <option value="wide" className="bg-[#0b0d1f]">Wide (1020px)</option>
              <option value="full" className="bg-[#0b0d1f]">Full Width</option>
              <option value="mobile" className="bg-[#0b0d1f]">Mobile (410px)</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Font Size ({settings.fontSize}px)</span>
            <input
              type="range"
              min={12}
              max={22}
              value={settings.fontSize}
              onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
              className="w-full accent-cyan-400"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400">Word Goal</span>
            <input
              type="number"
              min={0}
              step={100}
              value={settings.wordGoal}
              onChange={(e) => onUpdate({ wordGoal: Math.max(0, Number(e.target.value) || 0) })}
              className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-slate-700 text-white"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
          {(
            [
              ["wordWrap", "Word Wrap"],
              ["lineNumbers", "Line Numbers"],
              ["scrollSync", "Scroll Sync"],
              ["typewriterMode", "Typewriter Mode"],
              ["focusMode", "Focus Dimming"],
              ["gfmBreaks", "GFM Soft Line Breaks"],
              ["autoNumberHeadings", "Numbered Headings"],
              ["enableEmoji", "Emoji Shortcodes"],
              ["enableMath", "KaTeX Math"],
              ["enableMermaid", "Mermaid & Charts"],
              ["enableHtml", "Safe Inline HTML"],
              ["liveMathBar", "Live Math Bar"],
              ["spellCheck", "Browser Spellcheck"],
              ["autoSave", "Auto-Save"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(settings[key])}
                onChange={(e) => onUpdate({ [key]: e.target.checked })}
                className="accent-cyan-400"
              />
              <span className="text-slate-200">{label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 rounded-xl border border-rose-500/35 text-rose-300 hover:bg-rose-500/10 cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl text-white font-semibold md-primary-pill cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── 10. Command Palette Modal ────────────────────────────────────────────── */
export interface StudioCommandAction {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
  run: () => void;
}

export function CommandPaletteModal({
  actions,
  onClose,
}: {
  actions: StudioCommandAction[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) =>
      `${a.label} ${a.group}`.toLowerCase().includes(q),
    );
  }, [actions, query]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9600] bg-black/75 backdrop-blur-sm flex items-start justify-center pt-[12vh] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (filtered.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelected((i) => (i + 1) % filtered.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelected((i) => (i - 1 + filtered.length) % filtered.length);
          } else if (e.key === "Enter") {
            e.preventDefault();
            const act = filtered[selected];
            if (act) {
              onClose();
              act.run();
            }
          }
        }}
        className="w-full max-w-xl rounded-2xl border border-cyan-400/35 bg-[#0b0d1f] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/60">
          <Search size={15} className="text-cyan-300" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            placeholder="Type a command, wizard, theme, or export…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400"
          >
            ESC
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto md-scroll p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No matching commands.</div>
          ) : (
            filtered.map((act, idx) => (
              <button
                key={act.id}
                type="button"
                onMouseEnter={() => setSelected(idx)}
                onClick={() => {
                  onClose();
                  act.run();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer ${
                  idx === selected
                    ? "bg-violet-500/25 text-white"
                    : "text-slate-300 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan-300">
                    {act.group}
                  </span>
                  <span>{act.label}</span>
                </div>
                {act.shortcut && (
                  <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/50 border border-slate-700 text-slate-400">
                    {act.shortcut}
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

/* ── 11. Keyboard Shortcuts & Complete Markdown Cheat Sheet Modal ─────────── */
const SYNTAX_CHEAT_SHEET = [
  { title: "Headings", syntax: "# H1  ## H2  ### H3", insert: "## Section Title\n\n" },
  { title: "Emphasis", syntax: "**bold**  *italic*  ~~strike~~  ==highlight==", insert: "**bold** *italic* ==highlight== " },
  { title: "Links & Wiki", syntax: "[text](url)  [[page|alias]]", insert: "[Link text](https://example.com) " },
  { title: "Images & Sizing", syntax: "![alt](url =320x200)", insert: "![Description](https://example.com/img.png =400x240)\n" },
  { title: "Callouts", syntax: "> [!TIP] Title", insert: "> [!TIP] Helpful Note\n> Callout body text.\n\n" },
  { title: "Code Highlight", syntax: "```ts {2,4-5}", insert: "```ts title=\"demo.ts\" {2}\nconst a = 1;\nconst b = 2;\n```\n\n" },
  { title: "KaTeX Math", syntax: "$E=mc^2$  or  $$...$$", insert: "$$\n\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}\n$$\n\n" },
  { title: "Mermaid Diagram", syntax: "```mermaid", insert: "```mermaid\nflowchart LR\n  A[Edit] --> B[Preview]\n```\n\n" },
  { title: "Charts", syntax: "```chart", insert: "```chart\ntype: bar\ntitle: Stats\nlabels: [A, B, C]\nvalues: [10, 24, 18]\n```\n\n" },
  { title: "Interactive Tasks", syntax: "- [ ] todo  - [x] done", insert: "- [ ] Pending item\n- [x] Completed item\n" },
  { title: "Footnotes", syntax: "[^1]  and  [^1]: note", insert: "Cited claim[^1].\n\n[^1]: Citation note.\n" },
  { title: "TOC & Collapsible", syntax: "[[TOC]]  &  <details>", insert: "[[TOC]]\n\n" },
];

export function ShortcutsGuideModal({
  onInsert,
  onClose,
}: {
  onInsert: (md: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"shortcuts" | "cheatsheet">("cheatsheet");

  return (
    <ModalShell
      title="Shortcuts & Markdown Reference"
      icon={<Keyboard size={17} className="text-cyan-300" />}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 text-xs">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab("cheatsheet")}
            className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
              tab === "cheatsheet"
                ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-200"
                : "border-slate-700 text-slate-400"
            }`}
          >
            Markdown Syntax Guide
          </button>
          <button
            type="button"
            onClick={() => setTab("shortcuts")}
            className={`px-3 py-1.5 rounded-lg border cursor-pointer ${
              tab === "shortcuts"
                ? "bg-violet-500/20 border-violet-400/50 text-violet-200"
                : "border-slate-700 text-slate-400"
            }`}
          >
            Keyboard Shortcuts
          </button>
        </div>

        {tab === "cheatsheet" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SYNTAX_CHEAT_SHEET.map((item) => (
              <div
                key={item.title}
                className="p-3 rounded-xl border border-slate-800 bg-white/[0.03] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white">{item.title}</div>
                  <code className="text-[11px] text-cyan-300 break-all">{item.syntax}</code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onInsert(item.insert);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-violet-500/20 hover:bg-violet-500/35 text-violet-200 shrink-0 cursor-pointer"
                >
                  Insert
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ["Ctrl/Cmd + Shift + P", "Command Palette"],
              ["Ctrl/Cmd + S", "Save Workspace Now"],
              ["Ctrl/Cmd + B / I", "Bold / Italic Selection"],
              ["Ctrl/Cmd + Shift + X / H", "Strikethrough / Highlight"],
              ["Ctrl/Cmd + E / K", "Inline Code / Insert Link"],
              ["Ctrl/Cmd + Alt + 1..6", "Set Heading Level H1–H6"],
              ["Ctrl/Cmd + F / H", "Find & Replace"],
              ["Alt + Shift + F", "Prettify Markdown & Align Tables"],
              ["Ctrl/Cmd + Z / Y", "Undo / Redo"],
              ["/ (in editor)", "Slash Command Menu"],
              [": (in editor)", "Emoji Shortcode Autocomplete"],
              ["[[ (in editor)", "Workspace Wiki-Link Autocomplete"],
              ["Double-click Preview", "Jump Editor to Source Line"],
              ["Paste Image", "Auto-save to assets/ & Insert Link"],
            ].map(([keys, desc]) => (
              <div
                key={keys}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-white/[0.02]"
              >
                <span className="text-slate-300">{desc}</span>
                <kbd className="px-2 py-0.5 rounded bg-black/50 border border-slate-700 font-mono text-[10.5px] text-cyan-300 shrink-0">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}
