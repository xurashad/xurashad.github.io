// ── Image Editor — Shared Types ──────────────────────────────────────────────

export type EditorTool =
  | "select"
  | "crop"
  | "resize"
  | "rotate"
  | "flip"
  | "filters"
  | "adjust"
  | "draw"
  | "text";

export type FilterType =
  | "none"
  | "vivid"
  | "warm"
  | "cool"
  | "noir"
  | "sepia"
  | "vintage"
  | "dramatic"
  | "fade"
  | "cyberpunk"
  | "film"
  | "sunset";

export type AdjustmentType =
  | "brightness"
  | "contrast"
  | "saturation"
  | "exposure"
  | "temperature"
  | "highlights"
  | "shadows"
  | "sharpness"
  | "blur"
  | "vignette";

export type ExportFormat = "png" | "jpeg" | "webp";

export interface AdjustmentValues {
  brightness: number;   // -100 to 100
  contrast: number;     // -100 to 100
  saturation: number;   // -100 to 100
  exposure: number;     // -100 to 100
  temperature: number;  // -100 to 100
  highlights: number;   // -100 to 100
  shadows: number;      // -100 to 100
  sharpness: number;    // 0 to 100
  blur: number;         // 0 to 100
  vignette: number;     // 0 to 100
}

export const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
};

export interface CropPreset {
  label: string;
  ratio: number | null; // null = freeform
  icon?: string;
}

export const CROP_PRESETS: CropPreset[] = [
  { label: "Free", ratio: null },
  { label: "1:1", ratio: 1 },
  { label: "4:3", ratio: 4 / 3 },
  { label: "16:9", ratio: 16 / 9 },
  { label: "3:2", ratio: 3 / 2 },
  { label: "2:3", ratio: 2 / 3 },
  { label: "9:16", ratio: 9 / 16 },
  { label: "5:4", ratio: 5 / 4 },
];

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DrawStroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  opacity: number;
  tool: "brush" | "eraser";
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
}

export type EditOperation =
  | { type: "crop"; rect: CropRect }
  | { type: "rotate"; degrees: 90 | 180 | 270 }
  | { type: "flip"; axis: "horizontal" | "vertical" }
  | { type: "resize"; width: number; height: number }
  | { type: "filter"; filter: FilterType }
  | { type: "adjustments"; values: AdjustmentValues }
  | { type: "draw"; strokes: DrawStroke[] }
  | { type: "text"; overlays: TextOverlay[] };

export interface EditorState {
  originalImage: HTMLImageElement | null;
  fileName: string;
  editHistory: EditOperation[];
  historyIndex: number;
  activeTool: EditorTool;
  zoom: number;
  panOffset: { x: number; y: number };
  // Current working values (before committing)
  currentFilter: FilterType;
  currentAdjustments: AdjustmentValues;
  currentCrop: CropRect | null;
  cropPresetIndex: number;
  currentStrokes: DrawStroke[];
  currentTextOverlays: TextOverlay[];
  // Drawing state
  drawColor: string;
  drawSize: number;
  drawOpacity: number;
  drawTool: "brush" | "eraser";
  // Export
  exportFormat: ExportFormat;
  exportQuality: number;
}

// Filter presets mapped to CSS filter strings + Canvas manipulation params
export interface FilterPreset {
  name: string;
  label: string;
  css: string; // for thumbnail preview
  apply: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

export const FILTER_PRESETS: { type: FilterType; label: string }[] = [
  { type: "none", label: "Original" },
  { type: "vivid", label: "Vivid" },
  { type: "warm", label: "Warm" },
  { type: "cool", label: "Cool" },
  { type: "noir", label: "Noir" },
  { type: "sepia", label: "Sepia" },
  { type: "vintage", label: "Vintage" },
  { type: "dramatic", label: "Dramatic" },
  { type: "fade", label: "Fade" },
  { type: "cyberpunk", label: "Cyberpunk" },
  { type: "film", label: "Film" },
  { type: "sunset", label: "Sunset" },
];

export const ADJUSTMENT_META: { key: AdjustmentType; label: string; min: number; max: number; unit?: string }[] = [
  { key: "brightness", label: "Brightness", min: -100, max: 100 },
  { key: "contrast", label: "Contrast", min: -100, max: 100 },
  { key: "saturation", label: "Saturation", min: -100, max: 100 },
  { key: "exposure", label: "Exposure", min: -100, max: 100 },
  { key: "temperature", label: "Temperature", min: -100, max: 100 },
  { key: "highlights", label: "Highlights", min: -100, max: 100 },
  { key: "shadows", label: "Shadows", min: -100, max: 100 },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100 },
  { key: "blur", label: "Blur", min: 0, max: 100, unit: "px" },
  { key: "vignette", label: "Vignette", min: 0, max: 100 },
];
