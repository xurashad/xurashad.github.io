"use client";

import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ─── Types & Constants ───────────────────────────────────────────────────── */
type Expression = "curious" | "happy" | "playful" | "excited" | "surprised" | "sleepy";
type TrickType = "none" | "spinJump" | "crystalFlare" | "playBow" | "wingFlutter";

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
}

interface SharedRuntimeRef {
  pointerX: number; // normalized -1..1 relative to Azurite center
  pointerY: number; // normalized -1..1 relative to Azurite center
  facingYaw: number;
  isWalking: boolean;
  isDragging: boolean;
  isPetting: boolean;
  scrollImpulse: number;
  burstEnergy: number;
  expression: Expression;
  trick: TrickType;
  trickTimer: number;
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

const TRICK_SEQUENCE: { trick: TrickType; expression: Expression }[] = [
  { trick: "spinJump", expression: "excited" },
  { trick: "crystalFlare", expression: "excited" },
  { trick: "playBow", expression: "playful" },
  { trick: "wingFlutter", expression: "happy" },
];

// 9 Tails matching the luminous fanned silhouette:
// 3 tall upper crown tails behind head/ears, 4 sweeping mid/side curled tails, 2 low flank curls
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

// Crystal cluster offsets anchored in the curled tail's local coordinates (around the black tip ridge)
const TAIL_CRYSTAL_SLOTS: {
  pos: [number, number, number];
  rot: [number, number, number];
  scale: [number, number, number];
  highlight?: boolean;
}[] = [
    { pos: [0, 0.88, 0.05], rot: [0.35, 0.2, 0.05], scale: [1.0, 1.35, 0.95] },
    { pos: [-0.05, 0.83, -0.02], rot: [-0.25, -0.4, 0.38], scale: [0.72, 1.05, 0.72], highlight: true },
    { pos: [0.055, 0.80, 0.02], rot: [-0.15, 0.45, -0.42], scale: [0.7, 1.0, 0.7] },
    { pos: [0, 0.68, -0.13], rot: [-1.05, 0.1, 0.15], scale: [0.68, 0.98, 0.68], highlight: true },
    { pos: [0, 0.91, 0.16], rot: [1.1, -0.15, -0.1], scale: [0.62, 0.92, 0.62] },
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

// Wing membrane crystal plates & finger spars (left side coordinates; mirrored cleanly on right with positive scale)
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

// Leg/Hip flank crystal plates
const LEG_CRYSTALS: { pos: [number, number, number]; rot: [number, number, number]; scale: [number, number, number] }[] = [
  { pos: [0.052, 0.03, 0.015], rot: [0.2, 0.4, -0.35], scale: [0.46, 0.85, 0.34] },
  { pos: [0.056, -0.015, -0.02], rot: [-0.15, 0.5, -0.5], scale: [0.38, 0.68, 0.3] },
  { pos: [0.046, 0.065, -0.015], rot: [0.1, 0.3, -0.25], scale: [0.35, 0.64, 0.28] },
  { pos: [0.048, -0.055, 0.018], rot: [0.3, 0.4, -0.6], scale: [0.3, 0.55, 0.26] },
];

// 18 In-canvas 3D starlight & crystal sparkles
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
  roughness: 0.14,
  metalness: 0.08,
  clearcoat: 1.0,
  clearcoatRoughness: 0.08,
  reflectivity: 1.0,
  transparent: true,
  opacity: 0.94,
  flatShading: true,
});

const DYNAMIC_CRYSTAL_TIP_MAT = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#bae6fd"),
  emissive: new THREE.Color("#38bdf8"),
  emissiveIntensity: 0.42,
  roughness: 0.1,
  metalness: 0.06,
  clearcoat: 1.0,
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

