'use client';
// ============================================================
// Website Builder Pro — Structured Widget Property Editors
// ============================================================

import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type {
  FormField, AccordionItem, TabItem, SocialLinkItem, TableData,
} from '../lib/types';
import { uid } from '../lib/defaults';
import { StyleInput, SelectInput, ToggleRow, SectionTitle } from './VisualControls';

/* ========== Form Field Builder ========== */

export function FormBuilderEditor({
  fieldsJson,
  onChange,
}: {
  fieldsJson: string;
  onChange: (nextJson: string) => void;
}) {
  let fields: FormField[] = [];
  try { fields = JSON.parse(fieldsJson || '[]'); } catch { /* */ }

  const update = (next: FormField[]) => onChange(JSON.stringify(next));

  const addField = () => {
    const id = uid('fld');
    update([
      ...fields,
      { id, type: 'text', label: 'New Field', name: `field_${fields.length + 1}`, placeholder: 'Enter value...', required: false },
    ]);
  };

  const patchField = (idx: number, patch: Partial<FormField>) => {
    update(fields.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  const removeField = (idx: number) => {
    update(fields.filter((_, i) => i !== idx));
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[idx], next[target]] = [next[target], next[idx]];
    update(next);
  };

  return (
    <div className="wb-widget-editor">
      <div className="wb-we-header">
        <span>Form Fields ({fields.length})</span>
        <button type="button" className="wb-we-add" onClick={addField}>
          <Plus size={12} /> Add Field
        </button>
      </div>
      {fields.map((f, i) => (
        <div key={f.id} className="wb-we-card">
          <div className="wb-we-card-top">
            <span className="wb-we-badge">{f.type}</span>
            <div className="wb-we-card-btns">
              <button type="button" onClick={() => moveField(i, -1)} disabled={i === 0} title="Move up"><ArrowUp size={11} /></button>
              <button type="button" onClick={() => moveField(i, 1)} disabled={i === fields.length - 1} title="Move down"><ArrowDown size={11} /></button>
              <button type="button" className="danger" onClick={() => removeField(i)} title="Remove"><Trash2 size={11} /></button>
            </div>
          </div>
          <div className="wb-input-row">
            <StyleInput label="Label" value={f.label} onChange={(v) => patchField(i, { label: v, name: v.toLowerCase().replace(/[^a-z0-9]+/g, '_') || f.name })} />
            <SelectInput
              label="Type"
              value={f.type}
              onChange={(v) => patchField(i, { type: v as FormField['type'] })}
              options={[
                { value: 'text', label: 'Text' },
                { value: 'email', label: 'Email' },
                { value: 'tel', label: 'Phone' },
                { value: 'textarea', label: 'Textarea' },
                { value: 'select', label: 'Dropdown' },
                { value: 'checkbox', label: 'Checkbox' },
                { value: 'date', label: 'Date' },
              ]}
            />
          </div>
          {f.type !== 'checkbox' && f.type !== 'select' && (
            <StyleInput label="Placeholder" value={f.placeholder ?? ''} onChange={(v) => patchField(i, { placeholder: v })} />
          )}
          {f.type === 'select' && (
            <StyleInput
              label="Options (comma-separated)"
              value={(f.options ?? ['Option 1', 'Option 2']).join(', ')}
              onChange={(v) => patchField(i, { options: v.split(',').map(s => s.trim()).filter(Boolean) })}
            />
          )}
          <ToggleRow label="Required" checked={Boolean(f.required)} onChange={(c) => patchField(i, { required: c })} />
        </div>
      ))}
    </div>
  );
}

/* ========== Accordion Items Editor ========== */

export function AccordionEditor({
  itemsJson,
  onChange,
}: {
  itemsJson: string;
  onChange: (nextJson: string) => void;
}) {
  let items: AccordionItem[] = [];
  try { items = JSON.parse(itemsJson || '[]'); } catch { /* */ }

  const update = (next: AccordionItem[]) => onChange(JSON.stringify(next));

  return (
    <div className="wb-widget-editor">
      <div className="wb-we-header">
        <span>Accordion Items ({items.length})</span>
        <button
          type="button"
          className="wb-we-add"
          onClick={() => update([...items, { id: uid('acc'), title: 'New Question', content: 'Detailed answer goes here.', openByDefault: false }])}
        >
          <Plus size={12} /> Add Item
        </button>
      </div>
      {items.map((item, i) => (
        <div key={item.id || i} className="wb-we-card">
          <div className="wb-we-card-top">
            <span className="wb-we-badge">Item {i + 1}</span>
            <button type="button" className="danger" onClick={() => update(items.filter((_, idx) => idx !== i))} title="Remove">
              <Trash2 size={11} />
            </button>
          </div>
          <StyleInput label="Title / Question" value={item.title} onChange={(v) => update(items.map((it, idx) => (idx === i ? { ...it, title: v } : it)))} />
          <div className="wb-style-input">
            <label>Content</label>
            <textarea
              className="wb-mini-textarea"
              rows={2}
              value={item.content}
              onChange={(e) => update(items.map((it, idx) => (idx === i ? { ...it, content: e.target.value } : it)))}
            />
          </div>
          <ToggleRow
            label="Open by default"
            checked={Boolean(item.openByDefault)}
            onChange={(c) => update(items.map((it, idx) => (idx === i ? { ...it, openByDefault: c } : it)))}
          />
        </div>
      ))}
    </div>
  );
}

/* ========== Tabs Editor ========== */

export function TabsEditor({
  itemsJson,
  onChange,
}: {
  itemsJson: string;
  onChange: (nextJson: string) => void;
}) {
  let items: TabItem[] = [];
  try { items = JSON.parse(itemsJson || '[]'); } catch { /* */ }

  const update = (next: TabItem[]) => onChange(JSON.stringify(next));

  return (
    <div className="wb-widget-editor">
      <div className="wb-we-header">
        <span>Tabs ({items.length})</span>
        <button
          type="button"
          className="wb-we-add"
          onClick={() => update([...items, { id: uid('tab'), label: `Tab ${items.length + 1}`, content: 'Tab panel content.' }])}
        >
          <Plus size={12} /> Add Tab
        </button>
      </div>
      {items.map((tab, i) => (
        <div key={tab.id || i} className="wb-we-card">
          <div className="wb-we-card-top">
            <span className="wb-we-badge">Tab {i + 1}</span>
            {items.length > 1 && (
              <button type="button" className="danger" onClick={() => update(items.filter((_, idx) => idx !== i))} title="Remove">
                <Trash2 size={11} />
              </button>
            )}
          </div>
          <StyleInput label="Tab Label" value={tab.label} onChange={(v) => update(items.map((t, idx) => (idx === i ? { ...t, label: v } : t)))} />
          <div className="wb-style-input">
            <label>Panel Content</label>
            <textarea
              className="wb-mini-textarea"
              rows={2}
              value={tab.content}
              onChange={(e) => update(items.map((t, idx) => (idx === i ? { ...t, content: e.target.value } : t)))}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========== Table Editor ========== */

export function TableEditor({
  tableJson,
  onChange,
}: {
  tableJson: string;
  onChange: (nextJson: string) => void;
}) {
  let data: TableData = { headers: ['Col 1', 'Col 2'], rows: [['A', 'B']], striped: true };
  try { data = JSON.parse(tableJson || '{}'); } catch { /* */ }

  const headers = data.headers ?? [];
  const rows = data.rows ?? [];

  const update = (next: TableData) => onChange(JSON.stringify(next));

  const addCol = () => {
    update({
      ...data,
      headers: [...headers, `Col ${headers.length + 1}`],
      rows: rows.map(r => [...r, '–']),
    });
  };

  const removeCol = (ci: number) => {
    if (headers.length <= 1) return;
    update({
      ...data,
      headers: headers.filter((_, i) => i !== ci),
      rows: rows.map(r => r.filter((_, i) => i !== ci)),
    });
  };

  const addRow = () => {
    update({
      ...data,
      rows: [...rows, headers.map(() => 'Value')],
    });
  };

  const removeRow = (ri: number) => {
    update({ ...data, rows: rows.filter((_, i) => i !== ri) });
  };

  return (
    <div className="wb-widget-editor">
      <div className="wb-we-header">
        <span>Table ({headers.length}×{rows.length})</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" className="wb-we-add" onClick={addCol}>+ Col</button>
          <button type="button" className="wb-we-add" onClick={addRow}>+ Row</button>
        </div>
      </div>

      <ToggleRow label="Striped Rows" checked={data.striped !== false} onChange={(c) => update({ ...data, striped: c })} />

      <SectionTitle title="Headers" />
      <div className="wb-table-edit-row">
        {headers.map((h, ci) => (
          <div key={ci} className="wb-table-edit-cell">
            <input
              value={h}
              onChange={(e) => update({ ...data, headers: headers.map((old, i) => (i === ci ? e.target.value : old)) })}
            />
            {headers.length > 1 && (
              <button type="button" onClick={() => removeCol(ci)} title="Delete column">×</button>
            )}
          </div>
        ))}
      </div>

      <SectionTitle title="Rows" />
      {rows.map((row, ri) => (
        <div key={ri} className="wb-table-edit-row">
          {row.map((cell, ci) => (
            <input
              key={ci}
              value={cell}
              onChange={(e) => update({
                ...data,
                rows: rows.map((r, rIdx) => (rIdx === ri ? r.map((c, cIdx) => (cIdx === ci ? e.target.value : c)) : r)),
              })}
            />
          ))}
          <button type="button" className="wb-table-del-row" onClick={() => removeRow(ri)} title="Remove row">
            <Trash2 size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ========== Social Links Editor ========== */

const SOCIAL_PLATFORMS = [
  { platform: 'X / Twitter', icon: 'fab fa-x-twitter' },
  { platform: 'GitHub', icon: 'fab fa-github' },
  { platform: 'LinkedIn', icon: 'fab fa-linkedin-in' },
  { platform: 'Instagram', icon: 'fab fa-instagram' },
  { platform: 'YouTube', icon: 'fab fa-youtube' },
  { platform: 'Discord', icon: 'fab fa-discord' },
  { platform: 'Dribbble', icon: 'fab fa-dribbble' },
];

export function SocialLinksEditor({
  linksJson,
  onChange,
}: {
  linksJson: string;
  onChange: (nextJson: string) => void;
}) {
  let links: SocialLinkItem[] = [];
  try { links = JSON.parse(linksJson || '[]'); } catch { /* */ }

  const update = (next: SocialLinkItem[]) => onChange(JSON.stringify(next));

  return (
    <div className="wb-widget-editor">
      <div className="wb-we-header">
        <span>Social Links ({links.length})</span>
        <button
          type="button"
          className="wb-we-add"
          onClick={() => update([...links, { platform: 'YouTube', url: 'https://youtube.com', icon: 'fab fa-youtube' }])}
        >
          <Plus size={12} /> Add
        </button>
      </div>
      {links.map((item, i) => (
        <div key={i} className="wb-we-card">
          <div className="wb-we-card-top">
            <span className="wb-we-badge"><i className={item.icon} /> {item.platform}</span>
            <button type="button" className="danger" onClick={() => update(links.filter((_, idx) => idx !== i))} title="Remove">
              <Trash2 size={11} />
            </button>
          </div>
          <SelectInput
            label="Platform"
            value={item.platform}
            onChange={(val) => {
              const found = SOCIAL_PLATFORMS.find(p => p.platform === val);
              update(links.map((l, idx) => (idx === i ? { ...l, platform: val, icon: found?.icon ?? l.icon } : l)));
            }}
            options={SOCIAL_PLATFORMS.map(p => ({ value: p.platform, label: p.platform }))}
          />
          <StyleInput
            label="Profile URL"
            value={item.url}
            onChange={(v) => update(links.map((l, idx) => (idx === i ? { ...l, url: v } : l)))}
            placeholder="https://..."
          />
        </div>
      ))}
    </div>
  );
}
