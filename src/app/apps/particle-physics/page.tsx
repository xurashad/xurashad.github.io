import type { Metadata } from "next";
import { ParticleVisualizer } from "./ParticleVisualizer";

export const metadata: Metadata = {
  title: "Particle Physics Visualizer",
  description:
    "Explore the fundamental and composite building blocks of the universe in an interactive 3D Quantum Chamber, force-coupling Standard Model matrix, QCD hadron confinement visualizer, and logarithmic mass spectrum.",
  keywords: [
    "particle physics", "standard model", "supersymmetry", "hadrons",
    "quarks", "leptons", "bosons", "fermions", "3D physics visualizer", "QCD confinement",
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
        <div className="mb-10">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            {"// Science · Physics · 3D Quantum Visualization"}
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Particle Physics</span>{" "}
            <span className="text-foreground/60">Visualizer</span>
          </h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">
            Explore the fundamental and composite building blocks of the universe in real-time 3D.
            Inspect electromagnetic waves, Mexican-hat scalar fields, live QCD quark confinement,
            force-coupling periodic matrices, and logarithmic mass spectra across 49 particles.
          </p>

          {/* Feature chips */}
          <div className="flex flex-wrap gap-2 mt-6">
            {[
              "3D Quantum Chamber",
              "Standard Model Force Matrix",
              "QCD Quark Confinement",
              "Matter ↔ Antimatter",
              "Logarithmic Mass Spectrum",
              "49 Particles",
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
