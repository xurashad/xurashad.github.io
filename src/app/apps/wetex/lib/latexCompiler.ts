import katex from "katex";
import {
  formatInlineCitationHtml,
  parseBibTeX,
  renderBibliographyHtml,
  sortCitationKeys,
} from "./bibtex";
import { renderTikzToSvg } from "./tikz";
import type {
  BibEntry,
  BibliographyStyle,
  CompiledLabel,
  CompileResult,
  CompilerDiagnostic,
  OutlineNode,
  ProjectFile,
  WeTeXProject,
} from "./types";
import { decodeLatexAccents, escapeHtml, extractBalancedArg } from "./utils";

interface SourceLine {
  text: string;
  file: string;
  line: number;
}

interface CustomTheoremDef {
  env: string;
  title: string;
  within?: string;
  numberedLike?: string;
  starred?: boolean;
}

type PlaceholderEntry =
  | { kind: "ref"; cmd: string; key: string; file: string; line: number }
  | {
      kind: "cite";
      cmd: string;
      keys: string[];
      note: string;
      file: string;
      line: number;
    }
  | { kind: "toc" }
  | { kind: "lof" }
  | { kind: "lot" }
  | { kind: "bib" };

interface CompileContext {
  project: WeTeXProject;
  macros: Record<string, string>;
  textMacros: Record<string, { args: number; defaultOpt?: string; body: string }>;
  optMacros: Record<string, { args: number; defaultOpt: string; body: string }>;
  colors: Record<string, string>;
  theorems: Record<string, CustomTheoremDef>;
  theoremCounters: Record<string, number>;
  customEnvs: Record<string, { begin: string; end: string }>;
  diagnostics: CompilerDiagnostic[];
  outline: OutlineNode[];
  labels: Record<string, CompiledLabel>;
  bibEntries: Record<string, BibEntry>;
  citedOrder: string[];
  citedSet: Set<string>;
  bibStyle: BibliographyStyle;
  footnotes: Array<{ id: number; html: string }>;
  placeholders: PlaceholderEntry[];
  docClass: string;
  classOptions: string[];
  isTwoColumn: boolean;
  isBeamer: boolean;
  isAppendix: boolean;
  partCount: number;
  chapterCount: number;
  sectionCount: number;
  subsectionCount: number;
  subsubsectionCount: number;
  equationCount: number;
  subeqGroup: number | null;
  subeqLetterIndex: number;
  figureCount: number;
  tableCount: number;
  mathCount: number;
  listingCount: number;
  algorithmCount: number;
  lastAnchor: {
    refText: string;
    kind: CompiledLabel["kind"];
    targetId: string;
    title?: string;
  };
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  institute?: string;
  address?: string;
  signature?: string;
  hasBibCommand: boolean;
  bodyLines: SourceLine[];
  lineStarts: number[];
  resolvedImageFallback: (path: string) => ProjectFile | undefined;
}

const PH_OPEN = "\uE000WT_PH_";
const PH_CLOSE = "\uE001";

const BASE_MACROS: Record<string, string> = {
  "\\dd": "\\mathrm{d}",
  "\\dv": "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}",
  "\\pdv": "\\frac{\\partial #1}{\\partial #2}",
  "\\fdv": "\\frac{\\delta #1}{\\delta #2}",
  "\\bra": "\\langle #1 |",
  "\\ket": "| #1 \\rangle",
  "\\braket": "\\langle #1 | #2 \\rangle",
  "\\mel": "\\langle #1 | #2 | #3 \\rangle",
  "\\ev": "\\langle #1 \\rangle",
  "\\comm": "[#1, #2]",
  "\\acomm": "\\{#1, #2\\}",
  "\\abs": "\\lvert #1 \\rvert",
  "\\norm": "\\lVert #1 \\rVert",
  "\\qty": "\\left( #1 \\right)",
  "\\pqty": "\\left( #1 \\right)",
  "\\bqty": "\\left[ #1 \\right]",
  "\\Bqty": "\\left\\{ #1 \\right\\}",
  "\\Tr": "\\operatorname{Tr}",
  "\\tr": "\\operatorname{tr}",
  "\\grad": "\\nabla",
  "\\curl": "\\nabla \\times",
  "\\va": "\\mathbf{#1}",
  "\\vb": "\\mathbf{#1}",
  "\\vu": "\\hat{\\mathbf{#1}}",
  "\\order": "\\mathcal{O}\\left(#1\\right)",
  "\\R": "\\mathbb{R}",
  "\\C": "\\mathbb{C}",
  "\\Z": "\\mathbb{Z}",
  "\\N": "\\mathbb{N}",
  "\\Q": "\\mathbb{Q}",
  "\\E": "\\mathbb{E}",
  "\\Var": "\\operatorname{Var}",
  "\\Cov": "\\operatorname{Cov}",
  "\\argmin": "\\operatorname*{arg\\,min}",
  "\\argmax": "\\operatorname*{arg\\,max}",
  "\\slashed": "\\not\\!#1",
  "\\sgn": "\\operatorname{sgn}",
  "\\diag": "\\operatorname{diag}",
  "\\rank": "\\operatorname{rank}",
  "\\supp": "\\operatorname{supp}",
  "\\Res": "\\operatorname{Res}",
};

const DEFAULT_THEOREMS: Record<string, CustomTheoremDef> = {
  theorem: { env: "theorem", title: "Theorem" },
  lemma: { env: "lemma", title: "Lemma" },
  proposition: { env: "proposition", title: "Proposition" },
  corollary: { env: "corollary", title: "Corollary" },
  conjecture: { env: "conjecture", title: "Conjecture" },
  definition: { env: "definition", title: "Definition" },
  example: { env: "example", title: "Example" },
  remark: { env: "remark", title: "Remark" },
  note: { env: "note", title: "Note" },
  exercise: { env: "exercise", title: "Exercise" },
  solution: { env: "solution", title: "Solution", starred: true },
  claim: { env: "claim", title: "Claim" },
  axiom: { env: "axiom", title: "Axiom" },
};

const NAMED_COLORS: Record<string, string> = {
  black: "#111827",
  white: "#ffffff",
  gray: "#64748b",
  grey: "#64748b",
  red: "#dc2626",
  crimson: "#dc143c",
  blue: "#2563eb",
  cyan: "#0891b2",
  teal: "#0d9488",
  green: "#16a34a",
  olive: "#6b8f27",
  yellow: "#ca8a04",
  orange: "#ea580c",
  purple: "#9333ea",
  violet: "#7c3aed",
  indigo: "#4f46e5",
  magenta: "#c026d3",
  brown: "#92400e",
};

const VERBATIM_ENVS = new Set(["verbatim", "lstlisting", "minted", "comment"]);

const MATH_ENV_SET = new Set([
  "equation",
  "equation*",
  "align",
  "align*",
  "gather",
  "gather*",
  "multline",
  "multline*",
  "flalign",
  "flalign*",
  "alignat",
  "alignat*",
  "eqnarray",
  "eqnarray*",
]);

function addPlaceholder(ctx: CompileContext, entry: PlaceholderEntry): string {
  const idx = ctx.placeholders.length;
  ctx.placeholders.push(entry);
  return `${PH_OPEN}${idx}${PH_CLOSE}`;
}

function addDiag(
  ctx: CompileContext,
  severity: CompilerDiagnostic["severity"],
  file: string,
  line: number,
  message: string,
  context?: string,
) {
  ctx.diagnostics.push({
    id: `diag-${ctx.diagnostics.length + 1}`,
    severity,
    file,
    line: Math.max(1, line),
    message,
    context,
  });
}

function resolveProjectFile(
  files: ProjectFile[],
  rawPath: string,
): ProjectFile | undefined {
  const clean = rawPath.trim().replace(/^\.\//, "");
  const exact = files.find((f) => f.path === clean);
  if (exact) return exact;
  const withTex = files.find((f) => f.path === `${clean}.tex`);
  if (withTex) return withTex;
  const base = clean.split("/").pop() || clean;
  return files.find(
    (f) => f.path === base || f.path.endsWith(`/${base}`) || f.path === `${base}.tex`,
  );
}

function expandIncludes(
  files: ProjectFile[],
  entryPath: string,
  diagnostics: CompilerDiagnostic[],
  visited: Set<string>,
  depth = 0,
): SourceLine[] {
  if (depth > 12) return [];
  const fileObj = resolveProjectFile(files, entryPath);
  if (!fileObj) return [];
  if (visited.has(fileObj.path)) {
    diagnostics.push({
      id: `diag-inc-${diagnostics.length + 1}`,
      severity: "error",
      file: fileObj.path,
      line: 1,
      message: `Circular \\input / \\include detected for "${fileObj.path}"`,
    });
    return [];
  }
  const nextVisited = new Set(visited);
  nextVisited.add(fileObj.path);

  const rawLines = fileObj.content.replace(/\r\n/g, "\n").split("\n");
  const result: SourceLine[] = [];
  let inRawBlock = false;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const rawLine = rawLines[idx];
    const lineNo = idx + 1;
    if (/\\begin\{(verbatim|lstlisting|minted)\}/.test(rawLine)) inRawBlock = true;
    if (/\\end\{(verbatim|lstlisting|minted)\}/.test(rawLine)) inRawBlock = false;

    const noComment = inRawBlock
      ? rawLine
      : rawLine.replace(/(^|[^\\])%.*$/, "$1");

    const incMatch = !inRawBlock
      ? noComment.match(/^\s*\\(input|include)\{([^}]+)\}\s*$/)
      : null;

    if (incMatch) {
      const target = incMatch[2].trim();
      const child = resolveProjectFile(files, target);
      if (!child) {
        diagnostics.push({
          id: `diag-missing-${diagnostics.length + 1}`,
          severity: "warning",
          file: fileObj.path,
          line: lineNo,
          message: `Included file "${target}" was not found in project.`,
          context: rawLine.trim(),
        });
        continue;
      }
      if (incMatch[1] === "include") {
        result.push({ text: "\\clearpage", file: fileObj.path, line: lineNo });
      }
      result.push(...expandIncludes(files, child.path, diagnostics, nextVisited, depth + 1));
      if (incMatch[1] === "include") {
        result.push({ text: "\\clearpage", file: fileObj.path, line: lineNo });
      }
      continue;
    }

    result.push({ text: rawLine, file: fileObj.path, line: lineNo });
  }

  return result;
}

function stripCommentsPreserveLines(lines: SourceLine[]): SourceLine[] {
  let rawEnv: string | null = null;
  return lines.map((entry) => {
    const txt = entry.text;
    if (rawEnv) {
      if (txt.includes(`\\end{${rawEnv}}`)) rawEnv = null;
      return entry;
    }
    const beginVerbatim = txt.match(/\\begin\{(verbatim|lstlisting|minted|comment)\}/);
    if (beginVerbatim && !txt.includes(`\\end{${beginVerbatim[1]}}`)) {
      rawEnv = beginVerbatim[1];
      return entry;
    }
    let out = "";
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (ch === "\\" && i + 1 < txt.length) {
        out += ch + txt[i + 1];
        i++;
        continue;
      }
      if (ch === "%") break;
      out += ch;
    }
    return { ...entry, text: out };
  });
}

function buildLineStarts(lines: SourceLine[]): number[] {
  const starts: number[] = [];
  let offset = 0;
  for (const entry of lines) {
    starts.push(offset);
    offset += entry.text.length + 1;
  }
  return starts;
}

function getSourceLoc(
  ctx: CompileContext,
  charOffset: number,
  fallbackFile: string,
  fallbackLine: number,
): { file: string; line: number } {
  const starts = ctx.lineStarts;
  if (starts.length === 0 || charOffset < 0) {
    return { file: fallbackFile, line: fallbackLine };
  }
  let lo = 0;
  let hi = starts.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= charOffset) lo = mid + 1;
    else hi = mid - 1;
  }
  const idx = Math.max(0, Math.min(starts.length - 1, hi));
  const hit = ctx.bodyLines[idx];
  return hit ? { file: hit.file, line: hit.line } : { file: fallbackFile, line: fallbackLine };
}

