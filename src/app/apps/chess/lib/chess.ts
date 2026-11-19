import type {
  Board, Color, Piece, PieceType, Square, Move, GameStatus,
} from "./types";

// ── Board factory ────────────────────────────────────────────────────────────

export function createInitialBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const order: PieceType[] = ["ROOK", "KNIGHT", "BISHOP", "QUEEN", "KING", "BISHOP", "KNIGHT", "ROOK"];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { id: `b-${order[c]}-${c}`, type: order[c], color: "BLACK", hasMoved: false };
    b[1][c] = { id: `b-PAWN-${c}`, type: "PAWN", color: "BLACK", hasMoved: false };
    b[6][c] = { id: `w-PAWN-${c}`, type: "PAWN", color: "WHITE", hasMoved: false };
    b[7][c] = { id: `w-${order[c]}-${c}`, type: order[c], color: "WHITE", hasMoved: false };
  }
  return b;
}

export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(p => (p ? { ...p } : null)));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
export const opponent = (c: Color): Color => (c === "WHITE" ? "BLACK" : "WHITE");

// ── Pseudo-legal move generation ─────────────────────────────────────────────

/**
 * Returns pseudo-legal moves for a piece (not filtered for self-check).
 * `enPassantTarget` is the square BEHIND the just-double-pushed pawn (where the
 * capturing pawn lands), as per standard chess notation.
 */
export function pseudoMoves(
  board: Board,
  piece: Piece,
  pos: Square,
  enPassantTarget: Square | null,
  forAttack = false, // when true: pawn attacks, no castling
): Move[] {
  const { row, col } = pos;
  const moves: Move[] = [];

  const push = (toR: number, toC: number) => {
    if (inBounds(toR, toC)) {
      const t = board[toR][toC];
      if (!t || t.color !== piece.color) {
        moves.push({ from: pos, to: { row: toR, col: toC } });
      }
    }
  };

  const slide = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let r = row + dr, c = col + dc;
      while (inBounds(r, c)) {
        const t = board[r][c];
        if (!t) {
          moves.push({ from: pos, to: { row: r, col: c } });
        } else {
          if (t.color !== piece.color) moves.push({ from: pos, to: { row: r, col: c } });
          break;
        }
        r += dr;
        c += dc;
      }
    }
  };

  switch (piece.type) {
    case "ROOK":
      slide([[0, 1], [0, -1], [1, 0], [-1, 0]]);
      break;

    case "BISHOP":
      slide([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
      break;

    case "QUEEN":
      slide([[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
      break;

    case "KNIGHT":
      for (const [dr, dc] of [
        [2, 1], [2, -1], [-2, 1], [-2, -1],
        [1, 2], [1, -2], [-1, 2], [-1, -2],
      ] as [number, number][]) {
        push(row + dr, col + dc);
      }
      break;

    case "KING":
      for (const [dr, dc] of [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1],
      ] as [number, number][]) {
        push(row + dr, col + dc);
      }

      // Castling
      const homeRow = piece.color === "WHITE" ? 7 : 0;
      if (
        !forAttack &&
        !piece.hasMoved &&
        pos.row === homeRow &&
        pos.col === 4 &&
        !isInCheck(board, piece.color, enPassantTarget)
      ) {
        const opp = opponent(piece.color);
        // Kingside castling (O-O)
        if (!board[row][5] && !board[row][6]) {
          const rook = board[row][7];
          if (
            rook?.type === "ROOK" &&
            rook.color === piece.color &&
            !rook.hasMoved &&
            !isSquareAttacked(board, { row, col: 5 }, opp, null) &&
            !isSquareAttacked(board, { row, col: 6 }, opp, null)
          ) {
            moves.push({
              from: pos,
              to: { row, col: 6 },
              castlingRook: { from: { row, col: 7 }, to: { row, col: 5 } },
            });
          }
        }
        // Queenside castling (O-O-O)
        if (!board[row][3] && !board[row][2] && !board[row][1]) {
          const rook = board[row][0];
          if (
            rook?.type === "ROOK" &&
            rook.color === piece.color &&
            !rook.hasMoved &&
            !isSquareAttacked(board, { row, col: 3 }, opp, null) &&
            !isSquareAttacked(board, { row, col: 2 }, opp, null)
          ) {
            moves.push({
              from: pos,
              to: { row, col: 2 },
              castlingRook: { from: { row, col: 0 }, to: { row, col: 3 } },
            });
          }
        }
      }
      break;

    case "PAWN": {
      const dir = piece.color === "WHITE" ? -1 : 1;
      const startRow = piece.color === "WHITE" ? 6 : 1;
      const epRank = piece.color === "WHITE" ? 3 : 4;

      if (forAttack) {
        // Just the attack squares (used by isSquareAttacked)
        for (const dc of [-1, 1]) {
          if (inBounds(row + dir, col + dc)) {
            moves.push({ from: pos, to: { row: row + dir, col: col + dc } });
          }
        }
      } else {
        // Forward push
        if (inBounds(row + dir, col) && !board[row + dir][col]) {
          moves.push({ from: pos, to: { row: row + dir, col } });
          if (row === startRow && !board[row + 2 * dir][col]) {
            moves.push({ from: pos, to: { row: row + 2 * dir, col } });
          }
        }
        // Diagonal Captures
        for (const dc of [-1, 1]) {
          const tr = row + dir, tc = col + dc;
          if (inBounds(tr, tc)) {
            const t = board[tr][tc];
            if (t && t.color !== piece.color) {
              moves.push({ from: pos, to: { row: tr, col: tc } });
            }
            // En passant capture: requires legal EP rank, empty destination, and opponent pawn victim
            if (
              row === epRank &&
              enPassantTarget &&
              tr === enPassantTarget.row &&
              tc === enPassantTarget.col &&
              !t
            ) {
              const epVictim = board[row][tc];
              if (epVictim && epVictim.type === "PAWN" && epVictim.color !== piece.color) {
                moves.push({
                  from: pos,
                  to: { row: tr, col: tc },
                  enPassantCapture: { row, col: tc }, // the opponent pawn to remove
                });
              }
            }
          }
        }
      }
      break;
    }
  }

  return moves;
}

// ── Attack checking ──────────────────────────────────────────────────────────

export function isSquareAttacked(
  board: Board,
  sq: Square,
  byColor: Color,
  enPassantTarget: Square | null,
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === byColor) {
        const ms = pseudoMoves(board, p, { row: r, col: c }, enPassantTarget, true);
        if (ms.some(m => m.to.row === sq.row && m.to.col === sq.col)) return true;
      }
    }
  }
  return false;
}

