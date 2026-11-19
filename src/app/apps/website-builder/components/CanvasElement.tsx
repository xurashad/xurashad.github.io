'use client';
/* eslint-disable @next/next/no-img-element */
// ============================================================
// Website Builder Pro — Canvas Element Renderer (27 Elements)
// ============================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type {
  ElementNode, BuilderAction, ViewportMode, SelectionTarget,
  AssetData, FormField, AccordionItem, TabItem, SocialLinkItem, TableData,
} from '../lib/types';
import { createElement } from '../lib/defaults';
import { stylesToReact, mergeResponsiveStyles, normalizeVideoEmbedUrl } from '../lib/css-engine';

interface EditableTagProps {
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'ul' | 'ol' | 'blockquote' | 'code' | 'div';
  className?: string;
  style?: React.CSSProperties;
  content: string;
  editable: boolean;
  isPlainText?: boolean;
  onCommit: (nextContent: string) => void;
}

function EditableTag({
  as,
  className,
  style,
  content,
  editable,
  isPlainText = false,
  onCommit,
}: EditableTagProps) {
  const nodeRef = useRef<HTMLElement | null>(null);

  const attachRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
    if (node && !editable) {
      if (isPlainText) {
        if (node.textContent !== content) node.textContent = content;
      } else if (node.innerHTML !== content) {
        node.innerHTML = content;
      }
    }
  }, [content, editable, isPlainText]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || editable) return;
    if (isPlainText) {
      if (node.textContent !== content) node.textContent = content;
    } else if (node.innerHTML !== content) {
      node.innerHTML = content;
    }
  }, [content, editable, isPlainText]);

  useEffect(() => {
    const node = nodeRef.current;
    if (!editable || !node) return;
    node.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editable]);

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    const related = e.relatedTarget;
    if (related instanceof HTMLElement && related.closest('.wb-richtext-toolbar')) {
      return;
    }
    const next = isPlainText ? (e.currentTarget.textContent ?? '') : e.currentTarget.innerHTML;
    onCommit(next);
  };

  const TagName: React.ElementType = as;
  return (
    <TagName
      ref={attachRef}
      className={className}
      style={style}
      contentEditable={editable || undefined}
      suppressContentEditableWarning
      onBlur={editable ? handleBlur : undefined}
      onMouseDown={editable ? (e: React.MouseEvent) => e.stopPropagation() : undefined}
    />
  );
}

interface CanvasElementProps {
  element: ElementNode;
  selectedId: string | null;
  editingId: string | null;
  hoveredId: string | null;
  viewportMode: ViewportMode;
  columnId: string;
  containerId?: string;
  index: number;
  isDragging: boolean;
  assets: Record<string, AssetData>;
  dispatch: React.Dispatch<BuilderAction>;
  onContextMenu: (x: number, y: number, id: string, target: SelectionTarget) => void;
}

