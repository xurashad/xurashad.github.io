import katex from "katex";
import { highlightFencedCode, parseHighlightLines } from "./codeHighlight";
import { EMOJI_MAP } from "./emojis";
import { renderChartBlockToSvg, renderMermaidToSvg } from "./mermaidRenderer";
import type {
  FootnoteInfo,
  FrontmatterData,
  ImageInfo,
  LinkInfo,
  MarkdownFile,
  OutlineItem,
  RenderResult,
  SlideItem,
  TableSpanInfo,
} from "./types";
import { escapeHtml, escapeRegex, sanitizeHtml, sanitizeUrl, slugify } from "./utils";

export interface CompileMarkdownOptions {
  files?: MarkdownFile[];
  gfmBreaks?: boolean;
  autoNumberHeadings?: boolean;
  enableEmoji?: boolean;
  enableMath?: boolean;
  enableMermaid?: boolean;
  enableHtml?: boolean;
}

const KATEX_MACROS: Record<string, string> = {
  "\\R": "\\mathbb{R}",
  "\\C": "\\mathbb{C}",
  "\\N": "\\mathbb{N}",
  "\\Z": "\\mathbb{Z}",
  "\\ket": "|#1\\rangle",
  "\\bra": "\\langle#1|",
  "\\braket": "\\langle#1|#2\\rangle",
  "\\pdv": "\\frac{\\partial #1}{\\partial #2}",
  "\\dv": "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}",
};

interface RefDef {
  url: string;
  title?: string;
}

interface RawFootnote {
  id: string;
  rawLines: string[];
  line: number;
  referenced: boolean;
}

interface ParseCtx {
  files: MarkdownFile[];
  refDefs: Map<string, RefDef>;
  footnotes: Map<string, RawFootnote>;
  abbrs: Map<string, string>;
  outline: OutlineItem[];
  slugCounts: Map<string, number>;
  links: LinkInfo[];
  images: ImageInfo[];
  undefinedFootnotes: Array<{ id: string; line: number }>;
  tableMismatches: TableSpanInfo[];
  options: Required<Omit<CompileMarkdownOptions, "files">>;
  headingCounters: number[];
  tasksTotal: number;
  tasksDone: number;
  codeBlocksCount: number;
  mathCount: number;
  tablesCount: number;
}

const CALLOUT_META: Record<
  string,
  { cls: string; defaultTitle: string; svg: string }
> = {
  note: {
    cls: "note",
    defaultTitle: "Note",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`,
  },
  info: {
    cls: "note",
    defaultTitle: "Info",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`,
  },
  tip: {
    cls: "tip",
    defaultTitle: "Tip",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.751.751 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"/></svg>`,
  },
  important: {
    cls: "important",
    defaultTitle: "Important",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>`,
  },
  warning: {
    cls: "warning",
    defaultTitle: "Warning",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>`,
  },
  caution: {
    cls: "caution",
    defaultTitle: "Caution",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`,
  },
  abstract: {
    cls: "abstract",
    defaultTitle: "Abstract",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688Z"/></svg>`,
  },
  success: {
    cls: "tip",
    defaultTitle: "Success",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z"/></svg>`,
  },
  question: {
    cls: "important",
    defaultTitle: "Question",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.92 6.085h.001a.749.749 0 1 1-1.342-.67c.169-.339.436-.701.849-.977C6.845 4.16 7.369 4 8 4a2.756 2.756 0 0 1 1.637.525c.503.377.863.965.863 1.725 0 .448-.115.83-.329 1.15-.205.307-.47.513-.692.662-.109.072-.22.138-.313.195l-.006.004a6.24 6.24 0 0 0-.26.16.952.952 0 0 0-.276.245.75.75 0 0 1-1.248-.832c.184-.264.42-.489.692-.661.103-.067.207-.132.313-.195l.007-.004c.1-.061.182-.11.258-.161a.969.969 0 0 0 .277-.245C8.96 6.514 9 6.392 9 6.25c0-.25-.118-.47-.314-.615A1.26 1.26 0 0 0 8 5.5c-.363 0-.657.09-.858.225-.19.126-.299.286-.222.36ZM8 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`,
  },
  failure: {
    cls: "caution",
    defaultTitle: "Failure",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z"/></svg>`,
  },
  bug: {
    cls: "caution",
    defaultTitle: "Bug",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M4.72.22a.75.75 0 0 1 1.06 0l1 1c.13.13.21.3.22.48h2a.75.75 0 0 1 .22-.48l1-1a.75.75 0 1 1 1.06 1.06l-.77.77c.49.55.81 1.25.92 2.02h1.57a.75.75 0 0 1 0 1.5h-1.5v1.5h2a.75.75 0 0 1 0 1.5h-2v1.5h1.5a.75.75 0 0 1 0 1.5h-1.57a4.502 4.502 0 0 1-8.86 0H1a.75.75 0 0 1 0-1.5h1.5v-1.5H.5a.75.75 0 0 1 0-1.5h2v-1.5H1a.75.75 0 0 1 0-1.5h1.57c.11-.77.43-1.47.92-2.02l-.77-.77a.75.75 0 0 1 0-1.06Z"/></svg>`,
  },
  example: {
    cls: "abstract",
    defaultTitle: "Example",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/></svg>`,
  },
  quote: {
    cls: "quote",
    defaultTitle: "Quote",
    svg: `<svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor"><path d="M1.75 2.5h12.5a.75.75 0 0 1 0 1.5H1.75a.75.75 0 0 1 0-1.5Zm4 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Zm0 5h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1 0-1.5Z"/></svg>`,
  },
};

function parseFrontmatter(lines: string[]): {
  frontmatter: FrontmatterData | null;
  bodyStartIdx: number;
} {
  if (lines.length < 3) return { frontmatter: null, bodyStartIdx: 0 };
  const first = lines[0].trim();
  const isYaml = first === "---";
  const isToml = first === "+++";
  if (!isYaml && !isToml) return { frontmatter: null, bodyStartIdx: 0 };

  const delim = isYaml ? "---" : "+++";
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === delim) {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) return { frontmatter: null, bodyStartIdx: 0 };

  const fmLines = lines.slice(1, endIdx);
  const fields: Record<string, string | string[] | boolean> = {};

  let currentArrayKey: string | null = null;
  for (const rawLine of fmLines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (currentArrayKey && trimmed.startsWith("- ")) {
      const val = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
      const arr = fields[currentArrayKey];
      if (Array.isArray(arr)) arr.push(val);
      continue;
    }
    currentArrayKey = null;

    const sep = isYaml ? ":" : "=";
    const sepIdx = rawLine.indexOf(sep);
    if (sepIdx === -1) continue;

    const key = rawLine.slice(0, sepIdx).trim();
    const rawVal = rawLine.slice(sepIdx + 1).trim();

    if (!rawVal && isYaml) {
      fields[key] = [];
      currentArrayKey = key;
      continue;
    }

    if (rawVal === "true") {
      fields[key] = true;
    } else if (rawVal === "false") {
      fields[key] = false;
    } else if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
      fields[key] = rawVal
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      fields[key] = rawVal.replace(/^["']|["']$/g, "");
    }
  }

  return {
    frontmatter: {
      format: isYaml ? "yaml" : "toml",
      raw: fmLines.join("\n"),
      startLine: 1,
      endLine: endIdx + 1,
      fields,
    },
    bodyStartIdx: endIdx + 1,
  };
}

