"use client";

import {
  ComponentRef,
  Suspense,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { Compass, RotateCcw, RotateCw, Sparkles } from "lucide-react";
import {
  getBokehTexture,
  getPieceGeometries,
  getSharedBoardGeometries,
  getThemeTextureBundle,
  mulberry32,
} from "./lib/chess3dAssets";
import { CHESS_THEMES, type ChessTheme } from "./lib/themes";
import type {
  Board,
  BoardThemeId,
  CameraPreset,
  Color,
  GraphicsQuality,
  Move,
  MoveAnimationMeta,
  PieceType,
  Square,
} from "./lib/types";

interface Props {
  board: Board;
  flipped?: boolean;
  selected: Square | null;
  validMoves: Move[];
  lastMove: Move | null;
  checkSquare: Square | null;
  currentTurn?: Color;
  onSquareClick: (sq: Square) => void;
  onDropPiece?: (from: Square, to: Square) => void;
  disabled?: boolean;
  themeId?: BoardThemeId;
  quality?: GraphicsQuality;
  showCoordinates?: boolean;
  hintMove?: Move | null;
  moveAnim?: MoveAnimationMeta | null;
  interactive?: boolean;
  autoFollowTurn?: boolean;
}

interface DragRuntimeState {
  active: boolean;
  pieceId: string;
  from: Square;
  startX: number;
  startY: number;
  worldX: number;
  worldZ: number;
}

const SHADOWS_DISABLED: Partial<THREE.WebGLShadowMap> = {
  enabled: false,
  type: THREE.PCFShadowMap,
};

// ── Procedural Scene Environment (Zero External HDRIs) ───────────────────────

function SceneEnvironment({ quality }: { quality: GraphicsQuality }) {
  const intensity = quality === "lite" ? 0.55 : quality === "ultra" ? 0.98 : 0.85;
  return (
    <Environment frames={1} resolution={128} environmentIntensity={intensity}>
      {/* Overhead studio softbox */}
      <Lightformer
        form="rect"
        intensity={2.6}
        color="#fffcf5"
        position={[0, 9, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[12, 12, 1]}
      />
      {/* Cool cyan-violet rim strip */}
      <Lightformer
        form="rect"
        intensity={2.1}
        color="#67e8f9"
        position={[-9, 4.5, -5]}
        rotation={[0, Math.PI / 3, 0]}
        scale={[10, 4.5, 1]}
      />
      {/* Warm gold rim strip */}
      <Lightformer
        form="rect"
        intensity={1.9}
        color="#fde68a"
        position={[9, 4.2, 4]}
        rotation={[0, -Math.PI / 2.5, 0]}
        scale={[10, 4.5, 1]}
      />
      {/* Back purple nebula fill */}
      <Lightformer
        form="rect"
        intensity={1.35}
        color="#a855f7"
        position={[0, 3.5, -10]}
        rotation={[0, 0, 0]}
        scale={[14, 5, 1]}
      />
      {/* Overhead halo ring */}
      <Lightformer
        form="ring"
        intensity={1.5}
        color="#e9d5ff"
        position={[0, 7.5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
    </Environment>
  );
}

// ── Theme Material Builder ───────────────────────────────────────────────────

interface ThemeMaterials {
  lightTile: THREE.Material;
  darkTile: THREE.Material;
  whitePiece: THREE.Material;
  blackPiece: THREE.Material;
  trimMetal: THREE.Material;
  selectedTile: THREE.Material;
  selectedPiece: THREE.Material;
  checkTile: THREE.Material;
  checkPiece: THREE.Material;
  plinthBase: THREE.Material;
  plinthTrim: THREE.Material;
  plinthGrout: THREE.Material;
}

function buildThemeMaterials(
  theme: ChessTheme,
  quality: GraphicsQuality
): ThemeMaterials {
  const tex = getThemeTextureBundle(theme);
  const s3d = theme.scene3d;
  const usePhysical = quality !== "lite";

  const makeMat = (opts: {
    color: string;
    roughness: number;
    metalness: number;
    clearcoat?: number;
    emissive?: string;
    emissiveIntensity?: number;
    map?: THREE.Texture;
    roughnessMap?: THREE.Texture;
  }): THREE.Material => {
    if (usePhysical) {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(opts.color),
        roughness: opts.roughness,
        metalness: opts.metalness,
        clearcoat: opts.clearcoat ?? 0,
        clearcoatRoughness: 0.14,
        reflectivity: 0.72,
        emissive: opts.emissive ? new THREE.Color(opts.emissive) : new THREE.Color("#000000"),
        emissiveIntensity: opts.emissiveIntensity ?? 0,
        map: opts.map ?? null,
        roughnessMap: opts.roughnessMap ?? null,
      });
    }
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(opts.color),
      roughness: opts.roughness,
      metalness: opts.metalness,
      emissive: opts.emissive ? new THREE.Color(opts.emissive) : new THREE.Color("#000000"),
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      map: opts.map ?? null,
      roughnessMap: opts.roughnessMap ?? null,
    });
  };

  return {
    lightTile: makeMat({
      color: "#ffffff",
      roughness: s3d.lightTile.roughness,
      metalness: s3d.lightTile.metalness,
      clearcoat: s3d.lightTile.clearcoat,
      emissive: s3d.lightTile.emissive,
      emissiveIntensity: s3d.lightTile.emissiveIntensity,
      map: tex.lightMap,
      roughnessMap: tex.lightRoughness,
    }),
    darkTile: makeMat({
      color: "#ffffff",
      roughness: s3d.darkTile.roughness,
      metalness: s3d.darkTile.metalness,
      clearcoat: s3d.darkTile.clearcoat,
      emissive: s3d.darkTile.emissive,
      emissiveIntensity: s3d.darkTile.emissiveIntensity,
      map: tex.darkMap,
      roughnessMap: tex.darkRoughness,
    }),
    whitePiece: makeMat({
      color: s3d.whitePiece.color,
      roughness: s3d.whitePiece.roughness,
      metalness: s3d.whitePiece.metalness,
      clearcoat: s3d.whitePiece.clearcoat,
      emissive: s3d.whitePiece.emissive,
      emissiveIntensity: s3d.whitePiece.emissiveIntensity,
    }),
    blackPiece: makeMat({
      color: s3d.blackPiece.color,
      roughness: s3d.blackPiece.roughness,
      metalness: s3d.blackPiece.metalness,
      clearcoat: s3d.blackPiece.clearcoat,
      emissive: s3d.blackPiece.emissive,
      emissiveIntensity: s3d.blackPiece.emissiveIntensity,
    }),
    trimMetal: makeMat({
      color: s3d.trimMetal.color,
      roughness: s3d.trimMetal.roughness,
      metalness: s3d.trimMetal.metalness,
      clearcoat: 0.4,
      emissive: s3d.trimMetal.emissive,
      emissiveIntensity: s3d.trimMetal.emissiveIntensity,
    }),
    selectedTile: new THREE.MeshStandardMaterial({
      color: new THREE.Color(s3d.selectColor),
      roughness: 0.16,
      metalness: 0.35,
      emissive: new THREE.Color(s3d.selectColor),
      emissiveIntensity: 0.85,
    }),
    selectedPiece: makeMat({
      color: s3d.selectColor,
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 0.9,
      emissive: s3d.selectColor,
      emissiveIntensity: 0.55,
    }),
    checkTile: new THREE.MeshStandardMaterial({
      color: new THREE.Color("#ef4444"),
      roughness: 0.2,
      metalness: 0.35,
      emissive: new THREE.Color("#dc2626"),
      emissiveIntensity: 0.95,
    }),
    checkPiece: makeMat({
      color: "#fca5a5",
      roughness: 0.18,
      metalness: 0.25,
      clearcoat: 0.85,
      emissive: "#ef4444",
      emissiveIntensity: 0.65,
    }),
    plinthBase: makeMat({
      color: s3d.plinthBase,
      roughness: 0.28,
      metalness: 0.72,
      clearcoat: 0.45,
    }),
    plinthTrim: makeMat({
      color: s3d.plinthTrim,
      roughness: 0.24,
      metalness: 0.85,
      clearcoat: 0.35,
      emissive: s3d.plinthTrim,
      emissiveIntensity: 0.18,
    }),
    plinthGrout: new THREE.MeshStandardMaterial({
      color: new THREE.Color(s3d.plinthGrout),
      roughness: 0.5,
      metalness: 0.35,
    }),
  };
}

