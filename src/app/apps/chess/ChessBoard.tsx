"use client";

import { memo, useCallback, useId, useRef, useState } from "react";
import { ChessPieceSVG } from "./ChessPieceSVG";
import { CHESS_THEMES } from "./lib/themes";
import type {
  Board,
  BoardThemeId,
  Color,
  Move,
  MoveAnimationMeta,
  Piece,
  Square,
} from "./lib/types";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

type AnnotationTone = "amber" | "crimson" | "cyan";

interface TacticalArrow {
  from: Square;
  to: Square;
  tone: AnnotationTone;
}

interface DragRenderState {
  pieceId: string;
  from: Square;
  dx: number;
  dy: number;
  hoverSq: Square | null;
}

interface PendingDrag {
  pointerId: number;
  pieceId: string;
  from: Square;
  startX: number;
  startY: number;
  active: boolean;
}

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
  themeId?: BoardThemeId;
  showCoordinates?: boolean;
  hintMove?: Move | null;
  focusedSquare?: Square | null;
  moveAnim?: MoveAnimationMeta | null;
  interactive?: boolean;
}

const TONE_COLORS: Record<AnnotationTone, { stroke: string; fill: string }> = {
  amber: { stroke: "rgba(251, 191, 36, 0.88)", fill: "rgba(251, 191, 36, 0.25)" },
  crimson: { stroke: "rgba(248, 113, 113, 0.9)", fill: "rgba(248, 113, 113, 0.28)" },
  cyan: { stroke: "rgba(34, 211, 238, 0.9)", fill: "rgba(34, 211, 238, 0.24)" },
};

function toVisualCoord(sq: Square, flipped: boolean): { vx: number; vy: number } {
  const col = flipped ? 7 - sq.col : sq.col;
  const row = flipped ? 7 - sq.row : sq.row;
  return { vx: col * 100 + 50, vy: row * 100 + 50 };
}