function resolveWorkspaceImage(src: string, files: MarkdownFile[]): string {
  const clean = src.trim().replace(/^\.\//, "");
  const match = files.find(
    (f) =>
      f.kind === "image" &&
      (f.path === clean ||
        f.path.toLowerCase() === clean.toLowerCase() ||
        f.path.endsWith(`/${clean}`)),
  );
  if (match) return match.content;
  return sanitizeUrl(src, true);
}

function resolveWikiTarget(target: string, files: MarkdownFile[]): MarkdownFile | undefined {
  const norm = target.trim().toLowerCase().replace(/\.md$/, "");
  return files.find((f) => {
    const p = f.path.toLowerCase();
    const noExt = p.replace(/\.(md|markdown|mdx)$/, "");
    const base = noExt.split("/").pop() ?? noExt;
    return p === norm || noExt === norm || base === norm;
  });
}

function renderKatex(tex: string, displayMode: boolean, ctx: ParseCtx): string {
  if (!ctx.options.enableMath) {
    return escapeHtml(displayMode ? `$$${tex}$$` : `$${tex}$`);
  }
  ctx.mathCount++;
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
      macros: KATEX_MACROS,
      strict: false,
    });
  } catch {
    return `<code class="md-katex-err">${escapeHtml(tex)}</code>`;
  }
}

function parseLinkTarget(rawInner: string): {
  url: string;
  title?: string;
  sizeW?: string;
  sizeH?: string;
} {
  let inner = rawInner.trim();
  let sizeW: string | undefined;
  let sizeH: string | undefined;

  const sizeMatch = inner.match(/\s+=(\d+%?|\*)x?(\d+%?|\*)?\s*$/);
  if (sizeMatch) {
    if (sizeMatch[1] && sizeMatch[1] !== "*") sizeW = sizeMatch[1];
    if (sizeMatch[2] && sizeMatch[2] !== "*") sizeH = sizeMatch[2];
    inner = inner.slice(0, sizeMatch.index).trim();
  }

  let title: string | undefined;
  const titleMatch = inner.match(/^(.+?)\s+(?:"([^"]*)"|'([^']*)')\s*$/);
  if (titleMatch) {
    inner = titleMatch[1].trim();
    title = titleMatch[2] ?? titleMatch[3];
  }

  if (inner.startsWith("<") && inner.endsWith(">")) {
    inner = inner.slice(1, -1);
  }

  return { url: inner, title, sizeW, sizeH };
}

