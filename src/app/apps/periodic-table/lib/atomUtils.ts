import { getElementExtra } from "./elementExtras";
import type {
  Element,
  HeatmapPalette,
  HeatmapProperty,
  TemperatureUnit,
} from "./types";

/**
 * Standard CPK (Corey-Pauling-Koltun) colors for elements.
 */
export const CPK_COLORS: Record<number, string> = {
  1: "#FFFFFF", 2: "#D9FFFF", 3: "#CC80FF", 4: "#C2FF00", 5: "#FFB5B5",
  6: "#909090", 7: "#3050F8", 8: "#FF0D0D", 9: "#90E050", 10: "#B3E3F5",
  11: "#AB5CF2", 12: "#8AFF00", 13: "#BFA6A6", 14: "#F0C8A0", 15: "#FF8000",
  16: "#FFFF30", 17: "#1FF01F", 18: "#80D1E3", 19: "#8F40D4", 20: "#3DFF00",
  21: "#E6E6E6", 22: "#BFC2C7", 23: "#A6A6AB", 24: "#8A99C7", 25: "#9C7AC7",
  26: "#E06633", 27: "#F090A0", 28: "#50D050", 29: "#C88033", 30: "#7D80B0",
  31: "#C28F8F", 32: "#668F8F", 33: "#BD80E3", 34: "#FFA100", 35: "#A62929",
  36: "#5CB8D1", 37: "#702EB0", 38: "#00FF00", 39: "#94FFFF", 40: "#94E0E0",
  41: "#73C2C9", 42: "#54B5B5", 43: "#3B9E9E", 44: "#248F8F", 45: "#0A7D8C",
  46: "#006985", 47: "#C0C0C0", 48: "#FFD98F", 49: "#A67573", 50: "#668080",
  51: "#9E63B5", 52: "#D47A00", 53: "#940094", 54: "#429EB0", 55: "#57178F",
  56: "#00C900", 57: "#70D4FF", 58: "#FFFFC7", 59: "#D9FFC7", 60: "#C7FFC7",
  61: "#A3FFC7", 62: "#8FFFC7", 63: "#61FFC7", 64: "#45FFC7", 65: "#30FFC7",
  66: "#1FFFC7", 67: "#00FF9C", 68: "#00E675", 69: "#00D452", 70: "#00BF38",
  71: "#00AB24", 72: "#4DC2FF", 73: "#4DA6FF", 74: "#2194D6", 75: "#267DAB",
  76: "#266696", 77: "#175487", 78: "#D0D0E0", 79: "#FFD123", 80: "#B8B8D0",
  81: "#A6544D", 82: "#575961", 83: "#9E4FB5", 84: "#AB5C00", 85: "#754F45",
  86: "#428296", 87: "#420066", 88: "#007D00", 89: "#70ABFA", 90: "#00BAFF",
  91: "#00A1FF", 92: "#008FFF", 93: "#0080FF", 94: "#006BFF", 95: "#545CF2",
  96: "#785CE3", 97: "#8A4FE3", 98: "#A136D4", 99: "#B31FD4", 100: "#B31FBA",
  101: "#B30DA6", 102: "#BD0D87", 103: "#C70066", 104: "#CC0059", 105: "#D1004F",
  106: "#D90045", 107: "#E00038", 108: "#E6002E", 109: "#EB0026",
  110: "#909090", 111: "#909090", 112: "#909090", 113: "#909090", 114: "#909090",
  115: "#909090", 116: "#909090", 117: "#909090", 118: "#909090",
};

/** Deterministic seeded PRNG (Mulberry32) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Retrieve numeric value for any HeatmapProperty on an element */
export function getElementPropertyValue(
  el: Element,
  property: HeatmapProperty
): number | null {
  switch (property) {
    case "atomic_mass":
      return el.atomic_mass;
    case "atomic_radius":
      return getElementExtra(el.number).atomicRadius;
    case "density":
      return el.density;
    case "melt":
      return el.melt;
    case "boil":
      return el.boil;
    case "electronegativity_pauling":
      return el.electronegativity_pauling;
    case "electron_affinity":
      return el.electron_affinity;
    case "first_ionization":
      return el.ionization_energies.length > 0 ? el.ionization_energies[0] : null;
  }
}

