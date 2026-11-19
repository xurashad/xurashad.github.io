import { computeAutoIterations, complexSpanPerPixel } from "./camera";
import {
  coloringModeToIndex,
  formulaIdToIndex,
  interiorModeToIndex,
  transferScaleToIndex,
} from "./formulas";
import { buildPaletteRGBA, hexToRgb01 } from "./palette";
import type { ExportConfig, FractalSettings } from "./types";

// ── Inline Float64 Web Worker Script (All 10 Families + 8 Coloring Modes) ─────

function buildWorkerScript(): string {
  return `
function cPow(zx, zy, p) {
  if (Math.abs(p - 2) < 1e-9) return [zx * zx - zy * zy, 2 * zx * zy];
  if (Math.abs(p - 3) < 1e-9) {
    const x2 = zx * zx, y2 = zy * zy;
    return [zx * (x2 - 3 * y2), zy * (3 * x2 - y2)];
  }
  if (Math.abs(p - 4) < 1e-9) {
    const x2 = zx * zx, y2 = zy * zy;
    return [x2 * x2 - 6 * x2 * y2 + y2 * y2, 4 * zx * zy * (x2 - y2)];
  }
  const r2 = zx * zx + zy * zy;
  if (r2 < 1e-30) return [0, 0];
  const r = Math.pow(r2, 0.5 * p);
  const a = Math.atan2(zy, zx) * p;
  return [r * Math.cos(a), r * Math.sin(a)];
}

function cDiv(ax, ay, bx, by) {
  const d = Math.max(bx * bx + by * by, 1e-30);
  return [(ax * bx + ay * by) / d, (ay * bx - ax * by) / d];
}

function evalPixel(px, py, p) {
  const dx = (px - 0.5 * p.width) * p.scale;
  const dy = (0.5 * p.height - py) * p.scale;
  const rx = p.centerX + dx * p.cosR - dy * p.sinR;
  const ry = p.centerY + dx * p.sinR + dy * p.cosR;

  let zx = 0, zy = 0, cx = rx, cy = ry;
  let dzx = 0, dzy = 0;
  let zpx = 0, zpy = 0;

  if (p.formula === 6) {
    zx = rx; zy = ry; cx = 0; cy = 0; dzx = 1; dzy = 0;
  } else if (p.isJulia) {
    zx = rx; zy = ry; cx = p.juliaCx; cy = p.juliaCy; dzx = 1; dzy = 0;
  } else if (p.formula === 7) {
    zx = 1; zy = 0;
  } else if (p.formula === 9) {
    zx = 0.5; zy = 0;
  }

  const bail2 = Math.max(16, p.bailout);
  const kDeg = Math.max(2, Math.min(8, Math.round(p.power)));
  const holo = (p.formula === 0 || p.formula === 5 || p.formula === 7 || p.formula === 8 || p.formula === 9);

  let minTrap = 1e9;
  let minOrbit = 1e9;
  let stripeSum = 0;
  let stripePrev = 0;
  let curvSum = 0;
  let prevStepX = 1, prevStepY = 0;
  let escaped = false;
  let converged = false;
  let convRoot = 0;
  let finalIter = p.maxIter;
  let prevDelta2 = 1;
  let lastDelta2 = 1;

  for (let iter = 0; iter < p.maxIter; iter++) {
    let nzx = zx, nzy = zy, ndzx = dzx, ndzy = dzy;

    if (p.formula === 0) {
      const pm1 = cPow(zx, zy, p.power - 1);
      nzx = pm1[0] * zx - pm1[1] * zy + cx;
      nzy = pm1[0] * zy + pm1[1] * zx + cy;
      ndzx = p.power * (pm1[0] * dzx - pm1[1] * dzy) + (p.isJulia ? 0 : 1);
      ndzy = p.power * (pm1[0] * dzy + pm1[1] * dzx);
    } else if (p.formula === 1) {
      const res = cPow(Math.abs(zx), -Math.abs(zy), p.power);
      nzx = res[0] + cx; nzy = res[1] + cy;
    } else if (p.formula === 2) {
      const res = cPow(zx, -zy, p.power);
      nzx = res[0] + cx; nzy = res[1] + cy;
    } else if (p.formula === 3) {
      const res = cPow(zx, zy, p.power);
      nzx = Math.abs(res[0]) + cx; nzy = res[1] + cy;
    } else if (p.formula === 4) {
      const res = cPow(zx, zy, p.power);
      nzx = Math.abs(res[0]) + cx; nzy = -Math.abs(res[1]) + cy;
    } else if (p.formula === 5) {
      const pm1 = cPow(zx, zy, p.power - 1);
      nzx = pm1[0] * zx - pm1[1] * zy + cx + p.paramP * zpx;
      nzy = pm1[0] * zy + pm1[1] * zx + cy + p.paramP * zpy;
      ndzx = p.power * (pm1[0] * dzx - pm1[1] * dzy) + (p.isJulia ? 0 : 1);
      ndzy = p.power * (pm1[0] * dzy + pm1[1] * dzx);
    } else if (p.formula === 6 || p.formula === 7) {
      const zkm1 = cPow(zx, zy, kDeg - 1);
      const zkx = zkm1[0] * zx - zkm1[1] * zy;
      const zky = zkm1[0] * zy + zkm1[1] * zx;
      const ratio = cDiv(zkx - 1, zky, kDeg * zkm1[0], kDeg * zkm1[1]);
      const addX = p.formula === 7 ? cx : 0;
      const addY = p.formula === 7 ? cy : 0;
      nzx = zx - p.paramP * ratio[0] + addX;
      nzy = zy - p.paramP * ratio[1] + addY;
      ndzx = dzx * 0.5 + 1; ndzy = dzy * 0.5;
    } else if (p.formula === 8) {
      const z2x = zx * zx - zy * zy, z2y = 2 * zx * zy;
      const numX = z2x + cx - 1, numY = z2y + cy;
      const denX = 2 * zx + cx - 2, denY = 2 * zy + cy;
      const u = cDiv(numX, numY, denX, denY);
      nzx = u[0] * u[0] - u[1] * u[1];
      nzy = 2 * u[0] * u[1];
      const add = p.isJulia ? 0 : 1;
      const dnumX = 2 * (zx * dzx - zy * dzy) + add;
      const dnumY = 2 * (zx * dzy + zy * dzx);
      const ddenX = 2 * dzx + add, ddenY = 2 * dzy;
      const nTopX = (dnumX * denX - dnumY * denY) - (numX * ddenX - numY * ddenY);
      const nTopY = (dnumX * denY + dnumY * denX) - (numX * ddenY + numY * ddenX);
      const den2X = denX * denX - denY * denY, den2Y = 2 * denX * denY;
      const du = cDiv(nTopX, nTopY, den2X, den2Y);
      ndzx = 2 * (u[0] * du[0] - u[1] * du[1]);
      ndzy = 2 * (u[0] * du[1] + u[1] * du[0]);
    } else {
      const omx = 1 - zx, omy = -zy;
      const z1x = zx * omx - zy * omy;
      const z1y = zx * omy + zy * omx;
      nzx = cx * z1x - cy * z1y;
      nzy = cx * z1y + cy * z1x;
      const d1x = 1 - 2 * zx, d1y = -2 * zy;
      const prodX = d1x * dzx - d1y * dzy;
      const prodY = d1x * dzy + d1y * dzx;
      ndzx = (cx * prodX - cy * prodY) + (p.isJulia ? 0 : z1x);
      ndzy = (cx * prodY + cy * prodX) + (p.isJulia ? 0 : z1y);
    }

    const delX = nzx - zx, delY = nzy - zy;
    zpx = zx; zpy = zy;
    zx = nzx; zy = nzy;
    dzx = ndzx; dzy = ndzy;

    const r2 = zx * zx + zy * zy;
    const mag = Math.sqrt(Math.max(r2, 1e-30));
    if (mag < minOrbit) minOrbit = mag;

    if (p.coloring === 2 || p.interior === 2) {
      const tx = Math.abs(zx - p.trapX), ty = Math.abs(zy - p.trapY);
      const m = tx < ty ? tx : ty;
      if (m < minTrap) minTrap = m;
    } else if (p.coloring === 3) {
      const dR = Math.abs(Math.hypot(zx - p.trapX, zy - p.trapY) - p.trapR);
      if (dR < minTrap) minTrap = dR;
    } else if (p.coloring === 4) {
      const dP = Math.hypot(zx - p.trapX, zy - p.trapY);
      if (dP < minTrap) minTrap = dP;
    }

    if (p.coloring === 5) {
      stripePrev = stripeSum;
      stripeSum += 0.5 + 0.5 * Math.sin(p.stripeDensity * Math.atan2(zy, zx));
    }

    if (p.coloring === 7) {
      const sl = Math.hypot(delX, delY), pl = Math.hypot(prevStepX, prevStepY);
      if (sl > 1e-9 && pl > 1e-9) {
        const cosA = Math.max(-1, Math.min(1, (delX * prevStepX + delY * prevStepY) / (sl * pl)));
        curvSum += Math.acos(cosA);
      }
      prevStepX = delX; prevStepY = delY;
    }

    if (p.formula === 6 || p.formula === 7) {
      const d2 = delX * delX + delY * delY;
      if (d2 < 1e-10) {
        converged = true;
        lastDelta2 = d2;
        finalIter = iter + 1;
        let ang = Math.atan2(zy, zx);
        if (ang < 0) ang += 6.283185307179586;
        convRoot = Math.floor((ang / 6.283185307179586) * kDeg + 0.5) % kDeg;
        break;
      }
      prevDelta2 = d2;
    } else if (r2 > bail2) {
      escaped = true;
      finalIter = iter + 1;
      break;
    }
  }

  if (converged) {
    const ld = Math.max(Math.sqrt(lastDelta2), 1e-14);
    const pd = Math.max(Math.sqrt(prevDelta2), 1e-5);
    const frac = Math.max(0, Math.min(1, Math.log(pd / 1e-5) / Math.max(Math.log(pd / ld), 1e-6)));
    return [finalIter - 1 + frac, 100 + convRoot, 0, 0];
  }

  if (!escaped) {
    let iv = 0;
    if (p.interior === 1) iv = Math.hypot(zx, zy);
    else if (p.interior === 2) iv = minTrap;
    else if (p.interior === 3) iv = minOrbit;
    return [iv, -2, 0, 0];
  }

  const pSafe = Math.max(1.5, (p.formula === 8 || p.formula === 9) ? 2 : p.power);
  const r2 = Math.max(zx * zx + zy * zy, 1e-20);
  const logZn = 0.5 * Math.log(r2);
  const nu = Math.log(Math.max(logZn / Math.LN2, 1e-8)) / Math.log(pSafe);
  const smoothIter = Math.max(0, finalIter + 1 - nu);
  const frac = Math.max(0, Math.min(1, 1 - nu));

  let nx = 0, ny = 0;
  if (holo) {
    const u = cDiv(zx, zy, dzx, dzy);
    const ul = Math.hypot(u[0], u[1]);
    if (ul > 1e-9) { nx = u[0] / ul; ny = u[1] / ul; }
  }

  let primary = smoothIter;
  if (p.coloring === 1) {
    const r = Math.sqrt(r2);
    const dzm = Math.max(Math.hypot(dzx, dzy), 1e-20);
    const dist = holo ? (r * Math.log(r) / dzm) : (smoothIter * p.scale);
    primary = Math.log(1 + Math.max(dist / Math.max(p.scale, 1e-20), 1e-6)) * 8;
  } else if (p.coloring === 2 || p.coloring === 3 || p.coloring === 4) {
    primary = minTrap * 18;
  } else if (p.coloring === 5) {
    const n = Math.max(1, finalIter);
    const avgCur = stripeSum / n;
    const avgPrev = finalIter > 1 ? stripePrev / (finalIter - 1) : avgCur;
    primary = (avgPrev + (avgCur - avgPrev) * frac) * 24 + smoothIter * 0.25;
  } else if (p.coloring === 6) {
    primary = Math.floor(smoothIter) + (zy >= 0 ? 0.85 : 0.15);
  } else if (p.coloring === 7) {
    primary = (curvSum / Math.max(1, finalIter)) * 14 + smoothIter * 0.2;
  }

  return [primary, 0, nx, ny];
}

const RGSS_2 = [[-0.375, -0.125], [0.125, -0.375], [0.375, 0.125], [-0.125, 0.375]];

self.onmessage = function(e) {
  const { jobId, passStep, yStart, yEnd, params } = e.data;
  const w = params.width;
  const rowsOut = Math.ceil((yEnd - yStart) / passStep);
  const colsOut = Math.ceil(w / passStep);
  const data = new Float32Array(rowsOut * colsOut * 4);
  const useAA = passStep === 1 && params.aa > 1;
  const aaCount = params.aa === 4 ? 16 : 4;

  let idx = 0;
  for (let y = yStart; y < yEnd; y += passStep) {
    for (let x = 0; x < w; x += passStep) {
      if (!useAA) {
        const res = evalPixel(x + 0.5, y + 0.5, params);
        data[idx] = res[0];
        data[idx + 1] = res[1];
        data[idx + 2] = res[2];
        data[idx + 3] = res[3];
      } else {
        let pSum = 0, nxSum = 0, nySum = 0, flagVote = 0, insideVotes = 0;
        for (let s = 0; s < aaCount; s++) {
          let ox, oy;
          if (params.aa === 2) {
            ox = RGSS_2[s][0]; oy = RGSS_2[s][1];
          } else {
            ox = ((s % 4) + 0.5) * 0.25 - 0.5;
            oy = (Math.floor(s / 4) + 0.5) * 0.25 - 0.5;
          }
          const res = evalPixel(x + 0.5 + ox, y + 0.5 + oy, params);
          pSum += res[0];
          if (res[1] === -2) insideVotes++;
          else flagVote = res[1];
          nxSum += res[2];
          nySum += res[3];
        }
        data[idx] = pSum / aaCount;
        data[idx + 1] = insideVotes > aaCount * 0.5 ? -2 : flagVote;
        data[idx + 2] = nxSum / aaCount;
        data[idx + 3] = nySum / aaCount;
      }
      idx += 4;
    }
  }

  self.postMessage({ jobId, passStep, yStart, yEnd, colsOut, rowsOut, data }, [data.buffer]);
};
`;
}

