"use client";

import {
  useState, useCallback, useEffect, useRef, useMemo,
} from "react";
import dynamic from "next/dynamic";
import {
  RotateCcw, Undo2, FlipVertical2, ChevronLeft, Crown, Swords,
  Volume2, VolumeX, Sparkles, Layers, Box,
} from "lucide-react";
import { ChessBoard } from "./ChessBoard";
import { ChessPieceSVG } from "./ChessPieceSVG";
import {
  createInitialBoard, legalMoves, applyMove, calcStatus,
  computeEnPassantTarget, toAlgebraic, cloneBoard, getPositionKey,
} from "./lib/chess";
import { findBestMove } from "./lib/ai";
import { sounds } from "./lib/sound";
import type {
  Board, Color, Square, Move, GameStatus,
  GameMode, HistoryEntry, PieceType, AIDifficulty,
} from "./lib/types";

// Dynamically import 3D Chessboard to avoid SSR overhead and ensure flawless WebGL initialization
const ChessBoard3D = dynamic(
  () => import("./ChessBoard3D").then((m) => m.ChessBoard3D),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-3"
        style={{
          background: "radial-gradient(circle at 50% 50%, #150a2e 0%, #080314 100%)",
          border: "2px solid rgba(140, 100, 255, 0.35)",
        }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-cyan-300">Summoning 3D Cosmic Chessboard...</span>
      </div>
    ),
  }
);

type GameScreen = "menu" | "playing";
type ViewMode = "2d" | "3d";

// ── Promotion choices ─────────────────────────────────────────────────────────