export function isInCheck(board: Board, color: Color, enPassantTarget: Square | null): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p?.type === "KING" && p.color === color) {
        return isSquareAttacked(board, { row: r, col: c }, opponent(color), enPassantTarget);
      }
    }
  }
  return false;
}

// ── Legal move generation ───────────────────────────────────────────────────

/** Apply a move to a cloned board (returns a new cloned board). */
export function applyMove(board: Board, move: Move): Board {
  const b = cloneBoard(board);
  if (!inBounds(move.from.row, move.from.col) || !inBounds(move.to.row, move.to.col)) {
    return b;
  }
  const piece = b[move.from.row][move.from.col];
  if (!piece) return b;

  const dest = b[move.to.row][move.to.col];
  if (dest && dest.color === piece.color) {
    return b;
  }

  if (move.enPassantCapture) {
    if (!inBounds(move.enPassantCapture.row, move.enPassantCapture.col)) return b;
    const epVictim = b[move.enPassantCapture.row][move.enPassantCapture.col];
    if (!epVictim || epVictim.color === piece.color || epVictim.type !== "PAWN") {
      return b;
    }
    b[move.enPassantCapture.row][move.enPassantCapture.col] = null;
  }

  const moved = { ...piece, hasMoved: true };
  b[move.to.row][move.to.col] = moved;
  b[move.from.row][move.from.col] = null;

  if (move.castlingRook) {
    const rook = b[move.castlingRook.from.row]?.[move.castlingRook.from.col];
    if (rook && rook.color === piece.color && rook.type === "ROOK") {
      b[move.castlingRook.to.row][move.castlingRook.to.col] = { ...rook, hasMoved: true };
      b[move.castlingRook.from.row][move.castlingRook.from.col] = null;
    }
  }
  if (move.promotion) {
    b[move.to.row][move.to.col] = { ...moved, type: move.promotion };
  }
  return b;
}

/**
 * Canonical move legality gate: verifies bounds, mover ownership, no friendly capture,
 * and exact presence in `legalMoves`. Returns the canonical legal `Move` or `null`.
 */
