'use client';
// ============================================================
// Website Builder Pro — Project Manager & Starter Templates
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Plus, Download, Upload, Trash2, Copy, FolderOpen, Search, HardDrive } from 'lucide-react';
import type { BuilderState, BuilderAction } from '../lib/types';
import {
  saveProject, loadProject, listProjects, deleteProject, duplicateProject,
  exportProjectJSON, importProjectJSON, getStorageUsageKB, type ProjectMeta,
} from '../lib/persistence';
import { SITE_TEMPLATES, type SiteTemplateDef } from '../lib/templates';
import { showToast } from '../lib/reducer';

interface ProjectManagerProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

export default function ProjectManager({ state, dispatch }: ProjectManagerProps) {
  if (!state.showProjectManager) return null;
  return <ProjectManagerInner state={state} dispatch={dispatch} />;
}

function ProjectManagerInner({ state, dispatch }: ProjectManagerProps) {
  const [projects, setProjects] = useState<ProjectMeta[]>(() => listProjects());
  const [showNewProject, setShowNewProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storageKB, setStorageKB] = useState<number>(() => getStorageUsageKB());

  const close = useCallback(() => {
    dispatch({ type: 'SHOW_PROJECT_MANAGER', payload: { show: false } });
  }, [dispatch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  const refreshProjects = () => {
    setProjects(listProjects());
    setStorageKB(getStorageUsageKB());
  };

  const handleNewProject = (tmpl: SiteTemplateDef) => {
    const project = tmpl.create();
    const res = saveProject(project);
    if (!res.ok && res.error) {
      showToast(dispatch, 'error', res.error);
    }
    dispatch({ type: 'LOAD_PROJECT', payload: { project } });
    showToast(dispatch, 'success', `Created "${project.name}" (${project.pageOrder.length} pages)`);
    setShowNewProject(false);
    close();
  };

  const handleOpen = (id: string) => {
    const project = loadProject(id);
    if (project) {
      dispatch({ type: 'LOAD_PROJECT', payload: { project } });
      showToast(dispatch, 'info', `Opened "${project.name}"`);
      close();
    }
  };

  const handleDuplicate = (id: string, name: string) => {
    const clone = duplicateProject(id, `${name} (Copy)`);
    if (clone) {
      refreshProjects();
      showToast(dispatch, 'success', `Duplicated "${name}"`);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}" permanently?`)) return;
    deleteProject(id);
    refreshProjects();
    showToast(dispatch, 'info', `Deleted "${name}"`);
  };

  const handleExportJSON = () => {
    const json = exportProjectJSON(state.project);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.project.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(dispatch, 'success', 'Exported project JSON');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const project = importProjectJSON(reader.result as string);
      if (project) {
        saveProject(project);
        dispatch({ type: 'LOAD_PROJECT', payload: { project } });
        showToast(dispatch, 'success', `Imported "${project.name}"`);
        close();
      } else {
        showToast(dispatch, 'error', 'Invalid project JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(p => p.name.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const storagePercent = Math.min(100, Math.round((storageKB / 5120) * 100));

  return (
    <div className="wb-modal-overlay" onClick={close}>
      <div className="wb-modal wb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h2>Projects & Starter Kits</h2>
          <button type="button" className="wb-modal-close" onClick={close}><X size={18} /></button>
        </div>

        <div className="wb-modal-body">
          <div className="wb-pm-actions">
            <button type="button" className="wb-pm-btn primary" onClick={() => setShowNewProject(v => !v)}>
              <Plus size={16} /> New Project
            </button>
            <button type="button" className="wb-pm-btn" onClick={handleExportJSON}>
              <Download size={16} /> Export JSON
            </button>
            <label className="wb-pm-btn">
              <Upload size={16} /> Import JSON
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>

            <div className="wb-pm-storage" title="Approximate browser localStorage usage (~5MB max)">
              <HardDrive size={13} />
              <span>{storageKB} KB ({storagePercent}%)</span>
            </div>
          </div>

          {showNewProject && (
            <div className="wb-pm-templates">
              <h3>Start With a Curated Multi-Page Website Kit</h3>
              <div className="wb-pm-starter-grid">
                {SITE_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.id}
                    type="button"
                    className="wb-pm-starter-card"
                    onClick={() => handleNewProject(tmpl)}
                  >
                    <div className="wb-pm-starter-head">
                      <span className="wb-pm-starter-icon">{tmpl.icon}</span>
                      <span className="wb-pm-starter-dot" style={{ background: tmpl.accentColor }} />
                    </div>
                    <div className="wb-pm-starter-title">{tmpl.name}</div>
                    <div className="wb-pm-starter-desc">{tmpl.tagline}</div>
                    <div className="wb-pm-starter-pages">
                      {tmpl.pageNames.map(pn => (
                        <span key={pn} className="wb-pm-page-chip">{pn}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="wb-pm-list-header">
            <h3>Saved Projects ({projects.length})</h3>
            <div className="wb-pm-search">
              <Search size={13} />
              <input
                type="text"
                placeholder="Filter saved projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="wb-pm-list">
            {filteredProjects.map(proj => (
              <div key={proj.id} className={`wb-pm-project ${proj.id === state.project.id ? 'active' : ''}`}>
                <div className="wb-pm-project-info">
                  <span className="wb-pm-project-name">
                    {proj.name}
                    {proj.id === state.project.id && <span className="wb-pm-active-badge">Active</span>}
                  </span>
                  <span className="wb-pm-project-date">Updated {formatDate(proj.updatedAt)}</span>
                </div>
                <div className="wb-pm-project-actions">
                  <button type="button" onClick={() => handleOpen(proj.id)} title="Open project"><FolderOpen size={14} /></button>
                  <button type="button" onClick={() => handleDuplicate(proj.id, proj.name)} title="Duplicate"><Copy size={14} /></button>
                  <button type="button" className="danger" onClick={() => handleDelete(proj.id, proj.name)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div className="wb-pm-empty">
                <p>{projects.length === 0 ? 'No saved projects yet. Click "New Project" to create one!' : 'No matching saved projects.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