/** Compute dataset min/max range for a numeric property */
export function getPropertyRange(
  elements: Element[],
  property: HeatmapProperty
): { min: number; max: number } {
  const values = elements
    .map((el) => getElementPropertyValue(el, property))
    .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));

  if (values.length === 0) return { min: 0, max: 1 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** Normalize value to [0, 1], with optional logarithmic mapping when min > 0 */
export function normalizeValue(
  value: number | null,
  min: number,
  max: number,
  logScale = false
): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  if (max === min) return 0.5;
  if (logScale && min > 0 && value > 0) {
    const lMin = Math.log10(min);
    const lMax = Math.log10(max);
    if (lMax === lMin) return 0.5;
    return Math.max(0, Math.min(1, (Math.log10(value) - lMin) / (lMax - lMin)));
  }
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

interface ColorStop {
  pos: number;
  r: number;
  g: number;
  b: number;
}

const PALETTE_STOPS: Record<HeatmapPalette, ColorStop[]> = {
  viridis: [
    { pos: 0.0, r: 68, g: 1, b: 84 },
    { pos: 0.25, r: 59, g: 82, b: 139 },
    { pos: 0.5, r: 33, g: 145, b: 140 },
    { pos: 0.75, r: 94, g: 201, b: 98 },
    { pos: 1.0, r: 253, g: 231, b: 37 },
  ],
  plasma: [
    { pos: 0.0, r: 13, g: 8, b: 135 },
    { pos: 0.25, r: 126, g: 3, b: 168 },
    { pos: 0.5, r: 204, g: 71, b: 120 },
    { pos: 0.75, r: 248, g: 149, b: 64 },
    { pos: 1.0, r: 240, g: 249, b: 33 },
  ],
  cividis: [
    { pos: 0.0, r: 0, g: 32, b: 77 },
    { pos: 0.25, r: 65, g: 77, b: 107 },
    { pos: 0.5, r: 124, g: 123, b: 120 },
    { pos: 0.75, r: 189, g: 175, b: 111 },
    { pos: 1.0, r: 253, g: 234, b: 69 },
  ],
};

/** Interpolate perceptual RGB color from normalized t in [0, 1] */
export function getHeatmapColor(
  normalizedValue: number,
  palette: HeatmapPalette = "viridis"
): { rgb: string; r: number; g: number; b: number } {
  const stops = PALETTE_STOPS[palette];
  const t = Math.max(0, Math.min(1, normalizedValue));

  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].pos && t <= stops[i + 1].pos) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const range = upper.pos - lower.pos;
  const localT = range === 0 ? 0 : (t - lower.pos) / range;

  const r = Math.round(lower.r + (upper.r - lower.r) * localT);
  const g = Math.round(lower.g + (upper.g - lower.g) * localT);
  const b = Math.round(lower.b + (upper.b - lower.b) * localT);

  return { rgb: `rgb(${r}, ${g}, ${b})`, r, g, b };
}

/** W3C relative luminance contrast ink selector */
export function getContrastTextColor(r: number, g: number, b: number): "#090d16" | "#f8fafc" {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return lum > 0.36 ? "#090d16" : "#f8fafc";
}

/** Convert temperature from Kelvin to target unit */
export function convertTemperature(kelvin: number, unit: TemperatureUnit): number {
  if (unit === "C") return kelvin - 273.15;
  if (unit === "F") return ((kelvin - 273.15) * 9) / 5 + 32;
  return kelvin;
}

/** Format temperature value in chosen unit */
export function formatTemperature(
  kelvin: number | null | undefined,
  unit: TemperatureUnit,
  decimals = 1
): string {
  if (kelvin === null || kelvin === undefined || Number.isNaN(kelvin)) return "—";
  const val = convertTemperature(kelvin, unit);
  const rounded =
    Math.abs(val) >= 100
      ? Math.round(val).toLocaleString()
      : Number(val.toFixed(decimals)).toString();
  return `${rounded} ${unit === "K" ? "K" : `°${unit}`}`;
}

/** Determine physical state of matter at any Kelvin temperature */
export function getPhaseAtTemperature(
  el: Element,
  tempK: number
): "Solid" | "Liquid" | "Gas" | "Unknown" {
  // Helium remains liquid down to 0 K at 1 atm
  if (el.number === 2) {
    return tempK >= (el.boil ?? 4.22) ? "Gas" : "Liquid";
  }
  // Subliming elements (C, As at 1 atm)
  if (el.sublimes && el.boil !== null) {
    return tempK >= el.boil ? "Gas" : "Solid";
  }
  if (el.melt === null && el.boil === null) {
    return "Unknown";
  }
  if (el.boil !== null && tempK >= el.boil) {
    return "Gas";
  }
  if (el.melt !== null && tempK < el.melt) {
    return "Solid";
  }
  if (el.melt !== null && tempK >= el.melt) {
    return "Liquid";
  }
  return "Unknown";
}

