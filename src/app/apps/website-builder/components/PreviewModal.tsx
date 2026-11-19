'use client';
// ============================================================
// Website Builder Pro — In-App Interactive Preview Modal
// ============================================================

import React, { useMemo, useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, Sun, Moon, ExternalLink, X } from 'lucide-react';
import type { BuilderState, BuilderAction, ViewportMode } from '../lib/types';
import { VIEWPORT_WIDTHS } from '../lib/types';
import { generatePreviewHTML } from '../lib/export';

interface PreviewModalProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

export default function PreviewModal({ state, dispatch }: PreviewModalProps) {
  if (!state.showPreview) return null;
  return <PreviewModalInner state={state} dispatch={dispatch} />;
}

function PreviewModalInner({ state, dispatch }: PreviewModalProps) {
  const [viewport, setViewport] = useState<ViewportMode>(state.viewportMode);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(state.canvasThemeMode);
  const [pageId, setPageId] = useState<string>(state.currentPageId);

  const close = () => dispatch({ type: 'SHOW_PREVIEW', payload: { show: false } });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = state.project.pageOrder.map(id => state.project.pages[id]).filter(Boolean);
  const html = useMemo(
    () => generatePreviewHTML(state.project, themeMode, pageId, true),
    [state.project, themeMode, pageId],
  );

  const openNewTab = () => {
    const fullHtml = generatePreviewHTML(state.project, themeMode, pageId, false);
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const frameWidth = viewport === 'desktop' ? '100%' : `${VIEWPORT_WIDTHS[viewport]}px`;

  return (
    <div className="wb-preview-overlay">
      <div className="wb-preview-topbar">
        <div className="wb-preview-brand">
          <span className="wb-logo-icon">◆</span>
          <span>{state.project.settings.siteName}</span>
          <span className="wb-preview-pill">Preview</span>
        </div>

        <div className="wb-preview-pages">
          {pages.map(p => (
            <button
              key={p.id}
              type="button"
              className={`wb-preview-page-btn ${pageId === p.id ? 'active' : ''}`}
              onClick={() => setPageId(p.id)}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="wb-preview-controls">
          <div className="wb-viewport-group">
            <button
              type="button"
              className={`wb-viewport-btn ${viewport === 'desktop' ? 'active' : ''}`}
              onClick={() => setViewport('desktop')}
              title="Desktop"
            >
              <Monitor size={15} />
            </button>
            <button
              type="button"
              className={`wb-viewport-btn ${viewport === 'tablet' ? 'active' : ''}`}
              onClick={() => setViewport('tablet')}
              title="Tablet (768px)"
            >
              <Tablet size={15} />
            </button>
            <button
              type="button"
              className={`wb-viewport-btn ${viewport === 'mobile' ? 'active' : ''}`}
              onClick={() => setViewport('mobile')}
              title="Mobile (375px)"
            >
              <Smartphone size={15} />
            </button>
          </div>

          <button
            type="button"
            className="wb-topbar-btn"
            onClick={() => setThemeMode(m => (m === 'light' ? 'dark' : 'light'))}
            title="Toggle Light / Dark"
          >
            {themeMode === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button type="button" className="wb-topbar-btn" onClick={openNewTab} title="Open in new tab">
            <ExternalLink size={15} />
            <span>New Tab</span>
          </button>

          <button type="button" className="wb-topbar-btn primary" onClick={close}>
            <X size={15} />
            <span>Back to Editor</span>
          </button>
        </div>
      </div>

      <div className="wb-preview-stage">
        <iframe
          key={`${pageId}-${themeMode}`}
          srcDoc={html}
          title="Site Preview"
          className="wb-preview-iframe"
          style={{ width: frameWidth }}
        />
      </div>
    </div>
  );
}
