import type { Metadata } from "next";
import { FibonacciApp } from "./FibonacciApp";

export const metadata: Metadata = {
  title: "Fibonacci Generator",
  description:
    "Generate Fibonacci sequences of arbitrary precision using BigInt arithmetic. Download the full sequence or just the Nth Fibonacci number as a JSON file — all computed locally in your browser.",
  keywords: [
    "Fibonacci sequence", "Fibonacci generator", "BigInt", "arbitrary precision",
    "JSON download", "mathematics", "sequence generator",
  ],
};

export default function FibonacciPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 rounded-full bg-olive/4 blur-[120px]" />
      </div>

      <div className="section-container py-16 pb-32">
        {/* Header */}
        <div className="mb-12">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Utilities · Mathematics
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Fibonacci</span>{" "}
            <span className="text-foreground/60">Generator</span>
          </h1>
          <p className="text-foreground/50 max-w-xl leading-relaxed">
            Generate Fibonacci sequences of arbitrary size using{" "}
            <span className="text-quantum/70 font-mono">BigInt</span> arithmetic — no precision
            loss at any scale. Download the full sequence or just the Nth number as JSON.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              "Unlimited precision (BigInt)",
              "Full sequence or Nth value",
              "Real-time progress bar",
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
        <FibonacciApp />
      </div>
    </div>
  );
}
