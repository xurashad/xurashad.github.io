import type { Metadata } from "next";
import { Base64App } from "./Base64App";
import { Shuffle, Zap, FileSearch, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Multimedia Base64 Converter",
  description:
    "Encode files and text to Base64, decode Base64 data URLs back to files. Drag-and-drop interface supporting images, audio, video, and text. All processing happens in the browser.",
  keywords: ["Base64", "encoder", "decoder", "multimedia", "file converter", "data URL"],
};

const FEATURES = [
  {
    icon: Shuffle,
    label: "Encode & Decode",
    desc: "Convert any file or text to Base64, then decode it back.",
  },
  {
    icon: Zap,
    label: "Instant preview",
    desc: "See images, play audio & video right after decoding.",
  },
  {
    icon: FileSearch,
    label: "Raw Base64 support",
    desc: "Decode raw strings with a manual MIME selector.",
  },
  {
    icon: Lock,
    label: "100 % client-side",
    desc: "No data ever leaves your browser.",
  },
];

export default function Base64Page() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[100px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/5 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-12">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Utilities
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Base64 Converter</span>
          </h1>
          <p className="text-foreground/50 max-w-xl leading-relaxed">
            Encode any file or text to a Base64 data URL — or paste a data URL
            and decode it straight back to a viewable, downloadable file.
            Everything runs entirely in your browser.
          </p>

          {/* Feature chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="glass-card p-3 flex flex-col gap-1.5 hover:border-quantum/25 transition-colors duration-300"
              >
                <div className="flex items-center gap-2 text-quantum">
                  <Icon size={14} />
                  <span className="text-xs font-semibold text-foreground/70">{label}</span>
                </div>
                <p className="text-[11px] text-foreground/35 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── App ────────────────────────────────────────────────────────── */}
        <Base64App />

        {/* ── Info note ──────────────────────────────────────────────────── */}
        <p className="mt-12 text-center text-xs font-mono text-foreground/20">
          Max file size: 50 MB · All processing is local — nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