function PromotionModal({
  color, onChoose,
}: { color: Color; onChoose: (t: PieceType) => void }) {
  const choices: PieceType[] = ["QUEEN", "ROOK", "BISHOP", "KNIGHT"];
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl p-4">
      <div
        className="p-6 sm:p-8 flex flex-col items-center gap-5 rounded-2xl max-w-sm w-full"
        style={{
          background: "linear-gradient(135deg, rgba(35, 18, 70, 0.95), rgba(18, 9, 45, 0.98))",
          border: "1px solid rgba(140, 100, 255, 0.4)",
          boxShadow: "0 0 50px rgba(100, 60, 255, 0.3), 0 0 100px rgba(70, 30, 180, 0.2)",
        }}
      >
        <h3
          className="text-xl font-bold tracking-wide"
          style={{
            background: "linear-gradient(135deg, #c8b0ff, #80d0ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Promote Pawn
        </h3>
        <p className="text-xs text-foreground/50 text-center -mt-2">
          Choose a piece for ascending promotion
        </p>
        <div className="flex justify-center gap-3 w-full">
          {choices.map(t => (
            <button
              key={t}
              onClick={() => onChoose(t)}
              className="p-3.5 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 flex flex-col items-center gap-1.5"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(140, 100, 255, 0.25)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(140, 100, 255, 0.25)";
                e.currentTarget.style.borderColor = "rgba(140, 100, 255, 0.55)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(140, 100, 255, 0.35)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                e.currentTarget.style.borderColor = "rgba(140, 100, 255, 0.25)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <ChessPieceSVG piece={{ type: t, color, hasMoved: true }} className="w-full h-full object-contain" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/60">
                {t.slice(0, 1) + t.slice(1).toLowerCase()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Animated floating stars for menu ──────────────────────────────────────────

function StarField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${1.5 + (i % 3) * 1.5}px`,
            height: `${1.5 + (i % 3) * 1.5}px`,
            left: `${((i * 19) % 97) + 1.5}%`,
            top: `${((i * 29) % 93) + 2.5}%`,
            background: `rgba(${190 + (i % 4) * 20}, ${170 + (i % 5) * 18}, 255, ${0.35 + (i % 3) * 0.25})`,
            animation: `star-twinkle ${2.5 + (i % 4)}s ease-in-out ${(i % 5) * 0.7}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Glass panel helper ───────────────────────────────────────────────────────

function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(28, 14, 55, 0.85), rgba(16, 8, 38, 0.9))",
        border: "1px solid rgba(130, 95, 220, 0.22)",
        boxShadow: "0 6px 28px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(14px)",
      }}
    >
      {children}
    </div>
  );
}

// Material values for advantage calculations
const MATERIAL_VALS: Record<PieceType, number> = {
  PAWN: 1,
  KNIGHT: 3,
  BISHOP: 3,
  ROOK: 5,
  QUEEN: 9,
  KING: 0,
};

// ── Main game ─────────────────────────────────────────────────────────────────

export function ChessGame() {
  const [screen, setScreen] = useState<GameScreen>("menu");
  const [mode, setMode] = useState<GameMode>("pvp");
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [playerColor, setPlayerColor] = useState<Color>("WHITE");
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [turn, setTurn] = useState<Color>("WHITE");
  const [status, setStatus] = useState<GameStatus>("IN_PROGRESS");
  const [enPassantTarget, setEPTarget] = useState<Square | null>(null);
  const [halfMoveClock, setHMClock] = useState(0);

  const [selected, setSelected] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);

  const [pendingPromo, setPendingPromo] = useState<Move | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [notation, setNotation] = useState<string[]>([]);

  const [flipped, setFlipped] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notationScrollRef = useRef<HTMLDivElement | null>(null);

  // Sync sound settings
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Auto-scroll notation log
  useEffect(() => {
    if (notationScrollRef.current) {
      notationScrollRef.current.scrollTop = notationScrollRef.current.scrollHeight;
    }
  }, [notation]);

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

  // Captured pieces and material score
  const { captured, materialAdvantage } = useMemo(() => {
    const initial: Record<string, number> = { PAWN: 8, ROOK: 2, KNIGHT: 2, BISHOP: 2, QUEEN: 1, KING: 1 };
    const counts: Record<Color, Record<string, number>> = {
      WHITE: { PAWN: 0, ROOK: 0, KNIGHT: 0, BISHOP: 0, QUEEN: 0, KING: 0 },
      BLACK: { PAWN: 0, ROOK: 0, KNIGHT: 0, BISHOP: 0, QUEEN: 0, KING: 0 },
    };
    let whiteMat = 0;
    let blackMat = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          counts[p.color][p.type]++;
          if (p.color === "WHITE") whiteMat += MATERIAL_VALS[p.type];
          else blackMat += MATERIAL_VALS[p.type];
        }
      }
    }

    const resultCaptured = { WHITE: [] as PieceType[], BLACK: [] as PieceType[] };
    for (const col of ["WHITE", "BLACK"] as Color[]) {
      const opp = col === "WHITE" ? "BLACK" : "WHITE";
      for (const t of Object.keys(initial) as PieceType[]) {
        if (t === "KING") continue;
        const missing = initial[t] - counts[col][t];
        for (let i = 0; i < missing; i++) resultCaptured[opp].push(t);
      }
    }

    return {
      captured: resultCaptured,
      materialAdvantage: {
        white: whiteMat - blackMat,
        black: blackMat - whiteMat,
      },
    };
  }, [board]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const reset = useCallback((chosenSide: Color = playerColor) => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    const initialB = createInitialBoard();
    setBoard(initialB);
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
    setFlipped(chosenSide === "BLACK");
  }, [playerColor]);

  function startCustomGame(chosenMode: GameMode, chosenDiff: AIDifficulty, chosenSide: Color | "RANDOM") {
    setMode(chosenMode);
    setDifficulty(chosenDiff);
    let side: Color = chosenSide === "RANDOM" ? (Math.random() < 0.5 ? "WHITE" : "BLACK") : chosenSide;
    setPlayerColor(side);
    reset(side);
    setScreen("playing");
  }

  // ── commit move ─────────────────────────────────────────────────────────────

  const commitMove = useCallback((
    move: Move,
    boardToUse: Board,
    currentTurn: Color,
    ep: Square | null,
    hmc: number,
  ) => {
    const piece = boardToUse[move.from.row][move.from.col]!;
    const capture = !!boardToUse[move.to.row][move.to.col] || !!move.enPassantCapture;

    const newBoard = applyMove(boardToUse, move);
    const newEP = computeEnPassantTarget(move, piece);
    const newHMC = piece.type === "PAWN" || capture ? 0 : hmc + 1;
    const nextTurn: Color = currentTurn === "WHITE" ? "BLACK" : "WHITE";

    // Build position hash for repetition tracking
    const posKey = getPositionKey(newBoard, nextTurn, newEP);

    // Compute updated history with current board and status
    const newHistory: HistoryEntry[] = [
      ...history,
      {
        board: cloneBoard(boardToUse),
        turn: currentTurn,
        status,
        enPassantTarget: ep,
        halfMoveClock: hmc,
        positionHash: posKey,
      },
    ];

    // Check threefold repetition: count how many times posKey has occurred
    const repetitionCount = newHistory.filter(h => h.positionHash === posKey).length;
    let newStatus = calcStatus(newBoard, nextTurn, newEP, newHMC);
    if (repetitionCount >= 3 && (newStatus === "IN_PROGRESS" || newStatus === "CHECK")) {
      newStatus = "DRAW_REPETITION";
    }

    // Notation with check / mate annotations and move disambiguation
    const note = toAlgebraic(move, boardToUse, move.promotion, newBoard, nextTurn);
    setNotation(prev => [...prev, note]);

    // Audio SFX triggers
    if (newStatus === "CHECKMATE") {
      sounds.playVictory();
    } else if (newStatus === "CHECK") {
      sounds.playCheck();
    } else if (move.castlingRook) {
      sounds.playCastle();
    } else if (capture) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }

    setHistory(newHistory);
    setBoard(newBoard);
    setTurn(nextTurn);
    setEPTarget(newEP);
    setHMClock(newHMC);
    setStatus(newStatus);
    setLastMove(move);
    setSelected(null);
    setValidMoves([]);
  }, [history, status]);

  // ── square click & drag handling ────────────────────────────────────────────

  const handleSquareClick = useCallback((sq: Square) => {
    if (pendingPromo || aiThinking) return;
    const isGameOver = status === "CHECKMATE" || status === "STALEMATE" || status === "DRAW_50" || status === "DRAW_INSUFFICIENT" || status === "DRAW_REPETITION";
    if (isGameOver) return;
    if (mode === "pvc" && turn !== playerColor) return;

    const piece = board[sq.row][sq.col];

    if (selected) {
      // Try to move
      const move = validMoves.find(m => m.to.row === sq.row && m.to.col === sq.col);
      if (move) {
        // Check if promotion
        const promos = validMoves.filter(m => m.to.row === sq.row && m.to.col === sq.col && m.promotion);
        if (promos.length > 0) {
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
      setSelected(null);
      setValidMoves([]);
    } else {
      if (piece && piece.color === turn) {
        setSelected(sq);
        setValidMoves(legalMoves(board, piece, sq, enPassantTarget));
      }
    }
  }, [selected, validMoves, board, turn, mode, playerColor, pendingPromo, aiThinking, status, enPassantTarget, halfMoveClock, commitMove]);

  const handleDropPiece = useCallback((from: Square, to: Square) => {
    if (pendingPromo || aiThinking) return;
    const isGameOver = status === "CHECKMATE" || status === "STALEMATE" || status === "DRAW_50" || status === "DRAW_INSUFFICIENT" || status === "DRAW_REPETITION";
    if (isGameOver) return;
    if (mode === "pvc" && turn !== playerColor) return;

    const piece = board[from.row][from.col];
    if (!piece || piece.color !== turn) return;

    const movesFromPiece = legalMoves(board, piece, from, enPassantTarget);
    const targetMove = movesFromPiece.find(m => m.to.row === to.row && m.to.col === to.col);
    if (!targetMove) return;

    const promos = movesFromPiece.filter(m => m.to.row === to.row && m.to.col === to.col && m.promotion);
    if (promos.length > 0) {
      setPendingPromo({ ...promos[0], promotion: undefined });
      return;
    }

    commitMove(targetMove, board, turn, enPassantTarget, halfMoveClock);
  }, [pendingPromo, aiThinking, status, mode, playerColor, board, turn, enPassantTarget, halfMoveClock, commitMove]);

  // ── promotion pick ──────────────────────────────────────────────────────────

  const handlePromotion = useCallback((t: PieceType) => {
    if (!pendingPromo) return;
    const move = { ...pendingPromo, promotion: t };
    setPendingPromo(null);
    commitMove(move, board, turn, enPassantTarget, halfMoveClock);
  }, [pendingPromo, board, turn, enPassantTarget, halfMoveClock, commitMove]);

  // ── undo ────────────────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (!history.length || aiThinking) return;
    let prev = [...history];
    // In PvC, undo 2 plies at once if it's currently the player's turn
    if (mode === "pvc" && turn === playerColor && prev.length >= 2) {
      prev.pop();
    }
    const last = prev.pop();
    if (!last) return;

    setHistory(prev);
    setNotation(n => n.slice(0, prev.length));
    setBoard(cloneBoard(last.board));
    setTurn(last.turn);
    setStatus(last.status);
    setEPTarget(last.enPassantTarget);
    setHMClock(last.halfMoveClock);
    setSelected(null);
    setValidMoves([]);
    setLastMove(null);
    setPendingPromo(null);
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    setAiThinking(false);
  }, [history, aiThinking, mode, turn, playerColor]);

  // ── AI turn execution ───────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== "playing" || mode !== "pvc") return;
    if (turn === playerColor) return;
    const isGameOver = status === "CHECKMATE" || status === "STALEMATE" || status === "DRAW_50" || status === "DRAW_INSUFFICIENT" || status === "DRAW_REPETITION";
    if (isGameOver || pendingPromo) return;

    setAiThinking(true);
    const ep = enPassantTarget;
    const b = cloneBoard(board);
    const hmc = halfMoveClock;
    const aiColor = turn;

    const delay = difficulty === "easy" ? 350 : difficulty === "hard" ? 500 : 400;

    aiTimerRef.current = setTimeout(() => {
      const move = findBestMove(b, aiColor, ep, difficulty);
      setAiThinking(false);
      if (move) {
        commitMove(move, b, aiColor, ep, hmc);
      }
    }, delay);

    return () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, [turn, screen, mode, status, pendingPromo, playerColor, difficulty, enPassantTarget, board, halfMoveClock, commitMove]);

  // ── status bar text ──────────────────────────────────────────────────────────

  const statusText = useMemo(() => {
    if (aiThinking) return "Computer is calculating…";
    switch (status) {
      case "CHECKMATE":
        return `Checkmate — ${turn === "WHITE" ? "Black" : "White"} victorious!`;
      case "STALEMATE":
        return "Stalemate — Draw";
      case "DRAW_50":
        return "50-Move Rule — Draw";
      case "DRAW_INSUFFICIENT":
        return "Insufficient Material — Draw";
      case "DRAW_REPETITION":
        return "Threefold Repetition — Draw";
      case "CHECK":
        return `${turn === "WHITE" ? "White" : "Black"} is in Check!`;
      default:
        return `${turn === "WHITE" ? "White" : "Black"} to move`;
    }
  }, [status, turn, aiThinking]);

  const isGameOver =
    status === "CHECKMATE" ||
    status === "STALEMATE" ||
    status === "DRAW_50" ||
    status === "DRAW_INSUFFICIENT" ||
    status === "DRAW_REPETITION";

  // ── MENU ─────────────────────────────────────────────────────────────────────

  if (screen === "menu") {
    return (
      <div className="flex flex-col items-center gap-10 py-10 relative select-none">
        <StarField />

        {/* Decorative chess piece silhouettes */}
        <div className="absolute top-4 left-6 opacity-[0.07] pointer-events-none hidden md:block">
          <ChessPieceSVG piece={{ type: "QUEEN", color: "WHITE", hasMoved: false }} size={120} />
        </div>
        <div className="absolute bottom-6 right-6 opacity-[0.07] pointer-events-none hidden md:block">
          <ChessPieceSVG piece={{ type: "KING", color: "BLACK", hasMoved: false }} size={120} />
        </div>

        <div className="text-center relative z-10 px-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-mono text-violet-300 mb-3">
            <Sparkles size={13} className="text-violet-400" /> Stellar Battle Chamber · 2D & 3D Supported
          </div>
          <h2
            className="text-3xl sm:text-5xl font-serif font-bold mb-2 tracking-tight"
            style={{
              background: "linear-gradient(135deg, #d4c5ff, #8ae0ff, #f2b4ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 4px 14px rgba(120, 70, 255, 0.4))",
            }}
          >
            Select Your Challenge
          </h2>
          <p className="text-foreground/45 text-xs sm:text-sm max-w-md mx-auto">
            Choose your game mode and embark across the cosmos in 2D or 3D
          </p>
        </div>

        {/* View Mode Pre-selection */}
        <div className="relative z-10 flex items-center gap-3 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-violet-500/25">
          <span className="text-[11px] font-mono text-foreground/40 pl-2">Initial View:</span>
          <button
            onClick={() => setViewMode("2d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === "2d"
                ? "bg-violet-600/40 text-violet-200 border border-violet-400/40 shadow-[0_0_12px_rgba(140,100,255,0.3)]"
                : "text-foreground/45 hover:text-foreground/80 border border-transparent"
            }`}
          >
            <Layers size={14} /> 2D Classic
          </button>
          <button
            onClick={() => setViewMode("3d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              viewMode === "3d"
                ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow-[0_0_15px_rgba(80,210,255,0.35)]"
                : "text-foreground/45 hover:text-foreground/80 border border-transparent"
            }`}
          >
            <Box size={14} /> 3D Cosmic
          </button>
        </div>

        {/* Mode cards */}
        <div className="flex flex-col gap-4 w-full max-w-sm relative z-10 px-4">
          {/* PvP Button */}
          <button
            onClick={() => startCustomGame("pvp", "medium", "WHITE")}
            className="group flex items-center gap-4 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 text-left"
            style={{
              background: "linear-gradient(135deg, rgba(120, 80, 220, 0.16), rgba(70, 40, 160, 0.1))",
              border: "1px solid rgba(140, 100, 255, 0.3)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(130, 90, 240, 0.3), rgba(80, 50, 190, 0.2))";
              e.currentTarget.style.borderColor = "rgba(160, 120, 255, 0.55)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(130, 90, 240, 0.35)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(120, 80, 220, 0.16), rgba(70, 40, 160, 0.1))";
              e.currentTarget.style.borderColor = "rgba(140, 100, 255, 0.3)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-400/30 flex items-center justify-center shrink-0">
              <Swords size={24} className="text-violet-300" />
            </div>
            <div>
              <div className="text-violet-200 text-base font-bold">Pass & Play (PvP)</div>
              <div className="text-xs text-violet-400/60 font-normal">Play face-to-face on one screen</div>
            </div>
          </button>

          {/* PvC Section */}
          <div
            className="p-5 rounded-2xl flex flex-col gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(30, 90, 140, 0.14), rgba(20, 60, 110, 0.1))",
              border: "1px solid rgba(80, 200, 255, 0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
                <Crown size={22} className="text-cyan-300" />
              </div>
              <div>
                <div className="text-cyan-200 text-base font-bold">Player vs Computer</div>
                <div className="text-xs text-cyan-400/60">Challenge the cosmic minimax engine</div>
              </div>
            </div>

            {/* Difficulty select */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-cyan-300/70 mb-1.5 block">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as AIDifficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                      difficulty === d
                        ? "bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(80,200,255,0.3)]"
                        : "bg-white/5 border-white/10 text-foreground/45 hover:text-foreground/75"
                    } border`}
                  >
                    {d === "easy" ? "Apprentice" : d === "medium" ? "Scholar" : "Grandmaster"}
                  </button>
                ))}
              </div>
            </div>

            {/* Side selection */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-cyan-300/70 mb-1.5 block">
                Play As
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "WHITE", label: "White" },
                  { id: "BLACK", label: "Black" },
                  { id: "RANDOM", label: "Random" },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => setPlayerColor(s.id as Color)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
                      playerColor === s.id
                        ? "bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(80,200,255,0.3)]"
                        : "bg-white/5 border-white/10 text-foreground/45 hover:text-foreground/75"
                    } border`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch PvC Button */}
            <button
              onClick={() => startCustomGame("pvc", difficulty, playerColor)}
              className="w-full py-3 rounded-xl font-bold transition-all duration-300 text-center mt-1"
              style={{
                background: "linear-gradient(135deg, rgba(60, 180, 240, 0.35), rgba(40, 130, 210, 0.25))",
                border: "1px solid rgba(80, 210, 255, 0.5)",
                color: "#99e5ff",
                boxShadow: "0 0 20px rgba(60, 180, 240, 0.25)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 0 30px rgba(80, 210, 255, 0.4)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(60, 180, 240, 0.25)";
              }}
            >
              Start Game
            </button>
          </div>
        </div>

        {/* Style keyframe */}
        <style jsx>{`
          @keyframes star-twinkle {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.4); }
          }
        `}</style>
      </div>
    );
  }

  // ── PLAYING SCREEN ─────────────────────────────────────────────────────────

  const capturedByWhite = captured.BLACK;
  const capturedByBlack = captured.WHITE;

  const controlBtnBase: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-center xl:items-start justify-center w-full max-w-5xl mx-auto">
      {/* Board Column */}
      <div className="relative w-full max-w-[540px] shrink-0">
        {/* Viewport Dimension Toggle (2D / 3D) */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-foreground/45 uppercase tracking-wider">
              Dimension:
            </span>
            <div className="inline-flex p-0.5 rounded-xl bg-black/40 border border-violet-500/20 backdrop-blur-md">
              <button
                onClick={() => setViewMode("2d")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  viewMode === "2d"
                    ? "bg-violet-600/40 text-violet-200 border border-violet-400/40 shadow-[0_0_12px_rgba(140,100,255,0.3)]"
                    : "text-foreground/45 hover:text-foreground/75 border border-transparent"
                }`}
              >
                <Layers size={13} /> 2D Flat
              </button>
              <button
                onClick={() => setViewMode("3d")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  viewMode === "3d"
                    ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 shadow-[0_0_15px_rgba(80,210,255,0.35)]"
                    : "text-foreground/45 hover:text-foreground/75 border border-transparent"
                }`}
              >
                <Box size={13} /> 3D Cosmic
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-violet-300/60 hidden sm:block">
            {viewMode === "3d" ? "Orbit 3D enabled" : "Standard board"}
          </div>
        </div>

        {/* Board Component (2D or 3D based on toggle) */}
        {viewMode === "3d" ? (
          <ChessBoard3D
            board={board}
            flipped={flipped}
            selected={selected}
            validMoves={validMoves}
            lastMove={lastMove}
            checkSquare={checkSquare}
            currentTurn={turn}
            onSquareClick={handleSquareClick}
            disabled={aiThinking || isGameOver}
          />
        ) : (
          <ChessBoard
            board={board}
            flipped={flipped}
            selected={selected}
            validMoves={validMoves}
            lastMove={lastMove}
            checkSquare={checkSquare}
            currentTurn={turn}
            onSquareClick={handleSquareClick}
            onDropPiece={handleDropPiece}
            disabled={aiThinking || isGameOver}
          />
        )}

        {pendingPromo && (
          <PromotionModal color={turn} onChoose={handlePromotion} />
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 rounded-2xl bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-5 z-40 p-6 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-violet-500/20 border border-violet-400/40 flex items-center justify-center">
              <Crown size={28} className="text-yellow-300" />
            </div>
            <div>
              <p
                className="text-2xl sm:text-3xl font-bold mb-1"
                style={{
                  background: status === "CHECKMATE"
                    ? "linear-gradient(135deg, #ffd700, #ff9500)"
                    : "linear-gradient(135deg, #d4c5ff, #8ae0ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {statusText}
              </p>
              <p className="text-xs text-foreground/45">
                {status === "CHECKMATE"
                  ? `${turn === "WHITE" ? "Black" : "White"} achieved decisive checkmate!`
                  : "The cosmic forces have settled in balance."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => reset(playerColor)}
                className="px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, rgba(80, 210, 255, 0.25), rgba(130, 90, 255, 0.25))",
                  border: "1px solid rgba(80, 210, 255, 0.45)",
                  color: "#9ce5ff",
                }}
              >
                Play Again
              </button>
              <button
                onClick={() => {
                  reset();
                  setScreen("menu");
                }}
                className="px-5 py-2.5 rounded-xl font-semibold bg-white/5 border border-white/10 text-foreground/70 hover:bg-white/10 transition-all"
              >
                Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel Column */}
      <div className="flex flex-col gap-4 w-full max-w-[540px] xl:max-w-[300px] shrink-0">
        {/* Status Card */}
        <GlassPanel className="p-4 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-1.5">
            <div
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background: aiThinking
                  ? "#52d3ff"
                  : status === "CHECK" || status === "CHECKMATE"
                  ? "#ff4d61"
                  : isGameOver
                  ? "#ffd700"
                  : turn === "WHITE"
                  ? "#faf5ea"
                  : "#9b7cdb",
                boxShadow: aiThinking
                  ? "0 0 10px rgba(82, 211, 255, 0.7)"
                  : status === "CHECK" || status === "CHECKMATE"
                  ? "0 0 12px rgba(255, 77, 97, 0.7)"
                  : "0 0 8px rgba(140, 100, 255, 0.4)",
                animation: aiThinking ? "ai-pulse 1.3s ease-in-out infinite" : undefined,
              }}
            />
            <div
              className={`text-sm font-bold tracking-wide ${
                status === "CHECK" || status === "CHECKMATE"
                  ? "text-red-400"
                  : isGameOver
                  ? "text-yellow-400"
                  : aiThinking
                  ? "text-cyan-300"
                  : "text-foreground/80"
              }`}
            >
              {statusText}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-foreground/40 mt-1">
            <span>Mode: {mode === "pvp" ? "Pass & Play" : `AI (${difficulty})`}</span>
            {mode === "pvc" && (
              <span>• You: {playerColor.slice(0, 1) + playerColor.slice(1).toLowerCase()}</span>
            )}
          </div>
        </GlassPanel>

        {/* Action Controls */}
        <GlassPanel className="p-2.5 flex items-center justify-between gap-1.5">
          {[
            {
              label: "Menu",
              icon: <ChevronLeft size={15} />,
              onClick: () => {
                reset();
                setScreen("menu");
              },
            },
            {
              label: "Reset",
              icon: <RotateCcw size={15} />,
              onClick: () => reset(playerColor),
            },
            {
              label: "Undo",
              icon: <Undo2 size={15} />,
              onClick: undo,
              disabled: !history.length || aiThinking,
            },
            {
              label: "Flip",
              icon: <FlipVertical2 size={15} />,
              onClick: () => setFlipped(f => !f),
            },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className="flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-xl text-xs text-foreground/50 hover:text-foreground/90 disabled:opacity-25 transition-all duration-200"
              style={controlBtnBase}
              title={btn.label}
              onMouseEnter={e => {
                if (!btn.disabled) {
                  e.currentTarget.style.background = "rgba(140, 100, 255, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(140, 100, 255, 0.35)";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              }}
            >
              {btn.icon}
              <span className="text-[11px] hidden sm:inline">{btn.label}</span>
            </button>
          ))}

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="flex items-center justify-center p-2 rounded-xl text-xs text-foreground/50 hover:text-foreground/90 transition-all"
            style={controlBtnBase}
            title={soundEnabled ? "Mute audio" : "Unmute audio"}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(140, 100, 255, 0.15)";
              e.currentTarget.style.borderColor = "rgba(140, 100, 255, 0.35)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
            }}
          >
            {soundEnabled ? <Volume2 size={15} className="text-cyan-400" /> : <VolumeX size={15} className="text-red-400/70" />}
          </button>
        </GlassPanel>

        {/* Captured Pieces with Material Lead */}
        {[
          {
            label: "White Captured",
            pieces: capturedByWhite,
            lead: materialAdvantage.white,
            color: "BLACK" as Color,
          },
          {
            label: "Black Captured",
            pieces: capturedByBlack,
            lead: materialAdvantage.black,
            color: "WHITE" as Color,
          },
        ].map(({ label, pieces, lead, color }) => (
          <GlassPanel key={label} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-mono uppercase tracking-widest"
                style={{ color: "rgba(190, 175, 255, 0.5)" }}
              >
                {label}
              </span>
              {lead > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  +{lead}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 min-h-[26px] items-center">
              {pieces.length === 0 ? (
                <span className="text-[11px] text-foreground/20 italic">No captures</span>
              ) : (
                pieces.map((t, i) => (
                  <div key={i} className="w-5 h-5 flex items-center justify-center">
                    <ChessPieceSVG
                      piece={{ type: t, color, hasMoved: true }}
                      className="w-full h-full object-contain opacity-90"
                    />
                  </div>
                ))
              )}
            </div>
          </GlassPanel>
        ))}

        {/* Move History / Notation */}
        <GlassPanel className="p-3 flex-1 flex flex-col min-h-[160px]">
          <div
            className="text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center justify-between"
            style={{ color: "rgba(190, 175, 255, 0.5)" }}
          >
            <span>Move Notation</span>
            <span className="text-foreground/30 font-normal">
              {notation.length} {notation.length === 1 ? "ply" : "plies"}
            </span>
          </div>

          <div
            ref={notationScrollRef}
            className="space-y-1 max-h-48 overflow-y-auto pr-1 text-xs font-mono select-text"
          >
            {notation.length === 0 ? (
              <div className="text-foreground/25 italic text-center py-4 text-[11px]">
                Game just started. Awaiting opening move.
              </div>
            ) : (
              Array.from({ length: Math.ceil(notation.length / 2) }).map((_, i) => {
                const whiteMove = notation[i * 2];
                const blackMove = notation[i * 2 + 1];
                const isCurrentMove = i * 2 + 1 === notation.length - 1 || i * 2 === notation.length - 1;

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 py-0.5 px-1.5 rounded transition-colors ${
                      isCurrentMove ? "bg-violet-500/15" : "hover:bg-white/5"
                    }`}
                  >
                    <span className="text-foreground/30 w-7 shrink-0 text-right">{i + 1}.</span>
                    <span
                      className={`w-16 font-semibold ${
                        i * 2 === notation.length - 1 ? "text-cyan-300" : "text-foreground/75"
                      }`}
                    >
                      {whiteMove ?? ""}
                    </span>
                    <span
                      className={`w-16 ${
                        i * 2 + 1 === notation.length - 1 ? "text-cyan-300 font-semibold" : "text-foreground/50"
                      }`}
                    >
                      {blackMove ?? ""}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes ai-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.35); }
        }
      `}</style>
    </div>
  );
}