// ── Shared Shading Helper (CPU Raw Field -> RGBA ImageData) ──────────────────

function applyTransferCpu(val: number, transferIdx: number): number {
  const v = val < 0 ? 0 : val;
  if (transferIdx === 1) return Math.log(1 + v);
  if (transferIdx === 2) return Math.sqrt(v);
  return v;
}

function sampleLut(lut: Uint8Array, t: number): [number, number, number] {
  const f = ((t % 1) + 1) % 1;
  const pos = f * 1024;
  const i0 = Math.floor(pos) & 1023;
  const i1 = (i0 + 1) & 1023;
  const frac = pos - Math.floor(pos);
  const p0 = i0 * 4;
  const p1 = i1 * 4;
  return [
    lut[p0] + (lut[p1] - lut[p0]) * frac,
    lut[p0 + 1] + (lut[p1 + 1] - lut[p0 + 1]) * frac,
    lut[p0 + 2] + (lut[p1 + 2] - lut[p0 + 2]) * frac,
  ];
}

export function shadeFieldToImageData(
  field: Float32Array,
  w: number,
  h: number,
  settings: FractalSettings,
  outBuffer?: ImageData,
): ImageData {
  const img = outBuffer && outBuffer.width === w && outBuffer.height === h
    ? outBuffer
    : new ImageData(w, h);
  const data = img.data;
  const lut = buildPaletteRGBA(settings.palette, 1024);
  const intRgb = hexToRgb01(settings.interiorColor);
  const ir = Math.round(intRgb[0] * 255);
  const ig = Math.round(intRgb[1] * 255);
  const ib = Math.round(intRgb[2] * 255);

  const tIdx = transferScaleToIndex(settings.transfer);
  const cIdx = coloringModeToIndex(settings.coloring);
  const iIdx = interiorModeToIndex(settings.interior);
  const kDeg = Math.max(2, Math.round(settings.power));
  const holo =
    settings.family === "mandelbrot" ||
    settings.family === "phoenix" ||
    settings.family === "nova" ||
    settings.family === "magnet1" ||
    settings.family === "lambda";

  const az = (settings.lighting.azimuth * Math.PI) / 180;
  const el = (settings.lighting.elevation * Math.PI) / 180;
  const lx = Math.cos(el) * Math.cos(az);
  const ly = Math.cos(el) * Math.sin(az);
  const lz = Math.sin(el);
  const hx = lx, hy = ly, hz = lz + 1;
  const hLen = Math.hypot(hx, hy, hz) || 1;
  const Hx = hx / hLen, Hy = hy / hLen, Hz = hz / hLen;

  const lightOn = settings.lighting.enabled;
  const strength = settings.lighting.strength;
  const specular = settings.lighting.specular;
  const pScale = settings.paletteScale;
  const pOff = settings.paletteOffset;

  for (let y = 0; y < h; y++) {
    const rowOff = y * w;
    for (let x = 0; x < w; x++) {
      const idx = (rowOff + x) * 4;
      const primary = field[idx];
      const flag = field[idx + 1];
      const ax = field[idx + 2];
      const ay = field[idx + 3];

      let r = 0, g = 0, b = 0;
      if (flag === -2) {
        if (iIdx === 0) {
          r = ir; g = ig; b = ib;
        } else {
          const t = applyTransferCpu(primary, tIdx) * pScale * 2.2 + pOff;
          const [sr, sg, sb] = sampleLut(lut, t);
          r = ir * 0.12 + sr * 0.88;
          g = ig * 0.12 + sg * 0.88;
          b = ib * 0.12 + sb * 0.88;
        }
      } else {
        if (flag >= 100) {
          const rootShift = (flag - 100) / kDeg;
          const t = applyTransferCpu(primary, tIdx) * pScale * 1.4 + rootShift + pOff;
          [r, g, b] = sampleLut(lut, t);
        } else if (cIdx === 6) {
          const sIter = Math.floor(primary);
          const sec = primary - sIter;
          const t = applyTransferCpu(sIter, tIdx) * pScale + pOff;
          [r, g, b] = sampleLut(lut, t);
          const em = 0.65 + 0.35 * sec;
          r *= em; g *= em; b *= em;
        } else {
          const t = applyTransferCpu(primary, tIdx) * pScale + pOff;
          [r, g, b] = sampleLut(lut, t);
        }

        if (lightOn) {
          const xl = x > 0 ? x - 1 : x;
          const xr = x + 1 < w ? x + 1 : x;
          const yu = y > 0 ? y - 1 : y;
          const yd = y + 1 < h ? y + 1 : y;
          const hL = field[(rowOff + xl) * 4 + 1] === -2 ? 0 : applyTransferCpu(field[(rowOff + xl) * 4], tIdx);
          const hR = field[(rowOff + xr) * 4 + 1] === -2 ? 0 : applyTransferCpu(field[(rowOff + xr) * 4], tIdx);
          const hU = field[(yu * w + x) * 4 + 1] === -2 ? 0 : applyTransferCpu(field[(yu * w + x) * 4], tIdx);
          const hD = field[(yd * w + x) * 4 + 1] === -2 ? 0 : applyTransferCpu(field[(yd * w + x) * 4], tIdx);

          let gx = (hR - hL) * 0.5;
          let gy = (hU - hD) * 0.5;
          const gLen = Math.hypot(gx, gy);
          if (gLen > 4) {
            gx *= 4 / gLen;
            gy *= 4 / gLen;
          }
          let n2x = -gx * 1.35;
          let n2y = -gy * 1.35;
          if (holo && (cIdx === 0 || cIdx === 1)) {
            const aLen = Math.hypot(ax, ay);
            if (aLen > 1e-6) {
              n2x = n2x * 0.45 + (ax / aLen) * 0.9 * 0.55;
              n2y = n2y * 0.45 + (ay / aLen) * 0.9 * 0.55;
            }
          }
          const nLen = Math.hypot(n2x, n2y, 1) || 1;
          const Nx = n2x / nLen, Ny = n2y / nLen, Nz = 1 / nLen;
          const diff = Math.max(0, Nx * lx + Ny * ly + Nz * lz);
          const spec = Math.pow(Math.max(0, Nx * Hx + Ny * Hy + Nz * Hz), 36) * specular * strength * 255;
          const lit = (1 - 0.65 * strength) + 1.05 * strength * diff;
          r = Math.min(255, Math.max(0, r * lit + spec));
          g = Math.min(255, Math.max(0, g * lit + spec));
          b = Math.min(255, Math.max(0, b * lit + spec));
        }
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  return img;
}

// ── Persistent Multi-Core Worker Pool Engine ──────────────────────────────────

function geometryCacheKey(s: FractalSettings, w: number, h: number): string {
  return [
    s.family,
    s.isJulia ? 1 : 0,
    s.juliaCx,
    s.juliaCy,
    s.power,
    s.paramP,
    s.camera.centerX,
    s.camera.centerY,
    s.camera.zoom,
    s.camera.rotation,
    s.maxIter,
    s.autoIter ? 1 : 0,
    s.bailout,
    s.coloring,
    s.interior,
    s.stripeDensity,
    s.trap.x,
    s.trap.y,
    s.trap.radius,
    s.aa,
    w,
    h,
  ].join("|");
}

interface WorkerCallbacks {
  onProgress: (p: number) => void;
  onComplete: (effectiveIter: number, durationMs: number) => void;
  onStatus: (s: string) => void;
}

interface QueuedTile {
  jobId: number;
  passStep: number;
  yStart: number;
  yEnd: number;
  params: Record<string, number>;
}

export class CPUFloat64Engine {
  private workers: Worker[] = [];
  private blobUrl: string | null = null;
  private jobId = 0;
  private queue: QueuedTile[] = [];
  private activeWorkers = new Set<Worker>();
  private completedField: Float32Array | null = null;
  private completedKey = "";
  private completedSize = { w: 0, h: 0 };
  private workingField: Float32Array | null = null;
  private imageData: ImageData | null = null;
  private paintDirty = false;
  private rafId = 0;
  private targetCanvas: HTMLCanvasElement | null = null;

  private ensurePool(): Worker[] {
    if (this.workers.length > 0) return this.workers;
    const count = Math.min(typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4, 8);
    this.blobUrl = URL.createObjectURL(new Blob([buildWorkerScript()], { type: "application/javascript" }));
    for (let i = 0; i < count; i++) {
      this.workers.push(new Worker(this.blobUrl));
    }
    return this.workers;
  }

  public cancel(): void {
    this.jobId++;
    this.queue = [];
    this.paintDirty = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  public render(
    canvas: HTMLCanvasElement,
    settings: FractalSettings,
    w: number,
    h: number,
    callbacks: WorkerCallbacks,
  ): void {
    if (w < 2 || h < 2) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    this.targetCanvas = canvas;

    const geoKey = geometryCacheKey(settings, w, h);
    const effectiveIter = computeAutoIterations(settings.maxIter, settings.camera.zoom, settings.autoIter);

    // Fast main-thread recolor if geometry did not change!
    if (
      this.completedField &&
      this.completedKey === geoKey &&
      this.completedSize.w === w &&
      this.completedSize.h === h
    ) {
      const t0 = performance.now();
      this.imageData = shadeFieldToImageData(this.completedField, w, h, settings, this.imageData ?? undefined);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.putImageData(this.imageData, 0, 0);
      callbacks.onProgress(1);
      callbacks.onComplete(effectiveIter, performance.now() - t0);
      return;
    }

    this.cancel();
    const myJobId = ++this.jobId;
    const tStart = performance.now();

    if (!this.workingField || this.workingField.length !== w * h * 4) {
      this.workingField = new Float32Array(w * h * 4);
    }

    const scale = complexSpanPerPixel(h, settings.camera.zoom);
    const params = {
      width: w,
      height: h,
      scale,
      centerX: settings.camera.centerX,
      centerY: settings.camera.centerY,
      cosR: Math.cos(settings.camera.rotation),
      sinR: Math.sin(settings.camera.rotation),
      formula: formulaIdToIndex(settings.family),
      isJulia: settings.isJulia ? 1 : 0,
      juliaCx: settings.juliaCx,
      juliaCy: settings.juliaCy,
      power: settings.power,
      paramP: settings.paramP,
      maxIter: effectiveIter,
      bailout: Math.max(16, settings.bailout),
      coloring: coloringModeToIndex(settings.coloring),
      interior: interiorModeToIndex(settings.interior),
      stripeDensity: settings.stripeDensity,
      trapX: settings.trap.x,
      trapY: settings.trap.y,
      trapR: settings.trap.radius,
      aa: settings.aa,
    };

    const tiles: QueuedTile[] = [];
    // Progressive 4x4 -> 1x1 strip scheduling
    const coarseRowBand = 64;
    for (let y = 0; y < h; y += coarseRowBand) {
      tiles.push({
        jobId: myJobId,
        passStep: 4,
        yStart: y,
        yEnd: Math.min(h, y + coarseRowBand),
        params,
      });
    }
    const fineBand = 24;
    for (let y = 0; y < h; y += fineBand) {
      tiles.push({
        jobId: myJobId,
        passStep: 1,
        yStart: y,
        yEnd: Math.min(h, y + fineBand),
        params,
      });
    }
    this.queue = tiles;
    const totalFineRows = h;
    let fineRowsDone = 0;

    const latestSettings = settings;
    const schedulePaint = () => {
      if (this.rafId || myJobId !== this.jobId) return;
      this.rafId = requestAnimationFrame(() => {
        this.rafId = 0;
        if (!this.paintDirty || !this.workingField || !this.targetCanvas || myJobId !== this.jobId) return;
        this.paintDirty = false;
        this.imageData = shadeFieldToImageData(
          this.workingField,
          w,
          h,
          latestSettings,
          this.imageData ?? undefined,
        );
        const ctx = this.targetCanvas.getContext("2d");
        if (ctx) ctx.putImageData(this.imageData, 0, 0);
      });
    };

    const workers = this.ensurePool();
    const dispatchNext = (wk: Worker) => {
      const next = this.queue.shift();
      if (!next || next.jobId !== this.jobId) {
        this.activeWorkers.delete(wk);
        return;
      }
      this.activeWorkers.add(wk);
      wk.postMessage(next);
    };

    workers.forEach(wk => {
      wk.onmessage = (e: MessageEvent) => {
        const msg = e.data;
        if (msg.jobId !== this.jobId || !this.workingField) return;
        const { passStep, yStart, yEnd, colsOut, rowsOut, data } = msg as {
          passStep: number;
          yStart: number;
          yEnd: number;
          colsOut: number;
          rowsOut: number;
          data: Float32Array;
        };

        if (passStep === 1) {
          for (let ry = 0; ry < rowsOut; ry++) {
            const destY = yStart + ry;
            const srcStart = ry * colsOut * 4;
            const destStart = destY * w * 4;
            this.workingField.set(data.subarray(srcStart, srcStart + w * 4), destStart);
          }
          fineRowsDone += yEnd - yStart;
          callbacks.onProgress(Math.min(0.99, fineRowsDone / totalFineRows));
        } else {
          // Fill coarse block
          for (let ry = 0; ry < rowsOut; ry++) {
            const by = yStart + ry * passStep;
            for (let rx = 0; rx < colsOut; rx++) {
              const bx = rx * passStep;
              const si = (ry * colsOut + rx) * 4;
              const v0 = data[si], v1 = data[si + 1], v2 = data[si + 2], v3 = data[si + 3];
              const yMax = Math.min(h, by + passStep);
              const xMax = Math.min(w, bx + passStep);
              for (let yy = by; yy < yMax; yy++) {
                for (let xx = bx; xx < xMax; xx++) {
                  const di = (yy * w + xx) * 4;
                  this.workingField[di] = v0;
                  this.workingField[di + 1] = v1;
                  this.workingField[di + 2] = v2;
                  this.workingField[di + 3] = v3;
                }
              }
            }
          }
        }

        this.paintDirty = true;
        schedulePaint();

        if (this.queue.length > 0) {
          dispatchNext(wk);
        } else {
          this.activeWorkers.delete(wk);
          if (fineRowsDone >= totalFineRows) {
            this.completedField = new Float32Array(this.workingField);
            this.completedKey = geoKey;
            this.completedSize = { w, h };
            this.paintDirty = false;
            this.imageData = shadeFieldToImageData(
              this.completedField,
              w,
              h,
              latestSettings,
              this.imageData ?? undefined,
            );
            const ctx = this.targetCanvas?.getContext("2d");
            if (ctx) ctx.putImageData(this.imageData, 0, 0);
            callbacks.onProgress(1);
            callbacks.onComplete(effectiveIter, performance.now() - tStart);
            callbacks.onStatus(`CPU Float64 complete — ${w}×${h} @ ${effectiveIter} iter`);
          }
        }
      };
      dispatchNext(wk);
    });
  }

  public dispose(): void {
    this.cancel();
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    this.completedField = null;
    this.workingField = null;
    this.imageData = null;
  }
}

// ── Dedicated Offline High-Resolution Exporter (up to 4K + Watermark) ─────────

export async function renderOfflineExport(
  settings: FractalSettings,
  config: ExportConfig,
  onProgress: (p: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const w = Math.max(128, Math.min(7680, Math.round(config.width)));
  const h = Math.max(128, Math.min(4320, Math.round(config.height)));
  const effectiveIter = computeAutoIterations(settings.maxIter, settings.camera.zoom, settings.autoIter);
  const scale = complexSpanPerPixel(h, settings.camera.zoom);

  const params = {
    width: w,
    height: h,
    scale,
    centerX: settings.camera.centerX,
    centerY: settings.camera.centerY,
    cosR: Math.cos(settings.camera.rotation),
    sinR: Math.sin(settings.camera.rotation),
    formula: formulaIdToIndex(settings.family),
    isJulia: settings.isJulia ? 1 : 0,
    juliaCx: settings.juliaCx,
    juliaCy: settings.juliaCy,
    power: settings.power,
    paramP: settings.paramP,
    maxIter: effectiveIter,
    bailout: Math.max(16, settings.bailout),
    coloring: coloringModeToIndex(settings.coloring),
    interior: interiorModeToIndex(settings.interior),
    stripeDensity: settings.stripeDensity,
    trapX: settings.trap.x,
    trapY: settings.trap.y,
    trapR: settings.trap.radius,
    aa: config.aa,
  };

  const field = new Float32Array(w * h * 4);
  const band = 24;
  const tiles: { jobId: number; passStep: number; yStart: number; yEnd: number; params: typeof params }[] = [];
  for (let y = 0; y < h; y += band) {
    tiles.push({ jobId: 1, passStep: 1, yStart: y, yEnd: Math.min(h, y + band), params });
  }

  const blobUrl = URL.createObjectURL(new Blob([buildWorkerScript()], { type: "application/javascript" }));
  const numWorkers = Math.min(navigator.hardwareConcurrency || 4, 8);
  const workers = Array.from({ length: numWorkers }, () => new Worker(blobUrl));

  let rowsDone = 0;

  try {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        workers.forEach(wk => wk.terminate());
        URL.revokeObjectURL(blobUrl);
      };

      if (signal?.aborted) {
        cleanup();
        reject(new DOMException("Export cancelled", "AbortError"));
        return;
      }

      const onAbort = () => {
        cleanup();
        reject(new DOMException("Export cancelled", "AbortError"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });

      const dispatch = (wk: Worker) => {
        const next = tiles.shift();
        if (!next) return;
        wk.postMessage(next);
      };

      workers.forEach(wk => {
        wk.onmessage = (e: MessageEvent) => {
          const { yStart, yEnd, colsOut, rowsOut, data } = e.data;
          for (let ry = 0; ry < rowsOut; ry++) {
            const destY = yStart + ry;
            const srcStart = ry * colsOut * 4;
            field.set(data.subarray(srcStart, srcStart + w * 4), destY * w * 4);
          }
          rowsDone += yEnd - yStart;
          onProgress(Math.min(0.96, rowsDone / h));

          if (tiles.length > 0) {
            dispatch(wk);
          } else if (rowsDone >= h) {
            signal?.removeEventListener("abort", onAbort);
            cleanup();
            resolve();
          }
        };
        wk.onerror = err => {
          signal?.removeEventListener("abort", onAbort);
          cleanup();
          reject(err);
        };
        dispatch(wk);
      });
    });
  } catch (err) {
    workers.forEach(wk => wk.terminate());
    URL.revokeObjectURL(blobUrl);
    throw err;
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const imgData = shadeFieldToImageData(field, w, h, settings);
  ctx.putImageData(imgData, 0, 0);

  if (config.watermark) {
    const pad = Math.max(18, Math.round(w * 0.015));
    const fontSize = Math.max(12, Math.round(h * 0.016));
    ctx.save();
    ctx.font = `500 ${fontSize}px "JetBrains Mono", monospace`;
    const label = `${settings.family.toUpperCase()}${settings.isJulia ? ` · JULIA (${settings.juliaCx.toFixed(4)}, ${settings.juliaCy.toFixed(4)})` : ""} · (${settings.camera.centerX.toPrecision(8)}, ${settings.camera.centerY.toPrecision(8)}) · ${settings.camera.zoom.toExponential(2)}×`;
    const metrics = ctx.measureText(label);
    const boxW = metrics.width + pad * 1.3;
    const boxH = fontSize * 1.9;
    ctx.fillStyle = "rgba(5, 5, 16, 0.72)";
    ctx.strokeStyle = "rgba(0, 195, 245, 0.32)";
    ctx.lineWidth = 1;
    const rx = w - boxW - pad;
    const ry = h - boxH - pad;
    ctx.beginPath();
    ctx.roundRect(rx, ry, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e2e8f0";
    ctx.textBaseline = "middle";
    ctx.fillText(label, rx + pad * 0.65, ry + boxH * 0.5);
    ctx.restore();
  }

  onProgress(1);
  const mime =
    config.format === "webp" ? "image/webp" : config.format === "jpeg" ? "image/jpeg" : "image/png";

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      mime,
      config.quality,
    );
  });
}
