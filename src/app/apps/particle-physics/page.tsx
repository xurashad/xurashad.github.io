import type { Metadata } from "next";
import { ParticleVisualizer } from "./ParticleVisualizer";

export const metadata: Metadata = {
  title: "Particle Physics Visualizer",
  description:
    "Explore the fundamental and composite building blocks of the universe. Browse the Standard Model, Supersymmetric partners, and Hadrons with sortable, searchable particle cards showing mass, charge, spin, and quark composition.",
  keywords: [
    "particle physics", "standard model", "supersymmetry", "hadrons",
    "quarks", "leptons", "bosons", "fermions", "physics visualizer",
  ],
};

export default function ParticlePhysicsPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-violet-900/15 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full bg-olive/3 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">
        {/* Header */}
        <div className="mb-12">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Science · Physics
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Particle Physics</span>{" "}
            <span className="text-foreground/60">Visualizer</span>
          </h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">
            Explore the fundamental and composite building blocks of the universe.
            From quarks and leptons to supersymmetric partners and composite hadrons —
            sorted, searchable, and colour-coded by family.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              "Standard Model (17 particles)",
              "Supersymmetry (18 sparticles)",
              "Hadrons (14 particles)",
              "Search & filter",
              "Sort by mass / charge / spin",
              "Colour-coded families",
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
        <ParticleVisualizer />
      </div>
    </div>
  );
}
