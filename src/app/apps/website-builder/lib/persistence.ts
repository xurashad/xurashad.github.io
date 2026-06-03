// ============================================================
// Website Builder Pro — Persistence (localStorage)
// ============================================================

import type { BuilderProject } from './types';
import { uid } from './defaults';

const INDEX_KEY = 'wb_project_index';
const PROJECT_PREFIX = 'wb_project_';
const LAST_PROJECT_KEY = 'wb_last_project';

interface ProjectMeta {
  id: string;
  name: string;
  updatedAt: number;
}

/* ========== Save / Load ========== */

export function saveProject(project: BuilderProject): void {
  try {
    const data = JSON.stringify(project);
    localStorage.setItem(`${PROJECT_PREFIX}${project.id}`, data);

    // Update index
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
  } catch (err) {
    // Handle quota exceeded
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Consider deleting old projects.');
    }
    console.error('Failed to save project:', err);
  }
}

export function loadProject(id: string): BuilderProject | null {
  try {
    const data = localStorage.getItem(`${PROJECT_PREFIX}${id}`);
    if (!data) return null;
    return JSON.parse(data) as BuilderProject;
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
    const project = JSON.parse(json) as BuilderProject;
    // Basic validation
    if (!project.id || !project.pages || !project.theme) {
      throw new Error('Invalid project format');
    }
    // Assign new ID to avoid conflicts
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