function cleanPlainTitle(raw: string): string {
  return decodeLatexAccents(
    raw
      .replace(/\\&/g, "&")
      .replace(/\\%/g, "%")
      .replace(/\\(textbf|textit|emph|textrm|textsf|texttt|textsc)\{([^}]*)\}/g, "$2")
      .replace(/\\[A-Za-z]+\*?(?:\[[^\]]*\])?/g, " ")
      .replace(/[$\\{}]/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function resolveColorName(ctx: CompileContext, raw: string): string {
  const c = raw.trim().toLowerCase();
  if (ctx.colors[c]) return ctx.colors[c];
  if (NAMED_COLORS[c]) return NAMED_COLORS[c];
  if (/^#[0-9a-f]{3,8}$/i.test(c)) return c;
  return "#4f46e5";
}

const SI_UNIT_WORDS: Record<string, string> = {
  meter: "m",
  metre: "m",
  kilogram: "kg",
  second: "s",
  ampere: "A",
  kelvin: "K",
  mole: "mol",
  candela: "cd",
  hertz: "Hz",
  newton: "N",
  pascal: "Pa",
  joule: "J",
  watt: "W",
  coulomb: "C",
  volt: "V",
  farad: "F",
  ohm: "\\Omega",
  siemens: "S",
  tesla: "T",
  henry: "H",
  gram: "g",
  electronvolt: "eV",
  radian: "rad",
  steradian: "sr",
  liter: "L",
  litre: "L",
  percent: "\\%",
  degree: "^\\circ",
  celsius: "^\\circ\\mathrm{C}",
  kilo: "k",
  mega: "M",
  giga: "G",
  tera: "T",
  milli: "m",
  micro: "\\mu",
  nano: "n",
  pico: "p",
  femto: "f",
  centi: "c",
};

function formatSiNum(raw: string): string {
  const s = raw.trim();
  const sci = s.match(/^([+-]?\d*(?:\.\d+)?)[eE]([+-]?\d+)$/);
  if (sci) {
    const mantissa = sci[1];
    const exp = sci[2].replace(/^\+/, "");
    return mantissa ? `${mantissa} \\times 10^{${exp}}` : `10^{${exp}}`;
  }
  return s;
}

function formatSiUnit(raw: string): string {
  let u = raw.trim();
  u = u.replace(/\\tothe\{([^}]+)\}/g, "^{$1}");
  u = u.replace(/\\per\b/g, "/");
  u = u.replace(/\\squared\b/g, "^2");
  u = u.replace(/\\cubed\b/g, "^3");
  u = u.replace(/\\([A-Za-z]+)/g, (full, word: string) => SI_UNIT_WORDS[word] ?? full);
  u = u.replace(/([A-Za-z}\d])\.([A-Za-z\\])/g, "$1\\,$2");
  u = u.replace(/~/g, "\\,").replace(/\s+/g, "\\,");
  // Lift Greek letters outside \mathrm so KaTeX renders them cleanly
  u = u.replace(/\\Omega/g, "}\\Omega\\mathrm{").replace(/\\mu/g, "}\\mu\\mathrm{");
  return `\\mathrm{${u}}`.replace(/\\mathrm\{\}/g, "");
}

function expandSiunitxInMath(tex: string): string {
  let out = "";
  let i = 0;
  const n = tex.length;
  while (i < n) {
    if (tex[i] === "\\") {
      const m = tex.slice(i + 1).match(/^(SI|si|unit|num|ang|qty)(?![A-Za-z])/);
      if (m) {
        const cmd = m[1];
        let p = i + 1 + cmd.length;
        while (p < n && /\s/.test(tex[p])) p++;
        if (tex[p] === "[") {
          const skipOpt = extractBalancedArg(tex, p, "[", "]");
          if (skipOpt) {
            p = skipOpt.endIdx;
            while (p < n && /\s/.test(tex[p])) p++;
          }
        }
        if (cmd === "SI" || cmd === "qty") {
          const a1 = tex[p] === "{" ? extractBalancedArg(tex, p) : null;
          const p2 = a1 ? (() => { let q = a1.endIdx; while (q < n && /\s/.test(tex[q])) q++; return q; })() : p;
          const a2 = a1 && tex[p2] === "{" ? extractBalancedArg(tex, p2) : null;
          if (a1 && a2) {
            out += `${formatSiNum(a1.content)}\\,${formatSiUnit(a2.content)}`;
            i = a2.endIdx;
            continue;
          }
        } else if (cmd === "si" || cmd === "unit") {
          const a1 = tex[p] === "{" ? extractBalancedArg(tex, p) : null;
          if (a1) {
            out += formatSiUnit(a1.content);
            i = a1.endIdx;
            continue;
          }
        } else if (cmd === "num") {
          const a1 = tex[p] === "{" ? extractBalancedArg(tex, p) : null;
          if (a1) {
            out += formatSiNum(a1.content);
            i = a1.endIdx;
            continue;
          }
        } else if (cmd === "ang") {
          const a1 = tex[p] === "{" ? extractBalancedArg(tex, p) : null;
          if (a1) {
            out += `${a1.content.trim()}^\\circ`;
            i = a1.endIdx;
            continue;
          }
        }
      }
    }
    out += tex[i];
    i++;
  }
  return out;
}

function expandOptionalMacrosInMath(tex: string, ctx: CompileContext): string {
  if (Object.keys(ctx.optMacros).length === 0) return tex;
  let cur = tex;
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    let out = "";
    let i = 0;
    const n = cur.length;
    while (i < n) {
      if (cur[i] === "\\") {
        const m = cur.slice(i + 1).match(/^([A-Za-z]+)(?![A-Za-z])/);
        if (m) {
          const def = ctx.optMacros[m[1]];
          if (def) {
            let p = i + 1 + m[1].length;
            while (p < n && /\s/.test(cur[p])) p++;
            const argVals: string[] = [];
            if (cur[p] === "[") {
              const optA = extractBalancedArg(cur, p, "[", "]");
              if (optA) {
                argVals.push(optA.content);
                p = optA.endIdx;
              } else {
                argVals.push(def.defaultOpt);
              }
            } else {
              argVals.push(def.defaultOpt);
            }
            for (let a = 2; a <= def.args; a++) {
              while (p < n && /\s/.test(cur[p])) p++;
              if (cur[p] === "{") {
                const reqA = extractBalancedArg(cur, p, "{", "}");
                if (reqA) {
                  argVals.push(reqA.content);
                  p = reqA.endIdx;
                  continue;
                }
              }
              if (p < n && cur[p] !== "\\") {
                argVals.push(cur[p]);
                p++;
              } else {
                argVals.push("");
              }
            }
            out += def.body.replace(
              /#([1-9])/g,
              (_, d: string) => argVals[Number(d) - 1] ?? "",
            );
            i = p;
            changed = true;
            continue;
          }
        }
      }
      out += cur[i];
      i++;
    }
    cur = out;
    if (!changed) break;
  }
  return cur;
}

