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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl">
      <div
        className="p-8 flex flex-col items-center gap-5 rounded-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(40,20,80,0.95), rgba(20,10,50,0.95))",
          border: "1px solid rgba(140,100,255,0.3)",
          boxShadow: "0 0 40px rgba(100,60,255,0.2), 0 0 80px rgba(80,40,200,0.1)",
        }}
      >
        <h3
          className="text-lg font-bold"
          style={{
            background: "linear-gradient(135deg, #c8b0ff, #80d0ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Promote pawn
        </h3>
        <div className="flex gap-3">
          {choices.map(t => (
            <button
              key={t}
              onClick={() => onChoose(t)}
              className="p-3 rounded-xl transition-all duration-200 hover:scale-110"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(140,100,255,0.2)";
                e.currentTarget.style.borderColor = "rgba(140,100,255,0.4)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(140,100,255,0.2)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <ChessPieceSVG piece={{ type: t, color, hasMoved: true }} size={44} />
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
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${1.5 + Math.random() * 2.5}px`,
            height: `${1.5 + Math.random() * 2.5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(${180 + Math.random() * 75}, ${160 + Math.random() * 80}, 255, ${0.3 + Math.random() * 0.5})`,
            animation: `star-twinkle ${2 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
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
      className={`rounded-xl ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(30,15,60,0.8), rgba(20,10,45,0.85))",
        border: "1px solid rgba(120,90,200,0.2)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
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
    <div className="flex flex-col items-center gap-10 py-10 relative">
      <StarField />

      {/* Decorative chess piece silhouettes */}
      <div className="absolute top-4 left-8 opacity-[0.06] pointer-events-none">
        <ChessPieceSVG piece={{ type: "QUEEN", color: "WHITE", hasMoved: false }} size={100} />
      </div>
      <div className="absolute bottom-4 right-8 opacity-[0.06] pointer-events-none">
        <ChessPieceSVG piece={{ type: "KING", color: "BLACK", hasMoved: false }} size={100} />
      </div>

      <div className="text-center relative z-10">
        <h2
          className="text-5xl sm:text-6xl font-serif font-bold mb-3"
          style={{
            background: "linear-gradient(135deg, #c8b0ff, #80d0ff, #e0a0ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 2px 8px rgba(100,60,255,0.3))",
          }}
        >
          Celestial Chess
        </h2>
        <p className="text-foreground/35 text-sm tracking-wide">Choose your battle</p>
      </div>

      <div className="flex flex-col gap-4 w-72 relative z-10">
        <button
          onClick={() => startGame("pvp")}
          className="group flex items-center gap-4 px-7 py-4 rounded-xl font-semibold transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(120,80,220,0.15), rgba(80,50,180,0.1))",
            border: "1px solid rgba(140,100,255,0.25)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(120,80,220,0.3), rgba(80,50,180,0.2))";
            e.currentTarget.style.borderColor = "rgba(140,100,255,0.5)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(120,80,220,0.2)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(120,80,220,0.15), rgba(80,50,180,0.1))";
            e.currentTarget.style.borderColor = "rgba(140,100,255,0.25)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Swords size={20} className="text-violet-300" />
          <div className="text-left">
            <div className="text-violet-200">Player vs Player</div>
            <div className="text-[11px] text-violet-400/50 font-normal">Two players, one board</div>
          </div>
        </button>

        <button
          onClick={() => startGame("pvc")}
          className="group flex items-center gap-4 px-7 py-4 rounded-xl font-semibold transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, rgba(60,160,200,0.15), rgba(40,120,180,0.1))",
            border: "1px solid rgba(80,200,255,0.25)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(60,160,200,0.3), rgba(40,120,180,0.2))";
            e.currentTarget.style.borderColor = "rgba(80,200,255,0.5)";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(60,160,200,0.2)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "linear-gradient(135deg, rgba(60,160,200,0.15), rgba(40,120,180,0.1))";
            e.currentTarget.style.borderColor = "rgba(80,200,255,0.25)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Crown size={20} className="text-cyan-300" />
          <div className="text-left">
            <div className="text-cyan-200">Player vs Computer</div>
            <div className="text-[11px] text-cyan-400/50 font-normal">Challenge the AI (depth 3)</div>
          </div>
        </button>
      </div>

      {/* Inline keyframes for stars */}
      <style jsx>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );

  // ── GAME ──────────────────────────────────────────────────────────────────────
  const capturedByWhite = captured.BLACK; // pieces black lost = captured by white
  const capturedByBlack = captured.WHITE;

  // Control button style
  const controlBtnBase: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

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
          <div className="absolute inset-0 rounded-2xl bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-5 z-40">
            <p
              className="text-2xl font-bold"
              style={{
                background: status === "CHECKMATE"
                  ? "linear-gradient(135deg, #ffd700, #ffaa00)"
                  : "linear-gradient(135deg, #c8b0ff, #80d0ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {statusText}
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, rgba(80,200,255,0.2), rgba(120,80,255,0.2))",
                border: "1px solid rgba(80,200,255,0.3)",
                color: "#80d0ff",
              }}
            >
              Play again
            </button>
          </div>
        )}
      </div>

      {/* Side panel */}
      <div className="flex flex-col gap-4 w-full xl:w-64 shrink-0">

        {/* Status */}
        <GlassPanel className="p-4 text-center">
          {/* Turn indicator dot */}
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: aiThinking
                  ? "#60d0ff"
                  : status === "CHECK" || status === "CHECKMATE"
                    ? "#ff5050"
                    : isGameOver
                      ? "#ffd700"
                      : turn === "WHITE" ? "#f0e8d0" : "#7b5fc0",
                boxShadow: aiThinking
                  ? "0 0 8px rgba(96,208,255,0.5)"
                  : status === "CHECK" || status === "CHECKMATE"
                    ? "0 0 8px rgba(255,80,80,0.5)"
                    : "0 0 6px rgba(120,90,200,0.3)",
                animation: aiThinking ? "ai-pulse 1.5s ease-in-out infinite" : undefined,
              }}
            />
            <div className={`text-sm font-semibold ${
              status === "CHECK" || status === "CHECKMATE" ? "text-red-400" :
              isGameOver ? "text-yellow-400" :
              aiThinking ? "text-cyan-400" : "text-foreground/60"
            }`}>
              {statusText}
            </div>
          </div>
          {mode === "pvc" && !isGameOver && (
            <div className="text-[10px] font-mono text-foreground/25 mt-1.5">You play White</div>
          )}
        </GlassPanel>

        {/* Controls */}
        <GlassPanel className="p-3 flex gap-2">
          {[
            { label: "Menu", icon: <ChevronLeft size={14} />, onClick: () => { reset(); setScreen("menu"); } },
            { label: "Reset", icon: <RotateCcw size={14} />, onClick: reset },
            { label: "Undo", icon: <Undo2 size={14} />, onClick: undo, disabled: !history.length || aiThinking },
            { label: "Flip", icon: <FlipVertical2 size={14} />, onClick: () => setFlipped(f => !f) },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              disabled={btn.disabled}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-foreground/40 hover:text-foreground/70 disabled:opacity-30 transition-all duration-200"
              style={controlBtnBase}
              title={btn.label}
              onMouseEnter={e => {
                if (!btn.disabled) {
                  e.currentTarget.style.background = "rgba(140,100,255,0.12)";
                  e.currentTarget.style.borderColor = "rgba(140,100,255,0.25)";
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </GlassPanel>

        {/* Captured pieces */}
        {[{ label: "White captured", pieces: capturedByWhite }, { label: "Black captured", pieces: capturedByBlack }].map(({ label, pieces }) => (
          <GlassPanel key={label} className="p-3">
            <div
              className="text-[10px] font-mono uppercase tracking-widest mb-2"
              style={{ color: "rgba(180,160,255,0.35)" }}
            >
              {label}
            </div>
            <div className="flex flex-wrap gap-1 min-h-6">
              {pieces.map((t, i) => (
                <ChessPieceSVG key={i} piece={{ type: t, color: label.includes("White") ? "BLACK" : "WHITE", hasMoved: true }} size={22} />
              ))}
            </div>
          </GlassPanel>
        ))}

        {/* Move notation */}
        <GlassPanel className="p-3 flex-1">
          <div
            className="text-[10px] font-mono uppercase tracking-widest mb-2"
            style={{ color: "rgba(180,160,255,0.35)" }}
          >
            Moves
          </div>
          <div className="space-y-0.5 max-h-56 overflow-y-auto">
            {Array.from({ length: Math.ceil(notation.length / 2) }).map((_, i) => (
              <div key={i} className="flex gap-2 text-xs font-mono">
                <span className="text-foreground/20 w-6 shrink-0">{i + 1}.</span>
                <span className="text-foreground/55 w-16">{notation[i * 2] ?? ""}</span>
                <span className="text-foreground/35 w-16">{notation[i * 2 + 1] ?? ""}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* Inline keyframes */}
      <style jsx>{`
        @keyframes ai-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
