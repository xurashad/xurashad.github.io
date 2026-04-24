"use client";

import type { Piece } from "./lib/types";

// SVG paths sourced from Wikimedia / FIDE-licensed Merida set (open)
const PATHS: Record<string, string> = {
  // King
  KING: `M 22.5,11.63 L 22.5,6 L 27.5,6 L 27.5,11.63 L 32.5,11.63 L 32.5,18 L 27.5,18 L 27.5,18 
    C 27.5,18 27.5,18 27.5,18 L 32.5,18 L 36,18 L 36,29 C 36,30 35,31 34,31 
    L 11,31 C 10,31 9,30 9,29 L 9,18 L 13.5,18 L 17.5,18 L 17.5,18 L 13.5,18 L 13.5,11.63 Z
    M 11.5,37 C 17,40.5 33,40.5 38.5,37 L 38.5,31 L 11.5,31 Z`,

  // Queen
  QUEEN: `M 8,12 A 2,2 0 1 1 12,12 A 2,2 0 1 1 8,12 Z
    M 18.5,7.5 A 2,2 0 1 1 22.5,7.5 A 2,2 0 1 1 18.5,7.5 Z
    M 28,12 A 2,2 0 1 1 32,12 A 2,2 0 1 1 28,12 Z
    M 10,17.5 L 10,14.5 Q 13,11 16,14 L 20,30 L 24,14 Q 27,11 30,14.5 L 30,17.5 
    L 29,35 Q 22.5,39 11,35 Z`,

  // Rook
  ROOK: `M 9,39 L 36,39 L 36,35 L 9,35 Z
    M 12,35 L 12,27 L 33,27 L 33,35 Z
    M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 Z
    M 11,14 L 11,27 L 34,27 L 34,14 Z`,

  // Bishop  
  BISHOP: `M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 
    C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.93 22.5,36.5 
    C 19.11,38.93 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 Z
    M 15,32 C 17.5,34.5 27.5,34.5 30,32 L 30,30 C 30,27 22.5,24 22.5,24 C 22.5,24 15,27 15,30 Z
    M 22.5,8 A 4,4 0 1 0 22.5,16 A 4,4 0 1 0 22.5,8 Z
    M 20,24 L 25,16 M 22.5,8 L 22.5,10`,

  // Knight
  KNIGHT: `M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18 
    M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 
    C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 
    C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 
    C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 18.5,10 18.5,10 Z
    M 11.5,30 C 15,29 17,25 17,25`,

  // Pawn
  PAWN: `M 22.5,9 A 4,4 0 1 0 22.5,17 A 4,4 0 1 0 22.5,9 Z
    M 22.5,17 C 18,17 15,20 15,23.5 C 15,27 17.5,29 20,30 L 20,36 L 11,36 L 11,39 L 34,39 L 34,36 L 25,36 L 25,30 C 27.5,29 30,27 30,23.5 C 30,20 27,17 22.5,17 Z`,
};

interface Props {
  piece: Piece;
  size?: number;
}

export function ChessPieceSVG({ piece, size = 44 }: Props) {
  const isWhite = piece.color === "WHITE";

  const fill   = isWhite ? "#f0e9d2" : "#1a1033";
  const stroke = isWhite ? "#2d1b69" : "#c8b0ff";
  const path   = PATHS[piece.type];

  return (
    <svg
      viewBox="0 0 45 45"
      width={size}
      height={size}
      className="pointer-events-none drop-shadow-sm"
      aria-label={`${piece.color.toLowerCase()} ${piece.type.toLowerCase()}`}
    >
      {/* Glow filter */}
      <defs>
        <filter id={`glow-${piece.color}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={path}
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${piece.color})`}
      />
    </svg>
  );
}
