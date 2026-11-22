import type { ProjectFileKind } from "./types";
import { escapeHtml } from "./utils";

const STRUCTURAL_CMDS = new Set([
  "documentclass",
  "usepackage",
  "begin",
  "end",
  "part",
  "chapter",
  "section",
  "subsection",
  "subsubsection",
  "paragraph",
  "subparagraph",
  "title",
  "subtitle",
  "author",
  "date",
  "institute",
  "maketitle",
  "tableofcontents",
  "listoffigures",
  "listoftables",
  "input",
  "include",
  "bibliography",
  "bibliographystyle",
  "addbibresource",
  "newcommand",
  "renewcommand",
  "providecommand",
  "DeclareMathOperator",
  "newtheorem",
  "newenvironment",
  "theoremstyle",
  "frametitle",
  "framesubtitle",
  "appendix",
]);

const MATH_ENV_NAMES = new Set([
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
  "eqnarray",
  "eqnarray*",
]);

interface TexHighlightState {
  inDisplayDollar: boolean;
  inBracketMath: boolean;
  mathEnv: string | null;
}

function highlightTexLine(
  line: string,
  state: TexHighlightState,
): string {
  let out = "";
  let i = 0;
  let inInlineDollar = false;

  const isMathActive = () =>
    inInlineDollar ||
    state.inDisplayDollar ||
    state.inBracketMath ||
    state.mathEnv !== null;

  while (i < line.length) {
    const ch = line[i];

    if (ch === "%") {
      out += `<span class="wt-hl-comment">${escapeHtml(line.slice(i))}</span>`;
      break;
    }

    if (ch === "\\") {
      if (i + 1 < line.length && !/[A-Za-z@]/.test(line[i + 1])) {
        const two = line.slice(i, i + 2);
        if (two === "\\[") {
          state.inBracketMath = true;
          out += `<span class="wt-hl-math">${escapeHtml(two)}</span>`;
        } else if (two === "\\]") {
          state.inBracketMath = false;
          out += `<span class="wt-hl-math">${escapeHtml(two)}</span>`;
        } else if (two === "\\(" || two === "\\)") {
          out += `<span class="wt-hl-math">${escapeHtml(two)}</span>`;
        } else {
          out += `<span class="wt-hl-cmd">${escapeHtml(two)}</span>`;
        }
        i += 2;
        continue;
      }
      let j = i + 1;
      while (j < line.length && /[A-Za-z@*]/.test(line[j])) j++;
      const cmdName = line.slice(i + 1, j);
      const fullCmd = line.slice(i, j);
      const cls = STRUCTURAL_CMDS.has(cmdName) ? "wt-hl-struct" : "wt-hl-cmd";
      out += `<span class="${cls}">${escapeHtml(fullCmd)}</span>`;
      i = j;

      if ((cmdName === "begin" || cmdName === "end") && line[i] === "{") {
        const close = line.indexOf("}", i + 1);
        if (close > i) {
          const envName = line.slice(i + 1, close);
          if (cmdName === "begin" && MATH_ENV_NAMES.has(envName)) {
            state.mathEnv = envName;
          } else if (cmdName === "end" && state.mathEnv === envName) {
            state.mathEnv = null;
          }
          out += `<span class="wt-hl-brace">{</span><span class="wt-hl-env">${escapeHtml(envName)}</span><span class="wt-hl-brace">}</span>`;
          i = close + 1;
        }
      }
      continue;
    }

    if (ch === "$") {
      if (line[i + 1] === "$") {
        state.inDisplayDollar = !state.inDisplayDollar;
        out += `<span class="wt-hl-math">$$</span>`;
        i += 2;
        continue;
      }
      inInlineDollar = !inInlineDollar;
      out += `<span class="wt-hl-math">$</span>`;
      i++;
      continue;
    }

    if (ch === "{" || ch === "}" || ch === "[" || ch === "]") {
      out += `<span class="wt-hl-brace">${ch}</span>`;
      i++;
      continue;
    }

    if (ch === "&") {
      out += `<span class="wt-hl-struct">&amp;</span>`;
      i++;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < line.length && /[0-9.]/.test(line[j])) j++;
      out += `<span class="${isMathActive() ? "wt-hl-math" : "wt-hl-num"}">${escapeHtml(line.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    let j = i + 1;
    while (j < line.length && !/[%\\${}[\]&0-9]/.test(line[j])) j++;
    const chunk = escapeHtml(line.slice(i, j));
    out += isMathActive() ? `<span class="wt-hl-math">${chunk}</span>` : chunk;
    i = j;
  }

  return out;
}

function highlightBibLine(line: string): string {
  if (/^\s*%/.test(line)) {
    return `<span class="wt-hl-comment">${escapeHtml(line)}</span>`;
  }
  const entryHead = line.match(/^(\s*)(@[A-Za-z]+)(\{)([^,]*)(,?.*)$/);
  if (entryHead) {
    return `${escapeHtml(entryHead[1])}<span class="wt-hl-struct">${escapeHtml(entryHead[2])}</span><span class="wt-hl-brace">${entryHead[3]}</span><span class="wt-hl-env">${escapeHtml(entryHead[4])}</span>${escapeHtml(entryHead[5])}`;
  }
  const fieldMatch = line.match(/^(\s*)([A-Za-z_-]+)(\s*=\s*)(.*)$/);
  if (fieldMatch) {
    return `${escapeHtml(fieldMatch[1])}<span class="wt-hl-cmd">${escapeHtml(fieldMatch[2])}</span>${escapeHtml(fieldMatch[3])}<span class="wt-hl-string">${escapeHtml(fieldMatch[4])}</span>`;
  }
  return escapeHtml(line);
}

export function highlightCode(code: string, kind: ProjectFileKind): string {
  const lines = code.split("\n");
  if (kind === "bib") {
    return lines.map(highlightBibLine).join("\n") + "\n ";
  }
  if (kind === "tex" || kind === "cls" || kind === "sty") {
    const state: TexHighlightState = {
      inDisplayDollar: false,
      inBracketMath: false,
      mathEnv: null,
    };
    return lines.map((line) => highlightTexLine(line, state)).join("\n") + "\n ";
  }
  return escapeHtml(code) + "\n ";
}
