'use client';
// ============================================================
// Website Builder Pro — Right Sidebar (Property Editor)
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import { Box, Paintbrush, Sparkles, Settings, Image, Palette, Upload, Trash2, X } from 'lucide-react';
import type { BuilderState, BuilderAction, RightSidebarTab, ElementNode, ElementStyles } from '../lib/types';
import { FONT_LIST, GRADIENT_PRESETS, SHADOW_PRESETS } from '../lib/defaults';
import { getSelectedElement } from '../lib/reducer';

interface RightSidebarProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

export default function RightSidebar({ state, dispatch }: RightSidebarProps) {
  if (!state.rightSidebarOpen) return null;

  const selectedElement = useMemo(() => getSelectedElement(state), [state]);
  const tabs: { key: RightSidebarTab; icon: React.ReactNode; label: string }[] = [
    { key: 'layout', icon: <Box size={16} />, label: 'Layout' },
    { key: 'style', icon: <Paintbrush size={16} />, label: 'Style' },
    { key: 'effects', icon: <Sparkles size={16} />, label: 'Effects' },
    { key: 'settings', icon: <Settings size={16} />, label: 'Settings' },
    { key: 'assets', icon: <Image size={16} />, label: 'Assets' },
    { key: 'theme', icon: <Palette size={16} />, label: 'Theme' },
  ];

  return (
    <div className="wb-right-sidebar">
      <div className="wb-sidebar-tabs">
        {tabs.map(({ key, icon, label }) => (
          <button
            key={key}
            className={`wb-sidebar-tab ${state.rightSidebarTab === key ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: { tab: key } })}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>
      <div className="wb-sidebar-content">
        {state.rightSidebarTab === 'layout' && <LayoutTab element={selectedElement} dispatch={dispatch} />}
        {state.rightSidebarTab === 'style' && <StyleTab element={selectedElement} dispatch={dispatch} />}
        {state.rightSidebarTab === 'effects' && <EffectsTab element={selectedElement} dispatch={dispatch} />}
        {state.rightSidebarTab === 'settings' && <SettingsTab element={selectedElement} state={state} dispatch={dispatch} />}
        {state.rightSidebarTab === 'assets' && <AssetsTab state={state} dispatch={dispatch} />}
        {state.rightSidebarTab === 'theme' && <ThemeTab state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}

/* ========== Shared Helpers ========== */

function NoSelection() {
  return <div className="wb-no-selection"><p>Select an element to edit its properties</p></div>;
}

function StyleInput({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="wb-style-input">
      <label>{label}</label>
      <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="wb-color-input">
      <label>{label}</label>
      <div className="wb-color-row">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
      </div>
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="wb-style-input">
      <label>{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="wb-section-title">{title}</div>;
}

/* ========== Layout Tab ========== */

function LayoutTab({ element, dispatch }: { element: ElementNode | null; dispatch: React.Dispatch<BuilderAction> }) {
  if (!element) return <NoSelection />;

  const updateStyle = (styles: Partial<ElementStyles>) => {
    dispatch({ type: 'UPDATE_ELEMENT_STYLES', payload: { elementId: element.id, styles } });
  };

  const s = element.styles;

  return (
    <div className="wb-tab-content">
      <SectionTitle title="Sizing" />
      <div className="wb-input-row">
        <StyleInput label="Width" value={s.width ?? ''} onChange={(v) => updateStyle({ width: v })} placeholder="auto" />
        <StyleInput label="Height" value={s.height ?? ''} onChange={(v) => updateStyle({ height: v })} placeholder="auto" />
      </div>
      <div className="wb-input-row">
        <StyleInput label="Max Width" value={s.maxWidth ?? ''} onChange={(v) => updateStyle({ maxWidth: v })} placeholder="none" />
        <StyleInput label="Min Height" value={s.minHeight ?? ''} onChange={(v) => updateStyle({ minHeight: v })} placeholder="0" />
      </div>

      <SectionTitle title="Padding" />
      <div className="wb-spacing-grid">
        <StyleInput label="Top" value={s.paddingTop ?? ''} onChange={(v) => updateStyle({ paddingTop: v })} placeholder="0" />
        <StyleInput label="Right" value={s.paddingRight ?? ''} onChange={(v) => updateStyle({ paddingRight: v })} placeholder="0" />
        <StyleInput label="Bottom" value={s.paddingBottom ?? ''} onChange={(v) => updateStyle({ paddingBottom: v })} placeholder="0" />
        <StyleInput label="Left" value={s.paddingLeft ?? ''} onChange={(v) => updateStyle({ paddingLeft: v })} placeholder="0" />
      </div>

      <SectionTitle title="Margin" />
      <div className="wb-spacing-grid">
        <StyleInput label="Top" value={s.marginTop ?? ''} onChange={(v) => updateStyle({ marginTop: v })} placeholder="0" />
        <StyleInput label="Right" value={s.marginRight ?? ''} onChange={(v) => updateStyle({ marginRight: v })} placeholder="0" />
        <StyleInput label="Bottom" value={s.marginBottom ?? ''} onChange={(v) => updateStyle({ marginBottom: v })} placeholder="0" />
        <StyleInput label="Left" value={s.marginLeft ?? ''} onChange={(v) => updateStyle({ marginLeft: v })} placeholder="0" />
      </div>

      <SectionTitle title="Display" />
      <SelectInput label="Display" value={s.display ?? ''} onChange={(v) => updateStyle({ display: v })} options={[
        { value: '', label: 'Default' }, { value: 'block', label: 'Block' }, { value: 'flex', label: 'Flex' },
        { value: 'grid', label: 'Grid' }, { value: 'inline-block', label: 'Inline Block' }, { value: 'none', label: 'None' },
      ]} />
      {s.display === 'flex' && (
        <>
          <SelectInput label="Direction" value={s.flexDirection ?? ''} onChange={(v) => updateStyle({ flexDirection: v })} options={[
            { value: 'row', label: 'Row' }, { value: 'column', label: 'Column' },
          ]} />
          <SelectInput label="Justify" value={s.justifyContent ?? ''} onChange={(v) => updateStyle({ justifyContent: v })} options={[
            { value: '', label: 'Default' }, { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' },
            { value: 'flex-end', label: 'End' }, { value: 'space-between', label: 'Between' }, { value: 'space-around', label: 'Around' },
          ]} />
          <SelectInput label="Align" value={s.alignItems ?? ''} onChange={(v) => updateStyle({ alignItems: v })} options={[
            { value: '', label: 'Default' }, { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' },
            { value: 'flex-end', label: 'End' }, { value: 'stretch', label: 'Stretch' },
          ]} />
          <StyleInput label="Gap" value={s.gap ?? ''} onChange={(v) => updateStyle({ gap: v })} placeholder="0" />
        </>
      )}
      <SelectInput label="Overflow" value={s.overflow ?? ''} onChange={(v) => updateStyle({ overflow: v })} options={[
        { value: '', label: 'Default' }, { value: 'hidden', label: 'Hidden' }, { value: 'auto', label: 'Auto' }, { value: 'scroll', label: 'Scroll' },
      ]} />
    </div>
  );
}

/* ========== Style Tab ========== */

function StyleTab({ element, dispatch }: { element: ElementNode | null; dispatch: React.Dispatch<BuilderAction> }) {
  if (!element) return <NoSelection />;

  const updateStyle = (styles: Partial<ElementStyles>) => {
    dispatch({ type: 'UPDATE_ELEMENT_STYLES', payload: { elementId: element.id, styles } });
  };

  const s = element.styles;
  const textTypes = ['heading', 'paragraph', 'button', 'link', 'list', 'blockquote', 'code'];
  const showTypography = textTypes.includes(element.type);

  return (
    <div className="wb-tab-content">
      {showTypography && (
        <>
          <SectionTitle title="Typography" />
          <SelectInput label="Font Family" value={s.fontFamily ?? ''} onChange={(v) => updateStyle({ fontFamily: v })} options={[
            { value: '', label: 'Inherit' },
            ...FONT_LIST.map(f => ({ value: f.family, label: f.name })),
          ]} />
          <div className="wb-input-row">
            <StyleInput label="Size" value={s.fontSize ?? ''} onChange={(v) => updateStyle({ fontSize: v })} placeholder="1rem" />
            <SelectInput label="Weight" value={s.fontWeight ?? ''} onChange={(v) => updateStyle({ fontWeight: v })} options={[
              { value: '', label: 'Default' }, { value: '300', label: 'Light' }, { value: '400', label: 'Regular' },
              { value: '500', label: 'Medium' }, { value: '600', label: 'Semibold' }, { value: '700', label: 'Bold' },
              { value: '800', label: 'Extra Bold' }, { value: '900', label: 'Black' },
            ]} />
          </div>
          <div className="wb-input-row">
            <StyleInput label="Line Height" value={s.lineHeight ?? ''} onChange={(v) => updateStyle({ lineHeight: v })} placeholder="1.6" />
            <StyleInput label="Letter Spacing" value={s.letterSpacing ?? ''} onChange={(v) => updateStyle({ letterSpacing: v })} placeholder="normal" />
          </div>
          <div className="wb-align-group">
            {['left', 'center', 'right', 'justify'].map(align => (
              <button key={align} className={`wb-align-btn ${s.textAlign === align ? 'active' : ''}`} onClick={() => updateStyle({ textAlign: align })} title={`Align ${align}`}>
                {align === 'left' ? '⫷' : align === 'center' ? '☰' : align === 'right' ? '⫸' : '⚌'}
              </button>
            ))}
          </div>
          <ColorInput label="Text Color" value={s.color ?? ''} onChange={(v) => updateStyle({ color: v })} />
        </>
      )}

      <SectionTitle title="Background" />
      <ColorInput label="Background Color" value={s.backgroundColor ?? ''} onChange={(v) => updateStyle({ backgroundColor: v })} />
      <SelectInput label="Gradient" value={s.backgroundImage ?? ''} onChange={(v) => updateStyle({ backgroundImage: v })} options={
        GRADIENT_PRESETS.map(g => ({ value: g.value, label: g.name }))
      } />

      <SectionTitle title="Border" />
      <div className="wb-input-row">
        <StyleInput label="Width" value={s.borderWidth ?? ''} onChange={(v) => updateStyle({ borderWidth: v })} placeholder="0" />
        <SelectInput label="Style" value={s.borderStyle ?? ''} onChange={(v) => updateStyle({ borderStyle: v })} options={[
          { value: '', label: 'None' }, { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' },
        ]} />
      </div>
      <ColorInput label="Border Color" value={s.borderColor ?? ''} onChange={(v) => updateStyle({ borderColor: v })} />
      <StyleInput label="Border Radius" value={s.borderRadius ?? ''} onChange={(v) => updateStyle({ borderRadius: v })} placeholder="0" />

      <SectionTitle title="Shadow" />
      <SelectInput label="Box Shadow" value={s.boxShadow ?? ''} onChange={(v) => updateStyle({ boxShadow: v })} options={
        SHADOW_PRESETS.map(s => ({ value: s.value, label: s.name }))
      } />

      <SectionTitle title="Opacity" />
      <StyleInput label="Opacity" value={s.opacity ?? ''} onChange={(v) => updateStyle({ opacity: v })} placeholder="1" />
    </div>
  );
}

/* ========== Effects Tab ========== */

function EffectsTab({ element, dispatch }: { element: ElementNode | null; dispatch: React.Dispatch<BuilderAction> }) {
  if (!element) return <NoSelection />;

  const updateHoverStyle = (styles: Partial<ElementStyles>) => {
    dispatch({ type: 'UPDATE_ELEMENT_HOVER_STYLES', payload: { elementId: element.id, styles } });
  };

  const updateStyle = (styles: Partial<ElementStyles>) => {
    dispatch({ type: 'UPDATE_ELEMENT_STYLES', payload: { elementId: element.id, styles } });
  };

  const h = element.hoverStyles;
  const s = element.styles;

  return (
    <div className="wb-tab-content">
      <SectionTitle title="Hover Styles" />
      <ColorInput label="Hover BG Color" value={h.backgroundColor ?? ''} onChange={(v) => updateHoverStyle({ backgroundColor: v })} />
      <ColorInput label="Hover Text Color" value={h.color ?? ''} onChange={(v) => updateHoverStyle({ color: v })} />
      <StyleInput label="Hover Opacity" value={h.opacity ?? ''} onChange={(v) => updateHoverStyle({ opacity: v })} placeholder="1" />
      <StyleInput label="Hover Transform" value={h.transform ?? ''} onChange={(v) => updateHoverStyle({ transform: v })} placeholder="none" />
      <SelectInput label="Hover Shadow" value={h.boxShadow ?? ''} onChange={(v) => updateHoverStyle({ boxShadow: v })} options={
        SHADOW_PRESETS.map(s => ({ value: s.value, label: s.name }))
      } />

      <SectionTitle title="Transition" />
      <StyleInput label="Transition" value={s.transition ?? ''} onChange={(v) => updateStyle({ transition: v })} placeholder="all 0.2s ease" />

      <SectionTitle title="Transform" />
      <StyleInput label="Transform" value={s.transform ?? ''} onChange={(v) => updateStyle({ transform: v })} placeholder="none" />
    </div>
  );
}

/* ========== Settings Tab ========== */

function SettingsTab({ element, state, dispatch }: { element: ElementNode | null; state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  if (!element) return <NoSelection />;

  const updateAttr = (key: string, value: string) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: element.id, updates: { attributes: { ...element.attributes, [key]: value } } } });
  };

  const updateEl = (updates: Partial<ElementNode>) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: element.id, updates } });
  };

  return (
    <div className="wb-tab-content">
      <SectionTitle title="Element Settings" />

      {/* Type-specific settings */}
      {element.type === 'heading' && (
        <SelectInput label="Heading Level" value={String(element.headingLevel ?? 2)} onChange={(v) => updateEl({ headingLevel: Number(v) as 1|2|3|4|5|6 })} options={[
          { value: '1', label: 'H1' }, { value: '2', label: 'H2' }, { value: '3', label: 'H3' },
          { value: '4', label: 'H4' }, { value: '5', label: 'H5' }, { value: '6', label: 'H6' },
        ]} />
      )}

      {element.type === 'image' && (
        <>
          <StyleInput label="Image URL" value={element.content} onChange={(v) => updateEl({ content: v })} placeholder="https://..." />
          <StyleInput label="Alt Text" value={element.attributes.alt ?? ''} onChange={(v) => updateAttr('alt', v)} placeholder="Image description" />
        </>
      )}

      {element.type === 'video' && (
        <StyleInput label="Video Embed URL" value={element.content} onChange={(v) => updateEl({ content: v })} placeholder="https://youtube.com/embed/..." />
      )}

      {(element.type === 'button' || element.type === 'link') && (
        <>
          <StyleInput label="Text" value={element.content} onChange={(v) => updateEl({ content: v })} />
          <StyleInput label="Link URL" value={element.attributes.href ?? ''} onChange={(v) => updateAttr('href', v)} placeholder="https://..." />
          <SelectInput label="Target" value={element.attributes.target ?? ''} onChange={(v) => updateAttr('target', v)} options={[
            { value: '', label: 'Same Window' }, { value: '_blank', label: 'New Tab' },
          ]} />
        </>
      )}

      {element.type === 'icon' && (
        <StyleInput label="Icon Class" value={element.content} onChange={(v) => updateEl({ content: v })} placeholder="fas fa-star" />
      )}

      {element.type === 'form' && (
        <>
          <StyleInput label="Form Action URL" value={element.attributes.action ?? ''} onChange={(v) => updateAttr('action', v)} placeholder="#" />
          <SelectInput label="Method" value={element.attributes.method ?? 'POST'} onChange={(v) => updateAttr('method', v)} options={[
            { value: 'POST', label: 'POST' }, { value: 'GET', label: 'GET' },
          ]} />
          <StyleInput label="Submit Button Text" value={element.attributes.submitText ?? ''} onChange={(v) => updateAttr('submitText', v)} placeholder="Submit" />
        </>
      )}

      {element.type === 'map' && (
        <StyleInput label="Map Embed URL" value={element.content} onChange={(v) => updateEl({ content: v })} placeholder="https://maps.google.com/..." />
      )}

      {element.type === 'embed' && (
        <>
          <StyleInput label="Embed URL" value={element.content} onChange={(v) => updateEl({ content: v })} placeholder="https://..." />
          <StyleInput label="Title" value={element.attributes.title ?? ''} onChange={(v) => updateAttr('title', v)} placeholder="Embed title" />
        </>
      )}

      <SectionTitle title="Visibility" />
      <div className="wb-toggle-row">
        <label>Hidden</label>
        <input type="checkbox" checked={element.hidden} onChange={(e) => updateEl({ hidden: e.target.checked })} />
      </div>
      <div className="wb-toggle-row">
        <label>Locked</label>
        <input type="checkbox" checked={element.locked} onChange={(e) => updateEl({ locked: e.target.checked })} />
      </div>
    </div>
  );
}

/* ========== Assets Tab ========== */

function AssetsTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const assets = Object.values(state.project.assets);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const asset = {
          id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: (file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'other') as 'image' | 'video' | 'other',
          dataUrl,
          size: file.size,
          mimeType: file.type,
        };
        dispatch({ type: 'ADD_ASSET', payload: { asset } });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDragStart = (e: React.DragEvent, assetId: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'sidebar-asset', assetId }));
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: true, data: { source: 'sidebar-asset', assetId } } });
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: { favicon: reader.result as string } });
    };
    reader.readAsDataURL(file);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="wb-tab-content">
      <SectionTitle title="Upload Assets" />
      <label className="wb-upload-btn">
        <Upload size={16} />
        <span>Upload Files</span>
        <input type="file" accept="image/*,video/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
      </label>

      {assets.length > 0 && (
        <>
          <SectionTitle title={`Assets (${assets.length})`} />
          <div className="wb-assets-grid">
            {assets.map(asset => (
              <div
                key={asset.id}
                className="wb-asset-item"
                draggable
                onDragStart={(e) => handleDragStart(e, asset.id)}
              >
                {asset.type === 'image' && (
                  <img src={asset.dataUrl} alt={asset.name} className="wb-asset-thumb" />
                )}
                {asset.type === 'video' && (
                  <div className="wb-asset-thumb wb-asset-video">▶</div>
                )}
                <div className="wb-asset-info">
                  <span className="wb-asset-name" title={asset.name}>{asset.name}</span>
                  <span className="wb-asset-size">{formatSize(asset.size)}</span>
                </div>
                <button className="wb-asset-delete" onClick={() => dispatch({ type: 'DELETE_ASSET', payload: { assetId: asset.id } })} title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {assets.length === 0 && (
        <div className="wb-no-assets">
          <Image size={32} style={{ opacity: 0.2 }} />
          <p>No assets yet. Upload images or videos.</p>
        </div>
      )}

      <SectionTitle title="Favicon" />
      <label className="wb-upload-btn small">
        <Upload size={14} />
        <span>{state.project.settings.favicon ? 'Change Favicon' : 'Upload Favicon'}</span>
        <input type="file" accept="image/png,image/x-icon,image/svg+xml" onChange={handleFaviconUpload} style={{ display: 'none' }} />
      </label>
      {state.project.settings.favicon && (
        <div className="wb-favicon-preview">
          <img src={state.project.settings.favicon} alt="Favicon" width={32} height={32} />
          <button onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { favicon: null } })}>
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ========== Theme Tab ========== */

function ThemeTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const theme = state.project.theme;

  const setTheme = (updates: Partial<typeof theme>) => {
    dispatch({ type: 'SET_THEME', payload: updates });
  };

  return (
    <div className="wb-tab-content">
      <SectionTitle title="Light Mode Colors" />
      <ColorInput label="Background" value={theme.light.bg} onChange={(v) => setTheme({ light: { ...theme.light, bg: v } })} />
      <ColorInput label="Text" value={theme.light.text} onChange={(v) => setTheme({ light: { ...theme.light, text: v } })} />
      <ColorInput label="Surface" value={theme.light.surface} onChange={(v) => setTheme({ light: { ...theme.light, surface: v } })} />
      <ColorInput label="Border" value={theme.light.border} onChange={(v) => setTheme({ light: { ...theme.light, border: v } })} />

      <SectionTitle title="Dark Mode Colors" />
      <ColorInput label="Background" value={theme.dark.bg} onChange={(v) => setTheme({ dark: { ...theme.dark, bg: v } })} />
      <ColorInput label="Text" value={theme.dark.text} onChange={(v) => setTheme({ dark: { ...theme.dark, text: v } })} />
      <ColorInput label="Surface" value={theme.dark.surface} onChange={(v) => setTheme({ dark: { ...theme.dark, surface: v } })} />
      <ColorInput label="Border" value={theme.dark.border} onChange={(v) => setTheme({ dark: { ...theme.dark, border: v } })} />

      <SectionTitle title="Accent Color" />
      <ColorInput label="Accent" value={theme.accent} onChange={(v) => setTheme({ accent: v })} />

      <SectionTitle title="Fonts" />
      <SelectInput label="Heading Font" value={theme.fonts.heading} onChange={(v) => setTheme({ fonts: { ...theme.fonts, heading: v } })} options={FONT_LIST.map(f => ({ value: f.name, label: f.name }))} />
      <SelectInput label="Body Font" value={theme.fonts.body} onChange={(v) => setTheme({ fonts: { ...theme.fonts, body: v } })} options={FONT_LIST.map(f => ({ value: f.name, label: f.name }))} />

      <SectionTitle title="Border Radius" />
      <StyleInput label="Global Radius" value={theme.borderRadius} onChange={(v) => setTheme({ borderRadius: v })} placeholder="8px" />

      <SectionTitle title="Global CSS" />
      <div className="wb-style-input">
        <label>Custom CSS</label>
        <textarea
          className="wb-css-textarea"
          value={state.project.settings.globalCSS}
          onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { globalCSS: e.target.value } })}
          placeholder="/* Custom CSS */"
          rows={6}
        />
      </div>

      <SectionTitle title="Site Settings" />
      <StyleInput label="Site Name" value={state.project.settings.siteName} onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { siteName: v } })} />
      <StyleInput label="Analytics ID" value={state.project.settings.analyticsId} onChange={(v) => dispatch({ type: 'UPDATE_SETTINGS', payload: { analyticsId: v } })} placeholder="G-XXXXXXXX" />
      <div className="wb-toggle-row">
        <label>Show Header</label>
        <input type="checkbox" checked={state.project.settings.headerEnabled} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { headerEnabled: e.target.checked } })} />
      </div>
      <div className="wb-toggle-row">
        <label>Show Footer</label>
        <input type="checkbox" checked={state.project.settings.footerEnabled} onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { footerEnabled: e.target.checked } })} />
      </div>
    </div>
  );
}
