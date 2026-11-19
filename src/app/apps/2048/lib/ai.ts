import {
  boardToMatrix,
  canValuesMerge,
  mergedValue,
  tileRank,
} from "./engine";
import type {
  Direction,
  GameState,
  GameVariant,
  GridSize,
  HintRecommendation,
} from "./types";

const DIRECTIONS: readonly Direction[] = ["up", "right", "down", "left"];

interface SimResult {
  nextMat: number[];
  moved: boolean;
  scoreDelta: number;
  mergeCount: number;
  freesCells: number;
}

function indexForLine(
  lineIdx: number,
  stepIdx: number,
  dir: Direction,
  size: GridSize
): number {
  switch (dir) {
    case "left":
      return lineIdx * size + stepIdx;
    case "right":
      return lineIdx * size + (size - 1 - stepIdx);
    case "up":
      return stepIdx * size + lineIdx;
    case "down":
      return (size - 1 - stepIdx) * size + lineIdx;
  }
}

function simulateMoveMatrix(
  mat: number[],
  size: GridSize,
  dir: Direction,
  variant: GameVariant
): SimResult {
  const nextMat = new Array<number>(size * size).fill(0);
  let moved = false;
  let scoreDelta = 0;
  let mergeCount = 0;

  for (let lineIdx = 0; lineIdx < size; lineIdx++) {
    let cursor = 0;
    while (cursor < size) {
      const idx = indexForLine(lineIdx, cursor, dir, size);
      const val = mat[idx];
      if (val === -1) {
        nextMat[idx] = -1;
        cursor++;
        continue;
      }

      const segStart = cursor;
      const segVals: number[] = [];
      const segSrcPositions: number[] = [];
      while (cursor < size) {
        const cIdx = indexForLine(lineIdx, cursor, dir, size);
        const cVal = mat[cIdx];
        if (cVal === -1) break;
        if (cVal > 0) {
          segVals.push(cVal);
          segSrcPositions.push(cursor);
        }
        cursor++;
      }

      let writeOffset = 0;
      let i = 0;
      while (i < segVals.length) {
        const destStep = segStart + writeOffset;
        const destIdx = indexForLine(lineIdx, destStep, dir, size);
        const a = segVals[i];

        if (
          i + 1 < segVals.length &&
          canValuesMerge(a, segVals[i + 1], variant)
        ) {
          const merged = mergedValue(a, segVals[i + 1], variant);
          nextMat[destIdx] = merged;
          scoreDelta += merged;
          mergeCount++;
          moved = true;
          i += 2;
        } else {
          if (segSrcPositions[i] !== destStep) {
            moved = true;
          }
          nextMat[destIdx] = a;
          i += 1;
        }
        writeOffset++;
      }
    }
  }

  return {
    nextMat,
    moved,
    scoreDelta,
    mergeCount,
    freesCells: mergeCount,
  };
}

// Precompute 8 corner-anchored snake weight tables per grid size
const SNAKE_TABLES = new Map<GridSize, number[][]>();

function getSnakeTables(size: GridSize): number[][] {
  const cached = SNAKE_TABLES.get(size);
  if (cached) return cached;

  const tables: number[][] = [];
  const total = size * size;

  // Build base top-left row-snake weights
  const makeBase = (transpose: boolean, flipX: boolean, flipY: boolean) => {
    const weights = new Array<number>(total).fill(0);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const rr = flipY ? size - 1 - r : r;
        const cc = flipX ? size - 1 - c : c;
        const sr = transpose ? cc : rr;
        const sc = transpose ? rr : cc;
        const snakePos =
          sr % 2 === 0 ? sr * size + sc : sr * size + (size - 1 - sc);
        const rankWeight = total - 1 - snakePos;
        weights[r * size + c] = Math.pow(1.42, rankWeight);
      }
    }
    return weights;
  };

  for (const transpose of [false, true]) {
    for (const flipY of [false, true]) {
      for (const flipX of [false, true]) {
        tables.push(makeBase(transpose, flipX, flipY));
      }
    }
  }

  SNAKE_TABLES.set(size, tables);
  return tables;
}

