import type { Metadata } from "next";
import { Game2048 } from "./Game2048";

export const metadata: Metadata = {
  title: "2048 — Astro-Celestial",
  description:
    "Slide numbered tiles on a 4×4 grid to combine them and reach the legendary 2048 tile. Featuring a beautiful cosmic purple-to-pink colour scheme, smooth animations, keyboard & swipe controls, best-score tracking, and a win/game-over overlay.",
  keywords: ["2048", "tile game", "puzzle", "mathematics", "casual game", "browser game"],
};

export default function Page2048() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-24 w-96 h-96 rounded-full bg-violet-900/20 blur-[130px]" />
        <div className="absolute bottom-1/3 -right-24 w-80 h-80 rounded-full bg-fuchsia-900/15 blur-[120px]" />
      </div>

      <div className="section-container py-16 pb-24 flex flex-col items-center">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Games · Puzzle
          </div>
          <h1 className="sr-only">2048 Tile Game</h1>
          <p className="text-foreground/45 max-w-sm leading-relaxed text-sm">
            Combine matching tiles by sliding them in any direction.
            Reach the <span className="text-fuchsia-400 font-semibold">2048</span> tile to win!
          </p>
        </div>

        {/* Game */}
        <Game2048 />

        {/* How to play */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-lg w-full">
          {[
            { title: "Slide",     body: "Use arrow keys or WASD (keyboard) or swipe (mobile) to slide all tiles." },
            { title: "Merge",     body: "When two tiles with the same number collide, they merge into one." },
            { title: "Reach 2048",body: "Keep merging until you create a 2048 tile — then you win!" },
          ].map((c) => (
            <div key={c.title} className="glass-card p-4 space-y-1">
              <h3 className="text-xs font-mono text-foreground/30 uppercase tracking-widest">{c.title}</h3>
              <p className="text-xs text-foreground/50 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
