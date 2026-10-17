import { ParticleType, type PaletteItem } from "./types";

export const SNAP_RADIUS = 24;
export const VERTEX_RADIUS = 7;
export const HANDLE_RADIUS = 6;
export const GRID_SPACING = 20;
export const ARROW_SIZE = 9;
export const BEND_SNAP_VALUE = 5;
export const DEFAULT_ELLIPSE_RADIUS = 40;
export const DEFAULT_RECT_WIDTH = 120;
export const DEFAULT_RECT_HEIGHT = 80;
export const CANVAS_W = 1000;
export const CANVAS_H = 650;

/** Colour per particle type (SVG stroke/fill) */
export const PARTICLE_COLOR: Record<ParticleType, string> = {
  [ParticleType.Fermion]: "#60a5fa", // electric blue
  [ParticleType.Photon]:  "#34d399", // emerald wave
  [ParticleType.Gluon]:   "#f472b6", // spring coil pink
  [ParticleType.Higgs]:   "#fbbf24", // dashed golden amber
  [ParticleType.Ghost]:   "#a78bfa", // violet dotted
  [ParticleType.Scalar]:  "#94a3b8", // slate solid line
  [ParticleType.WBoson]:  "#fb923c", // orange weak boson
  [ParticleType.ZBoson]:  "#4ade80", // lime neutral weak boson
};

export const PALETTE_ITEMS: PaletteItem[] = [
  // Structure & Annotations
  {
    type: "vertex",
    label: "Vertex",
    group: "Structure",
    desc: "Interaction point connecting 3 or more particles",
  },
  {
    type: "text",
    label: "Text Label",
    group: "Structure",
    desc: "Diagram title, momentum arrow p, or state annotation",
  },
  {
    type: "ellipse",
    label: "Blob / Ellipse",
    group: "Structure",
    desc: "Non-perturbative blob, hadron, or effective vertex",
  },
  {
    type: "rectangle",
    label: "Boundary / Box",
    group: "Structure",
    desc: "Asymptotic state grouping or region boundary",
  },

  // Particles & Propagators
  {
    type: ParticleType.Fermion,
    label: "Fermion",
    symbol: "e⁻, q, μ⁻",
    group: "Particles & Propagators",
    desc: "Solid line with directional arrow (matter/antimatter)",
  },
  {
    type: ParticleType.Photon,
    label: "Photon (γ)",
    symbol: "γ",
    group: "Particles & Propagators",
    desc: "Sinusoidal wavy line (electromagnetic interaction)",
  },
  {
    type: ParticleType.Gluon,
    label: "Gluon (g)",
    symbol: "g",
    group: "Particles & Propagators",
    desc: "Curled coiled spring line (strong force QCD)",
  },
  {
    type: ParticleType.WBoson,
    label: "W Boson (W±)",
    symbol: "W±",
    group: "Particles & Propagators",
    desc: "Thick undulating wave (charged weak current)",
  },
  {
    type: ParticleType.ZBoson,
    label: "Z Boson (Z⁰)",
    symbol: "Z⁰",
    group: "Particles & Propagators",
    desc: "Thick undulating wave (neutral weak current)",
  },
  {
    type: ParticleType.Higgs,
    label: "Higgs (H⁰)",
    symbol: "H",
    group: "Particles & Propagators",
    desc: "Dashed line (scalar field / electroweak symmetry breaking)",
  },
  {
    type: ParticleType.Ghost,
    label: "Faddeev-Popov Ghost",
    symbol: "c",
    group: "Particles & Propagators",
    desc: "Dotted line (gauge-fixing ghost in non-abelian theories)",
  },
  {
    type: ParticleType.Scalar,
    label: "Scalar (Generic)",
    symbol: "φ",
    group: "Particles & Propagators",
    desc: "Plain unoriented line (meson or generic spin-0 field)",
  },
];

export const QUICK_SYMBOLS = [
  "e⁻",
  "e⁺",
  "μ⁻",
  "μ⁺",
  "τ⁻",
  "νₑ",
  "ν̄ₑ",
  "q",
  "q̄",
  "u",
  "d",
  "s",
  "c",
  "b",
  "t",
  "γ",
  "g",
  "W⁺",
  "W⁻",
  "Z⁰",
  "H⁰",
  "p",
  "n",
  "π⁺",
  "π⁻",
  "π⁰",
];
