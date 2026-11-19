import type { CameraState } from "./types";

export const BASE_SPAN = 3.0;
export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 1e14;

export function clampZoom(z: number): number {
  if (!Number.isFinite(z)) return 1;
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
}

export function complexSpanPerPixel(height: number, zoom: number): number {
  const safeH = Math.max(1, height);
  return BASE_SPAN / (clampZoom(zoom) * safeH);
}

export function screenToComplex(
  px: number,
  py: number,
  width: number,
  height: number,
  camera: CameraState,
): { re: number; im: number } {
  const scale = complexSpanPerPixel(height, camera.zoom);
  const dx = (px - width * 0.5) * scale;
  const dy = (height * 0.5 - py) * scale;
  const cosR = Math.cos(camera.rotation);
  const sinR = Math.sin(camera.rotation);
  return {
    re: camera.centerX + dx * cosR - dy * sinR,
    im: camera.centerY + dx * sinR + dy * cosR,
  };
}

export function complexToScreen(
  re: number,
  im: number,
  width: number,
  height: number,
  camera: CameraState,
): { x: number; y: number } {
  const scale = complexSpanPerPixel(height, camera.zoom);
  const vx = re - camera.centerX;
  const vy = im - camera.centerY;
  const cosR = Math.cos(camera.rotation);
  const sinR = Math.sin(camera.rotation);
  const dx = vx * cosR + vy * sinR;
  const dy = -vx * sinR + vy * cosR;
  return {
    x: width * 0.5 + dx / scale,
    y: height * 0.5 - dy / scale,
  };
}

export function zoomAtPoint(
  camera: CameraState,
  mx: number,
  my: number,
  width: number,
  height: number,
  factor: number,
): CameraState {
  const nextZoom = clampZoom(camera.zoom * factor);
  const actualFactor = nextZoom / camera.zoom;
  if (Math.abs(actualFactor - 1) < 1e-12) return camera;

  const scaleOld = complexSpanPerPixel(height, camera.zoom);
  const scaleNew = complexSpanPerPixel(height, nextZoom);
  const dxPx = mx - width * 0.5;
  const dyPx = height * 0.5 - my;
  const cosR = Math.cos(camera.rotation);
  const sinR = Math.sin(camera.rotation);
  const rotX = dxPx * cosR - dyPx * sinR;
  const rotY = dxPx * sinR + dyPx * cosR;

  return {
    centerX: camera.centerX + rotX * (scaleOld - scaleNew),
    centerY: camera.centerY + rotY * (scaleOld - scaleNew),
    zoom: nextZoom,
    rotation: camera.rotation,
  };
}

export function panCamera(
  camera: CameraState,
  deltaPxX: number,
  deltaPxY: number,
  height: number,
): CameraState {
  const scale = complexSpanPerPixel(height, camera.zoom);
  const dx = -deltaPxX * scale;
  const dy = deltaPxY * scale;
  const cosR = Math.cos(camera.rotation);
  const sinR = Math.sin(camera.rotation);
  return {
    centerX: camera.centerX + dx * cosR - dy * sinR,
    centerY: camera.centerY + dx * sinR + dy * cosR,
    zoom: camera.zoom,
    rotation: camera.rotation,
  };
}

export function fitBoxToCamera(
  camera: CameraState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number,
): CameraState {
  const cx = (x1 + x2) * 0.5;
  const cy = (y1 + y2) * 0.5;
  const boxW = Math.max(8, Math.abs(x2 - x1));
  const boxH = Math.max(8, Math.abs(y2 - y1));
  const factor = Math.min(width / boxW, height / boxH);
  const target = screenToComplex(cx, cy, width, height, camera);
  return {
    centerX: target.re,
    centerY: target.im,
    zoom: clampZoom(camera.zoom * factor),
    rotation: camera.rotation,
  };
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function interpolateCamera(from: CameraState, to: CameraState, rawT: number): CameraState {
  const t = Math.max(0, Math.min(1, rawT));
  const e = easeInOutCubic(t);

  const logZ0 = Math.log(Math.max(MIN_ZOOM, from.zoom));
  const logZ1 = Math.log(Math.max(MIN_ZOOM, to.zoom));
  const zoom = Math.exp(logZ0 + (logZ1 - logZ0) * e);

  // Move faster in center while zoomed out so deep fly-tos stay centered cleanly
  const w0 = 1 / Math.max(1e-6, from.zoom);
  const w1 = 1 / Math.max(1e-6, to.zoom);
  const cw = (1 - e) * w0;
  const tw = e * w1;
  const denom = cw + tw;
  const blend = denom > 0 ? tw / denom : e;

  // Shortest angular path for rotation
  let dRot = ((to.rotation - from.rotation + Math.PI) % (2 * Math.PI)) - Math.PI;
  if (dRot < -Math.PI) dRot += 2 * Math.PI;

  return {
    centerX: from.centerX + (to.centerX - from.centerX) * blend,
    centerY: from.centerY + (to.centerY - from.centerY) * blend,
    zoom: clampZoom(zoom),
    rotation: from.rotation + dRot * e,
  };
}

export function computeAutoIterations(baseIter: number, zoom: number, autoIter: boolean): number {
  if (!autoIter) return Math.max(16, Math.min(8192, Math.round(baseIter)));
  const logZoom = Math.max(0, Math.log10(Math.max(1, zoom)));
  const scaled = Math.round(baseIter + 95 * Math.pow(logZoom, 1.32));
  return Math.max(baseIter, Math.min(4096, scaled));
}

export function formatZoom(zoom: number): string {
  if (zoom < 1000) return `${zoom.toFixed(zoom < 10 ? 2 : 1)}×`;
  const exp = Math.floor(Math.log10(zoom));
  const mant = zoom / Math.pow(10, exp);
  return `${mant.toFixed(2)}×10^${exp}`;
}

export function formatComplex(re: number, im: number, zoom = 1): string {
  const digits = Math.max(4, Math.min(14, Math.ceil(Math.log10(Math.max(1, zoom))) + 4));
  const rStr = Math.abs(re) < 1e-16 ? "0" : re.toFixed(digits).replace(/\.?0+$/, "");
  const absIm = Math.abs(im);
  const iStr = absIm < 1e-16 ? "0" : absIm.toFixed(digits).replace(/\.?0+$/, "");
  const sign = im >= 0 ? "+" : "−";
  return `${rStr} ${sign} ${iStr}i`;
}

export function computeGridStep(span: number): number {
  if (span <= 0 || !Number.isFinite(span)) return 1;
  const target = span / 5.5;
  const pow10 = Math.pow(10, Math.floor(Math.log10(target)));
  const norm = target / pow10;
  if (norm < 1.5) return pow10;
  if (norm < 3.5) return 2 * pow10;
  if (norm < 7.5) return 5 * pow10;
  return 10 * pow10;
}
