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
  bohr_model_image: string;
}

export type CategoryKey =
  | "diatomic nonmetal"
  | "noble gas"
  | "alkali metal"
  | "alkaline earth metal"
  | "metalloid"
  | "polyatomic nonmetal"
  | "post-transition metal"
  | "transition metal"
  | "lanthanide"
  | "actinide"
  | "unknown";

export interface CategoryInfo {
  name: string;
  /** Tailwind bg class */
  bg: string;
  /** Tailwind text class for contrast */
  text: string;
  /** Hex colour for glow / accents */
  hex: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  "diatomic nonmetal":     { name: "Diatomic Nonmetal",     bg: "bg-emerald-500",  text: "text-emerald-950", hex: "#10b981" },
  "noble gas":             { name: "Noble Gas",             bg: "bg-violet-500",   text: "text-violet-950",  hex: "#8b5cf6" },
  "alkali metal":          { name: "Alkali Metal",          bg: "bg-rose-500",     text: "text-rose-950",    hex: "#f43f5e" },
  "alkaline earth metal":  { name: "Alkaline Earth Metal",  bg: "bg-orange-500",   text: "text-orange-950",  hex: "#f97316" },
  "metalloid":             { name: "Metalloid",             bg: "bg-amber-400",    text: "text-amber-950",   hex: "#f59e0b" },
  "polyatomic nonmetal":   { name: "Polyatomic Nonmetal",   bg: "bg-lime-400",     text: "text-lime-950",    hex: "#84cc16" },
  "post-transition metal": { name: "Post-transition Metal", bg: "bg-sky-400",      text: "text-sky-950",     hex: "#38bdf8" },
  "transition metal":      { name: "Transition Metal",      bg: "bg-blue-500",     text: "text-blue-950",    hex: "#3b82f6" },
  "lanthanide":            { name: "Lanthanide",            bg: "bg-indigo-400",   text: "text-indigo-950",  hex: "#818cf8" },
  "actinide":              { name: "Actinide",              bg: "bg-pink-500",     text: "text-pink-950",    hex: "#ec4899" },
  "unknown":               { name: "Unknown",               bg: "bg-slate-500",    text: "text-slate-950",   hex: "#64748b" },
};

/** Resolve any category string (including "unknown, probably…" variants) */
export function getCategoryInfo(cat: string): CategoryInfo {
  const key = cat.toLowerCase();
  return CATEGORIES[key] ?? CATEGORIES["unknown"];
}
