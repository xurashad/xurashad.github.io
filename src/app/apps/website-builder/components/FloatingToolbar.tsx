'use client';
// ============================================================
// Website Builder Pro — Floating Toolbar (React 19 Safe)
// ============================================================

import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowUp, ArrowDown, Trash2, ClipboardCopy, MoveVertical,
  Maximize2, CopyPlus, Paintbrush, BookmarkPlus, Eye, EyeOff,
  Lock, Unlock, CornerLeftUp, Minus, Plus, Settings,
} from 'lucide-react';
import type { BuilderState, BuilderAction } from '../lib/types';
import {
  getSelectedElement, getSelectedSection, getSelectedColumn,
  getBreadcrumb, showToast,
} from '../lib/reducer';

interface FloatingToolbarProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function FloatingToolbar({ state, dispatch, canvasRef }: FloatingToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const selectedElement = state.selection?.target === 'element' ? getSelectedElement(state) : null;
  const selectedSection = state.selection?.target === 'section' ? getSelectedSection(state) : null;
  const selectedColumn = state.selection?.target === 'column' ? getSelectedColumn(state) : null;
  const breadcrumb = getBreadcrumb(state);

  useEffect(() => {
    if (!state.selection || !canvasRef.current || state.editingElementId) return;

    let rafId = 0;
    const measure = () => {
      const canvasEl = canvasRef.current;
      if (!canvasEl || !state.selection) {
        setPosition((prev) => (prev === null ? prev : null));
        return;
      }
      const targetEl = canvasEl.querySelector(`[data-builder-id="${state.selection.id}"]`);
      if (!targetEl) {
        setPosition((prev) => (prev === null ? prev : null));
        return;
      }

      const canvasRect = canvasEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      if (targetRect.bottom < canvasRect.top + 8 || targetRect.top > canvasRect.bottom - 8) {
        setPosition((prev) => (prev === null ? prev : null));
        return;
      }

      const toolbarW = toolbarRef.current?.offsetWidth ?? 260;
      const nextTop = Math.max(8, Math.min(canvasRect.height - 44, targetRect.top - canvasRect.top - 40));
      const nextLeft = Math.max(8, Math.min(canvasRect.width - toolbarW - 12, targetRect.right - canvasRect.left - toolbarW));

      setPosition((prev) => {
        if (prev && Math.abs(prev.top - nextTop) < 1 && Math.abs(prev.left - nextLeft) < 1) {
          return prev;
        }
        return { top: nextTop, left: nextLeft };
      });
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    scheduleMeasure();
    const observeTarget = canvasRef.current.querySelector('.wb-canvas-page') || canvasRef.current;
    const observer = new MutationObserver((mutations) => {
      const toolbarNode = toolbarRef.current;
      const relevant = mutations.some((m) => !toolbarNode || !toolbarNode.contains(m.target));
      if (relevant) scheduleMeasure();
    });
    observer.observe(observeTarget, { childList: true, subtree: true, attributes: true });
    window.addEventListener('scroll', scheduleMeasure, true);
    window.addEventListener('resize', scheduleMeasure);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('scroll', scheduleMeasure, true);
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [state.selection, state.editingElementId, state.viewportMode, state.zoom, canvasRef]);

  if (!state.selection || !position || state.editingElementId) return null;

  const parentSectionCrumb = breadcrumb.find(b => b.target === 'section');

  // Element toolbar
  if (selectedElement) {
    return (
      <div
        ref={toolbarRef}
        className="wb-floating-toolbar"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {parentSectionCrumb && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'SELECT', payload: { id: parentSectionCrumb.id, target: 'section' } })}
            title={`Select parent (${parentSectionCrumb.label})`}
          >
            <CornerLeftUp size={13} />
          </button>
        )}
        <button type="button" onClick={() => dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: selectedElement.id, direction: 'up' } })} title="Move Up">
          <ArrowUp size={14} />
        </button>
        <button type="button" onClick={() => dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: selectedElement.id, direction: 'down' } })} title="Move Down">
          <ArrowDown size={14} />
        </button>
        <div className="wb-ft-divider" />
        <button
          type="button"
          onClick={() => { dispatch({ type: 'COPY_STYLES', payload: { styles: selectedElement.styles } }); showToast(dispatch, 'info', 'Styles copied'); }}
          title="Copy Styles (Ctrl+Alt+C)"
        >
          <Paintbrush size={13} />
        </button>
        <button
          type="button"
          onClick={() => { dispatch({ type: 'DUPLICATE_ELEMENT', payload: { elementId: selectedElement.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Duplicate' } }); }}
          title="Duplicate (Ctrl+D)"
        >
          <CopyPlus size={14} />
        </button>
        <button
          type="button"
          onClick={() => { dispatch({ type: 'COPY_ELEMENT', payload: { element: selectedElement } }); showToast(dispatch, 'info', 'Copied element'); }}
          title="Copy (Ctrl+C)"
        >
          <ClipboardCopy size={14} />
        </button>
        <div className="wb-ft-divider" />
        <button
          type="button"
          onClick={() => dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: selectedElement.id, updates: { hidden: !selectedElement.hidden } } })}
          title={selectedElement.hidden ? 'Show' : 'Hide'}
        >
          {selectedElement.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: selectedElement.id, updates: { locked: !selectedElement.locked } } })}
          title={selectedElement.locked ? 'Unlock' : 'Lock'}
        >
          {selectedElement.locked ? <Unlock size={13} /> : <Lock size={13} />}
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => { dispatch({ type: 'DELETE_ELEMENT', payload: { elementId: selectedElement.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Delete element' } }); }}
          title="Delete (Del)"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  // Section toolbar
  if (selectedSection) {
    const isHeader = selectedSection.id === state.project.header.id;
    const isPageSection = Boolean(state.project.pages[state.currentPageId]?.sections.some(s => s.id === selectedSection.id));
    if (isHeader) {
      return (
        <div
          ref={toolbarRef}
          className="wb-floating-toolbar"
          style={{ top: position.top, left: position.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: { tab: 'settings' } })}
            title="Configure Header & Navigation"
            style={{ gap: 4, fontSize: 11, fontWeight: 600 }}
          >
            <Settings size={13} />
            <span>Header</span>
          </button>
          <div className="wb-ft-divider" />
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: { tab: 'style' } })}
            title="Style Header"
          >
            <Paintbrush size={13} />
          </button>
        </div>
      );
    }
    return (
      <div
        ref={toolbarRef}
        className="wb-floating-toolbar"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {isPageSection && (
          <>
            <button type="button" onClick={() => dispatch({ type: 'MOVE_SECTION', payload: { sectionId: selectedSection.id, direction: 'up' } })} title="Move Section Up">
              <ArrowUp size={14} />
            </button>
            <button type="button" onClick={() => dispatch({ type: 'MOVE_SECTION', payload: { sectionId: selectedSection.id, direction: 'down' } })} title="Move Section Down">
              <ArrowDown size={14} />
            </button>
            <div className="wb-ft-divider" />
          </>
        )}
        <button
          type="button"
          onClick={() => { dispatch({ type: 'ADD_ROW', payload: { sectionId: selectedSection.id, columns: 2 } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Add Row' } }); }}
          title="Add 2-Column Row"
        >
          <MoveVertical size={14} />
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: selectedSection.id, updates: { fullBleed: !selectedSection.fullBleed } } });
            dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Toggle full bleed' } });
          }}
          title="Toggle Full Bleed"
        >
          <Maximize2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => { dispatch({ type: 'SAVE_BLOCK', payload: { section: selectedSection } }); showToast(dispatch, 'success', `Saved "${selectedSection.name}" to Sections > Saved`); }}
          title="Save as Reusable Block"
        >
          <BookmarkPlus size={14} />
        </button>
        {isPageSection && (
          <>
            <button
              type="button"
              onClick={() => { dispatch({ type: 'DUPLICATE_SECTION', payload: { sectionId: selectedSection.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Duplicate section' } }); }}
              title="Duplicate Section"
            >
              <CopyPlus size={14} />
            </button>
            <div className="wb-ft-divider" />
            <button
              type="button"
              className="danger"
              onClick={() => { dispatch({ type: 'DELETE_SECTION', payload: { sectionId: selectedSection.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Delete section' } }); }}
              title="Delete Section"
            >
              <Trash2 size={14} />
            </button>
          </>
        )}
      </div>
    );
  }

  // Column toolbar
  if (selectedColumn) {
    return (
      <div
        ref={toolbarRef}
        className="wb-floating-toolbar"
        style={{ top: position.top, left: position.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {parentSectionCrumb && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'SELECT', payload: { id: parentSectionCrumb.id, target: 'section' } })}
            title={`Select Section (${parentSectionCrumb.label})`}
          >
            <CornerLeftUp size={13} />
          </button>
        )}
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_COLUMN_SPAN', payload: { columnId: selectedColumn.id, span: selectedColumn.span - 1 } })}
          disabled={selectedColumn.span <= 1}
          title="Narrow Column (-1/12)"
        >
          <Minus size={13} />
        </button>
        <span className="wb-ft-span">{selectedColumn.span}/12</span>
        <button
          type="button"
          onClick={() => dispatch({ type: 'SET_COLUMN_SPAN', payload: { columnId: selectedColumn.id, span: selectedColumn.span + 1 } })}
          disabled={selectedColumn.span >= 12}
          title="Widen Column (+1/12)"
        >
          <Plus size={13} />
        </button>
      </div>
    );
  }

  return null;
}
