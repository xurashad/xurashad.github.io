export type ColorType = "RGB" | "HSB";

export interface PaletteStop {
  pos: number;
  color: [number, number, number]; // 0–1 components
}

export interface Palette {
  colorType: ColorType;
  stops: PaletteStop[];
}

export interface FractalView {
  xmin: number; xmax: number;
  ymin: number; ymax: number;
}

export interface Settings {
  fractalType: "Mandelbrot" | "Julia";
  cx: number; cy: number;   // Julia c parameter
  view: FractalView;
  maxIter: number;
  palette: Palette;
  paletteLen: number;
  paletteOffset: number;
  interlaced: boolean;
}

export interface CanvasSize { w: number; h: number }

/** What the worker receives per job */
export interface WorkerJob {
  row: number;
  jobId: number;
  width: number;
  height: number;
  xmin: number; xmax: number;
  ymin: number; ymax: number;
  maxIter: number;
  fractalType: "Mandelbrot" | "Julia";
  cx: number; cy: number;
}

/** What the worker replies with */
export interface WorkerResult {
  row: number;
  jobId: number;
  counts?: Int32Array;
  error?: string;
}