function renderKatexSafe(
  tex: string,
  displayMode: boolean,
  ctx: CompileContext,
  file: string,
  line: number,
): string {
  ctx.mathCount++;
  const expandedTex = expandSiunitxInMath(expandOptionalMacrosInMath(tex, ctx));
  try {
    return katex.renderToString(expandedTex, {
      displayMode,
      throwOnError: true,
      strict: false,
      trust: false,
      macros: { ...ctx.macros },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Math syntax error";
    addDiag(ctx, "error", file, line, msg.replace(/^KaTeX parse error:\s*/i, ""), expandedTex.slice(0, 80));
    return katex.renderToString(expandedTex, {
      displayMode,
      throwOnError: false,
      strict: false,
      macros: { ...ctx.macros },
    });
  }
}

function renderInline(input: string, ctx: CompileContext, file: string, line: number): string {
  let out = "";
  let i = 0;
  const len = input.length;

  const pushText = (chunk: string) => {
    let s = decodeLatexAccents(chunk);
    s = s
      .replace(/``/g, "\u201C")
      .replace(/''/g, "\u201D")
      .replace(/`/g, "\u2018")
      .replace(/~/g, "\u00A0");
    out += escapeHtml(s);
  };

  while (i < len) {
    const ch = input[i];

    // Display math inside inline context $$...$$
    if (ch === "$" && input[i + 1] === "$") {
      const end = input.indexOf("$$", i + 2);
      if (end !== -1) {
        const tex = input.slice(i + 2, end).trim();
        out += `<div class="wt-math-display">${renderKatexSafe(tex, true, ctx, file, line)}</div>`;
        i = end + 2;
        continue;
      }
    }

    // Inline math $...$
    if (ch === "$") {
      let end = i + 1;
      let found = false;
      while (end < len) {
        if (input[end] === "\\" && end + 1 < len) {
          end += 2;
          continue;
        }
        if (input[end] === "$") {
          found = true;
          break;
        }
        end++;
      }
      if (found) {
        const tex = input.slice(i + 1, end);
        out += renderKatexSafe(tex, false, ctx, file, line);
        i = end + 1;
        continue;
      }
    }

    // Scoped group { ... }
    if (ch === "{") {
      const arg = extractBalancedArg(input, i, "{", "}");
      if (arg) {
        const trimmed = arg.content.trim();
        const sizeMatch = trimmed.match(
          /^\\(tiny|scriptsize|footnotesize|small|normalsize|large|Large|LARGE|huge|Huge)\b\s*([\s\S]*)$/,
        );
        if (sizeMatch) {
          out += `<span class="wt-size-${sizeMatch[1]}">${renderInline(sizeMatch[2], ctx, file, line)}</span>`;
        } else if (/^\\bfseries\b/.test(trimmed)) {
          out += `<strong>${renderInline(trimmed.replace(/^\\bfseries\b\s*/, ""), ctx, file, line)}</strong>`;
        } else if (/^\\(itshape|em)\b/.test(trimmed)) {
          out += `<em>${renderInline(trimmed.replace(/^\\(itshape|em)\b\s*/, ""), ctx, file, line)}</em>`;
        } else if (/^\\ttfamily\b/.test(trimmed)) {
          out += `<code>${renderInline(trimmed.replace(/^\\ttfamily\b\s*/, ""), ctx, file, line)}</code>`;
        } else {
          out += renderInline(arg.content, ctx, file, line);
        }
        i = arg.endIdx;
        continue;
      }
    }

    // Backslash commands
    if (ch === "\\") {
      const next = input[i + 1];
      if (!next) {
        i++;
        continue;
      }
      if (next === "(") {
        const end = input.indexOf("\\)", i + 2);
        if (end !== -1) {
          out += renderKatexSafe(input.slice(i + 2, end), false, ctx, file, line);
          i = end + 2;
          continue;
        }
      }
      if (next === "[") {
        const end = input.indexOf("\\]", i + 2);
        if (end !== -1) {
          out += `<div class="wt-math-display">${renderKatexSafe(input.slice(i + 2, end).trim(), true, ctx, file, line)}</div>`;
          i = end + 2;
          continue;
        }
      }
      if (next === "\\") {
        i += 2;
        if (input[i] === "[") {
          const skip = extractBalancedArg(input, i, "[", "]");
          if (skip) i = skip.endIdx;
        }
        out += "<br />";
        continue;
      }
      if (next === " ") {
        out += "&nbsp;";
        i += 2;
        continue;
      }
      if (next === ",") {
        out += "&#8239;";
        i += 2;
        continue;
      }
      if ("$%&_#{}".includes(next)) {
        out += escapeHtml(next);
        i += 2;
        continue;
      }

      if (`"'^\`~=`.includes(next)) {
        const rest = input.slice(i, i + 6);
        const decoded = decodeLatexAccents(rest);
        if (decoded !== rest) {
          const m = rest.match(/^\\["'`^~=]\{?[A-Za-z]\}?/);
          if (m) {
            out += escapeHtml(decodeLatexAccents(m[0]));
            i += m[0].length;
            continue;
          }
        }
      }

      let j = i + 1;
      while (j < len && /[A-Za-z*]/.test(input[j])) j++;
      const cmd = input.slice(i + 1, j);
      i = j;

      const peekEmptyBrace = () => {
        if (input[i] === "{" && input[i + 1] === "}") i += 2;
      };

      if (cmd === "verb" && i < len) {
        const delim = input[i];
        const end = input.indexOf(delim, i + 1);
        if (end !== -1) {
          out += `<code class="wt-inline-code">${escapeHtml(input.slice(i + 1, end))}</code>`;
          i = end + 1;
          continue;
        }
      }

      switch (cmd) {
        case "textbf":
        case "mathbf": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<strong>${renderInline(arg.content, ctx, file, line)}</strong>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "textit":
        case "emph":
        case "textsl": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<em>${renderInline(arg.content, ctx, file, line)}</em>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "texttt": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<code class="wt-inline-code">${renderInline(arg.content, ctx, file, line)}</code>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "textsc": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<span class="wt-smallcaps">${renderInline(arg.content, ctx, file, line)}</span>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "textsf": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<span class="wt-sans">${renderInline(arg.content, ctx, file, line)}</span>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "textrm": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<span class="wt-serif">${renderInline(arg.content, ctx, file, line)}</span>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "underline": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<span class="wt-underline">${renderInline(arg.content, ctx, file, line)}</span>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "sout": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<del>${renderInline(arg.content, ctx, file, line)}</del>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "textsuperscript": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<sup>${renderInline(arg.content, ctx, file, line)}</sup>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "textsubscript": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<sub>${renderInline(arg.content, ctx, file, line)}</sub>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "textcolor": {
          const cArg = extractBalancedArg(input, i);
          const tArg = cArg ? extractBalancedArg(input, cArg.endIdx) : null;
          if (cArg && tArg) {
            const hex = resolveColorName(ctx, cArg.content);
            out += `<span style="color:${escapeHtml(hex)}">${renderInline(tArg.content, ctx, file, line)}</span>`;
            i = tArg.endIdx;
            continue;
          }
          break;
        }
        case "colorbox": {
          const cArg = extractBalancedArg(input, i);
          const tArg = cArg ? extractBalancedArg(input, cArg.endIdx) : null;
          if (cArg && tArg) {
            const hex = resolveColorName(ctx, cArg.content);
            out += `<span class="wt-colorbox" style="background:${escapeHtml(hex)}">${renderInline(tArg.content, ctx, file, line)}</span>`;
            i = tArg.endIdx;
            continue;
          }
          break;
        }
        case "fbox": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            out += `<span class="wt-fbox">${renderInline(arg.content, ctx, file, line)}</span>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "href": {
          const urlArg = extractBalancedArg(input, i);
          const lblArg = urlArg ? extractBalancedArg(input, urlArg.endIdx) : null;
          if (urlArg && lblArg) {
            const href = urlArg.content.trim();
            const safeHref = /^(https?:|mailto:|#)/i.test(href) ? href : "#";
            out += `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer" class="wt-link">${renderInline(lblArg.content, ctx, file, line)}</a>`;
            i = lblArg.endIdx;
            continue;
          }
          break;
        }
        case "url": {
          const urlArg = extractBalancedArg(input, i);
          if (urlArg) {
            const href = urlArg.content.trim();
            const safeHref = /^(https?:|mailto:)/i.test(href) ? href : `https://${href}`;
            out += `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer" class="wt-link wt-url">${escapeHtml(href)}</a>`;
            i = urlArg.endIdx;
            continue;
          }
          break;
        }
        case "footnote": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            const fnId = ctx.footnotes.length + 1;
            const fnHtml = renderInline(arg.content, ctx, file, line);
            ctx.footnotes.push({ id: fnId, html: fnHtml });
            out += `<sup class="wt-fn-ref"><a id="fnref-${fnId}" href="#fn-${fnId}">${fnId}</a></sup>`;
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "label": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            const key = arg.content.trim();
            if (ctx.labels[key]) {
              addDiag(ctx, "warning", file, line, `Duplicate label "${key}".`);
            }
            ctx.labels[key] = {
              key,
              refText: ctx.lastAnchor.refText || "1",
              kind: ctx.lastAnchor.kind,
              title: ctx.lastAnchor.title,
              file,
              line,
              targetId: ctx.lastAnchor.targetId,
            };
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "ref":
        case "eqref":
        case "pageref":
        case "autoref":
        case "cref": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            const key = arg.content.trim();
            out += addPlaceholder(ctx, { kind: "ref", cmd, key, file, line });
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "cite":
        case "citep":
        case "citet":
        case "citeauthor":
        case "citeyear": {
          let noteBefore = "";
          if (input[i] === "[") {
            const opt1 = extractBalancedArg(input, i, "[", "]");
            if (opt1) {
              noteBefore = opt1.content.trim();
              i = opt1.endIdx;
            }
          }
          if (input[i] === "[") {
            const opt2 = extractBalancedArg(input, i, "[", "]");
            if (opt2) {
              noteBefore = opt2.content.trim();
              i = opt2.endIdx;
            }
          }
          const arg = extractBalancedArg(input, i);
          if (arg) {
            const keys = arg.content
              .split(",")
              .map((k) => k.trim())
              .filter(Boolean);
            for (const k of keys) {
              if (!ctx.citedSet.has(k)) {
                ctx.citedSet.add(k);
                ctx.citedOrder.push(k);
              }
            }
            out += addPlaceholder(ctx, {
              kind: "cite",
              cmd,
              keys,
              note: noteBefore,
              file,
              line,
            });
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "nocite": {
          const arg = extractBalancedArg(input, i);
          if (arg) {
            const rawKeys = arg.content.trim();
            if (rawKeys === "*") {
              for (const k of Object.keys(ctx.bibEntries)) {
                if (!ctx.citedSet.has(k)) {
                  ctx.citedSet.add(k);
                  ctx.citedOrder.push(k);
                }
              }
            } else {
              for (const k of rawKeys.split(",").map((s) => s.trim()).filter(Boolean)) {
                if (!ctx.citedSet.has(k)) {
                  ctx.citedSet.add(k);
                  ctx.citedOrder.push(k);
                }
              }
            }
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "includegraphics": {
          let opts = "";
          if (input[i] === "[") {
            const optArg = extractBalancedArg(input, i, "[", "]");
            if (optArg) {
              opts = optArg.content;
              i = optArg.endIdx;
            }
          }
          const pathArg = extractBalancedArg(input, i);
          if (pathArg) {
            out += renderIncludeGraphics(pathArg.content.trim(), opts, ctx, file, line);
            i = pathArg.endIdx;
            continue;
          }
          break;
        }
        case "LaTeX":
          peekEmptyBrace();
          out += `<span class="wt-logo-latex">L<sup>A</sup>T<sub>E</sub>X</span>`;
          continue;
        case "TeX":
          peekEmptyBrace();
          out += `<span class="wt-logo-latex">T<sub>E</sub>X</span>`;
          continue;
        case "BibTeX":
          peekEmptyBrace();
          out += `<span class="wt-logo-latex">B<small>IB</small>T<sub>E</sub>X</span>`;
          continue;
        case "today":
          peekEmptyBrace();
          out += escapeHtml(formatToday());
          continue;
        case "textbullet":
          peekEmptyBrace();
          out += "&bull;";
          continue;
        case "quad":
          peekEmptyBrace();
          out += `<span class="wt-quad"></span>`;
          continue;
        case "qquad":
          peekEmptyBrace();
          out += `<span class="wt-qquad"></span>`;
          continue;
        case "hfill":
          peekEmptyBrace();
          out += `<span class="wt-hfill-spacer"></span>`;
          continue;
        case "noindent":
          peekEmptyBrace();
          continue;
        case "newline":
          out += "<br />";
          continue;
        case "hspace":
        case "vspace": {
          if (input[i] === "*") i++;
          const arg = extractBalancedArg(input, i);
          if (arg) {
            if (cmd === "vspace") {
              out += `<div class="wt-vspace" style="height:${escapeHtml(arg.content.trim())}"></div>`;
            }
            i = arg.endIdx;
            continue;
          }
          break;
        }
        case "rule": {
          if (input[i] === "[") {
            const skip = extractBalancedArg(input, i, "[", "]");
            if (skip) i = skip.endIdx;
          }
          const wArg = extractBalancedArg(input, i);
          const hArg = wArg ? extractBalancedArg(input, wArg.endIdx) : null;
          if (wArg && hArg) {
            out += `<span class="wt-rule" style="width:${escapeHtml(wArg.content)};height:${escapeHtml(hArg.content)}"></span>`;
            i = hArg.endIdx;
            continue;
          }
          break;
        }
        case "item":
          continue;
        case "SI": {
          if (input[i] === "[") {
            const skip = extractBalancedArg(input, i, "[", "]");
            if (skip) i = skip.endIdx;
          }
          const vArg = extractBalancedArg(input, i);
          const uArg = vArg ? extractBalancedArg(input, vArg.endIdx) : null;
          if (vArg && uArg) {
            out += renderKatexSafe(
              `${formatSiNum(vArg.content)}\\,${formatSiUnit(uArg.content)}`,
              false,
              ctx,
              file,
              line,
            );
            i = uArg.endIdx;
            continue;
          }
          break;
        }
        case "si":
        case "unit": {
          if (input[i] === "[") {
            const skip = extractBalancedArg(input, i, "[", "]");
            if (skip) i = skip.endIdx;
          }
          const uArg = extractBalancedArg(input, i);
          if (uArg) {
            out += renderKatexSafe(formatSiUnit(uArg.content), false, ctx, file, line);
            i = uArg.endIdx;
            continue;
          }
          break;
        }
        case "num": {
          if (input[i] === "[") {
            const skip = extractBalancedArg(input, i, "[", "]");
            if (skip) i = skip.endIdx;
          }
          const nArg = extractBalancedArg(input, i);
          if (nArg) {
            out += renderKatexSafe(formatSiNum(nArg.content), false, ctx, file, line);
            i = nArg.endIdx;
            continue;
          }
          break;
        }
        case "ang": {
          if (input[i] === "[") {
            const skip = extractBalancedArg(input, i, "[", "]");
            if (skip) i = skip.endIdx;
          }
          const aArg = extractBalancedArg(input, i);
          if (aArg) {
            out += renderKatexSafe(`${aArg.content.trim()}^\\circ`, false, ctx, file, line);
            i = aArg.endIdx;
            continue;
          }
          break;
        }
        default: {
          const tm = ctx.textMacros[cmd];
          if (tm) {
            const argVals: string[] = [];
            let startIdx = 1;
            if (tm.defaultOpt !== undefined && tm.args >= 1) {
              while (i < len && /\s/.test(input[i])) i++;
              if (input[i] === "[") {
                const optA = extractBalancedArg(input, i, "[", "]");
                if (optA) {
                  argVals.push(optA.content);
                  i = optA.endIdx;
                } else {
                  argVals.push(tm.defaultOpt);
                }
              } else {
                argVals.push(tm.defaultOpt);
              }
              startIdx = 2;
            }
            for (let a = startIdx; a <= tm.args; a++) {
              const arg = extractBalancedArg(input, i);
              if (arg) {
                argVals.push(arg.content);
                i = arg.endIdx;
              } else {
                argVals.push("");
              }
            }
            const expanded = tm.body.replace(
              /#([1-9])/g,
              (_, d: string) => argVals[Number(d) - 1] ?? "",
            );
            out += renderInline(expanded, ctx, file, line);
            continue;
          }
          peekEmptyBrace();
          break;
        }
      }
      continue;
    }

    let end = i + 1;
    while (end < len && !"$\\{".includes(input[end])) end++;
    pushText(input.slice(i, end));
    i = end;
  }

  return out;
}

function renderIncludeGraphics(
  imgPath: string,
  optsRaw: string,
  ctx: CompileContext,
  file: string,
  line: number,
): string {
  const exact = resolveProjectFile(ctx.project.files, imgPath);
  const found =
    exact && exact.kind === "image"
      ? exact
      : ctx.resolvedImageFallback(imgPath);

  let widthStyle = "max-width: 82%;";
  const widthM = optsRaw.match(/width\s*=\s*([^,\]]+)/);
  if (widthM) {
    const wVal = widthM[1].trim();
    const twMatch = wVal.match(/([0-9.]+)\s*\\(textwidth|linewidth|columnwidth)/);
    if (twMatch) {
      const pct = Math.min(100, Math.max(10, parseFloat(twMatch[1]) * 100));
      widthStyle = `width: ${pct}%; max-width: 100%;`;
    } else if (/^[0-9.]+(px|pt|cm|mm|in|em|%)$/.test(wVal)) {
      widthStyle = `width: ${escapeHtml(wVal)}; max-width: 100%;`;
    }
  }
  const scaleM = optsRaw.match(/scale\s*=\s*([0-9.]+)/);
  if (scaleM) {
    const pct = Math.min(100, Math.max(15, parseFloat(scaleM[1]) * 75));
    widthStyle = `width: ${pct}%; max-width: 100%;`;
  }

  if (found) {
    return `<div class="wt-img-frame"><img src="${escapeHtml(found.content)}" alt="${escapeHtml(imgPath)}" style="${widthStyle}" class="wt-img" /></div>`;
  }

  addDiag(
    ctx,
    "warning",
    file,
    line,
    `Image "${imgPath}" not found in project files. Upload an image via the Files sidebar.`,
  );
  return `<div class="wt-img-missing"><span>Missing figure: <code>${escapeHtml(imgPath)}</code></span></div>`;
}

function renderMathEnvironment(
  env: string,
  body: string,
  ctx: CompileContext,
  file: string,
  line: number,
): string {
  const isStarred = env.endsWith("*");
  const baseEnv = env.replace(/\*$/, "");

  const extractLabelsFromMath = (chunk: string, refStr: string, targetId: string) => {
    return chunk.replace(/\\label\{([^}]+)\}/g, (_, key: string) => {
      const cleanKey = key.trim();
      ctx.labels[cleanKey] = {
        key: cleanKey,
        refText: refStr,
        kind: "equation",
        file,
        line,
        targetId,
      };
      return "";
    });
  };

  const nextEqTag = (): string => {
    if (ctx.subeqGroup !== null) {
      const letter = String.fromCharCode(97 + (ctx.subeqLetterIndex % 26));
      ctx.subeqLetterIndex++;
      return `${ctx.subeqGroup}${letter}`;
    }
    ctx.equationCount++;
    return String(ctx.equationCount);
  };

  if (baseEnv === "equation") {
    const eqId = `eq-${ctx.equationCount + 1}-${line}`;
    let tagStr = "";
    const tagMatch = body.match(/\\tag\*?\{([^}]+)\}/);
    let mathBody = body
      .replace(/\\tag\*?\{([^}]+)\}/g, "")
      .replace(/\\begin\{split\}/g, "\\begin{aligned}")
      .replace(/\\end\{split\}/g, "\\end{aligned}");
    const suppressed = /\\(nonumber|notag)\b/.test(mathBody);
    mathBody = mathBody.replace(/\\(nonumber|notag)\b/g, "");

    if (!isStarred && !suppressed) {
      tagStr = tagMatch ? tagMatch[1].trim() : nextEqTag();
      mathBody = extractLabelsFromMath(mathBody, tagStr, eqId);
      mathBody = `${mathBody} \\tag{${tagStr}}`;
    } else {
      mathBody = extractLabelsFromMath(mathBody, "", eqId);
    }
    const rendered = renderKatexSafe(mathBody.trim(), true, ctx, file, line);
    return `<div id="${eqId}" class="wt-math-display" data-source-file="${escapeHtml(file)}" data-source-line="${line}">${rendered}</div>`;
  }

  let targetEnv = "align";
  if (baseEnv === "gather" || baseEnv === "multline") targetEnv = "gather";

  const normalizedBody =
    baseEnv === "alignat" ? body.replace(/^\s*\{[^}]*\}/, "") : body;

  const rows: string[] = [];
  let braceDepth = 0;
  let innerEnvDepth = 0;
  let rowStart = 0;
  for (let i = 0; i < normalizedBody.length; i++) {
    if (normalizedBody.startsWith("\\begin{", i)) innerEnvDepth++;
    if (normalizedBody.startsWith("\\end{", i)) innerEnvDepth = Math.max(0, innerEnvDepth - 1);
    if (normalizedBody[i] === "{") braceDepth++;
    else if (normalizedBody[i] === "}") braceDepth = Math.max(0, braceDepth - 1);
    if (
      braceDepth === 0 &&
      innerEnvDepth === 0 &&
      normalizedBody[i] === "\\" &&
      normalizedBody[i + 1] === "\\"
    ) {
      rows.push(normalizedBody.slice(rowStart, i));
      i += 1;
      if (normalizedBody[i + 1] === "[") {
        const skip = extractBalancedArg(normalizedBody, i + 1, "[", "]");
        if (skip) i = skip.endIdx - 1;
      }
      rowStart = i + 1;
    }
  }
  rows.push(normalizedBody.slice(rowStart));

  const firstId = `eq-group-${ctx.equationCount + 1}-${line}`;
  const processedRows = rows.map((rawRow) => {
    let r = rawRow;
    if (baseEnv === "eqnarray") {
      r = r.replace(/&\s*=\s*&/g, "&=");
    }
    const tagMatch = r.match(/\\tag\*?\{([^}]+)\}/);
    r = r.replace(/\\tag\*?\{([^}]+)\}/g, "");
    const suppressed = /\\(nonumber|notag)\b/.test(r);
    r = r.replace(/\\(nonumber|notag)\b/g, "");

    if (!isStarred && !suppressed && r.trim().length > 0) {
      const tagStr = tagMatch ? tagMatch[1].trim() : nextEqTag();
      r = extractLabelsFromMath(r, tagStr, firstId);
      return `${r} \\tag{${tagStr}}`;
    }
    r = extractLabelsFromMath(r, "", firstId);
    return isStarred ? r : `${r} \\nonumber`;
  });

  const katexInput = `\\begin{${targetEnv}${isStarred ? "*" : ""}}${processedRows.join(" \\\\ ")}\\end{${targetEnv}${isStarred ? "*" : ""}}`;
  const rendered = renderKatexSafe(katexInput, true, ctx, file, line);
  return `<div id="${firstId}" class="wt-math-display" data-source-file="${escapeHtml(file)}" data-source-line="${line}">${rendered}</div>`;
}

