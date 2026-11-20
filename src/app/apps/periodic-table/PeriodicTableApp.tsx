"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Search,
  X,
  ArrowRightLeft,
  LayoutGrid,
  TrendingUp,
  Rows3,
  Thermometer,
  Clock,
  Sparkles,
  Palette,
  Grid2x2,
  Play,
  Pause,
  Columns2,
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { ELEMENTS } from "./lib/elements";
import { getElementExtra } from "./lib/elementExtras";
import {
  BLOCK_INFO,
  CATEGORIES,
  ORIGIN_INFO,
  getCategoryInfo,
  type CategoryKey,
  type ColorMode,
  type CosmicOrigin,
  type Element,
  type HeatmapPalette,
  type HeatmapProperty,
  type TableLayout,
  type TemperatureUnit,
  type WorkspaceView,
} from "./lib/types";
import {
  DISCOVERY_ERAS,
  PHASE_STYLES,
  formatTemperature,
  getContrastTextColor,
  getElementPropertyValue,
  getHeatmapColor,
  getPhaseAtTemperature,
  getPropertyRange,
  getWideGridPosition,
  normalizeValue,
} from "./lib/atomUtils";
import { ElementTile } from "./components/ElementTile";
import { ElementDetailPanel } from "./components/ElementDetailPanel";
import { ElementHoverCard } from "./components/ElementHoverCard";
import { PropertyHeatmapControls } from "./components/PropertyHeatmapControls";
import { ElementComparison } from "./components/ElementComparison";
import { GapShowcase } from "./components/GapShowcase";
import { PeriodicTrendsChart } from "./components/PeriodicTrendsChart";
import { ElementCardsView } from "./components/ElementCardsView";
import "./periodic-table.css";

const COLOR_MODES: { id: ColorMode; label: string; icon: React.ReactNode }[] = [
  { id: "category", label: "Category", icon: <Palette size={13} /> },
  { id: "block", label: "Block (s/p/d/f)", icon: <Grid2x2 size={13} /> },
  { id: "phase", label: "State & Temp", icon: <Thermometer size={13} /> },
  { id: "origin", label: "Cosmic Origin", icon: <Sparkles size={13} /> },
  { id: "era", label: "Discovery Era", icon: <Clock size={13} /> },
  { id: "heatmap", label: "Heatmap", icon: <TrendingUp size={13} /> },
];

const TEMP_PRESETS = [
  { label: "0 K", k: 0 },
  { label: "77 K (LN₂)", k: 77 },
  { label: "298 K (STP)", k: 298.15 },
  { label: "373 K (H₂O)", k: 373.15 },
  { label: "1811 K (Fe)", k: 1811 },
  { label: "5778 K (Sun)", k: 5778 },
];

const TIMELINE_MILESTONES = [
  { label: "Antiquity", year: 1599 },
  { label: "1800", year: 1800 },
  { label: "1869 Mendeleev", year: 1869 },
  { label: "1900", year: 1900 },
  { label: "1945", year: 1945 },
  { label: "2016 (All 118)", year: 2016 },
];