// ── Sculpted Staunton 3D Piece Mesh ──────────────────────────────────────────

const MERLON_ANGLES = [0, 1, 2, 3, 4, 5].map((i) => (i / 6) * Math.PI * 2);
const QUEEN_PEARL_ANGLES = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i / 8) * Math.PI * 2);

const Piece3DModel = memo(function Piece3DModel({
  type,
  color,
  bodyMat,
  trimMat,
}: {
  type: PieceType;
  color: Color;
  bodyMat: THREE.Material;
  trimMat: THREE.Material;
}) {
  const geo = useMemo(() => getPieceGeometries(), []);
  const isWhite = color === "WHITE";

  switch (type) {
    case "PAWN":
      return (
        <group>
          <mesh geometry={geo.pawnBody} material={bodyMat} castShadow receiveShadow />
          <mesh geometry={geo.pawnTrim} material={trimMat} castShadow />
        </group>
      );

    case "ROOK":
      return (
        <group>
          <mesh geometry={geo.rookBody} material={bodyMat} castShadow receiveShadow />
          <mesh geometry={geo.rookTrim} material={trimMat} castShadow />
          {MERLON_ANGLES.map((angle, idx) => (
            <mesh
              key={idx}
              geometry={geo.rookMerlon}
              material={bodyMat}
              position={[Math.cos(angle) * 0.228, 1.0, Math.sin(angle) * 0.228]}
              rotation={[0, -angle, 0]}
              castShadow
              receiveShadow
            />
          ))}
        </group>
      );

    case "KNIGHT":
      return (
        <group rotation={[0, isWhite ? 0 : Math.PI, 0]}>
          <mesh geometry={geo.knightBase} material={bodyMat} castShadow receiveShadow />
          <mesh geometry={geo.knightHead} material={bodyMat} castShadow receiveShadow />
          <mesh geometry={geo.knightMane} material={trimMat} castShadow />
          <mesh geometry={geo.knightTrim} material={trimMat} castShadow />
        </group>
      );

    case "BISHOP":
      return (
        <group>
          <mesh geometry={geo.bishopBody} material={bodyMat} castShadow receiveShadow />
          <mesh geometry={geo.bishopTrim} material={trimMat} castShadow />
          <mesh
            geometry={geo.bishopFinial}
            material={trimMat}
            position={[0, 1.225, 0]}
            castShadow
          />
        </group>
      );

    case "QUEEN":
      return (
        <group>
          <mesh geometry={geo.queenBody} material={bodyMat} castShadow receiveShadow />
          <mesh geometry={geo.queenTrim} material={trimMat} castShadow />
          {QUEEN_PEARL_ANGLES.map((angle, idx) => (
            <mesh
              key={idx}
              geometry={geo.queenPearl}
              material={trimMat}
              position={[Math.cos(angle) * 0.25, 1.265, Math.sin(angle) * 0.25]}
              castShadow
            />
          ))}
          <mesh
            geometry={geo.queenFinial}
            material={trimMat}
            position={[0, 1.40, 0]}
            castShadow
          />
        </group>
      );

    case "KING":
      return (
        <group>
          <mesh geometry={geo.kingBody} material={bodyMat} castShadow receiveShadow />
          <mesh geometry={geo.kingTrim} material={trimMat} castShadow />
          <mesh geometry={geo.kingCross} material={trimMat} castShadow />
        </group>
      );

    default:
      return null;
  }
});

// ── Smooth Animated Piece Wrapper ────────────────────────────────────────────

