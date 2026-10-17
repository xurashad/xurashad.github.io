"use client";

import { useRef, useMemo, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RotateCw, Sparkles } from "lucide-react";
import type { Board, Move, Square, Color, PieceType } from "./lib/types";

interface Props {
  board: Board;
  flipped?: boolean;
  selected: Square | null;
  validMoves: Move[];
  lastMove: Move | null;
  checkSquare: Square | null;
  currentTurn?: Color;
  onSquareClick: (sq: Square) => void;
  disabled?: boolean;
}

// ── Materials ─────────────────────────────────────────────────────────────────

const WHITE_PIECE_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#fbf7ee"),
  metalness: 0.2,
  roughness: 0.18,
  emissive: new THREE.Color("#bda888"),
  emissiveIntensity: 0.18,
});

const BLACK_PIECE_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#180d2b"),
  metalness: 0.82,
  roughness: 0.22,
  emissive: new THREE.Color("#6b3ebd"),
  emissiveIntensity: 0.35,
});

const GOLD_TRIM_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#ffd166"),
  metalness: 0.9,
  roughness: 0.22,
  emissive: new THREE.Color("#b3861b"),
  emissiveIntensity: 0.35,
});

const CYAN_SELECTED_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#38bdf8"),
  metalness: 0.3,
  roughness: 0.1,
  emissive: new THREE.Color("#00f0ff"),
  emissiveIntensity: 0.95,
});

const CRIMSON_CHECK_MAT = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#ff2a4b"),
  metalness: 0.4,
  roughness: 0.15,
  emissive: new THREE.Color("#ff1744"),
  emissiveIntensity: 1.1,
});

// ── Piece Components (Staunton Celestial Procedural Geometries) ───────────────

function PieceBase({ material }: { material: THREE.Material }) {
  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.04, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.38, 0.08, 28]} />
      </mesh>
      {/* Step */}
      <mesh position={[0, 0.10, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.29, 0.33, 0.05, 28]} />
      </mesh>
      {/* Torus bead */}
      <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]} material={GOLD_TRIM_MAT}>
        <torusGeometry args={[0.30, 0.02, 12, 28]} />
      </mesh>
    </group>
  );
}

function Pawn3D({ material }: { material: THREE.Material }) {
  return (
    <group>
      <PieceBase material={material} />
      {/* Waist body */}
      <mesh position={[0, 0.33, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.27, 0.40, 24]} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 0.54, 0]} rotation={[Math.PI / 2, 0, 0]} material={GOLD_TRIM_MAT}>
        <torusGeometry args={[0.16, 0.02, 12, 24]} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.74, 0]} material={material} castShadow receiveShadow>
        <sphereGeometry args={[0.19, 24, 24]} />
      </mesh>
    </group>
  );
}

function Rook3D({ material }: { material: THREE.Material }) {
  return (
    <group>
      <PieceBase material={material} />
      {/* Tower body */}
      <mesh position={[0, 0.41, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.29, 0.56, 28]} />
      </mesh>
      {/* Capital collar */}
      <mesh position={[0, 0.72, 0]} material={GOLD_TRIM_MAT} castShadow receiveShadow>
        <cylinderGeometry args={[0.31, 0.26, 0.08, 28]} />
      </mesh>
      {/* Battlement ring */}
      <mesh position={[0, 0.85, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.31, 0.31, 0.18, 28]} />
      </mesh>
      {/* Crenellations (4 corner notches) */}
      {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.23, 0.97, Math.sin(angle) * 0.23]}
          material={material}
          castShadow
        >
          <boxGeometry args={[0.09, 0.09, 0.09]} />
        </mesh>
      ))}
    </group>
  );
}

