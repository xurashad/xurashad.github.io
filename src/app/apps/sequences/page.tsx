import { Suspense } from "react";
import type { Metadata } from "next";
import { SequencesStudio } from "./SequencesStudio";

export const metadata: Metadata = {
  title: "Sequences & Constants Studio",
  description:
    "Compute 19 famous mathematical sequences (Fibonacci, Lucas, Segmented-Sieve Primes, Mersenne, Catalan, Partitions, Recamán) and 15 arbitrary-precision irrational constants (π, τ, e, φ, √2, ln 2, ζ(3), G, γ) locally via Web Worker BigInt algorithms.",
  keywords: [
    "Fibonacci",
    "Prime numbers",
    "Segmented Sieve",
    "Pi generator",
    "Golden ratio",
    "Euler number",
    "Irrational constants",
    "OEIS sequences",
    "Ulam spiral",
    "Continued fractions",
    "Number theory",
  ],
};

export default function SequencesPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/4 blur-[120px]" />
      </div>

      <div className="section-container py-16 pb-32">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-mono text-quantum/65 tracking-widest uppercase mb-3">
            {"// Mathematics · Number Theory · Arbitrary Precision"}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Sequences &amp; Constants</span>{" "}
            <span className="text-foreground/70">Studio</span>
          </h1>
          <p className="text-foreground/60 max-w-2xl leading-relaxed">
            Compute 19 iconic integer sequences and 15 arbitrary-precision irrational &amp;
            transcendental constants locally in a dedicated Web Worker — featuring Fast Doubling,
            a segmented bit-packed prime sieve, Chudnovsky binary splitting, Ulam/Sacks spirals,
            digit normality analysis, and a live number theory lab.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              "19 Famous OEIS Sequences",
              "15 Irrational Constants (π, φ, e, ζ(3), γ)",
              "Segmented Bitset Prime Sieve",
              "Chudnovsky & Fast Doubling",
              "Ulam / Sacks Spirals & Digit Walks",
              "Miller–Rabin & Factorization Lab",
              "JSON / CSV / TXT Export",
            ].map((f) => (
              <span
                key={f}
                className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-quantum/25 bg-quantum/8 text-quantum/80 dark:text-quantum/70"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Studio */}
        <Suspense
          fallback={
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f1c]/70 text-sm font-mono text-slate-500">
              Loading Sequences &amp; Constants Studio…
            </div>
          }
        >
          <SequencesStudio />
        </Suspense>
      </div>
    </div>
  );
}
