import type { MarkdownFile } from "./types";
import { inferFileKind } from "./utils";

export interface MdStudioFileHandle {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{
    write: (data: string | BufferSource | Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

export interface MdStudioDirHandle {
  kind: "directory";
  name: string;
  entries: () => AsyncIterable<[string, MdStudioFileHandle | MdStudioDirHandle]>;
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<MdStudioDirHandle>;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<MdStudioFileHandle>;
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

const SKIPPED_FILENAMES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
const MAX_LOCAL_FILES = 200;
const MAX_LOCAL_FILE_BYTES = 15 * 1024 * 1024;
const IDB_NAME = "mdstudio_fs_handles_v1";
const IDB_STORE = "handles";

const ALLOWED_TEXT_EXT = /\.(md|markdown|mdx|qmd|txt|json|jsonl|yaml|yml|toml|css|scss)$/i;
const ALLOWED_IMG_EXT = /\.(png|jpg|jpeg|gif|webp|svg|avif|jfif)$/i;

export function isFileSystemAccessSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker ===
    "function"
  );
}

export function shouldSkipLocalEntry(name: string, isDir: boolean): boolean {
  const clean = name.trim();
  if (!clean) return true;
  if (isDir) {
    return clean.startsWith(".") || SKIPPED_DIRS.has(clean);
  }
  if (SKIPPED_FILENAMES.has(clean) || clean.startsWith(".")) return true;
  return !ALLOWED_TEXT_EXT.test(clean) && !ALLOWED_IMG_EXT.test(clean);
}

export function detectMainMarkdownPath(files: MarkdownFile[]): string {
  const mdFiles = files.filter((f) => f.kind === "md");
  const rootReadme = mdFiles.find((f) => f.path.toLowerCase() === "readme.md");
  if (rootReadme) return rootReadme.path;
  const rootIndex = mdFiles.find((f) => f.path.toLowerCase() === "index.md");
  if (rootIndex) return rootIndex.path;
  if (mdFiles.length > 0) return mdFiles[0].path;
  return files[0]?.path ?? "README.md";
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
  handle: MdStudioDirHandle,
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
): Promise<MdStudioDirHandle | null> {
  const db = await openHandleDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(projectId);
      req.onsuccess = () => {
        db.close();
        resolve((req.result as MdStudioDirHandle | undefined) ?? null);
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
  handle: MdStudioDirHandle,
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
  handle: MdStudioDirHandle,
): Promise<{ files: MarkdownFile[]; mainFilePath: string }> {
  const files: MarkdownFile[] = [];
  const now = Date.now();

  const walk = async (dir: MdStudioDirHandle, prefix: string) => {
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
          id: `md-file-${now}-${files.length}`,
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
  return { files, mainFilePath: detectMainMarkdownPath(files) };
}

export async function pickLocalFolder(): Promise<{
  handle: MdStudioDirHandle;
  name: string;
  files: MarkdownFile[];
  mainFilePath: string;
} | null> {
  if (!isFileSystemAccessSupported()) return null;
  const picker = (
    window as unknown as {
      showDirectoryPicker: (opts?: { mode?: "read" | "readwrite" }) => Promise<MdStudioDirHandle>;
    }
  ).showDirectoryPicker;

  try {
    const handle = await picker({ mode: "readwrite" });
    await ensureFolderPermission(handle, true);
    const { files, mainFilePath } = await readFilesFromDirectoryHandle(handle);
    return {
      handle,
      name: handle.name || "Local Folder",
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

export async function pickWritableFolderHandle(): Promise<MdStudioDirHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  const picker = (
    window as unknown as {
      showDirectoryPicker: (opts?: { mode?: "read" | "readwrite" }) => Promise<MdStudioDirHandle>;
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
): Promise<{ folderName: string; files: MarkdownFile[]; mainFilePath: string }> {
  const files: MarkdownFile[] = [];
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
    if (segments.length > 1) folderName = segments[0];
    const inner = segments.length > 1 ? segments.slice(1) : segments;
    if (inner.length === 0) continue;

    const dirs = inner.slice(0, -1);
    const leaf = inner[inner.length - 1];
    if (dirs.some((d) => shouldSkipLocalEntry(d, true)) || shouldSkipLocalEntry(leaf, false)) {
      continue;
    }

    const relPath = inner.join("/");
    const kind = inferFileKind(relPath);
    const content =
      kind === "image"
        ? await readFileAsDataUrl(fileObj)
        : await fileObj.text();

    files.push({
      id: `md-file-${now}-${files.length}`,
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
    mainFilePath: detectMainMarkdownPath(files),
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
  rootHandle: MdStudioDirHandle,
  file: MarkdownFile,
): Promise<boolean> {
  try {
    const parts = file.path.replace(/^\/+/, "").split("/").filter(Boolean);
    if (parts.length === 0) return false;
    let dir = rootHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      dir = await dir.getDirectoryHandle(parts[i], { create: true });
    }
    const fh = await dir.getFileHandle(parts[parts.length - 1], { create: true });
    const writable = await fh.createWritable();
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
  rootHandle: MdStudioDirHandle,
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
  rootHandle: MdStudioDirHandle,
  files: MarkdownFile[],
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
