'use client';
// ============================================================
// Website Builder Pro — Visual Inspector Controls
// ============================================================

import React, { useState } from 'react';
import { Link2, Unlink2 } from 'lucide-react';
import { GRADIENT_PRESETS } from '../lib/defaults';
import type { ElementStyles } from '../lib/types';

export function SectionTitle({ title }: { title: string }) {
  return <div className="wb-section-title">{title}</div>;
}

export function StyleInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="wb-style-input">
      {label && <label>{label}</label>}
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

export function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="wb-style-input">
      {label && <label>{label}</label>}
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {options.map(o => (
          <option key={`${o.value}-${o.label}`} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="wb-toggle-row">
      <label>{label}</label>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}

export function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="wb-segmented">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`wb-segmented-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Safe Color Input with Theme Swatches ---------- */

function toPickerHex(value: string): string {
  const trimmed = (value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return '#6366f1';
}

const SWATCH_TOKENS: { label: string; value: string; preview: string }[] = [
  { label: 'Accent', value: 'var(--site-accent)', preview: 'var(--wb-accent)' },
  { label: 'BG', value: 'var(--site-bg)', preview: '#ffffff' },
  { label: 'Surface', value: 'var(--site-surface)', preview: '#e2e8f0' },
  { label: 'Text', value: 'var(--site-text)', preview: '#1e293b' },
  { label: 'Border', value: 'var(--site-border)', preview: '#94a3b8' },
  { label: 'Clear', value: 'transparent', preview: 'repeating-conic-gradient(#555 0% 25%, #222 0% 50%) 50% / 8px 8px' },
];

export function ThemeColorInput({
  label,
  value,
  onChange,
  showTokens = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  showTokens?: boolean;
}) {
  return (
    <div className="wb-color-input">
      <div className="wb-color-header">
        <label>{label}</label>
        {value && (
          <button type="button" className="wb-mini-clear" onClick={() => onChange('')}>
            Reset
          </button>
        )}
      </div>
      <div className="wb-color-row">
        <input
          type="color"
          value={toPickerHex(value)}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="inherit / #hex / var(--...)"
        />
      </div>
      {showTokens && (
        <div className="wb-color-swatches">
          {SWATCH_TOKENS.map(sw => (
            <button
              key={sw.label}
              type="button"
              className={`wb-color-swatch ${value === sw.value ? 'active' : ''}`}
              onClick={() => onChange(sw.value)}
              title={`${sw.label} (${sw.value})`}
              style={{ background: sw.preview }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Unit Slider Input ---------- */

const UNITS = ['px', 'rem', '%', 'em', 'vh'] as const;

export function UnitSliderInput({
  label,
  value,
  onChange,
  min = 0,
  max = 120,
  step = 1,
  defaultUnit = 'px',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultUnit?: string;
}) {
  const match = (value || '').trim().match(/^(-?\d*\.?\d+)\s*(px|rem|%|em|vh|vw)?$/);
  const numVal = match ? parseFloat(match[1]) : 0;
  const unit = match?.[2] || defaultUnit;

  const isRel = unit === 'rem' || unit === 'em';
  const sliderMin = isRel ? (min > 0 ? 0.5 : 0) : min;
  const sliderMax = isRel ? Math.min(max, 10) : unit === '%' ? 100 : max;
  const sliderStep = isRel ? 0.125 : step;

  const emit = (n: string | number, u: string) => {
    if (n === '' || Number.isNaN(Number(n))) {
      onChange('');
      return;
    }
    onChange(`${n}${u}`);
  };

  return (
    <div className="wb-unit-slider">
      <div className="wb-unit-slider-head">
        <label>{label}</label>
        <div className="wb-unit-combo">
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`0${defaultUnit}`}
          />
          <select
            value={UNITS.includes(unit as (typeof UNITS)[number]) ? unit : defaultUnit}
            onChange={(e) => emit(match ? numVal : 0, e.target.value)}
            aria-label={`${label} unit`}
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <input
        type="range"
        min={sliderMin}
        max={sliderMax}
        step={sliderStep}
        value={Math.max(sliderMin, Math.min(sliderMax, numVal))}
        onChange={(e) => emit(e.target.value, unit)}
      />
    </div>
  );
}

/* ---------- Visual Box Model Editor (Margin & Padding) ---------- */

const SPACING_PRESETS = ['0', '0.5rem', '1rem', '2rem', '4rem'];

export function BoxModelControl({
  styles,
  onChange,
}: {
  styles: ElementStyles;
  onChange: (patch: Partial<ElementStyles>) => void;
}) {
  const [linkMargin, setLinkMargin] = useState(false);
  const [linkPadding, setLinkPadding] = useState(false);

  const updateMargin = (side: 'Top' | 'Right' | 'Bottom' | 'Left', val: string) => {
    if (linkMargin) {
      onChange({ marginTop: val, marginRight: val, marginBottom: val, marginLeft: val });
    } else {
      onChange({ [`margin${side}`]: val } as Partial<ElementStyles>);
    }
  };

  const updatePadding = (side: 'Top' | 'Right' | 'Bottom' | 'Left', val: string) => {
    if (linkPadding) {
      onChange({ paddingTop: val, paddingRight: val, paddingBottom: val, paddingLeft: val });
    } else {
      onChange({ [`padding${side}`]: val } as Partial<ElementStyles>);
    }
  };

  return (
    <div className="wb-boxmodel">
      <div className="wb-boxmodel-margin">
        <div className="wb-boxmodel-label-row">
          <span>MARGIN</span>
          <button
            type="button"
            className={`wb-link-toggle ${linkMargin ? 'active' : ''}`}
            onClick={() => setLinkMargin(v => !v)}
            title="Link all margin sides"
          >
            {linkMargin ? <Link2 size={11} /> : <Unlink2 size={11} />}
          </button>
        </div>
        <input className="wb-bm-top" value={styles.marginTop ?? ''} onChange={(e) => updateMargin('Top', e.target.value)} placeholder="0" aria-label="Margin top" />
        <input className="wb-bm-right" value={styles.marginRight ?? ''} onChange={(e) => updateMargin('Right', e.target.value)} placeholder="0" aria-label="Margin right" />
        <input className="wb-bm-bottom" value={styles.marginBottom ?? ''} onChange={(e) => updateMargin('Bottom', e.target.value)} placeholder="0" aria-label="Margin bottom" />
        <input className="wb-bm-left" value={styles.marginLeft ?? ''} onChange={(e) => updateMargin('Left', e.target.value)} placeholder="0" aria-label="Margin left" />

        <div className="wb-boxmodel-padding">
          <div className="wb-boxmodel-label-row">
            <span>PADDING</span>
            <button
              type="button"
              className={`wb-link-toggle ${linkPadding ? 'active' : ''}`}
              onClick={() => setLinkPadding(v => !v)}
              title="Link all padding sides"
            >
              {linkPadding ? <Link2 size={11} /> : <Unlink2 size={11} />}
            </button>
          </div>
          <input className="wb-bm-top" value={styles.paddingTop ?? ''} onChange={(e) => updatePadding('Top', e.target.value)} placeholder="0" aria-label="Padding top" />
          <input className="wb-bm-right" value={styles.paddingRight ?? ''} onChange={(e) => updatePadding('Right', e.target.value)} placeholder="0" aria-label="Padding right" />
          <input className="wb-bm-bottom" value={styles.paddingBottom ?? ''} onChange={(e) => updatePadding('Bottom', e.target.value)} placeholder="0" aria-label="Padding bottom" />
          <input className="wb-bm-left" value={styles.paddingLeft ?? ''} onChange={(e) => updatePadding('Left', e.target.value)} placeholder="0" aria-label="Padding left" />
          <div className="wb-boxmodel-core">Content</div>
        </div>
      </div>

      <div className="wb-spacing-presets">
        <span className="wb-sp-title">Pad all:</span>
        {SPACING_PRESETS.map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onChange({ paddingTop: p, paddingRight: p, paddingBottom: p, paddingLeft: p })}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Gradient Builder ---------- */

export function GradientBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [angle, setAngle] = useState(135);
  const [fromColor, setFromColor] = useState('#6366f1');
  const [toColor, setToColor] = useState('#a855f7');

  const applyCustom = (a = angle, c1 = fromColor, c2 = toColor) => {
    onChange(`linear-gradient(${a}deg, ${c1} 0%, ${c2} 100%)`);
  };

  return (
    <div className="wb-gradient-builder">
      <div className="wb-gradient-swatches">
        {GRADIENT_PRESETS.filter(g => g.value).map(g => (
          <button
            key={g.name}
            type="button"
            className={`wb-grad-swatch ${value === g.value ? 'active' : ''}`}
            style={{ background: g.value }}
            onClick={() => onChange(g.value)}
            title={g.name}
          />
        ))}
        <button
          type="button"
          className={`wb-grad-swatch none ${!value ? 'active' : ''}`}
          onClick={() => onChange('')}
          title="Clear gradient"
        >
          ×
        </button>
      </div>

      <div className="wb-grad-custom">
        <div className="wb-grad-colors">
          <input
            type="color"
            value={fromColor}
            onChange={(e) => { setFromColor(e.target.value); applyCustom(angle, e.target.value, toColor); }}
            title="Start color"
          />
          <span>→</span>
          <input
            type="color"
            value={toColor}
            onChange={(e) => { setToColor(e.target.value); applyCustom(angle, fromColor, e.target.value); }}
            title="End color"
          />
          <span className="wb-grad-deg">{angle}°</span>
          <input
            type="range"
            min={0}
            max={360}
            step={15}
            value={angle}
            onChange={(e) => {
              const deg = Number(e.target.value);
              setAngle(deg);
              applyCustom(deg, fromColor, toColor);
            }}
            aria-label="Gradient angle"
          />
        </div>
      </div>
    </div>
  );
}
