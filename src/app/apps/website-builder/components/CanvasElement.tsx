'use client';
// ============================================================
// Website Builder Pro — Canvas Element Renderer
// ============================================================

import React, { useRef, useCallback } from 'react';
import type { ElementNode, BuilderAction } from '../lib/types';
import { stylesToReact } from '../lib/css-engine';

interface CanvasElementProps {
  element: ElementNode;
  isSelected: boolean;
  isEditing: boolean;
  dispatch: React.Dispatch<BuilderAction>;
}

export default function CanvasElement({ element, isSelected, isEditing, dispatch }: CanvasElementProps) {
  const elRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.locked) return;
    dispatch({ type: 'SELECT', payload: { id: element.id, target: 'element' } });
  }, [dispatch, element.id, element.locked]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.locked) return;
    const textTypes = ['heading', 'paragraph', 'list', 'blockquote', 'code', 'button', 'link'];
    if (textTypes.includes(element.type)) {
      dispatch({ type: 'SET_EDITING', payload: { elementId: element.id } });
    }
  }, [dispatch, element.id, element.type, element.locked]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLElement>) => {
    const newContent = e.currentTarget.innerHTML;
    dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: element.id, updates: { content: newContent } } });
    dispatch({ type: 'SET_EDITING', payload: { elementId: null } });
    dispatch({ type: 'SAVE_HISTORY' });
  }, [dispatch, element.id]);

  const styles = stylesToReact(element.styles);
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    outline: isSelected ? '2px solid #6366f1' : undefined,
    outlineOffset: '2px',
    opacity: element.hidden ? 0.3 : undefined,
    cursor: element.locked ? 'not-allowed' : 'pointer',
    transition: 'outline 0.15s ease',
  };

  const editable = isEditing && !element.locked;

  const renderContent = () => {
    switch (element.type) {
      case 'heading': {
        const level = element.headingLevel ?? 2;
        const headingProps = {
          style: styles,
          contentEditable: editable || undefined,
          suppressContentEditableWarning: true,
          onBlur: editable ? handleBlur : undefined,
          dangerouslySetInnerHTML: { __html: element.content },
        };
        if (level === 1) return <h1 {...headingProps} />;
        if (level === 3) return <h3 {...headingProps} />;
        if (level === 4) return <h4 {...headingProps} />;
        if (level === 5) return <h5 {...headingProps} />;
        if (level === 6) return <h6 {...headingProps} />;
        return <h2 {...headingProps} />;
      }

      case 'paragraph':
        return (
          <p
            style={styles}
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={editable ? handleBlur : undefined}
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        );

      case 'button':
        return (
          <span
            style={{ ...styles, display: styles.display || 'inline-block', userSelect: 'none' }}
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={editable ? handleBlur : undefined}
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        );

      case 'link':
        return (
          <span
            style={{ ...styles, cursor: 'pointer' }}
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={editable ? handleBlur : undefined}
            dangerouslySetInnerHTML={{ __html: element.content }}
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
              src={element.content}
              style={{ width: '100%', height: '100%', border: 'none', minHeight: '250px' }}
              allowFullScreen
              title="Video embed"
            />
            {/* Overlay to prevent iframe from stealing clicks */}
            {!isEditing && (
              <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />
            )}
          </div>
        );

      case 'icon':
        return <i className={element.content} style={styles} />;

      case 'list':
        return (
          <ul
            style={styles}
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={editable ? handleBlur : undefined}
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        );

      case 'blockquote':
        return (
          <blockquote
            style={styles}
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={editable ? handleBlur : undefined}
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        );

      case 'code':
        return (
          <pre style={styles}>
            <code
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={editable ? handleBlur : undefined}
              dangerouslySetInnerHTML={{ __html: element.content }}
            />
          </pre>
        );

      case 'divider':
        return <div style={{ ...styles, width: styles.width || '100%', height: styles.height || '1px', backgroundColor: styles.backgroundColor || 'var(--site-border)' }} />;

      case 'spacer':
        return <div style={{ ...styles, width: '100%' }}>
          {isSelected && <span style={{ fontSize: '0.7rem', opacity: 0.4, textAlign: 'center', display: 'block' }}>{styles.height || '48px'}</span>}
        </div>;

      case 'form': {
        const submitText = element.attributes.submitText || 'Submit';
        return (
          <div style={styles} className="wb-canvas-form">
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Name</label>
              <input type="text" placeholder="Your name" style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--site-border)', borderRadius: 'var(--radius, 8px)', background: 'var(--site-bg)', color: 'var(--site-text)', fontSize: '0.95rem' }} readOnly />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
              <input type="email" placeholder="Your email" style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--site-border)', borderRadius: 'var(--radius, 8px)', background: 'var(--site-bg)', color: 'var(--site-text)', fontSize: '0.95rem' }} readOnly />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 }}>Message</label>
              <textarea placeholder="Your message" rows={3} style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid var(--site-border)', borderRadius: 'var(--radius, 8px)', background: 'var(--site-bg)', color: 'var(--site-text)', fontSize: '0.95rem', resize: 'vertical' }} readOnly />
            </div>
            <button type="button" style={{ padding: '0.625rem 1.5rem', background: 'var(--site-accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius, 8px)', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>
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
              style={{ width: '100%', height: '100%', border: 'none', minHeight: '300px' }}
              loading="lazy"
              title="Map"
            />
            {!isEditing && <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />}
          </div>
        );

      case 'embed':
        return (
          <div style={{ ...styles, position: 'relative' }}>
            <iframe
              src={element.content}
              style={{ width: '100%', height: '100%', border: 'none', minHeight: '200px' }}
              loading="lazy"
              title={element.attributes.title || 'Embed'}
            />
            {!isEditing && <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} />}
          </div>
        );

      case 'social-links': {
        let links: Array<{ platform: string; url: string; icon: string }> = [];
        try { links = JSON.parse(element.attributes.links || '[]'); } catch { /* */ }
        return (
          <div style={styles}>
            {links.map((l, i) => (
              <span key={i} style={{ cursor: 'pointer', transition: 'opacity 0.2s' }} title={l.platform}>
                <i className={l.icon} />
              </span>
            ))}
          </div>
        );
      }

      case 'container':
        return (
          <div style={styles}>
            {element.children.map(child => (
              <CanvasElement
                key={child.id}
                element={child}
                isSelected={false}
                isEditing={false}
                dispatch={dispatch}
              />
            ))}
            {element.children.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.3, fontSize: '0.8rem' }}>
                Container (empty)
              </div>
            )}
          </div>
        );

      default:
        return <div style={styles}>{element.content}</div>;
    }
  };

  return (
    <div
      ref={elRef}
      data-builder-id={element.id}
      className={`wb-canvas-element ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
      style={wrapperStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}
      {/* Hover styles badge */}
      {Object.keys(element.hoverStyles).length > 0 && isSelected && (
        <div className="wb-hover-badge" title="Has hover styles">H</div>
      )}
    </div>
  );
}
