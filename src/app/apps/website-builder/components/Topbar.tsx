'use client';
// ============================================================
// Website Builder Pro — Top Bar
// ============================================================

import React, { useState, useCallback } from 'react';
import { Monitor, Tablet, Smartphone, Undo2, Redo2, Eye, Download, Keyboard, Settings, Sun, Moon } from 'lucide-react';
import type { BuilderState, BuilderAction, ViewportMode } from '../lib/types';

interface TopbarProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  onExport: () => void;
  onPreview: () => void;
}

export default function Topbar({ state, dispatch, onExport, onPreview }: TopbarProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(state.project.name);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  const handleNameSubmit = useCallback(() => {
    setEditingName(false);
    if (nameValue.trim()) {
      dispatch({ type: 'SET_PROJECT_NAME', payload: { name: nameValue.trim() } });
    } else {
      setNameValue(state.project.name);
    }
  }, [nameValue, dispatch, state.project.name]);

  const setViewport = useCallback((mode: ViewportMode) => {
    dispatch({ type: 'SET_VIEWPORT', payload: { mode } });
  }, [dispatch]);

  const viewportButtons: { mode: ViewportMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'desktop', icon: <Monitor size={16} />, label: 'Desktop' },
    { mode: 'tablet', icon: <Tablet size={16} />, label: 'Tablet' },
    { mode: 'mobile', icon: <Smartphone size={16} />, label: 'Mobile' },
  ];

  return (
    <div className="wb-topbar">
      {/* Left: Logo + Project Name */}
      <div className="wb-topbar-left">
        <div className="wb-topbar-logo">
          <span className="wb-logo-icon">◆</span>
          <span className="wb-logo-text">WebBuilder</span>
        </div>
        <div className="wb-topbar-divider" />
        {editingName ? (
          <input
            className="wb-topbar-name-input"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); if (e.key === 'Escape') { setEditingName(false); setNameValue(state.project.name); } }}
            autoFocus
          />
        ) : (
          <button className="wb-topbar-name" onClick={() => { setEditingName(true); setNameValue(state.project.name); }}>
            {state.project.name}
          </button>
        )}
      </div>

      {/* Center: Viewport + Theme Toggle */}
      <div className="wb-topbar-center">
        <div className="wb-viewport-group">
          {viewportButtons.map(({ mode, icon, label }) => (
            <button
              key={mode}
              className={`wb-viewport-btn ${state.viewportMode === mode ? 'active' : ''}`}
              onClick={() => setViewport(mode)}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>
        <div className="wb-topbar-divider" />
        <button
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'TOGGLE_CANVAS_THEME' })}
          title={`Switch to ${state.canvasThemeMode === 'light' ? 'dark' : 'light'} mode`}
        >
          {state.canvasThemeMode === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      {/* Right: Actions */}
      <div className="wb-topbar-right">
        <button
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={16} />
        </button>
        <button
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={16} />
        </button>
        <div className="wb-topbar-divider" />
        <button className="wb-topbar-btn" onClick={onPreview} title="Preview (Ctrl+P)">
          <Eye size={16} />
          <span className="wb-btn-label">Preview</span>
        </button>
        <button className="wb-topbar-btn primary" onClick={onExport} title="Export (Ctrl+Shift+E)">
          <Download size={16} />
          <span className="wb-btn-label">Export</span>
        </button>
        <div className="wb-topbar-divider" />
        <button
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'SHOW_KEYBOARD_SHORTCUTS', payload: { show: true } })}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard size={16} />
        </button>
        <button
          className="wb-topbar-btn"
          onClick={() => dispatch({ type: 'SHOW_PROJECT_MANAGER', payload: { show: true } })}
          title="Project Manager"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