function evaluateMatrix(
  mat: number[],
  size: GridSize,
  variant: GameVariant
): number {
  const tables = getSnakeTables(size);
  const snakeScores = new Array<number>(tables.length).fill(0);
  const ranks = new Array<number>(mat.length);

  let emptyCount = 0;
  let maxRank = 0;
  let maxIdx = 0;
  let smoothness = 0;
  let mergeBonus = 0;

  for (let i = 0; i < mat.length; i++) {
    const v = mat[i];
    if (v === 0) {
      emptyCount++;
      ranks[i] = 0;
      continue;
    }
    if (v < 0) {
      ranks[i] = -1;
      continue;
    }
    const r = tileRank(v, variant) + 1;
    ranks[i] = r;
    if (r > maxRank) {
      maxRank = r;
      maxIdx = i;
    }

    const rPow = r * r * 0.55 + r;
    for (let t = 0; t < tables.length; t++) {
      snakeScores[t] += rPow * tables[t][i];
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      const v = mat[idx];
      if (v <= 0) continue;
      const rk = ranks[idx];

      if (c + 1 < size) {
        const rightVal = mat[idx + 1];
        if (rightVal > 0) {
          smoothness -= Math.abs(rk - ranks[idx + 1]) * 2.2;
          if (canValuesMerge(v, rightVal, variant)) {
            mergeBonus += (Math.min(rk, ranks[idx + 1]) + 2) * 4.5;
          }
        }
      }
      if (r + 1 < size) {
        const downVal = mat[idx + size];
        if (downVal > 0) {
          smoothness -= Math.abs(rk - ranks[idx + size]) * 2.2;
          if (canValuesMerge(v, downVal, variant)) {
            mergeBonus += (Math.min(rk, ranks[idx + size]) + 2) * 4.5;
          }
        }
      }
    }
  }

  let bestSnake = snakeScores[0];
  for (let t = 1; t < snakeScores.length; t++) {
    if (snakeScores[t] > bestSnake) bestSnake = snakeScores[t];
  }

  const corners = [0, size - 1, size * (size - 1), size * size - 1];
  const cornerBonus = corners.includes(maxIdx) ? maxRank * 24 : 0;
  const emptyBonus = emptyCount * 46 + (emptyCount === 0 ? -380 : 0);

  return bestSnake + emptyBonus + smoothness + mergeBonus + cornerBonus;
}

function getEmptyIndices(mat: number[]): number[] {
  const res: number[] = [];
  for (let i = 0; i < mat.length; i++) {
    if (mat[i] === 0) res.push(i);
  }
  return res;
}

function expectimax(
  mat: number[],
  size: GridSize,
  variant: GameVariant,
  depth: number,
  isChanceNode: boolean
): number {
  if (depth <= 0) {
    return evaluateMatrix(mat, size, variant);
  }

  if (!isChanceNode) {
    let best = -Infinity;
    let anyMoved = false;

    for (const dir of DIRECTIONS) {
      const sim = simulateMoveMatrix(mat, size, dir, variant);
      if (!sim.moved) continue;
      anyMoved = true;
      const val =
        sim.mergeCount * 8 +
        expectimax(sim.nextMat, size, variant, depth - 1, true);
      if (val > best) best = val;
    }

    return anyMoved ? best : -1_000_000;
  }

  // Chance node: tile spawn
  const empties = getEmptyIndices(mat);
  if (empties.length === 0) {
    return evaluateMatrix(mat, size, variant);
  }

  // Sample up to maxSamples empty cells so search stays under ~15ms
  const maxSamples = size >= 5 ? 4 : 6;
  let sampled = empties;
  if (empties.length > maxSamples) {
    sampled = [];
    const step = empties.length / maxSamples;
    for (let i = 0; i < maxSamples; i++) {
      sampled.push(empties[Math.floor(i * step)]);
    }
  }

  const primaryVal = variant === "fibonacci" ? 1 : 2;
  const secondaryVal = variant === "fibonacci" ? 2 : 4;
  const primaryProb = variant === "fibonacci" ? 0.8 : 0.9;
  const includeSecondary = depth >= 2 && sampled.length <= 4;

  let expectedSum = 0;
  for (const idx of sampled) {
    mat[idx] = primaryVal;
    const primaryScore = expectimax(mat, size, variant, depth - 1, false);
    if (includeSecondary) {
      mat[idx] = secondaryVal;
      const secondaryScore = expectimax(mat, size, variant, depth - 1, false);
      expectedSum +=
        primaryProb * primaryScore + (1 - primaryProb) * secondaryScore;
    } else {
      expectedSum += primaryScore;
    }
    mat[idx] = 0;
  }

  return expectedSum / sampled.length;
}