function Knight3D({ material, isWhite }: { material: THREE.Material; isWhite: boolean }) {
  const faceAngle = isWhite ? 0 : Math.PI;

  return (
    <group rotation={[0, faceAngle, 0]}>
      <PieceBase material={material} />
      {/* Pedestal */}
      <mesh position={[0, 0.22, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.29, 0.16, 24]} />
      </mesh>
      {/* Arched Neck tilted forward */}
      <mesh
        position={[0, 0.48, -0.04]}
        rotation={[-0.32, 0, 0]}
        material={material}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.18, 0.44, 0.26]} />
      </mesh>
      {/* Horse Muzzle */}
      <mesh
        position={[0, 0.72, -0.14]}
        rotation={[0.38, 0, 0]}
        material={material}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.16, 0.20, 0.28]} />
      </mesh>
      {/* Mane crest */}
      <mesh position={[0, 0.60, 0.08]} rotation={[-0.30, 0, 0]} material={GOLD_TRIM_MAT}>
        <boxGeometry args={[0.06, 0.40, 0.10]} />
      </mesh>
      {/* Left Ear */}
      <mesh position={[-0.06, 0.88, -0.02]} rotation={[0.15, 0, -0.2]} material={material}>
        <coneGeometry args={[0.04, 0.12, 12]} />
      </mesh>
      {/* Right Ear */}
      <mesh position={[0.06, 0.88, -0.02]} rotation={[0.15, 0, 0.2]} material={material}>
        <coneGeometry args={[0.04, 0.12, 12]} />
      </mesh>
    </group>
  );
}

function Bishop3D({ material }: { material: THREE.Material }) {
  return (
    <group>
      <PieceBase material={material} />
      {/* Slender body */}
      <mesh position={[0, 0.46, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.27, 0.66, 24]} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 0.81, 0]} rotation={[Math.PI / 2, 0, 0]} material={GOLD_TRIM_MAT}>
        <torusGeometry args={[0.18, 0.025, 12, 24]} />
      </mesh>
      {/* Miter head */}
      <mesh
        position={[0, 1.05, 0]}
        scale={[0.9, 1.4, 0.9]}
        material={material}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.20, 24, 24]} />
      </mesh>
      {/* Finial sphere */}
      <mesh position={[0, 1.34, 0]} material={GOLD_TRIM_MAT} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
      </mesh>
    </group>
  );
}

function Queen3D({ material }: { material: THREE.Material }) {
  return (
    <group>
      <PieceBase material={material} />
      {/* Body */}
      <mesh position={[0, 0.54, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.29, 0.82, 28]} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 0.97, 0]} rotation={[Math.PI / 2, 0, 0]} material={GOLD_TRIM_MAT}>
        <torusGeometry args={[0.22, 0.03, 12, 28]} />
      </mesh>
      {/* Flared coronet */}
      <mesh position={[0, 1.15, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.27, 0.18, 0.24, 28]} />
      </mesh>
      {/* Coronet pearls */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.26, 1.28, Math.sin(a) * 0.26]}
            material={GOLD_TRIM_MAT}
          >
            <sphereGeometry args={[0.035, 12, 12]} />
          </mesh>
        );
      })}
      {/* Top Queen Pearl */}
      <mesh position={[0, 1.34, 0]} material={GOLD_TRIM_MAT} castShadow>
        <sphereGeometry args={[0.08, 16, 16]} />
      </mesh>
    </group>
  );
}

function King3D({ material }: { material: THREE.Material }) {
  return (
    <group>
      <PieceBase material={material} />
      {/* Body */}
      <mesh position={[0, 0.58, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.31, 0.92, 28]} />
      </mesh>
      {/* Imperial collar */}
      <mesh position={[0, 1.06, 0]} rotation={[Math.PI / 2, 0, 0]} material={GOLD_TRIM_MAT}>
        <torusGeometry args={[0.24, 0.035, 12, 28]} />
      </mesh>
      {/* Crown dome */}
      <mesh position={[0, 1.26, 0]} scale={[1, 0.85, 1]} material={material} castShadow receiveShadow>
        <sphereGeometry args={[0.23, 24, 24]} />
      </mesh>
      {/* Imperial Cross vertical bar */}
      <mesh position={[0, 1.54, 0]} material={GOLD_TRIM_MAT} castShadow>
        <boxGeometry args={[0.05, 0.22, 0.05]} />
      </mesh>
      {/* Imperial Cross horizontal bar */}
      <mesh position={[0, 1.57, 0]} material={GOLD_TRIM_MAT} castShadow>
        <boxGeometry args={[0.15, 0.05, 0.05]} />
      </mesh>
    </group>
  );
}

