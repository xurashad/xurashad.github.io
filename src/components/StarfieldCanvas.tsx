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

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function createGlowSprites(colors: string[]): Map<string, HTMLCanvasElement> {
  const map = new Map<string, HTMLCanvasElement>();
  const uniqueColors = Array.from(new Set(colors));
  for (const color of uniqueColors) {
    const sprite = document.createElement("canvas");
    sprite.width = 16;
    sprite.height = 16;
    const sctx = sprite.getContext("2d");
    if (sctx) {
      const grad = sctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, hexToRgba(color, 0.9));
      grad.addColorStop(0.35, hexToRgba(color, 0.35));
      grad.addColorStop(1, hexToRgba(color, 0));
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 16, 16);
    }
    map.set(color, sprite);
  }
  return map;
}

/* ── Component ─────────────────────────────────────────────────────────────── */
export function StarfieldCanvas({ starCount = 200 }: { starCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
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

    let animId = 0;
    let t = 0;
    let isVisible = true;
    let isTabActive = !document.hidden;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const isDark = resolvedTheme !== "light";
    const starColors = isDark ? STAR_COLORS_DARK : STAR_COLORS_LIGHT;
    const glowSprites = createGlowSprites(starColors);

    /* ── Resize ── */
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });

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
    const renderFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      t++;

      /* ── Nebula Clouds ── */
      for (let idx = 0; idx < nebulae.length; idx++) {
        const n = nebulae[idx];
        const pulse = Math.sin(t * n.pulseSpeed + n.pulseOffset) * 0.5 + 0.5;
        const r = n.radius + pulse * 40;
        const px = n.x + n.driftX * t + mx * 8;
        const py = n.y + n.driftY * t + my * 8;

        // Smooth wrap-around across canvas + 2*radius so clouds never pop at edges
        const spanX = canvas.width + r * 2;
        const spanY = canvas.height + r * 2;
        const wx = ((((px + r) % spanX) + spanX) % spanX) - r;
        const wy = ((((py + r) % spanY) + spanY) % spanY) - r;

        const grad = ctx.createRadialGradient(wx, wy, 0, wx, wy, r);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.6 + pulse * 0.4;
        ctx.fillRect(wx - r, wy - r, r * 2, r * 2);
      }
      ctx.globalAlpha = 1;

      /* ── Stars ── */
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        s.alpha = s.baseAlpha * (0.5 + twinkle * 0.5);

        const px = s.x + mx * s.parallaxFactor * 3;
        const py = s.y + my * s.parallaxFactor * 3;

        // Draw pre-rendered glow sprite for larger stars instead of ctx.shadowBlur
        if (s.radius > 1.5) {
          const sprite = glowSprites.get(s.color);
          if (sprite) {
            const glowRadius = s.radius * 3.8 + twinkle * 1.4;
            ctx.globalAlpha = s.alpha * 0.75;
            ctx.drawImage(sprite, px - glowRadius, py - glowRadius, glowRadius * 2, glowRadius * 2);
          }
        }

        ctx.beginPath();
        ctx.arc(px, py, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* ── Shooting Stars ── */
      nextShootingStarTime--;
      if (nextShootingStarTime <= 0 && isDark) {
        spawnShootingStar();
        nextShootingStarTime = 200 + Math.random() * 400;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;
        ss.x += ss.vx;
        ss.y += ss.vy;

        const progress = ss.life / ss.maxLife;
        ss.alpha = progress < 0.1 ? progress / 0.1 : progress > 0.6 ? (1 - progress) / 0.4 : 1;

        const speedMag = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
        const normX = ss.vx / speedMag;
        const normY = ss.vy / speedMag;
        const trailLen = ss.length;

        const grad = ctx.createLinearGradient(
          ss.x, ss.y,
          ss.x - normX * trailLen * 0.5,
          ss.y - normY * trailLen * 0.5
        );
        grad.addColorStop(0, ss.color);
        grad.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - normX * trailLen, ss.y - normY * trailLen);
        ctx.strokeStyle = grad;

        // Soft glow pass + crisp core pass (replaces shadowBlur)
        ctx.lineWidth = 4;
        ctx.globalAlpha = ss.alpha * 0.22;
        ctx.stroke();

        ctx.lineWidth = 1.5;
        ctx.globalAlpha = ss.alpha * 0.85;
        ctx.stroke();

        // Head dot
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = ss.alpha;
        ctx.fill();

        if (ss.life >= ss.maxLife) {
          shootingStars.splice(i, 1);
        }
      }
      ctx.globalAlpha = 1;

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
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
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
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
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
  }, [starCount, resolvedTheme, onMouse]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: mounted && resolvedTheme === "light" ? 0.3 : 0.9 }}
    />
  );
}