export const PHASE_STYLES: Record<
  "Solid" | "Liquid" | "Gas" | "Unknown",
  { label: string; icon: string; hex: string; lightText: string; darkText: string }
> = {
  Solid: {
    label: "Solid",
    icon: "◆",
    hex: "#3b82f6",
    lightText: "#1d4ed8",
    darkText: "#93c5fd",
  },
  Liquid: {
    label: "Liquid",
    icon: "💧",
    hex: "#06b6d4",
    lightText: "#0e7490",
    darkText: "#67e8f9",
  },
  Gas: {
    label: "Gas",
    icon: "☁",
    hex: "#a855f7",
    lightText: "#7e22ce",
    darkText: "#d8b4fe",
  },
  Unknown: {
    label: "Unknown",
    icon: "?",
    hex: "#64748b",
    lightText: "#475569",
    darkText: "#94a3b8",
  },
};

export function getPhaseIcon(phase: string): string {
  switch (phase.toLowerCase()) {
    case "solid":
      return "⬡";
    case "liquid":
      return "◉";
    case "gas":
      return "◎";
    default:
      return "?";
  }
}

/** Format density cleanly, showing g/L equivalent for STP gases */
export function formatDensity(density: number | null, phase: string): string {
  if (density === null || density === undefined || Number.isNaN(density)) return "—";
  if (density < 0.02 || phase.toLowerCase() === "gas") {
    const gPerL = (density * 1000).toFixed(density * 1000 < 0.5 ? 3 : 2);
    return `${density.toPrecision(3)} g/cm³ (${gPerL} g/L)`;
  }
  return `${Number(density.toFixed(3))} g/cm³`;
}

/** Compact density for grid tiles */
export function formatDensityCompact(density: number | null): string {
  if (density === null || density === undefined || Number.isNaN(density)) return "—";
  if (density < 0.01) return `${(density * 1000).toFixed(2)} g/L`;
  if (density < 1) return density.toFixed(3);
  return density.toFixed(2);
}

/** Format numeric property cleanly for tiles & range sliders */
export function formatPropertyCompact(
  val: number | null,
  prop: HeatmapProperty,
  tempUnit: TemperatureUnit
): string {
  if (val === null || val === undefined || Number.isNaN(val)) return "—";
  switch (prop) {
    case "atomic_mass":
      return val >= 100 ? val.toFixed(1) : val.toFixed(2);
    case "atomic_radius":
      return `${Math.round(val)}`;
    case "density":
      return formatDensityCompact(val);
    case "melt":
    case "boil": {
      const converted = convertTemperature(val, tempUnit);
      return `${Math.round(converted)}°`;
    }
    case "electronegativity_pauling":
      return val.toFixed(2);
    case "electron_affinity":
      return `${Math.round(val)}`;
    case "first_ionization":
      return `${Math.round(val)}`;
  }
}

/** Format atomic mass in standard IUPAC notation (brackets for unstable elements) */
export function formatAtomicMass(el: Element): string {
  const extra = getElementExtra(el.number);
  if (extra.radioactive && Number.isInteger(el.atomic_mass)) {
    return `[${el.atomic_mass}]`;
  }
  return Number(el.atomic_mass.toFixed(4)).toString();
}

/** Format discovery year nicely */
export function formatDiscoveryYear(year: number | null): string {
  if (year === null) return "Unknown";
  if (year < 0) return `~${Math.abs(year).toLocaleString()} BCE`;
  return `${year} CE`;
}

/** Discovery eras for timeline coloring */
export const DISCOVERY_ERAS = [
  { id: "ancient", label: "Antiquity (<1600)", maxYear: 1599, hex: "#f59e0b", lightText: "#b45309", darkText: "#fcd34d" },
  { id: "enlightenment", label: "1600–1799", maxYear: 1799, hex: "#10b981", lightText: "#047857", darkText: "#6ee7b7" },
  { id: "electro", label: "1800–1868", maxYear: 1868, hex: "#06b6d4", lightText: "#0e7490", darkText: "#67e8f9" },
  { id: "periodic", label: "1869–1899", maxYear: 1899, hex: "#3b82f6", lightText: "#1d4ed8", darkText: "#93c5fd" },
  { id: "nuclear", label: "1900–1949", maxYear: 1949, hex: "#8b5cf6", lightText: "#6d28d9", darkText: "#c4b5fd" },
  { id: "superheavy", label: "1950–Present", maxYear: 2030, hex: "#ec4899", lightText: "#be185d", darkText: "#f9a8d4" },
] as const;

