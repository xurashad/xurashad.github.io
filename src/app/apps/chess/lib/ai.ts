import { allLegalMoves, applyMove, isInCheck, opponent, computeEnPassantTarget } from "./chess";
import type { Board, Color, Move, Square, AIDifficulty } from "./types";

// ── Piece-square tables (evaluated from White perspective: row 0 = rank 8, row 7 = rank 1) ──

const PST: Record<string, number[][]> = {
  PAWN: [
    [  0,  0,  0,  0,  0,  0,  0,  0], // Rank 8 (promoted)
    [ 50, 50, 50, 50, 50, 50, 50, 50], // Rank 7 (1 step from promotion)
    [ 10, 10, 20, 30, 30, 20, 10, 10], // Rank 6
    [  5,  5, 10, 25, 25, 10,  5,  5], // Rank 5
    [  0,  0,  0, 20, 20,  0,  0,  0], // Rank 4
    [  5, -5,-10,  0,  0,-10, -5,  5], // Rank 3
    [  5, 10, 10,-20,-20, 10, 10,  5], // Rank 2 (starting rank)
    [  0,  0,  0,  0,  0,  0,  0,  0], // Rank 1
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
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  ROOK: [
    [  0,  0,  0,  0,  0,  0,  0,  0],
    [  5, 10, 10, 10, 10, 10, 10,  5], // 7th rank bonus
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [ -5,  0,  0,  0,  0,  0,  0, -5],
    [  0,  0,  0,  5,  5,  0,  0,  0], // Rank 1
  ],
  QUEEN: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
  ],
  KING: [
    [-30,-40,-40,-50,-50,-40,-40,-30], // Rank 8
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20], // Rank 2
    [ 20, 30, 10,  0,  0, 10, 30, 20], // Rank 1 (castled g1/c1 is best)
  ],
};

const PIECE_VALUE: Record<string, number> = {
  PAWN: 100, KNIGHT: 320, BISHOP: 330, ROOK: 500, QUEEN: 900, KING: 20000,
};

export function evaluateBoard(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const pst = PST[p.type];
      // For White: row index 0..7 matches table directly (row 0 = rank 8, row 7 = rank 1)
      // For Black: flip row index so Black advancing pawns get table rank 7/6/5 bonuses
      const tableRow = p.color === "WHITE" ? r : 7 - r;
      const val = PIECE_VALUE[p.type] + (pst ? pst[tableRow][c] : 0);
      score += p.color === "WHITE" ? val : -val;
    }
  }
  return score;
}

/**
 * Move ordering for optimal alpha-beta pruning (MVV-LVA)
 */
function scoreMoveForOrdering(board: Board, m: Move): number {
  let score = 0;
  const mover = board[m.from.row][m.from.col];
  const target = board[m.to.row][m.to.col];

  if (m.promotion) {
    score += 900;
  }
  if (target && mover) {
    // MVV-LVA: Most Valuable Victim - Least Valuable Attacker
    const victimVal = PIECE_VALUE[target.type] ?? 100;
    const attackerVal = PIECE_VALUE[mover.type] ?? 100;
    score += 1000 + victimVal * 10 - attackerVal;
  } else if (m.enPassantCapture) {
    score += 1050; // Pawn takes pawn via en passant
  }
  if (m.castlingRook) {
    score += 60;
  }
  // Bonus for occupying center
  if ((m.to.row === 3 || m.to.row === 4) && (m.to.col === 3 || m.to.col === 4)) {
    score += 20;
  }
  return score;
}

function orderMoves(board: Board, moves: Move[]): Move[] {
  return [...moves].sort((a, b) => scoreMoveForOrdering(board, b) - scoreMoveForOrdering(board, a));
}

// Minimax with Alpha-Beta Pruning
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximising: boolean,
  color: Color,
  enPassantTarget: Square | null,
): number {
  if (depth === 0) return evaluateBoard(board);

  const rawMoves = allLegalMoves(board, color, enPassantTarget);
  if (rawMoves.length === 0) {
    if (isInCheck(board, color, null)) {
      // Checkmate: prioritize faster mates by factoring in depth
      return maximising ? -100000 - depth : 100000 + depth;
    }
    return 0; // Stalemate
  }

  const moves = orderMoves(board, rawMoves);

  if (maximising) {
    let best = -Infinity;
    for (const m of moves) {
      const movingPiece = board[m.from.row][m.from.col]!;
      const nextEP = computeEnPassantTarget(m, movingPiece);
      const next = applyMove(board, m);
      best = Math.max(best, minimax(next, depth - 1, alpha, beta, false, opponent(color), nextEP));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const movingPiece = board[m.from.row][m.from.col]!;
      const nextEP = computeEnPassantTarget(m, movingPiece);
      const next = applyMove(board, m);
      best = Math.min(best, minimax(next, depth - 1, alpha, beta, true, opponent(color), nextEP));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

/**
 * Find best move for `color` with specified difficulty level:
 * - 'easy': Depth 1 with light randomization
 * - 'medium': Depth 3 with alpha-beta and move ordering
 * - 'hard': Depth 4 with alpha-beta and move ordering
 */
export function findBestMove(
  board: Board,
  color: Color,
  enPassantTarget: Square | null,
  difficulty: AIDifficulty = "medium",
): Move | null {
  const rawMoves = allLegalMoves(board, color, enPassantTarget);
  if (!rawMoves.length) return null;

  const depth = difficulty === "easy" ? 1 : difficulty === "hard" ? 4 : 3;
  const moves = orderMoves(board, rawMoves);
  const maximising = color === "WHITE";

  let bestScore = maximising ? -Infinity : Infinity;
  let bestMove: Move | null = null;
  const scoredMoves: { move: Move; score: number }[] = [];

  for (const m of moves) {
    const movingPiece = board[m.from.row][m.from.col]!;
    const nextEP = computeEnPassantTarget(m, movingPiece);
    const next = applyMove(board, m);
    const score = minimax(next, depth - 1, -Infinity, Infinity, !maximising, opponent(color), nextEP);

    scoredMoves.push({ move: m, score });

    if (maximising ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = m;
    }
  }

  // On easy mode, occasionally pick from the top 3 moves to feel natural and beatable
  if (difficulty === "easy" && scoredMoves.length > 1) {
    scoredMoves.sort((a, b) => maximising ? b.score - a.score : a.score - b.score);
    const topChoices = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    const randomPick = topChoices[Math.floor(Math.random() * topChoices.length)];
    return randomPick.move;
  }

  return bestMove;
}
