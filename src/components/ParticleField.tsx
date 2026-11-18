"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

const COLORS_DARK = [
  "#00c3f5", "#6b8f27", "#dc143c", "#7f8dcc", "#ffffff",
  "#9333ea", "#7b2ff7", "#c084fc", "#6366f1", "#a5b4fc",
];
const COLORS_LIGHT = ["#0088b3", "#3e541a", "#991b1b", "#5467bb", "#6d28d9", "#0a0a0f"];

const MAX_DIST = 150;
const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

export function ParticleField({ count = 60 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let isVisible = true;
    let isTabActive = !document.hidden;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const particles: Particle[] = [];
    const isDark = resolvedTheme !== "light";
    const colors = isDark ? COLORS_DARK : COLORS_LIGHT;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const spawn = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.2,
      radius: Math.random() * 2.5 + 0.5,
      alpha: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: Math.random() * 300 + 200,
    });

    for (let i = 0; i < count; i++) {
      const p = spawn();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    // Mouse parallax
    let mx = 0;
    let my = 0;
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;
        p.x += p.vx + mx * 0.05;
        p.y += p.vy + my * 0.05;

        const progress = p.life / p.maxLife;
        if (progress < 0.15) p.alpha = progress / 0.15;
        else if (progress > 0.80) p.alpha = (1 - progress) / 0.20;
        else p.alpha = 1;

        // Soft outer glow halo for dark-mode particles (replaces shadowBlur)
        if (isDark && p.radius > 1.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha * 0.18;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw deterministic constellation lines to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < MAX_DIST_SQ) {
            const dist = Math.sqrt(distSq);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            const lineAlpha = (1 - dist / MAX_DIST) * 0.1 * Math.min(p.alpha, q.alpha);
            ctx.strokeStyle =
              (i + j) % 2 === 0
                ? `rgba(0,195,245,${lineAlpha})`
                : `rgba(147,51,234,${lineAlpha * 0.7})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Respawn dead particles
        if (p.life >= p.maxLife) {
          particles[i] = spawn();
        }
      }
    };

    const stopLoop = () => {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = 0;
      }
    };

    const loop = () => {
      if (!isVisible || !isTabActive) {
        animId = 0;
        return;
      }
      renderFrame();
      animId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (prefersReducedMotion) {
        renderFrame();
        return;
      }
      if (!animId && isVisible && isTabActive) {
        animId = requestAnimationFrame(loop);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((e) => e.isIntersecting);
        if (isVisible && isTabActive) startLoop();
        else stopLoop();
      },
      { threshold: 0.01 }
    );
    observer.observe(canvas);

    const onVisibilityChange = () => {
      isTabActive = !document.hidden;
      if (isVisible && isTabActive) startLoop();
      else stopLoop();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    startLoop();

    return () => {
      stopLoop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [count, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
