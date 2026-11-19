// ============================================================
// Website Builder Pro — State Reducer (Recursive Tree Support)
// ============================================================
'use client';

import type {
  BuilderState, BuilderAction, BuilderProject, ElementNode,
  SectionNode, RowNode, ColumnNode, SelectionTarget, ToastMessage,
  PageData,
} from './types';
import { createDefaultProject, uid, createRow, createColumn } from './defaults';
import { loadSavedBlocks, saveSavedBlocks } from './persistence';

const MAX_HISTORY = 60;

/* ========== Initial State ========== */

export function createInitialState(project?: BuilderProject): BuilderState {
  const proj = project ?? createDefaultProject();
  const initialSnapshot: BuilderProject = JSON.parse(JSON.stringify(proj));
  return {
    project: proj,
    currentPageId: proj.pageOrder[0] ?? Object.keys(proj.pages)[0],
    selection: null,
    editingElementId: null,
    hoveredId: null,
    editingStyleState: 'normal',
    viewportMode: 'desktop',
    canvasThemeMode: 'light',
    zoom: 1,
    showGridOverlay: false,
    showOutlines: false,
    leftSidebarTab: 'elements',
    rightSidebarTab: 'style',
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    showProjectManager: false,
    showKeyboardShortcuts: false,
    showPreview: false,
    showCommandPalette: false,
    showCodeModal: false,
    showAuditModal: false,
    contextMenu: null,
    history: [initialSnapshot],
    historyLabels: ['Initial state'],
    historyIndex: 0,
    toasts: [],
    isDragging: false,
    dragData: null,
    clipboardElement: null,
    copiedStyles: null,
    savedBlocks: loadSavedBlocks(),
  };
}

/* ========== Deep Cloning Helpers ========== */

export function cloneElement(el: ElementNode): ElementNode {
  return {
    ...el,
    id: uid(el.type),
    styles: { ...el.styles },
    hoverStyles: { ...el.hoverStyles },
    responsiveStyles: el.responsiveStyles
      ? {
          tablet: el.responsiveStyles.tablet ? { ...el.responsiveStyles.tablet } : undefined,
          mobile: el.responsiveStyles.mobile ? { ...el.responsiveStyles.mobile } : undefined,
        }
      : undefined,
    animation: el.animation ? { ...el.animation } : undefined,
    attributes: { ...el.attributes },
    children: el.children.map(cloneElement),
  };
}

export function cloneSection(sec: SectionNode): SectionNode {
  return {
    ...sec,
    id: uid('sec'),
    styles: { ...sec.styles },
    responsiveStyles: sec.responsiveStyles
      ? {
          tablet: sec.responsiveStyles.tablet ? { ...sec.responsiveStyles.tablet } : undefined,
          mobile: sec.responsiveStyles.mobile ? { ...sec.responsiveStyles.mobile } : undefined,
        }
      : undefined,
    rows: sec.rows.map(r => ({
      ...r,
      id: uid('row'),
      styles: { ...r.styles },
      columns: r.columns.map(c => ({
        ...c,
        id: uid('col'),
        styles: { ...c.styles },
        elements: c.elements.map(cloneElement),
      })),
    })),
  };
}

/* ========== Recursive Element Helpers ========== */

interface ElementSearchHit {
  element: ElementNode;
  trail: ElementNode[]; // parent containers from outermost down to direct parent
  index: number;
}

function findElementInList(
  elements: ElementNode[],
  elementId: string,
  trail: ElementNode[] = [],
): ElementSearchHit | null {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.id === elementId) {
      return { element: el, trail, index: i };
    }
    if (el.children.length > 0) {
      const nested = findElementInList(el.children, elementId, [...trail, el]);
      if (nested) return nested;
    }
  }
  return null;
}

function containsElementId(el: ElementNode, targetId: string): boolean {
  if (el.id === targetId) return true;
  return el.children.some(child => containsElementId(child, targetId));
}

function mapElementsRecursive(
  elements: ElementNode[],
  elementId: string,
  updater: (el: ElementNode) => ElementNode,
): ElementNode[] {
  return elements.map(el => {
    if (el.id === elementId) {
      return updater(el);
    }
    if (el.children.length > 0) {
      return { ...el, children: mapElementsRecursive(el.children, elementId, updater) };
    }
    return el;
  });
}

function filterElementsRecursive(
  elements: ElementNode[],
  elementId: string,
): ElementNode[] {
  return elements
    .filter(el => el.id !== elementId)
    .map(el =>
      el.children.length > 0
        ? { ...el, children: filterElementsRecursive(el.children, elementId) }
        : el,
    );
}

function moveElementInList(
  elements: ElementNode[],
  elementId: string,
  direction: 'up' | 'down',
): { list: ElementNode[]; moved: boolean } {
  const idx = elements.findIndex(e => e.id === elementId);
  if (idx >= 0) {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= elements.length) return { list: elements, moved: false };
    const next = [...elements];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    return { list: next, moved: true };
  }
  let changed = false;
  const next = elements.map(el => {
    if (el.children.length === 0) return el;
    const res = moveElementInList(el.children, elementId, direction);
    if (res.moved) {
      changed = true;
      return { ...el, children: res.list };
    }
    return el;
  });
  return { list: next, moved: changed };
}

function duplicateElementInList(
  elements: ElementNode[],
  elementId: string,
): { list: ElementNode[]; duplicated: boolean } {
  const idx = elements.findIndex(e => e.id === elementId);
  if (idx >= 0) {
    const next = [...elements];
    next.splice(idx + 1, 0, cloneElement(elements[idx]));
    return { list: next, duplicated: true };
  }
  let changed = false;
  const next = elements.map(el => {
    if (el.children.length === 0) return el;
    const res = duplicateElementInList(el.children, elementId);
    if (res.duplicated) {
      changed = true;
      return { ...el, children: res.list };
    }
    return el;
  });
  return { list: next, duplicated: changed };
}

