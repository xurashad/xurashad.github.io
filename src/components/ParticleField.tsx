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

const COLORS_DARK  = ["#00c3f5", "#6b8f27", "#dc143c", "#7f8dcc", "#ffffff"];
const COLORS_LIGHT = ["#0088b3", "#3e541a", "#991b1b", "#5467bb", "#0a0a0f"];

export function ParticleField({ count = 60 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];
    const colors = theme === "dark" ? COLORS_DARK : COLORS_LIGHT;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spawn = (): Particle => ({
      x:       Math.random() * canvas.width,
      y:       Math.random() * canvas.height,
      vx:      (Math.random() - 0.5) * 0.4,
      vy:      (Math.random() - 0.5) * 0.4 - 0.2,
      radius:  Math.random() * 2.5 + 0.5,
      alpha:   0,
      color:   colors[Math.floor(Math.random() * colors.length)],
      life:    0,
      maxLife: Math.random() * 300 + 200,
    });

    for (let i = 0; i < count; i++) {
      const p = spawn();
      p.life = Math.random() * p.maxLife; // stagger initial lifetimes
      particles.push(p);
    }

    // Mouse parallax
    let mx = 0, my = 0;
    const onMouse = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouse);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.life++;
        p.x += p.vx + mx * 0.05;
        p.y += p.vy + my * 0.05;

        const progress = p.life / p.maxLife;
        // fade in/out
        if (progress < 0.15)      p.alpha = progress / 0.15;
        else if (progress > 0.80) p.alpha = (1 - progress) / 0.20;
        else                      p.alpha = 1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.alpha * 180).toString(16).padStart(2, "0");
        ctx.fill();

        // Draw faint connecting lines to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = q.x - p.x;
          const dy = q.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            const lineAlpha = (1 - dist / 120) * 0.08 * Math.min(p.alpha, q.alpha);
            ctx.strokeStyle = `rgba(0,195,245,${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Respawn dead particles
        if (p.life >= p.maxLife) {
          particles[i] = spawn();
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [count, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.7 }}
    />
  );
}
