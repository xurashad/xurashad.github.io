import type { Metadata } from "next";
import { PrimeApp } from "./PrimeApp";

export const metadata: Metadata = {
  title: "Prime Sequence Generator",
  description:
    "Generate the first n prime numbers using an optimised trial-division algorithm. Preview results directly in the browser and download the full sequence as a structured JSON file — all computed locally, no server needed.",
  keywords: [
    "prime numbers", "prime sequence", "prime generator", "sieve of eratosthenes",
    "mathematics", "JSON download", "number theory",
  ],
};

export default function PrimePage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-olive/4 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 rounded-full bg-quantum/4 blur-[120px]" />
      </div>

      <div className="section-container py-16 pb-32">
        {/* Header */}
        <div className="mb-12">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Utilities · Mathematics
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Prime</span>{" "}
            <span className="text-foreground/60">Generator</span>
          </h1>
          <p className="text-foreground/50 max-w-xl leading-relaxed">
            Generate the first <em>n</em> prime numbers using a fast{" "}
            <span className="text-quantum/70 font-mono">6k±1</span> trial-division algorithm.
            Preview results in-browser, filter them, and download as JSON.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              "Up to 1 M primes (default)",
              "Async with progress bar",
              "Stop mid-generation",
              "Filter results",
              "JSON download",
              "Client-side only",
            ].map((f) => (
              <span
                key={f}
                className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-quantum/20 bg-quantum/5 text-quantum/60"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* App */}
        <PrimeApp />
      </div>
    </div>
  );
}
