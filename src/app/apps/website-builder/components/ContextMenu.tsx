'use client';
// ============================================================
// Website Builder Pro — Canvas Context Menu
// ============================================================

import React, { useEffect } from 'react';
import {
  Edit3, Copy, ClipboardPaste, Paintbrush, CopyPlus,
  ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock,
  BookmarkPlus, Trash2, Layers,
} from 'lucide-react';
import type { BuilderState, BuilderAction } from '../lib/types';
import {
  getSelectedElement, getSelectedSection, getColumnForElement,
  getFirstColumnId, showToast,
} from '../lib/reducer';

interface ContextMenuProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

export default function ContextMenu({ state, dispatch }: ContextMenuProps) {
  const menu = state.contextMenu;

  useEffect(() => {
    if (!menu) return;
    const close = () => dispatch({ type: 'SET_CONTEXT_MENU', payload: { menu: null } });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu, dispatch]);

  if (!menu) return null;

  const close = () => dispatch({ type: 'SET_CONTEXT_MENU', payload: { menu: null } });

  // Clamp coordinates so menu stays inside viewport
  const left = typeof window !== 'undefined' ? Math.min(menu.x, window.innerWidth - 220) : menu.x;
  const top = typeof window !== 'undefined' ? Math.min(menu.y, window.innerHeight - 360) : menu.y;

  const targetEl = menu.targetType === 'element'
    ? (state.selection?.id === menu.targetId ? getSelectedElement(state) : null)
    : null;
  const targetSec = menu.targetType === 'section'
    ? (state.selection?.id === menu.targetId ? getSelectedSection(state) : null)
    : null;

  const textTypes = ['heading', 'paragraph', 'list', 'blockquote', 'code', 'button', 'link', 'badge', 'alert'];
  const canInlineEdit = targetEl && textTypes.includes(targetEl.type);
  const targetColId = targetEl ? getColumnForElement(state, targetEl.id) : getFirstColumnId(state);

  return (
    <div
      className="wb-context-menu"
      style={{ top: Math.max(8, top), left: Math.max(8, left) }}
      onClick={(e) => e.stopPropagation()}
    >
      {menu.targetType === 'element' && targetEl && (
        <>
          {canInlineEdit && (
            <button type="button" onClick={() => { dispatch({ type: 'SET_EDITING', payload: { elementId: targetEl.id } }); close(); }}>
              <Edit3 size={13} /> <span>Edit Text</span>
            </button>
          )}
          <button type="button" onClick={() => { dispatch({ type: 'COPY_ELEMENT', payload: { element: targetEl } }); showToast(dispatch, 'info', 'Element copied'); close(); }}>
            <Copy size={13} /> <span>Copy Element</span>
          </button>
          {state.clipboardElement && targetColId && (
            <button type="button" onClick={() => { dispatch({ type: 'PASTE_ELEMENT', payload: { columnId: targetColId } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Paste element' } }); close(); }}>
              <ClipboardPaste size={13} /> <span>Paste Below</span>
            </button>
          )}
          <button type="button" onClick={() => { dispatch({ type: 'COPY_STYLES', payload: { styles: targetEl.styles } }); showToast(dispatch, 'info', 'Styles copied'); close(); }}>
            <Paintbrush size={13} /> <span>Copy Styles</span>
          </button>
          {state.copiedStyles && (
            <button type="button" onClick={() => { dispatch({ type: 'PASTE_STYLES', payload: { targetId: targetEl.id, targetType: 'element' } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Paste styles' } }); close(); }}>
              <Paintbrush size={13} /> <span>Paste Styles</span>
            </button>
          )}
          <div className="wb-cm-sep" />
          <button type="button" onClick={() => { dispatch({ type: 'DUPLICATE_ELEMENT', payload: { elementId: targetEl.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Duplicate' } }); close(); }}>
            <CopyPlus size={13} /> <span>Duplicate</span>
          </button>
          <button type="button" onClick={() => { dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: targetEl.id, direction: 'up' } }); close(); }}>
            <ArrowUp size={13} /> <span>Move Up</span>
          </button>
          <button type="button" onClick={() => { dispatch({ type: 'MOVE_ELEMENT', payload: { elementId: targetEl.id, direction: 'down' } }); close(); }}>
            <ArrowDown size={13} /> <span>Move Down</span>
          </button>
          <div className="wb-cm-sep" />
          <button type="button" onClick={() => { dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: targetEl.id, updates: { hidden: !targetEl.hidden } } }); close(); }}>
            {targetEl.hidden ? <Eye size={13} /> : <EyeOff size={13} />} <span>{targetEl.hidden ? 'Show Element' : 'Hide Element'}</span>
          </button>
          <button type="button" onClick={() => { dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: targetEl.id, updates: { locked: !targetEl.locked } } }); close(); }}>
            {targetEl.locked ? <Unlock size={13} /> : <Lock size={13} />} <span>{targetEl.locked ? 'Unlock' : 'Lock Element'}</span>
          </button>
          <div className="wb-cm-sep" />
          <button type="button" className="danger" onClick={() => { dispatch({ type: 'DELETE_ELEMENT', payload: { elementId: targetEl.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Delete element' } }); close(); }}>
            <Trash2 size={13} /> <span>Delete</span>
          </button>
        </>
      )}

      {menu.targetType === 'section' && targetSec && (
        <>
          <button type="button" onClick={() => { dispatch({ type: 'MOVE_SECTION', payload: { sectionId: targetSec.id, direction: 'up' } }); close(); }}>
            <ArrowUp size={13} /> <span>Move Section Up</span>
          </button>
          <button type="button" onClick={() => { dispatch({ type: 'MOVE_SECTION', payload: { sectionId: targetSec.id, direction: 'down' } }); close(); }}>
            <ArrowDown size={13} /> <span>Move Section Down</span>
          </button>
          <div className="wb-cm-sep" />
          <button type="button" onClick={() => { dispatch({ type: 'DUPLICATE_SECTION', payload: { sectionId: targetSec.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Duplicate section' } }); close(); }}>
            <CopyPlus size={13} /> <span>Duplicate Section</span>
          </button>
          <button type="button" onClick={() => { dispatch({ type: 'SAVE_BLOCK', payload: { section: targetSec } }); showToast(dispatch, 'success', `Saved "${targetSec.name}" to Sections > Saved`); close(); }}>
            <BookmarkPlus size={13} /> <span>Save as Reusable Block</span>
          </button>
          <button type="button" onClick={() => { dispatch({ type: 'COPY_STYLES', payload: { styles: targetSec.styles } }); showToast(dispatch, 'info', 'Section styles copied'); close(); }}>
            <Paintbrush size={13} /> <span>Copy Section Styles</span>
          </button>
          {state.copiedStyles && (
            <button type="button" onClick={() => { dispatch({ type: 'PASTE_STYLES', payload: { targetId: targetSec.id, targetType: 'section' } }); close(); }}>
              <Paintbrush size={13} /> <span>Paste Styles</span>
            </button>
          )}
          <div className="wb-cm-sep" />
          <button type="button" onClick={() => { dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: targetSec.id, updates: { hidden: !targetSec.hidden } } }); close(); }}>
            {targetSec.hidden ? <Eye size={13} /> : <EyeOff size={13} />} <span>{targetSec.hidden ? 'Show Section' : 'Hide Section'}</span>
          </button>
          <button type="button" className="danger" onClick={() => { dispatch({ type: 'DELETE_SECTION', payload: { sectionId: targetSec.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Delete section' } }); close(); }}>
            <Trash2 size={13} /> <span>Delete Section</span>
          </button>
        </>
      )}

      {menu.targetType !== 'element' && menu.targetType !== 'section' && (
        <button type="button" onClick={close}>
          <Layers size={13} /> <span>Close Menu</span>
        </button>
      )}
    </div>
  );
}
