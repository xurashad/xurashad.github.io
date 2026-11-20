"use client";

import React, {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Pause, Play, RotateCcw, Sparkles, Orbit } from "lucide-react";
import * as THREE from "three";
import type { Element } from "../lib/types";
import { mulberry32 } from "../lib/atomUtils";
import { BohrDiagramSVG, SHELL_PALETTE } from "./QuantumVisuals";

export type AtomViewMode = "bohr" | "quantum";
export type OrbitalType = "s" | "p" | "d" | "f";

/* -------------------------------------------------------------------------- */
/* Error Boundary Fallback                                                    */
/* -------------------------------------------------------------------------- */
class AtomWebGLErrorBoundary extends Component<
  { element: Element; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
          <BohrDiagramSVG element={this.props.element} size={210} />
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            2D Bohr diagram fallback (WebGL context unavailable)
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/* Fresnel Nuclear Aura Shader                                                */
/* -------------------------------------------------------------------------- */
const FRESNEL_VERT = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const FRESNEL_FRAG = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float ndotv = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float fresnel = pow(1.0 - ndotv, 2.2);
    gl_FragColor = vec4(uColor * uIntensity, fresnel * 0.55);
  }
`;

/* -------------------------------------------------------------------------- */
/* Quantum Cloud Point Shader                                                 */
/* -------------------------------------------------------------------------- */
const CLOUD_VERT = `
  attribute float aSize;
  attribute float aPhase;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;
  uniform float uPixelRatio;

  void main() {
    vColor = color;
    float pulse = 0.85 + 0.15 * sin(uTime * 1.8 + aPhase);
    vAlpha = pulse;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (18.0 / max(-mvPosition.z, 1.0));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const CLOUD_FRAG = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float glow = pow(1.0 - d * 2.0, 1.8);
    gl_FragColor = vec4(vColor, glow * 0.65 * vAlpha);
  }
