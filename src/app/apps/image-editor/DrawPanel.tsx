"use client";

import { useState } from "react";
import { Paintbrush, Eraser, Plus, X, Check, Trash2 } from "lucide-react";
import type { TextOverlay } from "./types";

// ── Draw Panel ───────────────────────────────────────────────────────────────
interface DrawPanelProps {
  drawColor: string;
  drawSize: number;
  drawOpacity: number;
  drawTool: "brush" | "eraser";
  onSetColor: (color: string) => void;
  onSetSize: (size: number) => void;
  onSetOpacity: (opacity: number) => void;
  onSetTool: (tool: "brush" | "eraser") => void;
  onApply: () => void;
  hasStrokes: boolean;
}

const QUICK_COLORS = [
  "#ff3366", "#ff6633", "#ffcc00", "#33cc66",
  "#00c3f5", "#6366f1", "#9333ea", "#ffffff",
  "#000000", "#888888", "#dc143c", "#6b8f27",
];

export function DrawPanel({
  drawColor,
  drawSize,
  drawOpacity,
  drawTool,
  onSetColor,
  onSetSize,
  onSetOpacity,
  onSetTool,
  onApply,
  hasStrokes,
}: DrawPanelProps) {
  return (
    <div className="space-y-5">
      {/* Tool selection */}
      <div>
        <label className="block text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-2">
          Tool
        </label>
        <div className="flex gap-1.5">
          <button
            onClick={() => onSetTool("brush")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              drawTool === "brush"
                ? "bg-quantum/20 border-quantum/40 text-quantum"
                : "border-white/8 text-foreground/35 hover:border-white/15"
            }`}
          >
            <Paintbrush size={13} />
            Brush
          </button>
          <button
            onClick={() => onSetTool("eraser")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              drawTool === "eraser"
                ? "bg-quantum/20 border-quantum/40 text-quantum"
                : "border-white/8 text-foreground/35 hover:border-white/15"
            }`}
          >
            <Eraser size={13} />
            Eraser
          </button>
        </div>
      </div>

      {/* Color */}
      {drawTool === "brush" && (
        <div>
          <label className="block text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-2">
            Color
          </label>
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {QUICK_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => onSetColor(color)}
                className={`aspect-square rounded-lg border-2 transition-all ${
                  drawColor === color
                    ? "border-quantum scale-110 shadow-[0_0_8px_rgba(0,195,245,0.3)]"
                    : "border-transparent hover:border-white/20"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="relative">
            <input
              type="color"
              value={drawColor}
              onChange={(e) => onSetColor(e.target.value)}
              className="w-full h-8 rounded-lg cursor-pointer border border-white/10"
            />
          </div>
        </div>
      )}

      {/* Size */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-foreground/35">Brush Size</span>
          <span className="text-[10px] font-mono text-foreground/25">{drawSize}px</span>
        </div>
        <input
          type="range"
          min={1}
          max={50}
          value={drawSize}
          onChange={(e) => onSetSize(parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/8 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-quantum [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,195,245,0.4)]
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Opacity */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-foreground/35">Opacity</span>
          <span className="text-[10px] font-mono text-foreground/25">{drawOpacity}%</span>
        </div>
        <input
          type="range"
          min={5}
          max={100}
          value={drawOpacity}
          onChange={(e) => onSetOpacity(parseInt(e.target.value))}
          className="w-full h-1.5 bg-white/8 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-quantum [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,195,245,0.4)]
            [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Brush preview */}
      <div className="flex items-center justify-center py-3">
        <div
          className="rounded-full border border-white/10"
          style={{
            width: Math.max(drawSize, 4),
            height: Math.max(drawSize, 4),
            backgroundColor: drawTool === "eraser" ? "rgba(255,255,255,0.3)" : drawColor,
            opacity: drawOpacity / 100,
          }}
        />
      </div>

      {/* Apply */}
      {hasStrokes && (
        <button
          onClick={onApply}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
            bg-quantum/15 border border-quantum/30 text-quantum text-sm font-semibold
            hover:bg-quantum/25 hover:border-quantum/50 transition-all"
        >
          <Check size={14} />
          Apply Drawing
        </button>
      )}
    </div>
  );
}

// ── Text Panel ───────────────────────────────────────────────────────────────
interface TextPanelProps {
  textOverlays: TextOverlay[];
  onAdd: (overlay: TextOverlay) => void;
  onUpdate: (id: string, updates: Partial<TextOverlay>) => void;
  onRemove: (id: string) => void;
  onApply: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

const FONT_OPTIONS = [
  "Inter",
  "Playfair Display",
  "JetBrains Mono",
  "Arial",
  "Georgia",
  "Courier New",
  "Verdana",
  "Impact",
];

export function TextPanel({
  textOverlays,
  onAdd,
  onUpdate,
  onRemove,
  onApply,
  canvasWidth,
  canvasHeight,
}: TextPanelProps) {
  const [newText, setNewText] = useState("Hello World");

  const addOverlay = () => {
    if (!newText.trim()) return;
    const overlay: TextOverlay = {
      id: Date.now().toString(),
      text: newText,
      x: Math.round(canvasWidth * 0.1),
      y: Math.round(canvasHeight * 0.1),
      fontSize: Math.round(Math.min(canvasWidth, canvasHeight) * 0.06),
      fontFamily: "Inter",
      color: "#ffffff",
      bold: false,
      italic: false,
    };
    onAdd(overlay);
    setNewText("");
  };

  return (
    <div className="space-y-5">
      {/* Add new text */}
      <div>
        <label className="block text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-2">
          Add Text
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOverlay()}
            placeholder="Enter text..."
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground/80
              placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 transition-all"
          />
          <button
            onClick={addOverlay}
            disabled={!newText.trim()}
            className="px-3 py-2 rounded-lg bg-quantum/15 border border-quantum/30 text-quantum
              hover:bg-quantum/25 transition-all disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Existing overlays */}
      {textOverlays.map((overlay) => (
        <div
          key={overlay.id}
          className="p-3 rounded-xl border border-white/8 bg-white/2 space-y-3"
        >
          <div className="flex items-center justify-between">
            <input
              type="text"
              value={overlay.text}
              onChange={(e) => onUpdate(overlay.id, { text: e.target.value })}
              className="flex-1 bg-transparent border-b border-white/10 text-sm text-foreground/70 focus:outline-none
                focus:border-quantum/40 pb-0.5 transition-all"
            />
            <button
              onClick={() => onRemove(overlay.id)}
              className="ml-2 p-1 text-crimson/50 hover:text-crimson transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* Font */}
          <select
            value={overlay.fontFamily}
            onChange={(e) => onUpdate(overlay.id, { fontFamily: e.target.value })}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[11px]
              text-foreground/60 focus:outline-none focus:border-quantum/40 transition-all"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          {/* Size + color */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <div className="flex justify-between mb-0.5">
                <label className="text-[9px] text-foreground/25">Size</label>
                <span className="text-[9px] font-mono text-foreground/20">{overlay.fontSize}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={Math.round(Math.min(canvasWidth, canvasHeight) * 0.3)}
                value={overlay.fontSize}
                onChange={(e) => onUpdate(overlay.id, { fontSize: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/8 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-quantum [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
            <input
              type="color"
              value={overlay.color}
              onChange={(e) => onUpdate(overlay.id, { color: e.target.value })}
              className="w-8 h-8 rounded-lg cursor-pointer border border-white/10"
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-foreground/25">X Position</label>
              <input
                type="number"
                value={Math.round(overlay.x)}
                onChange={(e) => onUpdate(overlay.id, { x: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-[11px]
                  text-foreground/60 font-mono focus:outline-none focus:border-quantum/40"
              />
            </div>
            <div>
              <label className="text-[9px] text-foreground/25">Y Position</label>
              <input
                type="number"
                value={Math.round(overlay.y)}
                onChange={(e) => onUpdate(overlay.id, { y: parseInt(e.target.value) || 0 })}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-[11px]
                  text-foreground/60 font-mono focus:outline-none focus:border-quantum/40"
              />
            </div>
          </div>

          {/* Bold / Italic */}
          <div className="flex gap-1.5">
            <button
              onClick={() => onUpdate(overlay.id, { bold: !overlay.bold })}
              className={`flex-1 py-1.5 text-xs rounded-lg border font-bold transition-all ${
                overlay.bold
                  ? "bg-quantum/15 border-quantum/30 text-quantum"
                  : "border-white/8 text-foreground/30"
              }`}
            >
              B
            </button>
            <button
              onClick={() => onUpdate(overlay.id, { italic: !overlay.italic })}
              className={`flex-1 py-1.5 text-xs rounded-lg border italic transition-all ${
                overlay.italic
                  ? "bg-quantum/15 border-quantum/30 text-quantum"
                  : "border-white/8 text-foreground/30"
              }`}
            >
              I
            </button>
          </div>
        </div>
      ))}

      {/* Apply */}
      {textOverlays.length > 0 && (
        <button
          onClick={onApply}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
            bg-quantum/15 border border-quantum/30 text-quantum text-sm font-semibold
            hover:bg-quantum/25 hover:border-quantum/50 transition-all"
        >
          <Check size={14} />
          Apply Text
        </button>
      )}
    </div>
  );
}
