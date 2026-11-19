import { getTargetTile } from "./engine";
import type {
  AchievementId,
  AISpeed,
  BoardRecord,
  CareerStats,
  GameState,
  GameVariant,
  GridSize,
  MoveOutcome,
  PersistedData,
  ThemeId,
  UserPrefs,
} from "./types";

const STORAGE_KEY = "xurashad_2048_v2";
const STORAGE_VERSION = 2;

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
  badge: string;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: "first_512",
    title: "Nova Spark",
    description: "Forge a 512 tile (or 610 in Fibonacci) in any mode.",
    badge: "✦",
  },
  {
    id: "reach_2048",
    title: "Ascendant 2048",
    description: "Reach the legendary 2048 tile or higher.",
    badge: "👑",
  },
  {
    id: "beyond_4096",
    title: "Transcendence",
    description: "Keep playing and synthesize a 4096+ tile.",
    badge: "🌌",
  },
  {
    id: "pure_victory",
    title: "Unassisted Purist",
    description: "Achieve victory without using Undo, Hints, AI, or Power-Ups.",
    badge: "💎",
  },
  {
    id: "triple_fusion",
    title: "Triple Cascade",
    description: "Trigger 3 or more tile merges in a single swipe.",
    badge: "⚡",
  },
  {
    id: "combo_master",
    title: "Momentum Chain",
    description: "Chain 5 consecutive moves that produce merges.",
    badge: "🔥",
  },
  {
    id: "fibonacci_master",
    title: "Golden Ratio",
    description: "Synthesize a 610+ tile in Fibonacci mode.",
    badge: "🌀",
  },
  {
    id: "daily_conqueror",
    title: "Daily Sovereign",
    description: "Conquer a seeded Daily 4×4 Challenge.",
    badge: "📅",
  },
];

export function recordKey(variant: GameVariant, gridSize: GridSize): string {
  return `${variant}-${gridSize}`;
}

export function emptyBoardRecord(): BoardRecord {
  return {
    bestScore: 0,
    bestPureScore: 0,
    bestTile: 0,
    gamesPlayed: 0,
    wins: 0,
    pureWins: 0,
    bestTimeSeconds: null,
  };
}

export function createDefaultCareer(): CareerStats {
  return {
    totalGames: 0,
    totalMoves: 0,
    totalMerges: 0,
    totalScore: 0,
    totalWins: 0,
    highestTileEver: 0,
    longestCombo: 0,
    dailyCompletedCount: 0,
  };
}

export function createDefaultPrefs(): UserPrefs {
  return {
    themeId: "celestial",
    soundEnabled: true,
    showDPad: false,
    aiSpeed: "normal",
  };
}

export function createDefaultPersistedData(): PersistedData {
  return {
    version: STORAGE_VERSION,
    activeSession: null,
    records: {},
    dailyRecords: {},
    career: createDefaultCareer(),
    achievements: [],
    prefs: createDefaultPrefs(),
  };
}

const VALID_THEMES: ReadonlySet<ThemeId> = new Set([
  "celestial",
  "quantum",
  "solar",
  "emerald",
  "parchment",
]);

const VALID_SPEEDS: ReadonlySet<AISpeed> = new Set([
  "slow",
  "normal",
  "turbo",
]);

const VALID_VARIANTS: ReadonlySet<GameVariant> = new Set([
  "classic",
  "fibonacci",
  "zen",
  "singularity",
]);

const VALID_SIZES: ReadonlySet<number> = new Set([3, 4, 5, 6]);

function isValidSession(session: unknown): session is GameState {
  if (!session || typeof session !== "object") return false;
  const s = session as Partial<GameState>;
  return (
    typeof s.gridSize === "number" &&
    VALID_SIZES.has(s.gridSize) &&
    typeof s.variant === "string" &&
    VALID_VARIANTS.has(s.variant as GameVariant) &&
    Array.isArray(s.tiles) &&
    typeof s.score === "number" &&
    typeof s.nextId === "number" &&
    typeof s.rngState === "number"
  );
}

export function loadPersistedData(): PersistedData {
  if (typeof window === "undefined") {
    return createDefaultPersistedData();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultPersistedData();
    const parsed = JSON.parse(raw) as Partial<PersistedData>;
    if (!parsed || typeof parsed !== "object") {
      return createDefaultPersistedData();
    }

    const defaults = createDefaultPersistedData();
    const prefs: UserPrefs = {
      themeId: VALID_THEMES.has(parsed.prefs?.themeId as ThemeId)
        ? (parsed.prefs!.themeId as ThemeId)
        : defaults.prefs.themeId,
      soundEnabled:
        typeof parsed.prefs?.soundEnabled === "boolean"
          ? parsed.prefs.soundEnabled
          : defaults.prefs.soundEnabled,
      showDPad:
        typeof parsed.prefs?.showDPad === "boolean"
          ? parsed.prefs.showDPad
          : defaults.prefs.showDPad,
      aiSpeed: VALID_SPEEDS.has(parsed.prefs?.aiSpeed as AISpeed)
        ? (parsed.prefs!.aiSpeed as AISpeed)
        : defaults.prefs.aiSpeed,
    };

    const career: CareerStats = {
      ...defaults.career,
      ...(parsed.career && typeof parsed.career === "object" ? parsed.career : {}),
    };

    return {
      version: STORAGE_VERSION,
      activeSession: isValidSession(parsed.activeSession)
        ? parsed.activeSession
        : null,
      records:
        parsed.records && typeof parsed.records === "object"
          ? parsed.records
          : {},
      dailyRecords:
        parsed.dailyRecords && typeof parsed.dailyRecords === "object"
          ? parsed.dailyRecords
          : {},
      career,
      achievements: Array.isArray(parsed.achievements)
        ? (parsed.achievements.filter((a) => typeof a === "string") as AchievementId[])
        : [],
      prefs,
    };
  } catch {
    return createDefaultPersistedData();
  }
}

export function savePersistedData(data: PersistedData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export function evaluateNewAchievements(
  state: GameState,
  outcome: MoveOutcome | null,
  existing: AchievementId[]
): AchievementId[] {
  const owned = new Set<AchievementId>(existing);
  const unlocked: AchievementId[] = [];

  const grant = (id: AchievementId) => {
    if (!owned.has(id)) {
      owned.add(id);
      unlocked.push(id);
    }
  };

  if (state.highestTile >= 512) grant("first_512");
  if (state.highestTile >= 2048) grant("reach_2048");
  if (state.highestTile >= 4096) grant("beyond_4096");

  const target = getTargetTile(state.gridSize, state.variant);
  if ((state.won || state.highestTile >= target) && !state.usedAssist) {
    grant("pure_victory");
  }
  if (outcome && outcome.mergeCount >= 3) grant("triple_fusion");
  if (state.streak >= 5) grant("combo_master");
  if (state.variant === "fibonacci" && state.highestTile >= 610) {
    grant("fibonacci_master");
  }
  if (state.dailyDate && state.won) grant("daily_conqueror");

  return unlocked;
}
