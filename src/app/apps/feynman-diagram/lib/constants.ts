import { ParticleType, type PaletteItem } from "./types";

export const SNAP_RADIUS       = 14;
export const VERTEX_RADIUS     = 7;
export const HANDLE_RADIUS     = 6;
export const GRID_SPACING      = 20;
export const ARROW_SIZE        = 9;
export const BEND_SNAP_VALUE   = 10;
export const DEFAULT_ELLIPSE_RADIUS = 40;
export const DEFAULT_RECT_WIDTH     = 120;
export const DEFAULT_RECT_HEIGHT    = 80;
export const CANVAS_W = 3000;
export const CANVAS_H = 2000;

/** Colour per particle type (SVG stroke/fill) */
export const PARTICLE_COLOR: Record<ParticleType, string> = {
  [ParticleType.Fermion]: "#60a5fa",  // blue
  [ParticleType.Photon]:  "#34d399",  // emerald
  [ParticleType.Gluon]:   "#f472b6",  // pink
  [ParticleType.Higgs]:   "#fbbf24",  // amber
  [ParticleType.Ghost]:   "#a78bfa",  // violet
  [ParticleType.Scalar]:  "#94a3b8",  // slate
  [ParticleType.WBoson]:  "#fb923c",  // orange
  [ParticleType.ZBoson]:  "#4ade80",  // green
};

export const PALETTE_ITEMS: PaletteItem[] = [
  // Structure
  { type: "vertex",             label: "Vertex",      group: "Structure" },
  { type: "ellipse",            label: "Ellipse",     group: "Structure" },
  { type: "rectangle",          label: "Rectangle",   group: "Structure" },
  { type: "text",               label: "Text Label",  group: "Structure" },
  // Particles
  { type: ParticleType.Fermion, label: "Fermion",     group: "Bosons & Fermions" },
  { type: ParticleType.Photon,  label: "Photon (γ)",  group: "Bosons & Fermions" },
  { type: ParticleType.Gluon,   label: "Gluon (g)",   group: "Bosons & Fermions" },
  { type: ParticleType.WBoson,  label: "W Boson",     group: "Bosons & Fermions" },
  { type: ParticleType.ZBoson,  label: "Z Boson",     group: "Bosons & Fermions" },
  { type: ParticleType.Higgs,   label: "Higgs (H)",   group: "Bosons & Fermions" },
  { type: ParticleType.Ghost,   label: "Ghost",       group: "Bosons & Fermions" },
  { type: ParticleType.Scalar,  label: "Scalar",      group: "Bosons & Fermions" },
];
