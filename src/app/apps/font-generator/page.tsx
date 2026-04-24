import type { Metadata } from "next";
import { FontGeneratorApp } from "./FontGeneratorApp";
import { Type, Copy, Globe, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Unicode Font Generator",
  description:
    "Transform your text into 17+ Unicode font styles — bold, italic, script, fraktur, monospace, double-struck, circled, and more. Works everywhere: Twitter, Instagram, Discord, WhatsApp, and any Unicode-capable app.",
  keywords: [
    "Unicode font generator",
    "fancy text generator",
    "bold text generator",
    "cursive text",
    "fraktur text",
    "Unicode fonts",
    "stylish text",
  ],
};

const FEATURES = [
  {
    icon: Type,
    label: "17 style variants",
    desc: "Bold, italic, script, fraktur, monospace, decorative & more.",
  },
  {
    icon: Globe,
    label: "Works everywhere",
    desc: "Paste into Twitter, Instagram, Discord, WhatsApp, anywhere.",
  },
  {
    icon: Copy,
    label: "One-click copy",
    desc: "Copy any single style or all styles at once.",
  },
  {
    icon: Zap,
    label: "Instant preview",
    desc: "All styles update in real-time as you type.",
  },
];

export default function FontGeneratorPage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[100px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/4 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">

        {/* ── Header ── */}
        <div className="mb-12">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Utilities
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Font Generator</span>
          </h1>
          <p className="text-foreground/50 max-w-xl leading-relaxed">
            Type your text and watch it transform into 17 Unicode font styles.
            Copy and paste into any app — no fonts needed, it&apos;s all Unicode.
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

        {/* ── App ── */}
        <FontGeneratorApp />

        <p className="mt-12 text-center text-xs font-mono text-foreground/20">
          All conversions use Unicode Mathematical Alphanumeric Symbols (U+1D400–U+1D7FF)
        </p>
      </div>
    </div>
  );
}