function insertElementInContainer(
  elements: ElementNode[],
  containerId: string,
  element: ElementNode,
  index?: number,
): { list: ElementNode[]; inserted: boolean } {
  let changed = false;
  const next = elements.map(el => {
    if (el.id === containerId) {
      changed = true;
      const children = [...el.children];
      if (index !== undefined && index >= 0 && index <= children.length) {
        children.splice(index, 0, element);
      } else {
        children.push(element);
      }
      return { ...el, children };
    }
    if (el.children.length > 0) {
      const res = insertElementInContainer(el.children, containerId, element, index);
      if (res.inserted) {
        changed = true;
        return { ...el, children: res.list };
      }
    }
    return el;
  });
  return { list: next, inserted: changed };
}

/* ========== Location Helpers ========== */

interface LocatedElement {
  source: 'page' | 'header' | 'footer';
  section: SectionNode;
  row: RowNode;
  col: ColumnNode;
  sectionIdx: number;
  rowIdx: number;
  colIdx: number;
  hit: ElementSearchHit;
}

function findInSections(
  sections: SectionNode[],
  elementId: string,
): Omit<LocatedElement, 'source'> | null {
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    for (let ri = 0; ri < sec.rows.length; ri++) {
      const row = sec.rows[ri];
      for (let ci = 0; ci < row.columns.length; ci++) {
        const col = row.columns[ci];
        const hit = findElementInList(col.elements, elementId);
        if (hit) {
          return { section: sec, row, col, sectionIdx: si, rowIdx: ri, colIdx: ci, hit };
        }
      }
    }
  }
  return null;
}

function locateElement(state: BuilderState, elementId: string): LocatedElement | null {
  const page = state.project.pages[state.currentPageId];
  if (page) {
    const found = findInSections(page.sections, elementId);
    if (found) return { source: 'page', ...found };
  }
  const inHeader = findInSections([state.project.header], elementId);
  if (inHeader) return { source: 'header', ...inHeader };

  const inFooter = findInSections([state.project.footer], elementId);
  if (inFooter) return { source: 'footer', ...inFooter };

  return null;
}

function findColumn(
  state: BuilderState,
  columnId: string,
): { col: ColumnNode; row: RowNode; section: SectionNode; source: 'page' | 'header' | 'footer'; si: number; ri: number; ci: number } | null {
  const sources: Array<{ key: 'page' | 'header' | 'footer'; sections: SectionNode[] }> = [];
  const page = state.project.pages[state.currentPageId];
  if (page) sources.push({ key: 'page', sections: page.sections });
  sources.push({ key: 'header', sections: [state.project.header] });
  sources.push({ key: 'footer', sections: [state.project.footer] });

  for (const { key, sections } of sources) {
    for (let si = 0; si < sections.length; si++) {
      for (let ri = 0; ri < sections[si].rows.length; ri++) {
        for (let ci = 0; ci < sections[si].rows[ri].columns.length; ci++) {
          if (sections[si].rows[ri].columns[ci].id === columnId) {
            return {
              col: sections[si].rows[ri].columns[ci],
              row: sections[si].rows[ri],
              section: sections[si],
              source: key,
              si,
              ri,
              ci,
            };
          }
        }
      }
    }
  }
  return null;
}

function findRow(
  state: BuilderState,
  rowId: string,
): { row: RowNode; section: SectionNode; source: 'page' | 'header' | 'footer'; si: number; ri: number } | null {
  const sources: Array<{ key: 'page' | 'header' | 'footer'; sections: SectionNode[] }> = [];
  const page = state.project.pages[state.currentPageId];
  if (page) sources.push({ key: 'page', sections: page.sections });
  sources.push({ key: 'header', sections: [state.project.header] });
  sources.push({ key: 'footer', sections: [state.project.footer] });

  for (const { key, sections } of sources) {
    for (let si = 0; si < sections.length; si++) {
      for (let ri = 0; ri < sections[si].rows.length; ri++) {
        if (sections[si].rows[ri].id === rowId) {
          return { row: sections[si].rows[ri], section: sections[si], source: key, si, ri };
        }
      }
    }
  }
  return null;
}

function findSection(
  state: BuilderState,
  sectionId: string,
): { section: SectionNode; source: 'page' | 'header' | 'footer'; index: number } | null {
  const page = state.project.pages[state.currentPageId];
  if (page) {
    const idx = page.sections.findIndex(s => s.id === sectionId);
    if (idx >= 0) return { section: page.sections[idx], source: 'page', index: idx };
  }
  if (state.project.header.id === sectionId) return { section: state.project.header, source: 'header', index: 0 };
  if (state.project.footer.id === sectionId) return { section: state.project.footer, source: 'footer', index: 0 };
  return null;
}

function updateSections(
  state: BuilderState,
  source: 'page' | 'header' | 'footer',
  updater: (sections: SectionNode[]) => SectionNode[],
): BuilderState {
  const project = { ...state.project };
  if (source === 'page') {
    const page = { ...project.pages[state.currentPageId] };
    page.sections = updater(page.sections);
    project.pages = { ...project.pages, [state.currentPageId]: page };
  } else if (source === 'header') {
    const updated = updater([project.header]);
    project.header = updated[0] ?? project.header;
  } else {
    const updated = updater([project.footer]);
    project.footer = updated[0] ?? project.footer;
  }
  return { ...state, project: { ...project, updatedAt: Date.now() } };
}

