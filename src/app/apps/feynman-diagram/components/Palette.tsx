"use client";

import { Info } from "lucide-react";
import { ParticleType, type PaletteItem, type DragPayload } from "../lib/types";
import { PALETTE_ITEMS } from "../lib/constants";

function Icon({ type }: { type: PaletteItem["type"] }) {
  switch (type) {
    case "vertex":
      return <div className="w-4 h-4 bg-[#22d3ee] rounded-full shadow-[0_0_8px_rgba(34,211,238,0.6)]" />;
    case ParticleType.Fermion:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#60a5fa]">
          <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="2" />
          <polygon points="10,6 16,12 10,18" fill="currentColor" />
        </svg>
      );
    case ParticleType.Photon:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#34d399]">
          <path d="M 0 12 C 4 6, 8 18, 12 12 S 20 6, 24 12" stroke="currentColor" fill="none" strokeWidth="2" />
        </svg>
      );
    case ParticleType.Gluon:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#f472b6]">
          <path d="M 0 12 C 3 12, 3 8, 6 8 S 9 16, 12 16 S 15 8, 18 8 S 21 12, 24 12" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case ParticleType.WBoson:
    case ParticleType.ZBoson:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className={type === ParticleType.WBoson ? "text-[#fb923c]" : "text-[#4ade80]"}>
          <path d="M 0 12 Q 3 4, 6 12 T 12 12 T 18 12 T 24 12" stroke="currentColor" fill="none" strokeWidth="3" />
        </svg>
      );
    case ParticleType.Higgs:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#fbbf24]">
          <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
        </svg>
      );
    case ParticleType.Ghost:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#a78bfa]">
          <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round" />
        </svg>
      );
    case ParticleType.Scalar:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-[#94a3b8]">
          <line x1="0" y1="12" x2="24" y2="12" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    case "text":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white">
          <path d="M 5 4 h 14 v 3 h -5 v 12 h -4 v -12 H 5 V 4 z" />
        </svg>
      );
    case "ellipse":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-white">
          <ellipse cx="12" cy="12" rx="9" ry="6" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case "rectangle":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" className="text-white">
          <rect x="3" y="6" width="18" height="12" stroke="currentColor" strokeWidth="2" fill="none" rx="2" />
        </svg>
      );
    default:
      return null;
  }
}

export function Palette() {
  const groups = PALETTE_ITEMS.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, PaletteItem[]>);

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-black/40 border-r border-white/6 overflow-y-auto overflow-x-hidden backdrop-blur-xl">
      <div className="p-4 space-y-6">
        {Object.entries(groups).map(([groupName, items]) => (
          <div key={groupName}>
            <h3 className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest mb-3 px-1">
              // {groupName}
            </h3>
            <div className="flex flex-col gap-1.5">
              {items.map((item) => (
                <div
                  key={item.label}
                  draggable
                  onDragStart={(e) => {
                    const payload: DragPayload = { type: item.type, label: item.label };
                    e.dataTransfer.setData("application/json", JSON.stringify(payload));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:bg-white/[0.04] hover:border-white/8 cursor-grab active:cursor-grabbing transition-all group"
                >
                  <div className="w-7 h-7 bg-white/[0.04] rounded-md flex items-center justify-center border border-white/6 group-hover:border-white/10 group-hover:bg-black/20 flex-shrink-0 transition-colors">
                    <Icon type={item.type} />
                  </div>
                  <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-white/6 bg-white/[0.02]">
        <h4 className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#22d3ee] mb-2">
          <Info size={12} />
          Controls
        </h4>
        <ul className="text-[10px] text-foreground/50 space-y-1.5 list-disc pl-3">
          <li>Drag items onto canvas</li>
          <li>Drag endpoints or centers</li>
          <li>Drag central bend handle</li>
          <li><span className="text-foreground/80">Shift + Click</span> to multiselect</li>
          <li><span className="text-foreground/80">Double-click</span> text to edit</li>
          <li><span className="text-foreground/80">Del</span> to remove selection</li>
          <li><span className="text-foreground/80">Ctrl + D</span> to duplicate</li>
        </ul>
      </div>
    </aside>
  );
}
