"use client";

import { memo } from "react";
import { ParticleType, type Particle } from "../lib/types";
import { ARROW_SIZE, PARTICLE_COLOR } from "../lib/constants";

interface Props {
  particle: Particle;
}

// Pure helper to compute quadratic bezier point at parameter t (0 <= t <= 1)
function bezierPoint(
  t: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number
) {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
    y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
  };
}

// Pure helper to compute tangent vector dx, dy at parameter t
function bezierTangent(
  t: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number
) {
  const mt = 1 - t;
  return {
    dx: 2 * mt * (cx - x0) + 2 * t * (x1 - cx),
    dy: 2 * mt * (cy - y0) + 2 * t * (y1 - cy),
  };
}

export const ParticleLine = memo(function ParticleLine({ particle }: Props) {
  const { startX, startY, endX, endY, type, bend, reversed, label, color: customColor } = particle;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 2) return null;

  const mx = startX + dx / 2;
  const my = startY + dy / 2;
  const cpx = mx - (dy / length) * bend;
  const cpy = my + (dx / length) * bend;
  const curvePath = `M ${startX} ${startY} Q ${cpx} ${cpy} ${endX} ${endY}`;
  const color = customColor || PARTICLE_COLOR[type] || "#60a5fa";

  // Label positioning helper (placed near midpoint, perpendicular to tangent)
  const renderLabel = () => {
    if (!label) return null;
    const mid = bezierPoint(0.5, startX, startY, cpx, cpy, endX, endY);
    const tan = bezierTangent(0.5, startX, startY, cpx, cpy, endX, endY);
    const tl = Math.hypot(tan.dx, tan.dy);
    if (!tl) return null;

    const nx = -tan.dy / tl;
    const ny = tan.dx / tl;
    const offsetDist = Math.abs(bend) > 5 ? (bend > 0 ? -18 : 18) : -16;
    const lx = mid.x + nx * offsetDist;
    const ly = mid.y + ny * offsetDist;

    return (
      <text
        x={lx}
        y={ly}
        fill="#f8f9fa"
        fontSize="13"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="600"
        textAnchor="middle"
        dominantBaseline="central"
        className="select-none pointer-events-none"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }}
      >
        {label}
      </text>
    );
  };

  switch (type) {
    // ── Photon: sinusoidal wave along the bezier curve ───────────────────────
    case ParticleType.Photon: {
      const segs = 64;
      const amp = 5;
      const waves = Math.max(1, length / 22);
      let d = `M ${startX} ${startY}`;
      for (let i = 1; i <= segs; i++) {
        const t = i / segs;
        const pt = bezierPoint(t, startX, startY, cpx, cpy, endX, endY);
        const tan = bezierTangent(t, startX, startY, cpx, cpy, endX, endY);
        const tl = Math.hypot(tan.dx, tan.dy);
        if (!tl) continue;
        const nx = -tan.dy / tl;
        const ny = tan.dx / tl;
        const off = amp * Math.sin(t * waves * Math.PI * 2);
        d += ` L ${pt.x + nx * off} ${pt.y + ny * off}`;
      }
      return (
        <g>
          <path d={d} stroke={color} fill="none" strokeWidth="2.2" strokeLinecap="round" />
          {renderLabel()}
        </g>
      );
    }

    // ── W/Z Boson: thick undulating wave ─────────────────────────────────────
    case ParticleType.WBoson:
    case ParticleType.ZBoson: {
      const segs = 64;
      const amp = 6;
      const waves = Math.max(1, length / 20);
      let d = `M ${startX} ${startY}`;
      for (let i = 1; i <= segs; i++) {
        const t = i / segs;
        const pt = bezierPoint(t, startX, startY, cpx, cpy, endX, endY);
        const tan = bezierTangent(t, startX, startY, cpx, cpy, endX, endY);
        const tl = Math.hypot(tan.dx, tan.dy);
        if (!tl) continue;
        const nx = -tan.dy / tl;
        const ny = tan.dx / tl;
        const off = amp * Math.sin(t * waves * Math.PI * 2);
        d += ` L ${pt.x + nx * off} ${pt.y + ny * off}`;
      }
      return (
        <g>
          <path d={d} stroke={color} fill="none" strokeWidth="2.8" strokeLinecap="round" />
          {renderLabel()}
        </g>
      );
    }

    // ── Gluon: spring coils along curve ──────────────────────────────────────
    case ParticleType.Gluon: {
      const amp = 9;
      const loops = Math.max(1, Math.round(length / 18));
      const segs = loops * 4;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const pt = bezierPoint(t, startX, startY, cpx, cpy, endX, endY);
        const tan = bezierTangent(t, startX, startY, cpx, cpy, endX, endY);
        const angle = Math.atan2(tan.dy, tan.dx);
        const phase = i % 4;
        const off = phase === 1 ? amp : phase === 3 ? -amp : 0;
        pts.push({ x: pt.x - Math.sin(angle) * off, y: pt.y + Math.cos(angle) * off });
      }
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const factor = 1 / 6;
        const cp1 = { x: p1.x + (p2.x - p0.x) * factor, y: p1.y + (p2.y - p0.y) * factor };
        const cp2 = { x: p2.x - (p3.x - p1.x) * factor, y: p2.y - (p3.y - p1.y) * factor };
        d += ` C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${p2.x},${p2.y}`;
      }
      return (
        <g>
          <path d={d} stroke={color} fill="none" strokeWidth="2.2" strokeLinecap="round" />
          {renderLabel()}
        </g>
      );
    }

    // ── Higgs: dashed gold line ──────────────────────────────────────────────
    case ParticleType.Higgs:
      return (
        <g>
          <path d={curvePath} stroke={color} strokeWidth="2.2" strokeDasharray="6,4" fill="none" />
          {renderLabel()}
        </g>
      );

    // ── Ghost: dotted line ───────────────────────────────────────────────────
    case ParticleType.Ghost:
      return (
        <g>
          <path d={curvePath} stroke={color} strokeWidth="2.2" strokeDasharray="2,5" strokeLinecap="round" fill="none" />
          {renderLabel()}
        </g>
      );

    // ── Scalar: solid line ───────────────────────────────────────────────────
    case ParticleType.Scalar:
      return (
        <g>
          <path d={curvePath} stroke={color} strokeWidth="2" fill="none" />
          {renderLabel()}
        </g>
      );

    // ── Fermion: solid line + directional arrow ──────────────────────────────
    case ParticleType.Fermion:
    default: {
      const t0 = reversed ? 0.45 : 0.55;
      const arrowPt = bezierPoint(t0, startX, startY, cpx, cpy, endX, endY);
      const tan = bezierTangent(t0, startX, startY, cpx, cpy, endX, endY);
      const angle =
        Math.atan2(tan.dy, tan.dx) * (180 / Math.PI) + (reversed ? 180 : 0);

      return (
        <g>
          <path d={curvePath} stroke={color} fill="none" strokeWidth="2.2" />
          <path
            d={`M ${-ARROW_SIZE / 2} ${-ARROW_SIZE / 2.5} L ${ARROW_SIZE / 1.5} 0 L ${-ARROW_SIZE / 2} ${ARROW_SIZE / 2.5} Z`}
            fill={color}
            transform={`translate(${arrowPt.x},${arrowPt.y}) rotate(${angle})`}
          />
          {renderLabel()}
        </g>
      );
    }
  }
});
