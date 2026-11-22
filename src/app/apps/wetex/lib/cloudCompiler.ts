import type {
  CloudEngine,
  CompilerDiagnostic,
  WeTeXProject,
} from "./types";

interface YtoResource {
  main?: boolean;
  path: string;
  content?: string;
  file?: string;
}

interface YtoErrorPayload {
  duration?: number;
  error?: string;
  message?: string;
  log_files?: Record<string, string>;
  quota?: {
    retry_after?: number;
    limit?: number;
    period?: string;
    banned?: boolean;
  };
}

export type CloudCompileResponse =
  | {
      ok: true;
      blob: Blob;
      provider?: "texlive.net" | "ytotech";
      compileTimeMs: number;
      logLines: string[];
    }
  | {
      ok: false;
      aborted?: boolean;
      offline: boolean;
      rateLimited?: boolean;
      retryAfterSec?: number;
      errorMessage: string;
      diagnostics: CompilerDiagnostic[];
      logLines: string[];
      compileTimeMs: number;
    };

const CLOUD_WINDOW_MS = 60_000;
const CLOUD_AUTO_BUDGET = 3;
const CLOUD_MANUAL_BUDGET = 5;
const recentCloudRequests: number[] = [];
let rateLimitedUntilMs = 0;

export function resetCloudRateLimitState(): void {
  recentCloudRequests.length = 0;
  rateLimitedUntilMs = 0;
}

export const TEXLIVE_IFRAME_NAME = "wetex-texlive-frame";

const PNG_RASTER_CACHE = new Map<string, string>();
const ASCII_PDF_IMAGE_CACHE = new Map<string, string>();

function decodeBase64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
  }
  return Uint8Array.from(Buffer.from(b64, "base64"));
}

/**
 * Wraps raw JPEG bytes into a standalone 1-page pure 7-bit ASCII PDF using
 * `/Filter [/ASCIIHexDecode /DCTDecode]`. Required for TeXLive.net's `latexcgi`
 * endpoint, which corrupts raw binary image uploads during multipart text decoding.
 */