export function isMoveLegal(
  board: Board,
  move: Move,
  turn: Color,
  enPassantTarget: Square | null,
): Move | null {
  if (!inBounds(move.from.row, move.from.col) || !inBounds(move.to.row, move.to.col)) {
    return null;
  }
  const mover = board[move.from.row][move.from.col];
  if (!mover || mover.color !== turn) return null;

  const dest = board[move.to.row][move.to.col];
  if (dest && dest.color === turn) return null;

  const legals = legalMoves(board, mover, move.from, enPassantTarget);
  return (
    legals.find(
      (m) =>
        m.to.row === move.to.row &&
        m.to.col === move.to.col &&
        m.promotion === move.promotion,
    ) ?? null
  );
}

/** Legal moves for one piece (filters moves that would leave own king in check). */
export function legalMoves(
  board: Board,
  piece: Piece,
  pos: Square,
  enPassantTarget: Square | null,
): Move[] {
  const pseudo = pseudoMoves(board, piece, pos, enPassantTarget);
  return pseudo
    .filter(m => {
      const next = applyMove(board, m);
      return !isInCheck(next, piece.color, null);
    })
    .flatMap(m => {
      // Expand pawn promotion into 4 choice moves
      const promotionRow = piece.color === "WHITE" ? 0 : 7;
      if (piece.type === "PAWN" && m.to.row === promotionRow) {
        return (["QUEEN", "ROOK", "BISHOP", "KNIGHT"] as PieceType[]).map(pt => ({
          ...m,
          promotion: pt,
        }));
      }
      return [m];
    });
}

/** All legal moves for a given color. */
export function allLegalMoves(
  board: Board,
  color: Color,
  enPassantTarget: Square | null,
): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p?.color === color) {
        moves.push(...legalMoves(board, p, { row: r, col: c }, enPassantTarget));
      }
    }
  }
  return moves;
}

// ── Insufficient Material Detection ─────────────────────────────────────────

export function hasInsufficientMaterial(board: Board): boolean {
  const pieces: { piece: Piece; square: Square }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) pieces.push({ piece: p, square: { row: r, col: c } });
    }
  }

  // Pawns, Rooks, and Queens can always force checkmate
  if (pieces.some(({ piece }) => piece.type === "PAWN" || piece.type === "ROOK" || piece.type === "QUEEN")) {
    return false;
  }

  // King vs King
  if (pieces.length === 2) return true;

  const knights = pieces.filter(({ piece }) => piece.type === "KNIGHT");
  const bishops = pieces.filter(({ piece }) => piece.type === "BISHOP");

  // King + Knight vs King
  if (pieces.length === 3 && knights.length === 1 && bishops.length === 0) {
    return true;
  }

  // Kings + Bishops on a single square color parity (e.g. K+B vs K, K+B vs K+B same color, K+BB same color vs K)
  if (knights.length === 0 && bishops.length > 0) {
    const firstColor = (bishops[0].square.row + bishops[0].square.col) % 2;
    return bishops.every(({ square }) => (square.row + square.col) % 2 === firstColor);
  }

  return false;
}

// ── Status calculation ────────────────────────────────────────────────────────

export function calcStatus(
  board: Board,
  turn: Color,
  enPassantTarget: Square | null,
  halfMoveClock: number,
): GameStatus {
  const inCheck = isInCheck(board, turn, enPassantTarget);
  const hasMoves = allLegalMoves(board, turn, enPassantTarget).length > 0;
  if (!hasMoves) return inCheck ? "CHECKMATE" : "STALEMATE";
  if (halfMoveClock >= 100) return "DRAW_50";
  if (hasInsufficientMaterial(board)) return "DRAW_INSUFFICIENT";
  return inCheck ? "CHECK" : "IN_PROGRESS";
}

/** Compute the en-passant target square after a double pawn push (or null). */
export function computeEnPassantTarget(move: Move, piece: Piece): Square | null {
  if (piece.type !== "PAWN") return null;
  if (Math.abs(move.to.row - move.from.row) !== 2) return null;
  return { row: (move.from.row + move.to.row) / 2, col: move.from.col };
}

// ── Position Hashing for Repetition ──────────────────────────────────────────

