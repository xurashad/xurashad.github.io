import type { Metadata } from "next";
import { Game2048Client } from "./Game2048Client";

export const metadata: Metadata = {
  title: "2048 Studio — Astro-Celestial",
  description:
    "An enhanced 2048 puzzle studio featuring 3×3 to 6×6 boards, Classic, Fibonacci, Zen, and Singularity variants, seeded Daily Challenges, Expectimax AI Coach & Auto-Play, Swap & Smash power-ups, 5 artisanal themes, Web Audio harmonics, and persistent achievements.",
  keywords: [
    "2048",
    "2048 game",
    "fibonacci 2048",
    "tile puzzle",
    "expectimax AI",
    "daily puzzle",
    "browser game",
  ],
};

export default function Page2048() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-24 w-96 h-96 rounded-full bg-violet-900/20 blur-[130px]" />
        <div className="absolute bottom-1/3 -right-24 w-80 h-80 rounded-full bg-fuchsia-900/15 blur-[120px]" />
        <div className="absolute top-2/3 left-1/3 w-72 h-72 rounded-full bg-cyan-900/12 blur-[110px]" />
      </div>

      <div className="section-container pt-6 sm:pt-8 pb-20 flex flex-col items-center">
        {/* Editorial Header */}
        <div className="w-full max-w-[920px] mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-quantum/15 pb-4">
          <div>
            <div className="text-[11px] font-mono text-quantum/75 tracking-widest uppercase mb-1">
              {"// Games · Tactical Number Puzzle"}
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold">
              <span className="gradient-text-quantum">2048</span>{" "}
              <span className="text-foreground/85">Studio</span>
            </h1>
            <p className="text-foreground/60 max-w-md text-xs sm:text-sm mt-1.5 leading-relaxed">
              Slide matching tiles to synthesize higher tiers. Master four game
              variants, seeded Daily Challenges, and Expectimax AI analysis.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 max-w-md">
            {[
              "3×3 to 6×6 Grids",
              "4 Variants",
              "Daily Challenge",
              "Expectimax AI",
              "Swap & Smash",
              "5 Themes",
              "Web Audio SFX",
              "Achievements",
            ].map((pill) => (
              <span
                key={pill}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-quantum/25 bg-quantum/10 text-quantum/90"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Interactive Game Studio */}
        <Game2048Client />

        {/* Mode & Strategy Overview */}
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[920px] w-full">
          {[
            {
              title: "Corner Anchor",
              body: "Keep your highest tile tucked in one corner and chain descending values along an adjacent edge.",
            },
            {
              title: "Four Variants",
              body: "Switch between Classic, adjacent-sum Fibonacci, relaxed Zen, and obstacle-split Singularity.",
            },
            {
              title: "Daily Seed",
              body: "Compete on today's deterministic 4×4 Classic board with zero undos or power-ups.",
            },
            {
              title: "AI Coach & Tools",
              body: "Use H for Expectimax hints, Z to undo, or earn Swap and Smash power-ups at 512+ milestones.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="glass-card border border-[var(--surface-border)] p-4 space-y-1.5"
            >
              <h2 className="text-xs font-mono text-quantum/80 uppercase tracking-widest">
                {c.title}
              </h2>
              <p className="text-xs text-foreground/65 leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
