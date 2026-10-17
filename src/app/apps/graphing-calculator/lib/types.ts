/**
 * Types and utilities for the Desmos-like Graphing Calculator.
 */

export interface ViewBox {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export type EquationType = "explicit" | "implicit" | "vertical" | "point" | "inequality" | "slider";

export interface SliderData {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
  isPlaying?: boolean;
}

export interface PointData {
  x: number;
  y: number;
  label?: string;
}

export interface Equation {
  id: number;
  text: string;
  color: string;
  visible: boolean;
  type: EquationType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: ((...args: any[]) => number) | null;
  error: string | null;
  inequalityOp?: "<" | "<=" | ">" | ">=";
  xVal?: number; // for vertical line x = c
  point?: PointData; // for (x, y)
  slider?: SliderData; // for a = 2
}

export interface KeyPoint {
  x: number;
  y: number;
  type: "root" | "intercept" | "min" | "max" | "point";
  label: string;
  equationId: number;
  color: string;
}

export const INITIAL_VIEWBOX: ViewBox = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

export const COLORS: string[] = [
  "#38bdf8", // Sky blue / Quantum
  "#ec4899", // Vivid pink / Rose
  "#22c55e", // Emerald green
  "#f59e0b", // Amber orange
  "#a855f7", // Nebula purple
  "#ef4444", // Crimson red
  "#06b6d4", // Cyan
  "#eab308", // Golden yellow
  "#6366f1", // Aurora indigo
  "#14b8a6", // Teal
];

export interface PresetCategory {
  category: string;
  items: { name: string; equation: string; desc?: string }[];
}

export const PRESET_CATEGORIES: PresetCategory[] = [
  {
    category: "Popular & Basics",
    items: [
      { name: "Sine Wave", equation: "sin(x)" },
      { name: "Parabola", equation: "x^2 - 4" },
      { name: "Cubic", equation: "x^3 - 3x" },
      { name: "Circle", equation: "x^2 + y^2 = 25" },
      { name: "Hyperbola", equation: "1/x" },
      { name: "Absolute Value", equation: "abs(x)" },
    ],
  },
  {
    category: "Trigonometry",
    items: [
      { name: "Cosine", equation: "cos(x)" },
      { name: "Tangent", equation: "tan(x)" },
      { name: "Damped Wave", equation: "e^(-0.2x) * sin(3x)" },
      { name: "Sinc Function", equation: "sin(x) / x" },
      { name: "Interference Grid", equation: "sin(x) * cos(y) = 0.5" },
    ],
  },
  {
    category: "Conics & Implicit",
    items: [
      { name: "Ellipse", equation: "x^2/16 + y^2/9 = 1" },
      { name: "Hyperbola", equation: "x^2 - y^2 = 4" },
      { name: "Folium of Descartes", equation: "x^3 + y^3 - 3*x*y = 0" },
      { name: "Circle Region", equation: "x^2 + y^2 <= 16" },
    ],
  },
  {
    category: "Curves & Art",
    items: [
      { name: "Heart Curve", equation: "(x^2 + y^2 - 1)^3 - x^2 * y^3 = 0" },
      { name: "Gaussian Bell", equation: "e^(-x^2)" },
      { name: "Ripple", equation: "sin(x^2 + y^2) = 0.5" },
      { name: "Inequality Wave", equation: "y <= sin(x)" },
      { name: "Point Target", equation: "(3, 4)" },
    ],
  },
];

/**
 * Preprocess user math string to valid JavaScript expression.
 * Handles implicit multiplication, powers, unicode symbols, functions, and constants.
 */
export function preprocessMath(raw: string): string {
  let s = raw.trim();

  // Unicode math symbols
  s = s.replace(/π/g, "pi")
       .replace(/×/g, "*")
       .replace(/÷/g, "/")
       .replace(/−/g, "-")
       .replace(/≤/g, "<=")
       .replace(/≥/g, ">=");

  // Power operator ^ to JS **
  s = s.replace(/\^/g, "**");

  // Implicit multiplication:
  // 1. Number followed by letter or '(': 2x -> 2*x, 3.5( -> 3.5*(, 2sin -> 2*sin, 2pi -> 2*pi
  s = s.replace(/(\d+(\.\d+)?)\s*([a-zA-Z(])/g, "$1*$3");

  // 2. ')' followed by number, letter or '(': (x+1)(x-1) -> (x+1)*(x-1), (x+1)x -> (x+1)*x
  s = s.replace(/\)\s*([a-zA-Z0-9(])/g, ")*$1");

  // 3. Variable 'x' or 'y' followed by '(' or another variable or function name
  s = s.replace(/\b([xy])\s*\(/g, "$1*(");
  s = s.replace(/\b([xy])\s+([xy]|[a-zA-Z]+\()/g, "$1*$2");

  // 4. Power with x followed by variable: x**2 x -> x**2 * x
  s = s.replace(/(\*\*\d+)\s*([a-zA-Z(])/g, "$1*$2");

  // Math functions
  const fnMap: Record<string, string> = {
    arcsin: "Math.asin",
    arccos: "Math.acos",
    arctan: "Math.atan",
    asin: "Math.asin",
    acos: "Math.acos",
    atan: "Math.atan",
    sinh: "Math.sinh",
    cosh: "Math.cosh",
    tanh: "Math.tanh",
    sin: "Math.sin",
    cos: "Math.cos",
    tan: "Math.tan",
    sqrt: "Math.sqrt",
    cbrt: "Math.cbrt",
    abs: "Math.abs",
    exp: "Math.exp",
    floor: "Math.floor",
    ceil: "Math.ceil",
    round: "Math.round",
    sign: "Math.sign",
    max: "Math.max",
    min: "Math.min",
    log10: "Math.log10",
    log2: "Math.log2",
    log: "Math.log10",
    ln: "Math.log",
  };

  // Sort keys by descending length so arcsin is replaced before sin, log10 before log
  const fnKeys = Object.keys(fnMap).sort((a, b) => b.length - a.length);
  for (const fn of fnKeys) {
    const reg = new RegExp(`(?<!Math\\.)\\b${fn}\\b`, "g");
    s = s.replace(reg, fnMap[fn]);
  }

  // Reciprocals helper syntax: sec(x) -> (1/Math.cos(x)), cot(x) -> (1/Math.tan(x)), csc(x) -> (1/Math.sin(x))
  s = s.replace(/\bsec\(([^)]+)\)/g, "(1/Math.cos($1))");
  s = s.replace(/\bcsc\(([^)]+)\)/g, "(1/Math.sin($1))");
  s = s.replace(/\bcot\(([^)]+)\)/g, "(1/Math.tan($1))");

  // Constants
  s = s.replace(/(?<!Math\.)\bpi\b/gi, "Math.PI");
  s = s.replace(/(?<![a-zA-Z0-9_.])e(?![a-zA-Z0-9_])/g, "Math.E");

  return s;
}

/**
 * Build slider scope string to inject into dynamic function.
 */
function buildSliderHeader(sliders?: Record<string, number>): string {
  if (!sliders || Object.keys(sliders).length === 0) return "";
  const assignments = Object.entries(sliders)
    .map(([k, v]) => `const ${k} = ${Number.isFinite(v) ? v : 0};`)
    .join(" ");
  return assignments + " ";
}

/**
 * Parse an equation string into executable form with type detection.
 */
export function parseEquation(
  text: string,
  sliders?: Record<string, number>,
): Pick<Equation, "fn" | "error" | "type" | "inequalityOp" | "xVal" | "point" | "slider"> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { fn: null, error: null, type: "explicit" };
  }

