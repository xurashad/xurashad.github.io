/** Types and utilities for the Graphing Calculator. */

export interface ViewBox {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export type EquationType = "explicit" | "implicit";

export interface Equation {
  id: number;
  text: string;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: ((...args: any[]) => number) | null;
  error: string | null;
  type: EquationType;
}

export const INITIAL_VIEWBOX: ViewBox = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

export const COLORS: string[] = [
  "#3b82f6", "#ef4444", "#22c55e", "#f97316",
  "#8b5cf6", "#ec4899", "#eab308", "#14b8a6",
  "#06b6d4", "#84cc16", "#d946ef", "#6366f1",
  "#10b981", "#f43f5e",
];

/** Convert a user-typed math string into a callable function, with type detection. */
export function parseEquation(text: string): Pick<Equation, "fn" | "error" | "type"> {
  if (!text.trim()) return { fn: null, error: null, type: "explicit" };

  try {
    const sanitised = text
      .replace(/\^/g, "**")
      .replace(/\bsin\b/g, "Math.sin")
      .replace(/\bcos\b/g, "Math.cos")
      .replace(/\btan\b/g, "Math.tan")
      .replace(/\bsqrt\b/g, "Math.sqrt")
      .replace(/\babs\b/g, "Math.abs")
      .replace(/\blog\b/g, "Math.log")
      .replace(/\bln\b/g, "Math.log")
      .replace(/\bfloor\b/g, "Math.floor")
      .replace(/\bceil\b/g, "Math.ceil")
      .replace(/\bround\b/g, "Math.round")
      .replace(/\bmax\b/g, "Math.max")
      .replace(/\bmin\b/g, "Math.min")
      .replace(/\bexp\b/g, "Math.exp")
      .replace(/\bpi\b/g, "Math.PI")
      // Replace bare 'e' only when not part of a word/function
      .replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, "Math.E");

    const parts = sanitised.split("=");

    if (parts.length > 2) {
      return { fn: null, error: "Multiple '=' signs are not supported", type: "explicit" };
    }

    let isImplicit = false;
    let expression = "";

    if (parts.length === 1) {
      isImplicit = sanitised.includes("y");
      expression = sanitised;
    } else {
      const lhs = parts[0].trim();
      const rhs = parts[1].trim();
      if (lhs === "y" && !rhs.includes("y")) {
        isImplicit = false;
        expression = rhs;
      } else {
        isImplicit = true;
        expression = `(${lhs}) - (${rhs})`;
      }
    }

    if (isImplicit) {
      // eslint-disable-next-line no-new-func
      const fn = new Function("x", "y", `"use strict"; return ${expression};`) as (x: number, y: number) => number;
      fn(1, 1); // validate
      return { fn, error: null, type: "implicit" };
    } else {
      // eslint-disable-next-line no-new-func
      const fn = new Function("x", `"use strict"; return ${expression};`) as (x: number) => number;
      // Test at x=1; fallback to x=0
      const t1 = fn(1), t0 = fn(0);
      if (!Number.isFinite(t1) && !Number.isFinite(t0)) {
        throw new Error("Function returned non-finite value at test points");
      }
      return { fn, error: null, type: "explicit" };
    }
  } catch {
    return { fn: null, error: "Invalid expression", type: "explicit" };
  }
}

/** "Nice" grid step for a given axis range. */
export function getNiceStep(range: number): number {
  const exp = Math.floor(Math.log10(range));
  const m = range / Math.pow(10, exp);
  const step = m < 2 ? 0.2 : m < 5 ? 0.5 : 1;
  return step * Math.pow(10, exp);
}
