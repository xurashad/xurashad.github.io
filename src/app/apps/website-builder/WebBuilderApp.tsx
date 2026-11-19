'use client';
// ============================================================
// Website Builder Pro — Main Studio Orchestrator
// ============================================================

import React, { useReducer, useRef, useCallback, useEffect, useState } from 'react';
import { ChevronRight, Check, AlertTriangle, Loader2 } from 'lucide-react';
import type { CanvasHandle } from './lib/types';
import { VIEWPORT_WIDTHS } from './lib/types';
import {
  builderReducer, createInitialState, showToast,
  getSelectedElement, getSelectedSection, getSelectedColumn,
  getColumnForElement, getFirstColumnId, getBreadcrumb,
} from './lib/reducer';
import { saveProject, loadProject, getLastProjectId } from './lib/persistence';
import { exportProjectZip } from './lib/export';

import Topbar from './components/Topbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import Canvas from './components/Canvas';
import FloatingToolbar from './components/FloatingToolbar';
import RichTextToolbar from './components/RichTextToolbar';
import ContextMenu from './components/ContextMenu';
import Toast from './components/Toast';
import ProjectManager from './components/ProjectManager';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import PreviewModal from './components/PreviewModal';
import CodeInspectorModal from './components/CodeInspectorModal';
import CommandPaletteModal from './components/CommandPaletteModal';
import SiteAuditModal from './components/SiteAuditModal';

import './builder.css';

