import {
  allLegalMoves,
  applyMove,
  isInCheck,
  opponent,
  computeEnPassantTarget,
} from "./chess";
import type { Board, Color, Move, Square, AIDifficulty } from "./types";

// ── Piece-square tables (evaluated from White perspective: row 0 = rank 8, row 7 = rank 1) ──

const PST: Record<string, number[][]> = {
  PAWN: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5, 5, 10, 25, 25, 10, 5, 5],
    [0, 0, 0, 20, 20, 0, 0, 0],
    [5, -5, -10, 0, 0, -10, -5, 5],
    [5, 10, 10, -20, -20, 10, 10, 5],
    [0, 0, 0, 0, 0, 0, 0, 0],
  ],
  KNIGHT: [
    [-50, -40, -30, -30, -30, -30, -40, -50],
    [-40, -20, 0, 5, 5, 0, -20, -40],
    [-30, 5, 10, 15, 15, 10, 5, -30],
    [-30, 0, 15, 20, 20, 15, 0, -30],
    [-30, 5, 15, 20, 20, 15, 5, -30],
    [-30, 0, 10, 15, 15, 10, 0, -30],
    [-40, -20, 0, 0, 0, 0, -20, -40],
    [-50, -40, -30, -30, -30, -30, -40, -50],
  ],
  BISHOP: [
    [-20, -10, -10, -10, -10, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 10, 10, 5, 0, -10],
    [-10, 5, 5, 10, 10, 5, 5, -10],
    [-10, 0, 10, 10, 10, 10, 0, -10],
    [-10, 10, 10, 10, 10, 10, 10, -10],
    [-10, 5, 0, 0, 0, 0, 5, -10],
    [-20, -10, -10, -10, -10, -10, -10, -20],
  ],
  ROOK: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 10, 10, 10, 10, 10, 5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [-5, 0, 0, 0, 0, 0, 0, -5],
    [0, 0, 0, 5, 5, 0, 0, 0],
  ],
  QUEEN: [
    [-20, -10, -10, -5, -5, -10, -10, -20],
    [-10, 0, 0, 0, 0, 0, 0, -10],
    [-10, 0, 5, 5, 5, 5, 0, -10],
    [-5, 0, 5, 5, 5, 5, 0, -5],
    [0, 0, 5, 5, 5, 5, 0, -5],
    [-10, 5, 5, 5, 5, 5, 0, -10],
    [-10, 0, 5, 0, 0, 0, 0, -10],
    [-20, -10, -10, -5, -5, -10, -10, -20],
  ],
  KING: [
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-30, -40, -40, -50, -50, -40, -40, -30],
    [-20, -30, -30, -40, -40, -30, -30, -20],
    [-10, -20, -20, -20, -20, -20, -20, -10],
    [20, 20, 0, 0, 0, 0, 20, 20],
    [20, 30, 10, 0, 0, 10, 30, 20],
  ],
};

const PIECE_VALUE: Record<string, number> = {
  PAWN: 100,
  KNIGHT: 320,
  BISHOP: 330,
  ROOK: 500,
  QUEEN: 900,
  KING: 20000,
};

export function evaluateBoard(board: Board): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const pst = PST[p.type];
      const tableRow = p.color === "WHITE" ? r : 7 - r;
      const val = PIECE_VALUE[p.type] + (pst ? pst[tableRow][c] : 0);
      score += p.color === "WHITE" ? val : -val;
    }
  }
  return score;
}

function sameMove(a: Move | null, b: Move): boolean {
  if (!a) return false;
  return (
    a.from.row === b.from.row &&
    a.from.col === b.from.col &&
    a.to.row === b.to.row &&
    a.to.col === b.to.col &&
    a.promotion === b.promotion
  );
}

/**
 * Move ordering for optimal alpha-beta pruning (MVV-LVA + PV move priority)
 */
function scoreMoveForOrdering(board: Board, m: Move, pvMove: Move | null): number {
  if (sameMove(pvMove, m)) return 100000;
  let score = 0;
  const mover = board[m.from.row][m.from.col];
  const target = board[m.to.row][m.to.col];

  if (m.promotion) {
    score += m.promotion === "QUEEN" ? 950 : 700;
  }
  if (target && mover) {
    const victimVal = PIECE_VALUE[target.type] ?? 100;
    const attackerVal = PIECE_VALUE[mover.type] ?? 100;
    score += 1000 + victimVal * 10 - attackerVal;
  } else if (m.enPassantCapture) {
    score += 1050;
  }
  if (m.castlingRook) {
    score += 65;
  }
  if ((m.to.row === 3 || m.to.row === 4) && (m.to.col === 3 || m.to.col === 4)) {
    score += 22;
  }
  return score;
}

function orderMoves(board: Board, moves: Move[], pvMove: Move | null = null): Move[] {
  return [...moves].sort(
    (a, b) => scoreMoveForOrdering(board, b, pvMove) - scoreMoveForOrdering(board, a, pvMove)
  );
}

interface SearchBudget {
  deadline: number;
  nodes: number;
  aborted: boolean;
}

function checkBudget(budget: SearchBudget): boolean {
  if (budget.aborted) return true;
  budget.nodes++;
  if ((budget.nodes & 63) === 0 && performance.now() >= budget.deadline) {
    budget.aborted = true;
    return true;
  }
  return false;
}

