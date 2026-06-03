"use client";

import { useId } from "react";
import type { Piece } from "./lib/types";

/**
 * Premium SVG chess pieces with detailed outlines, inner shading,
 * gradient fills, and decorative accents.
 *
 * Each piece has a main body path, an optional detail path for inner
 * lines/decorations, and a highlight path for top-edge sheen.
 */

interface PieceDef {
  body: string;
  detail?: string;   // inner lines / accent strokes
  highlight?: string; // top shine / edge highlight
}

const PIECES: Record<string, PieceDef> = {
  KING: {
    body: `M 22.5,11.63 L 22.5,6 M 20,8 L 25,8
      M 22.5,11.63 C 22.5,11.63 19,14.25 19,18
      C 19,20 20,22 22.5,22 C 25,22 26,20 26,18
      C 26,14.25 22.5,11.63 22.5,11.63 Z
      M 11.5,37 C 17,40.5 33,40.5 38.5,37
      L 38.5,30 C 38.5,30 36.5,26 33.5,24
      C 33.5,24 30,26 22.5,26 C 15,26 11.5,24 11.5,24
      C 8.5,26 6.5,30 6.5,30 L 6.5,37 Z`,
    detail: `M 11.5,30 C 17,27 33,27 38.5,30
      M 11.5,33.5 C 17,30.5 33,30.5 38.5,33.5
      M 11.5,37 C 17,34 33,34 38.5,37`,
    highlight: `M 20,8 L 25,8 M 22.5,6 L 22.5,11.63`,
  },

  QUEEN: {
    body: `M 9,26 C 17.5,24.5 27.5,24.5 36,26
      L 38,14 L 31,25 L 30,10 L 25.5,24.5
      L 22.5,5 L 19.5,24.5 L 15,10 L 14,25
      L 7,14 L 9,26 Z
      M 9,26 C 9,28 10.5,31.5 22.5,31.5
      C 34.5,31.5 36,28 36,26
      M 11.5,37 C 17,40.5 33,40.5 38.5,37
      L 38.5,30 C 38.5,30 35,28 22.5,28
      C 10,28 6.5,30 6.5,30 L 6.5,37 Z`,
    detail: `M 11.5,30 C 15,28 30,28 38.5,30
      M 11.5,33.5 C 15,31.5 30,31.5 38.5,33.5
      M 11.5,37 C 17,34 33,34 38.5,37`,
    highlight: `M 7,14 A 2,2 0 1 1 11,14 A 2,2 0 1 1 7,14 Z
      M 13,5.5 A 2,2 0 1 1 17,5.5 A 2,2 0 1 1 13,5.5 Z
      M 20.5,2 A 2,2 0 1 1 24.5,2 A 2,2 0 1 1 20.5,2 Z
      M 28,5.5 A 2,2 0 1 1 32,5.5 A 2,2 0 1 1 28,5.5 Z
      M 34,14 A 2,2 0 1 1 38,14 A 2,2 0 1 1 34,14 Z`,
  },

  ROOK: {
    body: `M 9,39 L 36,39 L 36,36 L 9,36 Z
      M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 Z
      M 12,36 L 12,32 L 33,32 L 33,36 Z
      M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 Z
      M 14,16.5 L 11,14 L 11,9 L 15,9 L 15,11
      L 20,11 L 20,9 L 25,9 L 25,11 L 30,11
      L 30,9 L 34,9 L 34,14 L 31,16.5 Z`,
    detail: `M 14,29.5 L 31,29.5
      M 14,16.5 L 31,16.5
      M 11,14 L 34,14`,
  },

  BISHOP: {
    body: `M 9,36 C 12.39,35.03 19.11,36.43 22.5,34
      C 25.89,36.43 32.61,35.03 36,36
      C 36,36 37.65,36.54 39,38
      C 38.32,38.97 37.35,38.99 36,38.5
      C 32.61,37.53 25.89,38.93 22.5,36.5
      C 19.11,38.93 12.39,37.53 9,38.5
      C 7.65,38.99 6.68,38.97 6,38
      C 7.35,36.54 9,36 9,36 Z
      M 15,32 C 17.5,34.5 27.5,34.5 30,32
      C 30,30 27.5,27.5 25.5,26
      L 22.5,10 L 19.5,26
      C 17.5,27.5 15,30 15,32 Z
      M 25,8 A 2.5,2.5 0 1 1 20,8
      A 2.5,2.5 0 1 1 25,8 Z`,
    detail: `M 17.5,26 L 27.5,26
      M 15,32 C 17.5,34.5 27.5,34.5 30,32`,
    highlight: `M 22.5,10 L 22.5,13.5 M 20.5,12 L 24.5,12`,
  },

  KNIGHT: {
    body: `M 22,10 C 32.5,11 38.5,18 38,39
      L 15,39 C 15,30 25,32.5 23,18
      M 24,18 C 24.38,20.91 18.45,25.37 16,27
      C 13,29 13.18,31.34 11,31
      C 9.958,30.06 12.41,27.96 11,28
      C 10,28 11.19,29.23 10,30
      C 9,30 5.997,31 6,26
      C 6,24 12,14 12,14
      C 12,14 13.89,12.1 14,10.5
      C 13.27,9.506 13.5,8.5 13.5,7.5
      C 14.5,6.5 16.5,10 16.5,10
      L 22,10 Z`,
    detail: `M 9.5,25.5 A 0.5,1.5 0 1 1 8.5,25.5
      A 0.5,1.5 0 1 1 9.5,25.5 Z
      M 15,15.5 A 0.5,1.5 330 1 1 13.5,16.5
      A 0.5,1.5 330 1 1 15,15.5 Z`,
    highlight: `M 11.5,30 C 15,29 17,25 17,25`,
  },

  PAWN: {
    body: `M 22.5,9 C 19.016,9 16.2,11.816 16.2,15.3
      C 16.2,17.3 17.1,19.1 18.5,20.2
      C 16.5,21.5 15,23.5 15,26
      C 15,29 17.5,31 20,32
      L 20,36 L 11,36 L 11,39 L 34,39 L 34,36
      L 25,36 L 25,32 C 27.5,31 30,29 30,26
      C 30,23.5 28.5,21.5 26.5,20.2
      C 27.9,19.1 28.8,17.3 28.8,15.3
      C 28.8,11.816 25.984,9 22.5,9 Z`,
  },
};

