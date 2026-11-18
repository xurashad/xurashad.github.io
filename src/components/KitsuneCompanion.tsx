"use client";

import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Types & Constants ───────────────────────────────────────────────────── */
type Expression = "curious" | "happy" | "playful" | "excited" | "surprised" | "sleepy";
type TrickType = "none" | "spinJump" | "crystalFlare" | "playBow" | "wingFlutter";
type IdleActionType = "none" | "groomPaw" | "fluffShake";

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
}

interface SharedRuntimeRef {
  pointerX: number; // normalized -1..1 relative to Azurite center
  pointerY: number; // normalized -1..1 relative to Azurite center
  lastPointerMoveAt: number;
  facingYaw: number;
  moveSpeed: number; // 0..1 normalized travel/drag speed
  lateralVelX: number; // -1..1 horizontal velocity inertia
  lateralVelY: number; // -1..1 vertical velocity inertia
  landingTimer: number; // 0..0.45 post-drag landing bounce
  isWalking: boolean;
  isDragging: boolean;
  isPetting: boolean;
  scrollImpulse: number;
  burstEnergy: number;
  expression: Expression;
  trick: TrickType;
  trickTimer: number;
  trickDuration: number;
  idleAction: IdleActionType;
  idleActionTimer: number;
  idleActionDuration: number;
}

interface TailConfig {
  pos: [number, number, number];
  fanRoll: number;
  curlYaw: number;
  pitchBack: number;
  scale: number;
  phase: number;
}

interface ChestLockSpec {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
  tier: "white" | "sky" | "gradient";
}

interface SparkleSpec {
  radius: number;
  speed: number;
  yBase: number;
  phase: number;
  scale: number;
  isStar: boolean;
}

const TRICK_SEQUENCE: { trick: TrickType; expression: Expression; duration: number }[] = [
  { trick: "spinJump", expression: "excited", duration: 1.08 },
  { trick: "crystalFlare", expression: "excited", duration: 1.15 },
  { trick: "playBow", expression: "playful", duration: 1.15 },
  { trick: "wingFlutter", expression: "happy", duration: 1.1 },
];

const TAIL_SPLIT_T = 0.56;

// 9 Tails matching the luminous fanned silhouette (3 tall crown tails, 4 mid/side curls, 2 low flank curls)
const TAIL_CONFIGS: TailConfig[] = [
  { pos: [-0.20, 0.14, -0.14], fanRoll: 2.02, curlYaw: 1.05, pitchBack: -0.14, scale: 0.80, phase: 0.0 },
  { pos: [-0.25, 0.22, -0.20], fanRoll: 1.48, curlYaw: 1.08, pitchBack: -0.20, scale: 0.88, phase: 0.7 },
  { pos: [-0.24, 0.30, -0.26], fanRoll: 0.94, curlYaw: 0.95, pitchBack: -0.24, scale: 0.96, phase: 1.4 },
  { pos: [-0.15, 0.35, -0.30], fanRoll: 0.42, curlYaw: 0.55, pitchBack: -0.22, scale: 1.06, phase: 2.1 },
  { pos: [0.00, 0.38, -0.32], fanRoll: 0.00, curlYaw: 0.04, pitchBack: -0.18, scale: 1.18, phase: 2.8 },
  { pos: [0.15, 0.35, -0.30], fanRoll: -0.42, curlYaw: -0.55, pitchBack: -0.22, scale: 1.06, phase: 3.5 },
  { pos: [0.24, 0.30, -0.26], fanRoll: -0.94, curlYaw: -0.95, pitchBack: -0.24, scale: 0.96, phase: 4.2 },
  { pos: [0.25, 0.22, -0.20], fanRoll: -1.48, curlYaw: -1.08, pitchBack: -0.20, scale: 0.88, phase: 4.9 },
  { pos: [0.20, 0.14, -0.14], fanRoll: -2.02, curlYaw: -1.05, pitchBack: -0.14, scale: 0.80, phase: 5.6 },
];

// Anchor midpoint along the S-curl tail curve (`P(0.56)`), so lower + upper segments pivot seamlessly
const TAIL_MID_ANCHOR: [number, number, number] = [0, 0.625, -0.145];

// Crystal clusters relative to the upper tail segment pivot (`TAIL_MID_ANCHOR`)
const TAIL_CRYSTAL_SLOTS: {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
  highlight?: boolean;
}[] = [
  {
    pos: [0, 0.88 - TAIL_MID_ANCHOR[1], 0.05 - TAIL_MID_ANCHOR[2]],
    rot: [0.35, 0.2, 0.05],
    scale: [1.0, 1.35, 0.95],
  },
  {
    pos: [-0.05, 0.83 - TAIL_MID_ANCHOR[1], -0.02 - TAIL_MID_ANCHOR[2]],
    rot: [-0.25, -0.4, 0.38],
    scale: [0.72, 1.05, 0.72],
    highlight: true,
  },
  {
    pos: [0.055, 0.8 - TAIL_MID_ANCHOR[1], 0.02 - TAIL_MID_ANCHOR[2]],
    rot: [-0.15, 0.45, -0.42],
    scale: [0.7, 1.0, 0.7],
  },
  {
    pos: [0, 0.68 - TAIL_MID_ANCHOR[1], -0.13 - TAIL_MID_ANCHOR[2]],
    rot: [-1.05, 0.1, 0.15],
    scale: [0.68, 0.98, 0.68],
    highlight: true,
  },
  {
    pos: [0, 0.91 - TAIL_MID_ANCHOR[1], 0.16 - TAIL_MID_ANCHOR[2]],
    rot: [1.1, -0.15, -0.1],
    scale: [0.62, 0.92, 0.62],
  },
];

// 19-Lock 3-Tier Sculpted Chest Mane (white collar -> sky-blue mid -> pointed lavender tips)
const CHEST_LOCKS: ChestLockSpec[] = [
  { pos: [-0.21, 0.25, 0.17], rot: [-0.28, -0.38, -0.58], scale: [0.92, 0.78, 0.85], tier: "white" },
  { pos: [-0.14, 0.23, 0.23], rot: [-0.36, -0.22, -0.34], scale: [0.98, 0.84, 0.9], tier: "white" },
  { pos: [-0.06, 0.22, 0.27], rot: [-0.4, -0.08, -0.12], scale: [1.04, 0.9, 0.95], tier: "white" },
  { pos: [0.0, 0.22, 0.29], rot: [-0.42, 0, 0], scale: [1.08, 0.94, 1.0], tier: "white" },
  { pos: [0.06, 0.22, 0.27], rot: [-0.4, 0.08, 0.12], scale: [1.04, 0.9, 0.95], tier: "white" },
  { pos: [0.14, 0.23, 0.23], rot: [-0.36, 0.22, 0.34], scale: [0.98, 0.84, 0.9], tier: "white" },
  { pos: [0.21, 0.25, 0.17], rot: [-0.28, 0.38, 0.58], scale: [0.92, 0.78, 0.85], tier: "white" },

  { pos: [-0.22, 0.15, 0.18], rot: [-0.16, -0.45, -0.5], scale: [1.05, 1.08, 0.95], tier: "sky" },
  { pos: [-0.14, 0.13, 0.25], rot: [-0.22, -0.26, -0.26], scale: [1.15, 1.15, 1.02], tier: "sky" },
  { pos: [-0.06, 0.12, 0.29], rot: [-0.26, -0.1, -0.08], scale: [1.18, 1.22, 1.05], tier: "sky" },
  { pos: [0.0, 0.12, 0.31], rot: [-0.26, 0, 0], scale: [1.22, 1.26, 1.08], tier: "sky" },
  { pos: [0.06, 0.12, 0.29], rot: [-0.26, 0.1, 0.08], scale: [1.18, 1.22, 1.05], tier: "sky" },
  { pos: [0.14, 0.13, 0.25], rot: [-0.22, 0.26, 0.26], scale: [1.15, 1.15, 1.02], tier: "sky" },
  { pos: [0.22, 0.15, 0.18], rot: [-0.16, 0.45, 0.5], scale: [1.05, 1.08, 0.95], tier: "sky" },

  { pos: [-0.15, 0.02, 0.25], rot: [-0.08, -0.22, 0.16], scale: [1.05, 1.18, 0.95], tier: "gradient" },
  { pos: [-0.075, 0.00, 0.28], rot: [-0.1, -0.08, 0.08], scale: [1.12, 1.28, 1.02], tier: "gradient" },
  { pos: [0.0, -0.01, 0.295], rot: [-0.12, 0, 0], scale: [1.18, 1.36, 1.05], tier: "gradient" },
  { pos: [0.075, 0.00, 0.28], rot: [-0.1, 0.08, -0.08], scale: [1.12, 1.28, 1.02], tier: "gradient" },
  { pos: [0.15, 0.02, 0.25], rot: [-0.08, 0.22, -0.16], scale: [1.05, 1.18, 0.95], tier: "gradient" },
];

const CHEEK_RUFF_LOCKS: { pos: [number, number, number]; rot: [number, number, number]; scale: number; sky?: boolean }[] = [
  { pos: [0.0, 0.04, 0.02], rot: [0.1, 0.1, -1.18], scale: 0.72 },
  { pos: [-0.03, -0.02, 0.03], rot: [0.12, 0.18, -1.42], scale: 0.84, sky: true },
  { pos: [-0.04, -0.09, 0.02], rot: [0.06, 0.22, -1.68], scale: 0.78, sky: true },
  { pos: [-0.01, -0.15, -0.02], rot: [-0.05, 0.25, -1.95], scale: 0.68 },
];

const CROWN_LOCKS: { pos: [number, number, number]; rot: [number, number, number]; scale: number }[] = [
  { pos: [0.0, 0.34, 0.04], rot: [-0.3, 0, Math.PI], scale: 0.76 },
  { pos: [-0.06, 0.33, 0.05], rot: [-0.25, 0, Math.PI + 0.32], scale: 0.68 },
  { pos: [0.06, 0.33, 0.05], rot: [-0.25, 0, Math.PI - 0.32], scale: 0.68 },
  { pos: [-0.04, 0.36, -0.03], rot: [-0.5, 0, Math.PI + 0.18], scale: 0.72 },
  { pos: [0.04, 0.36, -0.03], rot: [-0.5, 0, Math.PI - 0.18], scale: 0.72 },
];

const WING_FINGER_SPARS: { pos: [number, number, number]; rotZ: number; radTop: number; len: number }[] = [
  { pos: [-0.41, 0.21, -0.05], rotZ: 1.54, radTop: 0.011, len: 0.34 },
  { pos: [-0.34, 0.11, -0.04], rotZ: 2.15, radTop: 0.01, len: 0.29 },
  { pos: [-0.22, 0.04, -0.025], rotZ: 2.55, radTop: 0.009, len: 0.22 },
];

const WING_CRYSTALS: { pos: [number, number, number]; rot: [number, number, number]; scale: [number, number, number]; highlight?: boolean }[] = [
  { pos: [-0.14, 0.16, -0.01], rot: [0.1, 0.1, 0.75], scale: [0.7, 1.35, 0.45], highlight: true },
  { pos: [-0.33, 0.29, -0.045], rot: [0.08, 0.08, 1.05], scale: [0.9, 1.75, 0.5] },
  { pos: [-0.45, 0.37, -0.065], rot: [0.05, 0.08, 0.96], scale: [0.58, 1.15, 0.42], highlight: true },
  { pos: [-0.35, 0.15, -0.04], rot: [0.1, 0.05, 1.48], scale: [0.85, 1.65, 0.48], highlight: true },
  { pos: [-0.22, 0.06, -0.025], rot: [0.12, 0.05, 1.85], scale: [0.72, 1.45, 0.45] },
  { pos: [-0.46, 0.25, -0.06], rot: [0.08, 0.05, 1.25], scale: [0.52, 1.05, 0.4] },
  { pos: [-0.29, 0.21, -0.035], rot: [0.06, 0.08, 1.22], scale: [0.55, 1.1, 0.4], highlight: true },
];

// Upper thigh flank crystal plates
const LEG_CRYSTALS: { pos: [number, number, number]; rot: [number, number, number]; scale: [number, number, number] }[] = [
  { pos: [0.052, -0.02, 0.015], rot: [0.2, 0.4, -0.35], scale: [0.46, 0.85, 0.34] },
  { pos: [0.056, -0.055, -0.02], rot: [-0.15, 0.5, -0.5], scale: [0.38, 0.68, 0.3] },
  { pos: [0.046, 0.015, -0.015], rot: [0.1, 0.3, -0.25], scale: [0.35, 0.64, 0.28] },
  { pos: [0.048, -0.075, 0.018], rot: [0.3, 0.4, -0.6], scale: [0.3, 0.55, 0.26] },
];

const SPARKLE_SPECS: SparkleSpec[] = Array.from({ length: 18 }, (_, i) => ({
  radius: 0.82 + ((i * 37) % 10) * 0.045,
  speed: (i % 2 === 0 ? 1 : -1) * (0.45 + (i % 5) * 0.14),
  yBase: 0.12 + ((i * 23) % 12) * 0.095,
  phase: i * 1.15,
  scale: 0.42 + (i % 4) * 0.14,
  isStar: i % 2 === 0,
}));

// Module-scope dynamic materials animated cleanly in useFrame
const DYNAMIC_CRYSTAL_MAT = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#7dd3fc"),
  emissive: new THREE.Color("#6366f1"),
  emissiveIntensity: 0.32,
  roughness: 0.1,
  metalness: 0.08,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  reflectivity: 1.0,
  envMapIntensity: 1.55,
  transparent: true,
  opacity: 0.94,
  flatShading: true,
});

const DYNAMIC_CRYSTAL_TIP_MAT = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#bae6fd"),
  emissive: new THREE.Color("#38bdf8"),
  emissiveIntensity: 0.42,
  roughness: 0.08,
  metalness: 0.06,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  envMapIntensity: 1.65,
  transparent: true,
  opacity: 0.92,
  flatShading: true,
});

const DYNAMIC_BLUSH_MAT = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#f472b6"),
  transparent: true,
  opacity: 0.2,
  depthWrite: false,
});

const DYNAMIC_SPARKLE_MAT = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#e0f2fe"),
  transparent: true,
  opacity: 0.85,
  side: THREE.DoubleSide,
});

/* ─── Stylized Game Fur Fresnel Rim Shader Hook ──────────────────────────── */
function applyFurRimShader(
  mat: THREE.MeshStandardMaterial,
  rimColorHex: string,
  rimStrength = 0.32
): THREE.MeshStandardMaterial {
  mat.customProgramCacheKey = () => `azurite-fur-rim-${rimColorHex}-${rimStrength.toFixed(2)}`;
  mat.onBeforeCompile = (shader) => {
    const rimCol = new THREE.Color(rimColorHex);
    shader.uniforms.uRimColor = { value: rimCol };
    shader.uniforms.uRimStrength = { value: rimStrength };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        "uniform vec3 uRimColor;\nuniform float uRimStrength;\nvoid main() {"
      )
      .replace(
        "#include <dithering_fragment>",
        `
        float furFresnel = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.35);
        gl_FragColor.rgb += uRimColor * furFresnel * uRimStrength;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, max(gl_FragColor.rgb, vec3(0.11, 0.13, 0.24)), 0.12);
        #include <dithering_fragment>
        `
      );
  };
  return mat;
}