/* ─── Procedural Game-Style Canvas Textures ───────────────────────────────── */
function createHeadFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Vertical gradient: top crown (pastel blue-lavender) -> mid face (soft icy white) -> chin (snowy white)
  const vGrad = ctx.createLinearGradient(0, 0, 0, 256);
  vGrad.addColorStop(0.0, "#a8d8ff");
  vGrad.addColorStop(0.28, "#d8f0ff");
  vGrad.addColorStop(0.55, "#f5f9ff");
  vGrad.addColorStop(1.0, "#ffffff");
  ctx.fillStyle = vGrad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle pastel lavender shading on the back & temple regions (u = 0..0.15 and 0.65..1.0 on sphere)
  const radFace = ctx.createRadialGradient(192, 136, 18, 192, 136, 95);
  radFace.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
  radFace.addColorStop(0.6, "rgba(240, 248, 255, 0.55)");
  radFace.addColorStop(1.0, "rgba(188, 160, 248, 0.28)");
  ctx.fillStyle = radFace;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createBodyFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, "#eef7ff");
  grad.addColorStop(0.35, "#b3e3ff");
  grad.addColorStop(0.75, "#c4abfa");
  grad.addColorStop(1.0, "#9d80ec");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createTailFurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 512, 0, 0);
  grad.addColorStop(0.0, "#c8ecff");
  grad.addColorStop(0.24, "#9be0ff");
  grad.addColorStop(0.48, "#b79cf7");
  grad.addColorStop(0.68, "#8e6ee4");
  grad.addColorStop(0.76, "#2c1e4a");
  grad.addColorStop(1.0, "#100f16");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  for (let i = 0; i < 160; i++) {
    const x = (i * 43) % 256;
    const y = 135 + ((i * 67) % 340);
    ctx.strokeStyle = i % 3 === 0 ? "rgba(255,255,255,0.22)" : "rgba(139,92,246,0.16)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + ((i % 5) - 2) * 3, y - 26);
    ctx.stroke();
  }

  ctx.fillStyle = "#100f16";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(256, 0);
  ctx.lineTo(256, 118);
  const teeth = 14;
  for (let i = teeth; i >= 0; i--) {
    const x = (i / teeth) * 256;
    const y = i % 2 === 0 ? 156 + ((i * 7) % 12) : 96 + ((i * 5) % 10);
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
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0.0, "#eef7ff");
  grad.addColorStop(0.28, "#b7e4ff");
  grad.addColorStop(0.55, "#ab8ef2");
  grad.addColorStop(0.68, "#6f53bf");
  grad.addColorStop(1.0, "#100f16");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = "#100f16";
  ctx.beginPath();
  ctx.moveTo(0, 256);
  ctx.lineTo(256, 256);
  ctx.lineTo(256, 165);
  const teeth = 12;
  for (let i = teeth; i >= 0; i--) {
    const x = (i / teeth) * 256;
    const y = i % 2 === 0 ? 142 + ((i * 3) % 8) : 176 + ((i * 5) % 6);
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
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0.0, "#e6f4ff");
  grad.addColorStop(0.32, "#a5dcff");
  grad.addColorStop(0.56, "#a489ed");
  grad.addColorStop(0.68, "#14121b");
  grad.addColorStop(1.0, "#0f0e15");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = "#0f0e15";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(256, 0);
  ctx.lineTo(256, 98);
  const teeth = 10;
  for (let i = teeth; i >= 0; i--) {
    const x = (i / teeth) * 256;
    const y = i % 2 === 0 ? 116 : 74;
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
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0.0, "#f2f8ff");
  grad.addColorStop(0.4, "#9ee0ff");
  grad.addColorStop(0.78, "#937ce8");
  grad.addColorStop(1.0, "#7c5fe0");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 256);

  for (let i = 0; i < 45; i++) {
    const x = (i * 29) % 128;
    const y = (i * 53) % 256;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1.5;
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

function createStarryCrystalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0.0, "#3b2ea6");
  grad.addColorStop(0.28, "#4b69e6");
  grad.addColorStop(0.58, "#59b5ff");
  grad.addColorStop(0.84, "#9ee8ff");
  grad.addColorStop(1.0, "#e6faff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = "rgba(235, 250, 255, 0.52)";
  ctx.lineWidth = 2;
  for (let x = 0; x < 256; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 256);
    ctx.lineTo(x + 21, 165);
    ctx.lineTo(x + 4, 85);
    ctx.lineTo(x + 20, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 21, 165);
    ctx.lineTo(x + 42, 120);
    ctx.stroke();
  }

  for (let i = 0; i < 42; i++) {
    const x = (i * 61 + 17) % 256;
    const y = 70 + ((i * 47) % 180);
    const r = i % 5 === 0 ? 2.4 : 1.1;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + (i % 3) * 0.22})`;
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
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#180d2e";
  ctx.fillRect(0, 0, 256, 256);

  const grad = ctx.createRadialGradient(128, 146, 26, 128, 128, 122);
  grad.addColorStop(0.0, "#f0abfc");
  grad.addColorStop(0.45, "#a855f7");
  grad.addColorStop(0.78, "#581c87");
  grad.addColorStop(1.0, "#180d2e");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 118, 0, Math.PI * 2);
  ctx.fill();

  const lowerGlow = ctx.createRadialGradient(128, 178, 8, 128, 172, 80);
  lowerGlow.addColorStop(0.0, "rgba(232, 175, 255, 0.92)");
  lowerGlow.addColorStop(0.6, "rgba(168, 85, 247, 0.35)");
  lowerGlow.addColorStop(1.0, "rgba(168, 85, 247, 0)");
  ctx.fillStyle = lowerGlow;
  ctx.beginPath();
  ctx.arc(128, 128, 114, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(243, 212, 255, 0.25)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(128 + Math.cos(a) * 42, 128 + Math.sin(a) * 42);
    ctx.lineTo(128 + Math.cos(a) * 102, 128 + Math.sin(a) * 102);
    ctx.stroke();
  }

  const shadow = ctx.createLinearGradient(0, 10, 0, 125);
  shadow.addColorStop(0.0, "rgba(18, 8, 36, 0.85)");
  shadow.addColorStop(1.0, "rgba(18, 8, 36, 0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, 256, 125);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createWingWebTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 256, 256, 0);
  grad.addColorStop(0.0, "#b9b4f7");
  grad.addColorStop(0.5, "#cbe7ff");
  grad.addColorStop(1.0, "#ebf7ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = "rgba(125, 211, 252, 0.45)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 34);
    ctx.quadraticCurveTo(128, i * 30 + 18, 256, i * 32);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/* ─── Custom Sculpted Game-Mesh Geometries (True Positive-Scale Mirrors) ─── */
function mirrorGeometryX(src: THREE.BufferGeometry): THREE.BufferGeometry {
  const geo = src.clone();
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    pos.setX(i, -pos.getX(i));
  }
  pos.needsUpdate = true;

  // Flip triangle winding so mirrored front-faces stay strictly CCW outward
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
    // Handle non-indexed geometry
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
  planarNormalX = true
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const nVec = new THREE.Vector3(1, 0, 0);
  const bVec = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  for (let i = 0; i <= tubularSegs; i++) {
    const t = i / tubularSegs;
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

      const vx = pt.x + nVec.x * cos * rx + bVec.x * sin * ry;
      const vy = pt.y + nVec.y * cos * rx + bVec.y * sin * ry;
      const vz = pt.z + nVec.z * cos * rx + bVec.z * sin * ry;

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
  // 1. S-Curled Fluffy Nine-Tail Geometry
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.0, 0.0),
    new THREE.Vector3(0, 0.24, -0.10),
    new THREE.Vector3(0, 0.56, -0.15),
    new THREE.Vector3(0, 0.84, -0.05),
    new THREE.Vector3(0, 0.94, 0.13),
    new THREE.Vector3(0, 0.80, 0.23),
  ]);
  const curledTailGeo = buildSculptedTube(
    tailCurve,
    (t, theta) => {
      const baseEnv = Math.sin(Math.pow(t, 0.72) * Math.PI * 0.96);
      const r = 0.042 * (1 - t) + 0.142 * baseEnv + 0.004;
      const furFlute = 1 + 0.075 * Math.cos(theta * 6 + t * 5);
      return [r * 0.96 * furFlute, r * 1.06 * furFlute];
    },
    28,
    16,
    true
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

  // 3. Curved Faceted Azurite Horn (Left & Right positive-winding mirrors)
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

  // 4. Scalloped 3-Bay Fairy-Dragon Wing Membranes (Left & Right)
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

  // Leading wing bone spars (Left & Right)
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

  // Winged Black Eyelash Arcs (Right & Left)
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

  // Curved Black Cheek Whisker Stripes (Left & Right)
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

  // Elongated Faceted Diamond Crystal Plate
  const diamondCrystalGeo = new THREE.OctahedronGeometry(0.062, 0);

  // 4-Point Celestial Starlight Diamond
  const star4Shape = new THREE.Shape();
  star4Shape.moveTo(0, 0.055);
  star4Shape.quadraticCurveTo(0.01, 0.01, 0.055, 0);
  star4Shape.quadraticCurveTo(0.01, -0.01, 0, -0.055);
  star4Shape.quadraticCurveTo(-0.01, -0.01, -0.055, 0);
  star4Shape.quadraticCurveTo(-0.01, 0.01, 0, 0.055);
  const star4Geo = new THREE.ShapeGeometry(star4Shape, 6);

  return {
    curledTailGeo,
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
  const flLegRef = useRef<THREE.Group>(null);
  const frLegRef = useRef<THREE.Group>(null);
  const blLegRef = useRef<THREE.Group>(null);
  const brLegRef = useRef<THREE.Group>(null);
  const auraLightRef = useRef<THREE.PointLight>(null);

  // Expressive anime eyes & mouth refs
  const leftOpenEyeRef = useRef<THREE.Group>(null);
  const rightOpenEyeRef = useRef<THREE.Group>(null);
  const leftHappyEyeRef = useRef<THREE.Mesh>(null);
  const rightHappyEyeRef = useRef<THREE.Mesh>(null);
  const leftPupilGroupRef = useRef<THREE.Group>(null);
  const rightPupilGroupRef = useRef<THREE.Group>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  const openMouthGroupRef = useRef<THREE.Group>(null);
  const happySmileGroupRef = useRef<THREE.Group>(null);
  const tongueRef = useRef<THREE.Mesh>(null);

  const tailBaseRefs = useRef<(THREE.Group | null)[]>([]);
  const sparkleRefs = useRef<(THREE.Mesh | null)[]>([]);

  const blinkTimerRef = useRef(2.4);
  const smoothYawRef = useRef(0);
  const smoothHeadYawRef = useRef(0);
  const smoothHeadPitchRef = useRef(0);

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

    const headFurMat = new THREE.MeshStandardMaterial({
      map: headFurTex,
      roughness: 0.72,
      metalness: 0.02,
      emissive: new THREE.Color("#dbeafe"),
      emissiveIntensity: 0.1,
    });
    const bodyFurMat = new THREE.MeshStandardMaterial({
      map: bodyFurTex,
      roughness: 0.7,
      metalness: 0.03,
      emissive: new THREE.Color("#bfdbfe"),
      emissiveIntensity: 0.09,
    });
    const snowFur = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f5f9ff"),
      roughness: 0.72,
      metalness: 0.02,
      emissive: new THREE.Color("#dbeafe"),
      emissiveIntensity: 0.12,
    });
    const pastelBlueFur = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#a8e0ff"),
      roughness: 0.7,
      metalness: 0.03,
      emissive: new THREE.Color("#7dd3fc"),
      emissiveIntensity: 0.12,
    });
    const wingSparMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#dcd6fe"),
      roughness: 0.45,
      metalness: 0.08,
      emissive: new THREE.Color("#93c5fd"),
      emissiveIntensity: 0.18,
    });
    const wingMembraneMat = new THREE.MeshPhysicalMaterial({
      map: wingWebTex,
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.75,
      emissive: new THREE.Color("#7dd3fc"),
      emissiveIntensity: 0.16,
      transparent: true,
      opacity: 0.84,
      side: THREE.DoubleSide,
    });
    const chestLockMat = new THREE.MeshStandardMaterial({
      map: chestLockTex,
      roughness: 0.68,
      metalness: 0.03,
      emissive: new THREE.Color("#bae6fd"),
      emissiveIntensity: 0.1,
    });
    const tailFurMat = new THREE.MeshStandardMaterial({
      map: tailFurTex,
      roughness: 0.68,
      metalness: 0.04,
      emissive: new THREE.Color("#93c5fd"),
      emissiveIntensity: 0.08,
    });
    const legFurMat = new THREE.MeshStandardMaterial({
      map: legFurTex,
      roughness: 0.66,
      metalness: 0.05,
      emissive: new THREE.Color("#a5b4fc"),
      emissiveIntensity: 0.06,
    });
    const earFurMat = new THREE.MeshStandardMaterial({
      map: earFurTex,
      roughness: 0.68,
      metalness: 0.04,
      emissive: new THREE.Color("#a5b4fc"),
      emissiveIntensity: 0.08,
    });
    const innerEarMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#d8b4fe"),
      roughness: 0.68,
      emissive: new THREE.Color("#a855f7"),
      emissiveIntensity: 0.12,
    });
    const starryHornMat = new THREE.MeshPhysicalMaterial({
      map: crystalTex,
      roughness: 0.16,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
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
        eyeshadowMat,
        pupilMat,
        catchlightMat,
        mouthInterior,
        tongueMat,
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
      eyeshadowMat,
      pupilMat,
      catchlightMat,
      mouthInterior,
      tongueMat,
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(geos).forEach((g) => g.dispose());
      assets.textures.forEach((t) => t.dispose());
      assets.materials.forEach((m) => m.dispose());
    };
  }, [assets, geos]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const rt = runtime.current;

    const expr = rt.expression;
    const trick = rt.trick;
    const isTrickSpin = trick === "spinJump";
    const isTrickFlare = trick === "crystalFlare";
    const isTrickBow = trick === "playBow";
    const isTrickFlutter = trick === "wingFlutter";

    let yawDiff = rt.facingYaw - smoothYawRef.current;
    while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
    while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
    smoothYawRef.current += yawDiff * Math.min(1, dt * 6);

    // 1. Root bounce, hover, spin & drag dangle
    if (rootRef.current) {
      let yOffset = 0;
      let spinAngle = 0;
      let tiltX = 0;
      let tiltZ = 0;

      if (rt.isDragging) {
        yOffset = 0.06 + Math.sin(t * 7.5) * 0.025;
        tiltZ = Math.sin(t * 5) * 0.08;
      } else if (isTrickSpin) {
        const p = 1 - rt.trickTimer / 0.95;
        yOffset = Math.sin(p * Math.PI) * 0.38;
        spinAngle = p * Math.PI * 2;
        tiltX = Math.sin(p * Math.PI) * 0.22;
      } else if (isTrickFlutter) {
        yOffset = 0.16 + Math.sin(t * 9.5) * 0.06;
        tiltX = 0.08;
      } else if (isTrickBow) {
        yOffset = Math.abs(Math.sin(t * 6)) * 0.04;
        tiltX = 0.16;
      } else if (rt.isWalking) {
        yOffset = Math.abs(Math.sin(t * 11)) * 0.06;
        tiltZ = Math.sin(t * 5.5) * 0.04;
      } else if (expr === "surprised") {
        yOffset = Math.abs(Math.sin(t * 10)) * 0.08;
      } else if (expr === "sleepy") {
        yOffset = -0.04 + Math.sin(t * 1.4) * 0.01;
      } else {
        yOffset = Math.sin(t * 2.3) * 0.02 + rt.scrollImpulse * 0.12;
      }

      rootRef.current.position.y = -0.26 + yOffset;
      rootRef.current.rotation.y = smoothYawRef.current + spinAngle;
      rootRef.current.rotation.x = tiltX;
      rootRef.current.rotation.z = tiltZ;
    }

    // 2. Torso subtle breathing
    if (bodyRef.current) {
      const breath = expr === "sleepy" ? Math.sin(t * 1.4) * 0.025 : Math.sin(t * 3.0) * 0.015;
      bodyRef.current.scale.set(1 + breath * 0.5, 1 - breath * 0.4, 1 + breath * 0.5);
    }

    // 3. Head cursor/touch tracking & curious expression tilt
    const targetHeadYaw = THREE.MathUtils.clamp(rt.pointerX * 0.4, -0.42, 0.42);
    const targetHeadPitch = THREE.MathUtils.clamp(-rt.pointerY * 0.24, -0.26, 0.24);
    smoothHeadYawRef.current += (targetHeadYaw - smoothHeadYawRef.current) * Math.min(1, dt * 8);
    smoothHeadPitchRef.current += (targetHeadPitch - smoothHeadPitchRef.current) * Math.min(1, dt * 8);

    if (headRef.current) {
      let extraTiltZ = 0;
      let extraPitch = 0;
      if (expr === "curious") extraTiltZ = Math.sin(t * 1.5) * 0.06 + 0.05;
      if (expr === "happy" || rt.isPetting) extraTiltZ = Math.sin(t * 5.2) * 0.09;
      if (expr === "playful") extraTiltZ = -0.13;
      if (expr === "sleepy") extraPitch = 0.15 + Math.sin(t * 1.4) * 0.025;

      headRef.current.rotation.y = smoothHeadYawRef.current * 0.72;
      headRef.current.rotation.x = smoothHeadPitchRef.current + extraPitch;
      headRef.current.rotation.z = extraTiltZ;
    }

    // 4. Ears twitching
    const earPerk = expr === "surprised" || expr === "excited" ? 0.1 : expr === "sleepy" ? -0.22 : 0;
    const earTwitch = Math.sin(t * 9.5) > 0.94 ? Math.sin(t * 38) * 0.14 : 0;
    if (leftEarRef.current) {
      leftEarRef.current.rotation.z = 0.46 - earPerk + earTwitch;
      leftEarRef.current.rotation.x = expr === "sleepy" ? 0.16 : Math.sin(t * 2.1) * 0.03;
    }
    if (rightEarRef.current) {
      rightEarRef.current.rotation.z = -0.46 + earPerk - earTwitch * 0.5;
      rightEarRef.current.rotation.x = expr === "sleepy" ? 0.16 : Math.cos(t * 2.1) * 0.03;
    }

    // 5. Magical Fairy-Dragon Wing Flutter
    const wingSpeed =
      isTrickFlutter || isTrickSpin || rt.scrollImpulse > 0.15
        ? 18
        : rt.isPetting || expr === "excited"
          ? 10.5
          : 2.9;
    const wingAmp =
      isTrickFlutter || isTrickSpin || rt.scrollImpulse > 0.15
        ? 0.46
        : rt.isPetting || expr === "excited"
          ? 0.28
          : 0.085;
    const flap = Math.sin(t * wingSpeed) * wingAmp;
    if (leftWingRef.current) {
      leftWingRef.current.rotation.y = 0.34 + flap;
      leftWingRef.current.rotation.z = 0.04 + flap * 0.22;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.y = -0.34 - flap;
      rightWingRef.current.rotation.z = -0.04 - flap * 0.22;
    }

    // 6. Four Sturdy Chibi Legs
    const walkSwing = rt.isWalking ? Math.sin(t * 11) * 0.44 : 0;
    const dangleSwing = rt.isDragging ? Math.sin(t * 9) * 0.28 : 0;
    if (flLegRef.current && frLegRef.current && blLegRef.current && brLegRef.current) {
      if (rt.isDragging) {
        flLegRef.current.rotation.x = 0.3 + dangleSwing;
        frLegRef.current.rotation.x = 0.3 - dangleSwing;
        blLegRef.current.rotation.x = 0.36 - dangleSwing * 0.8;
        brLegRef.current.rotation.x = 0.36 + dangleSwing * 0.8;
      } else if (isTrickBow) {
        flLegRef.current.rotation.x = -0.78 + Math.sin(t * 14) * 0.24;
        flLegRef.current.rotation.z = 0.18;
        frLegRef.current.rotation.x = 0.16;
        frLegRef.current.rotation.z = 0;
        blLegRef.current.rotation.x = -0.14;
        brLegRef.current.rotation.x = -0.14;
      } else if (rt.isWalking) {
        flLegRef.current.rotation.x = walkSwing;
        flLegRef.current.rotation.z = 0;
        frLegRef.current.rotation.x = -walkSwing;
        frLegRef.current.rotation.z = 0;
        blLegRef.current.rotation.x = -walkSwing;
        brLegRef.current.rotation.x = walkSwing;
      } else {
        const micro = Math.sin(t * 2.3) * 0.022;
        flLegRef.current.rotation.x = micro;
        flLegRef.current.rotation.z = 0;
        frLegRef.current.rotation.x = -micro;
        frLegRef.current.rotation.z = 0;
        blLegRef.current.rotation.x = -0.22;
        brLegRef.current.rotation.x = -0.22;
      }
    }

    // 7. Expressive Anime Eyes, Brows & Morphing Mouth
    blinkTimerRef.current -= dt;
    if (blinkTimerRef.current < -0.15) {
      blinkTimerRef.current = 2.7 + (Math.sin(t * 17.3) + 1) * 1.3;
    }
    const isBlinking = blinkTimerRef.current <= 0 && expr !== "happy" && expr !== "surprised";

    const useLeftHappy = expr === "happy" || expr === "playful";
    const useRightHappy = expr === "happy";

    if (leftOpenEyeRef.current) leftOpenEyeRef.current.visible = !useLeftHappy;
    if (rightOpenEyeRef.current) rightOpenEyeRef.current.visible = !useRightHappy;
    if (leftHappyEyeRef.current) leftHappyEyeRef.current.visible = useLeftHappy;
    if (rightHappyEyeRef.current) rightHappyEyeRef.current.visible = useRightHappy;

    const lidScaleY = isBlinking ? 1.38 : expr === "sleepy" ? 0.65 : 0.03;
    if (leftEyelidRef.current) leftEyelidRef.current.scale.y = lidScaleY;
    if (rightEyelidRef.current) rightEyelidRef.current.scale.y = lidScaleY;

    const lookX = THREE.MathUtils.clamp(rt.pointerX * 0.016, -0.016, 0.016);
    const lookY = THREE.MathUtils.clamp(-rt.pointerY * 0.012, -0.012, 0.012);
    const pupilScale = expr === "excited" ? 1.24 : expr === "surprised" ? 0.72 : 1.0;
    if (leftPupilGroupRef.current) {
      leftPupilGroupRef.current.position.set(lookX, lookY, 0);
      leftPupilGroupRef.current.scale.setScalar(pupilScale);
    }
    if (rightPupilGroupRef.current) {
      rightPupilGroupRef.current.position.set(lookX, lookY, 0);
      rightPupilGroupRef.current.scale.setScalar(pupilScale);
    }

    const browY = expr === "surprised" ? 0.162 : expr === "sleepy" ? 0.125 : 0.145;
    const browTilt = expr === "sleepy" ? 0.18 : expr === "excited" ? -0.18 : -0.08;
    if (leftBrowRef.current) {
      leftBrowRef.current.position.y = browY;
      leftBrowRef.current.rotation.z = -browTilt;
    }
    if (rightBrowRef.current) {
      rightBrowRef.current.position.y = browY;
      rightBrowRef.current.rotation.z = browTilt;
    }

    const isSmileMouth = expr === "happy" || expr === "playful";
    if (openMouthGroupRef.current) {
      openMouthGroupRef.current.visible = !isSmileMouth;
      const mouthScale = expr === "surprised" ? 1.35 : expr === "excited" ? 1.2 : 1.0;
      openMouthGroupRef.current.scale.setScalar(mouthScale);
    }
    if (happySmileGroupRef.current) happySmileGroupRef.current.visible = isSmileMouth;
    if (tongueRef.current) {
      tongueRef.current.visible = isSmileMouth || isTrickBow;
      if (tongueRef.current.visible) {
        tongueRef.current.rotation.x = 0.28 + Math.sin(t * 7) * 0.08;
      }
    }

    // Blush & Iridescent Crystal Glow
    const boost = rt.isPetting || isTrickFlare || expr === "excited" || expr === "happy" ? 1 : 0;
    DYNAMIC_BLUSH_MAT.opacity = boost ? 0.52 : expr === "playful" ? 0.38 : 0.18;
    const glow =
      isTrickFlare
        ? 0.85
        : rt.isPetting || expr === "excited"
          ? 0.56
          : 0.28 + Math.sin(t * 2.4) * 0.08 + rt.burstEnergy * 0.45;
    DYNAMIC_CRYSTAL_MAT.emissiveIntensity = glow;
    DYNAMIC_CRYSTAL_TIP_MAT.emissiveIntensity = glow + 0.15;
    DYNAMIC_SPARKLE_MAT.opacity = 0.45 + Math.sin(t * 3.5) * 0.22 + rt.burstEnergy * 0.35;
    if (auraLightRef.current) {
      auraLightRef.current.intensity = isTrickFlare ? 2.1 : rt.isPetting ? 1.45 : 0.75 + rt.burstEnergy * 0.9;
    }

    // 8. Nine Voluminous S-Curled Tails Sway
    const wagSpeed = rt.isPetting || isTrickFlare || expr === "excited" ? 5.2 : rt.isWalking ? 3.8 : 1.85;
    const wagAmp = isTrickFlare ? 0.22 : rt.isPetting ? 0.16 : 0.085;
    const flareSpread = isTrickFlare ? 1.15 : expr === "sleepy" ? 0.86 : 1.0;

    for (let i = 0; i < 9; i++) {
      const cfg = TAIL_CONFIGS[i];
      const base = tailBaseRefs.current[i];
      if (base) {
        base.rotation.z = cfg.fanRoll * flareSpread + Math.sin(t * wagSpeed + cfg.phase) * (wagAmp * 0.75);
        base.rotation.x = cfg.pitchBack + Math.cos(t * wagSpeed * 0.85 + cfg.phase) * (wagAmp * 0.65);
      }
    }

    // 9. 18 In-Canvas 3D Magical Starlight & Crystal Sparkles
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
        {/* Single Seamless Pastel Gradient Body Core */}
        <mesh position={[0, 0.01, -0.05]} scale={[0.88, 0.92, 1.12]} material={assets.bodyFurMat}>
          <sphereGeometry args={[0.31, 24, 20]} />
        </mesh>
        {/* Neck / Chin Frost Collar */}
        <mesh position={[0, 0.24, 0.05]} scale={[0.96, 0.65, 0.9]} material={assets.snowFur}>
          <sphereGeometry args={[0.24, 20, 16]} />
        </mesh>

        {/* 19-Lock 3-Tier Game-Style Chest Mane */}
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

        {/* ── Left Magical Fairy-Dragon Webbed Crystal Wing ── */}
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

        {/* ── Right Magical Fairy-Dragon Webbed Crystal Wing (True Mirrored Positive-Scale Geometry) ── */}
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
        {/* Sculpted Wide Chibi Cranium (Seamless Snowy/Pastel-Sky/Lavender UV Gradient) */}
        <mesh scale={[1.18, 0.96, 1.0]} material={assets.headFurMat}>
          <sphereGeometry args={[0.35, 32, 28]} />
        </mesh>
        {/* Soft Plump White Cheeks */}
        <mesh position={[-0.17, -0.09, 0.21]} scale={[1.05, 0.86, 0.82]} material={assets.snowFur}>
          <sphereGeometry args={[0.16, 18, 14]} />
        </mesh>
        <mesh position={[0.17, -0.09, 0.21]} scale={[1.05, 0.86, 0.82]} material={assets.snowFur}>
          <sphereGeometry args={[0.16, 18, 14]} />
        </mesh>
        {/* Soft Short Chibi Muzzle */}
        <mesh position={[0, -0.085, 0.27]} scale={[0.96, 0.72, 0.85]} material={assets.snowFur}>
          <sphereGeometry args={[0.145, 20, 16]} />
        </mesh>

        {/* Fluffy Crown Locks Between Horns */}
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

        {/* Layered Cheek Ruff Plumes (Left & Right, Positive-Scale Mirrored) */}
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

        {/* Nose (Cute Black Fox Heart-Triangle seated cleanly on muzzle bridge) */}
        <mesh position={[0, -0.055, 0.396]} rotation={[0.1, 0, Math.PI]} scale={[1.25, 0.9, 0.65]} material={assets.jetBlack}>
          <coneGeometry args={[0.028, 0.034, 4]} />
        </mesh>

        {/* Default Parted ":o" / "△" Mouth (Flush on front surface of muzzle z=0.390) */}
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

        {/* Forehead Trio of Faceted Azurite Crystals + Black Vertical Teardrop */}
        <group position={[0, 0.165, 0.315]} rotation={[-0.36, 0, 0]}>
          <mesh position={[0, 0.01, 0.008]} scale={[0.92, 1.48, 0.52]} geometry={geos.diamondCrystalGeo} material={assets.starryHornMat} />
          <mesh position={[-0.072, -0.022, -0.006]} rotation={[0, 0, 0.38]} scale={[0.52, 0.9, 0.4]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT} />
          <mesh position={[0.072, -0.022, -0.006]} rotation={[0, 0, -0.38]} scale={[0.52, 0.9, 0.4]} geometry={geos.diamondCrystalGeo} material={DYNAMIC_CRYSTAL_TIP_MAT} />
        </group>
        {/* Black vertical teardrop mark right between the eyes */}
        <mesh position={[0, 0.055, 0.348]} scale={[0.55, 1.15, 0.45]} material={assets.jetBlack}>
          <sphereGeometry args={[0.018, 10, 8]} />
        </mesh>

        {/* 2 Curved Starry Azurite Crystal Horns + Basal Crystal Buds (Positive Scale Left & Right) */}
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

        {/* Large Fox Ears with Jagged Black Tips & Inner Fluff */}
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

        {/* Black Cheek Stripes + Teardrop Marks (Seated on outer cheek puff surface z=0.332) */}
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

        {/* Soft Rosy Blush */}
        <mesh position={[-0.195, -0.082, 0.335]} rotation={[0.1, -0.45, 0]} scale={[1.25, 0.72, 0.4]} material={DYNAMIC_BLUSH_MAT}>
          <sphereGeometry args={[0.048, 12, 10]} />
        </mesh>
        <mesh position={[0.195, -0.082, 0.335]} rotation={[0.1, 0.45, 0]} scale={[1.25, 0.72, 0.4]} material={DYNAMIC_BLUSH_MAT}>
          <sphereGeometry args={[0.048, 12, 10]} />
        </mesh>

        {/* ── Large Glossy Purple Game-Style Anime Eyes (Cleanly Seated at z=0.338) ── */}
        {/* Left Eye */}
        <group position={[-0.145, 0.024, 0.338]} rotation={[0.02, -0.28, 0]}>
          <group ref={leftOpenEyeRef}>
            <mesh position={[0, 0.034, -0.004]} rotation={[0, 0, 0.08]} scale={[1.18, 0.85, 0.4]} material={assets.eyeshadowMat}>
              <circleGeometry args={[0.088, 20]} />
            </mesh>
            <mesh position={[0, 0, 0.004]} scale={[1.02, 1.1, 0.5]} material={assets.irisMat}>
              <circleGeometry args={[0.076, 24]} />
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
            </group>
            <mesh position={[0, 0, 0.01]} geometry={geos.leftEyelashGeo} material={assets.jetBlack} />
            <mesh ref={leftEyelidRef} position={[0, 0.02, 0.014]} scale={[1.24, 0.03, 0.5]} material={assets.snowFur}>
              <sphereGeometry args={[0.078, 16, 10]} />
            </mesh>
          </group>
          <mesh ref={leftHappyEyeRef} position={[0, -0.01, 0.015]} rotation={[0, 0, 0.08]} material={assets.jetBlack} visible={false}>
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
              <circleGeometry args={[0.076, 24]} />
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
            </group>
            <mesh position={[0, 0, 0.01]} geometry={geos.rightEyelashGeo} material={assets.jetBlack} />
            <mesh ref={rightEyelidRef} position={[0, 0.02, 0.014]} scale={[1.24, 0.03, 0.5]} material={assets.snowFur}>
              <sphereGeometry args={[0.078, 16, 10]} />
            </mesh>
          </group>
          <mesh ref={rightHappyEyeRef} position={[0, -0.01, 0.015]} rotation={[0, 0, -0.08]} material={assets.jetBlack} visible={false}>
            <torusGeometry args={[0.06, 0.015, 10, 18, Math.PI]} />
          </mesh>
        </group>

        {/* Jet-Black Bean Eyebrows (Flush on forehead z=0.312) */}
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

      {/* ── Four Sturdy Chibi Legs (Blue-Lavender -> Jagged Fur Transition -> Black Paws) ── */}
      {[
        { ref: flLegRef, pos: [-0.135, 0.18, 0.18] as [number, number, number], mirror: -1, rad: 0.072 },
        { ref: frLegRef, pos: [0.135, 0.18, 0.18] as [number, number, number], mirror: 1, rad: 0.072 },
        { ref: blLegRef, pos: [-0.18, 0.18, -0.13] as [number, number, number], mirror: -1, rad: 0.078 },
        { ref: brLegRef, pos: [0.18, 0.18, -0.13] as [number, number, number], mirror: 1, rad: 0.078 },
      ].map((leg, lIdx) => (
        <group key={lIdx} ref={leg.ref} position={leg.pos}>
          <mesh position={[0, -0.06, 0]} material={assets.legFurMat}>
            <capsuleGeometry args={[leg.rad, 0.16, 10, 16]} />
          </mesh>
          <mesh position={[0, -0.17, 0.02]} scale={[1.08, 0.72, 1.24]} material={assets.jetBlack}>
            <sphereGeometry args={[leg.rad * 1.04, 14, 12]} />
          </mesh>
          {[-0.028, 0, 0.028].map((tx, tIdx) => (
            <mesh key={tIdx} position={[tx, -0.185, 0.088]} scale={[0.85, 0.9, 1.1]} material={assets.jetBlack}>
              <sphereGeometry args={[0.02, 8, 8]} />
            </mesh>
          ))}
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
        </group>
      ))}

      {/* ── Nine Voluminous S-Curled Crystal-Studded Tails ── */}
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
              <mesh geometry={geos.curledTailGeo} material={assets.tailFurMat} />
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
  const viewportRef = useRef({ w: 1280, h: 720, size: 148 });
  const dragRef = useRef({
    active: false,
    moved: false,
    startClientX: 0,
    startClientY: 0,
    startPosX: 0,
    startPosY: 0,
    pauseRoamingUntil: 0,
  });
  const roamTimerRef = useRef(0);
  const idleTimerRef = useRef(0);
  const trickIndexRef = useRef(0);
  const particleIdRef = useRef(0);
  const exprResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPetBurstAtRef = useRef(0);
  const lastScrollYRef = useRef(0);

  const runtimeRef = useRef<SharedRuntimeRef>({
    pointerX: 0,
    pointerY: 0,
    facingYaw: -0.22,
    isWalking: false,
    isDragging: false,
    isPetting: false,
    scrollImpulse: 0,
    burstEnergy: 0,
    expression: "curious",
    trick: "none",
    trickTimer: 0,
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
      const size = w < 640 ? 124 : 148;
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
      idleTimerRef.current = 0;
      if (runtimeRef.current.expression === "sleepy") {
        runtimeRef.current.expression = "curious";
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      updatePointerTracking(e.clientX, e.clientY);
      if (dragRef.current.active) {
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
      rt.scrollImpulse = Math.max(0, rt.scrollImpulse - dt * 2.2);
      rt.burstEnergy = Math.max(0, rt.burstEnergy - dt * 1.15);

      idleTimerRef.current += dt;

      if (!rt.isDragging && !prefersReducedMotion) {
        const dx = targetRef.current.x - posRef.current.x;
        const dy = targetRef.current.y - posRef.current.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 3) {
          rt.isWalking = true;
          const speed = Math.min(175, Math.max(68, dist * 1.45));
          const step = Math.min(dist, speed * dt);
          posRef.current.x += (dx / dist) * step;
          posRef.current.y += (dy / dist) * step;

          rt.facingYaw = dx >= 0 ? 0.5 : -0.5;

          if (containerRef.current) {
            containerRef.current.style.transform = `translate3d(${posRef.current.x.toFixed(1)}px, ${posRef.current.y.toFixed(1)}px, 0)`;
          }
        } else {
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

          if (idleTimerRef.current > 12 && !rt.isPetting && rt.trick === "none") {
            rt.expression = "sleepy";
          }
        }
      }

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
    };
  }, [pickMarginWaypoint, setTemporaryExpression, triggerSparkleBurst]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    idleTimerRef.current = 0;
    dragRef.current = {
      active: true,
      moved: false,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPosX: posRef.current.x,
      startPosY: posRef.current.y,
      pauseRoamingUntil: performance.now() + 9000,
    };
    runtimeRef.current.isDragging = true;
    runtimeRef.current.expression = "surprised";
    setIsDraggingUI(true);
  }, []);

  const handlePointerMoveHit = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (dragRef.current.active) {
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
        runtimeRef.current.trickTimer = 0.95;
        setTemporaryExpression(item.expression, 2400);
        triggerSparkleBurst(1.1);
      } else {
        setTemporaryExpression("happy", 1800);
        triggerSparkleBurst(0.75);
      }
    },
    [setTemporaryExpression, triggerSparkleBurst]
  );

  const handlePointerEnter = useCallback(() => {
    runtimeRef.current.isPetting = true;
    runtimeRef.current.expression = "happy";
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
      className="fixed top-0 left-0 z-40 w-[124px] h-[124px] sm:w-[148px] sm:h-[148px] pointer-events-none select-none will-change-transform"
    >
      {/* Pure Visual Crystal Mote Shimmer (No Text / No Emojis) */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {motes.map((m) => (
          <span
            key={m.id}
            style={{ transform: `translate(${m.x}px, ${m.y}px)` }}
            className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 rounded-[1px] bg-gradient-to-br from-sky-200 to-violet-400 shadow-[0_0_8px_rgba(125,211,252,0.9)] animate-ping"
          />
        ))}
      </div>

      {/* Subtle Ground Frost Halo */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full pointer-events-none blur-sm opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(125,211,252,0.5), rgba(167,139,250,0.28), transparent 75%)",
        }}
      />

      {/* 3D WebGL Canvas */}
      <CanvasErrorBoundary>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0.42, 4.15], fov: 35 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          className="w-full h-full pointer-events-none"
        >
          <ambientLight intensity={1.25} />
          <hemisphereLight args={["#eff8ff", "#3b2e75", 1.15]} />
          <directionalLight position={[3.2, 4.8, 4.5]} intensity={1.65} color="#ffffff" />
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
            runtimeRef.current.trickTimer = 0.95;
            setTemporaryExpression(item.expression, 2400);
            triggerSparkleBurst(1.1);
          }
        }}
        className={`pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-quantum/60 ${isDraggingUI ? "cursor-grabbing" : "cursor-grab"
          }`}
      />
    </div>
  );
}
