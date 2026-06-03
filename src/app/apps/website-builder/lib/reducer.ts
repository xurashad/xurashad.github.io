// ============================================================
// Website Builder Pro — State Reducer
// ============================================================
'use client';

import type {
  BuilderState, BuilderAction, BuilderProject, ElementNode,
  SectionNode, RowNode, ColumnNode, SelectionInfo, ToastMessage,
  ElementStyles, PageData,
} from './types';
import { createDefaultProject, uid, createRow, createColumn, createElement } from './defaults';

const MAX_HISTORY = 60;

/* ========== Initial State ========== */

export function createInitialState(project?: BuilderProject): BuilderState {
  const proj = project ?? createDefaultProject();
  return {
    project: proj,
    currentPageId: proj.pageOrder[0] ?? Object.keys(proj.pages)[0],
    selection: null,
    editingElementId: null,
    viewportMode: 'desktop',
    canvasThemeMode: 'light',
    leftSidebarTab: 'elements',
    rightSidebarTab: 'style',
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    showProjectManager: false,
    showKeyboardShortcuts: false,
    showPreview: false,
    history: [],
    historyIndex: -1,
    toasts: [],
    isDragging: false,
    dragData: null,
    clipboardElement: null,
  };
}

/* ========== Tree Helpers ========== */

/** Deep-clone an element node with new IDs */
export function cloneElement(el: ElementNode): ElementNode {
  return {
    ...el,
    id: uid(el.type),
    styles: { ...el.styles },
    hoverStyles: { ...el.hoverStyles },
    attributes: { ...el.attributes },
    children: el.children.map(cloneElement),
  };
}

/** Find element in a flat list of sections (page, header, or footer) */
function findInSections(
  sections: SectionNode[],
  elementId: string,
): { element: ElementNode; sectionIdx: number; rowIdx: number; colIdx: number; elIdx: number } | null {
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si];
    for (let ri = 0; ri < sec.rows.length; ri++) {
      const row = sec.rows[ri];
      for (let ci = 0; ci < row.columns.length; ci++) {
        const col = row.columns[ci];
        for (let ei = 0; ei < col.elements.length; ei++) {
          if (col.elements[ei].id === elementId) {
            return { element: col.elements[ei], sectionIdx: si, rowIdx: ri, colIdx: ci, elIdx: ei };
          }
        }
      }
    }
  }
  return null;
}

/** Find which section array and location contains an element */
function locateElement(
  state: BuilderState,
  elementId: string,
): { source: 'page' | 'header' | 'footer'; sections: SectionNode[]; found: NonNullable<ReturnType<typeof findInSections>> } | null {
  const page = state.project.pages[state.currentPageId];
  if (!page) return null;

  let found = findInSections(page.sections, elementId);
  if (found) return { source: 'page', sections: page.sections, found };

  found = findInSections([state.project.header], elementId);
  if (found) return { source: 'header', sections: [state.project.header], found };

  found = findInSections([state.project.footer], elementId);
  if (found) return { source: 'footer', sections: [state.project.footer], found };

  return null;
}

/** Find a column by ID across current page + header/footer */
function findColumn(
  state: BuilderState,
  columnId: string,
): { col: ColumnNode; sections: SectionNode[]; source: 'page' | 'header' | 'footer'; si: number; ri: number; ci: number } | null {
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
            return { col: sections[si].rows[ri].columns[ci], sections, source: key, si, ri, ci };
          }
        }
      }
    }
  }
  return null;
}

/** Find a section by ID */
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

/** Immutably update sections array */
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