function AnimatedPiece({
  pieceId,
  row,
  col,
  type,
  color,
  isSelected,
  isInCheck,
  isMovable,
  isDragging,
  materials,
  selectColor,
  dragRuntimeRef,
  justDraggedAtRef,
  onPiecePointerDown,
  onSquareClick,
}: {
  pieceId: string;
  row: number;
  col: number;
  type: PieceType;
  color: Color;
  isSelected: boolean;
  isInCheck: boolean;
  isMovable: boolean;
  isDragging: boolean;
  materials: ThemeMaterials;
  selectColor: string;
  dragRuntimeRef: React.RefObject<DragRuntimeState | null>;
  justDraggedAtRef: React.RefObject<number>;
  onPiecePointerDown: (e: ThreeEvent<PointerEvent>, pieceId: string, sq: Square) => void;
  onSquareClick: (sq: Square) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const targetX = col - 3.5;
  const targetZ = row - 3.5;
  const [mountPos] = useState<[number, number, number]>(() => [targetX, 0.08, targetZ]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  // Store animation endpoints purely in refs (updated in effect, sampled in useFrame)
  const animRef = useRef({
    x: targetX,
    z: targetZ,
    fromX: targetX,
    fromY: 0.08,
    fromZ: targetZ,
    toX: targetX,
    toZ: targetZ,
    progress: 1,
    duration: 0.34,
    arcHeight: 0.28,
    initialized: false,
  });

  useEffect(() => {
    const a = animRef.current;
    if (!a.initialized) {
      a.x = targetX;
      a.z = targetZ;
      a.fromX = targetX;
      a.fromY = 0.08;
      a.fromZ = targetZ;
      a.toX = targetX;
      a.toZ = targetZ;
      a.progress = 1;
      a.initialized = true;
      return;
    }

    if (Math.abs(a.toX - targetX) > 0.01 || Math.abs(a.toZ - targetZ) > 0.01) {
      const dist = Math.hypot(targetX - a.x, targetZ - a.z);
      const dx = Math.abs(targetX - a.x);
      const dz = Math.abs(targetZ - a.z);
      const isKnightHop =
        type === "KNIGHT" &&
        ((Math.abs(dx - 2) < 0.2 && Math.abs(dz - 1) < 0.2) ||
          (Math.abs(dx - 1) < 0.2 && Math.abs(dz - 2) < 0.2));
      const curY = groupRef.current?.position.y ?? 0.08;
      const isShortDrop = dist < 0.45 && curY > 0.2;

      a.fromX = a.x;
      a.fromY = curY;
      a.fromZ = a.z;
      a.toX = targetX;
      a.toZ = targetZ;
      a.progress = 0;
      a.duration = isShortDrop ? 0.14 : Math.min(0.42, 0.24 + dist * 0.032);
      a.arcHeight = isShortDrop ? 0 : isKnightHop ? 1.15 : 0.28;
    }
  }, [targetX, targetZ, type]);

  useFrame(({ clock }, delta) => {
    const grp = groupRef.current;
    if (!grp) return;

    const a = animRef.current;
    const drag = dragRuntimeRef.current;
    const activeDragged = Boolean(drag && drag.active && drag.pieceId === pieceId);

    if (activeDragged && drag) {
      const prevX = grp.position.x;
      const prevZ = grp.position.z;
      grp.position.x = THREE.MathUtils.lerp(prevX, drag.worldX, Math.min(1, delta * 24));
      grp.position.z = THREE.MathUtils.lerp(prevZ, drag.worldZ, Math.min(1, delta * 24));
      grp.position.y = THREE.MathUtils.lerp(grp.position.y, 0.58, Math.min(1, delta * 18));

      const vx = grp.position.x - prevX;
      const vz = grp.position.z - prevZ;
      grp.rotation.z = THREE.MathUtils.lerp(grp.rotation.z, THREE.MathUtils.clamp(-vx * 1.4, -0.25, 0.25), 0.25);
      grp.rotation.x = THREE.MathUtils.lerp(grp.rotation.x, THREE.MathUtils.clamp(vz * 1.4, -0.25, 0.25), 0.25);

      a.x = grp.position.x;
      a.z = grp.position.z;
      return;
    }

    if (a.progress < 1) {
      a.progress = Math.min(1, a.progress + delta / a.duration);
      const t = a.progress;
      const eased = 1 - Math.pow(1 - t, 3);
      a.x = THREE.MathUtils.lerp(a.fromX, a.toX, eased);
      a.z = THREE.MathUtils.lerp(a.fromZ, a.toZ, eased);

      grp.position.x = a.x;
      grp.position.z = a.z;
      grp.position.y =
        THREE.MathUtils.lerp(a.fromY, 0.08, eased) + Math.sin(t * Math.PI) * a.arcHeight;

      const moveDx = a.toX - a.fromX;
      const moveDz = a.toZ - a.fromZ;
      const len = Math.hypot(moveDx, moveDz) || 1;
      const lean = Math.sin(t * Math.PI) * 0.14;
      grp.rotation.z = -(moveDx / len) * lean;
      grp.rotation.x = (moveDz / len) * lean;
    } else {
      a.x = a.toX;
      a.z = a.toZ;
      grp.position.x = a.toX;
      grp.position.z = a.toZ;

      const desiredY = isSelected
        ? 0.34 + Math.sin(clock.getElapsedTime() * 4.5) * 0.045
        : hovered && isMovable
          ? 0.15
          : 0.08;

      grp.position.y = THREE.MathUtils.lerp(grp.position.y, desiredY, Math.min(1, delta * 14));
      grp.rotation.x = THREE.MathUtils.lerp(grp.rotation.x, 0, Math.min(1, delta * 12));
      grp.rotation.z = THREE.MathUtils.lerp(grp.rotation.z, 0, Math.min(1, delta * 12));
    }
  });

  const bodyMat = isSelected
    ? materials.selectedPiece
    : isInCheck
      ? materials.checkPiece
      : color === "WHITE"
        ? materials.whitePiece
        : materials.blackPiece;

  return (
    <group
      ref={groupRef}
      position={mountPos}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (isMovable) {
          setHovered(true);
          if (!dragRuntimeRef.current?.active) {
            document.body.style.cursor = "pointer";
          }
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        if (!dragRuntimeRef.current?.active) {
          document.body.style.cursor = "auto";
        }
      }}
      onPointerDown={(e) => {
        if (e.button !== 0 || !isMovable) return;
        e.stopPropagation();
        onPiecePointerDown(e, pieceId, { row, col });
      }}
      onClick={(e) => {
        if (e.delta > 6) return;
        if (performance.now() - justDraggedAtRef.current < 140) return;
        e.stopPropagation();
        onSquareClick({ row, col });
      }}
    >
      <Piece3DModel
        type={type}
        color={color}
        bodyMat={bodyMat}
        trimMat={materials.trimMetal}
      />

      {/* Holographic ring halo under selected/dragged piece */}
      {(isSelected || isDragging) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.36, 0.44, 32]} />
          <meshBasicMaterial color={selectColor} transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ── Check Arcane Pulsing Halo ────────────────────────────────────────────────

function CheckArcaneHalo({ square }: { square: Square }) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (outerRef.current) outerRef.current.rotation.z = t * 1.1;
    if (innerRef.current) innerRef.current.rotation.z = -t * 1.6;
    if (lightRef.current) {
      lightRef.current.intensity = 1.4 + Math.sin(t * 5) * 0.55;
    }
  });

  const x = square.col - 3.5;
  const z = square.row - 3.5;

  return (
    <group position={[x, 0.092, z]}>
      <pointLight ref={lightRef} position={[0, 0.9, 0]} color="#ff2a4b" distance={3.2} intensity={1.5} />
      <mesh ref={outerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.45, 24]} />
        <meshBasicMaterial color="#ff3b5c" transparent opacity={0.88} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={innerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.31, 6]} />
        <meshBasicMaterial color="#fca5a5" transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Capture Impact Burst Effect ──────────────────────────────────────────────

