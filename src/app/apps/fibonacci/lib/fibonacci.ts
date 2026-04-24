/**
 * Core Fibonacci computation utilities using BigInt for arbitrary precision.
 *
 * Yielding control to the event loop (via Promise) on every progress update
 * keeps the UI responsive even for very large sequences.
 *
 * Uses BigInt() constructor instead of literal syntax (0n/1n) to avoid
 * requiring tsconfig target ES2020+.
 */

export type OutputFormat = "full" | "nth";

/** Constraints per output format (default limits, before unlock) */
export const DEFAULT_MAX: Record<OutputFormat, number> = {
  full: 50_000,
  nth: 1_000_000,
};

/**
 * Generate the first `count` Fibonacci numbers.
 * Calls `onProgress(0..100)` as computation proceeds.
 */
export async function generateSequence(
  count: number,
  onProgress: (pct: number) => void,
): Promise<bigint[]> {
  if (count <= 0) { onProgress(100); return []; }
  if (count === 1) { onProgress(100); return [BigInt(0)]; }

  const seq: bigint[] = [BigInt(0), BigInt(1)];
  let lastPct = -1;

  for (let i = 2; i < count; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
    const pct = Math.floor((i / (count - 1)) * 100);
    if (pct > lastPct) {
      onProgress(pct);
      lastPct = pct;
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }
  if (lastPct < 100) onProgress(100);
  return seq;
}

/**
 * Compute only the Nth Fibonacci number (1-indexed, so N=1 → F(0)=0).
 * Memory-efficient iterative approach.
 */
export async function getNthFibonacci(
  n: number,
  onProgress: (pct: number) => void,
): Promise<bigint> {
  if (n <= 0) { onProgress(100); return BigInt(0); }
  if (n === 1) { onProgress(100); return BigInt(0); }
  if (n === 2) { onProgress(100); return BigInt(1); }

  let a = BigInt(0), b = BigInt(1);
  let lastPct = -1;

  for (let i = 3; i <= n; i++) {
    [a, b] = [b, a + b];
    const pct = Math.floor(((i - 2) / (n - 2)) * 100);
    if (pct > lastPct) {
      onProgress(pct);
      lastPct = pct;
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }
  if (lastPct < 100) onProgress(100);
  return b;
}

/** Trigger a JSON file download in the browser */
export function downloadJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
