import type { Metadata } from "next";
import { GraphingCalculator } from "./GraphingCalculator";

export const metadata: Metadata = {
  title: "Graphing Calculator · Desmos-Grade Function Plotter",
  description:
    "Desmos-grade graphing calculator for plotting explicit functions, implicit curves, inequalities, vertical lines, and points. Features interactive sliders, curve tracing, virtual math keypad, and high-resolution export.",
  keywords: [
    "graphing calculator", "desmos alternative", "equation plotter",
    "implicit equations", "math calculator", "function plotter", "online calculator",
  ],
};

export default function GraphingCalculatorPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 rounded-full bg-olive/4 blur-[120px]" />
      </div>

      <div className="section-container py-12 sm:py-16 pb-24">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="text-xs font-mono text-quantum/60 tracking-widest uppercase mb-2">
            {"// Utilities · Mathematics"}
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold mb-3 sm:mb-4 tracking-tight">
            <span className="gradient-text-quantum">Graphing</span>{" "}
            <span className="text-foreground/70">Calculator</span>
          </h1>
          <p className="text-foreground/55 max-w-2xl leading-relaxed text-sm sm:text-base">
            Desmos-style graphing calculator. Plot explicit functions, implicit relations, inequalities,
            and points with interactive variable sliders, curve tracing, virtual math keypad, and smooth multi-touch gestures.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-4 sm:mt-5">
            {[
              "Explicit: y = f(x)",
              "Implicit: f(x,y) = 0",
              "Inequalities: y ≤ f(x)",
              "Sliders: a = 2 (Animated)",
              "Implicit Multiplication: 2x, 3sin(x)",
              "Key Points & Curve Probe",
              "Virtual Math Keypad",
              "Export PNG (2×) / SVG",
            ].map((f) => (
              <span
                key={f}
                className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-quantum/20 bg-quantum/5 text-quantum/70 shadow-sm"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* App */}
        <GraphingCalculator />

        {/* Syntax guide */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Expressions & Variables",
              items: [
                "2x + 1  (implicit mult)",
                "3x^2 - 4x + 1",
                "a = 2  (creates a slider)",
                "y = a*sin(x)",
              ],
            },
            {
              title: "Functions & Trig",
              items: [
                "sin, cos, tan, sec, csc, cot",
                "arcsin, arccos, arctan",
                "sqrt, abs, exp, ln, log",
                "floor, ceil, round, sign",
              ],
            },
            {
              title: "Relations & Curves",
              items: [
                "x^2 + y^2 = 25  (circle)",
                "x^2/16 + y^2/9 = 1  (ellipse)",
                "y <= sin(x)  (shaded region)",
                "x = 3  (vertical line)",
              ],
            },
            {
              title: "Points & Constants",
              items: [
                "(3, 4)  (plots point)",
                "pi = 3.14159...",
                "e = 2.71828...",
                "Hover curve for probe (x, y)",
              ],
            },
          ].map((g) => (
            <div key={g.title} className="glass-card p-4 space-y-2 border border-white/5 bg-white/[0.02]">
              <h3 className="text-[10px] font-mono text-quantum/70 uppercase tracking-widest font-semibold">
                {g.title}
              </h3>
              {g.items.map((item) => (
                <p key={item} className="text-xs font-mono text-foreground/60">
                  {item}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