function CaptureBurst3D({
  moveAnim,
  accentColor,
}: {
  moveAnim: MoveAnimationMeta | null;
  accentColor: string;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const animRef = useRef({ active: false, age: 0, seq: -1 });

  const bokehTex = useMemo(() => getBokehTexture(), []);

  const sparkVectors = useMemo(() => {
    const rand = mulberry32(7711);
    const count = 24;
    const dirs = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.25;
      const spd = 1.2 + rand() * 1.8;
      dirs[i * 3] = Math.cos(a) * spd;
      dirs[i * 3 + 1] = 1.2 + rand() * 1.9;
      dirs[i * 3 + 2] = Math.sin(a) * spd;
    }
    return { count, dirs };
  }, []);

  const sparkPositions = useMemo(() => new Float32Array(sparkVectors.count * 3), [sparkVectors.count]);

  useEffect(() => {
    if (moveAnim && moveAnim.isCapture && moveAnim.seq !== animRef.current.seq) {
      sparkPositions.fill(0);
      animRef.current = { active: true, age: 0, seq: moveAnim.seq };
    }
  }, [moveAnim, sparkPositions]);

  useFrame((_, delta) => {
    const state = animRef.current;
    if (!state.active) return;

    state.age += delta;
    const life = 0.55;
    const t = Math.min(1, state.age / life);

    if (ringRef.current) {
      const s = 0.25 + t * 1.55;
      ringRef.current.scale.set(s, s, 1);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * 0.9;
    }

    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes
        .position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < sparkVectors.count; i++) {
        const vx = sparkVectors.dirs[i * 3];
        const vy = sparkVectors.dirs[i * 3 + 1];
        const vz = sparkVectors.dirs[i * 3 + 2];
        arr[i * 3] = vx * state.age * 0.85;
        arr[i * 3 + 1] = Math.max(0.02, vy * state.age - 3.6 * state.age * state.age);
        arr[i * 3 + 2] = vz * state.age * 0.85;
      }
      posAttr.needsUpdate = true;
      const pMat = pointsRef.current.material as THREE.PointsMaterial;
      pMat.opacity = (1 - t) * 0.95;
    }

    if (t >= 1) {
      state.active = false;
    }
  });

  if (!moveAnim?.isCapture) return null;

  const x = moveAnim.move.to.col - 3.5;
  const z = moveAnim.move.to.row - 3.5;

  return (
    <group key={`burst-${moveAnim.seq}`} position={[x, 0.1, z]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.38, 32]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.9} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={bokehTex}
          color={accentColor}
          size={0.22}
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

// ── Golden 3D Hint Trajectory Arc ────────────────────────────────────────────

function HintArc3D({
  hintMove,
  hintColor,
}: {
  hintMove: Move | null;
  hintColor: string;
}) {
  const tubeGeo = useMemo(() => {
    if (!hintMove) return null;
    const x1 = hintMove.from.col - 3.5;
    const z1 = hintMove.from.row - 3.5;
    const x2 = hintMove.to.col - 3.5;
    const z2 = hintMove.to.row - 3.5;
    const dist = Math.hypot(x2 - x1, z2 - z1);
    const midY = 1.05 + dist * 0.22;

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(x1, 0.45, z1),
      new THREE.Vector3((x1 + x2) / 2, midY, (z1 + z2) / 2),
      new THREE.Vector3(x2, 0.28, z2)
    );
    return new THREE.TubeGeometry(curve, 28, 0.048, 8, false);
  }, [hintMove]);

  useEffect(() => {
    return () => {
      tubeGeo?.dispose();
    };
  }, [tubeGeo]);

  if (!hintMove || !tubeGeo) return null;

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          color={hintColor}
          emissive={hintColor}
          emissiveIntensity={1.15}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh
        position={[hintMove.from.col - 3.5, 0.095, hintMove.from.row - 3.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.32, 0.42, 32]} />
        <meshBasicMaterial color={hintColor} transparent opacity={0.88} depthWrite={false} />
      </mesh>
      <mesh
        position={[hintMove.to.col - 3.5, 0.095, hintMove.to.row - 3.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.25, 0.42, 32]} />
        <meshBasicMaterial color={hintColor} transparent opacity={0.92} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ── Sculpted Architectural Board & Plinth ────────────────────────────────────

