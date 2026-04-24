"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X } from "lucide-react";
import { ELEMENTS } from "./lib/elements";
import { CATEGORIES, getCategoryInfo, type Element } from "./lib/types";
import { ElementTile } from "./components/ElementTile";
import { ElementModal } from "./components/ElementModal";

export function PeriodicTableApp() {
  const [selected, setSelected] = useState<Element | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const searchLower = search.toLowerCase().trim();

  const matchingIds = useMemo(() => {
    if (!searchLower && !categoryFilter) return null; // null = show all
    return new Set(
      ELEMENTS.filter((el) => {
        if (categoryFilter) {
          const cat = getCategoryInfo(el.category);
          if (cat.name !== categoryFilter) return false;
        }
        if (searchLower) {
          return (
            el.name.toLowerCase().includes(searchLower) ||
            el.symbol.toLowerCase().includes(searchLower) ||
            String(el.number).includes(searchLower)
          );
        }
        return true;
      }).map((el) => el.number)
    );
  }, [searchLower, categoryFilter]);

  const handleClick = useCallback((el: Element) => setSelected(el), []);

  // Unique legend categories
  const legendCategories = useMemo(() => {
    const seen = new Set<string>();
    return Object.values(CATEGORIES).filter((c) => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    });
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, symbol, or number…"
            className="w-full pl-9 pr-8 py-2 text-sm bg-white/[0.04] border border-white/8 rounded-lg text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-quantum/40 focus:ring-1 focus:ring-quantum/20 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10 text-foreground/40"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {categoryFilter && (
          <button
            onClick={() => setCategoryFilter(null)}
            className="text-xs font-mono px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-foreground/70 hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <X size={12} /> Clear filter: {categoryFilter}
          </button>
        )}
      </div>

      {/* Periodic Table Grid */}
      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-[3px] p-3 bg-black/30 border border-white/6 rounded-xl backdrop-blur-sm min-w-[900px]"
          style={{
            gridTemplateColumns: "repeat(18, minmax(0, 1fr))",
            gridTemplateRows: "repeat(10, minmax(0, 1fr))",
          }}
        >
          {/* Lanthanide/Actinide placeholders in main grid */}
          <div
            className="flex items-center justify-center text-[0.6rem] text-center rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-500/20 font-mono"
            style={{ gridColumnStart: 3, gridRowStart: 6 }}
          >
            57–71
          </div>
          <div
            className="flex items-center justify-center text-[0.6rem] text-center rounded-md bg-pink-900/60 text-pink-300 border border-pink-500/20 font-mono"
            style={{ gridColumnStart: 3, gridRowStart: 7 }}
          >
            89–103
          </div>

          {/* Row 8 spacer label */}
          <div
            className="flex items-center text-[0.5rem] text-foreground/20 font-mono col-span-2"
            style={{ gridColumnStart: 1, gridRowStart: 8 }}
          />

          {ELEMENTS.map((el) => (
            <ElementTile
              key={el.number}
              element={el}
              onClick={handleClick}
              highlight={matchingIds !== null && matchingIds.has(el.number)}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 p-4 bg-white/[0.02] border border-white/6 rounded-xl">
        {legendCategories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setCategoryFilter((prev) => (prev === cat.name ? null : cat.name))}
            className={`flex items-center gap-2 text-xs transition-all hover:opacity-100 ${
              categoryFilter && categoryFilter !== cat.name ? "opacity-30" : "opacity-80"
            }`}
          >
            <span className={`w-3.5 h-3.5 rounded-sm ${cat.bg} flex-shrink-0`} />
            <span className="text-foreground/70">{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Element Detail Modal */}
      {selected && <ElementModal element={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
