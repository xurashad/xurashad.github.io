import { DEFAULT_SETTINGS, PALETTE_LIBRARY } from "./palette";
import { FORMULA_ORDER } from "./formulas";
import type { FractalSettings, Palette, UserBookmark } from "./types";

const BOOKMARKS_KEY = "fractal-explorer:bookmarks:v2";
const CUSTOM_PALETTES_KEY = "fractal-explorer:palettes:v2";

export function loadBookmarks(): UserBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(bookmarks: UserBookmark[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks.slice(0, 40)));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function loadCustomPalettes(): Palette[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_PALETTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomPalettes(palettes: Palette[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(palettes.slice(0, 30)));
  } catch {
    // Ignore storage quota errors
  }
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64: string): string {
  const norm = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm.length % 4 === 0 ? "" : "=".repeat(4 - (norm.length % 4));
  const bin = atob(norm + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeStateToHash(settings: FractalSettings): string {
  const payload = {
    v: 2,
    f: settings.family,
    j: settings.isJulia ? 1 : 0,
    jx: settings.juliaCx,
    jy: settings.juliaCy,
    pw: settings.power,
    pp: settings.paramP,
    cam: settings.camera,
    mi: settings.maxIter,
    ai: settings.autoIter ? 1 : 0,
    col: settings.coloring,
    int: settings.interior,
    tr: settings.transfer,
    ps: settings.paletteScale,
    po: settings.paletteOffset,
    lt: settings.lighting,
    pal: settings.palette.id && PALETTE_LIBRARY.some(p => p.id === settings.palette.id)
      ? settings.palette.id
      : settings.palette,
  };
  return `#s=${toBase64Url(JSON.stringify(payload))}`;
}

export function decodeStateFromHash(hash: string): FractalSettings | null {
  if (!hash || !hash.includes("s=")) return null;
  try {
    const m = /s=([A-Za-z0-9\-_]+)/.exec(hash);
    if (!m) return null;
    const raw = JSON.parse(fromBase64Url(m[1]));
    if (!raw || typeof raw !== "object") return null;

    const family = FORMULA_ORDER.includes(raw.f) ? raw.f : DEFAULT_SETTINGS.family;
    const palette =
      typeof raw.pal === "string"
        ? PALETTE_LIBRARY.find(p => p.id === raw.pal) ?? DEFAULT_SETTINGS.palette
        : raw.pal && typeof raw.pal === "object" && Array.isArray(raw.pal.stops)
          ? (raw.pal as Palette)
          : DEFAULT_SETTINGS.palette;

    const cam = raw.cam && typeof raw.cam === "object" ? raw.cam : DEFAULT_SETTINGS.camera;

    return {
      ...DEFAULT_SETTINGS,
      family,
      isJulia: Boolean(raw.j),
      juliaCx: Number.isFinite(raw.jx) ? raw.jx : DEFAULT_SETTINGS.juliaCx,
      juliaCy: Number.isFinite(raw.jy) ? raw.jy : DEFAULT_SETTINGS.juliaCy,
      power: Number.isFinite(raw.pw) ? raw.pw : DEFAULT_SETTINGS.power,
      paramP: Number.isFinite(raw.pp) ? raw.pp : DEFAULT_SETTINGS.paramP,
      camera: {
        centerX: Number.isFinite(cam.centerX) ? cam.centerX : DEFAULT_SETTINGS.camera.centerX,
        centerY: Number.isFinite(cam.centerY) ? cam.centerY : DEFAULT_SETTINGS.camera.centerY,
        zoom: Number.isFinite(cam.zoom) ? Math.max(0.15, cam.zoom) : DEFAULT_SETTINGS.camera.zoom,
        rotation: Number.isFinite(cam.rotation) ? cam.rotation : 0,
      },
      maxIter: Number.isFinite(raw.mi) ? Math.max(16, Math.min(8192, raw.mi)) : DEFAULT_SETTINGS.maxIter,
      autoIter: raw.ai !== undefined ? Boolean(raw.ai) : DEFAULT_SETTINGS.autoIter,
      coloring: raw.col ?? DEFAULT_SETTINGS.coloring,
      interior: raw.int ?? DEFAULT_SETTINGS.interior,
      transfer: raw.tr ?? DEFAULT_SETTINGS.transfer,
      paletteScale: Number.isFinite(raw.ps) ? raw.ps : DEFAULT_SETTINGS.paletteScale,
      paletteOffset: Number.isFinite(raw.po) ? raw.po : DEFAULT_SETTINGS.paletteOffset,
      lighting: raw.lt && typeof raw.lt === "object"
        ? { ...DEFAULT_SETTINGS.lighting, ...raw.lt }
        : DEFAULT_SETTINGS.lighting,
      palette,
    };
  } catch {
    return null;
  }
}

export function serializeSettingsJSON(settings: FractalSettings): string {
  return JSON.stringify({ app: "fractal-explorer", version: 2, settings }, null, 2);
}

export function parseSettingsJSON(json: string): FractalSettings | null {
  try {
    const parsed = JSON.parse(json);
    const s = parsed?.settings ?? parsed;
    if (!s || typeof s !== "object" || !FORMULA_ORDER.includes(s.family)) return null;
    return {
      ...DEFAULT_SETTINGS,
      ...s,
      camera: { ...DEFAULT_SETTINGS.camera, ...(s.camera ?? {}) },
      lighting: { ...DEFAULT_SETTINGS.lighting, ...(s.lighting ?? {}) },
      trap: { ...DEFAULT_SETTINGS.trap, ...(s.trap ?? {}) },
      palette: s.palette && Array.isArray(s.palette.stops) ? s.palette : DEFAULT_SETTINGS.palette,
    };
  } catch {
    return null;
  }
}