function parseInline(rawText: string, lineNum: number, ctx: ParseCtx): string {
  const tokens: string[] = [];
  const stash = (html: string): string => {
    const idx = tokens.length;
    tokens.push(html);
    return `\u0000MDTOK${idx}\u0000`;
  };

  let s = rawText;

  // 1. Escaped characters
  s = s.replace(/\\([\\`*_{}[\]()#+\-.!~=|>$^:<])/g, (_m, ch: string) =>
    stash(escapeHtml(ch)),
  );

  // 2. Inline code spans (supports variable backtick counts)
  s = s.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1/g, (_m, _ticks: string, body: string) =>
    stash(`<code>${escapeHtml(body.trim())}</code>`),
  );

  // 3. Inline KaTeX $...$ and \(...\)
  if (ctx.options.enableMath) {
    s = s.replace(/\\\(([\s\S]+?)\\\)/g, (_m, expr: string) =>
      stash(`<span class="md-inline-math">${renderKatex(expr, false, ctx)}</span>`),
    );
    s = s.replace(/\$([^\s$](?:[^$\n]*?[^\s$])?)\$/g, (full, expr: string) => {
      // Avoid currency pairs like "$5 and $10"
      if (/^\d[\d,.\s]*(?:and|or|to|vs|–|-)?\s*$/i.test(expr)) return full;
      return stash(`<span class="md-inline-math">${renderKatex(expr, false, ctx)}</span>`);
    });
  }

  // 4. Safe inline HTML elements (<kbd>, <mark>, <sub>, <sup>, <br>, <u>, <span>, etc.)
  if (ctx.options.enableHtml) {
    s = s.replace(
      /<(kbd|mark|sub|sup|u|s|del|ins|abbr|code|span|br|hr|img|a)\b([^>]*)>([\s\S]*?)<\/\1>|<(br|hr|img)\b([^>]*)\/?>/gi,
      (full) => stash(sanitizeHtml(full)),
    );
  }

  // 5. Images ![alt](url "title" =WxH) and reference images ![alt][id]
  s = s.replace(
    /!\[([^\]]*)\]\(([^)\n]+)\)/g,
    (_m, alt: string, rawInside: string) => {
      const { url, title, sizeW, sizeH } = parseLinkTarget(rawInside);
      ctx.images.push({ alt, src: url, line: lineNum });
      const resolved = resolveWorkspaceImage(url, ctx.files);
      const wAttr = sizeW ? ` width="${escapeHtml(sizeW)}"` : "";
      const hAttr = sizeH ? ` height="${escapeHtml(sizeH)}"` : "";
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      const imgTag = `<img src="${escapeHtml(resolved)}" alt="${escapeHtml(alt)}"${titleAttr}${wAttr}${hAttr} loading="lazy" />`;
      if (title) {
        return stash(
          `<figure class="md-figure">${imgTag}<figcaption>${escapeHtml(title)}</figcaption></figure>`,
        );
      }
      return stash(imgTag);
    },
  );

  s = s.replace(
    /!\[([^\]]*)\]\[([^\]]*)\]/g,
    (full, alt: string, refId: string) => {
      const key = (refId || alt).trim().toLowerCase();
      const def = ctx.refDefs.get(key);
      if (!def) return full;
      ctx.images.push({ alt, src: def.url, line: lineNum });
      const resolved = resolveWorkspaceImage(def.url, ctx.files);
      const titleAttr = def.title ? ` title="${escapeHtml(def.title)}"` : "";
      return stash(
        `<img src="${escapeHtml(resolved)}" alt="${escapeHtml(alt)}"${titleAttr} loading="lazy" />`,
      );
    },
  );

  // 6. Wiki links [[Target|Alias]] or [[Target]]
  s = s.replace(/\[\[([^\]|\n]+)(?:\|([^\]\n]+))?\]\]/g, (_m, target: string, alias?: string) => {
    const cleanTarget = target.trim();
    const label = (alias ?? cleanTarget).trim();
    const matched = resolveWikiTarget(cleanTarget, ctx.files);
    ctx.links.push({
      text: label,
      url: cleanTarget,
      line: lineNum,
      isWiki: true,
      isAnchor: false,
    });
    const missingCls = matched ? "" : " md-wiki-missing";
    return stash(
      `<a href="#wiki:${escapeHtml(cleanTarget)}" class="md-wiki-link${missingCls}" data-wiki-target="${escapeHtml(cleanTarget)}">${escapeHtml(label)}</a>`,
    );
  });

  // 7. Footnotes [^id]
  s = s.replace(/\[\^([A-Za-z0-9_-]+)\]/g, (_m, id: string) => {
    const fn = ctx.footnotes.get(id);
    if (fn) {
      fn.referenced = true;
    } else {
      ctx.undefinedFootnotes.push({ id, line: lineNum });
    }
    return stash(
      `<sup class="md-fn-ref"><a href="#fn-${escapeHtml(id)}" id="fnref-${escapeHtml(id)}">[${escapeHtml(id)}]</a></sup>`,
    );
  });

  // 8. Inline links [text](url "title") & reference links [text][ref]
  s = s.replace(
    /\[([^\]]+)\]\(([^)\n]*)\)/g,
    (_m, label: string, rawInside: string) => {
      const { url, title } = parseLinkTarget(rawInside);
      const isAnchor = url.startsWith("#");
      ctx.links.push({ text: label, url, line: lineNum, isWiki: false, isAnchor });
      const safeUrl = sanitizeUrl(url, false);
      const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
      const extAttr =
        safeUrl.startsWith("http://") || safeUrl.startsWith("https://")
          ? ` target="_blank" rel="noopener noreferrer"`
          : "";
      return stash(
        `<a href="${escapeHtml(safeUrl)}"${titleAttr}${extAttr}>${parseInline(label, lineNum, ctx)}</a>`,
      );
    },
  );

  s = s.replace(
    /\[([^\]]+)\]\[([^\]]*)\]/g,
    (full, label: string, refId: string) => {
      const key = (refId || label).trim().toLowerCase();
      const def = ctx.refDefs.get(key);
      if (!def) return full;
      const isAnchor = def.url.startsWith("#");
      ctx.links.push({ text: label, url: def.url, line: lineNum, isWiki: false, isAnchor });
      const safeUrl = sanitizeUrl(def.url, false);
      const titleAttr = def.title ? ` title="${escapeHtml(def.title)}"` : "";
      const extAttr =
        safeUrl.startsWith("http://") || safeUrl.startsWith("https://")
          ? ` target="_blank" rel="noopener noreferrer"`
          : "";
      return stash(
        `<a href="${escapeHtml(safeUrl)}"${titleAttr}${extAttr}>${parseInline(label, lineNum, ctx)}</a>`,
      );
    },
  );

  // 9. Autolinks <https://...> / <email@...>
  s = s.replace(/<((?:https?:\/\/|mailto:)[^\s>]+)>/gi, (_m, url: string) => {
    const safe = sanitizeUrl(url, false);
    ctx.links.push({ text: url, url, line: lineNum, isWiki: false, isAnchor: false });
    return stash(
      `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`,
    );
  });
  s = s.replace(/<([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})>/g, (_m, email: string) =>
    stash(`<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`),
  );

  // Bare URL autolink
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_m, prefix: string, url: string) => {
    const safe = sanitizeUrl(url, false);
    ctx.links.push({ text: url, url, line: lineNum, isWiki: false, isAnchor: false });
    return `${prefix}${stash(`<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`)}`;
  });

  // 10. Emoji shortcodes :shortcode:
  if (ctx.options.enableEmoji) {
    s = s.replace(/:([a-z0-9_+-]+):/gi, (full, code: string) => {
      const em = EMOJI_MAP[code.toLowerCase()];
      return em ? stash(`<span class="md-emoji" title=":${escapeHtml(code)}:">${em}</span>`) : full;
    });
  }

  // Escape remaining plain HTML characters before formatting marks
  s = escapeHtml(s);

  // 11. Formatting: bold+italic, bold, italic, strike, highlight, underline, sup, sub
  s = s.replace(/\*\*\*([^\s*](?:[\s\S]*?[^\s*])?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/___([^\s_](?:[\s\S]*?[^\s_])?)___/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*([^\s*](?:[\s\S]*?[^\s*])?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^\s_](?:[\s\S]*?[^\s_])?)__/g, "<strong>$1</strong>");
  s = s.replace(/~~([^\s~](?:[\s\S]*?[^\s~])?)~~/g, "<del>$1</del>");
  s = s.replace(/==([^\s=](?:[\s\S]*?[^\s=])?)==/g, "<mark>$1</mark>");
  s = s.replace(/\+\+([^\s+](?:[\s\S]*?[^\s+])?)\+\+/g, "<ins>$1</ins>");
  s = s.replace(/\*([^\s*](?:[^*\n]*?[^\s*])?)\*/g, "<em>$1</em>");
  s = s.replace(/(^|[^a-zA-Z0-9])_([^\s_](?:[^_\n]*?[^\s_])?)_(?=[^a-zA-Z0-9]|$)/g, "$1<em>$2</em>");
  s = s.replace(/\^([^\s^\n]+)\^/g, "<sup>$1</sup>");
  s = s.replace(/~([^\s~\n]+)~/g, "<sub>$1</sub>");

  // 12. Restore stashed tokens
  s = s.replace(/\u0000MDTOK(\d+)\u0000/g, (_m, idxStr: string) => tokens[Number(idxStr)] ?? "");

  // 13. Abbreviations outside HTML tags
  if (ctx.abbrs.size > 0) {
    const abbrPattern = new RegExp(
      `\\b(${Array.from(ctx.abbrs.keys()).map(escapeRegex).join("|")})\\b`,
      "g",
    );
    s = s.replace(/(<[^>]+>)|([^<]+)/g, (_m, tag: string | undefined, textPart: string | undefined) => {
      if (tag) return tag;
      if (!textPart) return "";
      return textPart.replace(abbrPattern, (word) => {
        const exp = ctx.abbrs.get(word);
        return exp ? `<abbr title="${escapeHtml(exp)}">${word}</abbr>` : word;
      });
    });
  }

  return s;
}

function splitTableCells(row: string): string[] {
  let trimmed = row.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|") && !trimmed.endsWith("\\|")) {
    trimmed = trimmed.slice(0, -1);
  }
  const cells: string[] = [];
  let curr = "";
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === "\\" && trimmed[i + 1] === "|") {
      curr += "|";
      i++;
    } else if (trimmed[i] === "|") {
      cells.push(curr.trim());
      curr = "";
    } else {
      curr += trimmed[i];
    }
  }
  cells.push(curr.trim());
  return cells;
}

function isTableDelimiterRow(line: string): ("left" | "center" | "right" | "")[] | null {
  if (!line.includes("|") && !/^[\s:|-]+$/.test(line)) return null;
  const cells = splitTableCells(line);
  if (cells.length === 0) return null;
  const aligns: ("left" | "center" | "right" | "")[] = [];
  for (const cell of cells) {
    if (!/^:?-{1,}:?$/.test(cell)) return null;
    if (cell.startsWith(":") && cell.endsWith(":")) aligns.push("center");
    else if (cell.endsWith(":")) aligns.push("right");
    else if (cell.startsWith(":")) aligns.push("left");
    else aligns.push("");
  }
  return aligns;
}

function stripLeadingIndent(lines: string[], baseIndent: number): string[] {
  return lines.map((l) => {
    const m = l.match(/^(\s*)/);
    const spaces = m ? m[1].length : 0;
    return l.slice(Math.min(spaces, baseIndent));
  });
}

function renderBlocks(
  lines: string[],
  startLineOffset: number,
  ctx: ParseCtx,
): { html: string; unclosedFenceLine: number | null; unclosedMathLine: number | null } {
  const htmlChunks: string[] = [];
  let unclosedFenceLine: number | null = null;
  let unclosedMathLine: number | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const absLine = startLineOffset + i + 1;
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // TOC Marker
    if (/^(?:\[\[TOC\]\]|\[TOC\]|<!--\s*toc\s*-->)$/i.test(trimmed)) {
      htmlChunks.push(`\u0000MD_TOC_PLACEHOLDER\u0000`);
      i++;
      continue;
    }

    // HTML comment (e.g., speaker notes <!-- note: ... -->)
    if (trimmed.startsWith("<!--")) {
      let j = i;
      while (j < lines.length && !lines[j].includes("-->")) j++;
      i = j + 1;
      continue;
    }

    // Fenced code blocks ``` or ~~~
    const fenceM = line.match(/^(\s*)(`{3,}|~{3,})(.*)$/);
    if (fenceM) {
      const fenceChar = fenceM[2][0];
      const fenceLen = fenceM[2].length;
      const meta = fenceM[3].trim();

      const langMatch = meta.match(/^([^\s{]+)/);
      const lang = (langMatch?.[1] ?? "").toLowerCase();
      const hlMatch = meta.match(/\{([0-9,\s-]+)\}/);
      const titleMatch = meta.match(/(?:title|filename)\s*=\s*"([^"]+)"|(?:title|filename)\s*=\s*'([^']+)'/i);
      const blockTitle = titleMatch?.[1] ?? titleMatch?.[2];
      const highlightLines = parseHighlightLines(hlMatch?.[1]);

      const codeLines: string[] = [];
      let j = i + 1;
      let closed = false;
      while (j < lines.length) {
        const closeM = lines[j].match(/^\s*(`{3,}|~{3,})\s*$/);
        if (closeM && closeM[1][0] === fenceChar && closeM[1].length >= fenceLen) {
          closed = true;
          break;
        }
        codeLines.push(lines[j]);
        j++;
      }
      if (!closed && unclosedFenceLine === null) {
        unclosedFenceLine = absLine;
      }

      const rawCode = codeLines.join("\n");
      ctx.codeBlocksCount++;

      if (lang === "mermaid" && ctx.options.enableMermaid) {
        const res = renderMermaidToSvg(rawCode);
        if (res.error) {
          htmlChunks.push(
            `<div class="md-diagram-error" data-line="${absLine}"><strong>Mermaid Error:</strong> ${escapeHtml(res.error)}<pre><code>${escapeHtml(rawCode)}</code></pre></div>`,
          );
        } else {
          htmlChunks.push(`<figure class="md-diagram" data-line="${absLine}">${res.svg}</figure>`);
        }
      } else if (lang === "chart" && ctx.options.enableMermaid) {
        const res = renderChartBlockToSvg(rawCode);
        if (res.error) {
          htmlChunks.push(
            `<div class="md-diagram-error" data-line="${absLine}"><strong>Chart Error:</strong> ${escapeHtml(res.error)}</div>`,
          );
        } else {
          htmlChunks.push(`<figure class="md-diagram" data-line="${absLine}">${res.svg}</figure>`);
        }
      } else if ((lang === "math" || lang === "latex-math") && ctx.options.enableMath) {
        htmlChunks.push(
          `<div class="md-math-block" data-line="${absLine}">${renderKatex(rawCode, true, ctx)}</div>`,
        );
      } else if (lang === "svg" && ctx.options.enableHtml) {
        htmlChunks.push(`<figure class="md-diagram" data-line="${absLine}">${sanitizeHtml(rawCode)}</figure>`);
      } else {
        const displayLang = lang || "text";
        const highlighted = highlightFencedCode(rawCode, lang, {
          highlightLines,
          showLineNumbers: true,
        });
        const rawEncoded = escapeHtml(rawCode);
        const titleHtml = blockTitle
          ? `<span class="md-code-title">${escapeHtml(blockTitle)}</span>`
          : "";
        htmlChunks.push(
          `<div class="md-code-block" data-line="${absLine}">` +
            `<div class="md-code-header">` +
            `<div class="md-code-header-left"><span class="md-code-lang">${escapeHtml(displayLang)}</span>${titleHtml}</div>` +
            `<button type="button" class="md-copy-btn" data-copy-code="${rawEncoded}" title="Copy code">Copy</button>` +
            `</div>` +
            `<pre class="md-code-pre"><code class="language-${escapeHtml(displayLang)}">${highlighted}</code></pre>` +
            `</div>`,
        );
      }

      i = closed ? j + 1 : lines.length;
      continue;
    }

    // Display Math Block $$...$$ or \[...\]
    if (ctx.options.enableMath && (trimmed.startsWith("$$") || trimmed.startsWith("\\["))) {
      const isBracket = trimmed.startsWith("\\[");
      const closeDelim = isBracket ? "\\]" : "$$";
      const openLen = 2;

      // Single-line $$ expr $$
      if (trimmed.length > 4 && trimmed.endsWith(closeDelim)) {
        const inner = trimmed.slice(openLen, trimmed.length - closeDelim.length);
        htmlChunks.push(
          `<div class="md-math-block" data-line="${absLine}">${renderKatex(inner, true, ctx)}</div>`,
        );
        i++;
        continue;
      }

      // Multi-line block
      const mathLines: string[] = [];
      const firstRest = trimmed.slice(openLen);
      if (firstRest) mathLines.push(firstRest);
      let j = i + 1;
      let closed = false;
      while (j < lines.length) {
        const lt = lines[j].trim();
        if (lt.endsWith(closeDelim)) {
          const before = lt.slice(0, lt.length - closeDelim.length);
          if (before) mathLines.push(before);
          closed = true;
          break;
        }
        mathLines.push(lines[j]);
        j++;
      }
      if (!closed && unclosedMathLine === null) {
        unclosedMathLine = absLine;
      }
      htmlChunks.push(
        `<div class="md-math-block" data-line="${absLine}">${renderKatex(mathLines.join("\n"), true, ctx)}</div>`,
      );
      i = closed ? j + 1 : lines.length;
      continue;
    }

    // Collapsible <details> block
    if (ctx.options.enableHtml && /^<details\b/i.test(trimmed)) {
      const openAttr = /\bopen\b/i.test(trimmed) ? " open" : "";
      let j = i + 1;
      const innerLines: string[] = [];
      let summaryText = "Details";
      const inlineSum = trimmed.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      if (inlineSum) summaryText = inlineSum[1];

      while (j < lines.length) {
        const lTrim = lines[j].trim();
        if (/<\/details>/i.test(lTrim)) {
          j++;
          break;
        }
        const sumM = lTrim.match(/^<summary[^>]*>([\s\S]*?)<\/summary>$/i);
        if (sumM) {
          summaryText = sumM[1];
        } else {
          innerLines.push(lines[j]);
        }
        j++;
      }
      const innerRendered = renderBlocks(innerLines, startLineOffset + i + 1, ctx);
      htmlChunks.push(
        `<details class="md-details" data-line="${absLine}"${openAttr}>` +
          `<summary>${parseInline(summaryText, absLine, ctx)}</summary>` +
          `<div class="md-details-body">${innerRendered.html}</div>` +
          `</details>`,
      );
      i = j;
      continue;
    }

    // ATX Headings # .. ######
    const atxM = line.match(/^\s{0,3}(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/);
    if (atxM) {
      const level = atxM[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const rawHeading = atxM[2].trim();
      const plainText = rawHeading
        .replace(/[*_`~=\[\]()]/g, "")
        .replace(/:([a-z0-9_+-]+):/gi, "")
        .trim() || rawHeading;
      const baseSlug = slugify(plainText);
      const count = ctx.slugCounts.get(baseSlug) ?? 0;
      ctx.slugCounts.set(baseSlug, count + 1);
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

      // Hierarchical numbering
      ctx.headingCounters[level - 1]++;
      for (let k = level; k < 6; k++) ctx.headingCounters[k] = 0;
      const numParts = ctx.headingCounters.slice(0, level);
      while (numParts.length > 0 && numParts[0] === 0) numParts.shift();
      const numberLabel = numParts.join(".");

      ctx.outline.push({
        id: `outline-${absLine}`,
        text: plainText,
        level,
        line: absLine,
        slug,
        numberLabel,
      });

      const prefixNum =
        ctx.options.autoNumberHeadings && numberLabel
          ? `<span class="md-heading-num">${numberLabel}</span> `
          : "";
      htmlChunks.push(
        `<h${level} id="${escapeHtml(slug)}" data-line="${absLine}">` +
          `<a class="md-anchor" href="#${escapeHtml(slug)}" aria-label="Link to section">#</a>` +
          `${prefixNum}${parseInline(rawHeading, absLine, ctx)}` +
          `</h${level}>`,
      );
      i++;
      continue;
    }

    // Setext Headings (=== or --- on next line)
    if (
      i + 1 < lines.length &&
      !trimmed.startsWith(">") &&
      !trimmed.startsWith("-") &&
      !trimmed.startsWith("*") &&
      /^\s{0,3}(=+|-+)\s*$/.test(lines[i + 1]) &&
      lines[i + 1].trim().length >= 2
    ) {
      const level = lines[i + 1].trim().startsWith("=") ? 1 : 2;
      const rawHeading = trimmed;
      const plainText = rawHeading.replace(/[*_`~=]/g, "").trim() || rawHeading;
      const baseSlug = slugify(plainText);
      const count = ctx.slugCounts.get(baseSlug) ?? 0;
      ctx.slugCounts.set(baseSlug, count + 1);
      const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;

      ctx.headingCounters[level - 1]++;
      for (let k = level; k < 6; k++) ctx.headingCounters[k] = 0;
      const numParts = ctx.headingCounters.slice(0, level).filter((n) => n > 0);
      const numberLabel = numParts.join(".");

      ctx.outline.push({
        id: `outline-${absLine}`,
        text: plainText,
        level,
        line: absLine,
        slug,
        numberLabel,
      });

      const prefixNum =
        ctx.options.autoNumberHeadings && numberLabel
          ? `<span class="md-heading-num">${numberLabel}</span> `
          : "";
      htmlChunks.push(
        `<h${level} id="${escapeHtml(slug)}" data-line="${absLine}">` +
          `<a class="md-anchor" href="#${escapeHtml(slug)}" aria-label="Link to section">#</a>` +
          `${prefixNum}${parseInline(rawHeading, absLine, ctx)}` +
          `</h${level}>`,
      );
      i += 2;
      continue;
    }

    // Horizontal Rule --- *** ___
    if (/^\s{0,3}(?:(-|\*|_)\s*){3,}$/.test(line)) {
      htmlChunks.push(`<hr data-line="${absLine}" />`);
      i++;
      continue;
    }

    // Blockquote & GitHub/Obsidian Callout
    if (/^\s{0,3}>/.test(line)) {
      const quoteLines: string[] = [];
      let j = i;
      while (j < lines.length && (/^\s{0,3}>/.test(lines[j]) || (lines[j].trim() !== "" && quoteLines.length > 0 && !/^\s*(?:#|`{3}|~{3}|[-*+]\s|\d+[.)]\s)/.test(lines[j])))) {
        if (/^\s{0,3}>/.test(lines[j])) {
          quoteLines.push(lines[j].replace(/^\s{0,3}>\s?/, ""));
        } else {
          quoteLines.push(lines[j]);
        }
        j++;
      }

      const firstQuoteLine = quoteLines[0]?.trim() ?? "";
      const calloutM = firstQuoteLine.match(/^\[!([A-Za-z]+)\]([+-])?(?:\s+(.*))?$/);
      if (calloutM) {
        const typeKey = calloutM[1].toLowerCase();
        const foldMode = calloutM[2]; // '+' open, '-' closed
        const customTitle = calloutM[3]?.trim();
        const meta = CALLOUT_META[typeKey] ?? CALLOUT_META.note;
        const title = customTitle || meta.defaultTitle;
        const innerRendered = renderBlocks(quoteLines.slice(1), absLine, ctx);

        if (foldMode === "+" || foldMode === "-") {
          const openAttr = foldMode === "+" ? " open" : "";
          htmlChunks.push(
            `<details class="md-callout md-callout-${meta.cls}" data-line="${absLine}"${openAttr}>` +
              `<summary class="md-callout-title">${meta.svg}<span>${parseInline(title, absLine, ctx)}</span></summary>` +
              `<div class="md-callout-body">${innerRendered.html}</div>` +
              `</details>`,
          );
        } else {
          htmlChunks.push(
            `<div class="md-callout md-callout-${meta.cls}" data-line="${absLine}">` +
              `<div class="md-callout-title">${meta.svg}<span>${parseInline(title, absLine, ctx)}</span></div>` +
              `<div class="md-callout-body">${innerRendered.html}</div>` +
              `</div>`,
          );
        }
      } else {
        const innerRendered = renderBlocks(quoteLines, absLine - 1, ctx);
        htmlChunks.push(`<blockquote data-line="${absLine}">${innerRendered.html}</blockquote>`);
      }

      i = j;
      continue;
    }

    // GFM Pipe Table
    if (i + 1 < lines.length && line.includes("|")) {
      const aligns = isTableDelimiterRow(lines[i + 1]);
      if (aligns) {
        const headers = splitTableCells(line);
        const colCount = aligns.length;
        ctx.tablesCount++;

        let j = i + 2;
        const bodyRows: Array<{ cells: string[]; line: number }> = [];
        while (j < lines.length && lines[j].trim() !== "" && lines[j].includes("|")) {
          const cells = splitTableCells(lines[j]);
          if (cells.length !== colCount) {
            ctx.tableMismatches.push({
              headerCols: colCount,
              line: startLineOffset + j + 1,
              rowCols: cells.length,
            });
          }
          bodyRows.push({ cells, line: startLineOffset + j + 1 });
          j++;
        }

        const theadHtml =
          `<thead><tr>` +
          headers
            .map((cell, idx) => {
              const al = aligns[idx] ? ` style="text-align:${aligns[idx]}"` : "";
              return `<th${al}>${parseInline(cell, absLine, ctx)}</th>`;
            })
            .join("") +
          `</tr></thead>`;

        const tbodyHtml =
          bodyRows.length > 0
            ? `<tbody>` +
              bodyRows
                .map(
                  (row) =>
                    `<tr data-line="${row.line}">` +
                    Array.from({ length: colCount }, (_u, idx) => {
                      const al = aligns[idx] ? ` style="text-align:${aligns[idx]}"` : "";
                      return `<td${al}>${parseInline(row.cells[idx] ?? "", row.line, ctx)}</td>`;
                    }).join("") +
                    `</tr>`,
                )
                .join("") +
              `</tbody>`
            : "";

        htmlChunks.push(
          `<div class="md-table-wrap" data-line="${absLine}"><table>${theadHtml}${tbodyHtml}</table></div>`,
        );
        i = j;
        continue;
      }
    }

    // Unordered / Task / Ordered List (recursive nesting)
    const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
    const olMatch = line.match(/^(\s*)(\d+)([.)])\s+(.*)$/);
    if (ulMatch || olMatch) {
      const isOrdered = Boolean(olMatch);
      const baseIndent = (olMatch ? olMatch[1] : ulMatch![1]).length;
      const startNum = olMatch ? Number.parseInt(olMatch[2], 10) : 1;

      interface ListItemData {
        line: number;
        firstLine: string;
        subLines: string[];
        taskState: "checked" | "unchecked" | null;
      }

      const items: ListItemData[] = [];
      let j = i;

      while (j < lines.length) {
        const cur = lines[j];
        if (!cur.trim()) {
          // Allow single blank line between list items if next non-empty line continues same list
          if (j + 1 < lines.length) {
            const nxt = lines[j + 1];
            const nxtMatch = isOrdered
              ? nxt.match(/^(\s*)(\d+)([.)])\s+(.*)$/)
              : nxt.match(/^(\s*)([-*+])\s+(.*)$/);
            const nxtIndent = nxtMatch ? nxtMatch[1].length : -1;
            if (nxtMatch && nxtIndent === baseIndent) {
              j++;
              continue;
            }
          }
          break;
        }

        const curM = isOrdered
          ? cur.match(/^(\s*)(\d+)([.)])\s+(.*)$/)
          : cur.match(/^(\s*)([-*+])\s+(.*)$/);
        const curIndent = cur.match(/^(\s*)/)?.[1].length ?? 0;

        if (curM && curIndent === baseIndent) {
          let contentText = isOrdered ? curM[4] : curM[3];
          let taskState: "checked" | "unchecked" | null = null;
          if (!isOrdered) {
            const taskM = contentText.match(/^\[([ xX])\]\s+(.*)$/);
            if (taskM) {
              taskState = taskM[1].toLowerCase() === "x" ? "checked" : "unchecked";
              contentText = taskM[2];
              ctx.tasksTotal++;
              if (taskState === "checked") ctx.tasksDone++;
            }
          }
          items.push({
            line: startLineOffset + j + 1,
            firstLine: contentText,
            subLines: [],
            taskState,
          });
          j++;
        } else if (curIndent > baseIndent && items.length > 0) {
          items[items.length - 1].subLines.push(cur);
          j++;
        } else {
          break;
        }
      }

      const tag = isOrdered ? "ol" : "ul";
      const startAttr = isOrdered && startNum !== 1 ? ` start="${startNum}"` : "";
      const hasAnyTask = items.some((it) => it.taskState !== null);
      const listCls = hasAnyTask ? ` class="md-task-list"` : "";

      const itemsHtml = items
        .map((it) => {
          const checkbox =
            it.taskState !== null
              ? `<input type="checkbox" class="md-task-checkbox" data-task-line="${it.line}"${it.taskState === "checked" ? " checked" : ""} aria-label="Toggle task" />`
              : "";
          const taskCls =
            it.taskState !== null
              ? ` class="md-task-item${it.taskState === "checked" ? " is-done" : ""}"`
              : "";
          const headHtml = parseInline(it.firstLine, it.line, ctx);
          let nestedHtml = "";
          if (it.subLines.length > 0) {
            const stripped = stripLeadingIndent(it.subLines, baseIndent + 2);
            nestedHtml = renderBlocks(stripped, it.line, ctx).html;
          }
          return `<li${taskCls} data-line="${it.line}">${checkbox}<span class="md-li-text">${headHtml}</span>${nestedHtml}</li>`;
        })
        .join("");

      htmlChunks.push(`<${tag}${startAttr}${listCls} data-line="${absLine}">${itemsHtml}</${tag}>`);
      i = j;
      continue;
    }

    // Definition List: Term followed by ": Definition"
    if (i + 1 < lines.length && /^:\s+/.test(lines[i + 1])) {
      const dlItems: Array<{ term: string; defs: string[]; line: number }> = [];
      let j = i;
      while (j + 1 < lines.length && lines[j].trim() && /^:\s+/.test(lines[j + 1])) {
        const term = lines[j].trim();
        const termLine = startLineOffset + j + 1;
        j++;
        const defs: string[] = [];
        while (j < lines.length && /^:\s+/.test(lines[j])) {
          defs.push(lines[j].replace(/^:\s+/, ""));
          j++;
        }
        dlItems.push({ term, defs, line: termLine });
      }
      const dlHtml = dlItems
        .map(
          (item) =>
            `<dt data-line="${item.line}">${parseInline(item.term, item.line, ctx)}</dt>` +
            item.defs
              .map((d) => `<dd>${parseInline(d, item.line, ctx)}</dd>`)
              .join(""),
        )
        .join("");
      htmlChunks.push(`<dl class="md-deflist" data-line="${absLine}">${dlHtml}</dl>`);
      i = j;
      continue;
    }

    // Raw HTML block
    if (
      ctx.options.enableHtml &&
      /^<(?:div|section|article|header|footer|aside|nav|figure|figcaption|table|thead|tbody|tr|th|td|p|blockquote|pre|ul|ol|dl|h[1-6]|center|kbd|mark)\b/i.test(
        trimmed,
      )
    ) {
      const htmlLines: string[] = [line];
      let j = i + 1;
      if (!/<\/[a-zA-Z0-9]+>\s*$/.test(trimmed)) {
        while (j < lines.length && lines[j].trim() !== "") {
          htmlLines.push(lines[j]);
          j++;
        }
      }
      htmlChunks.push(`<div data-line="${absLine}">${sanitizeHtml(htmlLines.join("\n"))}</div>`);
      i = j;
      continue;
    }

    // Standard Paragraph (with optional GFM line breaks)
    const paraLines: string[] = [];
    let j = i;
    while (j < lines.length) {
      const cur = lines[j];
      const curTrim = cur.trim();
      if (!curTrim) break;
      if (
        j > i &&
        (/^\s{0,3}#{1,6}\s+/.test(cur) ||
          /^\s{0,3}(`{3,}|~{3,})/.test(cur) ||
          /^\s{0,3}>/.test(cur) ||
          /^\s*(?:---+|\*\*\*+|___+)\s*$/.test(cur) ||
          /^\s*(?:[-*+]|\d+[.)])\s+/.test(cur) ||
          (curTrim.startsWith("$$") && ctx.options.enableMath))
      ) {
        break;
      }
      paraLines.push(cur);
      j++;
    }

    const joined = paraLines
      .map((l, idx) => {
        const isLast = idx === paraLines.length - 1;
        const parsed = parseInline(l.replace(/\s{2,}$/, ""), absLine + idx, ctx);
        if (isLast) return parsed;
        const explicitBr = /  $/.test(l) || l.endsWith("\\");
        return explicitBr || ctx.options.gfmBreaks ? `${parsed}<br />` : `${parsed} `;
      })
      .join("");

    htmlChunks.push(`<p data-line="${absLine}">${joined}</p>`);
    i = j;
  }

  return {
    html: htmlChunks.join("\n"),
    unclosedFenceLine,
    unclosedMathLine,
  };
}

function buildTocHtml(outline: OutlineItem[]): string {
  if (outline.length === 0) {
    return `<nav class="md-toc"><div class="md-toc-title">Table of Contents</div><p class="md-toc-empty">No headings yet.</p></nav>`;
  }
  const minLevel = Math.min(...outline.map((h) => h.level));
  const items = outline
    .map((h) => {
      const indent = (h.level - minLevel) * 14;
      return `<li style="padding-left:${indent}px"><a href="#${escapeHtml(h.slug)}">${escapeHtml(h.text)}</a></li>`;
    })
    .join("");
  return `<nav class="md-toc" aria-label="Table of Contents"><div class="md-toc-title">Table of Contents</div><ul>${items}</ul></nav>`;
}

function buildSlides(
  bodyLines: string[],
  bodyStartLineOffset: number,
  ctx: ParseCtx,
): SlideItem[] {
  const chunks: Array<{ lines: string[]; startLine: number }> = [];
  let current: string[] = [];
  let curStart = bodyStartLineOffset + 1;
  let inFence = false;
  let fenceChar = "`";

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    const fenceM = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceM) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceM[1][0];
      } else if (fenceM[1][0] === fenceChar && line.trim().length === fenceM[1].length) {
        inFence = false;
      }
    }

    if (!inFence && /^\s*---\s*$/.test(line) && current.some((l) => l.trim() !== "")) {
      chunks.push({ lines: current, startLine: curStart });
      current = [];
      curStart = bodyStartLineOffset + i + 2;
      continue;
    }
    current.push(line);
  }
  if (current.some((l) => l.trim() !== "") || chunks.length === 0) {
    chunks.push({ lines: current, startLine: curStart });
  }

  return chunks.map((chunk, idx) => {
    const rawSlideText = chunk.lines.join("\n");
    const notesParts: string[] = [];
    const noteRe = /<!--\s*note:\s*([\s\S]*?)-->/gi;
    let m: RegExpExecArray | null;
    while ((m = noteRe.exec(rawSlideText)) !== null) {
      notesParts.push(m[1].trim());
    }
    const headingLine = chunk.lines.find((l) => /^\s*#{1,3}\s+/.test(l));
    const title = headingLine?.replace(/^\s*#{1,6}\s+/, "").trim();

    // Use isolated ctx copy so slide pass doesn't duplicate main document outline/counts
    const slideCtx: ParseCtx = {
      ...ctx,
      outline: [],
      slugCounts: new Map(),
      links: [],
      images: [],
      undefinedFootnotes: [],
      tableMismatches: [],
      headingCounters: [0, 0, 0, 0, 0, 0],
    };
    const rendered = renderBlocks(chunk.lines, chunk.startLine - 1, slideCtx);
    return {
      index: idx,
      html: rendered.html,
      notes: notesParts.join("\n\n"),
      startLine: chunk.startLine,
      title,
    };
  });
}

export function compileMarkdown(
  source: string,
  options: CompileMarkdownOptions = {},
): RenderResult {
  const startMs = typeof performance !== "undefined" ? performance.now() : Date.now();
  const normalized = source.replace(/\r\n/g, "\n");
  const allLines = normalized.split("\n");

  const { frontmatter, bodyStartIdx } = parseFrontmatter(allLines);
  const bodyLinesRaw = allLines.slice(bodyStartIdx);

  // First pass: extract reference links, footnotes, and abbreviations outside code fences
  const refDefs = new Map<string, RefDef>();
  const footnotes = new Map<string, RawFootnote>();
  const abbrs = new Map<string, string>();
  const cleanBodyLines: string[] = [...bodyLinesRaw];

  let inFence = false;
  let fenceChar = "`";
  for (let i = 0; i < bodyLinesRaw.length; i++) {
    const line = bodyLinesRaw[i];
    const fenceM = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceM) {
      if (!inFence) {
        inFence = true;
        fenceChar = fenceM[1][0];
      } else if (fenceM[1][0] === fenceChar && line.trim().length <= fenceM[1].length + 1) {
        inFence = false;
      }
      continue;
    }
    if (inFence) continue;

    // Footnote definition [^id]: ...
    const fnM = line.match(/^\[\^([A-Za-z0-9_-]+)\]:\s*(.*)$/);
    if (fnM) {
      const id = fnM[1];
      const rawLines = [fnM[2]];
      cleanBodyLines[i] = "";
      let j = i + 1;
      while (j < bodyLinesRaw.length && /^(?:\s{2,}|\t)/.test(bodyLinesRaw[j])) {
        rawLines.push(bodyLinesRaw[j].trim());
        cleanBodyLines[j] = "";
        j++;
      }
      footnotes.set(id, {
        id,
        rawLines,
        line: bodyStartIdx + i + 1,
        referenced: false,
      });
      i = j - 1;
      continue;
    }

    // Abbreviation *[ABBR]: Expansion
    const abbrM = line.match(/^\*\[([^\]]+)\]:\s*(.+)$/);
    if (abbrM) {
      abbrs.set(abbrM[1].trim(), abbrM[2].trim());
      cleanBodyLines[i] = "";
      continue;
    }

    // Reference link definition [id]: url "title"
    const refM = line.match(/^\[([^\]]+)\]:\s*(\S+)(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*$/);
    if (refM) {
      refDefs.set(refM[1].trim().toLowerCase(), {
        url: refM[2],
        title: refM[3] ?? refM[4],
      });
      cleanBodyLines[i] = "";
    }
  }

  const ctx: ParseCtx = {
    files: options.files ?? [],
    refDefs,
    footnotes,
    abbrs,
    outline: [],
    slugCounts: new Map(),
    links: [],
    images: [],
    undefinedFootnotes: [],
    tableMismatches: [],
    options: {
      gfmBreaks: options.gfmBreaks ?? false,
      autoNumberHeadings: options.autoNumberHeadings ?? false,
      enableEmoji: options.enableEmoji ?? true,
      enableMath: options.enableMath ?? true,
      enableMermaid: options.enableMermaid ?? true,
      enableHtml: options.enableHtml ?? true,
    },
    headingCounters: [0, 0, 0, 0, 0, 0],
    tasksTotal: 0,
    tasksDone: 0,
    codeBlocksCount: 0,
    mathCount: 0,
    tablesCount: 0,
  };

  const renderedBody = renderBlocks(cleanBodyLines, bodyStartIdx, ctx);
  let html = renderedBody.html;

  // Replace TOC markers
  if (html.includes("\u0000MD_TOC_PLACEHOLDER\u0000")) {
    const tocHtml = buildTocHtml(ctx.outline);
    html = html.replace(/\u0000MD_TOC_PLACEHOLDER\u0000/g, tocHtml);
  }

  // Render footnotes footer
  const footnoteInfos: FootnoteInfo[] = [];
  if (footnotes.size > 0) {
    const fnListHtml: string[] = [];
    for (const fn of footnotes.values()) {
      const contentHtml = parseInline(fn.rawLines.join(" "), fn.line, ctx);
      footnoteInfos.push({
        id: fn.id,
        html: contentHtml,
        line: fn.line,
        referenced: fn.referenced,
      });
      if (fn.referenced) {
        fnListHtml.push(
          `<li id="fn-${escapeHtml(fn.id)}">${contentHtml} <a class="md-fn-back" href="#fnref-${escapeHtml(fn.id)}" aria-label="Back to reference">↩</a></li>`,
        );
      }
    }
    if (fnListHtml.length > 0) {
      html += `\n<section class="md-footnotes"><hr /><ol>${fnListHtml.join("")}</ol></section>`;
    }
  }

  const slides = buildSlides(cleanBodyLines, bodyStartIdx, ctx);
  const endMs = typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    html,
    slides,
    frontmatter,
    outline: ctx.outline,
    links: ctx.links,
    images: ctx.images,
    footnotes: footnoteInfos,
    undefinedFootnotes: ctx.undefinedFootnotes,
    tableMismatches: ctx.tableMismatches,
    unclosedFenceLine: renderedBody.unclosedFenceLine,
    unclosedMathLine: renderedBody.unclosedMathLine,
    tasksTotal: ctx.tasksTotal,
    tasksDone: ctx.tasksDone,
    codeBlocksCount: ctx.codeBlocksCount,
    mathCount: ctx.mathCount,
    tablesCount: ctx.tablesCount,
    renderTimeMs: Math.max(0.1, Number((endMs - startMs).toFixed(2))),
  };
}
