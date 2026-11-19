export type Direction = "up" | "down" | "left" | "right";
export type GridSize = 3 | 4 | 5 | 6;
export type GameVariant = "classic" | "fibonacci" | "zen" | "singularity";
export type ThemeId = "celestial" | "quantum" | "solar" | "emerald" | "parchment";
export type PowerUpType = "swap" | "smash";
export type AISpeed = "slow" | "normal" | "turbo";

export interface Tile {
  id: number;
  /** Positive tile value, or -1 for immovable Singularity obstacles */
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
  /** Ephemeral parent tiles that glide into this tile's cell before dissolving */
  mergedFrom?: [Tile, Tile];
  isObstacle?: boolean;
}

export interface PowerUpCharges {
  swap: number;
  smash: number;
}

export interface HistorySnapshot {
  tiles: Tile[];
  score: number;
  moveCount: number;
  totalMerges: number;
  highestTile: number;
  streak: number;
  bestStreak: number;
  won: boolean;
  keepPlaying: boolean;
  rngState: number;
  powerUps: PowerUpCharges;
  awardedMilestones: number[];
}

export interface GameState {
  gridSize: GridSize;
  variant: GameVariant;
  dailyDate: string | null;
  tiles: Tile[];
  nextId: number;
  rngState: number;
  score: number;
  moveCount: number;
  totalMerges: number;
  highestTile: number;
  streak: number;
  bestStreak: number;
  lastMoveMergeCount: number;
  won: boolean;
  keepPlaying: boolean;
  lost: boolean;
  usedAssist: boolean;
  undosUsed: number;
  maxUndos: number;
  powerUps: PowerUpCharges;
  awardedMilestones: number[];
  history: HistorySnapshot[];
  elapsedSeconds: number;
}

export interface MergedCellInfo {
  row: number;
  col: number;
  value: number;
}

export interface MoveOutcome {
  moved: boolean;
  scoreDelta: number;
  mergeCount: number;
  maxMergedValue: number;
  mergedCells: MergedCellInfo[];
  spawnedTile: Tile | null;
  newlyWon: boolean;
  isGameOver: boolean;
  milestoneHit: number | null;
  gainedPowerUp: PowerUpType | null;
}

export interface HintRecommendation {
  direction: Direction;
  score: number;
  expectedMerges: number;
  freesCells: number;
  reason: string;
}

export interface BoardRecord {
  bestScore: number;
  bestPureScore: number;
  bestTile: number;
  gamesPlayed: number;
  wins: number;
  pureWins: number;
  bestTimeSeconds: number | null;
}

export interface DailyRecord {
  date: string;
  bestScore: number;
  bestTile: number;
  won: boolean;
  moves: number;
  completedAt: string;
}

export type AchievementId =
  | "first_512"
  | "reach_2048"
  | "beyond_4096"
  | "pure_victory"
  | "triple_fusion"
  | "combo_master"
  | "fibonacci_master"
  | "daily_conqueror";

export interface CareerStats {
  totalGames: number;
  totalMoves: number;
  totalMerges: number;
  totalScore: number;
  totalWins: number;
  highestTileEver: number;
  longestCombo: number;
  dailyCompletedCount: number;
}

export interface UserPrefs {
  themeId: ThemeId;
  soundEnabled: boolean;
  showDPad: boolean;
  aiSpeed: AISpeed;
}

export interface PersistedData {
  version: number;
  activeSession: GameState | null;
  records: Record<string, BoardRecord>;
  dailyRecords: Record<string, DailyRecord>;
  career: CareerStats;
  achievements: AchievementId[];
  prefs: UserPrefs;
}
