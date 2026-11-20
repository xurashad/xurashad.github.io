export interface Element {
  name: string;
  atomic_mass: number;
  boil: number | null;
  category: string;
  density: number | null;
  discovered_by: string;
  melt: number | null;
  number: number;
  period: number;
  group: number;
  phase: string;
  summary: string;
  symbol: string;
  xpos: number;
  ypos: number;
  shells: number[];
  electron_configuration_semantic: string;
  electron_affinity: number | null;
  electronegativity_pauling: number | null;
  ionization_energies: number[];
  bohr_model_image?: string;
  /** CPK hex color for 3D atom rendering */
  cpk_hex: string;
  /** Block classification: s, p, d, or f */
  block: "s" | "p" | "d" | "f";
  /** Physical appearance description */
  appearance: string | null;
  /** True when the element sublimes at 1 atm before melting */
  sublimes?: boolean;
  /** Note clarifying phase-change pressure or relativistic predictions */
  thermal_note?: string;
  /** True for superheavy elements whose bulk STP phase is theoretically predicted */
  phase_predicted?: boolean;
}

export type CosmicOrigin =
  | "big-bang"
  | "cosmic-ray"
  | "dying-low-mass"
  | "massive-stars"
  | "neutron-stars"
  | "white-dwarfs"
  | "synthetic";

export interface ElementExtra {
  discoveryYear: number | null;
  atomicRadius: number | null;
  oxidationStates: number[];
  crystalStructure: string;
  radioactive: boolean;
  synthetic: boolean;
  origin: CosmicOrigin;
  uses: string[];
  emissionLines: number[];
}

export type ColorMode =
  | "category"
  | "block"
  | "phase"
  | "origin"
  | "era"
  | "heatmap";

/** Properties available for heatmap & trend visualization */
export type HeatmapProperty =
  | "atomic_mass"
  | "atomic_radius"
  | "density"
  | "melt"
  | "boil"
  | "electronegativity_pauling"
  | "electron_affinity"
  | "first_ionization";

export type HeatmapPalette = "viridis" | "plasma" | "cividis";
export type TemperatureUnit = "K" | "C" | "F";
export type TableLayout = "standard" | "wide";
export type WorkspaceView = "table" | "trends" | "cards";

export const HEATMAP_PROPERTIES: {
  key: HeatmapProperty;
  label: string;
  shortLabel: string;
  unit: string;
  supportsLog?: boolean;
}[] = [
  { key: "atomic_mass", label: "Atomic Mass", shortLabel: "Mass", unit: "u" },
  { key: "atomic_radius", label: "Atomic Radius", shortLabel: "Radius", unit: "pm" },
  { key: "density", label: "Density", shortLabel: "Density", unit: "g/cm³", supportsLog: true },
  { key: "melt", label: "Melting Point", shortLabel: "Melt", unit: "K" },
  { key: "boil", label: "Boiling Point", shortLabel: "Boil", unit: "K" },
  { key: "electronegativity_pauling", label: "Electronegativity", shortLabel: "χ (Pauling)", unit: "" },
  { key: "electron_affinity", label: "Electron Affinity", shortLabel: "EA", unit: "kJ/mol" },
  { key: "first_ionization", label: "1st Ionization Energy", shortLabel: "IE₁", unit: "kJ/mol", supportsLog: true },
];

export type CategoryKey =
  | "alkali metal"
  | "alkaline earth metal"
  | "transition metal"
  | "post-transition metal"
  | "metalloid"
  | "reactive nonmetal"
  | "halogen"
  | "noble gas"
  | "lanthanide"
  | "actinide"
  | "unknown";

export interface CategoryInfo {
  key: CategoryKey;
  name: string;
  shortName: string;
  hex: string;
  lightText: string;
  darkText: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  "alkali metal": {
    key: "alkali metal",
    name: "Alkali Metal",
    shortName: "Alkali",
    hex: "#f43f5e",
    lightText: "#be123c",
    darkText: "#fda4af",
  },
  "alkaline earth metal": {
    key: "alkaline earth metal",
    name: "Alkaline Earth Metal",
    shortName: "Alkaline",
    hex: "#f97316",
    lightText: "#c2410c",
    darkText: "#fdba74",
  },
  "transition metal": {
    key: "transition metal",
    name: "Transition Metal",
    shortName: "Transition",
    hex: "#3b82f6",
    lightText: "#1d4ed8",
    darkText: "#93c5fd",
  },
  "post-transition metal": {
    key: "post-transition metal",
    name: "Post-transition Metal",
    shortName: "Post-Trans.",
    hex: "#0ea5e9",
    lightText: "#0369a1",
    darkText: "#7dd3fc",
  },
  "metalloid": {
    key: "metalloid",
    name: "Metalloid",
    shortName: "Metalloid",
    hex: "#f59e0b",
    lightText: "#b45309",
    darkText: "#fcd34d",
  },
  "reactive nonmetal": {
    key: "reactive nonmetal",
    name: "Reactive Nonmetal",
    shortName: "Nonmetal",
    hex: "#10b981",
    lightText: "#047857",
    darkText: "#6ee7b7",
  },
  "halogen": {
    key: "halogen",
    name: "Halogen",
    shortName: "Halogen",
    hex: "#14b8a6",
    lightText: "#0f766e",
    darkText: "#5eead4",
  },
  "noble gas": {
    key: "noble gas",
    name: "Noble Gas",
    shortName: "Noble Gas",
    hex: "#8b5cf6",
    lightText: "#6d28d9",
    darkText: "#c4b5fd",
  },
  "lanthanide": {
    key: "lanthanide",
    name: "Lanthanide",
    shortName: "Lanthanide",
    hex: "#6366f1",
    lightText: "#4338ca",
    darkText: "#a5b4fc",
  },
  "actinide": {
    key: "actinide",
    name: "Actinide",
    shortName: "Actinide",
    hex: "#ec4899",
    lightText: "#be185d",
    darkText: "#f9a8d4",
  },
  "unknown": {
    key: "unknown",
    name: "Unknown",
    shortName: "Unknown",
    hex: "#64748b",
    lightText: "#334155",
    darkText: "#cbd5e1",
  },
};