interface Props {
  piece: Piece;
  size?: number;
}

export function ChessPieceSVG({ piece, size = 44 }: Props) {
  const isWhite = piece.color === "WHITE";
  const reactId = useId();
  const uid = `${piece.type}-${piece.color}-${reactId}`;

  // Premium color palettes
  const gradFrom  = isWhite ? "#faf6ef" : "#2a1a4a";
  const gradTo    = isWhite ? "#e8dcc8" : "#1a0e30";
  const gradMid   = isWhite ? "#f2ead8" : "#221540";
  const stroke    = isWhite ? "#6b5a3e" : "#9b7cdb";
  const strokeW   = isWhite ? 1.5 : 1.3;
  const detailClr = isWhite ? "#b8a080" : "#7b5fc0";
  const highlightClr = isWhite ? "#fffdf5" : "#c8b0ff";
  const glowColor = isWhite ? "rgba(255,248,230,0.6)" : "rgba(140,100,255,0.5)";
  const shadowClr = isWhite ? "rgba(80,60,30,0.4)" : "rgba(10,5,30,0.6)";

  const def = PIECES[piece.type];

  return (
    <svg
      viewBox="0 0 45 45"
      width={size}
      height={size}
      className="pointer-events-none"
      style={{ filter: `drop-shadow(0 2px 4px ${shadowClr})` }}
      aria-label={`${piece.color.toLowerCase()} ${piece.type.toLowerCase()}`}
    >
      <defs>
        {/* Main body gradient */}
        <linearGradient id={`grad-${uid}`} x1="0%" y1="0%" x2="30%" y2="100%">
          <stop offset="0%" stopColor={gradFrom} />
          <stop offset="50%" stopColor={gradMid} />
          <stop offset="100%" stopColor={gradTo} />
        </linearGradient>

        {/* Inner glow */}
        <radialGradient id={`inner-${uid}`} cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor={isWhite ? "rgba(255,255,255,0.4)" : "rgba(160,120,255,0.25)"} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        {/* Outer glow filter */}
        <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={isWhite ? "1" : "1.5"} result="blur" />
          <feFlood floodColor={glowColor} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Bevel / edge highlight */}
        <filter id={`bevel-${uid}`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" result="blur" />
          <feOffset dx="0" dy="-0.5" result="off" />
          <feComposite in="SourceGraphic" in2="off" operator="over" />
        </filter>
      </defs>

      <g filter={`url(#glow-${uid})`}>
        {/* Body fill with gradient */}
        <path
          d={def.body}
          fill={`url(#grad-${uid})`}
          stroke={stroke}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner glow overlay */}
        <path
          d={def.body}
          fill={`url(#inner-${uid})`}
          stroke="none"
        />

        {/* Detail lines (inner decorations) */}
        {def.detail && (
          <path
            d={def.detail}
            fill="none"
            stroke={detailClr}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isWhite ? 0.6 : 0.5}
          />
        )}

        {/* Highlight accents (crosses, crowns, etc.) */}
        {def.highlight && (
          <path
            d={def.highlight}
            fill={piece.type === "QUEEN" ? highlightClr : "none"}
            stroke={highlightClr}
            strokeWidth={piece.type === "QUEEN" ? "0.8" : "1.2"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={isWhite ? 0.8 : 0.7}
          />
        )}
      </g>
    </svg>
  );
}
