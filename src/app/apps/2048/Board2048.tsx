"use client";

import { useRef } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  Share2,
  Sparkles,
  Trophy,
  Undo2,
} from "lucide-react";
import { canMove } from "./lib/engine";
import { getTileVisualStyle, type Theme2048 } from "./lib/themes";
import type {
  Direction,
  GameState,
  GridSize,
  PowerUpType,
  Tile,
} from "./lib/types";
import {
  TileParticleCanvas,
  type TileParticleHandle,
} from "./TileParticleCanvas";

export interface CellPopup {
  id: number;
  row: number;
  col: number;
  value: number;
}

interface RenderTileItem {
  tile: Tile;
  isParentGhost: boolean;
}

interface Board2048Props {
  state: GameState;
  theme: Theme2048;
  targetTile: number;
  nudgeDir: Direction | null;
  activePowerUp: PowerUpType | null;
  selectedSwapId: number | null;
  hintDirection: Direction | null;
  cellPopups: CellPopup[];
  particleRef: React.RefObject<TileParticleHandle | null>;
  onMove: (dir: Direction) => void;
  onTileClick: (tile: Tile) => void;
  onKeepPlaying: () => void;
  onUndo: () => void;
  onReset: () => void;
  onShare: () => void;
  copiedShare: boolean;
}

function gapForGrid(gridSize: GridSize): number {
  switch (gridSize) {
    case 3:
      return 12;
    case 4:
      return 11;
    case 5:
      return 9;
    case 6:
      return 7;
  }
}

function tileFontCqw(value: number, gridSize: GridSize): string {
  const digits = String(Math.abs(value)).length;
  let base = 10.6;
  if (digits === 3) base = 8.4;
  else if (digits === 4) base = 6.7;
  else if (digits === 5) base = 5.4;
  else if (digits >= 6) base = 4.5;
  const scaled = (base * 4) / gridSize;
  return `${scaled.toFixed(2)}cqw`;
}

const HINT_ICON_MAP = {
  up: ArrowUp,
  down: ArrowDown,
  left: ArrowLeft,
  right: ArrowRight,
} as const;