export function jpegBytesToAsciiPdf(
  jpegBytes: Uint8Array,
  widthPx: number,
  heightPx: number,
  lineEnding: "\n" | "\r\n" = "\n",
): string {
  const safeW = Math.max(1, Math.round(widthPx));
  const safeH = Math.max(1, Math.round(heightPx));
  let hex = "";
  for (let i = 0; i < jpegBytes.length; i++) {
    hex += jpegBytes[i].toString(16).padStart(2, "0").toUpperCase();
    if ((i + 1) % 64 === 0) hex += lineEnding;
  }
  hex += ">";

  const wPt = (safeW * 0.75).toFixed(2);
  const hPt = (safeH * 0.75).toFixed(2);
  const content = `q${lineEnding}${wPt} 0 0 ${hPt} 0 0 cm${lineEnding}/Im0 Do${lineEnding}Q${lineEnding}`;

  const objs = [
    `1 0 obj${lineEnding}<< /Type /Catalog /Pages 2 0 R >>${lineEnding}endobj${lineEnding}`,
    `2 0 obj${lineEnding}<< /Type /Pages /Kids [3 0 R] /Count 1 >>${lineEnding}endobj${lineEnding}`,
    `3 0 obj${lineEnding}<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>${lineEnding}endobj${lineEnding}`,
    `4 0 obj${lineEnding}<< /Type /XObject /Subtype /Image /Width ${safeW} /Height ${safeH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${hex.length} >>${lineEnding}stream${lineEnding}${hex}${lineEnding}endstream${lineEnding}endobj${lineEnding}`,
    `5 0 obj${lineEnding}<< /Length ${content.length} >>${lineEnding}stream${lineEnding}${content}endstream${lineEnding}endobj${lineEnding}`,
  ];

  let pdf = `%PDF-1.4${lineEnding}`;
  const offsets: number[] = [0];
  for (const obj of objs) {
    offsets.push(pdf.length);
    pdf += obj;
  }
  const xrefPos = pdf.length;
  const xrefEol = lineEnding === "\r\n" ? "\r\n" : " \n";
  pdf += `xref${lineEnding}0 ${objs.length + 1}${lineEnding}0000000000 65535 f${xrefEol}`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n${xrefEol}`;
  }
  pdf += `trailer${lineEnding}<< /Size ${objs.length + 1} /Root 1 0 R >>${lineEnding}startxref${lineEnding}${xrefPos}${lineEnding}%%EOF${lineEnding}`;
  return pdf;
}

export async function rasterizeImageToPngBase64(
  dataUrl: string,
): Promise<string | null> {
  if (typeof document === "undefined" || !dataUrl.startsWith("data:")) {
    return null;
  }
  const cached = PNG_RASTER_CACHE.get(dataUrl);
  if (cached) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = dataUrl.startsWith("data:image/svg+xml") ? 2.5 : 1;
        const w = Math.max(64, Math.min(2400, Math.round((img.naturalWidth || 360) * scale)));
        const h = Math.max(64, Math.min(2400, Math.round((img.naturalHeight || 220) * scale)));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const pngDataUrl = canvas.toDataURL("image/png");
        const base64 = pngDataUrl.split(",")[1] || "";
        if (base64) {
          if (PNG_RASTER_CACHE.size > 40) PNG_RASTER_CACHE.clear();
          PNG_RASTER_CACHE.set(dataUrl, base64);
          resolve(base64);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export async function rasterizeImageToAsciiPdf(
  dataUrl: string,
): Promise<string | null> {
  if (!dataUrl.startsWith("data:")) return null;
  const cached = ASCII_PDF_IMAGE_CACHE.get(dataUrl);
  if (cached) return cached;

  if (typeof document === "undefined") {
    if (
      dataUrl.startsWith("data:image/jpeg;base64,") ||
      dataUrl.startsWith("data:image/jpg;base64,")
    ) {
      const b64 = dataUrl.split(",")[1] || "";
      if (!b64) return null;
      const asciiPdf = jpegBytesToAsciiPdf(decodeBase64ToBytes(b64), 360, 220);
      ASCII_PDF_IMAGE_CACHE.set(dataUrl, asciiPdf);
      return asciiPdf;
    }
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = dataUrl.startsWith("data:image/svg+xml") ? 2.5 : 1;
        const w = Math.max(64, Math.min(2400, Math.round((img.naturalWidth || 360) * scale)));
        const h = Math.max(64, Math.min(2400, Math.round((img.naturalHeight || 220) * scale)));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        const jpgDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = jpgDataUrl.split(",")[1] || "";
        if (!base64) {
          resolve(null);
          return;
        }
        const asciiPdf = jpegBytesToAsciiPdf(decodeBase64ToBytes(base64), w, h);
        if (ASCII_PDF_IMAGE_CACHE.size > 40) ASCII_PDF_IMAGE_CACHE.clear();
        ASCII_PDF_IMAGE_CACHE.set(dataUrl, asciiPdf);
        resolve(asciiPdf);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export function injectPdfPageModeUseNone(tex: string): string {
  const uncommented = tex.replace(/(^|[^\\])%.*$/gm, "$1");
  if (/pdfpagemode\s*=/i.test(uncommented)) return tex;
  const withPassOpt = tex.replace(
    /^([^%\r\n]*)\\documentclass\b/m,
    "$1\\PassOptionsToPackage{pdfpagemode=UseNone}{hyperref}\\documentclass",
  );
  return withPassOpt.replace(
    /^([^%\r\n]*)\\begin\{document\}/m,
    "$1\\AddToHook{begindocument/before}{\\ifdefined\\hypersetup\\hypersetup{pdfpagemode=UseNone}\\fi}\\begin{document}",
  );
}

export function rewriteTexFileRefs(
  tex: string,
  rewriteMap: Map<string, string>,
): string {
  if (rewriteMap.size === 0) return tex;
  return tex.replace(
    /(\\(?:input|include|subfile|includegraphics|bibliography|addbibresource|lstinputlisting|usepackage|documentclass)(?:\[[^\]]*\])?\{)([^}]+)(\})/g,
    (_full, prefix: string, rawArg: string, suffix: string) => {
      const parts = rawArg.split(",").map((part) => {
        const trimmed = part.trim().replace(/\\/g, "/").replace(/^\.\//, "");
        return rewriteMap.get(trimmed) ?? part;
      });
      return `${prefix}${parts.join(",")}${suffix}`;
    },
  );
}

export async function prepareTeXLiveNetPayload(project: WeTeXProject): Promise<{
  files: Array<{ filename: string; content: string }>;
  reverseFileMap: Map<string, string>;
}> {
  const rewriteMap = new Map<string, string>();
  const reverseFileMap = new Map<string, string>();
  const usedNames = new Set<string>(["document.tex"]);

  const claimUniqueName = (candidate: string): string => {
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
    const dot = candidate.lastIndexOf(".");
    const base = dot > 0 ? candidate.slice(0, dot) : candidate;
    const ext = dot > 0 ? candidate.slice(dot) : "";
    let counter = 2;
    while (usedNames.has(`${base}_${counter}${ext}`)) counter++;
    const next = `${base}_${counter}${ext}`;
    usedNames.add(next);
    return next;
  };

  reverseFileMap.set("document.tex", project.mainFilePath);

  // 1. Convert images into ASCII-hex single-page PDFs (TeXLive.net safe)
  const imageEntries: Array<{ origPath: string; flatName: string; content: string }> = [];
  for (const file of project.files) {
    if (file.kind !== "image" || !file.content.startsWith("data:")) continue;
    const asciiPdf = await rasterizeImageToAsciiPdf(file.content);
    if (!asciiPdf) continue;

    const norm = file.path.replace(/\\/g, "/").replace(/^\.\//, "");
    const rawFlat = `${norm.replace(/[^A-Za-z0-9._-]/g, "__").replace(/\.[^.]+$/, "")}.pdf`;
    const flatName = claimUniqueName(rawFlat);

    rewriteMap.set(norm, flatName);
    const noExt = norm.replace(/\.[^.]+$/, "");
    if (noExt !== norm) rewriteMap.set(noExt, flatName);
    reverseFileMap.set(flatName, file.path);
    imageEntries.push({ origPath: file.path, flatName, content: asciiPdf });
  }

  // 2. Register non-main non-image files with flattened names
  const extraFiles: Array<{ origPath: string; flatName: string; kind: string; content: string }> = [];
  for (const file of project.files) {
    if (file.kind === "image" || file.path === project.mainFilePath) continue;
    const norm = file.path.replace(/\\/g, "/").replace(/^\.\//, "");
    const flatName = claimUniqueName(norm.replace(/[^A-Za-z0-9._-]/g, "__"));
    const flatNoExt = flatName.replace(/\.[^.]+$/, "");
    const noExt = norm.replace(/\.[^.]+$/, "");

    rewriteMap.set(norm, flatName);
    if (noExt !== norm) rewriteMap.set(noExt, flatNoExt);
    reverseFileMap.set(flatName, file.path);
    extraFiles.push({
      origPath: file.path,
      flatName,
      kind: file.kind,
      content: file.content,
    });
  }

  // 3. Emit main file FIRST as document.tex (required by TeXLive.net latexcgi)
  const mainFile =
    project.files.find((f) => f.path === project.mainFilePath) ?? project.files[0];
  const files: Array<{ filename: string; content: string }> = [];
  if (mainFile) {
    files.push({
      filename: "document.tex",
      content: injectPdfPageModeUseNone(
        rewriteTexFileRefs(mainFile.content, rewriteMap),
      ).replace(/\r?\n/g, "\r\n"),
    });
  }

  for (const extra of extraFiles) {
    const raw =
      extra.kind === "tex"
        ? rewriteTexFileRefs(extra.content, rewriteMap)
        : extra.content;
    files.push({
      filename: extra.flatName,
      content: raw.replace(/\r?\n/g, "\r\n"),
    });
  }

  for (const img of imageEntries) {
    files.push({
      filename: img.flatName,
      content: img.content,
    });
  }

  return { files, reverseFileMap };
}

async function waitForNamedIframe(
  name: string,
  maxFrames = 8,
): Promise<HTMLIFrameElement | null> {
  if (typeof document === "undefined") return null;
  for (let i = 0; i < maxFrames; i++) {
    const el = document.querySelector<HTMLIFrameElement>(`iframe[name="${name}"]`);
    if (el) return el;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  return document.querySelector<HTMLIFrameElement>(`iframe[name="${name}"]`);
}

/**
 * Submits the multi-file project to TeXLive.net via a native multipart `<form>`
 * targeted at either the embedded studio iframe or `"_blank"`.
 * Native form navigation bypasses the 301 CORS preflight restriction that blocks
 * cross-origin `fetch()` calls from browser origins.
 */
export async function submitTeXLiveNetForm(
  project: WeTeXProject,
  engine: CloudEngine,
  options: { target: string; returnFormat: "pdf" | "pdfjs" | "log" },
): Promise<{ ok: boolean; fileCount: number; errorMessage?: string }> {
  if (typeof document === "undefined") {
    return { ok: false, fileCount: 0, errorMessage: "Browser DOM unavailable." };
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      ok: false,
      fileCount: 0,
      errorMessage: "Browser is offline — showing Instant Offline Preview.",
    };
  }
  if (options.target !== "_blank") {
    const iframe = await waitForNamedIframe(options.target);
    if (!iframe) {
      return { ok: false, fileCount: 0, errorMessage: "Preview iframe is hidden." };
    }
  }

  const { files } = await prepareTeXLiveNetPayload(project);
  if (files.length === 0) {
    return { ok: false, fileCount: 0, errorMessage: "No source files to compile." };
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://texlive.net/cgi-bin/latexcgi";
  form.enctype = "multipart/form-data";
  form.target = options.target;
  form.style.display = "none";

  const appendTextarea = (name: string, value: string) => {
    const ta = document.createElement("textarea");
    ta.name = name;
    ta.value = value;
    form.appendChild(ta);
  };

  for (const item of files) {
    appendTextarea("filename[]", item.filename);
    appendTextarea("filecontents[]", item.content);
  }

  const engineInput = document.createElement("input");
  engineInput.type = "hidden";
  engineInput.name = "engine";
  engineInput.value = engine;
  form.appendChild(engineInput);

  const returnInput = document.createElement("input");
  returnInput.type = "hidden";
  returnInput.name = "return";
  returnInput.value = options.returnFormat;
  form.appendChild(returnInput);

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    if (form.parentNode) form.parentNode.removeChild(form);
  }, 1000);

  return { ok: true, fileCount: files.length };
}

function normalizeLogFile(
  rawFile: string,
  mainFilePath: string,
  reverseFileMap?: Map<string, string>,
): string {
  const clean = rawFile.replace(/^\.\//, "").trim();
  if (!clean || clean === "__main_document__.tex" || clean === "document.tex") {
    return mainFilePath;
  }
  if (reverseFileMap?.has(clean)) {
    return reverseFileMap.get(clean) ?? mainFilePath;
  }
  return clean;
}

function isExternalTeXPath(candidate: string): boolean {
  const clean = candidate.trim();
  return (
    clean.startsWith("/usr/") ||
    clean.startsWith("/var/") ||
    clean.startsWith("/opt/") ||
    clean.startsWith("/etc/") ||
    clean.startsWith("/System/") ||
    clean.includes("/texmf") ||
    /^[A-Za-z]:[/\\]/.test(clean)
  );
}

export function parseTeXLog(
  rawLog: string,
  mainFilePath: string,
  reverseFileMap?: Map<string, string>,
): CompilerDiagnostic[] {
  const diagnostics: CompilerDiagnostic[] = [];
  const seen = new Set<string>();
  const lines = rawLog.split(/\r?\n/);

  // Track TeX parenthesized file scopes cleanly so `! ...` / `l.<line>` blame the active included file
  const parenStack: Array<{ isFile: boolean; projectFile: string | null }> = [];

  const getCurrentActiveFile = (): string => {
    for (let k = parenStack.length - 1; k >= 0; k--) {
      const entry = parenStack[k];
      if (entry.isFile && entry.projectFile) {
        return entry.projectFile;
      }
    }
    return mainFilePath;
  };

  const scanParensInLine = (ln: string) => {
    for (let k = 0; k < ln.length; k++) {
      const ch = ln[k];
      if (ch === "(") {
        const after = ln.slice(k + 1);
        const fileMatch = after.match(
          /^(\.?\/?[^\s()\[\]]+\.(?:tex|sty|cls|bib|cfg|clo|def|fd))(?=\s|\)|\[|$)/i,
        );
        if (fileMatch) {
          const rawCandidate = fileMatch[1];
          const external = isExternalTeXPath(rawCandidate);
          const mapped = external
            ? null
            : normalizeLogFile(rawCandidate, mainFilePath, reverseFileMap);
          parenStack.push({ isFile: true, projectFile: mapped });
        } else {
          parenStack.push({ isFile: false, projectFile: null });
        }
      } else if (ch === ")") {
        if (parenStack.length > 0) parenStack.pop();
      }
    }
  };

  const pushDiag = (
    severity: CompilerDiagnostic["severity"],
    file: string,
    line: number,
    message: string,
    context?: string,
  ) => {
    const normFile = normalizeLogFile(file, mainFilePath, reverseFileMap);
    const trimmedMsg = message.trim();
    const key = `${severity}:${normFile}:${line}:${trimmedMsg}`;
    if (seen.has(key)) return;
    seen.add(key);
    diagnostics.push({
      id: `texlog-${diagnostics.length + 1}`,
      severity,
      file: normFile,
      line: Math.max(1, line),
      message: trimmedMsg,
      context,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];

    // Standard TeX -file-line-error: ./main.tex:42: Undefined control sequence.
    const flMatch = ln.match(/^(\.?\/?[^:\s]+\.(?:tex|sty|cls|bib)):(\d+):\s*(.+)$/);
    if (flMatch) {
      const ctxLine = lines[i + 1]?.trim();
      pushDiag(
        "error",
        flMatch[1],
        parseInt(flMatch[2], 10) || 1,
        flMatch[3],
        ctxLine && ctxLine.length < 120 ? ctxLine : undefined,
      );
      scanParensInLine(ln);
      continue;
    }

    // Classic ! error followed by l.<line>
    if (ln.startsWith("! ")) {
      const activeFile = getCurrentActiveFile();
      let lineNum = 1;
      let contextStr = "";
      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        const lm = lines[j].match(/^l\.(\d+)\s*(.*)$/);
        if (lm) {
          lineNum = parseInt(lm[1], 10) || 1;
          contextStr = lm[2].trim();
          break;
        }
      }
      pushDiag("error", activeFile, lineNum, ln.slice(2), contextStr || undefined);
      scanParensInLine(ln);
      continue;
    }

    scanParensInLine(ln);

    // Warnings
    const warnMatch = ln.match(/^(?:LaTeX|Package\s+\S+|Class\s+\S+)\s+Warning:\s*(.+)$/);
    if (warnMatch) {
      const lineInWarn = ln.match(/on input line (\d+)/);
      pushDiag(
        "warning",
        getCurrentActiveFile(),
        lineInWarn ? parseInt(lineInWarn[1], 10) || 1 : 1,
        warnMatch[1],
      );
    }
  }

  // Drop noisy trailing TeX abort wrappers if we already captured at least one real error
  const realErrors = diagnostics.filter(
    (d) =>
      d.severity === "error" &&
      d.message !== "Emergency stop." &&
      !d.message.startsWith("==> Fatal error occurred"),
  );
  if (realErrors.length > 0) {
    return diagnostics.filter(
      (d) =>
        d.severity !== "error" ||
        (d.message !== "Emergency stop." &&
          !d.message.startsWith("==> Fatal error occurred")),
    );
  }

  return diagnostics;
}

export async function compileWithTeXLiveNet(
  project: WeTeXProject,
  engine: CloudEngine,
  signal?: AbortSignal,
): Promise<CloudCompileResponse> {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const { files, reverseFileMap } = await prepareTeXLiveNetPayload(project);

  const formData = new FormData();
  for (const item of files) {
    formData.append("filecontents[]", item.content);
    formData.append("filename[]", item.filename);
  }
  formData.append("engine", engine);
  formData.append("return", "pdf");

  try {
    const res = await fetch("https://texlive.net/cgi-bin/latexcgi", {
      method: "POST",
      body: formData,
      signal,
    });

    const elapsed = Math.max(
      1,
      Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - started),
    );
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const isPdfHeader =
      bytes.length >= 5 &&
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46 && // F
      bytes[4] === 0x2d;   // -

    if (res.ok && isPdfHeader) {
      const blob = new Blob([buf], { type: "application/pdf" });
      return {
        ok: true,
        blob,
        provider: "texlive.net",
        compileTimeMs: elapsed,
        logLines: [
          `TeX Live 2026 via TeXLive.net (${engine}) compiled cleanly in ${elapsed} ms.`,
          `Entry: ${project.mainFilePath} (${files.length} project resources submitted).`,
          `PDF output: ${(blob.size / 1024).toFixed(1)} KB (%PDF vector stream).`,
        ],
      };
    }

    const rawLog = new TextDecoder().decode(bytes);
    const trimmedStart = rawLog.trimStart();
    const isServiceError =
      res.status >= 500 ||
      trimmedStart.startsWith("Bad form") ||
      trimmedStart.startsWith("Bad Form") ||
      trimmedStart.startsWith("<!DOCTYPE") ||
      trimmedStart.startsWith("<html") ||
      rawLog.trim().length === 0;

    if (isServiceError) {
      return {
        ok: false,
        offline: true,
        errorMessage: `TeXLive.net returned service status (${res.status}).`,
        diagnostics: [],
        logLines: rawLog ? rawLog.split(/\r?\n/) : [`HTTP ${res.status}`],
        compileTimeMs: elapsed,
      };
    }

    const diagnostics = parseTeXLog(rawLog, project.mainFilePath, reverseFileMap);
    if (diagnostics.length === 0) {
      diagnostics.push({
        id: "texlog-fallback",
        severity: "error",
        file: project.mainFilePath,
        line: 1,
        message: "LaTeX compilation failed — inspect the Build Log for details.",
      });
    }

    return {
      ok: false,
      offline: false,
      errorMessage:
        diagnostics.find((d) => d.severity === "error")?.message ||
        "TeX Live compilation failed.",
      diagnostics,
      logLines: rawLog.split(/\r?\n/),
      compileTimeMs: elapsed,
    };
  } catch (err) {
    const elapsed = Math.max(
      1,
      Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - started),
    );
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        ok: false,
        aborted: true,
        offline: false,
        errorMessage: "Compilation superseded",
        diagnostics: [],
        logLines: [],
        compileTimeMs: elapsed,
      };
    }
    return {
      ok: false,
      offline: true,
      errorMessage:
        err instanceof Error
          ? `TeXLive.net unreachable (${err.message}).`
          : "TeXLive.net unreachable.",
      diagnostics: [],
      logLines: [
        `TeXLive.net request failed (${err instanceof Error ? err.message : "network error"}).`,
      ],
      compileTimeMs: elapsed,
    };
  }
}

export async function compileWithYtoTech(
  project: WeTeXProject,
  engine: CloudEngine,
  signal?: AbortSignal,
  options?: { backgroundAuto?: boolean; bypassClientGuard?: boolean },
): Promise<CloudCompileResponse> {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const now = Date.now();

  while (
    recentCloudRequests.length > 0 &&
    now - recentCloudRequests[0] >= CLOUD_WINDOW_MS
  ) {
    recentCloudRequests.shift();
  }

  if (!options?.bypassClientGuard && now < rateLimitedUntilMs) {
    const retryAfterSec = Math.max(1, Math.ceil((rateLimitedUntilMs - now) / 1000));
    const msg = `TeX Live fallback quota reached (6 builds/min limit). Showing Instant Preview — retry in ~${retryAfterSec}s.`;
    return {
      ok: false,
      offline: true,
      rateLimited: true,
      retryAfterSec,
      errorMessage: msg,
      diagnostics: [],
      logLines: [msg],
      compileTimeMs: 1,
    };
  }

  const budget = options?.backgroundAuto ? CLOUD_AUTO_BUDGET : CLOUD_MANUAL_BUDGET;
  if (!options?.bypassClientGuard && recentCloudRequests.length >= budget) {
    const oldest = recentCloudRequests[0] ?? now;
    const waitSec = Math.max(1, Math.ceil((oldest + CLOUD_WINDOW_MS - now) / 1000));
    const msg = options?.backgroundAuto
      ? `Paused secondary cloud sync (${budget}/min guard). Instant Preview is active — click Recompile to refresh PDF.`
      : `Slow down slightly (${waitSec}s) to stay within the fallback compiler's 6 builds/min quota.`;
    return {
      ok: false,
      offline: true,
      rateLimited: true,
      retryAfterSec: waitSec,
      errorMessage: msg,
      diagnostics: [],
      logLines: [msg],
      compileTimeMs: 1,
    };
  }

  const resources: YtoResource[] = [];
  const pathRewriteMap = new Map<string, string>();

  // 1. Prepare images (rasterizing SVG/WebP/GIF to PNG cleanly for TeX engines)
  for (const file of project.files) {
    if (file.kind !== "image" || !file.content.startsWith("data:")) continue;
    const isNativePdfImage =
      file.content.startsWith("data:image/png;base64,") ||
      file.content.startsWith("data:image/jpeg;base64,") ||
      file.content.startsWith("data:image/jpg;base64,");

    if (isNativePdfImage) {
      const base64 = file.content.split(",")[1] || "";
      if (base64) {
        resources.push({ path: file.path, file: base64 });
      }
    } else {
      const pngBase64 = await rasterizeImageToPngBase64(file.content);
      if (pngBase64) {
        const pngPath = file.path.replace(/\.[^.]+$/, ".png");
        pathRewriteMap.set(file.path, pngPath);
        resources.push({ path: pngPath, file: pngBase64 });
      }
    }
  }

  // 2. Prepare .tex / .bib / .cls / .sty / text files
  for (const file of project.files) {
    if (file.kind === "image") continue;
    let content = file.content;
    if (file.path === project.mainFilePath && file.kind === "tex") {
      content = injectPdfPageModeUseNone(content);
    }
    if (file.kind === "tex" && pathRewriteMap.size > 0) {
      content = rewriteTexFileRefs(content, pathRewriteMap);
    }
    resources.push({
      main: file.path === project.mainFilePath,
      path: file.path,
      content,
    });
  }

  recentCloudRequests.push(Date.now());

  try {
    const res = await fetch("https://latex.ytotech.com/builds/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/pdf, application/json",
      },
      body: JSON.stringify({
        compiler: engine,
        resources,
      }),
      signal,
    });

    const elapsed = Math.max(
      1,
      Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - started),
    );
    const ct = res.headers.get("content-type") || "";

    if (res.ok && ct.includes("application/pdf")) {
      const blob = await res.blob();
      return {
        ok: true,
        blob,
        provider: "ytotech",
        compileTimeMs: elapsed,
        logLines: [
          `TeX Live 2026 via YtoTech (${engine}) compiled cleanly in ${elapsed} ms.`,
          `Main entry: ${project.mainFilePath} (${resources.length} resources uploaded).`,
          `PDF output: ${(blob.size / 1024).toFixed(1)} KB (%PDF vector stream).`,
        ],
      };
    }

    const rawText = await res.text();
    let rawLog = rawText;
    let errTitle = `LaTeX compilation failed (${res.status})`;
    let parsedPayload: YtoErrorPayload | null = null;

    try {
      const parsed = JSON.parse(rawText) as YtoErrorPayload;
      parsedPayload = parsed;
      if (parsed.error) errTitle = `TeX Live error: ${parsed.error}`;
      if (parsed.log_files) {
        const logChunks = Object.entries(parsed.log_files).map(
          ([name, body]) => `=== ${name} ===\n${body}`,
        );
        rawLog = logChunks.join("\n\n");
      }
    } catch {
      // Non-JSON body kept as rawLog
    }

    const isQuotaExceeded =
      res.status === 429 || parsedPayload?.error === "QUOTA_EXCEEDED";
    if (isQuotaExceeded) {
      const headerRetry = Number(res.headers.get("retry-after"));
      const retryAfterSec =
        parsedPayload?.quota?.retry_after && Number.isFinite(parsedPayload.quota.retry_after)
          ? parsedPayload.quota.retry_after
          : Number.isFinite(headerRetry) && headerRetry > 0
            ? headerRetry
            : 60;
      rateLimitedUntilMs = Date.now() + Math.min(retryAfterSec, 300) * 1000;
      const quotaMsg =
        "Cloud TeX quota reached (6 builds/min limit). Showing Instant Preview — use TeXLive.net or Retry later.";
      return {
        ok: false,
        offline: true,
        rateLimited: true,
        retryAfterSec,
        errorMessage: quotaMsg,
        diagnostics: [],
        logLines: [
          quotaMsg,
          parsedPayload?.message ? `Details: ${parsedPayload.message}` : `HTTP ${res.status}`,
        ],
        compileTimeMs: elapsed,
      };
    }

    const diagnostics = parseTeXLog(rawLog, project.mainFilePath);
    if (diagnostics.length === 0) {
      diagnostics.push({
        id: "texlog-fallback",
        severity: "error",
        file: project.mainFilePath,
        line: 1,
        message: errTitle,
      });
    }

    return {
      ok: false,
      offline: false,
      errorMessage: diagnostics.find((d) => d.severity === "error")?.message || errTitle,
      diagnostics,
      logLines: rawLog.split(/\r?\n/),
      compileTimeMs: elapsed,
    };
  } catch (err) {
    const elapsed = Math.max(
      1,
      Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - started),
    );
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        ok: false,
        aborted: true,
        offline: false,
        errorMessage: "Compilation superseded",
        diagnostics: [],
        logLines: [],
        compileTimeMs: elapsed,
      };
    }
    return {
      ok: false,
      offline: true,
      errorMessage:
        err instanceof Error
          ? `Cloud compiler unreachable (${err.message}). Showing Instant Preview.`
          : "Cloud compiler unreachable. Showing Instant Preview.",
      diagnostics: [],
      logLines: [
        `Cloud TeX Live compilation could not connect (${err instanceof Error ? err.message : "network error"}).`,
        "Instant Offline Preview remains active.",
      ],
      compileTimeMs: elapsed,
    };
  }
}

export async function compileCloudLaTeX(
  project: WeTeXProject,
  engine: CloudEngine,
  signal?: AbortSignal,
  options?: { backgroundAuto?: boolean; bypassClientGuard?: boolean },
): Promise<CloudCompileResponse> {
  const primary = await compileWithTeXLiveNet(project, engine, signal);
  if (primary.ok) return primary;
  const primaryErr = primary as Extract<CloudCompileResponse, { ok: false }>;
  if (primaryErr.aborted || !primaryErr.offline) return primaryErr;

  const fallback = await compileWithYtoTech(project, engine, signal, options);
  if (fallback.ok) return fallback;
  const fallbackErr = fallback as Extract<CloudCompileResponse, { ok: false }>;
  if (fallbackErr.aborted) return fallbackErr;
  if (primaryErr.logLines.length > 0) {
    return {
      ...fallbackErr,
      logLines: [
        `[Primary TeXLive.net unavailable] ${primaryErr.errorMessage}`,
        ...fallbackErr.logLines,
      ],
    };
  }
  return fallbackErr;
}
