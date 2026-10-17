export type PieceType = "PAWN" | "ROOK" | "KNIGHT" | "BISHOP" | "QUEEN" | "KING";
export type Color    = "WHITE" | "BLACK";

export interface Piece {
  type: PieceType;
  color: Color;
  hasMoved: boolean;
}

export interface Square { row: number; col: number }

export interface Move {
  from: Square;
  to: Square;
  /** en-passant capture square (the pawn to remove) */
  enPassantCapture?: Square;
  /** castling: where the rook moves from/to */
  castlingRook?: { from: Square; to: Square };
  /** pawn promotion */
  promotion?: PieceType;
}

export type GameStatus =
  | "IN_PROGRESS"
  | "CHECK"
  | "CHECKMATE"
  | "STALEMATE"
  | "DRAW_50"           // fifty-move rule
  | "DRAW_INSUFFICIENT" // insufficient material to checkmate
  | "DRAW_REPETITION"   // threefold repetition
  | "PROMOTION";

export type GameMode = "pvp" | "pvc";
export type AIDifficulty = "easy" | "medium" | "hard";

export type Board = (Piece | null)[][];

export interface HistoryEntry {
  board: Board;
  turn: Color;
  status: GameStatus;
  enPassantTarget: Square | null;
  halfMoveClock: number;
  positionHash?: string;
}
