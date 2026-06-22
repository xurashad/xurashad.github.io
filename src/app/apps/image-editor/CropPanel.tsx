"use client";

import { useState } from "react";
import { Check, ArrowLeftRight, Lock, Unlock } from "lucide-react";
import { CROP_PRESETS, type CropRect } from "./types";

interface CropPanelProps {
  currentCrop: CropRect | null;
  cropPresetIndex: number;
  onSetCrop: (crop: CropRect) => void;
  onSetPreset: (index: number) => void;
  onApply: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function CropPanel({
  currentCrop,
  cropPresetIndex,
  onSetCrop,
  onSetPreset,
  onApply,
  canvasWidth,
  canvasHeight,
}: CropPanelProps) {
  const [lockRatio, setLockRatio] = useState(false);
  const [customW, setCustomW] = useState(currentCrop?.width.toString() ?? "");
  const [customH, setCustomH] = useState(currentCrop?.height.toString() ?? "");

  const handleCustomDimension = (dimension: "w" | "h", value: string) => {
    if (dimension === "w") setCustomW(value);
    else setCustomH(value);

    const numVal = parseInt(value);
    if (isNaN(numVal) || numVal <= 0 || !currentCrop) return;

    let newW = dimension === "w" ? numVal : currentCrop.width;
    let newH = dimension === "h" ? numVal : currentCrop.height;

    if (lockRatio && currentCrop.width > 0 && currentCrop.height > 0) {
      const ratio = currentCrop.width / currentCrop.height;
      if (dimension === "w") {
        newH = Math.round(numVal / ratio);
        setCustomH(newH.toString());
      } else {
        newW = Math.round(numVal * ratio);
        setCustomW(newW.toString());
      }
    }

    // Clamp to canvas bounds
    newW = Math.min(newW, canvasWidth);
    newH = Math.min(newH, canvasHeight);

    // Center the crop
    const x = Math.max(0, Math.round((canvasWidth - newW) / 2));
    const y = Math.max(0, Math.round((canvasHeight - newH) / 2));

    onSetCrop({ x, y, width: newW, height: newH });
  };

  const swapDimensions = () => {
    if (!currentCrop) return;
    const newW = Math.min(currentCrop.height, canvasWidth);
    const newH = Math.min(currentCrop.width, canvasHeight);
    const x = Math.max(0, Math.round((canvasWidth - newW) / 2));
    const y = Math.max(0, Math.round((canvasHeight - newH) / 2));
    setCustomW(newW.toString());
    setCustomH(newH.toString());
    onSetCrop({ x, y, width: newW, height: newH });
  };

  return (
    <div className="space-y-5">
      {/* Preset ratios */}
      <div>
        <label className="block text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-2">
          Aspect Ratio
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {CROP_PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => {
                onSetPreset(i);
                // Update custom fields
                if (currentCrop) {
                  setTimeout(() => {
                    const el = document.getElementById("crop-w") as HTMLInputElement;
                    const el2 = document.getElementById("crop-h") as HTMLInputElement;
                    if (el) setCustomW(el.value);
                    if (el2) setCustomH(el2.value);
                  }, 50);
                }
              }}
              className={`py-2 text-[11px] rounded-lg border font-medium transition-all ${
                cropPresetIndex === i
                  ? "bg-quantum/20 border-quantum/40 text-quantum"
                  : "border-white/8 text-foreground/35 hover:border-white/15 hover:text-foreground/55"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom dimensions */}
      <div>
        <label className="block text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-2">
          Dimensions (px)
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[9px] text-foreground/25 uppercase mb-1 block">Width</label>
            <input
              id="crop-w"
              type="number"
              value={customW}
              onChange={(e) => handleCustomDimension("w", e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground/80
                placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 transition-all font-mono"
              placeholder="Width"
            />
          </div>
          <div className="flex flex-col items-center gap-1 pt-4">
            <button
              onClick={swapDimensions}
              className="p-1.5 rounded-lg border border-white/8 text-foreground/30 hover:text-foreground/60
                hover:border-white/15 transition-all"
              title="Swap dimensions"
            >
              <ArrowLeftRight size={12} />
            </button>
          </div>
          <div className="flex-1">
            <label className="text-[9px] text-foreground/25 uppercase mb-1 block">Height</label>
            <input
              id="crop-h"
              type="number"
              value={customH}
              onChange={(e) => handleCustomDimension("h", e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground/80
                placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 transition-all font-mono"
              placeholder="Height"
            />
          </div>
        </div>
        <button
          onClick={() => setLockRatio(!lockRatio)}
          className={`mt-2 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${
            lockRatio
              ? "border-quantum/30 bg-quantum/10 text-quantum"
              : "border-white/8 text-foreground/30 hover:border-white/15"
          }`}
        >
          {lockRatio ? <Lock size={11} /> : <Unlock size={11} />}
          {lockRatio ? "Ratio locked" : "Lock ratio"}
        </button>
      </div>

      {/* Current crop info */}
      {currentCrop && (
        <div className="text-[10px] font-mono text-foreground/25 space-y-0.5">
          <div>
            Position: {Math.round(currentCrop.x)}, {Math.round(currentCrop.y)}
          </div>
          <div>
            Size: {Math.round(currentCrop.width)} × {Math.round(currentCrop.height)} px
          </div>
          <div>
            Canvas: {canvasWidth} × {canvasHeight} px
          </div>
        </div>
      )}

      {/* Apply button */}
      <button
        onClick={onApply}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
          bg-quantum/15 border border-quantum/30 text-quantum text-sm font-semibold
          hover:bg-quantum/25 hover:border-quantum/50 transition-all"
      >
        <Check size={14} />
        Apply Crop
      </button>
    </div>
  );
}
