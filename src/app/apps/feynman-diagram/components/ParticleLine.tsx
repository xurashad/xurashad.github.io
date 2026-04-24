"use client";

import { memo, useCallback } from "react";
import { ParticleType, type Particle } from "../lib/types";
import { ARROW_SIZE, PARTICLE_COLOR } from "../lib/constants";

interface Props { particle: Particle; }

export const ParticleLine = memo(function ParticleLine({ particle }: Props) {
  const { startX, startY, endX, endY, type, bend, reversed } = particle;
  const dx = endX - startX, dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 2) return null;

  const mx = startX + dx / 2, my = startY + dy / 2;
  const cpx = mx - (dy / length) * bend;
  const cpy = my + (dx / length) * bend;
  const curvePath = `M ${startX} ${startY} Q ${cpx} ${cpy} ${endX} ${endY}`;
  const color = PARTICLE_COLOR[type];

  const getBezierPoint = useCallback((t: number) => ({
    x: (1-t)**2 * startX + 2*(1-t)*t * cpx + t**2 * endX,
    y: (1-t)**2 * startY + 2*(1-t)*t * cpy + t**2 * endY,
  }), [startX, startY, cpx, cpy, endX, endY]);

  const getBezierTangent = useCallback((t: number) => ({
    dx: 2*(1-t)*(cpx - startX) + 2*t*(endX - cpx),
    dy: 2*(1-t)*(cpy - startY) + 2*t*(endY - cpy),
  }), [startX, startY, cpx, cpy, endX, endY]);

  switch (type) {
    // ── Photon: sinusoidal wave along the bezier ──────────────────────────────
    case ParticleType.Photon: {
      const segs = 60, amp = 5;
      const waves = Math.max(1, length / 22);
      let d = `M ${startX} ${startY}`;
      for (let i = 1; i <= segs; i++) {
        const t = i / segs;
        const { x, y } = getBezierPoint(t);
        const tan = getBezierTangent(t);
        const tl = Math.sqrt(tan.dx**2 + tan.dy**2);
        if (!tl) continue;
        const nx = -tan.dy / tl, ny = tan.dx / tl;
        const off = amp * Math.sin(t * waves * Math.PI * 2);
        d += ` L ${x + nx * off} ${y + ny * off}`;
      }
      return <path d={d} stroke={color} fill="none" strokeWidth="2" />;
    }

    // ── W/Z: double wave (thicker wavy) ──────────────────────────────────────
    case ParticleType.WBoson:
    case ParticleType.ZBoson: {
      const segs = 60, amp = 6;
      const waves = Math.max(1, length / 20);
      let d = `M ${startX} ${startY}`;
      for (let i = 1; i <= segs; i++) {
        const t = i / segs;
        const { x, y } = getBezierPoint(t);
        const tan = getBezierTangent(t);
        const tl = Math.sqrt(tan.dx**2 + tan.dy**2);
        if (!tl) continue;
        const nx = -tan.dy / tl, ny = tan.dx / tl;
        const off = amp * Math.sin(t * waves * Math.PI * 2);
        d += ` L ${x + nx * off} ${y + ny * off}`;
      }
      return <path d={d} stroke={color} fill="none" strokeWidth="2.5" strokeLinecap="round"/>;
    }

    // ── Gluon: spring coils ───────────────────────────────────────────────────
    case ParticleType.Gluon: {
      const amp = 9, loops = Math.max(1, Math.round(length / 18));
      const segs = loops * 4;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const { x, y } = getBezierPoint(t);
        const tan = getBezierTangent(t);
        const angle = Math.atan2(tan.dy, tan.dx);
        const phase = i % 4;
        const off = phase === 1 ? amp : phase === 3 ? -amp : 0;
        pts.push({ x: x - Math.sin(angle) * off, y: y + Math.cos(angle) * off });
      }
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i-1)], p1 = pts[i];
        const p2 = pts[i+1], p3 = pts[Math.min(pts.length-1, i+2)];
        const t = 1/6;
        const cp1 = { x: p1.x + (p2.x - p0.x)*t, y: p1.y + (p2.y - p0.y)*t };
        const cp2 = { x: p2.x - (p3.x - p1.x)*t, y: p2.y - (p3.y - p1.y)*t };
        d += ` C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${p2.x},${p2.y}`;
      }
      return <path d={d} stroke={color} fill="none" strokeWidth="2" />;
    }

    // ── Higgs: long dashes ────────────────────────────────────────────────────
    case ParticleType.Higgs:
      return <path d={curvePath} stroke={color} strokeWidth="2" strokeDasharray="6,4" fill="none" />;

    // ── Ghost: dotted ─────────────────────────────────────────────────────────
    case ParticleType.Ghost:
      return <path d={curvePath} stroke={color} strokeWidth="2" strokeDasharray="2,5" strokeLinecap="round" fill="none" />;

    // ── Scalar: plain line ────────────────────────────────────────────────────
    case ParticleType.Scalar:
      return <path d={curvePath} stroke={color} strokeWidth="2" fill="none" />;

    // ── Fermion: line + midpoint arrow ────────────────────────────────────────
    case ParticleType.Fermion:
    default: {
      const t0 = reversed ? 0.4 : 0.6;
      const { x: arrowX, y: arrowY } = getBezierPoint(t0);
      const tan = getBezierTangent(t0);
      const angle = Math.atan2(tan.dy, tan.dx) * (180 / Math.PI) + (reversed ? 180 : 0);
      return (
        <g>
          <path d={curvePath} stroke={color} fill="none" strokeWidth="2" />
          <path
            d={`M 0 ${-ARROW_SIZE/2.5} L ${ARROW_SIZE} 0 L 0 ${ARROW_SIZE/2.5} Z`}
            fill={color}
            transform={`translate(${arrowX},${arrowY}) rotate(${angle})`}
          />
        </g>
      );
    }
  }
});
