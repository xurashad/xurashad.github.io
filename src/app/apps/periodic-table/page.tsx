import type { Metadata } from "next";
import { PeriodicTableApp } from "./PeriodicTableApp";

export const metadata: Metadata = {
  title: "Interactive Periodic Table with 3D Atom Models | Rashad Hamidi",
  description:
    "Explore all 118 elements with interactive 3D atom models, property heatmaps, element comparison, and detailed electron configurations. A premium chemistry visualization tool.",
  keywords: [
    "periodic table", "chemistry", "elements", "3D atom model", "atomic",
    "electron configuration", "Bohr model", "interactive", "science",
    "element comparison", "heatmap", "electronegativity", "melting point",
  ],
};

export default function PeriodicTablePage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-violet-900/15 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-emerald-900/10 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Science · Chemistry · 3D Visualization
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Interactive</span>{" "}
            <span className="text-foreground/60">Periodic Table</span>
          </h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">
            All 118 elements at your fingertips. Explore 3D atom models with orbiting electrons,
            visualize property heatmaps, compare elements side-by-side, and dive deep into
            electron configurations and ionization energies.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              "118 Elements",
              "3D Atom Models",
              "Property Heatmaps",
              "Element Comparison",
              "Electron Configurations",
              "Interactive Search",
              "Ionization Energies",
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
        <PeriodicTableApp />
      </div>
    </div>
  );
}
