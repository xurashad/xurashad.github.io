"use client";

import {
  MousePointer2, Crop, Maximize2, RotateCw,
  Sparkles, SlidersHorizontal, Paintbrush, Type,
} from "lucide-react";
import type { EditorTool } from "./types";

export const TOOLS: { id: EditorTool; icon: React.FC<{ size?: number }>; label: string; shortcut?: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select / Pan", shortcut: "V" },
  { id: "crop", icon: Crop, label: "Crop", shortcut: "C" },
  { id: "resize", icon: Maximize2, label: "Resize", shortcut: "R" },
  { id: "rotate", icon: RotateCw, label: "Rotate / Flip", shortcut: "T" },
  { id: "filters", icon: Sparkles, label: "Filters", shortcut: "F" },
  { id: "adjust", icon: SlidersHorizontal, label: "Adjustments", shortcut: "A" },
  { id: "draw", icon: Paintbrush, label: "Draw", shortcut: "B" },
  { id: "text", icon: Type, label: "Text", shortcut: "X" },
];

interface EditorToolbarProps {
  activeTool: EditorTool;
  onSelectTool: (tool: EditorTool) => void;
  hasImage: boolean;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function EditorToolbar({
  activeTool,
  onSelectTool,
  hasImage,
  orientation = "vertical",
  className = "",
}: EditorToolbarProps) {
  if (orientation === "horizontal") {
    return (
      <div className={`flex items-center gap-1.5 p-1.5 overflow-x-auto no-scrollbar ${className}`}>
        {TOOLS.map(({ id, icon: Icon, label }) => {
          const isActive = activeTool === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectTool(id)}
              disabled={!hasImage && id !== "select"}
              className={`
                flex flex-col items-center justify-center min-w-[56px] h-[50px] px-2 rounded-xl
                transition-all duration-200 flex-shrink-0
                ${isActive
                  ? "bg-quantum/20 border border-quantum/50 text-quantum shadow-[0_0_12px_rgba(0,195,245,0.2)]"
                  : "text-foreground/45 hover:text-foreground/80 hover:bg-white/5 border border-white/5"
                }
                disabled:opacity-20 disabled:cursor-not-allowed
              `}
            >
              <Icon size={17} />
              <span className="text-[9px] font-mono tracking-tight mt-1 truncate max-w-[52px]">
                {label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 p-2 ${className}`}>
      {TOOLS.map(({ id, icon: Icon, label, shortcut }) => {
        const isActive = activeTool === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectTool(id)}
            disabled={!hasImage && id !== "select"}
            title={`${label}${shortcut ? ` (${shortcut})` : ""}`}
            className={`
              group relative flex items-center justify-center w-11 h-11 rounded-xl
              transition-all duration-200 
              ${isActive
                ? "bg-quantum/20 border border-quantum/40 text-quantum shadow-[0_0_12px_rgba(0,195,245,0.15)]"
                : "text-foreground/35 hover:text-foreground/70 hover:bg-white/5 border border-transparent"
              }
              disabled:opacity-20 disabled:cursor-not-allowed
            `}
          >
            <Icon size={18} />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-black/90 border border-white/10
              text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100
              transition-opacity z-50 backdrop-blur-sm">
              {label}
              {shortcut && (
                <span className="ml-1.5 text-[10px] text-foreground/30 font-mono px-1 py-0.5 bg-white/5 rounded">
                  {shortcut}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
