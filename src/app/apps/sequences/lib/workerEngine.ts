import type {
  ConstantId,
  ConstantResult,
  SequenceId,
  SequenceMode,
  SequenceResult,
} from "./types";

export interface SequenceRunParams {
  sequenceId: SequenceId;
  mode: SequenceMode;
  count: number;
  nthIndex: number;
  rangeStart: number;
  rangeEnd: number;
}

export interface ConstantRunParams {
  constantId: ConstantId;
  digits: number;
  customParam?: number;
}

function buildWorkerSource(): string {
  return `
"use strict";

function reportProgress(pct) {
  self.postMessage({ type: "progress", pct: Math.max(0, Math.min(100, Math.round(pct))) });
}

/* ── BigInt Primitives ─────────────────────────────────────────────────── */
function isqrt(n) {
  if (n < 0n) throw new Error("Negative square root");
  if (n < 2n) return n;
  const bits = n.toString(2).length;
  let x = 1n << BigInt((bits + 1) >> 1);
  while (true) {
    const y = (x + n / x) >> 1n;
    if (y >= x) return x;
    x = y;
  }
}

function prodRange(lo, hi) {
  if (lo > hi) return 1n;
  if (lo === hi) return BigInt(lo);
  if (hi - lo === 1) return BigInt(lo) * BigInt(hi);
  const mid = (lo + hi) >> 1;
  return prodRange(lo, mid) * prodRange(mid + 1, hi);
}

function fibPair(n) {
  if (n === 0) return [0n, 1n];
  const [a, b] = fibPair(n >> 1);
  const c = a * ((b << 1n) - a);
  const d = a * a + b * b;
  return (n & 1) ? [d, c + d] : [c, d];
}

function matMul(A, B) {
  const size = A.length;
  const C = Array.from({ length: size }, () => Array(size).fill(0n));
  for (let i = 0; i < size; i++) {
    for (let k = 0; k < size; k++) {
      const aik = A[i][k];
      if (aik === 0n) continue;
      for (let j = 0; j < size; j++) {
        C[i][j] += aik * B[k][j];
      }
    }
  }
  return C;
}

function matPow(M, exp) {
  const size = M.length;
  let res = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (__, j) => (i === j ? 1n : 0n))
  );
  let base = M;
  let e = exp;
  while (e > 0) {
    if (e & 1) res = matMul(res, base);
    e >>= 1;
    if (e > 0) base = matMul(base, base);
  }
  return res;
}

/* ── Deterministic Primality & Bitset Segmented Sieve ─────────────────── */
function modPowNum(base, exp, mod) {
  let res = 1n;
  let b = BigInt(base) % BigInt(mod);
  let e = BigInt(exp);
  const m = BigInt(mod);
  while (e > 0n) {
    if (e & 1n) res = (res * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return res;
}

const MR_BASES_SMALL = [2n, 3n, 5n, 7n, 11n, 13n, 17n];

function isPrimeInt(n) {
  if (n < 2) return false;
  if (n === 2 || n === 3 || n === 5 || n === 7) return true;
  if (n % 2 === 0 || n % 3 === 0 || n % 5 === 0 || n % 7 === 0) return false;
  if (n < 121) return true;
  const N = BigInt(n);
  let d = N - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  for (let i = 0; i < MR_BASES_SMALL.length; i++) {
    const a = MR_BASES_SMALL[i];
    if (a >= N) break;
    let x = modPowNum(a, d, N);
    if (x === 1n || x === N - 1n) continue;
    let passed = false;
    for (let r = 1; r < s; r++) {
      x = (x * x) % N;
      if (x === N - 1n) {
        passed = true;
        break;
      }
    }
    if (!passed) return false;
  }
  return true;
}

function getBasePrimes(limit) {
  const isComp = new Uint8Array(limit + 1);
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    if (!isComp[i]) {
      primes.push(i);
      if (i * i <= limit) {
        for (let j = i * i; j <= limit; j += i) isComp[j] = 1;
      }
    }
  }
  return primes;
}

function approxPrimeBound(count) {
  if (count < 6) return 15;
  const ln = Math.log(count);
  return Math.ceil(count * (ln + Math.log(ln) + 0.35)) + 32;
}

/**
 * Odd-only segmented bitset sieve from low..high (or collecting targetCount primes).
 */
function segmentedSievePrimes(options) {
  const { targetCount, low = 2, high, withProgress } = options;
  const limit = high !== undefined ? high : approxPrimeBound(targetCount);
  const sqrtLim = Math.floor(Math.sqrt(limit)) + 1;
  const baseOddPrimes = getBasePrimes(sqrtLim).filter((p) => p >= 3);

  const SEG_BYTES = 32768; // 32 KB L1 cache friendly
  const SEG_ODDS = SEG_BYTES * 8;
  const SEG_SPAN = SEG_ODDS * 2;
  const seg = new Uint8Array(SEG_BYTES);

  const terms = [];
  let count = 0;
  let nthPrime = null;

  if (low <= 2 && limit >= 2) {
    count++;
    if (targetCount === null || count <= targetCount) {
      if (options.onlyNth) {
        if (count === targetCount) { nthPrime = 2; return { terms: [], nthPrime: "2" }; }
      } else {
        terms.push("2");
      }
    }
  }

  let segLow = Math.max(3, low % 2 === 0 ? low + 1 : low);
  const totalSpan = Math.max(1, limit - segLow);
  let lastPct = -1;

  while (segLow <= limit) {
    const segHigh = Math.min(limit, segLow + SEG_SPAN - 2);
    const oddCount = ((segHigh - segLow) >> 1) + 1;
    const neededBytes = (oddCount + 7) >> 3;
    seg.fill(0, 0, neededBytes);

    for (let i = 0; i < baseOddPrimes.length; i++) {
      const p = baseOddPrimes[i];
      const p2 = p * p;
      if (p2 > segHigh) break;
      let start = p2;
      if (start < segLow) {
        start = Math.ceil(segLow / p) * p;
        if ((start & 1) === 0) start += p;
      }
      const step = p << 1;
      for (let m = start; m <= segHigh; m += step) {
        const idx = (m - segLow) >> 1;
        seg[idx >> 3] |= (1 << (idx & 7));
      }
    }

    for (let idx = 0; idx < oddCount; idx++) {
      if ((seg[idx >> 3] & (1 << (idx & 7))) === 0) {
        const val = segLow + (idx << 1);
        count++;
        if (options.onlyNth) {
          if (count === targetCount) {
            return { terms: [], nthPrime: String(val) };
          }
        } else {
          terms.push(String(val));
          if (targetCount !== null && count >= targetCount) {
            return { terms, nthPrime: String(val) };
          }
        }
      }
    }

    if (withProgress) {
      const pct = options.onlyNth || targetCount
        ? Math.floor((count / targetCount) * 100)
        : Math.floor(((segHigh - low) / totalSpan) * 100);
      if (pct > lastPct) {
        lastPct = pct;
        reportProgress(pct);
      }
    }

    segLow += SEG_SPAN;
  }

  return { terms, nthPrime: nthPrime !== null ? String(nthPrime) : (terms.length ? terms[terms.length - 1] : undefined) };
}

/* ── Prime-exponent Binary Splitting for n! and Catalan(n) ────────────── */
function powBig(base, exp) {
  let res = 1n;
  let b = BigInt(base);
  let e = exp;
  while (e > 0) {
    if (e & 1) res *= b;
    e >>= 1;
    if (e > 0) b *= b;
  }
  return res;
}

function fastFactorialNth(n) {
  if (n <= 1) return 1n;
  return prodRange(2, n);
}

function fastCatalanNth(n) {
  if (n <= 1) return 1n;
  // C_n = (2n)! / (n! * (n+1)!) using prime factorization of binomial(2n, n) / (n + 1)
  const primes = getBasePrimes(2 * n);
  const factors = [];
  for (let i = 0; i < primes.length; i++) {
    const p = primes[i];
    let exp = 0;
    let pk = p;
    while (pk <= 2 * n) {
      exp += Math.floor((2 * n) / pk) - 2 * Math.floor(n / pk);
      pk *= p;
    }
    // Subtract exponent of p in (n + 1)
    let m = n + 1;
    while (m % p === 0) {
      exp--;
      m = Math.floor(m / p);
    }
    if (exp > 0) factors.push(powBig(p, exp));
  }
  function mulList(lo, hi) {
    if (lo > hi) return 1n;
    if (lo === hi) return factors[lo];
    const mid = (lo + hi) >> 1;
    return mulList(lo, mid) * mulList(mid + 1, hi);
  }
  return mulList(0, factors.length - 1);
}

/* ── Sequence Runner ──────────────────────────────────────────────────── */
function runSequence(params) {
  const t0 = performance.now();
  const { sequenceId, mode, count, nthIndex, rangeStart, rangeEnd } = params;
  const terms = [];
  let nthValue;
  let maxNumeric = 0;
  let algorithmUsed = "";

  if (sequenceId === "fibonacci") {
    if (mode === "nth") {
      algorithmUsed = "Fast Doubling O(log n)";
      nthValue = fibPair(nthIndex)[0].toString();
    } else {
      algorithmUsed = "Iterative BigInt";
      let a = 0n, b = 1n;
      let lastPct = -1;
      for (let i = 0; i < count; i++) {
        terms.push(a.toString());
        const next = a + b;
        a = b;
        b = next;
        const pct = Math.floor(((i + 1) / count) * 100);
        if (pct > lastPct && i % 512 === 0) { lastPct = pct; reportProgress(pct); }
      }
    }
  } else if (sequenceId === "lucas") {
    if (mode === "nth") {
      algorithmUsed = "Fast Doubling Identity L_n = 2F_{n+1} - F_n";
      const [fn, fn1] = fibPair(nthIndex);
      nthValue = (2n * fn1 - fn).toString();
    } else {
      algorithmUsed = "Iterative BigInt";
      let a = 2n, b = 1n;
      let lastPct = -1;
      for (let i = 0; i < count; i++) {
        terms.push(a.toString());
        const next = a + b;
        a = b;
        b = next;
        const pct = Math.floor(((i + 1) / count) * 100);
        if (pct > lastPct && i % 512 === 0) { lastPct = pct; reportProgress(pct); }
      }
    }
  } else if (sequenceId === "tribonacci") {
    if (mode === "nth") {
      algorithmUsed = "3x3 Matrix Exponentiation O(log n)";
      if (nthIndex <= 1) nthValue = "0";
      else if (nthIndex === 2) nthValue = "1";
      else {
        const M = matPow([[1n, 1n, 1n], [1n, 0n, 0n], [0n, 1n, 0n]], nthIndex - 2);
        nthValue = M[0][0].toString();
      }
    } else {
      algorithmUsed = "Iterative BigInt";
      let a = 0n, b = 0n, c = 1n;
      for (let i = 0; i < count; i++) {
        terms.push(a.toString());
        const next = a + b + c;
        a = b; b = c; c = next;
        if (i % 512 === 0) reportProgress(((i + 1) / count) * 100);
      }
    }
  } else if (sequenceId === "pell") {
    if (mode === "nth") {
      algorithmUsed = "2x2 Matrix Exponentiation O(log n)";
      if (nthIndex === 0) nthValue = "0";
      else {
        const M = matPow([[2n, 1n], [1n, 0n]], nthIndex - 1);
        nthValue = M[0][0].toString();
      }
    } else {
      algorithmUsed = "Iterative BigInt";
      let a = 0n, b = 1n;
      for (let i = 0; i < count; i++) {
        terms.push(a.toString());
        const next = 2n * b + a;
        a = b; b = next;
        if (i % 512 === 0) reportProgress(((i + 1) / count) * 100);
      }
    }
  } else if (sequenceId === "padovan") {
    if (mode === "nth") {
      algorithmUsed = "3x3 Matrix Exponentiation O(log n)";
      if (nthIndex <= 2) nthValue = "1";
      else {
        const M = matPow([[0n, 1n, 1n], [1n, 0n, 0n], [0n, 1n, 0n]], nthIndex - 2);
        nthValue = (M[0][0] + M[0][1] + M[0][2]).toString();
      }
    } else {
      algorithmUsed = "Iterative BigInt";
      let a = 1n, b = 1n, c = 1n;
      for (let i = 0; i < count; i++) {
        terms.push(a.toString());
        const next = a + b;
        a = b; b = c; c = next;
        if (i % 512 === 0) reportProgress(((i + 1) / count) * 100);
      }
    }
  } else if (sequenceId === "jacobsthal") {
    if (mode === "nth") {
      algorithmUsed = "Closed-Form Bitshift O(1)";
      nthValue = (((1n << BigInt(nthIndex)) - (nthIndex % 2 === 0 ? 1n : -1n)) / 3n).toString();
    } else {
      algorithmUsed = "Iterative BigInt";
      let a = 0n, b = 1n;
      for (let i = 0; i < count; i++) {
        terms.push(a.toString());
        const next = b + 2n * a;
        a = b; b = next;
        if (i % 512 === 0) reportProgress(((i + 1) / count) * 100);
      }
    }
  } else if (sequenceId === "primes") {
    algorithmUsed = "Segmented Bit-Packed Sieve";
    if (mode === "nth") {
      const r = segmentedSievePrimes({ targetCount: nthIndex, onlyNth: true, withProgress: true });
      nthValue = r.nthPrime;
    } else if (mode === "range") {
      const r = segmentedSievePrimes({ targetCount: null, low: rangeStart, high: rangeEnd, withProgress: true });
      for (let i = 0; i < r.terms.length; i++) terms.push(r.terms[i]);
    } else {
      const r = segmentedSievePrimes({ targetCount: count, withProgress: true });
      for (let i = 0; i < r.terms.length; i++) terms.push(r.terms[i]);
    }
  } else if (sequenceId === "twin_primes") {
    algorithmUsed = "Segmented Sieve Pair Scan";
    let hi = mode === "range"
      ? rangeEnd
      : Math.max(100, Math.ceil(count * 12 * Math.pow(Math.log(Math.max(10, count)), 2)));
    let lo = mode === "range" ? Math.max(3, rangeStart) : 3;
    while (true) {
      const r = segmentedSievePrimes({ targetCount: null, low: lo, high: hi, withProgress: false });
      terms.length = 0;
      for (let i = 0; i < r.terms.length - 1; i++) {
        const p1 = Number(r.terms[i]);
        const p2 = Number(r.terms[i + 1]);
        if (p2 - p1 === 2) {
          terms.push(p1 + ", " + p2);
          if (mode === "full" && terms.length >= count) break;
        }
      }
      if (mode === "range" || terms.length >= count) break;
      hi *= 2;
    }
  } else if (sequenceId === "sophie_germain") {
    algorithmUsed = "Segmented Sieve + Safe-Prime Test";
    let hi = mode === "range"
      ? rangeEnd
      : Math.max(100, Math.ceil(count * 12 * Math.pow(Math.log(Math.max(10, count)), 2)));
    let lo = mode === "range" ? Math.max(2, rangeStart) : 2;
    while (true) {
      const r = segmentedSievePrimes({ targetCount: null, low: lo, high: hi, withProgress: false });
      terms.length = 0;
      for (let i = 0; i < r.terms.length; i++) {
        const p = Number(r.terms[i]);
        if (isPrimeInt(2 * p + 1)) {
          terms.push(String(p));
          if (mode === "full" && terms.length >= count) break;
        }
      }
      if (mode === "range" || terms.length >= count) break;
      hi *= 2;
    }
  } else if (sequenceId === "mersenne") {
    algorithmUsed = "Lucas-Lehmer BigInt Bitshift Test";
    const expPrimes = segmentedSievePrimes({ targetCount: 3000, withProgress: false }).terms;
    for (let i = 0; i < expPrimes.length && terms.length < count; i++) {
      const p = Number(expPrimes[i]);
      if (p === 2) {
        terms.push("3");
        reportProgress((terms.length / count) * 100);
        continue;
      }
      const bp = BigInt(p);
      const M = (1n << bp) - 1n;
      let s = 4n;
      for (let k = 0; k < p - 2; k++) {
        const prod = s * s;
        let r = (prod & M) + (prod >> bp);
        if (r >= M) r -= M;
        r -= 2n;
        if (r < 0n) r += M;
        s = r;
      }
      if (s === 0n) {
        terms.push(M.toString());
        reportProgress((terms.length / count) * 100);
      }
    }
  } else if (sequenceId === "palindromic_primes") {
    algorithmUsed = "Odd-Length Palindrome Generator + Miller-Rabin";
    const seed = [2, 3, 5, 7, 11];
    for (let i = 0; i < seed.length && terms.length < count; i++) {
      terms.push(String(seed[i]));
    }
    let halfDigits = 2; // generates 3-digit (2 + 1), 5-digit (3 + 2)...
    while (terms.length < count) {
      const start = Math.pow(10, halfDigits - 1);
      const end = Math.pow(10, halfDigits);
      for (let left = start; left < end && terms.length < count; left++) {
        const firstDigit = Math.floor(left / start);
        if (firstDigit % 2 === 0 || firstDigit === 5) continue; // skip even / div by 5 ends
        const s = String(left);
        const rev = s.slice(0, -1).split("").reverse().join("");
        const pal = Number(s + rev);
        if (isPrimeInt(pal)) {
          terms.push(String(pal));
          if (terms.length % 100 === 0) reportProgress((terms.length / count) * 100);
        }
      }
      halfDigits++;
    }
  } else if (sequenceId === "recaman") {
    algorithmUsed = "O(1) HashSet Walk";
    const seen = new Set([0]);
    let cur = 0;
    terms.push("0");
    maxNumeric = 0;
    for (let n = 1; n < count; n++) {
      const back = cur - n;
      cur = back > 0 && !seen.has(back) ? back : cur + n;
      seen.add(cur);
      if (cur > maxNumeric) maxNumeric = cur;
      terms.push(String(cur));
      if (n % 2000 === 0) reportProgress(((n + 1) / count) * 100);
    }
  } else if (sequenceId === "collatz_steps") {
    algorithmUsed = "Memoized Stopping-Time Table";
    const maxSeed = mode === "nth" ? nthIndex : mode === "range" ? rangeEnd : count;
    const cacheLim = Math.min(2_500_000, Math.max(65_536, maxSeed * 2));
    const cache = new Int32Array(cacheLim + 1).fill(-1);
    cache[1] = 0;

    function stepsFor(n) {
      if (n <= cacheLim && cache[n] !== -1) return cache[n];
      const path = [];
      let cur = n;
      while (cur > cacheLim || cache[cur] === -1) {
        path.push(cur);
        cur = (cur % 2 === 0) ? cur / 2 : 3 * cur + 1;
      }
      let base = cache[cur];
      for (let i = path.length - 1; i >= 0; i--) {
        base++;
        const v = path[i];
        if (v <= cacheLim) cache[v] = base;
      }
      return base;
    }

    if (mode === "nth") {
      nthValue = String(stepsFor(nthIndex));
    } else {
      const lo = mode === "range" ? Math.max(1, rangeStart) : 1;
      const hi = mode === "range" ? rangeEnd : count;
      for (let n = lo; n <= hi; n++) {
        const st = stepsFor(n);
        if (st > maxNumeric) maxNumeric = st;
        terms.push(String(st));
        if (n % 5000 === 0) reportProgress(((n - lo + 1) / Math.max(1, hi - lo + 1)) * 100);
      }
    }
  } else if (sequenceId === "catalan") {
    if (mode === "nth") {
      algorithmUsed = "Prime-Exponent Binary Splitting";
      nthValue = fastCatalanNth(nthIndex).toString();
    } else {
      algorithmUsed = "Iterative BigInt Recurrence";
      let c = 1n;
      for (let n = 0; n < count; n++) {
        terms.push(c.toString());
        c = (c * BigInt(4 * n + 2)) / BigInt(n + 2);
        if (n % 250 === 0) reportProgress(((n + 1) / count) * 100);
      }
    }
  } else if (sequenceId === "factorials") {
    if (mode === "nth") {
      algorithmUsed = "Binary-Splitting Product Tree";
      nthValue = fastFactorialNth(nthIndex).toString();
    } else {
      algorithmUsed = "Iterative BigInt";
      let f = 1n;
      for (let n = 0; n < count; n++) {
        if (n > 1) f *= BigInt(n);
        terms.push(f.toString());
        if (n % 100 === 0) reportProgress(((n + 1) / count) * 100);
      }
    }
  } else if (sequenceId === "bell") {
    algorithmUsed = "Bell Triangle (BigInt)";
    const target = mode === "nth" ? nthIndex + 1 : count;
    let row = [1n];
    if (mode === "full") terms.push("1");
    for (let n = 1; n < target; n++) {
      const next = [row[row.length - 1]];
      for (let j = 0; j < row.length; j++) {
        next.push(next[j] + row[j]);
      }
      row = next;
      if (mode === "full") terms.push(row[0].toString());
      if (n % 50 === 0) reportProgress(((n + 1) / target) * 100);
    }
    if (mode === "nth") nthValue = row[0].toString();
  } else if (sequenceId === "partitions") {
    algorithmUsed = "Euler Pentagonal Number Theorem";
    const target = mode === "nth" ? nthIndex + 1 : count;
    const p = new Array(target);
    p[0] = 1n;
    if (mode === "full") terms.push("1");
    for (let n = 1; n < target; n++) {
      let sum = 0n;
      for (let k = 1; ; k++) {
        const g1 = (k * (3 * k - 1)) >> 1;
        if (g1 > n) break;
        const sign = (k & 1) ? 1n : -1n;
        sum += sign * p[n - g1];
        const g2 = (k * (3 * k + 1)) >> 1;
        if (g2 <= n) sum += sign * p[n - g2];
      }
      p[n] = sum;
      if (mode === "full") terms.push(sum.toString());
      if (n % 200 === 0) reportProgress(((n + 1) / target) * 100);
    }
    if (mode === "nth") nthValue = p[nthIndex].toString();
  } else if (sequenceId === "triangular") {
    algorithmUsed = "Closed-Form BigInt O(1)";
    if (mode === "nth") {
      const N = BigInt(nthIndex);
      nthValue = ((N * (N + 1n)) >> 1n).toString();
    } else {
      const lo = mode === "range" ? rangeStart : 0;
      const hi = mode === "range" ? rangeEnd : count - 1;
      for (let n = lo; n <= hi; n++) {
        const N = BigInt(n);
        terms.push(((N * (N + 1n)) >> 1n).toString());
        if (n % 5000 === 0) reportProgress(((n - lo + 1) / Math.max(1, hi - lo + 1)) * 100);
      }
    }
  } else if (sequenceId === "look_and_say") {
    algorithmUsed = "Run-Length String Scanner";
    let cur = "1";
    for (let i = 0; i < count; i++) {
      terms.push(cur);
      if (i + 1 >= count) break;
      let next = "";
      let run = 1;
      for (let j = 1; j <= cur.length; j++) {
        if (j < cur.length && cur[j] === cur[j - 1]) {
          run++;
        } else {
          next += String(run) + cur[j - 1];
          run = 1;
        }
      }
      cur = next;
      reportProgress(((i + 1) / count) * 100);
    }
  }

  reportProgress(100);
  const elapsedMs = Math.round((performance.now() - t0) * 100) / 100;
  return {
    sequenceId,
    mode,
    startIndex: mode === "range" ? rangeStart : (sequenceId === "primes" || sequenceId === "twin_primes" || sequenceId === "sophie_germain" || sequenceId === "mersenne" || sequenceId === "palindromic_primes" || sequenceId === "collatz_steps" || sequenceId === "look_and_say" ? 1 : 0),
    totalCount: mode === "nth" ? 1 : terms.length,
    terms,
    nthIndex: mode === "nth" ? nthIndex : undefined,
    nthValue,
    elapsedMs,
    algorithmUsed,
    maxNumeric,
  };
}

/* ── Constant Generators (Arbitrary Precision BigInt) ─────────────────── */
function piScaled(prec) {
  const terms = Math.floor(prec / 14) + 3;
  const C3_OVER_24 = 10939058860032000n;
  function bs(a, b) {
    if (b - a === 1) {
      if (a === 0) return [1n, 1n, 13591409n];
      const A = BigInt(a);
      const P = (6n * A - 5n) * (2n * A - 1n) * (6n * A - 1n);
      const Q = A * A * A * C3_OVER_24;
      let T = P * (13591409n + 545140134n * A);
      if (a & 1) T = -T;
      return [P, Q, T];
    }
    const m = (a + b) >> 1;
    const [P1, Q1, T1] = bs(a, m);
    const [P2, Q2, T2] = bs(m, b);
    return [P1 * P2, Q1 * Q2, Q2 * T1 + P1 * T2];
  }
  const [, Q, T] = bs(0, terms);
  const scale = 10n ** BigInt(prec);
  const sqrtC = isqrt(10005n * scale * scale);
  return (Q * 426880n * sqrtC) / T;
}

function eScaled(prec) {
  // Approximate k! > 10^prec: use Stirling check
  let terms = 20;
  let logSum = 0;
  while (logSum < prec + 6) {
    terms++;
    logSum += Math.log10(terms);
  }
  function bs(a, b) {
    if (b - a === 1) {
      return [a === 0 ? 1n : BigInt(a), 1n];
    }
    const m = (a + b) >> 1;
    const [Q1, T1] = bs(a, m);
    const [Q2, T2] = bs(m, b);
    return [Q1 * Q2, T1 * Q2 + T2];
  }
  const [Q, T] = bs(0, terms + 1);
  const scale = 10n ** BigInt(prec);
  return (T * scale) / Q;
}

function atanhInvBS(q, prec) {
  const qBig = BigInt(q);
  const q2 = qBig * qBig;
  const terms = Math.ceil(prec / Math.log10(q * q)) + 5;
  function bs(a, b) {
    if (b - a === 1) return [BigInt(2 * a + 1), 1n, q2];
    const m = (a + b) >> 1;
    const [Q1, T1, p1] = bs(a, m);
    const [Q2, T2, p2] = bs(m, b);
    return [Q1 * Q2 * p1, T1 * Q2 * p1 + T2 * Q1, p1 * p2];
  }
  const [Q, T] = bs(0, terms);
  const scale = 10n ** BigInt(prec);
  return (T * scale) / (Q * qBig);
}

function aperyScaled(prec) {
  const terms = Math.ceil(prec / 3) + 4;
  function bs(a, b) {
    if (b - a === 1) {
      const k = BigInt(a);
      const P = a === 0 ? 1n : -(k ** 5n);
      const Q = a === 0 ? 1n : 32n * ((2n * k + 1n) ** 5n);
      const B = 205n * k * k + 250n * k + 77n;
      return [P, Q, P * B];
    }
    const m = (a + b) >> 1;
    const [P1, Q1, T1] = bs(a, m);
    const [P2, Q2, T2] = bs(m, b);
    return [P1 * P2, Q1 * Q2, Q2 * T1 + P1 * T2];
  }
  const [, Q, T] = bs(0, terms);
  const scale = 10n ** BigInt(prec);
  return (T * scale) / (64n * Q);
}

function catalanGScaled(prec) {
  const scale = 10n ** BigInt(prec);
  const pi = piScaled(prec);
  reportProgress(35);

  const terms1 = Math.ceil(prec / Math.log10(3)) + 6;
  function bs1(a, b) {
    if (b - a === 1) return [BigInt(2 * a + 1), 1n, 3n];
    const m = (a + b) >> 1;
    const [Q1, T1, p1] = bs1(a, m);
    const [Q2, T2, p2] = bs1(m, b);
    return [Q1 * Q2 * p1, T1 * Q2 * p1 + T2 * Q1, p1 * p2];
  }
  const [Q1, T1] = bs1(0, terms1);
  const sqrt3 = isqrt(3n * scale * scale);
  const lnTerm = (2n * sqrt3 * T1) / (3n * Q1);
  const part1 = (pi * lnTerm) / (8n * scale);
  reportProgress(65);

  const terms2 = Math.ceil(prec / Math.log10(4)) + 6;
  function bs2(a, b) {
    if (b - a === 1) {
      if (a === 0) return [1n, 1n, 1n];
      const k = BigInt(a);
      const P = k * (2n * k - 1n);
      const d = 2n * k + 1n;
      const Q = 2n * d * d;
      return [P, Q, P];
    }
    const m = (a + b) >> 1;
    const [P1, Q1b, T1b] = bs2(a, m);
    const [P2, Q2b, T2b] = bs2(m, b);
    return [P1 * P2, Q1b * Q2b, Q2b * T1b + P1 * T2b];
  }
  const [, Q2, T2] = bs2(0, terms2);
  const part2 = (3n * T2 * scale) / (8n * Q2);
  return part1 + part2;
}

function cubicNewtonProgressive(type, prec) {
  // Progressive precision doubling (30 -> 60 -> 120 -> ... -> prec)
  const steps = [];
  let p = prec;
  while (p > 30) {
    steps.push(p);
    p = Math.ceil(p / 2) + 4;
  }
  steps.push(30);
  steps.reverse();

  let X = type === "plastic" ? 1324717957244746025960908854478n : 1839286755214161132551852564653n;
  let curPrec = 30;
  for (let i = 0; i < steps.length; i++) {
    const targetP = steps[i];
    if (targetP > curPrec) {
      X = X * (10n ** BigInt(targetP - curPrec));
      curPrec = targetP;
    }
    const S = 10n ** BigInt(curPrec);
    const S2 = S * S;
    const X2 = X * X;
    if (type === "plastic") {
      // x_{k+1} = (2x^3 + 1) / (3x^2 - 1)
      const num = 2n * X2 * X + S2 * S;
      const den = 3n * X2 - S2;
      X = num / den;
    } else {
      // x_{k+1} = (2x^3 - x^2 + 1) / (3x^2 - 2x - 1)
      const num = 2n * X2 * X - X2 * S + S2 * S;
      const den = 3n * X2 - 2n * X * S - S2;
      X = num / den;
    }
    reportProgress(((i + 1) / steps.length) * 90);
  }
  return X;
}

function eulerGammaScaled(prec) {
  const scale = 10n ** BigInt(prec);
  const n = Math.ceil(0.6 * prec) + 8;
  const nBig = BigInt(n);
  const n2 = nBig * nBig;

  function atanhFrac(num, den) {
    const num2 = num * num;
    const den2 = den * den;
    let term = (num * scale) / den;
    let sum = term;
    let j = 1n;
    while (term !== 0n) {
      term = (term * num2) / den2;
      const add = term / (2n * j + 1n);
      if (add === 0n) break;
      sum += add;
      j++;
    }
    return sum;
  }

  const ln2 = 14n * atanhFrac(1n, 19n) - 4n * atanhFrac(1n, 49n) + 6n * atanhFrac(1n, 161n);
  const kBits = Math.round(Math.log2(n));
  const pow2 = 1n << BigInt(kBits);
  const lnN = BigInt(kBits) * ln2 + 2n * atanhFrac(nBig - pow2, nBig + pow2);

  let A = -lnN;
  let B = scale;
  let U = A;
  let V = B;
  const maxK = Math.ceil(3.75 * n) + 12;
  let lastPct = -1;
  for (let k = 1; k <= maxK; k++) {
    const kBig = BigInt(k);
    const k2 = kBig * kBig;
    B = (B * n2) / k2;
    A = (A * n2) / k2 + B / kBig;
    U += A;
    V += B;
    if (B === 0n && A === 0n) break;
    const pct = Math.floor((k / maxK) * 90);
    if (pct > lastPct) { lastPct = pct; reportProgress(pct); }
  }
  return (U * scale) / V;
}

function computeContinuedFraction(intStr, fracStr) {
  const sliceLen = Math.min(45, fracStr.length);
  const fracPart = fracStr.slice(0, sliceLen);
  let N = BigInt(intStr + fracPart);
  let D = 10n ** BigInt(sliceLen);

  const cf = [];
  const convergents = [];
  let pPrev = 0n, pCur = 1n;
  let qPrev = 1n, qCur = 0n;

  for (let i = 0; i < 18 && D > 0n; i++) {
    const a = N / D;
    const r = N % D;
    if (a > 1_000_000_000n) break;
    cf.push(Number(a));

    const pNext = a * pCur + pPrev;
    const qNext = a * qCur + qPrev;
    if (qNext > 1_000_000_000_000n) break;

    convergents.push({ num: pNext.toString(), den: qNext.toString() });
    pPrev = pCur; pCur = pNext;
    qPrev = qCur; qCur = qNext;

    N = D;
    D = r;
  }
  return { continuedFraction: cf, convergents };
}

function runConstant(params) {
  const t0 = performance.now();
  const { constantId, digits, customParam = 5 } = params;
  const guard = 20;
  const prec = Math.max(10, digits) + guard;
  const scale = 10n ** BigInt(prec);
  let rawScaled = 0n;
  let algorithmUsed = "";

  reportProgress(10);

  if (constantId === "pi") {
    algorithmUsed = "Chudnovsky Binary Splitting";
    rawScaled = piScaled(prec);
  } else if (constantId === "tau") {
    algorithmUsed = "Chudnovsky Binary Splitting (2π)";
    rawScaled = piScaled(prec) * 2n;
  } else if (constantId === "e") {
    algorithmUsed = "Taylor Binary Splitting";
    rawScaled = eScaled(prec);
  } else if (constantId === "phi") {
    algorithmUsed = "Newton BigInt √5";
    rawScaled = (scale + isqrt(5n * scale * scale)) / 2n;
  } else if (constantId === "sqrt2") {
    algorithmUsed = "Newton BigInt √2";
    rawScaled = isqrt(2n * scale * scale);
  } else if (constantId === "sqrt3") {
    algorithmUsed = "Newton BigInt √3";
    rawScaled = isqrt(3n * scale * scale);
  } else if (constantId === "silver") {
    algorithmUsed = "Newton BigInt (1 + √2)";
    rawScaled = scale + isqrt(2n * scale * scale);
  } else if (constantId === "custom_sqrt") {
    const k = Math.max(2, Math.floor(customParam));
    algorithmUsed = "Newton BigInt √" + k;
    rawScaled = isqrt(BigInt(k) * scale * scale);
  } else if (constantId === "ln2") {
    algorithmUsed = "Machin atanh Binary Splitting";
    const a19 = atanhInvBS(19, prec); reportProgress(35);
    const a49 = atanhInvBS(49, prec); reportProgress(65);
    const a161 = atanhInvBS(161, prec);
    rawScaled = 14n * a19 - 4n * a49 + 6n * a161;
  } else if (constantId === "ln10") {
    algorithmUsed = "Machin atanh Binary Splitting";
    const a19 = atanhInvBS(19, prec); reportProgress(35);
    const a49 = atanhInvBS(49, prec); reportProgress(65);
    const a161 = atanhInvBS(161, prec);
    rawScaled = 46n * a19 - 12n * a49 + 20n * a161;
  } else if (constantId === "apery") {
    algorithmUsed = "Amdeberhan-Zeilberger Binary Splitting";
    rawScaled = aperyScaled(prec);
  } else if (constantId === "catalan_g") {
    algorithmUsed = "Ramanujan + Chudnovsky Binary Splitting";
    rawScaled = catalanGScaled(prec);
  } else if (constantId === "plastic") {
    algorithmUsed = "Cubic Newton-Raphson (BigInt)";
    rawScaled = cubicNewtonProgressive("plastic", prec);
  } else if (constantId === "tribonacci_const") {
    algorithmUsed = "Cubic Newton-Raphson (BigInt)";
    rawScaled = cubicNewtonProgressive("tribonacci", prec);
  } else if (constantId === "gamma") {
    algorithmUsed = "Brent-McMillan Bessel Series";
    rawScaled = eulerGammaScaled(prec);
  }

  reportProgress(94);
  const fullStr = rawScaled.toString().padStart(prec + 1, "0");
  const intLen = fullStr.length - prec;
  const integerPart = fullStr.slice(0, intLen);
  const fractionalDigits = fullStr.slice(intLen, intLen + digits);

  const { continuedFraction, convergents } = computeContinuedFraction(integerPart, fractionalDigits);

  reportProgress(100);
  const elapsedMs = Math.round((performance.now() - t0) * 100) / 100;

  return {
    constantId,
    customParam: constantId === "custom_sqrt" ? Math.max(2, Math.floor(customParam)) : undefined,
    integerPart,
    fractionalDigits,
    totalDigits: fractionalDigits.length,
    elapsedMs,
    algorithmUsed,
    continuedFraction,
    convergents,
  };
}

self.onmessage = function(ev) {
  const { id, kind, params } = ev.data;
  try {
    const result = kind === "sequence" ? runSequence(params) : runConstant(params);
    self.postMessage({ type: "done", id, result });
  } catch (err) {
    self.postMessage({ type: "error", id, message: err && err.message ? err.message : String(err) });
  }
};
`;
}

