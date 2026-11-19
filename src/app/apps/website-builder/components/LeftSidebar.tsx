'use client';
// ============================================================
// Website Builder Pro — Left Sidebar (Elements, Sections, Pages, Layers)
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  LayoutGrid, Layers, FileText, Component, Plus, Trash2, Eye, EyeOff,
  ChevronRight, ChevronDown, Search, Settings as SettingsIcon, Copy,
  ArrowUp, ArrowDown, Lock, Unlock, Home, Bookmark,
} from 'lucide-react';
import type {
  BuilderState, BuilderAction, LeftSidebarTab, ElementType,
  SectionNode, ElementNode,
} from '../lib/types';
import { ELEMENT_CATEGORIES, createElement, createSection, createPage } from '../lib/defaults';
import { SECTION_TEMPLATES, SINGLE_PAGE_TEMPLATES, type SectionCategory } from '../lib/templates';
import { getSelectedElement, getElementContextIds, cloneSection, showToast } from '../lib/reducer';

interface LeftSidebarProps {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  onScrollToElement: (id: string) => void;
}

export default function LeftSidebar({ state, dispatch, onScrollToElement }: LeftSidebarProps) {
  if (!state.leftSidebarOpen) return null;

  const tabs: { key: LeftSidebarTab; icon: React.ReactNode; label: string }[] = [
    { key: 'elements', icon: <LayoutGrid size={17} />, label: 'Elements' },
    { key: 'sections', icon: <Component size={17} />, label: 'Sections' },
    { key: 'pages', icon: <FileText size={17} />, label: 'Pages' },
    { key: 'layers', icon: <Layers size={17} />, label: 'Layers' },
  ];

  return (
    <div className="wb-left-sidebar">
      <div className="wb-sidebar-tabs">
        {tabs.map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            className={`wb-sidebar-tab ${state.leftSidebarTab === key ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_LEFT_TAB', payload: { tab: key } })}
            title={label}
          >
            {icon}
          </button>
        ))}
      </div>

      <div className="wb-sidebar-content">
        {state.leftSidebarTab === 'elements' && <ElementsTab state={state} dispatch={dispatch} />}
        {state.leftSidebarTab === 'sections' && <SectionsTab state={state} dispatch={dispatch} />}
        {state.leftSidebarTab === 'pages' && <PagesTab state={state} dispatch={dispatch} />}
        {state.leftSidebarTab === 'layers' && (
          <LayersTab state={state} dispatch={dispatch} onScrollToElement={onScrollToElement} />
        )}
      </div>
    </div>
  );
}

/* ========== Elements Tab (27 Elements + Search + Contextual Insert) ========== */

function ElementsTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const [search, setSearch] = useState('');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(
    Object.fromEntries(ELEMENT_CATEGORIES.map(c => [c.name, true])),
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
    const selectedEl = getSelectedElement(state);
    const el = createElement(type);

    if (selectedEl && selectedEl.type === 'container') {
      dispatch({ type: 'ADD_ELEMENT', payload: { containerId: selectedEl.id, element: el } });
      dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
      dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${type}` } });
      return;
    }

    const ctx = getElementContextIds(state);
    let columnId = ctx.columnId;

    if (!columnId) {
      const page = state.project.pages[state.currentPageId];
      if (page && page.sections.length > 0) {
        const lastSec = page.sections[page.sections.length - 1];
        const lastRow = lastSec.rows[lastSec.rows.length - 1];
        columnId = lastRow?.columns[0]?.id ?? null;
      }
    }

    if (!columnId) {
      const sec = createSection('Section');
      sec.rows[0].columns[0].elements.push(el);
      dispatch({ type: 'ADD_SECTION', payload: { section: sec } });
      dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
      dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${type}` } });
      return;
    }

    dispatch({ type: 'ADD_ELEMENT', payload: { columnId, element: el } });
    dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
    dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${type}` } });
  };

  const filteredCats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ELEMENT_CATEGORIES;
    return ELEMENT_CATEGORIES.map(cat => ({
      ...cat,
      items: cat.items.filter(
        it => it.label.toLowerCase().includes(q) || it.type.toLowerCase().includes(q),
      ),
    })).filter(cat => cat.items.length > 0);
  }, [search]);

  return (
    <div className="wb-elements-tab">
      <div className="wb-sidebar-title">
        <span>Elements</span>
        <span className="wb-count-pill">27</span>
      </div>
      <div className="wb-search-bar">
        <Search size={13} />
        <input
          placeholder="Search elements..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {filteredCats.map(cat => (
        <div key={cat.name} className="wb-element-category">
          <button type="button" className="wb-category-header" onClick={() => toggleCat(cat.name)}>
            {expandedCats[cat.name] || search ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <i className={cat.icon} style={{ fontSize: '0.75rem', marginRight: '0.45rem', opacity: 0.55 }} />
            <span>{cat.name}</span>
          </button>
          {(expandedCats[cat.name] || Boolean(search)) && (
            <div className="wb-element-grid">
              {cat.items.map(item => (
                <button
                  key={item.type}
                  type="button"
                  className="wb-element-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleClick(item.type)}
                  title={`Click or drag to insert ${item.label}`}
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

/* ========== Sections Tab (24 Sections + Category Filters + Saved Blocks) ========== */

const SECTION_CAT_PILLS: { key: 'all' | SectionCategory | 'saved'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hero', label: 'Hero' },
  { key: 'features', label: 'Features' },
  { key: 'proof', label: 'Proof' },
  { key: 'conversion', label: 'CTA' },
  { key: 'content', label: 'Content' },
  { key: 'media', label: 'Media' },
  { key: 'saved', label: 'Saved' },
];

function SectionsTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | SectionCategory | 'saved'>('all');

  const templates = useMemo(() => {
    if (catFilter === 'saved') return [];
    const q = search.trim().toLowerCase();
    return Object.entries(SECTION_TEMPLATES).filter(([, t]) => {
      const catMatch = catFilter === 'all' || t.category === catFilter;
      const qMatch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [search, catFilter]);

  const savedList = useMemo(() => {
    if (catFilter !== 'saved' && catFilter !== 'all') return [];
    const q = search.trim().toLowerCase();
    return state.savedBlocks.filter(b => !q || b.name.toLowerCase().includes(q));
  }, [state.savedBlocks, catFilter, search]);

  const handleAdd = (key: string) => {
    const template = SECTION_TEMPLATES[key];
    if (!template) return;
    const section = template.create();
    dispatch({ type: 'ADD_SECTION', payload: { section } });
    dispatch({ type: 'SELECT', payload: { id: section.id, target: 'section' } });
    dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add ${template.name}` } });
  };

  const handleAddSaved = (block: SectionNode) => {
    const cloned = cloneSection(block);
    dispatch({ type: 'ADD_SECTION', payload: { section: cloned } });
    dispatch({ type: 'SELECT', payload: { id: cloned.id, target: 'section' } });
    dispatch({ type: 'SAVE_HISTORY', payload: { label: `Insert ${cloned.name}` } });
  };

  const handleDragStart = (e: React.DragEvent, section: SectionNode, key: string) => {
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
      <div className="wb-sidebar-title">
        <span>Sections</span>
        <span className="wb-count-pill">{Object.keys(SECTION_TEMPLATES).length}</span>
      </div>

      <div className="wb-search-bar">
        <Search size={13} />
        <input placeholder="Search sections..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="wb-cat-pills">
        {SECTION_CAT_PILLS.map(pill => (
          <button
            key={pill.key}
            type="button"
            className={`wb-cat-pill ${catFilter === pill.key ? 'active' : ''}`}
            onClick={() => setCatFilter(pill.key)}
          >
            {pill.label}
            {pill.key === 'saved' && state.savedBlocks.length > 0 ? ` (${state.savedBlocks.length})` : ''}
          </button>
        ))}
      </div>

      {savedList.length > 0 && (
        <div className="wb-saved-blocks-group">
          <div className="wb-sub-heading">
            <Bookmark size={12} /> <span>Saved Reusable Blocks</span>
          </div>
          <div className="wb-sections-list">
            {savedList.map(block => (
              <div
                key={block.id}
                className="wb-section-card saved"
                draggable
                onDragStart={(e) => handleDragStart(e, block, 'saved')}
                onDragEnd={handleDragEnd}
                onClick={() => handleAddSaved(block)}
              >
                <i className="fas fa-bookmark" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="wb-section-card-name">{block.name}</div>
                  <div className="wb-section-card-desc">{block.rows.length} row(s) · Reusable block</div>
                </div>
                <button
                  type="button"
                  className="wb-saved-del"
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'DELETE_SAVED_BLOCK', payload: { blockId: block.id } });
                  }}
                  title="Delete saved block"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="wb-sections-list">
        {templates.map(([key, template]) => (
          <button
            key={key}
            type="button"
            className="wb-section-card"
            onClick={() => handleAdd(key)}
            draggable
            onDragStart={(e) => handleDragStart(e, template.create(), key)}
            onDragEnd={handleDragEnd}
          >
            <i className={template.icon} />
            <div>
              <div className="wb-section-card-name">{template.name}</div>
              <div className="wb-section-card-desc">{template.description}</div>
            </div>
          </button>
        ))}
        {catFilter === 'saved' && savedList.length === 0 && (
          <div className="wb-layers-empty">
            No saved blocks yet. Select any section on the canvas and click the Bookmark icon to save it here.
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== Pages Tab (Templates, Reorder, Duplicate, Live SEO Snippet) ========== */

function PagesTab({ state, dispatch }: { state: BuilderState; dispatch: React.Dispatch<BuilderAction> }) {
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [seoPageId, setSeoPageId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const pages = state.project.pageOrder.map(id => state.project.pages[id]).filter(Boolean);

  const handleAddFromTemplate = (templateKey: string) => {
    const tmpl = SINGLE_PAGE_TEMPLATES[templateKey];
    const count = pages.length + 1;
    let newPage = createPage(`Page ${count}`, `page-${count}`);
    if (tmpl) {
      const created = tmpl.create()[0];
      if (created) {
        newPage = {
          ...created,
          title: templateKey === 'blank' ? `Page ${count}` : tmpl.name.replace(' Page', ''),
          slug: templateKey === 'blank' ? `page-${count}` : `${templateKey}-${count}`,
        };
      }
    }
    dispatch({ type: 'ADD_PAGE', payload: { page: newPage } });
    dispatch({ type: 'SAVE_HISTORY', payload: { label: `Add page ${newPage.title}` } });
    setShowAddMenu(false);
    showToast(dispatch, 'success', `Added page "${newPage.title}"`);
  };

  const handleDeletePage = (pageId: string) => {
    if (state.project.pageOrder.length <= 1) return;
    if (confirm('Delete this page?')) {
      dispatch({ type: 'DELETE_PAGE', payload: { pageId } });
      dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Delete page' } });
    }
  };

  const handleRename = (pageId: string) => {
    setEditingPageId(null);
    if (editValue.trim()) {
      const currentSlug = state.project.pages[pageId]?.slug;
      const slug = currentSlug === 'index'
        ? 'index'
        : editValue.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';
      dispatch({ type: 'UPDATE_PAGE', payload: { pageId, updates: { title: editValue.trim(), slug } } });
      dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Rename page' } });
    }
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
        <span>Pages ({pages.length})</span>
        <button type="button" className="wb-add-btn" onClick={() => setShowAddMenu(v => !v)} title="Add new page">
          <Plus size={15} />
        </button>
      </div>

      {showAddMenu && (
        <div className="wb-add-page-menu">
          <div className="wb-add-page-title">Choose Page Layout</div>
          {Object.entries(SINGLE_PAGE_TEMPLATES).map(([key, tmpl]) => (
            <button key={key} type="button" onClick={() => handleAddFromTemplate(key)}>
              <strong>{tmpl.name}</strong>
              <span>{tmpl.description}</span>
            </button>
          ))}
        </div>
      )}

      <div className="wb-pages-list">
        {pages.map((page, idx) => {
          const indent = getIndentLevel(page);
          const isActive = page.id === state.currentPageId;
          const isEditing = editingPageId === page.id;

          return (
            <div key={page.id}>
              <div
                className={`wb-page-item ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: `${10 + indent * 14}px` }}
                onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: { pageId: page.id } })}
              >
                {page.slug === 'index' || idx === 0
                  ? <Home size={13} style={{ color: 'var(--wb-accent)', flexShrink: 0 }} />
                  : <FileText size={13} style={{ opacity: 0.5, flexShrink: 0 }} />}

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
                    title="Double-click to rename"
                  >
                    {page.title}
                  </span>
                )}

                <div className="wb-page-actions" onClick={(e) => e.stopPropagation()}>
                  {idx > 0 && (
                    <button type="button" onClick={() => dispatch({ type: 'MOVE_PAGE', payload: { pageId: page.id, direction: 'up' } })} title="Move up">
                      <ArrowUp size={11} />
                    </button>
                  )}
                  {idx < pages.length - 1 && (
                    <button type="button" onClick={() => dispatch({ type: 'MOVE_PAGE', payload: { pageId: page.id, direction: 'down' } })} title="Move down">
                      <ArrowDown size={11} />
                    </button>
                  )}
                  <button type="button" onClick={() => { dispatch({ type: 'DUPLICATE_PAGE', payload: { pageId: page.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Duplicate page' } }); }} title="Duplicate page">
                    <Copy size={11} />
                  </button>
                  <button type="button" onClick={() => dispatch({ type: 'UPDATE_PAGE', payload: { pageId: page.id, updates: { hidden: !page.hidden } } })} title={page.hidden ? 'Show in nav' : 'Hide from nav'}>
                    {page.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button type="button" onClick={() => setSeoPageId(seoPageId === page.id ? null : page.id)} title="SEO & Slug">
                    <SettingsIcon size={11} />
                  </button>
                  {state.project.pageOrder.length > 1 && (
                    <button type="button" onClick={() => handleDeletePage(page.id)} title="Delete" className="danger">
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>

              {seoPageId === page.id && (
                <div className="wb-seo-panel">
                  <label>Slug</label>
                  <input
                    value={page.slug}
                    onChange={(e) => dispatch({ type: 'UPDATE_PAGE', payload: { pageId: page.id, updates: { slug: e.target.value } } })}
                    placeholder="about"
                  />
                  <label>SEO Title</label>
                  <input
                    value={page.seo.title}
                    onChange={(e) => dispatch({ type: 'UPDATE_PAGE', payload: { pageId: page.id, updates: { seo: { ...page.seo, title: e.target.value } } } })}
                    placeholder="Page title"
                  />
                  <label>Meta Description ({page.seo.description.length}/160)</label>
                  <textarea
                    value={page.seo.description}
                    onChange={(e) => dispatch({ type: 'UPDATE_PAGE', payload: { pageId: page.id, updates: { seo: { ...page.seo, description: e.target.value } } } })}
                    placeholder="Concise page summary for search engines..."
                    rows={2}
                  />
                  <label>OG Image URL</label>
                  <input
                    value={page.seo.ogImage}
                    onChange={(e) => dispatch({ type: 'UPDATE_PAGE', payload: { pageId: page.id, updates: { seo: { ...page.seo, ogImage: e.target.value } } } })}
                    placeholder="https://..."
                  />

                  <div className="wb-serp-preview">
                    <div className="wb-serp-url">https://yoursite.com/{page.slug === 'index' ? '' : `${page.slug}.html`}</div>
                    <div className="wb-serp-title">{page.seo.title || page.title} — {state.project.settings.siteName}</div>
                    <div className="wb-serp-desc">
                      {page.seo.description || 'Add a meta description above to preview how your page appears in search results.'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ========== Layers Tab (Recursive Tree, Hover Sync, Inline Controls) ========== */

function LayersTab({
  state,
  dispatch,
  onScrollToElement,
}: {
  state: BuilderState;
  dispatch: React.Dispatch<BuilderAction>;
  onScrollToElement: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const page = state.project.pages[state.currentPageId];
  if (!page) return null;

  const toggle = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  const q = query.trim().toLowerCase();

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      heading: 'H', paragraph: '¶', button: '▣', link: '🔗',
      image: '🖼', video: '▶', icon: '★', list: '≡',
      blockquote: '"', code: '<>', divider: '—', spacer: '↕',
      form: '📝', map: '📍', embed: '⬡', 'social-links': '🔗',
      container: '☐', badge: '◈', card: '▤', accordion: '☰',
      tabs: '◫', progress: '▬', alert: '!', stat: '#',
      table: '⊞', avatar: '☺', html: '</>',
    };
    return icons[type] || '◻';
  };

  const getElementLabel = (el: ElementNode): string => {
    if (el.name) return el.name;
    if (el.type === 'heading') return `H${el.headingLevel ?? 2}: ${el.content.replace(/<[^>]*>/g, '').slice(0, 18)}`;
    if (el.type === 'paragraph') return `Text: ${el.content.replace(/<[^>]*>/g, '').slice(0, 18)}`;
    if (el.type === 'button') return `Btn: ${el.content.replace(/<[^>]*>/g, '').slice(0, 18)}`;
    if (el.type === 'card') return `Card: ${el.attributes.title || 'Card'}`;
    return el.type;
  };

  const renderElementTree = (el: ElementNode, depth: number) => {
    const label = getElementLabel(el);
    if (q && !label.toLowerCase().includes(q) && !el.type.toLowerCase().includes(q) && el.children.length === 0) {
      return null;
    }
    const isElSelected = state.selection?.id === el.id;
    const isHovered = state.hoveredId === el.id;
    const isContainer = el.children.length > 0 || el.type === 'container';
    const isColCollapsed = collapsed[el.id];

    return (
      <div key={el.id}>
        <div
          className={`wb-layer-item element ${isElSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
          style={{ paddingLeft: `${18 + depth * 14}px` }}
          onClick={() => {
            dispatch({ type: 'SELECT', payload: { id: el.id, target: 'element' } });
            onScrollToElement(el.id);
          }}
          onMouseEnter={() => dispatch({ type: 'SET_HOVERED', payload: { id: el.id } })}
          onMouseLeave={() => dispatch({ type: 'SET_HOVERED', payload: { id: null } })}
        >
          {isContainer && el.children.length > 0 && (
            <button type="button" className="wb-layer-toggle" onClick={(e) => { e.stopPropagation(); toggle(el.id); }}>
              {isColCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
            </button>
          )}
          <span className="wb-layer-icon">{getIcon(el.type)}</span>

          {renamingId === el.id ? (
            <input
              className="wb-page-name-input"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              onBlur={() => {
                dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: el.id, updates: { name: renameText.trim() || undefined } } });
                setRenamingId(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span
              className="wb-layer-name"
              onDoubleClick={(e) => { e.stopPropagation(); setRenamingId(el.id); setRenameText(el.name || el.type); }}
            >
              {label}
            </span>
          )}

          <div className="wb-layer-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: el.id, updates: { hidden: !el.hidden } } })}
              title={el.hidden ? 'Show' : 'Hide'}
            >
              {el.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: 'UPDATE_ELEMENT', payload: { elementId: el.id, updates: { locked: !el.locked } } })}
              title={el.locked ? 'Unlock' : 'Lock'}
            >
              {el.locked ? <Lock size={11} /> : <Unlock size={11} />}
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => { dispatch({ type: 'DELETE_ELEMENT', payload: { elementId: el.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Delete element' } }); }}
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {!isColCollapsed && el.children.map(child => renderElementTree(child, depth + 1))}
      </div>
    );
  };

  const renderSectionLayers = (section: SectionNode, lockedLabel?: string) => {
    const isCollapsed = collapsed[section.id];
    const isSelected = state.selection?.id === section.id;

    return (
      <div key={section.id} className="wb-layer-group">
        <div
          className={`wb-layer-item section ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            dispatch({ type: 'SELECT', payload: { id: section.id, target: 'section' } });
            onScrollToElement(section.id);
          }}
          onMouseEnter={() => dispatch({ type: 'SET_HOVERED', payload: { id: section.id } })}
          onMouseLeave={() => dispatch({ type: 'SET_HOVERED', payload: { id: null } })}
        >
          <button type="button" className="wb-layer-toggle" onClick={(e) => { e.stopPropagation(); toggle(section.id); }}>
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
          <span className="wb-layer-icon">§</span>
          {renamingId === section.id && !lockedLabel ? (
            <input
              className="wb-page-name-input"
              value={renameText}
              onChange={(e) => setRenameText(e.target.value)}
              onBlur={() => {
                if (renameText.trim()) {
                  dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { name: renameText.trim() } } });
                }
                setRenamingId(null);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span
              className="wb-layer-name"
              onDoubleClick={(e) => {
                if (lockedLabel) return;
                e.stopPropagation();
                setRenamingId(section.id);
                setRenameText(section.name);
              }}
            >
              {lockedLabel || section.name}
            </span>
          )}
          {!lockedLabel && (
            <div className="wb-layer-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_SECTION', payload: { sectionId: section.id, updates: { hidden: !section.hidden } } })}
                title={section.hidden ? 'Show Section' : 'Hide Section'}
              >
                {section.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => { dispatch({ type: 'DELETE_SECTION', payload: { sectionId: section.id } }); dispatch({ type: 'SAVE_HISTORY', payload: { label: 'Delete section' } }); }}
                title="Delete Section"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        {!isCollapsed && section.rows.map(row =>
          row.columns.map(col => col.elements.map(el => renderElementTree(el, 1))),
        )}
      </div>
    );
  };

  return (
    <div className="wb-layers-tab">
      <div className="wb-sidebar-title">Layers</div>
      <div className="wb-search-bar">
        <Search size={13} />
        <input placeholder="Filter layers..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {state.project.settings.headerEnabled && renderSectionLayers(state.project.header, '🔒 Header')}
      {page.sections.map(sec => renderSectionLayers(sec))}
      {state.project.settings.footerEnabled && renderSectionLayers(state.project.footer, '🔒 Footer')}
      {page.sections.length === 0 && (
        <div className="wb-layers-empty">No sections on this page</div>
      )}
    </div>
  );
}