function renderTabular(
  colSpec: string,
  body: string,
  ctx: CompileContext,
  file: string,
  line: number,
): string {
  const alignments: Array<"left" | "center" | "right"> = [];
  for (let i = 0; i < colSpec.length; i++) {
    const ch = colSpec[i];
    if (ch === "l" || ch === "X" || ch === "p" || ch === "m" || ch === "b") {
      alignments.push("left");
      if (colSpec[i + 1] === "{") {
        const skip = extractBalancedArg(colSpec, i + 1);
        if (skip) i = skip.endIdx - 1;
      }
    } else if (ch === "c") {
      alignments.push("center");
    } else if (ch === "r") {
      alignments.push("right");
    }
  }
  const hasVerticalBorders = colSpec.includes("|");

  const rawRows: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "\\" && body[i + 1] === "\\") {
      if (depth === 0) {
        rawRows.push(body.slice(start, i));
        start = i + 2;
        i++;
        continue;
      }
    }
    if (body[i] === "{") depth++;
    else if (body[i] === "}") depth = Math.max(0, depth - 1);
  }
  rawRows.push(body.slice(start));

  interface ParsedTableRow {
    cells: Array<{ colspan: number; align: "left" | "center" | "right"; html: string }>;
    classes: string[];
    isHeader: boolean;
  }

  const parsedRows: ParsedTableRow[] = [];
  let pendingTopBorder = "";

  for (let rIdx = 0; rIdx < rawRows.length; rIdx++) {
    let row = rawRows[rIdx].trim();
    if (!row) continue;

    const classes: string[] = [];
    if (/\\toprule\b/.test(row)) {
      pendingTopBorder = "wt-booktabs-top";
      row = row.replace(/\\toprule\b/g, "").trim();
    }
    if (/\\midrule\b/.test(row)) {
      classes.push("wt-booktabs-mid");
      row = row.replace(/\\midrule\b/g, "").trim();
      if (parsedRows.length > 0) {
        parsedRows[parsedRows.length - 1].isHeader = true;
      }
    }
    if (/\\bottomrule\b/.test(row)) {
      if (parsedRows.length > 0 && !row.replace(/\\bottomrule\b/g, "").trim()) {
        parsedRows[parsedRows.length - 1].classes.push("wt-booktabs-bottom");
        continue;
      }
      classes.push("wt-booktabs-bottom");
      row = row.replace(/\\bottomrule\b/g, "").trim();
    }
    if (/\\hline\b/.test(row)) {
      const onlyHline = !row.replace(/\\hline\b/g, "").trim();
      if (onlyHline) {
        if (parsedRows.length === 0) pendingTopBorder = "wt-hline-top";
        else parsedRows[parsedRows.length - 1].classes.push("wt-hline-bottom");
        continue;
      }
      pendingTopBorder = "wt-hline-top";
      row = row.replace(/\\hline\b/g, "").trim();
    }
    row = row.replace(/\\cline\{[^}]+\}/g, "").trim();
    if (!row) continue;

    const cellsRaw: string[] = [];
    let cDepth = 0;
    let cStart = 0;
    for (let i = 0; i < row.length; i++) {
      if (row[i] === "\\" && i + 1 < row.length) {
        i++;
        continue;
      }
      if (row[i] === "{") cDepth++;
      else if (row[i] === "}") cDepth = Math.max(0, cDepth - 1);
      else if (row[i] === "&" && cDepth === 0) {
        cellsRaw.push(row.slice(cStart, i).trim());
        cStart = i + 1;
      }
    }
    cellsRaw.push(row.slice(cStart).trim());

    if (pendingTopBorder) {
      classes.unshift(pendingTopBorder);
      pendingTopBorder = "";
    }

    let colCursor = 0;
    const cells = cellsRaw.map((cell) => {
      const mc = cell.match(/^\\multicolumn\{(\d+)\}\{([^}]*)\}\{([\s\S]*)\}$/);
      const colspan = mc ? parseInt(mc[1], 10) || 1 : 1;
      const alignSpec = mc ? mc[2] : "";
      const cellContent = mc ? mc[3] : cell;
      let align = alignments[colCursor] ?? "left";
      if (alignSpec.includes("c")) align = "center";
      else if (alignSpec.includes("r")) align = "right";
      else if (alignSpec.includes("l")) align = "left";
      colCursor += colspan;
      return {
        colspan,
        align,
        html: renderInline(cellContent, ctx, file, line),
      };
    });

    parsedRows.push({ cells, classes, isHeader: false });
  }

  const rowsHtml = parsedRows
    .map((r) => {
      const tag = r.isHeader ? "th" : "td";
      const tds = r.cells
        .map(
          (c) =>
            `<${tag} colspan="${c.colspan}" style="text-align:${c.align}">${c.html}</${tag}>`,
        )
        .join("");
      return `<tr class="${r.classes.join(" ")}">${tds}</tr>`;
    })
    .join("");

  return `<div class="wt-table-scroll"><table class="wt-booktabs ${hasVerticalBorders ? "wt-table-grid" : ""}"><tbody>${rowsHtml}</tbody></table></div>`;
}

function renderCodeBlock(
  code: string,
  caption?: string,
  label?: string,
  ctx?: CompileContext,
  file = "main.tex",
  line = 1,
): string {
  let capHtml = "";
  if (caption && ctx) {
    ctx.listingCount++;
    const id = `lst-${ctx.listingCount}-${line}`;
    if (label) {
      ctx.labels[label] = {
        key: label,
        refText: String(ctx.listingCount),
        kind: "table",
        file,
        line,
        targetId: id,
      };
    }
    capHtml = `<div id="${id}" class="wt-code-caption"><strong>Listing ${ctx.listingCount}:</strong> ${renderInline(caption, ctx, file, line)}</div>`;
  }
  return `<div class="wt-code-block" data-source-file="${escapeHtml(file)}" data-source-line="${line}">${capHtml}<pre><code>${escapeHtml(code.replace(/^\n+|\n+$/g, ""))}</code></pre></div>`;
}

function renderAlgorithmic(
  body: string,
  ctx: CompileContext,
  file: string,
  line: number,
): string {
  const lines = body.split("\n");
  let indent = 0;
  let step = 0;
  const rows: string[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (/^\\(ENDIF|ENDFOR|ENDWHILE|ENDLOOP|ELSIF|ELSE)\b/.test(trimmed)) {
      indent = Math.max(0, indent - 1);
    }

    step++;
    const formatted = trimmed
      .replace(/^\\STATE\s*/, "")
      .replace(/^\\REQUIRE\s*/, "\\textbf{Require:} ")
      .replace(/^\\ENSURE\s*/, "\\textbf{Ensure:} ")
      .replace(/^\\RETURN\s*/, "\\textbf{return} ")
      .replace(/^\\IF\{([^}]*)\}/, "\\textbf{if} $1 \\textbf{then}")
      .replace(/^\\ELSIF\{([^}]*)\}/, "\\textbf{else if} $1 \\textbf{then}")
      .replace(/^\\ELSE\b/, "\\textbf{else}")
      .replace(/^\\ENDIF\b/, "\\textbf{end if}")
      .replace(/^\\FOR\{([^}]*)\}/, "\\textbf{for} $1 \\textbf{do}")
      .replace(/^\\ENDFOR\b/, "\\textbf{end for}")
      .replace(/^\\WHILE\{([^}]*)\}/, "\\textbf{while} $1 \\textbf{do}")
      .replace(/^\\ENDWHILE\b/, "\\textbf{end while}")
      .replace(/\\COMMENT\{([^}]*)\}/g, " \\textit{\\textcolor{gray}{// $1}}");

    rows.push(
      `<div class="wt-alg-line" style="padding-left:${indent * 1.35}rem"><span class="wt-alg-lineno">${step}:</span> <span>${renderInline(formatted, ctx, file, line)}</span></div>`,
    );

    if (/^\\(IF|ELSIF|ELSE|FOR|WHILE)\b/.test(trimmed)) {
      indent++;
    }
  }

  return `<div class="wt-algorithmic">${rows.join("")}</div>`;
}

function renderListBlock(
  kind: "itemize" | "enumerate" | "description",
  body: string,
  ctx: CompileContext,
  baseOffset: number,
  file: string,
  line: number,
): string {
  const items: Array<{ opt?: string; content: string; offset: number }> = [];
  let depth = 0;
  let currentOpt: string | undefined;
  let itemStart = -1;

  for (let i = 0; i < body.length; i++) {
    if (body.startsWith("\\begin{", i)) depth++;
    else if (body.startsWith("\\end{", i)) depth = Math.max(0, depth - 1);

    if (depth === 0 && body.startsWith("\\item", i) && !/[A-Za-z]/.test(body[i + 5] || "")) {
      if (itemStart !== -1) {
        items.push({
          opt: currentOpt,
          content: body.slice(itemStart, i).trim(),
          offset: baseOffset + itemStart,
        });
      }
      i += 5;
      while (i < body.length && /[ \t]/.test(body[i])) i++;
      currentOpt = undefined;
      if (body[i] === "[") {
        const opt = extractBalancedArg(body, i, "[", "]");
        if (opt) {
          currentOpt = opt.content;
          i = opt.endIdx;
        }
      }
      itemStart = i;
    }
  }
  if (itemStart !== -1) {
    items.push({
      opt: currentOpt,
      content: body.slice(itemStart).trim(),
      offset: baseOffset + itemStart,
    });
  }

  const tag = kind === "enumerate" ? "ol" : "ul";
  const cls = `wt-list wt-list-${kind}`;
  const lis = items
    .map((it, idx) => {
      const inner = parseBodyToHtml(it.content, ctx, it.offset, file, line);
      const hasHfill = inner.includes("wt-hfill-spacer");
      const liCls = hasHfill ? ' class="wt-hfill-li"' : "";
      if (kind === "description") {
        const term = it.opt ? `<strong>${renderInline(it.opt, ctx, file, line)}</strong> ` : "";
        return `<li${liCls}>${term}${inner}</li>`;
      }
      if (it.opt !== undefined) {
        return `<li${liCls} data-custom-bullet="${escapeHtml(it.opt)}"><span class="wt-custom-marker">${renderInline(it.opt, ctx, file, line)}</span> ${inner}</li>`;
      }
      ctx.lastAnchor = {
        refText: String(idx + 1),
        kind: "item",
        targetId: `item-${line}-${idx + 1}`,
      };
      return `<li${liCls}>${inner}</li>`;
    })
    .join("");

  return `<${tag} class="${cls}" data-source-file="${escapeHtml(file)}" data-source-line="${line}">${lis}</${tag}>`;
}

