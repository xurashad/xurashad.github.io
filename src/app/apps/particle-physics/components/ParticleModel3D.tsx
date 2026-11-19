"use client";

import React, {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ComponentRef,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  QUARK_COLOR_HEX,
  flipQuarkColor,
  type Particle,
} from "../lib/particles";
import { ParticleGlyph } from "./ParticleGlyph";

export type CameraPreset = "angled" | "top" | "side";

export interface ParticleModel3DProps {
  particle: Particle;
  showField: boolean;
  showSpin: boolean;
  showCloud: boolean;
  antimatter: boolean;
  playing: boolean;
  speed: number;
  cameraPreset: CameraPreset;
  cameraSignal?: number;
}

// ── Deterministic PRNG ───────────────────────────────────────────────────────

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Error Boundary Fallback ──────────────────────────────────────────────────

interface BoundaryProps {
  particle: Particle;
  antimatter: boolean;
  children: ReactNode;
}

interface BoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
          <ParticleGlyph
            particle={this.props.particle}
            size={210}
            antimatter={this.props.antimatter}
            active
          />
          <p className="text-xs font-mono text-white/60">
            Interactive 2D quantum glyph fallback (WebGL unavailable in this browser context)
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Reusable Procedural Shaders & Helpers ────────────────────────────────────

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
  uniform float uPower;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float ndotv = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float fresnel = pow(1.0 - ndotv, uPower);
    gl_FragColor = vec4(uColor * uIntensity, fresnel * uOpacity);
  }
`;

function FresnelHalo({
  radius,
  color,
  intensity = 1.4,
  power = 2.4,
  opacity = 0.72,
}: {
  radius: number;
  color: string;
  intensity?: number;
  power?: number;
  opacity?: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FRESNEL_VERT,
        fragmentShader: FRESNEL_FRAG,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uPower: { value: power },
          uOpacity: { value: opacity },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.FrontSide,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    material.uniforms.uColor.value.set(color);
    material.uniforms.uIntensity.value = intensity;
    material.uniforms.uPower.value = power;
    material.uniforms.uOpacity.value = opacity;
  }, [material, color, intensity, power, opacity]);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 36, 36]} />
    </mesh>
  );
}

const CLOUD_VERT = `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (220.0 / max(-mvPos.z, 0.5));
    gl_Position = projectionMatrix * mvPos;
  }
`;

const CLOUD_FRAG = `
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d2 = dot(c, c);
    if (d2 > 0.25) discard;
    float alpha = exp(-d2 * 14.0) * uOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

function QuantumCloudPoints({
  count = 220,
  radius,
  color,
  secondaryColor,
  playing,
  speed,
  seed,
  opacity = 0.72,
}: {
  count?: number;
  radius: number;
  color: string;
  secondaryColor: string;
  playing: boolean;
  speed: number;
  seed: number;
  opacity?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const simTimeRef = useRef(0);

  const { positions, colors, sizes } = useMemo(() => {
    const rng = mulberry32(seed);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const c1 = new THREE.Color(color);
    const c2 = new THREE.Color(secondaryColor);
    const mix = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const u = rng();
      const v = rng();
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = radius * (0.42 + Math.pow(rng(), 0.75) * 0.68);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      mix.lerpColors(c1, c2, rng());
      col[i * 3] = mix.r;
      col[i * 3 + 1] = mix.g;
      col[i * 3 + 2] = mix.b;
      sz[i] = 0.55 + rng() * 1.15;
    }
    return { positions: pos, colors: col, sizes: sz };
  }, [count, radius, color, secondaryColor, seed]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CLOUD_VERT,
        fragmentShader: CLOUD_FRAG,
        uniforms: { uOpacity: { value: opacity } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    material.uniforms.uOpacity.value = opacity;
  }, [material, opacity]);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = simTimeRef.current * 0.16;
      pointsRef.current.rotation.x = Math.sin(simTimeRef.current * 0.11) * 0.14;
    }
  });

  return (
    <points ref={pointsRef} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
    </points>
  );
}

// ── Spin Vector Indicator ────────────────────────────────────────────────────

