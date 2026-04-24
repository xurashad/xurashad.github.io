"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { X, Search, Copy, Check, LayoutGrid, LayoutList } from "lucide-react";
import { FONT_STYLES, CATEGORIES, convertText } from "./lib/fontData";
import { FontCard } from "./FontCard";

const QUICK_EXAMPLES = [
  "Hello World!",
  "The quick brown fox",
  "Quantum Physics",
  "𝓛𝓸𝓿𝓮 𝓘𝓼 𝓣𝓱𝓮 𝓐𝓷𝓼𝔀𝓮𝓻",
  "1337 Speak",
];

export function FontGeneratorApp() {
  const [input, setInput] = useState("Hello World!");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedAll, setCopiedAll] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Generate all converted texts */
  const generated = useMemo(() => {
    return FONT_STYLES.map((style) => ({
      ...style,
      converted: convertText(input, style.mapping),
    }));
  }, [input]);

  /* Filter by category + search */
  const filtered = useMemo(() => {
    return generated.filter((f) => {
      const catMatch = activeCategory === "All" || f.category === activeCategory;
      const searchMatch =
        !search || f.name.toLowerCase().includes(search.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [generated, search, activeCategory]);

  /* Copy-all visible */
  const handleCopyAll = useCallback(() => {
    const combined = filtered
      .map((f) => `[${f.name}]\n${f.converted}`)
      .join("\n\n");
    navigator.clipboard.writeText(combined).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  }, [filtered]);

  const wordCount = input
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const charCount = [...input].length;

  return (
    <div className="space-y-8">
      {/* ── Input area ── */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste your text here…"
            rows={3}
            className="w-full p-4 pr-10 text-base rounded-2xl glass border border-white/10 bg-transparent text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 focus:ring-2 focus:ring-quantum/15 transition-all resize-none leading-relaxed"
            aria-label="Input text to convert"
          />
          {input && (
            <button
              onClick={() => setInput("")}
              className="absolute top-3 right-3 text-foreground/30 hover:text-foreground/60 transition-colors"
              aria-label="Clear input"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick examples + char count */}
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] font-mono text-foreground/30 self-center mr-1">Try:</span>
            {QUICK_EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-xs px-2 py-1 rounded-lg border border-white/8 bg-white/4 text-foreground/40 hover:text-foreground/70 hover:border-quantum/30 hover:bg-quantum/8 transition-all"
              >
                {ex.length > 20 ? ex.slice(0, 18) + "…" : ex}
              </button>
            ))}
          </div>
          <span className="text-[10px] font-mono text-foreground/25 shrink-0">
            {charCount} chars · {wordCount} word{wordCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Filter / view controls ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                activeCategory === cat
                  ? "bg-quantum/20 text-quantum border-quantum/40 font-semibold"
                  : "border-white/8 bg-white/4 text-foreground/45 hover:border-quantum/25 hover:text-foreground/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search + view controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Search by style name */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search styles…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl glass border border-white/8 bg-transparent text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 transition-all w-36"
            />
          </div>

          {/* Copy all */}
          <button
            onClick={handleCopyAll}
            disabled={!input || !filtered.length}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              copiedAll
                ? "border-olive/30 bg-olive/10 text-olive-400"
                : "border-white/10 bg-white/5 text-foreground/55 hover:border-quantum/30 hover:bg-quantum/10 hover:text-quantum"
            }`}
          >
            {copiedAll ? <Check size={12} /> : <Copy size={12} />}
            {copiedAll ? "All copied!" : `Copy all (${filtered.length})`}
          </button>

          {/* Grid / List toggle */}
          <div className="flex items-center gap-1 glass rounded-xl p-1 border border-white/8">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                aria-label={v === "grid" ? "Grid view" : "List view"}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === v
                    ? "bg-quantum/20 text-quantum"
                    : "text-foreground/35 hover:text-foreground/60"
                }`}
              >
                {v === "grid" ? <LayoutGrid size={14} /> : <LayoutList size={14} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Result count ── */}
      <p className="text-xs font-mono text-foreground/30 -mt-4">
        Showing {filtered.length} of {FONT_STYLES.length} styles
        {search ? ` matching "${search}"` : ""}
        {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
      </p>

      {/* ── Font cards ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-foreground/30">
          <p className="text-sm">No styles match your filters.</p>
          <button
            onClick={() => { setSearch(""); setActiveCategory("All"); }}
            className="text-xs text-quantum/60 hover:text-quantum underline"
          >
            Clear filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((f) => (
            <FontCard
              key={f.name}
              name={f.name}
              category={f.category}
              text={f.converted}
              highlight={f.category === activeCategory && activeCategory !== "All"}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-w-3xl">
          {filtered.map((f) => (
            <FontCard
              key={f.name}
              name={f.name}
              category={f.category}
              text={f.converted}
              highlight={f.category === activeCategory && activeCategory !== "All"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