function chooseSearchDepth(size: GridSize, emptyCount: number): number {
  if (size === 3) return emptyCount <= 4 ? 4 : 3;
  if (size === 4) {
    if (emptyCount <= 4) return 4;
    if (emptyCount <= 9) return 3;
    return 2;
  }
  if (size === 5) return emptyCount <= 6 ? 3 : 2;
  return emptyCount <= 4 ? 3 : 2;
}

function describeMoveReason(
  sim: SimResult,
  size: GridSize,
  beforeMaxIdx: number,
  afterMaxIdx: number
): string {
  const parts: string[] = [];
  if (sim.mergeCount >= 2) {
    parts.push(`chains ${sim.mergeCount} merges (+${sim.scoreDelta})`);
  } else if (sim.mergeCount === 1) {
    parts.push(`merges for +${sim.scoreDelta}`);
  }
  if (sim.freesCells > 0) {
    parts.push(
      `frees ${sim.freesCells} ${sim.freesCells === 1 ? "cell" : "cells"}`
    );
  }
  const corners = [0, size - 1, size * (size - 1), size * size - 1];
  if (corners.includes(afterMaxIdx)) {
    parts.push(
      corners.includes(beforeMaxIdx)
        ? "keeps max tile anchored in corner"
        : "tucks max tile into corner"
    );
  }
  if (parts.length === 0) {
    parts.push("preserves smooth monotonic alignment");
  }
  return parts.join(" & ").replace(/^./, (c) => c.toUpperCase()) + ".";
}

function findMaxTileIndex(mat: number[]): number {
  let maxV = 0;
  let maxI = 0;
  for (let i = 0; i < mat.length; i++) {
    if (mat[i] > maxV) {
      maxV = mat[i];
      maxI = i;
    }
  }
  return maxI;
}

export function getHintRecommendation(
  state: GameState
): HintRecommendation | null {
  if (state.lost || (state.won && !state.keepPlaying)) return null;

  const mat = boardToMatrix(state.tiles, state.gridSize);
  const emptyCount = getEmptyIndices(mat).length;
  const depth = chooseSearchDepth(state.gridSize, emptyCount);
  const beforeMaxIdx = findMaxTileIndex(mat);

  let bestDir: Direction | null = null;
  let bestScore = -Infinity;
  let bestSim: SimResult | null = null;

  for (const dir of DIRECTIONS) {
    const sim = simulateMoveMatrix(mat, state.gridSize, dir, state.variant);
    if (!sim.moved) continue;
    const score =
      sim.mergeCount * 10 +
      expectimax(sim.nextMat, state.gridSize, state.variant, depth - 1, true);
    if (score > bestScore) {
      bestScore = score;
      bestDir = dir;
      bestSim = sim;
    }
  }

  if (!bestDir || !bestSim) return null;

  const afterMaxIdx = findMaxTileIndex(bestSim.nextMat);

  return {
    direction: bestDir,
    score: Math.round(bestScore),
    expectedMerges: bestSim.mergeCount,
    freesCells: bestSim.freesCells,
    reason: describeMoveReason(
      bestSim,
      state.gridSize,
      beforeMaxIdx,
      afterMaxIdx
    ),
  };
}

export function getBestMove(state: GameState): Direction | null {
  return getHintRecommendation(state)?.direction ?? null;
}
