"use client";

import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Types & Constants ───────────────────────────────────────────────────── */
type Expression = "curious" | "happy" | "playful" | "excited" | "surprised" | "sleepy";
type TrickType =
  | "none"
  | "spiritBallPlay"
  | "spinJump"
  | "wispPounce"
  | "cuddleRoll"
  | "makingBiscuits"
  | "crystalFlare"
  | "cheekBunt"
  | "playBow"
  | "wingFlutter";
type PostureType = "standing" | "sitting" | "loafing" | "curledSleep";
type IdleActionType =
  | "none"
  | "playSpiritBall"
  | "lazySwat"
  | "earScratch"
  | "sniffInspect"
  | "makingBiscuits"
  | "catFaceWash"
  | "chaseWisp"
  | "cuddleRoll"
  | "cheekBunt"
  | "stretchYawn"
  | "tailPlay"
  | "tippyTaps";

interface SharedRuntimeRef {
  pointerX: number; // normalized -1..1 relative to Azurite center
  pointerY: number; // normalized -1..1 relative to Azurite center
  lastPointerMoveAt: number;
  cursorProximity: number; // 0..1 when cursor calmly approaches Azurite
  cursorStalkEnergy: number; // 0..1 when user wiggles mouse near Azurite like a cat wand
  wakeUpTimer: number; // 0..0.75 drowsy head-lift/perk when woken from loaf/nap
  facingYaw: number;
  moveSpeed: number; // 0..1 normalized travel/drag speed
  lateralVelX: number; // -1..1 horizontal velocity inertia
  lateralVelY: number; // -1..1 vertical velocity inertia
  landingTimer: number; // 0..0.45 post-drag landing bounce
  isWalking: boolean;
  isDragging: boolean;
  isPetting: boolean;
  pettingDuration: number; // seconds continuously petted (knead -> cuddle flop)
  postPetTimer: number; // brief crisp settle/ear shake after petting ends
  scrollImpulse: number;
  burstEnergy: number;
  posture: PostureType;
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

interface SpiritMoteSpec {
  radius: number;
  speed: number;
  yBase: number;
  phase: number;
  scale: number;
  bobAmp: number;
  isOrchid: boolean;
}

const TRICK_SEQUENCE: { trick: TrickType; expression: Expression; duration: number }[] = [
  { trick: "spiritBallPlay", expression: "playful", duration: 2.65 },
  { trick: "cheekBunt", expression: "happy", duration: 1.55 },
  { trick: "makingBiscuits", expression: "happy", duration: 1.85 },
  { trick: "cuddleRoll", expression: "playful", duration: 1.8 },
  { trick: "wispPounce", expression: "playful", duration: 1.45 },
  { trick: "spinJump", expression: "excited", duration: 1.08 },
  { trick: "playBow", expression: "playful", duration: 1.15 },
  { trick: "crystalFlare", expression: "excited", duration: 1.15 },
  { trick: "wingFlutter", expression: "happy", duration: 1.12 },
];

const AUTONOMOUS_IDLE_POOL: {
  action: Exclude<IdleActionType, "none">;
  duration: number;
  seatedOk?: boolean;
}[] = [
  { action: "playSpiritBall", duration: 2.95, seatedOk: false },
  { action: "sniffInspect", duration: 1.95, seatedOk: true },
  { action: "earScratch", duration: 2.1, seatedOk: true },
  { action: "lazySwat", duration: 1.65, seatedOk: true },
  { action: "catFaceWash", duration: 2.35, seatedOk: true },
  { action: "makingBiscuits", duration: 2.35, seatedOk: true },
  { action: "stretchYawn", duration: 2.4, seatedOk: false },
  { action: "cheekBunt", duration: 1.8, seatedOk: false },
  { action: "cuddleRoll", duration: 2.3, seatedOk: false },
  { action: "tailPlay", duration: 1.9, seatedOk: true },
  { action: "chaseWisp", duration: 2.2, seatedOk: false },
  { action: "tippyTaps", duration: 1.55, seatedOk: false },
];

const TAIL_SPLIT_T = 0.56;

// 9 Tails anchored relative to pelvis ([0, 0.35, -0.12] -> wrapper at [0, -0.27, 0.08] = world [0, 0.08, -0.04])
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

const TAIL_MID_ANCHOR: [number, number, number] = [0, 0.625, -0.145];

const TAIL_CRYSTAL_SLOTS: {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
  highlight?: boolean;
  edged?: boolean;
}[] = [
  {
    pos: [0, 0.88 - TAIL_MID_ANCHOR[1], 0.05 - TAIL_MID_ANCHOR[2]],
    rot: [0.35, 0.2, 0.05],
    scale: [1.0, 1.35, 0.95],
    edged: true,
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

// 19-Lock 3-Tier Sculpted Chest Mane relative to chestRef ([0, 0.36, 0.04])
const CHEST_LOCKS: ChestLockSpec[] = [
  { pos: [-0.21, 0.25, 0.13], rot: [-0.28, -0.38, -0.58], scale: [0.92, 0.78, 0.85], tier: "white" },
  { pos: [-0.14, 0.23, 0.19], rot: [-0.36, -0.22, -0.34], scale: [0.98, 0.84, 0.9], tier: "white" },
  { pos: [-0.06, 0.22, 0.23], rot: [-0.4, -0.08, -0.12], scale: [1.04, 0.9, 0.95], tier: "white" },
  { pos: [0.0, 0.22, 0.25], rot: [-0.42, 0, 0], scale: [1.08, 0.94, 1.0], tier: "white" },
  { pos: [0.06, 0.22, 0.23], rot: [-0.4, 0.08, 0.12], scale: [1.04, 0.9, 0.95], tier: "white" },
  { pos: [0.14, 0.23, 0.19], rot: [-0.36, 0.22, 0.34], scale: [0.98, 0.84, 0.9], tier: "white" },
  { pos: [0.21, 0.25, 0.13], rot: [-0.28, 0.38, 0.58], scale: [0.92, 0.78, 0.85], tier: "white" },

  { pos: [-0.22, 0.15, 0.14], rot: [-0.16, -0.45, -0.5], scale: [1.05, 1.08, 0.95], tier: "sky" },
  { pos: [-0.14, 0.13, 0.21], rot: [-0.22, -0.26, -0.26], scale: [1.15, 1.15, 1.02], tier: "sky" },
  { pos: [-0.06, 0.12, 0.25], rot: [-0.26, -0.1, -0.08], scale: [1.18, 1.22, 1.05], tier: "sky" },
  { pos: [0.0, 0.12, 0.27], rot: [-0.26, 0, 0], scale: [1.22, 1.26, 1.08], tier: "sky" },
  { pos: [0.06, 0.12, 0.25], rot: [-0.26, 0.1, 0.08], scale: [1.18, 1.22, 1.05], tier: "sky" },
  { pos: [0.14, 0.13, 0.21], rot: [-0.22, 0.26, 0.26], scale: [1.15, 1.15, 1.02], tier: "sky" },
  { pos: [0.22, 0.15, 0.14], rot: [-0.16, 0.45, 0.5], scale: [1.05, 1.08, 0.95], tier: "sky" },

  { pos: [-0.15, 0.02, 0.21], rot: [-0.08, -0.22, 0.16], scale: [1.05, 1.18, 0.95], tier: "gradient" },
  { pos: [-0.075, 0.00, 0.24], rot: [-0.1, -0.08, 0.08], scale: [1.12, 1.28, 1.02], tier: "gradient" },
  { pos: [0.0, -0.01, 0.255], rot: [-0.12, 0, 0], scale: [1.18, 1.36, 1.05], tier: "gradient" },
  { pos: [0.075, 0.00, 0.24], rot: [-0.1, 0.08, -0.08], scale: [1.12, 1.28, 1.02], tier: "gradient" },
  { pos: [0.15, 0.02, 0.21], rot: [-0.08, 0.22, -0.16], scale: [1.05, 1.18, 0.95], tier: "gradient" },
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

const INNER_EAR_TUFTS: { pos: [number, number, number]; rot: [number, number, number]; scale: [number, number, number] }[] = [
  { pos: [0.045, 0.14, 0.068], rot: [-0.22, 0.05, -0.28], scale: [0.48, 0.38, 0.42] },
  { pos: [0.02, 0.19, 0.062], rot: [-0.18, 0.08, -0.14], scale: [0.4, 0.34, 0.38] },
  { pos: [0.055, 0.09, 0.065], rot: [-0.25, 0.04, -0.45], scale: [0.34, 0.3, 0.34] },
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

const LEG_CRYSTALS: { pos: [number, number, number]; rot: [number, number, number]; scale: [number, number, number] }[] = [
  { pos: [0.052, -0.02, 0.015], rot: [0.2, 0.4, -0.35], scale: [0.46, 0.85, 0.34] },
  { pos: [0.056, -0.055, -0.02], rot: [-0.15, 0.5, -0.5], scale: [0.38, 0.68, 0.3] },
  { pos: [0.046, 0.015, -0.015], rot: [0.1, 0.3, -0.25], scale: [0.35, 0.64, 0.28] },
  { pos: [0.048, -0.075, 0.018], rot: [0.3, 0.4, -0.6], scale: [0.3, 0.55, 0.26] },
];

const ANKLE_CUFF_ANGLES = [-0.5, 0, 0.5];

const SPIRIT_MOTE_SPECS: SpiritMoteSpec[] = Array.from({ length: 8 }, (_, i) => ({
  radius: 0.74 + ((i * 29) % 7) * 0.045,
  speed: (i % 2 === 0 ? 1 : -1) * (0.22 + (i % 4) * 0.055),
  yBase: 0.16 + ((i * 19) % 8) * 0.085,
  phase: i * 1.35,
  scale: 0.78 + (i % 3) * 0.22,
  bobAmp: 0.045 + (i % 3) * 0.018,
  isOrchid: i % 2 === 1,
}));

const SPIRIT_BALL_WISP_PHASES = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

// Module-scope dynamic materials animated cleanly in useFrame
const DYNAMIC_CRYSTAL_MAT = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#7dd3fc"),
  emissive: new THREE.Color("#6366f1"),
  emissiveIntensity: 0.34,
  roughness: 0.08,
  metalness: 0.08,
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  reflectivity: 1.0,
  envMapIntensity: 1.65,
  transparent: true,
  opacity: 0.94,
  flatShading: true,
});

const DYNAMIC_CRYSTAL_TIP_MAT = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#bae6fd"),
  emissive: new THREE.Color("#38bdf8"),
  emissiveIntensity: 0.45,
  roughness: 0.06,
  metalness: 0.06,
  clearcoat: 1.0,
  clearcoatRoughness: 0.04,
  envMapIntensity: 1.75,
  transparent: true,
  opacity: 0.92,
  flatShading: true,
});

const DYNAMIC_BLUSH_MAT = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#f472b6"),
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});

const DYNAMIC_SPARKLE_MAT = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#e0f2fe"),
  transparent: true,
  opacity: 0.72,
  side: THREE.DoubleSide,
});

const DYNAMIC_SPIRIT_CORE_MAT = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#e0f2fe"),
  transparent: true,
  opacity: 0.92,
  depthWrite: false,
});

const DYNAMIC_SPIRIT_HALO_MAT = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#38bdf8"),
  transparent: true,
  opacity: 0.3,
  depthWrite: false,
});

const DYNAMIC_SPIRIT_ORCHID_MAT = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#a78bfa"),
  transparent: true,
  opacity: 0.28,
  depthWrite: false,
});

const DYNAMIC_WOOL_CORE_MAT = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#7dd3fc"),
  transparent: true,
  opacity: 0.94,
  depthWrite: false,
});

const DYNAMIC_WOOL_THREAD_MAT = new THREE.MeshBasicMaterial({
  color: new THREE.Color("#c084fc"),
  transparent: true,
  opacity: 0.82,
  depthWrite: false,
});

