import type {
  Direction,
  GameState,
  GameVariant,
  GridSize,
  HistorySnapshot,
  MergedCellInfo,
  MoveOutcome,
  PowerUpType,
  Tile,
} from "./types";

export const FIB_SEQUENCE: readonly number[] = [
  1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181,
  6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229,
  832040,
];

const FIB_INDEX = new Map<number, number>(
  FIB_SEQUENCE.map((val, idx) => [val, idx])
);

const CLASSIC_MILESTONES = [128, 256, 512, 1024, 2048, 4096, 8192, 16384];
const FIB_MILESTONES = [89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711];

/** Deterministic 32-bit FNV-1a hash for string seeds. */
export function hashSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Pure Mulberry32 step returning a float in [0, 1) and the next uint32 state. */
export function nextSeededRandom(state: number): { value: number; nextState: number } {
  const nextState = (state + 0x6d2b79f5) >>> 0;
  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, nextState };
}

/** Local calendar date key YYYY-MM-DD for Daily Challenge seeding. */
export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function canValuesMerge(a: number, b: number, variant: GameVariant): boolean {
  if (a <= 0 || b <= 0) return false;
  if (variant === "fibonacci") {
    if (a === 1 && b === 1) return true;
    const idxA = FIB_INDEX.get(a);
    const idxB = FIB_INDEX.get(b);
    if (idxA === undefined || idxB === undefined) return false;
    return Math.abs(idxA - idxB) === 1;
  }
  return a === b;
}

export function mergedValue(a: number, b: number, _variant: GameVariant): number {
  void _variant;
  return a + b;
}

/** 0-based progression rank used uniformly for theme colors, pitch, and AI. */
export function tileRank(value: number, variant: GameVariant): number {
  if (value <= 0) return -1;
  if (variant === "fibonacci") {
    const idx = FIB_INDEX.get(value);
    if (idx !== undefined) return idx;
    return Math.max(0, Math.round(Math.log(value) / Math.log(1.6180339887)));
  }
  return Math.max(0, Math.round(Math.log2(value)) - 1);
}

export function getTargetTile(gridSize: GridSize, variant: GameVariant): number {
  if (variant === "fibonacci") {
    const map: Record<GridSize, number> = {
      3: 233,
      4: 2584,
      5: 6765,
      6: 17711,
    };
    return map[gridSize];
  }
  const map: Record<GridSize, number> = {
    3: 256,
    4: 2048,
    5: 4096,
    6: 8192,
  };
  return map[gridSize];
}

export function getLadderValues(gridSize: GridSize, variant: GameVariant): number[] {
  const target = getTargetTile(gridSize, variant);
  if (variant === "fibonacci") {
    const targetIdx = FIB_INDEX.get(target) ?? 16;
    const endIdx = Math.min(FIB_SEQUENCE.length - 1, targetIdx + 2);
    return FIB_SEQUENCE.slice(0, endIdx + 1);
  }
  const values: number[] = [];
  let v = 2;
  const maxVal = target * 4;
  while (v <= maxVal) {
    values.push(v);
    v *= 2;
  }
  return values;
}

function stripEphemeral(tiles: Tile[]): Tile[] {
  return tiles.map((t) => ({
    id: t.id,
    value: t.value,
    row: t.row,
    col: t.col,
    ...(t.isObstacle ? { isObstacle: true } : {}),
  }));
}

function computeHighestTile(tiles: Tile[]): number {
  let max = 0;
  for (const t of tiles) {
    if (!t.isObstacle && t.value > max) max = t.value;
  }
  return max;
}

function chooseSpawnValue(variant: GameVariant, randVal: number): number {
  if (variant === "fibonacci") {
    return randVal < 0.8 ? 1 : 2;
  }
  return randVal < 0.9 ? 2 : 4;
}

function getOccupiedSet(tiles: Tile[], gridSize: GridSize): Set<number> {
  const occupied = new Set<number>();
  for (const t of tiles) {
    occupied.add(t.row * gridSize + t.col);
  }
  return occupied;
}

