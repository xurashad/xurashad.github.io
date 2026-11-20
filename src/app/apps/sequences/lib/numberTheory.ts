import type {
  ConstantMeta,
  ConstantResult,
  ExportFormat,
  SequenceMeta,
  SequenceResult,
} from "./types";

/* ── BigInt Helpers ────────────────────────────────────────────────────── */
export function isqrtBigInt(n: bigint): bigint {
  if (n < 0n) throw new Error("Negative integer square root");
  if (n < 2n) return n;
  const bits = n.toString(2).length;
  let x = 1n << BigInt((bits + 1) >> 1);
  while (true) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

export function icbrtBigInt(n: bigint): bigint {
  if (n < 0n) return -icbrtBigInt(-n);
  if (n < 2n) return n;
  const bits = n.toString(2).length;
  let x = 1n << BigInt(Math.ceil(bits / 3));
  while (true) {
    const y = (2n * x + n / (x * x)) / 3n;
    if (y >= x) return x;
    x = y;
  }
}

export function gcdBigInt(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

export function modPowBigInt(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) res = (res * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return res;
}

/* ── Deterministic Miller-Rabin (< 3.3e24 exact, strong probabilistic above) */
const DET_BASES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

export function isPrimeBigInt(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of DET_BASES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  if (n < 41n * 41n) return true;

  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }

  for (const a of DET_BASES) {
    if (a >= n) break;
    let x = modPowBigInt(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

/* ── Pollard's Rho (Brent Cycle Variant) Factorization ─────────────────── */
function brentFactor(n: bigint): bigint {
  if ((n & 1n) === 0n) return 2n;
  for (let c = 1n; c < 32n; c++) {
    let y = 2n;
    let r = 1n;
    let q = 1n;
    let g = 1n;
    let ys = 2n;
    let x = 2n;
    const m = 128n;
    const f = (v: bigint) => (v * v + c) % n;

    while (g === 1n) {
      x = y;
      for (let i = 0n; i < r; i++) y = f(y);
      let k = 0n;
      while (k < r && g === 1n) {
        ys = y;
        const lim = m < r - k ? m : r - k;
        for (let i = 0n; i < lim; i++) {
          y = f(y);
          const diff = x > y ? x - y : y - x;
          q = (q * diff) % n;
        }
        g = gcdBigInt(q, n);
        k += m;
      }
      r <<= 1n;
    }

    if (g === n) {
      while (true) {
        ys = f(ys);
        const diff = x > ys ? x - ys : ys - x;
        g = gcdBigInt(diff, n);
        if (g > 1n) break;
      }
    }
    if (g < n) return g;
  }
  return n;
}

export interface PrimeFactor {
  prime: bigint;
  exp: number;
}

export function factorizeBigInt(n: bigint): PrimeFactor[] {
  if (n < 2n) return [];
  const counts = new Map<bigint, number>();
  const addFactor = (p: bigint) => counts.set(p, (counts.get(p) ?? 0) + 1);

  let rem = n;
  while ((rem & 1n) === 0n) {
    addFactor(2n);
    rem >>= 1n;
  }
  for (let d = 3n; d * d <= rem && d <= 10000n; d += 2n) {
    while (rem % d === 0n) {
      addFactor(d);
      rem /= d;
    }
  }

  const stack: bigint[] = rem > 1n ? [rem] : [];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    if (cur <= 1n) continue;
    if (isPrimeBigInt(cur)) {
      addFactor(cur);
      continue;
    }
    const factor = brentFactor(cur);
    if (factor === cur) {
      addFactor(cur);
    } else {
      stack.push(factor, cur / factor);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([prime, exp]) => ({ prime, exp }));
}

export function divisorCount(factors: PrimeFactor[]): bigint {
  return factors.reduce((acc, f) => acc * BigInt(f.exp + 1), 1n);
}

export function eulerTotient(factors: PrimeFactor[]): bigint {
  return factors.reduce(
    (acc, f) => acc * (f.prime - 1n) * (f.prime ** BigInt(f.exp - 1)),
    1n
  );
}

export function nextPrimeBigInt(n: bigint): bigint {
  if (n < 2n) return 2n;
  let cur = n + 1n;
  if ((cur & 1n) === 0n && cur > 2n) cur += 1n;
  while (!isPrimeBigInt(cur)) cur += 2n;
  return cur;
}

export function prevPrimeBigInt(n: bigint): bigint | null {
  if (n <= 2n) return null;
  if (n === 3n) return 2n;
  let cur = n - 1n;
  if ((cur & 1n) === 0n) cur -= 1n;
  while (cur >= 3n && !isPrimeBigInt(cur)) cur -= 2n;
  return cur >= 2n ? cur : 2n;
}

export function isPerfectSquare(n: bigint): boolean {
  if (n < 0n) return false;
  const r = isqrtBigInt(n);
  return r * r === n;
}

export function checkSpecialMembership(n: bigint): {
  isFibonacci: boolean;
  isTriangular: boolean;
  isSquare: boolean;
  isCube: boolean;
  isPowerOfTwo: boolean;
  isPalindrome: boolean;
} {
  const s = n.toString();
  const rev = s.split("").reverse().join("");
  const fiveN2 = 5n * n * n;
  const c = icbrtBigInt(n);
  return {
    isFibonacci: n >= 0n && (isPerfectSquare(fiveN2 + 4n) || isPerfectSquare(fiveN2 - 4n)),
    isTriangular: n >= 0n && isPerfectSquare(8n * n + 1n),
    isSquare: isPerfectSquare(n),
    isCube: c * c * c === n,
    isPowerOfTwo: n > 0n && (n & (n - 1n)) === 0n,
    isPalindrome: s === rev,
  };
}

export interface CollatzAnalysis {
  steps: number;
  peak: bigint;
  oddSteps: number;
  evenSteps: number;
  truncated: boolean;
  trajectory: string[];
}

export function computeCollatzTrajectory(
  start: bigint,
  maxSteps = 2000
): CollatzAnalysis {
  let cur = start < 1n ? 1n : start;
  let peak = cur;
  let oddSteps = 0;
  let evenSteps = 0;
  const trajectory: string[] = [cur.toString()];

  let steps = 0;
  while (cur !== 1n && steps < maxSteps) {
    if ((cur & 1n) === 0n) {
      cur >>= 1n;
      evenSteps++;
    } else {
      cur = 3n * cur + 1n;
      oddSteps++;
    }
    if (cur > peak) peak = cur;
    trajectory.push(cur.toString());
    steps++;
  }

  return {
    steps,
    peak,
    oddSteps,
    evenSteps,
    truncated: cur !== 1n,
    trajectory,
  };
}

/* ── Multi-Format File Downloads ───────────────────────────────────────── */
export function downloadTextFile(
  content: string,
  filename: string,
  mime: string
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSequenceData(
  result: SequenceResult,
  meta: SequenceMeta,
  format: ExportFormat
): void {
  const baseName =
    result.mode === "nth"
      ? `${meta.id}_n${result.nthIndex}`
      : result.mode === "range"
        ? `${meta.id}_range_${result.startIndex}`
        : `${meta.id}_${result.totalCount}`;

  if (format === "json") {
    const payload =
      result.mode === "nth"
        ? {
            sequence: meta.name,
            oeis: meta.oeis,
            index: result.nthIndex,
            value: result.nthValue,
            algorithm: result.algorithmUsed,
            elapsedMs: result.elapsedMs,
          }
        : {
            sequence: meta.name,
            oeis: meta.oeis,
            count: result.totalCount,
            startIndex: result.startIndex,
            algorithm: result.algorithmUsed,
            elapsedMs: result.elapsedMs,
            terms: result.terms.map((v, i) => ({
              index: result.startIndex + i,
              value: v,
            })),
          };
    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `${baseName}.json`,
      "application/json"
    );
  } else if (format === "csv") {
    const rows =
      result.mode === "nth"
        ? ["index,value", `${result.nthIndex},"${result.nthValue}"`]
        : [
            "index,value",
            ...result.terms.map((v, i) => `${result.startIndex + i},"${v}"`),
          ];
    downloadTextFile(rows.join("\n"), `${baseName}.csv`, "text/csv;charset=utf-8");
  } else {
    const txt =
      result.mode === "nth"
        ? `${meta.name} (${meta.oeis})\nIndex ${result.nthIndex}: ${result.nthValue}\n`
        : `${meta.name} (${meta.oeis}) — ${result.totalCount} terms\n` +
          result.terms.map((v, i) => `${result.startIndex + i}: ${v}`).join("\n");
    downloadTextFile(txt, `${baseName}.txt`, "text/plain;charset=utf-8");
  }
}

export function exportConstantData(
  result: ConstantResult,
  meta: ConstantMeta,
  format: ExportFormat
): void {
  const nameTag =
    result.constantId === "custom_sqrt" && result.customParam
      ? `sqrt${result.customParam}_${result.totalDigits}d`
      : `${meta.id}_${result.totalDigits}d`;

  const fullValue = `${result.integerPart}.${result.fractionalDigits}`;

  if (format === "json") {
    const payload = {
      constant: meta.name,
      symbol: meta.symbol,
      digits: result.totalDigits,
      algorithm: result.algorithmUsed,
      elapsedMs: result.elapsedMs,
      value: fullValue,
      continuedFraction: result.continuedFraction,
      convergents: result.convergents,
    };
    downloadTextFile(
      JSON.stringify(payload, null, 2),
      `${nameTag}.json`,
      "application/json"
    );
  } else if (format === "csv") {
    const rows = ["position,digit"];
    for (let i = 0; i < result.fractionalDigits.length; i++) {
      rows.push(`${i + 1},${result.fractionalDigits[i]}`);
    }
    downloadTextFile(rows.join("\n"), `${nameTag}.csv`, "text/csv;charset=utf-8");
  } else {
    const wrapped = fullValue.match(/.{1,80}/g)?.join("\n") ?? fullValue;
    downloadTextFile(
      `${meta.name} (${meta.symbol}) — ${result.totalDigits} decimal places\n${wrapped}\n`,
      `${nameTag}.txt`,
      "text/plain;charset=utf-8"
    );
  }
}