/* ─── Procedural Studio & Aurora PMREM Environment Light Probe ────────────── */
function applyStudioEnvironment(gl: THREE.WebGLRenderer, scene: THREE.Scene): () => void {
  const pmrem = new THREE.PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color("#0f172a");

  const topPanelGeo = new THREE.PlaneGeometry(14, 14);
  const topPanelMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#f0f9ff"), side: THREE.DoubleSide });
  const topPanel = new THREE.Mesh(topPanelGeo, topPanelMat);
  topPanel.position.set(0, 6, 1.5);
  topPanel.rotation.x = Math.PI / 2;
  envScene.add(topPanel);

  const cyanGeo = new THREE.PlaneGeometry(9, 7);
  const cyanMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#38bdf8"), side: THREE.DoubleSide });
  const cyanPanel = new THREE.Mesh(cyanGeo, cyanMat);
  cyanPanel.position.set(-5.5, 2.2, 2);
  cyanPanel.rotation.y = Math.PI / 2.6;
  envScene.add(cyanPanel);

  const violetGeo = new THREE.PlaneGeometry(9, 7);
  const violetMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#a855f7"), side: THREE.DoubleSide });
  const violetPanel = new THREE.Mesh(violetGeo, violetMat);
  violetPanel.position.set(5.5, 2.0, 1.5);
  violetPanel.rotation.y = -Math.PI / 2.6;
  envScene.add(violetPanel);

  const floorGeo = new THREE.PlaneGeometry(14, 14);
  const floorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#1e1b4b"), side: THREE.DoubleSide });
  const floorPanel = new THREE.Mesh(floorGeo, floorMat);
  floorPanel.position.set(0, -5.5, 0);
  floorPanel.rotation.x = -Math.PI / 2;
  envScene.add(floorPanel);

  const envRT = pmrem.fromScene(envScene, 0.035);
  scene.environment = envRT.texture;

  topPanelGeo.dispose();
  topPanelMat.dispose();
  cyanGeo.dispose();
  cyanMat.dispose();
  violetGeo.dispose();
  violetMat.dispose();
  floorGeo.dispose();
  floorMat.dispose();

  return () => {
    scene.environment = null;
    envRT.dispose();
    pmrem.dispose();
  };
}

/* ─── High-Resolution Procedural Game-Style Canvas Textures ───────────────── */
function createHeadFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const vGrad = ctx.createLinearGradient(0, 0, 0, 512);
  vGrad.addColorStop(0.0, "#a4d7ff");
  vGrad.addColorStop(0.26, "#d7efff");
  vGrad.addColorStop(0.54, "#f5f9ff");
  vGrad.addColorStop(1.0, "#ffffff");
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, 512, 512);

  const radFace = ctx.createRadialGradient(384, 272, 36, 384, 272, 190);
  radFace.addColorStop(0.0, "rgba(255, 255, 255, 0.96)");
  radFace.addColorStop(0.6, "rgba(240, 248, 255, 0.56)");
  radFace.addColorStop(1.0, "rgba(188, 160, 248, 0.3)");
  ctx.fillStyle = radFace;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle fine fur micro-strokes on temples/crown
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 200; i++) {
    const x = (i * 73) % 512;
    const y = (i * 97) % 240;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(255,255,255,0.22)" : "rgba(147,197,253,0.16)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + ((i % 3) - 1) * 4, y + 18);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createBodyFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, "#eef7ff");
  grad.addColorStop(0.35, "#b3e3ff");
  grad.addColorStop(0.74, "#c4abfa");
  grad.addColorStop(1.0, "#9778e8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  for (let i = 0; i < 140; i++) {
    const x = (i * 53) % 256;
    const y = (i * 89) % 512;
    ctx.strokeStyle = "rgba(255,255,255,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 28);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createTailFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 1024, 0, 0);
  grad.addColorStop(0.0, "#bce5ff");
  grad.addColorStop(0.08, "#d2eeff");
  grad.addColorStop(0.24, "#9be0ff");
  grad.addColorStop(0.48, "#b79cf7");
  grad.addColorStop(0.68, "#8e6ee4");
  grad.addColorStop(0.76, "#2c1e4a");
  grad.addColorStop(1.0, "#100f16");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle root ambient occlusion at attachment
  const rootAO = ctx.createLinearGradient(0, 1024, 0, 920);
  rootAO.addColorStop(0.0, "rgba(88, 70, 185, 0.24)");
  rootAO.addColorStop(1.0, "rgba(88, 70, 185, 0)");
  ctx.fillStyle = rootAO;
  ctx.fillRect(0, 920, 512, 104);

  // Rich painted fur strand strokes
  for (let i = 0; i < 380; i++) {
    const x = (i * 67) % 512;
    const y = 240 + ((i * 113) % 720);
    ctx.strokeStyle = i % 3 === 0 ? "rgba(255,255,255,0.24)" : "rgba(139,92,246,0.16)";
    ctx.lineWidth = i % 4 === 0 ? 3.2 : 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + ((i % 5) - 2) * 5, y - 52);
    ctx.stroke();
  }

  // Crisp multi-tooth jagged transition into velvety black tip
  ctx.fillStyle = "#100f16";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(512, 0);
  ctx.lineTo(512, 236);
  const teeth = 22;
  for (let i = teeth; i >= 0; i--) {
    const x = (i / teeth) * 512;
    const y = i % 2 === 0 ? 316 + ((i * 11) % 24) : 192 + ((i * 9) % 18);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createLegFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, "#eef7ff");
  grad.addColorStop(0.28, "#b7e4ff");
  grad.addColorStop(0.55, "#ab8ef2");
  grad.addColorStop(0.7, "#6f53bf");
  grad.addColorStop(1.0, "#100f16");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 160; i++) {
    const x = (i * 59) % 512;
    const y = 30 + ((i * 71) % 280);
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 36);
    ctx.stroke();
  }

  // Jagged fur transition ending in black cuff above knee joint
  ctx.fillStyle = "#100f16";
  ctx.beginPath();
  ctx.moveTo(0, 512);
  ctx.lineTo(512, 512);
  ctx.lineTo(512, 345);
  const teeth = 16;
  for (let i = teeth; i >= 0; i--) {
    const x = (i / teeth) * 512;
    const y = i % 2 === 0 ? 298 + ((i * 7) % 14) : 368 + ((i * 9) % 12);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createEarFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 512, 0, 0);
  grad.addColorStop(0.0, "#e6f4ff");
  grad.addColorStop(0.32, "#a5dcff");
  grad.addColorStop(0.56, "#a489ed");
  grad.addColorStop(0.68, "#14121b");
  grad.addColorStop(1.0, "#0f0e15");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 150; i++) {
    const x = (i * 61) % 512;
    const y = 180 + ((i * 83) % 300);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 34);
    ctx.stroke();
  }

  ctx.fillStyle = "#0f0e15";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(512, 0);
  ctx.lineTo(512, 196);
  const teeth = 14;
  for (let i = teeth; i >= 0; i--) {
    const x = (i / teeth) * 512;
    const y = i % 2 === 0 ? 236 : 148;
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createChestLockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 512, 0, 0);
  grad.addColorStop(0.0, "#f2f8ff");
  grad.addColorStop(0.4, "#9ee0ff");
  grad.addColorStop(0.78, "#937ce8");
  grad.addColorStop(1.0, "#7c5fe0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Subtle root AO for layered plume depth
  const rootAO = ctx.createLinearGradient(0, 512, 0, 420);
  rootAO.addColorStop(0.0, "rgba(99, 102, 241, 0.16)");
  rootAO.addColorStop(1.0, "rgba(99, 102, 241, 0)");
  ctx.fillStyle = rootAO;
  ctx.fillRect(0, 420, 256, 92);

  for (let i = 0; i < 110; i++) {
    const x = (i * 41) % 256;
    const y = (i * 79) % 512;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(255,255,255,0.24)" : "rgba(125,211,252,0.18)";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 42);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createStarryCrystalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 512, 0, 0);
  grad.addColorStop(0.0, "#3b2ea6");
  grad.addColorStop(0.28, "#4b69e6");
  grad.addColorStop(0.58, "#59b5ff");
  grad.addColorStop(0.84, "#9ee8ff");
  grad.addColorStop(1.0, "#e6faff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Sharper hand-painted facet bevel lines
  ctx.strokeStyle = "rgba(235, 250, 255, 0.58)";
  ctx.lineWidth = 3;
  for (let x = 0; x < 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 512);
    ctx.lineTo(x + 32, 330);
    ctx.lineTo(x + 8, 170);
    ctx.lineTo(x + 30, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 32, 330);
    ctx.lineTo(x + 64, 240);
    ctx.stroke();
  }

  // Crisp 4-point stars + diamond glints inside crystal bases
  for (let i = 0; i < 64; i++) {
    const x = (i * 89 + 23) % 512;
    const y = 120 + ((i * 71) % 360);
    const r = i % 5 === 0 ? 4.2 : 1.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.55 + (i % 3) * 0.2})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createIrisTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Rich indigo limbal border
  ctx.fillStyle = "#160b2b";
  ctx.fillRect(0, 0, 512, 512);

  // Multi-stop amethyst to neon-orchid gradient
  const grad = ctx.createRadialGradient(256, 290, 48, 256, 256, 244);
  grad.addColorStop(0.0, "#f5d0fe");
  grad.addColorStop(0.38, "#c084fc");
  grad.addColorStop(0.68, "#7e22ce");
  grad.addColorStop(0.92, "#3b0764");
  grad.addColorStop(1.0, "#160b2b");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(256, 256, 236, 0, Math.PI * 2);
  ctx.fill();

  // Luminous orchid crescent glow in lower iris
  const lowerGlow = ctx.createRadialGradient(256, 356, 16, 256, 344, 160);
  lowerGlow.addColorStop(0.0, "rgba(240, 171, 252, 0.95)");
  lowerGlow.addColorStop(0.55, "rgba(192, 132, 252, 0.4)");
  lowerGlow.addColorStop(1.0, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = lowerGlow;
  ctx.beginPath();
  ctx.arc(256, 256, 228, 0, Math.PI * 2);
  ctx.fill();

  // Fine crystalline iris fibers
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(245, 208, 254, 0.3)" : "rgba(125, 211, 252, 0.16)";
    ctx.lineWidth = i % 2 === 0 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * 82, 256 + Math.sin(a) * 82);
    ctx.lineTo(256 + Math.cos(a) * 208, 256 + Math.sin(a) * 208);
    ctx.stroke();
  }

  // Subtle 4-point starlight motif around center of iris
  ctx.fillStyle = "rgba(253, 244, 255, 0.45)";
  ctx.beginPath();
  ctx.moveTo(256, 172);
  ctx.quadraticCurveTo(270, 242, 340, 256);
  ctx.quadraticCurveTo(270, 270, 256, 340);
  ctx.quadraticCurveTo(242, 270, 172, 256);
  ctx.quadraticCurveTo(242, 242, 256, 172);
  ctx.fill();

  // Soft upper eyelid shadow
  const shadow = ctx.createLinearGradient(0, 20, 0, 250);
  shadow.addColorStop(0.0, "rgba(16, 6, 34, 0.86)");
  shadow.addColorStop(1.0, "rgba(16, 6, 34, 0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, 512, 250);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createWingWebTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 512, 512, 0);
  grad.addColorStop(0.0, "#b9b4f7");
  grad.addColorStop(0.5, "#cbe7ff");
  grad.addColorStop(1.0, "#ebf7ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "rgba(125, 211, 252, 0.45)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 56);
    ctx.quadraticCurveTo(256, i * 50 + 30, 512, i * 54);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createAuraRuneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const radGrad = ctx.createRadialGradient(256, 256, 18, 256, 256, 250);
  radGrad.addColorStop(0.0, "rgba(186, 230, 253, 0.42)");
  radGrad.addColorStop(0.55, "rgba(167, 139, 250, 0.22)");
  radGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Outer & inner frosted rune circles
  ctx.strokeStyle = "rgba(224, 242, 254, 0.72)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 218, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(196, 181, 253, 0.6)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(256, 256, 182, 0, Math.PI * 2);
  ctx.stroke();

  // 8-point celestial ticks around ring
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r0 = i % 2 === 0 ? 174 : 196;
    const r1 = 224;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(224, 242, 254, 0.8)" : "rgba(167, 139, 250, 0.55)";
    ctx.lineWidth = i % 2 === 0 ? 3.5 : 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0);
    ctx.lineTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/* ─── Custom Sculpted Game-Mesh Geometries & Multi-Segment Tail Rig ───────── */
function mirrorGeometryX(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const geo = src.clone();
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, -pos.getX(i));
  }
  pos.needsUpdate = true;

  const index = geo.getIndex();
  if (index) {
    const arr = index.array as Uint16Array | Uint32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = tmp;
    }
    index.needsUpdate = true;
  } else {
    const count = pos.count;
    const uv = geo.getAttribute("uv") as THREE.BufferAttribute | undefined;
    for (let i = 0; i < count; i += 3) {
      const i1 = i + 1;
      const i2 = i + 2;
      const x1 = pos.getX(i1);
      const y1 = pos.getY(i1);
      const z1 = pos.getZ(i1);
      pos.setXYZ(i1, pos.getX(i2), pos.getY(i2), pos.getZ(i2));
      pos.setXYZ(i2, x1, y1, z1);
      if (uv) {
        const u1 = uv.getX(i1);
        const v1 = uv.getY(i1);
        uv.setXY(i1, uv.getX(i2), uv.getY(i2));
        uv.setXY(i2, u1, v1);
      }
    }
    if (uv) uv.needsUpdate = true;
  }

  geo.computeVertexNormals();
  return geo;
}