function insertElementIntoTarget(
  state: BuilderState,
  element: ElementNode,
  opts: { columnId?: string; containerId?: string; index?: number },
): BuilderState {
  if (opts.containerId) {
    const containerLoc = locateElement(state, opts.containerId);
    if (!containerLoc) return state;
    return updateSections(state, containerLoc.source, sections =>
      sections.map(s => ({
        ...s,
        rows: s.rows.map(r => ({
          ...r,
          columns: r.columns.map(c => {
            if (c.id !== containerLoc.col.id) return c;
            const res = insertElementInContainer(c.elements, opts.containerId!, element, opts.index);
            return res.inserted ? { ...c, elements: res.list } : c;
          }),
        })),
      })),
    );
  }
  if (opts.columnId) {
    const loc = findColumn(state, opts.columnId);
    if (!loc) return state;
    return updateSections(state, loc.source, sections =>
      sections.map(s => ({
        ...s,
        rows: s.rows.map(r => ({
          ...r,
          columns: r.columns.map(c => {
            if (c.id !== opts.columnId) return c;
            const els = [...c.elements];
            if (opts.index !== undefined && opts.index >= 0 && opts.index <= els.length) {
              els.splice(opts.index, 0, element);
            } else {
              els.push(element);
            }
            return { ...c, elements: els };
          }),
        })),
      })),
    );
  }
  return state;
}

