"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, BookmarkPlus, Plus, Shuffle, Trash2, X } from "lucide-react";
import {
  evalPalette01,
  generateHarmoniousPalette,
  hexToRgb01,
  paletteGradientCSS,
  rgb01ToHex,
  sampleCosineToStops,
} from "./lib/palette";
import type { CosinePaletteParams, Palette, PaletteInterpolation, PaletteStop } from "./lib/types";

interface Props {
  palette: Palette;
  onPreview: (p: Palette) => void;
  onSave: (p: Palette) => void;
  onSaveCustomPreset: (p: Palette) => void;
  onCancel: () => void;
}

const DEFAULT_COSINE: CosinePaletteParams = {
  a: [0.5, 0.5, 0.55],
  b: [0.5, 0.45, 0.45],
  c: [1.0, 1.0, 1.0],
  d: [0.0, 0.33, 0.67],
};

export function PaletteEditor({
  palette: init,
  onPreview,
  onSave,
  onSaveCustomPreset,
  onCancel,
}: Props) {
  const [pal, setPal] = useState<Palette>(() => ({
    ...JSON.parse(JSON.stringify(init)),
    cosine: init.cosine ? { ...init.cosine } : { ...DEFAULT_COSINE },
  }));
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [customName, setCustomName] = useState(init.name ?? "Custom Palette");
  const barRef = useRef<HTMLDivElement>(null);
  const draggingIdxRef = useRef<number | null>(null);

  // Live preview behind modal
  useEffect(() => {
    onPreview(pal);
  }, [pal, onPreview]);

  const sortedStops = [...pal.stops].sort((a, b) => a.pos - b.pos);
  const safeSel = Math.min(selectedIdx, Math.max(0, sortedStops.length - 1));
  const selectedStop = sortedStops[safeSel];

  const updateStopAt = (index: number, nextStop: PaletteStop) => {
    const next = [...pal.stops];
    next[index] = nextStop;
    next.sort((a, b) => a.pos - b.pos);
    const nextIdx = next.indexOf(nextStop);
    setSelectedIdx(Math.max(0, nextIdx));
    setPal({ ...pal, stops: next });
  };

  const handleBarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.stopHandle) return;
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const color = evalPalette01(pal, pos);
    const ns: PaletteStop = { pos, color };
    const next = [...pal.stops, ns].sort((a, b) => a.pos - b.pos);
    setSelectedIdx(next.indexOf(ns));
    setPal({ ...pal, mode: "stops", stops: next });
  };

  const handleStopPointerDown = (idx: number, e: React.PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setSelectedIdx(idx);
    if (idx === 0 || idx === pal.stops.length - 1) return;
    draggingIdxRef.current = idx;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleStopPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const idx = draggingIdxRef.current;
    if (idx === null) return;
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pos = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const updated: PaletteStop = { ...pal.stops[idx], pos };
    const next = [...pal.stops];
    next[idx] = updated;
    next.sort((a, b) => a.pos - b.pos);
    const newIdx = next.indexOf(updated);
    draggingIdxRef.current = newIdx;
    setSelectedIdx(newIdx);
    setPal({ ...pal, stops: next });
  };

  const handleStopPointerUp = () => {
    draggingIdxRef.current = null;
  };

  const removeSelectedStop = () => {
    if (pal.stops.length <= 2 || safeSel === 0 || safeSel === pal.stops.length - 1) return;
    const next = pal.stops.filter((_, i) => i !== safeSel);
    setSelectedIdx(Math.max(0, safeSel - 1));
    setPal({ ...pal, stops: next });
  };

  const reversePalette = () => {
    const reversed = pal.stops
      .map(s => ({ ...s, pos: 1 - s.pos }))
      .sort((a, b) => a.pos - b.pos);
    setPal({ ...pal, stops: reversed });
  };

  const updateCosine = (
    vecKey: keyof CosinePaletteParams,
    channelIdx: 0 | 1 | 2,
    val: number,
  ) => {
    const cur = pal.cosine ?? DEFAULT_COSINE;
    const nextVec: [number, number, number] = [...cur[vecKey]] as [number, number, number];
    nextVec[channelIdx] = val;
    const nextCosine = { ...cur, [vecKey]: nextVec };
    setPal({
      ...pal,
      mode: "cosine",
      cosine: nextCosine,
      stops: sampleCosineToStops(nextCosine),
    });
  };

  const gradientCSS = paletteGradientCSS(pal, 64);

  return (
    <div className="fe-modal-backdrop" onClick={onCancel}>
      <div
        className="fe-glass rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-400/15">
          <div>
            <h2 className="font-serif font-bold text-base text-slate-100">Palette Studio</h2>
            <p className="text-[11px] font-mono text-slate-400">
              Live preview active — drag handles or synthesize cosine harmonics
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Interactive Gradient Bar */}
        <div className="px-5 pt-4 pb-2 space-y-2">
          <div
            ref={barRef}
            onPointerDown={handleBarPointerDown}
            className="relative h-11 rounded-xl border border-slate-300/20 shadow-inner cursor-crosshair"
            style={{ background: `linear-gradient(to right, ${gradientCSS})` }}
            title="Click anywhere on gradient to insert a color stop"
          >
            {pal.mode === "stops" &&
              sortedStops.map((stop, idx) => {
                const isSelected = idx === safeSel;
                return (
                  <button
                    key={`${idx}-${stop.pos.toFixed(4)}`}
                    type="button"
                    data-stop-handle="true"
                    onPointerDown={e => handleStopPointerDown(idx, e)}
                    onPointerMove={handleStopPointerMove}
                    onPointerUp={handleStopPointerUp}
                    className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-7 rounded-full border-2 transition-transform ${isSelected
                      ? "border-cyan-300 scale-115 shadow-[0_0_12px_rgba(0,195,245,0.85)] z-20"
                      : "border-white/90 hover:scale-105 z-10"
                      }`}
                    style={{
                      left: `${stop.pos * 100}%`,
                      backgroundColor: rgb01ToHex(stop.color),
                    }}
                    title={`Stop ${idx + 1} (${Math.round(stop.pos * 100)}%)`}
                  />
                );
              })}
          </div>

          {/* Mode + Interpolation Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex gap-1.5">
              {(
                [
                  { id: "stops", label: "Gradient Stops" },
                  { id: "cosine", label: "Procedural Cosine" },
                ] as const
              ).map(m => (
                <button
                  key={m.id}
                  onClick={() => setPal({ ...pal, mode: m.id })}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${pal.mode === m.id
                    ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                    : "border-slate-400/20 text-slate-300 hover:bg-white/5"
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {pal.mode === "stops" && (
              <div className="flex items-center gap-1">
                {(["rgb", "hsl", "cubic"] as PaletteInterpolation[]).map(interp => (
                  <button
                    key={interp}
                    onClick={() => setPal({ ...pal, interpolation: interp })}
                    className={`px-2 py-1 text-[10px] font-mono uppercase rounded border transition-all ${pal.interpolation === interp
                      ? "border-violet-400/50 bg-violet-500/20 text-violet-200"
                      : "border-slate-400/20 text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    {interp}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto fe-scroll px-5 py-3 space-y-4">
          {pal.mode === "stops" && selectedStop ? (
            <>
              {/* Selected stop inspector */}
              <div className="p-3.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-300">
                    Stop #{safeSel + 1} · {(selectedStop.pos * 100).toFixed(1)}%
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={reversePalette}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-slate-400/20 text-slate-300 hover:bg-white/5"
                    >
                      <ArrowLeftRight size={11} /> Reverse
                    </button>
                    <button
                      onClick={removeSelectedStop}
                      disabled={pal.stops.length <= 2 || safeSel === 0 || safeSel === pal.stops.length - 1}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border border-red-400/30 text-red-300 hover:bg-red-500/15 disabled:opacity-30"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr] gap-3 items-center">
                  <input
                    type="color"
                    value={rgb01ToHex(selectedStop.color)}
                    onChange={e =>
                      updateStopAt(safeSel, {
                        ...selectedStop,
                        color: hexToRgb01(e.target.value),
                      })
                    }
                    className="w-12 h-9 rounded-lg cursor-pointer bg-transparent border border-slate-400/25 p-0.5"
                  />
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={rgb01ToHex(selectedStop.color)}
                      onChange={e => {
                        if (/^#[0-9a-f]{6}$/i.test(e.target.value)) {
                          updateStopAt(safeSel, {
                            ...selectedStop,
                            color: hexToRgb01(e.target.value),
                          });
                        }
                      }}
                      className="fe-input font-mono"
                    />
                    <input
                      type="range"
                      min={0.01}
                      max={0.99}
                      step={0.005}
                      value={selectedStop.pos}
                      disabled={safeSel === 0 || safeSel === pal.stops.length - 1}
                      onChange={e =>
                        updateStopAt(safeSel, {
                          ...selectedStop,
                          pos: parseFloat(e.target.value),
                        })
                      }
                      className="fe-range disabled:opacity-35"
                    />
                  </div>
                </div>
              </div>

              {/* Stop quick list */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {sortedStops.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIdx(i)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-[11px] font-mono transition-all ${i === safeSel
                      ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-200"
                      : "border-slate-400/15 bg-black/25 text-slate-300 hover:border-slate-300/30"
                      }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                      style={{ backgroundColor: rgb01ToHex(s.color) }}
                    />
                    <span>{Math.round(s.pos * 100)}%</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    const pos = 0.5;
                    const ns: PaletteStop = { pos, color: evalPalette01(pal, pos) };
                    const next = [...pal.stops, ns].sort((a, b) => a.pos - b.pos);
                    setSelectedIdx(next.indexOf(ns));
                    setPal({ ...pal, stops: next });
                  }}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-slate-400/25 text-[11px] text-slate-300 hover:border-cyan-400/50"
                >
                  <Plus size={11} /> Add
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 p-3.5 rounded-xl bg-black/35 border border-slate-400/15">
              <p className="text-[11px] font-mono text-slate-300">
                Color(t) = A + B · cos(2π · (C · t + D))
              </p>
              {(
                [
                  { key: "a", label: "Bias A", min: 0, max: 1 },
                  { key: "b", label: "Amplitude B", min: 0, max: 0.7 },
                  { key: "c", label: "Frequency C", min: 0.2, max: 3 },
                  { key: "d", label: "Phase D", min: 0, max: 1 },
                ] as const
              ).map(row => {
                const vec = (pal.cosine ?? DEFAULT_COSINE)[row.key];
                return (
                  <div key={row.key} className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {row.label}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(["R", "G", "B"] as const).map((ch, ci) => (
                        <label key={ch} className="flex items-center gap-1.5 text-[10px] font-mono">
                          <span className="text-slate-400 w-3">{ch}</span>
                          <input
                            type="range"
                            min={row.min}
                            max={row.max}
                            step={0.01}
                            value={vec[ci]}
                            onChange={e =>
                              updateCosine(row.key, ci as 0 | 1 | 2, parseFloat(e.target.value))
                            }
                            className="fe-range"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Save as Custom Palette */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Palette name…"
              className="fe-input flex-1"
            />
            <button
              onClick={() => {
                const named: Palette = {
                  ...pal,
                  id: `custom-${Date.now()}`,
                  name: customName.trim() || "Custom Palette",
                  category: "Custom",
                };
                onSaveCustomPreset(named);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-violet-400/40 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25 shrink-0"
            >
              <BookmarkPlus size={13} /> Save Preset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-400/15 flex flex-wrap items-center justify-between gap-2 bg-black/25">
          <button
            onClick={() => setPal(generateHarmoniousPalette())}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-400/25 text-slate-200 hover:bg-white/5"
          >
            <Shuffle size={12} /> Harmonic Random
          </button>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-400/20 text-slate-300 hover:text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onSave({
                  ...pal,
                  name: customName.trim() || pal.name || "Custom Palette",
                  stops: [...pal.stops].sort((a, b) => a.pos - b.pos),
                })
              }
              className="px-4 py-1.5 text-xs rounded-lg border border-cyan-400/45 bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/30 font-semibold"
            >
              Apply Palette
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