  // 1. Check for Point: e.g. (2, 3) or ( -1.5 , 4 )
  const pointMatch = trimmed.match(/^\(\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*\)$/);
  if (pointMatch) {
    const px = parseFloat(pointMatch[1]);
    const py = parseFloat(pointMatch[3]);
    return {
      fn: null,
      error: null,
      type: "point",
      point: { x: px, y: py, label: `(${px}, ${py})` },
    };
  }

  // 2. Check for Slider assignment: e.g. a = 2, m = -1.5, k = 5
  const sliderMatch = trimmed.match(/^([a-zA-Z])\s*=\s*(-?\d+(\.\d+)?)$/);
  if (sliderMatch && sliderMatch[1] !== "x" && sliderMatch[1] !== "y") {
    const name = sliderMatch[1];
    const val = parseFloat(sliderMatch[2]);
    return {
      fn: null,
      error: null,
      type: "slider",
      slider: {
        name,
        value: val,
        min: -10,
        max: 10,
        step: 0.1,
      },
    };
  }

  // 3. Check for Vertical Line: x = 3 or x = -2.5
  const vertMatch = trimmed.match(/^x\s*=\s*(-?\d+(\.\d+)?)$/);
  if (vertMatch) {
    const xVal = parseFloat(vertMatch[1]);
    return {
      fn: null,
      error: null,
      type: "vertical",
      xVal,
    };
  }

