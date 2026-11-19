"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  Bot,
  Box,
  Check,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  FlipVertical2,
  Hash,
  HelpCircle,
  Layers,
  Lightbulb,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  Swords,
  Undo2,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { ChessBoard } from "./ChessBoard";
import { ChessPieceSVG } from "./ChessPieceSVG";
import { findBestMove, findHintMove, evaluateBoard } from "./lib/ai";
import {
  applyMove,
  calcStatus,
  cloneBoard,
  computeEnPassantTarget,
  createInitialBoard,
  formatPGN,
  getPositionKey,
  isMoveLegal,
  legalMoves,
  toAlgebraic,
} from "./lib/chess";
import { sounds } from "./lib/sound";
import { CHESS_THEMES, THEME_ORDER } from "./lib/themes";
import type {
  AIDifficulty,
  Board,
  BoardThemeId,
  Color,
  GameMode,
  GameStatus,
  GraphicsQuality,
  HistoryEntry,
  Move,
  MoveAnimationMeta,
  Piece,
  PieceType,
  Square,
  TimeControlId,
} from "./lib/types";

const ChessBoard3D = dynamic(
  () => import("./ChessBoard3D").then((m) => m.ChessBoard3D),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-3"
        style={{
          background: "radial-gradient(circle at 50% 50%, #150a2e 0%, #080314 100%)",
          border: "1.5px solid rgba(167, 139, 250, 0.35)",
        }}
      >
        <div className="w-9 h-9 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-cyan-200">
          Sculpting 3D Arena…
        </span>
      </div>
    ),
  }
);

type GameScreen = "menu" | "playing";
type ViewMode = "2d" | "3d";

const INITIAL_POS_HASH = getPositionKey(createInitialBoard(), "WHITE", null);

const MATERIAL_VALS: Record<PieceType, number> = {
  PAWN: 1,
  KNIGHT: 3,
  BISHOP: 3,
  ROOK: 5,
  QUEEN: 9,
  KING: 0,
};

const TIME_CONTROLS: Record<
  TimeControlId,
  { id: TimeControlId; label: string; baseMs: number; incMs: number }
> = {
  unlimited: { id: "unlimited", label: "Untimed", baseMs: 0, incMs: 0 },
  blitz3: { id: "blitz3", label: "3 + 2", baseMs: 3 * 60_000, incMs: 2_000 },
  blitz5: { id: "blitz5", label: "5 + 0", baseMs: 5 * 60_000, incMs: 0 },
  rapid10: { id: "rapid10", label: "10 + 5", baseMs: 10 * 60_000, incMs: 5_000 },
};

const MENU_STAR_SPECS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  size: 1.5 + (i % 3) * 1.3,
  left: `${((i * 19 + 7) % 95) + 2}%`,
  top: `${((i * 31 + 11) % 92) + 3}%`,
  duration: `${2.6 + (i % 4) * 0.8}s`,
  delay: `${(i % 5) * 0.6}s`,
  color:
    i % 3 === 0
      ? "rgba(196, 181, 253, 0.7)"
      : i % 3 === 1
      ? "rgba(103, 232, 249, 0.65)"
      : "rgba(245, 208, 254, 0.6)",
}));

function findCheckSquare(
  board: Board,
  turn: Color,
  status: GameStatus
): Square | null {
  if (status !== "CHECK" && status !== "CHECKMATE") return null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p?.type === "KING" && p.color === turn) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function formatClock(ms: number): string {
  const clamped = Math.max(0, ms);
  if (clamped < 10_000) {
    const secs = (clamped / 1000).toFixed(1);
    return `0:0${secs}`.replace("0:010.0", "0:10.0");
  }
  const totalSec = Math.ceil(clamped / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl text-slate-100 ${className}`}
      style={{
        background:
          "linear-gradient(145deg, rgba(20, 12, 42, 0.9), rgba(10, 6, 24, 0.94))",
        border: "1px solid rgba(148, 120, 240, 0.24)",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(14px)",
      }}
    >
      {children}
    </div>
  );
}

function PromotionModal({
  color,
  themeId,
  onChoose,
  onCancel,
}: {
  color: Color;
  themeId: BoardThemeId;
  onChoose: (t: PieceType) => void;
  onCancel: () => void;
}) {
  const choices: { type: PieceType; keyHint: string }[] = [
    { type: "QUEEN", keyHint: "Q" },
    { type: "ROOK", keyHint: "R" },
    { type: "BISHOP", keyHint: "B" },
    { type: "KNIGHT", keyHint: "N" },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-2xl p-4">
      <div
        className="p-6 sm:p-7 flex flex-col items-center gap-5 rounded-2xl max-w-sm w-full relative"
        style={{
          background:
            "linear-gradient(145deg, rgba(28, 16, 58, 0.97), rgba(12, 7, 30, 0.99))",
          border: "1px solid rgba(167, 139, 250, 0.45)",
          boxShadow: "0 0 50px rgba(100, 60, 255, 0.35)",
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Cancel promotion"
        >
          <X size={16} />
        </button>

        <div className="text-center">
          <h3 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-violet-200 to-cyan-200">
            Promote Pawn
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Select ascending piece or press Q / R / B / N
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2.5 w-full">
          {choices.map(({ type, keyHint }) => (
            <button
              key={type}
              type="button"
              onClick={() => onChoose(type)}
              className="group p-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 flex flex-col items-center gap-1.5 bg-white/5 hover:bg-violet-500/25 border border-violet-400/25 hover:border-cyan-300/60 cursor-pointer"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <ChessPieceSVG
                  piece={{ type, color, hasMoved: true }}
                  themeId={themeId}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-200">
                {type.slice(0, 1) + type.slice(1).toLowerCase()}
              </span>
              <span className="text-[9px] font-mono text-cyan-300/75">
                [{keyHint}]
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Live Miniature Preview for Menu ──────────────────────────────────────────

const PREVIEW_PIECES: Record<string, { type: PieceType; color: Color }> = {
  "0-0": { type: "ROOK", color: "BLACK" },
  "0-1": { type: "KNIGHT", color: "BLACK" },
  "0-2": { type: "BISHOP", color: "BLACK" },
  "0-3": { type: "QUEEN", color: "BLACK" },
  "0-4": { type: "KING", color: "BLACK" },
  "1-1": { type: "PAWN", color: "BLACK" },
  "1-3": { type: "PAWN", color: "BLACK" },
  "1-4": { type: "PAWN", color: "BLACK" },
  "3-2": { type: "BISHOP", color: "WHITE" },
  "3-4": { type: "PAWN", color: "WHITE" },
  "4-1": { type: "KNIGHT", color: "WHITE" },
  "4-3": { type: "QUEEN", color: "WHITE" },
  "5-0": { type: "PAWN", color: "WHITE" },
  "5-4": { type: "KING", color: "WHITE" },
};

function MenuBoardPreview({ themeId }: { themeId: BoardThemeId }) {
  const theme = CHESS_THEMES[themeId];
  return (
    <div className="relative flex flex-col items-center gap-3">
      <div
        className="w-52 h-52 sm:w-60 sm:h-60 rounded-2xl p-2 transition-all duration-300"
        style={{
          background: theme.board2d.frameBackground,
          border: `1.5px solid ${theme.board2d.frameBorder}`,
          boxShadow: theme.board2d.frameGlow,
        }}
      >
        <div
          className="grid grid-cols-6 grid-rows-6 w-full h-full rounded-xl overflow-hidden"
          style={{ border: `1px solid ${theme.board2d.innerFrameBorder}` }}
        >
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: 6 }).map((_, c) => {
              const isLight = (r + c) % 2 === 0;
              const p = PREVIEW_PIECES[`${r}-${c}`];
              const isHighlight = (r === 3 && c === 4) || (r === 4 && c === 3);
              return (
                <div
                  key={`${r}-${c}`}
                  className="relative flex items-center justify-center"
                  style={{
                    background: isLight
                      ? theme.board2d.lightSquare
                      : theme.board2d.darkSquare,
                  }}
                >
                  {isHighlight && (
                    <div
                      className="absolute inset-0"
                      style={{ background: theme.board2d.lastMoveTo }}
                    />
                  )}
                  {p && (
                    <div className="w-[82%] h-[82%] z-10">
                      <ChessPieceSVG
                        piece={{ ...p, hasMoved: true }}
                        themeId={themeId}
                        className="w-full h-full"
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-slate-100">{theme.name}</div>
        <div className="text-[11px] text-slate-400">{theme.subtitle}</div>
      </div>
    </div>
  );
}

// ── Player / Opponent Bar ────────────────────────────────────────────────────

function PlayerHudBar({
  label,
  isAI,
  sideColor,
  isActive,
  capturedPieces,
  capturedPieceColor,
  lead,
  themeId,
  timeMs,
  timed,
  isThinking,
}: {
  label: string;
  isAI: boolean;
  sideColor: Color;
  isActive: boolean;
  capturedPieces: PieceType[];
  capturedPieceColor: Color;
  lead: number;
  themeId: BoardThemeId;
  timeMs: number;
  timed: boolean;
  isThinking?: boolean;
}) {
  const lowTime = timed && timeMs < 20_000;

  return (
    <div
      className="w-full rounded-xl px-3 py-2 flex items-center justify-between gap-2 transition-all duration-200"
      style={{
        background: isActive
          ? "linear-gradient(135deg, rgba(35, 22, 72, 0.92), rgba(18, 12, 42, 0.95))"
          : "rgba(14, 10, 28, 0.84)",
        border: isActive
          ? "1px solid rgba(56, 189, 248, 0.45)"
          : "1px solid rgba(148, 120, 240, 0.18)",
        boxShadow: isActive ? "0 0 18px rgba(56, 189, 248, 0.16)" : "none",
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
            sideColor === "WHITE"
              ? "bg-amber-50/90 text-slate-900 border-amber-200"
              : "bg-slate-900 text-violet-200 border-violet-400/40"
          }`}
        >
          {isAI ? <Bot size={15} /> : <User size={15} />}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-100 truncate">
              {label}
            </span>
            {isActive && (
              <span
                className={`w-2 h-2 rounded-full ${
                  isThinking
                    ? "bg-cyan-400 animate-ping"
                    : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                }`}
              />
            )}
          </div>

          <div className="flex items-center gap-0.5 min-h-[16px] flex-wrap">
            {capturedPieces.slice(0, 12).map((pt, idx) => (
              <div key={idx} className="w-3.5 h-3.5 shrink-0">
                <ChessPieceSVG
                  piece={{ type: pt, color: capturedPieceColor, hasMoved: true }}
                  themeId={themeId}
                  className="w-full h-full"
                />
              </div>
            ))}
            {capturedPieces.length > 12 && (
              <span className="text-[10px] font-mono text-slate-400 ml-0.5">
                +{capturedPieces.length - 12}
              </span>
            )}
            {lead > 0 && (
              <span className="ml-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                +{lead}
              </span>
            )}
          </div>
        </div>
      </div>

      {timed && (
        <div
          className={`px-2.5 py-1 rounded-lg font-mono text-sm font-bold flex items-center gap-1.5 shrink-0 border ${
            lowTime && isActive
              ? "bg-red-500/25 border-red-400/60 text-red-200 animate-pulse"
              : isActive
              ? "bg-cyan-500/20 border-cyan-400/45 text-cyan-100"
              : "bg-white/5 border-white/10 text-slate-300"
          }`}
        >
          <Clock size={12} className="opacity-75" />
          <span>{formatClock(timeMs)}</span>
        </div>
      )}
    </div>
  );
}