export class MathComputeEngine {
  private worker: Worker | null = null;
  private blobUrl: string | null = null;

  private spawn(): Worker {
    this.terminate();
    const src = buildWorkerSource();
    this.blobUrl = URL.createObjectURL(new Blob([src], { type: "application/javascript" }));
    this.worker = new Worker(this.blobUrl);
    return this.worker;
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }

  public runSequence(
    params: SequenceRunParams,
    onProgress: (pct: number) => void
  ): Promise<SequenceResult> {
    return this.execute<SequenceResult>("sequence", params, onProgress);
  }

  public runConstant(
    params: ConstantRunParams,
    onProgress: (pct: number) => void
  ): Promise<ConstantResult> {
    return this.execute<ConstantResult>("constant", params, onProgress);
  }

  private execute<T>(
    kind: "sequence" | "constant",
    params: SequenceRunParams | ConstantRunParams,
    onProgress: (pct: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = this.spawn();
      const jobId = Math.random().toString(36).slice(2);

      worker.onmessage = (ev) => {
        const msg = ev.data;
        if (msg.type === "progress") {
          onProgress(msg.pct);
        } else if (msg.type === "done" && msg.id === jobId) {
          this.terminate();
          resolve(msg.result as T);
        } else if (msg.type === "error" && msg.id === jobId) {
          this.terminate();
          reject(new Error(msg.message));
        }
      };

      worker.onerror = (err) => {
        this.terminate();
        reject(new Error(err.message || "Worker computation error"));
      };

      worker.postMessage({ id: jobId, kind, params });
    });
  }
}

export { buildWorkerSource as _buildWorkerSourceForTest };