// ── Piece Dispatcher ─────────────────────────────────────────────────────────

function Piece3DModel({
  type,
  color,
  isSelected,
  isInCheck,
}: {
  type: PieceType;
  color: Color;
  isSelected: boolean;
  isInCheck: boolean;
}) {
  const isWhite = color === "WHITE";
  const material = isSelected
    ? CYAN_SELECTED_MAT
    : isInCheck
    ? CRIMSON_CHECK_MAT
    : isWhite
    ? WHITE_PIECE_MAT
    : BLACK_PIECE_MAT;

  switch (type) {
    case "PAWN":
      return <Pawn3D material={material} />;
    case "ROOK":
      return <Rook3D material={material} />;
    case "KNIGHT":
      return <Knight3D material={material} isWhite={isWhite} />;
    case "BISHOP":
      return <Bishop3D material={material} />;
    case "QUEEN":
      return <Queen3D material={material} />;
    case "KING":
      return <King3D material={material} />;
    default:
      return null;
  }
}

// ── Animated Piece Wrapper ───────────────────────────────────────────────────

function AnimatedPiece({
  row,
  col,
  type,
  color,
  isSelected,
  isInCheck,
}: {
  row: number;
  col: number;
  type: PieceType;
  color: Color;
  isSelected: boolean;
  isInCheck: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetX = (col - 3.5) * 1.0;
  const targetZ = (row - 3.5) * 1.0;

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (isSelected) {
      const hoverY = 0.32 + Math.sin(clock.getElapsedTime() * 5) * 0.04;
      groupRef.current.position.y = hoverY;
    } else {
      groupRef.current.position.y = 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[targetX, 0.08, targetZ]}>
      <Piece3DModel
        type={type}
        color={color}
        isSelected={isSelected}
        isInCheck={isInCheck}
      />
    </group>
  );
}

// ── Board Plinth and Interactive Squares ──────────────────────────────────────

