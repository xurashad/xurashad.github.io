"use client";

import { motion } from "framer-motion";

interface Tag {
  label: string;
  color?: "quantum" | "olive" | "crimson" | "default";
}

const TAG_STYLES = {
  quantum: "bg-quantum/12 text-quantum border-quantum/25",
  olive:   "bg-olive/12   text-olive-400 border-olive/25",
  crimson: "bg-crimson/12 text-crimson border-crimson/25",
  default: "bg-white/5    text-foreground/40 border-white/10",
};

export function TagBadge({ label, color = "default" }: Tag) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full border ${TAG_STYLES[color]}`}
    >
      {label}
    </span>
  );
}

interface WaveDividerProps {
  variant?: "quantum" | "olive" | "crimson";
}

export function WaveDivider({ variant = "quantum" }: WaveDividerProps) {
  const colors = {
    quantum: { a: "rgba(0,195,245,0.3)",   b: "rgba(107,143,39,0.15)" },
    olive:   { a: "rgba(107,143,39,0.3)",  b: "rgba(0,195,245,0.15)"  },
    crimson: { a: "rgba(220,20,60,0.3)",   b: "rgba(107,143,39,0.15)" },
  }[variant];

  return (
    <div className="relative h-10 overflow-hidden my-6">
      <svg viewBox="0 0 1440 40" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <motion.path
          d="M0,20 C240,35 480,5 720,20 C960,35 1200,5 1440,20"
          stroke={colors.a}
          strokeWidth="1.5"
          fill="none"
          animate={{
            d: [
              "M0,20 C240,35 480,5 720,20 C960,35 1200,5 1440,20",
              "M0,20 C240,5 480,35 720,20 C960,5 1200,35 1440,20",
              "M0,20 C240,35 480,5 720,20 C960,35 1200,5 1440,20",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M0,20 C180,10 360,30 540,20 C720,10 900,30 1080,20 C1260,10 1380,24 1440,20"
          stroke={colors.b}
          strokeWidth="1"
          fill="none"
          animate={{
            d: [
              "M0,20 C180,10 360,30 540,20 C720,10 900,30 1080,20 C1260,10 1380,24 1440,20",
              "M0,20 C180,30 360,10 540,20 C720,30 900,10 1080,20 C1260,30 1380,16 1440,20",
              "M0,20 C180,10 360,30 540,20 C720,10 900,30 1080,20 C1260,10 1380,24 1440,20",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </svg>
    </div>
  );
}

export function QuantumLoader() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-8">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-quantum"
          animate={{ height: [4, 16, 4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </div>
  );
}
