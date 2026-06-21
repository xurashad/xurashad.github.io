"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, X, ArrowRightLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ELEMENTS } from "./lib/elements";
import {
  CATEGORIES,
  getCategoryInfo,
  type Element,
  type HeatmapProperty,
} from "./lib/types";
import { ElementTile } from "./components/ElementTile";
import { ElementDetailPanel } from "./components/ElementDetailPanel";
import { ElementHoverCard } from "./components/ElementHoverCard";
import { PropertyHeatmapControls } from "./components/PropertyHeatmapControls";
import { ElementComparison } from "./components/ElementComparison";
import {
  getHeatmapColor,
  getPropertyRange,
  normalizeValue,
} from "./lib/atomUtils";

export function PeriodicTableApp() {
  // ---- State ----
  const [selected, setSelected] = useState<Element | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [heatmapProperty, setHeatmapProperty] =
    useState<HeatmapProperty>("category");
  const [hoverEl, setHoverEl] = useState<{
    el: Element;
    pos: { x: number; y: number };
  } | null>(null);

  // Range filter state
  const [filterMin, setFilterMin] = useState(0);
  const [filterMax, setFilterMax] = useState(Infinity);

  // Comparison state
  const [compareA, setCompareA] = useState<Element | null>(null);
  const [compareB, setCompareB] = useState<Element | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const searchLower = search.toLowerCase().trim();
  const isHeatmapMode = heatmapProperty !== "category";

  // ---- Property range for heatmap ----
  const propertyRange = useMemo(() => {
    if (!isHeatmapMode) return { min: 0, max: 1 };
    return getPropertyRange(
      ELEMENTS,
      heatmapProperty as keyof Element
    );
  }, [heatmapProperty, isHeatmapMode]);

  // Initialize filter range when property changes
  const effectiveFilterMin = useMemo(
    () => (filterMin === 0 ? propertyRange.min : filterMin),
    [filterMin, propertyRange.min]
  );
  const effectiveFilterMax = useMemo(
    () => (filterMax === Infinity ? propertyRange.max : filterMax),
    [filterMax, propertyRange.max]
  );

  // ---- Filtering ----
  const matchingIds = useMemo(() => {
    if (!searchLower && !categoryFilter) return null;
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

  // ---- Heatmap colors ----
  const heatmapColors = useMemo(() => {
    if (!isHeatmapMode) return null;
    const colors = new Map<number, string | null>();
    ELEMENTS.forEach((el) => {
      const val = el[heatmapProperty as keyof Element] as number | null;
      const normalized = normalizeValue(
        val,
        propertyRange.min,
        propertyRange.max
      );
      colors.set(el.number, normalized !== null ? getHeatmapColor(normalized) : null);
    });
    return colors;
  }, [isHeatmapMode, heatmapProperty, propertyRange]);

  // ---- Which elements are outside range filter ----
  const dimmedElements = useMemo(() => {
    if (!isHeatmapMode) return new Set<number>();
    const dimmed = new Set<number>();
    ELEMENTS.forEach((el) => {
      const val = el[heatmapProperty as keyof Element] as number | null;
      if (val === null || val === undefined || val < effectiveFilterMin || val > effectiveFilterMax) {
        dimmed.add(el.number);
      }
    });
    return dimmed;
  }, [isHeatmapMode, heatmapProperty, effectiveFilterMin, effectiveFilterMax]);

  // ---- Handlers ----
  const handleClick = useCallback((el: Element) => setSelected(el), []);
  const handleNavigate = useCallback((el: Element) => setSelected(el), []);

  const handleHover = useCallback(
    (el: Element | null, pos: { x: number; y: number }) => {
      if (el) {
        setHoverEl({ el, pos });
      } else {
        setHoverEl(null);
      }
    },
    []
  );

  const handleCompareSelect = useCallback(
    (el: Element) => {
      if (!compareA) {
        setCompareA(el);
      } else if (!compareB && el.number !== compareA.number) {
        setCompareB(el);
        setShowComparison(true);
      } else {
        // Reset and start over
        setCompareA(el);
        setCompareB(null);
        setShowComparison(false);
      }
    },
    [compareA, compareB]
  );

  const handlePropertyChange = useCallback(
    (p: HeatmapProperty) => {
      setHeatmapProperty(p);
      setFilterMin(0);
      setFilterMax(Infinity);
    },
    []
  );

  const handleFilterChange = useCallback((min: number, max: number) => {
    setFilterMin(min);
    setFilterMax(max);
  }, []);

  const handleResetHeatmap = useCallback(() => {
    setHeatmapProperty("category");
    setFilterMin(0);
    setFilterMax(Infinity);
  }, []);

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
    <div className="flex flex-col gap-4">
      {/* ---- Search + Controls bar ---- */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, symbol, or number…"
              className="w-full pl-9 pr-8 py-2 text-sm bg-white/[0.04] border border-white/8 rounded-lg text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
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

          {/* Compare indicator */}
          <AnimatePresence>
            {compareA && !showComparison && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
              >
                <ArrowRightLeft size={12} />
                Comparing: {compareA.symbol}
                {compareB ? ` vs ${compareB.symbol}` : " — right-click another"}
                <button
                  onClick={() => {
                    setCompareA(null);
                    setCompareB(null);
                  }}
                  className="ml-1 hover:text-white"
                >
                  <X size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category filter clear */}
          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter(null)}
              className="text-xs font-mono px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-foreground/70 hover:bg-white/10 transition-colors flex items-center gap-1.5"
            >
              <X size={12} /> {categoryFilter}
            </button>
          )}
        </div>

        {/* Heatmap controls */}
        <PropertyHeatmapControls
          property={heatmapProperty}
          onPropertyChange={handlePropertyChange}
          rangeMin={propertyRange.min}
          rangeMax={propertyRange.max}
          filterMin={effectiveFilterMin}
          filterMax={effectiveFilterMax}
          onFilterChange={handleFilterChange}
          onReset={handleResetHeatmap}
        />
      </div>

      {/* ---- Periodic Table Grid ---- */}
      <div className="overflow-x-auto pb-2">
        <div
          className="grid gap-[3px] p-3 bg-black/30 border border-white/6 rounded-xl backdrop-blur-sm min-w-[900px]"
          style={{
            gridTemplateColumns: "repeat(18, minmax(0, 1fr))",
            gridTemplateRows: "repeat(10, minmax(0, 1fr))",
          }}
        >
          {/* Lanthanide/Actinide placeholders */}
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

          {/* Spacer */}
          <div
            className="flex items-center text-[0.5rem] text-foreground/20 font-mono col-span-2"
            style={{ gridColumnStart: 1, gridRowStart: 8 }}
          />

          {/* Elements */}
          {ELEMENTS.map((el) => (
            <ElementTile
              key={el.number}
              element={el}
              onClick={handleClick}
              onHover={handleHover}
              onCompareSelect={handleCompareSelect}
              highlight={
                matchingIds !== null && matchingIds.has(el.number)
              }
              heatmapColor={
                isHeatmapMode
                  ? heatmapColors?.get(el.number) ?? "#333"
                  : undefined
              }
              dimmed={dimmedElements.has(el.number)}
              compareSelected={
                compareA?.number === el.number ||
                compareB?.number === el.number
              }
            />
          ))}
        </div>
      </div>

      {/* ---- Legend (only in category mode) ---- */}
      {!isHeatmapMode && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 p-4 bg-white/[0.02] border border-white/6 rounded-xl">
          {legendCategories.map((cat) => (
            <button
              key={cat.name}
              onClick={() =>
                setCategoryFilter((prev) =>
                  prev === cat.name ? null : cat.name
                )
              }
              className={`flex items-center gap-2 text-xs transition-all hover:opacity-100 ${
                categoryFilter && categoryFilter !== cat.name
                  ? "opacity-30"
                  : "opacity-80"
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-sm border flex-shrink-0"
                style={{ backgroundColor: `${cat.hex}15`, borderColor: `${cat.hex}35` }}
              />
              <span className="text-foreground/70" style={{ color: cat.hex }}>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ---- Hint text ---- */}
      <div className="text-center text-[10px] text-foreground/20 font-mono">
        Click to view details · Right-click to compare · Use arrow keys to navigate
      </div>

      {/* ---- Hover card ---- */}
      <AnimatePresence>
        {hoverEl && !selected && (
          <ElementHoverCard element={hoverEl.el} position={hoverEl.pos} />
        )}
      </AnimatePresence>

      {/* ---- Element detail panel ---- */}
      <AnimatePresence>
        {selected && (
          <ElementDetailPanel
            element={selected}
            onClose={() => setSelected(null)}
            onNavigate={handleNavigate}
          />
        )}
      </AnimatePresence>

      {/* ---- Comparison modal ---- */}
      <AnimatePresence>
        {showComparison && compareA && compareB && (
          <ElementComparison
            elementA={compareA}
            elementB={compareB}
            onClose={() => {
              setShowComparison(false);
              setCompareA(null);
              setCompareB(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
