"use client";

import { memo, useId } from "react";
import { ChessPieceSVG } from "./ChessPieceSVG";
import type { Board, Move, Square, Color } from "./lib/types";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

interface Props {
  board: Board;
  flipped?: boolean;
  selected: Square | null;
  validMoves: Move[];
  lastMove: Move | null;
  checkSquare: Square | null;
  currentTurn?: Color;
  onSquareClick: (sq: Square) => void;
  onDropPiece?: (from: Square, to: Square) => void;
  disabled?: boolean;
}

export const ChessBoard = memo(function ChessBoard({
  board,
  flipped = false,
  selected,
  validMoves,
  lastMove,
  checkSquare,
  currentTurn,
  onSquareClick,
  onDropPiece,
  disabled,
}: Props) {
  const boardId = useId();

  // Grid rows & cols:
  // Standard (flipped = false): White at bottom.
  // Row 0 (rank 8, Black pieces) at top, Row 7 (rank 1, White pieces) at bottom.
  // Col 0 (file 'a') on left, Col 7 (file 'h') on right.
  const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        disabled ? "opacity-70 pointer-events-none" : ""
      }`}
      style={{
        aspectRatio: "1 / 1",
        border: "2px solid rgba(140, 100, 255, 0.35)",
        boxShadow: `
          0 0 50px rgba(100, 60, 255, 0.22),
          0 0 100px rgba(70, 30, 180, 0.12),
          inset 0 0 40px rgba(50, 20, 130, 0.2)
        `,
      }}
    >
      {/* SVG definitions for board filters */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id={`nebula-glow-${boardId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* Board squares */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full select-none">
        {rows.map((r) =>
          cols.map((c) => {
            // FIDE standard: h1 (r=7, c=7) is light -> (r + c) % 2 === 0
            const isLight = (r + c) % 2 === 0;
            const isSelected = selected?.row === r && selected?.col === c;
            const isValidDest = validMoves.some((m) => m.to.row === r && m.to.col === c);
            const isCaptureDest = isValidDest && (!!board[r][c] || (validMoves.some(m => m.to.row === r && m.to.col === c && !!m.enPassantCapture)));
            const isLastFrom = lastMove?.from.row === r && lastMove?.from.col === c;
            const isLastTo = lastMove?.to.row === r && lastMove?.to.col === c;
            const isCheck = checkSquare?.row === r && checkSquare?.col === c;

            const piece = board[r][c];

            // Cosmic square styles
            let bg: string;
            let extraStyle: React.CSSProperties = {};

            if (isSelected) {
              bg = "rgba(70, 200, 255, 0.42)";
              extraStyle = {
                boxShadow: "inset 0 0 22px rgba(80, 210, 255, 0.5), 0 0 12px rgba(80, 210, 255, 0.3)",
              };
            } else if (isCheck) {
              bg = "rgba(235, 45, 65, 0.55)";
              extraStyle = {
                boxShadow: "inset 0 0 24px rgba(255, 70, 70, 0.6), 0 0 16px rgba(255, 40, 40, 0.5)",
                animation: "check-pulse 1.3s ease-in-out infinite",
              };
            } else if (isLastTo) {
              bg = isLight ? "rgba(140, 240, 160, 0.32)" : "rgba(100, 210, 120, 0.28)";
              extraStyle = {
                boxShadow: "inset 0 0 14px rgba(120, 255, 150, 0.25)",
              };
            } else if (isLastFrom) {
              bg = isLight ? "rgba(140, 240, 160, 0.18)" : "rgba(100, 210, 120, 0.15)";
            } else {
              bg = isLight
                ? "rgba(215, 205, 255, 0.15)"
                : "rgba(42, 18, 88, 0.65)";
            }

            const isBottomRow = r === (flipped ? 0 : 7);
            const isLeftCol = c === (flipped ? 7 : 0);

            return (
              <div
                key={`${r}-${c}`}
                className="relative flex items-center justify-center cursor-pointer transition-all duration-150 hover:brightness-110 active:brightness-95"
                style={{ background: bg, ...extraStyle }}
                onClick={() => !disabled && onSquareClick({ row: r, col: c })}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (disabled) return;
                  try {
                    const raw = e.dataTransfer.getData("application/json");
                    if (raw) {
                      const from = JSON.parse(raw) as Square;
                      if (onDropPiece) {
                        onDropPiece(from, { row: r, col: c });
                      } else {
                        onSquareClick({ row: r, col: c });
                      }
                    }
                  } catch {
                    // Ignore drop parse error
                  }
                }}
              >
                {/* Subtle starlight grid texture on dark squares */}
                {!isLight && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.05]"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, rgba(255, 255, 255, 0.2) 25%, transparent 25%,
                        transparent 75%, rgba(255, 255, 255, 0.2) 75%),
                        linear-gradient(45deg, rgba(255, 255, 255, 0.2) 25%, transparent 25%,
                        transparent 75%, rgba(255, 255, 255, 0.2) 75%)
                      `,
                      backgroundSize: "10px 10px",
                      backgroundPosition: "0 0, 5px 5px",
                    }}
                  />
                )}

                {/* Valid-move indicator */}
                {isValidDest && (
                  isCaptureDest ? (
                    <div
                      className="absolute inset-0 z-10 pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, transparent 52%, rgba(90, 225, 255, 0.45) 54%, rgba(90, 225, 255, 0.15) 100%)",
                        boxShadow: "inset 0 0 10px rgba(80, 210, 255, 0.3)",
                      }}
                    />
                  ) : (
                    <div
                      className="absolute w-[30%] h-[30%] rounded-full z-10 pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, rgba(90, 225, 255, 0.7) 0%, rgba(70, 180, 255, 0.3) 70%, transparent 100%)",
                        boxShadow: "0 0 10px rgba(80, 210, 255, 0.5)",
                        animation: "move-dot-pulse 2s ease-in-out infinite",
                      }}
                    />
                  )
                )}

                {/* Piece with responsive scaling & drag support */}
                {piece && (
                  <div
                    draggable={!disabled && (!currentTurn || piece.color === currentTurn)}
                    onDragStart={(e) => {
                      if (disabled) return;
                      e.dataTransfer.setData("application/json", JSON.stringify({ row: r, col: c }));
                      e.dataTransfer.effectAllowed = "move";
                      onSquareClick({ row: r, col: c });
                    }}
                    className={`z-20 w-[82%] h-[82%] flex items-center justify-center transition-transform duration-150 ${
                      isSelected ? "scale-[1.12]" : "hover:scale-105 active:scale-95"
                    }`}
                    style={
                      isSelected
                        ? { filter: "drop-shadow(0 0 12px rgba(80, 210, 255, 0.65))" }
                        : undefined
                    }
                  >
                    <ChessPieceSVG piece={piece} className="w-full h-full object-contain" />
                  </div>
                )}

                {/* File label (e.g. 'a', 'b', ... on bottom rank) */}
                {isBottomRow && (
                  <span
                    className="absolute bottom-1 right-1 text-[10px] font-mono font-semibold select-none pointer-events-none"
                    style={{
                      color: isLight ? "rgba(90, 60, 160, 0.6)" : "rgba(200, 185, 255, 0.45)",
                    }}
                  >
                    {FILES[c]}
                  </span>
                )}

                {/* Rank label (e.g. 1..8 on left file) */}
                {isLeftCol && (
                  <span
                    className="absolute top-1 left-1.5 text-[10px] font-mono font-semibold select-none pointer-events-none"
                    style={{
                      color: isLight ? "rgba(90, 60, 160, 0.6)" : "rgba(200, 185, 255, 0.45)",
                    }}
                  >
                    {8 - r}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Board edge cosmic shimmer */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, transparent 40%, transparent 60%, rgba(120, 80, 255, 0.06) 100%)",
        }}
      />

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes check-pulse {
          0%, 100% {
            box-shadow: inset 0 0 24px rgba(255, 70, 70, 0.6), 0 0 16px rgba(255, 40, 40, 0.5);
          }
          50% {
            box-shadow: inset 0 0 36px rgba(255, 100, 100, 0.8), 0 0 26px rgba(255, 50, 50, 0.7);
          }
        }
        @keyframes move-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.18); opacity: 1; }
        }
      `}</style>
    </div>
  );
});