function SpinVector3D({
  spinNum,
  color,
  accentColor,
  antimatter,
  playing,
  speed,
  scale = 1,
  axis = "y",
}: {
  spinNum: number;
  color: string;
  accentColor: string;
  antimatter: boolean;
  playing: boolean;
  speed: number;
  scale?: number;
  axis?: "y" | "x";
}) {
  const precessRef = useRef<THREE.Group>(null);
  const scalarRef = useRef<THREE.Group>(null);
  const simTimeRef = useRef(0);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;
    if (precessRef.current) {
      if (axis === "x") {
        precessRef.current.rotation.x = t * 1.5;
      } else {
        precessRef.current.rotation.y = t * (spinNum >= 1 ? 1.5 : 1.0);
      }
    }
    if (scalarRef.current) {
      const pulse = 1 + Math.sin(t * 2.6) * 0.06;
      scalarRef.current.scale.setScalar(pulse);
      scalarRef.current.rotation.z = t * 0.35;
    }
  });

  if (spinNum === 0) {
    return (
      <group ref={scalarRef} scale={scale}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.05, 0.015, 10, 64]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.45} />
        </mesh>
        <mesh rotation={[Math.PI / 3, Math.PI / 6, 0]}>
          <torusGeometry args={[1.05, 0.01, 8, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} />
        </mesh>
      </group>
    );
  }

  const tilt = axis === "x" ? 0 : spinNum === 1.5 ? 0.22 : 0.35;
  const dir = antimatter ? -1 : 1;

  return (
    <group ref={precessRef} scale={scale}>
      <group rotation={[0, 0, axis === "x" ? -Math.PI / 2 : 0]}>
        <group rotation={[0, 0, tilt]} scale={[1, dir, 1]}>
          {/* Precession cone */}
          <mesh position={[0, 0.88, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.42, 1.35, 24, 1, true]} />
            <meshBasicMaterial
              color={accentColor}
              transparent
              opacity={0.07}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Spin axis shaft */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 2.3, 12]} />
            <meshStandardMaterial
              color="#f8fafc"
              emissive={accentColor}
              emissiveIntensity={1.2}
            />
          </mesh>

          {/* Arrowhead */}
          <mesh position={[0, 1.38, 0]}>
            <coneGeometry args={[0.09, 0.24, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={accentColor}
              emissiveIntensity={1.5}
            />
          </mesh>

          {/* Equatorial spin-direction ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.65, 0]}>
            <torusGeometry args={[0.42, 0.014, 10, 40]} />
            <meshBasicMaterial color={color} transparent opacity={0.55} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ── Electric Field Needles / Dipole ──────────────────────────────────────────

const FIBONACCI_DIRS: THREE.Vector3[] = (() => {
  const dirs: THREE.Vector3[] = [];
  const count = 12;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    dirs.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize());
  }
  return dirs;
})();

function ElectricField3D({
  chargeNum,
  bipolarCharge = false,
  antimatter,
  radius = 1.35,
  playing,
  speed,
}: {
  chargeNum: number;
  bipolarCharge?: boolean;
  antimatter: boolean;
  radius?: number;
  playing: boolean;
  speed: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const needleRefs = useRef<(THREE.Group | null)[]>([]);
  const simTimeRef = useRef(0);

  const effectiveCharge = antimatter ? -chargeNum : chargeNum;

  const quats = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return FIBONACCI_DIRS.map((d) => new THREE.Quaternion().setFromUnitVectors(up, d));
  }, []);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;

    if (bipolarCharge && groupRef.current) {
      groupRef.current.rotation.y = t * 0.45;
      return;
    }

    const dirSign = effectiveCharge > 0 ? 1 : -1;
    for (let i = 0; i < FIBONACCI_DIRS.length; i++) {
      const g = needleRefs.current[i];
      if (!g) continue;
      const d = FIBONACCI_DIRS[i];
      const pulse = Math.sin(t * 2.4 + i * 0.6) * 0.08 * dirSign;
      const r = radius + pulse;
      g.position.set(d.x * r, d.y * r, d.z * r);
    }
  });

  if (bipolarCharge) {
    const posCol = antimatter ? "#fb7185" : "#38bdf8";
    const negCol = antimatter ? "#38bdf8" : "#fb7185";
    return (
      <group ref={groupRef}>
        <mesh position={[0.45, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[1.15, 0.02, 10, 40, Math.PI]} />
          <meshBasicMaterial color={posCol} transparent opacity={0.65} />
        </mesh>
        <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[1.15, 0.02, 10, 40, Math.PI]} />
          <meshBasicMaterial color={negCol} transparent opacity={0.65} />
        </mesh>
      </group>
    );
  }

  if (effectiveCharge === 0) return null;

  const isPositive = effectiveCharge > 0;
  const fieldColor = isPositive ? "#38bdf8" : "#fb7185";

  return (
    <group>
      {FIBONACCI_DIRS.map((d, i) => (
        <group
          key={i}
          ref={(el) => {
            needleRefs.current[i] = el;
          }}
          position={[d.x * radius, d.y * radius, d.z * radius]}
          quaternion={quats[i]}
        >
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />
            <meshBasicMaterial color={fieldColor} transparent opacity={0.55} />
          </mesh>
          <mesh
            position={[0, isPositive ? 0.21 : -0.21, 0]}
            rotation={[isPositive ? 0 : Math.PI, 0, 0]}
          >
            <coneGeometry args={[0.048, 0.13, 10]} />
            <meshBasicMaterial color={fieldColor} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ── Dynamic Live-Updating QCD Gluon Flux Tube ────────────────────────────────

const TUBE_SEGMENTS = 36;
const TUBE_RADIAL = 6;

function DynamicGluonTube({
  startRef,
  endRef,
  colorA,
  colorB,
  phaseOffset,
  playing,
  speed,
  amplitude = 0.14,
  thickness = 0.045,
}: {
  startRef: React.RefObject<THREE.Vector3>;
  endRef: React.RefObject<THREE.Vector3>;
  colorA: string;
  colorB: string;
  phaseOffset: number;
  playing: boolean;
  speed: number;
  amplitude?: number;
  thickness?: number;
}) {
  const pulseOrbRef = useRef<THREE.Mesh>(null);
  const simTimeRef = useRef(0);

  const { geometry, posAttr, normAttr } = useMemo(() => {
    const vertCount = (TUBE_SEGMENTS + 1) * TUBE_RADIAL;
    const positions = new Float32Array(vertCount * 3);
    const normals = new Float32Array(vertCount * 3);
    const indices: number[] = [];

    for (let i = 0; i < TUBE_SEGMENTS; i++) {
      for (let j = 0; j < TUBE_RADIAL; j++) {
        const nextJ = (j + 1) % TUBE_RADIAL;
        const a = i * TUBE_RADIAL + j;
        const b = (i + 1) * TUBE_RADIAL + j;
        const c = (i + 1) * TUBE_RADIAL + nextJ;
        const d = i * TUBE_RADIAL + nextJ;
        indices.push(a, d, b, b, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    const pAttr = new THREE.BufferAttribute(positions, 3);
    pAttr.setUsage(THREE.DynamicDrawUsage);
    const nAttr = new THREE.BufferAttribute(normals, 3);
    nAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute("position", pAttr);
    geo.setAttribute("normal", nAttr);
    geo.setIndex(indices);

    return { geometry: geo, posAttr: pAttr, normAttr: nAttr };
  }, []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  const scratch = useMemo(
    () => ({
      dir: new THREE.Vector3(),
      perp1: new THREE.Vector3(),
      perp2: new THREE.Vector3(),
      center: new THREE.Vector3(),
      zAxis: new THREE.Vector3(0, 0, 1),
      yAxis: new THREE.Vector3(0, 1, 0),
      normal: new THREE.Vector3(),
      cA: new THREE.Color(colorA),
      cB: new THREE.Color(colorB),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    scratch.cA.set(colorA);
    scratch.cB.set(colorB);
  }, [scratch, colorA, colorB]);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const time = simTimeRef.current;

    const s = startRef.current;
    const e = endRef.current;
    const { dir, perp1, perp2, center, zAxis, yAxis, normal } = scratch;

    dir.subVectors(e, s);
    const len = dir.length();
    if (len < 0.001) return;
    dir.divideScalar(len);

    if (Math.abs(dir.dot(zAxis)) > 0.95) {
      perp1.crossVectors(dir, yAxis).normalize();
    } else {
      perp1.crossVectors(dir, zAxis).normalize();
    }
    perp2.crossVectors(dir, perp1).normalize();

    const posArr = posAttr.array as Float32Array;
    const normArr = normAttr.array as Float32Array;

    const pulseU = 0.5 + 0.45 * Math.sin(time * 2.4 + phaseOffset);

    for (let i = 0; i <= TUBE_SEGMENTS; i++) {
      const u = i / TUBE_SEGMENTS;
      const env = Math.sin(u * Math.PI);
      const wavePhase = u * Math.PI * 6 - time * 5.2 + phaseOffset;
      const w1 = Math.sin(wavePhase) * amplitude * env;
      const w2 = Math.cos(wavePhase) * amplitude * env;

      center.copy(s).lerp(e, u);
      center.addScaledVector(perp1, w1);
      center.addScaledVector(perp2, w2);

      for (let j = 0; j < TUBE_RADIAL; j++) {
        const theta = (j / TUBE_RADIAL) * Math.PI * 2;
        const ct = Math.cos(theta);
        const st = Math.sin(theta);

        normal.set(0, 0, 0).addScaledVector(perp1, ct).addScaledVector(perp2, st);

        const idx = (i * TUBE_RADIAL + j) * 3;
        posArr[idx] = center.x + normal.x * thickness;
        posArr[idx + 1] = center.y + normal.y * thickness;
        posArr[idx + 2] = center.z + normal.z * thickness;

        normArr[idx] = normal.x;
        normArr[idx + 1] = normal.y;
        normArr[idx + 2] = normal.z;
      }
    }

    if (pulseOrbRef.current) {
      const env = Math.sin(pulseU * Math.PI);
      const wavePhase = pulseU * Math.PI * 6 - time * 5.2 + phaseOffset;
      const w1 = Math.sin(wavePhase) * amplitude * env;
      const w2 = Math.cos(wavePhase) * amplitude * env;
      center.copy(s).lerp(e, pulseU).addScaledVector(perp1, w1).addScaledVector(perp2, w2);
      pulseOrbRef.current.position.copy(center);
    }

    posAttr.needsUpdate = true;
    normAttr.needsUpdate = true;
  });

  return (
    <group>
      <mesh geometry={geometry} frustumCulled={false}>
        <meshStandardMaterial
          color={colorA}
          emissive={colorB}
          emissiveIntensity={1.05}
          roughness={0.25}
          metalness={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={pulseOrbRef}>
        <sphereGeometry args={[0.095, 14, 14]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={colorB}
          emissiveIntensity={2.2}
        />
      </mesh>
    </group>
  );
}

// ── Archetype 1: Quark (QCD Color-Cycling + Generation Shells) ───────────────

function QuarkScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const shellsRef = useRef<THREE.Group>(null);
  const simTimeRef = useRef(0);

  const qcdColors = useMemo(() => {
    const cols = antimatter
      ? [QUARK_COLOR_HEX.antired, QUARK_COLOR_HEX.antigreen, QUARK_COLOR_HEX.antiblue]
      : [QUARK_COLOR_HEX.red, QUARK_COLOR_HEX.green, QUARK_COLOR_HEX.blue];
    return cols.map((c) => new THREE.Color(c));
  }, [antimatter]);

  const scratchColor = useMemo(() => new THREE.Color(), []);
  const gen = particle.generation ?? 1;

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;

    if (coreMatRef.current) {
      const cycle = (t * 0.45) % 3;
      const idxA = Math.floor(cycle);
      const idxB = (idxA + 1) % 3;
      scratchColor.lerpColors(qcdColors[idxA], qcdColors[idxB], cycle - idxA);
      coreMatRef.current.color.copy(scratchColor);
      coreMatRef.current.emissive.copy(scratchColor);
    }

    if (shellsRef.current) {
      shellsRef.current.rotation.y = t * 0.35;
      shellsRef.current.rotation.x = Math.sin(t * 0.25) * 0.25;
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.48 + gen * 0.05, 36, 36]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color={particle.hex}
          emissive={particle.hex}
          emissiveIntensity={1.1}
          roughness={0.18}
          metalness={0.3}
        />
      </mesh>
      <FresnelHalo radius={0.72 + gen * 0.06} color={particle.accentHex} intensity={1.6} />

      <group ref={shellsRef}>
        {Array.from({ length: gen }).map((_, i) => (
          <mesh
            key={i}
            rotation={[Math.PI / 4 + i * 0.55, i * 0.8, 0]}
          >
            <torusGeometry args={[0.92 + i * 0.26, 0.018, 12, 64]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#22d3ee" : "#38bdf8"}
              emissive={i % 2 === 0 ? "#22d3ee" : "#38bdf8"}
              emissiveIntensity={0.8}
              transparent
              opacity={0.72}
            />
          </mesh>
        ))}
      </group>

      {showField && (
        <ElectricField3D
          chargeNum={particle.chargeNum}
          antimatter={antimatter}
          radius={1.42}
          playing={playing}
          speed={speed}
        />
      )}
      {showSpin && (
        <SpinVector3D
          spinNum={particle.spinNum}
          color={particle.hex}
          accentColor={particle.accentHex}
          antimatter={antimatter}
          playing={playing}
          speed={speed}
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={200}
          radius={2.1}
          color={particle.hex}
          secondaryColor={particle.accentHex}
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
        />
      )}
    </group>
  );
}

// ── Archetype 2: Charged Lepton ──────────────────────────────────────────────

function ChargedLeptonScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const ringsRef = useRef<THREE.Group>(null);
  const simTimeRef = useRef(0);
  const gen = particle.generation ?? 1;
  const primary = antimatter ? "#f472b6" : particle.hex;
  const accent = antimatter ? "#38bdf8" : particle.accentHex;

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;
    if (ringsRef.current) {
      ringsRef.current.rotation.y = t * 0.55;
      ringsRef.current.rotation.z = Math.sin(t * 0.35) * 0.2;
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.42 + gen * 0.04, 36, 36]} />
        <meshStandardMaterial
          color={primary}
          emissive={primary}
          emissiveIntensity={1.25}
          roughness={0.15}
          metalness={0.25}
        />
      </mesh>
      <FresnelHalo radius={0.68 + gen * 0.05} color={accent} intensity={1.7} />

      <group ref={ringsRef}>
        {Array.from({ length: gen }).map((_, i) => (
          <group key={i} rotation={[0.45 + i * 0.7, i * 0.9, i * 0.35]}>
            <mesh>
              <torusGeometry args={[0.92 + i * 0.24, 0.015, 10, 64]} />
              <meshBasicMaterial color={primary} transparent opacity={0.65} />
            </mesh>
            <mesh position={[0.92 + i * 0.24, 0, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshStandardMaterial color="#ffffff" emissive={accent} emissiveIntensity={2} />
            </mesh>
          </group>
        ))}
      </group>

      {showField && (
        <group>
          <ElectricField3D
            chargeNum={particle.chargeNum}
            antimatter={antimatter}
            radius={1.42}
            playing={playing}
            speed={speed}
          />
          {/* Magnetic dipole field loops */}
          {[0, Math.PI / 2].map((rot, idx) => (
            <group key={idx} rotation={[0, rot, 0]}>
              <mesh position={[0.72, 0, 0]}>
                <torusGeometry args={[0.72, 0.01, 8, 48]} />
                <meshBasicMaterial color={accent} transparent opacity={0.22} />
              </mesh>
              <mesh position={[-0.72, 0, 0]}>
                <torusGeometry args={[0.72, 0.01, 8, 48]} />
                <meshBasicMaterial color={accent} transparent opacity={0.22} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      {showSpin && (
        <SpinVector3D
          spinNum={particle.spinNum}
          color={primary}
          accentColor={accent}
          antimatter={antimatter}
          playing={playing}
          speed={speed}
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={260}
          radius={2.2}
          color={primary}
          secondaryColor={accent}
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
        />
      )}
    </group>
  );
}

// ── Archetype 3: Neutrino (3-Flavor PMNS Oscillation) ────────────────────────

function NeutrinoScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const matRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const simTimeRef = useRef(0);

  const waveGeos = useMemo(() => {
    return [0, 1, 2].map((idx) => {
      const pts: THREE.Vector3[] = [];
      const r = 1.05 + idx * 0.14;
      for (let i = 0; i < 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        const amp = 0.08 * Math.sin(theta * (5 + idx));
        pts.push(
          new THREE.Vector3(
            Math.cos(theta) * (r + amp),
            0.1 * Math.sin(theta * 3 + idx),
            Math.sin(theta) * (r + amp),
          ),
        );
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      return new THREE.TubeGeometry(curve, 80, 0.02, 8, true);
    });
  }, []);

  useEffect(() => {
    return () => waveGeos.forEach((g) => g.dispose());
  }, [waveGeos]);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.4;
    }
    const phases = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
    for (let i = 0; i < 3; i++) {
      const mat = matRefs.current[i];
      if (!mat) continue;
      const prob = Math.pow(Math.sin(t * 0.9 + phases[i]), 2);
      mat.opacity = 0.22 + prob * 0.7;
      mat.emissiveIntensity = 0.4 + prob * 1.4;
    }
  });

  const flavorColors = ["#22d3ee", "#34d399", "#a78bfa"];
  const tilts: [number, number, number][] = [
    [0.35, 0, 0.2],
    [-0.45, 0.6, -0.35],
    [0.75, -0.4, 0.55],
  ];

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.28, 28, 28]} />
        <meshStandardMaterial
          color="#a7f3d0"
          emissive="#22d3ee"
          emissiveIntensity={0.85}
          transparent
          opacity={0.55}
        />
      </mesh>
      <FresnelHalo radius={0.55} color="#6ee7b7" intensity={1.3} opacity={0.45} />

      <group ref={groupRef}>
        {waveGeos.map((geo, i) => (
          <mesh key={i} geometry={geo} rotation={tilts[i]}>
            <meshStandardMaterial
              ref={(el) => {
                matRefs.current[i] = el;
              }}
              color={flavorColors[i]}
              emissive={flavorColors[i]}
              emissiveIntensity={1}
              transparent
              opacity={0.75}
            />
          </mesh>
        ))}
      </group>

      {showField && (
        <group>
          <mesh>
            <icosahedronGeometry args={[1.45, 1]} />
            <meshBasicMaterial color="#34d399" wireframe transparent opacity={0.14} />
          </mesh>
          <FresnelHalo radius={1.48} color="#22d3ee" intensity={1.0} opacity={0.28} />
        </group>
      )}

      {showSpin && (
        <SpinVector3D
          spinNum={particle.spinNum}
          color="#34d399"
          accentColor="#a78bfa"
          antimatter={antimatter}
          playing={playing}
          speed={speed}
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={140}
          radius={1.9}
          color="#34d399"
          secondaryColor="#a78bfa"
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
          opacity={0.48}
        />
      )}
    </group>
  );
}

