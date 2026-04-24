/* ─── Site Data Types ──────────────────────────────────────────────────────── */

export interface SiteTheme {
  light: { bg: string; txt: string };
  dark: { bg: string; txt: string };
  accent: string;
}

export interface PageData {
  title: string;
  html: string;
  parentId?: string | null;
  hidden?: boolean;
}

export interface AssetData {
  name: string;
  url: string;       // data-URL
  type: string;       // MIME
  base64: string;
}

/* ─── Element / Component Enums ───────────────────────────────────────────── */

export type ElementType =
  | "h1" | "h2" | "h3" | "p" | "btn" | "img" | "video"
  | "icon" | "list" | "blockquote" | "map" | "form" | "divider" | "spacer";

export type SectionLayout = "col-1" | "col-2" | "col-3" | "col-4";

export type ComponentType =
  | "hero" | "features" | "testimonial" | "contact" | "gallery"
  | "cta" | "pricing" | "stats" | "team" | "faq";

/* ─── Toast ───────────────────────────────────────────────────────────────── */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  msg: string;
  type: ToastType;
}

/* ─── Builder State ───────────────────────────────────────────────────────── */

export interface BuilderState {
  pages: Record<string, PageData>;
  currentPage: string;
  theme: SiteTheme;
  assets: Record<string, AssetData>;
  favicon: string | null;
  customCSS: string;

  /* selection */
  selectedElDataId: string | null;

  /* history */
  history: { pages: Record<string, PageData> }[];
  historyIndex: number;

  /* toasts */
  toasts: ToastMessage[];

  /* canvas theme mode for preview */
  canvasThemeMode: "light" | "dark";
}

/* ─── Actions (discriminated union) ───────────────────────────────────────── */

export type BuilderAction =
  /* ── Pages ── */
  | { type: "ADD_PAGE"; id: string; title: string; html: string }
  | { type: "DELETE_PAGE"; id: string }
  | { type: "LOAD_PAGE"; id: string }
  | { type: "SAVE_PAGE_HTML"; html: string }
  | { type: "TOGGLE_PAGE_VISIBILITY"; id: string }
  | { type: "INDENT_PAGE"; id: string }
  | { type: "OUTDENT_PAGE"; id: string }
  | { type: "REORDER_PAGES"; pageIds: string[] }

  /* ── Selection ── */
  | { type: "SELECT_ELEMENT"; dataId: string | null }
  | { type: "DESELECT" }

  /* ── Theme ── */
  | { type: "SET_THEME"; theme: SiteTheme }
  | { type: "TOGGLE_CANVAS_THEME" }
  | { type: "SET_CUSTOM_CSS"; css: string }

  /* ── Assets ── */
  | { type: "ADD_ASSET"; id: string; asset: AssetData }
  | { type: "DELETE_ASSET"; id: string }
  | { type: "SET_FAVICON"; dataUrl: string }

  /* ── History ── */
  | { type: "SAVE_HISTORY" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESTORE_HISTORY"; pages: Record<string, PageData> }

  /* ── Toast ── */
  | { type: "ADD_TOAST"; toast: ToastMessage }
  | { type: "REMOVE_TOAST"; id: string };
