"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  eyebrow: string;
  title:   string;
  accent?: string;
  subtitle?: string;
}

export function SectionHeader({ eyebrow, title, accent, subtitle }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-12"
    >
      <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
        {eyebrow}
      </div>
      <h1 className="text-4xl sm:text-5xl font-serif font-bold leading-tight mb-4">
        {accent ? (
          <>
            <span className="text-foreground">{title.replace(accent, "")}</span>
            <span className="gradient-text-quantum">{accent}</span>
          </>
        ) : (
          <span className="gradient-text-quantum">{title}</span>
        )}
      </h1>
      {subtitle && (
        <p className="text-foreground/50 max-w-2xl leading-relaxed">{subtitle}</p>
      )}
    </motion.div>
  );
}
