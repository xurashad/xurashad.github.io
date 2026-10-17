import type {
  Board, Color, Piece, PieceType, Square, Move, GameStatus,
} from "./types";

// ── Board factory ────────────────────────────────────────────────────────────

export function createInitialBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const order: PieceType[] = ["ROOK", "KNIGHT", "BISHOP", "QUEEN", "KING", "BISHOP", "KNIGHT", "ROOK"];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: order[c], color: "BLACK", hasMoved: false };
    b[1][c] = { type: "PAWN",   color: "BLACK", hasMoved: false };
    b[6][c] = { type: "PAWN",   color: "WHITE", hasMoved: false };
    b[7][c] = { type: order[c], color: "WHITE", hasMoved: false };
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
      if (!forAttack && !piece.hasMoved && !isInCheck(board, piece.color, enPassantTarget)) {
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
            // En passant capture
            if (enPassantTarget && tr === enPassantTarget.row && tc === enPassantTarget.col) {
              moves.push({
                from: pos,
                to: { row: tr, col: tc },
                enPassantCapture: { row, col: tc }, // the opponent pawn to remove
              });
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
  const piece = b[move.from.row][move.from.col]!;
  const moved = { ...piece, hasMoved: true };

  b[move.to.row][move.to.col] = moved;
  b[move.from.row][move.from.col] = null;

  if (move.enPassantCapture) {
    b[move.enPassantCapture.row][move.enPassantCapture.col] = null;
  }
  if (move.castlingRook) {
    const rook = b[move.castlingRook.from.row][move.castlingRook.from.col]!;
    b[move.castlingRook.to.row][move.castlingRook.to.col] = { ...rook, hasMoved: true };
    b[move.castlingRook.from.row][move.castlingRook.from.col] = null;
  }
  if (move.promotion) {
    b[move.to.row][move.to.col] = { type: move.promotion, color: piece.color, hasMoved: true };
  }
  return b;
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

  // King + Minor piece vs King
  if (pieces.length === 3) {
    return pieces.some(({ piece }) => piece.type === "BISHOP" || piece.type === "KNIGHT");
  }

  // King + Bishop vs King + Bishop
  if (pieces.length === 4) {
    const bishops = pieces.filter(({ piece }) => piece.type === "BISHOP");
    if (bishops.length === 2 && bishops[0].piece.color !== bishops[1].piece.color) {
      // Same colored squares?
      const sq1Color = (bishops[0].square.row + bishops[0].square.col) % 2;
      const sq2Color = (bishops[1].square.row + bishops[1].square.col) % 2;
      if (sq1Color === sq2Color) return true;
    }
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
  if (halfMoveClock >= 100) return "DRAW_50";
  if (hasInsufficientMaterial(board)) return "DRAW_INSUFFICIENT";
  const inCheck = isInCheck(board, turn, enPassantTarget);
  const hasMoves = allLegalMoves(board, turn, enPassantTarget).length > 0;
  if (!hasMoves) return inCheck ? "CHECKMATE" : "STALEMATE";
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
  if (enPassantTarget) str += `|ep:${enPassantTarget.row},${enPassantTarget.col}`;
  return str;
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

  if (move.castlingRook) {
    const castlingStr = move.to.col === 6 ? "O-O" : "O-O-O";
    if (resultingBoard && nextTurn) {
      const inCheck = isInCheck(resultingBoard, nextTurn, null);
      const movesLeft = allLegalMoves(resultingBoard, nextTurn, null).length > 0;
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
    const inCheck = isInCheck(resultingBoard, nextTurn, null);
    const movesLeft = allLegalMoves(resultingBoard, nextTurn, null).length > 0;
    if (inCheck && !movesLeft) checkSuffix = "#";
    else if (inCheck) checkSuffix = "+";
  }

  return `${pieceChar}${disambiguation}${fromFile}${capture}${file}${rank}${promo}${checkSuffix}`;
}