function BoardSquaresAndPlinth({
  board,
  selected,
  validMoves,
  lastMove,
  checkSquare,
  onSquareClick,
}: {
  board: Board;
  selected: Square | null;
  validMoves: Move[];
  lastMove: Move | null;
  checkSquare: Square | null;
  onSquareClick: (sq: Square) => void;
}) {
  const lightMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#e8e0fa"),
        metalness: 0.15,
        roughness: 0.25,
        emissive: new THREE.Color("#4a3675"),
        emissiveIntensity: 0.12,
      }),
    []
  );

  const darkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#21133d"),
        metalness: 0.65,
        roughness: 0.35,
        emissive: new THREE.Color("#180c2e"),
        emissiveIntensity: 0.10,
      }),
    []
  );

  const plinthMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0c061a"),
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  );

  const plinthTrimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#8259d9"),
        metalness: 0.7,
        roughness: 0.3,
        emissive: new THREE.Color("#5b36a8"),
        emissiveIntensity: 0.3,
      }),
    []
  );

  return (
    <group>
      {/* Plinth Base */}
      <mesh position={[0, -0.22, 0]} material={plinthMat} receiveShadow>
        <boxGeometry args={[8.8, 0.38, 8.8]} />
      </mesh>
      {/* Plinth Upper Trim */}
      <mesh position={[0, -0.02, 0]} material={plinthTrimMat} receiveShadow>
        <boxGeometry args={[8.4, 0.08, 8.4]} />
      </mesh>

      {/* 64 Board Squares & Hit Boxes */}
      {Array.from({ length: 8 }).map((_, r) =>
        Array.from({ length: 8 }).map((_, c) => {
          const isLight = (r + c) % 2 === 0;
          const isSelected = selected?.row === r && selected?.col === c;
          const isValidDest = validMoves.some((m) => m.to.row === r && m.to.col === c);
          const isCaptureDest =
            isValidDest &&
            (!!board[r][c] ||
              validMoves.some((m) => m.to.row === r && m.to.col === c && !!m.enPassantCapture));
          const isLastFrom = lastMove?.from.row === r && lastMove?.from.col === c;
          const isLastTo = lastMove?.to.row === r && lastMove?.to.col === c;
          const isCheck = checkSquare?.row === r && checkSquare?.col === c;

          const sqX = (c - 3.5) * 1.0;
          const sqZ = (r - 3.5) * 1.0;

          let mat = isLight ? lightMat : darkMat;
          if (isSelected) mat = CYAN_SELECTED_MAT;
          else if (isCheck) mat = CRIMSON_CHECK_MAT;

          return (
            <group key={`${r}-${c}`} position={[sqX, 0.04, sqZ]}>
              {/* Visible square tile */}
              <mesh receiveShadow material={mat}>
                <boxGeometry args={[0.95, 0.08, 0.95]} />
              </mesh>

              {/* Move highlight overlay if last move */}
              {(isLastFrom || isLastTo) && !isSelected && !isCheck && (
                <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[0.92, 0.92]} />
                  <meshBasicMaterial
                    color={isLastTo ? "#22c55e" : "#86efac"}
                    transparent
                    opacity={isLastTo ? 0.35 : 0.18}
                  />
                </mesh>
              )}

              {/* Valid move glowing indicator */}
              {isValidDest && (
                <group position={[0, 0.08, 0]}>
                  {isCaptureDest ? (
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[0.32, 0.44, 32]} />
                      <meshBasicMaterial color="#00e5ff" transparent opacity={0.7} />
                    </mesh>
                  ) : (
                    <mesh position={[0, 0.04, 0]}>
                      <sphereGeometry args={[0.13, 16, 16]} />
                      <meshStandardMaterial
                        color="#00e5ff"
                        emissive="#00e5ff"
                        emissiveIntensity={1.2}
                      />
                    </mesh>
                  )}
                </group>
              )}

              {/* Invisible Hitbox volume for seamless clicking from any angle */}
              <mesh
                position={[0, 0.5, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSquareClick({ row: r, col: c });
                }}
              >
                <boxGeometry args={[0.98, 1.0, 0.98]} />
                <meshBasicMaterial visible={false} />
              </mesh>
            </group>
          );
        })
      )}
    </group>
  );
}

// ── Floating Stardust Particles ───────────────────────────────────────────────

function CelestialStardust() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 180;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.3) * 6;

      pos[i * 3] = Math.cos(theta) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * radius;

      col[i * 3] = 0.6 + Math.random() * 0.4;
      col[i * 3 + 1] = 0.5 + Math.random() * 0.4;
      col[i * 3 + 2] = 1.0;
    }
    return { positions: pos, colors: col };
  }, []);

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.03;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.65} sizeAttenuation />
    </points>
  );
}

// ── Dynamic Camera Manager ───────────────────────────────────────────────────

function CameraManager({
  view,
  flipped,
  controlsRef,
}: {
  view: "angled" | "top" | "side";
  flipped: boolean;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    const sign = flipped ? -1 : 1;
    if (view === "top") {
      camera.position.set(0, 11.5, sign * 0.001);
    } else if (view === "side") {
      camera.position.set(9.0, 7.5, 0);
    } else {
      camera.position.set(0, 8.8, sign * 8.6);
    }
    camera.lookAt(0, 0.3, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0.3, 0);
      controlsRef.current.update();
    }
  }, [view, flipped, camera, controlsRef]);

  return null;
}

// ── Main 3D Chess Board Component ────────────────────────────────────────────

