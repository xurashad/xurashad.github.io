import type { Metadata } from "next";
import { ChessGame } from "./ChessGame";

export const metadata: Metadata = {
  title: "Celestial Chess",
  description:
    "A fully-featured celestial-themed chess game. Supports all legal moves — castling, en passant, pawn promotion. Play against a friend (PvP) or challenge the computer (alpha-beta minimax AI at depth 3). Features move notation, captured-piece display, board flip, and undo.",
  keywords: [
    "chess", "celestial chess", "online chess", "chess game", "browser chess",
    "en passant", "castling", "pawn promotion", "chess AI",
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

      <div className="section-container py-16 pb-28">
        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Games · Strategy
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Celestial</span>{" "}
            <span className="text-foreground/60">Chess</span>
          </h1>
          <p className="text-foreground/45 max-w-xl leading-relaxed">
            A beautiful chess game with full rule support — castling, en passant,
            pawn promotion, check, checkmate and stalemate detection. Face a friend
            or challenge the AI.
          </p>

          <div className="flex flex-wrap gap-2 mt-5">
            {[
              "All legal moves", "En passant", "Castling",
              "Pawn promotion", "Alpha-beta AI (depth 3)",
              "Move notation", "Undo", "Board flip",
            ].map(f => (
              <span key={f} className="text-[11px] font-mono px-2.5 py-1 rounded-full border border-quantum/20 bg-quantum/5 text-quantum/60">
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