export function PeriodicTableApp() {
  // ---- Core View & Selection State ----
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>("table");
  const [tableLayout, setTableLayout] = useState<TableLayout>("standard");
  const [colorMode, setColorMode] = useState<ColorMode>("category");
  const [selected, setSelected] = useState<Element | null>(null);
  const [hoverEl, setHoverEl] = useState<{
    el: Element;
    pos: { x: number; y: number };
  } | null>(null);
  const [focusedZ, setFocusedZ] = useState<number | null>(null);

  // ---- Search & Structural Filters ----
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | null>(null);
  const [blockFilter, setBlockFilter] = useState<"s" | "p" | "d" | "f" | null>(null);
  const [originFilter, setOriginFilter] = useState<CosmicOrigin | null>(null);
  const [groupFilter, setGroupFilter] = useState<number | null>(null);
  const [periodFilter, setPeriodFilter] = useState<number | null>(null);
  const [fSeriesFilter, setFSeriesFilter] = useState<"lanthanide" | "actinide" | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<"Solid" | "Liquid" | "Gas" | "Unknown" | null>(null);

  // ---- Temperature Simulator State ----
  const [tempK, setTempK] = useState<number>(298.15);
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>("K");

  // ---- Discovery Timeline State ----
  const [timelineYear, setTimelineYear] = useState<number>(2016);
  const [timelinePlaying, setTimelinePlaying] = useState(false);

  // ---- Heatmap State ----
  const [heatmapProperty, setHeatmapProperty] =
    useState<HeatmapProperty>("electronegativity_pauling");
  const [heatmapPalette, setHeatmapPalette] = useState<HeatmapPalette>("viridis");
  const [logScale, setLogScale] = useState(false);
  const [filterBounds, setFilterBounds] = useState<{
    prop: HeatmapProperty;
    min: number;
    max: number;
  } | null>(null);

  // ---- Comparison State ----
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<Element | null>(null);
  const [compareB, setCompareB] = useState<Element | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchLower = search.toLowerCase().trim();

  // ---- Discovery Timeline Animation ----
  useEffect(() => {
    if (!timelinePlaying || colorMode !== "era") return;
    const id = setInterval(() => {
      setTimelineYear((y) => {
        const next = Math.min(2016, y + 4);
        if (next >= 2016) {
          queueMicrotask(() => setTimelinePlaying(false));
        }
        return next;
      });
    }, 90);
    return () => clearInterval(id);
  }, [timelinePlaying, colorMode]);

  // ---- Heatmap Range & Colors ----
  const propertyRange = useMemo(
    () => getPropertyRange(ELEMENTS, heatmapProperty),
    [heatmapProperty]
  );

  const effectiveFilterMin =
    filterBounds?.prop === heatmapProperty
      ? Math.max(propertyRange.min, Math.min(propertyRange.max, filterBounds.min))
      : propertyRange.min;
  const effectiveFilterMax =
    filterBounds?.prop === heatmapProperty
      ? Math.max(propertyRange.min, Math.min(propertyRange.max, filterBounds.max))
      : propertyRange.max;

  const heatmapStyles = useMemo(() => {
    if (colorMode !== "heatmap") return null;
    const map = new Map<number, { bg: string; fg: string } | null>();
    const useLog = logScale && propertyRange.min > 0;
    for (const el of ELEMENTS) {
      const val = getElementPropertyValue(el, heatmapProperty);
      const t = normalizeValue(val, propertyRange.min, propertyRange.max, useLog);
      if (t === null) {
        map.set(el.number, null);
      } else {
        const c = getHeatmapColor(t, heatmapPalette);
        map.set(el.number, { bg: c.rgb, fg: getContrastTextColor(c.r, c.g, c.b) });
      }
    }
    return map;
  }, [colorMode, heatmapProperty, propertyRange, heatmapPalette, logScale]);

  // ---- Phase Counts at Current Temperature ----
  const phaseCounts = useMemo(() => {
    const counts = { Solid: 0, Liquid: 0, Gas: 0, Unknown: 0 };
    for (const el of ELEMENTS) {
      counts[getPhaseAtTemperature(el, tempK)]++;
    }
    return counts;
  }, [tempK]);

  // ---- Discovered Count at Timeline Year ----
  const discoveredCount = useMemo(() => {
    let count = 0;
    for (const el of ELEMENTS) {
      const yr = getElementExtra(el.number).discoveryYear;
      if (yr !== null && yr <= timelineYear) count++;
    }
    return count;
  }, [timelineYear]);

  // ---- Unified Matching Filter ----
  const hasAnyFilter = Boolean(
    searchLower ||
      categoryFilter ||
      blockFilter ||
      originFilter ||
      groupFilter !== null ||
      periodFilter !== null ||
      fSeriesFilter !== null ||
      phaseFilter !== null
  );

  const matchingIds = useMemo(() => {
    if (!hasAnyFilter) return null;
    const ids = new Set<number>();
    for (const el of ELEMENTS) {
      const extra = getElementExtra(el.number);
      if (categoryFilter && getCategoryInfo(el.category).key !== categoryFilter) {
        continue;
      }
      if (blockFilter && el.block !== blockFilter) continue;
      if (originFilter && extra.origin !== originFilter) continue;
      if (groupFilter !== null && el.group !== groupFilter) continue;
      if (periodFilter !== null && el.period !== periodFilter) continue;
      if (
        fSeriesFilter === "lanthanide" &&
        !(el.number >= 57 && el.number <= 71)
      ) {
        continue;
      }
      if (
        fSeriesFilter === "actinide" &&
        !(el.number >= 89 && el.number <= 103)
      ) {
        continue;
      }
      if (phaseFilter && getPhaseAtTemperature(el, tempK) !== phaseFilter) {
        continue;
      }
      if (searchLower) {
        const hay = [
          el.name,
          el.symbol,
          String(el.number),
          el.category,
          el.discovered_by,
          el.appearance ?? "",
          `${el.block}-block`,
          el.phase,
          ...extra.uses,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(searchLower)) continue;
      }
      ids.add(el.number);
    }
    return ids;
  }, [
    hasAnyFilter,
    categoryFilter,
    blockFilter,
    originFilter,
    groupFilter,
    periodFilter,
    fSeriesFilter,
    phaseFilter,
    tempK,
    searchLower,
  ]);

  // Elements filtered for Cards Gallery
  const filteredElements = useMemo(() => {
    if (!matchingIds) return ELEMENTS;
    return ELEMENTS.filter((el) => matchingIds.has(el.number));
  }, [matchingIds]);

  // Elements dimmed by Heatmap range or Era Timeline
  const dimmedIds = useMemo(() => {
    const dim = new Set<number>();
    if (matchingIds) {
      for (const el of ELEMENTS) {
        if (!matchingIds.has(el.number)) dim.add(el.number);
      }
    }
    if (colorMode === "heatmap") {
      for (const el of ELEMENTS) {
        const val = getElementPropertyValue(el, heatmapProperty);
        if (
          val === null ||
          val < effectiveFilterMin - 1e-9 ||
          val > effectiveFilterMax + 1e-9
        ) {
          dim.add(el.number);
        }
      }
    }
    if (colorMode === "era" && timelineYear < 2016) {
      for (const el of ELEMENTS) {
        const yr = getElementExtra(el.number).discoveryYear;
        if (yr === null || yr > timelineYear) {
          dim.add(el.number);
        }
      }
    }
    return dim;
  }, [
    matchingIds,
    colorMode,
    heatmapProperty,
    effectiveFilterMin,
    effectiveFilterMax,
    timelineYear,
  ]);

  // ---- Handlers ----
  const handleCompareSelect = useCallback(
    (el: Element) => {
      if (!compareA) {
        setCompareA(el);
        setCompareMode(true);
      } else if (!compareB && el.number !== compareA.number) {
        setCompareB(el);
        setShowComparison(true);
        setCompareMode(false);
      } else {
        setCompareA(el);
        setCompareB(null);
        setShowComparison(false);
        setCompareMode(true);
      }
    },
    [compareA, compareB]
  );

  const handleTileClick = useCallback(
    (el: Element) => {
      if (compareMode) {
        handleCompareSelect(el);
        return;
      }
      setFocusedZ(el.number);
      setSelected(el);
    },
    [compareMode, handleCompareSelect]
  );

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

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setCategoryFilter(null);
    setBlockFilter(null);
    setOriginFilter(null);
    setGroupFilter(null);
    setPeriodFilter(null);
    setFSeriesFilter(null);
    setPhaseFilter(null);
  }, []);

  // ---- 2D Keyboard Navigation on Table ----
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";

      if (e.key === "/" && !isInput && !selected && !showComparison) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (selected || showComparison || isInput) return;

      if (e.key === "Escape") {
        if (compareMode || compareA) {
          setCompareMode(false);
          setCompareA(null);
          setCompareB(null);
        } else if (hasAnyFilter) {
          clearAllFilters();
        } else {
          setFocusedZ(null);
        }
        return;
      }

      if (e.key === "Enter" && focusedZ !== null) {
        const el = ELEMENTS.find((x) => x.number === focusedZ);
        if (el) {
          e.preventDefault();
          handleTileClick(el);
        }
        return;
      }

      if (
        workspaceView === "table" &&
        (e.key === "ArrowRight" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowUp")
      ) {
        e.preventDefault();
        const cur =
          ELEMENTS.find((x) => x.number === focusedZ) ?? ELEMENTS[0];

        if (focusedZ === null) {
          setFocusedZ(cur.number);
          return;
        }

        const getCoord = (item: Element) =>
          tableLayout === "wide"
            ? getWideGridPosition(item)
            : { col: item.xpos, row: item.ypos };

        const curPos = getCoord(cur);

        if (e.key === "ArrowRight") {
          const next = ELEMENTS.find((x) => x.number === cur.number + 1);
          if (next) setFocusedZ(next.number);
        } else if (e.key === "ArrowLeft") {
          const prev = ELEMENTS.find((x) => x.number === cur.number - 1);
          if (prev) setFocusedZ(prev.number);
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          const dir = e.key === "ArrowDown" ? 1 : -1;
          const candidates = ELEMENTS.filter((item) => {
            const p = getCoord(item);
            return dir > 0 ? p.row > curPos.row : p.row < curPos.row;
          });
          if (candidates.length === 0) return;
          // Pick closest row in direction, then closest column
          candidates.sort((a, b) => {
            const pa = getCoord(a);
            const pb = getCoord(b);
            const colDiffA = Math.abs(pa.col - curPos.col);
            const colDiffB = Math.abs(pb.col - curPos.col);
            const sameColA = colDiffA === 0 ? 0 : 1;
            const sameColB = colDiffB === 0 ? 0 : 1;
            if (sameColA !== sameColB) return sameColA - sameColB;
            const rowDistA = Math.abs(pa.row - curPos.row);
            const rowDistB = Math.abs(pb.row - curPos.row);
            if (sameColA === 0) return rowDistA - rowDistB;
            return rowDistA * 2 + colDiffA - (rowDistB * 2 + colDiffB);
          });
          setFocusedZ(candidates[0].number);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    selected,
    showComparison,
    compareMode,
    compareA,
    hasAnyFilter,
    clearAllFilters,
    focusedZ,
    workspaceView,
    tableLayout,
    handleTileClick,
  ]);

  // GapShowcase live element (hovered -> focused -> default Carbon)
  const showcaseElement = useMemo(() => {
    if (hoverEl) return hoverEl.el;
    if (focusedZ !== null) {
      return ELEMENTS.find((x) => x.number === focusedZ) ?? ELEMENTS[5];
    }
    return ELEMENTS[5]; // Carbon
  }, [hoverEl, focusedZ]);

  const isShowcaseIdle = !hoverEl && focusedZ === null;

  const legendCategories = useMemo(() => Object.values(CATEGORIES), []);

  return (
    <div className="flex flex-col gap-3.5">
      {/* ---- Top Toolbar Row 1: Workspace + Search + Unit/Layout/Compare ---- */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Workspace Switcher */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">
          {[
            { id: "table" as WorkspaceView, label: "Table", icon: <LayoutGrid size={13} /> },
            { id: "trends" as WorkspaceView, label: "Trends", icon: <TrendingUp size={13} /> },
            { id: "cards" as WorkspaceView, label: "Cards", icon: <Rows3 size={13} /> },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setWorkspaceView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                workspaceView === v.id
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, symbol, Z, uses, discoverer… (/)"
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right Controls: Unit + Layout + Compare */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Temperature Unit Switcher */}
          <div
            className="inline-flex rounded-xl p-0.5 bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10"
            title="Temperature display unit"
          >
            {(["K", "C", "F"] as TemperatureUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setTempUnit(u)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors ${
                  tempUnit === u
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {u === "K" ? "K" : `°${u}`}
              </button>
            ))}
          </div>

          {/* 18-Col / 32-Col Table Layout Toggle */}
          {workspaceView === "table" && (
            <button
              type="button"
              onClick={() =>
                setTableLayout((l) => (l === "standard" ? "wide" : "standard"))
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-colors ${
                tableLayout === "wide"
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-semibold"
                  : "border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
              }`}
              title="Toggle 18-column compact vs true 32-column wide layout"
            >
              <Columns2 size={13} />
              {tableLayout === "wide" ? "32-Col" : "18-Col"}
            </button>
          )}

          {/* Compare Button / Status */}
          <button
            type="button"
            onClick={() => {
              if (compareA && !compareB) {
                setCompareA(null);
                setCompareMode(false);
              } else {
                setCompareMode((m) => !m);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              compareMode || compareA
                ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                : "border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
            }`}
          >
            <ArrowRightLeft size={13} />
            {compareA && !compareB
              ? `Compare: ${compareA.symbol} vs ?`
              : compareMode
                ? "Pick 2 elements…"
                : "Compare"}
          </button>
        </div>
      </div>

      {/* ---- Toolbar Row 2: Color Modes + Active Filter Badges ---- */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {workspaceView === "table" && (
          <div className="flex flex-wrap items-center gap-1.5">
            {COLOR_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setColorMode(m.id);
                  setTimelinePlaying(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  colorMode === m.id
                    ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 shadow-sm"
                    : "border-slate-200 dark:border-white/8 bg-white/70 dark:bg-white/[0.025] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/[0.06]"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>
        )}

        {hasAnyFilter && (
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            {groupFilter !== null && (
              <button
                type="button"
                onClick={() => setGroupFilter(null)}
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/35"
              >
                Group {groupFilter} <X size={11} />
              </button>
            )}
            {periodFilter !== null && (
              <button
                type="button"
                onClick={() => setPeriodFilter(null)}
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/35"
              >
                Period {periodFilter} <X size={11} />
              </button>
            )}
            {fSeriesFilter && (
              <button
                type="button"
                onClick={() => setFSeriesFilter(null)}
                className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/35 capitalize"
              >
                {fSeriesFilter}s <X size={11} />
              </button>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10"
            >
              Clear filters ({matchingIds?.size ?? 118}) <X size={11} />
            </button>
          </div>
        )}
      </div>

      {/* ---- Toolbar Row 3: Contextual Control / Interactive Legend Bar ---- */}
      {workspaceView === "table" && (
        <>
          {colorMode === "heatmap" && (
            <PropertyHeatmapControls
              property={heatmapProperty}
              onPropertyChange={(p) => {
                setHeatmapProperty(p);
                setFilterBounds(null);
              }}
              palette={heatmapPalette}
              onPaletteChange={setHeatmapPalette}
              logScale={logScale}
              onLogScaleChange={setLogScale}
              tempUnit={tempUnit}
              rangeMin={propertyRange.min}
              rangeMax={propertyRange.max}
              filterMin={effectiveFilterMin}
              filterMax={effectiveFilterMax}
              onFilterChange={(min, max) =>
                setFilterBounds({ prop: heatmapProperty, min, max })
              }
              onReset={() => {
                setFilterBounds(null);
                setLogScale(false);
                setHeatmapPalette("viridis");
              }}
            />
          )}

          {colorMode === "phase" && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/8 bg-white/85 dark:bg-white/[0.025] space-y-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <Thermometer size={15} className="text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Temperature Simulator:
                  </span>
                  <span className="font-mono text-sm font-bold text-cyan-700 dark:text-cyan-300 min-w-[74px]">
                    {formatTemperature(tempK, tempUnit, 0)}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={6500}
                  step={5}
                  value={tempK}
                  onChange={(e) => setTempK(parseFloat(e.target.value))}
                  aria-label="Temperature in Kelvin"
                  className="flex-1 min-w-[180px] accent-cyan-500 cursor-pointer"
                />

                {/* Phase filter pills with live counts */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {(["Solid", "Liquid", "Gas", "Unknown"] as const).map((ph) => {
                    const st = PHASE_STYLES[ph];
                    const active = phaseFilter === ph;
                    return (
                      <button
                        key={ph}
                        type="button"
                        onClick={() =>
                          setPhaseFilter((prev) => (prev === ph ? null : ph))
                        }
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono border transition-all ${
                          active ? "ring-1 ring-cyan-400 font-semibold" : "opacity-85 hover:opacity-100"
                        }`}
                        style={{
                          backgroundColor: `${st.hex}18`,
                          borderColor: `${st.hex}45`,
                          color: st.hex,
                        }}
                      >
                        {st.label}: {phaseCounts[ph]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400 mr-1">
                  PRESETS:
                </span>
                {TEMP_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setTempK(p.k)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors ${
                      Math.abs(tempK - p.k) < 1
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-700 dark:text-cyan-200 font-semibold"
                        : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colorMode === "era" && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-white/8 bg-white/85 dark:bg-white/[0.025] space-y-2.5">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (timelineYear >= 2016 && !timelinePlaying) {
                      setTimelineYear(1600);
                      setTimelinePlaying(true);
                    } else {
                      setTimelinePlaying((p) => !p);
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-xs font-medium hover:bg-cyan-500/25 transition-colors shrink-0"
                >
                  {timelinePlaying ? <Pause size={12} /> : <Play size={12} />}
                  {timelinePlaying ? "Pause" : "Time-Lapse"}
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Year:
                  </span>
                  <span className="font-mono text-sm font-bold text-cyan-700 dark:text-cyan-300">
                    {timelineYear <= 1599 ? "Antiquity" : `${timelineYear} CE`}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    ({discoveredCount}/118 known)
                  </span>
                </div>

                <input
                  type="range"
                  min={1599}
                  max={2016}
                  step={1}
                  value={timelineYear}
                  onChange={(e) => {
                    setTimelinePlaying(false);
                    setTimelineYear(parseInt(e.target.value, 10));
                  }}
                  aria-label="Discovery timeline year"
                  className="flex-1 min-w-[180px] accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {TIMELINE_MILESTONES.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => {
                        setTimelinePlaying(false);
                        setTimelineYear(m.year);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors ${
                        timelineYear === m.year
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-700 dark:text-cyan-200 font-semibold"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.08]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {DISCOVERY_ERAS.map((era) => (
                    <span
                      key={era.id}
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-400"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: era.hex }}
                      />
                      {era.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {colorMode === "category" && (
            <div className="flex flex-wrap gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-white/75 dark:bg-white/[0.02]">
              {legendCategories.map((cat) => {
                const active = categoryFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() =>
                      setCategoryFilter((prev) =>
                        prev === cat.key ? null : cat.key
                      )
                    }
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      active
                        ? "ring-1 ring-cyan-400 shadow-sm"
                        : categoryFilter && !active
                          ? "opacity-35 hover:opacity-80 border-transparent"
                          : "border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05]"
                    }`}
                    style={{
                      backgroundColor: active ? `${cat.hex}22` : undefined,
                      borderColor: active ? `${cat.hex}65` : undefined,
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-sm border shrink-0"
                      style={{
                        backgroundColor: `${cat.hex}35`,
                        borderColor: cat.hex,
                      }}
                    />
                    <span
                      className="text-[color:var(--l)] dark:text-[color:var(--d)]"
                      style={{
                        ["--l" as string]: cat.lightText,
                        ["--d" as string]: cat.darkText,
                      }}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {colorMode === "block" && (
            <div className="flex flex-wrap gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-white/75 dark:bg-white/[0.02]">
              {(["s", "p", "d", "f"] as const).map((blk) => {
                const info = BLOCK_INFO[blk];
                const active = blockFilter === blk;
                return (
                  <button
                    key={blk}
                    type="button"
                    onClick={() =>
                      setBlockFilter((prev) => (prev === blk ? null : blk))
                    }
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs border transition-all ${
                      active
                        ? "ring-1 ring-cyan-400 font-semibold"
                        : blockFilter && !active
                          ? "opacity-35 hover:opacity-80"
                          : "hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: `${info.hex}18`,
                      borderColor: `${info.hex}45`,
                      color: info.hex,
                    }}
                    title={info.description}
                  >
                    <span className="font-mono font-bold">{info.label}</span>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 hidden sm:inline">
                      {info.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {colorMode === "origin" && (
            <div className="flex flex-wrap gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/8 bg-white/75 dark:bg-white/[0.02]">
              {(Object.keys(ORIGIN_INFO) as CosmicOrigin[]).map((origKey) => {
                const info = ORIGIN_INFO[origKey];
                const active = originFilter === origKey;
                return (
                  <button
                    key={origKey}
                    type="button"
                    onClick={() =>
                      setOriginFilter((prev) =>
                        prev === origKey ? null : origKey
                      )
                    }
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      active
                        ? "ring-1 ring-cyan-400 font-semibold"
                        : originFilter && !active
                          ? "opacity-35 hover:opacity-80"
                          : ""
                    }`}
                    style={{
                      backgroundColor: `${info.hex}18`,
                      borderColor: `${info.hex}45`,
                      color: info.hex,
                    }}
                    title={info.description}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: info.hex }}
                    />
                    {info.label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ---- MAIN WORKSPACE VIEW ---- */}
      {workspaceView === "table" && (
        <div className="overflow-x-auto pb-2">
          <div
            className={`grid gap-[3px] p-2.5 sm:p-3.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-[#080b14]/75 backdrop-blur-md shadow-sm ${
              tableLayout === "wide" ? "min-w-[1180px]" : "min-w-[920px]"
            }`}
            style={{
              gridTemplateColumns:
                tableLayout === "wide"
                  ? "22px repeat(32, minmax(0, 1fr))"
                  : "22px repeat(18, minmax(0, 1fr))",
              gridTemplateRows:
                tableLayout === "wide"
                  ? "auto repeat(7, minmax(40px, 1fr))"
                  : "auto repeat(10, minmax(0, 1fr))",
            }}
          >
            {/* Corner label */}
            <div
              className="flex items-center justify-center text-[9px] font-mono text-slate-400 dark:text-slate-500"
              style={{ gridColumnStart: 1, gridRowStart: 1 }}
            >
              P\G
            </div>

            {/* Period labels 1..7 */}
            {[1, 2, 3, 4, 5, 6, 7].map((p) => (
              <button
                key={`period-${p}`}
                type="button"
                onClick={() =>
                  setPeriodFilter((prev) => (prev === p ? null : p))
                }
                className={`flex items-center justify-center text-[10px] font-mono rounded transition-colors ${
                  periodFilter === p
                    ? "bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-bold"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5"
                }`}
                style={{ gridColumnStart: 1, gridRowStart: p + 1 }}
                title={`Filter Period ${p}`}
              >
                {p}
              </button>
            ))}

            {/* Group Headers (1..18 in standard view) */}
            {tableLayout === "standard" &&
              Array.from({ length: 18 }, (_, i) => i + 1).map((g) => (
                <button
                  key={`group-${g}`}
                  type="button"
                  onClick={() =>
                    setGroupFilter((prev) => (prev === g ? null : g))
                  }
                  className={`py-0.5 text-[10px] font-mono rounded text-center transition-colors ${
                    groupFilter === g
                      ? "bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 font-bold"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5"
                  }`}
                  style={{ gridColumnStart: g + 1, gridRowStart: 1 }}
                  title={`Filter Group ${g}`}
                >
                  {g}
                </button>
              ))}

            {/* 32-Col headers */}
            {tableLayout === "wide" && (
              <>
                <div
                  className="text-[9px] font-mono text-slate-400 text-center py-0.5"
                  style={{ gridColumn: "2 / 4", gridRowStart: 1 }}
                >
                  s-block
                </div>
                <div
                  className="text-[9px] font-mono text-purple-500 dark:text-purple-400 text-center py-0.5"
                  style={{ gridColumn: "4 / 19", gridRowStart: 1 }}
                >
                  f-block (Lanthanides / Actinides)
                </div>
                <div
                  className="text-[9px] font-mono text-blue-500 dark:text-blue-400 text-center py-0.5"
                  style={{ gridColumn: "19 / 28", gridRowStart: 1 }}
                >
                  d-block
                </div>
                <div
                  className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 text-center py-0.5"
                  style={{ gridColumn: "28 / 34", gridRowStart: 1 }}
                >
                  p-block
                </div>
              </>
            )}

            {/* Embedded Gap Live Showcase in 18-col standard layout */}
            {tableLayout === "standard" && (
              <GapShowcase
                element={showcaseElement}
                tempK={tempK}
                tempUnit={tempUnit}
                isIdlePreview={isShowcaseIdle}
                gridColumn="4 / 14"
                gridRow="2 / 5"
                onInspect={handleTileClick}
              />
            )}

            {/* Standard 18-col Lanthanide & Actinide placeholders + f-block labels */}
            {tableLayout === "standard" && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setFSeriesFilter((prev) =>
                      prev === "lanthanide" ? null : "lanthanide"
                    )
                  }
                  className={`flex items-center justify-center text-[10px] font-mono rounded-md border transition-colors ${
                    fSeriesFilter === "lanthanide"
                      ? "bg-indigo-500/30 border-indigo-400 text-indigo-800 dark:text-indigo-200 font-bold"
                      : "bg-indigo-500/12 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/22"
                  }`}
                  style={{ gridColumnStart: 4, gridRowStart: 7 }}
                  title="Filter Lanthanides (57–71)"
                >
                  57–71
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFSeriesFilter((prev) =>
                      prev === "actinide" ? null : "actinide"
                    )
                  }
                  className={`flex items-center justify-center text-[10px] font-mono rounded-md border transition-colors ${
                    fSeriesFilter === "actinide"
                      ? "bg-pink-500/30 border-pink-400 text-pink-800 dark:text-pink-200 font-bold"
                      : "bg-pink-500/12 border-pink-500/30 text-pink-700 dark:text-pink-300 hover:bg-pink-500/22"
                  }`}
                  style={{ gridColumnStart: 4, gridRowStart: 8 }}
                  title="Filter Actinides (89–103)"
                >
                  89–103
                </button>

                {/* Subtle spacer row between main table & f-block */}
                <div
                  className="h-3"
                  style={{ gridColumn: "1 / 20", gridRowStart: 9 }}
                />

                <div
                  className="flex items-center justify-end pr-1 text-[9px] font-mono text-indigo-600 dark:text-indigo-400"
                  style={{ gridColumn: "1 / 4", gridRowStart: 10 }}
                >
                  4f · La–Lu
                </div>
                <div
                  className="flex items-center justify-end pr-1 text-[9px] font-mono text-pink-600 dark:text-pink-400"
                  style={{ gridColumn: "1 / 4", gridRowStart: 11 }}
                >
                  5f · Ac–Lr
                </div>
              </>
            )}

            {/* All 118 Element Tiles */}
            {ELEMENTS.map((el) => {
              const pos =
                tableLayout === "wide"
                  ? getWideGridPosition(el)
                  : { col: el.xpos, row: el.ypos };
              const compareSlot =
                compareA?.number === el.number
                  ? "A"
                  : compareB?.number === el.number
                    ? "B"
                    : null;

              return (
                <ElementTile
                  key={el.number}
                  element={el}
                  colorMode={colorMode}
                  tempK={tempK}
                  tempUnit={tempUnit}
                  heatmapProperty={heatmapProperty}
                  heatmapStyle={
                    colorMode === "heatmap"
                      ? heatmapStyles?.get(el.number) ?? null
                      : undefined
                  }
                  gridCol={pos.col + 1}
                  gridRow={pos.row + 1}
                  compact={tableLayout === "wide"}
                  highlight={matchingIds !== null && matchingIds.has(el.number)}
                  focused={focusedZ === el.number}
                  dimmed={dimmedIds.has(el.number)}
                  compareSlot={compareSlot}
                  onClick={handleTileClick}
                  onHover={handleHover}
                  onCompareSelect={handleCompareSelect}
                />
              );
            })}
          </div>
        </div>
      )}

      {workspaceView === "trends" && (
        <PeriodicTrendsChart
          elements={ELEMENTS}
          matchingIds={matchingIds}
          tempUnit={tempUnit}
          onSelectElement={(el) => setSelected(el)}
        />
      )}

      {workspaceView === "cards" && (
        <ElementCardsView
          elements={filteredElements}
          tempK={tempK}
          tempUnit={tempUnit}
          compareA={compareA}
          compareB={compareB}
          onSelectElement={(el) => setSelected(el)}
          onCompareSelect={handleCompareSelect}
        />
      )}

      {/* ---- Keyboard / Action Hint ---- */}
      <div className="text-center text-[11px] font-mono text-slate-500 dark:text-slate-400">
        Click tile for 3D lab · Right-click or use Compare to contrast two elements · Arrow keys + Enter to navigate · Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-white/10">/</kbd> to search
      </div>

      {/* ---- Floating Hover Card (used in 32-col wide layout where GapShowcase is hidden) ---- */}
      <AnimatePresence>
        {hoverEl &&
          !selected &&
          !showComparison &&
          workspaceView === "table" &&
          tableLayout === "wide" && (
            <ElementHoverCard
              element={hoverEl.el}
              tempK={tempK}
              position={hoverEl.pos}
            />
          )}
      </AnimatePresence>

      {/* ---- Element Detail Panel ---- */}
      <AnimatePresence>
        {selected && (
          <ElementDetailPanel
            element={selected}
            tempK={tempK}
            tempUnit={tempUnit}
            compareSlot={
              compareA?.number === selected.number
                ? "A"
                : compareB?.number === selected.number
                  ? "B"
                  : null
            }
            onClose={() => setSelected(null)}
            onNavigate={(el) => {
              setSelected(el);
              setFocusedZ(el.number);
            }}
            onCompareSelect={handleCompareSelect}
          />
        )}
      </AnimatePresence>

      {/* ---- Comparison Modal ---- */}
      <AnimatePresence>
        {showComparison && compareA && compareB && (
          <ElementComparison
            elementA={compareA}
            elementB={compareB}
            tempUnit={tempUnit}
            onChangeA={(el) => setCompareA(el)}
            onChangeB={(el) => setCompareB(el)}
            onSwap={() => {
              setCompareA(compareB);
              setCompareB(compareA);
            }}
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
