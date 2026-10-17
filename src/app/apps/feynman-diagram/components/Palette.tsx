"use client";

import { Info, Plus } from "lucide-react";
import { ParticleType, type PaletteItem, type DragPayload } from "../lib/types";
import { PALETTE_ITEMS } from "../lib/constants";

interface Props {
  onAddItem?: (item: PaletteItem) => void;
  className?: string;
}

function Icon({ type }: { type: PaletteItem["type"] }) {
  switch (type) {
    case "vertex":
      return (
        <div className="w-3.5 h-3.5 bg-[#22d3ee] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
      );
    case ParticleType.Fermion:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-[#60a5fa]">
          <line x1="1" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2.2" />
          <polygon points="10,7 16,12 10,17" fill="currentColor" />
        </svg>
      );
    case ParticleType.Photon:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-[#34d399]">
          <path
            d="M 1 12 C 4 6, 8 18, 12 12 S 20 6, 23 12"
            stroke="currentColor"
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case ParticleType.Gluon:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-[#f472b6]">
          <path
            d="M 1 12 C 4 12, 4 8, 7 8 S 10 16, 13 16 S 16 8, 19 8 S 22 12, 23 12"
            stroke="currentColor"
            fill="none"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case ParticleType.WBoson:
    case ParticleType.ZBoson:
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          className={type === ParticleType.WBoson ? "text-[#fb923c]" : "text-[#4ade80]"}
        >
          <path
            d="M 1 12 Q 4 4, 7 12 T 13 12 T 19 12 T 23 12"
            stroke="currentColor"
            fill="none"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case ParticleType.Higgs:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-[#fbbf24]">
          <line
            x1="1"
            y1="12"
            x2="23"
            y2="12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeDasharray="4 3"
          />
        </svg>
      );
    case ParticleType.Ghost:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-[#a78bfa]">
          <line
            x1="1"
            y1="12"
            x2="23"
            y2="12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeDasharray="2 4"
            strokeLinecap="round"
          />
        </svg>
      );
    case ParticleType.Scalar:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-[#94a3b8]">
          <line x1="1" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      );
    case "text":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
          <path d="M 5 4 h 14 v 3 h -5 v 12 h -4 v -12 H 5 V 4 z" />
        </svg>
      );
    case "ellipse":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-white">
          <ellipse cx="12" cy="12" rx="9" ry="6" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case "rectangle":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="text-white">
          <rect x="3" y="6" width="18" height="12" stroke="currentColor" strokeWidth="2" fill="none" rx="2" />
        </svg>
      );
    default:
      return null;
  }
}

export function Palette({ onAddItem, className = "" }: Props) {
  const groups = PALETTE_ITEMS.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, PaletteItem[]>);

  return (
    <aside
      className={`flex flex-col h-full min-h-0 bg-black/40 border-r border-white/6 backdrop-blur-xl select-none ${className}`}
    >
      <div className="flex-1 min-h-0 p-3 space-y-4 overflow-y-auto overflow-x-hidden">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName}>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[10px] font-mono text-quantum/70 uppercase tracking-widest font-semibold">
                {"// "}
                {groupName}
              </h3>
              <span className="text-[9px] text-foreground/40 font-mono">
                Click or Drag
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    const payload: DragPayload = { type: item.type, label: item.label };
                    e.dataTransfer.setData("application/json", JSON.stringify(payload));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => onAddItem?.(item)}
                  className="w-full flex items-center justify-between p-2 rounded-lg border border-white/5 hover:border-quantum/40 hover:bg-quantum/5 active:bg-quantum/10 cursor-grab active:cursor-grabbing transition-all group text-left touch-manipulation"
                  title={`${item.desc || item.label} (Click to add or drag to canvas)`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 bg-white/[0.04] rounded-md flex items-center justify-center border border-white/6 group-hover:border-quantum/30 group-hover:bg-black/40 flex-shrink-0 transition-colors">
                      <Icon type={item.type} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground/85 group-hover:text-foreground truncate">
                        {item.label}
                      </div>
                      {item.symbol && (
                        <div className="text-[10px] font-mono text-quantum/60 truncate">
                          {item.symbol}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-quantum/70 p-1 flex-shrink-0">
                    <Plus size={13} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 p-3 border-t border-white/6 bg-white/[0.02]">
        <h4 className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#22d3ee] mb-1.5 font-semibold">
          <Info size={12} />
          Studio Shortcuts
        </h4>
        <ul className="text-[10px] text-foreground/55 space-y-1 list-disc pl-3">
          <li>
            <strong className="text-foreground/80">Click</strong> any tool to place at center
          </li>
          <li>
            <strong className="text-foreground/80">Drag</strong> line endpoints onto vertices to connect
          </li>
          <li>
            <strong className="text-foreground/80">Purple handle</strong> curves the propagator
          </li>
          <li>
            <strong className="text-foreground/80">&apos;R&apos;</strong> flips arrow direction
          </li>
          <li>
            <strong className="text-foreground/80">Del</strong> deletes selection
          </li>
          <li>
            <strong className="text-foreground/80">Ctrl + Z / Y</strong> for Undo / Redo
          </li>
        </ul>
      </div>
    </aside>
  );
}
