'use client';
// ============================================================
// Website Builder Pro — Interactive Studio Canvas
// ============================================================

import React, { forwardRef, useImperativeHandle, useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type {
  BuilderState, BuilderAction, SectionNode, RowNode, ColumnNode,
  CanvasHandle, SelectionTarget,
} from '../lib/types';
import { VIEWPORT_WIDTHS } from '../lib/types';
import {
  stylesToReact, mergeResponsiveStyles, generateCanvasLiveCSS,
  getGoogleFontsUrl, collectUsedFonts, getShapeDividerSVG,
} from '../lib/css-engine';
import { createElement, createSection } from '../lib/defaults';
import { SECTION_TEMPLATES } from '../lib/templates';
import { cloneSection } from '../lib/reducer';
import CanvasElement from './CanvasElement';

interface CanvasProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

const QUICK_ADD_KEYS: { key: string; label: string }[] = [
  { key: 'hero', label: 'Hero' },
  { key: 'heroSplit', label: 'Split Hero' },
  { key: 'features', label: 'Features' },
  { key: 'bentoGrid', label: 'Bento Grid' },
  { key: 'stats', label: 'Stats' },
  { key: 'testimonialsGrid', label: 'Reviews' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'faqAccordion', label: 'FAQ' },
  { key: 'cta', label: 'CTA Banner' },
  { key: 'contact', label: 'Contact' },
  { key: 'twoColBlank', label: '2-Col Blank' },
];

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas({ state, dispatch }, ref) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [quickAddIndex, setQuickAddIndex] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number>(0);

  const page = state.project.pages[state.currentPageId] ?? null;
  const theme = state.project.theme;
  const mode = state.canvasThemeMode;
  const colors = mode === 'light' ? theme.light : theme.dark;

  useImperativeHandle(ref, () => ({
    scrollToElement: (elementId: string) => {
      const el = pageRef.current?.querySelector(`[data-builder-id="${elementId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }));

  const handleCanvasClick = useCallback(() => {
    setQuickAddIndex(null);
    dispatch({ type: 'DESELECT' });
  }, [dispatch]);

  const handleContextMenu = useCallback(
    (x: number, y: number, targetId: string, targetType: SelectionTarget) => {
      dispatch({ type: 'SET_CONTEXT_MENU', payload: { menu: { x, y, targetId, targetType } } });
    },
    [dispatch],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  }, [dispatch]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleSectionDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData('text/plain');
    try {
      const parsed = JSON.parse(raw);
      if (parsed.source === 'canvas-section' && parsed.sectionId) {
        dispatch({ type: 'REORDER_SECTION', payload: { sectionId: parsed.sectionId, targetIndex: index } });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Reorder section' } });
      } else if (parsed.source === 'sidebar-element' && parsed.elementType) {
        const sec = createSection('Section');
        const el = createElement(parsed.elementType);
        sec.rows[0].columns[0].elements.push(el);
        dispatch({ type: 'ADD_SECTION', payload: { section: sec, index } });
        dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${el.type}` } });
      } else if (parsed.source === 'sidebar-section' && parsed.sectionData) {
        const sec = cloneSection(JSON.parse(parsed.sectionData) as SectionNode);
        dispatch({ type: 'ADD_SECTION', payload: { section: sec, index } });
        dispatch({ type: 'SELECT', payload: { id: sec.id, target: 'section' } });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${sec.name}` } });
      } else if (parsed.source === 'sidebar-asset' && parsed.assetId) {
        const asset = state.project.assets[parsed.assetId];
        if (asset && asset.type === 'image') {
          const sec = createSection('Image Section');
          const el = createElement('image', { content: asset.dataUrl, attributes: { alt: asset.name } });
          sec.rows[0].columns[0].elements.push(el);
          dispatch({ type: 'ADD_SECTION', payload: { section: sec, index } });
          dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
          dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Insert image' } });
        }
      }
    } catch { /* ignore invalid drops */ }
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  }, [dispatch, state.project.assets]);

  const handleColumnDrop = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const raw = e.dataTransfer.getData('text/plain');
    try {
      const parsed = JSON.parse(raw);
      if (parsed.source === 'canvas' && parsed.elementId) {
        dispatch({ type: 'MOVE_ELEMENT_TO', payload: { elementId: parsed.elementId, targetColumnId: columnId } });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Move element' } });
      } else if (parsed.source === 'sidebar-element' && parsed.elementType) {
        const el = createElement(parsed.elementType);
        dispatch({ type: 'ADD_ELEMENT', payload: { columnId, element: el } });
        dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${el.type}` } });
      } else if (parsed.source === 'sidebar-asset' && parsed.assetId) {
        const asset = state.project.assets[parsed.assetId];
        if (asset && asset.type === 'image') {
          const el = createElement('image', { content: asset.dataUrl, attributes: { alt: asset.name } });
          dispatch({ type: 'ADD_ELEMENT', payload: { columnId, element: el } });
          dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
          dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Insert image' } });
        }
      }
    } catch { /* ignore */ }
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  }, [dispatch, state.project.assets]);

  const liveCSS = useMemo(
    () => generateCanvasLiveCSS(state.project, page),
    [state.project, page],
  );

  const fontsUrl = useMemo(() => {
    const used = collectUsedFonts(state.project);
    return getGoogleFontsUrl(theme, used);
  }, [state.project, theme]);

  // Manage Font Awesome & Google Fonts cleanly in document.head
  useEffect(() => {
    let faLink = document.getElementById('wb-fa-css') as HTMLLinkElement | null;
    if (!faLink) {
      faLink = document.createElement('link');
      faLink.id = 'wb-fa-css';
      faLink.rel = 'stylesheet';
      faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
      document.head.appendChild(faLink);
    }
    return () => {
      document.getElementById('wb-fa-css')?.remove();
    };
  }, []);

  useEffect(() => {
    const existing = document.getElementById('wb-gfonts-css') as HTMLLinkElement | null;
    if (!fontsUrl) {
      existing?.remove();
      return;
    }
    if (existing) {
      if (existing.href !== fontsUrl) existing.href = fontsUrl;
    } else {
      const link = document.createElement('link');
      link.id = 'wb-gfonts-css';
      link.rel = 'stylesheet';
      link.href = fontsUrl;
      document.head.appendChild(link);
    }
  }, [fontsUrl]);

  useEffect(() => {
    return () => {
      document.getElementById('wb-gfonts-css')?.remove();
    };
  }, []);

  // Measure rendered page height so zoomed canvas wrapper keeps accurate scroll bounds
  useEffect(() => {
    const el = pageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        setPageHeight((prev) => (Math.abs(prev - h) < 1 ? prev : h));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [page?.id]);

  if (!page) {
    return <div className="wb-canvas-empty">No page selected</div>;
  }

  const vpWidth = VIEWPORT_WIDTHS[state.viewportMode];
  const isFluidDesktop = state.viewportMode === 'desktop' && state.zoom === 1;

  const themeVars: React.CSSProperties = {
    '--site-bg': colors.bg,
    '--site-text': colors.text,
    '--site-surface': colors.surface,
    '--site-border': colors.border,
    '--site-accent': theme.accent,
    '--site-accent-2': theme.accentSecondary || '#a855f7',
    '--site-container': theme.containerMaxWidth || '1200px',
    '--font-heading': `'${theme.fonts.heading}', sans-serif`,
    '--font-body': `'${theme.fonts.body}', sans-serif`,
    '--radius': theme.borderRadius,
  } as React.CSSProperties;

  const insertQuickSection = (key: string, atIndex: number) => {
    const sec = key === '__blank'
      ? createSection('Blank Section')
      : SECTION_TEMPLATES[key]?.create() ?? createSection('Section');
    dispatch({ type: 'ADD_SECTION', payload: { section: sec, index: atIndex } });
    dispatch({ type: 'SELECT', payload: { id: sec.id, target: 'section' } });
    dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${sec.name}` } });
    setQuickAddIndex(null);
  };

  const renderHeader = () => {
    const headerSection = state.project.header;
    const isSelected = state.selection?.id === headerSection.id && state.selection?.target === 'section';
    const headerStyleMode = state.project.settings.headerStyle || 'glass';
    const pages = state.project.pageOrder.map(pid => state.project.pages[pid]).filter(p => p && !p.hidden);

    const headerStyles: React.CSSProperties = {
      ...stylesToReact(headerSection.styles),
      position: 'relative',
      cursor: 'pointer',
      backgroundColor: headerStyleMode === 'glass' ? 'color-mix(in srgb, var(--site-bg) 82%, transparent)' : headerSection.styles.backgroundColor,
      backdropFilter: headerStyleMode === 'glass' ? 'blur(14px)' : undefined,
    };

    return (
      <div
        key={headerSection.id}
        data-builder-id={headerSection.id}
        className={`wb-canvas-section ${isSelected ? 'selected' : ''}`}
        style={headerStyles}
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: 'SELECT', payload: { id: headerSection.id, target: 'section' } });
        }}
      >
        <div className="wb-section-label">Header ({headerStyleMode})</div>
        <div
          style={{
            maxWidth: 'var(--site-container, 1200px)',
            margin: '0 auto',
            padding: '0 1.5rem',
            display: 'flex',
            flexDirection: headerStyleMode === 'centered' ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: headerStyleMode === 'centered' ? '0.65rem' : '1rem',
          }}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            {state.project.settings.siteName || state.project.name}
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {pages.map(p => {
              const active = p.id === state.currentPageId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SET_CURRENT_PAGE', payload: { pageId: p.id } });
                  }}
                  style={{
                    background: active ? 'var(--site-accent)' : 'none',
                    color: active ? '#fff' : 'inherit',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius, 8px)',
                    cursor: 'pointer',
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    opacity: active ? 1 : 0.78,
                  }}
                >
                  {p.title}
                </button>
              );
            })}
            {state.project.settings.headerCtaEnabled && headerStyleMode !== 'minimal' && state.viewportMode !== 'mobile' && (
              <span
                style={{
                  marginLeft: '0.5rem',
                  padding: '6px 16px',
                  background: 'var(--site-accent)',
                  color: '#fff',
                  borderRadius: 'var(--radius, 8px)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                {state.project.settings.headerCtaText || 'Get Started'}
              </span>
            )}
          </nav>
        </div>
      </div>
    );
  };

  const renderColumn = (col: ColumnNode) => {
    const isColSelected = state.selection?.id === col.id && state.selection?.target === 'column';
    const colStyle: React.CSSProperties = {
      ...stylesToReact(col.styles),
      gridColumn: `span ${col.span}`,
      minWidth: 0,
      minHeight: '44px',
    };

    return (
      <div
        key={col.id}
        data-builder-id={col.id}
        data-span={col.span}
        className={`wb-canvas-col ${state.isDragging ? 'drop-active' : ''} ${isColSelected ? 'col-selected' : ''}`}
        style={colStyle}
        onDrop={(e) => handleColumnDrop(e, col.id)}
        onDragOver={handleDragOver}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.stopPropagation();
            dispatch({ type: 'SELECT', payload: { id: col.id, target: 'column' } });
          }
        }}
      >
        <button
          type="button"
          className="wb-col-pill"
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'SELECT', payload: { id: col.id, target: 'column' } });
          }}
          title="Select column to adjust width & style"
        >
          Col {col.span}/12
        </button>

        {col.elements.length === 0 && (
          <div className="wb-col-empty">Drop elements here</div>
        )}

        {col.elements.map((element, elIdx) => (
          <CanvasElement
            key={element.id}
            element={element}
            selectedId={state.selection?.id ?? null}
            editingId={state.editingElementId}
            hoveredId={state.hoveredId}
            viewportMode={state.viewportMode}
            columnId={col.id}
            index={elIdx}
            isDragging={state.isDragging}
            assets={state.project.assets}
            dispatch={dispatch}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>
    );
  };

  const renderRow = (row: RowNode) => {
    const rowStyle: React.CSSProperties = {
      ...stylesToReact(row.styles),
    };
    return (
      <div key={row.id} data-builder-id={row.id} className="wb-canvas-row" style={rowStyle}>
        {row.columns.map(renderColumn)}
      </div>
    );
  };

  const renderSectionBlock = (section: SectionNode, context: 'footer' | 'page') => {
    const isSelected = state.selection?.id === section.id && state.selection?.target === 'section';
    const isHovered = state.hoveredId === section.id;
    const mergedSecStyles = mergeResponsiveStyles(section.styles, section.responsiveStyles, state.viewportMode);
    const sectionStyles: React.CSSProperties = {
      ...stylesToReact(mergedSecStyles),
      position: 'relative',
      opacity: section.hidden ? 0.35 : undefined,
      cursor: 'pointer',
    };

    const topSvg = getShapeDividerSVG(section.shapeDividerTop, false);
    const bottomSvg = getShapeDividerSVG(section.shapeDividerBottom, true);

    return (
      <div
        key={section.id}
        data-builder-id={section.id}
        className={`wb-canvas-section ${isSelected ? 'selected' : ''} ${isHovered && !isSelected ? 'hovered' : ''}`}
        style={sectionStyles}
        draggable={context === 'page' && !section.locked && !state.editingElementId}
        onDragStart={(e) => {
          if (context !== 'page' || section.locked || state.editingElementId) return;
          e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'canvas-section', sectionId: section.id }));
          dispatch({ type: 'SET_DRAGGING', payload: { isDragging: true, data: { source: 'canvas-section', sectionId: section.id } } });
        }}
        onDragEnd={() => dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } })}
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: 'SELECT', payload: { id: section.id, target: 'section' } });
        }}
        onMouseEnter={() => { if (!state.editingElementId) dispatch({ type: 'SET_HOVERED', payload: { id: section.id } }); }}
        onMouseLeave={() => { if (!state.editingElementId) dispatch({ type: 'SET_HOVERED', payload: { id: null } }); }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dispatch({ type: 'SELECT', payload: { id: section.id, target: 'section' } });
          handleContextMenu(e.clientX, e.clientY, section.id, 'section');
        }}
      >
        <div className="wb-section-label">
          {section.name}{section.hidden ? ' (Hidden)' : ''}
        </div>

        {section.backgroundOverlay && (
          <div className="wb-section-overlay" style={{ background: section.backgroundOverlay }} />
        )}

        {topSvg && (
          <div
            className="wb-shape-divider top"
            style={{ color: section.shapeDividerColor || 'var(--site-bg)' }}
            dangerouslySetInnerHTML={{ __html: topSvg }}
          />
        )}

        <div
          className="wb-section-inner"
          style={{
            maxWidth: section.fullBleed ? '100%' : 'var(--site-container, 1200px)',
            margin: '0 auto',
            padding: section.fullBleed ? '0' : '0 1.5rem',
          }}
        >
          {section.rows.map(renderRow)}
        </div>

        {bottomSvg && (
          <div
            className="wb-shape-divider bottom"
            style={{ color: section.shapeDividerColor || 'var(--site-bg)' }}
            dangerouslySetInnerHTML={{ __html: bottomSvg }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="wb-canvas" onClick={handleCanvasClick}>
      <style dangerouslySetInnerHTML={{ __html: liveCSS }} />

      <div
        className="wb-canvas-zoom-wrap"
        style={{
          width: isFluidDesktop ? '100%' : Math.round(vpWidth * state.zoom),
          maxWidth: isFluidDesktop ? vpWidth : undefined,
          height: state.zoom !== 1 && pageHeight > 0 ? Math.ceil(pageHeight * state.zoom) : undefined,
          minHeight: state.zoom === 1 ? '100%' : undefined,
          transition: 'width 0.25s ease',
        }}
      >
        <div
          className={`wb-canvas-viewport ${state.showOutlines ? 'wb-show-outlines' : ''}`}
          data-viewport={state.viewportMode}
          style={{
            width: isFluidDesktop ? '100%' : vpWidth,
            transform: state.zoom !== 1 ? `scale(${state.zoom})` : undefined,
            transformOrigin: 'top left',
            transition: 'width 0.3s ease, transform 0.2s ease',
          }}
        >
          <div
            ref={pageRef}
            className="wb-canvas-page"
            style={{
              ...themeVars,
              backgroundColor: 'var(--site-bg)',
              color: 'var(--site-text)',
              fontFamily: 'var(--font-body)',
              minHeight: '100vh',
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {state.showGridOverlay && (
              <div className="wb-grid-overlay" aria-hidden="true">
                <div className="wb-grid-overlay-inner">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="wb-grid-overlay-col" />
                  ))}
                </div>
              </div>
            )}

            {state.project.settings.headerEnabled && renderHeader()}

            <SectionDividerZone
              index={0}
              isDragging={state.isDragging}
              isOpen={quickAddIndex === 0}
              onToggleQuickAdd={() => setQuickAddIndex(q => (q === 0 ? null : 0))}
              onQuickInsert={(k) => insertQuickSection(k, 0)}
              onDrop={handleSectionDrop}
            />

            {page.sections.map((section, idx) => (
              <React.Fragment key={section.id}>
                {renderSectionBlock(section, 'page')}
                <SectionDividerZone
                  index={idx + 1}
                  isDragging={state.isDragging}
                  isOpen={quickAddIndex === idx + 1}
                  openUpward={idx === page.sections.length - 1}
                  onToggleQuickAdd={() => setQuickAddIndex(q => (q === idx + 1 ? null : idx + 1))}
                  onQuickInsert={(k) => insertQuickSection(k, idx + 1)}
                  onDrop={handleSectionDrop}
                />
              </React.Fragment>
            ))}

            {page.sections.length === 0 && (
              <div className="wb-canvas-empty-page">
                <div className="wb-empty-icon"><i className="fas fa-plus-circle" /></div>
                <p>Drop a section here or click the + Add Section bar above</p>
                <button
                  type="button"
                  className="wb-empty-cta"
                  onClick={(e) => { e.stopPropagation(); insertQuickSection('hero', 0); }}
                >
                  <Plus size={14} /> Add Hero Section
                </button>
              </div>
            )}

            {state.project.settings.footerEnabled && renderSectionBlock(state.project.footer, 'footer')}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ========== Section Divider / Quick-Add & Drop Zone ========== */

function SectionDividerZone({
  index,
  isDragging,
  isOpen,
  openUpward = false,
  onToggleQuickAdd,
  onQuickInsert,
  onDrop,
}: {
  index: number;
  isDragging: boolean;
  isOpen: boolean;
  openUpward?: boolean;
  onToggleQuickAdd: () => void;
  onQuickInsert: (key: string) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}) {
  const [over, setOver] = useState(false);

  if (isDragging) {
    return (
      <div
        className={`wb-drop-zone ${over ? 'active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { setOver(false); onDrop(e, index); }}
      />
    );
  }

  return (
    <div className={`wb-sec-insert-line ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="wb-sec-insert-btn"
        onClick={onToggleQuickAdd}
        title="Insert section here"
      >
        <Plus size={12} />
        <span>Add Section</span>
      </button>

      {isOpen && (
        <div className={`wb-quick-add-pop ${openUpward ? 'upward' : ''}`}>
          {QUICK_ADD_KEYS.map(item => (
            <button key={item.key} type="button" onClick={() => onQuickInsert(item.key)}>
              {item.label}
            </button>
          ))}
          <button type="button" onClick={() => onQuickInsert('__blank')}>Blank</button>
        </div>
      )}
    </div>
  );
}

export default Canvas;
