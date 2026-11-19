// ============================================================
// Website Builder Pro — Persistence (localStorage + Migration)
// ============================================================

import type { BuilderProject, SectionNode, PageData, ElementNode } from './types';
import {
  uid, DEFAULT_THEME, DEFAULT_SETTINGS, createDefaultHeader, createDefaultFooter, createPageSEO,
} from './defaults';

const INDEX_KEY = 'wb_project_index';
const PROJECT_PREFIX = 'wb_project_';
const LAST_PROJECT_KEY = 'wb_last_project';
const SAVED_BLOCKS_KEY = 'wb_saved_blocks';

export interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
}

/* ========== Normalization & Migration Helpers ========== */

function normalizeElement(el: ElementNode): ElementNode {
  return {
    ...el,
    content: typeof el.content === 'string' ? el.content : '',
    styles: el.styles ?? {},
    hoverStyles: el.hoverStyles ?? {},
    attributes: el.attributes ?? {},
    children: Array.isArray(el.children) ? el.children.map(normalizeElement) : [],
  };
}

function normalizeSection(sec: SectionNode): SectionNode {
  return {
    ...sec,
    name: sec.name || 'Section',
    styles: sec.styles ?? {},
    fullBleed: Boolean(sec.fullBleed),
    rows: Array.isArray(sec.rows)
      ? sec.rows.map(r => ({
          ...r,
          styles: r.styles ?? {},
          columns: Array.isArray(r.columns)
            ? r.columns.map(c => ({
                ...c,
                span: c.span || 12,
                styles: c.styles ?? {},
                elements: Array.isArray(c.elements) ? c.elements.map(normalizeElement) : [],
              }))
            : [],
        }))
      : [],
  };
}

export function migrateProject(raw: BuilderProject): BuilderProject {
  const siteName = raw.settings?.siteName || raw.name || 'My Website';
  const pages: Record<string, PageData> = {};

  for (const [pid, page] of Object.entries(raw.pages ?? {})) {
    pages[pid] = {
      ...page,
      parentId: page.parentId ?? null,
      order: page.order ?? 0,
      hidden: Boolean(page.hidden),
      sections: Array.isArray(page.sections) ? page.sections.map(normalizeSection) : [],
      seo: page.seo ? { ...createPageSEO(page.title), ...page.seo } : createPageSEO(page.title),
    };
  }

  const pageOrder = Array.isArray(raw.pageOrder) && raw.pageOrder.length > 0
    ? raw.pageOrder.filter(id => Boolean(pages[id]))
    : Object.keys(pages);

  return {
    ...raw,
    name: raw.name || siteName,
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
    pages,
    pageOrder,
    header: normalizeSection(raw.header ?? createDefaultHeader(siteName)),
    footer: normalizeSection(raw.footer ?? createDefaultFooter(siteName)),
    theme: {
      ...DEFAULT_THEME,
      ...(raw.theme ?? {}),
      light: { ...DEFAULT_THEME.light, ...(raw.theme?.light ?? {}) },
      dark: { ...DEFAULT_THEME.dark, ...(raw.theme?.dark ?? {}) },
      fonts: { ...DEFAULT_THEME.fonts, ...(raw.theme?.fonts ?? {}) },
    },
    assets: raw.assets ?? {},
    settings: {
      ...DEFAULT_SETTINGS,
      ...(raw.settings ?? {}),
      siteName,
    },
  };
}

/* ========== Save / Load ========== */

export function saveProject(project: BuilderProject): { ok: boolean; error?: string } {
  try {
    const data = JSON.stringify(project);
    localStorage.setItem(`${PROJECT_PREFIX}${project.id}`, data);

    const index = getIndex();
    const existing = index.findIndex(m => m.id === project.id);
    const meta: ProjectMeta = { id: project.id, name: project.name, updatedAt: project.updatedAt };
    if (existing >= 0) {
      index[existing] = meta;
    } else {
      index.push(meta);
    }
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    setLastProjectId(project.id);
    return { ok: true };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      return { ok: false, error: 'Browser storage quota exceeded. Remove large assets or old projects.' };
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to save project.' };
  }
}

export function loadProject(id: string): BuilderProject | null {
  try {
    const data = localStorage.getItem(`${PROJECT_PREFIX}${id}`);
    if (!data) return null;
    return migrateProject(JSON.parse(data) as BuilderProject);
  } catch (err) {
    console.error('Failed to load project:', err);
    return null;
  }
}

export function listProjects(): ProjectMeta[] {
  return getIndex().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteProject(id: string): void {
  try {
    localStorage.removeItem(`${PROJECT_PREFIX}${id}`);
    const index = getIndex().filter(m => m.id !== id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    if (getLastProjectId() === id) {
      localStorage.removeItem(LAST_PROJECT_KEY);
    }
  } catch (err) {
    console.error('Failed to delete project:', err);
  }
}

export function duplicateProject(id: string, newName: string): BuilderProject | null {
  const project = loadProject(id);
  if (!project) return null;
  const clone: BuilderProject = JSON.parse(JSON.stringify(project));
  clone.id = uid('proj');
  clone.name = newName;
  clone.createdAt = Date.now();
  clone.updatedAt = Date.now();
  saveProject(clone);
  return clone;
}

/* ========== Saved Blocks ========== */

export function loadSavedBlocks(): SectionNode[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(SAVED_BLOCKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SectionNode[]).map(normalizeSection) : [];
  } catch {
    return [];
  }
}

export function saveSavedBlocks(blocks: SectionNode[]): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SAVED_BLOCKS_KEY, JSON.stringify(blocks));
  } catch {
    // ignore storage errors for optional reusable blocks
  }
}

/* ========== Storage Usage ========== */

export function getStorageUsageKB(): number {
  try {
    if (typeof window === 'undefined') return 0;
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wb_')) {
        const val = localStorage.getItem(key) ?? '';
        totalBytes += (key.length + val.length) * 2;
      }
    }
    return Math.round(totalBytes / 1024);
  } catch {
    return 0;
  }
}

/* ========== Last Project ========== */

export function getLastProjectId(): string | null {
  try {
    return localStorage.getItem(LAST_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function setLastProjectId(id: string): void {
  try {
    localStorage.setItem(LAST_PROJECT_KEY, id);
  } catch {
    // ignore
  }
}

/* ========== Import / Export JSON ========== */

export function exportProjectJSON(project: BuilderProject): string {
  return JSON.stringify(project, null, 2);
}

export function importProjectJSON(json: string): BuilderProject | null {
  try {
    const raw = JSON.parse(json) as BuilderProject;
    if (!raw.id || !raw.pages || !raw.theme) {
      throw new Error('Invalid project format');
    }
    const project = migrateProject(raw);
    project.id = uid('proj');
    project.updatedAt = Date.now();
    return project;
  } catch (err) {
    console.error('Failed to import project:', err);
    return null;
  }
}

/* ========== Internal ========== */

function getIndex(): ProjectMeta[] {
  try {
    const data = localStorage.getItem(INDEX_KEY);
    if (!data) return [];
    return JSON.parse(data) as ProjectMeta[];
  } catch {
    return [];
  }
}