/** Resolve any category string (including "unknown, probably..." variants) */
export function getCategoryInfo(cat: string): CategoryInfo {
  const key = cat.toLowerCase().trim() as CategoryKey;
  if (key in CATEGORIES) {
    return CATEGORIES[key];
  }
  return CATEGORIES["unknown"];
}

/** Extract predicted family hint from "unknown, probably X" or "unknown, predicted to be X" */
export function getPredictedCategoryLabel(cat: string): string | null {
  const lower = cat.toLowerCase().trim();
  if (!lower.startsWith("unknown,")) return null;
  return cat
    .replace(/^unknown,\s*(probably|predicted to be)\s*/i, "")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export const BLOCK_INFO: Record<
  "s" | "p" | "d" | "f",
  { label: string; hex: string; lightText: string; darkText: string; description: string }
> = {
  s: {
    label: "s-block",
    hex: "#f43f5e",
    lightText: "#be123c",
    darkText: "#fda4af",
    description: "Valence electrons fill spherical s orbitals (Groups 1–2 + Helium).",
  },
  p: {
    label: "p-block",
    hex: "#10b981",
    lightText: "#047857",
    darkText: "#6ee7b7",
    description: "Valence electrons fill dumbbell p orbitals (Groups 13–18).",
  },
  d: {
    label: "d-block",
    hex: "#3b82f6",
    lightText: "#1d4ed8",
    darkText: "#93c5fd",
    description: "Transition metals with partially or newly filled d subshells (Groups 3–12).",
  },
  f: {
    label: "f-block",
    hex: "#a855f7",
    lightText: "#7e22ce",
    darkText: "#d8b4fe",
    description: "Inner transition lanthanides and actinides filling 4f and 5f subshells.",
  },
};

export const ORIGIN_INFO: Record<
  CosmicOrigin,
  { label: string; shortLabel: string; hex: string; lightText: string; darkText: string; description: string }
> = {
  "big-bang": {
    label: "Big Bang Fusion",
    shortLabel: "Big Bang",
    hex: "#38bdf8",
    lightText: "#0369a1",
    darkText: "#7dd3fc",
    description: "Synthesized in the first ~20 minutes after the Big Bang via primordial nucleosynthesis.",
  },
  "cosmic-ray": {
    label: "Cosmic Ray Fission",
    shortLabel: "Cosmic Rays",
    hex: "#22d3ee",
    lightText: "#0e7490",
    darkText: "#67e8f9",
    description: "Forged when energetic cosmic rays spallate heavier interstellar nuclei like C, N, and O.",
  },
  "dying-low-mass": {
    label: "Dying Low-Mass Stars",
    shortLabel: "AGB Stars",
    hex: "#fbbf24",
    lightText: "#b45309",
    darkText: "#fde68a",
    description: "Built via slow neutron capture (s-process) and helium burning in asymptotic giant branch stars.",
  },
  "massive-stars": {
    label: "Exploding Massive Stars",
    shortLabel: "Supernovae",
    hex: "#f97316",
    lightText: "#c2410c",
    darkText: "#fdba74",
    description: "Created during advanced stellar fusion and core-collapse supernovae of massive stars.",
  },
  "white-dwarfs": {
    label: "Exploding White Dwarfs",
    shortLabel: "Type Ia SNe",
    hex: "#f43f5e",
    lightText: "#be123c",
    darkText: "#fda4af",
    description: "Iron-peak elements primarily forged in thermonuclear Type Ia white dwarf supernovae.",
  },
  "neutron-stars": {
    label: "Merging Neutron Stars",
    shortLabel: "Kilonovae",
    hex: "#a855f7",
    lightText: "#7e22ce",
    darkText: "#d8b4fe",
    description: "Heavy r-process elements synthesized during cataclysmic neutron star mergers.",
  },
  "synthetic": {
    label: "Human Synthesis",
    shortLabel: "Synthetic",
    hex: "#64748b",
    lightText: "#334155",
    darkText: "#cbd5e1",
    description: "No primordial stable isotopes on Earth; produced artificially in nuclear reactors or particle accelerators.",
  },
};