export function Board2048({
  state,
  theme,
  targetTile,
  nudgeDir,
  activePowerUp,
  selectedSwapId,
  hintDirection,
  cellPopups,
  particleRef,
  onMove,
  onTileClick,
  onKeepPlaying,
  onUndo,
  onReset,
  onShare,
  copiedShare,
}: Board2048Props) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const N = state.gridSize;
  const gapPx = gapForGrid(N);
  const cellSizeCalc = `calc((100% - ${(N - 1) * gapPx}px) / ${N})`;

  // Flatten active tiles + ephemeral mergedFrom parents and sort stably by id
  const renderItems: RenderTileItem[] = [];
  for (const t of state.tiles) {
    if (t.mergedFrom) {
      renderItems.push({ tile: t.mergedFrom[0], isParentGhost: true });
      renderItems.push({ tile: t.mergedFrom[1], isParentGhost: true });
    }
    renderItems.push({ tile: t, isParentGhost: false });
  }
  renderItems.sort((a, b) => a.tile.id - b.tile.id);

  const normalTileCount = state.tiles.filter((t) => !t.isObstacle).length;
  const showVictoryOverlay = state.won && !state.keepPlaying;
  const showGameOverOverlay = state.lost && !showVictoryOverlay;
  const canContinueAfterWin = showVictoryOverlay
    ? canMove(state.tiles, state.gridSize, state.variant)
    : false;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePowerUp || showVictoryOverlay || showGameOverOverlay) return;
    if ((e.target as HTMLElement).closest("button")) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    pointerStart.current = null;

    if (activePowerUp || showVictoryOverlay || showGameOverOverlay) return;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      onMove(dx > 0 ? "right" : "left");
    } else {
      onMove(dy > 0 ? "down" : "up");
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    pointerStart.current = null;
  };

  const nudgeClass = nudgeDir ? `g2048-nudge-${nudgeDir}` : "";
  const HintIcon = hintDirection ? HINT_ICON_MAP[hintDirection] : null;

  return (
    <div
      className={`relative w-full aspect-square rounded-2xl touch-none select-none transition-colors duration-300 ${nudgeClass}`}
      style={{
        background: theme.boardBg,
        border: `1.5px solid ${theme.boardBorder}`,
        boxShadow: theme.boardShadow,
        padding: `${gapPx}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      role="region"
      aria-label={`${N} by ${N} 2048 game board`}
    >
      {/* Inner stage (padding-free coordinate box matching grid cells 1:1) */}
      <div
        className="relative w-full h-full"
        style={{ containerType: "inline-size" }}
      >
        {/* Layer 1: Background cell grid */}
        <div
          className="grid w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${N}, minmax(0, 1fr))`,
            gap: `${gapPx}px`,
          }}
          aria-hidden="true"
        >
          {Array.from({ length: N * N }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl"
              style={{
                background: theme.emptyCellBg,
                border: `1px solid ${theme.emptyCellBorder}`,
              }}
            />
          ))}
        </div>

        {/* Layer 2: Active & merging tiles */}
        {renderItems.map(({ tile, isParentGhost }) => {
          const style = getTileVisualStyle(theme, tile.value, state.variant);
          const isSelectedSwap = selectedSwapId === tile.id;
          const canTarget =
            activePowerUp !== null &&
            !isParentGhost &&
            !tile.isObstacle &&
            (activePowerUp === "swap" || normalTileCount > 1);

          let animClass = "";
          if (isParentGhost) {
            animClass = "g2048-tile-parent";
          } else if (tile.isMerged) {
            animClass = "g2048-tile-merge";
          } else if (tile.isNew) {
            animClass = "g2048-tile-spawn";
          }

          const translateX = `calc(${tile.col} * (100% + ${gapPx}px))`;
          const translateY = `calc(${tile.row} * (100% + ${gapPx}px))`;

          const combinedShadow = style.glow
            ? `${style.shadow}, ${style.glow}`
            : style.shadow;

          return (
            <div
              key={tile.id}
              className="absolute top-0 left-0 will-change-transform"
              style={{
                width: cellSizeCalc,
                height: cellSizeCalc,
                transform: `translate3d(${translateX}, ${translateY}, 0)`,
                transition: "transform 130ms cubic-bezier(0.22, 1, 0.36, 1)",
                zIndex: isParentGhost
                  ? 10
                  : tile.isObstacle
                    ? 12
                    : tile.isMerged
                      ? 20
                      : 15,
                pointerEvents: canTarget ? "auto" : "none",
              }}
            >
              <button
                type="button"
                disabled={!canTarget}
                onClick={() => canTarget && onTileClick(tile)}
                aria-label={
                  tile.isObstacle
                    ? "Singularity obstacle"
                    : `Tile ${tile.value} at row ${tile.row + 1} column ${tile.col + 1}`
                }
                className={`relative w-full h-full rounded-xl flex items-center justify-center font-bold overflow-hidden transition-transform duration-150 ${animClass} ${
                  canTarget
                    ? "cursor-pointer hover:scale-[1.04] active:scale-95"
                    : "cursor-default"
                } ${
                  isSelectedSwap ? "ring-2 ring-white g2048-ring-pulse scale-[1.05]" : ""
                } ${
                  activePowerUp === "smash" && canTarget
                    ? "hover:ring-2 hover:ring-rose-400"
                    : activePowerUp === "swap" && canTarget && !isSelectedSwap
                      ? "hover:ring-2 hover:ring-cyan-300"
                      : ""
                } ${
                  activePowerUp && tile.isObstacle ? "opacity-55" : ""
                }`}
                style={{
                  background: style.bg,
                  color: style.text,
                  border: `1px solid ${style.border}`,
                  boxShadow: combinedShadow,
                  fontSize: tile.isObstacle
                    ? tileFontCqw(100, N)
                    : tileFontCqw(tile.value, N),
                  lineHeight: 1,
                }}
              >
                {style.shimmer && !isParentGhost && (
                  <span className="g2048-shimmer-sheen" aria-hidden="true" />
                )}

                {tile.isObstacle ? (
                  <span
                    className="relative flex items-center justify-center w-full h-full"
                    title="Singularity Core — immovable obstacle"
                  >
                    <span
                      className="w-[54%] h-[54%] rounded-full border border-dashed opacity-70 animate-[spin_14s_linear_infinite]"
                      style={{ borderColor: style.text }}
                    />
                    <span
                      className="absolute w-[24%] h-[24%] rounded-full"
                      style={{
                        background: style.text,
                        boxShadow: `0 0 10px ${style.text}`,
                      }}
                    />
                  </span>
                ) : (
                  <span className="relative z-10 tracking-tight tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]">
                    {tile.value}
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Layer 3a: Per-cell merge score popups */}
        {cellPopups.map((pop) => (
          <div
            key={pop.id}
            aria-hidden="true"
            className="absolute pointer-events-none z-30 font-mono font-bold text-xs sm:text-sm g2048-cell-delta whitespace-nowrap drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]"
            style={{
              left: `${((pop.col + 0.5) / N) * 100}%`,
              top: `${((pop.row + 0.28) / N) * 100}%`,
              color: theme.scoreFlashColor,
            }}
          >
            +{pop.value}
          </div>
        ))}

        {/* Layer 3b: Hint directional beacon */}
        {HintIcon && hintDirection && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          >
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/85 text-white border shadow-2xl g2048-ring-pulse backdrop-blur-md"
              style={{
                borderColor: theme.accentColor,
                boxShadow: `0 0 28px ${theme.accentSoft}`,
              }}
            >
              <HintIcon size={20} style={{ color: theme.accentColor }} />
              <span className="text-xs font-mono uppercase tracking-widest font-semibold">
                Slide {hintDirection}
              </span>
            </div>
          </div>
        )}

        {/* Layer 3c: Particle burst canvas */}
        <TileParticleCanvas ref={particleRef} />
      </div>

      {/* Layer 4a: Victory Overlay (always dark high-contrast surface for light & dark themes) */}
      {showVictoryOverlay && (
        <div
          className="absolute inset-0 z-40 rounded-2xl bg-slate-950/86 backdrop-blur-md flex flex-col items-center justify-center gap-4 p-6 text-center text-white g2048-overlay-in"
          role="dialog"
          aria-modal="false"
          aria-label="Victory achieved"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-300/40 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.35)]">
            <Trophy size={30} className="text-amber-300" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-amber-300/85 mb-1">
              Target Reached
            </div>
            <h3 className="text-3xl font-bold text-white">
              {targetTile.toLocaleString()} Forged!
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Score{" "}
              <span className="font-mono font-bold text-white">
                {state.score.toLocaleString()}
              </span>{" "}
              in {state.moveCount} moves
              {!state.usedAssist && " · Pure Run"}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
            {canContinueAfterWin && (
              <button
                type="button"
                onClick={onKeepPlaying}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400/20 border border-cyan-300/45 text-cyan-200 text-sm font-semibold hover:bg-cyan-400/30 transition-colors cursor-pointer"
              >
                <Sparkles size={15} />
                Keep Playing
              </button>
            )}
            {!canContinueAfterWin &&
              !state.dailyDate &&
              state.history.length > 0 && (
                <button
                  type="button"
                  onClick={onUndo}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400/20 border border-amber-300/45 text-amber-200 text-sm font-semibold hover:bg-amber-400/30 transition-colors cursor-pointer"
                >
                  <Undo2 size={15} />
                  Undo Last Move
                </button>
              )}
            <button
              type="button"
              onClick={onShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Share2 size={15} />
              {copiedShare ? "Copied!" : "Share"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-slate-200 text-sm font-semibold hover:bg-white/20 transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
              New Game
            </button>
          </div>
        </div>
      )}

      {/* Layer 4b: Game Over Overlay */}
      {showGameOverOverlay && (
        <div
          className="absolute inset-0 z-40 rounded-2xl bg-slate-950/88 backdrop-blur-md flex flex-col items-center justify-center gap-4 p-6 text-center text-white g2048-overlay-in"
          role="dialog"
          aria-modal="false"
          aria-label="Game over"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-400/40 flex items-center justify-center shadow-[0_0_28px_rgba(244,63,94,0.3)]">
            <AlertTriangle size={28} className="text-rose-300" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-rose-300/85 mb-1">
              {state.won ? "Endless Run Complete" : "No Moves Remaining"}
            </div>
            <h3 className="text-3xl font-bold text-white">
              {state.won ? "Final Tally" : "Game Over"}
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Score{" "}
              <span className="font-mono font-bold text-white">
                {state.score.toLocaleString()}
              </span>{" "}
              · Peak Tile{" "}
              <span className="font-mono font-bold text-amber-300">
                {state.highestTile}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
            {!state.dailyDate && state.history.length > 0 && (
              <button
                type="button"
                onClick={onUndo}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400/20 border border-amber-300/45 text-amber-200 text-sm font-semibold hover:bg-amber-400/30 transition-colors cursor-pointer"
              >
                <Undo2 size={15} />
                Undo Last Move
              </button>
            )}
            <button
              type="button"
              onClick={onShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Share2 size={15} />
              {copiedShare ? "Copied!" : "Share"}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/25 border border-rose-400/45 text-rose-100 text-sm font-semibold hover:bg-rose-500/35 transition-colors cursor-pointer"
            >
              <RotateCcw size={15} />
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
