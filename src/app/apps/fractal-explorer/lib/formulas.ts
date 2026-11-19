import type { CameraState, ColoringMode, FractalFamily, InteriorMode, TransferScale } from "./types";

export interface FormulaMeta {
  id: FractalFamily;
  index: number;
  name: string;
  shortName: string;
  badge: string;
  latexParameter: string;
  latexJulia: string;
  description: string;
  physicsNote?: string;
  supportsJulia: boolean;
  supportsPower: boolean;
  powerLabel: string;
  powerMin: number;
  powerMax: number;
  powerStep: number;
  defaultPower: number;
  supportsParamP: boolean;
  paramPLabel: string;
  paramPMin: number;
  paramPMax: number;
  paramPStep: number;
  defaultParamP: number;
  defaultCamera: CameraState;
  defaultJuliaC: [number, number];
  defaultBailout: number;
  supportsDS64: boolean;
  isConvergent: boolean;
}

export const FORMULA_ORDER: FractalFamily[] = [
  "mandelbrot",
  "burning-ship",
  "tricorn",
  "celtic",
  "buffalo",
  "phoenix",
  "newton",
  "nova",
  "magnet1",
  "lambda",
];

export const FRACTAL_FORMULAS: Record<FractalFamily, FormulaMeta> = {
  mandelbrot: {
    id: "mandelbrot",
    index: 0,
    name: "Mandelbrot / Multibrot",
    shortName: "Mandelbrot",
    badge: "Holomorphic",
    latexParameter: "z_{n+1} = z_n^{d} + c, \\quad z_0 = 0",
    latexJulia: "z_{n+1} = z_n^{d} + c_{\\text{J}}, \\quad z_0 = z",
    description:
      "The canonical connectedness locus of quadratic and higher-degree complex polynomials.",
    supportsJulia: true,
    supportsPower: true,
    powerLabel: "Exponent d",
    powerMin: 1.5,
    powerMax: 8,
    powerStep: 0.05,
    defaultPower: 2,
    supportsParamP: false,
    paramPLabel: "Param p",
    paramPMin: -2,
    paramPMax: 2,
    paramPStep: 0.01,
    defaultParamP: 0,
    defaultCamera: { centerX: -0.5, centerY: 0, zoom: 1.15, rotation: 0 },
    defaultJuliaC: [-0.8, 0.156],
    defaultBailout: 256,
    supportsDS64: true,
    isConvergent: false,
  },
  "burning-ship": {
    id: "burning-ship",
    index: 1,
    name: "Burning Ship",
    shortName: "Burning Ship",
    badge: "Non-Analytic",
    latexParameter: "z_{n+1} = \\big(|\\operatorname{Re} z_n| - i\\,|\\operatorname{Im} z_n|\\big)^{d} + c",
    latexJulia: "z_{n+1} = \\big(|\\operatorname{Re} z_n| - i\\,|\\operatorname{Im} z_n|\\big)^{d} + c_{\\text{J}}",
    description:
      "Abs-folding the real and imaginary components creates cathedral spires and an iconic burning vessel.",
    supportsJulia: true,
    supportsPower: true,
    powerLabel: "Exponent d",
    powerMin: 1.5,
    powerMax: 6,
    powerStep: 0.05,
    defaultPower: 2,
    supportsParamP: false,
    paramPLabel: "Param p",
    paramPMin: -2,
    paramPMax: 2,
    paramPStep: 0.01,
    defaultParamP: 0,
    defaultCamera: { centerX: -0.45, centerY: 0.5, zoom: 0.9, rotation: 0 },
    defaultJuliaC: [-0.55, 0.6],
    defaultBailout: 256,
    supportsDS64: true,
    isConvergent: false,
  },
  tricorn: {
    id: "tricorn",
    index: 2,
    name: "Tricorn (Mandelbar)",
    shortName: "Tricorn",
    badge: "Anti-Holomorphic",
    latexParameter: "z_{n+1} = \\bar{z}_n^{\\,d} + c, \\quad z_0 = 0",
    latexJulia: "z_{n+1} = \\bar{z}_n^{\\,d} + c_{\\text{J}}, \\quad z_0 = z",
    description:
      "Complex conjugation before squaring breaks local path-connectedness and produces three-cornered horns.",
    supportsJulia: true,
    supportsPower: true,
    powerLabel: "Exponent d",
    powerMin: 1.5,
    powerMax: 8,
    powerStep: 0.05,
    defaultPower: 2,
    supportsParamP: false,
    paramPLabel: "Param p",
    paramPMin: -2,
    paramPMax: 2,
    paramPStep: 0.01,
    defaultParamP: 0,
    defaultCamera: { centerX: -0.3, centerY: 0, zoom: 0.85, rotation: 0 },
    defaultJuliaC: [-0.35, 0.55],
    defaultBailout: 256,
    supportsDS64: true,
    isConvergent: false,
  },
  celtic: {
    id: "celtic",
    index: 3,
    name: "Celtic Fractal",
    shortName: "Celtic",
    badge: "Hybrid Abs",
    latexParameter: "z_{n+1} = |\\operatorname{Re}(z_n^d)| + i\\operatorname{Im}(z_n^d) + c",
    latexJulia: "z_{n+1} = |\\operatorname{Re}(z_n^d)| + i\\operatorname{Im}(z_n^d) + c_{\\text{J}}",
    description:
      "Folding only the real part after powering yields symmetric knotwork and stained-glass arches.",
    supportsJulia: true,
    supportsPower: true,
    powerLabel: "Exponent d",
    powerMin: 1.5,
    powerMax: 6,
    powerStep: 0.05,
    defaultPower: 2,
    supportsParamP: false,
    paramPLabel: "Param p",
    paramPMin: -2,
    paramPMax: 2,
    paramPStep: 0.01,
    defaultParamP: 0,
    defaultCamera: { centerX: -0.45, centerY: 0, zoom: 0.95, rotation: 0 },
    defaultJuliaC: [-0.62, 0.44],
    defaultBailout: 256,
    supportsDS64: true,
    isConvergent: false,
  },
  buffalo: {
    id: "buffalo",
    index: 4,
    name: "Buffalo Fractal",
    shortName: "Buffalo",
    badge: "Dual Abs",
    latexParameter: "z_{n+1} = |\\operatorname{Re}(z_n^d)| - i|\\operatorname{Im}(z_n^d)| + c",
    latexJulia: "z_{n+1} = |\\operatorname{Re}(z_n^d)| - i|\\operatorname{Im}(z_n^d)| + c_{\\text{J}}",
    description:
      "Taking absolute values of both components of the squared iterate forms horned, flame-swept filaments.",
    supportsJulia: true,
    supportsPower: true,
    powerLabel: "Exponent d",
    powerMin: 1.5,
    powerMax: 6,
    powerStep: 0.05,
    defaultPower: 2,
    supportsParamP: false,
    paramPLabel: "Param p",
    paramPMin: -2,
    paramPMax: 2,
    paramPStep: 0.01,
    defaultParamP: 0,
    defaultCamera: { centerX: -0.35, centerY: 0.35, zoom: 0.95, rotation: 0 },
    defaultJuliaC: [-0.4, 0.55],
    defaultBailout: 256,
    supportsDS64: true,
    isConvergent: false,
  },
  phoenix: {
    id: "phoenix",
    index: 5,
    name: "Phoenix Memory",
    shortName: "Phoenix",
    badge: "2-Step Memory",
    latexParameter: "z_{n+1} = z_n^d + c + p\\,z_{n-1}, \\quad z_0 = z_{-1} = 0",
    latexJulia: "z_{n+1} = z_n^d + c_{\\text{J}} + p\\,z_{n-1}, \\quad z_0 = z",
    description:
      "Introduces a second-order feedback term p·zₙ₋₁, creating feather-like symmetries and bi-lobed wings.",
    supportsJulia: true,
    supportsPower: true,
    powerLabel: "Exponent d",
    powerMin: 1.5,
    powerMax: 5,
    powerStep: 0.05,
    defaultPower: 2,
    supportsParamP: true,
    paramPLabel: "Memory p",
    paramPMin: -1.5,
    paramPMax: 1.5,
    paramPStep: 0.01,
    defaultParamP: -0.5,
    defaultCamera: { centerX: 0, centerY: 0, zoom: 0.9, rotation: 0 },
    defaultJuliaC: [0.56667, 0],
    defaultBailout: 256,
    supportsDS64: true,
    isConvergent: false,
  },
  newton: {
    id: "newton",
    index: 6,
    name: "Newton Basins",
    shortName: "Newton",
    badge: "Root Finder",
    latexParameter: "z_{n+1} = z_n - a\\,\\frac{z_n^k - 1}{k\\,z_n^{k-1}}, \\quad z_0 = z",
    latexJulia: "z_{n+1} = z_n - a\\,\\frac{z_n^k - 1}{k\\,z_n^{k-1}}, \\quad z_0 = z",
    description:
      "Basins of attraction for Newton-Raphson root finding on zᵏ − 1 = 0, colored by convergence speed & root phase.",
    supportsJulia: false,
    supportsPower: true,
    powerLabel: "Degree k",
    powerMin: 2,
    powerMax: 8,
    powerStep: 1,
    defaultPower: 3,
    supportsParamP: true,
    paramPLabel: "Relaxation a",
    paramPMin: 0.25,
    paramPMax: 1.9,
    paramPStep: 0.02,
    defaultParamP: 1.0,
    defaultCamera: { centerX: 0, centerY: 0, zoom: 0.85, rotation: 0 },
    defaultJuliaC: [0, 0],
    defaultBailout: 256,
    supportsDS64: false,
    isConvergent: true,
  },
  nova: {
    id: "nova",
    index: 7,
    name: "Nova Starburst",
    shortName: "Nova",
    badge: "Relaxed Newton",
    latexParameter: "z_{n+1} = z_n - a\\,\\frac{z_n^k - 1}{k\\,z_n^{k-1}} + c, \\quad z_0 = 1",
    latexJulia: "z_{n+1} = z_n - a\\,\\frac{z_n^k - 1}{k\\,z_n^{k-1}} + c_{\\text{J}}, \\quad z_0 = z",
    description:
      "Coupling a complex shift c into relaxed Newton iteration creates Mandelbrot-like halos inside root basins.",
    supportsJulia: true,
    supportsPower: true,
    powerLabel: "Degree k",
    powerMin: 2,
    powerMax: 8,
    powerStep: 1,
    defaultPower: 3,
    supportsParamP: true,
    paramPLabel: "Relaxation a",
    paramPMin: 0.3,
    paramPMax: 1.8,
    paramPStep: 0.02,
    defaultParamP: 1.0,
    defaultCamera: { centerX: -0.2, centerY: 0, zoom: 0.8, rotation: 0 },
    defaultJuliaC: [0.35, 0.2],
    defaultBailout: 256,
    supportsDS64: false,
    isConvergent: true,
  },
  magnet1: {
    id: "magnet1",
    index: 8,
    name: "Magnet Type I",
    shortName: "Magnet I",
    badge: "Stat-Mech RG",
    latexParameter: "z_{n+1} = \\left(\\frac{z_n^2 + c - 1}{2z_n + c - 2}\\right)^2, \\quad z_0 = 0",
    latexJulia: "z_{n+1} = \\left(\\frac{z_n^2 + c_{\\text{J}} - 1}{2z_n + c_{\\text{J}} - 2}\\right)^2, \\quad z_0 = z",
    description:
      "Renormalization group map for the 2D Ising model on a hierarchical diamond lattice.",
    physicsNote:
      "Fixed points z = 1 (ferromagnetic) and z = ∞ (paramagnetic) separate phases; the Julia set traces complex Yang–Lee partition-function zeros.",
    supportsJulia: true,
    supportsPower: false,
    powerLabel: "Exponent d",
    powerMin: 2,
    powerMax: 2,
    powerStep: 1,
    defaultPower: 2,
    supportsParamP: false,
    paramPLabel: "Param p",
    paramPMin: -1,
    paramPMax: 1,
    paramPStep: 0.01,
    defaultParamP: 0,
    defaultCamera: { centerX: 0.8, centerY: 0, zoom: 0.65, rotation: 0 },
    defaultJuliaC: [1.05, 0.4],
    defaultBailout: 256,
    supportsDS64: false,
    isConvergent: false,
  },
  lambda: {
    id: "lambda",
    index: 9,
    name: "Complex Logistic (λ)",
    shortName: "Logistic λ",
    badge: "Chaos Map",
    latexParameter: "z_{n+1} = c\\,z_n(1 - z_n), \\quad z_0 = \\tfrac{1}{2}",
    latexJulia: "z_{n+1} = c_{\\text{J}}\\,z_n(1 - z_n), \\quad z_0 = z",
    description:
      "Analytic continuation of the classical Feigenbaum logistic population map to the complex plane.",
    physicsNote:
      "Encodes period-doubling cascades along the real axis surrounded by symmetric twin Mandelbrot bulbs.",
    supportsJulia: true,
    supportsPower: false,
    powerLabel: "Exponent d",
    powerMin: 2,
    powerMax: 2,
    powerStep: 1,
    defaultPower: 2,
    supportsParamP: false,
    paramPLabel: "Param p",
    paramPMin: -1,
    paramPMax: 1,
    paramPStep: 0.01,
    defaultParamP: 0,
    defaultCamera: { centerX: 1.0, centerY: 0, zoom: 0.55, rotation: 0 },
    defaultJuliaC: [0.85, 0.6],
    defaultBailout: 256,
    supportsDS64: true,
    isConvergent: false,
  },
};