function findMatchingEndEnv(
  text: string,
  startAfterBegin: number,
  envName: string,
): { bodyEnd: number; afterEnd: number } | null {
  let depth = 1;
  let i = startAfterBegin;
  const openTag = `\\begin{${envName}}`;
  const closeTag = `\\end{${envName}}`;
  while (i < text.length) {
    if (text.startsWith(openTag, i)) {
      depth++;
      i += openTag.length;
      continue;
    }
    if (text.startsWith(closeTag, i)) {
      depth--;
      if (depth === 0) {
        return { bodyEnd: i, afterEnd: i + closeTag.length };
      }
      i += closeTag.length;
      continue;
    }
    i++;
  }
  return null;
}

function renderTitleBlock(ctx: CompileContext): string {
  if (!ctx.title && !ctx.author && !ctx.date) return "";
  const titleHtml = ctx.title
    ? `<h1 class="wt-doc-title">${renderInline(ctx.title, ctx, ctx.project.mainFilePath, 1)}</h1>`
    : "";
  const subHtml = ctx.subtitle
    ? `<div class="wt-doc-subtitle">${renderInline(ctx.subtitle, ctx, ctx.project.mainFilePath, 1)}</div>`
    : "";
  const authorHtml = ctx.author
    ? `<div class="wt-doc-author">${renderInline(ctx.author.replace(/\\and\b/g, " \\quad "), ctx, ctx.project.mainFilePath, 1)}</div>`
    : "";
  const instHtml = ctx.institute
    ? `<div class="wt-doc-institute">${renderInline(ctx.institute, ctx, ctx.project.mainFilePath, 1)}</div>`
    : "";
  const dateHtml = ctx.date
    ? `<div class="wt-doc-date">${renderInline(ctx.date, ctx, ctx.project.mainFilePath, 1)}</div>`
    : "";
  return `<header class="wt-title-block">${titleHtml}${subHtml}${authorHtml}${instHtml}${dateHtml}</header>`;
}

function renderFloatEnvironment(
  env: "figure" | "table",
  body: string,
  ctx: CompileContext,
  baseOffset: number,
  file: string,
  line: number,
): string {
  const isTable = env === "table";
  let captionHtml = "";

  if (isTable) ctx.tableCount++;
  else ctx.figureCount++;
  const floatNum = isTable ? ctx.tableCount : ctx.figureCount;
  const idPrefix = isTable ? "tab" : "fig";
  const targetId = `${idPrefix}-${floatNum}-${line}`;

  ctx.lastAnchor = {
    refText: String(floatNum),
    kind: env,
    targetId,
  };

  let stripped = body;
  const capIdx = stripped.search(/\\caption\b/);
  if (capIdx !== -1) {
    let p = capIdx + 8;
    if (stripped[p] === "[") {
      const opt = extractBalancedArg(stripped, p, "[", "]");
      if (opt) p = opt.endIdx;
    }
    const arg = extractBalancedArg(stripped, p, "{", "}");
    if (arg) {
      const capText = arg.content;
      const capRendered = renderInline(capText, ctx, file, line);
      ctx.lastAnchor.title = cleanPlainTitle(capText);
      ctx.outline.push({
        id: `out-${targetId}`,
        title: `${isTable ? "Table" : "Figure"} ${floatNum}: ${ctx.lastAnchor.title}`,
        level: 4,
        kind: env,
        number: String(floatNum),
        file,
        line,
        targetId,
      });
      captionHtml = `<figcaption class="wt-caption"><strong>${isTable ? "Table" : "Figure"} ${floatNum}:</strong> ${capRendered}</figcaption>`;
      stripped = stripped.slice(0, capIdx) + stripped.slice(arg.endIdx);
    }
  }

  stripped = stripped.replace(/\\label\{([^}]+)\}/g, (_, key: string) => {
    const k = key.trim();
    ctx.labels[k] = {
      key: k,
      refText: String(floatNum),
      kind: env,
      title: ctx.lastAnchor.title,
      file,
      line,
      targetId,
    };
    return "";
  });

  stripped = stripped.replace(/\\centering\b/g, "");
  const innerHtml = parseBodyToHtml(stripped, ctx, baseOffset, file, line);

  return isTable
    ? `<figure id="${targetId}" class="wt-table" data-source-file="${escapeHtml(file)}" data-source-line="${line}">${captionHtml}${innerHtml}</figure>`
    : `<figure id="${targetId}" class="wt-figure" data-source-file="${escapeHtml(file)}" data-source-line="${line}">${innerHtml}${captionHtml}</figure>`;
}

