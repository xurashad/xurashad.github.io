"use client";

import { useRef, useEffect, useCallback } from "react";
import { Check, RotateCcw } from "lucide-react";
import {
  FILTER_PRESETS, ADJUSTMENT_META,
  type FilterType, type AdjustmentValues, type AdjustmentType,
} from "./types";

// ── Filter thumbnail generator ───────────────────────────────────────────────
function useFilterThumbnails(
  getBaseCanvas: () => HTMLCanvasElement | null,
  hasImage: boolean
) {
  const thumbsRef = useRef<Map<FilterType, string>>(new Map());
  const generatedRef = useRef(false);

  useEffect(() => {
    if (!hasImage) {
      generatedRef.current = false;
      thumbsRef.current.clear();
      return;
    }
    if (generatedRef.current) return;

    const baseCanvas = getBaseCanvas();
    if (!baseCanvas) return;

    generatedRef.current = true;

    // Create tiny preview
    const thumbSize = 64;
    const aspect = baseCanvas.width / baseCanvas.height;
    const tw = aspect >= 1 ? thumbSize : Math.round(thumbSize * aspect);
    const th = aspect >= 1 ? Math.round(thumbSize / aspect) : thumbSize;

    for (const { type } of FILTER_PRESETS) {
      const tc = document.createElement("canvas");
      tc.width = tw;
      tc.height = th;
      const tctx = tc.getContext("2d")!;
      tctx.drawImage(baseCanvas, 0, 0, tw, th);

      // Apply filter for preview via CSS filter shorthand
      if (type !== "none") {
        const cssFilter = getFilterCSS(type);
        if (cssFilter) {
          const tc2 = document.createElement("canvas");
          tc2.width = tw;
          tc2.height = th;
          const tctx2 = tc2.getContext("2d")!;
          tctx2.filter = cssFilter;
          tctx2.drawImage(tc, 0, 0);
          thumbsRef.current.set(type, tc2.toDataURL("image/jpeg", 0.6));
          continue;
        }
      }

      thumbsRef.current.set(type, tc.toDataURL("image/jpeg", 0.6));
    }
  }, [hasImage, getBaseCanvas]);

  return thumbsRef.current;
}

function getFilterCSS(filter: FilterType): string | null {
  switch (filter) {
    case "vivid": return "saturate(1.5) contrast(1.15)";
    case "warm": return "sepia(0.15) saturate(1.2) brightness(1.05)";
    case "cool": return "saturate(0.9) brightness(1.05) hue-rotate(10deg)";
    case "noir": return "grayscale(1) contrast(1.4)";
    case "sepia": return "sepia(0.8) contrast(1.05)";
    case "vintage": return "sepia(0.3) contrast(0.9) brightness(1.1)";
    case "dramatic": return "contrast(1.5) brightness(0.9)";
    case "fade": return "contrast(0.85) brightness(1.15) saturate(0.8)";
    case "cyberpunk": return "saturate(1.4) contrast(1.2) hue-rotate(330deg)";
    case "film": return "sepia(0.1) contrast(0.95) brightness(1.05)";
    case "sunset": return "sepia(0.2) saturate(1.4) brightness(1.05) hue-rotate(-10deg)";
    default: return null;
  }
}

// ── Slider component ─────────────────────────────────────────────────────────
function AdjustSlider({
  label,
  value,
  min,
  max,
  onChange,
  onReset,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  onReset: () => void;
}) {
  const isModified = value !== 0;
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[11px] transition-colors ${isModified ? "text-foreground/60" : "text-foreground/35"}`}>
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-mono ${isModified ? "text-quantum" : "text-foreground/20"}`}>
            {value > 0 ? `+${value}` : value}
          </span>
          {isModified && (
            <button
              onClick={onReset}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground/25 hover:text-foreground/50"
              title="Reset"
            >
              <RotateCcw size={9} />
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-white/8 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-quantum [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,195,245,0.4)]
          [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
          [&::-webkit-slider-thumb]:hover:shadow-[0_0_14px_rgba(0,195,245,0.6)]"
      />
    </div>
  );
}

// ── Main FilterPanel ─────────────────────────────────────────────────────────
interface FilterPanelProps {
  mode: "filters" | "adjust";
  currentFilter: FilterType;
  currentAdjustments: AdjustmentValues;
  onSetFilter: (f: FilterType) => void;
  onApplyFilter: () => void;
  onSetAdjustment: (key: AdjustmentType, value: number) => void;
  onResetAdjustments: () => void;
  onApplyAdjustments: () => void;
  getBaseCanvas: () => HTMLCanvasElement | null;
  hasImage: boolean;
}

export function FilterPanel({
  mode,
  currentFilter,
  currentAdjustments,
  onSetFilter,
  onApplyFilter,
  onSetAdjustment,
  onResetAdjustments,
  onApplyAdjustments,
  getBaseCanvas,
  hasImage,
}: FilterPanelProps) {
  const thumbnails = useFilterThumbnails(getBaseCanvas, hasImage);

  if (mode === "filters") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {FILTER_PRESETS.map(({ type, label }) => {
            const isActive = currentFilter === type;
            const thumb = thumbnails.get(type);
            return (
              <button
                key={type}
                onClick={() => onSetFilter(type)}
                className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all ${
                  isActive
                    ? "border-quantum/40 bg-quantum/10 shadow-[0_0_10px_rgba(0,195,245,0.1)]"
                    : "border-white/6 hover:border-white/15 bg-white/2"
                }`}
              >
                <div className="w-full aspect-square rounded-lg overflow-hidden bg-white/5">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/2" />
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "text-quantum" : "text-foreground/40"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {currentFilter !== "none" && (
          <button
            onClick={onApplyFilter}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
              bg-quantum/15 border border-quantum/30 text-quantum text-sm font-semibold
              hover:bg-quantum/25 hover:border-quantum/50 transition-all"
          >
            <Check size={14} />
            Apply Filter
          </button>
        )}
      </div>
    );
  }

  // Adjustments mode
  const hasAdjustments = Object.values(currentAdjustments).some((v) => v !== 0);

  return (
    <div className="space-y-3">
      {ADJUSTMENT_META.map(({ key, label, min, max }) => (
        <AdjustSlider
          key={key}
          label={label}
          value={currentAdjustments[key]}
          min={min}
          max={max}
          onChange={(v) => onSetAdjustment(key, v)}
          onReset={() => onSetAdjustment(key, 0)}
        />
      ))}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onResetAdjustments}
          disabled={!hasAdjustments}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
            border border-white/10 text-foreground/40 text-xs font-medium
            hover:border-white/20 hover:text-foreground/60 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <RotateCcw size={12} />
          Reset All
        </button>
        <button
          onClick={onApplyAdjustments}
          disabled={!hasAdjustments}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl
            bg-quantum/15 border border-quantum/30 text-quantum text-xs font-semibold
            hover:bg-quantum/25 hover:border-quantum/50 transition-all
            disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Check size={12} />
          Apply
        </button>
      </div>
    </div>
  );
}
