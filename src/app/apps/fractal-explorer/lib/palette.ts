import type { Palette, FractalView } from "./types";

// ── Colour math ───────────────────────────────────────────────────────────────

export function hexToRgb01(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r
    ? [parseInt(r[1], 16) / 255, parseInt(r[2], 16) / 255, parseInt(r[3], 16) / 255]
    : [0, 0, 0];
}

export function rgb01ToHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
}

function hsbToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 1) + 1) % 1; // wrap
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  const lut: [number,number,number][] = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]];
  const [r, g, b] = lut[i % 6];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function lerp(a: number, b: number, t: number) { return a + t * (b - a); }

function evalPalette(palette: Palette, pos: number): [number, number, number] {
  pos = ((pos % 1) + 1) % 1;
  const stops = palette.stops;
  let si = 1;
  while (si < stops.length - 1 && pos > stops[si].pos) si++;
  const a = stops[si - 1], b = stops[si];
  const t = (pos - a.pos) / (b.pos - a.pos || 1);
  const c0 = lerp(a.color[0], b.color[0], t);
  const c1 = lerp(a.color[1], b.color[1], t);
  const c2 = lerp(a.color[2], b.color[2], t);
  if (palette.colorType === "HSB") return hsbToRgb(c0, c1, c2);
  return [
    Math.round(Math.max(0, Math.min(255, c0 * 255))),
    Math.round(Math.max(0, Math.min(255, c1 * 255))),
    Math.round(Math.max(0, Math.min(255, c2 * 255))),
  ];
}

/** Build a flat RGBA Uint8Array palette of `len` entries for fast lookup */
export function buildPaletteRGBA(palette: Palette, len: number, offset: number): Uint8Array {
  const buf = new Uint8Array(len * 4);
  const shift = ((Math.round(offset * len)) % len + len) % len;
  for (let i = 0; i < len; i++) {
    const pos = i / (len > 1 ? len - 1 : 1);
    const idx = ((i + shift) % len);
    const [r, g, b] = evalPalette(palette, pos);
    buf[idx * 4    ] = r;
    buf[idx * 4 + 1] = g;
    buf[idx * 4 + 2] = b;
    buf[idx * 4 + 3] = 255;
  }
  return buf;
}

/** CSS gradient string (64 stops) for preview */
export function paletteGradientCSS(palette: Palette): string {
  const N = 64;
  return Array.from({ length: N }, (_, i) => {
    const [r, g, b] = evalPalette(palette, i / (N - 1));
    return `rgb(${r},${g},${b})`;
  }).join(",");
}

// ── Standard palettes ─────────────────────────────────────────────────────────

export const STANDARD_PALETTES: Record<string, Palette> = {
  Spectrum:      { colorType: "HSB", stops: [{ pos: 0, color: [0,1,1] }, { pos: 1, color: [1,1,1] }] },
  "Blue/Gold":   { colorType: "RGB", stops: [{ pos: 0, color: [0.1,0.1,1] }, { pos: 0.5, color: [1,0.6,0] }, { pos: 1, color: [0.3,0.3,1] }] },
  Fire:          { colorType: "RGB", stops: [{ pos: 0, color: [0,0,0] }, { pos: 0.17, color: [1,0,0] }, { pos: 0.83, color: [1,1,0] }, { pos: 1, color: [1,1,1] }] },
  "Cyclic Fire": { colorType: "RGB", stops: [{ pos: 0, color: [0,0,0] }, { pos: 0.2, color: [1,0,0] }, { pos: 0.4, color: [1,1,0] }, { pos: 0.5, color: [1,1,1] }, { pos: 0.6, color: [1,1,0] }, { pos: 0.8, color: [1,0,0] }, { pos: 1, color: [0,0,0] }] },
  Ocean:         { colorType: "RGB", stops: [{ pos: 0, color: [0,0,0.2] }, { pos: 0.4, color: [0,0.3,0.8] }, { pos: 0.7, color: [0,0.8,0.9] }, { pos: 1, color: [1,1,1] }] },
  Pastels:       { colorType: "RGB", stops: [{ pos: 0, color: [0.806,0.816,0.822] }, { pos: 0.181, color: [0.439,0.524,1] }, { pos: 0.419, color: [1,0.359,0.582] }, { pos: 0.627, color: [1,1,0.521] }, { pos: 0.858, color: [0.548,0.934,0.569] }, { pos: 1, color: [0.806,0.816,0.822] }] },
  Cosmos:        { colorType: "HSB", stops: [{ pos: 0, color: [0.65,0.9,0.1] }, { pos: 0.3, color: [0.7,0.8,0.6] }, { pos: 0.6, color: [0.85,0.7,0.9] }, { pos: 1, color: [0.65,0.9,0.1] }] },
  Dark:          { colorType: "RGB", stops: [{ pos: 0, color: [0.66,0,0] }, { pos: 0.182, color: [0,0.306,0.588] }, { pos: 0.386, color: [0.816,0.415,0.072] }, { pos: 0.572, color: [0,0.487,0.165] }, { pos: 0.783, color: [0.298,0.138,0.75] }, { pos: 1, color: [0.66,0,0] }] },
  Grayscale:     { colorType: "RGB", stops: [{ pos: 0, color: [0,0,0] }, { pos: 1, color: [1,1,1] }] },
  "Red/Cyan":    { colorType: "RGB", stops: [{ pos: 0, color: [1,0,0] }, { pos: 0.5, color: [0,1,1] }, { pos: 1, color: [1,0,0] }] },
  EarthAndSky:   { colorType: "RGB", stops: [{ pos: 0, color: [1,1,1] }, { pos: 0.15, color: [1,0.8,0] }, { pos: 0.33, color: [0.53,0.12,0.075] }, { pos: 0.67, color: [0,0,0.6] }, { pos: 0.85, color: [0,0.4,1] }, { pos: 1, color: [1,1,1] }] },
  Seashore:      { colorType: "RGB", stops: [{ pos: 0, color: [0.791,0.996,0.763] }, { pos: 0.167, color: [0.897,0.895,0.657] }, { pos: 0.333, color: [0.947,0.316,0.127] }, { pos: 0.5, color: [0.518,0.111,0.092] }, { pos: 0.667, color: [0.02,0.456,0.684] }, { pos: 0.833, color: [0.539,0.826,0.818] }, { pos: 1, color: [0.791,0.996,0.763] }] },
};

