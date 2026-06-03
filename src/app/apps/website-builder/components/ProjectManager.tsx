'use client';
// ============================================================
// Website Builder Pro — Project Manager Modal
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Download, Upload, Trash2, Copy, FolderOpen } from 'lucide-react';
import type { BuilderState, BuilderAction, BuilderProject } from '../lib/types';
import { createDefaultProject } from '../lib/defaults';
import { saveProject, loadProject, listProjects, deleteProject, duplicateProject, exportProjectJSON, importProjectJSON } from '../lib/persistence';
import { PAGE_TEMPLATES } from '../lib/templates';

interface ProjectManagerProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

export default function ProjectManager({ state, dispatch }: ProjectManagerProps) {
  const [projects, setProjects] = useState<Array<{ id: string; name: string; updatedAt: number }>>([]);
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    setProjects(listProjects());
  }, [state.showProjectManager]);

  const close = useCallback(() => {
    dispatch({ type: 'SHOW_PROJECT_MANAGER', payload: { show: false } });
  }, [dispatch]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  const handleNewProject = (templateKey: string) => {
    const template = PAGE_TEMPLATES[templateKey];
    let project: BuilderProject;
    if (template) {
      project = createDefaultProject('New Website');
      const pages = template.create();
      project.pages = {};
      project.pageOrder = [];
      for (const page of pages) {
        project.pages[page.id] = page;
        project.pageOrder.push(page.id);
      }
    } else {
      project = createDefaultProject('New Website');
    }
    saveProject(project);
    dispatch({ type: 'LOAD_PROJECT', payload: { project } });
    setShowNewProject(false);
    close();
  };

  const handleOpen = (id: string) => {
    const project = loadProject(id);
    if (project) {
      dispatch({ type: 'LOAD_PROJECT', payload: { project } });
      close();
    }
  };

  const handleDuplicate = (id: string, name: string) => {
    const clone = duplicateProject(id, `${name} (Copy)`);
    if (clone) {
      setProjects(listProjects());
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this project permanently?')) return;
    deleteProject(id);
    setProjects(listProjects());
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
        close();
      } else {
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (!state.showProjectManager) return null;

  return (
    <div className="wb-modal-overlay" onClick={close}>
      <div className="wb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h2>Projects</h2>
          <button className="wb-modal-close" onClick={close}><X size={18} /></button>
        </div>

        <div className="wb-modal-body">
          {/* Action buttons */}
          <div className="wb-pm-actions">
            <button className="wb-pm-btn primary" onClick={() => setShowNewProject(!showNewProject)}>
              <Plus size={16} /> New Project
            </button>
            <button className="wb-pm-btn" onClick={handleExportJSON}>
              <Download size={16} /> Export JSON
            </button>
            <label className="wb-pm-btn">
              <Upload size={16} /> Import JSON
              <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
            </label>
          </div>

          {/* New project template selector */}
          {showNewProject && (
            <div className="wb-pm-templates">
              <h3>Choose a Template</h3>
              <div className="wb-pm-template-grid">
                <button className="wb-pm-template" onClick={() => handleNewProject('blank')}>
                  <div className="wb-pm-template-icon">📄</div>
                  <span>Blank</span>
                </button>
                {Object.entries(PAGE_TEMPLATES).filter(([k]) => k !== 'blank').map(([key, tmpl]) => (
                  <button key={key} className="wb-pm-template" onClick={() => handleNewProject(key)}>
                    <div className="wb-pm-template-icon">
                      {key === 'landing' ? '🚀' : key === 'portfolio' ? '💼' : key === 'business' ? '🏢' : '📰'}
                    </div>
                    <span>{tmpl.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project list */}
          <div className="wb-pm-list">
            {projects.map(proj => (
              <div key={proj.id} className={`wb-pm-project ${proj.id === state.project.id ? 'active' : ''}`}>
                <div className="wb-pm-project-info">
                  <span className="wb-pm-project-name">{proj.name}</span>
                  <span className="wb-pm-project-date">{formatDate(proj.updatedAt)}</span>
                </div>
                <div className="wb-pm-project-actions">
                  <button onClick={() => handleOpen(proj.id)} title="Open"><FolderOpen size={14} /></button>
                  <button onClick={() => handleDuplicate(proj.id, proj.name)} title="Duplicate"><Copy size={14} /></button>
                  <button className="danger" onClick={() => handleDelete(proj.id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="wb-pm-empty">
                <p>No saved projects yet. Create one to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
