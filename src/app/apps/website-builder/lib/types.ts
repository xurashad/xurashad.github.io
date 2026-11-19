// ============================================================
// Website Builder Pro — Type Definitions
// ============================================================

/* ---------- Element Types (27 total) ---------- */

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
  | 'container'
  | 'badge'
  | 'card'
  | 'accordion'
  | 'tabs'
  | 'progress'
  | 'alert'
  | 'stat'
  | 'table'
  | 'avatar'
  | 'html';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/* ---------- Structured Widget Data Interfaces ---------- */

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'date';
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface AccordionItem {
  id: string;
  title: string;
  content: string;
  openByDefault?: boolean;
}

export interface TabItem {
  id: string;
  label: string;
  content: string;
}

export interface SocialLinkItem {
  platform: string;
  url: string;
  icon: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  striped?: boolean;
}

export type AnimationType =
  | 'none'
  | 'fadeIn'
  | 'fadeUp'
  | 'fadeDown'
  | 'fadeLeft'
  | 'fadeRight'
  | 'zoomIn'
  | 'bounceIn'
  | 'flipUp';

export interface AnimationConfig {
  type: AnimationType;
  duration?: string;
  delay?: string;
}

export interface ResponsiveStyles {
  tablet?: ElementStyles;
  mobile?: ElementStyles;
}

export type ShapeDividerType = 'none' | 'wave' | 'curve' | 'slant' | 'triangle';

export type HeaderStyle = 'classic' | 'centered' | 'minimal' | 'glass';

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
  gridGap?: string;
  placeItems?: string;
  flex?: string;
  flexGrow?: string;
  alignSelf?: string;
  justifySelf?: string;
  boxSizing?: string;

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
  textShadow?: string;
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
  outline?: string;

  // Effects
  boxShadow?: string;
  opacity?: string;
  filter?: string;
  backdropFilter?: string;
  mixBlendMode?: string;

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
  name?: string;
  /** Text content, src URL, embed URL, or icon class */
  content: string;
  /** Only for heading elements */
  headingLevel?: HeadingLevel;
  styles: ElementStyles;
  hoverStyles: ElementStyles;
  responsiveStyles?: ResponsiveStyles;
  animation?: AnimationConfig;
  customClass?: string;
  customId?: string;
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
  responsiveStyles?: ResponsiveStyles;
  hidden?: boolean;
  locked?: boolean;
  anchorId?: string;
  backgroundOverlay?: string;
  shapeDividerTop?: ShapeDividerType;
  shapeDividerBottom?: ShapeDividerType;
  shapeDividerColor?: string;
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
  accentSecondary?: string;
  fonts: {
    heading: string;
    body: string;
  };
  borderRadius: string;
  containerMaxWidth?: string;
  presetId?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  theme: SiteTheme;
  defaultMode: 'light' | 'dark';
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
  headerStyle?: HeaderStyle;
  headerCtaEnabled?: boolean;
  headerCtaText?: string;
  headerCtaHref?: string;
  showThemeToggle?: boolean;
  customHeadCode?: string;
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

/* ---------- Selection & Context Menu ---------- */

export type SelectionTarget = 'element' | 'section' | 'row' | 'column';

export interface SelectionInfo {
  id: string;
  target: SelectionTarget;
}

export type ContextMenuState = {
  x: number;
  y: number;
  targetId: string;
  targetType: SelectionTarget;
} | null;

/* ---------- Viewport ---------- */

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export const VIEWPORT_WIDTHS: Record<ViewportMode, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 375,
};

/* ---------- Drag & Drop ---------- */

export type DragSource =
  | 'sidebar-element'
  | 'sidebar-section'
  | 'sidebar-asset'
  | 'canvas'
  | 'canvas-section';

export interface DragData {
  source: DragSource;
  elementType?: ElementType;
  sectionTemplateId?: string;
  assetId?: string;
  elementId?: string;
  sectionId?: string;
}

/* ---------- Builder Runtime State ---------- */

export type LeftSidebarTab = 'elements' | 'sections' | 'pages' | 'layers';
export type RightSidebarTab = 'layout' | 'style' | 'effects' | 'settings' | 'assets' | 'theme';

export interface BuilderState {
  project: BuilderProject;
  currentPageId: string;

  // Selection & editing
  selection: SelectionInfo | null;
  editingElementId: string | null;
  hoveredId: string | null;
  editingStyleState: 'normal' | 'hover';