function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximising: boolean,
  color: Color,
  enPassantTarget: Square | null,
  budget: SearchBudget
): number {
  if (checkBudget(budget)) return 0;
  if (depth === 0) return evaluateBoard(board);

  const rawMoves = allLegalMoves(board, color, enPassantTarget);
  if (rawMoves.length === 0) {
    if (isInCheck(board, color, null)) {
      return maximising ? -100000 - depth : 100000 + depth;
    }
    return 0;
  }

  const moves = orderMoves(board, rawMoves);

  if (maximising) {
    let best = -Infinity;
    for (const m of moves) {
      const movingPiece = board[m.from.row][m.from.col]!;
      const nextEP = computeEnPassantTarget(m, movingPiece);
      const next = applyMove(board, m);
      const val = minimax(next, depth - 1, alpha, beta, false, opponent(color), nextEP, budget);
      if (budget.aborted) return best;
      if (val > best) best = val;
      if (best > alpha) alpha = best;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const movingPiece = board[m.from.row][m.from.col]!;
      const nextEP = computeEnPassantTarget(m, movingPiece);
      const next = applyMove(board, m);
      const val = minimax(next, depth - 1, alpha, beta, true, opponent(color), nextEP, budget);
      if (budget.aborted) return best;
      if (val < best) best = val;
      if (best < beta) beta = best;
      if (beta <= alpha) break;
    }
    return best;
  }
}

function runBoundedSearch(
  board: Board,
  color: Color,
  enPassantTarget: Square | null,
  maxDepth: number,
  timeBudgetMs: number
): { bestMove: Move | null; scoredMoves: { move: Move; score: number }[] } {
  const rawMoves = allLegalMoves(board, color, enPassantTarget);
  if (!rawMoves.length) return { bestMove: null, scoredMoves: [] };

  const maximising = color === "WHITE";
  const deadline = performance.now() + timeBudgetMs;
  const budget: SearchBudget = { deadline, nodes: 0, aborted: false };

  let bestMoveOverall: Move = rawMoves[0];
  let bestScoredOverall: { move: Move; score: number }[] = [];

  for (let depth = 1; depth <= maxDepth; depth++) {
    const ordered = orderMoves(board, rawMoves, bestMoveOverall);
    let alpha = -Infinity;
    let beta = Infinity;
    let iterBestScore = maximising ? -Infinity : Infinity;
    let iterBestMove: Move = ordered[0];
    const iterScored: { move: Move; score: number }[] = [];
    let completed = true;

    for (const m of ordered) {
      const movingPiece = board[m.from.row][m.from.col]!;
      const nextEP = computeEnPassantTarget(m, movingPiece);
      const next = applyMove(board, m);

      const score = minimax(
        next,
        depth - 1,
        alpha,
        beta,
        !maximising,
        opponent(color),
        nextEP,
        budget
      );

      if (budget.aborted) {
        completed = false;
        break;
      }

      iterScored.push({ move: m, score });
      if (maximising ? score > iterBestScore : score < iterBestScore) {
        iterBestScore = score;
        iterBestMove = m;
      }
      if (maximising) {
        if (iterBestScore > alpha) alpha = iterBestScore;
      } else {
        if (iterBestScore < beta) beta = iterBestScore;
      }
    }

    if (completed) {
      bestMoveOverall = iterBestMove;
      bestScoredOverall = iterScored;
      // Stop early if forced mate is already found
      if (Math.abs(iterBestScore) >= 99000) break;
    } else {
      break;
    }

    if (performance.now() >= deadline) break;
  }

  return { bestMove: bestMoveOverall, scoredMoves: bestScoredOverall };
}

/**
 * Find best move for `color` using iterative deepening within a strict time budget:
 * - 'easy': Depth 1, 150ms cap, light randomization among top moves
 * - 'medium': Depth up to 3, 450ms cap
 * - 'hard': Depth up to 4, 850ms cap
 */
export function findBestMove(
  board: Board,
  color: Color,
  enPassantTarget: Square | null,
  difficulty: AIDifficulty = "medium"
): Move | null {
  const maxDepth = difficulty === "easy" ? 1 : difficulty === "hard" ? 4 : 3;
  const timeBudgetMs = difficulty === "easy" ? 150 : difficulty === "hard" ? 850 : 450;

  const { bestMove, scoredMoves } = runBoundedSearch(
    board,
    color,
    enPassantTarget,
    maxDepth,
    timeBudgetMs
  );
  if (!bestMove) return null;

  if (difficulty === "easy" && scoredMoves.length > 1) {
    const maximising = color === "WHITE";
    const sorted = [...scoredMoves].sort((a, b) =>
      maximising ? b.score - a.score : a.score - b.score
    );
    const topChoices = sorted.slice(0, Math.min(3, sorted.length));
    return topChoices[Math.floor(Math.random() * topChoices.length)].move;
  }

  return bestMove;
}

/**
 * Fast tactical hint search (bounded to depth 3, 400ms max).
 */
export function findHintMove(
  board: Board,
  color: Color,
  enPassantTarget: Square | null
): Move | null {
  const { bestMove } = runBoundedSearch(board, color, enPassantTarget, 3, 400);
  return bestMove;
}
