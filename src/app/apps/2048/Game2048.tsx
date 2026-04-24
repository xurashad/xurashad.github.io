"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, Trophy, AlertTriangle } from "lucide-react";
import {
  emptyBoard, addRandom, applyMove, canMove, hasWon,
  tileStyle, tileFontSize,
  GRID, type Board, type Direction,
} from "./lib/game";

/* ── Score flash ─────────────────────────────────────────────────────────── */
interface ScoreFlash { id: number; value: number }

/* ── Tile view ───────────────────────────────────────────────────────────── */
interface TileView {
  id: number; value: number;
  row: number; col: number;
  isNew?: boolean; isMerged?: boolean;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
function initGame() {
  const board = emptyBoard();
  addRandom(board);
  addRandom(board);
  return board;
}

function boardToTiles(board: Board, idCounter: { n: number }): TileView[] {
  const tiles: TileView[] = [];
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (board[r][c] !== 0)
        tiles.push({ id: ++idCounter.n, value: board[r][c], row: r, col: c });
  return tiles;
}

/* ── main component ──────────────────────────────────────────────────────── */
export function Game2048() {
  const idCounter = useRef({ n: 0 });
  const [board, setBoard]       = useState<Board>(() => initGame());
  const [tiles, setTiles]       = useState<TileView[]>(() => boardToTiles(initGame(), idCounter.current));
  const [score, setScore]       = useState(0);
  const [best, setBest]         = useState(0);
  const [flashes, setFlashes]   = useState<ScoreFlash[]>([]);
  const [won, setWon]           = useState(false);
  const [lost, setLost]         = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  /* ── reset ── */
  const reset = useCallback(() => {
    const b = emptyBoard();
    addRandom(b);
    addRandom(b);
    setBoard(b);
    setTiles(boardToTiles(b, idCounter.current));
    setScore(0);
    setFlashes([]);
    setWon(false);
    setLost(false);
    setKeepPlaying(false);
  }, []);

  /* ── move ── */
  const doMove = useCallback((dir: Direction) => {
    if (lost || (won && !keepPlaying)) return;

    setBoard((prev) => {
      const { board: newBoard, scoreDelta, moved } = applyMove(prev, dir, () => ++idCounter.current.n);
      if (!moved) return prev;

      // Place new random tile
      const newTileInfo = addRandom(newBoard);

      // Build tile list
      const newTiles: TileView[] = [];
      for (let r = 0; r < GRID; r++)
        for (let c = 0; c < GRID; c++)
          if (newBoard[r][c] !== 0)
            newTiles.push({
              id: ++idCounter.current.n,
              value: newBoard[r][c],
              row: r, col: c,
              isNew: !!(newTileInfo && newTileInfo.r === r && newTileInfo.c === c),
            });
      setTiles(newTiles);

      // Score
      if (scoreDelta > 0) {
        setScore((s) => {
          const next = s + scoreDelta;
          setBest((b) => Math.max(b, next));
          return next;
        });
        const flashId = ++idCounter.current.n;
        setFlashes((f) => [...f, { id: flashId, value: scoreDelta }]);
        setTimeout(() => setFlashes((f) => f.filter((x) => x.id !== flashId)), 900);
      }

      // Win / lose
      if (!keepPlaying && hasWon(newBoard)) setWon(true);
      if (!canMove(newBoard)) setTimeout(() => setLost(true), 300);

      return newBoard;
    });
  }, [lost, won, keepPlaying]);

  /* ── keyboard ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right",
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); doMove(dir); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doMove]);

  /* ── touch ── */
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
  };

  /* ── cell size (CSS grid: 4 cells + 3 gaps of 12px inside 100%) ── */
  const cellPct = "calc((100% - 36px) / 4)";
  const gapPx = 12;

  const cellTop  = (r: number) => `calc(${r} * ((100% - 36px) / 4 + 12px))`;
  const cellLeft = (c: number) => `calc(${c} * ((100% - 36px) / 4 + 12px))`;