/* ========== Reducer ========== */

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {

    // ---- Element CRUD ----

    case 'ADD_ELEMENT': {
      const { columnId, containerId, element, index } = action.payload;
      return insertElementIntoTarget(state, element, { columnId, containerId, index });
    }

    case 'UPDATE_ELEMENT': {
      const { elementId, updates } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections =>
        sections.map(s => ({
          ...s,
          rows: s.rows.map(r => ({
            ...r,
            columns: r.columns.map(c => ({
              ...c,
              elements: mapElementsRecursive(c.elements, elementId, e => ({ ...e, ...updates })),
            })),
          })),
        })),
      );
    }

    case 'UPDATE_ELEMENT_STYLES': {
      const { elementId, styles } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections =>
        sections.map(s => ({
          ...s,
          rows: s.rows.map(r => ({
            ...r,
            columns: r.columns.map(c => ({
              ...c,
              elements: mapElementsRecursive(c.elements, elementId, e => ({
                ...e,
                styles: { ...e.styles, ...styles },
              })),
            })),
          })),
        })),
      );
    }

    case 'UPDATE_ELEMENT_HOVER_STYLES': {
      const { elementId, styles } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections =>
        sections.map(s => ({
          ...s,
          rows: s.rows.map(r => ({
            ...r,
            columns: r.columns.map(c => ({
              ...c,
              elements: mapElementsRecursive(c.elements, elementId, e => ({
                ...e,
                hoverStyles: { ...e.hoverStyles, ...styles },
              })),
            })),
          })),
        })),
      );
    }

    case 'UPDATE_ELEMENT_RESPONSIVE_STYLES': {
      const { elementId, viewport, styles } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections =>
        sections.map(s => ({
          ...s,
          rows: s.rows.map(r => ({
            ...r,
            columns: r.columns.map(c => ({
              ...c,
              elements: mapElementsRecursive(c.elements, elementId, e => ({
                ...e,
                responsiveStyles: {
                  ...(e.responsiveStyles ?? {}),
                  [viewport]: {
                    ...(e.responsiveStyles?.[viewport] ?? {}),
                    ...styles,
                  },
                },
              })),
            })),
          })),
        })),
      );
    }

    case 'CLEAR_ELEMENT_RESPONSIVE_STYLES': {
      const { elementId, viewport } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections =>
        sections.map(s => ({
          ...s,
          rows: s.rows.map(r => ({
            ...r,
            columns: r.columns.map(c => ({
              ...c,
              elements: mapElementsRecursive(c.elements, elementId, e => {
                if (!e.responsiveStyles) return e;
                const nextResp = { ...e.responsiveStyles };
                delete nextResp[viewport];
                return { ...e, responsiveStyles: nextResp };
              }),
            })),
          })),
        })),
      );
    }

    case 'DELETE_ELEMENT': {
      const { elementId } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      const newState = updateSections(state, loc.source, sections =>
        sections.map(s => ({
          ...s,
          rows: s.rows.map(r => ({
            ...r,
            columns: r.columns.map(c => ({
              ...c,
              elements: filterElementsRecursive(c.elements, elementId),
            })),
          })),
        })),
      );
      if (state.selection?.id === elementId) {
        return { ...newState, selection: null, editingElementId: null };
      }
      return newState;
    }

    case 'MOVE_ELEMENT': {
      const { elementId, direction } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections =>
        sections.map((s, si) => {
          if (si !== loc.sectionIdx) return s;
          return {
            ...s,
            rows: s.rows.map((r, ri) => {
              if (ri !== loc.rowIdx) return r;
              return {
                ...r,
                columns: r.columns.map((c, ci) => {
                  if (ci !== loc.colIdx) return c;
                  const res = moveElementInList(c.elements, elementId, direction);
                  return res.moved ? { ...c, elements: res.list } : c;
                }),
              };
            }),
          };
        }),
      );
    }

    case 'MOVE_ELEMENT_TO': {
      const { elementId, targetColumnId, targetContainerId, targetIndex } = action.payload;
      const srcLoc = locateElement(state, elementId);
      if (!srcLoc) return state;

      const movingEl = srcLoc.hit.element;
      if (targetContainerId && containsElementId(movingEl, targetContainerId)) {
        return state; // prevent cyclic nesting into self or descendant
      }

      // Compute adjusted targetIndex if moving within the same list
      let adjustedIndex = targetIndex;
      if (adjustedIndex !== undefined) {
        const directParentContainer = srcLoc.hit.trail[srcLoc.hit.trail.length - 1];
        const sameContainer = Boolean(targetContainerId && directParentContainer?.id === targetContainerId);
        const sameColumn = Boolean(targetColumnId && !directParentContainer && srcLoc.col.id === targetColumnId);
        if ((sameContainer || sameColumn) && srcLoc.hit.index < adjustedIndex) {
          adjustedIndex = Math.max(0, adjustedIndex - 1);
        }
      }

      // Remove from source
      const afterRemove = updateSections(state, srcLoc.source, sections =>
        sections.map(s => ({
          ...s,
          rows: s.rows.map(r => ({
            ...r,
            columns: r.columns.map(c => ({
              ...c,
              elements: filterElementsRecursive(c.elements, elementId),
            })),
          })),
        })),
      );

      // Insert into destination
      return insertElementIntoTarget(afterRemove, movingEl, {
        columnId: targetColumnId,
        containerId: targetContainerId,
        index: adjustedIndex,
      });
    }

    case 'DUPLICATE_ELEMENT': {
      const { elementId } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections =>
        sections.map((s, si) => {
          if (si !== loc.sectionIdx) return s;
          return {
            ...s,
            rows: s.rows.map((r, ri) => {
              if (ri !== loc.rowIdx) return r;
              return {
                ...r,
                columns: r.columns.map((c, ci) => {
                  if (ci !== loc.colIdx) return c;
                  const res = duplicateElementInList(c.elements, elementId);
                  return res.duplicated ? { ...c, elements: res.list } : c;
                }),
              };
            }),
          };
        }),
      );
    }

    // ---- Section CRUD ----

    case 'ADD_SECTION': {
      const { section, index, target } = action.payload;
      const dest = target ?? 'page';
      if (dest === 'page') {
        const page = { ...state.project.pages[state.currentPageId] };
        const secs = [...page.sections];
        if (index !== undefined && index >= 0 && index <= secs.length) {
          secs.splice(index, 0, section);
        } else {
          secs.push(section);
        }
        page.sections = secs;
        return {
          ...state,
          project: {
            ...state.project,
            pages: { ...state.project.pages, [state.currentPageId]: page },
            updatedAt: Date.now(),
          },
        };
      }
      return state;
    }

    case 'UPDATE_SECTION': {
      const { sectionId, updates } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc) return state;
      const updated = { ...loc.section, ...updates };
      if (loc.source === 'header') {
        return { ...state, project: { ...state.project, header: updated, updatedAt: Date.now() } };
      }
      if (loc.source === 'footer') {
        return { ...state, project: { ...state.project, footer: updated, updatedAt: Date.now() } };
      }
      const page = { ...state.project.pages[state.currentPageId] };
      page.sections = page.sections.map(s => (s.id === sectionId ? updated : s));
      return {
        ...state,
        project: { ...state.project, pages: { ...state.project.pages, [state.currentPageId]: page }, updatedAt: Date.now() },
      };
    }

    case 'UPDATE_SECTION_STYLES': {
      const { sectionId, styles } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc) return state;
      return builderReducer(state, {
        type: 'UPDATE_SECTION',
        payload: {
          sectionId,
          updates: { styles: { ...loc.section.styles, ...styles } },
        },
      });
    }

    case 'UPDATE_SECTION_RESPONSIVE_STYLES': {
      const { sectionId, viewport, styles } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc) return state;
      return builderReducer(state, {
        type: 'UPDATE_SECTION',
        payload: {
          sectionId,
          updates: {
            responsiveStyles: {
              ...(loc.section.responsiveStyles ?? {}),
              [viewport]: {
                ...(loc.section.responsiveStyles?.[viewport] ?? {}),
                ...styles,
              },
            },
          },
        },
      });
    }

    case 'DELETE_SECTION': {
      const { sectionId } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc || loc.source !== 'page') return state;
      const page = { ...state.project.pages[state.currentPageId] };
      page.sections = page.sections.filter(s => s.id !== sectionId);
      const newState: BuilderState = {
        ...state,
        project: { ...state.project, pages: { ...state.project.pages, [state.currentPageId]: page }, updatedAt: Date.now() },
      };
      if (state.selection?.id === sectionId) {
        newState.selection = null;
      }
      return newState;
    }

    case 'MOVE_SECTION': {
      const { sectionId, direction } = action.payload;
      const page = { ...state.project.pages[state.currentPageId] };
      if (!page) return state;
      const idx = page.sections.findIndex(s => s.id === sectionId);
      if (idx < 0) return state;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= page.sections.length) return state;
      const secs = [...page.sections];
      [secs[idx], secs[newIdx]] = [secs[newIdx], secs[idx]];
      page.sections = secs;
      return {
        ...state,
        project: { ...state.project, pages: { ...state.project.pages, [state.currentPageId]: page }, updatedAt: Date.now() },
      };
    }

    case 'REORDER_SECTION': {
      const { sectionId, targetIndex } = action.payload;
      const page = { ...state.project.pages[state.currentPageId] };
      if (!page) return state;
      const fromIdx = page.sections.findIndex(s => s.id === sectionId);
      if (fromIdx < 0) return state;
      const secs = [...page.sections];
      const [item] = secs.splice(fromIdx, 1);
      const adjusted = fromIdx < targetIndex ? targetIndex - 1 : targetIndex;
      const clamped = Math.max(0, Math.min(secs.length, adjusted));
      secs.splice(clamped, 0, item);
      page.sections = secs;
      return {
        ...state,
        project: { ...state.project, pages: { ...state.project.pages, [state.currentPageId]: page }, updatedAt: Date.now() },
      };
    }

    case 'DUPLICATE_SECTION': {
      const { sectionId } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc || loc.source !== 'page') return state;
      const cloned = cloneSection(loc.section);
      const page = { ...state.project.pages[state.currentPageId] };
      const secs = [...page.sections];
      secs.splice(loc.index + 1, 0, cloned);
      page.sections = secs;
      return {
        ...state,
        project: { ...state.project, pages: { ...state.project.pages, [state.currentPageId]: page }, updatedAt: Date.now() },
        selection: { id: cloned.id, target: 'section' },
      };
    }

    // ---- Row & Column ----

    case 'ADD_ROW': {
      const { sectionId, columns } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc) return state;
      const newRow = createRow(columns);
      const updatedSection = { ...loc.section, rows: [...loc.section.rows, newRow] };
      return builderReducer(state, { type: 'UPDATE_SECTION', payload: { sectionId, updates: updatedSection } });
    }

    case 'DELETE_ROW': {
      const { sectionId, rowId } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc || loc.section.rows.length <= 1) return state;
      const updatedSection = { ...loc.section, rows: loc.section.rows.filter(r => r.id !== rowId) };
      const next = builderReducer(state, { type: 'UPDATE_SECTION', payload: { sectionId, updates: updatedSection } });
      return next.selection?.id === rowId ? { ...next, selection: null } : next;
    }

    case 'UPDATE_ROW_STYLES': {
      const { sectionId, rowId, styles } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc) return state;
      const updatedRows = loc.section.rows.map(r =>
        r.id === rowId ? { ...r, styles: { ...r.styles, ...styles } } : r,
      );
      return builderReducer(state, {
        type: 'UPDATE_SECTION',
        payload: { sectionId, updates: { rows: updatedRows } },
      });
    }

    case 'DUPLICATE_ROW': {
      const { sectionId, rowId } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc) return state;
      const idx = loc.section.rows.findIndex(r => r.id === rowId);
      if (idx < 0) return state;
      const srcRow = loc.section.rows[idx];
      const clonedRow: RowNode = {
        id: uid('row'),
        styles: { ...srcRow.styles },
        columns: srcRow.columns.map(c => ({
          id: uid('col'),
          span: c.span,
          styles: { ...c.styles },
          elements: c.elements.map(cloneElement),
        })),
      };
      const rows = [...loc.section.rows];
      rows.splice(idx + 1, 0, clonedRow);
      return builderReducer(state, { type: 'UPDATE_SECTION', payload: { sectionId, updates: { rows } } });
    }

    case 'MOVE_ROW': {
      const { sectionId, rowId, direction } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc) return state;
      const idx = loc.section.rows.findIndex(r => r.id === rowId);
      if (idx < 0) return state;
      const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= loc.section.rows.length) return state;
      const rows = [...loc.section.rows];
      [rows[idx], rows[nextIdx]] = [rows[nextIdx], rows[idx]];
      return builderReducer(state, { type: 'UPDATE_SECTION', payload: { sectionId, updates: { rows } } });
    }

    case 'ADD_COLUMN': {
      const { sectionId, rowId } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc) return state;
      const updatedSection = {
        ...loc.section,
        rows: loc.section.rows.map(r => {
          if (r.id !== rowId) return r;
          const newColCount = r.columns.length + 1;
          if (newColCount > 6) return r;
          const span = Math.max(1, Math.floor(12 / newColCount));
          const cols = r.columns.map(c => ({ ...c, span }));
          cols.push(createColumn(span));
          return { ...r, columns: cols };
        }),
      };
      return builderReducer(state, { type: 'UPDATE_SECTION', payload: { sectionId, updates: updatedSection } });
    }

    case 'REMOVE_COLUMN': {
      const { sectionId, rowId } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc) return state;
      const updatedSection = {
        ...loc.section,
        rows: loc.section.rows.map(r => {
          if (r.id !== rowId || r.columns.length <= 1) return r;
          const removed = r.columns[r.columns.length - 1];
          const cols = r.columns.slice(0, -1);
          const span = Math.max(1, Math.floor(12 / cols.length));
          return {
            ...r,
            columns: cols.map((c, idx) =>
              idx === cols.length - 1
                ? { ...c, span, elements: [...c.elements, ...removed.elements] }
                : { ...c, span },
            ),
          };
        }),
      };
      return builderReducer(state, { type: 'UPDATE_SECTION', payload: { sectionId, updates: updatedSection } });
    }

    case 'UPDATE_COLUMN_STYLES': {
      const { columnId, styles } = action.payload;
      const loc = findColumn(state, columnId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections =>
        sections.map((s, si) => {
          if (si !== loc.si) return s;
          return {
            ...s,
            rows: s.rows.map((r, ri) => {
              if (ri !== loc.ri) return r;
              return {
                ...r,
                columns: r.columns.map((c, ci) =>
                  ci === loc.ci ? { ...c, styles: { ...c.styles, ...styles } } : c,
                ),
              };
            }),
          };
        }),
      );
    }

    case 'SET_COLUMN_SPAN': {
      const { columnId, span } = action.payload;
      const clampedSpan = Math.max(1, Math.min(12, span));
      const loc = findColumn(state, columnId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections =>
        sections.map((s, si) => {
          if (si !== loc.si) return s;
          return {
            ...s,
            rows: s.rows.map((r, ri) => {
              if (ri !== loc.ri) return r;
              return {
                ...r,
                columns: r.columns.map((c, ci) =>
                  ci === loc.ci ? { ...c, span: clampedSpan } : c,
                ),
              };
            }),
          };
        }),
      );
    }

    case 'SET_COLUMN_LAYOUT': {
      const { sectionId, rowId, spans } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc || spans.length === 0) return state;
      const updatedRows = loc.section.rows.map(r => {
        if (r.id !== rowId) return r;
        const currentCols = r.columns;
        const nextCols: ColumnNode[] = spans.map((span, idx) => {
          if (idx < currentCols.length) {
            return { ...currentCols[idx], span };
          }
          return createColumn(span);
        });
        // Preserve elements from removed columns by appending to the last remaining column
        if (currentCols.length > spans.length) {
          const overflow = currentCols.slice(spans.length).flatMap(c => c.elements);
          const lastIdx = nextCols.length - 1;
          nextCols[lastIdx] = {
            ...nextCols[lastIdx],
            elements: [...nextCols[lastIdx].elements, ...overflow],
          };
        }
        return { ...r, columns: nextCols };
      });
      return builderReducer(state, {
        type: 'UPDATE_SECTION',
        payload: { sectionId, updates: { rows: updatedRows } },
      });
    }

    // ---- Page Management ----

    case 'ADD_PAGE': {
      const { page } = action.payload;
      return {
        ...state,
        project: {
          ...state.project,
          pages: { ...state.project.pages, [page.id]: page },
          pageOrder: [...state.project.pageOrder, page.id],
          updatedAt: Date.now(),
        },
        currentPageId: page.id,
        selection: null,
        editingElementId: null,
      };
    }

    case 'UPDATE_PAGE': {
      const { pageId, updates } = action.payload;
      const page = state.project.pages[pageId];
      if (!page) return state;
      return {
        ...state,
        project: {
          ...state.project,
          pages: { ...state.project.pages, [pageId]: { ...page, ...updates } },
          updatedAt: Date.now(),
        },
      };
    }

    case 'DELETE_PAGE': {
      const { pageId } = action.payload;
      if (state.project.pageOrder.length <= 1) return state;
      const pages = { ...state.project.pages };
      delete pages[pageId];
      const pageOrder = state.project.pageOrder.filter(id => id !== pageId);
      Object.values(pages).forEach(p => {
        if (p.parentId === pageId) {
          pages[p.id] = { ...p, parentId: null };
        }
      });
      return {
        ...state,
        project: { ...state.project, pages, pageOrder, updatedAt: Date.now() },
        currentPageId: state.currentPageId === pageId ? pageOrder[0] : state.currentPageId,
        selection: null,
        editingElementId: null,
      };
    }

    case 'DUPLICATE_PAGE': {
      const { pageId } = action.payload;
      const src = state.project.pages[pageId];
      if (!src) return state;
      const newPage: PageData = {
        ...src,
        id: uid('page'),
        title: `${src.title} Copy`,
        slug: `${src.slug}-copy`,
        sections: src.sections.map(cloneSection),
        seo: { ...src.seo, title: `${src.seo.title || src.title} Copy` },
      };
      const idx = state.project.pageOrder.indexOf(pageId);
      const nextOrder = [...state.project.pageOrder];
      nextOrder.splice(idx + 1, 0, newPage.id);
      return {
        ...state,
        project: {
          ...state.project,
          pages: { ...state.project.pages, [newPage.id]: newPage },
          pageOrder: nextOrder,
          updatedAt: Date.now(),
        },
        currentPageId: newPage.id,
        selection: null,
      };
    }

    case 'MOVE_PAGE': {
      const { pageId, direction } = action.payload;
      const idx = state.project.pageOrder.indexOf(pageId);
      if (idx < 0) return state;
      const nextIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (nextIdx < 0 || nextIdx >= state.project.pageOrder.length) return state;
      const order = [...state.project.pageOrder];
      [order[idx], order[nextIdx]] = [order[nextIdx], order[idx]];
      return {
        ...state,
        project: { ...state.project, pageOrder: order, updatedAt: Date.now() },
      };
    }

    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPageId: action.payload.pageId,
        selection: null,
        editingElementId: null,
        contextMenu: null,
      };

    case 'REORDER_PAGES':
      return {
        ...state,
        project: { ...state.project, pageOrder: action.payload.pageOrder, updatedAt: Date.now() },
      };

    // ---- Selection & Hover ----

    case 'SELECT':
      return {
        ...state,
        selection: action.payload,
        editingElementId: state.editingElementId === action.payload.id ? state.editingElementId : null,
        contextMenu: null,
      };

    case 'DESELECT':
      return { ...state, selection: null, editingElementId: null, contextMenu: null };

    case 'SET_EDITING':
      return { ...state, editingElementId: action.payload.elementId };

    case 'SET_HOVERED':
      return { ...state, hoveredId: action.payload.id };

    case 'SET_EDITING_STYLE_STATE':
      return { ...state, editingStyleState: action.payload.mode };

    // ---- Theme ----

    case 'SET_THEME':
      return {
        ...state,
        project: {
          ...state.project,
          theme: { ...state.project.theme, ...action.payload },
          updatedAt: Date.now(),
        },
      };

    case 'APPLY_THEME_PRESET': {
      const { preset } = action.payload;
      return {
        ...state,
        canvasThemeMode: preset.defaultMode,
        project: {
          ...state.project,
          theme: JSON.parse(JSON.stringify(preset.theme)),
          updatedAt: Date.now(),
        },
      };
    }

    case 'TOGGLE_CANVAS_THEME':
      return { ...state, canvasThemeMode: state.canvasThemeMode === 'light' ? 'dark' : 'light' };

    // ---- Settings ----

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        project: {
          ...state.project,
          settings: { ...state.project.settings, ...action.payload },
          updatedAt: Date.now(),
        },
      };

    // ---- Assets ----

    case 'ADD_ASSET': {
      const { asset } = action.payload;
      return {
        ...state,
        project: {
          ...state.project,
          assets: { ...state.project.assets, [asset.id]: asset },
          updatedAt: Date.now(),
        },
      };
    }

    case 'DELETE_ASSET': {
      const assets = { ...state.project.assets };
      delete assets[action.payload.assetId];
      return {
        ...state,
        project: { ...state.project, assets, updatedAt: Date.now() },
      };
    }

    case 'RENAME_ASSET': {
      const { assetId, name } = action.payload;
      const asset = state.project.assets[assetId];
      if (!asset) return state;
      return {
        ...state,
        project: {
          ...state.project,
          assets: { ...state.project.assets, [assetId]: { ...asset, name } },
          updatedAt: Date.now(),
        },
      };
    }

    // ---- Viewport & UI ----

    case 'SET_VIEWPORT':
      return { ...state, viewportMode: action.payload.mode };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.4, Math.min(1.5, action.payload.zoom)) };

    case 'TOGGLE_GRID_OVERLAY':
      return { ...state, showGridOverlay: !state.showGridOverlay };

    case 'TOGGLE_OUTLINES':
      return { ...state, showOutlines: !state.showOutlines };

    case 'SET_LEFT_TAB':
      return { ...state, leftSidebarTab: action.payload.tab, leftSidebarOpen: true };

    case 'SET_RIGHT_TAB':
      return { ...state, rightSidebarTab: action.payload.tab, rightSidebarOpen: true };

    case 'TOGGLE_LEFT_SIDEBAR':
      return { ...state, leftSidebarOpen: !state.leftSidebarOpen };

    case 'TOGGLE_RIGHT_SIDEBAR':
      return { ...state, rightSidebarOpen: !state.rightSidebarOpen };

    case 'SHOW_PROJECT_MANAGER':
      return { ...state, showProjectManager: action.payload.show };

    case 'SHOW_KEYBOARD_SHORTCUTS':
      return { ...state, showKeyboardShortcuts: action.payload.show };

    case 'SHOW_PREVIEW':
      return { ...state, showPreview: action.payload.show };

    case 'SHOW_COMMAND_PALETTE':
      return { ...state, showCommandPalette: action.payload.show };

    case 'SHOW_CODE_MODAL':
      return { ...state, showCodeModal: action.payload.show };

    case 'SHOW_AUDIT_MODAL':
      return { ...state, showAuditModal: action.payload.show };

    case 'SET_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload.menu };

    // ---- Drag ----

    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload.isDragging, dragData: action.payload.data };

    // ---- History ----

    case 'SAVE_HISTORY': {
      const history = state.history.slice(0, state.historyIndex + 1);
      const historyLabels = state.historyLabels.slice(0, state.historyIndex + 1);
      const serialized = JSON.stringify(state.project);
      // Skip duplicate snapshot if project is unchanged
      if (history.length > 0 && JSON.stringify(history[history.length - 1]) === serialized) {
        return state;
      }
      history.push(JSON.parse(serialized));
      historyLabels.push(action.payload?.label ?? 'Edit');
      if (history.length > MAX_HISTORY) {
        history.shift();
        historyLabels.shift();
      }
      return { ...state, history, historyLabels, historyIndex: history.length - 1 };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const project: BuilderProject = JSON.parse(JSON.stringify(state.history[newIndex]));
      const currentPageId = project.pages[state.currentPageId]
        ? state.currentPageId
        : project.pageOrder[0] ?? Object.keys(project.pages)[0];
      return {
        ...state,
        project,
        currentPageId,
        historyIndex: newIndex,
        selection: null,
        editingElementId: null,
        contextMenu: null,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const project: BuilderProject = JSON.parse(JSON.stringify(state.history[newIndex]));
      const currentPageId = project.pages[state.currentPageId]
        ? state.currentPageId
        : project.pageOrder[0] ?? Object.keys(project.pages)[0];
      return {
        ...state,
        project,
        currentPageId,
        historyIndex: newIndex,
        selection: null,
        editingElementId: null,
        contextMenu: null,
      };
    }

    case 'HISTORY_JUMP': {
      const { index } = action.payload;
      if (index < 0 || index >= state.history.length) return state;
      const project: BuilderProject = JSON.parse(JSON.stringify(state.history[index]));
      const currentPageId = project.pages[state.currentPageId]
        ? state.currentPageId
        : project.pageOrder[0] ?? Object.keys(project.pages)[0];
      return {
        ...state,
        project,
        currentPageId,
        historyIndex: index,
        selection: null,
        editingElementId: null,
      };
    }

    // ---- Toast ----

    case 'ADD_TOAST': {
      const toast: ToastMessage = { ...action.payload, id: uid('toast') };
      return { ...state, toasts: [...state.toasts.slice(-4), toast] };
    }

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload.toastId) };

    // ---- Project ----

    case 'LOAD_PROJECT':
      return createInitialState(action.payload.project);

    case 'NEW_PROJECT':
      return createInitialState(action.payload.project);

    case 'SET_PROJECT_NAME':
      return {
        ...state,
        project: {
          ...state.project,
          name: action.payload.name,
          settings: { ...state.project.settings, siteName: action.payload.name },
          updatedAt: Date.now(),
        },
      };

    // ---- Clipboard & Saved Blocks ----

    case 'COPY_ELEMENT':
      return { ...state, clipboardElement: cloneElement(action.payload.element) };

    case 'PASTE_ELEMENT': {
      if (!state.clipboardElement) return state;
      const el = cloneElement(state.clipboardElement);
      return insertElementIntoTarget(state, el, {
        columnId: action.payload.columnId,
        containerId: action.payload.containerId,
      });
    }

    case 'COPY_STYLES':
      return { ...state, copiedStyles: { ...action.payload.styles } };

    case 'PASTE_STYLES': {
      if (!state.copiedStyles) return state;
      const { targetId, targetType } = action.payload;
      if (targetType === 'element') {
        return builderReducer(state, {
          type: 'UPDATE_ELEMENT_STYLES',
          payload: { elementId: targetId, styles: state.copiedStyles },
        });
      }
      if (targetType === 'section') {
        return builderReducer(state, {
          type: 'UPDATE_SECTION_STYLES',
          payload: { sectionId: targetId, styles: state.copiedStyles },
        });
      }
      if (targetType === 'column') {
        return builderReducer(state, {
          type: 'UPDATE_COLUMN_STYLES',
          payload: { columnId: targetId, styles: state.copiedStyles },
        });
      }
      return state;
    }

    case 'SAVE_BLOCK': {
      const cloned = cloneSection(action.payload.section);
      const nextBlocks = [cloned, ...state.savedBlocks].slice(0, 24);
      saveSavedBlocks(nextBlocks);
      return { ...state, savedBlocks: nextBlocks };
    }

    case 'DELETE_SAVED_BLOCK': {
      const nextBlocks = state.savedBlocks.filter(b => b.id !== action.payload.blockId);
      saveSavedBlocks(nextBlocks);
      return { ...state, savedBlocks: nextBlocks };
    }

    case 'SET_SAVED_BLOCKS':
      saveSavedBlocks(action.payload.blocks);
      return { ...state, savedBlocks: action.payload.blocks };

    default:
      return state;
  }
}

