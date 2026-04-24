/** Game logic for 2048 — pure functions, no DOM/React dependencies. */

export const GRID = 4;

export type Board = number[][];
export type Direction = "up" | "down" | "left" | "right";

export interface TileAnim {
  id: number;        // stable tile identity
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

export interface MoveResult {
  board: Board;
  scoreDelta: number;
  moved: boolean;
  tiles: TileAnim[];
}

/** Tile colour palette — deep purple → pink gradient */
export const TILE_STYLES: Record<number, { bg: string; text: string }> = {
  2:    { bg: "#6e44ff", text: "#fff" },
  4:    { bg: "#8c5dff", text: "#fff" },
  8:    { bg: "#a37aff", text: "#fff" },
  16:   { bg: "#b994ff", text: "#fff" },
  32:   { bg: "#d0b0ff", text: "#1e1b3a" },
  64:   { bg: "#e7ccff", text: "#1e1b3a" },
  128:  { bg: "#ff94c2", text: "#1e1b3a" },
  256:  { bg: "#ff7ab4", text: "#fff" },
  512:  { bg: "#ff61a6", text: "#fff" },
  1024: { bg: "#ff4798", text: "#fff" },
  2048: { bg: "#ff2e8a", text: "#fff" },
  4096: { bg: "#e5006e", text: "#fff" },
  8192: { bg: "#c3005f", text: "#fff" },
};

export function tileStyle(v: number) {
  return TILE_STYLES[v] ?? { bg: "#64748b", text: "#fff" };
}

export function tileFontSize(v: number) {
  if (v >= 10000) return "1.1rem";
  if (v >= 1000)  return "1.4rem";
  if (v >= 100)   return "1.6rem";
  return "1.85rem";
}

/** Create an empty board. */
export function emptyBoard(): Board {
  return Array.from({ length: GRID }, () => Array(GRID).fill(0));
}

/** Get all empty cells. */
export function emptyCells(board: Board): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (board[r][c] === 0) cells.push({ r, c });
  return cells;
}

/** Add one random tile (90% chance → 2, 10% → 4). Returns the cell or null. */
export function addRandom(board: Board): { r: number; c: number; value: number } | null {
  const cells = emptyCells(board);
  if (!cells.length) return null;
  const cell = cells[Math.floor(Math.random() * cells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  board[cell.r][cell.c] = value;
  return { ...cell, value };
}

/** Slide a single 1-D row left, return { newRow, score }. */
function slideLeft(row: number[]): { newRow: number[]; score: number } {
  const filtered = row.filter((v) => v !== 0);
  const newRow: number[] = [];
  let score = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const merged = filtered[i] * 2;
      newRow.push(merged);
      score += merged;
      i++;
    } else {
      newRow.push(filtered[i]);
    }
  }
  while (newRow.length < GRID) newRow.push(0);
  return { newRow, score };
}

/** Apply a move to the board. Returns MoveResult. */
export function applyMove(board: Board, dir: Direction, nextId: () => number): MoveResult {
  const b = board.map((r) => [...r]);
  let scoreDelta = 0;
  let moved = false;
  const tiles: TileAnim[] = [];

  // Build a per-cell ID map from the current board
  const idGrid: number[][] = Array.from({ length: GRID }, () => Array(GRID).fill(-1));
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (b[r][c] !== 0) idGrid[r][c] = nextId();

  const isHoriz = dir === "left" || dir === "right";
  const reverse = dir === "right" || dir === "down";

  for (let i = 0; i < GRID; i++) {
    // Extract line
    let line: number[] = [];
    let lineIds: number[] = [];
    for (let j = 0; j < GRID; j++) {
      const [r, c] = isHoriz ? [i, j] : [j, i];
      line.push(b[r][c]);
      lineIds.push(idGrid[r][c]);
    }

    if (reverse) { line.reverse(); lineIds.reverse(); }

    const { newRow, score } = slideLeft(line);
    scoreDelta += score;

    if (reverse) { newRow.reverse(); lineIds.reverse(); }

    // Detect change
    for (let j = 0; j < GRID; j++) {
      const [r, c] = isHoriz ? [i, j] : [j, i];
      if (b[r][c] !== newRow[j]) moved = true;
      b[r][c] = newRow[j];
    }
  }

  // Place tiles for rendering (simplified — new tile placed separately by caller)
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++)
      if (b[r][c] !== 0)
        tiles.push({ id: nextId(), value: b[r][c], row: r, col: c });

  return { board: b, scoreDelta, moved, tiles };
}

/** Check whether any move is possible. */
export function canMove(board: Board): boolean {
  if (emptyCells(board).length > 0) return true;
  for (let r = 0; r < GRID; r++)
    for (let c = 0; c < GRID; c++) {
      const v = board[r][c];
      if (c < GRID - 1 && board[r][c + 1] === v) return true;
      if (r < GRID - 1 && board[r + 1][c] === v) return true;
    }
  return false;
}

/** True if any cell equals 2048. */
export function hasWon(board: Board): boolean {
  return board.some((row) => row.some((v) => v === 2048));
}
