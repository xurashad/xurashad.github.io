'use client';
// ============================================================
// Website Builder Pro — Floating Toolbar
// ============================================================

import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, Copy, Trash2, ClipboardCopy, MoveVertical, Maximize2, CopyPlus } from 'lucide-react';
import type { BuilderState, BuilderAction } from '../lib/types';
import { getSelectedElement, getColumnForElement } from '../lib/reducer';

interface FloatingToolbarProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function FloatingToolbar({ state, dispatch, canvasRef }: FloatingToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const selectedElement = state.selection?.target === 'element' ? getSelectedElement(state) : null;
  const selectedSection = state.selection?.target === 'section' ? state.selection : null;

  // Position the toolbar based on the selected element's DOM position
  useEffect(() => {
    if (!state.selection || !canvasRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const canvasEl = canvasRef.current;
      if (!canvasEl) return;
      const targetEl = canvasEl.querySelector(`[data-builder-id="${state.selection!.id}"]`);
      if (!targetEl) { setPosition(null); return; }

      const canvasRect = canvasEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      setPosition({
        top: targetRect.top - canvasRect.top - 40,
        left: targetRect.right - canvasRect.left - (toolbarRef.current?.offsetWidth ?? 200),
      });
    };

    updatePosition();
    const observer = new MutationObserver(updatePosition);
    observer.observe(canvasRef.current, { childList: true, subtree: true, attributes: true });
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [state.selection, canvasRef]);

  if (!state.selection || !position || state.editingElementId) return null;

  // Element actions toolbar
  if (selectedElement) {
    return (
      <div
        ref={toolbarRef}
        className="wb-floating-toolbar"
        style={{ top: Math.max(0, position.top), left: Math.max(0, position.left) }}
      >
        <button onClick={() => dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: selectedElement.id, direction: 'up' } })} title="Move Up">
          <ArrowUp size={14} />
        </button>
        <button onClick={() => dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: selectedElement.id, direction: 'down' } })} title="Move Down">
          <ArrowDown size={14} />
        </button>
        <div className="wb-ft-divider" />
        <button onClick={() => { dispatch({ type: 'DUPLICATE_ELEMENT', payload: { elementId: selectedElement.id } }); dispatch({ type: 'SAVE_HISTORY' }); }} title="Duplicate">
          <CopyPlus size={14} />
        </button>
        <button onClick={() => { dispatch({ type: 'COPY_ELEMENT', payload: { element: selectedElement } }); }} title="Copy">
          <ClipboardCopy size={14} />
        </button>
        <div className="wb-ft-divider" />
        <button className="danger" onClick={() => { dispatch({ type: 'DELETE_ELEMENT', payload: { elementId: selectedElement.id } }); dispatch({ type: 'SAVE_HISTORY' }); }} title="Delete">
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  // Section actions toolbar
  if (selectedSection) {
    return (
      <div
        ref={toolbarRef}
        className="wb-floating-toolbar"
        style={{ top: Math.max(0, position.top), left: Math.max(0, position.left) }}
      >
        <button onClick={() => dispatch({ type: 'MOVE_SECTION', payload: { sectionId: selectedSection.id, direction: 'up' } })} title="Move Up">
          <ArrowUp size={14} />
        </button>
        <button onClick={() => dispatch({ type: 'MOVE_SECTION', payload: { sectionId: selectedSection.id, direction: 'down' } })} title="Move Down">
          <ArrowDown size={14} />
        </button>
        <div className="wb-ft-divider" />
        <button onClick={() => dispatch({ type: 'ADD_ROW', payload: { sectionId: selectedSection.id, columns: 2 } })} title="Add Row (2 cols)">
          <MoveVertical size={14} />
        </button>
        <button onClick={() => {
          dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: selectedSection.id, updates: { fullBleed: !state.project.pages[state.currentPageId]?.sections.find(s => s.id === selectedSection.id)?.fullBleed } } });
        }} title="Toggle Full Bleed">
          <Maximize2 size={14} />
        </button>
        <button onClick={() => { dispatch({ type: 'DUPLICATE_SECTION', payload: { sectionId: selectedSection.id } }); dispatch({ type: 'SAVE_HISTORY' }); }} title="Duplicate Section">
          <CopyPlus size={14} />
        </button>
        <div className="wb-ft-divider" />
        <button className="danger" onClick={() => { dispatch({ type: 'DELETE_SECTION', payload: { sectionId: selectedSection.id } }); dispatch({ type: 'SAVE_HISTORY' }); }} title="Delete Section">
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return null;
}
