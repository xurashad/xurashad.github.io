'use client';
/* eslint-disable @next/next/no-img-element */
// ============================================================
// Website Builder Pro — Right Sidebar (Full Inspector)
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  Box, Paintbrush, Sparkles, Settings, Image as ImageIcon,
  Palette, Upload, Trash2, X, Copy, ClipboardPaste, BookmarkPlus,
  RotateCcw, CornerLeftUp, Plus,
} from 'lucide-react';
import type {
  BuilderState, BuilderAction, RightSidebarTab, ElementNode,
  ElementStyles, SectionNode, ColumnNode, RowNode, AnimationType,
  ShapeDividerType, HeaderStyle,
} from '../lib/types';
import {
  FONT_LIST, SHADOW_PRESETS, ANIMATION_PRESETS, COLUMN_LAYOUT_PRESETS,
  THEME_PRESETS, STOCK_IMAGES, createElement, createSection,
} from '../lib/defaults';
import {
  getSelectedElement, getSelectedSection, getSelectedColumn,
  getSelectedRow, getBreadcrumb, getElementContextIds, showToast,
} from '../lib/reducer';
import {
  mergeResponsiveStyles, normalizeVideoEmbedUrl, buildGoogleMapsEmbedUrl,
} from '../lib/css-engine';
import { getStorageUsageKB } from '../lib/persistence';
import {
  SectionTitle, StyleInput, SelectInput, ToggleRow, SegmentedControl,
  ThemeColorInput, UnitSliderInput, BoxModelControl, GradientBuilder,
} from './VisualControls';
import IconPicker from './IconPicker';
import {
  FormBuilderEditor, AccordionEditor, TabsEditor,
  TableEditor, SocialLinksEditor,
} from './WidgetEditors';

interface RightSidebarProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