`;

/* -------------------------------------------------------------------------- */
/* Packed 3D Proton / Neutron Nucleus                                         */
/* -------------------------------------------------------------------------- */
function PackedNucleus({
  element,
  playing,
  speed,
}: {
  element: Element;
  playing: boolean;
  speed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const protonMeshRef = useRef<THREE.InstancedMesh>(null);
  const neutronMeshRef = useRef<THREE.InstancedMesh>(null);
  const phaseRef = useRef(0);

  const totalZ = element.number;
  const totalN = Math.max(0, Math.round(element.atomic_mass) - totalZ);
  const auraColor = element.cpk_hex || "#38bdf8";

  const { protonPositions, neutronPositions, nucleonRadius, auraRadius } = useMemo(() => {
    const rng = mulberry32(element.number * 7919 + 31);
    const total = Math.max(1, totalZ + totalN);
    const displayCount = Math.min(96, total);
    const pCount = Math.max(1, Math.round((totalZ / total) * displayCount));
    const nCount = Math.max(0, displayCount - pCount);

    const nRadius =
      displayCount === 1
        ? 0.22
        : Math.max(0.068, Math.min(0.14, 0.28 / Math.pow(displayCount, 0.28)));

    const points: THREE.Vector3[] = [];
    if (displayCount === 1) {
      points.push(new THREE.Vector3(0, 0, 0));
    } else {
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < displayCount; i++) {
        // Volumetric Fibonacci ball packing
        const frac = (i + 0.5) / displayCount;
        const r = Math.cbrt(frac) * nRadius * Math.cbrt(displayCount) * 0.92;
        const y = 1 - 2 * frac;
        const ring = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = goldenAngle * i + rng() * 0.35;
        points.push(
          new THREE.Vector3(
            Math.cos(theta) * ring * r,
            y * r,
            Math.sin(theta) * ring * r
          )
        );
      }
      // Deterministic Fisher-Yates shuffle to mix protons and neutrons uniformly
      for (let i = points.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = points[i];
        points[i] = points[j];
        points[j] = tmp;
      }
    }

    const pPos = points.slice(0, pCount);
    const nPos = points.slice(pCount, pCount + nCount);
    const maxDist = points.reduce((m, p) => Math.max(m, p.length()), 0);

    return {
      protonPositions: pPos,
      neutronPositions: nPos,
      nucleonRadius: nRadius,
      auraRadius: maxDist + nRadius * 1.9,
    };
  }, [element.number, totalZ, totalN]);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (protonMeshRef.current) {
      protonPositions.forEach((pos, idx) => {
        dummy.position.copy(pos);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        protonMeshRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      protonMeshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (neutronMeshRef.current) {
      neutronPositions.forEach((pos, idx) => {
        dummy.position.copy(pos);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        neutronMeshRef.current!.setMatrixAt(idx, dummy.matrix);
      });
      neutronMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [protonPositions, neutronPositions]);

  const auraMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FRESNEL_VERT,
        fragmentShader: FRESNEL_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(auraColor) },
          uIntensity: { value: 1.35 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [auraColor]
  );

  useEffect(() => {
    return () => {
      auraMaterial.dispose();
    };
  }, [auraMaterial]);

  useFrame((_, delta) => {
    if (playing) {
      phaseRef.current += delta * speed;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = phaseRef.current * 0.45;
      groupRef.current.rotation.x = Math.sin(phaseRef.current * 0.35) * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        key={`p-${element.number}`}
        ref={protonMeshRef}
        args={[undefined, undefined, Math.max(1, protonPositions.length)]}
      >
        <sphereGeometry args={[nucleonRadius, 18, 18]} />
        <meshStandardMaterial
          color="#fb7185"
          emissive="#e11d48"
          emissiveIntensity={0.65}
          roughness={0.25}
          metalness={0.35}
        />
      </instancedMesh>

      {neutronPositions.length > 0 && (
        <instancedMesh
          key={`n-${element.number}`}
          ref={neutronMeshRef}
          args={[undefined, undefined, neutronPositions.length]}
        >
          <sphereGeometry args={[nucleonRadius, 18, 18]} />
          <meshStandardMaterial
            color="#cbd5e1"
            emissive="#475569"
            emissiveIntensity={0.25}
            roughness={0.35}
            metalness={0.5}
          />
        </instancedMesh>
      )}

      {/* Fresnel nuclear binding glow */}
      <mesh material={auraMaterial}>
        <sphereGeometry args={[auraRadius, 32, 32]} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Electron moving purely in local XY plane (inherits parent orbital tilt)    */
/* -------------------------------------------------------------------------- */
function OrbitalElectron({
  radius,
  speed,
  offset,
  color,
  isValence,
  playing,
  globalSpeed,
}: {
  radius: number;
  speed: number;
  offset: number;
  color: string;
  isValence: boolean;
  playing: boolean;
  globalSpeed: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const angleRef = useRef(offset);

  useFrame((_, delta) => {
    if (playing) {
      angleRef.current += delta * speed * globalSpeed;
    }
    if (ref.current) {
      ref.current.position.set(
        Math.cos(angleRef.current) * radius,
        Math.sin(angleRef.current) * radius,
        0
      );
    }
  });

  const electronSize = isValence ? 0.068 : 0.048;

  return (
    <group
      ref={ref}
      position={[Math.cos(offset) * radius, Math.sin(offset) * radius, 0]}
    >
      <mesh>
        <sphereGeometry args={[electronSize, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isValence ? 2.1 : 1.2}
          roughness={0.15}
          metalness={0.4}
        />
      </mesh>
      {isValence && (
        <mesh>
          <sphereGeometry args={[electronSize * 2.1, 14, 14]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.24}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Single Electron Shell with Strictly Aligned Tilted Planes                  */
/* -------------------------------------------------------------------------- */
function ElectronShell({
  shellIndex,
  electronCount,
  radius,
  color,
  isValence,
  playing,
  globalSpeed,
}: {
  shellIndex: number;
  electronCount: number;
  radius: number;
  color: string;
  isValence: boolean;
  playing: boolean;
  globalSpeed: number;
}) {
  const planes = useMemo(() => {
    const result: { tiltX: number; tiltY: number; tiltZ: number; electrons: number }[] = [];
    if (electronCount <= 2) {
      result.push({
        tiltX: (shellIndex % 2 === 0 ? 0.18 : -0.25) + shellIndex * 0.08,
        tiltY: shellIndex * 0.15,
        tiltZ: 0,
        electrons: electronCount,
      });
    } else if (electronCount <= 8) {
      const half = Math.ceil(electronCount / 2);
      result.push({
        tiltX: 0.2 + shellIndex * 0.12,
        tiltY: 0,
        tiltZ: 0,
        electrons: half,
      });
      result.push({
        tiltX: Math.PI / 2.8 + shellIndex * 0.14,
        tiltY: Math.PI / 5,
        tiltZ: Math.PI / 4,
        electrons: electronCount - half,
      });
    } else {
      const third = Math.ceil(electronCount / 3);
      const remaining = electronCount - third;
      const second = Math.ceil(remaining / 2);
      result.push({
        tiltX: 0.15 + shellIndex * 0.1,
        tiltY: 0.1,
        tiltZ: 0,
        electrons: third,
      });
      result.push({
        tiltX: Math.PI / 3 + shellIndex * 0.15,
        tiltY: -Math.PI / 6,
        tiltZ: Math.PI / 4.5,
        electrons: second,
      });
      result.push({
        tiltX: -Math.PI / 2.4 + shellIndex * 0.1,
        tiltY: Math.PI / 4,
        tiltZ: -Math.PI / 4,
        electrons: remaining - second,
      });
    }
    return result;
  }, [electronCount, shellIndex]);

  const baseSpeed = Math.max(0.38, 1.35 - shellIndex * 0.14);

  return (
    <group>
      {planes.map((plane, pi) => (
        <group
          key={pi}
          rotation={[plane.tiltX, plane.tiltY, plane.tiltZ]}
        >
          {/* Ring strictly in local XY plane */}
          <mesh>
            <torusGeometry args={[radius, isValence ? 0.014 : 0.008, 8, 96]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={isValence ? 0.5 : 0.24}
            />
          </mesh>

          {Array.from({ length: plane.electrons }).map((_, ei) => (
            <OrbitalElectron
              key={ei}
              radius={radius}
              speed={baseSpeed * (0.85 + pi * 0.22)}
              offset={(ei / plane.electrons) * Math.PI * 2 + pi * 0.6}
              color={color}
              isValence={isValence}
              playing={playing}
              globalSpeed={globalSpeed}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Quantum Orbital Probability Cloud |psi(n,l,m)|^2                           */
/* -------------------------------------------------------------------------- */
function QuantumOrbitalCloud({
  element,
  orbital,
  playing,
  speed,
}: {
  element: Element;
  orbital: OrbitalType;
  playing: boolean;
  speed: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1.5 },
    }),
    []
  );

  const geometry = useMemo(() => {
    const count = 3400;
    const rng = mulberry32(
      element.number * 3571 + orbital.charCodeAt(0) * 101
    );
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);

    const posColor = new THREE.Color("#22d3ee"); // +psi cyan
    const negColor = new THREE.Color("#e879f9"); // -psi magenta
    const shellCount = element.shells.length;
    const scale = 1.6 + Math.min(shellCount, 7) * 0.28;

    let filled = 0;
    let guard = 0;
    while (filled < count && guard < count * 28) {
      guard++;
      // Sample candidate point in [-1.5, 1.5]^3
      const x = (rng() * 2 - 1) * 1.45;
      const y = (rng() * 2 - 1) * 1.45;
      const z = (rng() * 2 - 1) * 1.45;
      const r = Math.sqrt(x * x + y * y + z * z);
      if (r < 0.04 || r > 1.45) continue;

      const nx = x / r;
      const ny = y / r;
      const nz = z / r;

      let psi = 0;
      if (orbital === "s") {
        // Radial shell nodal modulation
        const nodeFactor = Math.cos(r * Math.PI * Math.min(3, Math.max(1, shellCount * 0.5)));
        psi = Math.exp(-r * 2.1) * (0.45 + 0.55 * nodeFactor);
      } else if (orbital === "p") {
        // 2p_z dumbbell
        psi = r * Math.exp(-r * 2.3) * ny * 2.6;
      } else if (orbital === "d") {
        // 3d_xy four-lobe cloverleaf
        psi = r * r * Math.exp(-r * 2.45) * (nx * ny) * 6.5;
      } else {
        // 4f_xyz eight-lobe octupole
        psi = r * r * r * Math.exp(-r * 2.65) * (nx * ny * nz) * 18.0;
      }

      const prob = Math.min(1, psi * psi * 1.35);
      if (rng() < prob) {
        positions[filled * 3] = x * scale;
        positions[filled * 3 + 1] = y * scale;
        positions[filled * 3 + 2] = z * scale;

        const c = psi >= 0 ? posColor : negColor;
        colors[filled * 3] = c.r;
        colors[filled * 3 + 1] = c.g;
        colors[filled * 3 + 2] = c.b;

        sizes[filled] = 1.6 + prob * 2.4;
        phases[filled] = rng() * Math.PI * 2;
        filled++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(0, filled * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors.slice(0, filled * 3), 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes.slice(0, filled), 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases.slice(0, filled), 1));

    return geo;
  }, [element.number, element.shells.length, orbital]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    if (playing) {
      timeRef.current += delta * speed;
    }
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = timeRef.current;
    }
    if (pointsRef.current && playing) {
      pointsRef.current.rotation.y += delta * 0.22 * speed;
      pointsRef.current.rotation.x = Math.sin(timeRef.current * 0.25) * 0.12;
    }
  });

  return (
    <group>
      <points ref={pointsRef} geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={CLOUD_VERT}
          fragmentShader={CLOUD_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          vertexColors
          blending={THREE.AdditiveBlending}
        />
      </points>
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={element.cpk_hex || "#38bdf8"}
          emissiveIntensity={1.6}
        />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Camera Auto-Fit & Reset Controller                                         */
/* -------------------------------------------------------------------------- */
function CameraController({
  targetZ,
  resetSignal,
  controlsRef,
}: {
  targetZ: number;
  resetSignal: number;
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, targetZ * 0.22, targetZ);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [camera, targetZ, resetSignal, controlsRef]);

  return null;
}

/* -------------------------------------------------------------------------- */
/* Main Atom Scene                                                            */
/* -------------------------------------------------------------------------- */
function AtomScene({
  element,
  mode,
  orbital,
  playing,
  speed,
}: {
  element: Element;
  mode: AtomViewMode;
  orbital: OrbitalType;
  playing: boolean;
  speed: number;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const spinRef = useRef(0);

  const shellRadii = useMemo(() => {
    const baseRadius = 0.95;
    const increment = 0.56;
    return element.shells.map((_, i) => baseRadius + i * increment);
  }, [element.shells]);

  useFrame((_, delta) => {
    if (playing) {
      spinRef.current += delta * speed * 0.08;
    }
    if (rootRef.current) {
      rootRef.current.rotation.y = spinRef.current;
    }
  });

  return (
    <group ref={rootRef}>
      {mode === "bohr" ? (
        <>
          <PackedNucleus element={element} playing={playing} speed={speed} />
          {element.shells.map((electronCount, shellIndex) => (
            <ElectronShell
              key={`${element.number}-${shellIndex}`}
              shellIndex={shellIndex}
              electronCount={electronCount}
              radius={shellRadii[shellIndex]}
              color={SHELL_PALETTE[shellIndex % SHELL_PALETTE.length]}
              isValence={shellIndex === element.shells.length - 1}
              playing={playing}
              globalSpeed={speed}
            />
          ))}
        </>
      ) : (
        <QuantumOrbitalCloud
          element={element}
          orbital={orbital}
          playing={playing}
          speed={speed}
        />
      )}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/* Exported 3D Atom Component                                                 */
/* -------------------------------------------------------------------------- */
export function AtomModel3D({
  element,
  mode: controlledMode,
  quantumOrbital: controlledOrbital,
  playing: controlledPlaying,
  speed: controlledSpeed,
  showControls = true,
  className = "",
}: {
  element: Element;
  mode?: AtomViewMode;
  quantumOrbital?: OrbitalType;
  playing?: boolean;
  speed?: number;
  showControls?: boolean;
  className?: string;
}) {
  const [internalMode, setInternalMode] = useState<AtomViewMode>("bohr");
  const [orbitalOverride, setOrbitalOverride] = useState<{
    elNum: number;
    orb: OrbitalType;
  } | null>(null);
  const [internalPlaying, setInternalPlaying] = useState(true);
  const [internalSpeed, setInternalSpeed] = useState(1);
  const [resetSignal, setResetSignal] = useState(0);
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);

  const activeMode = controlledMode ?? internalMode;
  const activeOrbital =
    controlledOrbital ??
    (orbitalOverride?.elNum === element.number
      ? orbitalOverride.orb
      : element.block);
  const isPlaying = controlledPlaying ?? internalPlaying;
  const activeSpeed = controlledSpeed ?? internalSpeed;

  const outerRadius = 0.95 + Math.max(0, element.shells.length - 1) * 0.56;
  const targetZ =
    activeMode === "quantum"
      ? 5.6 + Math.min(element.shells.length, 7) * 0.5
      : 2.3 + outerRadius * 1.9;

  const totalZ = element.number;
  const totalN = Math.max(0, Math.round(element.atomic_mass) - totalZ);

  return (
    <div
      className={`relative w-full h-full min-h-[240px] select-none ${className}`}
    >
      {/* Top HUD Controls */}
      {showControls && (
        <div className="absolute top-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Left: Bohr vs Quantum Cloud */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <div className="inline-flex rounded-lg p-0.5 bg-slate-950/75 border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setInternalMode("bohr")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${activeMode === "bohr"
                  ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/30"
                  : "text-slate-300/70 hover:text-white"
                  }`}
              >
                <Orbit size={11} />
                Bohr 3D
              </button>
              <button
                type="button"
                onClick={() => setInternalMode("quantum")}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${activeMode === "quantum"
                  ? "bg-fuchsia-500/25 text-fuchsia-200 border border-fuchsia-400/30"
                  : "text-slate-300/70 hover:text-white"
                  }`}
              >
                <Sparkles size={11} />
                Orbital Cloud
              </button>
            </div>

            {activeMode === "quantum" && (
              <div className="inline-flex rounded-lg p-0.5 bg-slate-950/75 border border-white/10 backdrop-blur-md">
                {(["s", "p", "d", "f"] as OrbitalType[]).map((orb) => (
                  <button
                    key={orb}
                    type="button"
                    onClick={() =>
                      setOrbitalOverride({ elNum: element.number, orb })
                    }
                    title={
                      orb === element.block
                        ? `${orb}-orbital (element valence block)`
                        : `Inspect ${orb}-orbital geometry`
                    }
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${activeOrbital === orb
                      ? "bg-white/20 text-white font-bold"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    {orb}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Play/Pause, Speed, Reset */}
          <div className="inline-flex items-center gap-1 rounded-lg p-0.5 bg-slate-950/75 border border-white/10 backdrop-blur-md pointer-events-auto">
            <button
              type="button"
              onClick={() => setInternalPlaying((p) => !p)}
              className="p-1.5 rounded-md text-slate-200 hover:bg-white/10 transition-colors"
              title={isPlaying ? "Pause animation" : "Resume animation"}
              aria-label={isPlaying ? "Pause animation" : "Resume animation"}
            >
              {isPlaying ? <Pause size={11} /> : <Play size={11} />}
            </button>
            <button
              type="button"
              onClick={() =>
                setInternalSpeed((s) => (s === 0.5 ? 1 : s === 1 ? 2 : 0.5))
              }
              className="px-1.5 py-1 rounded-md text-[10px] font-mono text-slate-200 hover:bg-white/10 transition-colors"
              title="Cycle animation speed"
            >
              {activeSpeed}×
            </button>
            <button
              type="button"
              onClick={() => setResetSignal((n) => n + 1)}
              className="p-1.5 rounded-md text-slate-200 hover:bg-white/10 transition-colors"
              title="Reset camera angle"
              aria-label="Reset camera angle"
            >
              <RotateCcw size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Three.js Canvas inside Error Boundary */}
      <AtomWebGLErrorBoundary element={element}>
        <Canvas
          camera={{ position: [0, targetZ * 0.22, targetZ], fov: 46 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
          style={{ background: "transparent" }}
        >
          <ambientLight intensity={0.45} />
          <pointLight position={[10, 10, 10]} intensity={1.15} color="#e0e7ff" />
          <pointLight position={[-10, -8, -6]} intensity={0.6} color="#c4b5fd" />
          <pointLight position={[0, 4, 8]} intensity={0.4} color="#7dd3fc" />

          <CameraController
            targetZ={targetZ}
            resetSignal={resetSignal}
            controlsRef={controlsRef}
          />

          <Suspense fallback={null}>
            <AtomScene
              element={element}
              mode={activeMode}
              orbital={activeOrbital}
              playing={isPlaying}
              speed={activeSpeed}
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            minDistance={Math.max(1.8, outerRadius * 0.6)}
            maxDistance={Math.max(12, outerRadius * 4.2)}
            dampingFactor={0.07}
            enableDamping
          />
        </Canvas>
      </AtomWebGLErrorBoundary>

      {/* Bottom HUD Badges */}
      {showControls && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950/70 border border-white/10 backdrop-blur-md text-[10px] font-mono text-slate-200">
            <span className="text-rose-400">{totalZ}p⁺</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300">{totalN}n⁰</span>
            <span className="text-slate-500">·</span>
            <span className="text-cyan-300">{totalZ}e⁻</span>
          </div>

          {activeMode === "bohr" ? (
            <div className="flex flex-wrap items-center gap-1">
              {element.shells.map((count, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/70 border backdrop-blur-md"
                  style={{
                    borderColor: `${SHELL_PALETTE[i % SHELL_PALETTE.length]}50`,
                    color: SHELL_PALETTE[i % SHELL_PALETTE.length],
                  }}
                >
                  {["K", "L", "M", "N", "O", "P", "Q"][i]}={count}
                </span>
              ))}
            </div>
          ) : (
            <div className="px-2 py-1 rounded-lg bg-slate-950/70 border border-white/10 backdrop-blur-md text-[10px] font-mono text-slate-200">
              <span className="text-cyan-300">+ψ</span> /{" "}
              <span className="text-fuchsia-300">−ψ</span> · {activeOrbital}-orbital density
            </div>
          )}
        </div>
      )}
    </div>
  );
}
