'use client';
// ============================================================
// Website Builder Pro — Command Palette (Ctrl+K)
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Component, FileText, Palette, Monitor, Tablet,
  Smartphone, Eye, Code2, ShieldCheck, Download, FolderKanban,
  Grid, BoxSelect, Sun, Moon,
} from 'lucide-react';
import type { BuilderState, BuilderAction } from '../lib/types';
import { ELEMENT_CATEGORIES, THEME_PRESETS, createElement, createSection } from '../lib/defaults';
import { SECTION_TEMPLATES } from '../lib/templates';
import { getFirstColumnId, getColumnForElement, getSelectedElement, showToast } from '../lib/reducer';

interface CommandPaletteModalProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  onExportZip: () => void;
}

interface CommandItem {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
}

export default function CommandPaletteModal({ state, dispatch, onExportZip }: CommandPaletteModalProps) {
  if (!state.showCommandPalette) return null;
  return <CommandPaletteInner state={state} dispatch={dispatch} onExportZip={onExportZip} />;
}

function CommandPaletteInner({ state, dispatch, onExportZip }: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const close = () => dispatch({ type: 'SHOW_COMMAND_PALETTE', payload: { show: false } });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    const insertTargetColumnId = (): string => {
      const selEl = getSelectedElement(state);
      if (selEl) {
        if (selEl.type === 'container') return selEl.id;
        const col = getColumnForElement(state, selEl.id);
        if (col) return col;
      }
      if (state.selection?.target === 'column') return state.selection.id;
      const first = getFirstColumnId(state);
      if (first) return first;
      const sec = createSection('Section');
      dispatch({ type: 'ADD_SECTION', payload: { section: sec } });
      return sec.rows[0].columns[0].id;
    };

    // Quick Actions
    list.push(
      { id: 'act-preview', group: 'Actions', label: 'Open Live Preview', hint: 'Ctrl+P', icon: <Eye size={14} />, run: () => dispatch({ type: 'SHOW_PREVIEW', payload: { show: true } }) },
      { id: 'act-code', group: 'Actions', label: 'Inspect HTML / CSS / JS Code', icon: <Code2 size={14} />, run: () => dispatch({ type: 'SHOW_CODE_MODAL', payload: { show: true } }) },
      { id: 'act-audit', group: 'Actions', label: 'Run Site SEO & Accessibility Audit', icon: <ShieldCheck size={14} />, run: () => dispatch({ type: 'SHOW_AUDIT_MODAL', payload: { show: true } }) },
      { id: 'act-export', group: 'Actions', label: 'Export Production ZIP', hint: 'Ctrl+Shift+E', icon: <Download size={14} />, run: onExportZip },
      { id: 'act-pm', group: 'Actions', label: 'Open Project Manager & Templates', icon: <FolderKanban size={14} />, run: () => dispatch({ type: 'SHOW_PROJECT_MANAGER', payload: { show: true } }) },
      { id: 'act-theme-mode', group: 'Canvas', label: `Switch Canvas to ${state.canvasThemeMode === 'light' ? 'Dark' : 'Light'} Mode`, icon: state.canvasThemeMode === 'light' ? <Moon size={14} /> : <Sun size={14} />, run: () => dispatch({ type: 'TOGGLE_CANVAS_THEME' }) },
      { id: 'act-grid', group: 'Canvas', label: 'Toggle 12-Column Grid Overlay', hint: 'G', icon: <Grid size={14} />, run: () => dispatch({ type: 'TOGGLE_GRID_OVERLAY' }) },
      { id: 'act-outlines', group: 'Canvas', label: 'Toggle Wireframe Outlines', hint: 'O', icon: <BoxSelect size={14} />, run: () => dispatch({ type: 'TOGGLE_OUTLINES' }) },
      { id: 'vp-desk', group: 'Viewport', label: 'Switch Viewport: Desktop (1440px)', hint: '1', icon: <Monitor size={14} />, run: () => dispatch({ type: 'SET_VIEWPORT', payload: { mode: 'desktop' } }) },
      { id: 'vp-tab', group: 'Viewport', label: 'Switch Viewport: Tablet (768px)', hint: '2', icon: <Tablet size={14} />, run: () => dispatch({ type: 'SET_VIEWPORT', payload: { mode: 'tablet' } }) },
      { id: 'vp-mob', group: 'Viewport', label: 'Switch Viewport: Mobile (375px)', hint: '3', icon: <Smartphone size={14} />, run: () => dispatch({ type: 'SET_VIEWPORT', payload: { mode: 'mobile' } }) },
    );

    // Elements
    for (const cat of ELEMENT_CATEGORIES) {
      for (const item of cat.items) {
        list.push({
          id: `el-${item.type}`,
          group: 'Insert Element',
          label: `Insert ${item.label}`,
          hint: cat.name,
          icon: <Plus size={14} />,
          run: () => {
            const selEl = getSelectedElement(state);
            const el = createElement(item.type);
            if (selEl?.type === 'container') {
              dispatch({ type: 'ADD_ELEMENT', payload: { containerId: selEl.id, element: el } });
            } else {
              const colId = insertTargetColumnId();
              dispatch({ type: 'ADD_ELEMENT', payload: { columnId: colId, element: el } });
            }
            dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
            dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${item.label}` } });
          },
        });
      }
    }

    // Sections
    for (const [key, tmpl] of Object.entries(SECTION_TEMPLATES)) {
      list.push({
        id: `sec-${key}`,
        group: 'Add Section',
        label: `Add Section: ${tmpl.name}`,
        hint: tmpl.category,
        icon: <Component size={14} />,
        run: () => {
          const sec = tmpl.create();
          dispatch({ type: 'ADD_SECTION', payload: { section: sec } });
          dispatch({ type: 'SELECT', payload: { id: sec.id, target: 'section' } });
          dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${tmpl.name}` } });
        },
      });
    }

    // Pages
    for (const pid of state.project.pageOrder) {
      const p = state.project.pages[pid];
      if (!p) continue;
      list.push({
        id: `page-${p.id}`,
        group: 'Switch Page',
        label: `Go to Page: ${p.title}`,
        hint: `/${p.slug}`,
        icon: <FileText size={14} />,
        run: () => dispatch({ type: 'SET_CURRENT_PAGE', payload: { pageId: p.id } }),
      });
    }

    // Theme Presets
    for (const preset of THEME_PRESETS) {
      list.push({
        id: `theme-${preset.id}`,
        group: 'Theme Preset',
        label: `Apply Theme: ${preset.name}`,
        hint: preset.defaultMode,
        icon: <Palette size={14} />,
        run: () => {
          dispatch({ type: 'APPLY_THEME_PRESET', payload: { preset } });
          dispatch({ type: 'SAVE_HISTORY', payload: { label: `Theme ${preset.name}` } });
          showToast(dispatch, 'success', `Applied "${preset.name}" theme`);
        },
      });
    }

    return list;
  }, [state, dispatch, onExportZip]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 20);
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q) ||
      (c.hint?.toLowerCase().includes(q) ?? false),
    ).slice(0, 24);
  }, [commands, query]);

  const clampedIdx = Math.min(activeIdx, Math.max(0, filtered.length - 1));

  const execute = (item: CommandItem) => {
    close();
    item.run();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter' && filtered[clampedIdx]) {
      e.preventDefault();
      execute(filtered[clampedIdx]);
    }
  };

  return (
    <div className="wb-modal-overlay" onClick={close}>
      <div className="wb-cmd-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="wb-cmd-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Type a command, element, section, page, or theme..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            autoFocus
          />
          <kbd className="wb-kbd">Esc</kbd>
        </div>

        <div className="wb-cmd-list">
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              className={`wb-cmd-item ${idx === clampedIdx ? 'active' : ''}`}
              onMouseEnter={() => setActiveIdx(idx)}
              onClick={() => execute(item)}
            >
              <span className="wb-cmd-icon">{item.icon}</span>
              <span className="wb-cmd-label">{item.label}</span>
              <span className="wb-cmd-group">{item.hint || item.group}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="wb-cmd-empty">No commands match &ldquo;{query}&rdquo;</div>
          )}
        </div>
      </div>
    </div>
  );
}
