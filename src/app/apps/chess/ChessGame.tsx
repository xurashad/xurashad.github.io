"use client";

import {
  useState, useCallback, useEffect, useRef, useMemo,
} from "react";
import {
  RotateCcw, Undo2, FlipVertical2, ChevronLeft, Crown, Swords,
} from "lucide-react";
import { ChessBoard } from "./ChessBoard";
import { ChessPieceSVG } from "./ChessPieceSVG";
import {
  createInitialBoard, legalMoves, applyMove, calcStatus,
  computeEnPassantTarget, toAlgebraic, cloneBoard, isInCheck,
} from "./lib/chess";
import { findBestMove } from "./lib/ai";
import type {
  Board, Color, Square, Move, GameStatus,
  GameMode, HistoryEntry, PieceType,
} from "./lib/types";

type GameScreen = "menu" | "playing";

// ── Promotion choices ─────────────────────────────────────────────────────────

function PromotionModal({
  color, onChoose,
}: { color: Color; onChoose: (t: PieceType) => void }) {
  const choices: PieceType[] = ["QUEEN", "ROOK", "BISHOP", "KNIGHT"];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm rounded-2xl">
      <div className="glass-card p-6 flex flex-col items-center gap-4 border border-violet-400/30">
        <h3 className="text-lg font-bold text-violet-200">Promote pawn</h3>
        <div className="flex gap-3">
          {choices.map(t => (
            <button
              key={t}
              onClick={() => onChoose(t)}
              className="p-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/12 hover:border-violet-400/40 transition-all"
            >
              <ChessPieceSVG piece={{ type: t, color, hasMoved: true }} size={44} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main game ─────────────────────────────────────────────────────────────────

export function ChessGame() {
  const [screen, setScreen]      = useState<GameScreen>("menu");
  const [mode, setMode]          = useState<GameMode>("pvp");

  const [board, setBoard]              = useState<Board>(createInitialBoard);
  const [turn, setTurn]                = useState<Color>("WHITE");
  const [status, setStatus]            = useState<GameStatus>("IN_PROGRESS");
  const [enPassantTarget, setEPTarget] = useState<Square | null>(null);
  const [halfMoveClock, setHMClock]    = useState(0);

  const [selected, setSelected]   = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove]    = useState<Move | null>(null);

  const [pendingPromo, setPendingPromo] = useState<Move | null>(null);
  const [history, setHistory]          = useState<HistoryEntry[]>([]);
  const [notation, setNotation]        = useState<string[]>([]);

  const [flipped, setFlipped]          = useState(false);
  const [aiThinking, setAiThinking]    = useState(false);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // King in check coordinate
  const checkSquare = useMemo<Square | null>(() => {
    if (status !== "CHECK" && status !== "CHECKMATE") return null;
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p?.type === "KING" && p.color === turn) return { row: r, col: c };
      }
    return null;
  }, [status, board, turn]);

  // Captured pieces
  const captured = useMemo(() => {
    const initial: Record<string, number> = { PAWN:8, ROOK:2, KNIGHT:2, BISHOP:2, QUEEN:1, KING:1 };
    const counts: Record<Color, Record<string, number>> = {
      WHITE: { PAWN:0, ROOK:0, KNIGHT:0, BISHOP:0, QUEEN:0 },
      BLACK: { PAWN:0, ROOK:0, KNIGHT:0, BISHOP:0, QUEEN:0 },
    };
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type !== "KING") counts[p.color][p.type]++;
      }
    const result = { WHITE: [] as PieceType[], BLACK: [] as PieceType[] };
    for (const col of ["WHITE", "BLACK"] as Color[]) {
      const opp = col === "WHITE" ? "BLACK" : "WHITE";
      for (const t of Object.keys(initial) as PieceType[]) {
        if (t === "KING") continue;
        const missing = initial[t] - counts[col][t];
        for (let i = 0; i < missing; i++) result[opp].push(t);
      }
    }
    return result;
  }, [board]);

  // ── helpers ────────────────────────────────────────────────────────────────

  function reset() {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setBoard(createInitialBoard());
    setTurn("WHITE");
    setStatus("IN_PROGRESS");
    setEPTarget(null);
    setHMClock(0);
    setSelected(null);
    setValidMoves([]);
    setLastMove(null);
    setPendingPromo(null);
    setHistory([]);
    setNotation([]);
    setAiThinking(false);
  }

  function startGame(m: GameMode) {
    setMode(m);
    setFlipped(false);
    reset();
    setScreen("playing");
  }

  // ── commit move ─────────────────────────────────────────────────────────────

  const commitMove = useCallback((move: Move, boardToUse: Board, currentTurn: Color, ep: Square | null, hmc: number) => {
    const piece = boardToUse[move.from.row][move.from.col]!;

    // Push history
    setHistory(prev => [...prev, { board: cloneBoard(boardToUse), turn: currentTurn, status, enPassantTarget: ep, halfMoveClock: hmc }]);

    // Notation
    const note = toAlgebraic(move, boardToUse, move.promotion);
    setNotation(prev => [...prev, note]);

    const newBoard = applyMove(boardToUse, move);
    const newEP    = computeEnPassantTarget(move, piece);
    const capture  = !!boardToUse[move.to.row][move.to.col] || !!move.enPassantCapture;
    const newHMC   = piece.type === "PAWN" || capture ? 0 : hmc + 1;
    const nextTurn: Color = currentTurn === "WHITE" ? "BLACK" : "WHITE";
    const newStatus = calcStatus(newBoard, nextTurn, newEP, newHMC);

    setBoard(newBoard);
    setTurn(nextTurn);
    setEPTarget(newEP);
    setHMClock(newHMC);
    setStatus(newStatus);
    setLastMove(move);
    setSelected(null);
    setValidMoves([]);
  }, [status]);

  // ── square click ─────────────────────────────────────────────────────────────

  const handleSquareClick = useCallback((sq: Square) => {
    if (pendingPromo || aiThinking) return;
    if (status === "CHECKMATE" || status === "STALEMATE" || status === "DRAW_50") return;
    if (mode === "pvc" && turn === "BLACK") return;

    const piece = board[sq.row][sq.col];

    if (selected) {
      // Try to move
      const move = validMoves.find(m => m.to.row === sq.row && m.to.col === sq.col);
      if (move) {
        // Check if promotion (multiple moves same destination = promotion choices)
        const promos = validMoves.filter(m => m.to.row === sq.row && m.to.col === sq.col && m.promotion);
        if (promos.length > 0) {
          // Show promotion picker – store base move
          setPendingPromo({ ...promos[0], promotion: undefined });
          return;
        }
        commitMove(move, board, turn, enPassantTarget, halfMoveClock);
        return;
      }
      // Re-select own piece
      if (piece && piece.color === turn) {
        setSelected(sq);
        setValidMoves(legalMoves(board, piece, sq, enPassantTarget));
        return;
      }
      setSelected(null); setValidMoves([]);
    } else {
      if (piece && piece.color === turn) {
        setSelected(sq);
        setValidMoves(legalMoves(board, piece, sq, enPassantTarget));
      }
    }
  }, [selected, validMoves, board, turn, mode, pendingPromo, aiThinking, status, enPassantTarget, halfMoveClock, commitMove]);

  // ── promotion pick ──────────────────────────────────────────────────────────

  const handlePromotion = useCallback((t: PieceType) => {
    if (!pendingPromo) return;
    const move = { ...pendingPromo, promotion: t };
    setPendingPromo(null);
    commitMove(move, board, turn, enPassantTarget, halfMoveClock);
  }, [pendingPromo, board, turn, enPassantTarget, halfMoveClock, commitMove]);

  // ── undo ────────────────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (!history.length) return;
    let prev = [...history];
    // In PvC, undo 2 plies at once if it's the player's turn
    if (mode === "pvc" && turn === "WHITE" && prev.length >= 2) prev.pop();
    const last = prev.pop()!;
    setHistory(prev);
    setNotation(n => n.slice(0, prev.length));
    setBoard(cloneBoard(last.board));
    setTurn(last.turn);
    setStatus(last.status);
    setEPTarget(last.enPassantTarget);
    setHMClock(last.halfMoveClock);
    setSelected(null); setValidMoves([]); setLastMove(null); setPendingPromo(null);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setAiThinking(false);
  }, [history, mode, turn]);

  // ── AI ───────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== "playing" || mode !== "pvc" || turn !== "BLACK") return;
    if (status === "CHECKMATE" || status === "STALEMATE" || status === "DRAW_50") return;
    if (pendingPromo) return;

    setAiThinking(true);
    const ep = enPassantTarget;
    const b  = cloneBoard(board);
    const hmc = halfMoveClock;

    aiTimerRef.current = setTimeout(() => {
      const move = findBestMove(b, "BLACK", null, 3);
      setAiThinking(false);
      if (move) commitMove(move, b, "BLACK", ep, hmc);
    }, 300);

    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [turn, screen, mode, status, pendingPromo]);  // intentionally omit board/ep/hmc

  // ── status bar text ──────────────────────────────────────────────────────────

  const statusText = useMemo(() => {
    if (aiThinking) return "Computer is thinking…";
    switch (status) {
      case "CHECKMATE": return `Checkmate — ${turn === "WHITE" ? "Black" : "White"} wins!`;
      case "STALEMATE": return "Stalemate — draw";
      case "DRAW_50":   return "50-move rule — draw";
      case "CHECK":     return `${turn === "WHITE" ? "White" : "Black"} is in check!`;
      default:          return `${turn === "WHITE" ? "White" : "Black"} to move`;
    }
  }, [status, turn, aiThinking]);

  const isGameOver = status === "CHECKMATE" || status === "STALEMATE" || status === "DRAW_50";

  // ── MENU ─────────────────────────────────────────────────────────────────────

  if (screen === "menu") return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="text-center">
        <h2 className="text-5xl font-serif font-bold bg-gradient-to-r from-violet-300 via-cyan-300 to-fuchsia-300 bg-clip-text text-transparent mb-2">
          Celestial Chess
        </h2>
        <p className="text-foreground/40 text-sm">Choose your battle</p>
      </div>
      <div className="flex flex-col gap-3 w-64">
        <button onClick={() => startGame("pvp")}
          className="flex items-center gap-3 px-6 py-3.5 rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-200 font-semibold hover:bg-violet-500/20 transition-all">
          <Swords size={18} /> Player vs Player
        </button>
        <button onClick={() => startGame("pvc")}
          className="flex items-center gap-3 px-6 py-3.5 rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-200 font-semibold hover:bg-cyan-500/20 transition-all">
          <Crown size={18} /> Player vs Computer
        </button>
      </div>
    </div>
  );

  // ── GAME ──────────────────────────────────────────────────────────────────────
  const capturedByWhite = captured.BLACK; // pieces black lost = captured by white
  const capturedByBlack = captured.WHITE;

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start justify-center w-full">

      {/* Board */}
      <div className="relative w-full max-w-[540px] mx-auto xl:mx-0">
        <ChessBoard
          board={board}
          flipped={flipped}
          selected={selected}
          validMoves={validMoves}
          lastMove={lastMove}
          checkSquare={checkSquare}
          onSquareClick={handleSquareClick}
          disabled={aiThinking || isGameOver}
        />
        {pendingPromo && (
          <PromotionModal color={turn} onChoose={handlePromotion} />
        )}
        {isGameOver && (
          <div className="absolute inset-0 rounded-2xl bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-40">
            <p className="text-2xl font-bold text-violet-200">{statusText}</p>
            <button onClick={reset}
              className="px-5 py-2.5 rounded-xl border border-quantum/30 bg-quantum/15 text-quantum font-semibold hover:bg-quantum/25 transition-all">
              Play again
            </button>
          </div>
        )}
      </div>

      {/* Side panel */}
      <div className="flex flex-col gap-4 w-full xl:w-64 shrink-0">

        {/* Status */}
        <div className="glass-card p-4 text-center">
          <div className={`text-sm font-semibold ${
            status === "CHECK" || status === "CHECKMATE" ? "text-crimson/80" :
            isGameOver ? "text-yellow-400" :
            aiThinking ? "text-cyan-400 animate-pulse" : "text-foreground/60"
          }`}>
            {statusText}
          </div>
          {mode === "pvc" && !isGameOver && (
            <div className="text-[10px] font-mono text-foreground/25 mt-1">You play White</div>
          )}
        </div>

        {/* Controls */}
        <div className="glass-card p-3 flex gap-2">
          <button onClick={() => { reset(); setScreen("menu"); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-foreground/40 hover:text-foreground/70 hover:bg-white/6 border border-white/8 transition-all"
            title="Menu">
            <ChevronLeft size={14} /> Menu
          </button>
          <button onClick={reset}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-foreground/40 hover:text-foreground/70 hover:bg-white/6 border border-white/8 transition-all"
            title="New game">
            <RotateCcw size={14} /> Reset
          </button>
          <button onClick={undo} disabled={!history.length || aiThinking}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-foreground/40 hover:text-foreground/70 hover:bg-white/6 border border-white/8 disabled:opacity-30 transition-all"
            title="Undo">
            <Undo2 size={14} /> Undo
          </button>
          <button onClick={() => setFlipped(f => !f)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-foreground/40 hover:text-foreground/70 hover:bg-white/6 border border-white/8 transition-all"
            title="Flip board">
            <FlipVertical2 size={14} /> Flip
          </button>
        </div>

        {/* Captured pieces */}
        {[{ label: "White captured", pieces: capturedByWhite }, { label: "Black captured", pieces: capturedByBlack }].map(({ label, pieces }) => (
          <div key={label} className="glass-card p-3">
            <div className="text-[10px] font-mono text-foreground/25 uppercase tracking-widest mb-2">{label}</div>
            <div className="flex flex-wrap gap-1 min-h-6">
              {pieces.map((t, i) => (
                <ChessPieceSVG key={i} piece={{ type: t, color: label.includes("White") ? "BLACK" : "WHITE", hasMoved: true }} size={22} />
              ))}
            </div>
          </div>
        ))}

        {/* Move notation */}
        <div className="glass-card p-3 flex-1">
          <div className="text-[10px] font-mono text-foreground/25 uppercase tracking-widest mb-2">Moves</div>
          <div className="space-y-0.5 max-h-56 overflow-y-auto">
            {Array.from({ length: Math.ceil(notation.length / 2) }).map((_, i) => (
              <div key={i} className="flex gap-2 text-xs font-mono">
                <span className="text-foreground/25 w-6 shrink-0">{i + 1}.</span>
                <span className="text-foreground/60 w-16">{notation[i * 2] ?? ""}</span>
                <span className="text-foreground/40 w-16">{notation[i * 2 + 1] ?? ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