/* ─── Stylized Game Half-Lambert + Dual Fresnel Rim Fur Shader ────────────── */
function applyFurRimShader(
  mat: THREE.MeshStandardMaterial,
  rimColorHex: string,
  rimStrength = 0.34
): THREE.MeshStandardMaterial {
  mat.customProgramCacheKey = () => `azurite-fur-toon-${rimColorHex}-${rimStrength.toFixed(2)}`;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRimColor = { value: new THREE.Color(rimColorHex) };
    shader.uniforms.uRimOrchid = { value: new THREE.Color("#c084fc") };
    shader.uniforms.uRimStrength = { value: rimStrength };
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        "uniform vec3 uRimColor;\nuniform vec3 uRimOrchid;\nuniform float uRimStrength;\nvoid main() {"
      )
      .replace(
        "#include <dithering_fragment>",
        `
        vec3 viewNormal = normalize(normal);
        vec3 viewDir = normalize(vViewPosition);
        float furFresnel = pow(1.0 - clamp(abs(dot(viewNormal, viewDir)), 0.0, 1.0), 2.15);
        float upMix = clamp(viewNormal.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 dualRim = mix(uRimOrchid, uRimColor, upMix);
        float lum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
        vec3 shadowTint = vec3(0.76, 0.72, 0.96);
        gl_FragColor.rgb = mix(gl_FragColor.rgb * 1.04 + shadowTint * 0.1, gl_FragColor.rgb, smoothstep(0.14, 0.72, lum));
        gl_FragColor.rgb += dualRim * furFresnel * uRimStrength;
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
  envScene.background = new THREE.Color("#131b3a");

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
  const floorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#2e2459"), side: THREE.DoubleSide });
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

  // With phiStart = -PI/2: u=0.5 (x=256) is front face (+Z), u=0/1 (x=0/512) is back (-Z)
  const vGrad = ctx.createLinearGradient(0, 0, 0, 512);
  vGrad.addColorStop(0.0, "#9ecfff");
  vGrad.addColorStop(0.24, "#cfeaff");
  vGrad.addColorStop(0.48, "#f7faff");
  vGrad.addColorStop(1.0, "#ffffff");
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft pastel lavender tint along the back/temple sides
  const hSide = ctx.createLinearGradient(0, 0, 512, 0);
  hSide.addColorStop(0.0, "rgba(180, 152, 248, 0.42)");
  hSide.addColorStop(0.22, "rgba(180, 152, 248, 0.08)");
  hSide.addColorStop(0.5, "rgba(255, 255, 255, 0)");
  hSide.addColorStop(0.78, "rgba(180, 152, 248, 0.08)");
  hSide.addColorStop(1.0, "rgba(180, 152, 248, 0.42)");
  ctx.fillStyle = hSide;
  ctx.fillRect(0, 0, 512, 512);

  // Luminous snowy face highlight centered around u=0.5 (x=256)
  const faceGlow = ctx.createRadialGradient(256, 290, 24, 256, 280, 150);
  faceGlow.addColorStop(0.0, "rgba(255, 255, 255, 0.98)");
  faceGlow.addColorStop(0.7, "rgba(244, 249, 255, 0.65)");
  faceGlow.addColorStop(1.0, "rgba(240, 248, 255, 0)");
  ctx.fillStyle = faceGlow;
  ctx.fillRect(0, 0, 512, 512);

  // Soft ambient occlusion in left & right orbital eye sockets
  for (const ex of [215, 297]) {
    const ao = ctx.createRadialGradient(ex, 248, 4, ex, 248, 32);
    ao.addColorStop(0.0, "rgba(167, 139, 250, 0.24)");
    ao.addColorStop(0.65, "rgba(196, 181, 253, 0.12)");
    ao.addColorStop(1.0, "rgba(196, 181, 253, 0)");
    ctx.fillStyle = ao;
    ctx.beginPath();
    ctx.arc(ex, 248, 32, 0, Math.PI * 2);
    ctx.fill();
  }

  // Delicate painted fur micro-strokes on forehead & crown
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 200; i++) {
    const x = (i * 73) % 512;
    const y = (i * 97) % 210;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(255,255,255,0.25)" : "rgba(147,197,253,0.18)";
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

function createCheekFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0.0, "#f7faff");
  grad.addColorStop(0.55, "#b5e6ff");
  grad.addColorStop(0.85, "#b394f6");
  grad.addColorStop(1.0, "#9572ec");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);

  for (let i = 0; i < 56; i++) {
    const x = (i * 31) % 128;
    const y = (i * 53) % 256;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 24);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
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

  const rootAO = ctx.createLinearGradient(0, 1024, 0, 920);
  rootAO.addColorStop(0.0, "rgba(88, 70, 185, 0.24)");
  rootAO.addColorStop(1.0, "rgba(88, 70, 185, 0)");
  ctx.fillStyle = rootAO;
  ctx.fillRect(0, 920, 512, 104);

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

  ctx.fillStyle = "#160b2b";
  ctx.fillRect(0, 0, 512, 512);

  // Smooth high-contrast vertical/radial anime gradient (deep indigo top -> rich amethyst mid -> glowing orchid bottom)
  const vGrad = ctx.createLinearGradient(0, 20, 0, 492);
  vGrad.addColorStop(0.0, "#2e1065");
  vGrad.addColorStop(0.28, "#6b21a8");
  vGrad.addColorStop(0.56, "#9333ea");
  vGrad.addColorStop(0.84, "#d8b4fe");
  vGrad.addColorStop(1.0, "#f5d0fe");
  ctx.fillStyle = vGrad;
  ctx.beginPath();
  ctx.arc(256, 256, 236, 0, Math.PI * 2);
  ctx.fill();

  // Luminous glowing orchid-lilac lower iris crescent
  const lowerGlow = ctx.createRadialGradient(256, 368, 18, 256, 352, 165);
  lowerGlow.addColorStop(0.0, "rgba(245, 208, 254, 0.96)");
  lowerGlow.addColorStop(0.55, "rgba(216, 180, 254, 0.5)");
  lowerGlow.addColorStop(1.0, "rgba(147, 51, 234, 0)");
  ctx.fillStyle = lowerGlow;
  ctx.beginPath();
  ctx.arc(256, 256, 232, 0, Math.PI * 2);
  ctx.fill();

  // Delicate radial iris fibers
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(245, 208, 254, 0.26)" : "rgba(192, 132, 252, 0.16)";
    ctx.lineWidth = i % 2 === 0 ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(a) * 86, 256 + Math.sin(a) * 86);
    ctx.lineTo(256 + Math.cos(a) * 212, 256 + Math.sin(a) * 212);
    ctx.stroke();
  }

  // Soft upper eyelid shadow
  const shadow = ctx.createLinearGradient(0, 16, 0, 240);
  shadow.addColorStop(0.0, "rgba(16, 6, 34, 0.88)");
  shadow.addColorStop(1.0, "rgba(16, 6, 34, 0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, 512, 240);

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
  radGrad.addColorStop(0.0, "rgba(186, 230, 253, 0.44)");
  radGrad.addColorStop(0.55, "rgba(167, 139, 250, 0.24)");
  radGrad.addColorStop(1.0, "rgba(56, 189, 248, 0.0)");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "rgba(224, 242, 254, 0.76)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(256, 256, 218, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(196, 181, 253, 0.65)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(256, 256, 182, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r0 = i % 2 === 0 ? 174 : 196;
    const r1 = 224;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(224, 242, 254, 0.85)" : "rgba(167, 139, 250, 0.6)";
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

/* ─── Seamless Sculpted Chibi Cat-Fox Head & Game-Mesh Builders ──────────── */
function createSculptedCatHeadGeometry(): THREE.BufferGeometry {
  // phiStart = -PI/2 puts the UV seam strictly behind the head (-Z) and u=0.5 squarely on the face (+Z)
  const geo = new THREE.SphereGeometry(0.35, 64, 48, -Math.PI / 2, Math.PI * 2);
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const bx = pos.getX(i);
    const by = pos.getY(i);
    const bz = pos.getZ(i);
    const len = Math.hypot(bx, by, bz) || 1;
    const nx = bx / len;
    const ny = by / len;
    const nz = bz / len;
    const absNx = Math.abs(nx);

    let vx = bx * 1.18;
    let vy = by * 0.96;
    let vz = bz * 1.0;

    // Keep cheekbones & muzzle sculpted strictly below the eye orbital line (ny < -0.18)
    const lowerFaceMask = THREE.MathUtils.smoothstep(-ny, 0.18, 0.45);
    const frontMask = THREE.MathUtils.smoothstep(nz, 0.1, 0.7);
    const cheekFactor =
      Math.exp(-(Math.pow(absNx - 0.56, 2) / 0.09 + Math.pow(ny + 0.34, 2) / 0.09)) *
      frontMask *
      lowerFaceMask;
    vx += Math.sign(nx) * 0.026 * cheekFactor;
    vy -= 0.008 * cheekFactor;
    vz += 0.028 * cheekFactor;

    const muzzleFactor =
      Math.exp(-(Math.pow(nx, 2) / 0.065 + Math.pow(ny + 0.32, 2) / 0.055)) *
      THREE.MathUtils.smoothstep(nz, 0.45, 0.95) *
      lowerFaceMask;
    vz += 0.036 * muzzleFactor;

    pos.setXYZ(i, vx, vy, vz);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

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
  // 0. Seamless Sculpted Cat-Fox Head Mesh
  const catHeadGeo = createSculptedCatHeadGeometry();

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

  // 2. Sculpted Curved Cupped Fox Ear Shells & Inner Ear Pads
  const earSpineRight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0, 0.0),
    new THREE.Vector3(0.012, 0.15, 0.025),
    new THREE.Vector3(0.005, 0.31, 0.015),
    new THREE.Vector3(-0.022, 0.45, -0.015),
  ]);
  const earShellRightGeo = buildSculptedTube(
    earSpineRight,
    (t, theta) => {
      const flare = Math.sin(Math.pow(t, 0.65) * Math.PI * 0.82 + 0.38) * (1 - t * 0.86);
      const rx = 0.165 * flare + 0.004;
      const frontConcave = Math.sin(theta) < 0 ? 0.28 : 0.68;
      const ry = (0.145 * flare + 0.003) * frontConcave;
      return [rx, ry];
    },
    14,
    16,
    true
  );
  const earShellLeftGeo = mirrorGeometryX(earShellRightGeo);

  const innerEarSpineRight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.005, 0.02, 0.024),
    new THREE.Vector3(0.014, 0.14, 0.04),
    new THREE.Vector3(0.008, 0.27, 0.028),
    new THREE.Vector3(-0.012, 0.36, 0.004),
  ]);
  const innerEarRightGeo = buildSculptedTube(
    innerEarSpineRight,
    (t) => {
      const flare = Math.sin(t * Math.PI * 0.85 + 0.25) * (1 - t * 0.85);
      return [0.115 * flare + 0.002, 0.036 * flare + 0.002];
    },
    10,
    12,
    true
  );
  const innerEarLeftGeo = mirrorGeometryX(innerEarRightGeo);

  // 3. Curved Game-Style Fur Lock Geometry
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

  // 4. Curved Faceted Azurite Horns
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

  // 5. Scalloped 3-Bay Fairy-Dragon Wing Membranes
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
  const diamondEdgesGeo = new THREE.EdgesGeometry(diamondCrystalGeo, 15);

  const star4Shape = new THREE.Shape();
  star4Shape.moveTo(0, 0.055);
  star4Shape.quadraticCurveTo(0.01, 0.01, 0.055, 0);
  star4Shape.quadraticCurveTo(0.01, -0.01, 0, -0.055);
  star4Shape.quadraticCurveTo(-0.01, -0.01, -0.055, 0);
  star4Shape.quadraticCurveTo(-0.01, 0.01, 0, 0.055);
  const star4Geo = new THREE.ShapeGeometry(star4Shape, 6);

  const bflyWingShape = new THREE.Shape();
  bflyWingShape.moveTo(0, 0);
  bflyWingShape.quadraticCurveTo(0.048, 0.048, 0.062, 0.014);
  bflyWingShape.quadraticCurveTo(0.042, -0.01, 0.048, -0.034);
  bflyWingShape.quadraticCurveTo(0.02, -0.042, 0, -0.008);
  const butterflyWingGeo = new THREE.ShapeGeometry(bflyWingShape, 8);

  const woolRingOuterGeo = new THREE.TorusGeometry(0.068, 0.0065, 8, 28);
  const woolRingInnerGeo = new THREE.TorusGeometry(0.062, 0.0055, 8, 28);
  const spiritCoreGeo = new THREE.SphereGeometry(0.018, 10, 8);
  const spiritHaloGeo = new THREE.SphereGeometry(0.046, 12, 10);

  return {
    catHeadGeo,
    tailLowerGeo,
    tailUpperGeo,
    midPivot: [midPivotVec.x, midPivotVec.y, midPivotVec.z] as [number, number, number],
    earShellLeftGeo,
    earShellRightGeo,
    innerEarLeftGeo,
    innerEarRightGeo,
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
    diamondEdgesGeo,
    star4Geo,
    butterflyWingGeo,
    woolRingOuterGeo,
    woolRingInnerGeo,
    spiritCoreGeo,
    spiritHaloGeo,
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

/* ─── 3D Game-Style Magical Cat-Kitsune Model ─────────────────────────────── */
function AzuriteModel({ runtime }: { runtime: React.MutableRefObject<SharedRuntimeRef> }) {
  const rootRef = useRef<THREE.Group>(null);

  // Articulated 2-Segment Cat Spine + Spring-Animated Fur Ruff Groups
  const chestRef = useRef<THREE.Group>(null);
  const pelvisRef = useRef<THREE.Group>(null);
  const chestManeRef = useRef<THREE.Group>(null);
  const leftCheekRuffRef = useRef<THREE.Group>(null);
  const rightCheekRuffRef = useRef<THREE.Group>(null);

  const headRef = useRef<THREE.Group>(null);
  const noseRef = useRef<THREE.Mesh>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const auraRingRef = useRef<THREE.Mesh>(null);
  const auraInnerRingRef = useRef<THREE.Mesh>(null);
  const auraLightRef = useRef<THREE.PointLight>(null);

  // 3D Celestial Ice-Butterfly Wisp Refs
  const wispGroupRef = useRef<THREE.Group>(null);
  const wispLeftWingRef = useRef<THREE.Mesh>(null);
  const wispRightWingRef = useRef<THREE.Mesh>(null);

  // 3-Joint Articulated Legs & Cat Paws (Shoulder/Hip -> Shin -> Articulated Paw)
  const flLegRef = useRef<THREE.Group>(null);
  const frLegRef = useRef<THREE.Group>(null);
  const blLegRef = useRef<THREE.Group>(null);
  const brLegRef = useRef<THREE.Group>(null);
  const flLowerRef = useRef<THREE.Group>(null);
  const frLowerRef = useRef<THREE.Group>(null);
  const blLowerRef = useRef<THREE.Group>(null);
  const brLowerRef = useRef<THREE.Group>(null);
  const flPawRef = useRef<THREE.Group>(null);
  const frPawRef = useRef<THREE.Group>(null);
  const blPawRef = useRef<THREE.Group>(null);
  const brPawRef = useRef<THREE.Group>(null);

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

  const tailBaseRefs = useRef<(THREE.Group | null)[]>([]);
  const tailTipRefs = useRef<(THREE.Group | null)[]>([]);
  const spiritMoteRefs = useRef<(THREE.Group | null)[]>([]);
  const spiritOrbGroupRef = useRef<THREE.Group>(null);
  const spiritWoolRingOuterRef = useRef<THREE.Mesh>(null);
  const spiritWoolRingInnerRef = useRef<THREE.Mesh>(null);
  const spiritOrbWispRefs = useRef<(THREE.Mesh | null)[]>([]);

  const animStateRef = useRef({
    blinkTimer: 2.3,
    doubleBlinkPending: false,
    saccadeTimer: 1.5,
    saccadeX: 0,
    saccadeY: 0,
    breathPhase: 0,
    wingPhase: 0,
    tailPhase: 0,
    gaitPhase: 0,
    smoothRootX: 0,
    smoothRootY: -0.26,
    smoothRootZ: 0,
    smoothTiltX: 0,
    smoothTiltZ: 0,
    smoothSpinAngle: 0,
    smoothScaleY: 0.85,
    smoothScaleXZ: 0.85,
    smoothSitAmount: 0,
    smoothLoafAmount: 0,
    smoothCurlAmount: 0,
    smoothWingAmp: 0.055,
    smoothWingSpread: 0,
    smoothWagAmp: 0.045,
    smoothFlareSpread: 1,
    prevBallX: 0,
    curiosityTiltPhase: 0,
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
    smoothBlush: 0.22,
    smoothGlow: 0.34,
    smoothBankRoll: 0,
    smoothInertiaPitch: 0,
    smoothInertiaYaw: 0,
  });

  const geos = useMemo(() => createSculptedGeometries(), []);

  const assets = useMemo(() => {
    const headFurTex = createHeadFurTexture();
    const cheekFurTex = createCheekFurTexture();
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
        emissiveIntensity: 0.12,
      }),
      "#7dd3fc",
      0.35
    );
    const cheekFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: cheekFurTex,
        roughness: 0.7,
        metalness: 0.02,
        emissive: new THREE.Color("#bae6fd"),
        emissiveIntensity: 0.12,
      }),
      "#7dd3fc",
      0.35
    );
    const bodyFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: bodyFurTex,
        roughness: 0.7,
        metalness: 0.03,
        emissive: new THREE.Color("#bfdbfe"),
        emissiveIntensity: 0.11,
      }),
      "#a5b4fc",
      0.36
    );
    const snowFur = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#f5f9ff"),
        roughness: 0.72,
        metalness: 0.02,
        emissive: new THREE.Color("#dbeafe"),
        emissiveIntensity: 0.14,
      }),
      "#bae6fd",
      0.32
    );
    const pastelBlueFur = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#a8e0ff"),
        roughness: 0.7,
        metalness: 0.03,
        emissive: new THREE.Color("#7dd3fc"),
        emissiveIntensity: 0.14,
      }),
      "#7dd3fc",
      0.36
    );
    const chestLockMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: chestLockTex,
        roughness: 0.68,
        metalness: 0.03,
        emissive: new THREE.Color("#bae6fd"),
        emissiveIntensity: 0.12,
      }),
      "#93c5fd",
      0.34
    );
    const tailFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: tailFurTex,
        roughness: 0.68,
        metalness: 0.04,
        emissive: new THREE.Color("#93c5fd"),
        emissiveIntensity: 0.1,
      }),
      "#a855f7",
      0.38
    );
    const legFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: legFurTex,
        roughness: 0.66,
        metalness: 0.05,
        emissive: new THREE.Color("#a5b4fc"),
        emissiveIntensity: 0.08,
      }),
      "#818cf8",
      0.3
    );
    const earFurMat = applyFurRimShader(
      new THREE.MeshStandardMaterial({
        map: earFurTex,
        roughness: 0.68,
        metalness: 0.04,
        emissive: new THREE.Color("#a5b4fc"),
        emissiveIntensity: 0.1,
      }),
      "#a855f7",
      0.34
    );
    const innerEarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#d8b4fe"),
      roughness: 0.68,
      emissive: new THREE.Color("#a855f7"),
      emissiveIntensity: 0.14,
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
      envMapIntensity: 1.35,
      emissive: new THREE.Color("#7dd3fc"),
      emissiveIntensity: 0.18,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
    });
    const starryHornMat = new THREE.MeshPhysicalMaterial({
      map: crystalTex,
      roughness: 0.1,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.65,
      emissive: new THREE.Color("#6366f1"),
      emissiveIntensity: 0.3,
      flatShading: true,
    });
    const jetBlack = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#111018"),
      roughness: 0.48,
      metalness: 0.1,
    });
    const pawBeanMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#fda4af"),
      roughness: 0.4,
      emissive: new THREE.Color("#f472b6"),
      emissiveIntensity: 0.16,
    });
    const whiteFang = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
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
      envMapIntensity: 1.9,
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
    const scleraMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#f8fafc"),
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
      opacity: 0.92,
      side: THREE.DoubleSide,
    });
    const crystalEdgeMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#e0faff"),
      transparent: true,
      opacity: 0.55,
    });
    const mouthInterior = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#2b1038"),
      side: THREE.DoubleSide,
    });
    const tongueMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f472b6"),
      roughness: 0.45,
      emissive: new THREE.Color("#ec4899"),
      emissiveIntensity: 0.18,
    });
    const auraRingMat = new THREE.MeshBasicMaterial({
      map: auraRuneTex,
      color: new THREE.Color("#bae6fd"),
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const auraInnerRingMat = new THREE.MeshBasicMaterial({
      map: auraRuneTex,
      color: new THREE.Color("#d8b4fe"),
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const wispWingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#7dd3fc"),
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    return {
      textures: [
        headFurTex,
        cheekFurTex,
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
        cheekFurMat,
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
        pawBeanMat,
        whiteFang,
        irisMat,
        corneaMat,
        eyeshadowMat,
        scleraMat,
        pupilMat,
        catchlightMat,
        starGlintMat,
        crystalEdgeMat,
        mouthInterior,
        tongueMat,
        auraRingMat,
        auraInnerRingMat,
        wispWingMat,
      ],
      headFurMat,
      cheekFurMat,
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
      pawBeanMat,
      whiteFang,
      irisMat,
      corneaMat,
      eyeshadowMat,
      scleraMat,
      pupilMat,
      catchlightMat,
      starGlintMat,
      crystalEdgeMat,
      mouthInterior,
      tongueMat,
      auraRingMat,
      auraInnerRingMat,
      wispWingMat,
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
    const isTrickSpiritBall = trick === "spiritBallPlay";
    const isTrickSpin = trick === "spinJump";
    const isTrickWisp = trick === "wispPounce";
    const isTrickRoll = trick === "cuddleRoll";
    const isTrickBiscuits = trick === "makingBiscuits";
    const isTrickFlare = trick === "crystalFlare";
    const isTrickBunt = trick === "cheekBunt";
    const isTrickBow = trick === "playBow";
    const isTrickFlutter = trick === "wingFlutter";

    const idleAct = rt.idleAction;
    const idleProg =
      rt.idleActionDuration > 0 ? Math.max(0, 1 - rt.idleActionTimer / rt.idleActionDuration) : 0;
    const isIdleSpiritBall = idleAct === "playSpiritBall";
    const isLazySwat = idleAct === "lazySwat";
    const isEarScratch = idleAct === "earScratch";
    const isSniffInspect = idleAct === "sniffInspect";
    const isIdleBiscuits = idleAct === "makingBiscuits";
    const isCatFaceWash = idleAct === "catFaceWash";
    const isChaseWisp = idleAct === "chaseWisp";
    const isIdleRoll = idleAct === "cuddleRoll";
    const isIdleBunt = idleAct === "cheekBunt";
    const isStretchYawn = idleAct === "stretchYawn";
    const isIdleTaps = idleAct === "tippyTaps";
    const isTailPlay = idleAct === "tailPlay";

    const showSpiritBall = isIdleSpiritBall || isTrickSpiritBall;
    const spiritBallProg = isTrickSpiritBall ? trickProg : isIdleSpiritBall ? idleProg : 0;
    const showWisp = isChaseWisp || isTrickWisp;
    const activeWispProg = isTrickWisp ? trickProg : isChaseWisp ? idleProg : 0;

    // Directional & Progressive Cat Petting Zones
    const activePetting = rt.isPetting && !rt.isDragging;
    const isPetChin = activePetting && rt.pointerY > 0.22;
    const isPetCrown = activePetting && rt.pointerY < -0.22;
    const isPetCheek = activePetting && Math.abs(rt.pointerX) > 0.24 && !isPetChin && !isPetCrown;
    const isPetKneading =
      activePetting && rt.pettingDuration > 0.9 && rt.pettingDuration < 2.65 && !isPetCheek;
    const isPetFlop = activePetting && rt.pettingDuration >= 2.65;
    const isPostPetShake =
      !rt.isPetting && !rt.isDragging && rt.postPetTimer > 0 && trick === "none" && idleAct === "none";
    const postPetEnv = isPostPetShake
      ? Math.sin((1 - rt.postPetTimer / 0.65) * Math.PI) * (rt.postPetTimer / 0.65)
      : 0;

    const doingBiscuits = isTrickBiscuits || isIdleBiscuits || isPetKneading;
    const activeBiscuitEnv = isTrickBiscuits
      ? Math.sin(trickProg * Math.PI)
      : isIdleBiscuits
        ? Math.sin(idleProg * Math.PI)
        : isPetKneading
          ? Math.min(1, (rt.pettingDuration - 0.9) / 0.35)
          : 0;
    const doingRoll = isTrickRoll || isIdleRoll;
    const activeRollProg = isTrickRoll ? trickProg : isIdleRoll ? idleProg : 0;
    const doingBunt = isTrickBunt || isIdleBunt;
    const activeBuntProg = isTrickBunt ? trickProg : isIdleBunt ? idleProg : 0;
    const isStalking =
      rt.cursorStalkEnergy > 0.35 &&
      !rt.isDragging &&
      !rt.isWalking &&
      !rt.isPetting &&
      trick === "none" &&
      idleAct === "none" &&
      expr !== "sleepy";

    const kFast = Math.min(1, dt * 14);
    const kSmooth = Math.min(1, dt * 8);
    const kSlow = Math.min(1, dt * 5.5);
    const kPosture = Math.min(1, dt * 4.2);

    // Smooth Posture Lifecycle Blending (standing <-> sitting <-> loafing <-> curledSleep)
    const activePostureBlocked =
      rt.isDragging ||
      rt.isWalking ||
      isTrickSpin ||
      doingRoll ||
      showWisp ||
      showSpiritBall ||
      isTrickFlutter ||
      isTrickBow ||
      isIdleTaps ||
      isStretchYawn ||
      isStalking ||
      doingBunt;
    const targetSit =
      !activePostureBlocked && (rt.posture === "sitting" || isCatFaceWash || isEarScratch) ? 1 : 0;
    const targetLoaf =
      !activePostureBlocked && (rt.posture === "loafing" || rt.posture === "curledSleep") ? 1 : 0;
    const targetCurl = !activePostureBlocked && rt.posture === "curledSleep" ? 1 : 0;
    s.smoothSitAmount = THREE.MathUtils.lerp(s.smoothSitAmount, targetSit, kPosture);
    s.smoothLoafAmount = THREE.MathUtils.lerp(s.smoothLoafAmount, targetLoaf, kPosture);
    s.smoothCurlAmount = THREE.MathUtils.lerp(s.smoothCurlAmount, targetCurl, kPosture);

    const wakeEnv = rt.wakeUpTimer > 0 ? Math.sin((rt.wakeUpTimer / 0.75) * Math.PI) : 0;

    // 0. Celestial Ice-Butterfly Wisp flight trajectory (chaseWisp / wispPounce)
    let wispX = 0;
    let wispY = 0.6;
    if (wispGroupRef.current) {
      wispGroupRef.current.visible = showWisp;
      if (showWisp) {
        const p = activeWispProg;
        wispX = Math.sin(p * Math.PI * 3.4) * 0.34;
        wispY = 0.56 + Math.cos(p * Math.PI * 5.2) * 0.14 + (p > 0.72 ? (p - 0.72) * 0.6 : 0);
        const wispZ = 0.54 + Math.sin(p * Math.PI * 2) * 0.1;
        const wispScale = p < 0.15 ? p / 0.15 : p > 0.8 ? Math.max(0.01, 1 - (p - 0.8) / 0.2) : 1.0;
        wispGroupRef.current.position.set(wispX, wispY, wispZ);
        wispGroupRef.current.rotation.y = Math.cos(p * Math.PI * 3.4) * 0.5;
        wispGroupRef.current.scale.setScalar(wispScale);
        const flapBfly = 0.25 + Math.sin(t * 28) * 0.75;
        if (wispLeftWingRef.current) wispLeftWingRef.current.rotation.y = -flapBfly;
        if (wispRightWingRef.current) wispRightWingRef.current.rotation.y = flapBfly;
      }
    }

    // 0b. Light-Spirit Ball-of-Wool Play & Featured Firefly Mote Trajectory
    let ballX = 0;
    let ballY = 0.1;
    let ballSpinImpulse = 0;
    if (spiritOrbGroupRef.current) {
      spiritOrbGroupRef.current.visible = showSpiritBall;
      if (showSpiritBall) {
        const p = spiritBallProg;
        let ballZ = 0.48;
        let bounceSquash = 0;
        if (p < 0.24) {
          // Phase 1: appears near front-left paw; soft sniff then tentative nudge
          const p1 = p / 0.24;
          const pokeMove = THREE.MathUtils.smoothstep(p1, 0.58, 1.0);
          ballX = -0.17 + pokeMove * 0.19;
          ballY = 0.085 + Math.sin(p1 * Math.PI * 2) * 0.014;
          ballZ = 0.45 + pokeMove * 0.04;
          ballSpinImpulse = pokeMove * 2.2;
        } else if (p < 0.64) {
          // Phase 2: ping-pong batting back & forth across paws
          const p2 = (p - 0.24) / 0.4;
          ballX = Math.sin(p2 * Math.PI * 2.0 + 0.15) * 0.25;
          const hop = Math.abs(Math.sin(p2 * Math.PI * 4));
          ballY = 0.085 + hop * 0.072;
          bounceSquash = Math.max(0, 1 - hop * 4.5) * 0.14;
          ballZ = 0.48 + Math.cos(p2 * Math.PI * 2.0) * 0.055;
          ballSpinImpulse = 3.2 + Math.abs(Math.cos(p2 * Math.PI * 2.0)) * 4.5;
        } else if (p < 0.72) {
          // Phase 2b: ball pauses poised right side during predatory pre-pounce wiggle
          ballX = 0.16;
          ballY = 0.085;
          ballZ = 0.48;
          ballSpinImpulse = 0.8;
        } else {
          // Phase 3: pounce, draw in to chest & hug-kick
          const p3 = (p - 0.72) / 0.28;
          const pullIn = Math.min(1, p3 * 2.2);
          ballX = THREE.MathUtils.lerp(0.16, 0.0, pullIn);
          ballY = 0.13 + Math.sin(p3 * Math.PI) * 0.04;
          ballZ = THREE.MathUtils.lerp(0.48, 0.31, pullIn);
          ballSpinImpulse = 2.0 + Math.sin(t * 20) * 1.1;
        }
        const ballVelX = dt > 0 ? (ballX - s.prevBallX) / dt : 0;
        s.prevBallX = ballX;
        const orbScale =
          p < 0.08 ? p / 0.08 : p > 0.9 ? Math.max(0.01, (1 - p) / 0.1) : 1.0;
        spiritOrbGroupRef.current.position.set(ballX, ballY, ballZ);
        spiritOrbGroupRef.current.rotation.z -= ballVelX * dt * 6.5;
        spiritOrbGroupRef.current.scale.set(
          orbScale * (1 + bounceSquash),
          orbScale * (1 - bounceSquash * 0.85),
          orbScale * (1 + bounceSquash)
        );

        const ringSpin = t * 2.2 + ballSpinImpulse * 0.45;
        if (spiritWoolRingOuterRef.current) {
          spiritWoolRingOuterRef.current.rotation.x = ringSpin;
          spiritWoolRingOuterRef.current.rotation.y = ringSpin * 0.65;
        }
        if (spiritWoolRingInnerRef.current) {
          spiritWoolRingInnerRef.current.rotation.y = -ringSpin * 0.85;
          spiritWoolRingInnerRef.current.rotation.z = ringSpin * 0.55;
        }
        for (let wIdx = 0; wIdx < SPIRIT_BALL_WISP_PHASES.length; wIdx++) {
          const wMesh = spiritOrbWispRefs.current[wIdx];
          if (wMesh) {
            const wa = t * 3.4 + SPIRIT_BALL_WISP_PHASES[wIdx];
            const wr = 0.095 + Math.sin(t * 4.2 + wIdx) * 0.012;
            wMesh.position.set(Math.cos(wa) * wr, Math.sin(wa * 1.3) * 0.05, Math.sin(wa) * wr);
          }
        }
      } else {
        s.prevBallX = 0;
      }
    }

    // Featured ambient light spirit (#0) path — swatted in lazySwat, inspected in sniffInspect, lantern hover in nap
    const m0 = SPIRIT_MOTE_SPECS[0];
    const m0BaseAng = t * m0.speed + m0.phase;
    const rawM0X = Math.cos(m0BaseAng) * m0.radius;
    const rawM0Y = m0.yBase + Math.sin(t * 1.4 + m0.phase) * m0.bobAmp;
    const rawM0Z = Math.sin(m0BaseAng) * m0.radius;
    const m0IdleX = THREE.MathUtils.lerp(rawM0X, 0.24, s.smoothCurlAmount);
    const m0IdleY = THREE.MathUtils.lerp(rawM0Y, 0.32 + Math.sin(t * 1.4) * 0.03, s.smoothCurlAmount);
    const m0IdleZ = THREE.MathUtils.lerp(rawM0Z, 0.32, s.smoothCurlAmount);

    let swatMoteX = m0IdleX;
    let swatMoteY = m0IdleY;
    let swatMoteZ = m0IdleZ;
    if (isLazySwat) {
      const sp = idleProg;
      const arcSwat = Math.max(0, Math.sin(Math.max(0, (sp - 0.44) / 0.56) * Math.PI));
      swatMoteX = THREE.MathUtils.lerp(0.28, 0.14, Math.min(1, sp * 1.9)) + arcSwat * 0.34;
      swatMoteY = 0.28 + Math.sin(sp * Math.PI * 2) * 0.05 + arcSwat * 0.14;
      swatMoteZ = THREE.MathUtils.lerp(0.56, 0.44, Math.min(1, sp * 1.8)) + arcSwat * 0.18;
    } else if (isSniffInspect) {
      const sp = idleProg;
      const sniffBreathBob = Math.max(0, Math.sin(sp * Math.PI * 5)) * 0.035;
      swatMoteX = 0.03 + Math.sin(sp * Math.PI * 2) * 0.035;
      swatMoteY = 0.34 + Math.cos(sp * Math.PI * 3) * 0.02;
      swatMoteZ = 0.55 + sniffBreathBob;
    }

    // Smooth body yaw + turn anticipation + motion velocity banking & drag inertia
    let yawDiff = rt.facingYaw - s.smoothYaw;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    s.smoothYaw += yawDiff * Math.min(1, dt * 6.5);
    const turnRate = rt.isWalking ? THREE.MathUtils.clamp(yawDiff * 2.2, -0.28, 0.28) : 0;

    const targetBankRoll = rt.isDragging
      ? THREE.MathUtils.clamp(-rt.lateralVelX * 0.24, -0.26, 0.26)
      : rt.isWalking
        ? THREE.MathUtils.clamp(-rt.lateralVelX * 0.15, -0.15, 0.15)
        : 0;
    const targetInertiaPitch = rt.isDragging
      ? THREE.MathUtils.clamp(rt.lateralVelY * 0.2, -0.22, 0.22)
      : 0;
    const targetInertiaYaw = rt.isDragging ? THREE.MathUtils.clamp(rt.lateralVelX * 0.22, -0.26, 0.26) : 0;
    s.smoothBankRoll = THREE.MathUtils.lerp(s.smoothBankRoll, targetBankRoll, kSmooth);
    s.smoothInertiaPitch = THREE.MathUtils.lerp(s.smoothInertiaPitch, targetInertiaPitch, kSmooth);
    s.smoothInertiaYaw = THREE.MathUtils.lerp(s.smoothInertiaYaw, targetInertiaYaw, kSmooth);

    // 1. Damped Root Transform, Posture Blending & Continuous 4-Beat Gait Phase
    const gaitFreq = rt.isWalking ? 6.6 + rt.moveSpeed * 3.4 : 0;
    if (rt.isWalking) {
      s.gaitPhase += dt * gaitFreq;
    }
    const gaitPhase = s.gaitPhase;
    let gaitYOffset = 0;
    if (rootRef.current) {
      let yOffset = 0;
      let xOffset = 0;
      let zOffset = 0;
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
      } else if (doingRoll) {
        // Playful Cat Side-Flop & Belly-Up Cuddle Roll!
        const rollEnv = THREE.MathUtils.smoothstep(Math.sin(activeRollProg * Math.PI), 0, 0.85);
        yOffset = 0.24 * rollEnv;
        xOffset = Math.sin(t * 3.5) * 0.05 * rollEnv;
        tiltZ = 2.45 * rollEnv + Math.sin(t * 6) * 0.12 * rollEnv;
        tiltX = -0.25 * rollEnv;
        spinAngle = 0.35 * rollEnv;
      } else if (showSpiritBall) {
        const p = spiritBallProg;
        if (p < 0.24) {
          const env = Math.sin((p / 0.24) * Math.PI);
          yOffset = -0.025 * env;
          tiltX = 0.08 * env;
          scaleY = 1 - 0.05 * env;
        } else if (p < 0.64) {
          const p2 = (p - 0.24) / 0.4;
          yOffset = Math.abs(Math.sin(p2 * Math.PI * 4)) * 0.024;
          tiltZ = -Math.sin(p2 * Math.PI * 2.0) * 0.075;
        } else if (p < 0.72) {
          const pw = (p - 0.64) / 0.08;
          const crouch = Math.sin(pw * Math.PI);
          yOffset = -0.05 * crouch;
          tiltX = 0.12 * crouch;
          scaleY = 1 - 0.08 * crouch;
        } else {
          const p3 = (p - 0.72) / 0.28;
          if (p3 < 0.36) {
            const hop = Math.sin((p3 / 0.36) * Math.PI);
            yOffset = hop * 0.14;
            zOffset = hop * 0.07;
            tiltX = 0.1 * hop;
          } else {
            const hug = Math.sin(((p3 - 0.36) / 0.64) * Math.PI);
            yOffset = -0.03 * hug;
            tiltX = -0.22 * hug;
            scaleY = 1 - 0.06 * hug;
            scaleXZ = 1 + 0.05 * hug;
          }
        }
      } else if (isLazySwat) {
        const env = Math.sin(idleProg * Math.PI);
        yOffset = -0.018 * env - s.smoothSitAmount * 0.022;
        tiltZ = -0.05 * env;
      } else if (showWisp) {
        const p = activeWispProg;
        if (p < 0.56) {
          const env = Math.sin((p / 0.56) * Math.PI);
          yOffset = -0.055 * env;
          tiltX = 0.12 * env;
          scaleY = 1 - 0.08 * env;
        } else if (p < 0.86) {
          const lp = (p - 0.56) / 0.3;
          const arc = Math.sin(lp * Math.PI);
          yOffset = arc * 0.26;
          zOffset = arc * 0.12;
          tiltX = -0.14 * arc;
        } else {
          const lp = (p - 0.86) / 0.14;
          const sq = Math.sin(lp * Math.PI);
          scaleY = 1 - sq * 0.12;
          scaleXZ = 1 + sq * 0.08;
        }
      } else if (doingBunt) {
        // Affectionate Cat Cheek Bunt & Headbonk toward user
        const env = Math.sin(activeBuntProg * Math.PI);
        zOffset = 0.16 * env;
        yOffset = 0.04 * env;
        tiltX = 0.12 * env;
      } else if (isPetFlop) {
        // Cozy half-side cuddle lean after prolonged petting
        const flopBlend = Math.min(1, (rt.pettingDuration - 2.65) / 0.6);
        const sideDir = rt.pointerX >= 0 ? 1 : -1;
        yOffset = -0.045 * flopBlend + Math.sin(t * 4.4) * 0.008;
        tiltZ = (sideDir * 0.18 + Math.sin(t * 3.5) * 0.025) * flopBlend;
        tiltX = -0.04 * flopBlend;
        scaleY = 1 - 0.05 * flopBlend;
        scaleXZ = 1 + 0.04 * flopBlend;
      } else if (doingBiscuits) {
        yOffset = -0.028 * activeBiscuitEnv + Math.sin(t * 10) * 0.012 * activeBiscuitEnv - s.smoothSitAmount * 0.018;
        tiltX = 0.07 * activeBiscuitEnv;
      } else if (activePetting) {
        yOffset = -0.015 + Math.sin(t * 4.4) * 0.006 - s.smoothSitAmount * 0.015;
        tiltZ = isPetCheek ? THREE.MathUtils.clamp(rt.pointerX * 0.09, -0.1, 0.1) : 0;
      } else if (isTrickFlutter) {
        const env = Math.sin(trickProg * Math.PI);
        yOffset = (0.18 + Math.sin(t * 9) * 0.05) * env;
        xOffset = Math.sin(t * 4.5) * 0.06 * env;
        tiltX = 0.09 * env;
        tiltZ = -Math.cos(t * 4.5) * 0.08 * env;
      } else if (isTrickBow) {
        const env = Math.sin(trickProg * Math.PI);
        yOffset = Math.abs(Math.sin(t * 6.5)) * 0.03;
        tiltX = 0.14 * env;
      } else if (isIdleTaps) {
        const env = Math.sin(idleProg * Math.PI);
        yOffset = Math.abs(Math.sin(t * 17)) * 0.055 * env;
        tiltZ = Math.sin(t * 8.5) * 0.07 * env;
      } else if (isStretchYawn) {
        const env = Math.sin(idleProg * Math.PI);
        yOffset = -0.04 * env;
        scaleY = 1 - 0.04 * env;
      } else if (isTailPlay) {
        const env = Math.sin(idleProg * Math.PI);
        spinAngle = -0.35 * env;
        yOffset = -s.smoothSitAmount * 0.022;
        tiltZ = Math.sin(t * 10) * 0.06 * env;
      } else if (isEarScratch) {
        const env = Math.sin(idleProg * Math.PI);
        yOffset = -0.025 * env - s.smoothSitAmount * 0.02;
        tiltZ = -0.1 * env;
      } else if (isSniffInspect) {
        const env = Math.sin(idleProg * Math.PI);
        zOffset = 0.055 * env;
        yOffset = -0.015 * env - s.smoothSitAmount * 0.02;
        tiltX = 0.06 * env;
      } else if (isStalking) {
        // Low stalking cat crouch!
        yOffset = -0.045;
        tiltX = 0.1;
        scaleY = 0.94;
        scaleXZ = 1.04;
      } else if (isTrickFlare) {
        const env = Math.sin(trickProg * Math.PI);
        yOffset = 0.11 * env + Math.sin(t * 5) * 0.02;
        tiltX = -0.08 * env;
      } else if (rt.isWalking) {
        gaitYOffset = Math.abs(Math.sin(gaitPhase * 2)) * 0.034 * (0.4 + rt.moveSpeed * 0.6);
        yOffset = gaitYOffset;
        tiltZ = s.smoothBankRoll;
      } else if (expr === "surprised") {
        yOffset = Math.abs(Math.sin(t * 10)) * 0.07;
        tiltX = -0.08;
      } else {
        // Unified damped posture lifecycle + wake-up + calm breathing sway
        const restAtten = 1 - s.smoothLoafAmount * 0.72;
        yOffset =
          Math.sin(t * 1.85) * 0.01 * restAtten +
          rt.scrollImpulse * 0.038 * restAtten -
          s.smoothSitAmount * 0.022 -
          s.smoothLoafAmount * 0.055 +
          wakeEnv * 0.025;
        tiltX =
          s.smoothLoafAmount * 0.05 +
          rt.cursorProximity * 0.03 * (1 - s.smoothLoafAmount) -
          wakeEnv * 0.06;
        tiltZ = Math.sin(t * 0.72) * 0.012 * restAtten;
      }

      if (rt.landingTimer > 0) {
        const lp = 1 - rt.landingTimer / 0.45;
        const bounce = Math.sin(lp * Math.PI * 2) * (1 - lp);
        scaleY *= 1 - bounce * 0.14;
        scaleXZ *= 1 + bounce * 0.09;
        yOffset -= Math.max(0, bounce) * 0.04;
      }

      const kRoot = Math.min(1, dt * 13);
      s.smoothRootX = THREE.MathUtils.lerp(s.smoothRootX, xOffset, kRoot);
      s.smoothRootY = THREE.MathUtils.lerp(s.smoothRootY, -0.26 + yOffset, kRoot);
      s.smoothRootZ = THREE.MathUtils.lerp(s.smoothRootZ, zOffset, kRoot);
      s.smoothSpinAngle = THREE.MathUtils.lerp(s.smoothSpinAngle, spinAngle, kRoot);
      s.smoothTiltX = THREE.MathUtils.lerp(s.smoothTiltX, tiltX, kRoot);
      s.smoothTiltZ = THREE.MathUtils.lerp(s.smoothTiltZ, tiltZ, kRoot);
      s.smoothScaleY = THREE.MathUtils.lerp(s.smoothScaleY, 0.85 * scaleY, kRoot);
      s.smoothScaleXZ = THREE.MathUtils.lerp(s.smoothScaleXZ, 0.85 * scaleXZ, kRoot);

      rootRef.current.position.set(s.smoothRootX, s.smoothRootY, s.smoothRootZ);
      rootRef.current.rotation.y = s.smoothYaw + s.smoothSpinAngle + s.smoothInertiaYaw * 0.45;
      rootRef.current.rotation.x = s.smoothTiltX;
      rootRef.current.rotation.z = s.smoothTiltZ;
      rootRef.current.scale.set(s.smoothScaleXZ, s.smoothScaleY, s.smoothScaleXZ);
    }

    // 2. Articulated 2-Segment Cat Spine (Continuous Phase Breathing + Sitting/Loaf + Turn Curve + Coat Shake)
    const breathFreq =
      s.smoothLoafAmount > 0.45 || expr === "sleepy"
        ? 1.35
        : activePetting || doingBiscuits
          ? 4.0
          : isStretchYawn
            ? 2.0
            : 2.45;
    s.breathPhase += dt * breathFreq;
    const breathAmp =
      s.smoothLoafAmount > 0.45 || expr === "sleepy"
        ? 0.022
        : activePetting || doingBiscuits
          ? 0.02
          : isStretchYawn
            ? 0.036
            : 0.013;
    const breathChest = Math.sin(s.breathPhase) * breathAmp;
    const breathPelvis = Math.sin(s.breathPhase - 0.55) * breathAmp * 0.78;
    const purrVib = activePetting || doingBiscuits ? Math.sin(t * 44) * 0.004 : 0;

    let chestPitch = -s.smoothSitAmount * 0.14 + s.smoothLoafAmount * 0.1;
    let chestYaw = s.smoothHeadYaw * 0.22;
    let chestRoll = s.smoothHeadRoll * 0.16;
    let chestY = s.smoothSitAmount * 0.022 - s.smoothLoafAmount * 0.012;
    let pelvisPitch = -s.smoothSitAmount * 0.34 - s.smoothLoafAmount * 0.1;
    let pelvisYaw = 0;
    let pelvisRoll = 0;
    let pelvisY = -s.smoothSitAmount * 0.072 - s.smoothLoafAmount * 0.02;

    if (isStretchYawn) {
      // 2-Phase Cat Stretch: 0..0.48 deep front bow-stretch -> 0.48..1.0 arched Halloween-cat stretch
      if (idleProg < 0.48) {
        const p = Math.sin((idleProg / 0.48) * Math.PI);
        chestPitch = 0.34 * p;
        chestY = -0.04 * p;
        pelvisPitch = -0.26 * p;
        pelvisY = 0.04 * p;
      } else {
        const p = Math.sin(((idleProg - 0.48) / 0.52) * Math.PI);
        chestPitch = -0.26 * p;
        chestY = 0.035 * p;
        pelvisPitch = 0.36 * p;
        pelvisY = 0.045 * p;
      }
    } else if (showSpiritBall) {
      const p = spiritBallProg;
      if (p < 0.24) {
        const env = Math.sin((p / 0.24) * Math.PI);
        chestPitch = 0.24 * env;
        chestY = -0.025 * env;
        pelvisPitch = -0.1 * env;
      } else if (p < 0.64) {
        const p2 = (p - 0.24) / 0.4;
        chestYaw = Math.sin(p2 * Math.PI * 2.0) * 0.22;
        pelvisYaw = -Math.sin(p2 * Math.PI * 2.0) * 0.1;
        chestPitch = 0.1;
      } else if (p < 0.72) {
        const pw = (p - 0.64) / 0.08;
        const env = Math.sin(pw * Math.PI);
        chestPitch = 0.22 * env;
        chestY = -0.02 * env;
        pelvisPitch = -0.16 * env;
        pelvisYaw = Math.sin(t * 24) * 0.22 * env;
        pelvisRoll = Math.sin(t * 24) * 0.12 * env;
      } else {
        const p3 = (p - 0.72) / 0.28;
        const hug = Math.sin(p3 * Math.PI);
        chestPitch = 0.14 * hug;
        pelvisPitch = -0.18 * hug;
      }
    } else if (isLazySwat) {
      const env = Math.sin(idleProg * Math.PI);
      chestYaw += -0.12 * env;
      chestRoll += -0.05 * env;
    } else if (isSniffInspect) {
      const env = Math.sin(idleProg * Math.PI);
      chestPitch += 0.18 * env;
      chestY -= 0.015 * env;
    } else if (isEarScratch) {
      const env = Math.sin(idleProg * Math.PI);
      chestRoll += -0.1 * env;
      pelvisRoll += 0.08 * env;
    } else if (showWisp && activeWispProg < 0.56) {
      // Iconic pre-pounce cat butt-wiggle!
      const env = Math.sin((activeWispProg / 0.56) * Math.PI);
      chestPitch = 0.24 * env;
      chestY = -0.025 * env;
      pelvisPitch = -0.18 * env;
      pelvisYaw = Math.sin(t * 22) * 0.24 * env;
      pelvisRoll = Math.sin(t * 22) * 0.14 * env;
    } else if (isPetCrown) {
      // Cat "elevator butt" lumbar arch when crown/back is petted!
      chestPitch = 0.14;
      chestY = -0.02;
      pelvisPitch = -0.22;
      pelvisY = 0.06;
    } else if (isPetChin) {
      chestPitch = -0.12;
      chestY = 0.015;
    } else if (doingBiscuits) {
      chestPitch += 0.15 * activeBiscuitEnv;
      chestYaw += Math.sin(t * 9) * 0.075 * activeBiscuitEnv;
      pelvisPitch += -0.1 * activeBiscuitEnv;
    } else if (isTrickBow) {
      const env = Math.sin(trickProg * Math.PI);
      chestPitch = 0.28 * env;
      chestY = -0.03 * env;
      pelvisPitch = -0.22 * env;
    } else if (rt.isWalking) {
      // Slinky feline spine counter-rotation + natural turn lead/trail
      const sp = Math.sin(gaitPhase);
      chestYaw = sp * 0.08 + turnRate * 0.65;
      pelvisYaw = -sp * 0.1 - turnRate * 0.55;
      chestRoll = Math.cos(gaitPhase) * 0.045;
      pelvisRoll = -Math.cos(gaitPhase) * 0.055;
    } else if (isPostPetShake) {
      // Traveling nose-to-tail fur-coat shake wave!
      chestRoll += Math.sin(t * 42 - 0.8) * 0.22 * postPetEnv;
      pelvisRoll += Math.sin(t * 42 - 1.6) * 0.16 * postPetEnv;
    }

    if (chestRef.current) {
      chestRef.current.position.y = THREE.MathUtils.lerp(chestRef.current.position.y, 0.36 + chestY, kFast);
      chestRef.current.rotation.x = THREE.MathUtils.lerp(chestRef.current.rotation.x, chestPitch, kFast);
      chestRef.current.rotation.y = THREE.MathUtils.lerp(chestRef.current.rotation.y, chestYaw, kFast);
      chestRef.current.rotation.z = THREE.MathUtils.lerp(chestRef.current.rotation.z, chestRoll, kFast);
      chestRef.current.scale.set(1 + breathChest * 0.5 + purrVib, 1 - breathChest * 0.35, 1 + breathChest * 0.5);
    }
    if (pelvisRef.current) {
      pelvisRef.current.position.y = THREE.MathUtils.lerp(pelvisRef.current.position.y, 0.35 + pelvisY, kFast);
      pelvisRef.current.rotation.x = THREE.MathUtils.lerp(pelvisRef.current.rotation.x, pelvisPitch, kFast);
      pelvisRef.current.rotation.y = THREE.MathUtils.lerp(pelvisRef.current.rotation.y, pelvisYaw, kFast);
      pelvisRef.current.rotation.z = THREE.MathUtils.lerp(pelvisRef.current.rotation.z, pelvisRoll, kFast);
      pelvisRef.current.scale.set(1 + breathPelvis * 0.45, 1 - breathPelvis * 0.35, 1 + breathPelvis * 0.45);
    }

    // Secondary follow-through spring on chest mane & cheek ruffs
    if (chestManeRef.current) {
      chestManeRef.current.rotation.x = -breathChest * 2.2 + (rt.isWalking ? -Math.abs(Math.sin(gaitPhase)) * 0.08 : 0);
      chestManeRef.current.rotation.z = -s.smoothHeadRoll * 0.32;
    }
    if (leftCheekRuffRef.current) {
      leftCheekRuffRef.current.rotation.z = breathChest * 1.4 + (doingRoll ? 0.12 : 0);
    }
    if (rightCheekRuffRef.current) {
      rightCheekRuffRef.current.rotation.z = -breathChest * 1.4 - (doingRoll ? 0.12 : 0);
    }

    // 3. Head tracking, spirit awareness, stabilization, sniff bursts, ear scratch & wake-up
    const pointerIdleMs = performance.now() - rt.lastPointerMoveAt;
    const isRestingNap = s.smoothLoafAmount > 0.45 || expr === "sleepy";
    const trackAmbientSpirit =
      pointerIdleMs > 1400 &&
      !activePetting &&
      !rt.isDragging &&
      !rt.isWalking &&
      !showWisp &&
      !showSpiritBall &&
      !isLazySwat &&
      !isSniffInspect &&
      !isEarScratch &&
      !isRestingNap;

    if (pointerIdleMs > 1400 && !trackAmbientSpirit && !isRestingNap) {
      s.saccadeTimer -= dt;
      if (s.saccadeTimer <= 0) {
        s.saccadeTimer = 1.8 + Math.random() * 2.4;
        s.saccadeX = (Math.random() - 0.5) * 0.32;
        s.saccadeY = (Math.random() - 0.5) * 0.18;
      }
    } else {
      s.saccadeX = 0;
      s.saccadeY = 0;
    }

    const pointerSteerX = showSpiritBall
      ? ballX * 2.1
      : isLazySwat || isSniffInspect
        ? swatMoteX * 1.5
        : showWisp
          ? wispX * 1.45
          : trackAmbientSpirit
            ? m0IdleX * 0.65
            : isRestingNap
              ? 0
              : rt.pointerX;
    const pointerSteerY = showSpiritBall
      ? -(ballY - 0.36) * 1.25
      : isLazySwat || isSniffInspect
        ? -(swatMoteY - 0.42) * 1.4
        : showWisp
          ? -(wispY - 0.72) * 1.6
          : trackAmbientSpirit
            ? -(m0IdleY - 0.45) * 0.8
            : isRestingNap
              ? 0
              : rt.pointerY;

    const rawYaw = THREE.MathUtils.clamp(pointerSteerX * 0.46 + s.saccadeX * 0.3 + rt.lateralVelX * 0.16, -0.52, 0.52);
    const rawPitch = THREE.MathUtils.clamp(-pointerSteerY * 0.26 - s.saccadeY * 0.22, -0.28, 0.28);
    s.smoothHeadYaw = THREE.MathUtils.lerp(s.smoothHeadYaw, rawYaw, kSmooth);
    s.smoothHeadPitch = THREE.MathUtils.lerp(s.smoothHeadPitch, rawPitch, kSmooth);

    let targetRollZ = 0;
    let extraHeadPitch = s.smoothLoafAmount * 0.12 + s.smoothCurlAmount * 0.16 + s.smoothSitAmount * 0.08;
    let extraHeadYaw = s.smoothCurlAmount * 0.26;
    targetRollZ += s.smoothCurlAmount * 0.22;

    if (expr === "curious" && !isRestingNap) {
      targetRollZ += Math.sin(t * 1.2) * 0.055 + (pointerSteerX >= 0 ? -0.065 : 0.065);
    }
    if (expr === "happy") targetRollZ += Math.sin(t * 4.2) * 0.075;
    if (rt.cursorProximity > 0.25 && !activePetting && !isRestingNap) {
      extraHeadPitch -= 0.08 * rt.cursorProximity;
    }
    if (wakeEnv > 0) {
      extraHeadPitch -= 0.16 * wakeEnv;
      targetRollZ += 0.14 * wakeEnv;
    }
    if (activePetting) {
      if (isPetChin) {
        // Fond chin-lift into scratches
        extraHeadPitch = -0.26;
        extraHeadYaw = THREE.MathUtils.clamp(rt.pointerX * 0.16, -0.18, 0.18);
        targetRollZ = Math.sin(t * 3.8) * 0.07;
      } else if (isPetCrown) {
        // Blissful dip under crown rubs
        extraHeadPitch = 0.14;
        extraHeadYaw = THREE.MathUtils.clamp(rt.pointerX * 0.12, -0.14, 0.14);
        targetRollZ = THREE.MathUtils.clamp(rt.pointerX * 0.18, -0.2, 0.2);
      } else if (isPetCheek) {
        // Leaning & rubbing cheek right into user's side
        targetRollZ = THREE.MathUtils.clamp(rt.pointerX * 0.34, -0.34, 0.34) + Math.sin(t * 6.5) * 0.05;
        extraHeadYaw = THREE.MathUtils.clamp(rt.pointerX * 0.24, -0.26, 0.26);
        extraHeadPitch = -0.06;
      } else if (isPetFlop) {
        targetRollZ = (rt.pointerX >= 0 ? 0.28 : -0.28) + Math.sin(t * 3.2) * 0.04;
        extraHeadPitch = 0.06;
      } else {
        targetRollZ = THREE.MathUtils.clamp(rt.pointerX * 0.22, -0.24, 0.24) + Math.sin(t * 5) * 0.04;
        extraHeadYaw = THREE.MathUtils.clamp(rt.pointerX * 0.14, -0.18, 0.18);
        extraHeadPitch = -0.08;
      }
    }
    if (isPostPetShake) {
      // Quick crisp post-pet head & ear shake (lead wave)
      targetRollZ = Math.sin(t * 42) * 0.42 * postPetEnv;
      extraHeadYaw = Math.cos(t * 42) * 0.26 * postPetEnv;
    }
    if (doingBunt) {
      // Smooth cheek-rubbing arc
      const env = Math.sin(activeBuntProg * Math.PI);
      const rub = Math.sin(activeBuntProg * Math.PI * 2.4);
      targetRollZ = rub * 0.34 * env;
      extraHeadYaw = -rub * 0.28 * env;
      extraHeadPitch = -0.1 * env;
    }
    if (doingRoll) {
      const env = Math.sin(activeRollProg * Math.PI);
      targetRollZ = -0.35 * env;
      extraHeadPitch = -0.22 * env;
      extraHeadYaw = Math.sin(t * 4) * 0.18 * env;
    }
    if (showSpiritBall) {
      if (spiritBallProg < 0.24) {
        extraHeadPitch = 0.24;
        targetRollZ = -0.16;
      } else if (spiritBallProg < 0.72) {
        targetRollZ = -ballX * 0.65;
        extraHeadPitch = 0.12;
      } else {
        extraHeadPitch = 0.18;
        targetRollZ = Math.sin(t * 16) * 0.08;
      }
    }
    if (isLazySwat) {
      const env = Math.sin(idleProg * Math.PI);
      targetRollZ = -0.16 * env;
      extraHeadPitch = 0.06 * env;
    }
    if (isSniffInspect) {
      const env = Math.sin(idleProg * Math.PI);
      extraHeadPitch = 0.18 * env;
      targetRollZ = Math.sin(idleProg * Math.PI * 2.5) * 0.12 * env;
    }
    if (isEarScratch) {
      const env = Math.sin(idleProg * Math.PI);
      const scratchShake = idleProg > 0.8 ? Math.sin(t * 40) * 0.24 * ((1 - idleProg) / 0.2) : 0;
      targetRollZ = (idleProg > 0.8 ? scratchShake : 0.38 * env) + Math.sin(t * 36) * 0.04 * env;
      extraHeadYaw = -0.22 * env;
      extraHeadPitch = 0.15 * env;
    }
    if (doingBiscuits && !activePetting) {
      targetRollZ = Math.sin(t * 4.5) * 0.12 * activeBiscuitEnv;
      extraHeadPitch = 0.14 * activeBiscuitEnv;
    }
    if (expr === "playful" && !showSpiritBall) targetRollZ = -0.15;
    if (expr === "surprised") extraHeadPitch = -0.14;
    if (isTailPlay) {
      const env = Math.sin(idleProg * Math.PI);
      extraHeadYaw = -0.42 * env;
      extraHeadPitch = 0.14 * env;
      targetRollZ = -0.2 * env;
    }
    if (isStretchYawn) {
      const env = Math.sin(idleProg * Math.PI);
      extraHeadPitch = idleProg > 0.45 ? -0.32 * env : -0.18 * env;
      targetRollZ = 0.08 * Math.sin(t * 3) * env;
    }
    if (isIdleTaps) {
      targetRollZ = Math.sin(t * 12) * 0.14 * Math.sin(idleProg * Math.PI);
    }
    if (isCatFaceWash) {
      // Phase 1: 3 wrist licks; Phase 2: 2 circular groom wipes over cheek & ear!
      const env = Math.sin(idleProg * Math.PI);
      if (idleProg < 0.42) {
        const lickNod = Math.sin((idleProg / 0.42) * Math.PI * 3) * 0.06;
        extraHeadPitch = (0.24 + lickNod) * env;
        extraHeadYaw = 0.22 * env;
        targetRollZ = 0.16 * env;
      } else {
        const wipe = Math.sin(((idleProg - 0.42) / 0.58) * Math.PI * 4);
        extraHeadPitch = 0.14 * env;
        extraHeadYaw = 0.34 * env;
        targetRollZ = (0.36 + wipe * 0.16) * env;
      }
    }
    s.smoothHeadRoll = THREE.MathUtils.lerp(s.smoothHeadRoll, targetRollZ, isPostPetShake ? kFast : kSmooth);

    if (headRef.current) {
      // Feline gait head counter-bob stabilization + chin lift + sniff neck extension
      const targetHeadY =
        0.44 + (rt.isWalking ? -gaitYOffset * 0.55 : isPetChin ? 0.025 : isSniffInspect ? -0.015 : 0);
      const targetHeadZ =
        0.06 +
        (isSniffInspect
          ? 0.038 * Math.sin(idleProg * Math.PI)
          : rt.cursorProximity > 0.25 && !isPetCrown && !isRestingNap
            ? 0.02 * rt.cursorProximity
            : 0);
      headRef.current.position.y = THREE.MathUtils.lerp(headRef.current.position.y, targetHeadY, kFast);
      headRef.current.position.z = THREE.MathUtils.lerp(headRef.current.position.z, targetHeadZ, kFast);
      headRef.current.rotation.y = s.smoothHeadYaw * 0.74 + extraHeadYaw;
      headRef.current.rotation.x = s.smoothHeadPitch + extraHeadPitch;
      headRef.current.rotation.z = s.smoothHeadRoll;
    }

    if (noseRef.current) {
      // Realistic multi-sniff burst cadence (3 rapid sniffs -> brief pause -> 2 rapid sniffs)
      const inSniffBurst =
        isSniffInspect ||
        (rt.cursorProximity > 0.35 && !activePetting && !isRestingNap) ||
        (showSpiritBall && spiritBallProg < 0.24) ||
        isStalking;
      const cycle = (t * 0.85) % 1;
      const burstMask =
        cycle < 0.45 || (cycle > 0.58 && cycle < 0.85) ? Math.sin(((t * 6.5) % 1) * Math.PI) : 0;
      const sniffPhase = inSniffBurst
        ? Math.sin(t * 28) * 0.006 * burstMask
        : Math.sin(t * 2.2) > 0.78 && !isRestingNap
          ? Math.sin(t * 24) * 0.004
          : 0;
      noseRef.current.position.y = -0.055 + sniffPhase;
    }

    // 4. Cat Airplane Ears, Ear-Scratch Fold & Independent Radar Tracking
    const airplaneEars = showWisp || isStalking || doingBiscuits || doingBunt || isPetCrown || isPetFlop;
    const earBaseAngle = isPetCrown
      ? 0.72
      : isStretchYawn
        ? 0.56
        : s.smoothLoafAmount > 0.45
          ? 0.62
          : airplaneEars
            ? 0.62
            : showSpiritBall || isLazySwat || isSniffInspect
              ? 0.39
              : isIdleTaps || expr === "surprised" || expr === "excited"
                ? 0.34
                : expr === "happy"
                  ? 0.52
                  : 0.44;
    const earFlattenX = isPetCrown
      ? 0.28
      : s.smoothLoafAmount > 0.45 || isStretchYawn
        ? 0.2
        : activePetting || doingBunt || airplaneEars
          ? 0.18
          : wakeEnv > 0.1 || rt.cursorProximity > 0.25
            ? -0.1 * Math.max(wakeEnv, rt.cursorProximity)
            : showSpiritBall || expr === "surprised" || isSniffInspect
              ? -0.12
              : 0;
    const earTwitchL = isPostPetShake
      ? Math.sin(t * 44) * 0.28 * postPetEnv
      : Math.sin(t * 9.5) > 0.94 || rt.scrollImpulse > 0.2
        ? Math.sin(t * 40) * 0.16
        : 0;
    const earTwitchR = isPostPetShake
      ? Math.cos(t * 44) * 0.28 * postPetEnv
      : Math.cos(t * 8.3) > 0.95 || rt.scrollImpulse > 0.2
        ? Math.cos(t * 40) * 0.14
        : 0;
    const scratchFoldR = isEarScratch && idleProg < 0.8 ? Math.sin((idleProg / 0.8) * Math.PI) : 0;
    if (leftEarRef.current) {
      leftEarRef.current.rotation.z = THREE.MathUtils.lerp(leftEarRef.current.rotation.z, earBaseAngle + earTwitchL, kSmooth);
      leftEarRef.current.rotation.x = THREE.MathUtils.lerp(leftEarRef.current.rotation.x, earFlattenX + s.smoothHeadPitch * 0.35, kSmooth);
      leftEarRef.current.rotation.y = THREE.MathUtils.lerp(leftEarRef.current.rotation.y, 0.14 + Math.max(0, -pointerSteerX) * 0.22, kSlow);
    }
    if (rightEarRef.current) {
      rightEarRef.current.rotation.z = THREE.MathUtils.lerp(
        rightEarRef.current.rotation.z,
        -earBaseAngle - earTwitchR - scratchFoldR * 0.38,
        kSmooth
      );
      rightEarRef.current.rotation.x = THREE.MathUtils.lerp(
        rightEarRef.current.rotation.x,
        earFlattenX + s.smoothHeadPitch * 0.35 + scratchFoldR * 0.34,
        kSmooth
      );
      rightEarRef.current.rotation.y = THREE.MathUtils.lerp(rightEarRef.current.rotation.y, -0.14 - Math.max(0, pointerSteerX) * 0.22, kSlow);
    }

    // 5. Calm Articulated Wing Flight (Continuous Phase Accumulator + Folded Resting Pose)
    const wingSpeed =
      isTrickFlutter || isTrickSpin
        ? 18.5
        : isIdleTaps || showWisp || showSpiritBall || expr === "excited"
          ? 8.5
          : activePetting
            ? 5.5
            : s.smoothLoafAmount > 0.45
              ? 1.15
              : 1.95;
    s.wingPhase += dt * wingSpeed;
    const targetWingAmp =
      isTrickFlutter || isTrickSpin
        ? 0.46
        : isIdleTaps || showWisp || showSpiritBall || expr === "excited"
          ? 0.2
          : activePetting
            ? 0.14
            : s.smoothLoafAmount > 0.45
              ? 0.025
              : 0.052;
    const targetWingSpread =
      isTrickFlare || isStretchYawn ? 0.18 : -s.smoothLoafAmount * 0.12 - s.smoothSitAmount * 0.05;
    s.smoothWingAmp = THREE.MathUtils.lerp(s.smoothWingAmp, targetWingAmp, kSmooth);
    s.smoothWingSpread = THREE.MathUtils.lerp(s.smoothWingSpread, targetWingSpread, kSmooth);
    const flap = Math.sin(s.wingPhase) * s.smoothWingAmp;
    if (leftWingRef.current) {
      leftWingRef.current.rotation.y = 0.34 + flap + s.smoothWingSpread;
      leftWingRef.current.rotation.z = 0.04 + flap * 0.24;
      leftWingRef.current.rotation.x = 0.08 + Math.cos(s.wingPhase) * (s.smoothWingAmp * 0.18);
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.y = -0.34 - flap - s.smoothWingSpread;
      rightWingRef.current.rotation.z = -0.04 - flap * 0.24;
      rightWingRef.current.rotation.x = 0.08 + Math.cos(s.wingPhase) * (s.smoothWingAmp * 0.18);
    }

    // 6. 3-Joint Articulated Legs & Flexing Cat Paws (Multi-Posture Sit/Loaf, 4-Beat Walk + Scapula, Ear Scratch)
    if (
      flLegRef.current &&
      frLegRef.current &&
      blLegRef.current &&
      brLegRef.current &&
      flLowerRef.current &&
      frLowerRef.current &&
      blLowerRef.current &&
      brLowerRef.current &&
      flPawRef.current &&
      frPawRef.current &&
      blPawRef.current &&
      brPawRef.current
    ) {
      let flU = 0,
        flL = 0,
        flP = 0,
        flZ = 0;
      let frU = 0,
        frL = 0,
        frP = 0,
        frZ = 0;
      let blU = -0.14,
        blL = 0.14,
        blP = 0,
        blZ = 0;
      let brU = -0.14,
        brL = 0.14,
        brP = 0,
        brZ = 0;
      let flY = -0.15,
        frY = -0.15,
        blY = -0.14,
        brY = -0.14;

      const sitFold = s.smoothSitAmount;
      const loafFold = s.smoothLoafAmount;

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
        flP = 0.35;
        frP = 0.35;
        blP = 0.35;
        brP = 0.35;
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
        flP = 0.55 * tuck;
        frP = 0.55 * tuck;
        blP = 0.5 * tuck;
        brP = 0.5 * tuck;
      } else if (doingRoll) {
        // Cute folded bunny-paws curled against chest while belly-up!
        const rollEnv = THREE.MathUtils.smoothstep(Math.sin(activeRollProg * Math.PI), 0, 0.8);
        flU = (-0.75 + Math.sin(t * 9) * 0.12) * rollEnv;
        frU = (-0.75 - Math.sin(t * 9) * 0.12) * rollEnv;
        flL = 1.15 * rollEnv;
        frL = 1.15 * rollEnv;
        flP = 0.75 * rollEnv;
        frP = 0.75 * rollEnv;
        blU = (-0.35 + Math.cos(t * 7) * 0.15) * rollEnv;
        brU = (-0.35 - Math.cos(t * 7) * 0.15) * rollEnv;
        blL = 0.85 * rollEnv;
        brL = 0.85 * rollEnv;
        blP = 0.55 * rollEnv;
        brP = 0.55 * rollEnv;
      } else if (showSpiritBall) {
        const p = spiritBallProg;
        if (p < 0.24) {
          // Curious poke with left paw at the glowing spirit ball
          const p1 = p / 0.24;
          const poke = p1 > 0.5 ? Math.sin(((p1 - 0.5) / 0.5) * Math.PI) : 0;
          flU = -0.22 - 0.58 * poke;
          flL = 0.25 + 0.35 * poke;
          flP = -0.18 * poke;
          flZ = -0.15 * poke;
          frU = -0.12;
          frL = 0.18;
        } else if (p < 0.64) {
          // Ping-pong paw batting synced with ball position
          const p2 = (p - 0.24) / 0.4;
          const batWave = Math.sin(p2 * Math.PI * 2.0 + 0.15);
          const rightBat = Math.max(0, batWave);
          const leftBat = Math.max(0, -batWave);
          flU = -0.22 - 0.74 * leftBat;
          flL = 0.26 + 0.38 * leftBat;
          flP = 0.28 * leftBat;
          flZ = -0.26 * leftBat;
          frU = -0.22 - 0.74 * rightBat;
          frL = 0.26 + 0.38 * rightBat;
          frP = 0.28 * rightBat;
          frZ = 0.26 * rightBat;
        } else if (p < 0.72) {
          // Pre-pounce calibrated crouch ready to leap
          flU = -0.28;
          flL = 0.48;
          frU = -0.28;
          frL = 0.48;
        } else {
          // Hug ball with both front paws + cute hind-leg bunny kicks!
          const p3 = (p - 0.72) / 0.28;
          const hug = Math.min(1, p3 * 3) * Math.min(1, (1 - p3) * 4.5);
          const kickEnv = p3 > 0.28 ? Math.sin(((p3 - 0.28) / 0.72) * Math.PI) : 0;
          const kick = Math.sin(t * 24) * 0.42 * kickEnv;
          flU = -0.78 * hug;
          flL = 0.78 * hug;
          flP = 0.4 * hug;
          flZ = -0.24 * hug;
          frU = -0.78 * hug;
          frL = 0.78 * hug;
          frP = 0.4 * hug;
          frZ = 0.24 * hug;
          blU = -0.14 - 0.35 * kickEnv + kick;
          brU = -0.14 - 0.35 * kickEnv - kick;
          blL = 0.14 + 0.65 * kickEnv - kick * 0.35;
          brL = 0.14 + 0.65 * kickEnv + kick * 0.35;
        }
      } else if (isLazySwat) {
        // Dainty single front-right paw swat at passing ambient light spirit (preserves seated haunches!)
        const env = Math.sin(idleProg * Math.PI);
        const strike =
          idleProg > 0.28 && idleProg < 0.68 ? Math.sin(((idleProg - 0.28) / 0.4) * Math.PI) : 0;
        flU = 0.06 * sitFold;
        frU = -0.72 * env - 0.34 * strike;
        frL = 0.48 * env + 0.15 * strike;
        frP = 0.28 * env;
        frZ = (0.14 + 0.28 * strike) * env;
        blU = THREE.MathUtils.lerp(-0.14, -0.78, sitFold);
        blL = THREE.MathUtils.lerp(0.14, 1.24, sitFold);
        blP = 0.44 * sitFold;
        blZ = -0.08 * sitFold;
        brU = THREE.MathUtils.lerp(-0.14, -0.78, sitFold);
        brL = THREE.MathUtils.lerp(0.14, 1.24, sitFold);
        brP = 0.44 * sitFold;
        brZ = 0.08 * sitFold;
      } else if (isEarScratch) {
        // Seated hind-right leg rapid behind-the-ear scratching!
        const env = Math.sin(idleProg * Math.PI);
        const activeScratch = idleProg < 0.8 ? Math.sin((idleProg / 0.8) * Math.PI) : 0;
        flU = 0.06;
        frU = 0.06;
        blU = -0.78;
        blL = 1.22;
        blP = 0.44;
        blZ = -0.08;
        brU = THREE.MathUtils.lerp(-0.78, -1.18, activeScratch * env);
        brL = THREE.MathUtils.lerp(1.22, 0.66 + Math.sin(t * 38) * 0.26, activeScratch);
        brP = 0.4;
        brZ = 0.18 * env;
      } else if (isSniffInspect) {
        // Curious lean-forward paws planted
        const env = Math.sin(idleProg * Math.PI);
        flU = 0.1 * env + 0.06 * sitFold;
        frU = 0.1 * env + 0.06 * sitFold;
        blU = THREE.MathUtils.lerp(-0.14, -0.78, sitFold);
        blL = THREE.MathUtils.lerp(0.14, 1.24, sitFold);
        blP = 0.44 * sitFold;
        blZ = -0.08 * sitFold;
        brU = THREE.MathUtils.lerp(-0.14, -0.78, sitFold);
        brL = THREE.MathUtils.lerp(0.14, 1.24, sitFold);
        brP = 0.44 * sitFold;
        brZ = 0.08 * sitFold;
      } else if (isPetFlop) {
        // Cozy relaxed cuddle loaf tuck
        const flopBlend = Math.min(1, (rt.pettingDuration - 2.65) / 0.55);
        flU = -0.5 * flopBlend;
        flL = 0.9 * flopBlend;
        flP = 0.45 * flopBlend;
        frU = -0.46 * flopBlend;
        frL = 0.86 * flopBlend;
        frP = 0.42 * flopBlend;
        blU = -0.14 - 0.32 * flopBlend;
        blL = 0.14 + 0.62 * flopBlend;
        brU = -0.14 - 0.32 * flopBlend;
        brL = 0.14 + 0.62 * flopBlend;
      } else if (doingBiscuits) {
        // Rhythmic alternating cat paw kneading ("making biscuits")!
        const pressA = (Math.sin(t * 9.5) * 0.5 + 0.5) * activeBiscuitEnv;
        const pressB = (Math.sin(t * 9.5 + Math.PI) * 0.5 + 0.5) * activeBiscuitEnv;
        flU = -0.48 * pressA - 0.1;
        flL = 0.55 * pressA;
        flP = -0.45 * pressA + 0.35 * (1 - pressA);
        frU = -0.48 * pressB - 0.1;
        frL = 0.55 * pressB;
        frP = -0.45 * pressB + 0.35 * (1 - pressB);
        blU = THREE.MathUtils.lerp(-0.14, -0.76, sitFold);
        blL = THREE.MathUtils.lerp(0.14, 1.22, sitFold);
        blP = 0.42 * sitFold;
        blZ = -0.08 * sitFold;
        brU = THREE.MathUtils.lerp(-0.14, -0.76, sitFold);
        brL = THREE.MathUtils.lerp(0.14, 1.22, sitFold);
        brP = 0.42 * sitFold;
        brZ = 0.08 * sitFold;
      } else if (isCatFaceWash) {
        // Seated face wash: 3 tongue-to-wrist licks -> 2 circular cheek/ear grooming sweeps!
        const env = Math.sin(idleProg * Math.PI);
        frU = 0.06 * sitFold;
        blU = -0.78;
        blL = 1.24;
        blP = 0.44;
        blZ = -0.08;
        brU = -0.78;
        brL = 1.24;
        brP = 0.44;
        brZ = 0.08;
        if (idleProg < 0.42) {
          const lick = Math.sin((idleProg / 0.42) * Math.PI * 3) * 0.12;
          flU = -0.95 * env;
          flL = (1.18 + lick) * env;
          flP = 0.45 * env;
          flZ = -0.18 * env;
        } else {
          const arc = Math.sin(((idleProg - 0.42) / 0.58) * Math.PI * 4);
          flU = (-1.15 + arc * 0.18) * env;
          flL = (1.3 + arc * 0.16) * env;
          flP = 0.55 * env;
          flZ = (-0.28 + arc * 0.12) * env;
        }
      } else if (showWisp) {
        const p = activeWispProg;
        if (p < 0.56) {
          flU = -0.25;
          flL = 0.45;
          frU = -0.25;
          frL = 0.45;
        } else if (p < 0.86) {
          const bat = Math.sin(((p - 0.56) / 0.3) * Math.PI * 2);
          flU = -0.95 + bat * 0.28;
          flL = 0.45;
          flP = 0.3;
          frU = -0.95 - bat * 0.28;
          frL = 0.45;
          frP = 0.3;
          blU = 0.25;
          brU = 0.25;
        }
      } else if (isIdleTaps) {
        const tapA = Math.max(0, Math.sin(t * 22)) * Math.sin(idleProg * Math.PI);
        const tapB = Math.max(0, Math.sin(t * 22 + Math.PI)) * Math.sin(idleProg * Math.PI);
        flU = -0.58 * tapA;
        flL = 0.82 * tapA;
        flP = 0.35 * tapA;
        frU = -0.58 * tapB;
        frL = 0.82 * tapB;
        frP = 0.35 * tapB;
      } else if (isStretchYawn) {
        const env = Math.sin(idleProg * Math.PI);
        const phaseStretch = idleProg < 0.48 ? Math.sin((idleProg / 0.48) * Math.PI) : 0;
        flU = -0.95 * phaseStretch;
        flL = 0.12 * phaseStretch;
        flP = -0.25 * phaseStretch;
        frU = -0.95 * phaseStretch;
        frL = 0.12 * phaseStretch;
        frP = -0.25 * phaseStretch;
        blU = 0.32 * env;
        brU = 0.32 * env;
      } else if (isTailPlay) {
        const env = Math.sin(idleProg * Math.PI);
        flU = (-0.75 + Math.sin(t * 14) * 0.3) * env;
        flL = 0.5 * env;
        flZ = -0.35 * env;
        blU = THREE.MathUtils.lerp(-0.14, -0.78, sitFold);
        blL = THREE.MathUtils.lerp(0.14, 1.24, sitFold);
        blP = 0.44 * sitFold;
        blZ = -0.08 * sitFold;
        brU = THREE.MathUtils.lerp(-0.14, -0.78, sitFold);
        brL = THREE.MathUtils.lerp(0.14, 1.24, sitFold);
        brP = 0.44 * sitFold;
        brZ = 0.08 * sitFold;
      } else if (isTrickBow) {
        const env = Math.sin(trickProg * Math.PI);
        flU = -0.35 * env;
        flL = 0.25 * env;
        frU = (-0.95 + Math.sin(t * 14) * 0.25) * env;
        frL = (0.75 + Math.cos(t * 14) * 0.3) * env;
        frP = 0.32 * env;
        frZ = -0.22 * env;
        blU = 0.22 * env;
        brU = 0.22 * env;
      } else if (rt.isWalking) {
        // Authentic 4-beat feline lateral walk (FL -> BR -> FR -> BL) with scapula/hip vertical motion
        const spdFactor = 0.45 + rt.moveSpeed * 0.55;
        const amp = 0.38 * spdFactor;
        const phFL = gaitPhase;
        const phBR = gaitPhase + Math.PI * 0.5;
        const phFR = gaitPhase + Math.PI;
        const phBL = gaitPhase + Math.PI * 1.5;

        flY = -0.15 + Math.sin(phFL) * 0.016 * spdFactor;
        frY = -0.15 + Math.sin(phFR) * 0.016 * spdFactor;
        blY = -0.14 + Math.sin(phBL) * 0.014 * spdFactor;
        brY = -0.14 + Math.sin(phBR) * 0.014 * spdFactor;

        flU = Math.sin(phFL) * amp;
        flL = Math.max(0, Math.cos(phFL)) * 0.64;
        flP = Math.max(0, -Math.cos(phFL)) * 0.28 - 0.14 * Math.max(0, Math.cos(phFL));

        brU = -0.14 + Math.sin(phBR) * amp * 0.85;
        brL = 0.14 + Math.max(0, -Math.cos(phBR)) * 0.54;
        brP = Math.max(0, Math.cos(phBR)) * 0.24;

        frU = Math.sin(phFR) * amp;
        frL = Math.max(0, Math.cos(phFR)) * 0.64;
        frP = Math.max(0, -Math.cos(phFR)) * 0.28 - 0.14 * Math.max(0, Math.cos(phFR));

        blU = -0.14 + Math.sin(phBL) * amp * 0.85;
        blL = 0.14 + Math.max(0, -Math.cos(phBL)) * 0.54;
        blP = Math.max(0, Math.cos(phBL)) * 0.24;
      } else if (activePetting) {
        // Chin scratches trigger happy hind-leg thump reflex (respecting seated haunches if seated)
        flU = 0.06 * sitFold;
        frU = 0.06 * sitFold;
        blU = THREE.MathUtils.lerp(-0.14, -0.78, sitFold);
        blL = THREE.MathUtils.lerp(0.14, 1.24, sitFold);
        blP = 0.44 * sitFold;
        blZ = -0.08 * sitFold;
        brU = THREE.MathUtils.lerp(-0.14, -0.78, sitFold);
        brL =
          THREE.MathUtils.lerp(0.14, 1.24, sitFold) +
          (isPetChin ? Math.max(0, Math.sin(t * 16)) * 0.34 : Math.max(0, Math.sin(t * 10)) * 0.14);
        brP = 0.44 * sitFold;
        brZ = 0.08 * sitFold;
      } else if (expr === "playful") {
        flU = -0.28;
        flL = 0.32;
        frU = -0.22;
        frL = 0.26;
      } else {
        // Unified organic blend across standing <-> sitting <-> loafing / curledSleep!
        const alertFactor = Math.max(0, 1 - sitFold - loafFold);
        const micro = Math.sin(t * 1.9) * 0.016 * alertFactor;

        flU = micro + 0.07 * sitFold - 0.62 * loafFold;
        flL = -0.05 * sitFold + 1.05 * loafFold;
        flP = -0.02 * sitFold + 0.55 * loafFold;

        frU = -micro + 0.07 * sitFold - 0.62 * loafFold;
        frL = -0.05 * sitFold + 1.05 * loafFold;
        frP = -0.02 * sitFold + 0.55 * loafFold;

        blU = -0.14 * alertFactor - 0.78 * sitFold - 0.52 * loafFold;
        blL = 0.14 * alertFactor + 1.25 * sitFold + 0.85 * loafFold;
        blP = 0.45 * sitFold + 0.45 * loafFold;
        blZ = -0.08 * sitFold - 0.06 * loafFold;

        brU = -0.14 * alertFactor - 0.78 * sitFold - 0.52 * loafFold;
        brL = 0.14 * alertFactor + 1.25 * sitFold + 0.85 * loafFold;
        brP = 0.45 * sitFold + 0.45 * loafFold;
        brZ = 0.08 * sitFold + 0.06 * loafFold;
      }

      const lk = Math.min(1, dt * 13);
      flLegRef.current.position.y = THREE.MathUtils.lerp(flLegRef.current.position.y, flY, lk);
      frLegRef.current.position.y = THREE.MathUtils.lerp(frLegRef.current.position.y, frY, lk);
      blLegRef.current.position.y = THREE.MathUtils.lerp(blLegRef.current.position.y, blY, lk);
      brLegRef.current.position.y = THREE.MathUtils.lerp(brLegRef.current.position.y, brY, lk);

      flLegRef.current.rotation.x = THREE.MathUtils.lerp(flLegRef.current.rotation.x, flU, lk);
      flLegRef.current.rotation.z = THREE.MathUtils.lerp(flLegRef.current.rotation.z, flZ, lk);
      frLegRef.current.rotation.x = THREE.MathUtils.lerp(frLegRef.current.rotation.x, frU, lk);
      frLegRef.current.rotation.z = THREE.MathUtils.lerp(frLegRef.current.rotation.z, frZ, lk);
      blLegRef.current.rotation.x = THREE.MathUtils.lerp(blLegRef.current.rotation.x, blU, lk);
      blLegRef.current.rotation.z = THREE.MathUtils.lerp(blLegRef.current.rotation.z, blZ, lk);
      brLegRef.current.rotation.x = THREE.MathUtils.lerp(brLegRef.current.rotation.x, brU, lk);
      brLegRef.current.rotation.z = THREE.MathUtils.lerp(brLegRef.current.rotation.z, brZ, lk);

      flLowerRef.current.rotation.x = THREE.MathUtils.lerp(flLowerRef.current.rotation.x, flL, lk);
      frLowerRef.current.rotation.x = THREE.MathUtils.lerp(frLowerRef.current.rotation.x, frL, lk);
      blLowerRef.current.rotation.x = THREE.MathUtils.lerp(blLowerRef.current.rotation.x, blL, lk);
      brLowerRef.current.rotation.x = THREE.MathUtils.lerp(brLowerRef.current.rotation.x, brL, lk);

      flPawRef.current.rotation.x = THREE.MathUtils.lerp(flPawRef.current.rotation.x, flP, lk);
      frPawRef.current.rotation.x = THREE.MathUtils.lerp(frPawRef.current.rotation.x, frP, lk);
      blPawRef.current.rotation.x = THREE.MathUtils.lerp(blPawRef.current.rotation.x, blP, lk);
      brPawRef.current.rotation.x = THREE.MathUtils.lerp(brPawRef.current.rotation.x, brP, lk);
    }

    // 7. Smooth Facial Rig (Natural Crisp Blinks, Wake-Up Double-Blink, Scratch & Wash Squints, Hunt Pupils)
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
    const wakeBlink = rt.wakeUpTimer > 0.35 && rt.wakeUpTimer < 0.62;
    const isBlinking =
      (s.blinkTimer <= 0 || wakeBlink) && expr !== "happy" && expr !== "surprised" && !isStretchYawn;

    const yawnSquint = isStretchYawn && idleProg > 0.45 && idleProg < 0.9;
    const scratchSquintR = isEarScratch && idleProg < 0.8;
    const washSquintL = isCatFaceWash && idleProg >= 0.42;
    const petSquintL = activePetting && rt.pointerX < -0.22;
    const petSquintR = activePetting && rt.pointerX > 0.22;
    const deepPetBliss = activePetting && rt.pettingDuration >= 0.85;
    const lockOpenHunt = showSpiritBall || isLazySwat || isSniffInspect;
    const targetOpenL =
      lockOpenHunt
        ? 1
        : deepPetBliss ||
            (expr === "happy" && !activePetting) ||
            (expr === "playful" && !showSpiritBall) ||
            yawnSquint ||
            washSquintL ||
            petSquintL ||
            doingBunt
          ? 0
          : 1;
    const targetOpenR =
      lockOpenHunt
        ? 1
        : deepPetBliss ||
            (expr === "happy" && !activePetting) ||
            yawnSquint ||
            scratchSquintR ||
            petSquintR ||
            doingBunt
          ? 0
          : 1;
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

    const slowLoveGaze = activePetting && rt.pettingDuration < 0.85;
    const targetLidClose = isBlinking
      ? 1.0
      : wakeEnv > 0.15
        ? 0.12
        : s.smoothCurlAmount > 0.45
          ? 0.92
          : s.smoothLoafAmount > 0.45 || expr === "sleepy"
            ? 0.56
            : isCatFaceWash
              ? 0.42
              : slowLoveGaze
                ? 0.36
                : 0.0;
    const lidSpeed =
      s.smoothLoafAmount > 0.45 || expr === "sleepy" || slowLoveGaze ? Math.min(1, dt * 6.5) : Math.min(1, dt * 20);
    s.smoothLidY = THREE.MathUtils.lerp(s.smoothLidY, targetLidClose, lidSpeed);
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

    const targetLookX = THREE.MathUtils.clamp(pointerSteerX * 0.018 + s.saccadeX * 0.015, -0.022, 0.022);
    const targetLookY = THREE.MathUtils.clamp(-pointerSteerY * 0.013 + s.saccadeY * 0.012, -0.015, 0.015);
    s.smoothLookX = THREE.MathUtils.lerp(s.smoothLookX, targetLookX, kFast);
    s.smoothLookY = THREE.MathUtils.lerp(s.smoothLookY, targetLookY, kFast);

    // Classic cat dilated hunt/wonder pupils on stalking, spirit-ball play, sniff, pounce, roll, excited!
    const dilate =
      expr === "excited" ||
      isIdleTaps ||
      showWisp ||
      showSpiritBall ||
      isLazySwat ||
      isSniffInspect ||
      isStalking ||
      doingRoll ||
      rt.cursorProximity > 0.35;
    const targetPupil = dilate ? 1.32 : expr === "surprised" ? 0.7 : 1.0;
    const targetStar = dilate || expr === "playful" || isTrickFlare ? 1.0 : 0.001;
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

    const targetBrowY =
      expr === "surprised"
        ? 0.166
        : isRestingNap
          ? 0.124
          : isStalking || showSpiritBall || isSniffInspect || expr === "curious"
            ? 0.154
            : 0.145;
    const targetBrowTilt =
      isRestingNap ? 0.2 : expr === "excited" || showSpiritBall ? -0.2 : expr === "surprised" ? -0.16 : -0.08;
    s.smoothBrowY = THREE.MathUtils.lerp(s.smoothBrowY, targetBrowY, kSmooth);
    s.smoothBrowTilt = THREE.MathUtils.lerp(s.smoothBrowTilt, targetBrowTilt, kSmooth);
    if (leftBrowRef.current) {
      leftBrowRef.current.position.y =
        s.smoothBrowY + (expr === "curious" || isStalking || showSpiritBall || isSniffInspect ? 0.007 : 0);
      leftBrowRef.current.rotation.z = -s.smoothBrowTilt;
    }
    if (rightBrowRef.current) {
      rightBrowRef.current.position.y = s.smoothBrowY;
      rightBrowRef.current.rotation.z = s.smoothBrowTilt;
    }

    const isSmileMouth =
      expr === "happy" ||
      expr === "playful" ||
      showSpiritBall ||
      isEarScratch ||
      doingBiscuits ||
      doingBunt ||
      isIdleTaps;
    const yawnMouthWide = isStretchYawn && idleProg > 0.35 ? 1 + Math.sin(((idleProg - 0.35) / 0.65) * Math.PI) * 0.78 : 1;
    s.smoothMouthOpen = THREE.MathUtils.lerp(s.smoothMouthOpen, isSmileMouth && !isStretchYawn ? 0.001 : 1, kFast);
    s.smoothSmileOpen = THREE.MathUtils.lerp(s.smoothSmileOpen, isSmileMouth && !isStretchYawn ? 1 : 0.001, kFast);
    if (openMouthGroupRef.current) {
      openMouthGroupRef.current.visible = s.smoothMouthOpen > 0.08;
      const mScale =
        (expr === "surprised" ? 1.38 : expr === "excited" ? 1.24 : isRestingNap ? 0.72 : 1.0) *
        s.smoothMouthOpen *
        yawnMouthWide;
      openMouthGroupRef.current.scale.set(
        Math.max(0.05, mScale * (isStretchYawn ? 0.92 : 1)),
        Math.max(0.05, mScale * (isStretchYawn ? 1.35 : 1)),
        Math.max(0.05, mScale)
      );
    }
    if (happySmileGroupRef.current) {
      happySmileGroupRef.current.visible = s.smoothSmileOpen > 0.08;
      happySmileGroupRef.current.scale.setScalar(Math.max(0.05, s.smoothSmileOpen));
    }
    if (tongueRef.current) {
      tongueRef.current.visible =
        isSmileMouth || isTrickBow || isCatFaceWash || (isStretchYawn && idleProg > 0.4);
      if (tongueRef.current.visible) {
        tongueRef.current.rotation.x = (isStretchYawn ? 0.45 : 0.28) + Math.sin(t * 7.5) * 0.1;
      }
    }

    // Blush, Crystal Iridescence & Calm Ground Rune Rings
    const boost = activePetting || isTrickFlare || expr === "excited" || expr === "happy" || doingBiscuits || doingBunt ? 1 : 0;
    s.smoothBlush = THREE.MathUtils.lerp(
      s.smoothBlush,
      boost ? 0.56 : expr === "playful" || showSpiritBall || isEarScratch || doingRoll || isStretchYawn ? 0.42 : 0.22,
      kSmooth
    );
    DYNAMIC_BLUSH_MAT.opacity = s.smoothBlush;

    const targetGlow = isTrickFlare
      ? 0.92
      : activePetting || expr === "excited" || showSpiritBall || showWisp || doingRoll
        ? 0.58
        : 0.28 + Math.sin(t * 1.8) * 0.05 + rt.burstEnergy * 0.36;
    s.smoothGlow = THREE.MathUtils.lerp(s.smoothGlow, targetGlow, kSmooth);
    DYNAMIC_CRYSTAL_MAT.emissiveIntensity = s.smoothGlow;
    DYNAMIC_CRYSTAL_TIP_MAT.emissiveIntensity = s.smoothGlow + 0.14;
    DYNAMIC_SPARKLE_MAT.opacity = 0.42 + Math.sin(t * 2.5) * 0.18 + rt.burstEnergy * 0.28;

    const spiritBoost = showSpiritBall ? 0.14 : activePetting ? 0.08 : rt.burstEnergy * 0.16;
    DYNAMIC_SPIRIT_CORE_MAT.opacity = 0.72 + Math.sin(t * 2.4) * 0.12 + spiritBoost;
    DYNAMIC_SPIRIT_HALO_MAT.opacity = 0.24 + Math.sin(t * 2.1) * 0.07 + spiritBoost * 0.6;
    DYNAMIC_SPIRIT_ORCHID_MAT.opacity = 0.22 + Math.cos(t * 2.1) * 0.07 + spiritBoost * 0.6;

    if (auraLightRef.current) {
      auraLightRef.current.intensity = THREE.MathUtils.lerp(
        auraLightRef.current.intensity,
        isTrickFlare ? 2.1 : activePetting ? 1.45 : showSpiritBall ? 1.25 : 0.8 + rt.burstEnergy * 0.65,
        kSmooth
      );
    }

    const targetRingScale = rt.isDragging || doingRoll
      ? 0.001
      : isTrickFlare
        ? 1.28
        : activePetting || doingBiscuits || showSpiritBall
          ? 1.1
          : 0.92 + Math.sin(t * 1.6) * 0.03 + rt.burstEnergy * 0.12;
    if (auraRingRef.current) {
      auraRingRef.current.rotation.z = t * (isTrickFlare ? 1.4 : 0.24);
      const nextRingScale = THREE.MathUtils.lerp(auraRingRef.current.scale.x, targetRingScale, kSmooth);
      auraRingRef.current.scale.setScalar(nextRingScale);
      auraRingRef.current.visible = nextRingScale > 0.05;
    }
    if (auraInnerRingRef.current) {
      auraInnerRingRef.current.rotation.z = -t * (isTrickFlare ? 1.9 : 0.42);
      const nextInnerScale = THREE.MathUtils.lerp(auraInnerRingRef.current.scale.x, targetRingScale * 0.68, kSmooth);
      auraInnerRingRef.current.scale.setScalar(nextInnerScale);
      auraInnerRingRef.current.visible = nextInnerScale > 0.04;
    }

    // 8. Continuous-Phase Multi-Segment Nine Tails (Sit Drape, Curled Sleep Wrap, Turn Trail & Coat Shake)
    const wagSpeed =
      activePetting || isTrickFlare || expr === "excited" || doingBiscuits || doingBunt || showSpiritBall
        ? 5.0
        : rt.isWalking
          ? 3.6
          : isRestingNap
            ? 0.95
            : 1.55;
    s.tailPhase += dt * wagSpeed;
    const targetWagAmp = isTrickFlare
      ? 0.2
      : activePetting || doingBiscuits || showSpiritBall
        ? 0.14
        : isRestingNap
          ? 0.028
          : 0.045;
    const targetFlareSpread =
      isTrickFlare || isStretchYawn ? 1.16 : isRestingNap ? 0.82 : 1.0 - s.smoothSitAmount * 0.08;
    s.smoothWagAmp = THREE.MathUtils.lerp(s.smoothWagAmp, targetWagAmp, kSmooth);
    s.smoothFlareSpread = THREE.MathUtils.lerp(s.smoothFlareSpread, targetFlareSpread, kSmooth);
    const inertiaDrag = s.smoothInertiaYaw * 0.35 + (rt.isWalking ? turnRate * 0.38 : 0);

    for (let i = 0; i < 9; i++) {
      const cfg = TAIL_CONFIGS[i];
      const base = tailBaseRefs.current[i];
      const tip = tailTipRefs.current[i];
      const tailPlayHighlight = isTailPlay && i === 1 ? Math.sin(idleProg * Math.PI) : 0;
      const waveA = Math.sin(s.tailPhase + cfg.phase);
      const waveLag = Math.sin(s.tailPhase - 1.15 + cfg.phase);
      const waveCosLag = Math.cos(s.tailPhase * 0.85 - 1.1 + cfg.phase);
      const lazyCoil =
        !rt.isWalking && !activePetting && !showSpiritBall && s.smoothCurlAmount < 0.5
          ? Math.sin(s.tailPhase * 0.72 - 1.4 + cfg.phase) * 0.085
          : 0;
      const stalkTwitch =
        (isStalking || showSpiritBall || rt.cursorProximity > 0.45) && (i === 4 || i === 3 || i === 5)
          ? Math.sin(t * 15 + i) * 0.12
          : 0;
      const sideSign = i < 4 ? 1 : i > 4 ? -1 : 0;
      const tailWrapY = sideSign * (s.smoothSitAmount * 0.14 + s.smoothCurlAmount * 0.36);
      const tailWrapPitch = s.smoothSitAmount * 0.1 + s.smoothCurlAmount * 0.16;
      const tailShakeWave = isPostPetShake
        ? Math.sin(t * 42 - 1.6 - i * 0.08) * 0.18 * postPetEnv
        : 0;

      if (base) {
        base.rotation.z =
          cfg.fanRoll * (s.smoothFlareSpread - s.smoothCurlAmount * 0.2 * (i === 4 ? 0 : 1)) +
          waveA * (s.smoothWagAmp * 0.65) -
          inertiaDrag +
          tailShakeWave -
          tailPlayHighlight * 0.42;
        base.rotation.y = THREE.MathUtils.lerp(base.rotation.y, tailWrapY, kSmooth);
        base.rotation.x =
          cfg.pitchBack +
          tailWrapPitch +
          Math.cos(s.tailPhase * 0.85 + cfg.phase) * (s.smoothWagAmp * 0.55) +
          (rt.isWalking ? 0.18 * rt.moveSpeed : 0) +
          tailPlayHighlight * 0.38;
      }
      if (tip) {
        tip.rotation.x =
          waveLag * (s.smoothWagAmp * 0.72) +
          lazyCoil +
          s.smoothCurlAmount * 0.22 +
          tailPlayHighlight * Math.sin(t * 14) * 0.25 +
          stalkTwitch;
        tip.rotation.z =
          waveCosLag * (s.smoothWagAmp * 0.52) -
          inertiaDrag * 0.6 +
          lazyCoil * 0.5 +
          tailShakeWave * 0.6 +
          stalkTwitch * 0.5;
      }
    }

    // 9. 8 Gentle Firefly Light-Spirit Motes (Calm ambient drift + featured guardian orb)
    const spiritEnergy = Math.max(rt.burstEnergy * 0.65, showSpiritBall ? 0.45 : 0);
    const driftMul = 1 + spiritEnergy * 0.85 + (activePetting ? 0.45 : 0);
    for (let i = 0; i < SPIRIT_MOTE_SPECS.length; i++) {
      const sp = SPIRIT_MOTE_SPECS[i];
      const moteGroup = spiritMoteRefs.current[i];
      if (moteGroup) {
        if (i === 0 && (isLazySwat || isSniffInspect)) {
          moteGroup.position.set(swatMoteX, swatMoteY, swatMoteZ);
        } else if (i === 0) {
          moteGroup.position.set(m0IdleX, m0IdleY, m0IdleZ);
        } else {
          const ang = t * sp.speed * driftMul + sp.phase;
          const rad = sp.radius + Math.sin(t * 1.2 + sp.phase) * 0.06;
          const bobY = sp.yBase + Math.sin(t * 1.45 + sp.phase * 1.2) * sp.bobAmp;
          moteGroup.position.set(Math.cos(ang) * rad, bobY, Math.sin(ang) * rad);
        }
        const calmDim = showSpiritBall ? 0.65 : s.smoothCurlAmount > 0.5 && i > 0 ? 0.65 : 1.0;
        const pulse = sp.scale * calmDim * (0.82 + 0.24 * Math.sin(t * 2.1 + sp.phase) + spiritEnergy * 0.25);
        moteGroup.scale.setScalar(pulse);
      }
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.26, 0]} scale={0.85}>
      <pointLight ref={auraLightRef} position={[0, 0.72, 1.0]} color="#93c5fd" intensity={0.8} distance={4.8} />

      {/* Dual Counter-Rotating Ground Magical Frost & Rune Halos */}
      <mesh
        ref={auraRingRef}
        position={[0, -0.025, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={assets.auraRingMat}
      >
        <circleGeometry args={[0.5, 32]} />
      </mesh>
      <mesh
        ref={auraInnerRingRef}
        position={[0, -0.022, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={assets.auraInnerRingMat}
      >
        <circleGeometry args={[0.34, 24]} />
      </mesh>

      {/* Fluttering 3D Celestial Ice-Butterfly Wisp */}
      <group ref={wispGroupRef} visible={false}>
        <mesh material={DYNAMIC_SPARKLE_MAT}>
          <sphereGeometry args={[0.024, 12, 10]} />
        </mesh>
        <mesh
          ref={wispLeftWingRef}
          position={[-0.008, 0, 0]}
          rotation={[0.25, -0.35, 0.15]}
          scale={[-1, 1, 1]}
          geometry={geos.butterflyWingGeo}
          material={assets.wispWingMat}
        />
        <mesh
          ref={wispRightWingRef}
          position={[0.008, 0, 0]}
          rotation={[0.25, 0.35, -0.15]}
          geometry={geos.butterflyWingGeo}
          material={assets.wispWingMat}
        />
      </group>

      {/* 3D Interactive Light-Spirit Ball-of-Wool (No Text / No Emoji) */}
      <group ref={spiritOrbGroupRef} visible={false}>
        <mesh material={DYNAMIC_WOOL_CORE_MAT}>
          <sphereGeometry args={[0.044, 14, 12]} />
        </mesh>
        <mesh material={DYNAMIC_SPIRIT_HALO_MAT}>
          <sphereGeometry args={[0.095, 14, 12]} />
        </mesh>
        <mesh ref={spiritWoolRingOuterRef} geometry={geos.woolRingOuterGeo} material={DYNAMIC_WOOL_THREAD_MAT} />
        <mesh
          ref={spiritWoolRingInnerRef}
          rotation={[Math.PI / 2, 0, 0]}
          geometry={geos.woolRingInnerGeo}
          material={DYNAMIC_WOOL_CORE_MAT}
        />
        {SPIRIT_BALL_WISP_PHASES.map((_, wIdx) => (
          <mesh
            key={wIdx}
            ref={(el) => {
              spiritOrbWispRefs.current[wIdx] = el;
            }}
            scale={0.55}
            geometry={geos.spiritCoreGeo}
            material={DYNAMIC_SPIRIT_CORE_MAT}
          />
        ))}
      </group>

      {/* ── 8 Soft In-Canvas Firefly Light-Spirit Motes (Calm Drifting Ambient Glow) ── */}
      <group>
        {SPIRIT_MOTE_SPECS.map((sp, i) => (
          <group
            key={i}
            ref={(el) => {
              spiritMoteRefs.current[i] = el;
            }}
          >
            <mesh geometry={geos.spiritCoreGeo} material={DYNAMIC_SPIRIT_CORE_MAT} />
            <mesh
              geometry={geos.spiritHaloGeo}
              material={sp.isOrchid ? DYNAMIC_SPIRIT_ORCHID_MAT : DYNAMIC_SPIRIT_HALO_MAT}
            />
          </group>
        ))}
      </group>

      {/* ── Articulated Anterior Thorax/Chest Spine Group (Chest Mane, Wings, Front Legs & Head) ── */}
      <group ref={chestRef} position={[0, 0.36, 0.04]}>
        {/* Anterior Plump Pastel Chest Core */}
        <mesh position={[0, 0.02, 0.02]} scale={[0.88, 0.9, 0.96]} material={assets.bodyFurMat}>
          <sphereGeometry args={[0.285, 24, 20]} />
        </mesh>
        {/* Neck / Chin Frost Cushion */}
        <mesh position={[0, 0.22, 0.02]} scale={[0.96, 0.65, 0.9]} material={assets.snowFur}>
          <sphereGeometry args={[0.23, 20, 16]} />
        </mesh>

        {/* Spring-Animated 19-Lock 3-Tier Game-Style Chest Mane */}
        <group ref={chestManeRef}>
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
        </group>

        {/* Left & Right Webbed Crystal Wings */}
        <group ref={leftWingRef} position={[-0.19, 0.21, -0.18]} rotation={[0.08, 0.34, 0.04]}>
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
            >
              <lineSegments geometry={geos.diamondEdgesGeo} material={assets.crystalEdgeMat} />
            </mesh>
          ))}
        </group>

        <group ref={rightWingRef} position={[0.19, 0.21, -0.18]} rotation={[0.08, -0.34, -0.04]}>
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
            >
              <lineSegments geometry={geos.diamondEdgesGeo} material={assets.crystalEdgeMat} />
            </mesh>
          ))}
        </group>

        {/* Front 3-Joint Articulated Legs Attached Directly to Thorax Spine */}
        {[
          { ref: flLegRef, lowerRef: flLowerRef, pawRef: flPawRef, pos: [-0.135, -0.15, 0.14] as [number, number, number], mirror: -1, rad: 0.072 },
          { ref: frLegRef, lowerRef: frLowerRef, pawRef: frPawRef, pos: [0.135, -0.15, 0.14] as [number, number, number], mirror: 1, rad: 0.072 },
        ].map((leg, lIdx) => (
          <group key={lIdx} ref={leg.ref} position={leg.pos}>
            <mesh position={[0, -0.045, 0]} material={assets.legFurMat}>
              <capsuleGeometry args={[leg.rad, 0.085, 10, 16]} />
            </mesh>
            <mesh
              position={[leg.mirror * 0.055, 0.02, -0.025]}
              rotation={[0.25, leg.mirror * 0.6, leg.mirror * -0.55]}
              scale={[0.52, 0.52, 0.52]}
              geometry={geos.furLockGeo}
              material={assets.pastelBlueFur}
            />
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
            <group ref={leg.lowerRef} position={[0, -0.095, 0]}>
              {ANKLE_CUFF_ANGLES.map((ang, aIdx) => (
                <mesh
                  key={aIdx}
                  position={[leg.mirror * 0.036, 0.01, Math.sin(ang) * 0.035]}
                  rotation={[Math.sin(ang) * 0.35, leg.mirror * 0.4, leg.mirror * -0.45]}
                  scale={[0.32, 0.26, 0.32]}
                  geometry={geos.furLockGeo}
                  material={assets.jetBlack}
                />
              ))}
              <mesh position={[0, -0.045, 0]} material={assets.jetBlack}>
                <capsuleGeometry args={[leg.rad * 0.88, 0.065, 8, 14]} />
              </mesh>
              {/* Articulated Cat Wrist/Paw Pivot with Soft Pink Paw Pad */}
              <group ref={leg.pawRef} position={[0, -0.095, 0.015]}>
                <mesh position={[0, -0.01, 0.008]} scale={[1.08, 0.72, 1.24]} material={assets.jetBlack}>
                  <sphereGeometry args={[leg.rad * 1.02, 14, 12]} />
                </mesh>
                <mesh position={[0, -0.038, 0.015]} scale={[0.78, 0.35, 0.78]} material={assets.pawBeanMat}>
                  <sphereGeometry args={[0.042, 10, 8]} />
                </mesh>
                {[-0.028, 0, 0.028].map((tx, tIdx) => (
                  <mesh key={tIdx} position={[tx, -0.024, 0.074]} scale={[0.85, 0.9, 1.1]} material={assets.jetBlack}>
                    <sphereGeometry args={[0.02, 8, 8]} />
                  </mesh>
                ))}
              </group>
            </group>
          </group>
        ))}

        {/* ── Seamless Sculpted Cat-Fox Head (Attached to Anterior Chest Spine) ── */}
        <group ref={headRef} position={[0, 0.44, 0.06]}>
          {/* Single Sculpted Chibi Head + Soft Plump Lower Cheek & Muzzle Cushions */}
          <mesh geometry={geos.catHeadGeo} material={assets.headFurMat} />
          <mesh position={[-0.17, -0.09, 0.21]} scale={[1.04, 0.84, 0.8]} material={assets.snowFur}>
            <sphereGeometry args={[0.155, 18, 14]} />
          </mesh>
          <mesh position={[0.17, -0.09, 0.21]} scale={[1.04, 0.84, 0.8]} material={assets.snowFur}>
            <sphereGeometry args={[0.155, 18, 14]} />
          </mesh>
          <mesh position={[0, -0.088, 0.27]} scale={[0.94, 0.7, 0.82]} material={assets.snowFur}>
            <sphereGeometry args={[0.14, 20, 16]} />
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

          {/* Multi-Tone Spring-Animated Cheek Ruff Plumes */}
          <group ref={leftCheekRuffRef} position={[-0.38, -0.04, 0.05]}>
            {CHEEK_RUFF_LOCKS.map((l, idx) => (
              <mesh
                key={idx}
                position={l.pos}
                rotation={l.rot}
                scale={l.scale}
                geometry={geos.furLockGeo}
                material={assets.cheekFurMat}
              />
            ))}
          </group>
          <group ref={rightCheekRuffRef} position={[0.38, -0.04, 0.05]}>
            {CHEEK_RUFF_LOCKS.map((l, idx) => (
              <mesh
                key={idx}
                position={[-l.pos[0], l.pos[1], l.pos[2]]}
                rotation={[l.rot[0], -l.rot[1], -l.rot[2]]}
                scale={l.scale}
                geometry={geos.furLockGeo}
                material={assets.cheekFurMat}
              />
            ))}
          </group>

          {/* Heart-Triangle Nose seated on Muzzle Bridge */}
          <mesh ref={noseRef} position={[0, -0.055, 0.398]} rotation={[0.1, 0, Math.PI]} scale={[1.25, 0.9, 0.65]} material={assets.jetBlack}>
            <coneGeometry args={[0.028, 0.034, 4]} />
          </mesh>

          {/* Cute Philtrum / Upper Lip Arch */}
          <mesh position={[-0.011, -0.088, 0.395]} rotation={[0, 0, Math.PI + 0.35]} material={assets.jetBlack}>
            <torusGeometry args={[0.011, 0.0032, 6, 10, Math.PI * 0.85]} />
          </mesh>
          <mesh position={[0.011, -0.088, 0.395]} rotation={[0, 0, Math.PI - 0.35]} material={assets.jetBlack}>
            <torusGeometry args={[0.011, 0.0032, 6, 10, Math.PI * 0.85]} />
          </mesh>

          {/* Default Parted ":o" / "△" Mouth with Tiny Cute Fang */}
          <group ref={openMouthGroupRef} position={[0, -0.118, 0.394]}>
            <mesh scale={[1.2, 0.85, 0.4]} material={assets.mouthInterior}>
              <sphereGeometry args={[0.033, 14, 10]} />
            </mesh>
            <mesh position={[0, -0.011, 0.008]} scale={[1.05, 0.55, 0.45]} material={assets.tongueMat}>
              <sphereGeometry args={[0.024, 12, 8]} />
            </mesh>
            <mesh position={[-0.013, 0.013, 0.012]} rotation={[0, 0, Math.PI]} material={assets.whiteFang}>
              <coneGeometry args={[0.0065, 0.013, 6]} />
            </mesh>
          </group>

          {/* Happy ":3" Smile Mouth */}
          <group ref={happySmileGroupRef} position={[0, -0.105, 0.396]} visible={false}>
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
            position={[0.012, -0.138, 0.382]}
            scale={[0.8, 0.42, 1.1]}
            material={assets.tongueMat}
            visible={false}
          >
            <sphereGeometry args={[0.032, 12, 10]} />
          </mesh>

          {/* Forehead Crystal Trio + Facet Edge Highlights + Black Inter-Brow Teardrop */}
          <group position={[0, 0.165, 0.314]} rotation={[-0.36, 0, 0]}>
            <mesh position={[0, 0.01, 0.008]} scale={[0.92, 1.48, 0.52]} geometry={geos.diamondCrystalGeo} material={assets.starryHornMat}>
              <lineSegments geometry={geos.diamondEdgesGeo} material={assets.crystalEdgeMat} />
            </mesh>
            <mesh position={[-0.072, -0.022, -0.006]} rotation={[0, 0, 0.38]} scale={[0.52, 0.9, 0.4]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT}>
              <lineSegments geometry={geos.diamondEdgesGeo} material={assets.crystalEdgeMat} />
            </mesh>
            <mesh position={[0.072, -0.022, -0.006]} rotation={[0, 0, -0.38]} scale={[0.52, 0.9, 0.4]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT}>
              <lineSegments geometry={geos.diamondEdgesGeo} material={assets.crystalEdgeMat} />
            </mesh>
          </group>
          <mesh position={[0, 0.055, 0.352]} scale={[0.55, 1.15, 0.45]} material={assets.jetBlack}>
            <sphereGeometry args={[0.018, 10, 8]} />
          </mesh>

          {/* Curved Starry Azurite Horns + Basal Buds */}
          <group position={[-0.145, 0.25, 0.12]} rotation={[0.2, 0, 0.28]}>
            <mesh geometry={geos.hornLeftGeo} material={assets.starryHornMat} />
            <mesh position={[-0.042, 0.075, 0.015]} rotation={[0.15, 0, 0.45]} scale={[0.7, 1.15, 0.6]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT}>
              <lineSegments geometry={geos.diamondEdgesGeo} material={assets.crystalEdgeMat} />
            </mesh>
            <mesh position={[0.04, 0.055, 0.025]} rotation={[0.2, 0, -0.38]} scale={[0.58, 0.95, 0.52]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_MAT} />
          </group>
          <group position={[0.145, 0.25, 0.12]} rotation={[0.2, 0, -0.28]}>
            <mesh geometry={geos.hornRightGeo} material={assets.starryHornMat} />
            <mesh position={[0.042, 0.075, 0.015]} rotation={[0.15, 0, -0.45]} scale={[0.7, 1.15, 0.6]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT}>
              <lineSegments geometry={geos.diamondEdgesGeo} material={assets.crystalEdgeMat} />
            </mesh>
            <mesh position={[-0.04, 0.055, 0.025]} rotation={[0.2, 0, 0.38]} scale={[0.58, 0.95, 0.52]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_MAT} />
          </group>

          {/* Sculpted Curved Cupped Fox Ears with 3 Inner-Ear Fur Tufts */}
          <group ref={leftEarRef} position={[-0.25, 0.22, -0.02]} rotation={[0.06, 0.14, 0.44]}>
            <mesh geometry={geos.earShellLeftGeo} material={assets.earFurMat} />
            <mesh geometry={geos.innerEarLeftGeo} material={assets.innerEarMat} />
            {INNER_EAR_TUFTS.map((tuf, idx) => (
              <mesh
                key={idx}
                position={tuf.pos}
                rotation={tuf.rot}
                scale={tuf.scale}
                geometry={geos.furLockGeo}
                material={assets.snowFur}
              />
            ))}
          </group>
          <group ref={rightEarRef} position={[0.25, 0.22, -0.02]} rotation={[0.06, -0.14, -0.44]}>
            <mesh geometry={geos.earShellRightGeo} material={assets.earFurMat} />
            <mesh geometry={geos.innerEarRightGeo} material={assets.innerEarMat} />
            {INNER_EAR_TUFTS.map((tuf, idx) => (
              <mesh
                key={idx}
                position={[-tuf.pos[0], tuf.pos[1], tuf.pos[2]]}
                rotation={[tuf.rot[0], -tuf.rot[1], -tuf.rot[2]]}
                scale={tuf.scale}
                geometry={geos.furLockGeo}
                material={assets.snowFur}
              />
            ))}
          </group>

          {/* Cheek Stripes + Teardrop Marks seated cleanly on sculpted Mochi Cheeks */}
          <group position={[-0.235, -0.068, 0.336]} rotation={[0.04, -0.48, 0.06]}>
            <mesh geometry={geos.cheekStripeLeftGeo} material={assets.jetBlack} />
            <mesh position={[-0.008, -0.026, -0.004]} rotation={[0, 0, 0.18]} scale={0.78} geometry={geos.cheekStripeLeftGeo} material={assets.jetBlack} />
            <mesh position={[-0.088, -0.006, -0.036]} scale={[0.8, 1.1, 0.6]} material={assets.jetBlack}>
              <sphereGeometry args={[0.011, 8, 8]} />
            </mesh>
            <mesh position={[-0.062, -0.038, -0.025]} scale={[0.7, 0.95, 0.6]} material={assets.jetBlack}>
              <sphereGeometry args={[0.009, 8, 8]} />
            </mesh>
          </group>
          <group position={[0.235, -0.068, 0.336]} rotation={[0.04, 0.48, -0.06]}>
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
          <mesh position={[-0.21, -0.082, 0.338]} rotation={[0.1, -0.45, 0]} scale={[1.25, 0.72, 0.4]} material={DYNAMIC_BLUSH_MAT}>
            <sphereGeometry args={[0.048, 12, 10]} />
          </mesh>
          <mesh position={[0.21, -0.082, 0.338]} rotation={[0.1, 0.45, 0]} scale={[1.25, 0.72, 0.4]} material={DYNAMIC_BLUSH_MAT}>
            <sphereGeometry args={[0.048, 12, 10]} />
          </mesh>

          {/* ── Clean Reference-Faithful Anime Purple Eyes (Zero Clutter & Zero Clipping) ── */}
          {/* Left Eye */}
          <group position={[-0.145, 0.025, 0.340]} rotation={[0.02, -0.26, 0]}>
            <group ref={leftOpenEyeRef}>
              <mesh position={[0, 0.034, -0.002]} rotation={[0, 0, 0.08]} scale={[1.18, 0.85, 0.4]} material={assets.eyeshadowMat}>
                <circleGeometry args={[0.088, 20]} />
              </mesh>
              {/* Crisp white sclera backing rim */}
              <mesh position={[0, 0, 0.002]} scale={[1.14, 1.12, 0.5]} material={assets.scleraMat}>
                <circleGeometry args={[0.076, 28]} />
              </mesh>
              {/* Rich high-contrast purple anime iris */}
              <mesh position={[0, 0, 0.005]} scale={[0.98, 1.08, 0.5]} material={assets.irisMat}>
                <circleGeometry args={[0.076, 28]} />
              </mesh>
              <group ref={leftPupilGroupRef}>
                <mesh position={[0, 0.004, 0.009]} scale={[0.88, 1.12, 0.5]} material={assets.pupilMat}>
                  <circleGeometry args={[0.033, 20]} />
                </mesh>
                {/* Upper-left oval catchlight & lower-right pinpoint catchlight */}
                <mesh position={[-0.024, 0.028, 0.013]} scale={[1.15, 0.9, 1]} material={assets.catchlightMat}>
                  <circleGeometry args={[0.017, 14]} />
                </mesh>
                <mesh position={[0.022, -0.024, 0.013]} material={assets.catchlightMat}>
                  <circleGeometry args={[0.0085, 10]} />
                </mesh>
                <mesh ref={leftStarGlintRef} position={[-0.018, 0.022, 0.014]} scale={0.001} geometry={geos.star4Geo} material={assets.starGlintMat} />
              </group>
              <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]} scale={[1.0, 0.22, 1.08]} material={assets.corneaMat}>
                <sphereGeometry args={[0.078, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
              </mesh>
              <mesh ref={leftEyelashRef} position={[0, 0, 0.026]} geometry={geos.leftEyelashGeo} material={assets.jetBlack} />
              <mesh
                ref={leftEyelidRef}
                position={[0, 0.088, 0.005]}
                scale={[1.18, 0.01, 0.16]}
                material={assets.snowFur}
                visible={false}
              >
                <sphereGeometry args={[0.088, 16, 12]} />
              </mesh>
            </group>
            <mesh ref={leftHappyEyeRef} position={[0, -0.01, 0.020]} rotation={[0, 0, 0.08]} material={assets.jetBlack} visible={false}>
              <torusGeometry args={[0.06, 0.015, 10, 18, Math.PI]} />
            </mesh>
          </group>

          {/* Right Eye */}
          <group position={[0.145, 0.025, 0.340]} rotation={[0.02, 0.26, 0]}>
            <group ref={rightOpenEyeRef}>
              <mesh position={[0, 0.034, -0.002]} rotation={[0, 0, -0.08]} scale={[1.18, 0.85, 0.4]} material={assets.eyeshadowMat}>
                <circleGeometry args={[0.088, 20]} />
              </mesh>
              <mesh position={[0, 0, 0.002]} scale={[1.14, 1.12, 0.5]} material={assets.scleraMat}>
                <circleGeometry args={[0.076, 28]} />
              </mesh>
              <mesh position={[0, 0, 0.005]} scale={[0.98, 1.08, 0.5]} material={assets.irisMat}>
                <circleGeometry args={[0.076, 28]} />
              </mesh>
              <group ref={rightPupilGroupRef}>
                <mesh position={[0, 0.004, 0.009]} scale={[0.88, 1.12, 0.5]} material={assets.pupilMat}>
                  <circleGeometry args={[0.033, 20]} />
                </mesh>
                <mesh position={[-0.024, 0.028, 0.013]} scale={[1.15, 0.9, 1]} material={assets.catchlightMat}>
                  <circleGeometry args={[0.017, 14]} />
                </mesh>
                <mesh position={[0.022, -0.024, 0.013]} material={assets.catchlightMat}>
                  <circleGeometry args={[0.0085, 10]} />
                </mesh>
                <mesh ref={rightStarGlintRef} position={[-0.018, 0.022, 0.014]} scale={0.001} geometry={geos.star4Geo} material={assets.starGlintMat} />
              </group>
              <mesh position={[0, 0, 0.004]} rotation={[Math.PI / 2, 0, 0]} scale={[1.0, 0.22, 1.08]} material={assets.corneaMat}>
                <sphereGeometry args={[0.078, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
              </mesh>
              <mesh ref={rightEyelashRef} position={[0, 0, 0.026]} geometry={geos.rightEyelashGeo} material={assets.jetBlack} />
              <mesh
                ref={rightEyelidRef}
                position={[0, 0.088, 0.005]}
                scale={[1.18, 0.01, 0.16]}
                material={assets.snowFur}
                visible={false}
              >
                <sphereGeometry args={[0.088, 16, 12]} />
              </mesh>
            </group>
            <mesh ref={rightHappyEyeRef} position={[0, -0.01, 0.020]} rotation={[0, 0, -0.08]} material={assets.jetBlack} visible={false}>
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
      </group>

      {/* ── Articulated Posterior Lumbar/Pelvis Spine (Back Core, Hind Legs & 9 S-Wave Tails) ── */}
      <group ref={pelvisRef} position={[0, 0.35, -0.12]}>
        {/* Posterior Lumbar / Pelvis Core overlapping seamlessly into Anterior Thorax */}
        <mesh position={[0, 0.0, -0.02]} scale={[0.86, 0.88, 0.94]} material={assets.bodyFurMat}>
          <sphereGeometry args={[0.275, 22, 18]} />
        </mesh>

        {/* Dorsal Spine Crystal Cluster */}
        <group position={[0, 0.21, -0.1]}>
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

        {/* Tail-Base Waist Ruff Plumes */}
        {[-0.14, 0, 0.14].map((xPos, idx) => (
          <mesh
            key={idx}
            position={[xPos, 0.13, -0.13]}
            rotation={[0.75, xPos * 1.4, -xPos * 1.2]}
            scale={[0.72, 0.68, 0.72]}
            geometry={geos.furLockGeo}
            material={assets.chestLockMat}
          />
        ))}

        {/* Hind 3-Joint Articulated Legs Attached to Pelvis Spine */}
        {[
          { ref: blLegRef, lowerRef: blLowerRef, pawRef: blPawRef, pos: [-0.18, -0.14, -0.01] as [number, number, number], mirror: -1, rad: 0.078 },
          { ref: brLegRef, lowerRef: brLowerRef, pawRef: brPawRef, pos: [0.18, -0.14, -0.01] as [number, number, number], mirror: 1, rad: 0.078 },
        ].map((leg, lIdx) => (
          <group key={lIdx} ref={leg.ref} position={leg.pos}>
            <mesh position={[0, -0.045, 0]} material={assets.legFurMat}>
              <capsuleGeometry args={[leg.rad, 0.085, 10, 16]} />
            </mesh>
            <mesh
              position={[leg.mirror * 0.055, 0.02, -0.025]}
              rotation={[0.25, leg.mirror * 0.6, leg.mirror * -0.55]}
              scale={[0.52, 0.52, 0.52]}
              geometry={geos.furLockGeo}
              material={assets.pastelBlueFur}
            />
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
            <group ref={leg.lowerRef} position={[0, -0.095, 0]}>
              {ANKLE_CUFF_ANGLES.map((ang, aIdx) => (
                <mesh
                  key={aIdx}
                  position={[leg.mirror * 0.036, 0.01, Math.sin(ang) * 0.035]}
                  rotation={[Math.sin(ang) * 0.35, leg.mirror * 0.4, leg.mirror * -0.45]}
                  scale={[0.32, 0.26, 0.32]}
                  geometry={geos.furLockGeo}
                  material={assets.jetBlack}
                />
              ))}
              <mesh position={[0, -0.045, 0]} material={assets.jetBlack}>
                <capsuleGeometry args={[leg.rad * 0.88, 0.065, 8, 14]} />
              </mesh>
              <group ref={leg.pawRef} position={[0, -0.095, 0.015]}>
                <mesh position={[0, -0.01, 0.008]} scale={[1.08, 0.72, 1.24]} material={assets.jetBlack}>
                  <sphereGeometry args={[leg.rad * 1.02, 14, 12]} />
                </mesh>
                <mesh position={[0, -0.038, 0.015]} scale={[0.78, 0.35, 0.78]} material={assets.pawBeanMat}>
                  <sphereGeometry args={[0.042, 10, 8]} />
                </mesh>
                {[-0.028, 0, 0.028].map((tx, tIdx) => (
                  <mesh key={tIdx} position={[tx, -0.024, 0.074]} scale={[0.85, 0.9, 1.1]} material={assets.jetBlack}>
                    <sphereGeometry args={[0.02, 8, 8]} />
                  </mesh>
                ))}
              </group>
            </group>
          </group>
        ))}

        {/* Nine Voluminous Multi-Segment S-Wave Crystal-Studded Tails */}
        <group position={[0, -0.27, 0.08]}>
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
                <mesh geometry={geos.tailLowerGeo} material={assets.tailFurMat} />
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
                    >
                      {slot.edged && <lineSegments geometry={geos.diamondEdgesGeo} material={assets.crystalEdgeMat} />}
                    </mesh>
                  ))}
                </group>
              </group>
            </group>
          ))}
        </group>
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
  const mouseSpeedRef = useRef({ x: 0, y: 0, vx: 0, at: 0 });
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
  const walkArcPhaseRef = useRef(0);
  const idleTimerRef = useRef(0);
  const nextIdleMicroAtRef = useRef(3.2);
  const lastIdleActionRef = useRef<IdleActionType>("none");
  const loafTransitionedRef = useRef(false);
  const trickIndexRef = useRef(0);
  const exprResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPetBurstAtRef = useRef(0);
  const lastScrollYRef = useRef(0);

  const envCleanupRef = useRef<(() => void) | null>(null);

  const runtimeRef = useRef<SharedRuntimeRef>({
    pointerX: 0,
    pointerY: 0,
    lastPointerMoveAt: 0,
    cursorProximity: 0,
    cursorStalkEnergy: 0,
    wakeUpTimer: 0,
    facingYaw: -0.22,
    moveSpeed: 0,
    lateralVelX: 0,
    lateralVelY: 0,
    landingTimer: 0,
    isWalking: false,
    isDragging: false,
    isPetting: false,
    pettingDuration: 0,
    postPetTimer: 0,
    scrollImpulse: 0,
    burstEnergy: 0,
    posture: "standing",
    expression: "curious",
    trick: "none",
    trickTimer: 0,
    trickDuration: 1,
    idleAction: "none",
    idleActionTimer: 0,
    idleActionDuration: 1,
  });

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

  const triggerSpiritPulse = useCallback((strength = 1.0) => {
    runtimeRef.current.burstEnergy = Math.min(1.4, Math.max(runtimeRef.current.burstEnergy, strength));
  }, []);

  const pickMarginWaypoint = useCallback((w: number, h: number, size: number) => {
    const pad = 12;
    const maxX = Math.max(pad, w - size - pad);
    const maxY = Math.max(76, h - size - pad);

    // Stay anchored to bottom viewport corners so page reading area remains completely clear
    const waypoints: { x: number; y: number }[] = [
      { x: maxX, y: maxY },
      { x: pad, y: maxY },
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
    roamTimerRef.current = 12;

    let animId = 0;
    let lastTime = performance.now();

    const updatePointerTracking = (clientX: number, clientY: number) => {
      const { size } = viewportRef.current;
      const cx = posRef.current.x + size / 2;
      const cy = posRef.current.y + size / 2;
      const distToKit = Math.hypot(clientX - cx, clientY - cy);
      const proximity = distToKit < 240 ? 1 - distToKit / 240 : 0;
      const rt = runtimeRef.current;
      rt.cursorProximity = proximity;

      const isSleepingPosture = rt.posture === "loafing" || rt.posture === "curledSleep" || rt.expression === "sleepy";

      if (distToKit < 240 || dragRef.current.active) {
        idleTimerRef.current = 0;
        loafTransitionedRef.current = false;
        if (isSleepingPosture) {
          rt.wakeUpTimer = 0.75;
          rt.posture = "sitting";
          rt.expression = "curious";
        }
      }

      if (!isSleepingPosture || distToKit < 240 || dragRef.current.active) {
        if (!rt.isPetting) {
          const dx = (clientX - cx) / Math.max(160, window.innerWidth * 0.35);
          const dy = (clientY - cy) / Math.max(160, window.innerHeight * 0.35);
          rt.pointerX = Math.max(-1, Math.min(1, dx));
          rt.pointerY = Math.max(-1, Math.min(1, dy));
        }
        rt.lastPointerMoveAt = performance.now();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      const prevMouse = mouseSpeedRef.current;
      const mDt = Math.max(0.008, (now - prevMouse.at) / 1000);
      const stepDx = e.clientX - prevMouse.x;
      const stepDy = e.clientY - prevMouse.y;
      const cursorSpeed = Math.hypot(stepDx, stepDy) / mDt;
      const reversedX = stepDx * prevMouse.vx < 0;
      mouseSpeedRef.current = { x: e.clientX, y: e.clientY, vx: stepDx, at: now };

      updatePointerTracking(e.clientX, e.clientY);

      if (dragRef.current.active) {
        const segDt = Math.max(0.008, (now - dragRef.current.lastMoveAt) / 1000);
        const dragStepDx = e.clientX - dragRef.current.lastClientX;
        const dragStepDy = e.clientY - dragRef.current.lastClientY;
        velRef.current.x = THREE.MathUtils.clamp(dragStepDx / (segDt * 750), -1, 1);
        velRef.current.y = THREE.MathUtils.clamp(dragStepDy / (segDt * 750), -1, 1);
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
      } else {
        const { size } = viewportRef.current;
        const cx = posRef.current.x + size / 2;
        const cy = posRef.current.y + size / 2;
        const distToKit = Math.hypot(e.clientX - cx, e.clientY - cy);

        // Wiggling mouse near Azurite triggers cat feather-wand stalking!
        if (distToKit < 260 && !runtimeRef.current.isPetting && (reversedX || cursorSpeed > 320)) {
          runtimeRef.current.cursorStalkEnergy = Math.min(1.0, runtimeRef.current.cursorStalkEnergy + (reversedX ? 0.32 : 0.14));
          runtimeRef.current.posture = "standing";
        }

        // Fast swoop breeze rustles ears & wings
        if (cursorSpeed > 1400 && !runtimeRef.current.isPetting && distToKit < 185) {
          velRef.current.x = THREE.MathUtils.clamp(velRef.current.x + Math.sign(stepDx) * 0.55, -1, 1);
          runtimeRef.current.scrollImpulse = Math.min(1, runtimeRef.current.scrollImpulse + 0.32);
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
          triggerSpiritPulse(0.75);
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
        runtimeRef.current.scrollImpulse = Math.min(0.65, runtimeRef.current.scrollImpulse + 0.22);
        // Pause roaming while user actively scrolls & reads content
        dragRef.current.pauseRoamingUntil = Math.max(dragRef.current.pauseRoamingUntil, performance.now() + 9000);
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
      idleTimerRef.current = 0;
      loafTransitionedRef.current = false;
      runtimeRef.current.posture = "standing";
      runtimeRef.current.idleAction = "none";
      setTemporaryExpression("excited", 1800);
      triggerSpiritPulse(0.85);
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
      if (rt.wakeUpTimer > 0) {
        rt.wakeUpTimer = Math.max(0, rt.wakeUpTimer - dt);
      }

      if (rt.isPetting && !rt.isDragging) {
        rt.pettingDuration += dt;
      } else {
        rt.pettingDuration = 0;
      }
      if (rt.postPetTimer > 0) {
        rt.postPetTimer = Math.max(0, rt.postPetTimer - dt);
      }
      if (now - rt.lastPointerMoveAt > 1200) {
        rt.cursorProximity = Math.max(0, rt.cursorProximity - dt * 0.65);
      }

      rt.scrollImpulse = Math.max(0, rt.scrollImpulse - dt * 2.2);
      rt.burstEnergy = Math.max(0, rt.burstEnergy - dt * 1.15);
      rt.cursorStalkEnergy = Math.max(0, rt.cursorStalkEnergy - dt * 0.75);

      idleTimerRef.current += dt;

      const velDecay = Math.exp(-dt * 8);
      velRef.current.x *= velDecay;
      velRef.current.y *= velDecay;

      if (!rt.isDragging && !prefersReducedMotion) {
        const dx = targetRef.current.x - posRef.current.x;
        const dy = targetRef.current.y - posRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 2.5) {
          rt.isWalking = true;
          rt.posture = "standing";
          rt.idleAction = "none";
          loafTransitionedRef.current = false;
          walkArcPhaseRef.current += dt * 4.2;
          const targetSpeed = Math.min(185, Math.max(58, dist * 1.65));
          const step = Math.min(dist, targetSpeed * dt);
          const dirX = dx / dist;
          const dirY = dy / dist;
          const arcFactor = dist > 24 ? Math.sin(walkArcPhaseRef.current) * 0.16 : 0;
          const vx = (dirX - dirY * arcFactor) * (step / Math.max(dt, 0.001));
          const vy = (dirY + dirX * arcFactor) * (step / Math.max(dt, 0.001));
          posRef.current.x = Math.max(4, Math.min(w - size - 4, posRef.current.x + (dirX - dirY * arcFactor) * step));
          posRef.current.y = Math.max(72, Math.min(h - size - 4, posRef.current.y + (dirY + dirX * arcFactor) * step));

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
            rt.landingTimer = 0.28;
            roamTimerRef.current = 22 + Math.random() * 14;
          }
          const onRightHalf = posRef.current.x + size / 2 > w / 2;
          rt.facingYaw = onRightHalf ? -0.24 : 0.24;

          // Natural 4-Stage Resting Posture Lifecycle (standing -> sitting -> yawn+loafing -> curledSleep)
          if (!rt.isPetting && rt.trick === "none") {
            if (idleTimerRef.current < 6.5) {
              rt.posture = "standing";
              loafTransitionedRef.current = false;
            } else if (idleTimerRef.current < 16.0) {
              rt.posture = "sitting";
              loafTransitionedRef.current = false;
            } else if (idleTimerRef.current < 27.0) {
              if (!loafTransitionedRef.current && rt.idleAction === "none") {
                loafTransitionedRef.current = true;
                rt.idleAction = "stretchYawn";
                rt.idleActionDuration = 2.4;
                rt.idleActionTimer = 2.4;
              }
              rt.posture = "loafing";
              if (rt.idleAction === "none") {
                rt.expression = "sleepy";
              }
            } else {
              rt.posture = "curledSleep";
              if (rt.idleAction === "none") {
                rt.expression = "sleepy";
              }
            }
          }

          if (
            now > dragRef.current.pauseRoamingUntil &&
            !rt.isPetting &&
            (rt.posture === "standing" || rt.posture === "sitting")
          ) {
            roamTimerRef.current -= dt;
            if (roamTimerRef.current <= 0) {
              targetRef.current = pickMarginWaypoint(w, h, size);
              roamTimerRef.current = 22 + Math.random() * 14;
            }
          }

          // Autonomous Cute Cat-Like Behavior Engine (Posture-Aware!)
          if (
            idleTimerRef.current > 3.2 &&
            idleTimerRef.current < 15.2 &&
            !rt.isPetting &&
            rt.cursorStalkEnergy < 0.3 &&
            rt.trick === "none" &&
            rt.idleAction === "none" &&
            idleTimerRef.current >= nextIdleMicroAtRef.current
          ) {
            const posturePool =
              rt.posture === "sitting"
                ? AUTONOMOUS_IDLE_POOL.filter((item) => item.seatedOk)
                : AUTONOMOUS_IDLE_POOL;
            const choices = posturePool.filter((item) => item.action !== lastIdleActionRef.current);
            const pool = choices.length > 0 ? choices : posturePool;
            const picked = pool[Math.floor(Math.random() * pool.length)];
            lastIdleActionRef.current = picked.action;
            rt.idleAction = picked.action;
            rt.idleActionDuration = picked.duration;
            rt.idleActionTimer = picked.duration;
            nextIdleMicroAtRef.current = idleTimerRef.current + picked.duration + 3.0 + Math.random() * 3.0;
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
  }, [pickMarginWaypoint, setTemporaryExpression, triggerSpiritPulse]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    idleTimerRef.current = 0;
    loafTransitionedRef.current = false;
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
    runtimeRef.current.posture = "standing";
    runtimeRef.current.wakeUpTimer = 0;
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

      const rect = e.currentTarget.getBoundingClientRect();
      const petLocalX = THREE.MathUtils.clamp(((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1, -1, 1);
      const petLocalY = THREE.MathUtils.clamp(((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1, -1, 1);
      runtimeRef.current.pointerX = petLocalX;
      runtimeRef.current.pointerY = petLocalY;
      runtimeRef.current.lastPointerMoveAt = performance.now();
      runtimeRef.current.isPetting = true;
      runtimeRef.current.postPetTimer = 0;
      runtimeRef.current.expression = "happy";
      runtimeRef.current.idleAction = "none";
      idleTimerRef.current = 0;
      loafTransitionedRef.current = false;

      const now = performance.now();
      if (now - lastPetBurstAtRef.current > 420) {
        lastPetBurstAtRef.current = now;
        triggerSpiritPulse(0.6);
      }
    },
    [triggerSpiritPulse]
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

      idleTimerRef.current = 0;
      loafTransitionedRef.current = false;
      if (!wasMoved) {
        const item = TRICK_SEQUENCE[trickIndexRef.current % TRICK_SEQUENCE.length];
        trickIndexRef.current += 1;
        runtimeRef.current.posture = "standing";
        runtimeRef.current.trick = item.trick;
        runtimeRef.current.trickDuration = item.duration;
        runtimeRef.current.trickTimer = item.duration;
        runtimeRef.current.idleAction = "none";
        setTemporaryExpression(item.expression, 2600);
        triggerSpiritPulse(0.95);
      } else {
        runtimeRef.current.posture = "standing";
        runtimeRef.current.landingTimer = 0.45;
        setTemporaryExpression("happy", 1800);
        triggerSpiritPulse(0.7);
      }
    },
    [setTemporaryExpression, triggerSpiritPulse]
  );

  const handlePointerEnter = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      runtimeRef.current.pointerX = THREE.MathUtils.clamp(
        ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
        -1,
        1
      );
      runtimeRef.current.pointerY = THREE.MathUtils.clamp(
        ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1,
        -1,
        1
      );
      if (
        runtimeRef.current.posture === "loafing" ||
        runtimeRef.current.posture === "curledSleep"
      ) {
        runtimeRef.current.wakeUpTimer = 0.6;
        runtimeRef.current.posture = "sitting";
      }
      runtimeRef.current.isPetting = true;
      runtimeRef.current.pettingDuration = 0;
      runtimeRef.current.postPetTimer = 0;
      runtimeRef.current.expression = "happy";
      runtimeRef.current.idleAction = "none";
      idleTimerRef.current = 0;
      loafTransitionedRef.current = false;
      triggerSpiritPulse(0.65);
    },
    [triggerSpiritPulse]
  );

  const handlePointerLeave = useCallback(() => {
    const hadLongPet = runtimeRef.current.pettingDuration > 0.35;
    runtimeRef.current.isPetting = false;
    runtimeRef.current.pettingDuration = 0;
    if (!runtimeRef.current.isDragging && hadLongPet) {
      runtimeRef.current.postPetTimer = 0.65;
    }
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
      {/* Subtle Ground Frost Halo */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full pointer-events-none blur-sm opacity-40"
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
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: THREE.NoToneMapping,
          }}
          onCreated={({ gl, scene }) => {
            if (envCleanupRef.current) envCleanupRef.current();
            envCleanupRef.current = applyStudioEnvironment(gl, scene);
          }}
          className="w-full h-full pointer-events-none"
        >
          <ambientLight intensity={1.2} />
          <hemisphereLight args={["#eff8ff", "#3b2e75", 1.15]} />
          <directionalLight position={[3.2, 4.8, 4.5]} intensity={1.55} color="#ffffff" />
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
        data-cursor="kitsune"
        data-kitsune-dragging={isDraggingUI ? "true" : "false"}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMoveHit}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current.active = false;
          runtimeRef.current.isDragging = false;
          runtimeRef.current.isPetting = false;
          runtimeRef.current.pettingDuration = 0;
          runtimeRef.current.postPetTimer = 0;
          setIsDraggingUI(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            idleTimerRef.current = 0;
            loafTransitionedRef.current = false;
            const item = TRICK_SEQUENCE[trickIndexRef.current % TRICK_SEQUENCE.length];
            trickIndexRef.current += 1;
            runtimeRef.current.posture = "standing";
            runtimeRef.current.trick = item.trick;
            runtimeRef.current.trickDuration = item.duration;
            runtimeRef.current.trickTimer = item.duration;
            runtimeRef.current.idleAction = "none";
            setTemporaryExpression(item.expression, 2600);
            triggerSpiritPulse(0.95);
          }
        }}
        className={`pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-quantum/60 ${
          isDraggingUI ? "cursor-grabbing" : "cursor-grab"
        }`}
      />
    </div>
  );
}
