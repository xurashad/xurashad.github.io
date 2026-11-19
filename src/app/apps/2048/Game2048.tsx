"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Award,
  BarChart3,
  Bot,
  Calendar,
  Check,
  Flame,
  Gamepad2,
  Hammer,
  HelpCircle,
  Lightbulb,
  Palette,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Board2048, type CellPopup } from "./Board2048";
import { HelpModal, StatsModal } from "./Game2048Modals";
import { getBestMove, getHintRecommendation } from "./lib/ai";
import {
  applyMove,
  applySmashPowerUp,
  applySwapPowerUp,
  applyUndo,
  boardToMatrix,
  createInitialState,
  generateShareText,
  getLadderValues,
  getTargetTile,
  getTodayDateKey,
  tileRank,
} from "./lib/engine";
import { sound2048 } from "./lib/sound";
import {
  ACHIEVEMENTS,
  createDefaultCareer,
  emptyBoardRecord,
  evaluateNewAchievements,
  loadPersistedData,
  recordKey,
  savePersistedData,
} from "./lib/storage";
import { getTileVisualStyle, THEME_ORDER, THEMES_2048 } from "./lib/themes";
import type {
  AchievementId,
  AISpeed,
  BoardRecord,
  CareerStats,
  DailyRecord,
  Direction,
  GameState,
  GameVariant,
  GridSize,
  HintRecommendation,
  MoveOutcome,
  PersistedData,
  PowerUpType,
  ThemeId,
  Tile,
  UserPrefs,
} from "./lib/types";
import type { TileParticleHandle } from "./TileParticleCanvas";
import "./game2048.css";

interface ScoreFlash {
  id: number;
  value: number;
}

interface ToastBanner {
  id: number;
  title: string;
  subtitle?: string;
  tone: "milestone" | "achievement" | "powerup";
}

const VARIANT_OPTIONS: { id: GameVariant; label: string; desc: string }[] = [
  { id: "classic", label: "Classic", desc: "2+2=4 standard rules" },
  { id: "fibonacci", label: "Fibonacci", desc: "Adjacent Fib merges" },
  { id: "zen", label: "Zen", desc: "Unlimited undos & boosts" },
  { id: "singularity", label: "Singularity", desc: "Immovable core obstacles" },
];

const GRID_OPTIONS: GridSize[] = [3, 4, 5, 6];

const AI_DELAY_MS: Record<AISpeed, number> = {
  slow: 360,
  normal: 145,
  turbo: 55,
};

