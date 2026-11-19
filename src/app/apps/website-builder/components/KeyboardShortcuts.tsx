'use client';
// ============================================================
// Website Builder Pro — Keyboard Shortcuts Modal
// ============================================================

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: 'General & Navigation',
    items: [
      { keys: ['Ctrl', 'K'], desc: 'Open Command Palette' },
      { keys: ['Ctrl', 'S'], desc: 'Save Project Now' },
      { keys: ['Ctrl', 'Z'], desc: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo (or Ctrl+Y)' },
      { keys: ['Ctrl', 'P'], desc: 'Live Preview Modal' },
      { keys: ['Ctrl', 'Shift', 'E'], desc: 'Export Production ZIP' },
      { keys: ['?'], desc: 'Toggle Shortcuts' },
      { keys: ['Esc'], desc: 'Deselect / Close Dialog' },
    ],
  },
  {
    title: 'Editing & Canvas',
    items: [
      { keys: ['Ctrl', 'C'], desc: 'Copy Selected Element' },
      { keys: ['Ctrl', 'V'], desc: 'Paste Element' },
      { keys: ['Ctrl', 'Alt', 'C'], desc: 'Copy Styles' },
      { keys: ['Ctrl', 'Alt', 'V'], desc: 'Paste Styles' },
      { keys: ['Ctrl', 'D'], desc: 'Duplicate Element / Section' },
      { keys: ['Delete'], desc: 'Delete Element / Section' },
      { keys: ['↑'], desc: 'Move Element / Section Up' },
      { keys: ['↓'], desc: 'Move Element / Section Down' },
    ],
  },
  {
    title: 'Workspace & Viewport',
    items: [
      { keys: ['1'], desc: 'Desktop Viewport (1440px)' },
      { keys: ['2'], desc: 'Tablet Viewport (768px)' },
      { keys: ['3'], desc: 'Mobile Viewport (375px)' },
      { keys: ['['], desc: 'Toggle Left Sidebar' },
      { keys: [']'], desc: 'Toggle Right Sidebar' },
      { keys: ['G'], desc: 'Toggle 12-Col Grid Overlay' },
      { keys: ['O'], desc: 'Toggle Wireframe Outlines' },
    ],
  },
];

export default function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal wb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button type="button" className="wb-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="wb-modal-body">
          <div className="wb-shortcuts-groups">
            {SHORTCUT_GROUPS.map(group => (
              <div key={group.title} className="wb-shortcuts-group">
                <h3>{group.title}</h3>
                <div className="wb-shortcuts-grid">
                  {group.items.map((shortcut, i) => (
                    <div key={i} className="wb-shortcut-item">
                      <span className="wb-shortcut-desc">{shortcut.desc}</span>
                      <div className="wb-shortcut-keys">
                        {shortcut.keys.map((key, j) => (
                          <React.Fragment key={j}>
                            {j > 0 && <span className="wb-shortcut-plus">+</span>}
                            <kbd className="wb-kbd">{key}</kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
