import { createProjectFromTemplate } from "./templates";
import type { EditorSettings, MarkdownProject, MarkdownSnapshot } from "./types";

const PROJECTS_KEY = "mdstudio_projects_v1";
const ACTIVE_KEY = "mdstudio_active_v1";
const SETTINGS_KEY = "mdstudio_settings_v1";
const MAX_SNAPSHOTS = 30;

export const DEFAULT_SETTINGS: EditorSettings = {
  editorTheme: "cosmos-dark",
  previewTheme: "celestial",
  previewWidth: "document",
  editorFontFamily: "mono",
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  typewriterMode: false,
  focusMode: false,
  scrollSync: true,
  gfmBreaks: false,
  autoNumberHeadings: false,
  enableEmoji: true,
  enableMath: true,
  enableMermaid: true,
  enableHtml: true,
  spellCheck: false,
  wordGoal: 1000,
  autoSave: true,
  autoSaveDelayMs: 900,
  pageSize: "a4",
  liveMathBar: true,
};

export function loadProjects(): MarkdownProject[] {
  if (typeof window === "undefined") {
    return [createProjectFromTemplate("welcome-showcase")];
  }
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MarkdownProject[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to showcase template if storage is malformed
  }
  const starter = createProjectFromTemplate("welcome-showcase");
  saveProjects([starter]);
  return [starter];
}

export function loadActiveProjectId(projects: MarkdownProject[]): string {
  if (typeof window === "undefined") return projects[0]?.id ?? "";
  try {
    const saved = window.localStorage.getItem(ACTIVE_KEY);
    if (saved && projects.some((p) => p.id === saved)) return saved;
  } catch {
    // Ignore storage read failure
  }
  return projects[0]?.id ?? "";
}

export function loadInitialStudioState(): {
  projects: MarkdownProject[];
  activeProjectId: string;
} {
  const projects = loadProjects();
  const activeProjectId = loadActiveProjectId(projects);
  return { projects, activeProjectId };
}

export function saveProjects(projects: MarkdownProject[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return true;
  } catch {
    try {
      const trimmed = projects.map((p) => ({
        ...p,
        snapshots: p.snapshots.slice(0, 6),
      }));
      window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(trimmed));
      return true;
    } catch {
      return false;
    }
  }
}

export function saveActiveProjectId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // Ignore storage write error
  }
}

export function loadSettings(): EditorSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<EditorSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: EditorSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage write error
  }
}

export function createSnapshot(
  project: MarkdownProject,
  label: string,
): MarkdownSnapshot {
  return {
    id: `md-snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    createdAt: Date.now(),
    mainFilePath: project.mainFilePath,
    files: project.files.map((f) => ({ ...f })),
  };
}

export function appendSnapshot(
  project: MarkdownProject,
  label: string,
): MarkdownProject {
  const snap = createSnapshot(project, label);
  return {
    ...project,
    snapshots: [snap, ...project.snapshots].slice(0, MAX_SNAPSHOTS),
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (str.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

interface SharePayload {
  v: 1;
  name: string;
  templateId: string;
  mainFilePath: string;
  files: Array<{
    path: string;
    kind: MarkdownProject["files"][number]["kind"];
    content: string;
  }>;
}

export async function encodeProjectToHash(project: MarkdownProject): Promise<string> {
  const shareableFiles = project.files.filter(
    (f) => f.kind !== "image" || f.content.length < 16000,
  );
  const payload: SharePayload = {
    v: 1,
    name: project.name,
    templateId: project.templateId,
    mainFilePath: project.mainFilePath,
    files: shareableFiles.map((f) => ({
      path: f.path,
      kind: f.kind,
      content: f.content,
    })),
  };
  const jsonBytes = new TextEncoder().encode(JSON.stringify(payload));

  if (typeof CompressionStream !== "undefined") {
    try {
      const cs = new CompressionStream("gzip");
      const writer = cs.writable.getWriter();
      await writer.write(jsonBytes);
      await writer.close();
      const buf = await new Response(cs.readable).arrayBuffer();
      return `#mdz=${bytesToBase64Url(new Uint8Array(buf))}`;
    } catch {
      // Fallback to raw base64url
    }
  }
  return `#md=${bytesToBase64Url(jsonBytes)}`;
}

export async function decodeProjectFromHash(
  hash: string,
): Promise<MarkdownProject | null> {
  if (!hash) return null;
  try {
    let jsonText = "";
    if (hash.startsWith("#mdz=") && typeof DecompressionStream !== "undefined") {
      const bytes = base64UrlToBytes(hash.slice(5));
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const ds = new DecompressionStream("gzip");
      const writer = ds.writable.getWriter();
      await writer.write(copy);
      await writer.close();
      const buf = await new Response(ds.readable).arrayBuffer();
      jsonText = new TextDecoder().decode(buf);
    } else if (hash.startsWith("#md=")) {
      const bytes = base64UrlToBytes(hash.slice(4));
      jsonText = new TextDecoder().decode(bytes);
    } else {
      return null;
    }

    const parsed = JSON.parse(jsonText) as SharePayload;
    if (parsed.v !== 1 || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      return null;
    }
    const now = Date.now();
    return {
      id: `md-shared-${now}`,
      name: `${parsed.name || "Shared Workspace"} (Shared)`,
      templateId: parsed.templateId || "welcome-showcase",
      mainFilePath: parsed.mainFilePath || parsed.files[0].path,
      files: parsed.files.map((f, idx) => ({
        id: `md-f-${now}-${idx}`,
        path: f.path,
        kind: f.kind,
        content: f.content,
        updatedAt: now,
      })),
      snapshots: [],
      createdAt: now,
      updatedAt: now,
      storageMode: "browser",
    };
  } catch {
    return null;
  }
}
