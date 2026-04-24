import { allLegalMoves, applyMove, isInCheck, opponent } from "./chess";
import type { Board, Color, Move } from "./types";

// ── Piece-square tables (from white's perspective, row 0 = rank 8) ───────────

const PST: Record<string, number[][]> = {
  PAWN: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [10,10, 20, 30, 30, 20, 10, 10],
    [50,50, 50, 50, 50, 50, 50, 50],
    [0,  0,  0,  0,  0,  0,  0,  0],
  ],
  KNIGHT: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  BISHOP: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  ROOK: [
    [0,  0,  0,  5,  5,  0,  0,  0],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [-5, 0,  0,  0,  0,  0,  0, -5],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0],
  ],
  QUEEN: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [0,   0,  5,  5,  5,  5,  0, -5],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [-10, 0,  5,  5,  5,  5,  0,-10],
    [-10, 0,  0,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
  ],
  KING: [
    [20, 30, 10,  0,  0, 10, 30, 20],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
  ],
};

const PIECE_VALUE: Record<string, number> = {
  PAWN: 100, KNIGHT: 320, BISHOP: 330, ROOK: 500, QUEEN: 900, KING: 20000,
};

function evaluate(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const pst = PST[p.type];
      const tableRow = p.color === "WHITE" ? r : 7 - r;
      const val = PIECE_VALUE[p.type] + pst[tableRow][c];
      score += p.color === "WHITE" ? val : -val;
    }
  }
  return score;
}

// Iterative deepening minimax with alpha-beta
function minimax(
  board: Board, depth: number, alpha: number, beta: number,
  maximising: boolean, color: Color, enPassantTarget: null,
): number {
  if (depth === 0) return evaluate(board);

  const moves = allLegalMoves(board, color, enPassantTarget);
  if (moves.length === 0) {
    if (isInCheck(board, color, null)) return maximising ? -Infinity : Infinity;
    return 0; // stalemate
  }

  if (maximising) {
    let best = -Infinity;
    for (const m of moves) {
      const next = applyMove(board, m);
      best = Math.max(best, minimax(next, depth - 1, alpha, beta, false, opponent(color), null));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const next = applyMove(board, m);
      best = Math.min(best, minimax(next, depth - 1, alpha, beta, true, opponent(color), null));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

/**
 * Find best move for `color` at `depth` half-moves.
 * depth=3 is good for a challenging amateur opponent; depth=2 is fast.
 */
export function findBestMove(
  board: Board, color: Color, enPassantTarget: null, depth = 3,
): Move | null {
  const moves = allLegalMoves(board, color, enPassantTarget);
  if (!moves.length) return null;

  const maximising = color === "WHITE";
  let bestScore = maximising ? -Infinity : Infinity;
  let best: Move | null = null;

  // Shuffle for variety among equal-scored moves
  const shuffled = [...moves].sort(() => Math.random() - 0.5);

  for (const m of shuffled) {
    const next = applyMove(board, m);
    const score = minimax(next, depth - 1, -Infinity, Infinity, !maximising, opponent(color), null);
    if (maximising ? score > bestScore : score < bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
