import type { CosinePaletteParams, FractalSettings, Palette, PaletteStop } from "./types";

// ── Colour math (Canonical sRGB 0..1 stops + HSL/Cubic/Cosine evaluation) ─────

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function hexToRgb01(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255];
}

export function rgb01ToHex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map(c => Math.round(clamp01(c) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 1) + 1) % 1;
  if (s <= 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    const tt = ((t % 1) + 1) % 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)];
}

function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export function evalCosinePalette(cosine: CosinePaletteParams, t: number): [number, number, number] {
  const tau = Math.PI * 2;
  return [
    clamp01(cosine.a[0] + cosine.b[0] * Math.cos(tau * (cosine.c[0] * t + cosine.d[0]))),
    clamp01(cosine.a[1] + cosine.b[1] * Math.cos(tau * (cosine.c[1] * t + cosine.d[1]))),
    clamp01(cosine.a[2] + cosine.b[2] * Math.cos(tau * (cosine.c[2] * t + cosine.d[2]))),
  ];
}

export function evalPalette01(palette: Palette, rawPos: number): [number, number, number] {
  const pos = ((rawPos % 1) + 1) % 1;
  if (palette.mode === "cosine" && palette.cosine) {
    return evalCosinePalette(palette.cosine, pos);
  }

  const stops = palette.stops.length >= 2
    ? palette.stops
    : [
      { pos: 0, color: [0.02, 0.02, 0.08] as [number, number, number] },
      { pos: 1, color: [0, 0.76, 0.96] as [number, number, number] },
    ];

  let si = 1;
  while (si < stops.length - 1 && pos > stops[si].pos) si++;
  const a = stops[si - 1];
  const b = stops[si];
  const span = b.pos - a.pos;
  const t = span > 1e-6 ? clamp01((pos - a.pos) / span) : 0;

  if (palette.interpolation === "hsl") {
    const [h1, s1, l1] = rgbToHsl(a.color[0], a.color[1], a.color[2]);
    const [h2, s2, l2] = rgbToHsl(b.color[0], b.color[1], b.color[2]);
    let dh = h2 - h1;
    if (dh > 0.5) dh -= 1;
    if (dh < -0.5) dh += 1;
    const h = h1 + dh * t;
    const s = s1 + (s2 - s1) * t;
    const l = l1 + (l2 - l1) * t;
    return hslToRgb(h, s, l);
  }

  if (palette.interpolation === "cubic" && stops.length >= 3) {
    const i0 = si - 2 >= 0 ? si - 2 : Math.max(0, stops.length - 2);
    const i1 = si - 1;
    const i2 = si;
    const i3 = si + 1 < stops.length ? si + 1 : Math.min(stops.length - 1, 1);
    const p0 = stops[i0].color;
    const p1 = stops[i1].color;
    const p2 = stops[i2].color;
    const p3 = stops[i3].color;
    return [
      clamp01(catmullRom(p0[0], p1[0], p2[0], p3[0], t)),
      clamp01(catmullRom(p0[1], p1[1], p2[1], p3[1], t)),
      clamp01(catmullRom(p0[2], p1[2], p2[2], p3[2], t)),
    ];
  }

  return [
    clamp01(a.color[0] + (b.color[0] - a.color[0]) * t),
    clamp01(a.color[1] + (b.color[1] - a.color[1]) * t),
    clamp01(a.color[2] + (b.color[2] - a.color[2]) * t),
  ];
}

