import { createProjectFromTemplate } from "./templates";
import type { EditorSettings, ProjectSnapshot, WeTeXProject } from "./types";

const PROJECTS_KEY = "wetex_projects_v3";
const LEGACY_V2_KEY = "wetex_projects_v2";
const LEGACY_PROJECTS_KEY = "wetex_projects_v1";
const ACTIVE_KEY = "wetex_active_project_v1";
const SETTINGS_KEY = "wetex_settings_v1";
const MAX_SNAPSHOTS = 25;

export const DEFAULT_SETTINGS: EditorSettings = {
  autoCompile: true,
  compileDelayMs: 280,
  autoSave: true,
  autoSaveDelayMs: 1000,
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  autoCloseBrackets: true,
  highlightActiveLine: true,
  editorTheme: "cosmos-dark",
  paperTheme: "classic",
  paperLayout: "paginated",
  previewEngine: "real-pdf",
  cloudEngine: "pdflatex",
  bibliographyStyle: "plain",
  pdfViewerMode: "pdfjs",
  spellCheck: false,
  pageSize: "a4",
  liveMathBar: true,
};

export function loadProjects(): WeTeXProject[] {
  if (typeof window === "undefined") {
    return [createProjectFromTemplate("cosmic-dynamics")];
  }
  try {
    const rawV3 = window.localStorage.getItem(PROJECTS_KEY);
    if (rawV3) {
      const parsed = JSON.parse(rawV3) as WeTeXProject[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Migrate user-edited v2 or v1 projects if present; skip untouched default starters
    for (const legacyKey of [LEGACY_V2_KEY, LEGACY_PROJECTS_KEY]) {
      const rawLegacy = window.localStorage.getItem(legacyKey);
      if (!rawLegacy) continue;
      const parsedLegacy = JSON.parse(rawLegacy) as WeTeXProject[];
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        const userEdited = parsedLegacy.filter(
          (p) =>
            p.updatedAt > p.createdAt + 2000 ||
            p.snapshots.length > 0 ||
            parsedLegacy.length > 1 ||
            p.storageMode === "local-folder",
        );
        if (userEdited.length > 0) {
          saveProjects(userEdited);
          return userEdited;
        }
      }
    }
  } catch {
    // Corrupted storage falls back cleanly to starter project
  }
  const starter = createProjectFromTemplate("cosmic-dynamics");
  saveProjects([starter]);
  return [starter];
}

export function loadInitialStudioState(): {
  projects: WeTeXProject[];
  activeProjectId: string;
} {
  const projects = loadProjects();
  const activeProjectId = loadActiveProjectId(projects);
  return { projects, activeProjectId };
}

export function saveProjects(projects: WeTeXProject[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    return true;
  } catch {
    // Retry trimming older snapshots if storage quota is tight
    try {
      const trimmed = projects.map((p) => ({
        ...p,
        snapshots: p.snapshots.slice(0, 5),
      }));
      window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(trimmed));
      return true;
    } catch {
      return false;
    }
  }
}

export function loadActiveProjectId(projects: WeTeXProject[]): string {
  if (typeof window === "undefined") return projects[0]?.id ?? "";
  try {
    const saved = window.localStorage.getItem(ACTIVE_KEY);
    if (saved && projects.some((p) => p.id === saved)) return saved;
  } catch {
    // Ignore storage read failure
  }
  return projects[0]?.id ?? "";
}

export function saveActiveProjectId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // Ignore storage write failure
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
    // Ignore storage write failure
  }
}

export function createSnapshot(
  project: WeTeXProject,
  label: string,
): ProjectSnapshot {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    createdAt: Date.now(),
    mainFilePath: project.mainFilePath,
    files: project.files.map((f) => ({ ...f })),
  };
}

export function appendSnapshot(
  project: WeTeXProject,
  label: string,
): WeTeXProject {
  const snap = createSnapshot(project, label);
  return {
    ...project,
    snapshots: [snap, ...project.snapshots].slice(0, MAX_SNAPSHOTS),
  };
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

interface SharePayload {
  v: 1;
  name: string;
  templateId: string;
  mainFilePath: string;
  files: Array<{ path: string; kind: WeTeXProject["files"][number]["kind"]; content: string }>;
}

export async function encodeProjectToHash(project: WeTeXProject): Promise<string> {
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
      return `#wtz=${bytesToBase64Url(new Uint8Array(buf))}`;
    } catch {
      // Fallback to raw UTF-8 base64url
    }
  }
  return `#wt=${bytesToBase64Url(jsonBytes)}`;
}

export async function decodeProjectFromHash(
  hash: string,
): Promise<WeTeXProject | null> {
  if (!hash) return null;
  try {
    let jsonText = "";
    if (hash.startsWith("#wtz=") && typeof DecompressionStream !== "undefined") {
      const bytes = base64UrlToBytes(hash.slice(5));
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const ds = new DecompressionStream("gzip");
      const writer = ds.writable.getWriter();
      await writer.write(copy);
      await writer.close();
      const buf = await new Response(ds.readable).arrayBuffer();
      jsonText = new TextDecoder().decode(buf);
    } else if (hash.startsWith("#wt=")) {
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
      id: `shared-${now}`,
      name: `${parsed.name || "Shared Project"} (Shared)`,
      templateId: parsed.templateId || "cosmic-dynamics",
      mainFilePath: parsed.mainFilePath || parsed.files[0].path,
      files: parsed.files.map((f, idx) => ({
        id: `f-${now}-${idx}`,
        path: f.path,
        kind: f.kind,
        content: f.content,
        updatedAt: now,
      })),
      snapshots: [],
      createdAt: now,
      updatedAt: now,
    };
  } catch {
    return null;
  }
}