function BoardArena({
  board,
  flipped,
  selected,
  validMoves,
  lastMove,
  checkSquare,
  hoveredSquare,
  dragHoverSquare,
  canInteract,
  theme,
  materials,
  showCoordinates,
  justDraggedAtRef,
  onSquareHover,
  onSquareClick,
}: {
  board: Board;
  flipped: boolean;
  selected: Square | null;
  validMoves: Move[];
  lastMove: Move | null;
  checkSquare: Square | null;
  hoveredSquare: Square | null;
  dragHoverSquare: Square | null;
  canInteract: boolean;
  theme: ChessTheme;
  materials: ThemeMaterials;
  showCoordinates: boolean;
  justDraggedAtRef: React.RefObject<number>;
  onSquareHover: React.Dispatch<React.SetStateAction<Square | null>>;
  onSquareClick: (sq: Square) => void;
}) {
  const tex = useMemo(() => getThemeTextureBundle(theme), [theme]);
  const boardGeo = useMemo(() => getSharedBoardGeometries(), []);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.08;
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 0.055;
  });

  const s3d = theme.scene3d;
  const filesTex = flipped ? tex.filesBlack : tex.filesWhite;
  const ranksTex = flipped ? tex.ranksBlack : tex.ranksWhite;
  const labelRotZ = flipped ? Math.PI : 0;

  return (
    <group>
      {/* Subtle orbital astrolabe rings underneath the floating board */}
      <mesh ref={ring1Ref} position={[0, -0.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6.15, 0.025, 10, 72]} />
        <meshStandardMaterial
          color={s3d.astrolabeRingColor}
          emissive={s3d.astrolabeRingColor}
          emissiveIntensity={0.65}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh ref={ring2Ref} position={[0, -0.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6.85, 0.018, 10, 84]} />
        <meshStandardMaterial
          color={s3d.astrolabeAccentColor}
          emissive={s3d.astrolabeAccentColor}
          emissiveIntensity={0.55}
          transparent
          opacity={0.28}
        />
      </mesh>

      {/* Beveled Architectural Outer Plinth Base */}
      <RoundedBox
        args={[9.2, 0.36, 9.2]}
        radius={0.08}
        smoothness={4}
        position={[0, -0.22, 0]}
        material={materials.plinthBase}
        receiveShadow
        castShadow
      />

      {/* Metallic Mid Bevel Trim */}
      <RoundedBox
        args={[8.9, 0.1, 8.9]}
        radius={0.04}
        smoothness={3}
        position={[0, -0.02, 0]}
        material={materials.plinthTrim}
        receiveShadow
      />

      {/* Recessed Grout Plate beneath tiles */}
      <mesh position={[0, 0.005, 0]} material={materials.plinthGrout} receiveShadow>
        <boxGeometry args={[8.06, 0.05, 8.06]} />
      </mesh>

      {/* Four Corner Metallic Clasps */}
      {[
        [-4.24, -4.24],
        [4.24, -4.24],
        [-4.24, 4.24],
        [4.24, 4.24],
      ].map(([cx, cz], idx) => (
        <mesh
          key={idx}
          geometry={boardGeo.claspGeo}
          position={[cx, 0.03, cz]}
          material={materials.trimMetal}
          castShadow
        />
      ))}

      {/* Engraved Coordinate Strips */}
      {showCoordinates && (
        <group>
          <mesh position={[0, 0.036, 4.2]} rotation={[-Math.PI / 2, 0, labelRotZ]}>
            <planeGeometry args={[8.0, 0.34]} />
            <meshStandardMaterial map={filesTex} roughness={0.35} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.036, -4.2]} rotation={[-Math.PI / 2, 0, labelRotZ]}>
            <planeGeometry args={[8.0, 0.34]} />
            <meshStandardMaterial map={filesTex} roughness={0.35} metalness={0.25} />
          </mesh>
          <mesh position={[-4.2, 0.036, 0]} rotation={[-Math.PI / 2, 0, labelRotZ]}>
            <planeGeometry args={[0.34, 8.0]} />
            <meshStandardMaterial map={ranksTex} roughness={0.35} metalness={0.25} />
          </mesh>
          <mesh position={[4.2, 0.036, 0]} rotation={[-Math.PI / 2, 0, labelRotZ]}>
            <planeGeometry args={[0.34, 8.0]} />
            <meshStandardMaterial map={ranksTex} roughness={0.35} metalness={0.25} />
          </mesh>
        </group>
      )}

      {/* 64 Individual Beveled Squares */}
      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, c) => {
          const isLight = (r + c) % 2 === 0;
          const isSelected = selected?.row === r && selected?.col === c;
          const matchingMove = validMoves.find((m) => m.to.row === r && m.to.col === c);
          const isValidDest = !!matchingMove;
          const isCaptureDest =
            isValidDest && (!!board[r][c] || !!matchingMove?.enPassantCapture);
          const isCastleDest = isValidDest && !!matchingMove?.castlingRook;
          const isLastFrom = lastMove?.from.row === r && lastMove?.from.col === c;
          const isLastTo = lastMove?.to.row === r && lastMove?.to.col === c;
          const isCheck = checkSquare?.row === r && checkSquare?.col === c;
          const isHover =
            (hoveredSquare?.row === r && hoveredSquare?.col === c) ||
            (dragHoverSquare?.row === r && dragHoverSquare?.col === c);

          const sqX = c - 3.5;
          const sqZ = r - 3.5;

          let tileMat = isLight ? materials.lightTile : materials.darkTile;
          if (isSelected) tileMat = materials.selectedTile;
          else if (isCheck) tileMat = materials.checkTile;

          return (
            <group key={`${r}-${c}`} position={[sqX, 0.04, sqZ]}>
              <mesh
                geometry={boardGeo.tileGeo}
                material={tileMat}
                receiveShadow
                onPointerOver={(e) => {
                  if (!canInteract) return;
                  e.stopPropagation();
                  onSquareHover({ row: r, col: c });
                }}
                onPointerOut={() => {
                  onSquareHover((prev) =>
                    prev && prev.row === r && prev.col === c ? null : prev
                  );
                }}
                onClick={(e) => {
                  if (e.delta > 6) return;
                  if (performance.now() - justDraggedAtRef.current < 140) return;
                  e.stopPropagation();
                  onSquareClick({ row: r, col: c });
                }}
              />

              {/* Last move luminous tint */}
              {(isLastFrom || isLastTo) && !isSelected && !isCheck && (
                <mesh
                  geometry={boardGeo.lastMovePlaneGeo}
                  position={[0, 0.043, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <meshBasicMaterial
                    color={isLastTo ? s3d.lastMoveToColor : s3d.lastMoveFromColor}
                    transparent
                    opacity={isLastTo ? 0.34 : 0.2}
                    depthWrite={false}
                  />
                </mesh>
              )}

              {/* Subtle pointer hover border */}
              {isHover && (
                <mesh
                  geometry={boardGeo.ringHoverGeo}
                  position={[0, 0.045, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                >
                  <meshBasicMaterial
                    color={isValidDest ? s3d.selectColor : "#ffffff"}
                    transparent
                    opacity={isValidDest ? 0.72 : 0.32}
                    depthWrite={false}
                  />
                </mesh>
              )}

              {/* Valid Destination Markers */}
              {isValidDest && (
                <group position={[0, 0.048, 0]}>
                  {isCaptureDest ? (
                    <mesh geometry={boardGeo.ringCaptureGeo} rotation={[-Math.PI / 2, 0, 0]}>
                      <meshBasicMaterial color={s3d.selectColor} transparent opacity={0.85} depthWrite={false} />
                    </mesh>
                  ) : isCastleDest ? (
                    <mesh geometry={boardGeo.ringCastleGeo} rotation={[-Math.PI / 2, 0, 0]}>
                      <meshBasicMaterial color={s3d.selectColor} transparent opacity={0.85} depthWrite={false} />
                    </mesh>
                  ) : (
                    <mesh geometry={boardGeo.validDotGeo} position={[0, 0.055, 0]}>
                      <meshStandardMaterial
                        color={s3d.selectColor}
                        emissive={s3d.selectColor}
                        emissiveIntensity={1.15}
                        transparent
                        opacity={0.9}
                      />
                    </mesh>
                  )}
                </group>
              )}
            </group>
          );
        })
      )}
    </group>
  );
}

