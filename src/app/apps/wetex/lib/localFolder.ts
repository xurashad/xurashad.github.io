import { inferFileKind } from "./exporter";
import type { ProjectFile } from "./types";

export interface WeTeXFileHandle {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{
    write: (data: string | BufferSource | Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

export interface WeTeXDirHandle {
  kind: "directory";
  name: string;
  entries: () => AsyncIterable<[string, WeTeXFileHandle | WeTeXDirHandle]>;
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<WeTeXDirHandle>;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<WeTeXFileHandle>;
  removeEntry: (name: string, options?: { recursive?: boolean }) => Promise<void>;
  queryPermission?: (descriptor: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
}

const SKIPPED_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
  "out",
  "__pycache__",
  ".vscode",
  ".idea",
]);

const SKIPPED_EXTENSIONS = [
  ".aux",
  ".log",
  ".out",
  ".toc",
  ".lof",
  ".lot",
  ".bbl",
  ".blg",
  ".fls",
  ".fdb_latexmk",
  ".synctex.gz",
  ".synctex",
  ".nav",
  ".snm",
  ".vrb",
  ".pdf",
  ".dvi",
  ".ps",
  ".xdv",
  ".bcf",
  ".run.xml",
];

const SKIPPED_FILENAMES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
const MAX_LOCAL_FILES = 150;
const MAX_LOCAL_FILE_BYTES = 15 * 1024 * 1024;
const IDB_NAME = "wetex_fs_handles_v1";
const IDB_STORE = "handles";

export function isFileSystemAccessSupported(): boolean {
  if (typeof window === "undefined") return false;
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === "function";
}

export function shouldSkipLocalEntry(name: string, isDir: boolean): boolean {
  const clean = name.trim();
  if (!clean) return true;
  if (isDir) {
    return clean.startsWith(".") || SKIPPED_DIRS.has(clean);
  }
  if (SKIPPED_FILENAMES.has(clean)) return true;
  if (clean.startsWith(".") && !clean.endsWith(".tex") && !clean.endsWith(".bib")) {
    return true;
  }
  const lower = clean.toLowerCase();
  return SKIPPED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function detectMainTexPath(files: ProjectFile[]): string {
  const texFiles = files.filter((f) => f.kind === "tex");
  const rootMain = texFiles.find((f) => f.path.toLowerCase() === "main.tex");
  if (rootMain) return rootMain.path;
  const anyMain = texFiles.find((f) => f.path.toLowerCase().endsWith("/main.tex"));
  if (anyMain) return anyMain.path;
  const docClassFile = texFiles.find((f) => /\\documentclass\b/.test(f.content));
  if (docClassFile) return docClassFile.path;
  if (texFiles.length > 0) return texFiles[0].path;
  return files[0]?.path ?? "main.tex";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed reading file"));
    reader.readAsDataURL(file);
  });
}

function openHandleDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveFolderHandle(
  projectId: string,
  handle: WeTeXDirHandle,
): Promise<boolean> {
  const db = await openHandleDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(handle, projectId);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

export async function loadFolderHandle(
  projectId: string,
): Promise<WeTeXDirHandle | null> {
  const db = await openHandleDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(projectId);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as WeTeXDirHandle | undefined) ?? null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function removeFolderHandle(projectId: string): Promise<void> {
  const db = await openHandleDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(projectId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function ensureFolderPermission(
  handle: WeTeXDirHandle,
  requestIfNeeded: boolean,
): Promise<boolean> {
  try {
    const mode = { mode: "readwrite" as const };
    if (handle.queryPermission) {
      const status = await handle.queryPermission(mode);
      if (status === "granted") return true;
      if (!requestIfNeeded) return false;
    }
    if (requestIfNeeded && handle.requestPermission) {
      const next = await handle.requestPermission(mode);
      return next === "granted";
    }
    return !handle.queryPermission;
  } catch {
    return false;
  }
}

export async function readFilesFromDirectoryHandle(
  handle: WeTeXDirHandle,
): Promise<{ files: ProjectFile[]; mainFilePath: string }> {
  const files: ProjectFile[] = [];
  const now = Date.now();

  const walk = async (dir: WeTeXDirHandle, prefix: string) => {
    for await (const [name, entry] of dir.entries()) {
      if (files.length >= MAX_LOCAL_FILES) return;
      const isDir = entry.kind === "directory";
      if (shouldSkipLocalEntry(name, isDir)) continue;
      const relPath = prefix ? `${prefix}/${name}` : name;

      if (isDir) {
        await walk(entry, relPath);
      } else {
        const fileObj = await entry.getFile();
        if (fileObj.size > MAX_LOCAL_FILE_BYTES) continue;
        const kind = inferFileKind(relPath);
        const content =
          kind === "image"
            ? await readFileAsDataUrl(fileObj)
            : await fileObj.text();
        files.push({
          id: `file-${now}-${files.length}`,
          path: relPath,
          kind,
          content,
          updatedAt: fileObj.lastModified || now,
        });
      }
    }
  };

  await walk(handle, "");
  files.sort((a, b) => a.path.localeCompare(b.path));
  return { files, mainFilePath: detectMainTexPath(files) };
}

export async function pickLocalFolder(): Promise<{
  handle: WeTeXDirHandle;
  name: string;
  files: ProjectFile[];
  mainFilePath: string;
} | null> {
  if (!isFileSystemAccessSupported()) return null;
  const picker = (
    window as unknown as {
      showDirectoryPicker: (opts?: { mode?: "read" | "readwrite" }) => Promise<WeTeXDirHandle>;
    }
  ).showDirectoryPicker;

  try {
    const handle = await picker({ mode: "readwrite" });
    await ensureFolderPermission(handle, true);
    const { files, mainFilePath } = await readFilesFromDirectoryHandle(handle);
    return {
      handle,
      name: handle.name || "Local Project",
      files,
      mainFilePath,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return null;
    }
    throw err;
  }
}

export async function pickWritableFolderHandle(): Promise<WeTeXDirHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  const picker = (
    window as unknown as {
      showDirectoryPicker: (opts?: { mode?: "read" | "readwrite" }) => Promise<WeTeXDirHandle>;
    }
  ).showDirectoryPicker;

  try {
    const handle = await picker({ mode: "readwrite" });
    const ok = await ensureFolderPermission(handle, true);
    return ok ? handle : null;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return null;
    }
    throw err;
  }
}

export async function importFromWebkitDirectoryFiles(
  fileList: FileList,
): Promise<{ folderName: string; files: ProjectFile[]; mainFilePath: string }> {
  const files: ProjectFile[] = [];
  const now = Date.now();
  let folderName = "Local Folder";

  for (const fileObj of Array.from(fileList)) {
    if (files.length >= MAX_LOCAL_FILES) break;
    if (fileObj.size > MAX_LOCAL_FILE_BYTES) continue;

    const rawRel = (
      (fileObj as File & { webkitRelativePath?: string }).webkitRelativePath ||
      fileObj.name
    ).replace(/\\/g, "/");
    const segments = rawRel.split("/").filter(Boolean);
    if (segments.length > 1) {
      folderName = segments[0];
    }
    const innerSegments = segments.length > 1 ? segments.slice(1) : segments;
    if (innerSegments.length === 0) continue;

    // Skip ignored folders/artifacts
    const dirSegments = innerSegments.slice(0, -1);
    const leafName = innerSegments[innerSegments.length - 1];
    if (
      dirSegments.some((d) => shouldSkipLocalEntry(d, true)) ||
      shouldSkipLocalEntry(leafName, false)
    ) {
      continue;
    }

    const relPath = innerSegments.join("/");
    const kind = inferFileKind(relPath);
    const content =
      kind === "image"
        ? await readFileAsDataUrl(fileObj)
        : await fileObj.text();

    files.push({
      id: `file-${now}-${files.length}`,
      path: relPath,
      kind,
      content,
      updatedAt: fileObj.lastModified || now,
    });
  }

  files.sort((a, b) => a.path.localeCompare(b.path));
  return {
    folderName,
    files,
    mainFilePath: detectMainTexPath(files),
  };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const header = comma !== -1 ? dataUrl.slice(0, comma) : "";
  const body = comma !== -1 ? dataUrl.slice(comma + 1) : dataUrl;
  const mimeMatch = header.match(/^data:([^;]+)/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";

  if (header.includes(";base64")) {
    const bin = atob(body);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(body)], { type: mime });
}

export async function writeProjectFileToHandle(
  rootHandle: WeTeXDirHandle,
  file: ProjectFile,
): Promise<boolean> {
  try {
    const parts = file.path.replace(/^\/+/, "").split("/").filter(Boolean);
    if (parts.length === 0) return false;
    let dir = rootHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create: true });
    }
    const fileHandle = await dir.getFileHandle(parts[parts.length - 1], {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    if (file.kind === "image" && file.content.startsWith("data:")) {
      await writable.write(dataUrlToBlob(file.content));
    } else {
      await writable.write(file.content);
    }
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export async function deleteFileFromHandle(
  rootHandle: WeTeXDirHandle,
  relativePath: string,
): Promise<boolean> {
  try {
    const parts = relativePath.replace(/^\/+/, "").split("/").filter(Boolean);
    if (parts.length === 0) return false;
    let dir = rootHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create: false });
    }
    await dir.removeEntry(parts[parts.length - 1]);
    return true;
  } catch {
    return false;
  }
}

export async function writeAllProjectFilesToHandle(
  rootHandle: WeTeXDirHandle,
  files: ProjectFile[],
): Promise<{ written: number; failed: number }> {
  let written = 0;
  let failed = 0;
  for (const file of files) {
    const ok = await writeProjectFileToHandle(rootHandle, file);
    if (ok) written++;
    else failed++;
  }
  return { written, failed };
}