const AI_SPEED_CYCLE: AISpeed[] = ["slow", "normal", "turbo"];

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function Game2048() {
  const [boot] = useState<PersistedData>(() => loadPersistedData());
  const [gameState, setGameState] = useState<GameState>(
    () =>
      boot.activeSession ??
      createInitialState({ gridSize: 4, variant: "classic" })
  );
  const [records, setRecords] = useState<Record<string, BoardRecord>>(
    () => boot.records
  );
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>(
    () => boot.dailyRecords
  );
  const [career, setCareer] = useState<CareerStats>(() => boot.career);
  const [achievements, setAchievements] = useState<AchievementId[]>(
    () => boot.achievements
  );
  const [prefs, setPrefs] = useState<UserPrefs>(() => boot.prefs);

  // Ephemeral interactive UI states
  const [flashes, setFlashes] = useState<ScoreFlash[]>([]);
  const [cellPopups, setCellPopups] = useState<CellPopup[]>([]);
  const [toast, setToast] = useState<ToastBanner | null>(null);
  const [nudgeDir, setNudgeDir] = useState<Direction | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [selectedSwapId, setSelectedSwapId] = useState<number | null>(null);
  const [hint, setHint] = useState<HintRecommendation | null>(null);
  const [autoAI, setAutoAI] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [beatBestThisRun, setBeatBestThisRun] = useState(false);
  const [runCounted, setRunCounted] = useState(
    () => (boot.activeSession?.moveCount ?? 0) > 0
  );
  const [winCountedForRun, setWinCountedForRun] = useState(
    () => Boolean(boot.activeSession?.won)
  );
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(
    () => boot.activeSession?.elapsedSeconds ?? 0
  );

  // Imperative refs (only accessed inside callbacks & effects)
  const particleRef = useRef<TileParticleHandle | null>(null);
  const uiCounterRef = useRef(0);
  const elapsedRef = useRef(0);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const theme = THEMES_2048[prefs.themeId];
  const targetTile = getTargetTile(gameState.gridSize, gameState.variant);
  const currentRecordKey = recordKey(gameState.variant, gameState.gridSize);
  const currentModeBest = gameState.dailyDate
    ? Math.max(
      dailyRecords[gameState.dailyDate]?.bestScore ?? 0,
      gameState.score
    )
    : Math.max(records[currentRecordKey]?.bestScore ?? 0, gameState.score);

  const todayKey = getTodayDateKey();
  const todayDailyRecord = dailyRecords[todayKey];

  // Sync audio mute state
  useEffect(() => {
    sound2048.enabled = prefs.soundEnabled;
  }, [prefs.soundEnabled]);

  // Keep elapsedRef synced without reading/writing refs during render
  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  // Persist workspace data cleanly
  useEffect(() => {
    savePersistedData({
      version: 2,
      activeSession: { ...gameState, elapsedSeconds: elapsedRef.current },
      records,
      dailyRecords,
      career,
      achievements,
      prefs,
    });
  }, [gameState, records, dailyRecords, career, achievements, prefs]);

  // Cleanup all tracked timeouts on unmount
  useEffect(() => {
    const flashSet = flashTimersRef.current;
    return () => {
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      flashSet.forEach((id) => clearTimeout(id));
      flashSet.clear();
    };
  }, []);

  // Elapsed timer when game is actively running (decoupled from gameState)
  useEffect(() => {
    const isStopped =
      gameState.lost ||
      (gameState.won && !gameState.keepPlaying) ||
      gameState.moveCount === 0 ||
      showStatsModal ||
      showHelpModal;

    if (isStopped) return;

    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [
    gameState.lost,
    gameState.won,
    gameState.keepPlaying,
    gameState.moveCount,
    showStatsModal,
    showHelpModal,
  ]);

  const showToast = useCallback(
    (
      title: string,
      subtitle: string | undefined,
      tone: ToastBanner["tone"]
    ) => {
      const id = ++uiCounterRef.current;
      setToast({ id, title, subtitle, tone });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToast((curr) => (curr?.id === id ? null : curr));
      }, 3200);
    },
    []
  );

  const scheduleFlashCleanup = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      flashTimersRef.current.delete(id);
      fn();
    }, ms);
    flashTimersRef.current.add(id);
  }, []);

  const triggerBlockedNudge = useCallback((dir: Direction) => {
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    setNudgeDir(null);
    requestAnimationFrame(() => {
      setNudgeDir(dir);
      nudgeTimerRef.current = setTimeout(() => {
        setNudgeDir(null);
      }, 180);
    });
  }, []);

  const recordProgression = useCallback(
    (
      prevState: GameState,
      nextState: GameState,
      outcome: MoveOutcome | null
    ) => {
      const key = recordKey(nextState.variant, nextState.gridSize);
      const isFirstMove = !runCounted && nextState.moveCount > 0;
      const isFirstWin = !winCountedForRun && nextState.won;

      if (isFirstMove) setRunCounted(true);
      if (isFirstWin) setWinCountedForRun(true);

      const prevBest = records[key]?.bestScore ?? 0;
      if (prevBest > 0 && nextState.score > prevBest) {
        setBeatBestThisRun(true);
      }

      setRecords((prev) => {
        const cur = prev[key] ?? emptyBoardRecord();
        const updated: BoardRecord = {
          bestScore: Math.max(cur.bestScore, nextState.score),
          bestPureScore: nextState.usedAssist
            ? cur.bestPureScore
            : Math.max(cur.bestPureScore, nextState.score),
          bestTile: Math.max(cur.bestTile, nextState.highestTile),
          gamesPlayed: cur.gamesPlayed + (isFirstMove ? 1 : 0),
          wins: cur.wins + (isFirstWin ? 1 : 0),
          pureWins:
            cur.pureWins + (isFirstWin && !nextState.usedAssist ? 1 : 0),
          bestTimeSeconds: isFirstWin
            ? cur.bestTimeSeconds === null
              ? elapsedRef.current
              : Math.min(cur.bestTimeSeconds, elapsedRef.current)
            : cur.bestTimeSeconds,
        };
        return { ...prev, [key]: updated };
      });

      if (nextState.dailyDate) {
        const dKey = nextState.dailyDate;
        const alreadyWonDaily = Boolean(dailyRecords[dKey]?.won);
        setDailyRecords((prev) => {
          const cur = prev[dKey];
          const updated: DailyRecord = {
            date: dKey,
            bestScore: Math.max(cur?.bestScore ?? 0, nextState.score),
            bestTile: Math.max(cur?.bestTile ?? 0, nextState.highestTile),
            won: Boolean(cur?.won || nextState.won),
            moves: Math.max(cur?.moves ?? 0, nextState.moveCount),
            completedAt: new Date().toISOString(),
          };
          return { ...prev, [dKey]: updated };
        });

        if (isFirstWin && !alreadyWonDaily) {
          setCareer((prev) => ({
            ...prev,
            dailyCompletedCount: prev.dailyCompletedCount + 1,
          }));
        }
      }

      if (outcome) {
        setCareer((prev) => ({
          ...prev,
          totalGames: prev.totalGames + (isFirstMove ? 1 : 0),
          totalMoves: prev.totalMoves + 1,
          totalMerges: prev.totalMerges + outcome.mergeCount,
          totalScore: prev.totalScore + outcome.scoreDelta,
          totalWins: prev.totalWins + (isFirstWin ? 1 : 0),
          highestTileEver: Math.max(
            prev.highestTileEver,
            nextState.highestTile
          ),
          longestCombo: Math.max(prev.longestCombo, nextState.streak),
        }));
      }

      const newlyUnlocked = evaluateNewAchievements(
        nextState,
        outcome,
        achievements
      );
      if (newlyUnlocked.length > 0) {
        setAchievements((prev) => [...prev, ...newlyUnlocked]);
        const firstDef = ACHIEVEMENTS.find((a) => a.id === newlyUnlocked[0]);
        if (firstDef) {
          showToast(
            `${firstDef.badge} Achievement: ${firstDef.title}`,
            firstDef.description,
            "achievement"
          );
        }
      } else if (outcome?.milestoneHit) {
        const powerNote = outcome.gainedPowerUp
          ? `Earned +1 ${outcome.gainedPowerUp === "swap" ? "Swap" : "Smash"} charge!`
          : `New tile tier forged`;
        showToast(
          `Milestone ${outcome.milestoneHit.toLocaleString()}!`,
          powerNote,
          "milestone"
        );
      }

      void prevState;
    },
    [
      achievements,
      dailyRecords,
      records,
      runCounted,
      showToast,
      winCountedForRun,
    ]
  );

  const executeMove = useCallback(
    (dir: Direction, fromAI = false): boolean => {
      setHint(null);
      setActivePowerUp(null);
      setSelectedSwapId(null);
      setConfirmReset(false);

      const result = applyMove(gameState, dir);
      if (!result.outcome.moved) {
        triggerBlockedNudge(dir);
        sound2048.playBlocked();
        if (fromAI) setAutoAI(false);
        return false;
      }

      const nextState: GameState = fromAI
        ? { ...result.nextState, usedAssist: true }
        : result.nextState;
      const { outcome } = result;

      setGameState(nextState);
      recordProgression(gameState, nextState, outcome);

      // Sound feedback
      if (outcome.newlyWon) {
        sound2048.playVictory();
      } else if (outcome.isGameOver) {
        sound2048.playGameOver();
      } else if (outcome.milestoneHit) {
        sound2048.playMilestone();
      } else if (outcome.mergeCount > 0) {
        sound2048.playMerge(
          tileRank(outcome.maxMergedValue, nextState.variant),
          outcome.mergeCount
        );
      } else {
        sound2048.playSlide();
      }

      // Particle bursts & cell score popups
      if (outcome.mergedCells.length > 0) {
        for (const cell of outcome.mergedCells) {
          const rank = tileRank(cell.value, nextState.variant);
          particleRef.current?.burstCell(
            cell.row,
            cell.col,
            nextState.gridSize,
            theme.particleColors,
            Math.min(2.2, 0.8 + rank * 0.14)
          );
          if (cell.value >= 8) {
            const popId = ++uiCounterRef.current;
            setCellPopups((prev) => [
              ...prev,
              { id: popId, row: cell.row, col: cell.col, value: cell.value },
            ]);
            scheduleFlashCleanup(() => {
              setCellPopups((prev) => prev.filter((p) => p.id !== popId));
            }, 840);
          }
        }
      }

      if (outcome.newlyWon) {
        particleRef.current?.celebrate(theme.particleColors);
      }

      if (outcome.scoreDelta > 0) {
        const flashId = ++uiCounterRef.current;
        setFlashes((prev) => [
          ...prev,
          { id: flashId, value: outcome.scoreDelta },
        ]);
        scheduleFlashCleanup(() => {
          setFlashes((prev) => prev.filter((f) => f.id !== flashId));
        }, 860);
      }

      if (outcome.newlyWon) {
        setLiveStatus(
          `Victory! Reached ${targetTile} with score ${nextState.score}.`
        );
        if (fromAI) setAutoAI(false);
      } else if (outcome.isGameOver) {
        setLiveStatus(`Game over. Final score ${nextState.score}.`);
        if (fromAI) setAutoAI(false);
      } else if (outcome.mergeCount > 0) {
        setLiveStatus(
          `Slid ${dir}, merged ${outcome.mergeCount} times for +${outcome.scoreDelta}. Score ${nextState.score}.`
        );
      } else {
        setLiveStatus(`Slid ${dir}.`);
      }

      return true;
    },
    [
      gameState,
      recordProgression,
      scheduleFlashCleanup,
      targetTile,
      theme.particleColors,
      triggerBlockedNudge,
    ]
  );

  const startNewGame = useCallback(
    (opts: {
      gridSize?: GridSize;
      variant?: GameVariant;
      dailyDate?: string | null;
    }) => {
      setAutoAI(false);
      setHint(null);
      setActivePowerUp(null);
      setSelectedSwapId(null);
      setConfirmReset(false);
      setFlashes([]);
      setCellPopups([]);
      setBeatBestThisRun(false);
      setRunCounted(false);
      setWinCountedForRun(false);
      setElapsedSeconds(0);
      elapsedRef.current = 0;

      const next = createInitialState({
        gridSize: opts.gridSize ?? gameState.gridSize,
        variant: opts.variant ?? gameState.variant,
        dailyDate:
          opts.dailyDate !== undefined ? opts.dailyDate : gameState.dailyDate,
      });
      setGameState(next);
      setLiveStatus(
        next.dailyDate
          ? `Started Daily Challenge for ${next.dailyDate}.`
          : `Started ${next.variant} ${next.gridSize}×${next.gridSize} game.`
      );
    },
    [gameState.dailyDate, gameState.gridSize, gameState.variant]
  );

  const handleResetButton = useCallback(() => {
    const midRun =
      gameState.score >= 128 &&
      !gameState.lost &&
      !(gameState.won && !gameState.keepPlaying);

    if (midRun && !confirmReset) {
      setConfirmReset(true);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => {
        setConfirmReset(false);
      }, 3000);
      return;
    }

    startNewGame({});
  }, [
    confirmReset,
    gameState.keepPlaying,
    gameState.lost,
    gameState.score,
    gameState.won,
    startNewGame,
  ]);

  const handleUndo = useCallback(() => {
    if (gameState.dailyDate || gameState.history.length === 0) return;
    setAutoAI(false);
    setHint(null);
    setActivePowerUp(null);
    setSelectedSwapId(null);
    setConfirmReset(false);
    sound2048.playUndo();
    setGameState((prev) => applyUndo(prev));
    setLiveStatus("Undid last move.");
  }, [gameState.dailyDate, gameState.history.length]);

  const handleKeepPlaying = useCallback(() => {
    setGameState((prev) => ({ ...prev, keepPlaying: true }));
    setLiveStatus("Continuing endless run.");
  }, []);

  const handleTriggerHint = useCallback(() => {
    if (gameState.lost || (gameState.won && !gameState.keepPlaying)) return;
    setAutoAI(false);
    setActivePowerUp(null);
    setSelectedSwapId(null);
    const rec = getHintRecommendation(gameState);
    if (rec) {
      setHint(rec);
      setGameState((prev) => ({ ...prev, usedAssist: true }));
      setLiveStatus(`Hint suggests sliding ${rec.direction}. ${rec.reason}`);
    }
  }, [gameState]);

  const togglePowerUp = useCallback(
    (type: PowerUpType) => {
      if (
        gameState.dailyDate ||
        gameState.powerUps[type] <= 0 ||
        gameState.lost ||
        (gameState.won && !gameState.keepPlaying)
      ) {
        return;
      }
      setAutoAI(false);
      setHint(null);
      setSelectedSwapId(null);
      setActivePowerUp((prev) => (prev === type ? null : type));
    },
    [gameState.dailyDate, gameState.keepPlaying, gameState.lost, gameState.powerUps, gameState.won]
  );

  const handleTileClick = useCallback(
    (tile: Tile) => {
      if (!activePowerUp || tile.isObstacle) return;

      if (activePowerUp === "smash") {
        const next = applySmashPowerUp(gameState, tile.id);
        if (next !== gameState) {
          sound2048.playPowerUp("smash");
          particleRef.current?.burstCell(
            tile.row,
            tile.col,
            gameState.gridSize,
            theme.particleColors,
            1.6
          );
          setGameState(next);
          recordProgression(gameState, next, null);
          setActivePowerUp(null);
          setLiveStatus(`Smashed tile ${tile.value}.`);
        }
        return;
      }

      // Swap targeting
      if (selectedSwapId === null) {
        setSelectedSwapId(tile.id);
        return;
      }
      if (selectedSwapId === tile.id) {
        setSelectedSwapId(null);
        return;
      }
      const next = applySwapPowerUp(gameState, selectedSwapId, tile.id);
      if (next !== gameState) {
        sound2048.playPowerUp("swap");
        setGameState(next);
        recordProgression(gameState, next, null);
        setActivePowerUp(null);
        setSelectedSwapId(null);
        setLiveStatus("Swapped two tiles.");
      }
    },
    [
      activePowerUp,
      gameState,
      recordProgression,
      selectedSwapId,
      theme.particleColors,
    ]
  );

  const handleShare = useCallback(async () => {
    const text = generateShareText(gameState, theme.name);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedShare(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedShare(false), 2200);
  }, [gameState, theme.name]);

  const toggleSound = useCallback(() => {
    setPrefs((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const cycleAISpeed = useCallback(() => {
    setPrefs((prev) => {
      const idx = AI_SPEED_CYCLE.indexOf(prev.aiSpeed);
      const next = AI_SPEED_CYCLE[(idx + 1) % AI_SPEED_CYCLE.length];
      return { ...prev, aiSpeed: next };
    });
  }, []);

  // Auto-AI loop
  useEffect(() => {
    if (
      !autoAI ||
      gameState.lost ||
      (gameState.won && !gameState.keepPlaying) ||
      showStatsModal ||
      showHelpModal
    ) {
      return;
    }

    const delay = AI_DELAY_MS[prefs.aiSpeed];
    const id = setTimeout(() => {
      const best = getBestMove(gameState);
      if (!best) {
        setAutoAI(false);
        return;
      }
      executeMove(best, true);
    }, delay);

    return () => clearTimeout(id);
  }, [
    autoAI,
    executeMove,
    gameState,
    prefs.aiSpeed,
    showHelpModal,
    showStatsModal,
  ]);

  // Keyboard listener (case-insensitive WASD, Arrows, Z/Ctrl+Z, H, R, M, Esc)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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

      if (e.key === "Escape") {
        if (showStatsModal) {
          setShowStatsModal(false);
          return;
        }
        if (showHelpModal) {
          setShowHelpModal(false);
          return;
        }
        if (activePowerUp) {
          setActivePowerUp(null);
          setSelectedSwapId(null);
          return;
        }
        if (autoAI) {
          setAutoAI(false);
          return;
        }
        return;
      }

      if (showStatsModal || showHelpModal) return;

      // Ctrl/Cmd + Z Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const dirMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        W: "up",
        s: "down",
        S: "down",
        a: "left",
        A: "left",
        d: "right",
        D: "right",
      };

      const dir = dirMap[e.key];
      if (dir) {
        e.preventDefault();
        if (autoAI) setAutoAI(false);
        executeMove(dir, false);
        return;
      }

      const lower = e.key.toLowerCase();
      if (lower === "z") {
        e.preventDefault();
        handleUndo();
      } else if (lower === "h") {
        e.preventDefault();
        handleTriggerHint();
      } else if (lower === "r") {
        e.preventDefault();
        handleResetButton();
      } else if (lower === "m") {
        e.preventDefault();
        toggleSound();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    activePowerUp,
    autoAI,
    executeMove,
    handleResetButton,
    handleTriggerHint,
    handleUndo,
    showHelpModal,
    showStatsModal,
    toggleSound,
  ]);

  // Derived telemetry values
  const emptyCellCount = useMemo(() => {
    const mat = boardToMatrix(gameState.tiles, gameState.gridSize);
    let count = 0;
    for (const v of mat) if (v === 0) count++;
    return count;
  }, [gameState.gridSize, gameState.tiles]);

  const ladderValues = useMemo(
    () => getLadderValues(gameState.gridSize, gameState.variant),
    [gameState.gridSize, gameState.variant]
  );

  const progressPct = useMemo(() => {
    const curRank = Math.max(
      0,
      tileRank(gameState.highestTile, gameState.variant)
    );
    const targetRank = Math.max(
      1,
      tileRank(targetTile, gameState.variant)
    );
    return Math.min(100, Math.round((curRank / targetRank) * 100));
  }, [gameState.highestTile, gameState.variant, targetTile]);

  const normalTileCount = gameState.tiles.filter((t) => !t.isObstacle).length;
  const isBoardLocked =
    gameState.lost || (gameState.won && !gameState.keepPlaying);

  return (
    <div className="w-full max-w-[920px] flex flex-col items-center gap-5 select-none">
      {/* Screen-reader live region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveStatus}
      </div>

      {/* Top Mode, Grid & Utility Bar */}
      <div className="w-full glass border border-[var(--surface-border)] p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Variants + Daily */}
        <div className="flex flex-wrap items-center gap-1.5">
          {VARIANT_OPTIONS.map((v) => {
            const active = !gameState.dailyDate && gameState.variant === v.id;
            return (
              <button
                key={v.id}
                type="button"
                title={v.desc}
                onClick={() =>
                  startNewGame({ variant: v.id, dailyDate: null })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${active
                  ? "bg-quantum/15 text-quantum border-quantum/40 font-semibold shadow-sm"
                  : "border-foreground/10 text-foreground/65 hover:text-foreground hover:bg-foreground/[0.05]"
                  }`}
              >
                {v.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              if (!gameState.dailyDate) {
                startNewGame({
                  gridSize: 4,
                  variant: "classic",
                  dailyDate: getTodayDateKey(),
                });
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${gameState.dailyDate
              ? "bg-amber-500/18 text-amber-500 border-amber-400/45 font-semibold shadow-sm"
              : "border-foreground/10 text-foreground/65 hover:text-foreground hover:bg-foreground/[0.05]"
              }`}
          >
            <Calendar size={13} />
            Daily
            {todayDailyRecord?.won && (
              <Check size={12} className="text-emerald-500" />
            )}
          </button>
        </div>

        {/* Grid Sizes + Utility Icons */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <div
            className="flex items-center gap-1 p-1 rounded-xl border border-foreground/10 bg-foreground/[0.03]"
            title={
              gameState.dailyDate
                ? "Daily Challenge always uses a 4×4 Classic board"
                : "Select grid dimensions"
            }
          >
            {GRID_OPTIONS.map((sz) => {
              const active = gameState.gridSize === sz;
              const disabled = Boolean(gameState.dailyDate);
              return (
                <button
                  key={sz}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    startNewGame({ gridSize: sz, dailyDate: null })
                  }
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${disabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer"
                    } ${active
                      ? "bg-foreground/12 text-foreground font-bold"
                      : "text-foreground/55 hover:text-foreground"
                    }`}
                >
                  {sz}×{sz}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleSound}
            aria-label={prefs.soundEnabled ? "Mute sound" : "Unmute sound"}
            title={prefs.soundEnabled ? "Mute SFX (M)" : "Unmute SFX (M)"}
            className="p-2 rounded-xl border border-foreground/12 bg-foreground/[0.03] text-foreground/70 hover:text-foreground hover:bg-foreground/[0.07] transition-colors cursor-pointer"
          >
            {prefs.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            type="button"
            onClick={() => setShowStatsModal(true)}
            aria-label="Open stats and achievements"
            title="Career Stats & Achievements"
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-foreground/12 bg-foreground/[0.03] text-foreground/75 hover:text-foreground hover:bg-foreground/[0.07] transition-colors text-xs font-mono cursor-pointer"
          >
            <BarChart3 size={15} />
            <span className="hidden sm:inline">Stats</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-semibold">
              {achievements.length}/{ACHIEVEMENTS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            aria-label="Open guide and keyboard shortcuts"
            title="How to Play & Shortcuts"
            className="p-2 rounded-xl border border-foreground/12 bg-foreground/[0.03] text-foreground/70 hover:text-foreground hover:bg-foreground/[0.07] transition-colors cursor-pointer"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </div>

      {/* Main Two-Column Studio */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,490px)_minmax(300px,360px)] gap-6 items-start justify-center">
        {/* Left Column: HUD + Board + Action Dock */}
        <div className="flex flex-col gap-3.5 w-full max-w-[490px] mx-auto">
          {/* HUD Bar */}
          <div className="grid grid-cols-4 gap-2.5">
            {/* Score */}
            <div className="relative glass border border-[var(--surface-border)] px-3 py-2.5 text-center overflow-visible">
              <div className="text-[9px] font-mono uppercase tracking-widest text-foreground/50">
                Score
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-foreground">
                {gameState.score.toLocaleString()}
              </div>
              {flashes.map((f) => (
                <span
                  key={f.id}
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 -top-1 text-sm font-mono font-bold g2048-score-float"
                  style={{ color: theme.scoreFlashColor }}
                >
                  +{f.value}
                </span>
              ))}
            </div>

            {/* Best */}
            <div className="relative glass border border-[var(--surface-border)] px-3 py-2.5 text-center">
              <div className="text-[9px] font-mono uppercase tracking-widest text-foreground/50 flex items-center justify-center gap-1">
                <span>Best</span>
                {beatBestThisRun && (
                  <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-500 font-bold">
                    NEW
                  </span>
                )}
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-foreground">
                {currentModeBest.toLocaleString()}
              </div>
            </div>

            {/* Moves */}
            <div className="glass border border-[var(--surface-border)] px-3 py-2.5 text-center">
              <div className="text-[9px] font-mono uppercase tracking-widest text-foreground/50">
                Moves
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-foreground">
                {gameState.moveCount}
              </div>
            </div>

            {/* Time */}
            <div className="glass border border-[var(--surface-border)] px-3 py-2.5 text-center">
              <div className="text-[9px] font-mono uppercase tracking-widest text-foreground/50">
                Time
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-foreground">
                {formatTimer(elapsedSeconds)}
              </div>
            </div>
          </div>

          {/* Streak, Integrity & Toast Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px] px-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-foreground/12 bg-foreground/[0.04] text-foreground/75">
                {gameState.dailyDate
                  ? `Daily · ${gameState.dailyDate}`
                  : `${gameState.variant.toUpperCase()} · ${gameState.gridSize}×${gameState.gridSize}`}
              </span>

              {!gameState.usedAssist ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/12 text-emerald-500">
                  <ShieldCheck size={12} />
                  Pure Run
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-foreground/12 bg-foreground/[0.04] text-foreground/55">
                  Assisted
                </span>
              )}

              {gameState.streak >= 2 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-amber-500/35 bg-amber-500/15 text-amber-500 font-semibold">
                  <Flame size={12} />
                  {gameState.streak}× Streak
                </span>
              )}
            </div>

            {toast && (
              <div
                key={toast.id}
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border shadow-sm ${toast.tone === "achievement"
                  ? "border-amber-400/45 bg-amber-500/15 text-amber-500"
                  : "border-quantum/40 bg-quantum/12 text-quantum"
                  }`}
              >
                <Award size={12} />
                <span className="font-semibold">{toast.title}</span>
              </div>
            )}
          </div>

          {/* Power-up Targeting Banner */}
          {activePowerUp && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-quantum/40 bg-quantum/12 text-xs">
              <div className="flex items-center gap-2 font-medium text-foreground">
                {activePowerUp === "swap" ? (
                  <>
                    <ArrowLeftRight size={15} className="text-quantum" />
                    <span>
                      {selectedSwapId === null
                        ? "Swap Mode: Click the first tile you want to move."
                        : "Swap Mode: Now click a second tile to swap positions."}
                    </span>
                  </>
                ) : (
                  <>
                    <Hammer size={15} className="text-rose-400" />
                    <span>
                      Smash Mode: Click any numbered tile to vaporize it.
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePowerUp(null);
                  setSelectedSwapId(null);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-foreground/15 hover:bg-foreground/10 text-[11px] font-mono cursor-pointer"
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          )}

          {/* Game Board */}
          <Board2048
            state={gameState}
            theme={theme}
            targetTile={targetTile}
            nudgeDir={nudgeDir}
            activePowerUp={activePowerUp}
            selectedSwapId={selectedSwapId}
            hintDirection={hint?.direction ?? null}
            cellPopups={cellPopups}
            particleRef={particleRef}
            onMove={(dir) => {
              if (autoAI) setAutoAI(false);
              executeMove(dir, false);
            }}
            onTileClick={handleTileClick}
            onKeepPlaying={handleKeepPlaying}
            onUndo={handleUndo}
            onReset={() => startNewGame({})}
            onShare={handleShare}
            copiedShare={copiedShare}
          />

          {/* Tactical Action Dock */}
          <div className="glass border border-[var(--surface-border)] p-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Undo */}
              <button
                type="button"
                disabled={
                  Boolean(gameState.dailyDate) || gameState.history.length === 0
                }
                onClick={handleUndo}
                title={
                  gameState.dailyDate
                    ? "Undo disabled in Daily Challenge"
                    : "Undo last move (Z / Ctrl+Z)"
                }
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-foreground/12 bg-foreground/[0.04] hover:bg-foreground/[0.09] disabled:opacity-35 disabled:cursor-not-allowed text-xs font-medium transition-colors cursor-pointer"
              >
                <Undo2 size={14} />
                <span>Undo</span>
                {!gameState.dailyDate && (
                  <span className="text-[10px] font-mono opacity-65">
                    {gameState.variant === "zen"
                      ? "∞"
                      : gameState.history.length}
                  </span>
                )}
              </button>

              {/* Swap Power-Up */}
              <button
                type="button"
                disabled={
                  Boolean(gameState.dailyDate) ||
                  gameState.powerUps.swap <= 0 ||
                  isBoardLocked
                }
                onClick={() => togglePowerUp("swap")}
                title="Swap any two tiles"
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer ${activePowerUp === "swap"
                  ? "border-quantum bg-quantum/20 text-quantum"
                  : "border-foreground/12 bg-foreground/[0.04] hover:bg-foreground/[0.09]"
                  }`}
              >
                <ArrowLeftRight size={14} />
                <span>Swap</span>
                <span className="text-[10px] font-mono px-1 rounded bg-foreground/10">
                  {gameState.powerUps.swap}
                </span>
              </button>

              {/* Smash Power-Up */}
              <button
                type="button"
                disabled={
                  Boolean(gameState.dailyDate) ||
                  gameState.powerUps.smash <= 0 ||
                  normalTileCount <= 1 ||
                  isBoardLocked
                }
                onClick={() => togglePowerUp("smash")}
                title="Remove any single tile"
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer ${activePowerUp === "smash"
                  ? "border-rose-400 bg-rose-500/20 text-rose-400"
                  : "border-foreground/12 bg-foreground/[0.04] hover:bg-foreground/[0.09]"
                  }`}
              >
                <Hammer size={14} />
                <span>Smash</span>
                <span className="text-[10px] font-mono px-1 rounded bg-foreground/10">
                  {gameState.powerUps.smash}
                </span>
              </button>

              {/* Hint */}
              <button
                type="button"
                disabled={isBoardLocked}
                onClick={handleTriggerHint}
                title="Expectimax tactical hint (H)"
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer ${hint
                  ? "border-amber-400/50 bg-amber-500/15 text-amber-500"
                  : "border-foreground/12 bg-foreground/[0.04] hover:bg-foreground/[0.09]"
                  }`}
              >
                <Lightbulb size={14} />
                <span>Hint</span>
              </button>

              {/* Auto AI + Speed */}
              <div className="flex items-center rounded-xl border border-foreground/12 overflow-hidden">
                <button
                  type="button"
                  disabled={isBoardLocked}
                  onClick={() => {
                    setActivePowerUp(null);
                    setSelectedSwapId(null);
                    setAutoAI((v) => !v);
                  }}
                  title="Toggle Expectimax Auto-Play"
                  className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer ${autoAI
                    ? "bg-quantum/20 text-quantum font-semibold"
                    : "bg-foreground/[0.04] hover:bg-foreground/[0.09]"
                    }`}
                >
                  <Bot size={14} />
                  <span>{autoAI ? "Stop AI" : "Auto"}</span>
                </button>
                <button
                  type="button"
                  onClick={cycleAISpeed}
                  title="Cycle Auto-AI speed"
                  className="px-2 py-2 text-[10px] font-mono uppercase border-l border-foreground/12 bg-foreground/[0.03] hover:bg-foreground/[0.08] text-foreground/70 cursor-pointer"
                >
                  {prefs.aiSpeed === "normal" ? "Norm" : prefs.aiSpeed}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* D-Pad toggle */}
              <button
                type="button"
                onClick={() =>
                  setPrefs((prev) => ({ ...prev, showDPad: !prev.showDPad }))
                }
                title="Toggle on-screen directional pad"
                aria-label="Toggle on-screen directional pad"
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${prefs.showDPad
                  ? "border-quantum/40 bg-quantum/15 text-quantum"
                  : "border-foreground/12 bg-foreground/[0.04] text-foreground/65 hover:text-foreground"
                  }`}
              >
                <Gamepad2 size={15} />
              </button>

              {/* New Game with safe confirmation */}
              <button
                type="button"
                onClick={handleResetButton}
                title="New Game (R)"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${confirmReset
                  ? "border-rose-500/50 bg-rose-500/20 text-rose-500"
                  : "border-foreground/12 bg-foreground/[0.05] hover:bg-foreground/[0.1] text-foreground"
                  }`}
              >
                <RotateCcw size={14} />
                <span>{confirmReset ? "Confirm?" : "New"}</span>
              </button>
            </div>
          </div>

          {/* Optional On-Screen D-Pad */}
          {prefs.showDPad && (
            <div className="glass border border-[var(--surface-border)] p-3 flex flex-col items-center gap-1.5">
              <button
                type="button"
                aria-label="Slide up"
                onClick={() => executeMove("up")}
                className="w-12 h-10 rounded-xl border border-foreground/15 bg-foreground/[0.05] hover:bg-foreground/[0.12] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                <ArrowUp size={18} />
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Slide left"
                  onClick={() => executeMove("left")}
                  className="w-12 h-10 rounded-xl border border-foreground/15 bg-foreground/[0.05] hover:bg-foreground/[0.12] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Slide down"
                  onClick={() => executeMove("down")}
                  className="w-12 h-10 rounded-xl border border-foreground/15 bg-foreground/[0.05] hover:bg-foreground/[0.12] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                >
                  <ArrowDown size={18} />
                </button>
                <button
                  type="button"
                  aria-label="Slide right"
                  onClick={() => executeMove("right")}
                  className="w-12 h-10 rounded-xl border border-foreground/15 bg-foreground/[0.05] hover:bg-foreground/[0.12] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Telemetry & Customization Sidebar */}
        <div className="flex flex-col gap-4 w-full max-w-[490px] lg:max-w-none mx-auto">
          {/* Card 1: Tile Evolution Ladder */}
          <div className="glass border border-[var(--surface-border)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground/65">
                <Sparkles size={14} style={{ color: theme.accentColor }} />
                <span>Evolution Ladder</span>
              </div>
              <span className="text-xs font-mono font-semibold text-foreground/80">
                {gameState.highestTile.toLocaleString()} /{" "}
                {targetTile.toLocaleString()}
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-foreground/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  background: theme.accentColor,
                }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ladderValues.map((val) => {
                const style = getTileVisualStyle(
                  theme,
                  val,
                  gameState.variant
                );
                const unlocked = gameState.highestTile >= val;
                const isPeak = gameState.highestTile === val;
                const isGoal = val === targetTile;

                return (
                  <div
                    key={val}
                    title={
                      isGoal
                        ? `Target tile: ${val}`
                        : unlocked
                          ? `Unlocked: ${val}`
                          : `Locked: ${val}`
                    }
                    className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold tabular-nums transition-all ${unlocked ? "opacity-100" : "opacity-30 grayscale-[45%]"
                      } ${isPeak ? "ring-2 ring-quantum dark:ring-white scale-105" : ""} ${isGoal && !isPeak ? "ring-1 ring-amber-400/75" : ""
                      }`}
                    style={{
                      background: style.bg,
                      color: style.text,
                      border: `1px solid ${style.border}`,
                    }}
                  >
                    {val}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Tactical Coach / Live Telemetry */}
          <div className="glass border border-[var(--surface-border)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground/65">
                <Lightbulb size={14} className="text-amber-400" />
                <span>{hint ? "Tactical Coach" : "Board Telemetry"}</span>
              </div>
              {hint && (
                <button
                  type="button"
                  onClick={() => executeMove(hint.direction, false)}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-quantum/15 border border-quantum/35 text-quantum hover:bg-quantum/25 transition-colors cursor-pointer"
                >
                  Apply {hint.direction.toUpperCase()}
                </button>
              )}
            </div>

            {hint ? (
              <div className="rounded-xl border border-amber-400/35 bg-amber-500/10 p-3 space-y-1">
                <div className="text-sm font-bold text-foreground">
                  Slide {hint.direction.toUpperCase()}
                </div>
                <p className="text-xs text-foreground/75 leading-relaxed">
                  {hint.reason}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-2.5">
                  <div className="text-[10px] font-mono uppercase text-foreground/50">
                    Empty Cells
                  </div>
                  <div className="text-sm font-bold font-mono mt-0.5">
                    {emptyCellCount} / {gameState.gridSize * gameState.gridSize}
                  </div>
                </div>
                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-2.5">
                  <div className="text-[10px] font-mono uppercase text-foreground/50">
                    Best Streak
                  </div>
                  <div className="text-sm font-bold font-mono mt-0.5">
                    {gameState.bestStreak}×
                  </div>
                </div>
                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-2.5">
                  <div className="text-[10px] font-mono uppercase text-foreground/50">
                    Efficiency
                  </div>
                  <div className="text-sm font-bold font-mono mt-0.5">
                    {gameState.moveCount > 0
                      ? (gameState.score / gameState.moveCount).toFixed(1)
                      : "0.0"}{" "}
                    pts/mv
                  </div>
                </div>
                <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-2.5">
                  <div className="text-[10px] font-mono uppercase text-foreground/50">
                    Total Merges
                  </div>
                  <div className="text-sm font-bold font-mono mt-0.5">
                    {gameState.totalMerges}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Theme Switcher */}
          <div className="glass border border-[var(--surface-border)] p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground/65">
              <Palette size={14} style={{ color: theme.accentColor }} />
              <span>Artisanal Palettes</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {THEME_ORDER.map((id: ThemeId) => {
                const t = THEMES_2048[id];
                const active = prefs.themeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setPrefs((prev) => ({ ...prev, themeId: id }))
                    }
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${active
                      ? "border-quantum/45 bg-quantum/10 shadow-sm"
                      : "border-foreground/10 bg-foreground/[0.02] hover:bg-foreground/[0.06]"
                      }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground">
                        {t.name}
                      </div>
                      <div className="text-[10px] text-foreground/55 truncate">
                        {t.subtitle}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {t.swatches.map((hex, i) => (
                        <span
                          key={i}
                          className="w-3.5 h-3.5 rounded-full border border-white/30"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 4: Daily Challenge & Share Card */}
          <div className="glass border border-[var(--surface-border)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground/65">
                <Calendar size={14} className="text-amber-400" />
                <span>Daily Seed · {todayKey}</span>
              </div>
              {todayDailyRecord?.won && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  Solved
                </span>
              )}
            </div>

            <p className="text-xs text-foreground/65 leading-relaxed">
              {todayDailyRecord
                ? `Today's best: ${todayDailyRecord.bestScore.toLocaleString()} pts (Peak ${todayDailyRecord.bestTile} in ${todayDailyRecord.moves} moves).`
                : "Play today's deterministic 4×4 board shared globally — no undos or power-ups."}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  startNewGame({
                    gridSize: 4,
                    variant: "classic",
                    dailyDate: todayKey,
                  })
                }
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/35 text-amber-500 text-xs font-semibold hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                <Calendar size={13} />
                {gameState.dailyDate === todayKey
                  ? "Restart Daily"
                  : "Play Daily"}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-foreground/15 bg-foreground/[0.04] hover:bg-foreground/[0.09] text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedShare ? <Check size={13} /> : <Share2 size={13} />}
                <span>{copiedShare ? "Copied!" : "Share"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StatsModal
        open={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        career={career}
        records={records}
        dailyRecords={dailyRecords}
        achievements={achievements}
        onResetStats={() => {
          setRecords({});
          setDailyRecords({});
          setCareer(createDefaultCareer());
          setAchievements([]);
          setBeatBestThisRun(false);
        }}
      />
      <HelpModal
        open={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
