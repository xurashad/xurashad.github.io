/**
 * Prime number computation utilities.
 *
 * - isPrime: O(√n) trial-division with 6k±1 optimisation.
 * - generatePrimes: naive sequential scan (fine up to ~1 M primes).
 * - sieveOfEratosthenes: fast batch sieve for "all primes up to N".
 * - downloadJSON: triggers a file download in the browser.
 */

export interface PrimeEntry {
  n: number;   // 1-based ordinal
  prime: number;
}

/** O(√n) primality test with 6k±1 short-circuit. */
export function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

/**
 * Generate the first `count` primes via sequential scan.
 * Yields control to the event loop on every progress tick so the UI
 * stays responsive.
 */
export async function generatePrimesAsync(
  count: number,
  onProgress: (pct: number) => void,
): Promise<PrimeEntry[]> {
  if (count <= 0) { onProgress(100); return []; }

  const primes: PrimeEntry[] = [];
  let num = 2;
  let lastPct = -1;

  while (primes.length < count) {
    if (isPrime(num)) {
      primes.push({ n: primes.length + 1, prime: num });

      const pct = Math.floor((primes.length / count) * 100);
      if (pct > lastPct) {
        onProgress(pct);
        lastPct = pct;
        // Yield every 500 primes to keep UI responsive
        if (primes.length % 500 === 0) {
          await new Promise<void>((r) => setTimeout(r, 0));
        }
      }
    }
    num++;
  }

  if (lastPct < 100) onProgress(100);
  return primes;
}

/**
 * Sieve of Eratosthenes — find all primes ≤ `limit`.
 * Much faster than sequential scan for dense ranges.
 */
export function sieve(limit: number): number[] {
  if (limit < 2) return [];
  const composite = new Uint8Array(limit + 1);
  const result: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (!composite[i]) {
      result.push(i);
      for (let j = i * i; j <= limit; j += i) composite[j] = 1;
    }
  }
  return result;
}

/** Download arbitrary data as a JSON file. */
export function downloadJSON(data: unknown, filename: string): void {
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

/** Approximate upper bound for the Nth prime via the prime number theorem. */
export function approxNthPrime(n: number): number {
  if (n < 6) return 15;
  return Math.ceil(n * (Math.log(n) + Math.log(Math.log(n))));
}