  // 4. Check for Inequality: y < expr, y <= expr, y > expr, y >= expr
  const ineqMatch = trimmed.match(/^y\s*(<=|>=|<|>|≤|≥)\s*(.+)$/);
  if (ineqMatch) {
    let op = ineqMatch[1] as "<" | "<=" | ">" | ">=" | "≤" | "≥";
    if (op === "≤") op = "<=";
    if (op === "≥") op = ">=";
    const rhs = ineqMatch[2].trim();
    try {
      const prepRhs = preprocessMath(rhs);
      const header = buildSliderHeader(sliders);
      const fn = new Function("x", `"use strict"; ${header}return (${prepRhs});`) as (x: number) => number;
      // validate
      const testVal = fn(1);
      if (!Number.isFinite(testVal) && !Number.isFinite(fn(0))) {
        throw new Error("Invalid output");
      }
      return {
        fn,
        error: null,
        type: "inequality",
        inequalityOp: op as "<" | "<=" | ">" | ">=",
      };
    } catch {
      return { fn: null, error: "Invalid inequality expression", type: "inequality" };
    }
  }

  // 5. Implicit or Explicit function
  try {
    const sanitised = preprocessMath(trimmed);

    // Check for equality sign
    const parts = sanitised.split("=");
    if (parts.length > 2) {
      return { fn: null, error: "Multiple '=' signs are not supported", type: "explicit" };
    }

    const header = buildSliderHeader(sliders);

    if (parts.length === 2) {
      const lhs = parts[0].trim();
      const rhs = parts[1].trim();

      // Explicit y = f(x)
      if (lhs === "y" && !rhs.includes("y")) {
        const fn = new Function("x", `"use strict"; ${header}return (${rhs});`) as (x: number) => number;
        const t1 = fn(1), t0 = fn(0);
        if (!Number.isFinite(t1) && !Number.isFinite(t0) && !Number.isFinite(fn(2))) {
          throw new Error("Invalid output");
        }
        return { fn, error: null, type: "explicit" };
      }

      // Explicit f(x) = ...
      if (/^f\(x\)$/i.test(lhs) && !rhs.includes("y")) {
        const fn = new Function("x", `"use strict"; ${header}return (${rhs});`) as (x: number) => number;
        return { fn, error: null, type: "explicit" };
      }

      // Implicit f(x, y) = g(x, y)
      const expr = `(${lhs}) - (${rhs})`;
      const fn = new Function("x", "y", `"use strict"; ${header}return (${expr});`) as (x: number, y: number) => number;
      fn(1, 1);
      return { fn, error: null, type: "implicit" };
    }

    // parts.length === 1
    // If it contains 'y', treat as implicit equation f(x, y) = 0
    if (sanitised.includes("y")) {
      const fn = new Function("x", "y", `"use strict"; ${header}return (${sanitised});`) as (x: number, y: number) => number;
      fn(1, 1);
      return { fn, error: null, type: "implicit" };
    }

    // Default: explicit function y = expr(x)
    const fn = new Function("x", `"use strict"; ${header}return (${sanitised});`) as (x: number) => number;
    const t1 = fn(1), t0 = fn(0), t2 = fn(2);
    if (!Number.isFinite(t1) && !Number.isFinite(t0) && !Number.isFinite(t2)) {
      throw new Error("Invalid output");
    }
    return { fn, error: null, type: "explicit" };
  } catch {
    return { fn: null, error: "Invalid math expression", type: "explicit" };
  }
}

/** "Nice" grid step for a given axis range. */
export function getNiceStep(range: number): { major: number; minor: number } {
  const exp = Math.floor(Math.log10(range));
  const m = range / Math.pow(10, exp);
  const majorUnit = m < 2 ? 0.2 : m < 5 ? 0.5 : 1;
  const major = majorUnit * Math.pow(10, exp);
  const minor = major / 5;
  return { major, minor };
}

/** Format a number nicely for axis tick labels. */
export function formatCoordinate(n: number): string {
  if (Math.abs(n) < 1e-10) return "0";
  if (Math.abs(n) >= 10000 || (Math.abs(n) < 0.001 && Math.abs(n) > 0)) {
    return n.toExponential(2);
  }
  // Trim trailing zeros from fixed precision
  const rounded = Math.round(n * 10000) / 10000;
  return rounded.toString();
}
