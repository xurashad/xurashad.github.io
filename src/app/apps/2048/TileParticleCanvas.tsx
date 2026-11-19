"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { GridSize } from "./lib/types";

export interface TileParticleHandle {
  burstCell: (
    row: number,
    col: number,
    gridSize: GridSize,
    colors: string[],
    intensity?: number
  ) => void;
  celebrate: (colors: string[]) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
}

export const TileParticleCanvas = forwardRef<TileParticleHandle>(
  function TileParticleCanvas(_, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number | null>(null);
    const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

    const prefersReducedMotion = useCallback(() => {
      if (typeof window === "undefined") return true;
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    const syncCanvasSize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = rect.height;
      if (width <= 0 || height <= 0) return;

      if (
        sizeRef.current.width !== width ||
        sizeRef.current.height !== height ||
        sizeRef.current.dpr !== dpr
      ) {
        sizeRef.current = { width, height, dpr };
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      syncCanvasSize();

      const observer = new ResizeObserver(() => syncCanvasSize());
      observer.observe(canvas);

      return () => {
        observer.disconnect();
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }, [syncCanvasSize]);

    const ensureRunning = useCallback(() => {
      if (rafRef.current !== null) return;

      const step = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          rafRef.current = null;
          return;
        }
        syncCanvasSize();
        const ctx = canvas.getContext("2d");
        const { width, height, dpr } = sizeRef.current;
        if (!ctx || width <= 0 || height <= 0) {
          rafRef.current = null;
          return;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const list = particlesRef.current;
        const alive: Particle[] = [];

        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.96;
          p.vy *= 0.96;
          p.alpha -= p.decay;

          if (p.alpha > 0.02) {
            alive.push(p);
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        particlesRef.current = alive;
        if (alive.length > 0) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          ctx.clearRect(0, 0, width, height);
          rafRef.current = null;
        }
      };

      rafRef.current = requestAnimationFrame(step);
    }, [syncCanvasSize]);

    useImperativeHandle(
      ref,
      () => ({
        burstCell(row, col, gridSize, colors, intensity = 1) {
          if (prefersReducedMotion()) return;
          syncCanvasSize();
          const { width, height } = sizeRef.current;
          if (width <= 0 || height <= 0 || colors.length === 0) return;

          const cx = ((col + 0.5) / gridSize) * width;
          const cy = ((row + 0.5) / gridSize) * height;
          const count = Math.min(24, Math.round(10 * intensity));

          for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
            const speed = (1.6 + Math.random() * 2.8) * Math.min(1.6, 0.8 + intensity * 0.25);
            particlesRef.current.push({
              x: cx,
              y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 1.8 + Math.random() * 2.4,
              color: colors[i % colors.length],
              alpha: 0.95,
              decay: 0.025 + Math.random() * 0.02,
              gravity: 0.04,
            });
          }
          ensureRunning();
        },

        celebrate(colors) {
          if (prefersReducedMotion()) return;
          syncCanvasSize();
          const { width, height } = sizeRef.current;
          if (width <= 0 || height <= 0 || colors.length === 0) return;

          const origins = [
            { x: width * 0.25, y: height * 0.35 },
            { x: width * 0.75, y: height * 0.35 },
            { x: width * 0.5, y: height * 0.55 },
          ];
          for (const origin of origins) {
            for (let i = 0; i < 20; i++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = 1.8 + Math.random() * 4.2;
              particlesRef.current.push({
                x: origin.x,
                y: origin.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                size: 2 + Math.random() * 3,
                color: colors[i % colors.length],
                alpha: 1,
                decay: 0.015 + Math.random() * 0.012,
                gravity: 0.08,
              });
            }
          }
          ensureRunning();
        },
      }),
      [ensureRunning, prefersReducedMotion, syncCanvasSize]
    );

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
      />
    );
  }
);
