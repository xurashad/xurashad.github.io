import type { FractalSettings, OrbitAnalysis, OrbitPoint } from "./types";

function cPow(zx: number, zy: number, p: number): [number, number] {
  if (p === 2) return [zx * zx - zy * zy, 2 * zx * zy];
  if (p === 3) {
    const x2 = zx * zx, y2 = zy * zy;
    return [zx * (x2 - 3 * y2), zy * (3 * x2 - y2)];
  }
  if (p === 4) {
    const x2 = zx * zx, y2 = zy * zy;
    return [x2 * x2 - 6 * x2 * y2 + y2 * y2, 4 * zx * zy * (x2 - y2)];
  }
  const r2 = zx * zx + zy * zy;
  if (r2 < 1e-30) return [0, 0];
  const r = Math.pow(r2, p * 0.5);
  const theta = Math.atan2(zy, zx) * p;
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

function cDiv(ax: number, ay: number, bx: number, by: number): [number, number] {
  const denom = bx * bx + by * by;
  if (denom < 1e-30) return [0, 0];
  return [(ax * bx + ay * by) / denom, (ay * bx - ax * by) / denom];
}

function stepFormula(
  zx: number,
  zy: number,
  px: number,
  py: number,
  cx: number,
  cy: number,
  settings: FractalSettings,
): { nx: number; ny: number; derivMag: number; rootDelta: number; convergedRoot: number } {
  const { family, power, paramP } = settings;
  const k = Math.max(2, Math.min(8, Math.round(power)));

  switch (family) {
    case "mandelbrot": {
      const [rx, ry] = cPow(zx, zy, power);
      const [dx, dy] = cPow(zx, zy, Math.max(0, power - 1));
      const derivMag = power * Math.hypot(dx, dy);
      return { nx: rx + cx, ny: ry + cy, derivMag, rootDelta: 1, convergedRoot: -1 };
    }
    case "burning-ship": {
      const ax = Math.abs(zx), ay = -Math.abs(zy);
      const [rx, ry] = cPow(ax, ay, power);
      const [dx, dy] = cPow(ax, ay, Math.max(0, power - 1));
      const derivMag = power * Math.hypot(dx, dy);
      return { nx: rx + cx, ny: ry + cy, derivMag, rootDelta: 1, convergedRoot: -1 };
    }
    case "tricorn": {
      const [rx, ry] = cPow(zx, -zy, power);
      const [dx, dy] = cPow(zx, -zy, Math.max(0, power - 1));
      const derivMag = power * Math.hypot(dx, dy);
      return { nx: rx + cx, ny: ry + cy, derivMag, rootDelta: 1, convergedRoot: -1 };
    }
    case "celtic": {
      const [rx, ry] = cPow(zx, zy, power);
      const [dx, dy] = cPow(zx, zy, Math.max(0, power - 1));
      const derivMag = power * Math.hypot(dx, dy);
      return { nx: Math.abs(rx) + cx, ny: ry + cy, derivMag, rootDelta: 1, convergedRoot: -1 };
    }
    case "buffalo": {
      const [rx, ry] = cPow(zx, zy, power);
      const [dx, dy] = cPow(zx, zy, Math.max(0, power - 1));
      const derivMag = power * Math.hypot(dx, dy);
      return { nx: Math.abs(rx) + cx, ny: -Math.abs(ry) + cy, derivMag, rootDelta: 1, convergedRoot: -1 };
    }
    case "phoenix": {
      const [rx, ry] = cPow(zx, zy, power);
      const [dx, dy] = cPow(zx, zy, Math.max(0, power - 1));
      const derivMag = power * Math.hypot(dx, dy);
      return {
        nx: rx + cx + paramP * px,
        ny: ry + cy + paramP * py,
        derivMag,
        rootDelta: 1,
        convergedRoot: -1,
      };
    }
    case "newton":
    case "nova": {
      const [zkm1x, zkm1y] = cPow(zx, zy, k - 1);
      const zkx = zkm1x * zx - zkm1y * zy;
      const zky = zkm1x * zy + zkm1y * zx;
      const [fx, fy] = cDiv(zkx - 1, zky, k * zkm1x, k * zkm1y);
      const addCx = family === "nova" ? cx : 0;
      const addCy = family === "nova" ? cy : 0;
      const nx = zx - paramP * fx + addCx;
      const ny = zy - paramP * fy + addCy;
      const rootDelta = Math.hypot(nx - zx, ny - zy);
      let angle = Math.atan2(ny, nx);
      if (angle < 0) angle += Math.PI * 2;
      const rootIdx = Math.round((angle / (Math.PI * 2)) * k) % k;
      // Numerical derivative approximation for Newton/Nova Lyapunov
      const derivMag = Math.max(1e-6, Math.abs(1 - paramP) + paramP * (k - 1) * rootDelta);
      return { nx, ny, derivMag, rootDelta, convergedRoot: rootIdx };
    }
    case "magnet1": {
      const z2x = zx * zx - zy * zy;
      const z2y = 2 * zx * zy;
      const numX = z2x + cx - 1;
      const numY = z2y + cy;
      const denX = 2 * zx + cx - 2;
      const denY = 2 * zy + cy;
      const [ux, uy] = cDiv(numX, numY, denX, denY);
      const nx = ux * ux - uy * uy;
      const ny = 2 * ux * uy;
      // du/dz = (2z * den - 2 * num) / den^2
      const numDerivX = 2 * (zx * denX - zy * denY) - 2 * numX;
      const numDerivY = 2 * (zx * denY + zy * denX) - 2 * numY;
      const den2x = denX * denX - denY * denY;
      const den2y = 2 * denX * denY;
      const [dux, duy] = cDiv(numDerivX, numDerivY, den2x, den2y);
      const derivMag = 2 * Math.hypot(ux, uy) * Math.hypot(dux, duy);
      return { nx, ny, derivMag, rootDelta: 1, convergedRoot: -1 };
    }
    case "lambda": {
      // c * z * (1 - z)
      const ox = 1 - zx;
      const oy = -zy;
      const zx1 = zx * ox - zy * oy;
      const zy1 = zx * oy + zy * ox;
      const nx = cx * zx1 - cy * zy1;
      const ny = cx * zy1 + cy * zx1;
      const dfx = cx * (1 - 2 * zx) - cy * (-2 * zy);
      const dfy = cx * (-2 * zy) + cy * (1 - 2 * zx);
      const derivMag = Math.hypot(dfx, dfy);
      return { nx, ny, derivMag, rootDelta: 1, convergedRoot: -1 };
    }
  }
}

export function traceOrbit(
  re: number,
  im: number,
  settings: FractalSettings,
  maxSteps = 220,
): OrbitAnalysis {
  const { family, isJulia, juliaCx, juliaCy, bailout } = settings;
  const limit = Math.min(maxSteps, Math.max(32, settings.maxIter));
  const bail2 = Math.max(16, bailout);

  let cx = re, cy = im;
  let zx = 0, zy = 0;

  if (family === "newton") {
    zx = re;
    zy = im;
    cx = 0;
    cy = 0;
  } else if (isJulia) {
    cx = juliaCx;
    cy = juliaCy;
    zx = re;
    zy = im;
  } else if (family === "nova") {
    zx = 1;
    zy = 0;
  } else if (family === "lambda") {
    zx = 0.5;
    zy = 0;
  }

  let px = zx, py = zy;
  const points: OrbitPoint[] = [{ x: zx, y: zy }];
  let escaped = false;
  let converged = false;
  let convergedRoot = -1;
  let escapeIter = limit;
  let lyapunovSum = 0;
  let lyapunovCount = 0;
  let minMag = Math.hypot(zx, zy);
  let maxMag = minMag;

  for (let i = 0; i < limit; i++) {
    const res = stepFormula(zx, zy, px, py, cx, cy, settings);
    px = zx;
    py = zy;
    zx = res.nx;
    zy = res.ny;
    points.push({ x: zx, y: zy });

    const mag = Math.hypot(zx, zy);
    if (mag < minMag) minMag = mag;
    if (mag > maxMag) maxMag = mag;

    if (res.derivMag > 1e-12 && Number.isFinite(res.derivMag)) {
      lyapunovSum += Math.log(res.derivMag);
      lyapunovCount++;
    }

    if (family === "newton" || family === "nova") {
      if (res.rootDelta < 1e-5) {
        converged = true;
        convergedRoot = res.convergedRoot;
        escapeIter = i + 1;
        break;
      }
    } else if (zx * zx + zy * zy > bail2) {
      escaped = true;
      escapeIter = i + 1;
      break;
    }
  }

  let smoothIter = escapeIter;
  if (escaped) {
    const r2 = Math.max(1e-12, zx * zx + zy * zy);
    const p = Math.max(1.5, settings.power);
    smoothIter = escapeIter + 1 - Math.log(Math.log(Math.sqrt(r2))) / Math.log(p);
  }

  let detectedPeriod: number | null = null;
  if (!escaped && !converged && points.length >= 40) {
    const tail = points[points.length - 1];
    for (let p = 1; p <= 24; p++) {
      const idx = points.length - 1 - p;
      if (idx < 0) break;
      const dist = Math.hypot(tail.x - points[idx].x, tail.y - points[idx].y);
      if (dist < 1e-4) {
        detectedPeriod = p;
        break;
      }
    }
  }

  return {
    startRe: re,
    startIm: im,
    points,
    escaped,
    converged,
    convergedRoot,
    escapeIter,
    smoothIter,
    detectedPeriod,
    lyapunov: lyapunovCount > 0 ? lyapunovSum / lyapunovCount : 0,
    minMag,
    maxMag,
  };
}