export function ChessBoard3D({
  board,
  flipped = false,
  selected,
  validMoves,
  lastMove,
  checkSquare,
  currentTurn,
  onSquareClick,
  disabled,
}: Props) {
  const [cameraView, setCameraView] = useState<"angled" | "top" | "side">("angled");
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef<any>(null);

  const initialPos = useMemo<[number, number, number]>(() => {
    const sign = flipped ? -1 : 1;
    return [0, 8.8, sign * 8.6];
  }, [flipped]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
        disabled ? "opacity-75 pointer-events-none" : ""
      }`}
      style={{
        aspectRatio: "1 / 1",
        border: "2px solid rgba(140, 100, 255, 0.4)",
        background: "radial-gradient(circle at 50% 50%, #150a2e 0%, #080314 100%)",
        boxShadow: `
          0 0 60px rgba(100, 60, 255, 0.28),
          0 0 120px rgba(70, 30, 180, 0.16),
          inset 0 0 50px rgba(50, 20, 130, 0.3)
        `,
      }}
    >
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: initialPos, fov: 46 }}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ width: "100%", height: "100%", cursor: "grab" }}
      >
        <ambientLight intensity={0.85} color="#2b1a52" />
        <directionalLight
          position={[6, 12, 6]}
          intensity={1.8}
          color="#fffdf8"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-6, 7, -6]} intensity={1.2} color="#9d6bff" />
        <pointLight position={[0, 4, 0]} intensity={0.6} color="#00e5ff" />

        <CameraManager view={cameraView} flipped={flipped} controlsRef={controlsRef} />

        <Suspense fallback={null}>
          <CelestialStardust />

          {/* Board & Squares */}
          <BoardSquaresAndPlinth
            board={board}
            selected={selected}
            validMoves={validMoves}
            lastMove={lastMove}
            checkSquare={checkSquare}
            onSquareClick={onSquareClick}
          />

          {/* 3D Pieces */}
          {board.map((row, r) =>
            row.map((piece, c) => {
              if (!piece) return null;
              const isSelected = selected?.row === r && selected?.col === c;
              const isCheck = checkSquare?.row === r && checkSquare?.col === c;

              return (
                <AnimatedPiece
                  key={`${r}-${c}`}
                  row={r}
                  col={c}
                  type={piece.type}
                  color={piece.color}
                  isSelected={isSelected}
                  isInCheck={isCheck}
                />
              );
            })
          )}
        </Suspense>

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2 - 0.06}
          minPolarAngle={0.08}
          dampingFactor={0.06}
          enableDamping
          autoRotate={autoRotate}
          autoRotateSpeed={0.8}
        />
      </Canvas>

      {/* Floating 3D Control Badges */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl border border-violet-500/30">
        <Sparkles size={13} className="text-violet-400" />
        <span className="text-[11px] font-mono text-violet-200">3D Cosmic View</span>
      </div>

      {/* Camera Angle Quick Presets */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
        <button
          onClick={() => setCameraView("angled")}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
            cameraView === "angled"
              ? "bg-violet-600/50 text-white border border-violet-400/50"
              : "text-foreground/50 hover:text-foreground/80"
          }`}
          title="Perspective 3D View"
        >
          Angle
        </button>
        <button
          onClick={() => setCameraView("top")}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
            cameraView === "top"
              ? "bg-violet-600/50 text-white border border-violet-400/50"
              : "text-foreground/50 hover:text-foreground/80"
          }`}
          title="Top-Down View"
        >
          Top
        </button>
        <button
          onClick={() => setCameraView("side")}
          className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
            cameraView === "side"
              ? "bg-violet-600/50 text-white border border-violet-400/50"
              : "text-foreground/50 hover:text-foreground/80"
          }`}
          title="Flank View"
        >
          Flank
        </button>
        <button
          onClick={() => setAutoRotate((r) => !r)}
          className={`p-1 rounded-lg text-xs transition-all ${
            autoRotate
              ? "bg-cyan-500/40 text-cyan-200 border border-cyan-400/50"
              : "text-foreground/50 hover:text-foreground/80"
          }`}
          title={autoRotate ? "Pause orbit rotation" : "Auto-rotate view"}
        >
          <RotateCw size={13} className={autoRotate ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Orbit Tip Hint */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-black/50 backdrop-blur-sm px-3 py-0.5 rounded-full border border-white/10 text-[10px] font-mono text-foreground/45 flex items-center gap-1.5 whitespace-nowrap">
        <span>Drag to rotate · Scroll to zoom · Click pieces to move</span>
      </div>
    </div>
  );
}
