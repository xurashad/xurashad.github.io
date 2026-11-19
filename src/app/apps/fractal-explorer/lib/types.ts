export type FractalFamily =
  | "mandelbrot"
  | "burning-ship"
  | "tricorn"
  | "celtic"
  | "buffalo"
  | "phoenix"
  | "newton"
  | "nova"
  | "magnet1"
  | "lambda";

export interface CameraState {
  centerX: number;
  centerY: number;
  /** zoom = 1 maps the viewport height to 3.0 complex units */
  zoom: number;
  /** rotation in radians */
  rotation: number;
}

export type ColoringMode =
  | "smooth"
  | "distance"
  | "trap-cross"
  | "trap-ring"
  | "trap-point"
  | "stripe"
  | "decomp"
  | "orbit-avg";

export type InteriorMode = "solid" | "magnitude" | "trap" | "min-orbit";

export type TransferScale = "linear" | "log" | "sqrt";

export type EngineMode = "auto" | "gpu-f32" | "gpu-ds64" | "cpu-f64";

export type ActiveEngine = "gpu-f32" | "gpu-ds64" | "cpu-f64";

export type ToolMode = "pan" | "box-zoom" | "orbit";

export type PaletteInterpolation = "rgb" | "hsl" | "cubic";

export interface PaletteStop {
  pos: number;
  /** Canonical sRGB 0..1 components */
  color: [number, number, number];
}

export interface CosinePaletteParams {
  a: [number, number, number];
  b: [number, number, number];
  c: [number, number, number];
  d: [number, number, number];
}

export type PaletteCategory = "Celestial" | "Scientific" | "Classic" | "Custom";

export interface Palette {
  id?: string;
  name?: string;
  category?: PaletteCategory;
  mode: "stops" | "cosine";
  interpolation: PaletteInterpolation;
  stops: PaletteStop[];
  cosine?: CosinePaletteParams;
}

export interface LightingSettings {
  enabled: boolean;
  azimuth: number;   // degrees 0..360
  elevation: number; // degrees 5..88
  strength: number;  // 0..1
  specular: number;  // 0..1
}

export interface TrapSettings {
  x: number;
  y: number;
  radius: number;
}

export interface OverlaySettings {
  grid: boolean;
  hud: boolean;
  orbitProbe: boolean;
  pipJulia: boolean;
  splitView: boolean;
  minimap: boolean;
}

export type MorphPath = "cardioid" | "circle" | "figure8";

export interface AnimationState {
  cyclePalette: boolean;
  cycleSpeed: number;
  autoZoom: boolean;
  zoomSpeed: number;
  juliaMorph: boolean;
  morphPath: MorphPath;
  morphSpeed: number;
  powerMorph: boolean;
}

export interface FractalSettings {
  family: FractalFamily;
  isJulia: boolean;
  juliaCx: number;
  juliaCy: number;
  power: number;
  paramP: number;
  camera: CameraState;
  maxIter: number;
  autoIter: boolean;
  bailout: number;
  coloring: ColoringMode;
  interior: InteriorMode;
  interiorColor: string;
  transfer: TransferScale;
  palette: Palette;
  paletteScale: number;
  paletteOffset: number;
  stripeDensity: number;
  lighting: LightingSettings;
  trap: TrapSettings;
  engine: EngineMode;
  aa: 1 | 2 | 4;
  dprScale: number;
}

export type PresetCategory =
  | "Mandelbrot"
  | "Julia"
  | "Exotic"
  | "Newton & Nova"
  | "Physics";

export interface PresetLocation {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  accentGradient: [string, string];
  settings: Partial<Omit<FractalSettings, "camera" | "lighting" | "trap">> & {
    camera: CameraState;
    paletteId?: string;
  };
}

export interface UserBookmark {
  id: string;
  name: string;
  createdAt: number;
  thumbnail?: string;
  settings: FractalSettings;
}

export interface RenderStats {
  activeEngine: ActiveEngine;
  renderMs: number;
  fps: number;
  effectiveIter: number;
  width: number;
  height: number;
  progress: number;
  busy: boolean;
}

export interface OrbitPoint {
  x: number;
  y: number;
}

export interface OrbitAnalysis {
  startRe: number;
  startIm: number;
  points: OrbitPoint[];
  escaped: boolean;
  converged: boolean;
  convergedRoot: number;
  escapeIter: number;
  smoothIter: number;
  detectedPeriod: number | null;
  lyapunov: number;
  minMag: number;
  maxMag: number;
}

export interface ExportConfig {
  width: number;
  height: number;
  format: "png" | "webp" | "jpeg";
  quality: number;
  aa: 1 | 2 | 4;
  watermark: boolean;
}