// ── Deterministic Bokeh Stardust Particles ───────────────────────────────────

function CelestialStardust({
  theme,
  quality,
}: {
  theme: ChessTheme;
  quality: GraphicsQuality;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const bokehTex = useMemo(() => getBokehTexture(), []);
  const count = quality === "lite" ? 55 : quality === "ultra" ? 180 : 120;

  const { positions, colors } = useMemo(() => {
    const rand = mulberry32(4242 + count);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = theme.scene3d.stardustColors.map((hex) => new THREE.Color(hex));

    for (let i = 0; i < count; i++) {
      const radius = 6.2 + rand() * 8.5;
      const theta = rand() * Math.PI * 2;
      const y = (rand() - 0.3) * 6.5;

      pos[i * 3] = Math.cos(theta) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * radius;

      const c = palette[i % palette.length];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [count, theme.scene3d.stardustColors]);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.025;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry key={`${theme.id}-${count}`}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={bokehTex}
        size={0.2}
        vertexColors
        transparent
        opacity={0.72}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// ── Smooth Interpolated Camera Controller ────────────────────────────────────

function getCameraTargetPos(
  preset: CameraPreset,
  effectiveFlipped: boolean
): THREE.Vector3 {
  const sign = effectiveFlipped ? -1 : 1;

  switch (preset) {
    case "hero":
      return new THREE.Vector3(sign * 3.4, 6.2, sign * 8.2);
    case "top":
      return new THREE.Vector3(0, 11.4, sign * 0.12);
    case "flank":
      return new THREE.Vector3(sign * 9.4, 6.8, 0);
    case "classic":
    default:
      return new THREE.Vector3(0, 8.6, sign * 8.4);
  }
}

function CameraManager({
  preset,
  resetNonce,
  flipped,
  currentTurn,
  autoFollowTurn,
  controlsRef,
}: {
  preset: CameraPreset;
  resetNonce: number;
  flipped: boolean;
  currentTurn?: Color;
  autoFollowTurn: boolean;
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
}) {
  const { camera } = useThree();
  const goalPosRef = useRef(new THREE.Vector3(0, 8.6, 8.4));
  const goalTargetRef = useRef(new THREE.Vector3(0, 0.25, 0));
  const animatingRef = useRef(false);
  const effectiveFlipped = autoFollowTurn && currentTurn ? currentTurn === "BLACK" : flipped;

  useEffect(() => {
    goalPosRef.current.copy(getCameraTargetPos(preset, effectiveFlipped));
    goalTargetRef.current.set(0, 0.25, 0);
    animatingRef.current = true;
  }, [preset, resetNonce, effectiveFlipped]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancelOnUserOrbit = () => {
      animatingRef.current = false;
    };
    controls.addEventListener("start", cancelOnUserOrbit);
    return () => {
      controls.removeEventListener("start", cancelOnUserOrbit);
    };
  }, [controlsRef]);

  useFrame((_, delta) => {
    if (!animatingRef.current) return;
    const t = Math.min(1, delta * 6.5);
    camera.position.lerp(goalPosRef.current, t);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(goalTargetRef.current, t);
      controlsRef.current.update();
    }
    if (camera.position.distanceToSquared(goalPosRef.current) < 0.002) {
      camera.position.copy(goalPosRef.current);
      animatingRef.current = false;
    }
  });

  return null;
}

// ── Pointer Drag Raycast Controller Inside Canvas ────────────────────────────

const BOARD_DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.08);
const RAY_HIT_VEC = new THREE.Vector3();
const RAY_NDC_VEC = new THREE.Vector2();

function DragController({
  dragRuntimeRef,
  controlsRef,
  justDraggedAtRef,
  selected,
  onSquareClick,
  onDropPiece,
  onDraggingIdChange,
  onDragHoverSquareChange,
}: {
  dragRuntimeRef: React.RefObject<DragRuntimeState | null>;
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
  justDraggedAtRef: React.RefObject<number>;
  selected: Square | null;
  onSquareClick: (sq: Square) => void;
  onDropPiece?: (from: Square, to: Square) => void;
  onDraggingIdChange: (id: string | null) => void;
  onDragHoverSquareChange: (sq: Square | null) => void;
}) {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const lastHoverRef = useRef<Square | null>(null);
  const callbacksRef = useRef({
    selected,
    onSquareClick,
    onDropPiece,
    onDraggingIdChange,
    onDragHoverSquareChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      selected,
      onSquareClick,
      onDropPiece,
      onDraggingIdChange,
      onDragHoverSquareChange,
    };
  }, [selected, onSquareClick, onDropPiece, onDraggingIdChange, onDragHoverSquareChange]);

  useEffect(() => {
    const updateHover = (sq: Square | null) => {
      const prev = lastHoverRef.current;
      if (
        (prev === null && sq === null) ||
        (prev && sq && prev.row === sq.row && prev.col === sq.col)
      ) {
        return;
      }
      lastHoverRef.current = sq;
      callbacksRef.current.onDragHoverSquareChange(sq);
    };

    const projectClientToBoard = (clientX: number, clientY: number): Square | null => {
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      RAY_NDC_VEC.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(RAY_NDC_VEC, camera);
      const hit = raycaster.ray.intersectPlane(BOARD_DRAG_PLANE, RAY_HIT_VEC);
      if (!hit) return null;

      const drag = dragRuntimeRef.current;
      if (drag) {
        drag.worldX = THREE.MathUtils.clamp(hit.x, -4.1, 4.1);
        drag.worldZ = THREE.MathUtils.clamp(hit.z, -4.1, 4.1);
      }

      const col = Math.round(hit.x + 3.5);
      const row = Math.round(hit.z + 3.5);
      if (row < 0 || row > 7 || col < 0 || col > 7) return null;
      return { row, col };
    };

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRuntimeRef.current;
      if (!drag) return;

      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
      if (!drag.active && dist >= 6) {
        drag.active = true;
        callbacksRef.current.onDraggingIdChange(drag.pieceId);
        document.body.style.cursor = "grabbing";
        const curSelected = callbacksRef.current.selected;
        if (!curSelected || curSelected.row !== drag.from.row || curSelected.col !== drag.from.col) {
          callbacksRef.current.onSquareClick(drag.from);
        }
      }

      if (drag.active) {
        const sq = projectClientToBoard(e.clientX, e.clientY);
        updateHover(sq);
      }
    };

    const finishDrag = (e?: PointerEvent) => {
      const drag = dragRuntimeRef.current;
      if (!drag) return;

      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }

      const wasActive = drag.active;
      const fromSq = drag.from;
      dragRuntimeRef.current = null;
      callbacksRef.current.onDraggingIdChange(null);
      updateHover(null);
      document.body.style.cursor = "auto";

      if (wasActive && e) {
        justDraggedAtRef.current = performance.now();
        const targetSq = projectClientToBoard(e.clientX, e.clientY);
        if (
          targetSq &&
          (targetSq.row !== fromSq.row || targetSq.col !== fromSq.col)
        ) {
          if (callbacksRef.current.onDropPiece) callbacksRef.current.onDropPiece(fromSq, targetSq);
          else callbacksRef.current.onSquareClick(targetSq);
        }
      }
    };

    const onWindowBlur = () => finishDrag();

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [camera, gl, raycaster, dragRuntimeRef, controlsRef, justDraggedAtRef]);

  return null;
}

