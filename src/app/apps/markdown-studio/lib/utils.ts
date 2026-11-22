import type { MarkdownFileKind } from "./types";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s_-]+/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

export function sanitizeUrl(rawUrl: string, allowDataImage = false): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  // Strip control characters and whitespace when checking protocol
  const normalized = trimmed.replace(/[\u0000-\u001f\u007f\s]+/g, "").toLowerCase();

  if (
    normalized.startsWith("javascript:") ||
    normalized.startsWith("vbscript:") ||
    normalized.startsWith("file:")
  ) {
    return "#blocked";
  }

  if (normalized.startsWith("data:")) {
    if (
      allowDataImage &&
      /^data:image\/(png|jpeg|jpg|gif|webp|avif|bmp|ico);base64,/i.test(normalized)
    ) {
      return trimmed;
    }
    return "#blocked";
  }

  return trimmed;
}

const SAFE_STYLE_PROPS = new Set([
  "color",
  "background",
  "background-color",
  "text-align",
  "font-weight",
  "font-style",
  "text-decoration",
  "width",
  "max-width",
  "height",
  "padding",
  "margin",
  "border",
  "border-radius",
  "display",
  "gap",
]);

function sanitizeInlineStyle(styleValue: string): string {
  if (/expression\s*\(|javascript:|vbscript:|url\s*\(/i.test(styleValue)) {
    return "";
  }
  const safeParts: string[] = [];
  for (const decl of styleValue.split(";")) {
    const colon = decl.indexOf(":");
    if (colon === -1) continue;
    const prop = decl.slice(0, colon).trim().toLowerCase();
    const val = decl.slice(colon + 1).trim();
    if (SAFE_STYLE_PROPS.has(prop) && val && !/[<>]/.test(val)) {
      safeParts.push(`${prop}: ${val}`);
    }
  }
  return safeParts.join("; ");
}

export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Remove dangerous block tags entirely
  let cleaned = html
    .replace(/<\s*(script|iframe|object|embed|form|style|meta|link|base|noscript|foreignObject)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|form|style|meta|link|base|noscript|foreignObject)\b[^>]*\/?>/gi, "");

  // Clean attributes on remaining tags
  cleaned = cleaned.replace(
    /<([a-zA-Z][a-zA-Z0-9:-]*)(\s+[^>]*?)?(\s*\/?)>/g,
    (full, tagName: string, rawAttrs: string | undefined, selfClose: string) => {
      const lowerTag = tagName.toLowerCase();
      if (!rawAttrs) return `<${tagName}${selfClose}>`;

      const attrParts: string[] = [];
      const attrRegex = /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
      let match: RegExpExecArray | null;
      while ((match = attrRegex.exec(rawAttrs)) !== null) {
        const attrName = match[1];
        const lowerAttr = attrName.toLowerCase();
        const attrVal = match[2] ?? match[3] ?? match[4] ?? "";

        // Strip inline event handlers and srcdoc
        if (lowerAttr.startsWith("on") || lowerAttr === "srcdoc") {
          continue;
        }

        if (
          lowerAttr === "href" ||
          lowerAttr === "src" ||
          lowerAttr === "xlink:href" ||
          lowerAttr === "action" ||
          lowerAttr === "formaction" ||
          lowerAttr === "poster"
        ) {
          const safeUrl = sanitizeUrl(attrVal, lowerTag === "img");
          if (!safeUrl || safeUrl === "#blocked") continue;
          attrParts.push(`${attrName}="${escapeHtml(safeUrl)}"`);
          continue;
        }

        if (lowerAttr === "style") {
          const safeStyle = sanitizeInlineStyle(attrVal);
          if (safeStyle) {
            attrParts.push(`style="${escapeHtml(safeStyle)}"`);
          }
          continue;
        }

        if (match[2] === undefined && match[3] === undefined && match[4] === undefined) {
          attrParts.push(attrName);
        } else {
          attrParts.push(`${attrName}="${escapeHtml(attrVal)}"`);
        }
      }

      const attrsJoin = attrParts.length > 0 ? ` ${attrParts.join(" ")}` : "";
      return `<${tagName}${attrsJoin}${selfClose}>`;
    },
  );

  return cleaned;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatRelativeTime(ts: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(ts).toLocaleDateString();
}

export interface DiffLine {
  type: "same" | "add" | "del";
  oldLine?: number;
  newLine?: number;
  text: string;
}

export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split("\n");
  const b = newText.split("\n");

  // Guard huge files with greedy prefix/suffix diff to keep UI snappy
  if (a.length * b.length > 220000) {
    let prefix = 0;
    while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) {
      prefix++;
    }
    let suffix = 0;
    while (
      suffix < a.length - prefix &&
      suffix < b.length - prefix &&
      a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
    ) {
      suffix++;
    }
    const result: DiffLine[] = [];
    for (let i = 0; i < prefix; i++) {
      result.push({ type: "same", oldLine: i + 1, newLine: i + 1, text: a[i] });
    }
    for (let i = prefix; i < a.length - suffix; i++) {
      result.push({ type: "del", oldLine: i + 1, text: a[i] });
    }
    for (let j = prefix; j < b.length - suffix; j++) {
      result.push({ type: "add", newLine: j + 1, text: b[j] });
    }
    for (let k = 0; k < suffix; k++) {
      const ai = a.length - suffix + k;
      const bj = b.length - suffix + k;
      result.push({ type: "same", oldLine: ai + 1, newLine: bj + 1, text: a[ai] });
    }
    return result;
  }

  const m = a.length;
  const n = b.length;
  const dp: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ type: "same", oldLine: i + 1, newLine: j + 1, text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", oldLine: i + 1, text: a[i] });
      i++;
    } else {
      out.push({ type: "add", newLine: j + 1, text: b[j] });
      j++;
    }
  }
  while (i < m) {
    out.push({ type: "del", oldLine: i + 1, text: a[i] });
    i++;
  }
  while (j < n) {
    out.push({ type: "add", newLine: j + 1, text: b[j] });
    j++;
  }
  return out;
}

export function inferFileKind(path: string): MarkdownFileKind {
  const lower = path.toLowerCase();
  if (
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    lower.endsWith(".mdx") ||
    lower.endsWith(".qmd")
  ) {
    return "md";
  }
  if (lower.endsWith(".json") || lower.endsWith(".jsonl")) return "json";
  if (lower.endsWith(".yaml") || lower.endsWith(".yml") || lower.endsWith(".toml")) {
    return "yaml";
  }
  if (lower.endsWith(".css") || lower.endsWith(".scss")) return "css";
  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".avif") ||
    lower.endsWith(".jfif")
  ) {
    return "image";
  }
  return "text";
}
