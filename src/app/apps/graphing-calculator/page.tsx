import type { Metadata } from "next";
import { GraphingCalculator } from "./GraphingCalculator";

export const metadata: Metadata = {
  title: "Graphing Calculator",
  description:
    "Plot explicit and implicit mathematical equations on an interactive SVG canvas. Pan, zoom, toggle the grid, add unlimited equations with custom colours, and export the result as PNG or SVG — all in the browser.",
  keywords: [
    "graphing calculator", "equation plotter", "implicit equations",
    "SVG graph", "mathematics", "function plotter", "online calculator",
  ],
};

export default function GraphingCalculatorPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 rounded-full bg-olive/4 blur-[120px]" />
      </div>

      <div className="section-container py-16 pb-24">
        {/* Header */}
        <div className="mb-8">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Utilities · Mathematics
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Graphing</span>{" "}
            <span className="text-foreground/60">Calculator</span>
          </h1>
          <p className="text-foreground/50 max-w-xl leading-relaxed">
            Plot any explicit or implicit equation on a real-time SVG canvas.
            Pan and zoom freely, toggle the grid, and export your graph at any resolution.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              "Explicit: y = f(x)",
              "Implicit: f(x,y) = 0",
              "Pan & zoom (scroll + pinch)",
              "Custom colours",
              "12 presets",
              "Export PNG / SVG",
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
        <GraphingCalculator />

        {/* Syntax guide */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {[
            { title: "Operators", items: ["+ − * /", "^ (power)", "( ) for grouping"] },
            { title: "Functions", items: ["sin cos tan", "sqrt abs exp ln", "floor ceil round max min"] },
            { title: "Constants & Implicit", items: ["pi = π, e = Euler's number", "y = 2*x+1  (explicit)", "x^2 + y^2 = 25  (implicit)"] },
          ].map((g) => (
            <div key={g.title} className="glass-card p-4 space-y-2">
              <h3 className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest">{g.title}</h3>
              {g.items.map((item) => (
                <p key={item} className="text-xs font-mono text-foreground/55">{item}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