function spawnTile(
  tiles: Tile[],
  gridSize: GridSize,
  variant: GameVariant,
  nextId: number,
  rngState: number
): { tile: Tile | null; nextId: number; rngState: number } {
  const occupied = getOccupiedSet(tiles, gridSize);
  const empties: { row: number; col: number }[] = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (!occupied.has(r * gridSize + c)) {
        empties.push({ row: r, col: c });
      }
    }
  }
  if (empties.length === 0) {
    return { tile: null, nextId, rngState };
  }
  const r1 = nextSeededRandom(rngState);
  const cell = empties[Math.floor(r1.value * empties.length)];
  const r2 = nextSeededRandom(r1.nextState);
  const value = chooseSpawnValue(variant, r2.value);

  const tile: Tile = {
    id: nextId,
    value,
    row: cell.row,
    col: cell.col,
    isNew: true,
  };
  return {
    tile,
    nextId: nextId + 1,
    rngState: r2.nextState,
  };
}

function chooseObstaclePositions(
  gridSize: GridSize,
  rngState: number
): { positions: [number, number][]; rngState: number } {
  const r1 = nextSeededRandom(rngState);
  if (gridSize === 3) {
    return { positions: [[1, 1]], rngState: r1.nextState };
  }
  if (gridSize === 4) {
    const candidates: [number, number][] = [
      [1, 1],
      [1, 2],
      [2, 1],
      [2, 2],
    ];
    const pick = candidates[Math.floor(r1.value * candidates.length)];
    return { positions: [pick], rngState: r1.nextState };
  }
  if (gridSize === 5) {
    const pairs: [number, number][][] = [
      [
        [1, 1],
        [3, 3],
      ],
      [
        [1, 3],
        [3, 1],
      ],
    ];
    return {
      positions: pairs[Math.floor(r1.value * pairs.length)],
      rngState: r1.nextState,
    };
  }
  const pairs6: [number, number][][] = [
    [
      [1, 1],
      [4, 4],
    ],
    [
      [1, 4],
      [4, 1],
    ],
    [
      [2, 1],
      [3, 4],
    ],
    [
      [1, 3],
      [4, 2],
    ],
  ];
  return {
    positions: pairs6[Math.floor(r1.value * pairs6.length)],
    rngState: r1.nextState,
  };
}

export interface CreateInitialStateOptions {
  gridSize?: GridSize;
  variant?: GameVariant;
  dailyDate?: string | null;
  seed?: number;
}

export function createInitialState(
  options: CreateInitialStateOptions = {}
): GameState {
  const dailyDate = options.dailyDate ?? null;
  const gridSize: GridSize = dailyDate ? 4 : (options.gridSize ?? 4);
  const variant: GameVariant = dailyDate ? "classic" : (options.variant ?? "classic");

  let rngState =
    options.seed !== undefined
      ? options.seed >>> 0
      : dailyDate
        ? hashSeed(`2048-daily-${dailyDate}`)
        : hashSeed(`${Date.now()}-${Math.random()}-${variant}-${gridSize}`);

  let nextId = 1;
  const tiles: Tile[] = [];

  if (variant === "singularity") {
    const obs = chooseObstaclePositions(gridSize, rngState);
    rngState = obs.rngState;
    for (const [row, col] of obs.positions) {
      tiles.push({
        id: nextId++,
        value: -1,
        row,
        col,
        isObstacle: true,
      });
    }
  }

  for (let i = 0; i < 2; i++) {
    const spawned = spawnTile(tiles, gridSize, variant, nextId, rngState);
    nextId = spawned.nextId;
    rngState = spawned.rngState;
    if (spawned.tile) {
      tiles.push(spawned.tile);
    }
  }

  const maxUndos = dailyDate ? 0 : variant === "zen" ? 999 : 25;
  const powerUps = dailyDate
    ? { swap: 0, smash: 0 }
    : variant === "zen"
      ? { swap: 3, smash: 3 }
      : { swap: 1, smash: 1 };

  return {
    gridSize,
    variant,
    dailyDate,
    tiles,
    nextId,
    rngState,
    score: 0,
    moveCount: 0,
    totalMerges: 0,
    highestTile: computeHighestTile(tiles),
    streak: 0,
    bestStreak: 0,
    lastMoveMergeCount: 0,
    won: false,
    keepPlaying: false,
    lost: false,
    usedAssist: false,
    undosUsed: 0,
    maxUndos,
    powerUps,
    awardedMilestones: [],
    history: [],
    elapsedSeconds: 0,
  };
}

function emptyOutcome(): MoveOutcome {
  return {
    moved: false,
    scoreDelta: 0,
    mergeCount: 0,
    maxMergedValue: 0,
    mergedCells: [],
    spawnedTile: null,
    newlyWon: false,
    isGameOver: false,
    milestoneHit: null,
    gainedPowerUp: null,
  };
}

