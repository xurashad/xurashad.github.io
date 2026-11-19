"use client";

import { memo, useId } from "react";
import { CHESS_THEMES } from "./lib/themes";
import type { BoardThemeId, Piece } from "./lib/types";

interface Props {
  piece: Omit<Piece, "id"> & { id?: string };
  size?: number;
  className?: string;
  themeId?: BoardThemeId;
}

export const ChessPieceSVG = memo(function ChessPieceSVG({
  piece,
  size,
  className,
  themeId = "celestial",
}: Props) {
  const reactId = useId().replace(/:/g, "");
  const isWhite = piece.color === "WHITE";
  const palette = CHESS_THEMES[themeId]?.svgPieces ?? CHESS_THEMES.celestial.svgPieces;

  const grad = isWhite ? palette.lightGrad : palette.darkGrad;
  const stroke = isWhite ? palette.lightStroke : palette.darkStroke;
  const detail = isWhite ? palette.lightDetail : palette.darkDetail;
  const trim = isWhite ? palette.lightTrim : palette.darkTrim;
  const highlight = isWhite ? palette.lightHighlight : palette.darkHighlight;
  const shadow = isWhite ? palette.lightShadow : palette.darkShadow;

  const bodyGradId = `body-${reactId}`;
  const sheenGradId = `sheen-${reactId}`;
  const trimGradId = `trim-${reactId}`;

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className ?? ""}`}
      style={{
        filter: `drop-shadow(0 3px 4px ${shadow})`,
      }}
      aria-label={`${piece.color.toLowerCase()} ${piece.type.toLowerCase()}`}
    >
      <defs>
        {/* Cylindrical 3D shading across the piece silhouette */}
        <linearGradient id={bodyGradId} x1="12%" y1="6%" x2="92%" y2="94%">
          <stop offset="0%" stopColor={grad[0]} />
          <stop offset="48%" stopColor={grad[1]} />
          <stop offset="100%" stopColor={grad[2]} />
        </linearGradient>

        {/* Soft vertical specular sheen */}
        <linearGradient id={sheenGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={highlight} stopOpacity="0.06" />
          <stop offset="32%" stopColor={highlight} stopOpacity={isWhite ? "0.42" : "0.24"} />
          <stop offset="68%" stopColor={highlight} stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
        </linearGradient>

        {/* Metallic accent trim gradient */}
        <linearGradient id={trimGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="50%" stopColor={trim} />
          <stop offset="100%" stopColor={detail} />
        </linearGradient>
      </defs>

      {piece.type === "PAWN" && (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* Base plinth */}
          <path
            d="M 11.5,41.5 L 36.5,41.5 C 37.3,41.5 37.5,39 36.4,38.2 L 33.4,36.2 L 14.6,36.2 L 11.6,38.2 C 10.5,39 10.7,41.5 11.5,41.5 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Turned stem */}
          <path
            d="M 15.2,36.2 C 16.5,31.5 18.8,26.8 19.3,22.2 L 28.7,22.2 C 29.2,26.8 31.5,31.5 32.8,36.2 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 15.2,36.2 C 16.5,31.5 18.8,26.8 19.3,22.2 L 28.7,22.2 C 29.2,26.8 31.5,31.5 32.8,36.2 Z"
            fill={`url(#${sheenGradId})`}
          />
          {/* Collar ring */}
          <rect
            x="16.8"
            y="19.6"
            width="14.4"
            height="3"
            rx="1.5"
            fill={`url(#${trimGradId})`}
            stroke={stroke}
            strokeWidth="1.2"
          />
          {/* Orb head */}
          <circle
            cx="24"
            cy="13.5"
            r="6.2"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle cx="24" cy="13.5" r="6.0" fill={`url(#${sheenGradId})`} />
          {/* Specular crescent */}
          <path
            d="M 20.6,11.2 A 3.8,3.8 0 0 1 24.4,9.5"
            fill="none"
            stroke={highlight}
            strokeWidth="1.3"
            opacity="0.78"
          />
          {/* Base trim band */}
          <line x1="14.2" y1="38.2" x2="33.8" y2="38.2" stroke={`url(#${trimGradId})`} strokeWidth="1.4" />
        </g>
      )}

      {piece.type === "ROOK" && (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* Plinth */}
          <path
            d="M 10,41.5 L 38,41.5 L 38,37.8 L 34.5,35.6 L 13.5,35.6 L 10,37.8 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Tapered tower */}
          <path
            d="M 13.8,35.6 L 15.6,17.2 L 32.4,17.2 L 34.2,35.6 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 13.8,35.6 L 15.6,17.2 L 32.4,17.2 L 34.2,35.6 Z"
            fill={`url(#${sheenGradId})`}
          />
          {/* Turret & crenellations */}
          <path
            d="M 15.6,17.2 L 12.2,14.2 L 12.2,7.8 L 16.8,7.8 L 16.8,10.8 L 21.4,10.8 L 21.4,7.8 L 26.6,7.8 L 26.6,10.8 L 31.2,10.8 L 31.2,7.8 L 35.8,7.8 L 35.8,14.2 L 32.4,17.2 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Subtle vertical masonry fluting */}
          <line x1="20.2" y1="19.5" x2="19.4" y2="33.5" stroke={detail} strokeWidth="0.9" opacity="0.55" />
          <line x1="27.8" y1="19.5" x2="28.6" y2="33.5" stroke={detail} strokeWidth="0.9" opacity="0.55" />
          {/* Metallic collar & base rings */}
          <line x1="12.8" y1="14.2" x2="35.2" y2="14.2" stroke={`url(#${trimGradId})`} strokeWidth="1.5" />
          <line x1="15.2" y1="17.2" x2="32.8" y2="17.2" stroke={detail} strokeWidth="1" />
          <line x1="11.5" y1="38.1" x2="36.5" y2="38.1" stroke={`url(#${trimGradId})`} strokeWidth="1.5" />
        </g>
      )}

      {piece.type === "KNIGHT" && (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* Pedestal base */}
          <path
            d="M 10.5,41.5 L 37.5,41.5 L 37.5,38 L 34,35.6 L 14,35.6 L 10.5,38 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Sculpted Staunton horse silhouette */}
          <path
            d="M 14.5,35.6 C 14.5,29.5 19.2,26.8 21.6,23.2 C 18.6,24.4 14.8,26.4 11.4,25.2 C 9.2,24.4 8.2,21.6 10.1,19.4 C 12.2,17 15.2,13.6 16.5,11.2 L 16.8,7 L 20.6,10 L 23.6,6.8 L 24.4,10.3 C 32.8,11.5 36.6,20.2 34.4,35.6 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 14.5,35.6 C 14.5,29.5 19.2,26.8 21.6,23.2 C 18.6,24.4 14.8,26.4 11.4,25.2 C 9.2,24.4 8.2,21.6 10.1,19.4 C 12.2,17 15.2,13.6 16.5,11.2 L 16.8,7 L 20.6,10 L 23.6,6.8 L 24.4,10.3 C 32.8,11.5 36.6,20.2 34.4,35.6 Z"
            fill={`url(#${sheenGradId})`}
          />
          {/* Golden mane spine */}
          <path
            d="M 24.8,11.6 C 31.2,13.8 34.2,21.8 32.5,34"
            fill="none"
            stroke={`url(#${trimGradId})`}
            strokeWidth="1.8"
            opacity="0.9"
          />
          {/* Bridle / jaw shadow detail */}
          <path
            d="M 16.8,18.2 C 18.8,17.2 21.2,18.8 22.8,21.4"
            fill="none"
            stroke={detail}
            strokeWidth="1"
            opacity="0.65"
          />
          {/* Eye & nostril */}
          <circle cx="17.8" cy="14.2" r="1.25" fill={trim} stroke={stroke} strokeWidth="0.7" />
          <circle cx="11.6" cy="21.8" r="0.85" fill={stroke} opacity="0.8" />
          {/* Base trim */}
          <line x1="12" y1="38.1" x2="36" y2="38.1" stroke={`url(#${trimGradId})`} strokeWidth="1.5" />
        </g>
      )}

      {piece.type === "BISHOP" && (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* Base */}
          <path
            d="M 10,41.5 L 38,41.5 C 38.6,41.5 38.6,38.8 37.2,38 L 33.8,35.8 L 14.2,35.8 L 10.8,38 C 9.4,38.8 9.4,41.5 10,41.5 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Slender body */}
          <path
            d="M 14.6,35.8 C 16.5,30.2 18.5,25.8 19.2,22.2 L 28.8,22.2 C 29.5,25.8 31.5,30.2 33.4,35.8 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Collar */}
          <rect
            x="16.2"
            y="19.6"
            width="15.6"
            height="3"
            rx="1.5"
            fill={`url(#${trimGradId})`}
            stroke={stroke}
            strokeWidth="1.2"
          />
          {/* Pointed Mitre */}
          <path
            d="M 18.5,19.6 C 15.8,16 17,10.5 24,7.4 C 31,10.5 32.2,16 29.5,19.6 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 18.5,19.6 C 15.8,16 17,10.5 24,7.4 C 31,10.5 32.2,16 29.5,19.6 Z"
            fill={`url(#${sheenGradId})`}
          />
          {/* Diagonal mitre cleft & cross */}
          <line x1="20.6" y1="11.2" x2="26.2" y2="16.8" stroke={`url(#${trimGradId})`} strokeWidth="1.5" />
          <line x1="24" y1="11.6" x2="24" y2="16.2" stroke={highlight} strokeWidth="1.1" opacity="0.8" />
          <line x1="21.8" y1="13.8" x2="26.2" y2="13.8" stroke={highlight} strokeWidth="1.1" opacity="0.8" />
          {/* Apex finial */}
          <circle
            cx="24"
            cy="5.4"
            r="2.2"
            fill={`url(#${trimGradId})`}
            stroke={stroke}
            strokeWidth="1.1"
          />
          {/* Base trim */}
          <line x1="12.2" y1="38.2" x2="35.8" y2="38.2" stroke={`url(#${trimGradId})`} strokeWidth="1.4" />
        </g>
      )}

      {piece.type === "QUEEN" && (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* Base */}
          <path
            d="M 9.5,41.5 L 38.5,41.5 L 38.5,38.2 L 34.8,35.6 L 13.2,35.6 L 9.5,38.2 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Royal waist */}
          <path
            d="M 13.5,35.6 C 15.2,30 16.8,25.5 16.5,21.5 L 31.5,21.5 C 31.2,25.5 32.8,30 34.5,35.6 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Coronet spikes */}
          <path
            d="M 16.5,21.5 L 8.8,13.5 L 15.2,18.2 L 15.6,9.5 L 20.5,17.4 L 24,7.6 L 27.5,17.4 L 32.4,9.5 L 32.8,18.2 L 39.2,13.5 L 31.5,21.5 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.45"
          />
          <path
            d="M 16.5,21.5 L 8.8,13.5 L 15.2,18.2 L 15.6,9.5 L 20.5,17.4 L 24,7.6 L 27.5,17.4 L 32.4,9.5 L 32.8,18.2 L 39.2,13.5 L 31.5,21.5 Z"
            fill={`url(#${sheenGradId})`}
          />
          {/* Coronet pearls */}
          {[
            [8.4, 12.6],
            [15.6, 8.6],
            [24, 6.4],
            [32.4, 8.6],
            [39.6, 12.6],
          ].map(([cx, cy], idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={idx === 2 ? 2.1 : 1.7}
              fill={`url(#${trimGradId})`}
              stroke={stroke}
              strokeWidth="1"
            />
          ))}
          {/* Collar & base trim bands */}
          <rect
            x="15.2"
            y="20.4"
            width="17.6"
            height="2.7"
            rx="1.3"
            fill={`url(#${trimGradId})`}
            stroke={stroke}
            strokeWidth="1.1"
          />
          <path
            d="M 14.5,33.2 C 20,31.5 28,31.5 33.5,33.2"
            fill="none"
            stroke={detail}
            strokeWidth="1"
            opacity="0.7"
          />
          <line x1="11.2" y1="38.2" x2="36.8" y2="38.2" stroke={`url(#${trimGradId})`} strokeWidth="1.5" />
        </g>
      )}

      {piece.type === "KING" && (
        <g strokeLinejoin="round" strokeLinecap="round">
          {/* Imperial Cross */}
          <path
            d="M 24,5 L 24,12.5 M 20.4,8.2 L 27.6,8.2"
            stroke={`url(#${trimGradId})`}
            strokeWidth="2.4"
          />
          <path
            d="M 24,5 L 24,12.5 M 20.4,8.2 L 27.6,8.2"
            stroke={stroke}
            strokeWidth="0.9"
            opacity="0.55"
          />
          {/* Crown lobes */}
          <path
            d="M 15.8,21.8 C 11.4,19.4 9.8,14.8 12.2,12.2 C 14.8,9.8 19.6,11.6 22.6,15.2 C 23.4,13 24.6,13 25.4,15.2 C 28.4,11.6 33.2,9.8 35.8,12.2 C 38.2,14.8 36.6,19.4 32.2,21.8 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Center dome */}
          <path
            d="M 20.2,20.8 C 20.2,14.8 22,12.2 24,12.2 C 26,12.2 27.8,14.8 27.8,20.8 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.4"
          />
          {/* Stem & base */}
          <path
            d="M 13.4,35.6 C 14.8,30.2 16,25.5 15.8,21.8 L 32.2,21.8 C 32,25.5 33.2,30.2 34.6,35.6 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="M 13.4,35.6 C 14.8,30.2 16,25.5 15.8,21.8 L 32.2,21.8 C 32,25.5 33.2,30.2 34.6,35.6 Z"
            fill={`url(#${sheenGradId})`}
          />
          <path
            d="M 9.5,41.5 L 38.5,41.5 L 38.5,38.2 L 34.8,35.6 L 13.2,35.6 L 9.5,38.2 Z"
            fill={`url(#${bodyGradId})`}
            stroke={stroke}
            strokeWidth="1.5"
          />
          {/* Imperial collar & base bands */}
          <rect
            x="14.8"
            y="20.6"
            width="18.4"
            height="2.8"
            rx="1.4"
            fill={`url(#${trimGradId})`}
            stroke={stroke}
            strokeWidth="1.1"
          />
          <path
            d="M 14.8,32.5 C 20,30.5 28,30.5 33.2,32.5"
            fill="none"
            stroke={detail}
            strokeWidth="1"
            opacity="0.7"
          />
          <line x1="11.2" y1="38.2" x2="36.8" y2="38.2" stroke={`url(#${trimGradId})`} strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
});
