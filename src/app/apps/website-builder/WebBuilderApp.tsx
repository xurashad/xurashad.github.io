'use client';
// ============================================================
// Website Builder Pro — Main Orchestrator
// ============================================================

import React, { useReducer, useRef, useCallback, useEffect } from 'react';
import type { CanvasHandle } from './lib/types';
import { builderReducer, createInitialState, showToast, getSelectedElement, getColumnForElement, getFirstColumnId } from './lib/reducer';
import { saveProject, loadProject, getLastProjectId } from './lib/persistence';
import { generatePreviewHTML, exportProjectZip } from './lib/export';

import Topbar from './components/Topbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import Canvas from './components/Canvas';
import FloatingToolbar from './components/FloatingToolbar';
import Toast from './components/Toast';
import ProjectManager from './components/ProjectManager';
import KeyboardShortcuts from './components/KeyboardShortcuts';

import './builder.css';

export default function WebBuilderApp() {
  const [state, dispatch] = useReducer(builderReducer, undefined, () => {
    // Try to load last project from localStorage
    const lastId = getLastProjectId();
    if (lastId) {
      const project = loadProject(lastId);
      if (project) return createInitialState(project);
    }
    return createInitialState();
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasHandleRef = useRef<CanvasHandle>(null);

  // Auto-save (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProject(state.project);
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.project]);

  // Save initial history snapshot
  useEffect(() => {
    dispatch({ type: 'SAVE_HISTORY' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Keyboard Shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't handle shortcuts when editing text
      const active = document.activeElement;
      const isEditing = active?.getAttribute('contenteditable') === 'true' ||
        active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.tagName === 'SELECT';

      if (e.key === 'Escape') {
        dispatch({ type: 'DESELECT' });
        dispatch({ type: 'SHOW_PROJECT_MANAGER', payload: { show: false } });
        dispatch({ type: 'SHOW_KEYBOARD_SHORTCUTS', payload: { show: false } });
        return;
      }

      if (e.key === '?' && !isEditing) {
        dispatch({ type: 'SHOW_KEYBOARD_SHORTCUTS', payload: { show: true } });
        return;
      }

      if (isEditing) return;

      // Viewport switches
      if (e.key === '1') { dispatch({ type: 'SET_VIEWPORT', payload: { mode: 'desktop' } }); return; }
      if (e.key === '2') { dispatch({ type: 'SET_VIEWPORT', payload: { mode: 'tablet' } }); return; }
      if (e.key === '3') { dispatch({ type: 'SET_VIEWPORT', payload: { mode: 'mobile' } }); return; }
      if (e.key === '[') { dispatch({ type: 'TOGGLE_LEFT_SIDEBAR' }); return; }
      if (e.key === ']') { dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' }); return; }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); dispatch({ type: 'UNDO' }); return; }
        if (e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); return; }
        if (e.key === 's') { e.preventDefault(); saveProject(state.project); showToast(dispatch, 'success', 'Project saved'); return; }
        if (e.key === 'd') {
          e.preventDefault();
          const el = getSelectedElement(state);
          if (el) { dispatch({ type: 'DUPLICATE_ELEMENT', payload: { elementId: el.id } }); dispatch({ type: 'SAVE_HISTORY' }); }
          return;
        }
        if (e.key === 'c') {
          e.preventDefault();
          const el = getSelectedElement(state);
          if (el) dispatch({ type: 'COPY_ELEMENT', payload: { element: el } });
          return;
        }
        if (e.key === 'v') {
          e.preventDefault();
          if (state.clipboardElement) {
            const el = getSelectedElement(state);
            const colId = el ? getColumnForElement(state, el.id) : getFirstColumnId(state);
            if (colId) {
              dispatch({ type: 'PASTE_ELEMENT', payload: { columnId: colId } });
              dispatch({ type: 'SAVE_HISTORY' });
            }
          }
          return;
        }
      }

      // Element-specific shortcuts
      const selectedEl = getSelectedElement(state);
      if (selectedEl) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          dispatch({ type: 'DELETE_ELEMENT', payload: { elementId: selectedEl.id } });
          dispatch({ type: 'SAVE_HISTORY' });
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: selectedEl.id, direction: 'up' } });
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: selectedEl.id, direction: 'down' } });
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, dispatch]);

  // ---- Preview ----
  const handlePreview = useCallback(() => {
    const html = generatePreviewHTML(state.project, state.canvasThemeMode);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, [state.project, state.canvasThemeMode]);

  // ---- Export ----
  const handleExport = useCallback(async () => {
    try {
      showToast(dispatch, 'info', 'Generating export...');
      const blob = await exportProjectZip(state.project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.project.name.replace(/\s+/g, '_')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(dispatch, 'success', 'Project exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      showToast(dispatch, 'error', 'Export failed. See console for details.');
    }
  }, [state.project, dispatch]);

  return (
    <div className="wb-app">
      <Topbar
        state={state}
        dispatch={dispatch}
        onExport={handleExport}
        onPreview={handlePreview}
      />

      <div className="wb-main">
        <LeftSidebar state={state} dispatch={dispatch} />

        <div className="wb-canvas-wrapper" ref={canvasRef}>
          <Canvas ref={canvasHandleRef} state={state} dispatch={dispatch} />
          <FloatingToolbar state={state} dispatch={dispatch} canvasRef={canvasRef} />
        </div>

        <RightSidebar state={state} dispatch={dispatch} />
      </div>

      {/* Status bar */}
      <div className="wb-statusbar">
        <span>
          {state.selection
            ? `Selected: ${state.selection.target} (${state.selection.id.split('_')[0]})`
            : 'No selection'}
        </span>
        <span>
          Page: {state.project.pages[state.currentPageId]?.title ?? '–'} |
          {' '}{state.project.pageOrder.length} page{state.project.pageOrder.length !== 1 ? 's' : ''} |
          {' '}{state.viewportMode}
        </span>
      </div>

      {/* Modals */}
      <ProjectManager state={state} dispatch={dispatch} />
      {state.showKeyboardShortcuts && (
        <KeyboardShortcuts onClose={() => dispatch({ type: 'SHOW_KEYBOARD_SHORTCUTS', payload: { show: false } })} />
      )}

      {/* Toasts */}
      <Toast toasts={state.toasts} dispatch={dispatch} />
    </div>
  );
}