/** Convert current tiles into a flat gridSize × gridSize numeric matrix (0 empty, -1 obstacle). */
export function boardToMatrix(tiles: Tile[], gridSize: GridSize): number[] {
  const mat = new Array<number>(gridSize * gridSize).fill(0);
  for (const t of tiles) {
    mat[t.row * gridSize + t.col] = t.isObstacle ? -1 : t.value;
  }
  return mat;
}

export function canMove(
  tiles: Tile[],
  gridSize: GridSize,
  variant: GameVariant
): boolean {
  const mat = boardToMatrix(tiles, gridSize);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const v = mat[r * gridSize + c];
      if (v === 0) return true;
      if (v < 0) continue;
      if (c + 1 < gridSize) {
        const right = mat[r * gridSize + c + 1];
        if (canValuesMerge(v, right, variant)) return true;
      }
      if (r + 1 < gridSize) {
        const down = mat[(r + 1) * gridSize + c];
        if (canValuesMerge(v, down, variant)) return true;
      }
    }
  }
  return false;
}

function makeSnapshot(state: GameState): HistorySnapshot {
  return {
    tiles: stripEphemeral(state.tiles),
    score: state.score,
    moveCount: state.moveCount,
    totalMerges: state.totalMerges,
    highestTile: state.highestTile,
    streak: state.streak,
    bestStreak: state.bestStreak,
    won: state.won,
    keepPlaying: state.keepPlaying,
    rngState: state.rngState,
    powerUps: { ...state.powerUps },
    awardedMilestones: [...state.awardedMilestones],
  };
}

function pushHistory(
  history: HistorySnapshot[],
  snapshot: HistorySnapshot,
  maxUndos: number
): HistorySnapshot[] {
  if (maxUndos <= 0) return [];
  const next = [...history, snapshot];
  if (next.length > maxUndos) {
    return next.slice(next.length - maxUndos);
  }
  return next;
}

function coordForLine(
  lineIdx: number,
  stepIdx: number,
  dir: Direction,
  gridSize: GridSize
): { row: number; col: number } {
  switch (dir) {
    case "left":
      return { row: lineIdx, col: stepIdx };
    case "right":
      return { row: lineIdx, col: gridSize - 1 - stepIdx };
    case "up":
      return { row: stepIdx, col: lineIdx };
    case "down":
      return { row: gridSize - 1 - stepIdx, col: lineIdx };
  }
}