// ── Main 3D Chess Board Component ────────────────────────────────────────────

export const ChessBoard3D = memo(function ChessBoard3D({
  board,
  flipped = false,
  selected,
  validMoves,
  lastMove,
  checkSquare,
  currentTurn,
  onSquareClick,
  onDropPiece,
  disabled = false,
  themeId = "celestial",
  quality = "balanced",
  showCoordinates = true,
  hintMove = null,
  moveAnim = null,
  interactive = true,
  autoFollowTurn = false,
}: Props) {
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("classic");
  const [resetNonce, setResetNonce] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [draggingPieceId, setDraggingPieceId] = useState<string | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);
  const [dragHoverSquare, setDragHoverSquare] = useState<Square | null>(null);

  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const dragRuntimeRef = useRef<DragRuntimeState | null>(null);
  const justDraggedAtRef = useRef<number>(0);

  const theme = CHESS_THEMES[themeId] ?? CHESS_THEMES.celestial;
  const canInteract = interactive && !disabled;

  const materials = useMemo(
    () => buildThemeMaterials(theme, quality),
    [theme, quality]
  );

  useEffect(() => {
    return () => {
      Object.values(materials).forEach((m) => m.dispose());
    };
  }, [materials]);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const initialPos = useMemo<[number, number, number]>(() => {
    const sign = flipped ? -1 : 1;
    return [0, 8.6, sign * 8.4];
  }, [flipped]);

  const handlePiecePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>, pieceId: string, sq: Square) => {
      if (!canInteract) return;
      dragRuntimeRef.current = {
        active: false,
        pieceId,
        from: sq,
        startX: e.nativeEvent.clientX,
        startY: e.nativeEvent.clientY,
        worldX: sq.col - 3.5,
        worldZ: sq.row - 3.5,
      };
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    },
    [canInteract]
  );

  const handleBoardClick = useCallback(
    (sq: Square) => {
      if (!canInteract) return;
      onSquareClick(sq);
    },
    [canInteract, onSquareClick]
  );

  const lighting = theme.scene3d.lighting;
  const dpr: [number, number] =
    quality === "ultra" ? [1, 2] : quality === "balanced" ? [1, 1.5] : [1, 1];

  return (
    <div
      data-cursor={hoveredSquare || draggingPieceId ? "interactive" : undefined}
      className={`relative w-full rounded-2xl overflow-hidden shadow-2xl transition-opacity duration-300 select-none ${disabled ? "opacity-85" : ""
        }`}
      style={{
        aspectRatio: "1 / 1",
        border: `1.5px solid ${theme.board2d.frameBorder}`,
        background: theme.scene3d.backdropGradient,
        boxShadow: theme.board2d.frameGlow,
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: initialPos, fov: 44, near: 0.2, far: 60 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.14,
        }}
        shadows={quality === "lite" ? SHADOWS_DISABLED : "percentage"}
        style={{ width: "100%", height: "100%" }}
      >
        <SceneEnvironment quality={quality} />

        {/* Three-point studio + celestial lighting */}
        <ambientLight
          color={lighting.ambientColor}
          intensity={lighting.ambientIntensity}
        />
        <hemisphereLight
          args={[lighting.hemiSky, lighting.hemiGround, lighting.hemiIntensity]}
        />
        <directionalLight
          position={[6, 13, 6]}
          intensity={lighting.keyIntensity}
          color={lighting.keyColor}
          castShadow={quality !== "lite"}
          shadow-mapSize={quality === "ultra" ? [2048, 2048] : [1024, 1024]}
          shadow-camera-near={2}
          shadow-camera-far={28}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
        />
        <pointLight
          position={[-7, 6.5, -5.5]}
          intensity={lighting.rimCoolIntensity}
          color={lighting.rimCoolColor}
        />
        <pointLight
          position={[7, 5.5, 4.5]}
          intensity={lighting.rimWarmIntensity}
          color={lighting.rimWarmColor}
        />

        <CameraManager
          preset={cameraPreset}
          resetNonce={resetNonce}
          flipped={flipped}
          currentTurn={currentTurn}
          autoFollowTurn={autoFollowTurn}
          controlsRef={controlsRef}
        />

        <DragController
          dragRuntimeRef={dragRuntimeRef}
          controlsRef={controlsRef}
          justDraggedAtRef={justDraggedAtRef}
          selected={selected}
          onSquareClick={handleBoardClick}
          onDropPiece={onDropPiece}
          onDraggingIdChange={setDraggingPieceId}
          onDragHoverSquareChange={setDragHoverSquare}
        />

        <Suspense fallback={null}>
          <CelestialStardust theme={theme} quality={quality} />

          <BoardArena
            board={board}
            flipped={flipped}
            selected={selected}
            validMoves={validMoves}
            lastMove={lastMove}
            checkSquare={checkSquare}
            hoveredSquare={canInteract ? hoveredSquare : null}
            dragHoverSquare={dragHoverSquare}
            canInteract={canInteract}
            theme={theme}
            materials={materials}
            showCoordinates={showCoordinates}
            justDraggedAtRef={justDraggedAtRef}
            onSquareHover={setHoveredSquare}
            onSquareClick={handleBoardClick}
          />

          {/* Check arcane ring */}
          {checkSquare && <CheckArcaneHalo square={checkSquare} />}

          {/* Capture spark burst */}
          <CaptureBurst3D
            moveAnim={moveAnim}
            accentColor={theme.scene3d.selectColor}
          />

          {/* Golden tactical hint arc */}
          <HintArc3D
            hintMove={hintMove}
            hintColor={theme.scene3d.hintColor}
          />

          {/* 3D Sculpted Staunton Pieces (keyed by stable piece.id for smooth glide) */}
          {board.map((rowArr, r) =>
            rowArr.map((piece, c) => {
              if (!piece) return null;
              const isSelected = selected?.row === r && selected?.col === c;
              const isCheck = checkSquare?.row === r && checkSquare?.col === c;
              const isMovable =
                canInteract && (!currentTurn || piece.color === currentTurn);

              return (
                <AnimatedPiece
                  key={piece.id}
                  pieceId={piece.id}
                  row={r}
                  col={c}
                  type={piece.type}
                  color={piece.color}
                  isSelected={isSelected}
                  isInCheck={isCheck}
                  isMovable={isMovable}
                  isDragging={draggingPieceId === piece.id}
                  materials={materials}
                  selectColor={theme.scene3d.selectColor}
                  dragRuntimeRef={dragRuntimeRef}
                  justDraggedAtRef={justDraggedAtRef}
                  onPiecePointerDown={handlePiecePointerDown}
                  onSquareClick={handleBoardClick}
                />
              );
            })
          )}
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={5.2}
          maxDistance={15.5}
          maxPolarAngle={Math.PI / 2 - 0.08}
          minPolarAngle={0.08}
          dampingFactor={0.07}
          enableDamping
          autoRotate={autoRotate}
          autoRotateSpeed={0.75}
        />
      </Canvas>

      {/* Top-Left Theme Badge */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/15 shadow-lg pointer-events-none">
        <Sparkles size={13} className="text-cyan-300" />
        <span className="text-[11px] font-mono text-slate-100">{theme.name}</span>
      </div>

      {/* Top-Right Camera Angle Quick Presets */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-slate-950/75 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-lg">
        {(
          [
            { id: "classic", label: "Classic" },
            { id: "hero", label: "Hero" },
            { id: "top", label: "Top" },
            { id: "flank", label: "Flank" },
          ] as { id: CameraPreset; label: string }[]
        ).map((cam) => (
          <button
            key={cam.id}
            type="button"
            onClick={() => {
              setCameraPreset(cam.id);
              setResetNonce((n) => n + 1);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${cameraPreset === cam.id
              ? "bg-violet-500/45 text-white border border-violet-300/60"
              : "text-slate-300 hover:text-white border border-transparent"
              }`}
            title={`${cam.label} camera view`}
          >
            {cam.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setResetNonce((n) => n + 1)}
          className="p-1 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
          title="Recenter camera"
          aria-label="Recenter camera"
        >
          <RotateCcw size={13} />
        </button>

        <button
          type="button"
          onClick={() => setAutoRotate((r) => !r)}
          className={`p-1 rounded-lg text-xs transition-all cursor-pointer ${autoRotate
            ? "bg-cyan-500/40 text-cyan-200 border border-cyan-400/50"
            : "text-slate-300 hover:text-white border border-transparent"
            }`}
          title={autoRotate ? "Pause orbit rotation" : "Auto-rotate view"}
          aria-label={autoRotate ? "Pause orbit rotation" : "Auto-rotate view"}
        >
          <RotateCw size={13} className={autoRotate ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Bottom Interactive Hint */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-slate-950/70 backdrop-blur-sm px-3 py-0.5 rounded-full border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
        <Compass size={11} className="text-cyan-300" />
        <span>Drag piece to move · Drag space to orbit · Scroll to zoom</span>
      </div>
    </div>
  );
});
