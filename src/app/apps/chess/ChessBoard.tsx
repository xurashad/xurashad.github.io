"use client";

import { memo, useId } from "react";
import { ChessPieceSVG } from "./ChessPieceSVG";
import type { Board, Square, Move } from "./lib/types";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

interface Props {
  board: Board;
  flipped?: boolean;
  selected: Square | null;
  validMoves: Move[];
  lastMove: Move | null;
  checkSquare: Square | null;
  onSquareClick: (sq: Square) => void;
  disabled?: boolean;
}

export const ChessBoard = memo(function ChessBoard({
  board, flipped = false, selected, validMoves, lastMove, checkSquare,
  onSquareClick, disabled,
}: Props) {
  const boardId = useId();
  const rows = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const cols = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-2xl transition-opacity ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
      style={{
        aspectRatio: "1 / 1",
        border: "3px solid rgba(120,90,200,0.35)",
        boxShadow: `
          0 0 60px rgba(100,60,255,0.2),
          0 0 120px rgba(80,40,200,0.1),
          inset 0 0 60px rgba(60,30,150,0.08)
        `,
      }}
    >
      {/* SVG definitions for board patterns */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {/* Light square gradient */}
          <linearGradient id={`lsq-${boardId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(210,195,255,0.18)" />
            <stop offset="100%" stopColor="rgba(180,165,230,0.12)" />
          </linearGradient>
          {/* Dark square gradient */}
          <linearGradient id={`dsq-${boardId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(60,30,120,0.65)" />
            <stop offset="100%" stopColor="rgba(40,18,85,0.7)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Board squares */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {rows.map((r) =>
          cols.map((c) => {
            const isLight      = (r + c) % 2 !== 0;
            const isSelected   = selected?.row === r && selected?.col === c;
            const isValidDest  = validMoves.some(m => m.to.row === r && m.to.col === c);
            const isCaptureDest = isValidDest && !!board[r][c];
            const isLastFrom   = lastMove?.from.row === r && lastMove?.from.col === c;
            const isLastTo     = lastMove?.to.row   === r && lastMove?.to.col   === c;
            const isCheck      = checkSquare?.row === r && checkSquare?.col === c;

            const piece = board[r][c];

            // Premium color scheme
            let bg: string;
            let extraStyle: React.CSSProperties = {};

            if (isSelected) {
              bg = "rgba(80,200,255,0.45)";
              extraStyle = {
                boxShadow: "inset 0 0 20px rgba(80,200,255,0.3)",
              };
            } else if (isCheck) {
              bg = "rgba(220,40,40,0.5)";
              extraStyle = {
                boxShadow: "inset 0 0 24px rgba(255,60,60,0.4), 0 0 12px rgba(255,40,40,0.3)",
                animation: "check-pulse 1.2s ease-in-out infinite",
              };
            } else if (isLastTo) {
              bg = isLight ? "rgba(200,255,160,0.30)" : "rgba(140,230,100,0.28)";
              extraStyle = {
                boxShadow: "inset 0 0 12px rgba(160,255,120,0.15)",
              };
            } else if (isLastFrom) {
              bg = isLight ? "rgba(200,255,160,0.16)" : "rgba(140,230,100,0.14)";
            } else {
              bg = isLight
                ? "rgba(210,195,255,0.14)"
                : "rgba(50,25,100,0.55)";
            }

            return (
              <div
                key={`${r}-${c}`}
                className="relative flex items-center justify-center cursor-pointer transition-all duration-150 hover:brightness-110"
                style={{ background: bg, ...extraStyle }}
                onClick={() => !disabled && onSquareClick({ row: r, col: c })}
              >
                {/* Subtle grid texture on dark squares */}
                {!isLight && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%,
                        transparent 75%, rgba(255,255,255,0.1) 75%),
                        linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%,
                        transparent 75%, rgba(255,255,255,0.1) 75%)
                      `,
                      backgroundSize: "8px 8px",
                      backgroundPosition: "0 0, 4px 4px",
                    }}
                  />
                )}

                {/* Valid-move indicator */}
                {isValidDest && (
                  isCaptureDest ? (
                    <div
                      className="absolute inset-0 z-10 pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, transparent 55%, rgba(80,220,255,0.35) 55%, rgba(80,220,255,0.12) 100%)",
                      }}
                    />
                  ) : (
                    <div
                      className="absolute w-[28%] h-[28%] rounded-full z-10 pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, rgba(80,220,255,0.5) 0%, rgba(80,220,255,0.2) 70%, transparent 100%)",
                        boxShadow: "0 0 8px rgba(80,220,255,0.3)",
                        animation: "move-dot-pulse 2s ease-in-out infinite",
                      }}
                    />
                  )
                )}

                {/* Piece */}
                {piece && (
                  <div
                    className={`z-20 transition-transform duration-150 ${
                      isSelected ? "scale-[1.12]" : "hover:scale-105"
                    }`}
                    style={isSelected ? {
                      filter: "drop-shadow(0 0 8px rgba(80,200,255,0.5))",
                    } : undefined}
                  >
                    <ChessPieceSVG piece={piece} size={48} />
                  </div>
                )}

                {/* File label (bottom row) */}
                {r === (flipped ? 7 : 0) && (
                  <span
                    className="absolute bottom-0.5 right-1 text-[9px] font-mono select-none"
                    style={{
                      color: isLight ? "rgba(90,60,160,0.5)" : "rgba(190,170,255,0.35)",
                    }}
                  >
                    {FILES[c]}
                  </span>
                )}
                {/* Rank label (left col) */}
                {c === (flipped ? 7 : 0) && (
                  <span
                    className="absolute top-0.5 left-1 text-[9px] font-mono select-none"
                    style={{
                      color: isLight ? "rgba(90,60,160,0.5)" : "rgba(190,170,255,0.35)",
                    }}
                  >
                    {r + 1}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Board edge shimmer */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 40%, transparent 60%, rgba(100,60,255,0.04) 100%)",
        }}
      />

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes check-pulse {
          0%, 100% { box-shadow: inset 0 0 24px rgba(255,60,60,0.4), 0 0 12px rgba(255,40,40,0.3); }
          50% { box-shadow: inset 0 0 32px rgba(255,80,80,0.55), 0 0 20px rgba(255,40,40,0.45); }
        }
        @keyframes move-dot-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
      `}</style>
    </div>
  );
});
