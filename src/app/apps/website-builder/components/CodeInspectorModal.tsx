'use client';
// ============================================================
// Website Builder Pro — Live Code Inspector & Exporter
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { X, Copy, Check, Download, FileCode, Package } from 'lucide-react';
import type { BuilderState, BuilderAction } from '../lib/types';
import {
  generatePageHTML,
  generateSiteJS,
  generateSinglePageStandaloneHTML,
  getPageFilePath,
} from '../lib/export';
import { generateBaseCSS } from '../lib/css-engine';
import { showToast } from '../lib/reducer';

interface CodeInspectorModalProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  onExportZip: () => void;
}

export default function CodeInspectorModal({ state, dispatch, onExportZip }: CodeInspectorModalProps) {
  if (!state.showCodeModal) return null;
  return <CodeInspectorInner state={state} dispatch={dispatch} onExportZip={onExportZip} />;
}

function CodeInspectorInner({ state, dispatch, onExportZip }: CodeInspectorModalProps) {
  const [tab, setTab] = useState<'html' | 'css' | 'js'>('html');
  const [copied, setCopied] = useState(false);

  const close = () => dispatch({ type: 'SHOW_CODE_MODAL', payload: { show: false } });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const page = state.project.pages[state.currentPageId];

  const htmlCode = useMemo(() => {
    if (!page) return '';
    return generatePageHTML(state.project, page, 'style.css', 'script.js');
  }, [state.project, page]);

  const cssCode = useMemo(() => generateBaseCSS(state.project.theme), [state.project.theme]);
  const jsCode = useMemo(() => generateSiteJS(), []);

  const activeCode = tab === 'html' ? htmlCode : tab === 'css' ? cssCode : jsCode;
  const activeFilename = tab === 'html'
    ? (page ? getPageFilePath(page, state.project.pages) : 'index.html')
    : tab === 'css'
      ? 'style.css'
      : 'script.js';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast(dispatch, 'error', 'Failed to copy to clipboard');
    }
  };

  const handleDownloadSingleHTML = () => {
    if (!page) return;
    const standalone = generateSinglePageStandaloneHTML(state.project, page, state.canvasThemeMode);
    const blob = new Blob([standalone], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.slug || 'index'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(dispatch, 'success', `Downloaded ${page.slug || 'index'}.html`);
  };

  return (
    <div className="wb-modal-overlay" onClick={close}>
      <div className="wb-modal wb-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="wb-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileCode size={18} style={{ color: 'var(--wb-accent)' }} />
            <h2>Code Inspector & Export</h2>
          </div>
          <button type="button" className="wb-modal-close" onClick={close}><X size={18} /></button>
        </div>

        <div className="wb-code-toolbar">
          <div className="wb-code-tabs">
            <button type="button" className={tab === 'html' ? 'active' : ''} onClick={() => setTab('html')}>
              HTML ({page?.slug || 'index'}.html)
            </button>
            <button type="button" className={tab === 'css' ? 'active' : ''} onClick={() => setTab('css')}>
              CSS (style.css)
            </button>
            <button type="button" className={tab === 'js' ? 'active' : ''} onClick={() => setTab('js')}>
              JS (script.js)
            </button>
          </div>
          <div className="wb-code-actions">
            <button type="button" className="wb-pm-btn" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : `Copy ${activeFilename}`}</span>
            </button>
            <button type="button" className="wb-pm-btn" onClick={handleDownloadSingleHTML}>
              <Download size={14} />
              <span>Single HTML</span>
            </button>
            <button type="button" className="wb-pm-btn primary" onClick={() => { close(); onExportZip(); }}>
              <Package size={14} />
              <span>Export ZIP</span>
            </button>
          </div>
        </div>

        <div className="wb-code-viewer">
          <pre><code>{activeCode}</code></pre>
        </div>
      </div>
    </div>
  );
}
