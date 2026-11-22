import JSZip from "jszip";
import { htmlToMarkdown } from "./formatter";
import type {
  DocumentAnalytics,
  MarkdownFile,
  MarkdownProject,
  PreviewTheme,
  RenderResult,
} from "./types";
import { escapeHtml, inferFileKind } from "./utils";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function safeSlug(name: string): string {
  return name.replace(/[^\w.-]+/g, "_") || "document";
}

export function exportActiveMarkdown(file: MarkdownFile): void {
  const blob = new Blob([file.content], { type: "text/markdown;charset=utf-8" });
  const baseName = file.path.split("/").pop() || "document.md";
  triggerDownload(blob, baseName);
}

export function exportPlainText(source: string, projectName: string): void {
  const plain = source
    .replace(/^(?:---|\+\+\+)\n[\s\S]*?\n(?:---|\+\+\+)\n?/, "")
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, ""),
    )
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1 ($2)")
    .replace(/(\*\*|__|~~|==|\*|_)/g, "")
    .replace(/<[^>]+>/g, "");
  const blob = new Blob([plain.trim() + "\n"], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${safeSlug(projectName)}.txt`);
}

export function exportDocumentJson(
  file: MarkdownFile,
  result: RenderResult,
  analytics: DocumentAnalytics,
): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    file: file.path,
    frontmatter: result.frontmatter?.fields ?? {},
    analytics,
    outline: result.outline,
    links: result.links,
    images: result.images,
    footnotes: result.footnotes.map((f) => ({ id: f.id, line: f.line, referenced: f.referenced })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  triggerDownload(blob, `${safeSlug(file.path.replace(/\.[^.]+$/, ""))}.json`);
}

const STANDALONE_THEME_VARS: Record<
  PreviewTheme,
  { bg: string; cardBg: string; fg: string; muted: string; border: string; accent: string; codeBg: string }
> = {
  celestial: {
    bg: "#070917",
    cardBg: "#0d1126",
    fg: "#e2e8f0",
    muted: "#94a3b8",
    border: "#252f52",
    accent: "#38bdf8",
    codeBg: "#090c1c",
  },
  "github-dark": {
    bg: "#0d1117",
    cardBg: "#0d1117",
    fg: "#e6edf3",
    muted: "#8b949e",
    border: "#30363d",
    accent: "#58a6ff",
    codeBg: "#161b22",
  },
  "github-light": {
    bg: "#f6f8fa",
    cardBg: "#ffffff",
    fg: "#1f2328",
    muted: "#656d76",
    border: "#d0d7de",
    accent: "#0969da",
    codeBg: "#f6f8fa",
  },
  academic: {
    bg: "#f1f5f9",
    cardBg: "#ffffff",
    fg: "#111827",
    muted: "#475569",
    border: "#cbd5e1",
    accent: "#4338ca",
    codeBg: "#f8fafc",
  },
  sepia: {
    bg: "#ede3cc",
    cardBg: "#f6eedb",
    fg: "#2c241b",
    muted: "#6b5a48",
    border: "#d4c4a8",
    accent: "#9a3412",
    codeBg: "#ebe1ca",
  },
  obsidian: {
    bg: "#0b0b0f",
    cardBg: "#14141b",
    fg: "#edeef3",
    muted: "#9496a8",
    border: "#2a2b38",
    accent: "#a855f7",
    codeBg: "#101016",
  },
};

export function exportStandaloneHtml(
  result: RenderResult,
  projectName: string,
  theme: PreviewTheme,
  slideMode = false,
): void {
  const vars = STANDALONE_THEME_VARS[theme] ?? STANDALONE_THEME_VARS.celestial;
  const docTitle =
    typeof result.frontmatter?.fields.title === "string"
      ? result.frontmatter.fields.title
      : projectName;

  const contentHtml = slideMode
    ? result.slides
        .map(
          (s, idx) =>
            `<section class="slide">
              <div class="slide-num">Slide ${idx + 1} / ${result.slides.length}</div>
              ${s.html}
            </section>`,
        )
        .join("\n")
    : result.html;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(docTitle)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
  <style>
    :root {
      --bg: ${vars.bg};
      --card: ${vars.cardBg};
      --fg: ${vars.fg};
      --muted: ${vars.muted};
      --border: ${vars.border};
      --accent: ${vars.accent};
      --code-bg: ${vars.codeBg};
      --md-mmd-node-bg: ${vars.codeBg};
      --md-mmd-node-border: ${vars.accent};
      --md-mmd-edge: #6366f1;
      --md-mmd-text: ${vars.fg};
      --md-mmd-muted: ${vars.muted};
      --md-mmd-label-bg: ${vars.cardBg};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2.5rem 1.25rem;
      background: var(--bg);
      color: var(--fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
      line-height: 1.72;
    }
    .doc {
      max-width: 860px;
      margin: 0 auto;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 3rem 3.5rem;
      box-shadow: 0 20px 55px rgba(0,0,0,0.22);
    }
    .slide {
      max-width: 960px;
      min-height: 540px;
      margin: 0 auto 2rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2.5rem 3.25rem;
      page-break-after: always;
    }
    .slide-num { font-size: 12px; font-family: monospace; color: var(--muted); margin-bottom: 1rem; }
    h1, h2, h3, h4 { line-height: 1.25; margin-top: 1.7em; margin-bottom: 0.6em; }
    h1 { font-size: 2.1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.35em; margin-top: 0; }
    h2 { font-size: 1.55rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25em; }
    .md-anchor { display: none; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    blockquote { margin: 1.25em 0; padding: 0.5rem 1rem; border-left: 4px solid var(--accent); color: var(--muted); background: rgba(148,163,184,0.06); border-radius: 0 8px 8px 0; }
    code { font-family: "JetBrains Mono", Consolas, monospace; font-size: 0.88em; background: var(--code-bg); padding: 0.15em 0.38em; border-radius: 5px; border: 1px solid var(--border); }
    .md-code-block { margin: 1.25em 0; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--code-bg); }
    .md-code-header { display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0.85rem; border-bottom: 1px solid var(--border); font-size: 12px; color: var(--muted); font-family: monospace; }
    .md-copy-btn { display: none; }
    .md-code-pre { margin: 0; padding: 0.9rem 1rem; overflow-x: auto; font-size: 13.5px; line-height: 1.55; }
    .md-code-pre code { background: none; border: none; padding: 0; }
    .md-code-row { display: block; }
    .md-code-row.is-highlighted { background: rgba(56, 189, 248, 0.12); }
    .md-code-ln { display: inline-block; width: 2.2em; color: var(--muted); opacity: 0.55; user-select: none; }
    .md-tok-kw { color: #c084fc; } .md-tok-str { color: #34d399; } .md-tok-num { color: #fb923c; } .md-tok-cmt { color: #64748b; font-style: italic; } .md-tok-fn { color: #60a5fa; } .md-tok-type { color: #fbbf24; } .md-tok-prop { color: #38bdf8; }
    table { border-collapse: collapse; width: 100%; margin: 1.25em 0; }
    th, td { border: 1px solid var(--border); padding: 0.55rem 0.8rem; }
    th { background: var(--code-bg); font-weight: 600; }
    .md-callout { margin: 1.25em 0; padding: 0.85rem 1rem; border-left: 4px solid var(--accent); border-radius: 8px; background: rgba(56,189,248,0.08); }
    .md-callout-title { display: flex; align-items: center; gap: 0.45rem; font-weight: 700; margin-bottom: 0.4rem; }
    .md-callout-tip { border-left-color: #10b981; background: rgba(16,185,129,0.08); }
    .md-callout-important { border-left-color: #a855f7; background: rgba(168,85,247,0.08); }
    .md-callout-warning { border-left-color: #f59e0b; background: rgba(245,158,11,0.09); }
    .md-callout-caution { border-left-color: #ef4444; background: rgba(239,68,68,0.09); }
    .md-diagram { margin: 1.4em 0; text-align: center; overflow-x: auto; }
    .md-toc { border: 1px solid var(--border); background: var(--code-bg); border-radius: 10px; padding: 1rem 1.25rem; margin: 1.2em 0; }
    .md-toc-title { font-weight: 700; margin-bottom: 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
    .md-toc ul { list-style: none; margin: 0; padding: 0; }
    .md-toc li { margin: 0.25rem 0; }
    img { max-width: 100%; border-radius: 8px; }
    mark { background: rgba(250, 204, 21, 0.3); color: inherit; padding: 0 3px; border-radius: 3px; }
    kbd { padding: 2px 6px; font-size: 0.8em; font-family: monospace; border: 1px solid var(--border); border-radius: 5px; background: var(--code-bg); }
    @media print { body { background: #fff; color: #111; padding: 0; } .doc { box-shadow: none; border: none; padding: 0; } }
  </style>
</head>
<body>
  ${slideMode ? contentHtml : `<article class="doc">${contentHtml}</article>`}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, `${safeSlug(projectName)}${slideMode ? "-slides" : ""}.html`);
}

function collectDocumentStylesHtml(): string {
  if (typeof document === "undefined") return "";
  const chunks: string[] = [];
  for (const el of Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))) {
    chunks.push(el.outerHTML);
  }
  return chunks.join("\n");
}

export function exportPrintPdf(
  result: RenderResult,
  projectName: string,
  options: { pageSize: "a4" | "letter"; slideMode?: boolean },
): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    document.body.removeChild(iframe);
    return;
  }

  const pageRule = options.slideMode
    ? "@page { size: landscape; margin: 10mm; }"
    : `@page { size: ${options.pageSize}; margin: 16mm; }`;

  const bodyHtml = options.slideMode
    ? result.slides
        .map(
          (s, idx) =>
            `<section class="md-print-slide">
              <div class="md-print-slide-num">Slide ${idx + 1} / ${result.slides.length}</div>
              ${s.html}
            </section>`,
        )
        .join("\n")
    : result.html;

  const styles = collectDocumentStylesHtml();
  doc.open();
  doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <base href="${escapeHtml(window.location.origin)}/" />
  <title>${escapeHtml(projectName)}</title>
  ${styles}
  <style>
    ${pageRule}
    html, body {
      background: #ffffff !important;
      color: #111827 !important;
      margin: 0 !important;
      padding: 0 !important;
      color-scheme: light !important;
    }
    .md-preview-doc {
      background: #ffffff !important;
      color: #111827 !important;
      box-shadow: none !important;
      border: none !important;
      max-width: none !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      --md-mmd-node-bg: #f8fafc;
      --md-mmd-node-border: #4338ca;
      --md-mmd-edge: #6366f1;
      --md-mmd-text: #111827;
      --md-mmd-muted: #475569;
      --md-mmd-label-bg: #ffffff;
    }
    .md-anchor, .md-copy-btn { display: none !important; }
    .md-print-slide {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 1.5rem 2rem;
      min-height: 155mm;
      break-after: page;
      page-break-after: always;
      margin-bottom: 1rem;
    }
    .md-print-slide-num {
      font-size: 11px;
      color: #64748b;
      font-family: monospace;
      margin-bottom: 0.75rem;
    }
    @media print {
      .md-code-block, .md-callout, .md-diagram, .md-table-wrap { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="md-preview-doc md-preview-academic">${bodyHtml}</div>
</body>
</html>`);
  doc.close();

  const waitStyles = Array.from(
    doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
  ).map(
    (link) =>
      new Promise<void>((resolve) => {
        if (link.sheet) {
          resolve();
          return;
        }
        link.addEventListener("load", () => resolve(), { once: true });
        link.addEventListener("error", () => resolve(), { once: true });
        setTimeout(resolve, 1500);
      }),
  );

  const waitImages = Array.from(doc.images).map((img) =>
    img.complete
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
          setTimeout(resolve, 1500);
        }),
  );

  const waitFonts = doc.fonts?.ready ?? Promise.resolve();

  Promise.all([...waitStyles, ...waitImages, waitFonts]).then(() => {
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    }, 100);
  });
}