// ── Archetype 4: Photon (Transverse E × B Electromagnetic Wave) ──────────────

const WAVE_SAMPLES = 72;
const RUNG_COUNT = 18;

function PhotonScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const eWaveMeshRef = useRef<THREE.Mesh>(null);
  const bWaveMeshRef = useRef<THREE.Mesh>(null);
  const eRungMeshRef = useRef<THREE.InstancedMesh>(null);
  const bRungMeshRef = useRef<THREE.InstancedMesh>(null);
  const helicityRingRef = useRef<THREE.Mesh>(null);
  const simTimeRef = useRef(0);

  const { eGeo, bGeo, dummy } = useMemo(() => {
    const buildLineTube = () => {
      const vertCount = (WAVE_SAMPLES + 1) * TUBE_RADIAL;
      const positions = new Float32Array(vertCount * 3);
      const normals = new Float32Array(vertCount * 3);
      const indices: number[] = [];
      for (let i = 0; i < WAVE_SAMPLES; i++) {
        for (let j = 0; j < TUBE_RADIAL; j++) {
          const nextJ = (j + 1) % TUBE_RADIAL;
          const a = i * TUBE_RADIAL + j;
          const b = (i + 1) * TUBE_RADIAL + j;
          const c = (i + 1) * TUBE_RADIAL + nextJ;
          const d = i * TUBE_RADIAL + nextJ;
          indices.push(a, d, b, b, d, c);
        }
      }
      const g = new THREE.BufferGeometry();
      const pAttr = new THREE.BufferAttribute(positions, 3);
      pAttr.setUsage(THREE.DynamicDrawUsage);
      const nAttr = new THREE.BufferAttribute(normals, 3);
      g.setAttribute("position", pAttr);
      g.setAttribute("normal", nAttr);
      g.setIndex(indices);
      return g;
    };

    return {
      eGeo: buildLineTube(),
      bGeo: buildLineTube(),
      dummy: new THREE.Object3D(),
    };
  }, []);

  useEffect(() => {
    return () => {
      eGeo.dispose();
      bGeo.dispose();
    };
  }, [eGeo, bGeo]);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;

    const span = 4.4;
    const k = 2.85;
    const omega = 4.2;
    const thickness = 0.036;

    const eMesh = eWaveMeshRef.current;
    const bMesh = bWaveMeshRef.current;
    if (eMesh && bMesh) {
      const ePosAttr = eMesh.geometry.getAttribute("position") as THREE.BufferAttribute;
      const bPosAttr = bMesh.geometry.getAttribute("position") as THREE.BufferAttribute;
      const eArr = ePosAttr.array as Float32Array;
      const bArr = bPosAttr.array as Float32Array;

      for (let i = 0; i <= WAVE_SAMPLES; i++) {
        const u = i / WAVE_SAMPLES;
        const x = (u - 0.5) * span;
        const sinU = Math.max(0.02, Math.sin(u * Math.PI));
        const env = Math.pow(Math.sin(u * Math.PI), 0.55);
        const dEnv =
          0.55 * Math.pow(sinU, -0.45) * Math.cos(u * Math.PI) * (Math.PI / span);
        const phase = k * x - omega * t;
        const eY = Math.sin(phase) * 0.92 * env;
        const bZ = Math.sin(phase) * 0.92 * env;
        const dAmp = (k * Math.cos(phase) * env + Math.sin(phase) * dEnv) * 0.92;
        const invLen = 1 / Math.hypot(1, dAmp);
        const nx = -dAmp * invLen;
        const ny = invLen;

        for (let j = 0; j < TUBE_RADIAL; j++) {
          const theta = (j / TUBE_RADIAL) * Math.PI * 2;
          const ct = Math.cos(theta);
          const st = Math.sin(theta);
          const idx = (i * TUBE_RADIAL + j) * 3;

          eArr[idx] = x + nx * ct * thickness;
          eArr[idx + 1] = eY + ny * ct * thickness;
          eArr[idx + 2] = st * thickness;

          bArr[idx] = x + nx * ct * thickness;
          bArr[idx + 1] = st * thickness;
          bArr[idx + 2] = bZ + ny * ct * thickness;
        }
      }

      ePosAttr.needsUpdate = true;
      bPosAttr.needsUpdate = true;
      eMesh.geometry.computeVertexNormals();
      bMesh.geometry.computeVertexNormals();
    }

    if (eRungMeshRef.current && bRungMeshRef.current) {
      for (let r = 0; r < RUNG_COUNT; r++) {
        const u = (r + 0.5) / RUNG_COUNT;
        const x = (u - 0.5) * span;
        const env = Math.pow(Math.sin(u * Math.PI), 0.55);
        const val = Math.sin(k * x - omega * t) * 0.92 * env;

        dummy.position.set(x, val * 0.5, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, Math.max(0.02, Math.abs(val)), 1);
        dummy.updateMatrix();
        eRungMeshRef.current.setMatrixAt(r, dummy.matrix);

        dummy.position.set(x, 0, val * 0.5);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.scale.set(1, Math.max(0.02, Math.abs(val)), 1);
        dummy.updateMatrix();
        bRungMeshRef.current.setMatrixAt(r, dummy.matrix);
      }
      eRungMeshRef.current.instanceMatrix.needsUpdate = true;
      bRungMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (helicityRingRef.current) {
      helicityRingRef.current.rotation.x = t * 2.4 * (antimatter ? -1 : 1);
    }
  });

  return (
    <group>
      {/* Massless light quantum core */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#fde047"
          emissiveIntensity={1.8}
        />
      </mesh>
      <FresnelHalo radius={0.56} color="#38bdf8" intensity={1.7} />

      {/* Propagation axis */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 4.6, 8]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.35} />
      </mesh>

      {/* Transverse E-field wave */}
      <mesh ref={eWaveMeshRef} geometry={eGeo} frustumCulled={false}>
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Orthogonal B-field wave */}
      <mesh ref={bWaveMeshRef} geometry={bGeo} frustumCulled={false}>
        <meshStandardMaterial
          color="#fb7185"
          emissive="#f59e0b"
          emissiveIntensity={1.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Field vector rungs */}
      <instancedMesh ref={eRungMeshRef} args={[undefined, undefined, RUNG_COUNT]} visible={showField} frustumCulled={false}>
        <cylinderGeometry args={[0.011, 0.011, 1, 6]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.45} />
      </instancedMesh>
      <instancedMesh ref={bRungMeshRef} args={[undefined, undefined, RUNG_COUNT]} visible={showField} frustumCulled={false}>
        <cylinderGeometry args={[0.011, 0.011, 1, 6]} />
        <meshBasicMaterial color="#fb7185" transparent opacity={0.45} />
      </instancedMesh>

      {/* Circular polarization ring */}
      <mesh ref={helicityRingRef} rotation={[0, Math.PI / 2, 0]} visible={showField}>
        <torusGeometry args={[0.92, 0.014, 10, 48]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.35} />
      </mesh>

      {showSpin && (
        <SpinVector3D
          spinNum={particle.spinNum}
          color="#38bdf8"
          accentColor="#fde047"
          antimatter={antimatter}
          playing={playing}
          speed={speed}
          scale={0.9}
          axis="x"
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={160}
          radius={2.15}
          color="#38bdf8"
          secondaryColor="#fde047"
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
        />
      )}
    </group>
  );
}