function parseBodyToHtml(
  rawSource: string,
  ctx: CompileContext,
  baseOffset = 0,
  fallbackFile = ctx.project.mainFilePath,
  fallbackLine = 1,
): string {
  const chunks: string[] = [];
  let paraBuffer = "";
  let paraStartOffset = -1;

  const locAt = (relIdx: number) =>
    getSourceLoc(ctx, baseOffset + relIdx, fallbackFile, fallbackLine);

  const flushParagraph = () => {
    const trimmed = paraBuffer.trim();
    const startOff = paraStartOffset >= 0 ? paraStartOffset : 0;
    paraBuffer = "";
    paraStartOffset = -1;
    if (!trimmed) return;
    const loc = locAt(startOff);
    const html = renderInline(trimmed, ctx, loc.file, loc.line);
    if (html.trim()) {
      const hfillCls = html.includes("wt-hfill-spacer") ? " wt-hfill-row" : "";
      chunks.push(
        `<p class="wt-p${hfillCls}" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}">${html}</p>`,
      );
    }
  };

  let i = 0;
  const len = rawSource.length;

  while (i < len) {
    if (rawSource[i] === "\n") {
      let nlCount = 0;
      let k = i;
      while (k < len && (rawSource[k] === "\n" || rawSource[k] === " " || rawSource[k] === "\t")) {
        if (rawSource[k] === "\n") nlCount++;
        k++;
      }
      if (nlCount >= 2) {
        flushParagraph();
        i = k;
        continue;
      }
      if (paraBuffer.length > 0) paraBuffer += " ";
      i++;
      continue;
    }

    if (rawSource[i] === "$" && rawSource[i + 1] === "$") {
      const end = rawSource.indexOf("$$", i + 2);
      if (end !== -1) {
        flushParagraph();
        const loc = locAt(i);
        const tex = rawSource.slice(i + 2, end).trim();
        chunks.push(
          `<div class="wt-math-display" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}">${renderKatexSafe(tex, true, ctx, loc.file, loc.line)}</div>`,
        );
        i = end + 2;
        continue;
      }
    }

    if (rawSource[i] === "\\" && rawSource[i + 1] === "[") {
      const end = rawSource.indexOf("\\]", i + 2);
      if (end !== -1) {
        flushParagraph();
        const loc = locAt(i);
        const tex = rawSource.slice(i + 2, end).trim();
        chunks.push(
          `<div class="wt-math-display" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}">${renderKatexSafe(tex, true, ctx, loc.file, loc.line)}</div>`,
        );
        i = end + 2;
        continue;
      }
    }

    if (rawSource[i] === "\\") {
      if (rawSource.startsWith("\\begin{", i)) {
        const envArg = extractBalancedArg(rawSource, i + 6, "{", "}");
        if (envArg) {
          const env = envArg.content.trim();
          const loc = locAt(i);
          let p = envArg.endIdx;
          let optArgStr = "";
          if (rawSource[p] === "[") {
            const opt = extractBalancedArg(rawSource, p, "[", "]");
            if (opt) {
              optArgStr = opt.content;
              p = opt.endIdx;
            }
          }
          let tabularCols = "";
          if (env === "tabular" || env === "tabularx" || env === "longtable") {
            if (env === "tabularx") {
              const skipW = extractBalancedArg(rawSource, p, "{", "}");
              if (skipW) p = skipW.endIdx;
            }
            const colArg = extractBalancedArg(rawSource, p, "{", "}");
            if (colArg) {
              tabularCols = colArg.content;
              p = colArg.endIdx;
            }
          }
          let colWidth = "";
          if (env === "column") {
            const wArg = extractBalancedArg(rawSource, p, "{", "}");
            if (wArg) {
              colWidth = wArg.content;
              p = wArg.endIdx;
            }
          }
          let letterRecipient = "";
          if (env === "letter") {
            const rArg = extractBalancedArg(rawSource, p, "{", "}");
            if (rArg) {
              letterRecipient = rArg.content;
              p = rArg.endIdx;
            }
          }

          const endMatch = findMatchingEndEnv(rawSource, p, env);
          if (endMatch) {
            flushParagraph();
            const envBody = rawSource.slice(p, endMatch.bodyEnd);
            const bodyAbsOffset = baseOffset + p;
            i = endMatch.afterEnd;

            if (env === "comment") {
              continue;
            } else if (MATH_ENV_SET.has(env)) {
              chunks.push(renderMathEnvironment(env, envBody, ctx, loc.file, loc.line));
              continue;
            } else if (env === "subequations") {
              ctx.equationCount++;
              ctx.subeqGroup = ctx.equationCount;
              ctx.subeqLetterIndex = 0;
              chunks.push(parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line));
              ctx.subeqGroup = null;
              continue;
            } else if (env === "abstract") {
              chunks.push(
                `<section class="wt-abstract" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}"><div class="wt-abstract-heading">Abstract</div>${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</section>`,
              );
              continue;
            } else if (env === "itemize" || env === "enumerate" || env === "description") {
              chunks.push(renderListBlock(env, envBody, ctx, bodyAbsOffset, loc.file, loc.line));
              continue;
            } else if (env === "figure" || env === "figure*") {
              chunks.push(renderFloatEnvironment("figure", envBody, ctx, bodyAbsOffset, loc.file, loc.line));
              continue;
            } else if (env === "table" || env === "table*") {
              chunks.push(renderFloatEnvironment("table", envBody, ctx, bodyAbsOffset, loc.file, loc.line));
              continue;
            } else if (env === "tabular" || env === "tabularx" || env === "longtable") {
              chunks.push(renderTabular(tabularCols, envBody, ctx, loc.file, loc.line));
              continue;
            } else if (env === "tikzpicture") {
              chunks.push(renderTikzToSvg(envBody, optArgStr, ctx.macros));
              continue;
            } else if (env === "verbatim" || env === "lstlisting" || env === "minted") {
              const capM = optArgStr.match(/caption\s*=\s*(?:\{([^}]+)\}|([^,\]]+))/);
              const lblM = optArgStr.match(/label\s*=\s*(?:\{([^}]+)\}|([^,\]]+))/);
              chunks.push(
                renderCodeBlock(
                  envBody,
                  capM ? (capM[1] || capM[2]) : undefined,
                  lblM ? (lblM[1] || lblM[2]) : undefined,
                  ctx,
                  loc.file,
                  loc.line,
                ),
              );
              continue;
            } else if (env === "algorithm") {
              ctx.algorithmCount++;
              const algId = `alg-${ctx.algorithmCount}-${loc.line}`;
              let strippedAlg = envBody;
              let capHtml = `<div class="wt-alg-header">Algorithm ${ctx.algorithmCount}</div>`;
              const capM = strippedAlg.match(/\\caption\{([^}]+)\}/);
              if (capM) {
                capHtml = `<div class="wt-alg-header"><strong>Algorithm ${ctx.algorithmCount}:</strong> ${renderInline(capM[1], ctx, loc.file, loc.line)}</div>`;
                strippedAlg = strippedAlg.replace(capM[0], "");
              }
              strippedAlg = strippedAlg.replace(/\\label\{([^}]+)\}/g, (_, k: string) => {
                ctx.labels[k.trim()] = {
                  key: k.trim(),
                  refText: String(ctx.algorithmCount),
                  kind: "table",
                  file: loc.file,
                  line: loc.line,
                  targetId: algId,
                };
                return "";
              });
              chunks.push(
                `<div id="${algId}" class="wt-algorithm" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}">${capHtml}${parseBodyToHtml(strippedAlg, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`,
              );
              continue;
            } else if (env === "algorithmic") {
              chunks.push(renderAlgorithmic(envBody, ctx, loc.file, loc.line));
              continue;
            } else if (env === "proof") {
              const title = optArgStr ? renderInline(optArgStr, ctx, loc.file, loc.line) : "Proof";
              chunks.push(
                `<div class="wt-proof" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}"><span class="wt-proof-title">${title}.</span> ${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}<span class="wt-qed" aria-label="QED">&#9633;</span></div>`,
              );
              continue;
            } else if (ctx.theorems[env]) {
              const def = ctx.theorems[env];
              const ctrKey = def.numberedLike || def.env;
              const num = (ctx.theoremCounters[ctrKey] ?? 0) + 1;
              if (!def.starred) ctx.theoremCounters[ctrKey] = num;
              const thmId = `thm-${def.env}-${num}-${loc.line}`;
              if (!def.starred) {
                ctx.lastAnchor = {
                  refText: String(num),
                  kind: "theorem",
                  targetId: thmId,
                  title: def.title,
                };
              }
              const optNote = optArgStr
                ? ` <span class="wt-thm-note">(${renderInline(optArgStr, ctx, loc.file, loc.line)})</span>`
                : "";
              const numBadge = def.starred ? "" : ` ${num}`;
              chunks.push(
                `<div id="${thmId}" class="wt-theorem wt-thm-${escapeHtml(def.env)}" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}"><div class="wt-thm-head"><strong>${escapeHtml(def.title)}${numBadge}</strong>${optNote}.</div><div class="wt-thm-body">${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</div></div>`,
              );
              continue;
            } else if (ctx.customEnvs[env]) {
              const cdef = ctx.customEnvs[env];
              if (cdef.begin.includes("\\begin{proof}")) {
                const pm = cdef.begin.match(/\\begin\{proof\}\[([^\]]+)\]/);
                const lbl = pm ? pm[1] : env;
                chunks.push(
                  `<div class="wt-proof" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}"><span class="wt-proof-title">${renderInline(lbl, ctx, loc.file, loc.line)}.</span> ${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}<span class="wt-qed" aria-label="QED">&#9633;</span></div>`,
                );
                continue;
              }
              chunks.push(
                `<div class="wt-env-generic" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}">${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`,
              );
              continue;
            } else if (env === "letter") {
              const addrHtml = ctx.address
                ? `<div class="wt-letter-address">${renderInline(ctx.address, ctx, loc.file, loc.line)}</div>`
                : "";
              const recHtml = letterRecipient
                ? `<div class="wt-letter-recipient">${renderInline(letterRecipient, ctx, loc.file, loc.line)}</div>`
                : "";
              const bodyHtml = parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line);
              chunks.push(
                `<div class="wt-letter-doc" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}">${addrHtml}<div class="wt-letter-date">${escapeHtml(ctx.date ? (ctx.date === "\\today" ? formatToday() : ctx.date) : formatToday())}</div>${recHtml}${bodyHtml}</div>`,
              );
              continue;
            } else if (env === "frame") {
              let slideTitle = "";
              let slideSub = "";
              let bodyRest = envBody;
              const leadArg = bodyRest.trimStart();
              if (leadArg.startsWith("{") && !leadArg.startsWith("{\\")) {
                const tArg = extractBalancedArg(leadArg, 0, "{", "}");
                if (tArg) {
                  slideTitle = tArg.content;
                  bodyRest = leadArg.slice(tArg.endIdx);
                }
              }
              bodyRest = bodyRest.replace(/\\frametitle\{([^}]+)\}/g, (_, t: string) => {
                slideTitle = t;
                return "";
              });
              bodyRest = bodyRest.replace(/\\framesubtitle\{([^}]+)\}/g, (_, t: string) => {
                slideSub = t;
                return "";
              });
              const slideIdx = ctx.outline.filter((o) => o.kind === "frame").length + 1;
              const slideId = `slide-${slideIdx}`;
              ctx.outline.push({
                id: `out-${slideId}`,
                title: slideTitle ? cleanPlainTitle(slideTitle) : `Slide ${slideIdx}`,
                level: 1,
                kind: "frame",
                number: String(slideIdx),
                file: loc.file,
                line: loc.line,
                targetId: slideId,
              });
              const hdr = slideTitle
                ? `<div class="wt-slide-header"><div class="wt-slide-title">${renderInline(slideTitle, ctx, loc.file, loc.line)}</div>${slideSub ? `<div class="wt-slide-sub">${renderInline(slideSub, ctx, loc.file, loc.line)}</div>` : ""}</div>`
                : "";
              chunks.push(
                `<section id="${slideId}" class="wt-beamer-slide" data-slide="${slideIdx}" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}">${hdr}<div class="wt-slide-body">${parseBodyToHtml(bodyRest, ctx, bodyAbsOffset, loc.file, loc.line)}</div><div class="wt-slide-footer"><span>${escapeHtml(ctx.title ? cleanPlainTitle(ctx.title) : "WeTeX Beamer")}</span><span>${slideIdx}</span></div></section>`,
              );
              continue;
            } else if (env === "block" || env === "alertblock" || env === "exampleblock") {
              let blkTitle = "";
              let blkRest = envBody.trimStart();
              if (blkRest.startsWith("{")) {
                const tArg = extractBalancedArg(blkRest, 0, "{", "}");
                if (tArg) {
                  blkTitle = tArg.content;
                  blkRest = blkRest.slice(tArg.endIdx);
                }
              }
              chunks.push(
                `<div class="wt-beamer-block wt-beamer-${env}" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}">${blkTitle ? `<div class="wt-beamer-block-title">${renderInline(blkTitle, ctx, loc.file, loc.line)}</div>` : ""}<div class="wt-beamer-block-body">${parseBodyToHtml(blkRest, ctx, bodyAbsOffset, loc.file, loc.line)}</div></div>`,
              );
              continue;
            } else if (env === "columns") {
              chunks.push(`<div class="wt-columns">${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`);
              continue;
            } else if (env === "column") {
              const pct = colWidth.match(/([0-9.]+)\s*\\textwidth/);
              const style = pct ? `style="flex: 0 0 ${Math.round(parseFloat(pct[1]) * 100)}%"` : "";
              chunks.push(`<div class="wt-column" ${style}>${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`);
              continue;
            } else if (env === "center" || env === "flushleft" || env === "flushright") {
              const align = env === "center" ? "center" : env === "flushright" ? "right" : "left";
              chunks.push(`<div style="text-align:${align}">${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`);
              continue;
            } else if (env === "quote" || env === "quotation" || env === "verse") {
              chunks.push(`<blockquote class="wt-quote wt-${env}">${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</blockquote>`);
              continue;
            } else if (env === "tcolorbox" || env === "mdframed") {
              const tMatch = optArgStr.match(/title\s*=\s*(?:\{([^}]+)\}|([^,\]]+))/);
              const boxTitle = tMatch ? (tMatch[1] || tMatch[2]) : "";
              chunks.push(
                `<div class="wt-tcolorbox">${boxTitle ? `<div class="wt-tcolorbox-title">${renderInline(boxTitle, ctx, loc.file, loc.line)}</div>` : ""}${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`,
              );
              continue;
            } else if (env === "multicols") {
              const nArg = extractBalancedArg(envBody.trimStart(), 0);
              const cols = nArg ? parseInt(nArg.content, 10) || 2 : 2;
              const inner = nArg ? envBody.trimStart().slice(nArg.endIdx) : envBody;
              chunks.push(`<div style="column-count:${cols};column-gap:1.8rem">${parseBodyToHtml(inner, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`);
              continue;
            } else if (env === "minipage") {
              const wArg = extractBalancedArg(envBody.trimStart(), 0);
              const inner = wArg ? envBody.trimStart().slice(wArg.endIdx) : envBody;
              chunks.push(`<div class="wt-minipage">${parseBodyToHtml(inner, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`);
              continue;
            } else if (env === "titlepage") {
              chunks.push(`<div class="wt-titlepage">${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`);
              continue;
            } else if (env === "thebibliography") {
              const skipW = extractBalancedArg(envBody.trimStart(), 0);
              const bibText = skipW ? envBody.trimStart().slice(skipW.endIdx) : envBody;
              const bibItems = bibText.split(/\\bibitem(?:\[[^\]]*\])?\{([^}]+)\}/);
              const lis: string[] = [];
              let num = 1;
              for (let k = 1; k < bibItems.length; k += 2) {
                const key = bibItems[k].trim();
                const content = (bibItems[k + 1] || "").trim();
                ctx.bibEntries[key] = {
                  key,
                  type: "misc",
                  fields: { title: content },
                  file: loc.file,
                  line: loc.line,
                  raw: content,
                };
                lis.push(`<li id="bib-${escapeHtml(key)}"><span class="wt-bib-tag">[${num}]</span> ${renderInline(content, ctx, loc.file, loc.line)}</li>`);
                num++;
              }
              ctx.hasBibCommand = true;
              chunks.push(`<section class="wt-bibliography"><h2 class="wt-section-h2">References</h2><ol class="wt-bib-list">${lis.join("")}</ol></section>`);
              continue;
            } else {
              chunks.push(`<div class="wt-env-generic">${parseBodyToHtml(envBody, ctx, bodyAbsOffset, loc.file, loc.line)}</div>`);
              continue;
            }
          }
        }
      }

      const cmdMatch = rawSource.slice(i).match(/^\\([A-Za-z]+)(\*?)/);
      if (cmdMatch) {
        const cmd = cmdMatch[1];
        const starred = cmdMatch[2] === "*";
        let afterCmd = i + cmdMatch[0].length;
        const loc = locAt(i);

        if (cmd === "maketitle") {
          flushParagraph();
          chunks.push(renderTitleBlock(ctx));
          i = afterCmd;
          continue;
        }
        if (cmd === "opening") {
          const arg = extractBalancedArg(rawSource, afterCmd);
          if (arg) {
            flushParagraph();
            chunks.push(`<p class="wt-p wt-letter-opening">${renderInline(arg.content, ctx, loc.file, loc.line)}</p>`);
            i = arg.endIdx;
            continue;
          }
        }
        if (cmd === "closing") {
          const arg = extractBalancedArg(rawSource, afterCmd);
          if (arg) {
            flushParagraph();
            const sigHtml = ctx.signature
              ? `<div class="wt-letter-sig">${renderInline(ctx.signature, ctx, loc.file, loc.line)}</div>`
              : "";
            chunks.push(`<div class="wt-letter-closing"><p class="wt-p">${renderInline(arg.content, ctx, loc.file, loc.line)}</p>${sigHtml}</div>`);
            i = arg.endIdx;
            continue;
          }
        }
        if (cmd === "tableofcontents") {
          flushParagraph();
          chunks.push(addPlaceholder(ctx, { kind: "toc" }));
          i = afterCmd;
          continue;
        }
        if (cmd === "listoffigures") {
          flushParagraph();
          chunks.push(addPlaceholder(ctx, { kind: "lof" }));
          i = afterCmd;
          continue;
        }
        if (cmd === "listoftables") {
          flushParagraph();
          chunks.push(addPlaceholder(ctx, { kind: "lot" }));
          i = afterCmd;
          continue;
        }
        if (cmd === "appendix") {
          flushParagraph();
          ctx.isAppendix = true;
          ctx.chapterCount = 0;
          ctx.sectionCount = 0;
          i = afterCmd;
          continue;
        }
        if (cmd === "newpage" || cmd === "clearpage" || cmd === "pagebreak") {
          flushParagraph();
          chunks.push(`<div class="wt-page-break" aria-hidden="true"><span>Page Break</span></div>`);
          i = afterCmd;
          continue;
        }
        if (cmd === "bibliographystyle") {
          const arg = extractBalancedArg(rawSource, afterCmd);
          if (arg) {
            const st = arg.content.trim().toLowerCase();
            if (st === "plain" || st === "unsrt" || st === "alpha" || st === "ieee" || st === "apalike") {
              ctx.bibStyle = st;
            } else if (st === "ieeetran") {
              ctx.bibStyle = "ieee";
            }
            i = arg.endIdx;
            continue;
          }
        }
        if (cmd === "bibliography" || cmd === "printbibliography") {
          flushParagraph();
          ctx.hasBibCommand = true;
          if (cmd === "bibliography") {
            const arg = extractBalancedArg(rawSource, afterCmd);
            if (arg) afterCmd = arg.endIdx;
          } else if (rawSource[afterCmd] === "[") {
            const opt = extractBalancedArg(rawSource, afterCmd, "[", "]");
            if (opt) afterCmd = opt.endIdx;
          }
          chunks.push(addPlaceholder(ctx, { kind: "bib" }));
          i = afterCmd;
          continue;
        }
        if (
          cmd === "part" ||
          cmd === "chapter" ||
          cmd === "section" ||
          cmd === "subsection" ||
          cmd === "subsubsection" ||
          cmd === "paragraph" ||
          cmd === "subparagraph"
        ) {
          if (rawSource[afterCmd] === "[") {
            const skipOpt = extractBalancedArg(rawSource, afterCmd, "[", "]");
            if (skipOpt) afterCmd = skipOpt.endIdx;
          }
          const titleArg = extractBalancedArg(rawSource, afterCmd);
          if (titleArg) {
            flushParagraph();
            i = titleArg.endIdx;
            const rawTitle = titleArg.content;
            const plainTitle = cleanPlainTitle(rawTitle);
            let numStr = "";
            let level = 1;
            let tag = "h2";

            const alphaPrefix = (n: number) => String.fromCharCode(64 + ((n - 1) % 26) + 1);

            if (cmd === "part") {
              level = 0;
              tag = "h1";
              if (!starred) {
                ctx.partCount++;
                numStr = `Part ${ctx.partCount}`;
              }
            } else if (cmd === "chapter") {
              level = 0;
              tag = "h1";
              if (!starred) {
                ctx.chapterCount++;
                ctx.sectionCount = 0;
                ctx.subsectionCount = 0;
                ctx.subsubsectionCount = 0;
                numStr = ctx.isAppendix ? alphaPrefix(ctx.chapterCount) : String(ctx.chapterCount);
              }
            } else if (cmd === "section") {
              level = 1;
              tag = "h2";
              if (!starred) {
                ctx.sectionCount++;
                ctx.subsectionCount = 0;
                ctx.subsubsectionCount = 0;
                const secLabel =
                  ctx.docClass === "report" || ctx.docClass === "book"
                    ? `${ctx.chapterCount}.${ctx.sectionCount}`
                    : ctx.isAppendix
                      ? alphaPrefix(ctx.sectionCount)
                      : String(ctx.sectionCount);
                numStr = secLabel;
              }
            } else if (cmd === "subsection") {
              level = 2;
              tag = "h3";
              if (!starred) {
                ctx.subsectionCount++;
                ctx.subsubsectionCount = 0;
                const base =
                  ctx.docClass === "report" || ctx.docClass === "book"
                    ? `${ctx.chapterCount}.${ctx.sectionCount}`
                    : ctx.isAppendix
                      ? alphaPrefix(ctx.sectionCount)
                      : String(ctx.sectionCount);
                numStr = `${base}.${ctx.subsectionCount}`;
              }
            } else if (cmd === "subsubsection") {
              level = 3;
              tag = "h4";
              if (!starred) {
                ctx.subsubsectionCount++;
                const base =
                  ctx.docClass === "report" || ctx.docClass === "book"
                    ? `${ctx.chapterCount}.${ctx.sectionCount}`
                    : String(ctx.sectionCount);
                numStr = `${base}.${ctx.subsectionCount}.${ctx.subsubsectionCount}`;
              }
            } else {
              level = 4;
              tag = "h5";
            }

            const secId = `sec-${cmd}-${ctx.outline.length + 1}`;
            if (!starred) {
              ctx.lastAnchor = {
                refText: numStr || plainTitle,
                kind: "section",
                targetId: secId,
                title: plainTitle,
              };
            }
            ctx.outline.push({
              id: `out-${secId}`,
              title: plainTitle,
              level,
              kind:
                cmd === "part" ||
                cmd === "chapter" ||
                cmd === "section" ||
                cmd === "subsection" ||
                cmd === "subsubsection"
                  ? cmd
                  : "subsubsection",
              number: numStr || undefined,
              file: loc.file,
              line: loc.line,
              targetId: secId,
            });

            const numHtml = numStr ? `<span class="wt-sec-num">${escapeHtml(numStr)}</span>` : "";
            const chapterPrefix =
              cmd === "chapter" && numStr
                ? `<div class="wt-chapter-kicker">${ctx.isAppendix ? "Appendix" : "Chapter"} ${escapeHtml(numStr)}</div>`
                : "";
            chunks.push(
              `<${tag} id="${secId}" class="wt-heading wt-${cmd}" data-source-file="${escapeHtml(loc.file)}" data-source-line="${loc.line}">${chapterPrefix}${cmd === "chapter" ? "" : numHtml}${renderInline(rawTitle, ctx, loc.file, loc.line)}</${tag}>`,
            );
            continue;
          }
        }
      }
    }

    if (paraStartOffset === -1 && !/[ \t\n]/.test(rawSource[i])) {
      paraStartOffset = i;
    }
    paraBuffer += rawSource[i];
    i++;
  }

  flushParagraph();
  return chunks.join("\n");
}

