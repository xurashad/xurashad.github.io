// Core types for Markdown Studio

export type MarkdownFileKind = "md" | "json" | "yaml" | "css" | "image" | "text";

export interface MarkdownFile {
  id: string;
  path: string;
  kind: MarkdownFileKind;
  content: string;
  updatedAt: number;
}

export interface MarkdownSnapshot {
  id: string;
  label: string;
  createdAt: number;
  mainFilePath: string;
  files: MarkdownFile[];
}

export interface MarkdownProject {
  id: string;
  name: string;
  templateId: string;
  mainFilePath: string;
  files: MarkdownFile[];
  snapshots: MarkdownSnapshot[];
  createdAt: number;
  updatedAt: number;
  localFolderName?: string;
  storageMode?: "browser" | "local-folder";
}

export interface FrontmatterData {
  format: "yaml" | "toml";
  raw: string;
  startLine: number;
  endLine: number;
  fields: Record<string, string | string[] | boolean>;
}

export interface OutlineItem {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  line: number;
  slug: string;
  numberLabel?: string;
}

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface MarkdownDiagnostic {
  id: string;
  severity: DiagnosticSeverity;
  line: number;
  rule: string;
  message: string;
}

export interface DocumentAnalytics {
  words: number;
  chars: number;
  charsNoSpaces: number;
  lines: number;
  paragraphs: number;
  sentences: number;
  readingTimeMin: number;
  speakingTimeMin: number;
  fleschScore: number;
  fleschGrade: string;
  lexicalDiversity: number;
  topKeywords: Array<{ word: string; count: number }>;
  headingsCount: number;
  codeBlocksCount: number;
  mathCount: number;
  tablesCount: number;
  imagesCount: number;
  linksCount: number;
  tasksTotal: number;
  tasksDone: number;
  footnotesCount: number;
}

export interface SlideItem {
  index: number;
  html: string;
  notes: string;
  startLine: number;
  title?: string;
}

export interface LinkInfo {
  text: string;
  url: string;
  line: number;
  isWiki: boolean;
  isAnchor: boolean;
}

export interface ImageInfo {
  alt: string;
  src: string;
  line: number;
}

export interface FootnoteInfo {
  id: string;
  html: string;
  line: number;
  referenced: boolean;
}

export interface TableSpanInfo {
  headerCols: number;
  line: number;
  rowCols: number;
}

export interface RenderResult {
  html: string;
  slides: SlideItem[];
  frontmatter: FrontmatterData | null;
  outline: OutlineItem[];
  links: LinkInfo[];
  images: ImageInfo[];
  footnotes: FootnoteInfo[];
  undefinedFootnotes: Array<{ id: string; line: number }>;
  tableMismatches: TableSpanInfo[];
  unclosedFenceLine: number | null;
  unclosedMathLine: number | null;
  tasksTotal: number;
  tasksDone: number;
  codeBlocksCount: number;
  mathCount: number;
  tablesCount: number;
  renderTimeMs: number;
}

export type EditorTheme =
  | "cosmos-dark"
  | "obsidian"
  | "aurora-midnight"
  | "nord-dusk"
  | "paper-light";

export type PreviewTheme =
  | "celestial"
  | "github-dark"
  | "github-light"
  | "academic"
  | "sepia"
  | "obsidian";

export type PreviewWidth = "document" | "wide" | "full" | "mobile";

export type LayoutMode = "editor" | "split" | "preview" | "slides";

export type EditorFontFamily = "mono" | "sans" | "serif";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

export interface EditorSettings {
  editorTheme: EditorTheme;
  previewTheme: PreviewTheme;
  previewWidth: PreviewWidth;
  editorFontFamily: EditorFontFamily;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  typewriterMode: boolean;
  focusMode: boolean;
  scrollSync: boolean;
  gfmBreaks: boolean;
  autoNumberHeadings: boolean;
  enableEmoji: boolean;
  enableMath: boolean;
  enableMermaid: boolean;
  enableHtml: boolean;
  spellCheck: boolean;
  wordGoal: number;
  autoSave: boolean;
  autoSaveDelayMs: number;
  pageSize: "a4" | "letter";
  liveMathBar: boolean;
}

export interface SlashCommandItem {
  id: string;
  trigger: string;
  label: string;
  description: string;
  snippet: string;
  cursorOffset?: number;
  modalAction?: "table" | "mermaid" | "math" | "frontmatter" | "callout" | "html";
}

export interface EmojiEntry {
  shortcode: string;
  emoji: string;
  category:
    | "Smileys"
    | "Status & Alerts"
    | "Dev & Tech"
    | "Science & Cosmos"
    | "Docs & Writing"
    | "Arrows & UI"
    | "Nature & Objects";
  keywords: string;
}
