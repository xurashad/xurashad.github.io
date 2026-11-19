"use client";

import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

const GROUPS = [
  {
    title: "Navigation & Viewport",
    items: [
      ["Drag / Touch", "Pan across complex plane"],
      ["Scroll / Pinch", "Zoom smoothly around cursor"],
      ["Double-Click", "Smooth 2.5× fly-in zoom"],
      ["Alt + Double-Click", "Smooth 2.5× zoom out"],
      ["Ctrl + Drag (or B)", "Box-zoom into drawn marquee"],
      ["Arrow Keys / + / −", "Nudge view or zoom step"],
      ["R / 0", "Reset camera to formula home"],
      ["F", "Toggle studio fullscreen"],
    ],
  },
  {
    title: "Mathematics & Coupling",
    items: [
      ["Shift + Click", "Jump directly to Julia set at point"],
      ["J", "Toggle Parameter / Julia mode"],
      ["P", "Toggle live Picture-in-Picture Julia"],
      ["V", "Toggle 50/50 Split Parameter + Julia"],
      ["O", "Toggle Orbit Probe & Lyapunov trace"],
      ["G", "Toggle Adaptive Complex Grid"],
      ["M", "Toggle Viewport Minimap"],
      ["Space", "Play / Pause active animations"],
    ],
  },
  {
    title: "Shading & History",
    items: [
      ["L", "Toggle 3D Blinn-Phong relief lighting"],
      ["C", "Harmonious randomize palette"],
      ["H", "Toggle HUD overlays"],
      ["Ctrl/Cmd + Z", "Undo camera or style change"],
      ["Ctrl/Cmd + Y / Shift+Z", "Redo change"],
      ["S", "Open Studio 4K Export & Presets"],
      ["?", "Open / close shortcuts guide"],
    ],
  },
];

export function ShortcutsModal({ onClose }: Props) {
  return (
    <div className="fe-modal-backdrop" onClick={onClose}>
      <div
        className="fe-glass rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-400/15">
          <div>
            <h2 className="font-serif font-bold text-base">Controls & Shortcuts</h2>
            <p className="text-[11px] font-mono text-slate-400">
              Precision keyboard, mouse & touch observatory navigation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto fe-scroll p-5 grid sm:grid-cols-3 gap-4">
          {GROUPS.map(g => (
            <div key={g.title} className="space-y-2.5">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 border-b border-cyan-400/20 pb-1">
                {g.title}
              </h3>
              <div className="space-y-2">
                {g.items.map(([key, desc]) => (
                  <div key={key} className="flex flex-col gap-0.5">
                    <kbd className="w-fit px-1.5 py-0.5 rounded bg-black/50 border border-slate-400/25 text-[10px] font-mono text-cyan-200">
                      {key}
                    </kbd>
                    <span className="text-[11px] text-slate-300 leading-snug">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