export default function CanvasElement({
  element,
  selectedId,
  editingId,
  hoveredId,
  viewportMode,
  columnId,
  containerId,
  index,
  isDragging,
  assets,
  dispatch,
  onContextMenu,
}: CanvasElementProps) {
  const [dropPos, setDropPos] = useState<'before' | 'after' | null>(null);
  const [containerOver, setContainerOver] = useState(false);
  const [openAccIdx, setOpenAccIdx] = useState<number>(0);
  const [activeTabIdx, setActiveTabIdx] = useState<number>(0);

  const isSelected = selectedId === element.id;
  const isEditing = editingId === element.id;
  const isHovered = hoveredId === element.id;
  const editable = isEditing && !element.locked;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT', payload: { id: element.id, target: 'element' } });
  }, [dispatch, element.id]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.locked) return;
    const textTypes = ['heading', 'paragraph', 'list', 'blockquote', 'code', 'button', 'link', 'badge', 'alert', 'html'];
    const settingsTypes = ['card', 'form', 'accordion', 'tabs', 'table', 'stat', 'progress', 'avatar', 'social-links', 'image', 'video', 'map', 'embed', 'icon'];
    if (textTypes.includes(element.type)) {
      dispatch({ type: 'SET_EDITING', payload: { elementId: element.id } });
    } else if (settingsTypes.includes(element.type)) {
      dispatch({ type: 'SELECT', payload: { id: element.id, target: 'element' } });
      dispatch({ type: 'SET_RIGHT_TAB', payload: { tab: 'settings' } });
    }
  }, [dispatch, element.id, element.type, element.locked]);

  const commitContent = useCallback((newContent: string) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: element.id, updates: { content: newContent } } });
    dispatch({ type: 'SET_EDITING', payload: { elementId: null } });
    dispatch({ type: 'SAVE_HISTORY', payload: { label: `Edit ${element.type}` } });
  }, [dispatch, element.id, element.type]);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    if (editingId || element.locked) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', JSON.stringify({
      source: 'canvas',
      elementId: element.id,
    }));
    e.dataTransfer.effectAllowed = 'move';
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: true, data: { source: 'canvas', elementId: element.id } } });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDropPos(null);
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropPos(e.clientY < midY ? 'before' : 'after');
  };

  const handleDropOnSibling = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = dropPos ?? 'after';
    setDropPos(null);
    const raw = e.dataTransfer.getData('text/plain');
    try {
      const parsed = JSON.parse(raw);
      const targetIndex = pos === 'before' ? index : index + 1;
      if (parsed.source === 'canvas' && parsed.elementId && parsed.elementId !== element.id) {
        dispatch({
          type: 'MOVE_ELEMENT_TO',
          payload: {
            elementId: parsed.elementId,
            targetColumnId: containerId ? undefined : columnId,
            targetContainerId: containerId,
            targetIndex,
          },
        });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Reorder element' } });
      } else if (parsed.source === 'sidebar-element' && parsed.elementType) {
        const el = createElement(parsed.elementType);
        dispatch({
          type: 'ADD_ELEMENT',
          payload: {
            columnId: containerId ? undefined : columnId,
            containerId,
            element: el,
            index: targetIndex,
          },
        });
        dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${el.type}` } });
      } else if (parsed.source === 'sidebar-asset' && parsed.assetId) {
        const asset = assets[parsed.assetId];
        if (asset && asset.type === 'image') {
          const el = createElement('image', { content: asset.dataUrl, attributes: { alt: asset.name } });
          dispatch({
            type: 'ADD_ELEMENT',
            payload: {
              columnId: containerId ? undefined : columnId,
              containerId,
              element: el,
              index: targetIndex,
            },
          });
          dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
          dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Insert image' } });
        }
      }
    } catch { /* ignore */ }
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContainerOver(false);
    const raw = e.dataTransfer.getData('text/plain');
    try {
      const parsed = JSON.parse(raw);
      if (parsed.source === 'canvas' && parsed.elementId && parsed.elementId !== element.id) {
        dispatch({
          type: 'MOVE_ELEMENT_TO',
          payload: { elementId: parsed.elementId, targetContainerId: element.id },
        });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Move into container' } });
      } else if (parsed.source === 'sidebar-element' && parsed.elementType) {
        const el = createElement(parsed.elementType);
        dispatch({ type: 'ADD_ELEMENT', payload: { containerId: element.id, element: el } });
        dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
        dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${el.type}` } });
      } else if (parsed.source === 'sidebar-asset' && parsed.assetId) {
        const asset = assets[parsed.assetId];
        if (asset && asset.type === 'image') {
          const el = createElement('image', { content: asset.dataUrl, attributes: { alt: asset.name } });
          dispatch({ type: 'ADD_ELEMENT', payload: { containerId: element.id, element: el } });
          dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
          dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Insert image' } });
        }
      }
    } catch { /* ignore */ }
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  };

  const merged = mergeResponsiveStyles(element.styles, element.responsiveStyles, viewportMode);
  const styles = stylesToReact(merged);

  const inlineDisplay =
    merged.display === 'inline-block' || merged.display === 'inline-flex' || merged.display === 'inline'
      ? merged.display
      : (element.type === 'button' || element.type === 'badge' || element.type === 'link') && !merged.display
        ? 'inline-block'
        : undefined;

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: inlineDisplay,
    verticalAlign: inlineDisplay ? 'top' : undefined,
    opacity: element.hidden ? 0.32 : undefined,
    cursor: element.locked ? 'not-allowed' : isEditing ? 'text' : 'pointer',
  };

  const editStyles: React.CSSProperties =
    editable && (styles.color === 'transparent' || styles.WebkitTextFillColor === 'transparent')
      ? {
          ...styles,
          color: 'var(--site-text)',
          WebkitTextFillColor: 'var(--site-text)',
          backgroundClip: 'border-box',
          WebkitBackgroundClip: 'border-box',
          backgroundImage: 'none',
          caretColor: 'var(--site-accent)',
        }
      : styles;

  const hasResponsive = Boolean(
    (element.responsiveStyles?.tablet && Object.keys(element.responsiveStyles.tablet).length > 0) ||
    (element.responsiveStyles?.mobile && Object.keys(element.responsiveStyles.mobile).length > 0),
  );
  const hasAnim = Boolean(element.animation && element.animation.type !== 'none');

  const renderContent = () => {
    switch (element.type) {
      case 'heading': {
        const level = element.headingLevel ?? 2;
        const tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        return (
          <EditableTag
            as={tag}
            style={editStyles}
            content={element.content}
            editable={editable}
            onCommit={commitContent}
          />
        );
      }

      case 'paragraph':
        return (
          <EditableTag
            as="p"
            style={editStyles}
            content={element.content}
            editable={editable}
            onCommit={commitContent}
          />
        );

      case 'button':
        return (
          <EditableTag
            as="span"
            style={{
              ...editStyles,
              display: editStyles.display || 'inline-block',
              userSelect: editable ? 'text' : 'none',
            }}
            content={element.content}
            editable={editable}
            onCommit={commitContent}
          />
        );

      case 'link':
        return (
          <EditableTag
            as="span"
            style={{
              ...editStyles,
              cursor: editable ? 'text' : 'pointer',
              userSelect: editable ? 'text' : undefined,
            }}
            content={element.content}
            editable={editable}
            onCommit={commitContent}
          />
        );

      case 'image':
        return (
          <img
            src={element.content}
            alt={element.attributes.alt || 'Image'}
            style={{ ...styles, display: 'block' }}
            draggable={false}
          />
        );

      case 'video':
        return (
          <div style={{ ...styles, position: 'relative' }}>
            <iframe
              src={normalizeVideoEmbedUrl(element.content)}
              style={{ width: '100%', height: '100%', border: 'none', minHeight: '240px' }}
              allowFullScreen
              title="Video embed"
            />
            {!isEditing && <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />}
          </div>
        );

      case 'icon':
        return <i className={element.content} style={styles} />;

      case 'list': {
        const listTag = element.attributes.listTag || 'ul';
        const isChecklist = listTag === 'checklist';
        const className = isChecklist ? 'wb-checklist' : undefined;
        const listStyles: React.CSSProperties = {
          ...styles,
          ...(listTag === 'ol' && (!styles.listStyleType || styles.listStyleType === 'disc')
            ? { listStyleType: 'decimal' }
            : isChecklist
              ? { listStyleType: 'none' }
              : {}),
        };
        return (
          <EditableTag
            as={listTag === 'ol' ? 'ol' : 'ul'}
            className={className}
            style={listStyles}
            content={element.content}
            editable={editable}
            onCommit={commitContent}
          />
        );
      }

      case 'blockquote':
        return (
          <EditableTag
            as="blockquote"
            style={editStyles}
            content={element.content}
            editable={editable}
            onCommit={commitContent}
          />
        );

      case 'code':
        return (
          <div className="wb-code-wrap">
            {element.attributes.showCopy !== 'false' && (
              <span className="wb-code-copy">Copy</span>
            )}
            <pre style={styles}>
              <EditableTag
                as="code"
                content={element.content}
                editable={editable}
                isPlainText
                onCommit={commitContent}
              />
            </pre>
          </div>
        );

      case 'divider':
        return (
          <div
            style={{
              ...styles,
              width: styles.width || '100%',
              height: styles.height || '1px',
              backgroundColor: styles.backgroundColor || 'var(--site-border)',
            }}
          />
        );

      case 'spacer':
        return (
          <div style={{ ...styles, width: '100%' }}>
            {(isSelected || isHovered) && (
              <span style={{ fontSize: '0.7rem', opacity: 0.45, textAlign: 'center', display: 'block' }}>
                Spacer ({merged.height || '48px'})
              </span>
            )}
          </div>
        );

      case 'form': {
        const submitText = element.attributes.submitText || 'Send Message';
        let fields: FormField[] = [];
        try { fields = JSON.parse(element.attributes.fields || '[]'); } catch { /* */ }
        if (fields.length === 0) {
          fields = [
            { id: 'f1', type: 'text', label: 'Name', name: 'name', placeholder: 'Your name', required: true },
            { id: 'f2', type: 'email', label: 'Email', name: 'email', placeholder: 'Your email', required: true },
            { id: 'f3', type: 'textarea', label: 'Message', name: 'message', placeholder: 'Your message', required: true },
          ];
        }
        return (
          <div style={styles} className="wb-canvas-form">
            {fields.map(f => (
              <div key={f.id} style={{ marginBottom: '0.25rem' }}>
                {f.type === 'checkbox' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" readOnly />
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>{f.label}</label>
                  </div>
                ) : (
                  <>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.875rem', fontWeight: 500 }}>
                      {f.label}{f.required ? ' *' : ''}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea
                        placeholder={f.placeholder || ''}
                        rows={3}
                        style={{
                          width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--site-border)',
                          borderRadius: 'var(--radius, 8px)', background: 'var(--site-bg)', color: 'var(--site-text)',
                          fontSize: '0.95rem', resize: 'vertical',
                        }}
                        readOnly
                      />
                    ) : f.type === 'select' ? (
                      <select
                        style={{
                          width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--site-border)',
                          borderRadius: 'var(--radius, 8px)', background: 'var(--site-bg)', color: 'var(--site-text)',
                          fontSize: '0.95rem',
                        }}
                      >
                        {(f.options ?? ['Option 1', 'Option 2']).map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={f.type}
                        placeholder={f.placeholder || ''}
                        style={{
                          width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--site-border)',
                          borderRadius: 'var(--radius, 8px)', background: 'var(--site-bg)', color: 'var(--site-text)',
                          fontSize: '0.95rem',
                        }}
                        readOnly
                      />
                    )}
                  </>
                )}
              </div>
            ))}
            <button
              type="button"
              style={{
                padding: '0.7rem 1.5rem', background: 'var(--site-accent)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius, 8px)', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.95rem',
              }}
            >
              {submitText}
            </button>
          </div>
        );
      }

      case 'map':
        return (
          <div style={{ ...styles, position: 'relative' }}>
            <iframe
              src={element.content}
              style={{ width: '100%', height: '100%', border: 'none', minHeight: '280px' }}
              loading="lazy"
              title="Map"
            />
            {!isEditing && <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />}
          </div>
        );

      case 'embed':
        return (
          <div style={{ ...styles, position: 'relative' }}>
            {element.content ? (
              <iframe
                src={element.content}
                style={{ width: '100%', height: '100%', border: 'none', minHeight: '220px' }}
                loading="lazy"
                title={element.attributes.title || 'Embed'}
              />
            ) : (
              <div style={{ padding: '2.5rem', border: '1px dashed var(--site-border)', borderRadius: '10px', textAlign: 'center', opacity: 0.6 }}>
                Embed URL not configured — set in Settings tab
              </div>
            )}
            {!isEditing && <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />}
          </div>
        );

      case 'social-links': {
        let links: SocialLinkItem[] = [];
        try { links = JSON.parse(element.attributes.links || '[]'); } catch { /* */ }
        const variant = element.attributes.variant || 'circle';
        return (
          <div className={`wb-social-links ${variant}`} style={styles}>
            {links.map((l, i) => (
              <a key={i} href="#social" onClick={(e) => e.preventDefault()} title={l.platform}>
                <i className={l.icon} />
                {variant === 'pill' && <span>{l.platform}</span>}
              </a>
            ))}
          </div>
        );
      }

      case 'container':
        return (
          <div
            style={{
              ...styles,
              outline: containerOver ? '2px dashed var(--wb-accent)' : undefined,
              backgroundColor: containerOver ? 'rgba(99,102,241,0.06)' : styles.backgroundColor,
            }}
            onDragOver={(e) => {
              if (!isDragging) return;
              e.preventDefault();
              e.stopPropagation();
              setContainerOver(true);
            }}
            onDragLeave={(e) => { e.stopPropagation(); setContainerOver(false); }}
            onDrop={handleContainerDrop}
          >
            {element.children.map((child, childIdx) => (
              <CanvasElement
                key={child.id}
                element={child}
                selectedId={selectedId}
                editingId={editingId}
                hoveredId={hoveredId}
                viewportMode={viewportMode}
                columnId={columnId}
                containerId={element.id}
                index={childIdx}
                isDragging={isDragging}
                assets={assets}
                dispatch={dispatch}
                onContextMenu={onContextMenu}
              />
            ))}
            {element.children.length === 0 && (
              <div style={{ padding: '1.75rem 1rem', textAlign: 'center', opacity: 0.4, fontSize: '0.8rem', border: '1px dashed var(--site-border)', borderRadius: '8px' }}>
                Container — Drop elements inside
              </div>
            )}
          </div>
        );

      case 'badge': {
        const variant = element.attributes.variant || 'soft';
        const icon = element.attributes.icon;
        return (
          <span className={`wb-badge wb-badge-${variant}`} style={styles}>
            {icon && <i className={icon} />}
            <EditableTag
              as="span"
              content={element.content}
              editable={editable}
              onCommit={commitContent}
            />
          </span>
        );
      }

      case 'card': {
        const { title = 'Card Title', description = '', icon = '', imageUrl = '', ctaText = '' } = element.attributes;
        return (
          <div className="wb-card" style={styles}>
            {imageUrl && <img className="wb-card-img" src={imageUrl} alt={title} draggable={false} />}
            {!imageUrl && icon && (
              <div className="wb-card-icon"><i className={icon} /></div>
            )}
            <h3 className="wb-card-title">{title}</h3>
            <p className="wb-card-desc">{description}</p>
            {ctaText && <span className="wb-card-cta">{ctaText}</span>}
          </div>
        );
      }

      case 'accordion': {
        let items: AccordionItem[] = [];
        try { items = JSON.parse(element.attributes.items || '[]'); } catch { /* */ }
        return (
          <div className="wb-accordion" style={styles}>
            {items.map((item, idx) => {
              const isOpen = openAccIdx === idx;
              return (
                <div key={item.id || idx} className={`wb-acc-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="wb-acc-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'SELECT', payload: { id: element.id, target: 'element' } });
                      setOpenAccIdx(isOpen ? -1 : idx);
                    }}
                  >
                    <span>{item.title}</span>
                    <i className="fas fa-chevron-down wb-acc-chevron" />
                  </button>
                  {isOpen && <div className="wb-acc-body">{item.content}</div>}
                </div>
              );
            })}
          </div>
        );
      }

      case 'tabs': {
        let items: TabItem[] = [];
        try { items = JSON.parse(element.attributes.items || '[]'); } catch { /* */ }
        const variant = element.attributes.variant || 'underline';
        const safeIdx = Math.min(activeTabIdx, Math.max(0, items.length - 1));
        return (
          <div className={`wb-tabs ${variant}`} style={styles}>
            <div className="wb-tabs-nav">
              {items.map((tab, idx) => (
                <button
                  key={tab.id || idx}
                  type="button"
                  className={`wb-tab-btn ${safeIdx === idx ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'SELECT', payload: { id: element.id, target: 'element' } });
                    setActiveTabIdx(idx);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {items[safeIdx] && <div className="wb-tab-panel">{items[safeIdx].content}</div>}
          </div>
        );
      }

      case 'progress': {
        const label = element.attributes.label || 'Progress';
        const value = Math.max(0, Math.min(100, Number(element.attributes.value ?? 75)));
        const showValue = element.attributes.showValue !== 'false';
        const barColor = element.attributes.barColor || 'var(--site-accent)';
        return (
          <div className="wb-progress-wrap" style={styles}>
            <div className="wb-progress-head">
              <span>{label}</span>
              {showValue && <span>{value}%</span>}
            </div>
            <div className="wb-progress-track">
              <div className="wb-progress-fill" style={{ width: `${value}%`, background: barColor }} />
            </div>
          </div>
        );
      }

      case 'alert': {
        const variant = element.attributes.variant || 'info';
        const title = element.attributes.title || 'Notice';
        const icon = element.attributes.icon || 'fas fa-circle-info';
        return (
          <div className={`wb-alert wb-alert-${variant}`} style={styles}>
            <i className={`${icon} wb-alert-icon`} />
            <div style={{ flex: 1 }}>
              <div className="wb-alert-title">{title}</div>
              <EditableTag
                as="div"
                className="wb-alert-text"
                content={element.content}
                editable={editable}
                onCommit={commitContent}
              />
            </div>
          </div>
        );
      }

      case 'stat': {
        const { value = '99%', label = 'Metric', delta = '', deltaPositive = 'true' } = element.attributes;
        return (
          <div className="wb-stat" style={styles}>
            <div className="wb-stat-value">{value}</div>
            <div className="wb-stat-label">{label}</div>
            {delta && (
              <span className={`wb-stat-delta ${deltaPositive !== 'false' ? 'pos' : 'neg'}`}>
                {delta}
              </span>
            )}
          </div>
        );
      }

      case 'table': {
        let data: TableData = { headers: [], rows: [], striped: true };
        try { data = JSON.parse(element.attributes.tableData || '{}'); } catch { /* */ }
        return (
          <div style={styles}>
            <table className={`wb-table ${data.striped !== false ? 'striped' : ''}`}>
              <thead>
                <tr>
                  {(data.headers || []).map((h, i) => <th key={i}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(data.rows || []).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'avatar': {
        const { imageUrl = '', name = 'Alex Morgan', role = 'Designer', rating = '0' } = element.attributes;
        const stars = Math.max(0, Math.min(5, Number(rating || 0)));
        return (
          <div className="wb-avatar" style={styles}>
            {imageUrl && <img src={imageUrl} alt={name} className="wb-avatar-img" draggable={false} />}
            <div>
              <div className="wb-avatar-name">{name}</div>
              <div className="wb-avatar-role">{role}</div>
              {stars > 0 && (
                <div className="wb-avatar-stars">
                  {Array.from({ length: stars }, (_, idx) => <i key={idx} className="fas fa-star" />)}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'html': {
        if (editable) {
          return (
            <textarea
              defaultValue={element.content}
              autoFocus
              rows={5}
              style={{
                width: '100%', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.82rem',
                background: '#13131d', color: '#e2e8f0', border: '1px solid var(--wb-accent)',
                borderRadius: '8px', outline: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: element.id, updates: { content: e.target.value } } });
                dispatch({ type: 'SET_EDITING', payload: { elementId: null } });
                dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Edit HTML block' } });
              }}
            />
          );
        }
        return <div style={styles} dangerouslySetInnerHTML={{ __html: element.content }} />;
      }

      default:
        return <div style={styles}>{element.content}</div>;
    }
  };

  return (
    <div
      data-builder-id={element.id}
      className={[
        'wb-canvas-element',
        isSelected ? 'selected' : '',
        isEditing ? 'editing' : '',
        isHovered && !isSelected ? 'hovered' : '',
        dropPos === 'before' ? 'drop-before' : '',
        dropPos === 'after' ? 'drop-after' : '',
      ].filter(Boolean).join(' ')}
      style={wrapperStyle}
      draggable={!editingId && !element.locked}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={() => setDropPos(null)}
      onDrop={handleDropOnSibling}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={(e) => {
        e.stopPropagation();
        if (!editingId) dispatch({ type: 'SET_HOVERED', payload: { id: element.id } });
      }}
      onMouseLeave={(e) => {
        e.stopPropagation();
        if (!editingId) dispatch({ type: 'SET_HOVERED', payload: { id: null } });
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: 'SELECT', payload: { id: element.id, target: 'element' } });
        onContextMenu(e.clientX, e.clientY, element.id, 'element');
      }}
    >
      {renderContent()}

      {isSelected && (
        <div className="wb-el-badges">
          {Object.keys(element.hoverStyles).length > 0 && (
            <span className="wb-el-badge hover" title="Has hover styles">H</span>
          )}
          {hasResponsive && (
            <span className="wb-el-badge resp" title="Has responsive breakpoint overrides">R</span>
          )}
          {hasAnim && (
            <span className="wb-el-badge anim" title={`Animation: ${element.animation?.type}`}>A</span>
          )}
          {element.locked && (
            <span className="wb-el-badge lock" title="Locked">🔒</span>
          )}
        </div>
      )}
    </div>
  );
}