function buildSculptedTube(
  curve: THREE.Curve<THREE.Vector3>,
  radiusFn: (t: number, angle: number) => [number, number],
  tubularSegs: number,
  radialSegs: number,
  planarNormalX = true,
  tStart = 0,
  tEnd = 1,
  pivotOffset?: THREE.Vector3
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const nVec = new THREE.Vector3(1, 0, 0);
  const bVec = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  for (let i = 0; i <= tubularSegs; i++) {
    const frac = i / tubularSegs;
    const t = tStart + frac * (tEnd - tStart);
    const pt = curve.getPoint(t);
    tangent.copy(curve.getTangent(t)).normalize();

    if (planarNormalX) {
      nVec.set(1, 0, 0);
      bVec.crossVectors(tangent, nVec).normalize();
      nVec.crossVectors(bVec, tangent).normalize();
    } else {
      nVec.set(0, 0, 1);
      if (Math.abs(tangent.dot(nVec)) > 0.92) nVec.set(1, 0, 0);
      bVec.crossVectors(tangent, nVec).normalize();
      nVec.crossVectors(bVec, tangent).normalize();
    }

    for (let j = 0; j <= radialSegs; j++) {
      const u = j / radialSegs;
      const theta = u * Math.PI * 2;
      const [rx, ry] = radiusFn(t, theta);
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);

      let vx = pt.x + nVec.x * cos * rx + bVec.x * sin * ry;
      let vy = pt.y + nVec.y * cos * rx + bVec.y * sin * ry;
      let vz = pt.z + nVec.z * cos * rx + bVec.z * sin * ry;

      if (pivotOffset) {
        vx -= pivotOffset.x;
        vy -= pivotOffset.y;
        vz -= pivotOffset.z;
      }

      positions.push(vx, vy, vz);
      uvs.push(u, t);
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * stride + j;
      const b = (i + 1) * stride + j;
      const c = (i + 1) * stride + (j + 1);
      const d = i * stride + (j + 1);
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function createSculptedGeometries() {
  // 1. Two-Segment Wave-Articulated S-Curled Nine-Tail Geometry
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0, 0.0),
    new THREE.Vector3(0, 0.24, -0.10),
    new THREE.Vector3(0, 0.56, -0.15),
    new THREE.Vector3(0, 0.84, -0.05),
    new THREE.Vector3(0, 0.94, 0.13),
    new THREE.Vector3(0, 0.80, 0.23),
  ]);
  const tailRadiusFn = (t: number, theta: number): [number, number] => {
    const baseEnv = Math.sin(Math.pow(t, 0.72) * Math.PI * 0.96);
    const r = 0.042 * (1 - t) + 0.142 * baseEnv + 0.004;
    const furFlute = 1 + 0.075 * Math.cos(theta * 6 + t * 5);
    return [r * 0.96 * furFlute, r * 1.06 * furFlute];
  };
  const midPivotVec = tailCurve.getPoint(TAIL_SPLIT_T);
  const tailLowerGeo = buildSculptedTube(
    tailCurve,
    tailRadiusFn,
    16,
    16,
    true,
    0,
    TAIL_SPLIT_T + 0.04
  );
  const tailUpperGeo = buildSculptedTube(
    tailCurve,
    tailRadiusFn,
    14,
    16,
    true,
    TAIL_SPLIT_T,
    1.0,
    midPivotVec
  );

  // 2. Curved Game-Style Fur Lock Geometry
  const lockCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0, 0.0),
    new THREE.Vector3(0, -0.11, 0.04),
    new THREE.Vector3(0, -0.23, 0.02),
    new THREE.Vector3(0, -0.34, -0.03),
  ]);
  const furLockGeo = buildSculptedTube(
    lockCurve,
    (t) => {
      const env = Math.sin(Math.min(1, t * 0.92 + 0.15) * Math.PI);
      const taper = Math.pow(1 - t, 0.72);
      const r = 0.064 * env * (0.45 + 0.55 * taper) + 0.002;
      return [r * 1.18, r * 0.72];
    },
    14,
    10,
    true
  );

  // 3. Curved Faceted Azurite Horns
  const hornCurveRight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0, 0.0),
    new THREE.Vector3(0.02, 0.14, 0.015),
    new THREE.Vector3(0.005, 0.27, -0.025),
    new THREE.Vector3(-0.035, 0.39, -0.06),
  ]);
  const hornRightGeo = buildSculptedTube(
    hornCurveRight,
    (t, theta) => {
      const segPulse = 1 + 0.12 * Math.sin(t * Math.PI * 5);
      const r = (0.062 * Math.pow(1 - t, 0.8) + 0.003) * segPulse;
      const ridge = 1 + 0.08 * Math.cos(theta * 3);
      return [r * ridge, r * 0.92];
    },
    14,
    6,
    false
  );
  const hornLeftGeo = mirrorGeometryX(hornRightGeo);

  // 4. Scalloped 3-Bay Fairy-Dragon Wing Membranes
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.quadraticCurveTo(-0.26, 0.34, -0.66, 0.56);
  wingShape.quadraticCurveTo(-0.56, 0.36, -0.58, 0.18);
  wingShape.quadraticCurveTo(-0.46, 0.14, -0.45, -0.01);
  wingShape.quadraticCurveTo(-0.30, 0.02, -0.22, -0.10);
  wingShape.quadraticCurveTo(-0.10, -0.04, 0, 0);
  const wingMembraneLeftGeo = new THREE.ShapeGeometry(wingShape, 14);
  const uvAttr = wingMembraneLeftGeo.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < uvAttr.count; i++) {
    const ux = uvAttr.getX(i);
    const uy = uvAttr.getY(i);
    uvAttr.setXY(i, THREE.MathUtils.clamp((ux + 0.68) / 0.7, 0, 1), THREE.MathUtils.clamp((uy + 0.12) / 0.7, 0, 1));
  }
  const wingMembraneRightGeo = mirrorGeometryX(wingMembraneLeftGeo);

  const leadingSparCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.20, 0.25, -0.02),
    new THREE.Vector3(-0.44, 0.42, -0.05),
    new THREE.Vector3(-0.67, 0.57, -0.08),
  ]);
  const leadingSparLeftGeo = buildSculptedTube(
    leadingSparCurve,
    (t) => {
      const r = 0.024 * (1 - t * 0.78) + 0.005;
      return [r, r];
    },
    14,
    8,
    false
  );
  const leadingSparRightGeo = mirrorGeometryX(leadingSparLeftGeo);

  // Winged Black Eyelash Arcs
  const lashCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.078, 0.012, 0.006),
    new THREE.Vector3(-0.032, 0.068, 0.018),
    new THREE.Vector3(0.035, 0.068, 0.014),
    new THREE.Vector3(0.086, 0.026, -0.004),
    new THREE.Vector3(0.118, 0.058, -0.018),
  ]);
  const rightEyelashGeo = buildSculptedTube(
    lashCurve,
    (t) => {
      const r = 0.014 * Math.sin(Math.min(1, t * 0.92 + 0.1) * Math.PI) + (t > 0.72 ? 0.004 : 0.003);
      return [r, r * 0.7];
    },
    14,
    8,
    false
  );
  const leftEyelashGeo = mirrorGeometryX(rightEyelashGeo);

  // Curved Black Cheek Whisker Stripes
  const cheekStripeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.042, -0.012, -0.012),
    new THREE.Vector3(-0.085, -0.032, -0.036),
  ]);
  const cheekStripeLeftGeo = buildSculptedTube(
    cheekStripeCurve,
    (t) => {
      const r = 0.0075 * (1 - t * 0.85) + 0.0015;
      return [r, r * 0.65];
    },
    8,
    6,
    false
  );
  const cheekStripeRightGeo = mirrorGeometryX(cheekStripeLeftGeo);

  const diamondCrystalGeo = new THREE.OctahedronGeometry(0.062, 0);

  const star4Shape = new THREE.Shape();
  star4Shape.moveTo(0, 0.055);
  star4Shape.quadraticCurveTo(0.01, 0.01, 0.055, 0);
  star4Shape.quadraticCurveTo(0.01, -0.01, 0, -0.055);
  star4Shape.quadraticCurveTo(-0.01, -0.01, -0.055, 0);
  star4Shape.quadraticCurveTo(-0.01, 0.01, 0, 0.055);
  const star4Geo = new THREE.ShapeGeometry(star4Shape, 6);

  return {
    tailLowerGeo,
    tailUpperGeo,
    midPivot: [midPivotVec.x, midPivotVec.y, midPivotVec.z] as [number, number, number],
    furLockGeo,
    hornRightGeo,
    hornLeftGeo,
    wingMembraneLeftGeo,
    wingMembraneRightGeo,
    leadingSparLeftGeo,
    leadingSparRightGeo,
    rightEyelashGeo,
    leftEyelashGeo,
    cheekStripeLeftGeo,
    cheekStripeRightGeo,
    diamondCrystalGeo,
    star4Geo,
  };
}

