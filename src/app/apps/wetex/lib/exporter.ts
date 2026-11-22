import JSZip from "jszip";
import { submitTeXLiveNetForm } from "./cloudCompiler";
import type {
  CloudEngine,
  CompileResult,
  ProjectFile,
  ProjectFileKind,
  WeTeXProject,
} from "./types";
import { escapeHtml } from "./utils";

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

function collectDocumentStylesHtml(): string {
  if (typeof document === "undefined") return "";
  const chunks: string[] = [];
  for (const el of Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))) {
    chunks.push(el.outerHTML);
  }
  return chunks.join("\n");
}

export function downloadPdfBlob(blob: Blob, projectName: string): void {
  const safeTitle = projectName.replace(/[^\w.-]+/g, "_") || "document";
  triggerDownload(blob, `${safeTitle}.pdf`);
}

export function exportVectorPdf(
  result: CompileResult,
  projectName: string,
  pageSize: "a4" | "letter" = "a4",
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

  const pageRule = result.isBeamer
    ? "@page { size: 12.8cm 7.2cm; margin: 0.4cm; }"
    : `@page { size: ${pageSize}; margin: 16mm; }`;

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
    .wt-print-root {
      --wt-sheet-bg: #ffffff;
      --wt-sheet-fg: #111827;
      --wt-sheet-muted: #475569;
      --wt-sheet-border: #cbd5e1;
      --wt-sheet-accent: #4338ca;
      --wt-sheet-code-bg: #f8fafc;
      background: #ffffff !important;
      color: #111827 !important;
      font-family: "KaTeX_Main", "Computer Modern Serif", Georgia, serif;
      font-size: 14.5px;
      line-height: 1.58;
    }
    .wt-paper-sheet {
      box-shadow: none !important;
      border: none !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: none !important;
      min-height: auto !important;
      background: #ffffff !important;
      color: #111827 !important;
    }
    .wt-beamer-slide {
      break-after: page;
      page-break-after: always;
      box-shadow: none !important;
      margin: 0 0 1rem 0 !important;
    }
    @media print {
      a { color: #1d4ed8; text-decoration: none; }
      .wt-theorem, .wt-figure, .wt-table, .wt-code-block { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="wt-print-root wt-paper wt-paper-classic">
    ${result.html}
  </div>
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

export function exportStandaloneHtml(
  result: CompileResult,
  projectName: string,
): void {
  const safeTitle = projectName.replace(/[^\w.-]+/g, "_") || "document";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(result.title || projectName)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" />
  <style>
    body { margin: 0; padding: 2.5rem 1rem; background: #f1f5f9; color: #111827; font-family: "Computer Modern Serif", Georgia, serif; }
    .sheet { max-width: 780px; margin: 0 auto; background: #fff; padding: 3.5rem 4rem; box-shadow: 0 10px 30px rgba(0,0,0,0.08); line-height: 1.6; }
    .wt-title-block { text-align: center; margin-bottom: 2rem; }
    .wt-doc-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem; }
    .wt-doc-author, .wt-doc-date { font-size: 1rem; color: #334155; margin: 0.2rem 0; }
    .wt-abstract { margin: 1.5rem 2.2rem; font-size: 0.94rem; }
    .wt-abstract-heading { text-align: center; font-weight: 700; margin-bottom: 0.4rem; }
    .wt-two-col { column-count: 2; column-gap: 2rem; }
    .wt-booktabs { border-collapse: collapse; margin: 0.5rem auto; font-size: 0.92rem; }
    .wt-booktabs th, .wt-booktabs td { padding: 0.35rem 0.8rem; }
    .wt-booktabs-top { border-top: 2px solid #111827; }
    .wt-booktabs-mid { border-top: 1px solid #334155; }
    .wt-booktabs-bottom { border-bottom: 2px solid #111827; }
    .wt-figure, .wt-table { margin: 1.4rem 0; text-align: center; }
    .wt-caption { font-size: 0.9rem; color: #334155; margin-top: 0.45rem; }
    .wt-theorem { margin: 1rem 0; padding: 0.65rem 0.9rem; border-left: 3px solid #4f46e5; background: #f8fafc; }
    .wt-proof { margin: 0.8rem 0; }
    .wt-qed { float: right; }
    .wt-code-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.75rem 1rem; font-family: monospace; font-size: 0.85rem; overflow-x: auto; }
    .wt-beamer-slide { border: 1px solid #cbd5e1; border-radius: 8px; padding: 2rem; margin: 1.5rem auto; aspect-ratio: 16/9; box-sizing: border-box; }
  </style>
</head>
<body>
  <main class="sheet">
    ${result.html}
  </main>
</body>
</html>`;
  triggerDownload(
    new Blob([html], { type: "text/html;charset=utf-8" }),
    `${safeTitle}.html`,
  );
}

export function exportSingleFile(file: ProjectFile): void {
  const filename = file.path.split("/").pop() || "document.tex";
  if (file.kind === "image" && file.content.startsWith("data:")) {
    fetch(file.content)
      .then((res) => res.blob())
      .then((blob) => triggerDownload(blob, filename))
      .catch(() => {
        triggerDownload(new Blob([file.content], { type: "text/plain" }), filename);
      });
    return;
  }
  triggerDownload(new Blob([file.content], { type: "text/plain;charset=utf-8" }), filename);
}

export async function exportProjectZip(project: WeTeXProject): Promise<void> {
  const zip = new JSZip();
  for (const file of project.files) {
    if (file.kind === "image" && file.content.startsWith("data:")) {
      const commaIdx = file.content.indexOf(",");
      if (commaIdx !== -1) {
        const header = file.content.slice(0, commaIdx);
        const data = file.content.slice(commaIdx + 1);
        if (header.includes(";base64")) {
          zip.file(file.path, data, { base64: true });
        } else {
          zip.file(file.path, decodeURIComponent(data));
        }
        continue;
      }
    }
    zip.file(file.path, file.content);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const safeName = project.name.replace(/[^\w.-]+/g, "_") || "wetex_project";
  triggerDownload(blob, `${safeName}.zip`);
}

export async function compileWithTeXLiveCloud(
  project: WeTeXProject,
  engine: CloudEngine = "pdflatex",
  returnFormat: "pdf" | "pdfjs" = "pdf",
): Promise<void> {
  await submitTeXLiveNetForm(project, engine, {
    target: "_blank",
    returnFormat,
  });
}

export function inferFileKind(path: string): ProjectFileKind {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tex")) return "tex";
  if (lower.endsWith(".bib")) return "bib";
  if (lower.endsWith(".cls")) return "cls";
  if (lower.endsWith(".sty")) return "sty";
  if (/\.(png|jpe?g|webp|gif|svg|bmp)$/.test(lower)) return "image";
  return "text";
}

function readFileAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function importFilesIntoProject(
  fileList: FileList | File[],
): Promise<{
  files: Omit<ProjectFile, "id" | "updatedAt">[];
  detectedMain?: string;
}> {
  const out: Omit<ProjectFile, "id" | "updatedAt">[] = [];
  let detectedMain: string | undefined;

  for (const file of Array.from(fileList)) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".zip")) {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((entry) => !entry.dir);
      // Strip common single top-level wrapper directory if every file shares it
      const firstSegs = new Set(entries.map((e) => e.name.split("/")[0]));
      const stripPrefix =
        firstSegs.size === 1 && entries.every((e) => e.name.includes("/"))
          ? `${Array.from(firstSegs)[0]}/`
          : "";

      for (const entry of entries) {
        const relPath = stripPrefix
          ? entry.name.slice(stripPrefix.length)
          : entry.name;
        if (!relPath || relPath.startsWith("__MACOSX") || relPath.startsWith(".")) {
          continue;
        }
        const kind = inferFileKind(relPath);
        if (kind === "image") {
          const blob = await entry.async("blob");
          const dataUrl = await readFileAsDataURL(blob);
          out.push({ path: relPath, kind, content: dataUrl });
        } else {
          const text = await entry.async("string");
          out.push({ path: relPath, kind, content: text });
          if (
            !detectedMain &&
            kind === "tex" &&
            text.includes("\\documentclass")
          ) {
            detectedMain = relPath;
          }
        }
      }
      continue;
    }

    const kind = inferFileKind(file.name);
    if (kind === "image") {
      const dataUrl = await readFileAsDataURL(file);
      out.push({ path: `figures/${file.name}`, kind, content: dataUrl });
    } else {
      const text = await file.text();
      out.push({ path: file.name, kind, content: text });
      if (!detectedMain && kind === "tex" && text.includes("\\documentclass")) {
        detectedMain = file.name;
      }
    }
  }

  return { files: out, detectedMain };
}