/* ========== Toast Helper ========== */

export function showToast(
  dispatch: React.Dispatch<BuilderAction>,
  type: ToastMessage['type'],
  message: string,
  duration = 3000,
) {
  dispatch({ type: 'ADD_TOAST', payload: { type, message, duration } });
}

/* ========== Public Selector Helpers ========== */

export function getSelectedElement(state: BuilderState): ElementNode | null {
  if (!state.selection || state.selection.target !== 'element') return null;
  const loc = locateElement(state, state.selection.id);
  return loc?.hit.element ?? null;
}

export function getSelectedSection(state: BuilderState): SectionNode | null {
  if (!state.selection || state.selection.target !== 'section') return null;
  return findSection(state, state.selection.id)?.section ?? null;
}

export function getSelectedColumn(state: BuilderState): ColumnNode | null {
  if (!state.selection || state.selection.target !== 'column') return null;
  return findColumn(state, state.selection.id)?.col ?? null;
}

export function getSelectedRow(state: BuilderState): { row: RowNode; section: SectionNode } | null {
  if (!state.selection || state.selection.target !== 'row') return null;
  const loc = findRow(state, state.selection.id);
  return loc ? { row: loc.row, section: loc.section } : null;
}

export function getCurrentPage(state: BuilderState): PageData | null {
  return state.project.pages[state.currentPageId] ?? null;
}