export function getPositionKey(board: Board, turn: Color, enPassantTarget: Square | null): string {
  let str = `${turn}|`;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) str += ".";
      else str += `${p.color[0]}${p.type[0]}`;
    }
  }

  let castling = "";
  const wK = board[7][4];
  if (wK?.type === "KING" && wK.color === "WHITE" && !wK.hasMoved) {
    const wKR = board[7][7];
    const wQR = board[7][0];
    if (wKR?.type === "ROOK" && wKR.color === "WHITE" && !wKR.hasMoved) castling += "K";
    if (wQR?.type === "ROOK" && wQR.color === "WHITE" && !wQR.hasMoved) castling += "Q";
  }
  const bK = board[0][4];
  if (bK?.type === "KING" && bK.color === "BLACK" && !bK.hasMoved) {
    const bKR = board[0][7];
    const bQR = board[0][0];
    if (bKR?.type === "ROOK" && bKR.color === "BLACK" && !bKR.hasMoved) castling += "k";
    if (bQR?.type === "ROOK" && bQR.color === "BLACK" && !bQR.hasMoved) castling += "q";
  }
  str += `|c:${castling || "-"}`;

  if (
    enPassantTarget &&
    allLegalMoves(board, turn, enPassantTarget).some((m) => !!m.enPassantCapture)
  ) {
    str += `|ep:${enPassantTarget.row},${enPassantTarget.col}`;
  }
  return str;
}

export function formatPGN(notation: string[], result?: string): string {
  const tokens: string[] = [];
  for (let i = 0; i < notation.length; i += 2) {
    const moveNo = Math.floor(i / 2) + 1;
    const whiteMove = notation[i] ?? "";
    const blackMove = notation[i + 1];
    tokens.push(blackMove ? `${moveNo}. ${whiteMove} ${blackMove}` : `${moveNo}. ${whiteMove}`);
  }
  if (result) tokens.push(result);
  return tokens.join(" ");
}

// ── Notation ─────────────────────────────────────────────────────────────────

export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function toAlgebraic(
  move: Move,
  board: Board,
  promotionPiece?: PieceType,
  resultingBoard?: Board,
  nextTurn?: Color,
): string {
  const piece = board[move.from.row][move.from.col];
  if (!piece) return "";
  const file = FILES[move.to.col];
  const rank = 8 - move.to.row;
  const capture = board[move.to.row][move.to.col] || move.enPassantCapture ? "x" : "";
  const nextEP = computeEnPassantTarget(move, piece);

  if (move.castlingRook) {
    const castlingStr = move.to.col === 6 ? "O-O" : "O-O-O";
    if (resultingBoard && nextTurn) {
      const inCheck = isInCheck(resultingBoard, nextTurn, nextEP);
      const movesLeft = allLegalMoves(resultingBoard, nextTurn, nextEP).length > 0;
      if (inCheck && !movesLeft) return `${castlingStr}#`;
      if (inCheck) return `${castlingStr}+`;
    }
    return castlingStr;
  }

  const pieceChar = piece.type === "KNIGHT" ? "N" : piece.type === "PAWN" ? "" : piece.type[0];
  let disambiguation = "";

  // Check if disambiguation is needed for non-pawn pieces
  if (piece.type !== "PAWN" && piece.type !== "KING") {
    const others = allLegalMoves(board, piece.color, null).filter(
      m =>
        m.to.row === move.to.row &&
        m.to.col === move.to.col &&
        (m.from.row !== move.from.row || m.from.col !== move.from.col) &&
        board[m.from.row][m.from.col]?.type === piece.type,
    );
    if (others.length > 0) {
      const sameFile = others.some(m => m.from.col === move.from.col);
      const sameRank = others.some(m => m.from.row === move.from.row);
      if (!sameFile) disambiguation = FILES[move.from.col];
      else if (!sameRank) disambiguation = `${8 - move.from.row}`;
      else disambiguation = `${FILES[move.from.col]}${8 - move.from.row}`;
    }
  }

  const fromFile = piece.type === "PAWN" && capture ? FILES[move.from.col] : "";
  const promo = promotionPiece ? `=${promotionPiece === "KNIGHT" ? "N" : promotionPiece[0]}` : "";

  let checkSuffix = "";
  if (resultingBoard && nextTurn) {
    const inCheck = isInCheck(resultingBoard, nextTurn, nextEP);
    const movesLeft = allLegalMoves(resultingBoard, nextTurn, nextEP).length > 0;
    if (inCheck && !movesLeft) checkSuffix = "#";
    else if (inCheck) checkSuffix = "+";
  }

  return `${pieceChar}${disambiguation}${fromFile}${capture}${file}${rank}${promo}${checkSuffix}`;
}
