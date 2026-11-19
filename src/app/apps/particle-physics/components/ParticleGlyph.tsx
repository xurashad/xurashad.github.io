"use client";

import { useId } from "react";
import {
  QUARK_COLOR_HEX,
  flipQuarkColor,
  type Particle,
} from "../lib/particles";

interface Props {
  particle: Particle;
  size?: number;
  antimatter?: boolean;
  active?: boolean;
  className?: string;
}

function formatFlavorLabel(flavor: string, isAnti: boolean): string {
  return isAnti ? `${flavor}\u0304` : flavor;
}

function getArcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export function ParticleGlyph({
  particle,
  size = 84,
  antimatter = false,
  active = false,
  className = "",
}: Props) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const coreGradId = `pp-core-${uid}`;
  const haloGradId = `pp-halo-${uid}`;
  const waveGradId = `pp-wave-${uid}`;

  const primary = particle.hex;
  const accent = particle.accentHex;
  const gen = particle.generation ?? 1;
  const effectiveAnti = antimatter && !particle.selfConjugate;
  const effectiveCharge = effectiveAnti ? -particle.chargeNum : particle.chargeNum;

  const renderArchetype = () => {
    switch (particle.visualArchetype) {
      case "quark": {
        const colors = effectiveAnti
          ? [QUARK_COLOR_HEX.antired, QUARK_COLOR_HEX.antigreen, QUARK_COLOR_HEX.antiblue]
          : [QUARK_COLOR_HEX.red, QUARK_COLOR_HEX.green, QUARK_COLOR_HEX.blue];
        const tickDir = effectiveCharge >= 0 ? 1 : -1;
        return (
          <g>
            {/* Tri-color QCD ring */}
            <g className="pp-spin-slow">
              <path d={getArcPath(60, 60, 44, 6, 114)} fill="none" stroke={colors[0]} strokeWidth="3.2" strokeLinecap="round" opacity="0.9" />
              <path d={getArcPath(60, 60, 44, 126, 234)} fill="none" stroke={colors[1]} strokeWidth="3.2" strokeLinecap="round" opacity="0.9" />
              <path d={getArcPath(60, 60, 44, 246, 354)} fill="none" stroke={colors[2]} strokeWidth="3.2" strokeLinecap="round" opacity="0.9" />
            </g>

            {/* Fractional charge radial ticks */}
            {[0, 120, 240].map((deg, idx) => {
              const rad = ((deg - 90) * Math.PI) / 180;
              const r0 = tickDir > 0 ? 46 : 42;
              const r1 = tickDir > 0 ? 53 : 36;
              return (
                <line
                  key={idx}
                  x1={60 + r0 * Math.cos(rad)}
                  y1={60 + r0 * Math.sin(rad)}
                  x2={60 + r1 * Math.cos(rad)}
                  y2={60 + r1 * Math.sin(rad)}
                  stroke={accent}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              );
            })}

            {/* Generation orbital shells */}
            {Array.from({ length: gen }).map((_, i) => (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={22 + i * 7}
                fill="none"
                stroke={primary}
                strokeWidth="1.2"
                strokeDasharray={i % 2 === 0 ? "5 4" : "2 4"}
                opacity={0.45 + i * 0.15}
              />
            ))}

            {/* Glowing plasma core */}
            <g className="pp-pulse">
              <circle cx="60" cy="60" r="15" fill={`url(#${coreGradId})`} />
              <circle cx="60" cy="60" r="6" fill="#ffffff" opacity="0.85" />
            </g>
          </g>
        );
      }

      case "lepton_charged": {
        const angles = gen === 1 ? [25] : gen === 2 ? [25, -35] : [0, 58, -58];
        return (
          <g>
            {/* Quantum probability cloud */}
            <circle cx="60" cy="60" r="46" fill={`url(#${haloGradId})`} opacity="0.7" />

            {/* Tilted crossing harmonic orbitals */}
            {angles.map((angle, i) => (
              <g
                key={i}
                transform={`rotate(${angle} 60 60)`}
              >
                <g className={i % 2 === 0 ? "pp-spin-slow" : "pp-spin-rev"}>
                  <ellipse
                    cx="60"
                    cy="60"
                    rx="43"
                    ry={16 + i * 3}
                    fill="none"
                    stroke={i === 0 ? primary : accent}
                    strokeWidth="1.5"
                    opacity={0.75 - i * 0.1}
                  />
                  <circle
                    cx="103"
                    cy="60"
                    r="3.2"
                    fill={effectiveAnti ? "#f472b6" : "#a7f3d0"}
                  />
                </g>
              </g>
            ))}

            {/* Crisp radiant core */}
            <g className="pp-pulse">
              <circle cx="60" cy="60" r="13" fill={`url(#${coreGradId})`} />
              <circle cx="60" cy="60" r="5" fill="#ffffff" opacity="0.9" />
            </g>
          </g>
        );
      }

      case "neutrino": {
        return (
          <g>
            <circle cx="60" cy="60" r="42" fill={`url(#${haloGradId})`} opacity="0.45" />
            <g className="pp-spin-slow">
              <ellipse cx="60" cy="60" rx="40" ry="26" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.75" />
            </g>
            <g className="pp-spin-rev">
              <ellipse cx="60" cy="60" rx="34" ry="42" transform="rotate(35 60 60)" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.7" />
            </g>
            <g className="pp-spin-med">
              <circle cx="60" cy="60" r="24" fill="none" stroke="#a78bfa" strokeWidth="1.4" strokeDasharray="3 4" opacity="0.7" />
            </g>
            <g className="pp-pulse">
              <circle cx="60" cy="60" r="9" fill={`url(#${coreGradId})`} opacity="0.8" />
              <circle cx="60" cy="60" r="3.5" fill="#ecfeff" opacity="0.85" />
            </g>
          </g>
        );
      }

      case "photon": {
        return (
          <g>
            <circle cx="60" cy="60" r="44" fill={`url(#${haloGradId})`} opacity="0.6" />
            {/* Propagation axis & arrow */}
            <line x1="12" y1="60" x2="105" y2="60" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" opacity="0.45" />
            <polygon points="109,60 101,56 101,64" fill="#fbbf24" opacity="0.85" />

            {/* Orthogonal B-field wave */}
            <path
              d="M 14 60 Q 25.5 78, 37 60 T 60 60 T 83 60 T 106 60"
              fill="none"
              stroke="#fb7185"
              strokeWidth="2.1"
              strokeDasharray="4 2"
              className="pp-dash-flow"
              opacity="0.85"
            />
            {/* Transverse E-field sine wave */}
            <path
              d="M 14 60 Q 25.5 32, 37 60 T 60 60 T 83 60 T 106 60"
              fill="none"
              stroke={`url(#${waveGradId})`}
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeDasharray="8 4"
              className="pp-dash-flow"
            />

            {/* Central photon quantum */}
            <g className="pp-pulse">
              <circle cx="60" cy="60" r="10" fill={`url(#${coreGradId})`} />
              <circle cx="60" cy="60" r="4.5" fill="#ffffff" />
            </g>
          </g>
        );
      }

      case "gluon": {
        return (
          <g>
            <circle cx="60" cy="60" r="46" fill={`url(#${haloGradId})`} opacity="0.6" />
            <g className="pp-spin-med">
              {/* 3 intertwined color-anticolor trefoil ribbons */}
              <ellipse cx="60" cy="60" rx="40" ry="15" transform="rotate(0 60 60)" fill="none" stroke="#ef4444" strokeWidth="2.5" opacity="0.85" />
              <ellipse cx="60" cy="60" rx="40" ry="15" transform="rotate(60 60 60)" fill="none" stroke="#22c55e" strokeWidth="2.5" opacity="0.85" />
              <ellipse cx="60" cy="60" rx="40" ry="15" transform="rotate(120 60 60)" fill="none" stroke="#3b82f6" strokeWidth="2.5" opacity="0.85" />
              <ellipse cx="60" cy="60" rx="34" ry="11" transform="rotate(30 60 60)" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
              <ellipse cx="60" cy="60" rx="34" ry="11" transform="rotate(90 60 60)" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
              <ellipse cx="60" cy="60" rx="34" ry="11" transform="rotate(150 60 60)" fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
            </g>
            <g className="pp-pulse">
              <circle cx="60" cy="60" r="12" fill={`url(#${coreGradId})`} />
              <circle cx="60" cy="60" r="5" fill="#fff1f2" />
            </g>
          </g>
        );
      }

      case "weak_boson": {
        const isW = particle.id === "w-boson";
        return (
          <g>
            <circle cx="60" cy="60" r="44" fill={`url(#${haloGradId})`} opacity="0.65" />
            {/* Exponentially spaced Yukawa damping rings */}
            <circle cx="60" cy="60" r="21" fill="none" stroke={primary} strokeWidth="2" opacity="0.85" />
            <circle cx="60" cy="60" r="32" fill="none" stroke={primary} strokeWidth="1.5" strokeDasharray="6 3" opacity="0.55" />
            <circle cx="60" cy="60" r="45" fill="none" stroke={accent} strokeWidth="1.1" strokeDasharray="3 5" opacity="0.32" />

            {isW ? (
              <g className="pp-spin-slow">
                <path d={getArcPath(60, 60, 38, 15, 165)} fill="none" stroke={effectiveAnti ? "#fb7185" : "#38bdf8"} strokeWidth="2.8" strokeLinecap="round" />
                <path d={getArcPath(60, 60, 38, 195, 345)} fill="none" stroke={effectiveAnti ? "#38bdf8" : "#fb7185"} strokeWidth="2.8" strokeLinecap="round" />
              </g>
            ) : (
              <g className="pp-spin-slow">
                <polygon
                  points="60,22 93,41 93,79 60,98 27,79 27,41"
                  fill="none"
                  stroke={accent}
                  strokeWidth="1.5"
                  opacity="0.7"
                />
              </g>
            )}

            <g className="pp-pulse">
              <circle cx="60" cy="60" r="14" fill={`url(#${coreGradId})`} />
              <circle cx="60" cy="60" r="5.5" fill="#ffffff" opacity="0.9" />
            </g>
          </g>
        );
      }

      case "higgs": {
        return (
          <g>
            <circle cx="60" cy="60" r="48" fill={`url(#${haloGradId})`} opacity="0.7" />
            {/* Mexican-hat equipotential contours */}
            <circle cx="60" cy="60" r="46" fill="none" stroke="#f59e0b" strokeWidth="1.2" opacity="0.35" />
            <circle cx="60" cy="60" r="36" fill="none" stroke="#facc15" strokeWidth="2.6" opacity="0.85" />
            <circle cx="60" cy="60" r="27" fill="none" stroke="#fde047" strokeWidth="1.3" strokeDasharray="5 3" opacity="0.65" />
            <circle cx="60" cy="60" r="19" fill="none" stroke="#f59e0b" strokeWidth="1.1" opacity="0.45" />

            {/* Vacuum-trough excitation bead */}
            <g className="pp-spin-med">
              <circle cx="60" cy="24" r="4.2" fill="#fef08a" />
              <circle cx="60" cy="96" r="2.8" fill="#f59e0b" opacity="0.7" />
            </g>

            {/* Isotropic spin-0 scalar center peak */}
            <g className="pp-pulse">
              <circle cx="60" cy="60" r="13" fill={`url(#${coreGradId})`} />
              <circle cx="60" cy="60" r="5" fill="#fefce8" />
            </g>
          </g>
        );
      }

      case "baryon": {
        const quarks = particle.quarks ?? [
          { flavor: "u" as const, anti: false, color: "red" as const },
          { flavor: "u" as const, anti: false, color: "green" as const },
          { flavor: "d" as const, anti: false, color: "blue" as const },
        ];
        const coords = [
          { x: 60, y: 29 },
          { x: 33, y: 76 },
          { x: 87, y: 76 },
        ];
        const qColors = quarks.map((q) =>
          QUARK_COLOR_HEX[effectiveAnti ? flipQuarkColor(q.color) : q.color],
        );

        return (
          <g>
            <circle cx="60" cy="60" r="48" fill={`url(#${haloGradId})`} opacity="0.55" />
            {/* QCD confinement bag */}
            <circle cx="60" cy="60" r="46" fill="rgba(251,146,60,0.06)" stroke={primary} strokeWidth="1.6" opacity="0.65" />

            {/* Spin-3/2 resonance halo */}
            {particle.spinNum >= 1.5 && (
              <circle cx="60" cy="60" r="52" fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="4 3" className="pp-spin-slow" opacity="0.8" />
            )}

            {/* Subtle sea-quark fluctuations */}
            <circle cx="48" cy="54" r="1.4" fill="#fdba74" opacity="0.45" />
            <circle cx="72" cy="56" r="1.4" fill="#fdba74" opacity="0.45" />
            <circle cx="60" cy="68" r="1.6" fill="#fed7aa" opacity="0.5" />

            {/* 3 wavy gluon flux strings connecting the valence quarks */}
            <path
              d="M 60 29 Q 38 45, 45 55 T 33 76"
              fill="none"
              stroke="#fb923c"
              strokeWidth="2"
              strokeDasharray="5 3"
              className="pp-dash-flow"
              opacity="0.85"
            />
            <path
              d="M 33 76 Q 55 86, 60 74 T 87 76"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
              strokeDasharray="5 3"
              className="pp-dash-flow"
              opacity="0.85"
            />
            <path
              d="M 87 76 Q 82 52, 74 50 T 60 29"
              fill="none"
              stroke="#f97316"
              strokeWidth="2"
              strokeDasharray="5 3"
              className="pp-dash-flow"
              opacity="0.85"
            />

            {/* 3 valence quark orbs */}
            {quarks.map((q, i) => {
              const c = coords[i];
              const qCol = qColors[i];
              const isAntiQ = effectiveAnti ? !q.anti : q.anti;
              return (
                <g key={i}>
                  <circle cx={c.x} cy={c.y} r="13.5" fill={qCol} opacity="0.24" />
                  <circle cx={c.x} cy={c.y} r="10.5" fill="#090d1e" stroke={qCol} strokeWidth="2.2" />
                  <text
                    x={c.x}
                    y={c.y + 3.5}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {formatFlavorLabel(q.flavor, isAntiQ)}
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      case "meson": {
        const quarks = particle.quarks ?? [
          { flavor: "u" as const, anti: false, color: "red" as const },
          { flavor: "d" as const, anti: true, color: "antired" as const },
        ];
        const q0 = quarks[0];
        const q1 = quarks[1] ?? quarks[0];
        const col0 = QUARK_COLOR_HEX[effectiveAnti ? flipQuarkColor(q0.color) : q0.color];
        const col1 = QUARK_COLOR_HEX[effectiveAnti ? flipQuarkColor(q1.color) : q1.color];
        const anti0 = effectiveAnti ? !q0.anti : q0.anti;
        const anti1 = effectiveAnti ? !q1.anti : q1.anti;

        return (
          <g>
            <circle cx="60" cy="60" r="48" fill={`url(#${haloGradId})`} opacity="0.55" />
            <circle cx="60" cy="60" r="45" fill="rgba(244,114,182,0.06)" stroke={primary} strokeWidth="1.6" opacity="0.65" />

            {/* Spin-1 vector meson ring */}
            {particle.spinNum >= 1 && (
              <circle cx="60" cy="60" r="51" fill="none" stroke="#38bdf8" strokeWidth="1.4" strokeDasharray="6 3" className="pp-spin-slow" opacity="0.75" />
            )}

            {/* Double wavy gluon flux tube */}
            <path
              d="M 33 60 Q 46.5 47, 60 60 T 87 60"
              fill="none"
              stroke="#f472b6"
              strokeWidth="2.3"
              strokeDasharray="6 2"
              className="pp-dash-flow"
            />
            <path
              d="M 33 60 Q 46.5 73, 60 60 T 87 60"
              fill="none"
              stroke="#fb7185"
              strokeWidth="1.8"
              strokeDasharray="4 4"
              className="pp-dash-flow"
              opacity="0.75"
            />

            {/* Left quark */}
            <circle cx="33" cy="60" r="14" fill={col0} opacity="0.22" />
            <circle cx="33" cy="60" r="11" fill="#090d1e" stroke={col0} strokeWidth="2.2" />
            <text x="33" y="63.5" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="700" fontFamily="monospace">
              {particle.isSuperposition ? "q" : formatFlavorLabel(q0.flavor, anti0)}
            </text>

            {/* Right antiquark */}
            <circle cx="87" cy="60" r="14" fill={col1} opacity="0.22" />
            <circle cx="87" cy="60" r="11" fill="#090d1e" stroke={col1} strokeWidth="2.2" />
            <text x="87" y="63.5" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="700" fontFamily="monospace">
              {particle.isSuperposition ? "q\u0304" : formatFlavorLabel(q1.flavor, anti1)}
            </text>
          </g>
        );
      }

      case "squark":
      case "slepton": {
        const isSquark = particle.visualArchetype === "squark";
        const triadColors = effectiveAnti
          ? [QUARK_COLOR_HEX.antired, QUARK_COLOR_HEX.antigreen, QUARK_COLOR_HEX.antiblue]
          : [QUARK_COLOR_HEX.red, QUARK_COLOR_HEX.green, QUARK_COLOR_HEX.blue];
        return (
          <g>
            <circle cx="60" cy="60" r="46" fill={`url(#${haloGradId})`} opacity="0.6" />
            {/* Outer octagonal SUSY mirror cage */}
            <g className="pp-spin-slow">
              <polygon
                points="60,14 92.5,27.5 106,60 92.5,92.5 60,106 27.5,92.5 14,60 27.5,27.5"
                fill="none"
                stroke={primary}
                strokeWidth="1.8"
                opacity="0.85"
              />
            </g>
            {/* Counter-rotating inner hexagon */}
            <g className="pp-spin-rev">
              <polygon
                points="60,26 89.4,43 89.4,77 60,94 30.6,77 30.6,43"
                fill="none"
                stroke={accent}
                strokeWidth="1.5"
                strokeDasharray="5 3"
                opacity="0.8"
              />
              {isSquark &&
                [
                  { cx: 60, cy: 26 },
                  { cx: 89.4, cy: 77 },
                  { cx: 30.6, cy: 77 },
                ].map((pt, i) => (
                  <circle key={i} cx={pt.cx} cy={pt.cy} r="3.2" fill={triadColors[i]} />
                ))}
            </g>
            {/* Spin-0 scalar luminous orb */}
            <g className="pp-pulse">
              <circle cx="60" cy="60" r="13" fill={`url(#${coreGradId})`} />
              <circle cx="60" cy="60" r="5" fill="#f5f3ff" />
            </g>
          </g>
        );
      }

      case "gaugino":
      case "higgsino": {
        return (
          <g>
            <circle cx="60" cy="60" r="46" fill={`url(#${haloGradId})`} opacity="0.65" />
            {/* Fermionic spin axis */}
            <line x1="60" y1="12" x2="60" y2="108" stroke={accent} strokeWidth="1.4" strokeDasharray="3 3" opacity="0.6" />
            <polygon points="60,10 56,18 64,18" fill={accent} opacity="0.85" />

            {/* Star-diamond SUSY cage */}
            <g className="pp-spin-slow">
              <polygon points="60,18 102,60 60,102 18,60" fill="none" stroke={primary} strokeWidth="1.8" opacity="0.85" />
            </g>
            <g className="pp-spin-rev">
              <rect x="33" y="33" width="54" height="54" rx="4" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="6 3" opacity="0.7" />
            </g>

            <g className="pp-pulse">
              <circle cx="60" cy="60" r="13" fill={`url(#${coreGradId})`} />
              <circle cx="60" cy="60" r="5" fill="#fae8ff" />
            </g>
          </g>
        );
      }

      case "gravitino": {
        return (
          <g>
            <circle cx="60" cy="60" r="48" fill={`url(#${haloGradId})`} opacity="0.65" />
            {/* 4-lobe quadrupole spacetime strain contours (h+ / hx) */}
            <g className="pp-pulse">
              <ellipse cx="60" cy="60" rx="46" ry="20" fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.75" />
              <ellipse cx="60" cy="60" rx="20" ry="46" fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.75" />
            </g>
            <g className="pp-spin-slow">
              <polygon points="60,18 102,60 60,102 18,60" fill="none" stroke="#a5b4fc" strokeWidth="1.6" strokeDasharray="4 3" opacity="0.8" />
            </g>
            {/* Spin-3/2 axis */}
            <line x1="60" y1="14" x2="60" y2="106" stroke="#e0e7ff" strokeWidth="1.4" opacity="0.65" />
            <circle cx="60" cy="60" r="12" fill={`url(#${coreGradId})`} />
            <circle cx="60" cy="60" r="4.5" fill="#eef2ff" />
          </g>
        );
      }
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={`select-none shrink-0 transition-transform duration-300 ${
        active ? "scale-105" : ""
      } ${className}`}
    >
      <defs>
        <radialGradient id={coreGradId} cx="38%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="45%" stopColor={primary} stopOpacity="0.92" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.25" />
        </radialGradient>
        <radialGradient id={haloGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={primary} stopOpacity="0.32" />
          <stop offset="65%" stopColor={accent} stopOpacity="0.08" />
          <stop offset="100%" stopColor={primary} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={waveGradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      {renderArchetype()}
    </svg>
  );
}