function parsePreamble(lines: SourceLine[], ctx: CompileContext): void {
  const joined = lines.map((l) => l.text).join("\n");

  const docClassMatch = joined.match(/\\documentclass(?:\[([^\]]*)\])?\{([^}]+)\}/);
  if (docClassMatch) {
    ctx.classOptions = (docClassMatch[1] || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    ctx.docClass = docClassMatch[2].trim();
    ctx.isTwoColumn = ctx.classOptions.includes("twocolumn") || ctx.docClass === "IEEEtran";
    ctx.isBeamer = ctx.docClass === "beamer";
  }

  const pkgRegex = /\\usepackage(?:\[([^\]]*)\])?\{([^}]+)\}/g;
  let pkgMatch: RegExpExecArray | null;
  const loadedPackages = new Set<string>();
  while ((pkgMatch = pkgRegex.exec(joined)) !== null) {
    for (const p of pkgMatch[2].split(",")) {
      loadedPackages.add(p.trim());
    }
  }
  if (loadedPackages.has("physics")) {
    ctx.macros["\\div"] = "\\nabla \\cdot";
  }

  const extractMeta = (cmd: string): string | undefined => {
    const re = new RegExp(`\\\\${cmd}\\s*\\{`);
    const m = re.exec(joined);
    if (!m) return undefined;
    const arg = extractBalancedArg(joined, m.index + m[0].length - 1);
    return arg?.content.trim();
  };

  ctx.title = extractMeta("title");
  ctx.subtitle = extractMeta("subtitle");
  ctx.author = extractMeta("author");
  ctx.date = extractMeta("date");
  ctx.institute = extractMeta("institute");
  ctx.address = extractMeta("address");
  ctx.signature = extractMeta("signature");

  const colorRe = /\\definecolor\{([^}]+)\}\{([^}]+)\}\{([^}]+)\}/g;
  let cm: RegExpExecArray | null;
  while ((cm = colorRe.exec(joined)) !== null) {
    const name = cm[1].trim().toLowerCase();
    const model = cm[2].trim().toLowerCase();
    const val = cm[3].trim();
    if (model === "html") ctx.colors[name] = `#${val.replace(/^#/, "")}`;
    else if (model === "rgb") ctx.colors[name] = `rgb(${val})`;
  }

  const thmRe = /\\newtheorem(\*?)\{([^}]+)\}(?:\[([^\]]+)\])?\{([^}]+)\}(?:\[([^\]]+)\])?/g;
  let tm: RegExpExecArray | null;
  while ((tm = thmRe.exec(joined)) !== null) {
    ctx.theorems[tm[2].trim()] = {
      env: tm[2].trim(),
      title: tm[4].trim(),
      numberedLike: tm[3]?.trim(),
      within: tm[5]?.trim(),
      starred: tm[1] === "*",
    };
  }

  // \newenvironment{name}{begin}{end}
  const newEnvRe = /\\(?:newenvironment|renewenvironment)\{([^}]+)\}/g;
  let em: RegExpExecArray | null;
  while ((em = newEnvRe.exec(joined)) !== null) {
    const envName = em[1].trim();
    let p = em.index + em[0].length;
    while (p < joined.length && /\s/.test(joined[p])) p++;
    if (joined[p] === "[") {
      const skip = extractBalancedArg(joined, p, "[", "]");
      if (skip) p = skip.endIdx;
    }
    const bArg = extractBalancedArg(joined, p, "{", "}");
    const eArg = bArg ? extractBalancedArg(joined, bArg.endIdx, "{", "}") : null;
    if (bArg && eArg) {
      ctx.customEnvs[envName] = { begin: bArg.content, end: eArg.content };
    }
  }

  const macroCmdRe = /\\(?:newcommand|renewcommand|providecommand)\*?\{?\\([A-Za-z]+)\}?/g;
  let mm: RegExpExecArray | null;
  while ((mm = macroCmdRe.exec(joined)) !== null) {
    const name = mm[1];
    let p = mm.index + mm[0].length;
    let nargs = 0;
    while (p < joined.length && /\s/.test(joined[p])) p++;
    if (joined[p] === "[") {
      const nArg = extractBalancedArg(joined, p, "[", "]");
      if (nArg) {
        nargs = parseInt(nArg.content, 10) || 0;
        p = nArg.endIdx;
      }
    }
    let optDefault: string | undefined;
    while (p < joined.length && /\s/.test(joined[p])) p++;
    if (joined[p] === "[") {
      const optDef = extractBalancedArg(joined, p, "[", "]");
      if (optDef) {
        optDefault = optDef.content;
        p = optDef.endIdx;
      }
    }
    const bodyArg = extractBalancedArg(joined, p, "{", "}");
    if (bodyArg) {
      if (optDefault !== undefined) {
        ctx.optMacros[name] = {
          args: Math.max(1, nargs),
          defaultOpt: optDefault,
          body: bodyArg.content,
        };
      } else {
        ctx.macros[`\\${name}`] = bodyArg.content;
      }
      ctx.textMacros[name] = {
        args: nargs,
        defaultOpt: optDefault,
        body: bodyArg.content,
      };
    }
  }

  const dmoRe = /\\DeclareMathOperator(\*?)\{?\\([A-Za-z]+)\}?\{([^}]+)\}/g;
  let dm: RegExpExecArray | null;
  while ((dm = dmoRe.exec(joined)) !== null) {
    ctx.macros[`\\${dm[2]}`] = `\\operatorname${dm[1]}{${dm[3]}}`;
  }

  const bibStyleM = joined.match(/\\bibliographystyle\{([^}]+)\}/);
  if (bibStyleM) {
    const st = bibStyleM[1].trim().toLowerCase();
    if (st === "plain" || st === "unsrt" || st === "alpha" || st === "ieee" || st === "apalike") {
      ctx.bibStyle = st;
    } else if (st === "ieeetran") {
      ctx.bibStyle = "ieee";
    }
  }
}

function validateStructure(bodyLines: SourceLine[], ctx: CompileContext): void {
  const stack: Array<{ env: string; file: string; line: number }> = [];
  const braceStack: Array<{ file: string; line: number }> = [];
  let inVerbatim: string | null = null;
  let unclosedDollar: { file: string; line: number } | null = null;

  for (const entry of bodyLines) {
    const text = entry.text;
    if (inVerbatim) {
      if (text.includes(`\\end{${inVerbatim}}`)) inVerbatim = null;
      continue;
    }

    const envRegex = /\\(begin|end)\{([A-Za-z*]+)\}/g;
    let m: RegExpExecArray | null;
    while ((m = envRegex.exec(text)) !== null) {
      const kind = m[1];
      const env = m[2];
      if (kind === "begin") {
        if (VERBATIM_ENVS.has(env) && !text.includes(`\\end{${env}}`)) {
          inVerbatim = env;
          break;
        }
        if (!VERBATIM_ENVS.has(env)) {
          stack.push({ env, file: entry.file, line: entry.line });
        }
      } else {
        if (VERBATIM_ENVS.has(env)) continue;
        if (stack.length === 0) {
          addDiag(ctx, "error", entry.file, entry.line, `Unexpected \\end{${env}} without matching \\begin{${env}}.`);
        } else {
          const top = stack[stack.length - 1];
          if (top.env !== env) {
            addDiag(
              ctx,
              "error",
              entry.file,
              entry.line,
              `Mismatched environment: \\end{${env}} closes \\begin{${top.env}} (opened at ${top.file}:${top.line}).`,
            );
          }
          stack.pop();
        }
      }
    }

    if (inVerbatim) continue;

    // Brace and $ math check (skipping \verb|...| and escaped characters)
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === "\\" && i + 1 < text.length) {
        if (text.startsWith("\\verb", i) && i + 5 < text.length && !/[A-Za-z]/.test(text[i + 5])) {
          const d = text[i + 5];
          const endV = text.indexOf(d, i + 6);
          if (endV !== -1) {
            i = endV;
            continue;
          }
        }
        i++;
        continue;
      }
      if (ch === "{") braceStack.push({ file: entry.file, line: entry.line });
      else if (ch === "}") {
        if (braceStack.length === 0) {
          addDiag(ctx, "warning", entry.file, entry.line, "Extra closing brace `}` found.");
        } else {
          braceStack.pop();
        }
      } else if (ch === "$") {
        if (text[i + 1] === "$") {
          i++;
        } else {
          unclosedDollar = unclosedDollar ? null : { file: entry.file, line: entry.line };
        }
      }
    }
  }

  for (const unclosed of stack) {
    addDiag(
      ctx,
      "error",
      unclosed.file,
      unclosed.line,
      `Unclosed environment \\begin{${unclosed.env}}.`,
    );
  }
  if (braceStack.length > 0) {
    const first = braceStack[0];
    addDiag(
      ctx,
      "warning",
      first.file,
      first.line,
      `${braceStack.length} unclosed opening brace \`{\` detected.`,
    );
  }
  if (unclosedDollar) {
    addDiag(
      ctx,
      "warning",
      unclosedDollar.file,
      unclosedDollar.line,
      "Unclosed inline math delimiter `$` detected.",
    );
  }
}

