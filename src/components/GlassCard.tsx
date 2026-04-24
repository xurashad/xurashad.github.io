"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children:   ReactNode;
  className?: string;
  accent?:    "quantum" | "olive" | "crimson" | "none";
  hover?:     boolean;
  delay?:     number;
  animate?:   boolean;
}

const ACCENT_MAP = {
  quantum: "hover:border-quantum/40 hover:shadow-[0_0_30px_rgba(0,195,245,0.15)]",
  olive:   "hover:border-olive/40   hover:shadow-[0_0_30px_rgba(107,143,39,0.12)]",
  crimson: "hover:border-crimson/40 hover:shadow-[0_0_30px_rgba(220,20,60,0.12)]",
  none:    "",
};

export function GlassCard({
  children,
  className = "",
  accent = "quantum",
  hover = true,
  delay = 0,
  animate = true,
}: GlassCardProps) {
  const Wrapper = animate ? motion.div : "div";
  const animProps = animate
    ? {
        initial:    { opacity: 0, y: 20, scale: 0.97 },
        whileInView:{ opacity: 1, y: 0,  scale: 1    },
        viewport:   { once: true, margin: "-40px" },
        transition: { delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as number[] },
      }
    : {};

  return (
    // @ts-expect-error motion/non-motion union
    <Wrapper
      {...animProps}
      className={`
        glass-card border border-white/6 transition-all duration-300
        ${hover ? `cursor-pointer ${ACCENT_MAP[accent]}` : ""}
        ${className}
      `}
    >
      {children}
    </Wrapper>
  );
}
