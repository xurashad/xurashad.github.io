'use client';
// ============================================================
// Website Builder Pro — Left Sidebar
// ============================================================

import React, { useState, useCallback } from 'react';
import { LayoutGrid, Layers, FileText, Component, Plus, Trash2, Eye, EyeOff, ChevronRight, ChevronDown, GripVertical, Search, Settings as SettingsIcon } from 'lucide-react';
import type { BuilderState, BuilderAction, LeftSidebarTab, ElementType, SectionNode } from '../lib/types';
import { ELEMENT_CATEGORIES, createElement, createSection, createPage } from '../lib/defaults';
import { SECTION_TEMPLATES } from '../lib/templates';

interface LeftSidebarProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
}

export default function LeftSidebar({ state, dispatch }: LeftSidebarProps) {
  if (!state.leftSidebarOpen) return null;

  const tabs: { key: LeftSidebarTab; icon: React.ReactNode; label: string }[] = [
    { key: 'elements', icon: <LayoutGrid size={18} />, label: 'Elements' },
    { key: 'sections', icon: <Component size={18} />, label: 'Sections' },
    { key: 'pages', icon: <FileText size={18} />, label: 'Pages' },
    { key: 'layers', icon: <Layers size={18} />, label: 'Layers' },
  ];

  return (
    <div className="wb-left-sidebar">
      {/* Tab Navigation */}
      <div className="wb-sidebar-tabs">
        {tabs.map(({ key, icon, label }) => (
          <button
            key={key}
            className={`wb-sidebar-tab ${state.leftSidebarTab === key ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_LEFT_TAB', payload: { tab: key } })}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="wb-sidebar-content">
        {state.leftSidebarTab === 'elements' && <ElementsTab state={state} dispatch={dispatch} />}
        {state.leftSidebarTab === 'sections' && <SectionsTab state={state} dispatch={dispatch} />}
        {state.leftSidebarTab === 'pages' && <PagesTab state={state} dispatch={dispatch} />}
        {state.leftSidebarTab === 'layers' && <LayersTab state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}

/* ========== Elements Tab ========== */

function ElementsTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(
    Object.fromEntries(ELEMENT_CATEGORIES.map(c => [c.name, true]))
  );

  const toggleCat = (name: string) => {
    setExpandedCats(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'sidebar-element', elementType: type }));
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: true, data: { source: 'sidebar-element', elementType: type } } });
  };

  const handleDragEnd = () => {
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  };

  const handleClick = (type: ElementType) => {
    // Add to current page's last section/column
    const page = state.project.pages[state.currentPageId];
    if (!page) return;
    let columnId: string | null = null;
    if (page.sections.length > 0) {
      const lastSec = page.sections[page.sections.length - 1];
      if (lastSec.rows.length > 0) {
        const lastRow = lastSec.rows[lastSec.rows.length - 1];
        if (lastRow.columns.length > 0) {
          columnId = lastRow.columns[0].id;
        }
      }
    }
    if (!columnId) {
      // Create a new section first
      const sec = createSection('Section');
      dispatch({ type: 'ADD_SECTION', payload: { section: sec } });
      columnId = sec.rows[0].columns[0].id;
    }
    const el = createElement(type);
    dispatch({ type: 'ADD_ELEMENT', payload: { columnId, element: el } });
    dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
    dispatch({ type: 'SAVE_HISTORY' });
  };

  return (
    <div className="wb-elements-tab">
      <div className="wb-sidebar-title">Elements</div>
      {ELEMENT_CATEGORIES.map(cat => (
        <div key={cat.name} className="wb-element-category">
          <button className="wb-category-header" onClick={() => toggleCat(cat.name)}>
            {expandedCats[cat.name] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <i className={cat.icon} style={{ fontSize: '0.75rem', marginRight: '0.5rem', opacity: 0.5 }} />
            <span>{cat.name}</span>
          </button>
          {expandedCats[cat.name] && (
            <div className="wb-element-grid">
              {cat.items.map(item => (
                <button
                  key={item.type}
                  className="wb-element-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleClick(item.type)}
                  title={item.label}
                >
                  <i className={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ========== Sections Tab ========== */

function SectionsTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const [search, setSearch] = useState('');
  const templates = Object.entries(SECTION_TEMPLATES).filter(([, t]) =>
    t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (key: string) => {
    const template = SECTION_TEMPLATES[key];
    if (!template) return;
    const section = template.create();
    dispatch({ type: 'ADD_SECTION', payload: { section } });
    dispatch({ type: 'SAVE_HISTORY' });
  };

  const handleDragStart = (e: React.DragEvent, key: string) => {
    const template = SECTION_TEMPLATES[key];
    if (!template) return;
    const section = template.create();
    e.dataTransfer.setData('text/plain', JSON.stringify({
      source: 'sidebar-section',
      sectionTemplateId: key,
      sectionData: JSON.stringify(section),
    }));
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: true, data: { source: 'sidebar-section', sectionTemplateId: key } } });
  };

  const handleDragEnd = () => {
    dispatch({ type: 'SET_DRAGGING', payload: { isDragging: false, data: null } });
  };

  return (
    <div className="wb-sections-tab">
      <div className="wb-sidebar-title">Sections</div>
      <div className="wb-search-bar">
        <Search size={14} />
        <input placeholder="Search sections..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="wb-sections-list">
        {templates.map(([key, template]) => (
          <button
            key={key}
            className="wb-section-card"
            onClick={() => handleAdd(key)}
            draggable
            onDragStart={(e) => handleDragStart(e, key)}
            onDragEnd={handleDragEnd}
          >
            <i className={template.icon} />
            <div>
              <div className="wb-section-card-name">{template.name}</div>
              <div className="wb-section-card-desc">{template.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ========== Pages Tab ========== */

function PagesTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [seoPageId, setSeoPageId] = useState<string | null>(null);

  const pages = state.project.pageOrder.map(id => state.project.pages[id]).filter(Boolean);

  const handleAddPage = () => {
    const count = pages.length + 1;
    const page = createPage(`Page ${count}`, `page-${count}`);
    dispatch({ type: 'ADD_PAGE', payload: { page } });
    dispatch({ type: 'SAVE_HISTORY' });
  };

  const handleDeletePage = (pageId: string) => {
    if (state.project.pageOrder.length <= 1) return;
    if (confirm('Delete this page? This cannot be undone.')) {
      dispatch({ type: 'DELETE_PAGE', payload: { pageId } });
      dispatch({ type: 'SAVE_HISTORY' });
    }
  };

  const handleRename = (pageId: string) => {
    setEditingPageId(null);
    if (editValue.trim()) {
      dispatch({ type: 'UPDATE_PAGE', payload: { pageId, updates: { title: editValue.trim(), slug: editValue.trim().toLowerCase().replace(/\s+/g, '-') } } });
      dispatch({ type: 'SAVE_HISTORY' });
    }
  };

  const handleIndent = (pageId: string) => {
    const idx = state.project.pageOrder.indexOf(pageId);
    if (idx <= 0) return;
    const prevPageId = state.project.pageOrder[idx - 1];
    dispatch({ type: 'UPDATE_PAGE', payload: { pageId, updates: { parentId: prevPageId } } });
    dispatch({ type: 'SAVE_HISTORY' });
  };

  const handleOutdent = (pageId: string) => {
    dispatch({ type: 'UPDATE_PAGE', payload: { pageId, updates: { parentId: null } } });
    dispatch({ type: 'SAVE_HISTORY' });
  };

  const getIndentLevel = (page: { parentId: string | null }): number => {
    let level = 0;
    let current = page;
    while (current.parentId) {
      level++;
      const parent = state.project.pages[current.parentId];
      if (!parent) break;
      current = parent;
    }
    return level;
  };

  return (
    <div className="wb-pages-tab">
      <div className="wb-sidebar-title">
        Pages
        <button className="wb-add-btn" onClick={handleAddPage} title="Add page">
          <Plus size={16} />
        </button>
      </div>
      <div className="wb-pages-list">
        {pages.map(page => {
          const indent = getIndentLevel(page);
          const isActive = page.id === state.currentPageId;
          const isEditing = editingPageId === page.id;

          return (
            <div key={page.id}>
              <div
                className={`wb-page-item ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: `${12 + indent * 16}px` }}
                onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: { pageId: page.id } })}
              >
                <FileText size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                {isEditing ? (
                  <input
                    className="wb-page-name-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleRename(page.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(page.id); }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="wb-page-name"
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingPageId(page.id); setEditValue(page.title); }}
                  >
                    {page.title}
                  </span>
                )}
                <div className="wb-page-actions" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => dispatch({ type: 'UPDATE_PAGE', payload: { pageId: page.id, updates: { hidden: !page.hidden } } })} title={page.hidden ? 'Show' : 'Hide'}>
                    {page.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button onClick={() => setSeoPageId(seoPageId === page.id ? null : page.id)} title="SEO Settings">
                    <SettingsIcon size={12} />
                  </button>
                  {page.parentId && (
                    <button onClick={() => handleOutdent(page.id)} title="Outdent">←</button>
                  )}
                  {!page.parentId && state.project.pageOrder.indexOf(page.id) > 0 && (
                    <button onClick={() => handleIndent(page.id)} title="Indent">→</button>
                  )}
                  {state.project.pageOrder.length > 1 && (
                    <button onClick={() => handleDeletePage(page.id)} title="Delete" className="danger">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* SEO Panel */}
              {seoPageId === page.id && (
                <div className="wb-seo-panel">
                  <label>SEO Title</label>
                  <input value={page.seo.title} onChange={(e) => dispatch({ type: 'UPDATE_PAGE', payload: { pageId: page.id, updates: { seo: { ...page.seo, title: e.target.value } } } })} placeholder="Page title" />
                  <label>Meta Description</label>
                  <textarea value={page.seo.description} onChange={(e) => dispatch({ type: 'UPDATE_PAGE', payload: { pageId: page.id, updates: { seo: { ...page.seo, description: e.target.value } } } })} placeholder="Page description" rows={2} />
                  <label>OG Image URL</label>
                  <input value={page.seo.ogImage} onChange={(e) => dispatch({ type: 'UPDATE_PAGE', payload: { pageId: page.id, updates: { seo: { ...page.seo, ogImage: e.target.value } } } })} placeholder="https://..." />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========== Layers Tab ========== */

function LayersTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const page = state.project.pages[state.currentPageId];
  if (!page) return null;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      heading: 'H', paragraph: '¶', button: '▣', link: '🔗',
      image: '🖼', video: '▶', icon: '★', list: '≡',
      blockquote: '"', code: '<>', divider: '—', spacer: '↕',
      form: '📝', map: '📍', embed: '⬡', 'social-links': '🔗',
      container: '☐',
    };
    return icons[type] || '◻';
  };

  const renderSectionLayers = (section: SectionNode, label?: string) => {
    const isCollapsed = collapsed[section.id];
    const isSelected = state.selection?.id === section.id;

    return (
      <div key={section.id} className="wb-layer-group">
        <div
          className={`wb-layer-item section ${isSelected ? 'selected' : ''}`}
          onClick={() => dispatch({ type: 'SELECT', payload: { id: section.id, target: 'section' } })}
        >
          <button className="wb-layer-toggle" onClick={(e) => { e.stopPropagation(); toggle(section.id); }}>
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
          <span className="wb-layer-icon">§</span>
          <span className="wb-layer-name">{label || section.name}</span>
        </div>
        {!isCollapsed && section.rows.map(row =>
          row.columns.map(col =>
            col.elements.map(el => {
              const isElSelected = state.selection?.id === el.id;
              return (
                <div
                  key={el.id}
                  className={`wb-layer-item element ${isElSelected ? 'selected' : ''}`}
                  style={{ paddingLeft: '2rem' }}
                  onClick={() => dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } })}
                >
                  <span className="wb-layer-icon">{getIcon(el.type)}</span>
                  <span className="wb-layer-name">{el.type}{el.type === 'heading' ? ` (h${el.headingLevel ?? 2})` : ''}</span>
                  {el.hidden && <EyeOff size={10} style={{ opacity: 0.4 }} />}
                </div>
              );
            })
          )
        )}
      </div>
    );
  };

  return (
    <div className="wb-layers-tab">
      <div className="wb-sidebar-title">Layers</div>
      {state.project.settings.headerEnabled && renderSectionLayers(state.project.header, '🔒 Header')}
      {page.sections.map(sec => renderSectionLayers(sec))}
      {state.project.settings.footerEnabled && renderSectionLayers(state.project.footer, '🔒 Footer')}
      {page.sections.length === 0 && (
        <div className="wb-layers-empty">No sections on this page</div>
      )}
    </div>
  );
}