// ── Default settings ──────────────────────────────────────────────────────────

export const DEFAULT_VIEW: FractalView = { xmin: -2.5, xmax: 1.0, ymin: -1.2, ymax: 1.2 };

export const DEFAULT_SETTINGS = {
  fractalType: "Mandelbrot" as const,
  cx: -0.8, cy: 0.156,
  view: DEFAULT_VIEW,
  maxIter: 256,
  palette: STANDARD_PALETTES.Spectrum,
  paletteLen: 256,
  paletteOffset: 0,
  interlaced: true,
};

// ── Famous locations ──────────────────────────────────────────────────────────

export const PRESETS: Array<{ name: string; settings: Partial<{ fractalType: "Mandelbrot" | "Julia"; cx: number; cy: number; view: FractalView }> }> = [
  { name: "Full Mandelbrot",    settings: { fractalType: "Mandelbrot", view: { xmin: -2.5, xmax: 1, ymin: -1.2, ymax: 1.2 } } },
  { name: "Seahorse Valley",    settings: { fractalType: "Mandelbrot", view: { xmin: -0.756, xmax: -0.744, ymin: 0.098, ymax: 0.108 } } },
  { name: "Elephant Valley",    settings: { fractalType: "Mandelbrot", view: { xmin: 0.275, xmax: 0.285, ymin: -0.012, ymax: -0.004 } } },
  { name: "Lightning",          settings: { fractalType: "Mandelbrot", view: { xmin: -0.190, xmax: -0.070, ymin: 1.030, ymax: 1.100 } } },
  { name: "Spiral",             settings: { fractalType: "Mandelbrot", view: { xmin: -0.7269, xmax: -0.7260, ymin: 0.1882, ymax: 0.1887 } } },
  { name: "Julia — Dragon",     settings: { fractalType: "Julia", cx: -0.8,   cy: 0.156,  view: DEFAULT_VIEW } },
  { name: "Julia — Snowflake",  settings: { fractalType: "Julia", cx: -0.4,   cy: 0.6,    view: DEFAULT_VIEW } },
  { name: "Julia — Rabbit",     settings: { fractalType: "Julia", cx: -0.123, cy: 0.745,  view: DEFAULT_VIEW } },
  { name: "Julia — Spirals",    settings: { fractalType: "Julia", cx: 0.285,  cy: 0.01,   view: DEFAULT_VIEW } },
  { name: "Julia — Dendrite",   settings: { fractalType: "Julia", cx: 0.0,    cy: 1.0,    view: DEFAULT_VIEW } },
];

// ── Worker script ─────────────────────────────────────────────────────────────

export function getWorkerScript(): string {
  return `
self.onmessage = function(e) {
  const { row, jobId, width, height, xmin, xmax, ymin, ymax, maxIter, fractalType, cx, cy } = e.data;
  const dx = (xmax - xmin) / (width  > 1 ? width  - 1 : 1);
  const dy = (ymax - ymin) / (height > 1 ? height - 1 : 1);

  if (Math.abs(dx) < 1e-15 || Math.abs(dy) < 1e-15) {
    self.postMessage({ row, jobId, error: 'Maximum zoom depth reached.' });
    return;
  }

  const counts = new Int32Array(width);

  for (let i = 0; i < width; i++) {
    let x0, y0, zx, zy;
    if (fractalType === 'Julia') {
      x0 = cx; y0 = cy;
      zx = xmin + i * dx; zy = ymax - row * dy;
    } else {
      x0 = xmin + i * dx; y0 = ymax - row * dy;
      zx = 0; zy = 0;
    }

    let iter = 0;
    while (zx*zx + zy*zy <= 4 && iter < maxIter) {
      const t = zx*zx - zy*zy + x0;
      zy = 2*zx*zy + y0;
      zx = t;
      iter++;
    }

    // Smooth iteration count for nicer band colouring
    if (iter < maxIter) {
      const log2 = Math.log2(zx*zx + zy*zy);
      counts[i] = iter * 100 + Math.round((2 - log2 / 2) * 100);
    } else {
      counts[i] = -1; // interior — black
    }
  }

  self.postMessage({ row, jobId, counts }, [counts.buffer]);
};
`;
}
