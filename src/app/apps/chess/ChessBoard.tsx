"use client";

import { memo } from "react";
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

  const rows   = flipped ? [0,1,2,3,4,5,6,7] : [7,6,5,4,3,2,1,0];
  const cols   = flipped ? [7,6,5,4,3,2,1,0] : [0,1,2,3,4,5,6,7];

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border-2 shadow-2xl transition-opacity ${
        disabled ? "opacity-60 pointer-events-none" : ""
      }`}
      style={{
        borderColor: "rgba(160,120,255,0.4)",
        boxShadow: "0 0 40px rgba(100,80,255,0.25), 0 0 80px rgba(80,50,200,0.15)",
        aspectRatio: "1 / 1",
      }}
    >
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

            let bg: string;
            if (isSelected)      bg = "rgba(50,200,255,0.55)";
            else if (isCheck)    bg = "rgba(220,40,40,0.65)";
            else if (isLastTo)   bg = isLight ? "rgba(180,255,130,0.38)" : "rgba(130,220,80,0.38)";
            else if (isLastFrom) bg = isLight ? "rgba(180,255,130,0.22)" : "rgba(130,220,80,0.22)";
            else                 bg = isLight ? "rgba(200,175,255,0.12)" : "rgba(50,20,90,0.55)";

            return (
              <div
                key={`${r}-${c}`}
                className="relative flex items-center justify-center cursor-pointer transition-colors duration-100"
                style={{ background: bg }}
                onClick={() => !disabled && onSquareClick({ row: r, col: c })}
              >
                {/* Valid-move dot / ring */}
                {isValidDest && (
                  isCaptureDest ? (
                    <div className="absolute inset-0 rounded-none ring-4 ring-inset ring-cyan-400/60 z-10 pointer-events-none" />
                  ) : (
                    <div className="absolute w-[30%] h-[30%] rounded-full bg-cyan-400/45 z-10 pointer-events-none animate-pulse" />
                  )
                )}

                {/* Piece */}
                {piece && (
                  <div className={`z-20 transition-transform duration-150 ${isSelected ? "scale-110" : "hover:scale-105"}`}>
                    <ChessPieceSVG piece={piece} size={48} />
                  </div>
                )}

                {/* File label (bottom row for white, top for flipped) */}
                {r === (flipped ? 7 : 0) && (
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-mono opacity-40 select-none">
                    {FILES[c]}
                  </span>
                )}
                {/* Rank label (left col) */}
                {c === (flipped ? 7 : 0) && (
                  <span className="absolute top-0.5 left-1 text-[9px] font-mono opacity-40 select-none">
                    {r + 1}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
