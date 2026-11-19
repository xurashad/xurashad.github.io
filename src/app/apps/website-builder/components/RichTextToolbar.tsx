'use client';
// ============================================================
// Website Builder Pro — Inline Rich Text Formatting Toolbar
// ============================================================

import React, { useEffect, useState, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, Link2, RemoveFormatting, Code, Check } from 'lucide-react';
import type { BuilderState, BuilderAction } from '../lib/types';

interface RichTextToolbarProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

export default function RichTextToolbar({ state, dispatch, canvasRef }: RichTextToolbarProps) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [linkPrompt, setLinkPrompt] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    if (!state.editingElementId || !canvasRef.current) return;

    let rafId = 0;
    const measure = () => {
      const canvasEl = canvasRef.current;
      if (!canvasEl || !state.editingElementId) return;
      const targetEl = canvasEl.querySelector(`[data-builder-id="${state.editingElementId}"]`);
      if (!targetEl) return;
      const canvasRect = canvasEl.getBoundingClientRect();
      const rect = targetEl.getBoundingClientRect();
      setPos({
        top: Math.max(8, rect.top - canvasRect.top - 42),
        left: Math.max(8, Math.min(canvasRect.width - 310, rect.left - canvasRect.left)),
      });
    };

    rafId = requestAnimationFrame(measure);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [state.editingElementId, canvasRef]);

  if (!state.editingElementId || !pos) return null;

  const getEditableNode = () => {
    if (!state.editingElementId || !canvasRef.current) return null;
    return canvasRef.current.querySelector(
      `[data-builder-id="${state.editingElementId}"] [contenteditable="true"]`,
    ) as HTMLElement | null;
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
  };

  const escapeHtmlText = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const handleOpenLink = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
    setLinkPrompt(p => !p);
  };

  const applyLink = () => {
    const editEl = getEditableNode();
    editEl?.focus();
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedRangeRef.current);
    }
    const trimmed = linkUrl.trim();
    if (trimmed) {
      const href = /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
      exec('createLink', href);
    }
    setLinkPrompt(false);
  };

  const wrapInlineCode = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const text = escapeHtmlText(sel.toString());
    exec('insertHTML', `<code style="background:rgba(128,128,160,0.18);padding:0.1em 0.35em;border-radius:4px;font-family:monospace;">${text}</code>`);
  };

  const finishEditing = () => {
    const editEl = getEditableNode();
    if (editEl) {
      if (document.activeElement === editEl) {
        editEl.blur();
        return;
      }
      const nextContent = editEl.tagName === 'CODE' ? (editEl.textContent ?? '') : editEl.innerHTML;
      if (state.editingElementId) {
        dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: state.editingElementId, updates: { content: nextContent } } });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Edit inline text' } });
      }
    }
    setLinkPrompt(false);
    dispatch({ type: 'SET_EDITING', payload: { elementId: null } });
  };

  return (
    <div
      className="wb-richtext-toolbar"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button type="button" onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold size={14} /></button>
      <button type="button" onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic size={14} /></button>
      <button type="button" onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline size={14} /></button>
      <button type="button" onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough size={14} /></button>
      <div className="wb-ft-divider" />
      <button type="button" onClick={wrapInlineCode} title="Inline Code"><Code size={14} /></button>
      <button type="button" onClick={handleOpenLink} className={linkPrompt ? 'active' : ''} title="Insert Link"><Link2 size={14} /></button>
      <button type="button" onClick={() => exec('removeFormat')} title="Clear Formatting"><RemoveFormatting size={14} /></button>
      <div className="wb-ft-divider" />
      <button type="button" className="done" onClick={finishEditing} title="Done editing">
        <Check size={14} />
      </button>

      {linkPrompt && (
        <div className="wb-rt-link-pop" onMouseDown={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyLink();
              if (e.key === 'Escape') {
                setLinkPrompt(false);
                getEditableNode()?.focus();
              }
            }}
            autoFocus
          />
          <button type="button" onClick={applyLink}>Apply</button>
        </div>
      )}
    </div>
  );
}