export function getDiscoveryEra(year: number | null) {
  if (year === null) return DISCOVERY_ERAS[5];
  for (const era of DISCOVERY_ERAS) {
    if (year <= era.maxYear) return era;
  }
  return DISCOVERY_ERAS[5];
}

/** Dan Bruton's visible spectrum (380-780 nm) wavelength to CSS rgb() */
export function wavelengthToRGB(wavelength: number): string {
  let r = 0;
  let g = 0;
  let b = 0;

  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1;
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1;
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0;
    g = 1;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1;
    b = 0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1;
    g = 0;
    b = 0;
  }

  let factor = 0.3;
  if (wavelength >= 380 && wavelength < 420) {
    factor = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380);
  } else if (wavelength >= 420 && wavelength <= 700) {
    factor = 1.0;
  } else if (wavelength > 700 && wavelength <= 780) {
    factor = 0.3 + (0.7 * (780 - wavelength)) / (780 - 700);
  }

  const gamma = 0.8;
  const adj = (c: number) => (c <= 0 ? 0 : Math.round(255 * Math.pow(c * factor, gamma)));
  return `rgb(${adj(r)}, ${adj(g)}, ${adj(b)})`;
}

const SUP_MAP: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

const CORE_FULL_CONFIG: Record<string, string> = {
  He: "1s²",
  Ne: "1s² 2s² 2p⁶",
  Ar: "1s² 2s² 2p⁶ 3s² 3p⁶",
  Kr: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶",
  Xe: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 5s² 5p⁶",
  Rn: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 4f¹⁴ 5s² 5p⁶ 5d¹⁰ 6s² 6p⁶",
};

export interface ParsedSubshell {
  n: number;
  l: "s" | "p" | "d" | "f";
  count: number;
  label: string;
}

/** Parse semantic electron configuration string into noble-gas core + subshells */
export function parseElectronConfiguration(config: string): {
  core: string | null;
  subshells: ParsedSubshell[];
} {
  let rest = config.trim();
  let core: string | null = null;
  const coreMatch = rest.match(/^\[(\w+)\]\s*/);
  if (coreMatch) {
    core = coreMatch[1];
    rest = rest.slice(coreMatch[0].length);
  }

  const subshells: ParsedSubshell[] = [];
  for (const tok of rest.split(/\s+/).filter(Boolean)) {
    const m = tok.match(/^(\d)([spdf])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);
    if (!m) continue;
    const n = Number(m[1]);
    const l = m[2] as "s" | "p" | "d" | "f";
    const count = Number(
      m[3]
        .split("")
        .map((c) => SUP_MAP[c] ?? "")
        .join("")
    );
    subshells.push({ n, l, count, label: `${n}${l}` });
  }
  return { core, subshells };
}

/** Expand noble-gas shorthand into full electron configuration */
export function expandFullConfiguration(el: Element): string {
  const match = el.electron_configuration_semantic.match(/^\[(\w+)\]\s*(.*)$/);
  if (!match) return el.electron_configuration_semantic;
  const coreExpanded = CORE_FULL_CONFIG[match[1]] ?? `[${match[1]}]`;
  return match[2] ? `${coreExpanded} ${match[2]}` : coreExpanded;
}

const ANOMALOUS_CONFIG_Z = new Set([
  24, 29, 41, 42, 44, 45, 46, 47, 57, 58, 64, 78, 79, 89, 90, 91, 92, 93, 96, 103,
]);

/** True if ground-state configuration deviates from naive Madelung Aufbau filling */
export function isAnomalousConfig(atomicNumber: number): boolean {
  return ANOMALOUS_CONFIG_Z.has(atomicNumber);
}

/** Compute true 32-column wide-form periodic table grid coordinates */
export function getWideGridPosition(el: Element): { col: number; row: number } {
  // Lanthanides (ypos 9 -> row 6, cols 3..17)
  if (el.ypos === 9) {
    return { col: el.xpos, row: 6 };
  }
  // Actinides (ypos 10 -> row 7, cols 3..17)
  if (el.ypos === 10) {
    return { col: el.xpos, row: 7 };
  }
  // s-block & Group 3 Sc/Y remain in cols 1..3
  if (el.xpos <= 3) {
    return { col: el.xpos, row: el.ypos };
  }
  // d-block (xpos 4..12) and p-block (xpos 13..18) shift right by 14 columns
  return { col: el.xpos + 14, row: el.ypos };
}