export default function RightSidebar({ state, dispatch }: RightSidebarProps) {
  const selectedElement = useMemo(() => getSelectedElement(state), [state]);
  const selectedSection = useMemo(() => getSelectedSection(state), [state]);
  const selectedColumn = useMemo(() => getSelectedColumn(state), [state]);
  const selectedRow = useMemo(() => getSelectedRow(state), [state]);
  const breadcrumb = useMemo(() => getBreadcrumb(state), [state]);

  if (!state.rightSidebarOpen) return null;

  const tabs: { key: RightSidebarTab; icon: React.ReactNode; label: string }[] = [
    { key: 'layout', icon: <Box size={15} />, label: 'Layout' },
    { key: 'style', icon: <Paintbrush size={15} />, label: 'Style' },
    { key: 'effects', icon: <Sparkles size={15} />, label: 'Effects' },
    { key: 'settings', icon: <Settings size={15} />, label: 'Settings' },
    { key: 'assets', icon: <ImageIcon size={15} />, label: 'Assets' },
    { key: 'theme', icon: <Palette size={15} />, label: 'Theme' },
  ];

  const isGlobalTab = state.rightSidebarTab === 'assets' || state.rightSidebarTab === 'theme';
  const parentSectionCrumb = breadcrumb.find(b => b.target === 'section');

  const structuredWidgetTypes = [
    'card', 'form', 'accordion', 'tabs', 'table', 'stat',
    'progress', 'avatar', 'social-links', 'image', 'video', 'map', 'embed', 'icon',
  ];
  const isStructuredWidget = Boolean(selectedElement && structuredWidgetTypes.includes(selectedElement.type));

  const selectionTitle = selectedElement
    ? (selectedElement.name || selectedElement.type)
    : selectedSection
      ? selectedSection.name
      : selectedColumn
        ? `Column (${selectedColumn.span}/12)`
        : selectedRow
          ? 'Row Container'
          : 'No selection';

  return (
    <div className="wb-right-sidebar">
      <div className="wb-sidebar-tabs">
        {tabs.map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            className={`wb-sidebar-tab ${state.rightSidebarTab === key ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: { tab: key } })}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Selection & Breakpoint Context Header */}
      {!isGlobalTab && state.selection && (
        <div className="wb-inspector-banner">
          <div className="wb-ib-top">
            <span className="wb-ib-badge">{state.selection.target}</span>
            <span className="wb-ib-name">{selectionTitle}</span>
            {isStructuredWidget && state.rightSidebarTab !== 'settings' && (
              <button
                type="button"
                className="wb-ib-edit-btn"
                onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: { tab: 'settings' } })}
                title="Open Widget Content & Settings"
              >
                Edit Content
              </button>
            )}
            {parentSectionCrumb && state.selection.target !== 'section' && (
              <button
                type="button"
                className="wb-ib-parent"
                onClick={() => dispatch({ type: 'SELECT', payload: { id: parentSectionCrumb.id, target: 'section' } })}
                title={`Jump to ${parentSectionCrumb.label}`}
              >
                <CornerLeftUp size={12} />
              </button>
            )}
          </div>

          {state.viewportMode !== 'desktop' && (selectedElement || selectedSection) && (
            <div className="wb-bp-banner">
              <span>Editing <strong>{state.viewportMode}</strong> overrides</span>
              {selectedElement && (
                <button
                  type="button"
                  onClick={() => dispatch({
                    type: 'CLEAR_ELEMENT_RESPONSIVE_STYLES',
                    payload: { elementId: selectedElement.id, viewport: state.viewportMode as 'tablet' | 'mobile' },
                  })}
                  title="Clear breakpoint overrides"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>
          )}

          {selectedElement && (state.rightSidebarTab === 'style' || state.rightSidebarTab === 'effects') && (
            <div style={{ marginTop: 6 }}>
              <SegmentedControl
                options={[
                  { value: 'normal', label: 'Normal State' },
                  { value: 'hover', label: ':hover State' },
                ]}
                value={state.editingStyleState}
                onChange={(m) => dispatch({ type: 'SET_EDITING_STYLE_STATE', payload: { mode: m as 'normal' | 'hover' } })}
              />
            </div>
          )}
        </div>
      )}

      <div className="wb-sidebar-content">
        {state.rightSidebarTab === 'layout' && (
          <LayoutTab
            state={state}
            element={selectedElement}
            section={selectedSection}
            column={selectedColumn}
            rowInfo={selectedRow}
            dispatch={dispatch}
          />
        )}
        {state.rightSidebarTab === 'style' && (
          <StyleTab
            state={state}
            element={selectedElement}
            section={selectedSection}
            column={selectedColumn}
            dispatch={dispatch}
          />
        )}
        {state.rightSidebarTab === 'effects' && (
          <EffectsTab
            element={selectedElement}
            section={selectedSection}
            dispatch={dispatch}
          />
        )}
        {state.rightSidebarTab === 'settings' && (
          <SettingsTab
            state={state}
            element={selectedElement}
            section={selectedSection}
            dispatch={dispatch}
          />
        )}
        {state.rightSidebarTab === 'assets' && <AssetsTab state={state} dispatch={dispatch} />}
        {state.rightSidebarTab === 'theme' && <ThemeTab state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}

/* ========== Empty Selection State ========== */

function NoSelection({ hint = 'Click any element, column, or section on the canvas to inspect its properties.' }: { hint?: string }) {
  return (
    <div className="wb-no-selection">
      <p>{hint}</p>
    </div>
  );
}

/* ========== Layout Tab (Element / Section / Column / Row) ========== */

function LayoutTab({
  state,
  element,
  section,
  column,
  rowInfo,
  dispatch,
}: {
  state: BuilderState;
  element: ElementNode | null;
  section: SectionNode | null;
  column: ColumnNode | null;
  rowInfo: { row: RowNode; section: SectionNode } | null;
  dispatch: React.Dispatch<BuilderAction>;
}) {
  // Element layout
  if (element) {
    const vp = state.viewportMode;
    const s = mergeResponsiveStyles(element.styles, element.responsiveStyles, vp);

    const updateStyle = (styles: Partial<ElementStyles>) => {
      if (vp === 'desktop') {
        dispatch({ type: 'UPDATE_ELEMENT_STYLES', payload: { elementId: element.id, styles } });
      } else {
        dispatch({ type: 'UPDATE_ELEMENT_RESPONSIVE_STYLES', payload: { elementId: element.id, viewport: vp, styles } });
      }
    };

    return (
      <div className="wb-tab-content">
        <SectionTitle title="Sizing" />
        <UnitSliderInput label="Width" value={s.width ?? ''} onChange={(v) => updateStyle({ width: v })} max={1400} defaultUnit="%" />
        <UnitSliderInput label="Max Width" value={s.maxWidth ?? ''} onChange={(v) => updateStyle({ maxWidth: v })} max={1400} defaultUnit="px" />
        <div className="wb-input-row">
          <StyleInput label="Height" value={s.height ?? ''} onChange={(v) => updateStyle({ height: v })} placeholder="auto" />
          <StyleInput label="Min Height" value={s.minHeight ?? ''} onChange={(v) => updateStyle({ minHeight: v })} placeholder="0" />
        </div>

        <SectionTitle title="Box Model (Margin & Padding)" />
        <BoxModelControl styles={s} onChange={updateStyle} />

        <SectionTitle title="Display & Flex" />
        <SelectInput
          label="Display"
          value={s.display ?? ''}
          onChange={(v) => updateStyle({ display: v })}
          options={[
            { value: '', label: 'Default' },
            { value: 'block', label: 'Block' },
            { value: 'flex', label: 'Flex' },
            { value: 'inline-flex', label: 'Inline Flex' },
            { value: 'grid', label: 'Grid' },
            { value: 'inline-block', label: 'Inline Block' },
            { value: 'none', label: 'None' },
          ]}
        />
        {(s.display === 'flex' || s.display === 'inline-flex') && (
          <>
            <div className="wb-input-row">
              <SelectInput label="Direction" value={s.flexDirection ?? 'row'} onChange={(v) => updateStyle({ flexDirection: v })} options={[
                { value: 'row', label: 'Row' }, { value: 'column', label: 'Column' },
              ]} />
              <StyleInput label="Gap" value={s.gap ?? ''} onChange={(v) => updateStyle({ gap: v })} placeholder="1rem" />
            </div>
            <SelectInput label="Justify" value={s.justifyContent ?? ''} onChange={(v) => updateStyle({ justifyContent: v })} options={[
              { value: '', label: 'Default' }, { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' },
              { value: 'flex-end', label: 'End' }, { value: 'space-between', label: 'Between' }, { value: 'space-around', label: 'Around' },
            ]} />
            <SelectInput label="Align" value={s.alignItems ?? ''} onChange={(v) => updateStyle({ alignItems: v })} options={[
              { value: '', label: 'Default' }, { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' },
              { value: 'flex-end', label: 'End' }, { value: 'stretch', label: 'Stretch' },
            ]} />
          </>
        )}
        <SelectInput label="Overflow" value={s.overflow ?? ''} onChange={(v) => updateStyle({ overflow: v })} options={[
          { value: '', label: 'Default' }, { value: 'hidden', label: 'Hidden' }, { value: 'auto', label: 'Auto' }, { value: 'scroll', label: 'Scroll' },
        ]} />
      </div>
    );
  }

  // Section layout
  if (section) {
    const isHeader = section.id === state.project.header.id;
    const vp = state.viewportMode;
    const s = mergeResponsiveStyles(section.styles, section.responsiveStyles, vp);
    const updateSecStyle = (styles: Partial<ElementStyles>) => {
      if (vp === 'desktop') {
        dispatch({ type: 'UPDATE_SECTION_STYLES', payload: { sectionId: section.id, styles } });
      } else {
        dispatch({ type: 'UPDATE_SECTION_RESPONSIVE_STYLES', payload: { sectionId: section.id, viewport: vp, styles } });
      }
    };

    if (isHeader) {
      const settings = state.project.settings;
      const setSettings = (updates: Partial<typeof settings>) =>
        dispatch({ type: 'UPDATE_SETTINGS', payload: updates });

      return (
        <div className="wb-tab-content">
          <SectionTitle title="Header Layout & Navigation" />
          <SelectInput
            label="Header Style"
            value={settings.headerStyle ?? 'glass'}
            onChange={(v) => setSettings({ headerStyle: v as HeaderStyle })}
            options={[
              { value: 'glass', label: 'Sticky Glass Blur' },
              { value: 'classic', label: 'Classic Solid' },
              { value: 'centered', label: 'Centered Stack' },
              { value: 'minimal', label: 'Minimal (No CTA)' },
            ]}
          />
          <ToggleRow
            label="Show Header CTA Button"
            checked={Boolean(settings.headerCtaEnabled)}
            onChange={(c) => setSettings({ headerCtaEnabled: c })}
          />
          {settings.headerCtaEnabled && (
            <div className="wb-input-row">
              <StyleInput
                label="CTA Text"
                value={settings.headerCtaText ?? 'Get Started'}
                onChange={(v) => setSettings({ headerCtaText: v })}
              />
              <StyleInput
                label="CTA URL"
                value={settings.headerCtaHref ?? '#contact'}
                onChange={(v) => setSettings({ headerCtaHref: v })}
              />
            </div>
          )}
          <SectionTitle title="Header Spacing" />
          <BoxModelControl styles={s} onChange={updateSecStyle} />
        </div>
      );
    }

    return (
      <div className="wb-tab-content">
        <SectionTitle title="Section Dimensions" />
        <ToggleRow
          label="Full Bleed Width"
          checked={section.fullBleed}
          onChange={(c) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { fullBleed: c } } })}
        />
        <StyleInput label="Min Height" value={s.minHeight ?? ''} onChange={(v) => updateSecStyle({ minHeight: v })} placeholder="auto (e.g. 60vh)" />

        <SectionTitle title="Section Spacing" />
        <BoxModelControl styles={s} onChange={updateSecStyle} />

        <SectionTitle title={`Rows & Columns (${section.rows.length})`} />
        {section.rows.map((r, rIdx) => (
          <div key={r.id} className="wb-we-card">
            <div className="wb-we-card-top">
              <span className="wb-we-badge">Row {rIdx + 1} · {r.columns.length} col</span>
              <div className="wb-we-card-btns">
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'DUPLICATE_ROW', payload: { sectionId: section.id, rowId: r.id } })}
                  title="Duplicate Row"
                >
                  <Copy size={11} />
                </button>
                {section.rows.length > 1 && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => dispatch({ type: 'DELETE_ROW', payload: { sectionId: section.id, rowId: r.id } })}
                    title="Delete Row"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>

            <div className="wb-col-preset-grid">
              {COLUMN_LAYOUT_PRESETS.map(p => {
                const active = r.columns.length === p.spans.length && r.columns.every((c, ci) => c.span === p.spans[ci]);
                return (
                  <button
                    key={p.label}
                    type="button"
                    className={`wb-col-preset-btn ${active ? 'active' : ''}`}
                    onClick={() => {
                      dispatch({ type: 'SET_COLUMN_LAYOUT', payload: { sectionId: section.id, rowId: r.id, spans: p.spans } });
                      dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Change column layout' } });
                    }}
                    title={p.label}
                  >
                    {p.spans.map((sp, i) => (
                      <span key={i} style={{ flex: sp }} />
                    ))}
                  </button>
                );
              })}
            </div>

            <div className="wb-input-row" style={{ marginTop: 6 }}>
              <StyleInput
                label="Row Gap"
                value={r.styles.gap ?? ''}
                onChange={(v) => dispatch({ type: 'UPDATE_ROW_STYLES', payload: { sectionId: section.id, rowId: r.id, styles: { gap: v } } })}
                placeholder="1.5rem"
              />
              <SelectInput
                label="Vertical Align"
                value={r.styles.alignItems ?? ''}
                onChange={(v) => dispatch({ type: 'UPDATE_ROW_STYLES', payload: { sectionId: section.id, rowId: r.id, styles: { alignItems: v } } })}
                options={[
                  { value: '', label: 'Stretch' },
                  { value: 'start', label: 'Top' },
                  { value: 'center', label: 'Center' },
                  { value: 'end', label: 'Bottom' },
                ]}
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="wb-pm-btn"
          style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
          onClick={() => {
            dispatch({ type: 'ADD_ROW', payload: { sectionId: section.id, columns: 2 } });
            dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Add Row' } });
          }}
        >
          <Plus size={14} /> Add 2-Column Row
        </button>
      </div>
    );
  }

  // Column layout
  if (column) {
    const updateCol = (styles: Partial<ElementStyles>) =>
      dispatch({ type: 'UPDATE_COLUMN_STYLES', payload: { columnId: column.id, styles } });

    return (
      <div className="wb-tab-content">
        <SectionTitle title="Column Width (12-Grid)" />
        <div className="wb-unit-slider">
          <div className="wb-unit-slider-head">
            <label>Grid Span</label>
            <span className="wb-span-readout">{column.span} / 12 cols</span>
          </div>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={column.span}
            onChange={(e) => dispatch({ type: 'SET_COLUMN_SPAN', payload: { columnId: column.id, span: Number(e.target.value) } })}
          />
        </div>

        <SectionTitle title="Column Spacing" />
        <BoxModelControl styles={column.styles} onChange={updateCol} />

        <SectionTitle title="Inner Flex Alignment" />
        <SelectInput
          label="Display"
          value={column.styles.display ?? ''}
          onChange={(v) => updateCol({ display: v })}
          options={[
            { value: '', label: 'Default (Block)' },
            { value: 'flex', label: 'Flex Container' },
          ]}
        />
        {column.styles.display === 'flex' && (
          <>
            <SelectInput label="Direction" value={column.styles.flexDirection ?? 'column'} onChange={(v) => updateCol({ flexDirection: v })} options={[
              { value: 'column', label: 'Vertical' }, { value: 'row', label: 'Horizontal' },
            ]} />
            <SelectInput label="Justify" value={column.styles.justifyContent ?? ''} onChange={(v) => updateCol({ justifyContent: v })} options={[
              { value: '', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' }, { value: 'space-between', label: 'Space Between' },
            ]} />
            <SelectInput label="Align" value={column.styles.alignItems ?? ''} onChange={(v) => updateCol({ alignItems: v })} options={[
              { value: '', label: 'Stretch' }, { value: 'flex-start', label: 'Start' }, { value: 'center', label: 'Center' }, { value: 'flex-end', label: 'End' },
            ]} />
            <StyleInput label="Gap" value={column.styles.gap ?? ''} onChange={(v) => updateCol({ gap: v })} placeholder="0.75rem" />
          </>
        )}
      </div>
    );
  }

  // Row layout
  if (rowInfo) {
    const updateRow = (styles: Partial<ElementStyles>) =>
      dispatch({ type: 'UPDATE_ROW_STYLES', payload: { sectionId: rowInfo.section.id, rowId: rowInfo.row.id, styles } });

    return (
      <div className="wb-tab-content">
        <SectionTitle title="Row Grid Settings" />
        <StyleInput label="Column Gap" value={rowInfo.row.styles.gap ?? ''} onChange={(v) => updateRow({ gap: v })} placeholder="1.5rem" />
        <SelectInput label="Align Items" value={rowInfo.row.styles.alignItems ?? ''} onChange={(v) => updateRow({ alignItems: v })} options={[
          { value: '', label: 'Stretch' }, { value: 'start', label: 'Top' }, { value: 'center', label: 'Center' }, { value: 'end', label: 'Bottom' },
        ]} />
        <BoxModelControl styles={rowInfo.row.styles} onChange={updateRow} />
      </div>
    );
  }

  return <NoSelection />;
}

/* ========== Style Tab (Element Normal/:hover, Section, Column) ========== */

function StyleTab({
  state,
  element,
  section,
  column,
  dispatch,
}: {
  state: BuilderState;
  element: ElementNode | null;
  section: SectionNode | null;
  column: ColumnNode | null;
  dispatch: React.Dispatch<BuilderAction>;
}) {
  const target = element ?? section ?? column;
  if (!target) return <NoSelection />;

  const isHoverMode = Boolean(element && state.editingStyleState === 'hover');
  const vp = state.viewportMode;

  let currentStyles: ElementStyles = {};
  if (element) {
    currentStyles = isHoverMode
      ? element.hoverStyles
      : mergeResponsiveStyles(element.styles, element.responsiveStyles, vp);
  } else if (section) {
    currentStyles = mergeResponsiveStyles(section.styles, section.responsiveStyles, vp);
  } else if (column) {
    currentStyles = column.styles;
  }

  const updateStyles = (patch: Partial<ElementStyles>) => {
    if (element) {
      if (isHoverMode) {
        dispatch({ type: 'UPDATE_ELEMENT_HOVER_STYLES', payload: { elementId: element.id, styles: patch } });
      } else if (vp === 'desktop') {
        dispatch({ type: 'UPDATE_ELEMENT_STYLES', payload: { elementId: element.id, styles: patch } });
      } else {
        dispatch({ type: 'UPDATE_ELEMENT_RESPONSIVE_STYLES', payload: { elementId: element.id, viewport: vp, styles: patch } });
      }
    } else if (section) {
      if (vp === 'desktop') {
        dispatch({ type: 'UPDATE_SECTION_STYLES', payload: { sectionId: section.id, styles: patch } });
      } else {
        dispatch({ type: 'UPDATE_SECTION_RESPONSIVE_STYLES', payload: { sectionId: section.id, viewport: vp, styles: patch } });
      }
    } else if (column) {
      dispatch({ type: 'UPDATE_COLUMN_STYLES', payload: { columnId: column.id, styles: patch } });
    }
  };

  const showTypography = !element || ['heading', 'paragraph', 'button', 'link', 'list', 'blockquote', 'code', 'badge', 'alert', 'card', 'stat', 'accordion', 'tabs'].includes(element.type);
  const selectionTarget = element ? 'element' : section ? 'section' : 'column';

  return (
    <div className="wb-tab-content">
      <div className="wb-style-copy-bar">
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'COPY_STYLES', payload: { styles: currentStyles } });
            showToast(dispatch, 'info', 'Styles copied');
          }}
        >
          <Copy size={12} /> Copy Styles
        </button>
        <button
          type="button"
          disabled={!state.copiedStyles}
          onClick={() => {
            dispatch({ type: 'PASTE_STYLES', payload: { targetId: target.id, targetType: selectionTarget } });
            dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Paste styles' } });
          }}
        >
          <ClipboardPaste size={12} /> Paste Styles
        </button>
      </div>

      {showTypography && (
        <>
          <SectionTitle title="Typography" />
          <SelectInput
            label="Font Family"
            value={currentStyles.fontFamily ?? ''}
            onChange={(v) => updateStyles({ fontFamily: v })}
            options={[
              { value: '', label: 'Inherit Theme Font' },
              ...FONT_LIST.map(f => ({ value: f.family, label: f.name })),
            ]}
          />
          <UnitSliderInput label="Font Size" value={currentStyles.fontSize ?? ''} onChange={(v) => updateStyles({ fontSize: v })} min={10} max={96} defaultUnit="px" />
          <div className="wb-input-row">
            <SelectInput
              label="Weight"
              value={currentStyles.fontWeight ?? ''}
              onChange={(v) => updateStyles({ fontWeight: v })}
              options={[
                { value: '', label: 'Default' }, { value: '300', label: 'Light (300)' },
                { value: '400', label: 'Regular (400)' }, { value: '500', label: 'Medium (500)' },
                { value: '600', label: 'Semibold (600)' }, { value: '700', label: 'Bold (700)' },
                { value: '800', label: 'Extra Bold (800)' }, { value: '900', label: 'Black (900)' },
              ]}
            />
            <SelectInput
              label="Transform"
              value={currentStyles.textTransform ?? ''}
              onChange={(v) => updateStyles({ textTransform: v })}
              options={[
                { value: '', label: 'Normal' }, { value: 'uppercase', label: 'UPPERCASE' },
                { value: 'lowercase', label: 'lowercase' }, { value: 'capitalize', label: 'Capitalize' },
              ]}
            />
          </div>
          <div className="wb-input-row">
            <StyleInput label="Line Height" value={currentStyles.lineHeight ?? ''} onChange={(v) => updateStyles({ lineHeight: v })} placeholder="1.6" />
            <StyleInput label="Letter Spacing" value={currentStyles.letterSpacing ?? ''} onChange={(v) => updateStyles({ letterSpacing: v })} placeholder="0" />
          </div>
          <div className="wb-align-group">
            {(['left', 'center', 'right', 'justify'] as const).map(align => (
              <button
                key={align}
                type="button"
                className={`wb-align-btn ${currentStyles.textAlign === align ? 'active' : ''}`}
                onClick={() => updateStyles({ textAlign: align })}
                title={`Align ${align}`}
              >
                {align === 'left' ? '⫷' : align === 'center' ? '☰' : align === 'right' ? '⫸' : '⚌'}
              </button>
            ))}
          </div>
          <ThemeColorInput label="Text Color" value={currentStyles.color ?? ''} onChange={(v) => updateStyles({ color: v })} />
          <ToggleRow
            label="Gradient Text Clip"
            checked={currentStyles.backgroundClip === 'text'}
            onChange={(enabled) => {
              if (enabled) {
                updateStyles({
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  WebkitTextFillColor: 'transparent',
                  backgroundImage: currentStyles.backgroundImage || 'linear-gradient(135deg, var(--site-accent), #a855f7)',
                });
              } else {
                updateStyles({
                  backgroundClip: '',
                  WebkitBackgroundClip: '',
                  color: '',
                  WebkitTextFillColor: '',
                });
              }
            }}
          />
        </>
      )}

      <SectionTitle title="Background" />
      <ThemeColorInput label="Background Color" value={currentStyles.backgroundColor ?? ''} onChange={(v) => updateStyles({ backgroundColor: v })} />
      <div className="wb-style-input">
        <label>Gradient Fill</label>
        <GradientBuilder value={currentStyles.backgroundImage ?? ''} onChange={(v) => updateStyles({ backgroundImage: v })} />
      </div>
      {section && (
        <StyleInput
          label="Background Overlay (e.g. rgba(0,0,0,0.45))"
          value={section.backgroundOverlay ?? ''}
          onChange={(v) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { backgroundOverlay: v } } })}
          placeholder="rgba(0,0,0,0.45)"
        />
      )}

      <SectionTitle title="Border & Radius" />
      <div className="wb-input-row">
        <StyleInput label="Width" value={currentStyles.borderWidth ?? ''} onChange={(v) => updateStyles({ borderWidth: v })} placeholder="0" />
        <SelectInput
          label="Style"
          value={currentStyles.borderStyle ?? ''}
          onChange={(v) => updateStyles({ borderStyle: v })}
          options={[
            { value: '', label: 'None' }, { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' },
          ]}
        />
      </div>
      <ThemeColorInput label="Border Color" value={currentStyles.borderColor ?? ''} onChange={(v) => updateStyles({ borderColor: v })} />
      <UnitSliderInput label="Border Radius" value={currentStyles.borderRadius ?? ''} onChange={(v) => updateStyles({ borderRadius: v })} max={64} defaultUnit="px" />

      <SectionTitle title="Shadow & Opacity" />
      <SelectInput
        label="Box Shadow"
        value={currentStyles.boxShadow ?? ''}
        onChange={(v) => updateStyles({ boxShadow: v })}
        options={SHADOW_PRESETS.map(s => ({ value: s.value, label: s.name }))}
      />
      <StyleInput label="Opacity (0 – 1)" value={currentStyles.opacity ?? ''} onChange={(v) => updateStyles({ opacity: v })} placeholder="1" />
    </div>
  );
}

/* ========== Effects Tab (Hover, Entrance Animations, Section Shape Dividers) ========== */

function EffectsTab({
  element,
  section,
  dispatch,
}: {
  element: ElementNode | null;
  section: SectionNode | null;
  dispatch: React.Dispatch<BuilderAction>;
}) {
  if (section) {
    const dividerOptions: { value: ShapeDividerType; label: string }[] = [
      { value: 'none', label: 'None' },
      { value: 'wave', label: 'Wave' },
      { value: 'curve', label: 'Curve' },
      { value: 'slant', label: 'Slant' },
      { value: 'triangle', label: 'Triangle' },
    ];
    return (
      <div className="wb-tab-content">
        <SectionTitle title="SVG Shape Dividers" />
        <SelectInput
          label="Top Divider"
          value={section.shapeDividerTop ?? 'none'}
          onChange={(v) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { shapeDividerTop: v as ShapeDividerType } } })}
          options={dividerOptions}
        />
        <SelectInput
          label="Bottom Divider"
          value={section.shapeDividerBottom ?? 'none'}
          onChange={(v) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { shapeDividerBottom: v as ShapeDividerType } } })}
          options={dividerOptions}
        />
        <ThemeColorInput
          label="Divider Fill Color"
          value={section.shapeDividerColor ?? 'var(--site-bg)'}
          onChange={(v) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { shapeDividerColor: v } } })}
        />
      </div>
    );
  }

  if (!element) return <NoSelection hint="Select an element for hover, transform & scroll animations, or select a section for shape dividers." />;

  const updateHover = (styles: Partial<ElementStyles>) =>
    dispatch({ type: 'UPDATE_ELEMENT_HOVER_STYLES', payload: { elementId: element.id, styles } });

  const updateStyle = (styles: Partial<ElementStyles>) =>
    dispatch({ type: 'UPDATE_ELEMENT_STYLES', payload: { elementId: element.id, styles } });

  const h = element.hoverStyles;
  const s = element.styles;
  const anim = element.animation ?? { type: 'none', duration: '0.6s', delay: '0s' };

  return (
    <div className="wb-tab-content">
      <SectionTitle title="Scroll Entrance Animation" />
      <SelectInput
        label="Animation Preset"
        value={anim.type}
        onChange={(v) => dispatch({
          type: 'UPDATE_ELEMENT',
          payload: { elementId: element.id, updates: { animation: { ...anim, type: v as AnimationType } } },
        })}
        options={ANIMATION_PRESETS.map(a => ({ value: a.name, label: `${a.nameLabel} — ${a.description}` }))}
      />
      {anim.type !== 'none' && (
        <div className="wb-input-row">
          <StyleInput
            label="Duration"
            value={anim.duration ?? '0.6s'}
            onChange={(v) => dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: element.id, updates: { animation: { ...anim, duration: v } } } })}
            placeholder="0.6s"
          />
          <StyleInput
            label="Delay"
            value={anim.delay ?? '0s'}
            onChange={(v) => dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: element.id, updates: { animation: { ...anim, delay: v } } } })}
            placeholder="0s"
          />
        </div>
      )}

      <SectionTitle title="Hover State (:hover)" />
      <ThemeColorInput label="Hover BG Color" value={h.backgroundColor ?? ''} onChange={(v) => updateHover({ backgroundColor: v })} />
      <ThemeColorInput label="Hover Text Color" value={h.color ?? ''} onChange={(v) => updateHover({ color: v })} />
      <StyleInput label="Hover Opacity" value={h.opacity ?? ''} onChange={(v) => updateHover({ opacity: v })} placeholder="0.9" />
      <StyleInput label="Hover Transform" value={h.transform ?? ''} onChange={(v) => updateHover({ transform: v })} placeholder="translateY(-2px)" />
      <SelectInput
        label="Hover Shadow"
        value={h.boxShadow ?? ''}
        onChange={(v) => updateHover({ boxShadow: v })}
        options={SHADOW_PRESETS.map(sh => ({ value: sh.value, label: sh.name }))}
      />

      <SectionTitle title="Transition & Transform" />
      <StyleInput label="Transition" value={s.transition ?? ''} onChange={(v) => updateStyle({ transition: v })} placeholder="all 0.2s ease" />
      <StyleInput label="Transform" value={s.transform ?? ''} onChange={(v) => updateStyle({ transform: v })} placeholder="none" />
      <StyleInput label="CSS Filter" value={s.filter ?? ''} onChange={(v) => updateStyle({ filter: v })} placeholder="blur(0px) brightness(1)" />
    </div>
  );
}

/* ========== Settings Tab (All 27 Elements + Section Settings) ========== */

function SettingsTab({
  state,
  element,
  section,
  dispatch,
}: {
  state: BuilderState;
  element: ElementNode | null;
  section: SectionNode | null;
  dispatch: React.Dispatch<BuilderAction>;
}) {
  if (section) {
    if (section.id === state.project.header.id) {
      const settings = state.project.settings;
      const setSettings = (updates: Partial<typeof settings>) =>
        dispatch({ type: 'UPDATE_SETTINGS', payload: updates });

      return (
        <div className="wb-tab-content">
          <SectionTitle title="Header Configuration" />
          <StyleInput
            label="Site / Brand Name"
            value={settings.siteName}
            onChange={(v) => setSettings({ siteName: v })}
          />
          <ToggleRow
            label="Show Header"
            checked={settings.headerEnabled}
            onChange={(c) => setSettings({ headerEnabled: c })}
          />
          <SelectInput
            label="Header Style"
            value={settings.headerStyle ?? 'glass'}
            onChange={(v) => setSettings({ headerStyle: v as HeaderStyle })}
            options={[
              { value: 'glass', label: 'Sticky Glass Blur' },
              { value: 'classic', label: 'Classic Solid' },
              { value: 'centered', label: 'Centered Stack' },
              { value: 'minimal', label: 'Minimal (No CTA)' },
            ]}
          />
          <ToggleRow
            label="Show CTA Button"
            checked={Boolean(settings.headerCtaEnabled)}
            onChange={(c) => setSettings({ headerCtaEnabled: c })}
          />
          {settings.headerCtaEnabled && (
            <>
              <StyleInput
                label="CTA Button Text"
                value={settings.headerCtaText ?? 'Get Started'}
                onChange={(v) => setSettings({ headerCtaText: v })}
              />
              <StyleInput
                label="CTA Button URL"
                value={settings.headerCtaHref ?? '#contact'}
                onChange={(v) => setSettings({ headerCtaHref: v })}
              />
            </>
          )}
        </div>
      );
    }

    return (
      <div className="wb-tab-content">
        <SectionTitle title="Section Configuration" />
        <StyleInput
          label="Section Name"
          value={section.name}
          onChange={(v) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { name: v } } })}
        />
        <StyleInput
          label="Anchor ID (for #links)"
          value={section.anchorId ?? ''}
          onChange={(v) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { anchorId: v.replace(/^#/, '') } } })}
          placeholder="features"
        />
        <ToggleRow
          label="Full Bleed Container"
          checked={section.fullBleed}
          onChange={(c) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { fullBleed: c } } })}
        />
        <ToggleRow
          label="Hide Section"
          checked={Boolean(section.hidden)}
          onChange={(c) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { hidden: c } } })}
        />
        <ToggleRow
          label="Lock Section Dragging"
          checked={Boolean(section.locked)}
          onChange={(c) => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { locked: c } } })}
        />

        <button
          type="button"
          className="wb-pm-btn"
          style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
          onClick={() => {
            dispatch({ type: 'SAVE_BLOCK', payload: { section } });
            showToast(dispatch, 'success', `Saved "${section.name}" to Sections > Saved`);
          }}
        >
          <BookmarkPlus size={14} /> Save Section as Reusable Block
        </button>
      </div>
    );
  }

  if (!element) return <NoSelection />;

  const updateAttr = (key: string, value: string) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: element.id, updates: { attributes: { ...element.attributes, [key]: value } } } });
  };

  const updateEl = (updates: Partial<ElementNode>) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: element.id, updates } });
  };

  const pages = state.project.pageOrder.map(id => state.project.pages[id]).filter(Boolean);
  const assets = Object.values(state.project.assets).filter(a => a.type === 'image');

  const listPlainText = element.type === 'list'
    ? element.content.replace(/<\/li>\s*<li>/gi, '\n').replace(/<\/?li>/gi, '')
    : '';

  return (
    <div className="wb-tab-content">
      <SectionTitle title={`${element.type} Settings`} />

      {element.type === 'heading' && (
        <>
          <SelectInput
            label="Heading Level"
            value={String(element.headingLevel ?? 2)}
            onChange={(v) => updateEl({ headingLevel: Number(v) as 1 | 2 | 3 | 4 | 5 | 6 })}
            options={[
              { value: '1', label: 'H1 (Page Title)' }, { value: '2', label: 'H2 (Section)' },
              { value: '3', label: 'H3 (Card)' }, { value: '4', label: 'H4' },
              { value: '5', label: 'H5' }, { value: '6', label: 'H6' },
            ]}
          />
          <StyleInput label="Text" value={element.content} onChange={(v) => updateEl({ content: v })} />
        </>
      )}

      {element.type === 'paragraph' && (
        <div className="wb-style-input">
          <label>Paragraph Text</label>
          <textarea className="wb-mini-textarea" rows={4} value={element.content} onChange={(e) => updateEl({ content: e.target.value })} />
        </div>
      )}

      {element.type === 'blockquote' && (
        <div className="wb-style-input">
          <label>Quote Text</label>
          <textarea className="wb-mini-textarea" rows={3} value={element.content} onChange={(e) => updateEl({ content: e.target.value })} />
        </div>
      )}

      {element.type === 'list' && (
        <>
          <SelectInput
            label="List Format"
            value={element.attributes.listTag ?? 'ul'}
            onChange={(v) => {
              const listStyleType = v === 'ol' ? 'decimal' : v === 'checklist' ? 'none' : 'disc';
              dispatch({
                type: 'UPDATE_ELEMENT',
                payload: {
                  elementId: element.id,
                  updates: {
                    attributes: { ...element.attributes, listTag: v },
                    styles: { ...element.styles, listStyleType },
                  },
                },
              });
            }}
            options={[
              { value: 'ul', label: 'Bulleted List (•)' },
              { value: 'ol', label: 'Numbered List (1.)' },
              { value: 'checklist', label: 'Checklist (✓)' },
            ]}
          />
          <div className="wb-style-input">
            <label>Items (one per line)</label>
            <textarea
              className="wb-mini-textarea"
              rows={5}
              value={listPlainText}
              onChange={(e) => {
                const html = e.target.value
                  .split('\n')
                  .map(line => `<li>${line}</li>`)
                  .join('');
                updateEl({ content: html });
              }}
            />
          </div>
        </>
      )}

      {element.type === 'code' && (
        <>
          <StyleInput label="Language" value={element.attributes.language ?? 'typescript'} onChange={(v) => updateAttr('language', v)} />
          <ToggleRow
            label="Show Copy Button"
            checked={element.attributes.showCopy !== 'false'}
            onChange={(c) => updateAttr('showCopy', c ? 'true' : 'false')}
          />
          <div className="wb-style-input">
            <label>Code</label>
            <textarea className="wb-css-textarea" rows={6} value={element.content} onChange={(e) => updateEl({ content: e.target.value })} />
          </div>
        </>
      )}

      {element.type === 'image' && (
        <>
          <StyleInput label="Image URL" value={element.content} onChange={(v) => updateEl({ content: v })} placeholder="https://..." />
          {assets.length > 0 && (
            <SelectInput
              label="Or Pick Uploaded Asset"
              value=""
              onChange={(v) => { if (v) updateEl({ content: v }); }}
              options={[{ value: '', label: 'Select from uploaded assets...' }, ...assets.map(a => ({ value: a.dataUrl, label: a.name }))]}
            />
          )}
          <SelectInput
            label="Or Pick Stock Photo"
            value=""
            onChange={(v) => { if (v) updateEl({ content: v }); }}
            options={[{ value: '', label: 'Browse curated stock photos...' }, ...STOCK_IMAGES.map(s => ({ value: s.url, label: `${s.category}: ${s.label}` }))]}
          />
          <StyleInput label="Alt Text (Accessibility)" value={element.attributes.alt ?? ''} onChange={(v) => updateAttr('alt', v)} placeholder="Descriptive image alt text" />
          <SelectInput
            label="Object Fit"
            value={element.styles.objectFit ?? 'cover'}
            onChange={(v) => dispatch({ type: 'UPDATE_ELEMENT_STYLES', payload: { elementId: element.id, styles: { objectFit: v } } })}
            options={[{ value: 'cover', label: 'Cover' }, { value: 'contain', label: 'Contain' }, { value: 'fill', label: 'Fill' }]}
          />
        </>
      )}

      {element.type === 'video' && (
        <>
          <StyleInput
            label="YouTube / Vimeo / Loom / Embed URL"
            value={element.content}
            onChange={(v) => updateEl({ content: normalizeVideoEmbedUrl(v) })}
            placeholder="https://youtube.com/watch?v=..."
          />
          <p className="wb-helper-note">Standard YouTube, Vimeo, and Loom URLs are automatically converted into embed URLs.</p>
        </>
      )}

      {(element.type === 'button' || element.type === 'link') && (
        <>
          <StyleInput label="Label Text" value={element.content} onChange={(v) => updateEl({ content: v })} />
          <SelectInput
            label="Link to Internal Page"
            value={element.attributes.href?.startsWith('page:') ? element.attributes.href : ''}
            onChange={(v) => { if (v) updateAttr('href', v); }}
            options={[
              { value: '', label: 'Custom URL / Anchor below' },
              ...pages.map(p => ({ value: `page:${p.id}`, label: `Page: ${p.title}` })),
            ]}
          />
          <StyleInput label="URL or #anchor" value={element.attributes.href ?? ''} onChange={(v) => updateAttr('href', v)} placeholder="https://... or #contact" />
          <SelectInput
            label="Open Target"
            value={element.attributes.target ?? ''}
            onChange={(v) => updateAttr('target', v)}
            options={[{ value: '', label: 'Same Window' }, { value: '_blank', label: 'New Tab' }]}
          />
        </>
      )}

      {element.type === 'icon' && (
        <IconPicker label="Icon" value={element.content} onChange={(v) => updateEl({ content: v })} />
      )}

      {element.type === 'badge' && (
        <>
          <StyleInput label="Badge Text" value={element.content} onChange={(v) => updateEl({ content: v })} />
          <SelectInput
            label="Variant"
            value={element.attributes.variant ?? 'soft'}
            onChange={(v) => updateAttr('variant', v)}
            options={[{ value: 'soft', label: 'Soft Accent' }, { value: 'solid', label: 'Solid Fill' }, { value: 'outline', label: 'Outlined' }]}
          />
          <IconPicker label="Icon" value={element.attributes.icon ?? ''} onChange={(v) => updateAttr('icon', v)} />
        </>
      )}

      {element.type === 'card' && (
        <>
          <StyleInput label="Title" value={element.attributes.title ?? ''} onChange={(v) => updateAttr('title', v)} />
          <div className="wb-style-input">
            <label>Description</label>
            <textarea className="wb-mini-textarea" rows={3} value={element.attributes.description ?? ''} onChange={(e) => updateAttr('description', e.target.value)} />
          </div>
          <IconPicker label="Card Icon (if no image)" value={element.attributes.icon ?? ''} onChange={(v) => updateAttr('icon', v)} />
          <StyleInput label="Header Image URL (optional)" value={element.attributes.imageUrl ?? ''} onChange={(v) => updateAttr('imageUrl', v)} placeholder="https://..." />
          <div className="wb-input-row">
            <StyleInput label="CTA Text" value={element.attributes.ctaText ?? ''} onChange={(v) => updateAttr('ctaText', v)} placeholder="Read more →" />
            <StyleInput label="CTA URL" value={element.attributes.ctaHref ?? ''} onChange={(v) => updateAttr('ctaHref', v)} placeholder="#" />
          </div>
        </>
      )}

      {element.type === 'accordion' && (
        <>
          <ToggleRow
            label="Allow Multiple Open"
            checked={element.attributes.allowMultiple === 'true'}
            onChange={(c) => updateAttr('allowMultiple', c ? 'true' : 'false')}
          />
          <AccordionEditor itemsJson={element.attributes.items ?? '[]'} onChange={(v) => updateAttr('items', v)} />
        </>
      )}

      {element.type === 'tabs' && (
        <>
          <SelectInput
            label="Tab Style"
            value={element.attributes.variant ?? 'underline'}
            onChange={(v) => updateAttr('variant', v)}
            options={[{ value: 'underline', label: 'Underline Tabs' }, { value: 'pills', label: 'Pill Switcher' }]}
          />
          <TabsEditor itemsJson={element.attributes.items ?? '[]'} onChange={(v) => updateAttr('items', v)} />
        </>
      )}

      {element.type === 'progress' && (
        <>
          <StyleInput label="Label" value={element.attributes.label ?? ''} onChange={(v) => updateAttr('label', v)} />
          <div className="wb-unit-slider">
            <div className="wb-unit-slider-head">
              <label>Percentage</label>
              <span className="wb-span-readout">{element.attributes.value ?? 75}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Number(element.attributes.value ?? 75)}
              onChange={(e) => updateAttr('value', e.target.value)}
            />
          </div>
          <ToggleRow
            label="Show Percentage Label"
            checked={element.attributes.showValue !== 'false'}
            onChange={(c) => updateAttr('showValue', c ? 'true' : 'false')}
          />
          <ThemeColorInput label="Bar Color" value={element.attributes.barColor ?? 'var(--site-accent)'} onChange={(v) => updateAttr('barColor', v)} />
        </>
      )}

      {element.type === 'alert' && (
        <>
          <SelectInput
            label="Alert Variant"
            value={element.attributes.variant ?? 'info'}
            onChange={(v) => updateAttr('variant', v)}
            options={[
              { value: 'info', label: 'Info (Blue)' },
              { value: 'success', label: 'Success (Green)' },
              { value: 'warning', label: 'Warning (Amber)' },
              { value: 'danger', label: 'Danger (Red)' },
            ]}
          />
          <StyleInput label="Title" value={element.attributes.title ?? ''} onChange={(v) => updateAttr('title', v)} />
          <div className="wb-style-input">
            <label>Message</label>
            <textarea className="wb-mini-textarea" rows={3} value={element.content} onChange={(e) => updateEl({ content: e.target.value })} />
          </div>
          <IconPicker label="Icon" value={element.attributes.icon ?? 'fas fa-circle-info'} onChange={(v) => updateAttr('icon', v)} />
        </>
      )}

      {element.type === 'stat' && (
        <>
          <StyleInput label="Metric Value" value={element.attributes.value ?? ''} onChange={(v) => updateAttr('value', v)} placeholder="99.9%" />
          <StyleInput label="Metric Label" value={element.attributes.label ?? ''} onChange={(v) => updateAttr('label', v)} placeholder="Uptime SLA" />
          <StyleInput label="Delta Badge" value={element.attributes.delta ?? ''} onChange={(v) => updateAttr('delta', v)} placeholder="+4.2%" />
          <ToggleRow
            label="Positive Delta Badge"
            checked={element.attributes.deltaPositive !== 'false'}
            onChange={(c) => updateAttr('deltaPositive', c ? 'true' : 'false')}
          />
        </>
      )}

      {element.type === 'table' && (
        <TableEditor tableJson={element.attributes.tableData ?? '{}'} onChange={(v) => updateAttr('tableData', v)} />
      )}

      {element.type === 'avatar' && (
        <>
          <StyleInput label="Avatar Image URL" value={element.attributes.imageUrl ?? ''} onChange={(v) => updateAttr('imageUrl', v)} />
          <StyleInput label="Person Name" value={element.attributes.name ?? ''} onChange={(v) => updateAttr('name', v)} />
          <StyleInput label="Role / Title" value={element.attributes.role ?? ''} onChange={(v) => updateAttr('role', v)} />
          <SelectInput
            label="Star Rating"
            value={element.attributes.rating ?? '5'}
            onChange={(v) => updateAttr('rating', v)}
            options={[
              { value: '0', label: 'No Stars' }, { value: '5', label: '5 Stars' },
              { value: '4', label: '4 Stars' }, { value: '3', label: '3 Stars' },
            ]}
          />
        </>
      )}

      {element.type === 'html' && (
        <div className="wb-style-input">
          <label>Custom HTML / SVG Markup</label>
          <textarea className="wb-css-textarea" rows={8} value={element.content} onChange={(e) => updateEl({ content: e.target.value })} />
        </div>
      )}

      {element.type === 'form' && (
        <>
          <StyleInput label="Form Action URL" value={element.attributes.action ?? ''} onChange={(v) => updateAttr('action', v)} placeholder="# or https://formspree.io/..." />
          <div className="wb-input-row">
            <SelectInput label="Method" value={element.attributes.method ?? 'POST'} onChange={(v) => updateAttr('method', v)} options={[
              { value: 'POST', label: 'POST' }, { value: 'GET', label: 'GET' },
            ]} />
            <StyleInput label="Button Text" value={element.attributes.submitText ?? ''} onChange={(v) => updateAttr('submitText', v)} placeholder="Send" />
          </div>
          <StyleInput label="Success Message" value={element.attributes.successMessage ?? ''} onChange={(v) => updateAttr('successMessage', v)} />
          <FormBuilderEditor fieldsJson={element.attributes.fields ?? '[]'} onChange={(v) => updateAttr('fields', v)} />
        </>
      )}

      {element.type === 'map' && (
        <>
          <StyleInput
            label="Location / Address"
            value={element.attributes.query ?? 'New York'}
            onChange={(v) => {
              const zoom = Number(element.attributes.zoom ?? 13);
              dispatch({
                type: 'UPDATE_ELEMENT',
                payload: {
                  elementId: element.id,
                  updates: {
                    content: buildGoogleMapsEmbedUrl(v, zoom),
                    attributes: { ...element.attributes, query: v },
                  },
                },
              });
            }}
            placeholder="Durham University, UK"
          />
          <StyleInput label="Raw Map Embed URL" value={element.content} onChange={(v) => updateEl({ content: v })} />
        </>
      )}

      {element.type === 'embed' && (
        <>
          <StyleInput label="Iframe Embed URL" value={element.content} onChange={(v) => updateEl({ content: v })} placeholder="https://..." />
          <StyleInput label="Iframe Title" value={element.attributes.title ?? ''} onChange={(v) => updateAttr('title', v)} placeholder="Interactive widget" />
        </>
      )}

      {element.type === 'social-links' && (
        <>
          <SelectInput
            label="Icon Style"
            value={element.attributes.variant ?? 'circle'}
            onChange={(v) => updateAttr('variant', v)}
            options={[
              { value: 'circle', label: 'Outlined Circles' },
              { value: 'filled', label: 'Accent Circles' },
              { value: 'pill', label: 'Pill Buttons' },
              { value: 'minimal', label: 'Minimal Icons' },
            ]}
          />
          <SocialLinksEditor linksJson={element.attributes.links ?? '[]'} onChange={(v) => updateAttr('links', v)} />
        </>
      )}

      <SectionTitle title="Metadata & Visibility" />
      <StyleInput label="Layer Name" value={element.name ?? ''} onChange={(v) => updateEl({ name: v })} placeholder={element.type} />
      <div className="wb-input-row">
        <StyleInput label="HTML ID" value={element.customId ?? ''} onChange={(v) => updateEl({ customId: v })} placeholder="hero-cta" />
        <StyleInput label="CSS Class" value={element.customClass ?? ''} onChange={(v) => updateEl({ customClass: v })} placeholder="custom-box" />
      </div>
      <ToggleRow label="Hidden" checked={element.hidden} onChange={(c) => updateEl({ hidden: c })} />
      <ToggleRow label="Locked" checked={element.locked} onChange={(c) => updateEl({ locked: c })} />
    </div>
  );
}

/* ========== Assets Tab (Uploads + Stock Gallery + One-Click Insert/Apply) ========== */

function AssetsTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const [stockCat, setStockCat] = useState<string>('All');
  const assets = Object.values(state.project.assets);
  const selectedEl = getSelectedElement(state);
  const storageKB = getStorageUsageKB();

  const processFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const asset = {
          id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: (file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'other') as 'image' | 'video' | 'other',
          dataUrl: reader.result as string,
          size: file.size,
          mimeType: file.type,
        };
        dispatch({ type: 'ADD_ASSET', payload: { asset } });
        showToast(dispatch, 'success', `Uploaded ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const applyOrInsertImage = (url: string, alt: string) => {
    if (selectedEl && selectedEl.type === 'image') {
      dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: selectedEl.id, updates: { content: url, attributes: { ...selectedEl.attributes, alt } } } });
      dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Update image' } });
      showToast(dispatch, 'success', 'Applied image to selected element');
      return;
    }
    const ctx = getElementContextIds(state);
    const colId = ctx.columnId;
    const el = createElement('image', { content: url, attributes: { alt } });
    if (colId) {
      dispatch({ type: 'ADD_ELEMENT', payload: { columnId: colId, element: el } });
    } else {
      const sec = createSection('Image Section');
      sec.rows[0].columns[0].elements.push(el);
      dispatch({ type: 'ADD_SECTION', payload: { section: sec } });
    }
    dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
    dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Insert image' } });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const stockCategories = ['All', 'Workspace', 'Abstract', 'Nature', 'Architecture', 'People', 'Culinary'];
  const filteredStock = stockCat === 'All' ? STOCK_IMAGES : STOCK_IMAGES.filter(s => s.category === stockCat);

  return (
    <div className="wb-tab-content">
      <SectionTitle title="Upload Media" />
      <label
        className="wb-upload-btn"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          processFiles(e.dataTransfer.files);
        }}
      >
        <Upload size={15} />
        <span>Click or Drop Images / Videos</span>
        <input type="file" accept="image/*,video/*" multiple onChange={(e) => { processFiles(e.target.files); e.target.value = ''; }} style={{ display: 'none' }} />
      </label>
      <div className="wb-storage-line">Local storage used: {storageKB} KB</div>

      {assets.length > 0 && (
        <>
          <SectionTitle title={`Project Assets (${assets.length})`} />
          <div className="wb-assets-grid">
            {assets.map(asset => (
              <div
                key={asset.id}
                className="wb-asset-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'sidebar-asset', assetId: asset.id }));
                  dispatch({ type: 'SET_DRAGGING', payload: { isDragging: true, data: { source: 'sidebar-asset', assetId: asset.id } } });
                }}
                onDragEnd={() => dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } })}
                onClick={() => asset.type === 'image' && applyOrInsertImage(asset.dataUrl, asset.name)}
                title={selectedEl?.type === 'image' ? 'Click to apply to selected image' : 'Click or drag to insert'}
              >
                {asset.type === 'image' ? (
                  <img src={asset.dataUrl} alt={asset.name} className="wb-asset-thumb" />
                ) : (
                  <div className="wb-asset-thumb wb-asset-video">▶</div>
                )}
                <div className="wb-asset-info">
                  <span className="wb-asset-name" title={asset.name}>{asset.name}</span>
                  <span className="wb-asset-size">{formatSize(asset.size)}</span>
                </div>
                <button
                  type="button"
                  className="wb-asset-delete"
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'DELETE_ASSET', payload: { assetId: asset.id } }); }}
                  title="Delete asset"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <SectionTitle title="Curated Stock Gallery" />
      <div className="wb-cat-pills" style={{ padding: 0, marginBottom: 8 }}>
        {stockCategories.map(cat => (
          <button
            key={cat}
            type="button"
            className={`wb-cat-pill ${stockCat === cat ? 'active' : ''}`}
            onClick={() => setStockCat(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="wb-assets-grid">
        {filteredStock.map(img => (
          <button
            key={img.id}
            type="button"
            className="wb-stock-item"
            onClick={() => applyOrInsertImage(img.url, img.label)}
            title={selectedEl?.type === 'image' ? `Apply "${img.label}" to selected image` : `Insert "${img.label}"`}
          >
            <img src={img.url} alt={img.label} className="wb-asset-thumb" loading="lazy" />
            <span>{img.label}</span>
          </button>
        ))}
      </div>

      <SectionTitle title="Site Favicon" />
      <label className="wb-upload-btn small">
        <Upload size={14} />
        <span>{state.project.settings.favicon ? 'Change Favicon' : 'Upload Favicon'}</span>
        <input
          type="file"
          accept="image/png,image/x-icon,image/svg+xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => dispatch({ type: 'UPDATE_SETTINGS', payload: { favicon: reader.result as string } });
            reader.readAsDataURL(file);
          }}
          style={{ display: 'none' }}
        />
      </label>
      {state.project.settings.favicon && (
        <div className="wb-favicon-preview">
          <img src={state.project.settings.favicon} alt="Favicon" width={28} height={28} />
          <span style={{ flex: 1, fontSize: 11, opacity: 0.7 }}>Favicon active</span>
          <button type="button" onClick={() => dispatch({ type: 'UPDATE_SETTINGS', payload: { favicon: null } })} title="Remove favicon">
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ========== Theme Tab (8 Presets, Tokens, Header Styles, Global CSS) ========== */

function ThemeTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const theme = state.project.theme;
  const settings = state.project.settings;

  const setTheme = (updates: Partial<typeof theme>) => {
    dispatch({ type: 'SET_THEME', payload: updates });
  };

  const setSettings = (updates: Partial<typeof settings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: updates });
  };

  return (
    <div className="wb-tab-content">
      <SectionTitle title="Curated Theme Presets" />
      <div className="wb-preset-grid">
        {THEME_PRESETS.map(preset => {
          const active = theme.presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className={`wb-preset-card ${active ? 'active' : ''}`}
              onClick={() => {
                dispatch({ type: 'APPLY_THEME_PRESET', payload: { preset } });
                dispatch({ type: 'SAVE_HISTORY', payload: { label: `Theme ${preset.name}` } });
                showToast(dispatch, 'success', `Applied "${preset.name}"`);
              }}
              title={preset.description}
            >
              <div className="wb-preset-swatches">
                <span style={{ background: preset.defaultMode === 'dark' ? preset.theme.dark.bg : preset.theme.light.bg }} />
                <span style={{ background: preset.theme.accent }} />
                <span style={{ background: preset.theme.accentSecondary || '#a855f7' }} />
              </div>
              <span className="wb-preset-name">{preset.name}</span>
            </button>
          );
        })}
      </div>

      <SectionTitle title="Brand & Typography" />
      <div className="wb-input-row">
        <ThemeColorInput label="Primary Accent" value={theme.accent} onChange={(v) => setTheme({ accent: v })} showTokens={false} />
        <ThemeColorInput label="Secondary" value={theme.accentSecondary ?? '#a855f7'} onChange={(v) => setTheme({ accentSecondary: v })} showTokens={false} />
      </div>
      <SelectInput label="Heading Font" value={theme.fonts.heading} onChange={(v) => setTheme({ fonts: { ...theme.fonts, heading: v } })} options={FONT_LIST.map(f => ({ value: f.name, label: f.name }))} />
      <SelectInput label="Body Font" value={theme.fonts.body} onChange={(v) => setTheme({ fonts: { ...theme.fonts, body: v } })} options={FONT_LIST.map(f => ({ value: f.name, label: f.name }))} />
      <div className="wb-input-row">
        <StyleInput label="Global Radius" value={theme.borderRadius} onChange={(v) => setTheme({ borderRadius: v })} placeholder="10px" />
        <StyleInput label="Container Max" value={theme.containerMaxWidth ?? '1200px'} onChange={(v) => setTheme({ containerMaxWidth: v })} placeholder="1200px" />
      </div>

      <SectionTitle title="Light Mode Palette" />
      <ThemeColorInput label="Background" value={theme.light.bg} onChange={(v) => setTheme({ light: { ...theme.light, bg: v } })} showTokens={false} />
      <ThemeColorInput label="Text" value={theme.light.text} onChange={(v) => setTheme({ light: { ...theme.light, text: v } })} showTokens={false} />
      <ThemeColorInput label="Surface" value={theme.light.surface} onChange={(v) => setTheme({ light: { ...theme.light, surface: v } })} showTokens={false} />
      <ThemeColorInput label="Border" value={theme.light.border} onChange={(v) => setTheme({ light: { ...theme.light, border: v } })} showTokens={false} />

      <SectionTitle title="Dark Mode Palette" />
      <ThemeColorInput label="Background" value={theme.dark.bg} onChange={(v) => setTheme({ dark: { ...theme.dark, bg: v } })} showTokens={false} />
      <ThemeColorInput label="Text" value={theme.dark.text} onChange={(v) => setTheme({ dark: { ...theme.dark, text: v } })} showTokens={false} />
      <ThemeColorInput label="Surface" value={theme.dark.surface} onChange={(v) => setTheme({ dark: { ...theme.dark, surface: v } })} showTokens={false} />
      <ThemeColorInput label="Border" value={theme.dark.border} onChange={(v) => setTheme({ dark: { ...theme.dark, border: v } })} showTokens={false} />

      <SectionTitle title="Header & Navigation" />
      <ToggleRow label="Show Header" checked={settings.headerEnabled} onChange={(c) => setSettings({ headerEnabled: c })} />
      {settings.headerEnabled && (
        <>
          <SelectInput
            label="Header Style"
            value={settings.headerStyle ?? 'glass'}
            onChange={(v) => setSettings({ headerStyle: v as HeaderStyle })}
            options={[
              { value: 'glass', label: 'Sticky Glass Blur' },
              { value: 'classic', label: 'Classic Solid' },
              { value: 'centered', label: 'Centered Stack' },
              { value: 'minimal', label: 'Minimal (No CTA)' },
            ]}
          />
          <ToggleRow label="Show Header CTA Button" checked={Boolean(settings.headerCtaEnabled)} onChange={(c) => setSettings({ headerCtaEnabled: c })} />
          {settings.headerCtaEnabled && (
            <div className="wb-input-row">
              <StyleInput label="CTA Label" value={settings.headerCtaText ?? 'Get Started'} onChange={(v) => setSettings({ headerCtaText: v })} />
              <StyleInput label="CTA Link" value={settings.headerCtaHref ?? '#contact'} onChange={(v) => setSettings({ headerCtaHref: v })} />
            </div>
          )}
        </>
      )}
      <ToggleRow label="Show Footer" checked={settings.footerEnabled} onChange={(c) => setSettings({ footerEnabled: c })} />
      <ToggleRow label="Export Theme Switcher Button" checked={settings.showThemeToggle !== false} onChange={(c) => setSettings({ showThemeToggle: c })} />

      <SectionTitle title="Site Metadata & Custom Code" />
      <StyleInput label="Site Name" value={settings.siteName} onChange={(v) => setSettings({ siteName: v })} />
      <StyleInput label="Google Analytics ID" value={settings.analyticsId} onChange={(v) => setSettings({ analyticsId: v })} placeholder="G-XXXXXXXXXX" />
      <div className="wb-style-input">
        <label>Global Custom CSS</label>
        <textarea
          className="wb-css-textarea"
          value={settings.globalCSS}
          onChange={(e) => setSettings({ globalCSS: e.target.value })}
          placeholder="/* Custom CSS rules applied everywhere */"
          rows={5}
        />
      </div>
      <div className="wb-style-input">
        <label>Custom &lt;head&gt; Tags (Export)</label>
        <textarea
          className="wb-css-textarea"
          value={settings.customHeadCode ?? ''}
          onChange={(e) => setSettings({ customHeadCode: e.target.value })}
          placeholder="<!-- Meta tags or external CSS -->"
          rows={3}
        />
      </div>
    </div>
  );
}