// ── Live Evaluation Bar ──────────────────────────────────────────────────────

function EvalBar({
  board,
  status,
  turn,
  flipped,
}: {
  board: Board;
  status: GameStatus;
  turn: Color;
  flipped: boolean;
}) {
  const cp = useMemo(() => evaluateBoard(board), [board]);
  const isMate = status === "CHECKMATE";
  const whitePct = isMate
    ? turn === "BLACK"
      ? 100
      : 0
    : 50 + 46 * Math.tanh(cp / 450);

  const label = isMate
    ? "#"
    : `${cp >= 0 ? "+" : ""}${(cp / 100).toFixed(1)}`;

  return (
    <div
      className="hidden sm:flex flex-col items-center gap-1.5 self-stretch py-1"
      title={`Position Evaluation: ${label}`}
    >
      <span className="text-[10px] font-mono text-slate-300 w-9 text-center">
        {label}
      </span>
      <div
        className="w-3.5 flex-1 rounded-full overflow-hidden border border-white/20 flex relative bg-slate-900"
        style={{
          flexDirection: flipped ? "column" : "column-reverse",
        }}
      >
        <div
          className="w-full transition-all duration-500 ease-out"
          style={{
            height: `${whitePct}%`,
            background: "linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%)",
          }}
        />
        <div className="w-full h-[1px] bg-cyan-400/60 absolute top-1/2 left-0 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Main Game Component ──────────────────────────────────────────────────────

export function ChessGame() {
  const [screen, setScreen] = useState<GameScreen>("menu");
  const [mode, setMode] = useState<GameMode>("pvc");
  const [difficulty, setDifficulty] = useState<AIDifficulty>("medium");
  const [menuSide, setMenuSide] = useState<Color | "RANDOM">("WHITE");
  const [playerColor, setPlayerColor] = useState<Color>("WHITE");

  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [themeId, setThemeId] = useState<BoardThemeId>("celestial");
  const [quality, setQuality] = useState<GraphicsQuality>("balanced");
  const [timeControl, setTimeControl] = useState<TimeControlId>("unlimited");

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showEvalBar, setShowEvalBar] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [showControlsHelp, setShowControlsHelp] = useState(false);

  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [turn, setTurn] = useState<Color>("WHITE");
  const [status, setStatus] = useState<GameStatus>("IN_PROGRESS");
  const [timeoutWinner, setTimeoutWinner] = useState<Color | null>(null);
  const [enPassantTarget, setEPTarget] = useState<Square | null>(null);
  const [halfMoveClock, setHMClock] = useState(0);

  const [selected, setSelected] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [moveAnim, setMoveAnim] = useState<MoveAnimationMeta | null>(null);
  const [hintMove, setHintMove] = useState<Move | null>(null);
  const [focusedSquare, setFocusedSquare] = useState<Square | null>(null);

  const [pendingPromo, setPendingPromo] = useState<Move | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [notation, setNotation] = useState<string[]>([]);
  const [replayIndex, setReplayIndex] = useState<number | null>(null);

  const [flipped, setFlipped] = useState(false);
  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  const [pgnCopied, setPgnCopied] = useState(false);

  const [whiteTimeMs, setWhiteTimeMs] = useState(0);
  const [blackTimeMs, setBlackTimeMs] = useState(0);

  const notationScrollRef = useRef<HTMLDivElement | null>(null);
  const moveSeqRef = useRef(0);
  const clockRef = useRef<{ white: number; black: number }>({ white: 0, black: 0 });

  const isGameOver =
    status === "CHECKMATE" ||
    status === "STALEMATE" ||
    status === "DRAW_50" ||
    status === "DRAW_INSUFFICIENT" ||
    status === "DRAW_REPETITION" ||
    status === "TIME_OUT";

  // Derived AI thinking state (avoids synchronous setState inside effects!)
  const aiThinking =
    screen === "playing" &&
    mode === "pvc" &&
    turn !== playerColor &&
    !isGameOver &&
    !pendingPromo;

  // Sync audio flag
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Auto-scroll notation list during live play
  useEffect(() => {
    if (replayIndex === null && notationScrollRef.current) {
      notationScrollRef.current.scrollTop = notationScrollRef.current.scrollHeight;
    }
  }, [notation, replayIndex]);

  // Determine board/lastMove/status shown (live vs replay inspection)
  const isReplaying = replayIndex !== null && history.length > 0;
  const clampedReplayIdx = isReplaying
    ? Math.max(0, Math.min(history.length - 1, replayIndex))
    : null;

  const displayBoard =
    clampedReplayIdx !== null ? history[clampedReplayIdx].board : board;
  const displayLastMove =
    clampedReplayIdx !== null ? history[clampedReplayIdx].lastMove : lastMove;
  const displayTurn =
    clampedReplayIdx !== null ? history[clampedReplayIdx].turn : turn;
  const displayStatus =
    clampedReplayIdx !== null ? history[clampedReplayIdx].status : status;

  const checkSquare = findCheckSquare(displayBoard, displayTurn, displayStatus);

  const { capturedByWhite, capturedByBlack, materialAdvantage } = useMemo(() => {
    let whiteMat = 0;
    let blackMat = 0;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = displayBoard[r][c];
        if (p) {
          if (p.color === "WHITE") whiteMat += MATERIAL_VALS[p.type];
          else blackMat += MATERIAL_VALS[p.type];
        }
      }
    }

    const sliceLimit = clampedReplayIdx !== null ? clampedReplayIdx : history.length;
    const byWhite: PieceType[] = [];
    const byBlack: PieceType[] = [];
    for (let i = 0; i < sliceLimit; i++) {
      const cap = history[i]?.capturedPiece;
      if (!cap) continue;
      if (cap.color === "BLACK") byWhite.push(cap.type);
      else byBlack.push(cap.type);
    }

    const sortOrder: Record<PieceType, number> = {
      QUEEN: 0,
      ROOK: 1,
      BISHOP: 2,
      KNIGHT: 3,
      PAWN: 4,
      KING: 5,
    };
    byWhite.sort((a, b) => sortOrder[a] - sortOrder[b]);
    byBlack.sort((a, b) => sortOrder[a] - sortOrder[b]);

    return {
      capturedByWhite: byWhite,
      capturedByBlack: byBlack,
      materialAdvantage: {
        white: whiteMat - blackMat,
        black: blackMat - whiteMat,
      },
    };
  }, [displayBoard, history, clampedReplayIdx]);

  // ── Reset & Start Helpers ──────────────────────────────────────────────────

  const reset = useCallback(
    (chosenSide: Color = playerColor, tc: TimeControlId = timeControl) => {
      const baseMs = TIME_CONTROLS[tc].baseMs;
      clockRef.current = { white: baseMs, black: baseMs };
      setBoard(createInitialBoard());
      setTurn("WHITE");
      setStatus("IN_PROGRESS");
      setTimeoutWinner(null);
      setEPTarget(null);
      setHMClock(0);
      setSelected(null);
      setValidMoves([]);
      setLastMove(null);
      setMoveAnim(null);
      setHintMove(null);
      setPendingPromo(null);
      setHistory([]);
      setNotation([]);
      setReplayIndex(null);
      setGameOverDismissed(false);
      setWhiteTimeMs(baseMs);
      setBlackTimeMs(baseMs);
      setFlipped(chosenSide === "BLACK");
    },
    [playerColor, timeControl]
  );

  const startCustomGame = useCallback(
    (chosenMode: GameMode, chosenDiff: AIDifficulty, chosenSide: Color | "RANDOM") => {
      setMode(chosenMode);
      setDifficulty(chosenDiff);
      const side: Color =
        chosenMode === "pvp"
          ? "WHITE"
          : chosenSide === "RANDOM"
          ? Math.random() < 0.5
            ? "WHITE"
            : "BLACK"
          : chosenSide;
      setPlayerColor(side);
      reset(side, timeControl);
      setScreen("playing");
    },
    [reset, timeControl]
  );

  // ── Chess Clock Ticker ─────────────────────────────────────────────────────

  useEffect(() => {
    if (
      screen !== "playing" ||
      timeControl === "unlimited" ||
      isGameOver ||
      pendingPromo ||
      history.length === 0
    ) {
      return;
    }

    let lastTick = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = now - lastTick;
      lastTick = now;

      if (turn === "WHITE") {
        const next = Math.max(0, clockRef.current.white - dt);
        clockRef.current.white = next;
        setWhiteTimeMs(next);
        if (next <= 0) {
          setStatus("TIME_OUT");
          setTimeoutWinner("BLACK");
          sounds.playVictory();
        }
      } else {
        const next = Math.max(0, clockRef.current.black - dt);
        clockRef.current.black = next;
        setBlackTimeMs(next);
        if (next <= 0) {
          setStatus("TIME_OUT");
          setTimeoutWinner("WHITE");
          sounds.playVictory();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [screen, timeControl, isGameOver, pendingPromo, history.length, turn]);

  // ── Commit Move ────────────────────────────────────────────────────────────

  const commitMove = useCallback(
    (
      move: Move,
      boardToUse: Board,
      currentTurn: Color,
      ep: Square | null,
      hmc: number
    ) => {
      const verifiedMove = isMoveLegal(boardToUse, move, currentTurn, ep);
      if (!verifiedMove) return;

      const piece = boardToUse[verifiedMove.from.row][verifiedMove.from.col];
      if (!piece) return;

      const capturedPiece: Piece | null = verifiedMove.enPassantCapture
        ? boardToUse[verifiedMove.enPassantCapture.row][verifiedMove.enPassantCapture.col]
        : boardToUse[verifiedMove.to.row][verifiedMove.to.col];
      const isCapture = !!capturedPiece;

      const newBoard = applyMove(boardToUse, verifiedMove);
      const newEP = computeEnPassantTarget(verifiedMove, piece);
      const newHMC = piece.type === "PAWN" || isCapture ? 0 : hmc + 1;
      const nextTurn: Color = currentTurn === "WHITE" ? "BLACK" : "WHITE";

      const posKey = getPositionKey(newBoard, nextTurn, newEP);
      const note = toAlgebraic(
        verifiedMove,
        boardToUse,
        verifiedMove.promotion,
        newBoard,
        nextTurn
      );

      const newHistory: HistoryEntry[] = [
        ...history,
        {
          board: cloneBoard(boardToUse),
          turn: currentTurn,
          status,
          enPassantTarget: ep,
          halfMoveClock: hmc,
          positionHash: posKey,
          lastMove,
          capturedPiece,
          notation: note,
        },
      ];

      const repetitionCount =
        (posKey === INITIAL_POS_HASH ? 1 : 0) +
        newHistory.filter((h) => h.positionHash === posKey).length;

      let newStatus = calcStatus(newBoard, nextTurn, newEP, newHMC);
      if (
        repetitionCount >= 3 &&
        (newStatus === "IN_PROGRESS" || newStatus === "CHECK")
      ) {
        newStatus = "DRAW_REPETITION";
      }

      if (newStatus === "CHECKMATE") sounds.playVictory();
      else if (newStatus === "CHECK") sounds.playCheck();
      else if (verifiedMove.promotion) sounds.playPromote();
      else if (verifiedMove.castlingRook) sounds.playCastle();
      else if (isCapture) sounds.playCapture();
      else sounds.playMove();

      // Add time increment if active
      const inc = TIME_CONTROLS[timeControl].incMs;
      if (inc > 0 && newHistory.length > 1) {
        if (currentTurn === "WHITE") {
          clockRef.current.white += inc;
          setWhiteTimeMs(clockRef.current.white);
        } else {
          clockRef.current.black += inc;
          setBlackTimeMs(clockRef.current.black);
        }
      }

      moveSeqRef.current += 1;
      setMoveAnim({
        move: verifiedMove,
        seq: moveSeqRef.current,
        isCapture,
        capturedColor: capturedPiece?.color,
        isCastle: !!verifiedMove.castlingRook,
        isPromotion: !!verifiedMove.promotion,
      });

      setNotation((prev) => [...prev, note]);
      setHistory(newHistory);
      setBoard(newBoard);
      setTurn(nextTurn);
      setEPTarget(newEP);
      setHMClock(newHMC);
      setStatus(newStatus);
      setLastMove(verifiedMove);
      setSelected(null);
      setValidMoves([]);
      setHintMove(null);
      setReplayIndex(null);
      setGameOverDismissed(false);
    },
    [history, status, lastMove, timeControl]
  );

  // ── Square Click & Drag Drop ───────────────────────────────────────────────

  const handleSquareClick = useCallback(
    (sq: Square) => {
      if (isReplaying || pendingPromo || aiThinking || isGameOver) return;
      if (mode === "pvc" && turn !== playerColor) return;

      const piece = board[sq.row][sq.col];

      if (selected) {
        if (selected.row === sq.row && selected.col === sq.col) {
          setSelected(null);
          setValidMoves([]);
          return;
        }
        const move = validMoves.find(
          (m) => m.to.row === sq.row && m.to.col === sq.col
        );
        if (move) {
          const promos = validMoves.filter(
            (m) => m.to.row === sq.row && m.to.col === sq.col && m.promotion
          );
          if (promos.length > 0) {
            setPendingPromo({ ...promos[0], promotion: undefined });
            return;
          }
          commitMove(move, board, turn, enPassantTarget, halfMoveClock);
          return;
        }
        if (piece && piece.color === turn) {
          sounds.playSelect();
          setSelected(sq);
          setValidMoves(legalMoves(board, piece, sq, enPassantTarget));
          return;
        }
        sounds.playIllegal();
        setSelected(null);
        setValidMoves([]);
      } else if (piece && piece.color === turn) {
        sounds.playSelect();
        setSelected(sq);
        setValidMoves(legalMoves(board, piece, sq, enPassantTarget));
      }
    },
    [
      isReplaying,
      pendingPromo,
      aiThinking,
      isGameOver,
      mode,
      turn,
      playerColor,
      board,
      selected,
      validMoves,
      enPassantTarget,
      halfMoveClock,
      commitMove,
    ]
  );

  const handleDropPiece = useCallback(
    (from: Square, to: Square) => {
      if (isReplaying || pendingPromo || aiThinking || isGameOver) return;
      if (mode === "pvc" && turn !== playerColor) return;

      const piece = board[from.row][from.col];
      if (!piece || piece.color !== turn) return;

      const movesFromPiece = legalMoves(board, piece, from, enPassantTarget);
      const targetMove = movesFromPiece.find(
        (m) => m.to.row === to.row && m.to.col === to.col
      );
      if (!targetMove) {
        sounds.playIllegal();
        return;
      }

      const promos = movesFromPiece.filter(
        (m) => m.to.row === to.row && m.to.col === to.col && m.promotion
      );
      if (promos.length > 0) {
        setPendingPromo({ ...promos[0], promotion: undefined });
        return;
      }

      commitMove(targetMove, board, turn, enPassantTarget, halfMoveClock);
    },
    [
      isReplaying,
      pendingPromo,
      aiThinking,
      isGameOver,
      mode,
      turn,
      playerColor,
      board,
      enPassantTarget,
      halfMoveClock,
      commitMove,
    ]
  );

  const handlePromotion = useCallback(
    (t: PieceType) => {
      if (!pendingPromo || isGameOver) return;
      const move = { ...pendingPromo, promotion: t };
      setPendingPromo(null);
      commitMove(move, board, turn, enPassantTarget, halfMoveClock);
    },
    [pendingPromo, isGameOver, board, turn, enPassantTarget, halfMoveClock, commitMove]
  );

  const undo = useCallback(() => {
    if (!history.length || aiThinking || status === "TIME_OUT") return;
    const prev = [...history];
    if (mode === "pvc" && turn === playerColor && prev.length >= 2) {
      prev.pop();
    }
    const last = prev.pop();
    if (!last) return;

    setHistory(prev);
    setNotation((n) => n.slice(0, prev.length));
    setBoard(cloneBoard(last.board));
    setTurn(last.turn);
    setStatus(last.status);
    setTimeoutWinner(null);
    setEPTarget(last.enPassantTarget);
    setHMClock(last.halfMoveClock);
    setLastMove(last.lastMove);
    setSelected(null);
    setValidMoves([]);
    setHintMove(null);
    setPendingPromo(null);
    setReplayIndex(null);
    setGameOverDismissed(false);
    sounds.playSelect();
  }, [history, aiThinking, status, mode, turn, playerColor]);

  const requestHint = useCallback(() => {
    if (isReplaying || isGameOver || aiThinking || pendingPromo) return;
    if (mode === "pvc" && turn !== playerColor) return;
    if (hintMove) {
      setHintMove(null);
      return;
    }
    const best = findHintMove(board, turn, enPassantTarget);
    if (best) {
      setHintMove(best);
      sounds.playSelect();
    }
  }, [
    isReplaying,
    isGameOver,
    aiThinking,
    pendingPromo,
    mode,
    turn,
    playerColor,
    hintMove,
    board,
    enPassantTarget,
  ]);

  const copyPGN = useCallback(() => {
    const resultStr =
      status === "CHECKMATE"
        ? turn === "WHITE"
          ? "0-1"
          : "1-0"
        : status === "TIME_OUT"
        ? timeoutWinner === "WHITE"
          ? "1-0"
          : "0-1"
        : isGameOver
        ? "1/2-1/2"
        : "*";
    const pgn = formatPGN(notation, resultStr);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pgn).then(() => {
        setPgnCopied(true);
        setTimeout(() => setPgnCopied(false), 1800);
      }).catch(() => {});
    }
  }, [notation, status, turn, timeoutWinner, isGameOver]);

  // ── Replay Navigation ──────────────────────────────────────────────────────

  const stepReplayPrev = useCallback(() => {
    if (!history.length) return;
    setSelected(null);
    setValidMoves([]);
    setHintMove(null);
    setReplayIndex((curr) => {
      if (curr === null) return history.length - 1;
      return Math.max(0, curr - 1);
    });
  }, [history.length]);

  const stepReplayNext = useCallback(() => {
    if (replayIndex === null) return;
    setSelected(null);
    setValidMoves([]);
    setReplayIndex((curr) => {
      if (curr === null) return null;
      return curr + 1 >= history.length ? null : curr + 1;
    });
  }, [replayIndex, history.length]);

  const jumpToPly = useCallback(
    (plyIdx: number) => {
      setSelected(null);
      setValidMoves([]);
      setHintMove(null);
      if (plyIdx >= history.length - 1) setReplayIndex(null);
      else setReplayIndex(plyIdx + 1);
    },
    [history.length]
  );

  // ── AI Turn Execution ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!aiThinking) return;

    const ep = enPassantTarget;
    const b = cloneBoard(board);
    const hmc = halfMoveClock;
    const aiColor = turn;
    const delay = difficulty === "easy" ? 480 : difficulty === "hard" ? 560 : 520;

    const timer = setTimeout(() => {
      const move = findBestMove(b, aiColor, ep, difficulty);
      if (move) {
        commitMove(move, b, aiColor, ep, hmc);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    aiThinking,
    enPassantTarget,
    board,
    halfMoveClock,
    turn,
    difficulty,
    commitMove,
  ]);

  // ── Keyboard Navigation & Shortcuts ────────────────────────────────────────

  useEffect(() => {
    if (screen !== "playing") return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (pendingPromo) {
        const k = e.key.toLowerCase();
        if (k === "q" || k === "1") {
          e.preventDefault();
          handlePromotion("QUEEN");
        } else if (k === "r" || k === "2") {
          e.preventDefault();
          handlePromotion("ROOK");
        } else if (k === "b" || k === "3") {
          e.preventDefault();
          handlePromotion("BISHOP");
        } else if (k === "n" || k === "4") {
          e.preventDefault();
          handlePromotion("KNIGHT");
        } else if (k === "escape") {
          e.preventDefault();
          setPendingPromo(null);
        }
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key;
      const lower = key.toLowerCase();
      const step = flipped ? -1 : 1;

      if (
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight" ||
        lower === "w" ||
        lower === "a" ||
        lower === "s" ||
        lower === "d"
      ) {
        e.preventDefault();
        setFocusedSquare((curr) => {
          const base = curr ?? selected ?? { row: flipped ? 1 : 6, col: 4 };
          let dRow = 0;
          let dCol = 0;
          if (key === "ArrowUp" || lower === "w") dRow = -step;
          else if (key === "ArrowDown" || lower === "s") dRow = step;
          else if (key === "ArrowLeft" || lower === "a") dCol = -step;
          else if (key === "ArrowRight" || lower === "d") dCol = step;
          return {
            row: Math.max(0, Math.min(7, base.row + dRow)),
            col: Math.max(0, Math.min(7, base.col + dCol)),
          };
        });
        return;
      }

      if (key === "Enter" || key === " ") {
        if (focusedSquare) {
          e.preventDefault();
          handleSquareClick(focusedSquare);
        }
        return;
      }

      if (key === "Escape") {
        if (isReplaying) setReplayIndex(null);
        else {
          setSelected(null);
          setValidMoves([]);
          setHintMove(null);
          setFocusedSquare(null);
        }
        return;
      }

      if (lower === "h") {
        e.preventDefault();
        requestHint();
      } else if (lower === "f") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (lower === "z") {
        e.preventDefault();
        undo();
      } else if (lower === "v") {
        e.preventDefault();
        setViewMode((v) => (v === "3d" ? "2d" : "3d"));
      } else if (lower === "m") {
        e.preventDefault();
        setSoundEnabled((s) => !s);
      } else if (key === "[") {
        e.preventDefault();
        stepReplayPrev();
      } else if (key === "]") {
        e.preventDefault();
        stepReplayNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    screen,
    pendingPromo,
    flipped,
    selected,
    focusedSquare,
    isReplaying,
    handlePromotion,
    handleSquareClick,
    requestHint,
    undo,
    stepReplayPrev,
    stepReplayNext,
  ]);

  // ── Status Banner Text ─────────────────────────────────────────────────────

  const statusText = useMemo(() => {
    if (isReplaying && clampedReplayIdx !== null) {
      return clampedReplayIdx === 0
        ? "Inspecting Starting Position"
        : `Inspecting Move ${Math.ceil(clampedReplayIdx / 2)} (${
            notation[clampedReplayIdx - 1] ?? ""
          })`;
    }
    if (aiThinking) return "Cosmic AI is calculating…";
    switch (status) {
      case "CHECKMATE":
        return `Checkmate — ${turn === "WHITE" ? "Black" : "White"} Wins!`;
      case "TIME_OUT":
        return `Time Expired — ${timeoutWinner === "WHITE" ? "White" : "Black"} Wins!`;
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
  }, [isReplaying, clampedReplayIdx, notation, aiThinking, status, turn, timeoutWinner]);

  // ── MENU SCREEN ────────────────────────────────────────────────────────────

  if (screen === "menu") {
    return (
      <div
        className="relative rounded-3xl overflow-hidden px-4 py-8 sm:p-10 select-none text-slate-100"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(109, 40, 217, 0.25) 0%, rgba(15, 10, 35, 0.94) 55%, rgba(6, 4, 18, 0.98) 100%)",
          border: "1px solid rgba(167, 139, 250, 0.28)",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.48)",
        }}
      >
        {/* Subtle twinkling starfield */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {MENU_STAR_SPECS.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: star.left,
                top: star.top,
                background: star.color,
                animation: `menu-star-twinkle ${star.duration} ease-in-out ${star.delay} infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8 items-center">
          {/* Left column: Title + Live Theme Preview */}
          <div className="flex flex-col items-center text-center gap-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/15 border border-violet-400/30 text-xs font-mono text-violet-200">
              <Sparkles size={13} className="text-cyan-300" />
              <span>Sculpted 3D & Artisanal 2D Chamber</span>
            </div>

            <div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-200 via-cyan-200 to-fuchsia-200">
                Prepare Your Match
              </h2>
              <p className="text-xs sm:text-sm text-slate-300/80 mt-1.5 max-w-sm mx-auto">
                Instant-load procedural 3D Staunton pieces, tactile drag controls, and four luxury board materials.
              </p>
            </div>

            <MenuBoardPreview themeId={themeId} />

            {/* Theme Swatches */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
              {THEME_ORDER.map((tid) => {
                const t = CHESS_THEMES[tid];
                const active = themeId === tid;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => setThemeId(tid)}
                    className={`p-1.5 rounded-xl border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      active
                        ? "bg-white/15 border-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.35)] scale-105"
                        : "bg-white/5 border-white/10 hover:bg-white/10 opacity-75 hover:opacity-100"
                    }`}
                    title={t.name}
                  >
                    <div className="w-7 h-7 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border border-white/25">
                      <span style={{ background: t.swatch.light }} />
                      <span style={{ background: t.swatch.dark }} />
                      <span style={{ background: t.swatch.dark }} />
                      <span style={{ background: t.swatch.light }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-200 truncate w-full text-center">
                      {t.name.split(" ")[1] ?? t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right column: Match Configuration */}
          <div className="flex flex-col gap-4">
            {/* View Dimension Toggle */}
            <GlassPanel className="p-3 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-300">
                Arena Dimension
              </span>
              <div className="inline-flex p-1 rounded-xl bg-black/45 border border-white/10">
                <button
                  type="button"
                  onClick={() => setViewMode("3d")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "3d"
                      ? "bg-cyan-500/30 text-cyan-100 border border-cyan-400/50 shadow-[0_0_14px_rgba(56,189,248,0.3)]"
                      : "text-slate-400 hover:text-slate-100 border border-transparent"
                  }`}
                >
                  <Box size={14} /> 3D Sculpted
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("2d")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "2d"
                      ? "bg-violet-500/35 text-violet-100 border border-violet-400/50 shadow-[0_0_14px_rgba(167,139,250,0.3)]"
                      : "text-slate-400 hover:text-slate-100 border border-transparent"
                  }`}
                >
                  <Layers size={14} /> 2D Classic
                </button>
              </div>
            </GlassPanel>

            {/* Time Control Selector */}
            <GlassPanel className="p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Clock size={12} className="text-cyan-300" /> Time Control
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(TIME_CONTROLS) as TimeControlId[]).map((tcId) => {
                  const tc = TIME_CONTROLS[tcId];
                  const active = timeControl === tcId;
                  return (
                    <button
                      key={tcId}
                      type="button"
                      onClick={() => setTimeControl(tcId)}
                      className={`py-2 px-1 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                        active
                          ? "bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(56,189,248,0.28)]"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {tc.label}
                    </button>
                  );
                })}
              </div>
            </GlassPanel>

            {/* Vs Computer Setup */}
            <GlassPanel className="p-4 flex flex-col gap-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/35 flex items-center justify-center shrink-0">
                  <Crown size={20} className="text-cyan-300" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">
                    Player vs Computer
                  </div>
                  <div className="text-xs text-slate-400">
                    Challenge the iterative-deepening AI engine
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-200/80 mb-1.5">
                  Difficulty
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(["easy", "medium", "hard"] as AIDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        difficulty === d
                          ? "bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_14px_rgba(56,189,248,0.28)]"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {d === "easy"
                        ? "Apprentice"
                        : d === "medium"
                        ? "Scholar"
                        : "Grandmaster"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-200/80 mb-1.5">
                  Play As
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: "WHITE", label: "White" },
                      { id: "BLACK", label: "Black" },
                      { id: "RANDOM", label: "Random" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setMenuSide(s.id)}
                      className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        menuSide === s.id
                          ? "bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_14px_rgba(56,189,248,0.28)]"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => startCustomGame("pvc", difficulty, menuSide)}
                className="w-full py-3 rounded-xl font-bold text-sm text-cyan-50 transition-all duration-200 hover:brightness-110 active:scale-[0.99] cursor-pointer"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(14, 165, 233, 0.72), rgba(99, 102, 241, 0.72))",
                  border: "1px solid rgba(103, 232, 249, 0.55)",
                  boxShadow: "0 6px 24px rgba(14, 165, 233, 0.3)",
                }}
              >
                Launch AI Match
              </button>
            </GlassPanel>

            {/* Pass & Play PvP */}
            <button
              type="button"
              onClick={() => startCustomGame("pvp", difficulty, "WHITE")}
              className="group flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(76, 29, 149, 0.22))",
                border: "1px solid rgba(167, 139, 250, 0.35)",
              }}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/25 border border-violet-400/35 flex items-center justify-center shrink-0">
                  <Swords size={20} className="text-violet-200" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-100">
                    Pass & Play (PvP)
                  </div>
                  <div className="text-xs text-slate-300/75">
                    Local two-player duel on one screen
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono text-violet-200 group-hover:translate-x-0.5 transition-transform">
                Play →
              </span>
            </button>
          </div>
        </div>

        <style jsx>{`
          @keyframes menu-star-twinkle {
            0%,
            100% {
              opacity: 0.25;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.35);
            }
          }
        `}</style>
      </div>
    );
  }

  // ── PLAYING SCREEN ─────────────────────────────────────────────────────────

  const topColor: Color = flipped ? "WHITE" : "BLACK";
  const bottomColor: Color = flipped ? "BLACK" : "WHITE";

  const describeSide = (c: Color) => {
    if (mode === "pvp") return c === "WHITE" ? "White Player" : "Black Player";
    const diffName =
      difficulty === "easy"
        ? "Apprentice"
        : difficulty === "medium"
        ? "Scholar"
        : "Grandmaster";
    return c === playerColor
      ? `You (${c === "WHITE" ? "White" : "Black"})`
      : `${diffName} AI (${c === "WHITE" ? "White" : "Black"})`;
  };

  const isTimed = timeControl !== "unlimited";
  const boardContainerMaxW = focusMode
    ? "max-w-[780px]"
    : "max-w-[660px]";

  return (
    <div
      className={`flex flex-col ${
        focusMode ? "items-center" : "xl:flex-row items-center xl:items-start"
      } justify-center gap-5 w-full max-w-6xl mx-auto`}
    >
      {/* Left/Center Arena Column */}
      <div className={`w-full ${boardContainerMaxW} shrink-0 flex flex-col gap-2.5`}>
        {/* Top Graphics & Control Toolbar */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl text-slate-100"
          style={{
            background: "rgba(15, 10, 34, 0.88)",
            border: "1px solid rgba(148, 120, 240, 0.25)",
          }}
        >
          {/* 2D / 3D Switch */}
          <div className="inline-flex p-0.5 rounded-xl bg-black/45 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("3d")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === "3d"
                  ? "bg-cyan-500/30 text-cyan-100 border border-cyan-400/50"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <Box size={13} /> 3D
            </button>
            <button
              type="button"
              onClick={() => setViewMode("2d")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                viewMode === "2d"
                  ? "bg-violet-500/35 text-violet-100 border border-violet-400/50"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <Layers size={13} /> 2D
            </button>
          </div>

          {/* Live Theme Swatch Picker */}
          <div className="flex items-center gap-1.5">
            {THEME_ORDER.map((tid) => {
              const t = CHESS_THEMES[tid];
              const active = themeId === tid;
              return (
                <button
                  key={tid}
                  type="button"
                  onClick={() => setThemeId(tid)}
                  className={`w-6 h-6 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border transition-all cursor-pointer ${
                    active
                      ? "border-cyan-300 ring-2 ring-cyan-400/40 scale-110"
                      : "border-white/20 opacity-75 hover:opacity-100"
                  }`}
                  title={`Theme: ${t.name}`}
                  aria-label={`Switch theme to ${t.name}`}
                >
                  <span style={{ background: t.swatch.light }} />
                  <span style={{ background: t.swatch.dark }} />
                  <span style={{ background: t.swatch.dark }} />
                  <span style={{ background: t.swatch.light }} />
                </button>
              );
            })}
          </div>

          {/* Quality + Utility Toggles */}
          <div className="flex items-center gap-1.5">
            {viewMode === "3d" && (
              <div className="inline-flex p-0.5 rounded-lg bg-black/45 border border-white/10">
                {(["lite", "balanced", "ultra"] as GraphicsQuality[]).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuality(q)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono capitalize transition-all cursor-pointer ${
                      quality === q
                        ? "bg-violet-500/40 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title={`3D Quality: ${q}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowCoordinates((c) => !c)}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                showCoordinates
                  ? "bg-white/15 border-white/25 text-cyan-200"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Toggle board coordinates"
              aria-label="Toggle board coordinates"
            >
              <Hash size={13} />
            </button>

            <button
              type="button"
              onClick={() => setShowEvalBar((e) => !e)}
              className={`hidden sm:flex p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                showEvalBar
                  ? "bg-white/15 border-white/25 text-emerald-300"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title="Toggle evaluation bar"
              aria-label="Toggle evaluation bar"
            >
              <Activity size={13} />
            </button>

            <button
              type="button"
              onClick={() => setFocusMode((f) => !f)}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                focusMode
                  ? "bg-cyan-500/25 border-cyan-400/50 text-cyan-200"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title={focusMode ? "Exit Focus Mode" : "Focus Theater Mode"}
              aria-label={focusMode ? "Exit Focus Mode" : "Focus Theater Mode"}
            >
              {focusMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>

        {/* Replay Inspection Banner */}
        {isReplaying && (
          <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/45 text-amber-100 text-xs font-mono">
            <span>
              Replay Mode — {statusText}
            </span>
            <button
              type="button"
              onClick={() => setReplayIndex(null)}
              className="px-2.5 py-1 rounded-lg bg-amber-400/25 hover:bg-amber-400/40 border border-amber-300/50 text-amber-50 font-semibold transition-colors cursor-pointer"
            >
              Back to Live
            </button>
          </div>
        )}

        {/* Top Opponent Bar */}
        <PlayerHudBar
          label={describeSide(topColor)}
          isAI={mode === "pvc" && topColor !== playerColor}
          sideColor={topColor}
          isActive={!isReplaying && !isGameOver && turn === topColor}
          capturedPieces={
            topColor === "WHITE" ? capturedByWhite : capturedByBlack
          }
          capturedPieceColor={topColor === "WHITE" ? "BLACK" : "WHITE"}
          lead={
            topColor === "WHITE"
              ? materialAdvantage.white
              : materialAdvantage.black
          }
          themeId={themeId}
          timeMs={topColor === "WHITE" ? whiteTimeMs : blackTimeMs}
          timed={isTimed}
          isThinking={aiThinking && turn === topColor}
        />

        {/* Board + Optional Eval Bar Row */}
        <div className="relative flex items-stretch gap-2.5">
          {showEvalBar && (
            <EvalBar
              board={displayBoard}
              status={displayStatus}
              turn={displayTurn}
              flipped={flipped}
            />
          )}

          <div className="relative flex-1 min-w-0">
            {viewMode === "3d" ? (
              <ChessBoard3D
                board={displayBoard}
                flipped={flipped}
                selected={isReplaying ? null : selected}
                validMoves={isReplaying ? [] : validMoves}
                lastMove={displayLastMove}
                checkSquare={checkSquare}
                currentTurn={displayTurn}
                onSquareClick={handleSquareClick}
                onDropPiece={handleDropPiece}
                disabled={aiThinking}
                interactive={!isReplaying && !isGameOver}
                themeId={themeId}
                quality={quality}
                showCoordinates={showCoordinates}
                hintMove={isReplaying ? null : hintMove}
                moveAnim={isReplaying ? null : moveAnim}
              />
            ) : (
              <ChessBoard
                board={displayBoard}
                flipped={flipped}
                selected={isReplaying ? null : selected}
                validMoves={isReplaying ? [] : validMoves}
                lastMove={displayLastMove}
                checkSquare={checkSquare}
                currentTurn={displayTurn}
                onSquareClick={handleSquareClick}
                onDropPiece={handleDropPiece}
                disabled={aiThinking}
                interactive={!isReplaying && !isGameOver}
                themeId={themeId}
                showCoordinates={showCoordinates}
                hintMove={isReplaying ? null : hintMove}
                focusedSquare={isReplaying ? null : focusedSquare}
                moveAnim={isReplaying ? null : moveAnim}
              />
            )}

            {pendingPromo && !isReplaying && (
              <PromotionModal
                color={turn}
                themeId={themeId}
                onChoose={handlePromotion}
                onCancel={() => setPendingPromo(null)}
              />
            )}

            {isGameOver && !isReplaying && !gameOverDismissed && (
              <div className="absolute inset-0 rounded-2xl bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-40 p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-violet-500/25 border border-violet-400/50 flex items-center justify-center shadow-[0_0_25px_rgba(167,139,250,0.4)]">
                  <Crown size={28} className="text-amber-300" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-violet-200 to-cyan-200 mb-1">
                    {statusText}
                  </p>
                  <p className="text-xs text-slate-300/80">
                    {status === "CHECKMATE"
                      ? `${turn === "WHITE" ? "Black" : "White"} achieved decisive checkmate!`
                      : status === "TIME_OUT"
                      ? "Victory on time control."
                      : "The match concluded in a balanced draw."}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => reset(playerColor)}
                    className="px-5 py-2.5 rounded-xl font-semibold text-sm text-cyan-50 bg-gradient-to-r from-cyan-500/70 to-violet-500/70 border border-cyan-300/50 hover:brightness-110 transition-all cursor-pointer"
                  >
                    Play Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setGameOverDismissed(true)}
                    className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/10 border border-white/20 text-slate-100 hover:bg-white/15 transition-all cursor-pointer"
                  >
                    Inspect Board
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      reset(playerColor);
                      setScreen("menu");
                    }}
                    className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/5 border border-white/15 text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Player Bar */}
        <PlayerHudBar
          label={describeSide(bottomColor)}
          isAI={mode === "pvc" && bottomColor !== playerColor}
          sideColor={bottomColor}
          isActive={!isReplaying && !isGameOver && turn === bottomColor}
          capturedPieces={
            bottomColor === "WHITE" ? capturedByWhite : capturedByBlack
          }
          capturedPieceColor={bottomColor === "WHITE" ? "BLACK" : "WHITE"}
          lead={
            bottomColor === "WHITE"
              ? materialAdvantage.white
              : materialAdvantage.black
          }
          themeId={themeId}
          timeMs={bottomColor === "WHITE" ? whiteTimeMs : blackTimeMs}
          timed={isTimed}
          isThinking={aiThinking && turn === bottomColor}
        />
      </div>

      {/* Right / Command Side Panel */}
      <div
        className={`flex flex-col gap-3.5 w-full ${
          focusMode ? "max-w-[780px]" : "max-w-[660px] xl:max-w-[330px]"
        } shrink-0`}
      >
        {/* Status Card */}
        <GlassPanel className="p-3.5 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div
              className={`w-3 h-3 rounded-full transition-all ${
                aiThinking ? "animate-pulse" : ""
              }`}
              style={{
                background: isReplaying
                  ? "#fbbf24"
                  : aiThinking
                  ? "#38bdf8"
                  : status === "CHECK" || status === "CHECKMATE" || status === "TIME_OUT"
                  ? "#fb7185"
                  : isGameOver
                  ? "#fbbf24"
                  : turn === "WHITE"
                  ? "#f8fafc"
                  : "#a78bfa",
                boxShadow: isReplaying
                  ? "0 0 10px rgba(251, 191, 36, 0.7)"
                  : aiThinking
                  ? "0 0 12px rgba(56, 189, 248, 0.8)"
                  : status === "CHECK" || status === "CHECKMATE" || status === "TIME_OUT"
                  ? "0 0 12px rgba(251, 113, 133, 0.8)"
                  : "0 0 8px rgba(167, 139, 250, 0.45)",
              }}
            />
            <div
              className={`text-sm font-bold tracking-wide ${
                isReplaying
                  ? "text-amber-300"
                  : status === "CHECK" || status === "CHECKMATE" || status === "TIME_OUT"
                  ? "text-rose-300"
                  : isGameOver
                  ? "text-amber-300"
                  : aiThinking
                  ? "text-cyan-300"
                  : "text-slate-100"
              }`}
            >
              {statusText}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2.5 text-[11px] font-mono text-slate-300/70">
            <span>{mode === "pvp" ? "Pass & Play" : `AI · ${difficulty}`}</span>
            <span>•</span>
            <span>{TIME_CONTROLS[timeControl].label}</span>
          </div>
        </GlassPanel>

        {/* Action Controls (Explicit buttons, zero ref-access lint risks) */}
        <GlassPanel className="p-2 grid grid-cols-3 sm:grid-cols-6 xl:grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={requestHint}
            disabled={
              isReplaying ||
              isGameOver ||
              aiThinking ||
              (mode === "pvc" && turn !== playerColor)
            }
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium border transition-all disabled:opacity-30 cursor-pointer ${
              hintMove
                ? "bg-amber-500/25 border-amber-400/50 text-amber-200"
                : "bg-white/5 border-white/10 text-slate-200 hover:bg-violet-500/20 hover:border-violet-400/40"
            }`}
            title="Show tactical hint (H)"
          >
            <Lightbulb size={14} className="text-amber-300" />
            <span>Hint</span>
          </button>

          <button
            type="button"
            onClick={undo}
            disabled={!history.length || aiThinking || status === "TIME_OUT"}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-200 hover:bg-violet-500/20 hover:border-violet-400/40 disabled:opacity-30 transition-all cursor-pointer"
            title="Undo move (Z)"
          >
            <Undo2 size={14} />
            <span>Undo</span>
          </button>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-200 hover:bg-violet-500/20 hover:border-violet-400/40 transition-all cursor-pointer"
            title="Flip board (F)"
          >
            <FlipVertical2 size={14} />
            <span>Flip</span>
          </button>

          <button
            type="button"
            onClick={() => reset(playerColor)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-200 hover:bg-violet-500/20 hover:border-violet-400/40 transition-all cursor-pointer"
            title="Reset match"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-200 hover:bg-violet-500/20 hover:border-violet-400/40 transition-all cursor-pointer"
            title="Toggle sound (M)"
          >
            {soundEnabled ? (
              <Volume2 size={14} className="text-cyan-300" />
            ) : (
              <VolumeX size={14} className="text-rose-300" />
            )}
            <span>{soundEnabled ? "SFX" : "Muted"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              reset(playerColor);
              setScreen("menu");
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-slate-200 hover:bg-violet-500/20 hover:border-violet-400/40 transition-all cursor-pointer"
            title="Back to setup menu"
          >
            <ChevronLeft size={14} />
            <span>Menu</span>
          </button>
        </GlassPanel>

        {/* Interactive Move History & Replay Scrubber */}
        <GlassPanel className="p-3.5 flex flex-col gap-2.5 min-h-[210px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-200/75">
              Move Replay · {notation.length} {notation.length === 1 ? "ply" : "plies"}
            </span>
            <button
              type="button"
              onClick={copyPGN}
              disabled={notation.length === 0}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 disabled:opacity-30 transition-colors cursor-pointer"
              title="Copy game PGN"
            >
              {pgnCopied ? (
                <>
                  <Check size={11} className="text-emerald-300" /> Copied
                </>
              ) : (
                <>
                  <Copy size={11} /> PGN
                </>
              )}
            </button>
          </div>

          <div
            ref={notationScrollRef}
            className="space-y-1 max-h-52 overflow-y-auto pr-1 text-xs font-mono select-text"
          >
            {notation.length === 0 ? (
              <div className="text-slate-400/75 italic text-center py-6 text-[11px]">
                Game ready. Make your opening move!
              </div>
            ) : (
              Array.from({ length: Math.ceil(notation.length / 2) }).map((_, i) => {
                const whiteIdx = i * 2;
                const blackIdx = i * 2 + 1;
                const whiteMove = notation[whiteIdx];
                const blackMove = notation[blackIdx];

                const activePly = isReplaying
                  ? (clampedReplayIdx ?? 0) - 1
                  : notation.length - 1;

                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-white/5"
                  >
                    <span className="text-slate-400 w-7 shrink-0 text-right">
                      {i + 1}.
                    </span>
                    <button
                      type="button"
                      onClick={() => jumpToPly(whiteIdx)}
                      className={`flex-1 text-left px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                        activePly === whiteIdx
                          ? "bg-cyan-500/25 text-cyan-200 font-bold"
                          : "text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {whiteMove ?? ""}
                    </button>
                    {blackMove ? (
                      <button
                        type="button"
                        onClick={() => jumpToPly(blackIdx)}
                        className={`flex-1 text-left px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          activePly === blackIdx
                            ? "bg-cyan-500/25 text-cyan-200 font-bold"
                            : "text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        {blackMove}
                      </button>
                    ) : (
                      <span className="flex-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Replay Scrubber Buttons */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                if (history.length > 0) {
                  setSelected(null);
                  setValidMoves([]);
                  setReplayIndex(0);
                }
              }}
              disabled={!history.length || clampedReplayIdx === 0}
              className="py-1.5 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 disabled:opacity-25 cursor-pointer"
              title="Jump to start"
              aria-label="Jump to start"
            >
              <ChevronFirst size={15} />
            </button>
            <button
              type="button"
              onClick={stepReplayPrev}
              disabled={!history.length || clampedReplayIdx === 0}
              className="py-1.5 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 disabled:opacity-25 cursor-pointer"
              title="Previous move ([)"
              aria-label="Previous move"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={stepReplayNext}
              disabled={!isReplaying}
              className="py-1.5 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 disabled:opacity-25 cursor-pointer"
              title="Next move (])"
              aria-label="Next move"
            >
              <ChevronRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => setReplayIndex(null)}
              disabled={!isReplaying}
              className="py-1.5 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/15 border border-white/10 text-slate-200 disabled:opacity-25 cursor-pointer"
              title="Jump to live position"
              aria-label="Jump to live position"
            >
              <ChevronLast size={15} />
            </button>
          </div>
        </GlassPanel>

        {/* Collapsible Controls & Shortcuts Reference */}
        <GlassPanel className="p-3">
          <button
            type="button"
            onClick={() => setShowControlsHelp((s) => !s)}
            className="w-full flex items-center justify-between text-xs font-mono text-slate-200 hover:text-cyan-200 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <HelpCircle size={13} className="text-cyan-300" />
              Controls & Shortcuts
            </span>
            <span className="text-[10px] text-slate-400">
              {showControlsHelp ? "Hide" : "Show"}
            </span>
          </button>

          {showControlsHelp && (
            <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-1.5 text-[11px] text-slate-300 font-mono">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Move Piece</span>
                <span>Click or Drag & Drop</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">3D Camera</span>
                <span>Drag Space · Scroll Zoom</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">2D Arrows/Marks</span>
                <span>Right-Click / Drag</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Board Cursor</span>
                <span>Arrows / WASD + Enter</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Quick Keys</span>
                <span>H Hint · Z Undo · F Flip · V 2D/3D</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Replay / Audio</span>
                <span>[ / ] Step · M Mute · Esc Clear</span>
              </div>
            </div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}
