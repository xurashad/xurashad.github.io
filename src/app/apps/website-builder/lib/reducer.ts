import type { BuilderState, BuilderAction } from "./types";
import { TEMPLATES } from "./templates";

/* ── helpers ─────────────────────────────────────────────────────────────── */

const MAX_HISTORY = 60;

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

/* ── initial state ───────────────────────────────────────────────────────── */

export function createInitialState(): BuilderState {
  const pages: Record<string, { title: string; html: string }> = {
    index: { title: "Home", html: TEMPLATES.index },
  };
  return {
    pages,
    currentPage: "index",
    theme: {
      light: { bg: "#ffffff", txt: "#0f172a" },
      dark: { bg: "#0f172a", txt: "#f8fafc" },
      accent: "#5b6af0",
    },
    assets: {},
    favicon: null,
    customCSS: "",
    selectedElDataId: null,
    history: [{ pages: JSON.parse(JSON.stringify(pages)) }],
    historyIndex: 0,
    toasts: [],
    canvasThemeMode: "light",
  };
}

/* ── reducer ─────────────────────────────────────────────────────────────── */

export function builderReducer(
  state: BuilderState,
  action: BuilderAction
): BuilderState {
  switch (action.type) {
    /* ── Pages ── */
    case "ADD_PAGE":
      return {
        ...state,
        pages: {
          ...state.pages,
          [action.id]: {
            title: action.title,
            html: action.html,
          },
        },
        currentPage: action.id,
      };

    case "DELETE_PAGE": {
      if (action.id === "index") return state;
      const next = { ...state.pages };
      delete next[action.id];
      return {
        ...state,
        pages: next,
        currentPage:
          state.currentPage === action.id ? "index" : state.currentPage,
      };
    }

    case "LOAD_PAGE":
      return {
        ...state,
        currentPage: state.pages[action.id] ? action.id : "index",
        selectedElDataId: null,
      };

    case "SAVE_PAGE_HTML":
      return {
        ...state,
        pages: {
          ...state.pages,
          [state.currentPage]: {
            ...state.pages[state.currentPage],
            html: action.html,
          },
        },
      };

    case "TOGGLE_PAGE_VISIBILITY":
      return {
        ...state,
        pages: {
          ...state.pages,
          [action.id]: {
            ...state.pages[action.id],
            hidden: !state.pages[action.id].hidden,
          },
        },
      };

    case "INDENT_PAGE": {
      const keys = Object.keys(state.pages);
      const idx = keys.indexOf(action.id);
      if (idx <= 0) return state;
      const parentCand = keys[idx - 1];
      return {
        ...state,
        pages: {
          ...state.pages,
          [action.id]: {
            ...state.pages[action.id],
            parentId: state.pages[parentCand].parentId || parentCand,
          },
        },
      };
    }

    case "OUTDENT_PAGE":
      return {
        ...state,
        pages: {
          ...state.pages,
          [action.id]: {
            ...state.pages[action.id],
            parentId: null,
          },
        },
      };

    case "REORDER_PAGES": {
      const reordered: Record<string, (typeof state.pages)[string]> = {};
      for (const id of action.pageIds) {
        if (state.pages[id]) reordered[id] = state.pages[id];
      }
      return { ...state, pages: reordered };
    }

    /* ── Selection ── */
    case "SELECT_ELEMENT":
      return { ...state, selectedElDataId: action.dataId };

    case "DESELECT":
      return { ...state, selectedElDataId: null };

    /* ── Theme ── */
    case "SET_THEME":
      return { ...state, theme: action.theme };

    case "TOGGLE_CANVAS_THEME":
      return {
        ...state,
        canvasThemeMode:
          state.canvasThemeMode === "light" ? "dark" : "light",
      };

    case "SET_CUSTOM_CSS":
      return { ...state, customCSS: action.css };

    /* ── Assets ── */
    case "ADD_ASSET":
      return {
        ...state,
        assets: { ...state.assets, [action.id]: action.asset },
      };

    case "DELETE_ASSET": {
      const a = { ...state.assets };
      delete a[action.id];
      return { ...state, assets: a };
    }

    case "SET_FAVICON":
      return { ...state, favicon: action.dataUrl };

    /* ── History ── */
    case "SAVE_HISTORY": {
      const snap = {
        pages: JSON.parse(JSON.stringify(state.pages)),
      };
      let hist = state.history.slice(0, state.historyIndex + 1);
      hist.push(snap);
      if (hist.length > MAX_HISTORY) hist = hist.slice(1);
      return {
        ...state,
        history: hist,
        historyIndex: hist.length - 1,
      };
    }

    case "UNDO":
      if (state.historyIndex <= 0) return state;
      return {
        ...state,
        historyIndex: state.historyIndex - 1,
      };

    case "REDO":
      if (state.historyIndex >= state.history.length - 1) return state;
      return {
        ...state,
        historyIndex: state.historyIndex + 1,
      };

    case "RESTORE_HISTORY":
      return {
        ...state,
        pages: JSON.parse(JSON.stringify(action.pages)),
      };

    /* ── Toast ── */
    case "ADD_TOAST":
      return { ...state, toasts: [...state.toasts, action.toast] };

    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    default:
      return state;
  }
}

/* ── helpers used by components ──────────────────────────────────────────── */

export function toast(
  dispatch: React.Dispatch<BuilderAction>,
  msg: string,
  type: "success" | "error" | "warning" | "info" = "info",
  duration = 2600
) {
  const id = uid();
  dispatch({ type: "ADD_TOAST", toast: { id, msg, type } });
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", id }), duration);
}

export function getPageExportPath(
  id: string,
  pages: Record<string, { parentId?: string | null }>
): string {
  if (id === "index") return "index.html";
  let path = id;
  let curr = pages[id];
  while (curr?.parentId) {
    path = curr.parentId + "/" + path;
    curr = pages[curr.parentId];
  }
  return path + ".html";
}

export function getRelativePrefix(
  id: string,
  pages: Record<string, { parentId?: string | null }>
): string {
  const path = getPageExportPath(id, pages);
  const depth = (path.match(/\//g) || []).length;
  return "../".repeat(depth);
}