/* ========== Reducer ========== */

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {

    // ---- Element CRUD ----

    case 'ADD_ELEMENT': {
      const { columnId, element, index } = action.payload;
      const loc = findColumn(state, columnId);
      if (!loc) return state;
      return updateSections(state, loc.source, sections => {
        const newSections = sections.map(s => ({
          ...s,
          rows: s.rows.map(r => ({
            ...r,
            columns: r.columns.map(c => {
              if (c.id !== columnId) return c;
              const els = [...c.elements];
              if (index !== undefined) els.splice(index, 0, element);
              else els.push(element);
              return { ...c, elements: els };
            }),
          })),
        }));
        return newSections;
      });
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
              elements: c.elements.map(e =>
                e.id === elementId ? { ...e, ...updates } : e,
              ),
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
              elements: c.elements.map(e =>
                e.id === elementId ? { ...e, styles: { ...e.styles, ...styles } } : e,
              ),
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
              elements: c.elements.map(e =>
                e.id === elementId ? { ...e, hoverStyles: { ...e.hoverStyles, ...styles } } : e,
              ),
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
              elements: c.elements.filter(e => e.id !== elementId),
            })),
          })),
        })),
      );
      // Deselect if deleted element was selected
      if (state.selection?.id === elementId) {
        return { ...newState, selection: null, editingElementId: null };
      }
      return newState;
    }

    case 'MOVE_ELEMENT': {
      const { elementId, direction } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      const { found, source } = loc;
      return updateSections(state, source, sections =>
        sections.map((s, si) => {
          if (si !== found.sectionIdx) return s;
          return {
            ...s,
            rows: s.rows.map((r, ri) => {
              if (ri !== found.rowIdx) return r;
              return {
                ...r,
                columns: r.columns.map((c, ci) => {
                  if (ci !== found.colIdx) return c;
                  const els = [...c.elements];
                  const idx = els.findIndex(e => e.id === elementId);
                  if (idx < 0) return c;
                  const newIdx = direction === 'up' ? idx - 1 : idx + 1;
                  if (newIdx < 0 || newIdx >= els.length) return c;
                  [els[idx], els[newIdx]] = [els[newIdx], els[idx]];
                  return { ...c, elements: els };
                }),
              };
            }),
          };
        }),
      );
    }

    case 'DUPLICATE_ELEMENT': {
      const { elementId } = action.payload;
      const loc = locateElement(state, elementId);
      if (!loc) return state;
      const clone = cloneElement(loc.found.element);
      return updateSections(state, loc.source, sections =>
        sections.map((s, si) => {
          if (si !== loc.found.sectionIdx) return s;
          return {
            ...s,
            rows: s.rows.map((r, ri) => {
              if (ri !== loc.found.rowIdx) return r;
              return {
                ...r,
                columns: r.columns.map((c, ci) => {
                  if (ci !== loc.found.colIdx) return c;
                  const els = [...c.elements];
                  els.splice(loc.found.elIdx + 1, 0, clone);
                  return { ...c, elements: els };
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
        if (index !== undefined) secs.splice(index, 0, section);
        else secs.push(section);
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
      return state; // header/footer are single sections
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
      return builderReducer(state, {
        type: 'UPDATE_SECTION',
        payload: {
          sectionId,
          updates: {
            styles: { ...(findSection(state, sectionId)?.section.styles ?? {}), ...styles },
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

    case 'DUPLICATE_SECTION': {
      const { sectionId } = action.payload;
      const loc = findSection(state, sectionId);
      if (!loc || loc.source !== 'page') return state;
      const clone: SectionNode = JSON.parse(JSON.stringify(loc.section));
      // Assign new IDs throughout
      const reId = (sec: SectionNode): SectionNode => ({
        ...sec,
        id: uid('sec'),
        rows: sec.rows.map(r => ({
          ...r,
          id: uid('row'),
          columns: r.columns.map(c => ({
            ...c,
            id: uid('col'),
            elements: c.elements.map(e => cloneElement(e)),
          })),
        })),
      });
      const page = { ...state.project.pages[state.currentPageId] };
      const secs = [...page.sections];
      secs.splice(loc.index + 1, 0, reId(clone));
      page.sections = secs;
      return {
        ...state,
        project: { ...state.project, pages: { ...state.project.pages, [state.currentPageId]: page }, updatedAt: Date.now() },
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
      return builderReducer(state, { type: 'UPDATE_SECTION', payload: { sectionId, updates: updatedSection } });
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
          const span = Math.floor(12 / newColCount);
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
          const cols = r.columns.slice(0, -1);
          const span = Math.floor(12 / cols.length);
          return { ...r, columns: cols.map(c => ({ ...c, span })) };
        }),
      };
      return builderReducer(state, { type: 'UPDATE_SECTION', payload: { sectionId, updates: updatedSection } });
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
      // Also remove children
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

    case 'SET_CURRENT_PAGE': {
      return {
        ...state,
        currentPageId: action.payload.pageId,
        selection: null,
        editingElementId: null,
      };
    }

    case 'REORDER_PAGES': {
      return {
        ...state,
        project: { ...state.project, pageOrder: action.payload.pageOrder, updatedAt: Date.now() },
      };
    }

    // ---- Selection ----

    case 'SELECT':
      return { ...state, selection: action.payload, editingElementId: null };

    case 'DESELECT':
      return { ...state, selection: null, editingElementId: null };

    case 'SET_EDITING':
      return { ...state, editingElementId: action.payload.elementId };

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

    // ---- UI State ----

    case 'SET_VIEWPORT':
      return { ...state, viewportMode: action.payload.mode };

    case 'SET_LEFT_TAB':
      return { ...state, leftSidebarTab: action.payload.tab };

    case 'SET_RIGHT_TAB':
      return { ...state, rightSidebarTab: action.payload.tab };

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

    // ---- Drag ----

    case 'SET_DRAGGING':
      return { ...state, isDragging: action.payload.isDragging, dragData: action.payload.data };

    // ---- History ----

    case 'SAVE_HISTORY': {
      const history = state.history.slice(0, state.historyIndex + 1);
      history.push(JSON.parse(JSON.stringify(state.project)));
      if (history.length > MAX_HISTORY) history.shift();
      return { ...state, history, historyIndex: history.length - 1 };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const project = JSON.parse(JSON.stringify(state.history[newIndex]));
      return {
        ...state,
        project,
        historyIndex: newIndex,
        selection: null,
        editingElementId: null,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      const project = JSON.parse(JSON.stringify(state.history[newIndex]));
      return {
        ...state,
        project,
        historyIndex: newIndex,
        selection: null,
        editingElementId: null,
      };
    }

    // ---- Toast ----

    case 'ADD_TOAST': {
      const toast: ToastMessage = {
        ...action.payload,
        id: uid('toast'),
      };
      return { ...state, toasts: [...state.toasts.slice(-4), toast] };
    }

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload.toastId) };

    // ---- Project ----

    case 'LOAD_PROJECT': {
      const { project } = action.payload;
      return createInitialState(project);
    }

    case 'NEW_PROJECT': {
      return createInitialState(action.payload.project);
    }

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

    // ---- Clipboard ----

    case 'COPY_ELEMENT':
      return { ...state, clipboardElement: cloneElement(action.payload.element) };

    case 'PASTE_ELEMENT': {
      if (!state.clipboardElement) return state;
      const el = cloneElement(state.clipboardElement);
      return builderReducer(state, {
        type: 'ADD_ELEMENT',
        payload: { columnId: action.payload.columnId, element: el },
      });
    }

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
  const toastPayload = { type, message, duration };
  dispatch({ type: 'ADD_TOAST', payload: toastPayload });
  setTimeout(() => {
    // We can't reliably get the id here, so we'll let Toast component handle auto-dismiss
  }, duration);
}

/* ========== Public helpers ========== */

export function getSelectedElement(state: BuilderState): ElementNode | null {
  if (!state.selection || state.selection.target !== 'element') return null;
  const loc = locateElement(state, state.selection.id);
  return loc?.found.element ?? null;
}

export function getSelectedSection(state: BuilderState): SectionNode | null {
  if (!state.selection || state.selection.target !== 'section') return null;
  return findSection(state, state.selection.id)?.section ?? null;
}

export function getCurrentPage(state: BuilderState): PageData | null {
  return state.project.pages[state.currentPageId] ?? null;
}

/** Get the first column ID in the current page for pasting/adding elements */
export function getFirstColumnId(state: BuilderState): string | null {
  const page = getCurrentPage(state);
  if (!page || page.sections.length === 0) return null;
  const lastSection = page.sections[page.sections.length - 1];
  if (lastSection.rows.length === 0) return null;
  const lastRow = lastSection.rows[lastSection.rows.length - 1];
  if (lastRow.columns.length === 0) return null;
  return lastRow.columns[0].id;
}

/** Find the column that contains an element */
export function getColumnForElement(state: BuilderState, elementId: string): string | null {
  const loc = locateElement(state, elementId);
  if (!loc) return null;
  const sections = loc.source === 'page'
    ? state.project.pages[state.currentPageId].sections
    : loc.source === 'header'
    ? [state.project.header]
    : [state.project.footer];
  return sections[loc.found.sectionIdx]?.rows[loc.found.rowIdx]?.columns[loc.found.colIdx]?.id ?? null;
}
