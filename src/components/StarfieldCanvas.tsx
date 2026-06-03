"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useTheme } from "next-themes";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
  parallaxFactor: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  driftX: number;
  driftY: number;
  pulseSpeed: number;
  pulseOffset: number;
}

/* ── Star Colors ───────────────────────────────────────────────────────────── */
const STAR_COLORS_DARK = [
  "#ffffff", "#ffffff", "#ffffff",
  "#e0c3fc", "#c084fc", "#a5b4fc",
  "#66d9ff", "#b2edff",
];

const STAR_COLORS_LIGHT = [
  "#5467bb", "#4f46e5", "#6d28d9",
  "#0088b3", "#3e541a",
];

const NEBULA_CONFIGS = [
  { color: "rgba(147, 51, 234, 0.06)", radius: 280, driftX: 0.15, driftY: -0.08 },
  { color: "rgba(99, 102, 241, 0.05)", radius: 220, driftX: -0.1, driftY: 0.12 },
  { color: "rgba(0, 195, 245, 0.04)", radius: 250, driftX: 0.08, driftY: 0.06 },
  { color: "rgba(192, 132, 252, 0.05)", radius: 200, driftX: -0.12, driftY: -0.1 },
];

const SHOOTING_STAR_COLORS = ["#c084fc", "#a5b4fc", "#66d9ff", "#e0c3fc"];

/* ── Component ─────────────────────────────────────────────────────────────── */
export function StarfieldCanvas({ starCount = 200 }: { starCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const mouseRef = useRef({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const onMouse = useCallback((e: MouseEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const isDark = theme === "dark";
    const starColors = isDark ? STAR_COLORS_DARK : STAR_COLORS_LIGHT;

    /* ── Resize ── */
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse);

    /* ── Create Stars ── */
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const layer = Math.random(); // 0 = far, 1 = near
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: layer < 0.6 ? Math.random() * 1 + 0.3 : layer < 0.9 ? Math.random() * 1.5 + 0.8 : Math.random() * 2.5 + 1.5,
        baseAlpha: layer < 0.6 ? 0.3 + Math.random() * 0.3 : 0.5 + Math.random() * 0.5,
        alpha: 0,
        twinkleSpeed: 0.005 + Math.random() * 0.02,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        parallaxFactor: 0.5 + layer * 1.5,
      });
    }

    /* ── Create Nebula Clouds ── */
    const nebulae: NebulaCloud[] = NEBULA_CONFIGS.map((cfg) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: cfg.radius + Math.random() * 80,
      color: cfg.color,
      alpha: 1,
      driftX: cfg.driftX,
      driftY: cfg.driftY,
      pulseSpeed: 0.003 + Math.random() * 0.005,
      pulseOffset: Math.random() * Math.PI * 2,
    }));

    /* ── Shooting Stars Pool ── */
    const shootingStars: ShootingStar[] = [];
    let nextShootingStarTime = 120 + Math.random() * 300;

    const spawnShootingStar = () => {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 6;
      shootingStars.push({
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 40 + Math.random() * 80,
        alpha: 1,
        life: 0,
        maxLife: 40 + Math.random() * 30,
        color: SHOOTING_STAR_COLORS[Math.floor(Math.random() * SHOOTING_STAR_COLORS.length)],
      });
    };

    /* ── Draw Loop ── */
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      t++;

      /* ── Nebula Clouds ── */
      nebulae.forEach((n) => {
        const pulse = Math.sin(t * n.pulseSpeed + n.pulseOffset) * 0.5 + 0.5;
        const r = n.radius + pulse * 40;
        const px = n.x + n.driftX * t + mx * 8;
        const py = n.y + n.driftY * t + my * 8;

        // Wrap around
        const wx = ((px % canvas.width) + canvas.width) % canvas.width;
        const wy = ((py % canvas.height) + canvas.height) % canvas.height;

        const grad = ctx.createRadialGradient(wx, wy, 0, wx, wy, r);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.6 + pulse * 0.4;
        ctx.fillRect(wx - r, wy - r, r * 2, r * 2);
        ctx.globalAlpha = 1;
      });

      /* ── Stars ── */
      stars.forEach((s) => {
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        s.alpha = s.baseAlpha * (0.5 + twinkle * 0.5);

        const px = s.x + mx * s.parallaxFactor * 3;
        const py = s.y + my * s.parallaxFactor * 3;

        ctx.beginPath();
        ctx.arc(px, py, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;

        // Add glow for larger stars
        if (s.radius > 1.5) {
          ctx.shadowBlur = 6 + twinkle * 4;
          ctx.shadowColor = s.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      });

      /* ── Shooting Stars ── */
      nextShootingStarTime--;
      if (nextShootingStarTime <= 0 && isDark) {
        spawnShootingStar();
        nextShootingStarTime = 200 + Math.random() * 400;
      }

      shootingStars.forEach((ss, i) => {
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;

        const progress = ss.life / ss.maxLife;
        ss.alpha = progress < 0.1 ? progress / 0.1 : progress > 0.6 ? (1 - progress) / 0.4 : 1;

        // Trail
        const trailLen = ss.length;
        const grad = ctx.createLinearGradient(
          ss.x, ss.y,
          ss.x - ss.vx * trailLen / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy) * 0.5,
          ss.y - ss.vy * trailLen / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy) * 0.5
        );
        grad.addColorStop(0, ss.color);
        grad.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        const normX = ss.vx / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
        const normY = ss.vy / Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
        ctx.lineTo(ss.x - normX * trailLen, ss.y - normY * trailLen);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = ss.alpha * 0.8;
        ctx.shadowBlur = 8;
        ctx.shadowColor = ss.color;
        ctx.stroke();

        // Head dot
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = ss.alpha;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Remove dead
        if (ss.life >= ss.maxLife) {
          shootingStars.splice(i, 1);
        }
      });

      /* ── Faint Sacred Geometry (hexagon at center) ── */
      if (isDark) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const hexRadius = Math.min(canvas.width, canvas.height) * 0.25;
        const hexAlpha = 0.02 + Math.sin(t * 0.003) * 0.01;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const hx = cx + hexRadius * Math.cos(angle) + mx * 5;
          const hy = cy + hexRadius * Math.sin(angle) + my * 5;
          i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(147, 51, 234, ${hexAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner hexagon
        const innerR = hexRadius * 0.5;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const hx = cx + innerR * Math.cos(angle) + mx * 3;
          const hy = cy + innerR * Math.sin(angle) + my * 3;
          i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(99, 102, 241, ${hexAlpha * 0.8})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Connecting lines (vertices of outer to inner)
        for (let i = 0; i < 6; i++) {
          const outerAngle = (Math.PI / 3) * i - Math.PI / 6;
          const innerAngle = (Math.PI / 3) * i;
          ctx.beginPath();
          ctx.moveTo(cx + hexRadius * Math.cos(outerAngle) + mx * 5, cy + hexRadius * Math.sin(outerAngle) + my * 5);
          ctx.lineTo(cx + innerR * Math.cos(innerAngle) + mx * 3, cy + innerR * Math.sin(innerAngle) + my * 3);
          ctx.strokeStyle = `rgba(0, 195, 245, ${hexAlpha * 0.5})`;
          ctx.lineWidth = 0.3;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [starCount, theme, onMouse]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: mounted && theme === "dark" ? 0.9 : 0.3 }}
    />
  );
}
