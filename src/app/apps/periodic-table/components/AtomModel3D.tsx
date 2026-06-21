"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";
import type { Element } from "../lib/types";

/* ---------- Nucleus (glowing center sphere) ---------- */
function Nucleus({ color, size = 0.35 }: { color: string; size?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.04;
      meshRef.current.scale.setScalar(s);
    }
    if (glowRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 1.5) * 0.08;
      glowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
      {/* Inner glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.6, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[size * 2.5, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.04} />
      </mesh>
    </group>
  );
}

/* ---------- Single orbiting electron ---------- */
function Electron({
  radius,
  speed,
  offset,
  tiltX,
  tiltZ,
  color,
}: {
  radius: number;
  speed: number;
  offset: number;
  tiltX: number;
  tiltZ: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    if (ref.current) {
      const x = Math.cos(t) * radius;
      const y = Math.sin(t) * radius;
      // Apply tilt rotation
      const cosX = Math.cos(tiltX);
      const sinX = Math.sin(tiltX);
      const cosZ = Math.cos(tiltZ);
      const sinZ = Math.sin(tiltZ);

      const y1 = y * cosX;
      const z1 = y * sinX;
      const x2 = x * cosZ - y1 * sinZ;
      const y2 = x * sinZ + y1 * cosZ;

      ref.current.position.set(x2, y2, z1);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.06, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        metalness={0.5}
        roughness={0.1}
      />
    </mesh>
  );
}

/* ---------- Orbital ring (visual guide) ---------- */
function OrbitalRing({
  radius,
  tiltX,
  tiltZ,
  color,
}: {
  radius: number;
  tiltX: number;
  tiltZ: number;
  color: string;
}) {
  const lineRef = useRef<THREE.LineLoop>(null);

  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  const material = useMemo(
    () => new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.15 }),
    [color]
  );

  return (
    <group rotation={[tiltX, 0, tiltZ]}>
      <primitive ref={lineRef} object={new THREE.LineLoop(geometry, material)} />
    </group>
  );
}

/* ---------- Single shell (ring + electrons) ---------- */
function ElectronShell({
  shellIndex,
  electronCount,
  radius,
  color,
}: {
  shellIndex: number;
  electronCount: number;
  radius: number;
  color: string;
}) {
  // Create multiple orbital planes for visual richness
  const planes = useMemo(() => {
    const result: { tiltX: number; tiltZ: number; electrons: number }[] = [];
    if (electronCount <= 2) {
      result.push({ tiltX: 0, tiltZ: 0, electrons: electronCount });
    } else if (electronCount <= 8) {
      const half = Math.ceil(electronCount / 2);
      result.push({ tiltX: 0, tiltZ: 0, electrons: half });
      result.push({
        tiltX: Math.PI / 3 + shellIndex * 0.2,
        tiltZ: Math.PI / 4,
        electrons: electronCount - half,
      });
    } else {
      const third = Math.ceil(electronCount / 3);
      const remaining = electronCount - third;
      const second = Math.ceil(remaining / 2);
      result.push({ tiltX: 0, tiltZ: 0, electrons: third });
      result.push({
        tiltX: Math.PI / 3 + shellIndex * 0.15,
        tiltZ: Math.PI / 5,
        electrons: second,
      });
      result.push({
        tiltX: Math.PI / 2 + shellIndex * 0.1,
        tiltZ: -Math.PI / 4,
        electrons: remaining - second,
      });
    }
    return result;
  }, [electronCount, shellIndex]);

  const baseSpeed = 1.2 - shellIndex * 0.12;

  return (
    <group>
      {planes.map((plane, pi) => (
        <group key={pi}>
          <OrbitalRing
            radius={radius}
            tiltX={plane.tiltX}
            tiltZ={plane.tiltZ}
            color={color}
          />
          {Array.from({ length: plane.electrons }).map((_, ei) => (
            <Electron
              key={ei}
              radius={radius}
              speed={baseSpeed * (0.8 + pi * 0.3)}
              offset={(ei / plane.electrons) * Math.PI * 2 + pi * 0.5}
              tiltX={plane.tiltX}
              tiltZ={plane.tiltZ}
              color={color}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

/* ---------- Full atom scene ---------- */
function AtomScene({ element }: { element: Element }) {
  const groupRef = useRef<THREE.Group>(null);

  // Auto-rotate slowly when not being interacted with
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  const shellRadii = useMemo(() => {
    const baseRadius = 1.0;
    const increment = 0.7;
    return element.shells.map((_, i) => baseRadius + i * increment);
  }, [element.shells]);

  // Shell colors — gradient from warm core to cool outer
  const shellColors = useMemo(() => {
    const palette = [
      "#60a5fa", // blue-400
      "#34d399", // emerald-400
      "#a78bfa", // violet-400
      "#f472b6", // pink-400
      "#fbbf24", // amber-400
      "#fb923c", // orange-400
      "#22d3ee", // cyan-400
    ];
    return element.shells.map((_, i) => palette[i % palette.length]);
  }, [element.shells]);

  return (
    <group ref={groupRef}>
      <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <Nucleus color={element.cpk_hex || "#60a5fa"} />
      </Float>

      {element.shells.map((electronCount, shellIndex) => (
        <ElectronShell
          key={shellIndex}
          shellIndex={shellIndex}
          electronCount={electronCount}
          radius={shellRadii[shellIndex]}
          color={shellColors[shellIndex]}
        />
      ))}
    </group>
  );
}

/* ---------- Loading fallback ---------- */
function LoadingAtom() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#60a5fa" wireframe />
    </mesh>
  );
}

/* ---------- Main exported component ---------- */
export function AtomModel3D({
  element,
  className = "",
}: {
  element: Element;
  className?: string;
}) {
  return (
    <div className={`w-full h-full min-h-[300px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#e0e7ff" />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#c4b5fd" />
        <pointLight position={[0, 0, 5]} intensity={0.3} color="#93c5fd" />

        <Suspense fallback={<LoadingAtom />}>
          <AtomScene element={element} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={12}
          autoRotate={false}
          dampingFactor={0.05}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