export function getFirstColumnId(state: BuilderState): string | null {
  const page = getCurrentPage(state);
  if (!page || page.sections.length === 0) return null;
  const lastSection = page.sections[page.sections.length - 1];
  if (lastSection.rows.length === 0) return null;
  const lastRow = lastSection.rows[lastSection.rows.length - 1];
  if (lastRow.columns.length === 0) return null;
  return lastRow.columns[0].id;
}

export function getColumnForElement(state: BuilderState, elementId: string): string | null {
  const loc = locateElement(state, elementId);
  return loc?.col.id ?? null;
}

export interface BreadcrumbItem {
  id: string;
  target: SelectionTarget;
  label: string;
}

export function getBreadcrumb(state: BuilderState): BreadcrumbItem[] {
  if (!state.selection) return [];
  const { id, target } = state.selection;

  if (target === 'section') {
    const loc = findSection(state, id);
    return loc ? [{ id: loc.section.id, target: 'section', label: loc.section.name }] : [];
  }

  if (target === 'row') {
    const loc = findRow(state, id);
    if (!loc) return [];
    return [
      { id: loc.section.id, target: 'section', label: loc.section.name },
      { id: loc.row.id, target: 'row', label: `Row ${loc.ri + 1}` },
    ];
  }

  if (target === 'column') {
    const loc = findColumn(state, id);
    if (!loc) return [];
    return [
      { id: loc.section.id, target: 'section', label: loc.section.name },
      { id: loc.row.id, target: 'row', label: `Row ${loc.ri + 1}` },
      { id: loc.col.id, target: 'column', label: `Col ${loc.ci + 1} (${loc.col.span}/12)` },
    ];
  }

  if (target === 'element') {
    const loc = locateElement(state, id);
    if (!loc) return [];
    const items: BreadcrumbItem[] = [
      { id: loc.section.id, target: 'section', label: loc.section.name },
      { id: loc.row.id, target: 'row', label: `Row ${loc.rowIdx + 1}` },
      { id: loc.col.id, target: 'column', label: `Col ${loc.colIdx + 1}` },
    ];
    for (const ancestor of loc.hit.trail) {
      items.push({ id: ancestor.id, target: 'element', label: ancestor.name || ancestor.type });
    }
    items.push({
      id: loc.hit.element.id,
      target: 'element',
      label: loc.hit.element.name || loc.hit.element.type,
    });
    return items;
  }

  return [];
}

export function getElementContextIds(state: BuilderState): {
  sectionId: string | null;
  rowId: string | null;
  columnId: string | null;
} {
  if (!state.selection) return { sectionId: null, rowId: null, columnId: null };
  if (state.selection.target === 'section') {
    const sec = findSection(state, state.selection.id)?.section;
    return {
      sectionId: sec?.id ?? null,
      rowId: sec?.rows[0]?.id ?? null,
      columnId: sec?.rows[0]?.columns[0]?.id ?? null,
    };
  }
  if (state.selection.target === 'row') {
    const loc = findRow(state, state.selection.id);
    return {
      sectionId: loc?.section.id ?? null,
      rowId: loc?.row.id ?? null,
      columnId: loc?.row.columns[0]?.id ?? null,
    };
  }
  if (state.selection.target === 'column') {
    const loc = findColumn(state, state.selection.id);
    return {
      sectionId: loc?.section.id ?? null,
      rowId: loc?.row.id ?? null,
      columnId: loc?.col.id ?? null,
    };
  }
  const loc = locateElement(state, state.selection.id);
  return {
    sectionId: loc?.section.id ?? null,
    rowId: loc?.row.id ?? null,
    columnId: loc?.col.id ?? null,
  };
}
