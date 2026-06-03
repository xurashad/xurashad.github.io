'use client';
// ============================================================
// Website Builder Pro — Canvas
// ============================================================

import React, { forwardRef, useImperativeHandle, useRef, useCallback, useEffect } from 'react';
import type { BuilderState, BuilderAction, SectionNode, RowNode, ColumnNode, CanvasHandle } from '../lib/types';
import { VIEWPORT_WIDTHS } from '../lib/types';
import { stylesToReact } from '../lib/css-engine';
import CanvasElement from './CanvasElement';
import { createElement, createSection } from '../lib/defaults';

interface CanvasProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas({ state, dispatch }, ref) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const page = state.project.pages[state.currentPageId];
  const theme = state.project.theme;
  const mode = state.canvasThemeMode;
  const colors = mode === 'light' ? theme.light : theme.dark;

  useImperativeHandle(ref, () => ({
    scrollToElement: (elementId: string) => {
      const el = canvasRef.current?.querySelector(`[data-builder-id="${elementId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
  }));

  const handleCanvasClick = useCallback(() => {
    dispatch({ type: 'DESELECT' });
  }, [dispatch]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  }, [dispatch]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Handle section drop
  const handleSectionDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData('text/plain');
    try {
      const parsed = JSON.parse(data);
      if (parsed.source === 'sidebar-element') {
        // Create a new section with the element
        const sec = createSection('Section');
        const el = createElement(parsed.elementType);
        sec.rows[0].columns[0].elements.push(el);
        dispatch({ type: 'ADD_SECTION', payload: { section: sec, index } });
        dispatch({ type: 'SAVE_HISTORY' });
      } else if (parsed.source === 'sidebar-section' && parsed.sectionData) {
        // Section template data passed via drag
        const sec = JSON.parse(parsed.sectionData) as SectionNode;
        dispatch({ type: 'ADD_SECTION', payload: { section: sec, index } });
        dispatch({ type: 'SAVE_HISTORY' });
      }
    } catch { /* ignore invalid drops */ }
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  }, [dispatch]);

  // Handle element drop on a column
  const handleColumnDrop = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const data = e.dataTransfer.getData('text/plain');
    try {
      const parsed = JSON.parse(data);
      if (parsed.source === 'sidebar-element') {
        const el = createElement(parsed.elementType);
        dispatch({ type: 'ADD_ELEMENT', payload: { columnId, element: el } });
        dispatch({ type: 'SAVE_HISTORY' });
        dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
      } else if (parsed.source === 'sidebar-asset') {
        const asset = state.project.assets[parsed.assetId];
        if (asset && asset.type === 'image') {
          const el = createElement('image', { content: asset.dataUrl });
          dispatch({ type: 'ADD_ELEMENT', payload: { columnId, element: el } });
          dispatch({ type: 'SAVE_HISTORY' });
        }
      }
    } catch { /* ignore */ }
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  }, [dispatch, state.project.assets]);

  const vpWidth = VIEWPORT_WIDTHS[state.viewportMode];

  const themeVars: React.CSSProperties = {
    '--site-bg': colors.bg,
    '--site-text': colors.text,
    '--site-surface': colors.surface,
    '--site-border': colors.border,
    '--site-accent': theme.accent,
    '--font-heading': `'${theme.fonts.heading}', sans-serif`,
    '--font-body': `'${theme.fonts.body}', sans-serif`,
    '--radius': theme.borderRadius,
  } as React.CSSProperties;

  // Render a dynamic header that always matches the page list
  const renderHeader = () => {
    const headerSection = state.project.header;
    const isSelected = state.selection?.id === headerSection.id && state.selection?.target === 'section';
    const headerStyles: React.CSSProperties = {
      ...stylesToReact(headerSection.styles),
      position: 'relative' as const,
      cursor: 'pointer',
    };

    // Build page list from pageOrder
    const pages = state.project.pageOrder
      .map(pid => state.project.pages[pid])
      .filter(p => p && !p.hidden);

    return (
      <div
        key={headerSection.id}
        data-builder-id={headerSection.id}
        className={`wb-canvas-section ${isSelected ? 'selected' : ''}`}
        style={headerStyles}
        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT', payload: { id: headerSection.id, target: 'section' } }); }}
      >
        <div className="wb-section-label">Header (Auto-Nav)</div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Site name / logo */}
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem' }}>
            {state.project.settings.siteName || state.project.name}
          </div>
          {/* Dynamic nav links from pageOrder */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {pages.map(p => (
              <button
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'SET_CURRENT_PAGE', payload: { pageId: p.id } });
                }}
                style={{
                  background: p.id === state.currentPageId ? 'var(--site-accent)' : 'none',
                  color: p.id === state.currentPageId ? '#fff' : 'inherit',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius, 6px)',
                  cursor: 'pointer',
                  fontWeight: p.id === state.currentPageId ? 600 : 500,
                  fontSize: '0.9rem',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s ease',
                  opacity: p.id === state.currentPageId ? 1 : 0.75,
                }}
              >
                {p.title}
              </button>
            ))}
          </nav>
        </div>
      </div>
    );
  };

  const renderSectionBlock = (section: SectionNode, idx: number, context: 'header' | 'footer' | 'page') => {
    const isSelected = state.selection?.id === section.id && state.selection?.target === 'section';
    const sectionStyles: React.CSSProperties = {
      ...stylesToReact(section.styles),
      position: 'relative',
      outline: isSelected ? '2px solid #6366f1' : undefined,
      cursor: 'pointer',
    };

    return (
      <div
        key={section.id}
        data-builder-id={section.id}
        className={`wb-canvas-section ${isSelected ? 'selected' : ''}`}
        style={sectionStyles}
        onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SELECT', payload: { id: section.id, target: 'section' } }); }}
      >
        {/* Section label */}
        <div className="wb-section-label">{section.name}</div>

        <div className="wb-section-inner" style={{ maxWidth: section.fullBleed ? '100%' : '1200px', margin: '0 auto', padding: section.fullBleed ? '0' : '0 1.5rem' }}>
          {section.rows.map((row) => renderRow(row, section.id))}
        </div>
      </div>
    );
  };

  const renderRow = (row: RowNode, sectionId: string) => {
    const rowStyle: React.CSSProperties = {
      ...stylesToReact(row.styles),
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '1.5rem',
      width: '100%',
    };

    return (
      <div key={row.id} data-builder-id={row.id} className="wb-canvas-row" style={rowStyle}>
        {row.columns.map((col) => renderColumn(col, sectionId))}
      </div>
    );
  };

  const renderColumn = (col: ColumnNode, sectionId: string) => {
    const colStyle: React.CSSProperties = {
      ...stylesToReact(col.styles),
      gridColumn: `span ${col.span}`,
      minWidth: 0,
      minHeight: '40px',
    };

    return (
      <div
        key={col.id}
        data-builder-id={col.id}
        className={`wb-canvas-col ${state.isDragging ? 'drop-active' : ''}`}
        style={colStyle}
        onDrop={(e) => handleColumnDrop(e, col.id)}
        onDragOver={handleDragOver}
      >
        {col.elements.length === 0 && (
          <div className="wb-col-empty">
            Drop elements here
          </div>
        )}
        {col.elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={state.selection?.id === element.id}
            isEditing={state.editingElementId === element.id}
            dispatch={dispatch}
          />
        ))}
      </div>
    );
  };

  if (!page) {
    return <div className="wb-canvas-empty">No page selected</div>;
  }

  return (
    <div className="wb-canvas" onClick={handleCanvasClick}>
      {/* External resources for preview */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
      />
      {theme.fonts.heading !== 'System UI' || theme.fonts.body !== 'System UI' ? (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${theme.fonts.heading.replace(/ /g, '+')}:wght@300;400;500;600;700;800;900&family=${theme.fonts.body.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`}
        />
      ) : null}

      <div
        className="wb-canvas-viewport"
        style={{ width: vpWidth, transition: 'width 0.3s ease' }}
      >
        <div
          ref={canvasRef}
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
          {/* Dynamic Header — always reflects actual page list */}
          {state.project.settings.headerEnabled && renderHeader()}

          {/* Drop zone at top */}
          <DropZone index={0} onDrop={handleSectionDrop} isDragging={state.isDragging} />

          {/* Page sections */}
          {page.sections.map((section, idx) => (
            <React.Fragment key={section.id}>
              {renderSectionBlock(section, idx, 'page')}
              <DropZone index={idx + 1} onDrop={handleSectionDrop} isDragging={state.isDragging} />
            </React.Fragment>
          ))}

          {/* Empty page state */}
          {page.sections.length === 0 && (
            <div className="wb-canvas-empty-page">
              <div className="wb-empty-icon">
                <i className="fas fa-plus-circle"></i>
              </div>
              <p>Drag elements or sections from the sidebar to start building</p>
            </div>
          )}

          {/* Footer */}
          {state.project.settings.footerEnabled && renderSectionBlock(state.project.footer, 999, 'footer')}
        </div>
      </div>
    </div>
  );
});

/* ========== Drop Zone Component ========== */

function DropZone({ index, onDrop, isDragging }: {
  index: number;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragging: boolean;
}) {
  const [over, setOver] = React.useState(false);

  if (!isDragging) return <div style={{ height: '2px' }} />;

  return (
    <div
      className={`wb-drop-zone ${over ? 'active' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { setOver(false); onDrop(e, index); }}
    />
  );
}

export default Canvas;
