'use client';
// ============================================================
// Website Builder Pro — Studio Top Bar
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Monitor, Tablet, Smartphone, Undo2, Redo2, Eye, Download,
  Keyboard, FolderKanban, Sun, Moon, Search, Code2, ShieldCheck,
  Grid, BoxSelect, PanelLeft, PanelRight, ArrowLeft,
} from 'lucide-react';
import type { BuilderState, BuilderAction, ViewportMode } from '../lib/types';
import { auditProject } from '../lib/audit';

interface TopbarProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  onExport: () => void;
}

export default function Topbar({ state, dispatch, onExport }: TopbarProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(state.project.name);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  const undoLabel = state.historyLabels[state.historyIndex] || 'Edit';
  const redoLabel = state.historyLabels[state.historyIndex + 1] || 'Edit';

  const issueBadgeCount = useMemo(() => {
    const rep = auditProject(state.project);
    return rep.counts.error + rep.counts.warning;
  }, [state.project]);

  const handleNameSubmit = useCallback(() => {
    setEditingName(false);
    if (nameValue.trim()) {
      dispatch({ type: 'SET_PROJECT_NAME', payload: { name: nameValue.trim() } });
      dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Rename project' } });
    } else {
      setNameValue(state.project.name);
    }
  }, [nameValue, dispatch, state.project.name]);

  const setViewport = useCallback((mode: ViewportMode) => {
    dispatch({ type: 'SET_VIEWPORT', payload: { mode } });
  }, [dispatch]);

  const viewportButtons: { mode: ViewportMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'desktop', icon: <Monitor size={15} />, label: 'Desktop (1440px) — 1' },
    { mode: 'tablet', icon: <Tablet size={15} />, label: 'Tablet (768px) — 2' },
    { mode: 'mobile', icon: <Smartphone size={15} />, label: 'Mobile (375px) — 3' },
  ];

  return (
    <div className="wb-topbar">
      {/* Left: Back + Logo + Projects + Project Name */}
      <div className="wb-topbar-left">
        <Link href="/apps/website-builder" className="wb-topbar-btn" title="Back to Website Builder Launcher">
          <ArrowLeft size={15} />
        </Link>

        <button
          type="button"
          className={`wb-topbar-btn ${state.leftSidebarOpen ? 'active-subtle' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_LEFT_SIDEBAR' })}
          title="Toggle Left Panel ([)"
        >
          <PanelLeft size={15} />
        </button>

        <div className="wb-topbar-logo">
          <span className="wb-logo-icon">◆</span>
          <span className="wb-logo-text">WebBuilder</span>
        </div>

        <div className="wb-topbar-divider" />

        <button
          type="button"
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'SHOW_PROJECT_MANAGER', payload: { show: true } })}
          title="Projects & Starter Templates"
        >
          <FolderKanban size={15} />
          <span className="wb-btn-label">Projects</span>
        </button>

        {editingName ? (
          <input
            className="wb-topbar-name-input"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSubmit();
              if (e.key === 'Escape') {
                setEditingName(false);
                setNameValue(state.project.name);
              }
            }}
            autoFocus
          />
        ) : (
          <button
            type="button"
            className="wb-topbar-name"
            onClick={() => { setEditingName(true); setNameValue(state.project.name); }}
            title="Click to rename project"
          >
            {state.project.name}
          </button>
        )}
      </div>

      {/* Center: Viewport + Canvas Controls + Command Palette */}
      <div className="wb-topbar-center">
        <div className="wb-viewport-group">
          {viewportButtons.map(({ mode, icon, label }) => (
            <button
              key={mode}
              type="button"
              className={`wb-viewport-btn ${state.viewportMode === mode ? 'active' : ''}`}
              onClick={() => setViewport(mode)}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        <select
          className="wb-zoom-select"
          value={String(state.zoom)}
          onChange={(e) => dispatch({ type: 'SET_ZOOM', payload: { zoom: Number(e.target.value) } })}
          title="Canvas Zoom"
        >
          <option value="0.5">50%</option>
          <option value="0.75">75%</option>
          <option value="1">100%</option>
          <option value="1.25">125%</option>
        </select>

        <button
          type="button"
          className={`wb-topbar-btn ${state.showGridOverlay ? 'active-pill' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_GRID_OVERLAY' })}
          title="Toggle 12-Col Grid Overlay (G)"
        >
          <Grid size={15} />
        </button>

        <button
          type="button"
          className={`wb-topbar-btn ${state.showOutlines ? 'active-pill' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_OUTLINES' })}
          title="Toggle Wireframe Outlines (O)"
        >
          <BoxSelect size={15} />
        </button>

        <button
          type="button"
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'TOGGLE_CANVAS_THEME' })}
          title={`Switch canvas preview to ${state.canvasThemeMode === 'light' ? 'dark' : 'light'} mode`}
        >
          {state.canvasThemeMode === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        <button
          type="button"
          className="wb-cmd-trigger"
          onClick={() => dispatch({ type: 'SHOW_COMMAND_PALETTE', payload: { show: true } })}
          title="Command Palette (Ctrl+K)"
        >
          <Search size={13} />
          <span className="wb-btn-label">Commands</span>
          <kbd>⌘K</kbd>
        </button>
      </div>

      {/* Right: Undo/Redo, Audit, Code, Preview, Export, Shortcuts */}
      <div className="wb-topbar-right">
        <button
          type="button"
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!canUndo}
          title={canUndo ? `Undo (${undoLabel}) — Ctrl+Z` : 'Nothing to undo'}
        >
          <Undo2 size={15} />
        </button>
        <button
          type="button"
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!canRedo}
          title={canRedo ? `Redo (${redoLabel}) — Ctrl+Y` : 'Nothing to redo'}
        >
          <Redo2 size={15} />
        </button>

        <div className="wb-topbar-divider" />

        <button
          type="button"
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'SHOW_AUDIT_MODAL', payload: { show: true } })}
          title="Site Audit (SEO & Accessibility)"
        >
          <ShieldCheck size={15} />
          {issueBadgeCount > 0 && <span className="wb-audit-badge">{issueBadgeCount}</span>}
        </button>

        <button
          type="button"
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'SHOW_CODE_MODAL', payload: { show: true } })}
          title="Live HTML / CSS / JS Inspector"
        >
          <Code2 size={15} />
          <span className="wb-btn-label">Code</span>
        </button>

        <button
          type="button"
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'SHOW_PREVIEW', payload: { show: true } })}
          title="Interactive Preview (Ctrl+P)"
        >
          <Eye size={15} />
          <span className="wb-btn-label">Preview</span>
        </button>

        <button
          type="button"
          className="wb-topbar-btn primary"
          onClick={onExport}
          title="Export Production ZIP (Ctrl+Shift+E)"
        >
          <Download size={15} />
          <span className="wb-btn-label">Export</span>
        </button>

        <button
          type="button"
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'SHOW_KEYBOARD_SHORTCUTS', payload: { show: true } })}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={15} />
        </button>

        <button
          type="button"
          className={`wb-topbar-btn ${state.rightSidebarOpen ? 'active-subtle' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' })}
          title="Toggle Inspector Panel (])"
        >
          <PanelRight size={15} />
        </button>
      </div>
    </div>
  );
}
