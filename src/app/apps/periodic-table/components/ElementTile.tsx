"use client";

import { memo, useCallback, type CSSProperties } from "react";
import {
  BLOCK_INFO,
  ORIGIN_INFO,
  getCategoryInfo,
  type ColorMode,
  type Element,
  type HeatmapProperty,
  type TemperatureUnit,
} from "../lib/types";
import { getElementExtra } from "../lib/elementExtras";
import {
  PHASE_STYLES,
  formatAtomicMass,
  formatPropertyCompact,
  getDiscoveryEra,
  getElementPropertyValue,
  getPhaseAtTemperature,
  getPhaseIcon,
} from "../lib/atomUtils";

interface Props {
  element: Element;
  colorMode: ColorMode;
  tempK: number;
  tempUnit: TemperatureUnit;
  heatmapProperty: HeatmapProperty;
  heatmapStyle?: { bg: string; fg: string } | null;
  gridCol: number;
  gridRow: number;
  compact?: boolean;
  highlight: boolean;
  focused?: boolean;
  dimmed?: boolean;
  compareSlot?: "A" | "B" | null;
  onClick: (el: Element) => void;
  onHover?: (el: Element | null, pos: { x: number; y: number }) => void;
  onCompareSelect?: (el: Element) => void;
}

export const ElementTile = memo(function ElementTile({
  element,
  colorMode,
  tempK,
  tempUnit,
  heatmapProperty,
  heatmapStyle,
  gridCol,
  gridRow,
  compact = false,
  highlight,
  focused = false,
  dimmed = false,
  compareSlot = null,
  onClick,
  onHover,
  onCompareSelect,
}: Props) {
  const extra = getElementExtra(element.number);
  const dynamicPhase = getPhaseAtTemperature(element, tempK);

  // Determine theme-aware accent palette based on active colorMode
  const theme = (() => {
    if (colorMode === "block") {
      const b = BLOCK_INFO[element.block];
      return { hex: b.hex, light: b.lightText, dark: b.darkText };
    }
    if (colorMode === "phase") {
      const p = PHASE_STYLES[dynamicPhase];
      return { hex: p.hex, light: p.lightText, dark: p.darkText };
    }
    if (colorMode === "origin") {
      const o = ORIGIN_INFO[extra.origin];
      return { hex: o.hex, light: o.lightText, dark: o.darkText };
    }
    if (colorMode === "era") {
      const era = getDiscoveryEra(extra.discoveryYear);
      return { hex: era.hex, light: era.lightText, dark: era.darkText };
    }
    const cat = getCategoryInfo(element.category);
    return { hex: cat.hex, light: cat.lightText, dark: cat.darkText };
  })();

  const isHeatmap = colorMode === "heatmap";
  const hasHeatmapColor = isHeatmap && Boolean(heatmapStyle);
  const isMissingHeatmap = isHeatmap && !heatmapStyle;
  const isPredictedOrUnknown =
    Boolean(element.phase_predicted) ||
    element.category.toLowerCase().startsWith("unknown") ||
    (colorMode === "phase" && dynamicPhase === "Unknown");

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      onHover?.(element, { x: e.clientX, y: e.clientY });
    },
    [element, onHover]
  );

  const handleMouseLeave = useCallback(() => {
    onHover?.(null, { x: 0, y: 0 });
  }, [onHover]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onCompareSelect?.(element);
    },
    [element, onCompareSelect]
  );

  // Contextual bottom micro-label
  const microLabel = (() => {
    if (isHeatmap) {
      const val = getElementPropertyValue(element, heatmapProperty);
      return formatPropertyCompact(val, heatmapProperty, tempUnit);
    }
    if (colorMode === "phase") return dynamicPhase === "Unknown" ? "?" : dynamicPhase;
    if (colorMode === "era") {
      if (extra.discoveryYear === null) return "—";
      return extra.discoveryYear < 0
        ? `${Math.abs(extra.discoveryYear)} BC`
        : `${extra.discoveryYear}`;
    }
    if (colorMode === "block") return `${element.block}-blk`;
    return compact ? formatAtomicMass(element) : element.name;
  })();

  const customStyle: CSSProperties = {
    gridColumnStart: gridCol,
    gridRowStart: gridRow,
    ["--tile-glow" as string]: hasHeatmapColor
      ? `${heatmapStyle!.bg}`
      : `${theme.hex}55`,
    ["--tile-light" as string]: theme.light,
    ["--tile-dark" as string]: theme.dark,
    ...(hasHeatmapColor
      ? {
          backgroundColor: heatmapStyle!.bg,
          color: heatmapStyle!.fg,
          borderColor: "rgba(148, 163, 184, 0.35)",
        }
      : isMissingHeatmap
        ? {}
        : {
            backgroundColor: `${theme.hex}1c`,
            borderColor: `${theme.hex}55`,
          }),
  };

  return (
    <button
      type="button"
      onClick={() => onClick(element)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      style={customStyle}
      className={`
        pt-tile group flex flex-col items-center justify-between
        rounded-md border text-center select-none overflow-hidden
        ${compact ? "p-0.5 min-h-[38px]" : "px-1 py-1 min-h-[54px] sm:min-h-[60px]"}
        ${isPredictedOrUnknown ? "border-dashed" : "border-solid"}
        ${
          isMissingHeatmap
            ? "pt-hatch bg-slate-100/80 dark:bg-white/[0.03] border-slate-300/60 dark:border-white/10 text-slate-500 dark:text-slate-400"
            : !hasHeatmapColor
              ? "text-[color:var(--tile-light)] dark:text-[color:var(--tile-dark)]"
              : ""
        }
        hover:scale-[1.14] hover:z-20
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
        ${highlight ? "ring-2 ring-cyan-400 dark:ring-white/85 shadow-lg scale-[1.06] z-10" : ""}
        ${focused ? "ring-2 ring-amber-400 shadow-lg z-10" : ""}
        ${dimmed ? "opacity-20 scale-[0.95] grayscale-[40%]" : ""}
        ${compareSlot ? "ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/25 z-10" : ""}
      `}
      aria-label={`${element.name} (${element.symbol}), atomic number ${element.number}`}
      title={`${element.name} (${element.symbol}) · Z=${element.number}\nClick for 3D details · Right-click to compare`}
    >
      {/* Top row: Atomic Number + Compare/Phase/Radioactive indicator */}
      <div className="w-full flex items-center justify-between leading-none px-0.5">
        <span
          className={`font-mono font-semibold opacity-75 ${
            compact ? "text-[7px]" : "text-[8px] sm:text-[9px]"
          }`}
        >
          {element.number}
        </span>

        {compareSlot ? (
          <span className="px-1 rounded text-[7px] font-mono font-bold bg-cyan-500 text-slate-950 leading-tight">
            {compareSlot}
          </span>
        ) : (
          <span
            className={`leading-none flex items-center gap-0.5 ${
              compact ? "text-[6px]" : "text-[7px] sm:text-[8px]"
            }`}
          >
            {extra.radioactive && !compact && (
              <span
                className="opacity-70"
                title="Radioactive"
                aria-hidden="true"
              >
                ☢
              </span>
            )}
            <span className="opacity-55 hidden sm:inline">
              {getPhaseIcon(dynamicPhase)}
            </span>
          </span>
        )}
      </div>

      {/* Center: Element Symbol */}
      <span
        className={`font-bold tracking-tight leading-none ${
          compact
            ? "text-[11px] sm:text-xs"
            : "text-sm sm:text-base lg:text-[17px]"
        }`}
      >
        {element.symbol}
      </span>

      {/* Bottom: Name / Contextual property */}
      <span
        className={`w-full truncate leading-none opacity-80 ${
          compact
            ? "text-[6px] font-mono"
            : "text-[7px] sm:text-[8.5px] font-medium"
        }`}
      >
        {microLabel}
      </span>
    </button>
  );
});
