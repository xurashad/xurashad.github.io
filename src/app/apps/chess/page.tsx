import type { Metadata } from "next";
import { ChessGame } from "./ChessGame";

export const metadata: Metadata = {
  title: "Celestial Chess",
  description:
    "A luxury celestial-themed 3D and 2D chess game with sculpted Staunton pieces, four artisanal themes, tactical hints, move replay, chess clocks, PGN export, and Web Audio soundscape.",
  keywords: [
    "chess",
    "celestial chess",
    "3D chess",
    "online chess",
    "chess game",
    "browser chess",
    "en passant",
    "castling",
    "pawn promotion",
    "chess AI",
  ],
};

export default function ChessPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-24 w-[500px] h-[500px] rounded-full bg-violet-900/20 blur-[140px]" />
        <div className="absolute bottom-1/4 -right-24 w-96 h-96 rounded-full bg-cyan-900/15 blur-[130px]" />
        <div className="absolute top-2/3 left-1/3 w-64 h-64 rounded-full bg-fuchsia-900/10 blur-[100px]" />
      </div>

      <div className="section-container pt-6 sm:pt-8 pb-16">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-quantum/15 pb-4">
          <div>
            <div className="text-[11px] font-mono text-quantum/75 tracking-widest uppercase mb-1">
              {"// Games · Grandmaster Strategy"}
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold">
              <span className="gradient-text-quantum">Celestial</span>{" "}
              <span className="text-foreground/80">Chess</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-1.5 max-w-xl">
            {[
              "Sculpted 3D & 2D",
              "4 Luxury Themes",
              "FIDE Rules",
              "Tactical Hints",
              "Move Replay",
              "Chess Clocks",
              "Drag & Drop",
              "PGN Export",
              "Web Audio SFX",
              "3 AI Levels",
            ].map((f) => (
              <span
                key={f}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-quantum/25 bg-quantum/10 text-quantum/85"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <ChessGame />
      </div>
    </div>
  );
}
