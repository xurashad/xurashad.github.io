"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ImageIcon, Music, ArrowRight, Sparkles } from "lucide-react";
import { IMAGE_POSTS } from "./ai-images/data";
import { MUSIC_TRACKS } from "./ai-music/data";

const SECTIONS = [
  {
    title: "AI Image Generations",
    desc: "A curated gallery of AI-generated artwork — browse by model, tags, and style. Click any image for full metadata, prompts, and multi-image views.",
    href: "/art/ai-images",
    icon: ImageIcon,
    accent: "quantum" as const,
    count: IMAGE_POSTS.length,
    unit: "images",
    preview: IMAGE_POSTS.slice(0, 4).map((p) => p.images[0]),
  },
  {
    title: "AI Music Generations",
    desc: "AI-composed music tracks with full generation metadata. Listen, explore prompts, and filter by model and style.",
    href: "/art/ai-music",
    icon: Music,
    accent: "crimson" as const,
    count: MUSIC_TRACKS.length,
    unit: "tracks",
    preview: MUSIC_TRACKS.slice(0, 4).map((t) => t.thumbnail),
  },
];

const ACCENT_STYLES = {
  quantum: {
    border: "border-quantum/20 hover:border-quantum/50",
    glow: "group-hover:shadow-[0_0_40px_rgba(0,195,245,0.15)]",
    icon: "bg-quantum/12 text-quantum",
    badge: "bg-quantum/10 text-quantum border-quantum/20",
    arrow: "text-quantum",
    gradient: "from-quantum/20 to-transparent",
  },
  crimson: {
    border: "border-crimson/20 hover:border-crimson/50",
    glow: "group-hover:shadow-[0_0_40px_rgba(220,20,60,0.15)]",
    icon: "bg-crimson/12 text-crimson",
    badge: "bg-crimson/10 text-crimson border-crimson/20",
    arrow: "text-crimson",
    gradient: "from-crimson/20 to-transparent",
  },
};

export default function ArtPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-quantum/3 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full bg-crimson/4 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Creative Gallery
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Art</span>
          </h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">
            A collection of AI-generated artwork and music. Explore images crafted with diffusion models
            and tracks composed by AI — each with full generation metadata and prompts.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-foreground/40">
              <Sparkles size={13} className="text-quantum/50" />
              <span className="text-foreground/70 font-semibold">{IMAGE_POSTS.length}</span> images
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/40">
              <Sparkles size={13} className="text-crimson/50" />
              <span className="text-foreground/70 font-semibold">{MUSIC_TRACKS.length}</span> tracks
            </div>
          </div>
        </motion.div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SECTIONS.map((section, i) => {
            const Icon = section.icon;
            const ac = ACCENT_STYLES[section.accent];

            return (
              <motion.div
                key={section.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
              >
                <Link href={section.href} className="block group">
                  <div
                    className={`glass-card border ${ac.border} ${ac.glow} p-8 transition-all duration-500 relative overflow-hidden`}
                  >
                    {/* Background gradient */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${ac.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon + badge */}
                      <div className="flex items-center justify-between mb-6">
                        <div
                          className={`w-14 h-14 rounded-2xl ${ac.icon} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon size={28} />
                        </div>
                        <span
                          className={`text-xs font-mono px-3 py-1 rounded-full border ${ac.badge}`}
                        >
                          {section.count} {section.unit}
                        </span>
                      </div>

                      {/* Title */}
                      <h2 className="text-2xl font-serif font-bold mb-3">
                        {section.title}
                      </h2>

                      {/* Description */}
                      <p className="text-sm text-foreground/45 leading-relaxed mb-6">
                        {section.desc}
                      </p>

                      {/* Preview thumbnails */}
                      <div className="flex gap-2 mb-6">
                        {section.preview.map((src, j) => (
                          <div
                            key={j}
                            className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 relative"
                          >
                            <Image
                              src={src}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ))}
                        {section.count > 4 && (
                          <div className="w-16 h-16 rounded-xl border border-white/10 flex items-center justify-center bg-white/5">
                            <span className="text-xs font-mono text-foreground/30">
                              +{section.count - 4}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div
                        className={`flex items-center gap-2 text-sm font-medium ${ac.arrow} group-hover:gap-3 transition-all duration-300`}
                      >
                        <span>Explore Gallery</span>
                        <ArrowRight
                          size={16}
                          className="group-hover:translate-x-1 transition-transform duration-300"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