export function applyMove(
  state: GameState,
  dir: Direction
): { nextState: GameState; outcome: MoveOutcome } {
  if (state.lost || (state.won && !state.keepPlaying)) {
    return { nextState: state, outcome: emptyOutcome() };
  }

  const N = state.gridSize;
  const cleaned = stripEphemeral(state.tiles);
  const grid: (Tile | null)[][] = Array.from({ length: N }, () =>
    Array<Tile | null>(N).fill(null)
  );
  for (const t of cleaned) {
    grid[t.row][t.col] = t;
  }

  let nextId = state.nextId;
  let moved = false;
  let scoreDelta = 0;
  let mergeCount = 0;
  let maxMergedValue = 0;
  const mergedCells: MergedCellInfo[] = [];
  const nextTiles: Tile[] = [];

  for (let lineIdx = 0; lineIdx < N; lineIdx++) {
    // Extract line along direction
    const line: (Tile | null)[] = [];
    for (let stepIdx = 0; stepIdx < N; stepIdx++) {
      const { row, col } = coordForLine(lineIdx, stepIdx, dir, N);
      line.push(grid[row][col]);
    }

    // Split line into contiguous segments separated by obstacle tiles
    let cursor = 0;
    while (cursor < N) {
      const current = line[cursor];
      if (current && current.isObstacle) {
        nextTiles.push(current);
        cursor++;
        continue;
      }

      const segStart = cursor;
      const segTiles: Tile[] = [];
      while (cursor < N) {
        const cell = line[cursor];
        if (cell && cell.isObstacle) break;
        if (cell) segTiles.push(cell);
        cursor++;
      }

      let writeOffset = 0;
      let i = 0;
      while (i < segTiles.length) {
        const a = segTiles[i];
        const destCoord = coordForLine(lineIdx, segStart + writeOffset, dir, N);

        if (
          i + 1 < segTiles.length &&
          canValuesMerge(a.value, segTiles[i + 1].value, state.variant)
        ) {
          const b = segTiles[i + 1];
          const newVal = mergedValue(a.value, b.value, state.variant);
          const mergedId = nextId++;

          const parentA: Tile = {
            id: a.id,
            value: a.value,
            row: destCoord.row,
            col: destCoord.col,
          };
          const parentB: Tile = {
            id: b.id,
            value: b.value,
            row: destCoord.row,
            col: destCoord.col,
          };

          nextTiles.push({
            id: mergedId,
            value: newVal,
            row: destCoord.row,
            col: destCoord.col,
            isMerged: true,
            mergedFrom: [parentA, parentB],
          });

          scoreDelta += newVal;
          mergeCount++;
          if (newVal > maxMergedValue) maxMergedValue = newVal;
          mergedCells.push({
            row: destCoord.row,
            col: destCoord.col,
            value: newVal,
          });
          moved = true;
          i += 2;
        } else {
          if (a.row !== destCoord.row || a.col !== destCoord.col) {
            moved = true;
          }
          nextTiles.push({
            id: a.id,
            value: a.value,
            row: destCoord.row,
            col: destCoord.col,
          });
          i += 1;
        }
        writeOffset++;
      }
    }
  }

  if (!moved) {
    return { nextState: state, outcome: emptyOutcome() };
  }

  const nextHistory = pushHistory(
    state.history,
    makeSnapshot(state),
    state.maxUndos
  );

  // Spawn 1 new random tile using deterministic PRNG
  const spawned = spawnTile(
    nextTiles,
    N,
    state.variant,
    nextId,
    state.rngState
  );
  nextId = spawned.nextId;
  const rngState = spawned.rngState;
  if (spawned.tile) {
    nextTiles.push(spawned.tile);
  }

  const highestTile = computeHighestTile(nextTiles);
  const nextScore = state.score + scoreDelta;
  const nextMoveCount = state.moveCount + 1;
  const nextTotalMerges = state.totalMerges + mergeCount;
  const nextStreak = mergeCount > 0 ? state.streak + 1 : 0;
  const nextBestStreak = Math.max(state.bestStreak, nextStreak);

  // Check newly crossed milestones and bonus power-up charges
  const milestoneList =
    state.variant === "fibonacci" ? FIB_MILESTONES : CLASSIC_MILESTONES;
  const nextAwarded = [...state.awardedMilestones];
  const nextPowerUps = { ...state.powerUps };
  let milestoneHit: number | null = null;
  let gainedPowerUp: PowerUpType | null = null;

  for (const m of milestoneList) {
    if (highestTile >= m && !nextAwarded.includes(m)) {
      nextAwarded.push(m);
      milestoneHit = m;
      if (!state.dailyDate && m >= 512) {
        const eligibleCount = nextAwarded.filter((x) => x >= 512).length;
        const awardedType: PowerUpType =
          eligibleCount % 2 === 1 ? "swap" : "smash";
        nextPowerUps[awardedType] += 1;
        gainedPowerUp = awardedType;
      }
    }
  }

  const target = getTargetTile(N, state.variant);
  const newlyWon = !state.won && highestTile >= target;
  const won = state.won || newlyWon;
  const canStillMove = canMove(nextTiles, N, state.variant);
  const lost = !canStillMove && (!won || state.keepPlaying);

  const nextState: GameState = {
    ...state,
    tiles: nextTiles,
    nextId,
    rngState,
    score: nextScore,
    moveCount: nextMoveCount,
    totalMerges: nextTotalMerges,
    highestTile,
    streak: nextStreak,
    bestStreak: nextBestStreak,
    lastMoveMergeCount: mergeCount,
    won,
    lost,
    powerUps: nextPowerUps,
    awardedMilestones: nextAwarded,
    history: nextHistory,
  };

  return {
    nextState,
    outcome: {
      moved: true,
      scoreDelta,
      mergeCount,
      maxMergedValue,
      mergedCells,
      spawnedTile: spawned.tile,
      newlyWon,
      isGameOver: lost,
      milestoneHit,
      gainedPowerUp,
    },
  };
}

