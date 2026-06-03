// ============================================================
// Website Builder Pro — Type Definitions
// ============================================================

/* ---------- Element Types ---------- */

export type ElementType =
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'link'
  | 'image'
  | 'video'
  | 'icon'
  | 'list'
  | 'blockquote'
  | 'code'
  | 'divider'
  | 'spacer'
  | 'form'
  | 'map'
  | 'embed'
  | 'social-links'
  | 'container';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/* ---------- Style Properties ---------- */

export interface ElementStyles {
  // Display & Layout
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: string;
  gap?: string;
  gridTemplateColumns?: string;

  // Sizing
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  aspectRatio?: string;

  // Spacing
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  // Typography
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: string;
  textDecoration?: string;
  textTransform?: string;
  fontStyle?: string;
  color?: string;

  // Background
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundPosition?: string;
  backgroundRepeat?: string;

  // Border
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomLeftRadius?: string;
  borderBottomRightRadius?: string;

  // Effects
  boxShadow?: string;
  opacity?: string;
  filter?: string;
  backdropFilter?: string;

  // Transform & Animation
  transform?: string;
  transition?: string;

  // Position
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string;
  overflow?: string;

  // Border shorthands
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;

  // Other
  cursor?: string;
  listStyleType?: string;
  objectFit?: string;
  textOverflow?: string;
  whiteSpace?: string;
  wordBreak?: string;
  backgroundClip?: string;
  WebkitBackgroundClip?: string;
  WebkitTextFillColor?: string;
  userSelect?: string;
}

/* ---------- Element Node ---------- */

export interface ElementNode {
  id: string;
  type: ElementType;
  /** Text content, src URL, embed URL, or icon class */
  content: string;
  /** Only for heading elements */
  headingLevel?: HeadingLevel;
  styles: ElementStyles;
  hoverStyles: ElementStyles;
  /** Custom HTML attributes (href, target, alt, etc.) */
  attributes: Record<string, string>;
  /** Nested elements (for container type) */
  children: ElementNode[];
  locked: boolean;
  hidden: boolean;
}

/* ---------- Layout Hierarchy: Section > Row > Column > Element ---------- */

export interface ColumnNode {
  id: string;
  /** Grid column span (1–12) */
  span: number;
  elements: ElementNode[];
  styles: ElementStyles;
}

export interface RowNode {
  id: string;
  columns: ColumnNode[];
  styles: ElementStyles;
}

export interface SectionNode {
  id: string;
  name: string;
  fullBleed: boolean;
  styles: ElementStyles;
  rows: RowNode[];
}

/* ---------- Page ---------- */

export interface PageSEO {
  title: string;
  description: string;
  ogImage: string;
}

export interface PageData {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  order: number;
  hidden: boolean;
  sections: SectionNode[];
  seo: PageSEO;
}

/* ---------- Theme ---------- */

export interface ThemeColors {
  bg: string;
  text: string;
  surface: string;
  border: string;
}

export interface SiteTheme {
  light: ThemeColors;
  dark: ThemeColors;
  accent: string;
  fonts: {
    heading: string;
    body: string;
  };
  borderRadius: string;
}

/* ---------- Assets ---------- */

export interface AssetData {
  id: string;
  name: string;
  type: 'image' | 'video' | 'font' | 'other';
  dataUrl: string;
  size: number;
  mimeType: string;
}

/* ---------- Project Settings ---------- */

export interface ProjectSettings {
  siteName: string;
  favicon: string | null;
  globalCSS: string;
  headerEnabled: boolean;
  footerEnabled: boolean;
  analyticsId: string;
}

/* ---------- Project ---------- */

export interface BuilderProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  pages: Record<string, PageData>;
  pageOrder: string[];
  header: SectionNode;
  footer: SectionNode;
  theme: SiteTheme;
  assets: Record<string, AssetData>;
  settings: ProjectSettings;
}

/* ---------- Toast ---------- */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  action?: { label: string; onClick: () => void };
}

/* ---------- Selection ---------- */

export type SelectionTarget = 'element' | 'section' | 'row' | 'column';

export interface SelectionInfo {
  id: string;
  target: SelectionTarget;
}

/* ---------- Viewport ---------- */

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const VIEWPORT_WIDTHS: Record<ViewportMode, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 375,
};

/* ---------- Drag & Drop ---------- */

export type DragSource = 'sidebar-element' | 'sidebar-section' | 'sidebar-asset' | 'canvas';

export interface DragData {
  source: DragSource;
  elementType?: ElementType;
  sectionTemplateId?: string;
  assetId?: string;
  elementId?: string;
}

/* ---------- Builder Runtime State ---------- */

export interface BuilderState {
  project: BuilderProject;
  currentPageId: string;

  // Selection & editing
  selection: SelectionInfo | null;
  editingElementId: string | null;

  // Viewport
  viewportMode: ViewportMode;
  canvasThemeMode: 'light' | 'dark';

  // UI panels
  leftSidebarTab: LeftSidebarTab;
  rightSidebarTab: RightSidebarTab;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;

  // Modals
  showProjectManager: boolean;
  showKeyboardShortcuts: boolean;
  showPreview: boolean;

  // History (undo/redo)
  history: BuilderProject[];
  historyIndex: number;

  // Toast messages
  toasts: ToastMessage[];

  // Drag & drop
  isDragging: boolean;
  dragData: DragData | null;

  // Clipboard
  clipboardElement: ElementNode | null;
}