// ── Archetype 5: Gluon (8-Color QCD Vortex) ──────────────────────────────────

function GluonScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const vortexRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const simTimeRef = useRef(0);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;
    if (vortexRef.current) {
      vortexRef.current.rotation.y = t * 0.7;
      vortexRef.current.rotation.x = t * 0.35;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 1.1;
      innerRef.current.rotation.z = t * 0.5;
    }
  });

  const pairs = [
    { c1: "#ef4444", c2: "#06b6d4", rot: [0, 0, 0] as [number, number, number] },
    { c1: "#22c55e", c2: "#ec4899", rot: [Math.PI / 3, Math.PI / 4, 0] as [number, number, number] },
    { c1: "#3b82f6", c2: "#eab308", rot: [-Math.PI / 3, -Math.PI / 4, Math.PI / 3] as [number, number, number] },
  ];

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.36, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#f87171"
          emissiveIntensity={1.6}
        />
      </mesh>
      <FresnelHalo radius={0.68} color="#fb923c" intensity={1.7} />

      <group ref={vortexRef}>
        {pairs.map((p, idx) => (
          <mesh key={idx} rotation={p.rot}>
            <torusKnotGeometry args={[0.92, 0.032, 96, 12, 2, 3]} />
            <meshStandardMaterial
              color={p.c1}
              emissive={p.c2}
              emissiveIntensity={1.0}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>

      <group ref={innerRef} visible={showField}>
        {pairs.map((p, idx) => (
          <mesh key={idx} rotation={p.rot}>
            <torusGeometry args={[1.38, 0.015, 10, 64]} />
            <meshBasicMaterial color={p.c2} transparent opacity={0.48} />
          </mesh>
        ))}
      </group>

      {showSpin && (
        <SpinVector3D
          spinNum={particle.spinNum}
          color="#f87171"
          accentColor="#22c55e"
          antimatter={antimatter}
          playing={playing}
          speed={speed}
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={260}
          radius={2.15}
          color="#ef4444"
          secondaryColor="#22c55e"
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
        />
      )}
    </group>
  );
}

// ── Archetype 6: Weak Boson (Yukawa-Damped Heavy Mediator) ───────────────────

function WeakBosonScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const cageRef = useRef<THREE.Group>(null);
  const simTimeRef = useRef(0);
  const isW = particle.id === "w-boson";

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;
    if (cageRef.current) {
      cageRef.current.rotation.y = t * 0.5;
      cageRef.current.rotation.x = Math.sin(t * 0.3) * 0.25;
    }
  });

  return (
    <group>
      {/* Heavy dense plasma core */}
      <mesh>
        <sphereGeometry args={[0.56, 36, 36]} />
        <meshStandardMaterial
          color={particle.hex}
          emissive={particle.accentHex}
          emissiveIntensity={1.1}
          metalness={0.55}
          roughness={0.18}
        />
      </mesh>
      <FresnelHalo radius={0.78} color={particle.hex} intensity={1.5} />

      {/* Exponentially damped Yukawa shells */}
      {showField &&
        [1.05, 1.5, 2.05].map((r, i) => (
          <mesh key={i}>
            <sphereGeometry args={[r, 24, 24]} />
            <meshBasicMaterial
              color={particle.hex}
              wireframe={i > 0}
              transparent
              opacity={0.22 / (i + 1)}
            />
          </mesh>
        ))}

      <group ref={cageRef}>
        {isW ? (
          <>
            <mesh position={[0.45, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <torusGeometry args={[1.05, 0.025, 10, 48, Math.PI]} />
              <meshStandardMaterial
                color={antimatter ? "#fb7185" : "#38bdf8"}
                emissive={antimatter ? "#fb7185" : "#38bdf8"}
                emissiveIntensity={1.2}
              />
            </mesh>
            <mesh position={[-0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[1.05, 0.025, 10, 48, Math.PI]} />
              <meshStandardMaterial
                color={antimatter ? "#38bdf8" : "#fb7185"}
                emissive={antimatter ? "#38bdf8" : "#fb7185"}
                emissiveIntensity={1.2}
              />
            </mesh>
          </>
        ) : (
          <>
            <mesh rotation={[Math.PI / 4, 0, 0]}>
              <torusGeometry args={[1.08, 0.02, 10, 64]} />
              <meshBasicMaterial color="#fb923c" transparent opacity={0.7} />
            </mesh>
            <mesh rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
              <torusGeometry args={[1.08, 0.02, 10, 64]} />
              <meshBasicMaterial color="#f87171" transparent opacity={0.7} />
            </mesh>
          </>
        )}
      </group>

      {showField && (particle.chargeNum !== 0 || particle.bipolarCharge) && (
        <ElectricField3D
          chargeNum={particle.chargeNum}
          bipolarCharge={particle.bipolarCharge}
          antimatter={antimatter}
          radius={1.45}
          playing={playing}
          speed={speed}
        />
      )}
      {showSpin && (
        <SpinVector3D
          spinNum={particle.spinNum}
          color={particle.hex}
          accentColor={particle.accentHex}
          antimatter={antimatter}
          playing={playing}
          speed={speed}
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={220}
          radius={2.15}
          color={particle.hex}
          secondaryColor={particle.accentHex}
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
        />
      )}
    </group>
  );
}

// ── Archetype 7: Higgs Boson (3D Mexican-Hat Scalar Potential) ───────────────

const HIGGS_VERT = `
  varying float vRadius;
  varying float vHeight;
  void main() {
    vRadius = length(position.xz);
    vHeight = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const HIGGS_FRAG = `
  uniform float uTime;
  varying float vRadius;
  varying float vHeight;
  void main() {
    float ring = smoothstep(0.92, 1.0, abs(sin(vRadius * 9.0 - uTime * 1.4)));
    float trough = exp(-pow((vRadius - 1.62) * 3.0, 2.0));
    vec3 baseCol = mix(vec3(0.18, 0.11, 0.02), vec3(0.98, 0.78, 0.12), trough * 0.75 + ring * 0.35);
    float edgeFade = 1.0 - smoothstep(2.15, 2.65, vRadius);
    float alpha = (0.28 + trough * 0.42 + ring * 0.25) * edgeFade;
    gl_FragColor = vec4(baseCol * 1.25, alpha);
  }
`;

function mexicanHatY(r: number): number {
  return 0.45 * (0.22 * Math.pow(r, 4) - 1.15 * Math.pow(r, 2)) - 0.15;
}

function HiggsScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  playing,
  speed,
}: ParticleModel3DProps) {
  const orbRef = useRef<THREE.Mesh>(null);
  const waveRingRef = useRef<THREE.Mesh>(null);
  const scalarRingRef = useRef<THREE.Mesh>(null);
  const simTimeRef = useRef(0);

  const potentialGeo = useMemo(() => {
    const radialSegs = 40;
    const angularSegs = 64;
    const positions: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= radialSegs; i++) {
      const r = 0.04 + (i / radialSegs) * 2.6;
      const y = mexicanHatY(r);
      for (let j = 0; j <= angularSegs; j++) {
        const theta = (j / angularSegs) * Math.PI * 2;
        positions.push(Math.cos(theta) * r, y, Math.sin(theta) * r);
      }
    }

    const row = angularSegs + 1;
    for (let i = 0; i < radialSegs; i++) {
      for (let j = 0; j < angularSegs; j++) {
        const a = i * row + j;
        const b = (i + 1) * row + j;
        const c = (i + 1) * row + (j + 1);
        const d = i * row + (j + 1);
        indices.push(a, b, d, b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const potentialMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HIGGS_VERT,
        fragmentShader: HIGGS_FRAG,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  const potMeshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    return () => {
      potentialGeo.dispose();
      potentialMat.dispose();
    };
  }, [potentialGeo, potentialMat]);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;
    if (potMeshRef.current) {
      (potMeshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
    }

    if (orbRef.current) {
      const r = 1.62 + Math.sin(t * 3.0) * 0.16;
      const angle = t * 1.15;
      const y = mexicanHatY(r) - 0.1 + 0.25;
      orbRef.current.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    }

    if (waveRingRef.current) {
      const cycle = (t * 0.65) % 1;
      const s = 0.6 + cycle * 1.9;
      waveRingRef.current.scale.setScalar(s);
      const mat = waveRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - cycle) * 0.6;
    }

    if (scalarRingRef.current) {
      const s = 1 + Math.sin(t * 2.4) * 0.04;
      scalarRingRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* 3D Mexican-Hat scalar potential surface */}
      {showField && (
        <>
          <mesh ref={potMeshRef} geometry={potentialGeo} material={potentialMat} position={[0, -0.1, 0]} />
          <mesh geometry={potentialGeo} position={[0, -0.1, 0]}>
            <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.1} />
          </mesh>
        </>
      )}

      {/* Center peak quantum */}
      <mesh position={[0, mexicanHatY(0.04) - 0.1, 0]}>
        <sphereGeometry args={[0.16, 20, 20]} />
        <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={1.4} />
      </mesh>

      {/* Higgs excitation orbiting inside the circular vacuum trough */}
      <mesh ref={orbRef} position={[1.62, mexicanHatY(1.62) - 0.1 + 0.25, 0]}>
        <sphereGeometry args={[0.28, 28, 28]} />
        <meshStandardMaterial
          color="#fef08a"
          emissive="#facc15"
          emissiveIntensity={1.7}
          roughness={0.12}
        />
      </mesh>

      {/* Expanding isotropic scalar wave */}
      {showField && (
        <mesh ref={waveRingRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <torusGeometry args={[1, 0.018, 10, 64]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.5} />
        </mesh>
      )}

      {showSpin && (
        <mesh ref={scalarRingRef} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.82, 0]}>
          <torusGeometry args={[1.62, 0.016, 10, 72]} />
          <meshBasicMaterial color="#fde047" transparent opacity={0.52} />
        </mesh>
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={240}
          radius={2.3}
          color="#facc15"
          secondaryColor="#f59e0b"
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
        />
      )}
    </group>
  );
}

// ── Archetype 8: Baryon (3-Quark QCD Confinement + Live Gluon Flux Tubes) ────

function baryonInitialPos(i: number): [number, number, number] {
  const a = (i * Math.PI * 2) / 3;
  return [Math.cos(a) * 0.96, Math.sin(a) * 0.96 * 0.85, Math.sin(a * 2) * 0.36];
}

function BaryonScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const simTimeRef = useRef(0);
  const quarkGroupRefs = useRef<(THREE.Group | null)[]>([null, null, null]);
  const pos0Ref = useRef(new THREE.Vector3(...baryonInitialPos(0)));
  const pos1Ref = useRef(new THREE.Vector3(...baryonInitialPos(1)));
  const pos2Ref = useRef(new THREE.Vector3(...baryonInitialPos(2)));
  const posRefs = useMemo(() => [pos0Ref, pos1Ref, pos2Ref], []);

  const quarks = useMemo(() => {
    const base = particle.quarks ?? [
      { flavor: "u" as const, anti: false, color: "red" as const },
      { flavor: "u" as const, anti: false, color: "green" as const },
      { flavor: "d" as const, anti: false, color: "blue" as const },
    ];
    return base.map((q) => {
      const effectiveCol = antimatter ? flipQuarkColor(q.color) : q.color;
      return {
        ...q,
        hex: QUARK_COLOR_HEX[effectiveCol],
      };
    });
  }, [particle.quarks, antimatter]);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;

    for (let i = 0; i < 3; i++) {
      const baseAngle = (i * Math.PI * 2) / 3 + t * 0.58;
      const radial = 0.96 + Math.sin(t * 1.4 + i * 2.1) * 0.12;
      const x = Math.cos(baseAngle) * radial;
      const y = Math.sin(baseAngle) * radial * 0.85 + Math.sin(t * 1.7 + i * 1.4) * 0.18;
      const z = Math.sin(baseAngle * 2 + t * 0.9) * 0.36;

      posRefs[i].current.set(x, y, z);
      const qGroup = quarkGroupRefs.current[i];
      if (qGroup) qGroup.position.copy(posRefs[i].current);
    }
  });

  const isResonance = particle.spinNum >= 1.5;

  return (
    <group>
      {/* Translucent QCD confinement bag */}
      {showField && (
        <>
          <FresnelHalo radius={1.78} color={particle.hex} intensity={1.3} opacity={0.45} />
          <mesh>
            <sphereGeometry args={[1.76, 32, 32]} />
            <meshBasicMaterial color={particle.hex} transparent opacity={0.04} depthWrite={false} />
          </mesh>
        </>
      )}

      {/* 3 Valence Quarks with per-quark spin vectors */}
      {quarks.map((q, i) => {
        const spinUp = isResonance ? true : i < 2;
        const spinSign = (spinUp ? 1 : -1) * (antimatter ? -1 : 1);
        return (
          <group
            key={i}
            ref={(el) => {
              quarkGroupRefs.current[i] = el;
            }}
            position={baryonInitialPos(i)}
          >
            <mesh>
              <sphereGeometry args={[0.27, 28, 28]} />
              <meshStandardMaterial
                color={q.hex}
                emissive={q.hex}
                emissiveIntensity={1.25}
                roughness={0.2}
              />
            </mesh>
            <FresnelHalo radius={0.39} color={q.hex} intensity={1.5} opacity={0.6} />

            {showSpin && (
              <group scale={[1, spinSign, 1]}>
                <mesh position={[0, 0.25, 0]}>
                  <cylinderGeometry args={[0.014, 0.014, 0.6, 8]} />
                  <meshBasicMaterial color="#f8fafc" />
                </mesh>
                <mesh position={[0, 0.57, 0]}>
                  <coneGeometry args={[0.055, 0.14, 10]} />
                  <meshBasicMaterial color="#f8fafc" />
                </mesh>
              </group>
            )}
          </group>
        );
      })}

      {/* 3 Live Dynamic QCD Gluon Flux Tubes */}
      <DynamicGluonTube
        startRef={pos0Ref}
        endRef={pos1Ref}
        colorA={quarks[0].hex}
        colorB={quarks[1].hex}
        phaseOffset={0}
        playing={playing}
        speed={speed}
      />
      <DynamicGluonTube
        startRef={pos1Ref}
        endRef={pos2Ref}
        colorA={quarks[1].hex}
        colorB={quarks[2].hex}
        phaseOffset={2.1}
        playing={playing}
        speed={speed}
      />
      <DynamicGluonTube
        startRef={pos2Ref}
        endRef={pos0Ref}
        colorA={quarks[2].hex}
        colorB={quarks[0].hex}
        phaseOffset={4.2}
        playing={playing}
        speed={speed}
      />

      {showField && particle.chargeNum !== 0 && (
        <ElectricField3D
          chargeNum={particle.chargeNum}
          antimatter={antimatter}
          radius={2.05}
          playing={playing}
          speed={speed}
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={220}
          radius={1.58}
          color={particle.hex}
          secondaryColor="#fbbf24"
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
          opacity={0.58}
        />
      )}
    </group>
  );
}

// ── Archetype 9: Meson (Quark–Antiquark QCD Dipole) ──────────────────────────

function MesonScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const simTimeRef = useRef(0);
  const q0Ref = useRef<THREE.Mesh>(null);
  const q1Ref = useRef<THREE.Mesh>(null);
  const mat0Ref = useRef<THREE.MeshStandardMaterial>(null);
  const mat1Ref = useRef<THREE.MeshStandardMaterial>(null);
  const pos0Ref = useRef(new THREE.Vector3(0.96, 0, 0));
  const pos1Ref = useRef(new THREE.Vector3(-0.96, 0, 0));

  const quarks = useMemo(() => {
    const base = particle.quarks ?? [
      { flavor: "u" as const, anti: false, color: "red" as const },
      { flavor: "d" as const, anti: true, color: "antired" as const },
    ];
    return base.map((q) => {
      const eff = antimatter ? flipQuarkColor(q.color) : q.color;
      return QUARK_COLOR_HEX[eff];
    });
  }, [particle.quarks, antimatter]);

  const superColors = useMemo(
    () => [
      new THREE.Color("#ef4444"),
      new THREE.Color("#22c55e"),
      new THREE.Color("#3b82f6"),
    ],
    [],
  );
  const superAntiColors = useMemo(
    () => [
      new THREE.Color("#06b6d4"),
      new THREE.Color("#ec4899"),
      new THREE.Color("#eab308"),
    ],
    [],
  );
  const scratchA = useMemo(() => new THREE.Color(), []);
  const scratchB = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;

    const angle = t * 0.72;
    const r = 0.96 + Math.sin(t * 2.0) * 0.14;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const y = Math.sin(t * 1.3) * 0.24;

    pos0Ref.current.set(x, y, z);
    pos1Ref.current.set(-x, -y, -z);

    if (q0Ref.current) q0Ref.current.position.copy(pos0Ref.current);
    if (q1Ref.current) q1Ref.current.position.copy(pos1Ref.current);

    if (particle.isSuperposition && mat0Ref.current && mat1Ref.current) {
      const cycle = (t * 0.55) % 3;
      const i0 = Math.floor(cycle);
      const i1 = (i0 + 1) % 3;
      const frac = cycle - i0;
      scratchA.lerpColors(superColors[i0], superColors[i1], frac);
      scratchB.lerpColors(superAntiColors[i0], superAntiColors[i1], frac);
      mat0Ref.current.color.copy(scratchA);
      mat0Ref.current.emissive.copy(scratchA);
      mat1Ref.current.color.copy(scratchB);
      mat1Ref.current.emissive.copy(scratchB);
    }
  });

  return (
    <group>
      {showField && (
        <>
          <FresnelHalo radius={1.68} color={particle.hex} intensity={1.3} opacity={0.45} />
          <mesh>
            <sphereGeometry args={[1.66, 32, 32]} />
            <meshBasicMaterial color={particle.hex} transparent opacity={0.04} depthWrite={false} />
          </mesh>
        </>
      )}

      <mesh ref={q0Ref} position={[0.96, 0, 0]}>
        <sphereGeometry args={[0.28, 28, 28]} />
        <meshStandardMaterial
          ref={mat0Ref}
          color={quarks[0]}
          emissive={quarks[0]}
          emissiveIntensity={1.3}
          roughness={0.2}
        />
      </mesh>
      <mesh ref={q1Ref} position={[-0.96, 0, 0]}>
        <sphereGeometry args={[0.28, 28, 28]} />
        <meshStandardMaterial
          ref={mat1Ref}
          color={quarks[1]}
          emissive={quarks[1]}
          emissiveIntensity={1.3}
          roughness={0.2}
        />
      </mesh>

      {/* Dual-strand QCD flux tube */}
      <DynamicGluonTube
        startRef={pos0Ref}
        endRef={pos1Ref}
        colorA={quarks[0]}
        colorB={quarks[1]}
        phaseOffset={0}
        playing={playing}
        speed={speed}
        amplitude={0.16}
        thickness={0.045}
      />
      <DynamicGluonTube
        startRef={pos1Ref}
        endRef={pos0Ref}
        colorA={quarks[1]}
        colorB={quarks[0]}
        phaseOffset={Math.PI}
        playing={playing}
        speed={speed}
        amplitude={0.12}
        thickness={0.028}
      />

      {showField && particle.chargeNum !== 0 && (
        <ElectricField3D
          chargeNum={particle.chargeNum}
          antimatter={antimatter}
          radius={1.95}
          playing={playing}
          speed={speed}
        />
      )}
      {showSpin && (
        <SpinVector3D
          spinNum={particle.spinNum}
          color={particle.hex}
          accentColor={particle.accentHex}
          antimatter={antimatter}
          playing={playing}
          speed={speed}
          scale={1.35}
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={200}
          radius={1.5}
          color={particle.hex}
          secondaryColor={particle.accentHex}
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
          opacity={0.55}
        />
      )}
    </group>
  );
}

// ── Archetype 10: Scalar SUSY Polyhedron (Squark / Slepton) ──────────────────

function ScalarSusyScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const outerCageRef = useRef<THREE.Group>(null);
  const innerCageRef = useRef<THREE.Group>(null);
  const simTimeRef = useRef(0);
  const isSquark = particle.visualArchetype === "squark";

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;
    if (outerCageRef.current) {
      outerCageRef.current.rotation.y = t * 0.45;
      outerCageRef.current.rotation.x = t * 0.22;
    }
    if (innerCageRef.current) {
      innerCageRef.current.rotation.y = -t * 0.65;
      innerCageRef.current.rotation.z = t * 0.3;
    }
  });

  const triadCols = antimatter
    ? [QUARK_COLOR_HEX.antired, QUARK_COLOR_HEX.antigreen, QUARK_COLOR_HEX.antiblue]
    : [QUARK_COLOR_HEX.red, QUARK_COLOR_HEX.green, QUARK_COLOR_HEX.blue];

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          color={particle.hex}
          emissive={particle.accentHex}
          emissiveIntensity={1.2}
          roughness={0.15}
        />
      </mesh>
      <FresnelHalo radius={0.72} color={particle.hex} intensity={1.6} />

      <group ref={outerCageRef}>
        <mesh>
          <icosahedronGeometry args={[1.18, 0]} />
          <meshBasicMaterial color={particle.hex} wireframe transparent opacity={0.55} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.16, 0]} />
          <meshStandardMaterial
            color={particle.hex}
            emissive={particle.accentHex}
            emissiveIntensity={0.4}
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>
      </group>

      <group ref={innerCageRef}>
        {showField && (
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[1.45, 0.015, 10, 64]} />
            <meshBasicMaterial color={particle.accentHex} transparent opacity={0.5} />
          </mesh>
        )}
        {isSquark &&
          [0, 1, 2].map((i) => {
            const ang = (i * Math.PI * 2) / 3;
            return (
              <mesh key={i} position={[Math.cos(ang) * 0.82, Math.sin(ang) * 0.82, 0]}>
                <sphereGeometry args={[0.1, 14, 14]} />
                <meshStandardMaterial color={triadCols[i]} emissive={triadCols[i]} emissiveIntensity={1.6} />
              </mesh>
            );
          })}
      </group>

      {showField && particle.chargeNum !== 0 && (
        <ElectricField3D
          chargeNum={particle.chargeNum}
          antimatter={antimatter}
          radius={1.58}
          playing={playing}
          speed={speed}
        />
      )}
      {showSpin && (
        <SpinVector3D
          spinNum={particle.spinNum}
          color={particle.hex}
          accentColor={particle.accentHex}
          antimatter={antimatter}
          playing={playing}
          speed={speed}
          scale={1.15}
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={210}
          radius={2.15}
          color={particle.hex}
          secondaryColor={particle.accentHex}
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
        />
      )}
    </group>
  );
}

// ── Archetype 11: Fermion / Spin-3/2 SUSY (Gaugino / Higgsino / Gravitino) ─

function FermionSusyScene3D({
  particle,
  showField,
  showSpin,
  showCloud,
  antimatter,
  playing,
  speed,
}: ParticleModel3DProps) {
  const frameRef = useRef<THREE.Group>(null);
  const quadPlusRef = useRef<THREE.Mesh>(null);
  const quadCrossRef = useRef<THREE.Mesh>(null);
  const simTimeRef = useRef(0);
  const isGravitino = particle.visualArchetype === "gravitino";

  useFrame((_, delta) => {
    if (playing) simTimeRef.current += delta * speed;
    const t = simTimeRef.current;

    if (frameRef.current) {
      frameRef.current.rotation.y = t * 0.55;
      frameRef.current.rotation.z = Math.sin(t * 0.35) * 0.22;
    }

    if (isGravitino && quadPlusRef.current && quadCrossRef.current) {
      const strain = Math.sin(t * 2.4) * 0.22;
      quadPlusRef.current.scale.set(1 + strain, 1 - strain, 1);
      quadCrossRef.current.scale.set(1 - strain, 1 + strain, 1);
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          color={particle.hex}
          emissive={particle.accentHex}
          emissiveIntensity={1.25}
          roughness={0.18}
        />
      </mesh>
      <FresnelHalo radius={0.72} color={particle.hex} intensity={1.65} />

      <group ref={frameRef}>
        <mesh>
          <octahedronGeometry args={[1.18, 0]} />
          <meshBasicMaterial color={particle.hex} wireframe transparent opacity={0.62} />
        </mesh>
        {showField && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.38, 0.015, 10, 64]} />
            <meshBasicMaterial color={particle.accentHex} transparent opacity={0.45} />
          </mesh>
        )}
      </group>

      {isGravitino && showField && (
        <group>
          <mesh ref={quadPlusRef} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.55, 0.018, 10, 64]} />
            <meshBasicMaterial color="#818cf8" transparent opacity={0.65} />
          </mesh>
          <mesh ref={quadCrossRef} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
            <torusGeometry args={[1.55, 0.018, 10, 64]} />
            <meshBasicMaterial color="#c084fc" transparent opacity={0.65} />
          </mesh>
        </group>
      )}

      {showField && (particle.chargeNum !== 0 || particle.bipolarCharge) && (
        <ElectricField3D
          chargeNum={particle.chargeNum}
          bipolarCharge={particle.bipolarCharge}
          antimatter={antimatter}
          radius={1.5}
          playing={playing}
          speed={speed}
        />
      )}
      {showSpin && (
        <SpinVector3D
          spinNum={particle.spinNum}
          color={particle.hex}
          accentColor={particle.accentHex}
          antimatter={antimatter}
          playing={playing}
          speed={speed}
        />
      )}
      {showCloud && (
        <QuantumCloudPoints
          count={220}
          radius={2.2}
          color={particle.hex}
          secondaryColor={particle.accentHex}
          playing={playing}
          speed={speed}
          seed={hashString(particle.id)}
        />
      )}
    </group>
  );
}

// ── Subtle Telemetry Stage Floor ─────────────────────────────────────────────

function QuantumStageFloor({ color }: { color: string }) {
  return (
    <group position={[0, -2.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[1.1, 1.9, 2.75].map((r, i) => (
        <mesh key={i}>
          <ringGeometry args={[r, r + 0.015, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.16 - i * 0.04}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Camera Controller ────────────────────────────────────────────────────────

const CAMERA_TARGETS: Record<CameraPreset, THREE.Vector3> = {
  angled: new THREE.Vector3(0, 1.5, 5.2),
  top: new THREE.Vector3(0.01, 5.6, 0.2),
  side: new THREE.Vector3(5.4, 0.25, 0),
};

function CameraController({
  preset,
  signal,
  animatingRef,
  controlsRef,
}: {
  preset: CameraPreset;
  signal: number;
  animatingRef: React.RefObject<boolean>;
  controlsRef: React.RefObject<ComponentRef<typeof OrbitControls> | null>;
}) {
  const { camera } = useThree();

  useEffect(() => {
    animatingRef.current = true;
  }, [preset, signal, animatingRef]);

  useFrame(() => {
    if (!animatingRef.current) return;
    const target = CAMERA_TARGETS[preset];
    camera.position.lerp(target, 0.12);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
    if (camera.position.distanceTo(target) < 0.025) {
      camera.position.copy(target);
      animatingRef.current = false;
    }
  });

  return null;
}

// ── Archetype Dispatcher ─────────────────────────────────────────────────────

function ParticleSceneDispatcher(props: ParticleModel3DProps) {
  switch (props.particle.visualArchetype) {
    case "quark":
      return <QuarkScene3D {...props} />;
    case "lepton_charged":
      return <ChargedLeptonScene3D {...props} />;
    case "neutrino":
      return <NeutrinoScene3D {...props} />;
    case "photon":
      return <PhotonScene3D {...props} />;
    case "gluon":
      return <GluonScene3D {...props} />;
    case "weak_boson":
      return <WeakBosonScene3D {...props} />;
    case "higgs":
      return <HiggsScene3D {...props} />;
    case "baryon":
      return <BaryonScene3D {...props} />;
    case "meson":
      return <MesonScene3D {...props} />;
    case "squark":
    case "slepton":
      return <ScalarSusyScene3D {...props} />;
    case "gaugino":
    case "higgsino":
    case "gravitino":
      return <FermionSusyScene3D {...props} />;
  }
}

// ── Main Exported 3D Canvas Component ────────────────────────────────────────

export function ParticleModel3D(props: ParticleModel3DProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls> | null>(null);
  const animatingRef = useRef(false);

  return (
    <WebGLErrorBoundary particle={props.particle} antimatter={props.antimatter}>
      <Canvas
        camera={{ position: [0, 1.5, 5.2], fov: 44 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ width: "100%", height: "100%", cursor: "grab" }}
      >
        <ambientLight intensity={0.45} />
        <pointLight position={[6, 6, 6]} intensity={1.35} color="#f8fafc" />
        <pointLight position={[-6, -4, -5]} intensity={0.75} color={props.particle.hex} />
        <pointLight position={[0, -5, 4]} intensity={0.45} color={props.particle.accentHex} />

        <CameraController
          preset={props.cameraPreset}
          signal={props.cameraSignal ?? 0}
          animatingRef={animatingRef}
          controlsRef={controlsRef}
        />

        <Suspense fallback={null}>
          <QuantumStageFloor color={props.particle.hex} />
          <ParticleSceneDispatcher key={props.particle.id} {...props} />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={2.8}
          maxDistance={9.5}
          enableDamping
          dampingFactor={0.06}
          onStart={() => {
            animatingRef.current = false;
          }}
        />
      </Canvas>
    </WebGLErrorBoundary>
  );
}