export default function WebBuilderApp() {
  const [state, dispatch] = useReducer(builderReducer, undefined, () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requestedId = params.get('project');
      if (requestedId) {
        const proj = loadProject(requestedId);
        if (proj) return createInitialState(proj);
      }
    }
    const lastId = getLastProjectId();
    if (lastId) {
      const project = loadProject(lastId);
      if (project) return createInitialState(project);
    }
    return createInitialState();
  });

  const [lastSavedTs, setLastSavedTs] = useState<number>(() => state.project.updatedAt);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasHandleRef = useRef<CanvasHandle>(null);

  const scrollToTarget = useCallback((targetId: string) => {
    canvasHandleRef.current?.scrollToElement(targetId);
  }, []);

  // Lock outer viewport cleanly while editor is mounted
  useEffect(() => {
    document.documentElement.classList.add('wb-editor-active');
    return () => {
      document.documentElement.classList.remove('wb-editor-active');
    };
  }, []);

  // Debounced auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      const res = saveProject(state.project);
      if (res.ok) {
        setLastSavedTs(state.project.updatedAt);
        setSaveError(null);
      } else {
        setSaveError(res.error ?? 'Save failed');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [state.project]);

  // Debounced automatic history snapshotting for property/input edits
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Edit properties' } });
    }, 900);
    return () => clearTimeout(timer);
  }, [state.project]);

  // Export ZIP handler
  const handleExport = useCallback(async () => {
    try {
      showToast(dispatch, 'info', 'Generating production ZIP...');
      const blob = await exportProjectZip(state.project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.project.name.replace(/\s+/g, '_')}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(dispatch, 'success', 'Exported production ZIP!');
    } catch (err) {
      console.error('Export failed:', err);
      showToast(dispatch, 'error', 'Export failed. See console for details.');
    }
  }, [state.project]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditing =
        active?.getAttribute('contenteditable') === 'true' ||
        active?.tagName === 'INPUT' ||
        active?.tagName === 'TEXTAREA' ||
        active?.tagName === 'SELECT';

      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      // Global shortcuts even while focused
      if (mod && key === 'k') {
        e.preventDefault();
        dispatch({ type: 'SHOW_COMMAND_PALETTE', payload: { show: !state.showCommandPalette } });
        return;
      }

      if (e.key === 'Escape') {
        if (state.editingElementId) {
          (active as HTMLElement | null)?.blur?.();
          dispatch({ type: 'SET_EDITING', payload: { elementId: null } });
          return;
        }
        dispatch({ type: 'SHOW_COMMAND_PALETTE', payload: { show: false } });
        dispatch({ type: 'SHOW_PROJECT_MANAGER', payload: { show: false } });
        dispatch({ type: 'SHOW_KEYBOARD_SHORTCUTS', payload: { show: false } });
        dispatch({ type: 'SHOW_CODE_MODAL', payload: { show: false } });
        dispatch({ type: 'SHOW_AUDIT_MODAL', payload: { show: false } });
        dispatch({ type: 'SHOW_PREVIEW', payload: { show: false } });
        dispatch({ type: 'DESELECT' });
        return;
      }

      if (isEditing) return;

      if (e.key === '?') {
        dispatch({ type: 'SHOW_KEYBOARD_SHORTCUTS', payload: { show: true } });
        return;
      }

      // Single-key workspace toggles
      if (!mod && !e.altKey) {
        if (e.key === '1') { dispatch({ type: 'SET_VIEWPORT', payload: { mode: 'desktop' } }); return; }
        if (e.key === '2') { dispatch({ type: 'SET_VIEWPORT', payload: { mode: 'tablet' } }); return; }
        if (e.key === '3') { dispatch({ type: 'SET_VIEWPORT', payload: { mode: 'mobile' } }); return; }
        if (e.key === '[') { dispatch({ type: 'TOGGLE_LEFT_SIDEBAR' }); return; }
        if (e.key === ']') { dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' }); return; }
        if (key === 'g') { dispatch({ type: 'TOGGLE_GRID_OVERLAY' }); return; }
        if (key === 'o') { dispatch({ type: 'TOGGLE_OUTLINES' }); return; }
      }

      // Ctrl/Cmd shortcuts
      if (mod) {
        if (key === 'z' && e.shiftKey) { e.preventDefault(); dispatch({ type: 'REDO' }); return; }
        if (key === 'z') { e.preventDefault(); dispatch({ type: 'UNDO' }); return; }
        if (key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); return; }
        if (key === 's') {
          e.preventDefault();
          const res = saveProject(state.project);
          if (res.ok) {
            setLastSavedTs(state.project.updatedAt);
            setSaveError(null);
            showToast(dispatch, 'success', 'Project saved');
          } else {
            showToast(dispatch, 'error', res.error ?? 'Save failed');
          }
          return;
        }
        if (key === 'p') {
          e.preventDefault();
          dispatch({ type: 'SHOW_PREVIEW', payload: { show: !state.showPreview } });
          return;
        }
        if (key === 'e' && e.shiftKey) {
          e.preventDefault();
          void handleExport();
          return;
        }
        if (key === 'c' && e.altKey) {
          e.preventDefault();
          const el = getSelectedElement(state);
          const sec = getSelectedSection(state);
          const col = getSelectedColumn(state);
          const styles = el?.styles ?? sec?.styles ?? col?.styles;
          if (styles) {
            dispatch({ type: 'COPY_STYLES', payload: { styles } });
            showToast(dispatch, 'info', 'Styles copied');
          }
          return;
        }
        if (key === 'v' && e.altKey) {
          e.preventDefault();
          if (state.selection && state.copiedStyles) {
            dispatch({ type: 'PASTE_STYLES', payload: { targetId: state.selection.id, targetType: state.selection.target } });
            dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Paste styles' } });
            showToast(dispatch, 'success', 'Styles pasted');
          }
          return;
        }
        if (key === 'd') {
          e.preventDefault();
          const el = getSelectedElement(state);
          if (el) {
            dispatch({ type: 'DUPLICATE_ELEMENT', payload: { elementId: el.id } });
            dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Duplicate element' } });
            return;
          }
          const sec = getSelectedSection(state);
          if (sec) {
            dispatch({ type: 'DUPLICATE_SECTION', payload: { sectionId: sec.id } });
            dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Duplicate section' } });
          }
          return;
        }
        if (key === 'c') {
          e.preventDefault();
          const el = getSelectedElement(state);
          if (el) {
            dispatch({ type: 'COPY_ELEMENT', payload: { element: el } });
            showToast(dispatch, 'info', 'Copied element');
          }
          return;
        }
        if (key === 'v') {
          e.preventDefault();
          if (state.clipboardElement) {
            const el = getSelectedElement(state);
            if (el?.type === 'container') {
              dispatch({ type: 'PASTE_ELEMENT', payload: { containerId: el.id } });
            } else {
              const colId = el ? getColumnForElement(state, el.id) : (state.selection?.target === 'column' ? state.selection.id : getFirstColumnId(state));
              if (colId) {
                dispatch({ type: 'PASTE_ELEMENT', payload: { columnId: colId } });
              }
            }
            dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Paste element' } });
          }
          return;
        }
      }

      // Selection delete & reorder
      const selectedEl = getSelectedElement(state);
      if (selectedEl) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          dispatch({ type: 'DELETE_ELEMENT', payload: { elementId: selectedEl.id } });
          dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Delete element' } });
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

      const selectedSec = getSelectedSection(state);
      if (selectedSec) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          dispatch({ type: 'DELETE_SECTION', payload: { sectionId: selectedSec.id } });
          dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Delete section' } });
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          dispatch({ type: 'MOVE_SECTION', payload: { sectionId: selectedSec.id, direction: 'up' } });
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          dispatch({ type: 'MOVE_SECTION', payload: { sectionId: selectedSec.id, direction: 'down' } });
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state, handleExport]);

  const breadcrumb = getBreadcrumb(state);
  const currentPage = state.project.pages[state.currentPageId];
  const isDirty = state.project.updatedAt !== lastSavedTs;

  return (
    <div className="wb-app">
      <Topbar
        state={state}
        dispatch={dispatch}
        onExport={handleExport}
      />

      <div className="wb-main">
        <LeftSidebar
          state={state}
          dispatch={dispatch}
          onScrollToElement={scrollToTarget}
        />

        <div className="wb-canvas-wrapper" ref={canvasRef}>
          <Canvas ref={canvasHandleRef} state={state} dispatch={dispatch} />
          <FloatingToolbar state={state} dispatch={dispatch} canvasRef={canvasRef} />
          <RichTextToolbar state={state} dispatch={dispatch} canvasRef={canvasRef} />
        </div>

        <RightSidebar state={state} dispatch={dispatch} />
      </div>

      {/* Status bar with Clickable Breadcrumb */}
      <div className="wb-statusbar">
        <div className="wb-breadcrumb">
          <button
            type="button"
            className="wb-crumb"
            onClick={() => dispatch({ type: 'DESELECT' })}
          >
            {currentPage?.title ?? 'Page'}
          </button>
          {breadcrumb.map((item, i) => (
            <React.Fragment key={item.id}>
              <ChevronRight size={11} style={{ opacity: 0.4 }} />
              <button
                type="button"
                className={`wb-crumb ${i === breadcrumb.length - 1 ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SELECT', payload: { id: item.id, target: item.target } })}
              >
                {item.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="wb-status-meta">
          <span className={`wb-save-pill ${saveError ? 'err' : isDirty ? 'dirty' : 'ok'}`}>
            {saveError ? (
              <><AlertTriangle size={11} /> {saveError}</>
            ) : isDirty ? (
              <><Loader2 size={11} className="wb-spin-icon" /> Saving...</>
            ) : (
              <><Check size={11} /> Saved</>
            )}
          </span>
          <span>·</span>
          <span>{state.viewportMode} ({VIEWPORT_WIDTHS[state.viewportMode]}px)</span>
          <span>·</span>
          <span>{Math.round(state.zoom * 100)}%</span>
          <span>·</span>
          <span>History {state.historyIndex + 1}/{state.history.length}</span>
        </div>
      </div>

      {/* Context Menu & Modals */}
      <ContextMenu state={state} dispatch={dispatch} />
      <ProjectManager state={state} dispatch={dispatch} />
      <PreviewModal state={state} dispatch={dispatch} />
      <CodeInspectorModal state={state} dispatch={dispatch} onExportZip={handleExport} />
      <CommandPaletteModal state={state} dispatch={dispatch} onExportZip={handleExport} />
      <SiteAuditModal state={state} dispatch={dispatch} onScrollToTarget={scrollToTarget} />
      {state.showKeyboardShortcuts && (
        <KeyboardShortcuts onClose={() => dispatch({ type: 'SHOW_KEYBOARD_SHORTCUTS', payload: { show: false } })} />
      )}

      {/* Toasts */}
      <Toast toasts={state.toasts} dispatch={dispatch} />
    </div>
  );
}
