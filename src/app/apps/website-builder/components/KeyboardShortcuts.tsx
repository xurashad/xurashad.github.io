'use client';
// ============================================================
// Website Builder Pro — Keyboard Shortcuts Modal
// ============================================================

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'Z'], desc: 'Undo' },
  { keys: ['Ctrl', 'Y'], desc: 'Redo' },
  { keys: ['Ctrl', 'S'], desc: 'Save project' },
  { keys: ['Ctrl', 'D'], desc: 'Duplicate element' },
  { keys: ['Delete'], desc: 'Delete element' },
  { keys: ['Escape'], desc: 'Deselect / Close' },
  { keys: ['↑'], desc: 'Move element up' },
  { keys: ['↓'], desc: 'Move element down' },
  { keys: ['Ctrl', 'C'], desc: 'Copy element' },
  { keys: ['Ctrl', 'V'], desc: 'Paste element' },
  { keys: ['1'], desc: 'Desktop viewport' },
  { keys: ['2'], desc: 'Tablet viewport' },
  { keys: ['3'], desc: 'Mobile viewport' },
  { keys: ['['], desc: 'Toggle left sidebar' },
  { keys: [']'], desc: 'Toggle right sidebar' },
  { keys: ['?'], desc: 'Show shortcuts' },
];

export default function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="wb-modal-overlay" onClick={onClose}>
      <div className="wb-modal wb-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button className="wb-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="wb-modal-body">
          <div className="wb-shortcuts-grid">
            {SHORTCUTS.map((shortcut, i) => (
              <div key={i} className="wb-shortcut-item">
                <div className="wb-shortcut-keys">
                  {shortcut.keys.map((key, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && <span className="wb-shortcut-plus">+</span>}
                      <kbd className="wb-kbd">{key}</kbd>
                    </React.Fragment>
                  ))}
                </div>
                <span className="wb-shortcut-desc">{shortcut.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