  return (
    <div className="flex flex-col items-center gap-6 select-none">

      {/* Header */}
      <div className="flex w-full max-w-sm items-center justify-between">
        <div>
          <h2 className="text-5xl font-bold tracking-widest bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            2048
          </h2>
          <p className="text-xs text-foreground/35 mt-0.5">Join the tiles — reach 2048!</p>
        </div>

        <div className="flex items-end gap-3">
          {/* Score boxes */}
          {[{ label: "SCORE", value: score }, { label: "BEST", value: best }].map(({ label, value }) => (
            <div key={label} className="glass-card px-4 py-2 text-center min-w-[64px]">
              <div className="text-[9px] font-mono text-foreground/30 tracking-widest">{label}</div>
              <div className="text-xl font-bold text-foreground/80">{value.toLocaleString()}</div>
            </div>
          ))}

          {/* New game */}
          <button
            onClick={reset}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-foreground/40 hover:text-foreground/80 hover:border-white/20 transition-all"
            aria-label="New game"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="relative w-full max-w-sm">
        <div
          className="relative w-full rounded-2xl bg-black/40 border border-white/8 p-[12px]"
          style={{ aspectRatio: "1" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Background cells */}
          {Array.from({ length: GRID * GRID }).map((_, i) => {
            const r = Math.floor(i / GRID), c = i % GRID;
            return (
              <div
                key={i}
                className="absolute rounded-xl bg-white/5"
                style={{
                  width: cellPct, height: cellPct,
                  top: cellTop(r), left: cellLeft(c),
                }}
              />
            );
          })}

          {/* Tiles */}
          {tiles.map((tile) => {
            const style = tileStyle(tile.value);
            return (
              <div
                key={tile.id}
                className={`absolute rounded-xl flex items-center justify-center font-bold shadow-lg
                  ${tile.isNew ? "animate-[spawn_0.18s_ease-out]" : ""}
                  ${tile.isMerged ? "animate-[merge_0.18s_ease-out]" : ""}
                  transition-[top,left] duration-[120ms] ease-in-out`}
                style={{
                  width: cellPct, height: cellPct,
                  top: cellTop(tile.row), left: cellLeft(tile.col),
                  backgroundColor: style.bg,
                  color: style.text,
                  fontSize: tileFontSize(tile.value),
                }}
              >
                {tile.value}
              </div>
            );
          })}

          {/* Score flash */}
          {flashes.map((f) => (
            <div
              key={f.id}
              className="absolute top-4 right-6 text-2xl font-bold text-fuchsia-300 pointer-events-none animate-[fadeUp_0.85s_ease-out_forwards]"
            >
              +{f.value}
            </div>
          ))}

          {/* Win overlay */}
          {won && !keepPlaying && (
            <div className="absolute inset-0 rounded-2xl bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
              <Trophy size={48} className="text-yellow-400" />
              <h3 className="text-3xl font-bold text-yellow-300">You Won!</h3>
              <p className="text-sm text-foreground/50">You reached 2048!</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setKeepPlaying(true)}
                  className="px-4 py-2 rounded-xl border border-quantum/30 bg-quantum/15 text-quantum text-sm font-semibold hover:bg-quantum/25 transition-all"
                >
                  Keep playing
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2 rounded-xl border border-white/15 text-foreground/50 text-sm font-semibold hover:bg-white/8 transition-all"
                >
                  New game
                </button>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {lost && (
            <div className="absolute inset-0 rounded-2xl bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
              <AlertTriangle size={48} className="text-crimson/80" />
              <h3 className="text-3xl font-bold text-crimson/80">Game Over</h3>
              <p className="text-sm text-foreground/40">Final score: <span className="text-foreground/70 font-bold">{score.toLocaleString()}</span></p>
              <button
                onClick={reset}
                className="px-5 py-2.5 rounded-xl border border-crimson/30 bg-crimson/15 text-crimson/80 text-sm font-semibold hover:bg-crimson/25 transition-all"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <p className="text-xs text-foreground/25 text-center">
        Arrow keys / WASD · Swipe on mobile
      </p>
    </div>
  );
}
