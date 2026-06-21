"use client";

import { memo, useCallback, useRef } from "react";
import type { Element } from "../lib/types";
import { getCategoryInfo } from "../lib/types";
import { getPhaseIcon } from "../lib/atomUtils";

interface Props {
  element: Element;
  onClick: (el: Element) => void;
  onHover?: (el: Element | null, pos: { x: number; y: number }) => void;
  onCompareSelect?: (el: Element) => void;
  highlight: boolean;
  /** If set, use this color as background instead of category color */
  heatmapColor?: string | null;
  /** If true, this element is outside the current filter range */
  dimmed?: boolean;
  /** If true, this element is selected for comparison */
  compareSelected?: boolean;
}

export const ElementTile = memo(function ElementTile({
  element,
  onClick,
  onHover,
  onCompareSelect,
  highlight,
  heatmapColor,
  dimmed = false,
  compareSelected = false,
}: Props) {
  const cat = getCategoryInfo(element.category);
  const tileRef = useRef<HTMLButtonElement>(null);

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

  const bgStyle = heatmapColor
    ? { backgroundColor: heatmapColor }
    : { backgroundColor: `${cat.hex}15`, borderColor: `${cat.hex}35` };

  return (
    <button
      ref={tileRef}
      onClick={() => onClick(element)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={handleContextMenu}
      className={`
        element-tile
        relative flex flex-col items-center justify-center
        rounded-md p-0.5 md:p-1 text-center
        transition-all duration-200 ease-out
        hover:scale-[1.18] hover:z-20 border
        focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300
        ${!heatmapColor ? "" : "text-white"}
        ${highlight ? "ring-2 ring-white/80 shadow-lg scale-105 z-10" : ""}
        ${dimmed ? "opacity-15 scale-95" : ""}
        ${compareSelected ? "ring-2 ring-cyan-400 shadow-cyan-400/30 shadow-lg" : ""}
      `}
      style={{
        gridColumnStart: element.xpos,
        gridRowStart: element.ypos,
        ...bgStyle,
        // Glow on hover via box-shadow
        ...(heatmapColor ? {} : {}),
      }}
      aria-label={`${element.name} (${element.symbol}), atomic number ${element.number}`}
      title={`${element.name} — ${element.category}\nRight-click to compare`}
    >
      {/* Phase indicator */}
      <span className="absolute top-0.5 right-0.5 text-[6px] opacity-50 hidden sm:block leading-none">
        {getPhaseIcon(element.phase)}
      </span>

      {/* Atomic number */}
      <span className="text-[0.5rem] sm:text-[0.6rem] font-semibold opacity-70 leading-none" style={{ color: heatmapColor ? undefined : cat.hex }}>
        {element.number}
      </span>

      {/* Symbol */}
      <span className="text-sm sm:text-base md:text-lg font-bold leading-tight" style={{ color: heatmapColor ? undefined : cat.hex }}>
        {element.symbol}
      </span>

      {/* Name */}
      <span className="text-[0.4rem] sm:text-[0.55rem] truncate w-full opacity-60 leading-none hidden sm:block" style={{ color: heatmapColor ? undefined : cat.hex }}>
        {element.name}
      </span>

      {/* Hover glow overlay */}
      <style jsx>{`
        .element-tile:hover {
          box-shadow: 0 0 15px 2px ${heatmapColor || cat.hex}40,
                      0 4px 12px rgba(0,0,0,0.3);
        }
      `}</style>
    </button>
  );
});
