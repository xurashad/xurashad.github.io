"use client";

import { useEffect, useRef } from "react";

interface WaveConfig {
  amplitude: number;
  frequency: number;
  phase:     number;
  speed:     number;
  color:     string;
  lineWidth: number;
  yOffset:   number;
}

const WAVE_CONFIGS: WaveConfig[] = [
  { amplitude: 22,  frequency: 0.012, phase: 0,          speed: 0.015, color: "rgba(0,195,245,0.5)",    lineWidth: 1.5, yOffset: 0.50 },
  { amplitude: 14,  frequency: 0.018, phase: Math.PI,    speed: 0.020, color: "rgba(107,143,39,0.4)",   lineWidth: 1,   yOffset: 0.55 },
  { amplitude: 30,  frequency: 0.008, phase: Math.PI/2,  speed: 0.010, color: "rgba(220,20,60,0.25)",   lineWidth: 0.8, yOffset: 0.48 },
  { amplitude: 10,  frequency: 0.025, phase: Math.PI*1.5,speed: 0.030, color: "rgba(127,141,204,0.35)", lineWidth: 0.6, yOffset: 0.52 },
  { amplitude: 18,  frequency: 0.015, phase: Math.PI*0.7,speed: 0.012, color: "rgba(0,195,245,0.2)",    lineWidth: 2,   yOffset: 0.46 },
];

export function WaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      WAVE_CONFIGS.forEach((wave) => {
        const baseY = canvas.height * wave.yOffset;
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        ctx.shadowBlur = 8;
        ctx.shadowColor = wave.color;

        for (let x = 0; x <= canvas.width; x += 2) {
          const y = baseY + wave.amplitude * Math.sin(x * wave.frequency + t * wave.speed + wave.phase);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Ψ probability density envelope (shaded region between two waves)
      const baseY = canvas.height * 0.50;
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 2) {
        const y = baseY + 22 * Math.sin(x * 0.012 + t * 0.015);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      for (let x = canvas.width; x >= 0; x -= 2) {
        const y = baseY - 22 * Math.sin(x * 0.012 + t * 0.015);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "rgba(0,195,245,0.03)";
      ctx.fill();

      t++;
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