function renderTacticalArrowPath(
  from: Square,
  to: Square,
  flipped: boolean,
  color: string,
  markerId: string,
  key: string,
  isHint = false
) {
  const p1 = toVisualCoord(from, flipped);
  const p2 = toVisualCoord(to, flipped);
  const dr = Math.abs(to.row - from.row);
  const dc = Math.abs(to.col - from.col);
  const isKnight = (dr === 2 && dc === 1) || (dr === 1 && dc === 2);

  if (isKnight) {
    // L-shaped elbow arrow
    const mid =
      dr === 2
        ? { x: p1.vx, y: p2.vy }
        : { x: p2.vx, y: p1.vy };
    const dx = p2.vx - mid.x;
    const dy = p2.vy - mid.y;
    const len = Math.hypot(dx, dy) || 1;
    const endX = p2.vx - (dx / len) * 20;
    const endY = p2.vy - (dy / len) * 20;
    return (
      <path
        key={key}
        d={`M ${p1.vx},${p1.vy} L ${mid.x},${mid.y} L ${endX},${endY}`}
        fill="none"
        stroke={color}
        strokeWidth={isHint ? 13 : 11}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={`url(#${markerId})`}
        className={isHint ? "animate-pulse" : undefined}
      />
    );
  }

  const dx = p2.vx - p1.vx;
  const dy = p2.vy - p1.vy;
  const len = Math.hypot(dx, dy) || 1;
  const startX = p1.vx + (dx / len) * 14;
  const startY = p1.vy + (dy / len) * 14;
  const endX = p2.vx - (dx / len) * 22;
  const endY = p2.vy - (dy / len) * 22;

  return (
    <line
      key={key}
      x1={startX}
      y1={startY}
      x2={endX}
      y2={endY}
      stroke={color}
      strokeWidth={isHint ? 13 : 11}
      strokeLinecap="round"
      markerEnd={`url(#${markerId})`}
      className={isHint ? "animate-pulse" : undefined}
    />
  );
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
  disabled = false,
  themeId = "celestial",
  showCoordinates = true,
  hintMove = null,
  focusedSquare = null,
  moveAnim = null,
  interactive = true,
}: Props) {
  const theme = CHESS_THEMES[themeId] ?? CHESS_THEMES.celestial;
  const b2d = theme.board2d;

  const markerPrefix = useId().replace(/:/g, "");
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingDragRef = useRef<PendingDrag | null>(null);
  const rightDragFromRef = useRef<{ sq: Square; tone: AnnotationTone } | null>(null);
  const suppressNextClickRef = useRef<number>(0);

  const [dragState, setDragState] = useState<DragRenderState | null>(null);
  const [sqHighlights, setSqHighlights] = useState<Record<string, AnnotationTone>>({});
  const [arrows, setArrows] = useState<TacticalArrow[]>([]);

  const canInteract = interactive && !disabled;
  const activeDrag = canInteract ? dragState : null;

  const pointToSquare = useCallback(
    (clientX: number, clientY: number): Square | null => {
      const el = gridRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        return null;
      }
      const vx = Math.min(7, Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * 8)));
      const vy = Math.min(7, Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * 8)));
      return {
        row: flipped ? 7 - vy : vy,
        col: flipped ? 7 - vx : vx,
      };
    },
    [flipped]
  );

  const getToneFromEvent = (e: React.PointerEvent): AnnotationTone => {
    if (e.shiftKey) return "crimson";
    if (e.altKey) return "cyan";
    return "amber";
  };

  const handleGridPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const sq = pointToSquare(e.clientX, e.clientY);
      if (!sq) return;

      // Right-click annotation start
      if (e.button === 2) {
        rightDragFromRef.current = { sq, tone: getToneFromEvent(e) };
        return;
      }

      if (e.button !== 0 || !canInteract) return;

      // Clear user annotations on left click
      if (Object.keys(sqHighlights).length > 0) setSqHighlights({});
      if (arrows.length > 0) setArrows([]);

      const piece = board[sq.row][sq.col];
      const isMovablePiece = piece && (!currentTurn || piece.color === currentTurn);

      if (isMovablePiece) {
        pendingDragRef.current = {
          pointerId: e.pointerId,
          pieceId: piece.id,
          from: sq,
          startX: e.clientX,
          startY: e.clientY,
          active: false,
        };
      }
    },
    [pointToSquare, canInteract, sqHighlights, arrows.length, board, currentTurn]
  );

  const handleGridPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!canInteract) {
        pendingDragRef.current = null;
        return;
      }
      const pending = pendingDragRef.current;
      if (!pending || pending.pointerId !== e.pointerId) return;

      const dx = e.clientX - pending.startX;
      const dy = e.clientY - pending.startY;
      const dist = Math.hypot(dx, dy);

      if (!pending.active && dist >= 6) {
        pending.active = true;
        try {
          gridRef.current?.setPointerCapture(e.pointerId);
        } catch {
          // Ignore if capture is unsupported
        }
        if (!selected || selected.row !== pending.from.row || selected.col !== pending.from.col) {
          onSquareClick(pending.from);
        }
      }

      if (pending.active) {
        const hoverSq = pointToSquare(e.clientX, e.clientY);
        setDragState({
          pieceId: pending.pieceId,
          from: pending.from,
          dx,
          dy,
          hoverSq,
        });
      }
    },
    [canInteract, pointToSquare, selected, onSquareClick]
  );

  const handleGridPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Right-click annotation finish
      if (e.button === 2 && rightDragFromRef.current) {
        const { sq: fromSq, tone } = rightDragFromRef.current;
        rightDragFromRef.current = null;
        const toSq = pointToSquare(e.clientX, e.clientY);
        if (!toSq) return;

        if (fromSq.row === toSq.row && fromSq.col === toSq.col) {
          const key = `${toSq.row}-${toSq.col}`;
          setSqHighlights((prev) => {
            const next = { ...prev };
            if (next[key] === tone) delete next[key];
            else next[key] = tone;
            return next;
          });
        } else {
          setArrows((prev) => {
            const exists = prev.findIndex(
              (a) =>
                a.from.row === fromSq.row &&
                a.from.col === fromSq.col &&
                a.to.row === toSq.row &&
                a.to.col === toSq.col
            );
            if (exists >= 0) {
              return prev.filter((_, idx) => idx !== exists);
            }
            return [...prev, { from: fromSq, to: toSq, tone }];
          });
        }
        return;
      }

      const pending = pendingDragRef.current;
      if (!pending || pending.pointerId !== e.pointerId) return;
      pendingDragRef.current = null;

      if (pending.active) {
        try {
          if (gridRef.current?.hasPointerCapture(e.pointerId)) {
            gridRef.current.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Ignore
        }
        suppressNextClickRef.current = performance.now();
        setDragState(null);

        if (!canInteract) return;
        const targetSq = pointToSquare(e.clientX, e.clientY);
        if (
          targetSq &&
          (targetSq.row !== pending.from.row || targetSq.col !== pending.from.col)
        ) {
          if (onDropPiece) onDropPiece(pending.from, targetSq);
          else onSquareClick(targetSq);
        }
      }
    },
    [canInteract, pointToSquare, onDropPiece, onSquareClick]
  );

  const handleGridPointerCancel = useCallback(() => {
    pendingDragRef.current = null;
    rightDragFromRef.current = null;
    setDragState(null);
  }, []);

  const rows = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const cols = flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  // Flatten pieces for animated transform overlay
  const piecesList: { piece: Piece; row: number; col: number }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) piecesList.push({ piece: p, row: r, col: c });
    }
  }

  return (
    <div
      className={`relative w-full rounded-2xl p-2 sm:p-2.5 transition-opacity duration-300 select-none ${
        disabled ? "opacity-80" : ""
      }`}
      style={{
        aspectRatio: "1 / 1",
        background: b2d.frameBackground,
        border: `1.5px solid ${b2d.frameBorder}`,
        boxShadow: b2d.frameGlow,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Inner metallic inlay frame */}
      <div
        className="relative w-full h-full rounded-xl overflow-hidden"
        style={{
          border: `1px solid ${b2d.innerFrameBorder}`,
          boxShadow: "inset 0 0 18px rgba(0, 0, 0, 0.55)",
        }}
      >
        {/* 8x8 Square Grid */}
        <div
          ref={gridRef}
          className="relative grid grid-cols-8 grid-rows-8 w-full h-full touch-none"
          onPointerDown={handleGridPointerDown}
          onPointerMove={handleGridPointerMove}
          onPointerUp={handleGridPointerUp}
          onPointerCancel={handleGridPointerCancel}
        >
          {rows.map((r) =>
            cols.map((c) => {
              const isLight = (r + c) % 2 === 0;
              const isSelected = selected?.row === r && selected?.col === c;
              const matchingMove = validMoves.find((m) => m.to.row === r && m.to.col === c);
              const isValidDest = !!matchingMove;
              const isCaptureDest =
                isValidDest && (!!board[r][c] || !!matchingMove?.enPassantCapture);
              const isCastleDest = isValidDest && !!matchingMove?.castlingRook;
              const isLastFrom = lastMove?.from.row === r && lastMove?.from.col === c;
              const isLastTo = lastMove?.to.row === r && lastMove?.to.col === c;
              const isCheck = checkSquare?.row === r && checkSquare?.col === c;
              const isFocused = focusedSquare?.row === r && focusedSquare?.col === c;
              const isDragHover =
                activeDrag?.hoverSq?.row === r && activeDrag?.hoverSq?.col === c;
              const isCaptureBlast =
                moveAnim?.isCapture &&
                moveAnim.move.to.row === r &&
                moveAnim.move.to.col === c;
              const userTone = sqHighlights[`${r}-${c}`];
              const isHintSquare =
                hintMove &&
                ((hintMove.from.row === r && hintMove.from.col === c) ||
                  (hintMove.to.row === r && hintMove.to.col === c));

              const piece = board[r][c];
              const isPlayableSquare =
                canInteract &&
                (isValidDest ||
                  (!!piece && (!currentTurn || piece.color === currentTurn)));

              const isBottomRow = r === (flipped ? 0 : 7);
              const isLeftCol = c === (flipped ? 7 : 0);

              return (
                <div
                  key={`${r}-${c}`}
                  data-square={`${FILES[c]}${8 - r}`}
                  data-cursor={isPlayableSquare ? "interactive" : undefined}
                  onClick={() => {
                    if (!canInteract) return;
                    if (performance.now() - suppressNextClickRef.current < 120) return;
                    onSquareClick({ row: r, col: c });
                  }}
                  className="relative flex items-center justify-center transition-[filter] duration-150 hover:brightness-110"
                  style={{
                    background: isLight ? b2d.lightSquare : b2d.darkSquare,
                    cursor: isPlayableSquare ? "pointer" : "default",
                  }}
                >
                  {/* Procedural stone/wood grain overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: b2d.veinPattern,
                      opacity: b2d.veinOpacity,
                    }}
                  />

                  {/* Last move highlight */}
                  {(isLastFrom || isLastTo) && !isSelected && !isCheck && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: isLastTo ? b2d.lastMoveTo : b2d.lastMoveFrom,
                      }}
                    />
                  )}

                  {/* Selected highlight */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: b2d.selectedBg,
                        boxShadow: `inset 0 0 0 2px ${b2d.selectedRing}, inset 0 0 18px ${b2d.accentGlow}`,
                      }}
                    />
                  )}

                  {/* Check flare */}
                  {isCheck && (
                    <div
                      className="absolute inset-0 pointer-events-none animate-pulse"
                      style={{
                        background: `radial-gradient(circle, ${b2d.checkBg} 15%, rgba(185, 28, 28, 0.25) 100%)`,
                        boxShadow: `inset 0 0 18px ${b2d.checkRing}`,
                      }}
                    />
                  )}

                  {/* Hint square highlight */}
                  {isHintSquare && (
                    <div
                      className="absolute inset-0.5 rounded-sm pointer-events-none"
                      style={{
                        border: `2px solid ${b2d.hintColor}`,
                        boxShadow: `inset 0 0 12px ${b2d.hintColor}44`,
                      }}
                    />
                  )}

                  {/* Drag hover illumination */}
                  {isDragHover && (
                    <div
                      className="absolute inset-0 pointer-events-none z-10"
                      style={{
                        boxShadow: isValidDest
                          ? `inset 0 0 0 3px ${b2d.selectedRing}, inset 0 0 16px ${b2d.accentGlow}`
                          : "inset 0 0 0 2px rgba(255, 255, 255, 0.35)",
                      }}
                    />
                  )}

                  {/* User right-click tactical ring */}
                  {userTone && (
                    <div
                      className="absolute inset-1 rounded-full pointer-events-none z-10"
                      style={{
                        border: `2.5px solid ${TONE_COLORS[userTone].stroke}`,
                        background: TONE_COLORS[userTone].fill,
                      }}
                    />
                  )}

                  {/* Keyboard focus reticle */}
                  {isFocused && (
                    <div
                      className="absolute inset-0.5 rounded pointer-events-none z-30"
                      style={{
                        border: "2px dashed rgba(255, 255, 255, 0.88)",
                      }}
                    />
                  )}

                  {/* Capture impact shockwave */}
                  {isCaptureBlast && (
                    <div
                      key={`blast-${moveAnim.seq}`}
                      className="absolute inset-1 rounded-full pointer-events-none z-10 chess-capture-ring"
                      style={{
                        border: `2px solid ${b2d.captureRing}`,
                      }}
                    />
                  )}

                  {/* Valid destination markers */}
                  {isValidDest && (
                    isCaptureDest ? (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <span
                          className="absolute top-1 left-1 w-2.5 h-2.5 border-t-[2.5px] border-l-[2.5px] rounded-tl-xs"
                          style={{ borderColor: b2d.captureRing }}
                        />
                        <span
                          className="absolute top-1 right-1 w-2.5 h-2.5 border-t-[2.5px] border-r-[2.5px] rounded-tr-xs"
                          style={{ borderColor: b2d.captureRing }}
                        />
                        <span
                          className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-[2.5px] border-l-[2.5px] rounded-bl-xs"
                          style={{ borderColor: b2d.captureRing }}
                        />
                        <span
                          className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-[2.5px] border-r-[2.5px] rounded-br-xs"
                          style={{ borderColor: b2d.captureRing }}
                        />
                      </div>
                    ) : isCastleDest ? (
                      <div
                        className="absolute w-[38%] h-[38%] rounded-full z-10 pointer-events-none"
                        style={{
                          border: `2.5px solid ${b2d.validDot}`,
                          boxShadow: `0 0 10px ${b2d.accentGlow}`,
                        }}
                      />
                    ) : (
                      <div
                        className="absolute w-[28%] h-[28%] rounded-full z-10 pointer-events-none"
                        style={{
                          background: b2d.validDot,
                          boxShadow: `0 0 10px ${b2d.accentGlow}`,
                        }}
                      />
                    )
                  )}

                  {/* Coordinate labels */}
                  {showCoordinates && isBottomRow && (
                    <span
                      className="absolute bottom-0.5 right-1 text-[9px] sm:text-[10px] font-mono font-bold leading-none pointer-events-none z-10"
                      style={{
                        color: isLight ? b2d.coordOnLight : b2d.coordOnDark,
                      }}
                    >
                      {FILES[c]}
                    </span>
                  )}
                  {showCoordinates && isLeftCol && (
                    <span
                      className="absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-mono font-bold leading-none pointer-events-none z-10"
                      style={{
                        color: isLight ? b2d.coordOnLight : b2d.coordOnDark,
                      }}
                    >
                      {8 - r}
                    </span>
                  )}
                </div>
              );
            })
          )}

          {/* Smooth Animated Piece Layer (keyed by orientation so flip snaps instantly) */}
          <div
            key={flipped ? "pieces-flipped" : "pieces-normal"}
            className="absolute inset-0 pointer-events-none z-20"
          >
            {piecesList.map(({ piece, row, col }) => {
              const vCol = flipped ? 7 - col : col;
              const vRow = flipped ? 7 - row : row;
              const isSelected = selected?.row === row && selected?.col === col;
              const isDragging = activeDrag?.pieceId === piece.id;

              const transform = isDragging
                ? `translate3d(calc(${vCol * 100}% + ${activeDrag.dx}px), calc(${vRow * 100}% + ${activeDrag.dy}px), 0) scale(1.16)`
                : `translate3d(${vCol * 100}%, ${vRow * 100}%, 0) scale(${isSelected ? 1.09 : 1})`;

              return (
                <div
                  key={piece.id}
                  className="absolute top-0 left-0 w-[12.5%] h-[12.5%] flex items-center justify-center p-[6%]"
                  style={{
                    transform,
                    zIndex: isDragging ? 50 : isSelected ? 30 : 20,
                    transition: isDragging
                      ? "none"
                      : "transform 240ms cubic-bezier(0.22, 1, 0.36, 1)",
                    filter: isDragging
                      ? `drop-shadow(0 12px 18px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 12px ${b2d.accentGlow})`
                      : isSelected
                      ? `drop-shadow(0 0 10px ${b2d.accentGlow})`
                      : undefined,
                  }}
                >
                  <ChessPieceSVG
                    piece={piece}
                    themeId={themeId}
                    className="w-full h-full object-contain"
                  />
                </div>
              );
            })}
          </div>

          {/* Tactical & Hint SVG Arrow Layer */}
          {(arrows.length > 0 || hintMove) && (
            <svg
              viewBox="0 0 800 800"
              className="absolute inset-0 w-full h-full pointer-events-none z-30"
            >
              <defs>
                {(Object.keys(TONE_COLORS) as AnnotationTone[]).map((tone) => (
                  <marker
                    key={tone}
                    id={`${markerPrefix}-arrow-head-${tone}`}
                    markerWidth="4"
                    markerHeight="4"
                    refX="2.2"
                    refY="2"
                    orient="auto"
                  >
                    <polygon points="0 0, 4 2, 0 4" fill={TONE_COLORS[tone].stroke} />
                  </marker>
                ))}
                <marker
                  id={`${markerPrefix}-arrow-head-hint`}
                  markerWidth="4"
                  markerHeight="4"
                  refX="2.2"
                  refY="2"
                  orient="auto"
                >
                  <polygon points="0 0, 4 2, 0 4" fill={b2d.hintColor} />
                </marker>
              </defs>

              {arrows.map((arrow, idx) =>
                renderTacticalArrowPath(
                  arrow.from,
                  arrow.to,
                  flipped,
                  TONE_COLORS[arrow.tone].stroke,
                  `${markerPrefix}-arrow-head-${arrow.tone}`,
                  `user-arrow-${idx}`
                )
              )}

              {hintMove &&
                renderTacticalArrowPath(
                  hintMove.from,
                  hintMove.to,
                  flipped,
                  b2d.hintColor,
                  `${markerPrefix}-arrow-head-hint`,
                  "hint-arrow",
                  true
                )}
            </svg>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes chessCaptureWave {
          0% {
            transform: scale(0.45);
            opacity: 0.95;
          }
          100% {
            transform: scale(1.38);
            opacity: 0;
          }
        }
        .chess-capture-ring {
          animation: chessCaptureWave 420ms ease-out forwards;
        }
      `}</style>
    </div>
  );
});
