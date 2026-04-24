import type { Metadata } from "next";
import { UnicodeApp } from "./UnicodeApp";
import { BookOpen, Search, Filter, Copy } from "lucide-react";

export const metadata: Metadata = {
  title: "Unicode Explorer",
  description:
    "Explore the complete Unicode database — over 140,000 characters. Search by name or code point, filter by category and script block, and copy characters instantly.",
  keywords: [
    "Unicode",
    "character database",
    "code points",
    "Unicode explorer",
    "emoji",
    "symbols",
    "scripts",
    "UTF-8",
  ],
};

const FEATURES = [
  {
    icon: BookOpen,
    label: "140 000+ characters",
    desc: "The full Unicode 15 database, fetched live from unicode.org.",
  },
  {
    icon: Search,
    label: "Instant search",
    desc: "Search by character name or U+ code point.",
  },
  {
    icon: Filter,
    label: "Category & block filters",
    desc: "Filter by general category or Unicode script block.",
  },
  {
    icon: Copy,
    label: "One-click copy",
    desc: "Copy any character, U+ code, or HTML entity instantly.",
  },
];

export default function UnicodePage() {
  return (
    <div className="min-h-screen keffiyeh-bg">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[100px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/4 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-12">
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Utilities
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Unicode Explorer</span>
          </h1>
          <p className="text-foreground/50 max-w-xl leading-relaxed">
            The complete Unicode character database at your fingertips. Search
            140,000+ characters by name or code point, filter by category and
            script block, and copy any character or HTML entity with one click.
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

        {/* ── App ──────────────────────────────────────────────────────── */}
        <UnicodeApp />

        <p className="mt-12 text-center text-xs font-mono text-foreground/20">
          Data sourced from unicode.org · UnicodeData.txt (latest UCD)
        </p>
      </div>
    </div>
  );
}