export async function exportWorkspaceZip(project: MarkdownProject): Promise<void> {
  const zip = new JSZip();
  for (const file of project.files) {
    if (file.kind === "image" && file.content.startsWith("data:")) {
      const commaIdx = file.content.indexOf(",");
      if (commaIdx !== -1) {
        const b64 = file.content.slice(commaIdx + 1);
        zip.file(file.path, b64, { base64: true });
        continue;
      }
    }
    zip.file(file.path, file.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${safeSlug(project.name)}.zip`);
}

export async function copyRichHtmlToClipboard(
  html: string,
  plainMarkdown: string,
): Promise<boolean> {
  try {
    if (
      typeof ClipboardItem !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.write === "function"
    ) {
      const htmlBlob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([plainMarkdown], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      return true;
    }
    await navigator.clipboard.writeText(plainMarkdown);
    return true;
  } catch {
    return false;
  }
}

export async function importFilesIntoProject(
  fileList: FileList,
): Promise<MarkdownFile[]> {
  const results: MarkdownFile[] = [];
  const now = Date.now();

  for (const file of Array.from(fileList)) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".html") || lower.endsWith(".htm")) {
      const rawHtml = await file.text();
      const converted = htmlToMarkdown(rawHtml);
      const mdName = file.name.replace(/\.html?$/i, ".md");
      results.push({
        id: `md-imp-${now}-${results.length}`,
        path: mdName,
        kind: "md",
        content: converted,
        updatedAt: now,
      });
      continue;
    }

    const kind = inferFileKind(file.name);
    if (kind === "image") {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file);
      });
      results.push({
        id: `md-imp-${now}-${results.length}`,
        path: `assets/${file.name}`,
        kind: "image",
        content: dataUrl,
        updatedAt: now,
      });
    } else {
      const text = await file.text();
      results.push({
        id: `md-imp-${now}-${results.length}`,
        path: file.name,
        kind,
        content: text,
        updatedAt: now,
      });
    }
  }

  return results;
}
