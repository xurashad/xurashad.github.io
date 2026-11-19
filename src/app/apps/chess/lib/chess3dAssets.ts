import * as THREE from "three";
import type { ChessTheme } from "./themes";

/**
 * Deterministic PRNG (mulberry32) so procedural textures and starfields
 * are 100% pure and repeatable across renders.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Procedural Surface Textures & Coordinate Rails ───────────────────────────

export interface ThemeTextureBundle {
  lightMap: THREE.CanvasTexture;
  lightRoughness: THREE.CanvasTexture;
  darkMap: THREE.CanvasTexture;
  darkRoughness: THREE.CanvasTexture;
  filesWhite: THREE.CanvasTexture;
  filesBlack: THREE.CanvasTexture;
  ranksWhite: THREE.CanvasTexture;
  ranksBlack: THREE.CanvasTexture;
}

const themeTextureCache = new Map<string, ThemeTextureBundle>();
let sharedBokehTexture: THREE.CanvasTexture | null = null;

export function getBokehTexture(): THREE.CanvasTexture {
  if (sharedBokehTexture) return sharedBokehTexture;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 255, 255, 1)");
  grad.addColorStop(0.28, "rgba(255, 255, 255, 0.8)");
  grad.addColorStop(0.6, "rgba(255, 255, 255, 0.22)");
  grad.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  sharedBokehTexture = tex;
  return tex;
}

function createTileTextures(
  baseHex: string,
  veinHex: string,
  secondaryHex: string,
  style: ChessTheme["scene3d"]["textureStyle"],
  seed: number
): { map: THREE.CanvasTexture; roughness: THREE.CanvasTexture } {
  const size = 256;
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext("2d")!;

  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext("2d")!;

  const rand = mulberry32(seed);

  // Base fill
  cCtx.fillStyle = baseHex;
  cCtx.fillRect(0, 0, size, size);

  // Neutral smooth-polished base roughness (multiplies material.roughness)
  rCtx.fillStyle = "rgb(205, 205, 205)";
  rCtx.fillRect(0, 0, size, size);

  if (style === "wood") {
    // Rich satin wood grain fibers
    cCtx.lineCap = "round";
    for (let i = 0; i < 64; i++) {
      const yBase = (i / 64) * size;
      const amp = 4 + rand() * 8;
      const freq = 0.015 + rand() * 0.025;
      const phase = rand() * Math.PI * 2;
      cCtx.strokeStyle = i % 3 === 0 ? secondaryHex : veinHex;
      cCtx.globalAlpha = 0.08 + rand() * 0.14;
      cCtx.lineWidth = 1 + rand() * 2.5;
      cCtx.beginPath();
      for (let x = 0; x <= size; x += 8) {
        const y = yBase + Math.sin(x * freq + phase) * amp;
        if (x === 0) cCtx.moveTo(x, y);
        else cCtx.lineTo(x, y);
      }
      cCtx.stroke();

      rCtx.strokeStyle = i % 2 === 0 ? "rgb(180,180,180)" : "rgb(235,235,235)";
      rCtx.globalAlpha = 0.25;
      rCtx.lineWidth = 1.5;
      rCtx.beginPath();
      for (let x = 0; x <= size; x += 8) {
        const y = yBase + Math.sin(x * freq + phase) * amp;
        if (x === 0) rCtx.moveTo(x, y);
        else rCtx.lineTo(x, y);
      }
      rCtx.stroke();
    }
  } else if (style === "crystal") {
    // Geometric crystalline facets + subtle icy veins
    for (let i = 0; i < 24; i++) {
      const cx = rand() * size;
      const cy = rand() * size;
      const r = 24 + rand() * 56;
      const angle = rand() * Math.PI * 2;

      const grad = cCtx.createLinearGradient(
        cx - Math.cos(angle) * r,
        cy - Math.sin(angle) * r,
        cx + Math.cos(angle) * r,
        cy + Math.sin(angle) * r
      );
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.5, i % 2 === 0 ? veinHex : secondaryHex);
      grad.addColorStop(1, "transparent");
      cCtx.fillStyle = grad;
      cCtx.globalAlpha = 0.14 + rand() * 0.16;

      cCtx.beginPath();
      cCtx.moveTo(cx, cy - r * 0.6);
      cCtx.lineTo(cx + r * 0.7, cy + r * 0.2);
      cCtx.lineTo(cx - r * 0.5, cy + r * 0.6);
      cCtx.closePath();
      cCtx.fill();

      rCtx.fillStyle = i % 2 === 0 ? "rgb(150,150,150)" : "rgb(230,230,230)";
      rCtx.globalAlpha = 0.18;
      rCtx.fill();
    }
    // Crisp specular crystal striations
    cCtx.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      cCtx.strokeStyle = secondaryHex;
      cCtx.globalAlpha = 0.15 + rand() * 0.15;
      const x1 = rand() * size;
      const y1 = rand() * size;
      cCtx.beginPath();
      cCtx.moveTo(x1, y1);
      cCtx.lineTo(x1 + (rand() - 0.5) * 140, y1 + (rand() - 0.5) * 140);
      cCtx.stroke();
    }
  } else {
    // Marble or Nebula: organic mineral veins + soft cloudy depth
    for (let i = 0; i < 12; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const rad = 40 + rand() * 85;
      const grad = cCtx.createRadialGradient(x, y, 2, x, y, rad);
      grad.addColorStop(0, i % 2 === 0 ? veinHex : secondaryHex);
      grad.addColorStop(1, "transparent");
      cCtx.fillStyle = grad;
      cCtx.globalAlpha = style === "nebula" ? 0.22 : 0.15;
      cCtx.fillRect(0, 0, size, size);
    }

    // Flowing organic marble/nebula veins
    const veinCount = style === "marble" ? 18 : 14;
    for (let v = 0; v < veinCount; v++) {
      let px = rand() * size;
      let py = rand() * size;
      let angle = rand() * Math.PI * 2;
      cCtx.strokeStyle = v % 3 === 0 ? secondaryHex : veinHex;
      cCtx.globalAlpha = 0.16 + rand() * 0.24;
      cCtx.lineWidth = 0.7 + rand() * 2.2;
      cCtx.beginPath();
      cCtx.moveTo(px, py);

      rCtx.strokeStyle = "rgb(155, 155, 155)";
      rCtx.globalAlpha = 0.28;
      rCtx.lineWidth = cCtx.lineWidth + 1;
      rCtx.beginPath();
      rCtx.moveTo(px, py);

      const steps = 16;
      for (let s = 0; s < steps; s++) {
        angle += (rand() - 0.5) * 1.1;
        const stepLen = 10 + rand() * 14;
        px += Math.cos(angle) * stepLen;
        py += Math.sin(angle) * stepLen;
        cCtx.lineTo(px, py);
        rCtx.lineTo(px, py);
      }
      cCtx.stroke();
      rCtx.stroke();
    }

    // Subtle cosmic dust flecks for Nebula
    if (style === "nebula") {
      for (let s = 0; s < 38; s++) {
        cCtx.fillStyle = secondaryHex;
        cCtx.globalAlpha = 0.15 + rand() * 0.45;
        const sx = rand() * size;
        const sy = rand() * size;
        const sr = 0.6 + rand() * 1.1;
        cCtx.beginPath();
        cCtx.arc(sx, sy, sr, 0, Math.PI * 2);
        cCtx.fill();
      }
    }
  }

  // Subtle chamfer edge vignette for tile depth
  cCtx.globalAlpha = 0.12;
  const edgeGrad = cCtx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.3,
    size / 2,
    size / 2,
    size * 0.72
  );
  edgeGrad.addColorStop(0, "transparent");
  edgeGrad.addColorStop(1, "rgba(0,0,0,0.45)");
  cCtx.fillStyle = edgeGrad;
  cCtx.fillRect(0, 0, size, size);
  cCtx.globalAlpha = 1;
  rCtx.globalAlpha = 1;

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  map.needsUpdate = true;

  const roughness = new THREE.CanvasTexture(roughCanvas);
  roughness.anisotropy = 4;
  roughness.needsUpdate = true;

  return { map, roughness };
}

function createCoordinateStripTexture(
  labels: string[],
  horizontal: boolean,
  bgHex: string,
  inkHex: string,
  borderHex: string
): THREE.CanvasTexture {
  const w = horizontal ? 512 : 64;
  const h = horizontal ? 64 : 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, w, h);

  // Fine metallic filigree pinstripe
  ctx.strokeStyle = borderHex;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 2;
  if (horizontal) {
    ctx.beginPath();
    ctx.moveTo(4, 6);
    ctx.lineTo(w - 4, 6);
    ctx.moveTo(4, h - 6);
    ctx.lineTo(w - 4, h - 6);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(6, 4);
    ctx.lineTo(6, h - 4);
    ctx.moveTo(w - 6, 4);
    ctx.lineTo(w - 6, h - 4);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = inkHex;
  ctx.font = "600 24px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const step = (horizontal ? w : h) / labels.length;
  labels.forEach((lbl, idx) => {
    const center = (idx + 0.5) * step;
    if (horizontal) {
      ctx.fillText(lbl, center, h / 2 + 1);
    } else {
      ctx.fillText(lbl, w / 2, center + 1);
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function getThemeTextureBundle(theme: ChessTheme): ThemeTextureBundle {
  const existing = themeTextureCache.get(theme.id);
  if (existing) return existing;

  const style = theme.scene3d.textureStyle;
  const seedBase =
    theme.id === "celestial"
      ? 101
      : theme.id === "marble"
      ? 202
      : theme.id === "emerald"
      ? 303
      : 404;

  const light = createTileTextures(
    theme.scene3d.lightTile.color,
    theme.scene3d.lightTile.veinColor,
    theme.scene3d.lightTile.secondaryVein,
    style,
    seedBase + 11
  );
  const dark = createTileTextures(
    theme.scene3d.darkTile.color,
    theme.scene3d.darkTile.veinColor,
    theme.scene3d.darkTile.secondaryVein,
    style,
    seedBase + 29
  );

  const filesWhite = createCoordinateStripTexture(
    ["A", "B", "C", "D", "E", "F", "G", "H"],
    true,
    theme.scene3d.railBg,
    theme.scene3d.railInk,
    theme.scene3d.railBorder
  );
  const filesBlack = createCoordinateStripTexture(
    ["H", "G", "F", "E", "D", "C", "B", "A"],
    true,
    theme.scene3d.railBg,
    theme.scene3d.railInk,
    theme.scene3d.railBorder
  );
  const ranksWhite = createCoordinateStripTexture(
    ["8", "7", "6", "5", "4", "3", "2", "1"],
    false,
    theme.scene3d.railBg,
    theme.scene3d.railInk,
    theme.scene3d.railBorder
  );
  const ranksBlack = createCoordinateStripTexture(
    ["1", "2", "3", "4", "5", "6", "7", "8"],
    false,
    theme.scene3d.railBg,
    theme.scene3d.railInk,
    theme.scene3d.railBorder
  );

  const bundle: ThemeTextureBundle = {
    lightMap: light.map,
    lightRoughness: light.roughness,
    darkMap: dark.map,
    darkRoughness: dark.roughness,
    filesWhite,
    filesBlack,
    ranksWhite,
    ranksBlack,
  };

  themeTextureCache.set(theme.id, bundle);
  return bundle;
}

// ── Precision Sculpted Staunton Piece Geometries (Singleton Cache) ───────────

export interface PieceGeometrySet {
  pawnBody: THREE.BufferGeometry;
  pawnTrim: THREE.BufferGeometry;
  rookBody: THREE.BufferGeometry;
  rookMerlon: THREE.BufferGeometry;
  rookTrim: THREE.BufferGeometry;
  knightBase: THREE.BufferGeometry;
  knightHead: THREE.BufferGeometry;
  knightMane: THREE.BufferGeometry;
  knightTrim: THREE.BufferGeometry;
  bishopBody: THREE.BufferGeometry;
  bishopFinial: THREE.BufferGeometry;
  bishopTrim: THREE.BufferGeometry;
  queenBody: THREE.BufferGeometry;
  queenFinial: THREE.BufferGeometry;
  queenPearl: THREE.BufferGeometry;
  queenTrim: THREE.BufferGeometry;
  kingBody: THREE.BufferGeometry;
  kingCross: THREE.BufferGeometry;
  kingTrim: THREE.BufferGeometry;
}

let cachedGeometries: PieceGeometrySet | null = null;

function createStauntonLathe(
  rawPoints: [number, number][],
  radialSegments = 32
): THREE.BufferGeometry {
  const vecs = rawPoints.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(vecs, radialSegments);
  geo.computeVertexNormals();
  return geo;
}

function createBaseRingPoints(scale = 1): [number, number][] {
  return [
    [0, 0],
    [0.345 * scale, 0],
    [0.35 * scale, 0.035],
    [0.338 * scale, 0.068],
    [0.29 * scale, 0.095],
    [0.312 * scale, 0.12],
    [0.282 * scale, 0.145],
    [0.242 * scale, 0.185],
  ];
}

function mergeSimpleGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Lightweight manual attribute merger for non-indexed / indexed parts sharing layout
  const nonIndexed = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let totalVerts = 0;
  for (const g of nonIndexed) {
    totalVerts += g.attributes.position.count;
  }

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  let offset = 0;

  for (const g of nonIndexed) {
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      const idx = (offset + i) * 3;
      positions[idx] = pos.getX(i);
      positions[idx + 1] = pos.getY(i);
      positions[idx + 2] = pos.getZ(i);
      if (norm) {
        normals[idx] = norm.getX(i);
        normals[idx + 1] = norm.getY(i);
        normals[idx + 2] = norm.getZ(i);
      }
    }
    offset += pos.count;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  return merged;
}

export function getPieceGeometries(): PieceGeometrySet {
  if (cachedGeometries) return cachedGeometries;

  // ── PAWN ───────────────────────────────────────────────────────────────────
  const pawnPts: [number, number][] = [
    ...createBaseRingPoints(0.92),
    [0.205, 0.24],
    [0.165, 0.34],
    [0.128, 0.44],
    [0.112, 0.51],
    [0.168, 0.535],
    [0.165, 0.558],
    [0.115, 0.575],
    // Spherical head sampled smoothly
    [0.145, 0.60],
    [0.178, 0.65],
    [0.188, 0.71],
    [0.175, 0.77],
    [0.135, 0.82],
    [0.072, 0.855],
    [0, 0.868],
  ];
  const pawnBody = createStauntonLathe(pawnPts, 32);
  const pawnTrim = mergeSimpleGeometries([
    (() => {
      const t = new THREE.TorusGeometry(0.296, 0.014, 10, 32);
      t.rotateX(Math.PI / 2);
      t.translate(0, 0.118, 0);
      return t;
    })(),
    (() => {
      const t = new THREE.TorusGeometry(0.166, 0.014, 10, 28);
      t.rotateX(Math.PI / 2);
      t.translate(0, 0.546, 0);
      return t;
    })(),
  ]);

  // ── ROOK ───────────────────────────────────────────────────────────────────
  const rookPts: [number, number][] = [
    ...createBaseRingPoints(0.98),
    [0.235, 0.24],
    [0.215, 0.40],
    [0.202, 0.58],
    [0.198, 0.71],
    [0.245, 0.75],
    [0.278, 0.80],
    [0.278, 0.95],
    [0.185, 0.95],
    [0.175, 0.88],
    [0, 0.88],
  ];
  const rookBody = createStauntonLathe(rookPts, 32);
  const rookMerlon = new THREE.BoxGeometry(0.115, 0.11, 0.075);
  const rookTrim = mergeSimpleGeometries([
    (() => {
      const t = new THREE.TorusGeometry(0.312, 0.015, 10, 32);
      t.rotateX(Math.PI / 2);
      t.translate(0, 0.12, 0);
      return t;
    })(),
    (() => {
      const t = new THREE.TorusGeometry(0.246, 0.016, 10, 32);
      t.rotateX(Math.PI / 2);
      t.translate(0, 0.755, 0);
      return t;
    })(),
  ]);

  // ── KNIGHT ─────────────────────────────────────────────────────────────────
  const knightBase = createStauntonLathe(
    [...createBaseRingPoints(0.98), [0.238, 0.24], [0.21, 0.275], [0, 0.275]],
    32
  );

  // Sculpted Horse Head & Arched Neck in XY plane (+X points toward muzzle -> rotated PI/2 around Y becomes -Z)
  const horseShape = new THREE.Shape();
  horseShape.moveTo(-0.18, 0.25);
  // Chest / front throat curve
  horseShape.bezierCurveTo(-0.08, 0.36, 0.04, 0.44, 0.02, 0.56);
  // Under-jaw & chin
  horseShape.bezierCurveTo(0.06, 0.58, 0.14, 0.54, 0.22, 0.56);
  // Snout / muzzle
  horseShape.bezierCurveTo(0.27, 0.57, 0.29, 0.63, 0.25, 0.69);
  // Nose bridge up to forehead
  horseShape.bezierCurveTo(0.19, 0.76, 0.13, 0.84, 0.08, 0.91);
  // Forward ear
  horseShape.lineTo(0.04, 1.07);
  horseShape.lineTo(-0.02, 0.97);
  // Second ear crown & flowing arched crest
  horseShape.lineTo(-0.07, 1.04);
  horseShape.lineTo(-0.10, 0.94);
  // Muscular arched mane back down to pedestal
  horseShape.bezierCurveTo(-0.24, 0.84, -0.28, 0.56, -0.21, 0.25);
  horseShape.closePath();

  const knightHead = new THREE.ExtrudeGeometry(horseShape, {
    depth: 0.17,
    bevelEnabled: true,
    bevelThickness: 0.048,
    bevelSize: 0.034,
    bevelSegments: 4,
    curveSegments: 18,
  });
  // Center extrusion thickness on Z, then rotate so +X faces -Z (White forward)
  knightHead.translate(0, 0, -0.085);
  knightHead.rotateY(Math.PI / 2);
  knightHead.computeVertexNormals();

  // Metallic mane spine accent curve
  const maneShape = new THREE.Shape();
  maneShape.moveTo(-0.19, 0.30);
  maneShape.bezierCurveTo(-0.29, 0.56, -0.26, 0.84, -0.10, 0.95);
  maneShape.lineTo(-0.07, 0.91);
  maneShape.bezierCurveTo(-0.20, 0.80, -0.23, 0.56, -0.15, 0.30);
  maneShape.closePath();

  const knightMane = new THREE.ExtrudeGeometry(maneShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.01,
    bevelSegments: 2,
    curveSegments: 14,
  });
  knightMane.translate(0, 0, -0.0225);
  knightMane.rotateY(Math.PI / 2);
  knightMane.computeVertexNormals();

  const knightTrim = (() => {
    const t = new THREE.TorusGeometry(0.312, 0.015, 10, 32);
    t.rotateX(Math.PI / 2);
    t.translate(0, 0.12, 0);
    return t;
  })();

  // ── BISHOP ─────────────────────────────────────────────────────────────────
  const bishopPts: [number, number][] = [
    ...createBaseRingPoints(0.98),
    [0.215, 0.25],
    [0.165, 0.42],
    [0.13, 0.60],
    [0.118, 0.70],
    [0.188, 0.73],
    [0.185, 0.755],
    [0.122, 0.775],
    // Pointed ogive mitre
    [0.168, 0.84],
    [0.194, 0.92],
    [0.182, 1.00],
    [0.135, 1.08],
    [0.07, 1.145],
    [0.032, 1.175],
    [0, 1.18],
  ];
  const bishopBody = createStauntonLathe(bishopPts, 32);
  const bishopFinial = new THREE.SphereGeometry(0.056, 18, 16);
  const bishopTrim = mergeSimpleGeometries([
    (() => {
      const t = new THREE.TorusGeometry(0.312, 0.015, 10, 32);
      t.rotateX(Math.PI / 2);
      t.translate(0, 0.12, 0);
      return t;
    })(),
    (() => {
      const t = new THREE.TorusGeometry(0.186, 0.015, 10, 28);
      t.rotateX(Math.PI / 2);
      t.translate(0, 0.742, 0);
      return t;
    })(),
    (() => {
      const t = new THREE.TorusGeometry(0.165, 0.012, 8, 28);
      t.rotateX(Math.PI / 2 + 0.45);
      t.translate(0, 0.96, 0.01);
      return t;
    })(),
  ]);

  // ── QUEEN ──────────────────────────────────────────────────────────────────
  const queenPts: [number, number][] = [
    ...createBaseRingPoints(1.03),
    [0.232, 0.26],
    [0.182, 0.46],
    [0.142, 0.68],
    [0.13, 0.84],
    [0.222, 0.895],
    [0.215, 0.925],
    [0.155, 0.95],
    // Flared coronet chalice
    [0.185, 1.04],
    [0.235, 1.14],
    [0.268, 1.23],
    [0.225, 1.245],
    [0.165, 1.28],
    [0.09, 1.32],
    [0, 1.335],
  ];
  const queenBody = createStauntonLathe(queenPts, 36);
  const queenFinial = new THREE.SphereGeometry(0.068, 18, 16);
  const queenPearl = new THREE.SphereGeometry(0.036, 12, 10);
  const queenTrim = mergeSimpleGeometries([
    (() => {
      const t = new THREE.TorusGeometry(0.326, 0.016, 10, 36);
      t.rotateX(Math.PI / 2);
      t.translate(0, 0.122, 0);
      return t;
    })(),
    (() => {
      const t = new THREE.TorusGeometry(0.222, 0.017, 10, 32);
      t.rotateX(Math.PI / 2);
      t.translate(0, 0.908, 0);
      return t;
    })(),
  ]);

  // ── KING ───────────────────────────────────────────────────────────────────
  const kingPts: [number, number][] = [
    ...createBaseRingPoints(1.06),
    [0.252, 0.28],
    [0.198, 0.50],
    [0.156, 0.74],
    [0.145, 0.94],
    [0.244, 0.995],
    [0.236, 1.03],
    [0.175, 1.055],
    // Imperial crown bell
    [0.215, 1.16],
    [0.268, 1.29],
    [0.275, 1.35],
    [0.215, 1.39],
    [0.12, 1.43],
    [0, 1.445],
  ];
  const kingBody = createStauntonLathe(kingPts, 36);
  const kingCross = mergeSimpleGeometries([
    (() => {
      const b = new THREE.BoxGeometry(0.055, 0.24, 0.055);
      b.translate(0, 1.54, 0);
      return b;
    })(),
    (() => {
      const b = new THREE.BoxGeometry(0.17, 0.055, 0.055);
      b.translate(0, 1.57, 0);
      return b;
    })(),
  ]);
  const kingTrim = mergeSimpleGeometries([
    (() => {
      const t = new THREE.TorusGeometry(0.336, 0.017, 10, 36);
      t.rotateX(Math.PI / 2);
      t.translate(0, 0.122, 0);
      return t;
    })(),
    (() => {
      const t = new THREE.TorusGeometry(0.244, 0.018, 10, 32);
      t.rotateX(Math.PI / 2);
      t.translate(0, 1.012, 0);
      return t;
    })(),
  ]);

  cachedGeometries = {
    pawnBody,
    pawnTrim,
    rookBody,
    rookMerlon,
    rookTrim,
    knightBase,
    knightHead,
    knightMane,
    knightTrim,
    bishopBody,
    bishopFinial,
    bishopTrim,
    queenBody,
    queenFinial,
    queenPearl,
    queenTrim,
    kingBody,
    kingCross,
    kingTrim,
  };

  return cachedGeometries;
}

// ── Shared Board Tile & Indicator Geometries (Singleton Cache) ───────────────

export interface SharedBoardGeometries {
  tileGeo: THREE.BufferGeometry;
  claspGeo: THREE.BufferGeometry;
  lastMovePlaneGeo: THREE.BufferGeometry;
  ringHoverGeo: THREE.BufferGeometry;
  ringCaptureGeo: THREE.BufferGeometry;
  ringCastleGeo: THREE.BufferGeometry;
  ringSelectGeo: THREE.BufferGeometry;
  validDotGeo: THREE.BufferGeometry;
}

let cachedBoardGeometries: SharedBoardGeometries | null = null;

export function getSharedBoardGeometries(): SharedBoardGeometries {
  if (cachedBoardGeometries) return cachedBoardGeometries;

  // Chamfered luxury square tile (total footprint ~0.945 x 0.08 x 0.945)
  const half = 0.4575;
  const r = 0.025;
  const tileShape = new THREE.Shape();
  tileShape.moveTo(-half + r, -half);
  tileShape.lineTo(half - r, -half);
  tileShape.quadraticCurveTo(half, -half, half, -half + r);
  tileShape.lineTo(half, half - r);
  tileShape.quadraticCurveTo(half, half, half - r, half);
  tileShape.lineTo(-half + r, half);
  tileShape.quadraticCurveTo(-half, half, -half, half - r);
  tileShape.lineTo(-half, -half + r);
  tileShape.quadraticCurveTo(-half, -half, -half + r, -half);

  const tileGeo = new THREE.ExtrudeGeometry(tileShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
    curveSegments: 3,
  });
  tileGeo.translate(0, 0, -0.025);
  tileGeo.rotateX(-Math.PI / 2);
  tileGeo.computeVertexNormals();

  // Remap planar XZ UVs cleanly to [0, 1] for CanvasTextures
  const posAttr = tileGeo.attributes.position;
  const uvAttr = tileGeo.attributes.uv;
  for (let i = 0; i < posAttr.count; i++) {
    const u = THREE.MathUtils.clamp(posAttr.getX(i) / 0.945 + 0.5, 0, 1);
    const v = THREE.MathUtils.clamp(posAttr.getZ(i) / 0.945 + 0.5, 0, 1);
    uvAttr.setXY(i, u, v);
  }
  uvAttr.needsUpdate = true;

  const ringHoverGeo = new THREE.RingGeometry(0.55, 0.625, 4);
  ringHoverGeo.rotateZ(Math.PI / 4);

  cachedBoardGeometries = {
    tileGeo,
    claspGeo: new THREE.BoxGeometry(0.36, 0.12, 0.36),
    lastMovePlaneGeo: new THREE.PlaneGeometry(0.9, 0.9),
    ringHoverGeo,
    ringCaptureGeo: new THREE.RingGeometry(0.31, 0.43, 32),
    ringCastleGeo: new THREE.RingGeometry(0.2, 0.3, 28),
    ringSelectGeo: new THREE.RingGeometry(0.36, 0.44, 32),
    validDotGeo: new THREE.SphereGeometry(0.125, 18, 16),
  };

  return cachedBoardGeometries;
}
