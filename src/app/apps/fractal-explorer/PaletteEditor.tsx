"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { hexToRgb01, rgb01ToHex, paletteGradientCSS } from "./lib/palette";
import type { Palette, PaletteStop } from "./lib/types";

export function PaletteEditor({
  palette: init, onSave, onCancel,
}: {
  palette: Palette;
  onSave: (p: Palette) => void;
  onCancel: () => void;
}) {
  const [pal, setPal] = useState<Palette>(() => JSON.parse(JSON.stringify(init)));

  const updateStop = (i: number, key: keyof PaletteStop, val: unknown) => {
    const stops = [...pal.stops];
    stops[i] = { ...stops[i], [key]: val } as PaletteStop;
    setPal({ ...pal, stops });
  };

  const addStop = () => {
    let maxGap = 0, idx = 0;
    for (let i = 0; i < pal.stops.length - 1; i++) {
      const g = pal.stops[i + 1].pos - pal.stops[i].pos;
      if (g > maxGap) { maxGap = g; idx = i; }
    }
    const a = pal.stops[idx], b = pal.stops[idx + 1];
    const ns: PaletteStop = {
      pos: (a.pos + b.pos) / 2,
      color: a.color.map((c, j) => (c + b.color[j]) / 2) as [number,number,number],
    };
    setPal({ ...pal, stops: [...pal.stops, ns].sort((x, y) => x.pos - y.pos) });
  };

  const removeStop = (i: number) => {
    if (pal.stops.length <= 2) return;
    setPal({ ...pal, stops: pal.stops.filter((_, j) => j !== i) });
  };

  const gradient = paletteGradientCSS(pal);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="font-bold text-sm text-foreground/70">Palette Editor</h2>
          <button onClick={onCancel} className="text-foreground/30 hover:text-foreground/70 transition-colors"><X size={16}/></button>
        </div>

        {/* Gradient preview */}
        <div className="mx-5 mt-4 h-8 rounded-lg border border-white/8"
          style={{ background: `linear-gradient(to right, ${gradient})` }} />

        {/* Mode toggle */}
        <div className="px-5 mt-3 flex gap-2">
          {(["RGB", "HSB"] as const).map(t => (
            <button key={t} onClick={() => setPal({ ...pal, colorType: t })}
              className={`px-3 py-1 text-xs rounded-lg border transition-all ${pal.colorType === t ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" : "border-white/10 text-foreground/35 hover:text-foreground/60"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Stops */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {pal.stops.map((stop, i) => (
            <div key={i} className="grid grid-cols-[44px_1fr_36px_28px] gap-2 items-center">
              <span className="text-[10px] font-mono text-foreground/35">{(stop.pos * 100).toFixed(1)}%</span>
              <input
                type="range" min={0} max={1} step={0.001}
                value={stop.pos}
                disabled={i === 0 || i === pal.stops.length - 1}
                onChange={e => updateStop(i, "pos", parseFloat(e.target.value))}
                className="accent-cyan-400 disabled:opacity-30"
              />
              <input
                type="color"
                value={rgb01ToHex(stop.color)}
                onChange={e => updateStop(i, "color", hexToRgb01(e.target.value))}
                className="w-9 h-7 rounded cursor-pointer bg-transparent border border-white/10 p-0.5"
              />
              <button onClick={() => removeStop(i)} disabled={pal.stops.length <= 2}
                className="text-red-400/60 hover:text-red-400 disabled:opacity-20 transition-colors flex items-center justify-center">
                <Trash2 size={12}/>
              </button>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-white/8 flex items-center justify-between">
          <button onClick={addStop}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-foreground/45 hover:text-foreground/70 hover:border-white/20 transition-all">
            <Plus size={12}/> Add stop
          </button>
          <div className="flex gap-2">
            <button onClick={onCancel}
              className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-foreground/40 hover:text-foreground/70 transition-all">
              Cancel
            </button>
            <button
              onClick={() => onSave({ ...pal, stops: [...pal.stops].sort((a, b) => a.pos - b.pos) })}
              className="px-4 py-1.5 text-xs rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 font-semibold transition-all"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