  // Viewport & Canvas View
  viewportMode: ViewportMode;
  canvasThemeMode: 'light' | 'dark';
  zoom: number;
  showGridOverlay: boolean;
  showOutlines: boolean;

  // UI panels
  leftSidebarTab: LeftSidebarTab;
  rightSidebarTab: RightSidebarTab;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;

  // Modals & Overlays
  showProjectManager: boolean;
  showKeyboardShortcuts: boolean;
  showPreview: boolean;
  showCommandPalette: boolean;
  showCodeModal: boolean;
  showAuditModal: boolean;
  contextMenu: ContextMenuState;

  // History (undo/redo)
  history: BuilderProject[];
  historyLabels: string[];
  historyIndex: number;

  // Toast messages
  toasts: ToastMessage[];

  // Drag & drop
  isDragging: boolean;
  dragData: DragData | null;

  // Clipboard & Saved Blocks
  clipboardElement: ElementNode | null;
  copiedStyles: ElementStyles | null;
  savedBlocks: SectionNode[];
}

/* ---------- Reducer Actions ---------- */

export type BuilderAction =
  // --- Element CRUD ---
  | { type: 'ADD_ELEMENT'; payload: { columnId?: string; containerId?: string; element: ElementNode; index?: number } }
  | { type: 'UPDATE_ELEMENT'; payload: { elementId: string; updates: Partial<ElementNode> } }
  | { type: 'UPDATE_ELEMENT_STYLES'; payload: { elementId: string; styles: Partial<ElementStyles> } }
  | { type: 'UPDATE_ELEMENT_HOVER_STYLES'; payload: { elementId: string; styles: Partial<ElementStyles> } }
  | { type: 'UPDATE_ELEMENT_RESPONSIVE_STYLES'; payload: { elementId: string; viewport: 'tablet' | 'mobile'; styles: Partial<ElementStyles> } }
  | { type: 'CLEAR_ELEMENT_RESPONSIVE_STYLES'; payload: { elementId: string; viewport: 'tablet' | 'mobile' } }
  | { type: 'DELETE_ELEMENT'; payload: { elementId: string } }
  | { type: 'MOVE_ELEMENT'; payload: { elementId: string; direction: 'up' | 'down' } }
  | { type: 'MOVE_ELEMENT_TO'; payload: { elementId: string; targetColumnId?: string; targetContainerId?: string; targetIndex?: number } }
  | { type: 'DUPLICATE_ELEMENT'; payload: { elementId: string } }

  // --- Section CRUD ---
  | { type: 'ADD_SECTION'; payload: { section: SectionNode; index?: number; target?: 'header' | 'footer' | 'page' } }
  | { type: 'UPDATE_SECTION'; payload: { sectionId: string; updates: Partial<SectionNode> } }
  | { type: 'UPDATE_SECTION_STYLES'; payload: { sectionId: string; styles: Partial<ElementStyles> } }
  | { type: 'UPDATE_SECTION_RESPONSIVE_STYLES'; payload: { sectionId: string; viewport: 'tablet' | 'mobile'; styles: Partial<ElementStyles> } }
  | { type: 'DELETE_SECTION'; payload: { sectionId: string } }
  | { type: 'MOVE_SECTION'; payload: { sectionId: string; direction: 'up' | 'down' } }
  | { type: 'REORDER_SECTION'; payload: { sectionId: string; targetIndex: number } }
  | { type: 'DUPLICATE_SECTION'; payload: { sectionId: string } }

  // --- Row & Column ---
  | { type: 'ADD_ROW'; payload: { sectionId: string; columns: number } }
  | { type: 'DELETE_ROW'; payload: { sectionId: string; rowId: string } }
  | { type: 'UPDATE_ROW_STYLES'; payload: { sectionId: string; rowId: string; styles: Partial<ElementStyles> } }
  | { type: 'DUPLICATE_ROW'; payload: { sectionId: string; rowId: string } }
  | { type: 'MOVE_ROW'; payload: { sectionId: string; rowId: string; direction: 'up' | 'down' } }
  | { type: 'ADD_COLUMN'; payload: { sectionId: string; rowId: string } }
  | { type: 'REMOVE_COLUMN'; payload: { sectionId: string; rowId: string } }
  | { type: 'UPDATE_COLUMN_STYLES'; payload: { columnId: string; styles: Partial<ElementStyles> } }
  | { type: 'SET_COLUMN_SPAN'; payload: { columnId: string; span: number } }
  | { type: 'SET_COLUMN_LAYOUT'; payload: { sectionId: string; rowId: string; spans: number[] } }

  // --- Page Management ---
  | { type: 'ADD_PAGE'; payload: { page: PageData } }
  | { type: 'UPDATE_PAGE'; payload: { pageId: string; updates: Partial<PageData> } }
  | { type: 'DELETE_PAGE'; payload: { pageId: string } }
  | { type: 'DUPLICATE_PAGE'; payload: { pageId: string } }
  | { type: 'MOVE_PAGE'; payload: { pageId: string; direction: 'up' | 'down' } }
  | { type: 'SET_CURRENT_PAGE'; payload: { pageId: string } }
  | { type: 'REORDER_PAGES'; payload: { pageOrder: string[] } }

  // --- Selection & Hover ---
  | { type: 'SELECT'; payload: SelectionInfo }
  | { type: 'DESELECT' }
  | { type: 'SET_EDITING'; payload: { elementId: string | null } }
  | { type: 'SET_HOVERED'; payload: { id: string | null } }
  | { type: 'SET_EDITING_STYLE_STATE'; payload: { mode: 'normal' | 'hover' } }

  // --- Theme ---
  | { type: 'SET_THEME'; payload: Partial<SiteTheme> }
  | { type: 'APPLY_THEME_PRESET'; payload: { preset: ThemePreset } }
  | { type: 'TOGGLE_CANVAS_THEME' }

  // --- Settings ---
  | { type: 'UPDATE_SETTINGS'; payload: Partial<ProjectSettings> }

  // --- Assets ---
  | { type: 'ADD_ASSET'; payload: { asset: AssetData } }
  | { type: 'DELETE_ASSET'; payload: { assetId: string } }
  | { type: 'RENAME_ASSET'; payload: { assetId: string; name: string } }

  // --- Viewport & UI ---
  | { type: 'SET_VIEWPORT'; payload: { mode: ViewportMode } }
  | { type: 'SET_ZOOM'; payload: { zoom: number } }
  | { type: 'TOGGLE_GRID_OVERLAY' }
  | { type: 'TOGGLE_OUTLINES' }
  | { type: 'SET_LEFT_TAB'; payload: { tab: LeftSidebarTab } }
  | { type: 'SET_RIGHT_TAB'; payload: { tab: RightSidebarTab } }
  | { type: 'TOGGLE_LEFT_SIDEBAR' }
  | { type: 'TOGGLE_RIGHT_SIDEBAR' }
  | { type: 'SHOW_PROJECT_MANAGER'; payload: { show: boolean } }
  | { type: 'SHOW_KEYBOARD_SHORTCUTS'; payload: { show: boolean } }
  | { type: 'SHOW_PREVIEW'; payload: { show: boolean } }
  | { type: 'SHOW_COMMAND_PALETTE'; payload: { show: boolean } }
  | { type: 'SHOW_CODE_MODAL'; payload: { show: boolean } }
  | { type: 'SHOW_AUDIT_MODAL'; payload: { show: boolean } }
  | { type: 'SET_CONTEXT_MENU'; payload: { menu: ContextMenuState } }

  // --- Drag ---
  | { type: 'SET_DRAGGING'; payload: { isDragging: boolean; data: DragData | null } }

  // --- History ---
  | { type: 'SAVE_HISTORY'; payload?: { label?: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'HISTORY_JUMP'; payload: { index: number } }

  // --- Toast ---
  | { type: 'ADD_TOAST'; payload: Omit<ToastMessage, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: { toastId: string } }

  // --- Project ---
  | { type: 'LOAD_PROJECT'; payload: { project: BuilderProject } }
  | { type: 'SET_PROJECT_NAME'; payload: { name: string } }
  | { type: 'NEW_PROJECT'; payload: { project: BuilderProject } }

  // --- Clipboard & Saved Blocks ---
  | { type: 'COPY_ELEMENT'; payload: { element: ElementNode } }
  | { type: 'PASTE_ELEMENT'; payload: { columnId?: string; containerId?: string } }
  | { type: 'COPY_STYLES'; payload: { styles: ElementStyles } }
  | { type: 'PASTE_STYLES'; payload: { targetId: string; targetType: SelectionTarget } }
  | { type: 'SAVE_BLOCK'; payload: { section: SectionNode } }
  | { type: 'DELETE_SAVED_BLOCK'; payload: { blockId: string } }
  | { type: 'SET_SAVED_BLOCKS'; payload: { blocks: SectionNode[] } };

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
  name: AnimationType;
  nameLabel: string;
  description: string;
}

export interface ColumnLayoutPreset {
  label: string;
  spans: number[];
}