/* ─── WebGL Error Boundary ────────────────────────────────────────────────── */
class CanvasErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/* ─── 3D Game-Style Magical Kitsune Model ─────────────────────────────────── */
function AzuriteModel({ runtime }: { runtime: React.MutableRefObject<SharedRuntimeRef> }) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const auraRingRef = useRef<THREE.Mesh>(null);
  const auraLightRef = useRef<THREE.PointLight>(null);

  // 2-Joint Articulated Legs (Shoulder/Hip + Lower Shin/Paw)
  const flLegRef = useRef<THREE.Group>(null);
  const frLegRef = useRef<THREE.Group>(null);
  const blLegRef = useRef<THREE.Group>(null);
  const brLegRef = useRef<THREE.Group>(null);
  const flLowerRef = useRef<THREE.Group>(null);
  const frLowerRef = useRef<THREE.Group>(null);
  const blLowerRef = useRef<THREE.Group>(null);
  const brLowerRef = useRef<THREE.Group>(null);

  // Expressive anime eyes & mouth refs
  const leftOpenEyeRef = useRef<THREE.Group>(null);
  const rightOpenEyeRef = useRef<THREE.Group>(null);
  const leftHappyEyeRef = useRef<THREE.Mesh>(null);
  const rightHappyEyeRef = useRef<THREE.Mesh>(null);
  const leftPupilGroupRef = useRef<THREE.Group>(null);
  const rightPupilGroupRef = useRef<THREE.Group>(null);
  const leftStarGlintRef = useRef<THREE.Mesh>(null);
  const rightStarGlintRef = useRef<THREE.Mesh>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const leftEyelashRef = useRef<THREE.Mesh>(null);
  const rightEyelashRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  const openMouthGroupRef = useRef<THREE.Group>(null);
  const happySmileGroupRef = useRef<THREE.Group>(null);
  const tongueRef = useRef<THREE.Mesh>(null);

  // Multi-segment tail wave refs (base + upper scroll tip)
  const tailBaseRefs = useRef<(THREE.Group | null)[]>([]);
  const tailTipRefs = useRef<(THREE.Group | null)[]>([]);
  const sparkleRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Smooth interpolated facial, saccade & physics states kept in local refs (zero React re-renders)
  const animStateRef = useRef({
    blinkTimer: 2.3,
    doubleBlinkPending: false,
    saccadeTimer: 1.5,
    saccadeX: 0,
    saccadeY: 0,
    smoothYaw: 0,
    smoothHeadYaw: 0,
    smoothHeadPitch: 0,
    smoothHeadRoll: 0,
    smoothLookX: 0,
    smoothLookY: 0,
    smoothEyeOpenL: 1,
    smoothEyeOpenR: 1,
    smoothLidY: 0,
    smoothPupilScale: 1,
    smoothStarScale: 0.001,
    smoothBrowY: 0.145,
    smoothBrowTilt: -0.08,
    smoothMouthOpen: 1,
    smoothSmileOpen: 0.001,
    smoothBlush: 0.2,
    smoothGlow: 0.3,
    smoothBankRoll: 0,
    smoothInertiaPitch: 0,
    smoothInertiaYaw: 0,
  });

  const geos = useMemo(() => createSculptedGeometries(), []);

  const assets = useMemo(() => {
    const headFurTex = createHeadFurTexture();
    const bodyFurTex = createBodyFurTexture();
    const tailFurTex = createTailFurTexture();
    const legFurTex = createLegFurTexture();
    const earFurTex = createEarFurTexture();
    const chestLockTex = createChestLockTexture();
    const crystalTex = createStarryCrystalTexture();
    const irisTex = createIrisTexture();
    const wingWebTex = createWingWebTexture();
    const auraRuneTex = createAuraRuneTexture();

    const headFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: headFurTex,
        roughness: 0.72,
        metalness: 0.02,
        emissive: new THREE.Color("#dbeafe"),
        emissiveIntensity: 0.1,
      }),
      "#7dd3fc",
      0.32
    );
    const bodyFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: bodyFurTex,
        roughness: 0.7,
        metalness: 0.03,
        emissive: new THREE.Color("#bfdbfe"),
        emissiveIntensity: 0.09,
      }),
      "#a5b4fc",
      0.34
    );
    const snowFur = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#f5f9ff"),
        roughness: 0.72,
        metalness: 0.02,
        emissive: new THREE.Color("#dbeafe"),
        emissiveIntensity: 0.12,
      }),
      "#bae6fd",
      0.28
    );
    const pastelBlueFur = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#a8e0ff"),
        roughness: 0.7,
        metalness: 0.03,
        emissive: new THREE.Color("#7dd3fc"),
        emissiveIntensity: 0.12,
      }),
      "#7dd3fc",
      0.34
    );
    const chestLockMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: chestLockTex,
        roughness: 0.68,
        metalness: 0.03,
        emissive: new THREE.Color("#bae6fd"),
        emissiveIntensity: 0.1,
      }),
      "#93c5fd",
      0.32
    );
    const tailFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: tailFurTex,
        roughness: 0.68,
        metalness: 0.04,
        emissive: new THREE.Color("#93c5fd"),
        emissiveIntensity: 0.08,
      }),
      "#a855f7",
      0.36
    );
    const legFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: legFurTex,
        roughness: 0.66,
        metalness: 0.05,
        emissive: new THREE.Color("#a5b4fc"),
        emissiveIntensity: 0.06,
      }),
      "#818cf8",
      0.28
    );
    const earFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: earFurTex,
        roughness: 0.68,
        metalness: 0.04,
        emissive: new THREE.Color("#a5b4fc"),
        emissiveIntensity: 0.08,
      }),
      "#a855f7",
      0.32
    );
    const innerEarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#d8b4fe"),
      roughness: 0.68,
      emissive: new THREE.Color("#a855f7"),
      emissiveIntensity: 0.12,
    });
    const wingSparMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#dcd6fe"),
      roughness: 0.42,
      metalness: 0.08,
      emissive: new THREE.Color("#93c5fd"),
      emissiveIntensity: 0.18,
    });
    const wingMembraneMat = new THREE.MeshPhysicalMaterial({
      map: wingWebTex,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 0.85,
      envMapIntensity: 1.3,
      emissive: new THREE.Color("#7dd3fc"),
      emissiveIntensity: 0.16,
      transparent: true,
      opacity: 0.84,
      side: THREE.DoubleSide,
    });
    const starryHornMat = new THREE.MeshPhysicalMaterial({
      map: crystalTex,
      roughness: 0.12,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.55,
      emissive: new THREE.Color("#6366f1"),
      emissiveIntensity: 0.28,
      flatShading: true,
    });
    const jetBlack = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#111018"),
      roughness: 0.48,
      metalness: 0.1,
    });
    const irisMat = new THREE.MeshBasicMaterial({
      map: irisTex,
    });
    const corneaMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#ffffff"),
      roughness: 0.03,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      envMapIntensity: 1.85,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const eyeshadowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c4b5fd"),
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const pupilMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#150724"),
    });
    const catchlightMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
    });
    const starGlintMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#fdf4ff"),
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const mouthInterior = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#2b1038"),
      side: THREE.DoubleSide,
    });
    const tongueMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f472b6"),
      roughness: 0.45,
      emissive: new THREE.Color("#ec4899"),
      emissiveIntensity: 0.15,
    });

    const auraRingMat = new THREE.MeshBasicMaterial({
      map: auraRuneTex,
      color: new THREE.Color("#bae6fd"),
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    return {
      textures: [
        headFurTex,
        bodyFurTex,
        tailFurTex,
        legFurTex,
        earFurTex,
        chestLockTex,
        crystalTex,
        irisTex,
        wingWebTex,
        auraRuneTex,
      ],
      materials: [
        headFurMat,
        bodyFurMat,
        snowFur,
        pastelBlueFur,
        wingSparMat,
        wingMembraneMat,
        chestLockMat,
        tailFurMat,
        legFurMat,
        earFurMat,
        innerEarMat,
        starryHornMat,
        jetBlack,
        irisMat,
        corneaMat,
        eyeshadowMat,
        pupilMat,
        catchlightMat,
        starGlintMat,
        mouthInterior,
        tongueMat,
        auraRingMat,
      ],
      headFurMat,
      bodyFurMat,
      snowFur,
      pastelBlueFur,
      wingSparMat,
      wingMembraneMat,
      chestLockMat,
      tailFurMat,
      legFurMat,
      earFurMat,
      innerEarMat,
      starryHornMat,
      jetBlack,
      irisMat,
      corneaMat,
      eyeshadowMat,
      pupilMat,
      catchlightMat,
      starGlintMat,
      mouthInterior,
      tongueMat,
      auraRingMat,
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(geos).forEach((g) => {
        if (g instanceof THREE.BufferGeometry) g.dispose();
      });
      assets.textures.forEach((t) => t.dispose());
      assets.materials.forEach((m) => m.dispose());
    };
  }, [assets, geos]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const rt = runtime.current;
    const s = animStateRef.current;

    const expr = rt.expression;
    const trick = rt.trick;
    const trickProg = rt.trickDuration > 0 ? Math.max(0, 1 - rt.trickTimer / rt.trickDuration) : 0;
    const isTrickSpin = trick === "spinJump";
    const isTrickFlare = trick === "crystalFlare";
    const isTrickBow = trick === "playBow";
    const isTrickFlutter = trick === "wingFlutter";

    const idleAct = rt.idleAction;
    const idleProg =
      rt.idleActionDuration > 0 ? Math.max(0, 1 - rt.idleActionTimer / rt.idleActionDuration) : 0;
    const isGrooming = idleAct === "groomPaw";
    const isShaking = idleAct === "fluffShake";

    const kFast = Math.min(1, dt * 14);
    const kSmooth = Math.min(1, dt * 8);
    const kSlow = Math.min(1, dt * 5.5);

    // Smooth body yaw + motion velocity banking & drag inertia
    let yawDiff = rt.facingYaw - s.smoothYaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    s.smoothYaw += yawDiff * Math.min(1, dt * 6.5);

    const targetBankRoll = rt.isDragging
      ? THREE.MathUtils.clamp(-rt.lateralVelX * 0.24, -0.26, 0.26)
      : rt.isWalking
        ? THREE.MathUtils.clamp(-rt.lateralVelX * 0.14, -0.14, 0.14)
        : 0;
    const targetInertiaPitch = rt.isDragging
      ? THREE.MathUtils.clamp(rt.lateralVelY * 0.2, -0.22, 0.22)
      : 0;
    const targetInertiaYaw = rt.isDragging ? THREE.MathUtils.clamp(rt.lateralVelX * 0.22, -0.26, 0.26) : 0;
    s.smoothBankRoll = THREE.MathUtils.lerp(s.smoothBankRoll, targetBankRoll, kSmooth);
    s.smoothInertiaPitch = THREE.MathUtils.lerp(s.smoothInertiaPitch, targetInertiaPitch, kSmooth);
    s.smoothInertiaYaw = THREE.MathUtils.lerp(s.smoothInertiaYaw, targetInertiaYaw, kSmooth);

    // 1. Root bounce, 3-stage tricks, walking gait heave & landing squash-stretch
    const gaitFreq = 10.5;
    const gaitPhase = t * gaitFreq;
    if (rootRef.current) {
      let yOffset = 0;
      let xOffset = 0;
      let spinAngle = 0;
      let tiltX = 0;
      let tiltZ = 0;
      let scaleY = 1;
      let scaleXZ = 1;

      if (rt.isDragging) {
        yOffset = 0.05 + Math.sin(t * 7.2) * 0.022;
        tiltZ = s.smoothBankRoll + Math.sin(t * 5.5) * 0.04;
        tiltX = s.smoothInertiaPitch + 0.08;
      } else if (isTrickSpin) {
        // 3-Stage SpinJump: 0..0.18 anticipation crouch -> 0.18..0.84 corkscrew jump -> 0.84..1.00 landing squash
        if (trickProg < 0.18) {
          const p = trickProg / 0.18;
          const crouch = Math.sin(p * Math.PI);
          yOffset = -0.07 * crouch;
          tiltX = 0.14 * crouch;
          scaleY = 1 - 0.12 * crouch;
          scaleXZ = 1 + 0.07 * crouch;
        } else if (trickProg < 0.84) {
          const p = (trickProg - 0.18) / 0.66;
          yOffset = Math.sin(p * Math.PI) * 0.42;
          spinAngle = THREE.MathUtils.smoothstep(p, 0, 1) * Math.PI * 2;
          tiltX = Math.sin(p * Math.PI) * 0.22;
          scaleY = 1 + Math.sin(p * Math.PI) * 0.06;
          scaleXZ = 1 - Math.sin(p * Math.PI) * 0.03;
        } else {
          const p = (trickProg - 0.84) / 0.16;
          const land = Math.sin(p * Math.PI);
          yOffset = -0.05 * land;
          scaleY = 1 - 0.13 * land;
          scaleXZ = 1 + 0.08 * land;
        }
      } else if (isTrickFlutter) {
        // Figure-eight hovering flight
        const env = Math.sin(trickProg * Math.PI);
        yOffset = (0.18 + Math.sin(t * 9) * 0.05) * env;
        xOffset = Math.sin(t * 4.5) * 0.06 * env;
        tiltX = 0.09 * env;
        tiltZ = -Math.cos(t * 4.5) * 0.08 * env;
      } else if (isTrickBow) {
        // Authentic fox play-bow: front dipped down, rear wags happily
        const env = Math.sin(trickProg * Math.PI);
        yOffset = Math.abs(Math.sin(t * 6.5)) * 0.03;
        tiltX = 0.22 * env;
      } else if (isTrickFlare) {
        const env = Math.sin(trickProg * Math.PI);
        yOffset = 0.11 * env + Math.sin(t * 5) * 0.02;
        tiltX = -0.08 * env;
      } else if (rt.isWalking) {
        // Double-beat quadruped trot bounce + spine roll
        yOffset = Math.abs(Math.sin(gaitPhase)) * 0.055 * (0.4 + rt.moveSpeed * 0.6);
        tiltX = Math.sin(gaitPhase * 2) * 0.025 + rt.moveSpeed * 0.06;
        tiltZ = s.smoothBankRoll + Math.cos(gaitPhase) * 0.035;
      } else if (expr === "surprised") {
        yOffset = Math.abs(Math.sin(t * 10)) * 0.07;
        tiltX = -0.08;
      } else if (expr === "sleepy") {
        yOffset = -0.05 + Math.sin(t * 1.25) * 0.01;
        tiltX = 0.06;
      } else {
        yOffset = Math.sin(t * 2.2) * 0.018 + rt.scrollImpulse * 0.11;
      }

      // Soft post-drag landing squash-and-stretch
      if (rt.landingTimer > 0) {
        const lp = 1 - rt.landingTimer / 0.45;
        const bounce = Math.sin(lp * Math.PI * 2) * (1 - lp);
        scaleY *= 1 - bounce * 0.14;
        scaleXZ *= 1 + bounce * 0.09;
        yOffset -= Math.max(0, bounce) * 0.04;
      }

      rootRef.current.position.set(xOffset, -0.26 + yOffset, 0);
      rootRef.current.rotation.y = s.smoothYaw + spinAngle + s.smoothInertiaYaw * 0.45;
      rootRef.current.rotation.x = tiltX;
      rootRef.current.rotation.z = tiltZ;
      rootRef.current.scale.set(0.85 * scaleXZ, 0.85 * scaleY, 0.85 * scaleXZ);
    }

    // 2. Torso organic breathing, purr micro-vibration & fluffShake
    if (bodyRef.current) {
      const breathFreq = expr === "sleepy" ? 1.25 : rt.isPetting ? 4.4 : 2.8;
      const breathAmp = expr === "sleepy" ? 0.026 : rt.isPetting ? 0.022 : 0.014;
      const breath = Math.sin(t * breathFreq) * breathAmp;
      const bowStretch = isTrickBow ? Math.sin(trickProg * Math.PI) * 0.06 : 0;
      const purrVib = rt.isPetting ? Math.sin(t * 44) * 0.004 : 0;
      const shakeRotZ = isShaking ? Math.sin(t * 36) * Math.sin(idleProg * Math.PI) * 0.14 : 0;

      bodyRef.current.scale.set(1 + breath * 0.55 + purrVib, 1 - breath * 0.4, 1 + breath * 0.55 + bowStretch);
      bodyRef.current.rotation.z = shakeRotZ;
    }

    // 3. Head cursor/touch tracking, natural saccades, groom tilt & fur shake
    if (performance.now() - rt.lastPointerMoveAt > 1400) {
      s.saccadeTimer -= dt;
      if (s.saccadeTimer <= 0) {
        s.saccadeTimer = 1.6 + Math.random() * 2.2;
        s.saccadeX = (Math.random() - 0.5) * 0.42;
        s.saccadeY = (Math.random() - 0.5) * 0.24;
      }
    } else {
      s.saccadeX = 0;
      s.saccadeY = 0;
    }

    const rawYaw = THREE.MathUtils.clamp(rt.pointerX * 0.44 + s.saccadeX * 0.35, -0.45, 0.45);
    const rawPitch = THREE.MathUtils.clamp(-rt.pointerY * 0.26 - s.saccadeY * 0.25, -0.28, 0.26);
    s.smoothHeadYaw = THREE.MathUtils.lerp(s.smoothHeadYaw, rawYaw, kSmooth);
    s.smoothHeadPitch = THREE.MathUtils.lerp(s.smoothHeadPitch, rawPitch, kSmooth);

    let targetRollZ = 0;
    let extraHeadPitch = 0;
    let extraHeadYaw = 0;
    if (expr === "curious") targetRollZ = Math.sin(t * 1.4) * 0.065 + (rt.pointerX >= 0 ? -0.07 : 0.07);
    if (expr === "happy" || rt.isPetting) targetRollZ = Math.sin(t * 4.8) * 0.095;
    if (expr === "playful") targetRollZ = -0.15;
    if (expr === "surprised") extraHeadPitch = -0.14;
    if (expr === "sleepy") {
      extraHeadPitch = 0.2 + Math.sin(t * 1.25) * 0.03;
      targetRollZ = Math.sin(t * 0.7) * 0.05;
    }
    if (isGrooming) {
      const gEnv = Math.sin(idleProg * Math.PI);
      extraHeadPitch = 0.22 * gEnv;
      extraHeadYaw = 0.24 * gEnv;
      targetRollZ = 0.16 * gEnv;
    }
    if (isShaking) {
      const shEnv = Math.sin(idleProg * Math.PI);
      targetRollZ = Math.sin(t * 42) * 0.26 * shEnv;
    }
    s.smoothHeadRoll = THREE.MathUtils.lerp(s.smoothHeadRoll, targetRollZ, kSmooth);

    if (headRef.current) {
      headRef.current.rotation.y = s.smoothHeadYaw * 0.74 + extraHeadYaw;
      headRef.current.rotation.x = s.smoothHeadPitch + extraHeadPitch;
      headRef.current.rotation.z = s.smoothHeadRoll;
    }

    // 4. Independent "Radar" Ear Tracking & Expressive Ear Postures
    const earBaseAngle = expr === "surprised" || expr === "excited" ? 0.34 : expr === "sleepy" ? 0.62 : expr === "happy" ? 0.52 : 0.44;
    const earFlattenX = expr === "sleepy" ? 0.22 : rt.isPetting ? 0.12 : expr === "surprised" ? -0.12 : 0;
    const earTwitchL = Math.sin(t * 9.5) > 0.94 || isShaking ? Math.sin(t * 40) * 0.16 : 0;
    const earTwitchR = Math.cos(t * 8.3) > 0.95 || isShaking ? Math.cos(t * 40) * 0.14 : 0;
    if (leftEarRef.current) {
      leftEarRef.current.rotation.z = THREE.MathUtils.lerp(leftEarRef.current.rotation.z, earBaseAngle + earTwitchL, kSmooth);
      leftEarRef.current.rotation.x = THREE.MathUtils.lerp(leftEarRef.current.rotation.x, earFlattenX + s.smoothHeadPitch * 0.35, kSmooth);
      leftEarRef.current.rotation.y = THREE.MathUtils.lerp(leftEarRef.current.rotation.y, 0.14 + Math.max(0, -rt.pointerX) * 0.18, kSlow);
    }
    if (rightEarRef.current) {
      rightEarRef.current.rotation.z = THREE.MathUtils.lerp(rightEarRef.current.rotation.z, -earBaseAngle - earTwitchR, kSmooth);
      rightEarRef.current.rotation.x = THREE.MathUtils.lerp(rightEarRef.current.rotation.x, earFlattenX + s.smoothHeadPitch * 0.35, kSmooth);
      rightEarRef.current.rotation.y = THREE.MathUtils.lerp(rightEarRef.current.rotation.y, -0.14 - Math.max(0, rt.pointerX) * 0.18, kSlow);
    }

    // 5. Articulated Wing Flight & Feathering
    const wingSpeed =
      isTrickFlutter || isTrickSpin || rt.scrollImpulse > 0.15
        ? 18.5
        : rt.isPetting || expr === "excited"
          ? 10.5
          : expr === "sleepy"
            ? 1.5
            : 2.8;
    const wingAmp =
      isTrickFlutter || isTrickSpin || rt.scrollImpulse > 0.15
        ? 0.48
        : rt.isPetting || expr === "excited"
          ? 0.28
          : expr === "sleepy"
            ? 0.04
            : 0.085;
    const flap = Math.sin(t * wingSpeed) * wingAmp;
    const wingSpreadY = isTrickFlare ? 0.16 * Math.sin(trickProg * Math.PI) : 0;
    if (leftWingRef.current) {
      leftWingRef.current.rotation.y = 0.34 + flap + wingSpreadY;
      leftWingRef.current.rotation.z = 0.04 + flap * 0.24;
      leftWingRef.current.rotation.x = 0.08 + Math.cos(t * wingSpeed) * (wingAmp * 0.18);
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.y = -0.34 - flap - wingSpreadY;
      rightWingRef.current.rotation.z = -0.04 - flap * 0.24;
      rightWingRef.current.rotation.x = 0.08 + Math.cos(t * wingSpeed) * (wingAmp * 0.18);
    }

    // 6. 2-Joint Articulated Legs (Realistic Diagonal Trot + Play Bow Wave + Groom Paw + Drag Inertia)
    if (
      flLegRef.current &&
      frLegRef.current &&
      blLegRef.current &&
      brLegRef.current &&
      flLowerRef.current &&
      frLowerRef.current &&
      blLowerRef.current &&
      brLowerRef.current
    ) {
      let flU = 0,
        flL = 0,
        flZ = 0;
      let frU = 0,
        frL = 0,
        frZ = 0;
      let blU = -0.14,
        blL = 0.14;
      let brU = -0.14,
        brL = 0.14;

      if (rt.isDragging) {
        const sway = Math.sin(t * 8.5) * 0.22;
        const lagX = rt.lateralVelY * 0.32;
        flU = 0.28 + sway + lagX;
        frU = 0.28 - sway + lagX;
        blU = 0.36 - sway * 0.8 + lagX;
        brU = 0.36 + sway * 0.8 + lagX;
        flL = 0.35 + Math.cos(t * 8.5) * 0.18;
        frL = 0.35 - Math.cos(t * 8.5) * 0.18;
        blL = 0.32;
        brL = 0.32;
      } else if (isTrickSpin) {
        const tuck = trickProg > 0.18 && trickProg < 0.84 ? Math.sin(((trickProg - 0.18) / 0.66) * Math.PI) : 0;
        flU = -0.35 * tuck;
        frU = -0.35 * tuck;
        blU = -0.4 * tuck;
        brU = -0.4 * tuck;
        flL = 0.85 * tuck;
        frL = 0.85 * tuck;
        blL = 0.75 * tuck;
        brL = 0.75 * tuck;
      } else if (isTrickBow) {
        const env = Math.sin(trickProg * Math.PI);
        // Front-left stretched into play-bow stance; front-right lifted high & waving!
        flU = -0.35 * env;
        flL = 0.25 * env;
        frU = (-0.95 + Math.sin(t * 14) * 0.25) * env;
        frL = (0.75 + Math.cos(t * 14) * 0.3) * env;
        frZ = -0.22 * env;
        blU = 0.22 * env;
        brU = 0.22 * env;
      } else if (isGrooming) {
        const gEnv = Math.sin(idleProg * Math.PI);
        // Lift front-left paw smoothly toward muzzle for adorable grooming lick
        flU = -0.92 * gEnv;
        flL = (1.12 + Math.sin(t * 11) * 0.14) * gEnv;
        flZ = -0.18 * gEnv;
      } else if (rt.isWalking) {
        // True diagonal quadruped trot (FL+BR paired vs FR+BL paired) with ankle lift on forward swing
        const amp = 0.44 * (0.45 + rt.moveSpeed * 0.55);
        const sA = Math.sin(gaitPhase);
        const cA = Math.cos(gaitPhase);
        const sB = Math.sin(gaitPhase + Math.PI);
        const cB = Math.cos(gaitPhase + Math.PI);

        flU = sA * amp;
        flL = Math.max(0, cA) * 0.68;
        brU = sA * amp * 0.9;
        brL = Math.max(0, -cA) * 0.55;

        frU = sB * amp;
        frL = Math.max(0, cB) * 0.68;
        blU = sB * amp * 0.9;
        blL = Math.max(0, -cB) * 0.55;
      } else if (expr === "sleepy") {
        // Cozy tucked loaf posture
        flU = -0.55;
        flL = 0.95;
        frU = -0.55;
        frL = 0.95;
        blU = -0.45;
        blL = 0.72;
        brU = -0.45;
        brL = 0.72;
      } else if (expr === "playful") {
        // Playful lowered chest ready-to-pounce stance
        flU = -0.28;
        flL = 0.32;
        frU = -0.22;
        frL = 0.26;
      } else {
        const micro = Math.sin(t * 2.2) * 0.025;
        flU = micro;
        frU = -micro;
      }

      const lk = Math.min(1, dt * 12);
      flLegRef.current.rotation.x = THREE.MathUtils.lerp(flLegRef.current.rotation.x, flU, lk);
      flLegRef.current.rotation.z = THREE.MathUtils.lerp(flLegRef.current.rotation.z, flZ, lk);
      frLegRef.current.rotation.x = THREE.MathUtils.lerp(frLegRef.current.rotation.x, frU, lk);
      frLegRef.current.rotation.z = THREE.MathUtils.lerp(frLegRef.current.rotation.z, frZ, lk);
      blLegRef.current.rotation.x = THREE.MathUtils.lerp(blLegRef.current.rotation.x, blU, lk);
      brLegRef.current.rotation.x = THREE.MathUtils.lerp(brLegRef.current.rotation.x, brU, lk);

      flLowerRef.current.rotation.x = THREE.MathUtils.lerp(flLowerRef.current.rotation.x, flL, lk);
      frLowerRef.current.rotation.x = THREE.MathUtils.lerp(frLowerRef.current.rotation.x, frL, lk);
      blLowerRef.current.rotation.x = THREE.MathUtils.lerp(blLowerRef.current.rotation.x, blL, lk);
      brLowerRef.current.rotation.x = THREE.MathUtils.lerp(brLowerRef.current.rotation.x, brL, lk);
    }

    // 7. Smooth Interpolated Facial Rig (Double-Blinks, Starlight Glints, Morphing Mouth & Lashes)
    s.blinkTimer -= dt;
    if (s.blinkTimer < -0.14) {
      if (s.doubleBlinkPending) {
        s.doubleBlinkPending = false;
        s.blinkTimer = 0.14;
      } else {
        s.doubleBlinkPending = Math.sin(t * 11.7) > 0.45;
        s.blinkTimer = 2.6 + (Math.sin(t * 17.3) + 1) * 1.4;
      }
    }
    const isBlinking = s.blinkTimer <= 0 && expr !== "happy" && expr !== "surprised";

    const targetOpenL = expr === "happy" || expr === "playful" ? 0 : 1;
    const targetOpenR = expr === "happy" ? 0 : 1;
    s.smoothEyeOpenL = THREE.MathUtils.lerp(s.smoothEyeOpenL, targetOpenL, kFast);
    s.smoothEyeOpenR = THREE.MathUtils.lerp(s.smoothEyeOpenR, targetOpenR, kFast);

    if (leftOpenEyeRef.current && leftHappyEyeRef.current) {
      leftOpenEyeRef.current.visible = s.smoothEyeOpenL > 0.12;
      leftOpenEyeRef.current.scale.y = Math.max(0.15, s.smoothEyeOpenL);
      leftHappyEyeRef.current.visible = s.smoothEyeOpenL < 0.55;
      leftHappyEyeRef.current.scale.setScalar(1 - s.smoothEyeOpenL * 0.45);
    }
    if (rightOpenEyeRef.current && rightHappyEyeRef.current) {
      rightOpenEyeRef.current.visible = s.smoothEyeOpenR > 0.12;
      rightOpenEyeRef.current.scale.y = Math.max(0.15, s.smoothEyeOpenR);
      rightHappyEyeRef.current.visible = s.smoothEyeOpenR < 0.55;
      rightHappyEyeRef.current.scale.setScalar(1 - s.smoothEyeOpenR * 0.45);
    }

    const targetLidClose = isBlinking ? 1.0 : expr === "sleepy" ? 0.58 : isGrooming ? 0.5 : 0.0;
    s.smoothLidY = THREE.MathUtils.lerp(s.smoothLidY, targetLidClose, Math.min(1, dt * 20));
    const showLid = s.smoothLidY > 0.015;
    if (leftEyelidRef.current) {
      leftEyelidRef.current.visible = showLid;
      leftEyelidRef.current.scale.set(1.18, Math.max(0.01, s.smoothLidY), 0.16);
      leftEyelidRef.current.position.y = 0.088 * (1 - s.smoothLidY);
    }
    if (rightEyelidRef.current) {
      rightEyelidRef.current.visible = showLid;
      rightEyelidRef.current.scale.set(1.18, Math.max(0.01, s.smoothLidY), 0.16);
      rightEyelidRef.current.position.y = 0.088 * (1 - s.smoothLidY);
    }
    if (leftEyelashRef.current) {
      leftEyelashRef.current.position.y = -0.125 * s.smoothLidY;
      leftEyelashRef.current.scale.y = 1 - s.smoothLidY * 0.55;
    }
    if (rightEyelashRef.current) {
      rightEyelashRef.current.position.y = -0.125 * s.smoothLidY;
      rightEyelashRef.current.scale.y = 1 - s.smoothLidY * 0.55;
    }

    const targetLookX = THREE.MathUtils.clamp(rt.pointerX * 0.018 + s.saccadeX * 0.015, -0.02, 0.02);
    const targetLookY = THREE.MathUtils.clamp(-rt.pointerY * 0.013 + s.saccadeY * 0.012, -0.014, 0.014);
    s.smoothLookX = THREE.MathUtils.lerp(s.smoothLookX, targetLookX, kFast);
    s.smoothLookY = THREE.MathUtils.lerp(s.smoothLookY, targetLookY, kFast);

    const targetPupil = expr === "excited" ? 1.24 : expr === "surprised" ? 0.72 : 1.0;
    const targetStar = expr === "excited" || expr === "playful" || isTrickFlare ? 1.0 : 0.001;
    s.smoothPupilScale = THREE.MathUtils.lerp(s.smoothPupilScale, targetPupil, kSmooth);
    s.smoothStarScale = THREE.MathUtils.lerp(s.smoothStarScale, targetStar, kSmooth);

    if (leftPupilGroupRef.current) {
      leftPupilGroupRef.current.position.set(s.smoothLookX, s.smoothLookY, 0);
      leftPupilGroupRef.current.scale.setScalar(s.smoothPupilScale);
    }
    if (rightPupilGroupRef.current) {
      rightPupilGroupRef.current.position.set(s.smoothLookX, s.smoothLookY, 0);
      rightPupilGroupRef.current.scale.setScalar(s.smoothPupilScale);
    }
    if (leftStarGlintRef.current) {
      leftStarGlintRef.current.scale.setScalar(s.smoothStarScale * (0.28 + Math.sin(t * 7) * 0.05));
      leftStarGlintRef.current.rotation.z = t * 1.4;
    }
    if (rightStarGlintRef.current) {
      rightStarGlintRef.current.scale.setScalar(s.smoothStarScale * (0.28 + Math.sin(t * 7) * 0.05));
      rightStarGlintRef.current.rotation.z = -t * 1.4;
    }

    const targetBrowY = expr === "surprised" ? 0.166 : expr === "sleepy" ? 0.124 : expr === "curious" ? 0.15 : 0.145;
    const targetBrowTilt = expr === "sleepy" ? 0.2 : expr === "excited" ? -0.2 : expr === "surprised" ? -0.16 : -0.08;
    s.smoothBrowY = THREE.MathUtils.lerp(s.smoothBrowY, targetBrowY, kSmooth);
    s.smoothBrowTilt = THREE.MathUtils.lerp(s.smoothBrowTilt, targetBrowTilt, kSmooth);
    if (leftBrowRef.current) {
      leftBrowRef.current.position.y = s.smoothBrowY + (expr === "curious" ? 0.006 : 0);
      leftBrowRef.current.rotation.z = -s.smoothBrowTilt;
    }
    if (rightBrowRef.current) {
      rightBrowRef.current.position.y = s.smoothBrowY;
      rightBrowRef.current.rotation.z = s.smoothBrowTilt;
    }

    const isSmileMouth = expr === "happy" || expr === "playful";
    s.smoothMouthOpen = THREE.MathUtils.lerp(s.smoothMouthOpen, isSmileMouth ? 0.001 : 1, kFast);
    s.smoothSmileOpen = THREE.MathUtils.lerp(s.smoothSmileOpen, isSmileMouth ? 1 : 0.001, kFast);
    if (openMouthGroupRef.current) {
      openMouthGroupRef.current.visible = s.smoothMouthOpen > 0.08;
      const mScale = (expr === "surprised" ? 1.38 : expr === "excited" ? 1.24 : expr === "sleepy" ? 0.72 : 1.0) * s.smoothMouthOpen;
      openMouthGroupRef.current.scale.setScalar(Math.max(0.05, mScale));
    }
    if (happySmileGroupRef.current) {
      happySmileGroupRef.current.visible = s.smoothSmileOpen > 0.08;
      happySmileGroupRef.current.scale.setScalar(Math.max(0.05, s.smoothSmileOpen));
    }
    if (tongueRef.current) {
      tongueRef.current.visible = isSmileMouth || isTrickBow || isGrooming;
      if (tongueRef.current.visible) {
        tongueRef.current.rotation.x = 0.28 + Math.sin(t * 7.5) * 0.1;
      }
    }

    // Blush, Crystal Iridescence & Ground Rune Halo
    const boost = rt.isPetting || isTrickFlare || expr === "excited" || expr === "happy" ? 1 : 0;
    s.smoothBlush = THREE.MathUtils.lerp(s.smoothBlush, boost ? 0.52 : expr === "playful" ? 0.38 : 0.18, kSmooth);
    DYNAMIC_BLUSH_MAT.opacity = s.smoothBlush;

    const targetGlow = isTrickFlare
      ? 0.92
      : rt.isPetting || expr === "excited"
        ? 0.6
        : 0.28 + Math.sin(t * 2.4) * 0.08 + rt.burstEnergy * 0.48;
    s.smoothGlow = THREE.MathUtils.lerp(s.smoothGlow, targetGlow, kSmooth);
    DYNAMIC_CRYSTAL_MAT.emissiveIntensity = s.smoothGlow;
    DYNAMIC_CRYSTAL_TIP_MAT.emissiveIntensity = s.smoothGlow + 0.16;
    DYNAMIC_SPARKLE_MAT.opacity = 0.45 + Math.sin(t * 3.5) * 0.22 + rt.burstEnergy * 0.35;

    if (auraLightRef.current) {
      auraLightRef.current.intensity = THREE.MathUtils.lerp(
        auraLightRef.current.intensity,
        isTrickFlare ? 2.2 : rt.isPetting ? 1.5 : 0.75 + rt.burstEnergy * 0.9,
        kSmooth
      );
    }

    if (auraRingRef.current) {
      auraRingRef.current.rotation.z = t * (isTrickFlare ? 1.6 : 0.35);
      const ringScale = rt.isDragging
        ? 0.001
        : isTrickFlare
          ? 1.32
          : rt.isPetting
            ? 1.15
            : 0.96 + Math.sin(t * 2) * 0.04 + rt.burstEnergy * 0.16;
      const nextRingScale = THREE.MathUtils.lerp(auraRingRef.current.scale.x, ringScale, kSmooth);
      auraRingRef.current.scale.setScalar(nextRingScale);
      auraRingRef.current.visible = nextRingScale > 0.05;
    }

    // 8. Multi-Segment Flowing Wave on Nine Tails (Base fan + Phase-lagged Scroll Tips)
    const wagSpeed = rt.isPetting || isTrickFlare || expr === "excited" ? 5.6 : rt.isWalking ? 4.2 : expr === "sleepy" ? 1.1 : 1.9;
    const wagAmp = isTrickFlare ? 0.22 : rt.isPetting ? 0.16 : expr === "sleepy" ? 0.04 : 0.085;
    const flareSpread = isTrickFlare ? 1.15 : expr === "sleepy" ? 0.85 : 1.0;
    const inertiaDrag = s.smoothInertiaYaw * 0.35;

    for (let i = 0; i < 9; i++) {
      const cfg = TAIL_CONFIGS[i];
      const base = tailBaseRefs.current[i];
      const tip = tailTipRefs.current[i];
      const waveA = Math.sin(t * wagSpeed + cfg.phase);
      const waveLag = Math.sin(t * wagSpeed - 1.15 + cfg.phase);
      const waveCosLag = Math.cos(t * wagSpeed * 0.85 - 1.1 + cfg.phase);

      if (base) {
        base.rotation.z = cfg.fanRoll * flareSpread + waveA * (wagAmp * 0.7) - inertiaDrag;
        base.rotation.x = cfg.pitchBack + Math.cos(t * wagSpeed * 0.85 + cfg.phase) * (wagAmp * 0.6) - rt.moveSpeed * 0.12;
      }
      if (tip) {
        // Secondary whip flex along outer curled black tip + crystal crown
        tip.rotation.x = waveLag * (wagAmp * 0.75) + (isShaking ? Math.sin(t * 42 + i) * 0.16 * Math.sin(idleProg * Math.PI) : 0);
        tip.rotation.z = waveCosLag * (wagAmp * 0.55) - inertiaDrag * 0.6;
      }
    }

    // 9. 18 In-Canvas 3D Starlight & Crystal Sparkles
    const energy = rt.burstEnergy;
    const speedMul = 1 + energy * 1.9 + (rt.isPetting ? 0.8 : 0);
    for (let i = 0; i < SPARKLE_SPECS.length; i++) {
      const sp = SPARKLE_SPECS[i];
      const mesh = sparkleRefs.current[i];
      if (mesh) {
        const ang = t * sp.speed * speedMul + sp.phase;
        const rad = sp.radius + Math.sin(t * 2.2 + sp.phase) * 0.08 + energy * 0.22;
        const bobY = sp.yBase + Math.sin(t * 2.8 + sp.phase * 1.3) * 0.1 + energy * 0.18;
        mesh.position.set(Math.cos(ang) * rad, bobY, Math.sin(ang) * rad);
        mesh.rotation.y = ang * 1.4;
        mesh.rotation.z = t * 1.6 + sp.phase;
        const pulse = sp.scale * (0.78 + 0.35 * Math.sin(t * 4.5 + sp.phase) + energy * 0.48);
        mesh.scale.setScalar(pulse);
      }
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.26, 0]} scale={0.85}>
      <pointLight ref={auraLightRef} position={[0, 0.72, 1.0]} color="#93c5fd" intensity={0.75} distance={4.8} />

      {/* Ground Magical Frost & Rune Halo */}
      <mesh
        ref={auraRingRef}
        position={[0, -0.025, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={assets.auraRingMat}
      >
        <circleGeometry args={[0.5, 32]} />
      </mesh>

      {/* ── In-Canvas 3D Starlight Sparkles & Floating Shards (No Text / No Emoji) ── */}
      <group>
        {SPARKLE_SPECS.map((sp, i) => (
          <mesh
            key={i}
            ref={(el) => {
              sparkleRefs.current[i] = el;
            }}
            geometry={sp.isStar ? geos.star4Geo : geos.diamondCrystalGeo}
            material={sp.isStar ? DYNAMIC_SPARKLE_MAT : DYNAMIC_CRYSTAL_TIP_MAT}
          />
        ))}
      </group>

      {/* ── Sculpted Body, 3-Tier Chest Mane & Webbed Crystal Wings ── */}
      <group ref={bodyRef} position={[0, 0.36, 0]}>
        <mesh position={[0, 0.01, -0.05]} scale={[0.88, 0.92, 1.12]} material={assets.bodyFurMat}>
          <sphereGeometry args={[0.31, 24, 20]} />
        </mesh>
        <mesh position={[0, 0.24, 0.05]} scale={[0.96, 0.65, 0.9]} material={assets.snowFur}>
          <sphereGeometry args={[0.24, 20, 16]} />
        </mesh>

        {CHEST_LOCKS.map((lock, idx) => (
          <mesh
            key={idx}
            position={lock.pos}
            rotation={lock.rot}
            scale={lock.scale}
            geometry={geos.furLockGeo}
            material={
              lock.tier === "white"
                ? assets.snowFur
                : lock.tier === "sky"
                  ? assets.pastelBlueFur
                  : assets.chestLockMat
            }
          />
        ))}

        {/* Dorsal Lavender Mane & Crystal Cluster */}
        <group position={[0, 0.22, -0.22]}>
          <mesh position={[0, 0.08, -0.02]} rotation={[-0.65, 0, 0]} material={assets.starryHornMat}>
            <coneGeometry args={[0.055, 0.22, 6]} />
          </mesh>
          <mesh position={[-0.07, 0.04, 0.01]} rotation={[-0.55, 0, 0.42]} material={DYNAMIC_CRYSTAL_TIP_MAT}>
            <coneGeometry args={[0.036, 0.14, 6]} />
          </mesh>
          <mesh position={[0.07, 0.04, 0.01]} rotation={[-0.55, 0, -0.42]} material={DYNAMIC_CRYSTAL_TIP_MAT}>
            <coneGeometry args={[0.036, 0.14, 6]} />
          </mesh>
        </group>

        {/* Left & Right Webbed Crystal Wings */}
        <group ref={leftWingRef} position={[-0.19, 0.23, -0.14]} rotation={[0.08, 0.34, 0.04]}>
          <mesh geometry={geos.leadingSparLeftGeo} material={assets.wingSparMat} />
          {WING_FINGER_SPARS.map((f, fIdx) => (
            <mesh key={fIdx} position={f.pos} rotation={[0, 0, f.rotZ]} material={assets.wingSparMat}>
              <cylinderGeometry args={[f.radTop, 0.004, f.len, 6]} />
            </mesh>
          ))}
          <mesh geometry={geos.wingMembraneLeftGeo} material={assets.wingMembraneMat} />
          {WING_CRYSTALS.map((c, idx) => (
            <mesh
              key={idx}
              position={c.pos}
              rotation={c.rot}
              scale={c.scale}
              geometry={geos.diamondCrystalGeo}
              material={c.highlight ? DYNAMIC_CRYSTAL_TIP_MAT : DYNAMIC_CRYSTAL_MAT}
            />
          ))}
        </group>

        <group ref={rightWingRef} position={[0.19, 0.23, -0.14]} rotation={[0.08, -0.34, -0.04]}>
          <mesh geometry={geos.leadingSparRightGeo} material={assets.wingSparMat} />
          {WING_FINGER_SPARS.map((f, fIdx) => (
            <mesh
              key={fIdx}
              position={[-f.pos[0], f.pos[1], f.pos[2]]}
              rotation={[0, 0, -f.rotZ]}
              material={assets.wingSparMat}
            >
              <cylinderGeometry args={[f.radTop, 0.004, f.len, 6]} />
            </mesh>
          ))}
          <mesh geometry={geos.wingMembraneRightGeo} material={assets.wingMembraneMat} />
          {WING_CRYSTALS.map((c, idx) => (
            <mesh
              key={idx}
              position={[-c.pos[0], c.pos[1], c.pos[2]]}
              rotation={[c.rot[0], -c.rot[1], -c.rot[2]]}
              scale={c.scale}
              geometry={geos.diamondCrystalGeo}
              material={c.highlight ? DYNAMIC_CRYSTAL_TIP_MAT : DYNAMIC_CRYSTAL_MAT}
            />
          ))}
        </group>
      </group>

      {/* ── Detailed Game-Style Chibi Fox Head ── */}
      <group ref={headRef} position={[0, 0.80, 0.10]}>
        <mesh scale={[1.18, 0.96, 1.0]} material={assets.headFurMat}>
          <sphereGeometry args={[0.35, 32, 28]} />
        </mesh>
        <mesh position={[-0.17, -0.09, 0.21]} scale={[1.05, 0.86, 0.82]} material={assets.snowFur}>
          <sphereGeometry args={[0.16, 18, 14]} />
        </mesh>
        <mesh position={[0.17, -0.09, 0.21]} scale={[1.05, 0.86, 0.82]} material={assets.snowFur}>
          <sphereGeometry args={[0.16, 18, 14]} />
        </mesh>
        <mesh position={[0, -0.085, 0.27]} scale={[0.96, 0.72, 0.85]} material={assets.snowFur}>
          <sphereGeometry args={[0.145, 20, 16]} />
        </mesh>

        {CROWN_LOCKS.map((c, idx) => (
          <mesh
            key={idx}
            position={c.pos}
            rotation={c.rot}
            scale={c.scale}
            geometry={geos.furLockGeo}
            material={assets.snowFur}
          />
        ))}

        {/* Layered Cheek Ruff Plumes */}
        <group position={[-0.36, -0.03, 0.04]}>
          {CHEEK_RUFF_LOCKS.map((l, idx) => (
            <mesh
              key={idx}
              position={l.pos}
              rotation={l.rot}
              scale={l.scale}
              geometry={geos.furLockGeo}
              material={l.sky ? assets.pastelBlueFur : assets.snowFur}
            />
          ))}
        </group>
        <group position={[0.36, -0.03, 0.04]}>
          {CHEEK_RUFF_LOCKS.map((l, idx) => (
            <mesh
              key={idx}
              position={[-l.pos[0], l.pos[1], l.pos[2]]}
              rotation={[l.rot[0], -l.rot[1], -l.rot[2]]}
              scale={l.scale}
              geometry={geos.furLockGeo}
              material={l.sky ? assets.pastelBlueFur : assets.snowFur}
            />
          ))}
        </group>

        {/* Heart-Triangle Nose */}
        <mesh position={[0, -0.055, 0.396]} rotation={[0.1, 0, Math.PI]} scale={[1.25, 0.9, 0.65]} material={assets.jetBlack}>
          <coneGeometry args={[0.028, 0.034, 4]} />
        </mesh>

        {/* Default Parted ":o" / "△" Mouth */}
        <group ref={openMouthGroupRef} position={[0, -0.118, 0.390]}>
          <mesh scale={[1.2, 0.85, 0.4]} material={assets.mouthInterior}>
            <sphereGeometry args={[0.033, 14, 10]} />
          </mesh>
          <mesh position={[0, -0.011, 0.008]} scale={[1.05, 0.55, 0.45]} material={assets.tongueMat}>
            <sphereGeometry args={[0.024, 12, 8]} />
          </mesh>
        </group>

        {/* Happy ":3" Smile Mouth */}
        <group ref={happySmileGroupRef} position={[0, -0.105, 0.392]} visible={false}>
          <mesh position={[-0.022, 0, 0]} rotation={[0.1, 0, Math.PI]} material={assets.jetBlack}>
            <torusGeometry args={[0.022, 0.0055, 6, 12, Math.PI]} />
          </mesh>
          <mesh position={[0.022, 0, 0]} rotation={[0.1, 0, Math.PI]} material={assets.jetBlack}>
            <torusGeometry args={[0.022, 0.0055, 6, 12, Math.PI]} />
          </mesh>
        </group>

        {/* Animated Tongue Blep */}
        <mesh
          ref={tongueRef}
          position={[0.012, -0.138, 0.376]}
          scale={[0.8, 0.42, 1.1]}
          material={assets.tongueMat}
          visible={false}
        >
          <sphereGeometry args={[0.032, 12, 10]} />
        </mesh>

        {/* Forehead Crystal Trio + Inter-Brow Black Teardrop */}
        <group position={[0, 0.165, 0.315]} rotation={[-0.36, 0, 0]}>
          <mesh position={[0, 0.01, 0.008]} scale={[0.92, 1.48, 0.52]} geometry={geos.diamondCrystalGeo} material={assets.starryHornMat} />
          <mesh position={[-0.072, -0.022, -0.006]} rotation={[0, 0, 0.38]} scale={[0.52, 0.9, 0.4]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT} />
          <mesh position={[0.072, -0.022, -0.006]} rotation={[0, 0, -0.38]} scale={[0.52, 0.9, 0.4]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT} />
        </group>
        <mesh position={[0, 0.055, 0.348]} scale={[0.55, 1.15, 0.45]} material={assets.jetBlack}>
          <sphereGeometry args={[0.018, 10, 8]} />
        </mesh>

        {/* Curved Starry Azurite Horns + Basal Buds */}
        <group position={[-0.145, 0.25, 0.12]} rotation={[0.2, 0, 0.28]}>
          <mesh geometry={geos.hornLeftGeo} material={assets.starryHornMat} />
          <mesh position={[-0.042, 0.075, 0.015]} rotation={[0.15, 0, 0.45]} scale={[0.7, 1.15, 0.6]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT} />
          <mesh position={[0.04, 0.055, 0.025]} rotation={[0.2, 0, -0.38]} scale={[0.58, 0.95, 0.52]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_MAT} />
        </group>
        <group position={[0.145, 0.25, 0.12]} rotation={[0.2, 0, -0.28]}>
          <mesh geometry={geos.hornRightGeo} material={assets.starryHornMat} />
          <mesh position={[0.042, 0.075, 0.015]} rotation={[0.15, 0, -0.45]} scale={[0.7, 1.15, 0.6]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT} />
          <mesh position={[-0.04, 0.055, 0.025]} rotation={[0.2, 0, 0.38]} scale={[0.58, 0.95, 0.52]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_MAT} />
        </group>

        {/* Independent Articulated Ears */}
        <group ref={leftEarRef} position={[-0.25, 0.22, -0.02]} rotation={[0.06, 0.14, 0.46]}>
          <mesh position={[0, 0.21, 0]} scale={[1.08, 1.0, 0.72]} material={assets.earFurMat}>
            <coneGeometry args={[0.165, 0.44, 16]} />
          </mesh>
          <mesh position={[0.01, 0.17, 0.045]} scale={[0.76, 0.78, 0.32]} material={assets.innerEarMat}>
            <coneGeometry args={[0.13, 0.34, 14]} />
          </mesh>
          <mesh position={[0.04, 0.18, 0.07]} rotation={[-0.2, 0, -0.2]} scale={[0.55, 0.42, 0.5]} geometry={geos.furLockGeo} material={assets.snowFur} />
        </group>
        <group ref={rightEarRef} position={[0.25, 0.22, -0.02]} rotation={[0.06, -0.14, -0.46]}>
          <mesh position={[0, 0.21, 0]} scale={[1.08, 1.0, 0.72]} material={assets.earFurMat}>
            <coneGeometry args={[0.165, 0.44, 16]} />
          </mesh>
          <mesh position={[-0.01, 0.17, 0.045]} scale={[0.76, 0.78, 0.32]} material={assets.innerEarMat}>
            <coneGeometry args={[0.13, 0.34, 14]} />
          </mesh>
          <mesh position={[-0.04, 0.18, 0.07]} rotation={[-0.2, 0, 0.2]} scale={[0.55, 0.42, 0.5]} geometry={geos.furLockGeo} material={assets.snowFur} />
        </group>

        {/* Cheek Stripes + Teardrop Marks */}
        <group position={[-0.215, -0.068, 0.332]} rotation={[0.04, -0.48, 0.06]}>
          <mesh geometry={geos.cheekStripeLeftGeo} material={assets.jetBlack} />
          <mesh position={[-0.008, -0.026, -0.004]} rotation={[0, 0, 0.18]} scale={0.78} geometry={geos.cheekStripeLeftGeo} material={assets.jetBlack} />
          <mesh position={[-0.088, -0.006, -0.036]} scale={[0.8, 1.1, 0.6]} material={assets.jetBlack}>
            <sphereGeometry args={[0.011, 8, 8]} />
          </mesh>
          <mesh position={[-0.062, -0.038, -0.025]} scale={[0.7, 0.95, 0.6]} material={assets.jetBlack}>
            <sphereGeometry args={[0.009, 8, 8]} />
          </mesh>
        </group>
        <group position={[0.215, -0.068, 0.332]} rotation={[0.04, 0.48, -0.06]}>
          <mesh geometry={geos.cheekStripeRightGeo} material={assets.jetBlack} />
          <mesh position={[0.008, -0.026, -0.004]} rotation={[0, 0, -0.18]} scale={0.78} geometry={geos.cheekStripeRightGeo} material={assets.jetBlack} />
          <mesh position={[0.088, -0.006, -0.036]} scale={[0.8, 1.1, 0.6]} material={assets.jetBlack}>
            <sphereGeometry args={[0.011, 8, 8]} />
          </mesh>
          <mesh position={[0.062, -0.038, -0.025]} scale={[0.7, 0.95, 0.6]} material={assets.jetBlack}>
            <sphereGeometry args={[0.009, 8, 8]} />
          </mesh>
        </group>

        {/* Rosy Blush */}
        <mesh position={[-0.195, -0.082, 0.335]} rotation={[0.1, -0.45, 0]} scale={[1.25, 0.72, 0.4]} material={DYNAMIC_BLUSH_MAT}>
          <sphereGeometry args={[0.048, 12, 10]} />
        </mesh>
        <mesh position={[0.195, -0.082, 0.335]} rotation={[0.1, 0.45, 0]} scale={[1.25, 0.72, 0.4]} material={DYNAMIC_BLUSH_MAT}>
          <sphereGeometry args={[0.048, 12, 10]} />
        </mesh>

        {/* ── Large Glossy Purple Game-Style Eyes with Cornea Domes & Starlight Glints ── */}
        {/* Left Eye */}
        <group position={[-0.145, 0.024, 0.338]} rotation={[0.02, -0.28, 0]}>
          <group ref={leftOpenEyeRef}>
            <mesh position={[0, 0.034, -0.004]} rotation={[0, 0, 0.08]} scale={[1.18, 0.85, 0.4]} material={assets.eyeshadowMat}>
              <circleGeometry args={[0.088, 20]} />
            </mesh>
            <mesh position={[0, 0, 0.004]} scale={[1.02, 1.1, 0.5]} material={assets.irisMat}>
              <circleGeometry args={[0.076, 28]} />
            </mesh>
            <group ref={leftPupilGroupRef}>
              <mesh position={[0, 0.004, 0.008]} scale={[0.92, 1.15, 0.5]} material={assets.pupilMat}>
                <circleGeometry args={[0.034, 18]} />
              </mesh>
              <mesh position={[0.028, 0.028, 0.012]} material={assets.catchlightMat}>
                <circleGeometry args={[0.018, 12]} />
              </mesh>
              <mesh position={[-0.022, -0.024, 0.012]} material={assets.catchlightMat}>
                <circleGeometry args={[0.009, 10]} />
              </mesh>
              <mesh ref={leftStarGlintRef} position={[-0.018, 0.022, 0.013]} scale={0.001} geometry={geos.star4Geo} material={assets.starGlintMat} />
            </group>
            {/* Glossy Convex Cornea Specular Dome */}
            <mesh position={[0, 0, 0.003]} rotation={[Math.PI / 2, 0, 0]} scale={[1.0, 0.22, 1.08]} material={assets.corneaMat}>
              <sphereGeometry args={[0.078, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
            </mesh>
            <mesh ref={leftEyelashRef} position={[0, 0, 0.026]} geometry={geos.leftEyelashGeo} material={assets.jetBlack} />
            <mesh
              ref={leftEyelidRef}
              position={[0, 0.088, 0.002]}
              scale={[1.18, 0.01, 0.16]}
              material={assets.snowFur}
              visible={false}
            >
              <sphereGeometry args={[0.088, 16, 12]} />
            </mesh>
          </group>
          <mesh ref={leftHappyEyeRef} position={[0, -0.01, 0.017]} rotation={[0, 0, 0.08]} material={assets.jetBlack} visible={false}>
            <torusGeometry args={[0.06, 0.015, 10, 18, Math.PI]} />
          </mesh>
        </group>

        {/* Right Eye */}
        <group position={[0.145, 0.024, 0.338]} rotation={[0.02, 0.28, 0]}>
          <group ref={rightOpenEyeRef}>
            <mesh position={[0, 0.034, -0.004]} rotation={[0, 0, -0.08]} scale={[1.18, 0.85, 0.4]} material={assets.eyeshadowMat}>
              <circleGeometry args={[0.088, 20]} />
            </mesh>
            <mesh position={[0, 0, 0.004]} scale={[1.02, 1.1, 0.5]} material={assets.irisMat}>
              <circleGeometry args={[0.076, 28]} />
            </mesh>
            <group ref={rightPupilGroupRef}>
              <mesh position={[0, 0.004, 0.008]} scale={[0.92, 1.15, 0.5]} material={assets.pupilMat}>
                <circleGeometry args={[0.034, 18]} />
              </mesh>
              <mesh position={[0.028, 0.028, 0.012]} material={assets.catchlightMat}>
                <circleGeometry args={[0.018, 12]} />
              </mesh>
              <mesh position={[-0.022, -0.024, 0.012]} material={assets.catchlightMat}>
                <circleGeometry args={[0.009, 10]} />
              </mesh>
              <mesh ref={rightStarGlintRef} position={[-0.018, 0.022, 0.013]} scale={0.001} geometry={geos.star4Geo} material={assets.starGlintMat} />
            </group>
            <mesh position={[0, 0, 0.003]} rotation={[Math.PI / 2, 0, 0]} scale={[1.0, 0.22, 1.08]} material={assets.corneaMat}>
              <sphereGeometry args={[0.078, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
            </mesh>
            <mesh ref={rightEyelashRef} position={[0, 0, 0.026]} geometry={geos.rightEyelashGeo} material={assets.jetBlack} />
            <mesh
              ref={rightEyelidRef}
              position={[0, 0.088, 0.002]}
              scale={[1.18, 0.01, 0.16]}
              material={assets.snowFur}
              visible={false}
            >
              <sphereGeometry args={[0.088, 16, 12]} />
            </mesh>
          </group>
          <mesh ref={rightHappyEyeRef} position={[0, -0.01, 0.017]} rotation={[0, 0, -0.08]} material={assets.jetBlack} visible={false}>
            <torusGeometry args={[0.06, 0.015, 10, 18, Math.PI]} />
          </mesh>
        </group>

        {/* Jet-Black Bean Eyebrows */}
        <mesh
          ref={leftBrowRef}
          position={[-0.105, 0.145, 0.312]}
          rotation={[-0.25, -0.22, 0.12]}
          scale={[0.85, 1.35, 0.55]}
          material={assets.jetBlack}
        >
          <sphereGeometry args={[0.024, 12, 10]} />
        </mesh>
        <mesh
          ref={rightBrowRef}
          position={[0.105, 0.145, 0.312]}
          rotation={[-0.25, 0.22, -0.12]}
          scale={[0.85, 1.35, 0.55]}
          material={assets.jetBlack}
        >
          <sphereGeometry args={[0.024, 12, 10]} />
        </mesh>
      </group>

      {/* ── 2-Joint Articulated Legs (Upper Shoulder/Hip + Lower Shin & Articulated Paw) ── */}
      {[
        { ref: flLegRef, lowerRef: flLowerRef, pos: [-0.135, 0.21, 0.18] as [number, number, number], mirror: -1, rad: 0.072 },
        { ref: frLegRef, lowerRef: frLowerRef, pos: [0.135, 0.21, 0.18] as [number, number, number], mirror: 1, rad: 0.072 },
        { ref: blLegRef, lowerRef: blLowerRef, pos: [-0.18, 0.21, -0.13] as [number, number, number], mirror: -1, rad: 0.078 },
        { ref: brLegRef, lowerRef: brLowerRef, pos: [0.18, 0.21, -0.13] as [number, number, number], mirror: 1, rad: 0.078 },
      ].map((leg, lIdx) => (
        <group key={lIdx} ref={leg.ref} position={leg.pos}>
          {/* Upper thigh/shoulder with pastel->lavender->black cuff gradient */}
          <mesh position={[0, -0.045, 0]} material={assets.legFurMat}>
            <capsuleGeometry args={[leg.rad, 0.085, 10, 16]} />
          </mesh>
          {/* Outer hip flank crystals */}
          {LEG_CRYSTALS.map((c, cIdx) => (
            <mesh
              key={cIdx}
              position={[leg.mirror * c.pos[0], c.pos[1], c.pos[2]]}
              rotation={[c.rot[0], leg.mirror * c.rot[1], leg.mirror * c.rot[2]]}
              scale={c.scale}
              geometry={geos.diamondCrystalGeo}
              material={cIdx % 2 === 0 ? DYNAMIC_CRYSTAL_MAT : DYNAMIC_CRYSTAL_TIP_MAT}
            />
          ))}
          {/* Articulated knee/ankle + black lower shin + paw */}
          <group ref={leg.lowerRef} position={[0, -0.095, 0]}>
            <mesh position={[0, -0.045, 0]} material={assets.jetBlack}>
              <capsuleGeometry args={[leg.rad * 0.88, 0.065, 8, 14]} />
            </mesh>
            <mesh position={[0, -0.105, 0.022]} scale={[1.08, 0.72, 1.24]} material={assets.jetBlack}>
              <sphereGeometry args={[leg.rad * 1.02, 14, 12]} />
            </mesh>
            {[-0.028, 0, 0.028].map((tx, tIdx) => (
              <mesh key={tIdx} position={[tx, -0.12, 0.09]} scale={[0.85, 0.9, 1.1]} material={assets.jetBlack}>
                <sphereGeometry args={[0.02, 8, 8]} />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* ── Nine Voluminous Multi-Segment S-Wave Crystal-Studded Tails ── */}
      <group position={[0, 0.08, -0.04]}>
        {TAIL_CONFIGS.map((cfg, i) => (
          <group
            key={i}
            ref={(el) => {
              tailBaseRefs.current[i] = el;
            }}
            position={cfg.pos}
            rotation={[cfg.pitchBack, 0, cfg.fanRoll]}
            scale={cfg.scale}
          >
            <group rotation={[0, cfg.curlYaw, 0]}>
              {/* Lower tail plume */}
              <mesh geometry={geos.tailLowerGeo} material={assets.tailFurMat} />
              {/* Secondary articulated scroll curl tip + crystal cluster */}
              <group
                ref={(el) => {
                  tailTipRefs.current[i] = el;
                }}
                position={geos.midPivot}
              >
                <mesh geometry={geos.tailUpperGeo} material={assets.tailFurMat} />
                {TAIL_CRYSTAL_SLOTS.map((slot, cIdx) => (
                  <mesh
                    key={cIdx}
                    position={slot.pos}
                    rotation={slot.rot}
                    scale={slot.scale}
                    geometry={geos.diamondCrystalGeo}
                    material={slot.highlight ? DYNAMIC_CRYSTAL_TIP_MAT : DYNAMIC_CRYSTAL_MAT}
                  />
                ))}
              </group>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ─── Interactive Floating Overlay Wrapper ────────────────────────────────── */
export function KitsuneCompanion() {
  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef({ w: 1280, h: 720, size: 216 });
  const dragRef = useRef({
    active: false,
    moved: false,
    startClientX: 0,
    startClientY: 0,
    startPosX: 0,
    startPosY: 0,
    lastClientX: 0,
    lastClientY: 0,
    lastMoveAt: 0,
    pauseRoamingUntil: 0,
  });
  const roamTimerRef = useRef(0);
  const idleTimerRef = useRef(0);
  const nextIdleMicroAtRef = useRef(5.5);
  const trickIndexRef = useRef(0);
  const particleIdRef = useRef(0);
  const exprResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPetBurstAtRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const envCleanupRef = useRef<(() => void) | null>(null);

  const runtimeRef = useRef<SharedRuntimeRef>({
    pointerX: 0,
    pointerY: 0,
    lastPointerMoveAt: 0,
    facingYaw: -0.22,
    moveSpeed: 0,
    lateralVelX: 0,
    lateralVelY: 0,
    landingTimer: 0,
    isWalking: false,
    isDragging: false,
    isPetting: false,
    scrollImpulse: 0,
    burstEnergy: 0,
    expression: "curious",
    trick: "none",
    trickTimer: 0,
    trickDuration: 1,
    idleAction: "none",
    idleActionTimer: 0,
    idleActionDuration: 1,
  });

  const [motes, setMotes] = useState<FloatingParticle[]>([]);
  const [isDraggingUI, setIsDraggingUI] = useState(false);

  const setTemporaryExpression = useCallback((expr: Expression, duration = 2400) => {
    runtimeRef.current.expression = expr;
    if (exprResetTimerRef.current) clearTimeout(exprResetTimerRef.current);
    exprResetTimerRef.current = setTimeout(() => {
      if (!runtimeRef.current.isPetting && !runtimeRef.current.isDragging) {
        runtimeRef.current.expression = "curious";
      }
    }, duration);
  }, []);

  const triggerSparkleBurst = useCallback((strength = 1.0) => {
    runtimeRef.current.burstEnergy = Math.min(1.4, Math.max(runtimeRef.current.burstEnergy, strength));
    const id = ++particleIdRef.current;
    const xOffset = ((id * 31) % 52) - 26;
    const yOffset = ((id * 19) % 20) - 10;
    setMotes((prev) => [...prev.slice(-4), { id, x: xOffset, y: yOffset }]);
    setTimeout(() => {
      setMotes((prev) => prev.filter((m) => m.id !== id));
    }, 850);
  }, []);

  const pickMarginWaypoint = useCallback((w: number, h: number, size: number) => {
    const pad = 12;
    const maxX = Math.max(pad, w - size - pad);
    const maxY = Math.max(76, h - size - pad);

    const waypoints: { x: number; y: number }[] =
      w < 640
        ? [
            { x: maxX, y: maxY },
            { x: pad, y: maxY },
          ]
        : [
            { x: maxX, y: maxY },
            { x: pad, y: maxY },
            { x: maxX, y: Math.max(96, Math.min(maxY, h * 0.52)) },
            { x: pad, y: Math.max(96, Math.min(maxY, h * 0.56)) },
            { x: Math.max(pad, maxX - Math.min(180, w * 0.16)), y: maxY },
            { x: Math.min(maxX, pad + Math.min(180, w * 0.16)), y: maxY },
          ];

    const candidates = waypoints.filter(
      (pt) => Math.hypot(pt.x - targetRef.current.x, pt.y - targetRef.current.y) > 40
    );
    const pool = candidates.length > 0 ? candidates : waypoints;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const size = w < 640 ? 180 : 216;
      viewportRef.current = { w, h, size };
    };
    updateViewport();

    const init = viewportRef.current;
    const startX = Math.max(12, init.w - init.size - 16);
    const startY = Math.max(76, init.h - init.size - 16);
    posRef.current = { x: startX, y: startY };
    targetRef.current = { x: startX, y: startY };
    lastScrollYRef.current = window.scrollY;

    if (containerRef.current) {
      containerRef.current.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    roamTimerRef.current = 4.5;

    let animId = 0;
    let lastTime = performance.now();

    const updatePointerTracking = (clientX: number, clientY: number) => {
      const { size } = viewportRef.current;
      const cx = posRef.current.x + size / 2;
      const cy = posRef.current.y + size / 2;
      const dx = (clientX - cx) / Math.max(160, window.innerWidth * 0.35);
      const dy = (clientY - cy) / Math.max(160, window.innerHeight * 0.35);
      runtimeRef.current.pointerX = Math.max(-1, Math.min(1, dx));
      runtimeRef.current.pointerY = Math.max(-1, Math.min(1, dy));
      runtimeRef.current.lastPointerMoveAt = performance.now();
      idleTimerRef.current = 0;
      if (runtimeRef.current.expression === "sleepy") {
        runtimeRef.current.expression = "curious";
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      updatePointerTracking(e.clientX, e.clientY);
      if (dragRef.current.active) {
        const now = performance.now();
        const segDt = Math.max(0.008, (now - dragRef.current.lastMoveAt) / 1000);
        const stepDx = e.clientX - dragRef.current.lastClientX;
        const stepDy = e.clientY - dragRef.current.lastClientY;
        velRef.current.x = THREE.MathUtils.clamp(stepDx / (segDt * 750), -1, 1);
        velRef.current.y = THREE.MathUtils.clamp(stepDy / (segDt * 750), -1, 1);
        dragRef.current.lastClientX = e.clientX;
        dragRef.current.lastClientY = e.clientY;
        dragRef.current.lastMoveAt = now;

        const dx = e.clientX - dragRef.current.startClientX;
        const dy = e.clientY - dragRef.current.startClientY;
        if (Math.hypot(dx, dy) >= 6) dragRef.current.moved = true;
        const { w, h, size } = viewportRef.current;
        const nx = Math.max(4, Math.min(w - size - 4, dragRef.current.startPosX + dx));
        const ny = Math.max(84, Math.min(h - size - 4, dragRef.current.startPosY + dy));
        posRef.current.x = nx;
        posRef.current.y = ny;
        targetRef.current.x = nx;
        targetRef.current.y = ny;
        if (containerRef.current) {
          containerRef.current.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updatePointerTracking(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onMouseUpGlobal = () => {
      if (dragRef.current.active) {
        dragRef.current.active = false;
        runtimeRef.current.isDragging = false;
        setIsDraggingUI(false);
        dragRef.current.pauseRoamingUntil = performance.now() + 9000;
        if (dragRef.current.moved) {
          runtimeRef.current.landingTimer = 0.45;
          setTemporaryExpression("happy", 1800);
          triggerSparkleBurst(0.8);
        }
      }
    };

    const onResize = () => {
      updateViewport();
      const { w, h, size } = viewportRef.current;
      const clampX = (x: number) => Math.max(8, Math.min(w - size - 8, x));
      const clampY = (y: number) => Math.max(72, Math.min(h - size - 8, y));
      posRef.current.x = clampX(posRef.current.x);
      posRef.current.y = clampY(posRef.current.y);
      targetRef.current.x = clampX(targetRef.current.x);
      targetRef.current.y = clampY(targetRef.current.y);
      setTemporaryExpression("surprised", 1500);
      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
      }
    };

    const onScroll = () => {
      const sy = window.scrollY;
      const delta = Math.abs(sy - lastScrollYRef.current);
      lastScrollYRef.current = sy;
      if (delta > 12) {
        runtimeRef.current.scrollImpulse = Math.min(1, runtimeRef.current.scrollImpulse + 0.35);
      }
    };

    const onDoubleClickWindow = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest("a, button, input, textarea, select, [role='dialog']") ||
          (window.getSelection()?.toString().trim() ?? "") !== "")
      ) {
        return;
      }
      const { w, h, size } = viewportRef.current;
      const goLeft = e.clientX < w / 2;
      const destX = goLeft ? 12 : Math.max(12, w - size - 14);
      const destY = Math.max(76, Math.min(h - size - 14, e.clientY - size / 2));
      targetRef.current = { x: destX, y: destY };
      dragRef.current.pauseRoamingUntil = performance.now() + 9000;
      runtimeRef.current.idleAction = "none";
      setTemporaryExpression("excited", 1800);
      triggerSparkleBurst(0.95);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseup", onMouseUpGlobal, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("dblclick", onDoubleClickWindow);

    const tick = (now: number) => {
      if (document.hidden) {
        lastTime = now;
        animId = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const rt = runtimeRef.current;
      const { w, h, size } = viewportRef.current;

      if (rt.trickTimer > 0) {
        rt.trickTimer = Math.max(0, rt.trickTimer - dt);
        if (rt.trickTimer === 0) {
          rt.trick = "none";
        }
      }
      if (rt.idleActionTimer > 0) {
        rt.idleActionTimer = Math.max(0, rt.idleActionTimer - dt);
        if (rt.idleActionTimer === 0) {
          rt.idleAction = "none";
        }
      }
      if (rt.landingTimer > 0) {
        rt.landingTimer = Math.max(0, rt.landingTimer - dt);
      }

      rt.scrollImpulse = Math.max(0, rt.scrollImpulse - dt * 2.2);
      rt.burstEnergy = Math.max(0, rt.burstEnergy - dt * 1.15);

      idleTimerRef.current += dt;

      // Damped velocity propagation for natural tail & limb inertia
      const velDecay = Math.exp(-dt * 8);
      velRef.current.x *= velDecay;
      velRef.current.y *= velDecay;

      if (!rt.isDragging && !prefersReducedMotion) {
        const dx = targetRef.current.x - posRef.current.x;
        const dy = targetRef.current.y - posRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 2.5) {
          rt.isWalking = true;
          rt.idleAction = "none";
          const targetSpeed = Math.min(185, Math.max(58, dist * 1.65));
          const step = Math.min(dist, targetSpeed * dt);
          const vx = (dx / dist) * (step / Math.max(dt, 0.001));
          const vy = (dy / dist) * (step / Math.max(dt, 0.001));
          posRef.current.x += (dx / dist) * step;
          posRef.current.y += (dy / dist) * step;

          velRef.current.x = THREE.MathUtils.clamp(vx / 185, -1, 1);
          velRef.current.y = THREE.MathUtils.clamp(vy / 185, -1, 1);
          rt.moveSpeed = THREE.MathUtils.lerp(rt.moveSpeed, Math.min(1, targetSpeed / 185), Math.min(1, dt * 8));
          rt.facingYaw = dx >= 0 ? 0.52 : -0.52;

          if (containerRef.current) {
            containerRef.current.style.transform = `translate3d(${posRef.current.x.toFixed(1)}px, ${posRef.current.y.toFixed(1)}px, 0)`;
          }
        } else {
          rt.moveSpeed = THREE.MathUtils.lerp(rt.moveSpeed, 0, Math.min(1, dt * 9));
          if (rt.isWalking) {
            rt.isWalking = false;
            roamTimerRef.current = 7 + Math.random() * 6;
          }
          const onRightHalf = posRef.current.x + size / 2 > w / 2;
          rt.facingYaw = onRightHalf ? -0.24 : 0.24;

          if (now > dragRef.current.pauseRoamingUntil && !rt.isPetting) {
            roamTimerRef.current -= dt;
            if (roamTimerRef.current <= 0) {
              targetRef.current = pickMarginWaypoint(w, h, size);
              roamTimerRef.current = 8 + Math.random() * 6;
            }
          }

          // Autonomous lifelike idle micro-actions while perched awake
          if (
            idleTimerRef.current > 3.5 &&
            idleTimerRef.current < 11.5 &&
            !rt.isPetting &&
            rt.trick === "none" &&
            rt.idleAction === "none" &&
            idleTimerRef.current >= nextIdleMicroAtRef.current
          ) {
            const pickGroom = Math.random() > 0.42;
            rt.idleAction = pickGroom ? "groomPaw" : "fluffShake";
            rt.idleActionDuration = pickGroom ? 1.35 : 0.85;
            rt.idleActionTimer = rt.idleActionDuration;
            nextIdleMicroAtRef.current = idleTimerRef.current + 5.5 + Math.random() * 4;
          }

          if (idleTimerRef.current > 12 && !rt.isPetting && rt.trick === "none" && rt.idleAction === "none") {
            rt.expression = "sleepy";
          }
        }
      }

      rt.lateralVelX = velRef.current.x;
      rt.lateralVelY = velRef.current.y;

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onMouseUpGlobal);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("dblclick", onDoubleClickWindow);
      if (exprResetTimerRef.current) clearTimeout(exprResetTimerRef.current);
      if (envCleanupRef.current) {
        envCleanupRef.current();
        envCleanupRef.current = null;
      }
    };
  }, [pickMarginWaypoint, setTemporaryExpression, triggerSparkleBurst]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    idleTimerRef.current = 0;
    const now = performance.now();
    dragRef.current = {
      active: true,
      moved: false,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPosX: posRef.current.x,
      startPosY: posRef.current.y,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      lastMoveAt: now,
      pauseRoamingUntil: now + 9000,
    };
    runtimeRef.current.isDragging = true;
    runtimeRef.current.idleAction = "none";
    runtimeRef.current.expression = "surprised";
    setIsDraggingUI(true);
  }, []);

  const handlePointerMoveHit = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current.active) {
        const now = performance.now();
        const segDt = Math.max(0.008, (now - dragRef.current.lastMoveAt) / 1000);
        const stepDx = e.clientX - dragRef.current.lastClientX;
        const stepDy = e.clientY - dragRef.current.lastClientY;
        velRef.current.x = THREE.MathUtils.clamp(stepDx / (segDt * 750), -1, 1);
        velRef.current.y = THREE.MathUtils.clamp(stepDy / (segDt * 750), -1, 1);
        dragRef.current.lastClientX = e.clientX;
        dragRef.current.lastClientY = e.clientY;
        dragRef.current.lastMoveAt = now;

        const dx = e.clientX - dragRef.current.startClientX;
        const dy = e.clientY - dragRef.current.startClientY;
        if (Math.hypot(dx, dy) >= 6) dragRef.current.moved = true;
        const { w, h, size } = viewportRef.current;
        const nx = Math.max(4, Math.min(w - size - 4, dragRef.current.startPosX + dx));
        const ny = Math.max(84, Math.min(h - size - 4, dragRef.current.startPosY + dy));
        posRef.current.x = nx;
        posRef.current.y = ny;
        targetRef.current.x = nx;
        targetRef.current.y = ny;
        if (containerRef.current) {
          containerRef.current.style.transform = `translate3d(${nx}px, ${ny}px, 0)`;
        }
        return;
      }

      runtimeRef.current.isPetting = true;
      runtimeRef.current.expression = "happy";
      runtimeRef.current.idleAction = "none";
      idleTimerRef.current = 0;

      const now = performance.now();
      if (now - lastPetBurstAtRef.current > 380) {
        lastPetBurstAtRef.current = now;
        triggerSparkleBurst(0.65);
      }
    },
    [triggerSparkleBurst]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const wasMoved = dragRef.current.moved;
      dragRef.current.active = false;
      runtimeRef.current.isDragging = false;
      setIsDraggingUI(false);

      if (!wasMoved) {
        const item = TRICK_SEQUENCE[trickIndexRef.current % TRICK_SEQUENCE.length];
        trickIndexRef.current += 1;
        runtimeRef.current.trick = item.trick;
        runtimeRef.current.trickDuration = item.duration;
        runtimeRef.current.trickTimer = item.duration;
        runtimeRef.current.idleAction = "none";
        setTemporaryExpression(item.expression, 2400);
        triggerSparkleBurst(1.1);
      } else {
        runtimeRef.current.landingTimer = 0.45;
        setTemporaryExpression("happy", 1800);
        triggerSparkleBurst(0.75);
      }
    },
    [setTemporaryExpression, triggerSparkleBurst]
  );

  const handlePointerEnter = useCallback(() => {
    runtimeRef.current.isPetting = true;
    runtimeRef.current.expression = "happy";
    runtimeRef.current.idleAction = "none";
    idleTimerRef.current = 0;
    triggerSparkleBurst(0.7);
  }, [triggerSparkleBurst]);

  const handlePointerLeave = useCallback(() => {
    runtimeRef.current.isPetting = false;
    if (!runtimeRef.current.isDragging && runtimeRef.current.trick === "none") {
      runtimeRef.current.expression = "curious";
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ transform: "translate3d(0px, 0px, 0)" }}
      className="fixed top-0 left-0 z-40 w-[180px] h-[180px] sm:w-[216px] sm:h-[216px] pointer-events-none select-none will-change-transform"
    >
      {/* Pure Visual Crystal Mote Shimmer (No Text / No Emojis) */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {motes.map((m) => (
          <span
            key={m.id}
            style={{ transform: `translate(${m.x}px, ${m.y}px)` }}
            className="absolute top-7 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 rounded-[1px] bg-gradient-to-br from-sky-200 to-violet-400 shadow-[0_0_8px_rgba(125,211,252,0.9)] animate-ping"
          />
        ))}
      </div>

      {/* Subtle Ground Frost Halo */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full pointer-events-none blur-sm opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(125,211,252,0.5), rgba(167,139,250,0.28), transparent 75%)",
        }}
      />

      {/* 3D WebGL Canvas */}
      <CanvasErrorBoundary>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0.55, 5.65], fov: 35 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl, scene }) => {
            if (envCleanupRef.current) envCleanupRef.current();
            envCleanupRef.current = applyStudioEnvironment(gl, scene);
          }}
          className="w-full h-full pointer-events-none"
        >
          <ambientLight intensity={1.15} />
          <hemisphereLight args={["#eff8ff", "#3b2e75", 1.1]} />
          <directionalLight position={[3.2, 4.8, 4.5]} intensity={1.6} color="#ffffff" />
          <directionalLight position={[-3.2, 2.5, -2.5]} intensity={1.15} color="#a5f3fc" />
          <pointLight position={[0, 1.3, 2.4]} intensity={0.75} color="#c084fc" />
          <AzuriteModel runtime={runtimeRef} />
        </Canvas>
      </CanvasErrorBoundary>

      {/* Compact Circular Hit Area (Only intercepts pointer/touch right on the Kitsune) */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Interact with Azurite the Nine-Tailed Kitsune"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMoveHit}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current.active = false;
          runtimeRef.current.isDragging = false;
          runtimeRef.current.isPetting = false;
          setIsDraggingUI(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const item = TRICK_SEQUENCE[trickIndexRef.current % TRICK_SEQUENCE.length];
            trickIndexRef.current += 1;
            runtimeRef.current.trick = item.trick;
            runtimeRef.current.trickDuration = item.duration;
            runtimeRef.current.trickTimer = item.duration;
            runtimeRef.current.idleAction = "none";
            setTemporaryExpression(item.expression, 2400);
            triggerSparkleBurst(1.1);
          }
        }}
        className={`pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-quantum/60 ${
          isDraggingUI ? "cursor-grabbing" : "cursor-grab"
        }`}
      />
    </div>
  );
}