export function formulaIdToIndex(family: FractalFamily): number {
  return FRACTAL_FORMULAS[family].index;
}

export const COLORING_MODE_ORDER: {
  id: ColoringMode;
  index: number;
  label: string;
  desc: string;
}[] = [
  { id: "smooth", index: 0, label: "Smooth Escape", desc: "Renormalized continuous iteration" },
  { id: "distance", index: 1, label: "Distance Est.", desc: "Analytical boundary filaments" },
  { id: "trap-cross", index: 2, label: "Trap · Cross", desc: "Min distance to Re/Im axes" },
  { id: "trap-ring", index: 3, label: "Trap · Ring", desc: "Min distance to circle trap" },
  { id: "trap-point", index: 4, label: "Trap · Point", desc: "Min distance to focal point" },
  { id: "stripe", index: 5, label: "Stripe Avg.", desc: "Angular trigonometric harmonics" },
  { id: "decomp", index: 6, label: "Domain Decomp.", desc: "Binary phase & external rays" },
  { id: "orbit-avg", index: 7, label: "Curvature Avg.", desc: "Orbit turning angle resonance" },
];

export function coloringModeToIndex(mode: ColoringMode): number {
  return COLORING_MODE_ORDER.find(m => m.id === mode)?.index ?? 0;
}

export const INTERIOR_MODE_ORDER: { id: InteriorMode; index: number; label: string }[] = [
  { id: "solid", index: 0, label: "Solid" },
  { id: "magnitude", index: 1, label: "Final |z|" },
  { id: "trap", index: 2, label: "Orbit Trap" },
  { id: "min-orbit", index: 3, label: "Min |z|" },
];

export function interiorModeToIndex(mode: InteriorMode): number {
  return INTERIOR_MODE_ORDER.find(m => m.id === mode)?.index ?? 0;
}

export function transferScaleToIndex(scale: TransferScale): number {
  return scale === "log" ? 1 : scale === "sqrt" ? 2 : 0;
}