function resolvePlaceholders(html: string, ctx: CompileContext): string {
  const orderedBibKeys = sortCitationKeys(ctx.citedOrder, ctx.bibEntries, ctx.bibStyle);

  const phPattern = new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, "g");
  let out = html.replace(phPattern, (_, idxStr: string) => {
    const ph = ctx.placeholders[parseInt(idxStr, 10)];
    if (!ph) return "";

    if (ph.kind === "ref") {
      const lbl = ctx.labels[ph.key];
      if (!lbl) {
        addDiag(
          ctx,
          "warning",
          ph.file,
          ph.line,
          `Undefined reference label "${ph.key}".`,
        );
        return `<span class="wt-ref-missing" title="Undefined label: ${escapeHtml(ph.key)}">??</span>`;
      }
      let text = lbl.refText;
      if (ph.cmd === "eqref") text = `(${lbl.refText})`;
      else if (ph.cmd === "autoref" || ph.cmd === "cref") {
        const cap = lbl.kind.charAt(0).toUpperCase() + lbl.kind.slice(1);
        text = `${cap} ${lbl.refText}`;
      } else if (ph.cmd === "pageref") {
        text = "1";
      }
      return `<a href="#${escapeHtml(lbl.targetId)}" class="wt-ref-link" data-target-id="${escapeHtml(lbl.targetId)}">${escapeHtml(text)}</a>`;
    }

    if (ph.kind === "cite") {
      for (const k of ph.keys) {
        if (!ctx.bibEntries[k]) {
          addDiag(ctx, "warning", ph.file, ph.line, `Citation "${k}" not found in .bib files.`);
        }
      }
      const citHtml = formatInlineCitationHtml(
        ph.keys,
        orderedBibKeys,
        ctx.bibEntries,
        ctx.bibStyle,
        ph.cmd as "cite" | "citep" | "citet" | "citeauthor" | "citeyear",
      );
      return ph.note ? citHtml.replace(/\]$/, `, ${escapeHtml(ph.note)}]`) : citHtml;
    }

    if (ph.kind === "toc") {
      const sections = ctx.outline.filter(
        (n) =>
          n.kind === "part" ||
          n.kind === "chapter" ||
          n.kind === "section" ||
          n.kind === "subsection",
      );
      if (sections.length === 0) return "";
      const rows = sections
        .map(
          (n) =>
            `<div class="wt-toc-row wt-toc-lvl-${n.level}"><a href="#${escapeHtml(n.targetId || "")}" class="wt-toc-link" data-target-id="${escapeHtml(n.targetId || "")}">${n.number ? `<span class="wt-toc-num">${escapeHtml(n.number)}</span>` : ""}<span>${escapeHtml(n.title)}</span></a></div>`,
        )
        .join("");
      return `<nav class="wt-toc"><div class="wt-toc-title">Contents</div>${rows}</nav>`;
    }

    if (ph.kind === "lof") {
      const figs = ctx.outline.filter((n) => n.kind === "figure");
      if (figs.length === 0) return "";
      return `<nav class="wt-toc"><div class="wt-toc-title">List of Figures</div>${figs
        .map(
          (n) =>
            `<div class="wt-toc-row"><a href="#${escapeHtml(n.targetId || "")}" class="wt-toc-link" data-target-id="${escapeHtml(n.targetId || "")}">${escapeHtml(n.title)}</a></div>`,
        )
        .join("")}</nav>`;
    }

    if (ph.kind === "lot") {
      const tabs = ctx.outline.filter((n) => n.kind === "table");
      if (tabs.length === 0) return "";
      return `<nav class="wt-toc"><div class="wt-toc-title">List of Tables</div>${tabs
        .map(
          (n) =>
            `<div class="wt-toc-row"><a href="#${escapeHtml(n.targetId || "")}" class="wt-toc-link" data-target-id="${escapeHtml(n.targetId || "")}">${escapeHtml(n.title)}</a></div>`,
        )
        .join("")}</nav>`;
    }

    if (ph.kind === "bib") {
      return renderBibliographyHtml(orderedBibKeys, ctx.bibEntries, ctx.bibStyle);
    }

    return "";
  });

  if (!ctx.hasBibCommand && orderedBibKeys.length > 0) {
    out += renderBibliographyHtml(orderedBibKeys, ctx.bibEntries, ctx.bibStyle);
  }

  if (ctx.footnotes.length > 0) {
    const fnRows = ctx.footnotes
      .map(
        (f) =>
          `<li id="fn-${f.id}"><span class="wt-fn-back"><a href="#fnref-${f.id}">${f.id}.</a></span> ${f.html}</li>`,
      )
      .join("");
    out += `<footer class="wt-footnotes"><hr class="wt-fn-rule" /><ol class="wt-fn-list">${fnRows}</ol></footer>`;
  }

  return out;
}

export function compileLaTeXProject(
  project: WeTeXProject,
  options?: { defaultBibStyle?: BibliographyStyle },
): CompileResult {
  const startMs = typeof performance !== "undefined" ? performance.now() : Date.now();
  const diagnostics: CompilerDiagnostic[] = [];

  const bibEntries: Record<string, BibEntry> = {};
  for (const file of project.files) {
    if (file.kind === "bib") {
      for (const entry of parseBibTeX(file.content, file.path)) {
        bibEntries[entry.key] = entry;
      }
    }
  }

  const expanded = expandIncludes(
    project.files,
    project.mainFilePath,
    diagnostics,
    new Set(),
  );
  const strippedLines = stripCommentsPreserveLines(expanded);

  let beginDocIdx = -1;
  let endDocIdx = -1;
  for (let i = 0; i < strippedLines.length; i++) {
    if (beginDocIdx === -1 && /\\begin\{document\}/.test(strippedLines[i].text)) {
      beginDocIdx = i;
    } else if (/\\end\{document\}/.test(strippedLines[i].text)) {
      endDocIdx = i;
      break;
    }
  }

  const preambleLines = beginDocIdx >= 0 ? strippedLines.slice(0, beginDocIdx) : [];
  const bodyLines =
    beginDocIdx >= 0
      ? strippedLines.slice(beginDocIdx + 1, endDocIdx >= 0 ? endDocIdx : strippedLines.length)
      : strippedLines;

  if (beginDocIdx === -1) {
    diagnostics.push({
      id: `diag-no-doc-${diagnostics.length + 1}`,
      severity: "warning",
      file: project.mainFilePath,
      line: 1,
      message: "Missing \\begin{document} — rendering file contents directly.",
    });
  } else if (endDocIdx === -1) {
    diagnostics.push({
      id: `diag-no-enddoc-${diagnostics.length + 1}`,
      severity: "warning",
      file: project.mainFilePath,
      line: strippedLines.length,
      message: "Missing \\end{document} at end of document.",
    });
  }

  const cleanBody = bodyLines.map((l) => l.text).join("\n");
  const lineStarts = buildLineStarts(bodyLines);

  const ctx: CompileContext = {
    project,
    macros: { ...BASE_MACROS },
    textMacros: {},
    optMacros: {},
    colors: { ...NAMED_COLORS },
    theorems: { ...DEFAULT_THEOREMS },
    theoremCounters: {},
    customEnvs: {},
    diagnostics,
    outline: [],
    labels: {},
    bibEntries,
    citedOrder: [],
    citedSet: new Set(),
    bibStyle: options?.defaultBibStyle ?? "plain",
    footnotes: [],
    placeholders: [],
    docClass: "article",
    classOptions: [],
    isTwoColumn: false,
    isBeamer: false,
    isAppendix: false,
    partCount: 0,
    chapterCount: 0,
    sectionCount: 0,
    subsectionCount: 0,
    subsubsectionCount: 0,
    equationCount: 0,
    subeqGroup: null,
    subeqLetterIndex: 0,
    figureCount: 0,
    tableCount: 0,
    mathCount: 0,
    listingCount: 0,
    algorithmCount: 0,
    lastAnchor: { refText: "1", kind: "section", targetId: "top" },
    hasBibCommand: false,
    bodyLines,
    lineStarts,
    resolvedImageFallback: (imgPath: string) => {
      const base = imgPath.split("/").pop()?.replace(/\.[^.]+$/, "") || "";
      if (!base) return undefined;
      return project.files.find(
        (f) => f.kind === "image" && f.path.includes(base),
      );
    },
  };

  parsePreamble(preambleLines, ctx);
  validateStructure(bodyLines, ctx);

  const rawHtml = parseBodyToHtml(cleanBody, ctx, 0, project.mainFilePath, 1);
  const resolvedHtml = resolvePlaceholders(rawHtml, ctx);

  for (const lbl of Object.values(ctx.labels)) {
    ctx.outline.push({
      id: `out-lbl-${lbl.key}`,
      title: `\\label{${lbl.key}} (${lbl.refText})`,
      level: 5,
      kind: "label",
      file: lbl.file,
      line: lbl.line,
      targetId: lbl.targetId,
    });
  }

  const proseOnly = bodyLines
    .map((l) => l.text)
    .join(" ")
    .replace(/\\[A-Za-z]+\*?(?:\[[^\]]*\])?/g, " ")
    .replace(/[${}\[\]&\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = proseOnly ? proseOnly.split(" ").length : 0;
  const charCount = bodyLines.reduce((acc, l) => acc + l.text.length, 0);

  const slideCount = ctx.isBeamer
    ? Math.max(1, ctx.outline.filter((o) => o.kind === "frame").length)
    : 0;
  const estimatedPages = ctx.isBeamer
    ? slideCount
    : Math.max(
        1,
        Math.ceil(
          (wordCount + ctx.equationCount * 35 + ctx.figureCount * 110 + ctx.tableCount * 90) /
            (ctx.isTwoColumn ? 620 : 380),
        ),
      );

  const endMs = typeof performance !== "undefined" ? performance.now() : Date.now();
  const compileTimeMs = Math.max(1, Math.round(endMs - startMs));

  const errCount = ctx.diagnostics.filter((d) => d.severity === "error").length;
  const warnCount = ctx.diagnostics.filter((d) => d.severity === "warning").length;

  const logLines = [
    `This is WeTeX Instant Engine 2.1 (KaTeX ${katex.version} + TikZ-SVG + BibTeX)`,
    `Main file: ${project.mainFilePath} | Document class: ${ctx.docClass}${ctx.classOptions.length ? ` [${ctx.classOptions.join(", ")}]` : ""}`,
    `Files processed: ${project.files.length} | Bibliography entries: ${Object.keys(bibEntries).length} (${ctx.bibStyle})`,
    `Pass 1: Parsed preamble & ${Object.keys(ctx.macros).length} math macros`,
    `Pass 2: Typeset ${ctx.equationCount} numbered equations, ${ctx.figureCount} figures, ${ctx.tableCount} tables, ${ctx.mathCount} math expressions`,
    `Pass 3: Resolved ${Object.keys(ctx.labels).length} labels, ${ctx.citedOrder.length} citations, ${ctx.footnotes.length} footnotes`,
    ...ctx.diagnostics.map(
      (d) => `[${d.severity.toUpperCase()}] ${d.file}:${d.line} — ${d.message}`,
    ),
    `Output generated (${estimatedPages} ${ctx.isBeamer ? "slides" : "pages"}, ${wordCount} words) in ${compileTimeMs} ms — ${errCount} errors, ${warnCount} warnings.`,
  ];

  const wrappedHtml = ctx.isBeamer
    ? `<div class="wt-beamer-deck">${resolvedHtml}</div>`
    : `<div class="wt-doc-class-${escapeHtml(ctx.docClass)} ${ctx.isTwoColumn ? "wt-two-col" : ""}">${resolvedHtml}</div>`;

  return {
    html: wrappedHtml,
    documentClass: ctx.docClass,
    classOptions: ctx.classOptions,
    isTwoColumn: ctx.isTwoColumn,
    isBeamer: ctx.isBeamer,
    title: ctx.title,
    subtitle: ctx.subtitle,
    author: ctx.author,
    date: ctx.date,
    diagnostics: ctx.diagnostics,
    outline: ctx.outline,
    labels: ctx.labels,
    bibEntries,
    citedKeys: ctx.citedOrder,
    stats: {
      wordCount,
      charCount,
      mathCount: ctx.mathCount,
      equationCount: ctx.equationCount,
      figureCount: ctx.figureCount,
      tableCount: ctx.tableCount,
      citationCount: ctx.citedOrder.length,
      footnoteCount: ctx.footnotes.length,
      estimatedPages,
      compileTimeMs,
    },
    logLines,
    pageCount: estimatedPages,
    success: errCount === 0,
  };
}