export type LeftSidebarTab = 'elements' | 'sections' | 'pages' | 'layers';
export type RightSidebarTab = 'layout' | 'style' | 'effects' | 'settings' | 'assets' | 'theme';

/* ---------- Reducer Actions ---------- */

export type BuilderAction =
  // --- Element CRUD ---
  | { type: 'ADD_ELEMENT'; payload: { columnId: string; element: ElementNode; index?: number } }
  | { type: 'UPDATE_ELEMENT'; payload: { elementId: string; updates: Partial<ElementNode> } }
  | { type: 'UPDATE_ELEMENT_STYLES'; payload: { elementId: string; styles: Partial<ElementStyles> } }
  | { type: 'UPDATE_ELEMENT_HOVER_STYLES'; payload: { elementId: string; styles: Partial<ElementStyles> } }
  | { type: 'DELETE_ELEMENT'; payload: { elementId: string } }
  | { type: 'MOVE_ELEMENT'; payload: { elementId: string; direction: 'up' | 'down' } }
  | { type: 'DUPLICATE_ELEMENT'; payload: { elementId: string } }

  // --- Section CRUD ---
  | { type: 'ADD_SECTION'; payload: { section: SectionNode; index?: number; target?: 'header' | 'footer' | 'page' } }
  | { type: 'UPDATE_SECTION'; payload: { sectionId: string; updates: Partial<SectionNode> } }
  | { type: 'UPDATE_SECTION_STYLES'; payload: { sectionId: string; styles: Partial<ElementStyles> } }
  | { type: 'DELETE_SECTION'; payload: { sectionId: string } }
  | { type: 'MOVE_SECTION'; payload: { sectionId: string; direction: 'up' | 'down' } }
  | { type: 'DUPLICATE_SECTION'; payload: { sectionId: string } }

  // --- Row & Column ---
  | { type: 'ADD_ROW'; payload: { sectionId: string; columns: number } }
  | { type: 'DELETE_ROW'; payload: { sectionId: string; rowId: string } }
  | { type: 'ADD_COLUMN'; payload: { sectionId: string; rowId: string } }
  | { type: 'REMOVE_COLUMN'; payload: { sectionId: string; rowId: string } }

  // --- Page Management ---
  | { type: 'ADD_PAGE'; payload: { page: PageData } }
  | { type: 'UPDATE_PAGE'; payload: { pageId: string; updates: Partial<PageData> } }
  | { type: 'DELETE_PAGE'; payload: { pageId: string } }
  | { type: 'SET_CURRENT_PAGE'; payload: { pageId: string } }
  | { type: 'REORDER_PAGES'; payload: { pageOrder: string[] } }

  // --- Selection ---
  | { type: 'SELECT'; payload: SelectionInfo }
  | { type: 'DESELECT' }
  | { type: 'SET_EDITING'; payload: { elementId: string | null } }

  // --- Theme ---
  | { type: 'SET_THEME'; payload: Partial<SiteTheme> }
  | { type: 'TOGGLE_CANVAS_THEME' }

  // --- Settings ---
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ProjectSettings> }

  // --- Assets ---
  | { type: 'ADD_ASSET'; payload: { asset: AssetData } }
  | { type: 'DELETE_ASSET'; payload: { assetId: string } }
  | { type: 'RENAME_ASSET'; payload: { assetId: string; name: string } }

  // --- Viewport & UI ---
  | { type: 'SET_VIEWPORT'; payload: { mode: ViewportMode } }
  | { type: 'SET_LEFT_TAB'; payload: { tab: LeftSidebarTab } }
  | { type: 'SET_RIGHT_TAB'; payload: { tab: RightSidebarTab } }
  | { type: 'TOGGLE_LEFT_SIDEBAR' }
  | { type: 'TOGGLE_RIGHT_SIDEBAR' }
  | { type: 'SHOW_PROJECT_MANAGER'; payload: { show: boolean } }
  | { type: 'SHOW_KEYBOARD_SHORTCUTS'; payload: { show: boolean } }
  | { type: 'SHOW_PREVIEW'; payload: { show: boolean } }

  // --- Drag ---
  | { type: 'SET_DRAGGING'; payload: { isDragging: boolean; data: DragData | null } }

  // --- History ---
  | { type: 'SAVE_HISTORY' }
  | { type: 'UNDO' }
  | { type: 'REDO' }

  // --- Toast ---
  | { type: 'ADD_TOAST'; payload: Omit<ToastMessage, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: { toastId: string } }

  // --- Project ---
  | { type: 'LOAD_PROJECT'; payload: { project: BuilderProject } }
  | { type: 'SET_PROJECT_NAME'; payload: { name: string } }
  | { type: 'NEW_PROJECT'; payload: { project: BuilderProject } }

  // --- Clipboard ---
  | { type: 'COPY_ELEMENT'; payload: { element: ElementNode } }
  | { type: 'PASTE_ELEMENT'; payload: { columnId: string } };

/* ---------- Canvas Imperative Handle ---------- */

export interface CanvasHandle {
  scrollToElement: (elementId: string) => void;
}

/* ---------- Helper: Font definition ---------- */

export interface FontDef {
  name: string;
  family: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'display';
  weights: number[];
  googleUrl?: string;
}

/* ---------- Helper: Preset types ---------- */

export interface GradientPreset {
  name: string;
  value: string;
}

export interface ShadowPreset {
  name: string;
  value: string;
}

export interface AnimationPreset {
  name: string;
  value: string;
  keyframes?: string;
}
