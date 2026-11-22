// Core types for WeTeX Online LaTeX Studio

export type ProjectFileKind = "tex" | "bib" | "cls" | "sty" | "image" | "text";

export interface ProjectFile {
  id: string;
  path: string;
  kind: ProjectFileKind;
  content: string;
  updatedAt: number;
}

export interface ProjectSnapshot {
  id: string;
  label: string;
  createdAt: number;
  files: ProjectFile[];
  mainFilePath: string;
}

export interface WeTeXProject {
  id: string;
  name: string;
  templateId: string;
  mainFilePath: string;
  files: ProjectFile[];
  snapshots: ProjectSnapshot[];
  createdAt: number;
  updatedAt: number;
  localFolderName?: string;
  storageMode?: "browser" | "local-folder";
}

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface CompilerDiagnostic {
  id: string;
  severity: DiagnosticSeverity;
  file: string;
  line: number;
  message: string;
  context?: string;
}

export interface OutlineNode {
  id: string;
  title: string;
  level: number;
  kind:
    | "part"
    | "chapter"
    | "section"
    | "subsection"
    | "subsubsection"
    | "frame"
    | "figure"
    | "table"
    | "label";
  number?: string;
  file: string;
  line: number;
  targetId?: string;
}

export interface BibEntry {
  key: string;
  type: string;
  fields: Record<string, string>;
  file: string;
  line: number;
  raw: string;
}

export interface CompiledLabel {
  key: string;
  refText: string;
  kind: "section" | "equation" | "figure" | "table" | "theorem" | "item" | "page";
  title?: string;
  file: string;
  line: number;
  targetId: string;
}

export interface CompileStats {
  wordCount: number;
  charCount: number;
  mathCount: number;
  equationCount: number;
  figureCount: number;
  tableCount: number;
  citationCount: number;
  footnoteCount: number;
  estimatedPages: number;
  compileTimeMs: number;
}

export interface CompileResult {
  html: string;
  documentClass: string;
  classOptions: string[];
  isTwoColumn: boolean;
  isBeamer: boolean;
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  diagnostics: CompilerDiagnostic[];
  outline: OutlineNode[];
  labels: Record<string, CompiledLabel>;
  bibEntries: Record<string, BibEntry>;
  citedKeys: string[];
  stats: CompileStats;
  logLines: string[];
  pageCount: number;
  success: boolean;
}

export type EditorTheme =
  | "cosmos-dark"
  | "obsidian"
  | "aurora-midnight"
  | "paper-light";

export type PaperTheme = "classic" | "cream" | "sepia" | "night";

export type PaperLayout = "paginated" | "continuous";

export type CloudEngine = "pdflatex" | "xelatex" | "lualatex";

export type PreviewEngine = "real-pdf" | "instant";

export type BibliographyStyle = "plain" | "unsrt" | "alpha" | "ieee" | "apalike";

export type PdfViewerMode = "pdfjs" | "native";

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";

export interface CloudCompileState {
  status: "idle" | "compiling" | "success" | "error" | "offline";
  provider?: "texlive.net" | "ytotech";
  frameReady?: boolean;
  pdfUrl: string | null;
  pdfBlob: Blob | null;
  pdfSizeBytes: number;
  engine: CloudEngine;
  compileTimeMs: number;
  diagnostics: CompilerDiagnostic[];
  logLines: string[];
  errorMessage?: string;
  compiledAt?: number;
}

export interface EditorSettings {
  autoCompile: boolean;
  compileDelayMs: number;
  autoSave: boolean;
  autoSaveDelayMs: number;
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  autoCloseBrackets: boolean;
  highlightActiveLine: boolean;
  editorTheme: EditorTheme;
  paperTheme: PaperTheme;
  paperLayout: PaperLayout;
  previewEngine: PreviewEngine;
  cloudEngine: CloudEngine;
  bibliographyStyle: BibliographyStyle;
  pdfViewerMode: PdfViewerMode;
  spellCheck: boolean;
  pageSize: "a4" | "letter";
  liveMathBar: boolean;
}

export interface SymbolItem {
  label: string;
  insert: string;
  cursorOffset?: number;
  previewTex?: string;
  description: string;
}

export interface SymbolCategory {
  id: string;
  name: string;
  items: SymbolItem[];
}

export interface AutocompleteItem {
  label: string;
  insert: string;
  detail: string;
  kind: "command" | "environment" | "label" | "cite" | "file";
  cursorOffset?: number;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: "Academic" | "Presentation" | "Physics" | "CV" | "General";
  badge: string;
  description: string;
  mainFilePath: string;
  files: Omit<ProjectFile, "id" | "updatedAt">[];
}

export interface LineDiffRow {
  type: "same" | "add" | "remove";
  oldLineNo?: number;
  newLineNo?: number;
  text: string;
}