export function evalPalette255(palette: Palette, pos: number): [number, number, number] {
  const [r, g, b] = evalPalette01(palette, pos);
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/** Build a flat RGBA Uint8Array LUT (`len` entries, unshifted so offset applies cleanly at lookup) */
export function buildPaletteRGBA(palette: Palette, len = 1024): Uint8Array {
  const buf = new Uint8Array(len * 4);
  for (let i = 0; i < len; i++) {
    const pos = i / len;
    const [r, g, b] = evalPalette255(palette, pos);
    buf[i * 4] = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = 255;
  }
  return buf;
}

/** CSS gradient stop string for crisp swatches & previews */
export function paletteGradientCSS(palette: Palette, samples = 48): string {
  return Array.from({ length: samples }, (_, i) => {
    const [r, g, b] = evalPalette255(palette, i / (samples - 1));
    return `rgb(${r},${g},${b})`;
  }).join(",");
}

export function paletteFingerprint(palette: Palette): string {
  if (palette.mode === "cosine" && palette.cosine) {
    const { a, b, c, d } = palette.cosine;
    return `cos:${a.map(v => v.toFixed(3))}:${b.map(v => v.toFixed(3))}:${c.map(v => v.toFixed(3))}:${d.map(v => v.toFixed(3))}`;
  }
  return `stops:${palette.interpolation}:${palette.stops
    .map(s => `${s.pos.toFixed(3)}@${s.color.map(v => v.toFixed(3)).join(",")}`)
    .join("|")}`;
}

export function generateHarmoniousPalette(): Palette {
  const baseHue = Math.random();
  const useCosine = Math.random() < 0.45;
  if (useCosine) {
    const a: [number, number, number] = [0.46 + Math.random() * 0.14, 0.45 + Math.random() * 0.14, 0.48 + Math.random() * 0.14];
    const b: [number, number, number] = [0.38 + Math.random() * 0.14, 0.36 + Math.random() * 0.14, 0.42 + Math.random() * 0.12];
    const c: [number, number, number] = [1.0, 1.0, 1.0];
    const d: [number, number, number] = [
      baseHue,
      (baseHue + 0.15 + Math.random() * 0.2) % 1,
      (baseHue + 0.35 + Math.random() * 0.25) % 1,
    ];
    return {
      id: `rand-${Date.now()}`,
      name: "Generated Cosine",
      category: "Custom",
      mode: "cosine",
      interpolation: "cubic",
      stops: sampleCosineToStops({ a, b, c, d }),
      cosine: { a, b, c, d },
    };
  }

  const darkAnchor = hslToRgb(baseHue, 0.72, 0.07);
  const mid1 = hslToRgb((baseHue + 0.14) % 1, 0.85, 0.36);
  const bright = hslToRgb((baseHue + 0.38) % 1, 0.92, 0.62);
  const highlight = hslToRgb((baseHue + 0.55) % 1, 0.88, 0.86);
  const accent = hslToRgb((baseHue + 0.78) % 1, 0.78, 0.44);
  const stops: PaletteStop[] = [
    { pos: 0, color: darkAnchor },
    { pos: 0.22, color: mid1 },
    { pos: 0.48, color: bright },
    { pos: 0.68, color: highlight },
    { pos: 0.85, color: accent },
    { pos: 1, color: darkAnchor },
  ];
  return {
    id: `rand-${Date.now()}`,
    name: "Generated Harmonic",
    category: "Custom",
    mode: "stops",
    interpolation: "cubic",
    stops,
  };
}

export function sampleCosineToStops(cosine: CosinePaletteParams, count = 6): PaletteStop[] {
  return Array.from({ length: count }, (_, i) => {
    const pos = i / (count - 1);
    return { pos, color: evalCosinePalette(cosine, pos) };
  });
}

function stop(pos: number, hex: string): PaletteStop {
  return { pos, color: hexToRgb01(hex) };
}

// ── Curated 20-Palette Library ────────────────────────────────────────────────

export const PALETTE_LIBRARY: Palette[] = [
  // Celestial
  {
    id: "celestial-mirage",
    name: "Celestial Mirage",
    category: "Celestial",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#050510"),
      stop(0.16, "#161240"),
      stop(0.36, "#9333ea"),
      stop(0.55, "#00c3f5"),
      stop(0.74, "#fbc2eb"),
      stop(0.88, "#f8f9fa"),
      stop(1.0, "#050510"),
    ],
  },
  {
    id: "ultra-classic",
    name: "Ultra Fractal Classic",
    category: "Celestial",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#000764"),
      stop(0.16, "#206bcb"),
      stop(0.42, "#edffff"),
      stop(0.6425, "#ffaa00"),
      stop(0.8575, "#000200"),
      stop(1.0, "#000764"),
    ],
  },
  {
    id: "event-horizon",
    name: "Event Horizon",
    category: "Celestial",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#030308"),
      stop(0.22, "#1c0b3b"),
      stop(0.46, "#6366f1"),
      stop(0.68, "#38bdf8"),
      stop(0.86, "#fde68a"),
      stop(1.0, "#030308"),
    ],
  },
  {
    id: "deep-cosmos",
    name: "Deep Cosmos",
    category: "Celestial",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#06081a"),
      stop(0.25, "#1d3575"),
      stop(0.5, "#7c3aed"),
      stop(0.75, "#ec4899"),
      stop(1.0, "#06081a"),
    ],
  },
  {
    id: "quantum-plasma",
    name: "Quantum Plasma",
    category: "Celestial",
    mode: "cosine",
    interpolation: "cubic",
    cosine: { a: [0.5, 0.5, 0.55], b: [0.5, 0.45, 0.45], c: [1.0, 1.0, 1.0], d: [0.0, 0.33, 0.67] },
    stops: sampleCosineToStops({ a: [0.5, 0.5, 0.55], b: [0.5, 0.45, 0.45], c: [1.0, 1.0, 1.0], d: [0.0, 0.33, 0.67] }),
  },
  {
    id: "solar-corona",
    name: "Solar Corona",
    category: "Celestial",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#0c0408"),
      stop(0.22, "#5b1025"),
      stop(0.48, "#ea580c"),
      stop(0.72, "#fbbf24"),
      stop(0.88, "#fef9c3"),
      stop(1.0, "#0c0408"),
    ],
  },

  // Scientific
  {
    id: "viridis",
    name: "Viridis",
    category: "Scientific",
    mode: "stops",
    interpolation: "rgb",
    stops: [
      stop(0.0, "#440154"),
      stop(0.25, "#3b528b"),
      stop(0.5, "#21918c"),
      stop(0.75, "#5ec962"),
      stop(0.92, "#fde725"),
      stop(1.0, "#440154"),
    ],
  },
  {
    id: "inferno",
    name: "Inferno",
    category: "Scientific",
    mode: "stops",
    interpolation: "rgb",
    stops: [
      stop(0.0, "#000004"),
      stop(0.25, "#57106e"),
      stop(0.5, "#bc3754"),
      stop(0.75, "#f98e09"),
      stop(0.92, "#fcffa4"),
      stop(1.0, "#000004"),
    ],
  },
  {
    id: "magma",
    name: "Magma",
    category: "Scientific",
    mode: "stops",
    interpolation: "rgb",
    stops: [
      stop(0.0, "#000004"),
      stop(0.25, "#51127c"),
      stop(0.5, "#b73779"),
      stop(0.75, "#fb8861"),
      stop(0.92, "#fcfdbf"),
      stop(1.0, "#000004"),
    ],
  },
  {
    id: "turbo",
    name: "Turbo Spectral",
    category: "Scientific",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#30123b"),
      stop(0.2, "#4686fa"),
      stop(0.4, "#1ae4b6"),
      stop(0.6, "#a4fc3c"),
      stop(0.8, "#fb8022"),
      stop(1.0, "#30123b"),
    ],
  },
  {
    id: "ocean-abyss",
    name: "Ocean Abyss",
    category: "Scientific",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#020817"),
      stop(0.28, "#0c4a6e"),
      stop(0.56, "#06b6d4"),
      stop(0.82, "#e0f2fe"),
      stop(1.0, "#020817"),
    ],
  },
  {
    id: "iridescent-pearl",
    name: "Iridescent Cosine",
    category: "Scientific",
    mode: "cosine",
    interpolation: "cubic",
    cosine: { a: [0.55, 0.55, 0.58], b: [0.42, 0.4, 0.42], c: [1.0, 1.0, 1.0], d: [0.25, 0.42, 0.65] },
    stops: sampleCosineToStops({ a: [0.55, 0.55, 0.58], b: [0.42, 0.4, 0.42], c: [1.0, 1.0, 1.0], d: [0.25, 0.42, 0.65] }),
  },

  // Classic
  {
    id: "spectrum",
    name: "Spectrum Prism",
    category: "Classic",
    mode: "stops",
    interpolation: "hsl",
    stops: [
      stop(0.0, "#ef4444"),
      stop(0.33, "#10b981"),
      stop(0.67, "#3b82f6"),
      stop(1.0, "#ef4444"),
    ],
  },
  {
    id: "blue-gold",
    name: "Blue & Gold",
    category: "Classic",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#0a1045"),
      stop(0.35, "#2563eb"),
      stop(0.62, "#f59e0b"),
      stop(0.82, "#fef3c7"),
      stop(1.0, "#0a1045"),
    ],
  },
  {
    id: "cyclic-fire",
    name: "Cyclic Fire",
    category: "Classic",
    mode: "stops",
    interpolation: "rgb",
    stops: [
      stop(0.0, "#050202"),
      stop(0.2, "#b91c1c"),
      stop(0.4, "#f59e0b"),
      stop(0.5, "#ffffff"),
      stop(0.6, "#f59e0b"),
      stop(0.8, "#b91c1c"),
      stop(1.0, "#050202"),
    ],
  },
  {
    id: "jade-gold",
    name: "Jade & Gold",
    category: "Classic",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#04120c"),
      stop(0.28, "#0f766e"),
      stop(0.55, "#34d399"),
      stop(0.78, "#fbbf24"),
      stop(1.0, "#04120c"),
    ],
  },
  {
    id: "sakura-dawn",
    name: "Sakura Dawn",
    category: "Classic",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#190a1e"),
      stop(0.28, "#831843"),
      stop(0.56, "#f472b6"),
      stop(0.8, "#fce7f3"),
      stop(1.0, "#190a1e"),
    ],
  },
  {
    id: "emerald-obsidian",
    name: "Emerald Obsidian",
    category: "Classic",
    mode: "stops",
    interpolation: "cubic",
    stops: [
      stop(0.0, "#050a08"),
      stop(0.32, "#14532d"),
      stop(0.6, "#22c55e"),
      stop(0.84, "#bbf7d0"),
      stop(1.0, "#050a08"),
    ],
  },
  {
    id: "earth-sky",
    name: "Earth & Sky",
    category: "Classic",
    mode: "stops",
    interpolation: "rgb",
    stops: [
      stop(0.0, "#f8fafc"),
      stop(0.18, "#facc15"),
      stop(0.38, "#9a3412"),
      stop(0.66, "#0369a1"),
      stop(0.86, "#38bdf8"),
      stop(1.0, "#f8fafc"),
    ],
  },
  {
    id: "monochrome-ink",
    name: "Monochrome Ink",
    category: "Classic",
    mode: "stops",
    interpolation: "rgb",
    stops: [
      stop(0.0, "#050507"),
      stop(0.5, "#e2e8f0"),
      stop(1.0, "#050507"),
    ],
  },
];

export function getPaletteById(id?: string): Palette {
  if (!id) return PALETTE_LIBRARY[0];
  return PALETTE_LIBRARY.find(p => p.id === id) ?? PALETTE_LIBRARY[0];
}

export const DEFAULT_SETTINGS: FractalSettings = {
  family: "mandelbrot",
  isJulia: false,
  juliaCx: -0.8,
  juliaCy: 0.156,
  power: 2,
  paramP: -0.5,
  camera: { centerX: -0.5, centerY: 0, zoom: 1.15, rotation: 0 },
  maxIter: 256,
  autoIter: true,
  bailout: 256,
  coloring: "smooth",
  interior: "solid",
  interiorColor: "#04040a",
  transfer: "linear",
  palette: PALETTE_LIBRARY[0],
  paletteScale: 0.045,
  paletteOffset: 0,
  stripeDensity: 3.0,
  lighting: {
    enabled: true,
    azimuth: 45,
    elevation: 55,
    strength: 0.45,
    specular: 0.35,
  },
  trap: { x: 0, y: 0, radius: 1.0 },
  engine: "auto",
  aa: 1,
  dprScale: 1,
};
