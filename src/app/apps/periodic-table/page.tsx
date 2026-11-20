import type { Metadata } from "next";
import { PeriodicTableApp } from "./PeriodicTableApp";

export const metadata: Metadata = {
  title: "Interactive Periodic Table with 3D Atom & Orbital Models | Rashad Hamidi",
  description:
    "Explore all 118 elements with packed 3D Bohr nuclei, 3D quantum orbital clouds, live temperature state simulation, optical emission spectra, cosmic origins, discovery timeline, periodic trends, and side-by-side comparison.",
  keywords: [
    "periodic table",
    "chemistry",
    "elements",
    "3D atom model",
    "quantum orbitals",
    "electron configuration",
    "emission spectrum",
    "temperature simulator",
    "periodic trends",
    "element comparison",
    "heatmap",
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
        <div className="mb-8">
          <div className="text-xs font-mono text-quantum/65 tracking-widest uppercase mb-3">
            {"// Science · Chemistry · Quantum & 3D Visualization"}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Interactive</span>{" "}
            <span className="text-foreground/70">Periodic Table</span>
          </h1>
          <p className="text-foreground/60 max-w-2xl leading-relaxed">
            Explore all 118 elements with 3D packed-nucleon Bohr models and quantum orbital clouds,
            a live temperature state-of-matter simulator, physical optical emission spectra,
            astrophysical cosmic origins, discovery timeline, and interactive periodic trends.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mt-5">
            {[
              "3D Bohr & Quantum Orbitals",
              "Temperature Simulator (0–6500 K)",
              "Optical Emission Spectra",
              "Cosmic Origins",
              "Discovery Time-Lapse",
              "Periodic Trends Chart",
              "18 & 32-Col Layouts",
              "Side-by-Side Comparison",
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

        {/* App */}
        <PeriodicTableApp />
      </div>
    </div>
  );
}
