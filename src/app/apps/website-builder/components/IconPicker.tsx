'use client';
// ============================================================
// Website Builder Pro — Visual FontAwesome Icon Picker
// ============================================================

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { ICON_CATALOG } from '../lib/defaults';

interface IconPickerProps {
  label?: string;
  value: string;
  onChange: (cls: string) => void;
}

export default function IconPicker({ label = 'Icon', value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_CATALOG;
    return ICON_CATALOG.map(cat => ({
      ...cat,
      icons: cat.icons.filter(
        ic => ic.label.toLowerCase().includes(q) || ic.cls.toLowerCase().includes(q),
      ),
    })).filter(cat => cat.icons.length > 0);
  }, [query]);

  return (
    <div className="wb-icon-picker">
      {label && <label className="wb-ip-label">{label}</label>}
      <div className="wb-ip-trigger-row">
        <button
          type="button"
          className="wb-ip-preview-btn"
          onClick={() => setOpen(o => !o)}
          title="Browse icons"
        >
          <span className="wb-ip-preview-icon">
            <i className={value || 'fas fa-star'} />
          </span>
          <span className="wb-ip-preview-text">{value || 'Choose icon...'}</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>
      <input
        type="text"
        className="wb-ip-raw"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="fas fa-star"
      />

      {open && (
        <div className="wb-ip-drawer">
          <div className="wb-ip-search">
            <Search size={12} />
            <input
              type="text"
              placeholder="Search icons..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className="wb-ip-catalog">
            {filtered.map(cat => (
              <div key={cat.category} className="wb-ip-cat">
                <div className="wb-ip-cat-title">{cat.category}</div>
                <div className="wb-ip-grid">
                  {cat.icons.map(ic => (
                    <button
                      key={ic.cls}
                      type="button"
                      className={`wb-ip-cell ${value === ic.cls ? 'active' : ''}`}
                      onClick={() => {
                        onChange(ic.cls);
                        setOpen(false);
                      }}
                      title={`${ic.label} (${ic.cls})`}
                    >
                      <i className={ic.cls} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="wb-ip-empty">No matching icons</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