export function applyUndo(state: GameState): GameState {
  if (state.history.length === 0 || state.dailyDate) return state;
  const snap = state.history[state.history.length - 1];
  let maxTileId = 0;
  for (const t of snap.tiles) {
    if (t.id > maxTileId) maxTileId = t.id;
  }
  return {
    ...state,
    tiles: stripEphemeral(snap.tiles),
    nextId: Math.max(state.nextId, maxTileId + 1),
    score: snap.score,
    moveCount: snap.moveCount,
    totalMerges: snap.totalMerges,
    highestTile: snap.highestTile,
    streak: snap.streak,
    bestStreak: snap.bestStreak,
    lastMoveMergeCount: 0,
    won: snap.won,
    keepPlaying: snap.keepPlaying,
    lost: false,
    rngState: snap.rngState,
    powerUps: { ...snap.powerUps },
    awardedMilestones: [...snap.awardedMilestones],
    history: state.history.slice(0, -1),
    undosUsed: state.undosUsed + 1,
    usedAssist: true,
  };
}

export function applySwapPowerUp(
  state: GameState,
  idA: number,
  idB: number
): GameState {
  if (
    state.dailyDate ||
    state.powerUps.swap <= 0 ||
    state.lost ||
    (state.won && !state.keepPlaying) ||
    idA === idB
  ) {
    return state;
  }

  const tileA = state.tiles.find((t) => t.id === idA && !t.isObstacle);
  const tileB = state.tiles.find((t) => t.id === idB && !t.isObstacle);
  if (!tileA || !tileB) return state;

  const nextHistory = pushHistory(
    state.history,
    makeSnapshot(state),
    state.maxUndos
  );

  const nextTiles = stripEphemeral(state.tiles).map((t) => {
    if (t.id === idA) {
      return { ...t, row: tileB.row, col: tileB.col };
    }
    if (t.id === idB) {
      return { ...t, row: tileA.row, col: tileA.col };
    }
    return t;
  });

  const canStillMove = canMove(nextTiles, state.gridSize, state.variant);

  return {
    ...state,
    tiles: nextTiles,
    powerUps: { ...state.powerUps, swap: state.powerUps.swap - 1 },
    history: nextHistory,
    usedAssist: true,
    lost: !canStillMove && (!state.won || state.keepPlaying),
  };
}

export function applySmashPowerUp(state: GameState, id: number): GameState {
  if (
    state.dailyDate ||
    state.powerUps.smash <= 0 ||
    state.lost ||
    (state.won && !state.keepPlaying)
  ) {
    return state;
  }

  const normalTiles = state.tiles.filter((t) => !t.isObstacle);
  const target = normalTiles.find((t) => t.id === id);
  if (!target || normalTiles.length <= 1) return state;

  const nextHistory = pushHistory(
    state.history,
    makeSnapshot(state),
    state.maxUndos
  );

  const nextTiles = stripEphemeral(state.tiles).filter((t) => t.id !== id);
  const highestTile = computeHighestTile(nextTiles);
  const canStillMove = canMove(nextTiles, state.gridSize, state.variant);

  return {
    ...state,
    tiles: nextTiles,
    highestTile,
    powerUps: { ...state.powerUps, smash: state.powerUps.smash - 1 },
    history: nextHistory,
    usedAssist: true,
    lost: !canStillMove && (!state.won || state.keepPlaying),
  };
}

function emojiForCell(value: number, variant: GameVariant): string {
  if (value === -1) return "⬛";
  if (value === 0) return "▫️";
  const rank = tileRank(value, variant);
  if (rank >= 10) return "🌟";
  if (rank >= 8) return "🔥";
  if (rank >= 6) return "🩷";
  if (rank >= 4) return "🔮";
  if (rank >= 2) return "💠";
  return "🟪";
}

export function generateShareText(state: GameState, themeName: string): string {
  const N = state.gridSize;
  const mat = boardToMatrix(state.tiles, N);
  const modeLabel = state.dailyDate
    ? `Daily ${state.dailyDate}`
    : `${state.variant.charAt(0).toUpperCase() + state.variant.slice(1)} ${N}×${N}`;

  const rows: string[] = [];
  for (let r = 0; r < N; r++) {
    let line = "";
    for (let c = 0; c < N; c++) {
      line += emojiForCell(mat[r * N + c], state.variant);
    }
    rows.push(line);
  }

  const purity = state.usedAssist ? "Assisted" : "Pure Run ✨";
  return [
    `2048 Studio — ${modeLabel}`,
    `Score: ${state.score.toLocaleString()} | Best Tile: ${state.highestTile} | Moves: ${state.moveCount}`,
    `${purity} · Theme: ${themeName}`,
    "",
    ...rows,
  ].join("\n");
}
