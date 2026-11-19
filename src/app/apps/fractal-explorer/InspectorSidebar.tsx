"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import katex from "katex";
import "katex/dist/katex.min.css";
import {
  Bookmark,
  Compass,
  Cpu,
  Film,
  Layers,
  MapPin,
  Palette as PaletteIcon,
  Play,
  RotateCcw,
  Search,
  Settings2,
  Shuffle,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Video,
} from "lucide-react";
import { formatZoom } from "./lib/camera";
import {
  COLORING_MODE_ORDER,
  FORMULA_ORDER,
  FRACTAL_FORMULAS,
  INTERIOR_MODE_ORDER,
} from "./lib/formulas";
import { PALETTE_LIBRARY, getPaletteById, paletteGradientCSS } from "./lib/palette";
import { DEEP_ZOOM_TOURS, PRESET_LOCATIONS, type DeepZoomTour } from "./lib/presets";
import type {
  ActiveEngine,
  AnimationState,
  ColoringMode,
  EngineMode,
  FractalFamily,
  FractalSettings,
  InteriorMode,
  OverlaySettings,
  Palette,
  PaletteCategory,
  PresetCategory,
  PresetLocation,
  TransferScale,
  UserBookmark,
} from "./lib/types";

export type SidebarTab = "fractal" | "visuals" | "atlas" | "lab" | "animate";

interface Props {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  settings: FractalSettings;
  overlays: OverlaySettings;
  animations: AnimationState;
  activeEngine: ActiveEngine;
  customPalettes: Palette[];
  bookmarks: UserBookmark[];
  isRecording: boolean;
  recordSeconds: number;
  onLiveChange: (updater: (s: FractalSettings) => FractalSettings) => void;
  onCommitChange: (updater: (s: FractalSettings) => FractalSettings) => void;
  onSelectFormula: (family: FractalFamily) => void;
  onFlyToPreset: (preset: PresetLocation) => void;
  onStartDeepTour: (tour: DeepZoomTour) => void;
  onSaveBookmark: () => void;
  onLoadBookmark: (bm: UserBookmark) => void;
  onDeleteBookmark: (id: string) => void;
  onOverlaysChange: (updater: (o: OverlaySettings) => OverlaySettings) => void;
  onAnimationsChange: (updater: (a: AnimationState) => AnimationState) => void;
  onRandomPalette: () => void;
  onOpenPaletteEditor: () => void;
  onToggleRecord: () => void;
}

const TABS: { id: SidebarTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "fractal", label: "Fractal", icon: Sparkles },
  { id: "visuals", label: "Visuals", icon: PaletteIcon },
  { id: "atlas", label: "Atlas", icon: MapPin },
  { id: "lab", label: "Lab", icon: Cpu },
  { id: "animate", label: "Motion", icon: Film },
];

export function InspectorSidebar({
  activeTab,
  onTabChange,
  settings,
  overlays,
  animations,
  activeEngine,
  customPalettes,
  bookmarks,
  isRecording,
  recordSeconds,
  onLiveChange,
  onCommitChange,
  onSelectFormula,
  onFlyToPreset,
  onStartDeepTour,
  onSaveBookmark,
  onLoadBookmark,
  onDeleteBookmark,
  onOverlaysChange,
  onAnimationsChange,
  onRandomPalette,
  onOpenPaletteEditor,
  onToggleRecord,
}: Props) {
  const meta = FRACTAL_FORMULAS[settings.family];
  const [atlasCat, setAtlasCat] = useState<"All" | PresetCategory>("All");
  const [atlasSearch, setAtlasSearch] = useState("");
  const [palCat, setPalCat] = useState<"All" | PaletteCategory>("All");

  const juliaPadRef = useRef<HTMLDivElement>(null);
  const juliaDraggingRef = useRef(false);

  const lightPadRef = useRef<HTMLDivElement>(null);
  const lightDraggingRef = useRef(false);

  const latexHtml = useMemo(() => {
    const tex = settings.isJulia && meta.supportsJulia ? meta.latexJulia : meta.latexParameter;
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode: false });
    } catch {
      return tex;
    }
  }, [meta, settings.isJulia]);

  const filteredPresets = useMemo(() => {
    const q = atlasSearch.trim().toLowerCase();
    return PRESET_LOCATIONS.filter(p => {
      const catOk = atlasCat === "All" || p.category === atlasCat;
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.settings.family?.toLowerCase().includes(q) ?? false);
      return catOk && qOk;
    });
  }, [atlasCat, atlasSearch]);

  const allPalettes = useMemo(() => [...PALETTE_LIBRARY, ...customPalettes], [customPalettes]);
  const filteredPalettes = useMemo(() => {
    if (palCat === "All") return allPalettes;
    return allPalettes.filter(p => (p.category ?? "Custom") === palCat);
  }, [allPalettes, palCat]);

  // Interactive 2D Complex Plane drag pad for Julia C
  const updateJuliaFromPad = (clientX: number, clientY: number, commit: boolean) => {
    const rect = juliaPadRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const cx = +(nx * 3.2 - 1.8).toFixed(5);
    const cy = +((1 - ny) * 3.0 - 1.5).toFixed(5);
    const fn = commit ? onCommitChange : onLiveChange;
    fn(s => ({ ...s, isJulia: true, juliaCx: cx, juliaCy: cy }));
  };

  // Interactive 2D Light Direction Pad
  const updateLightFromPad = (clientX: number, clientY: number, commit: boolean) => {
    const rect = lightPadRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const dy = (1 - (clientY - rect.top) / rect.height) * 2 - 1;
    const az = Math.round((((Math.atan2(dy, dx) * 180) / Math.PI) + 360) % 360);
    const dist = Math.min(1, Math.hypot(dx, dy));
    const el = Math.round(85 - dist * 75);
    const fn = commit ? onCommitChange : onLiveChange;
    fn(s => ({ ...s, lighting: { ...s.lighting, enabled: true, azimuth: az, elevation: el } }));
  };

  const jPadLeft = Math.max(4, Math.min(96, ((settings.juliaCx + 1.8) / 3.2) * 100));
  const jPadTop = Math.max(4, Math.min(96, (1 - (settings.juliaCy + 1.5) / 3.0) * 100));

  const lightRad = (settings.lighting.azimuth * Math.PI) / 180;
  const lightDist = (85 - settings.lighting.elevation) / 75;
  const lPadX = 50 + Math.cos(lightRad) * lightDist * 42;
  const lPadY = 50 - Math.sin(lightRad) * lightDist * 42;

  return (
    <div className="flex flex-col h-full w-full text-slate-100">
      {/* Tab Bar */}
      <div className="grid grid-cols-5 border-b border-slate-400/15 bg-black/35 shrink-0">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-mono transition-colors border-b-2 ${
                active
                  ? "border-cyan-400 text-cyan-300 bg-cyan-400/10"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto fe-scroll p-3.5 space-y-4">
        {/* ── TAB 1: FRACTAL ─────────────────────────────────────────────── */}
        {activeTab === "fractal" && (
          <>
            {/* Formula Selector */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Fractal Family (10)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {FORMULA_ORDER.map(fid => {
                  const fm = FRACTAL_FORMULAS[fid];
                  const active = settings.family === fid;
                  return (
                    <button
                      key={fid}
                      onClick={() => onSelectFormula(fid)}
                      className={`text-left px-2.5 py-2 rounded-lg border transition-all ${
                        active
                          ? "border-cyan-400/55 bg-cyan-400/15 text-cyan-100 shadow-[0_0_16px_rgba(0,195,245,0.12)]"
                          : "border-slate-400/15 bg-black/30 text-slate-300 hover:border-slate-300/30 hover:text-white"
                      }`}
                    >
                      <div className="text-[11px] font-semibold truncate">{fm.shortName}</div>
                      <div className="text-[9px] font-mono text-slate-400 truncate">{fm.badge}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Parameter vs Julia Toggle */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Complex Plane Mode
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() =>
                    onCommitChange(s => ({
                      ...s,
                      isJulia: false,
                      camera: meta.defaultCamera,
                    }))
                  }
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all ${
                    !settings.isJulia
                      ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                      : "border-slate-400/20 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Parameter (c)
                </button>
                <button
                  disabled={!meta.supportsJulia}
                  onClick={() =>
                    onCommitChange(s => ({
                      ...s,
                      isJulia: true,
                      camera: { centerX: 0, centerY: 0, zoom: 1.0, rotation: 0 },
                    }))
                  }
                  className={`py-1.5 text-xs rounded-lg border font-medium transition-all disabled:opacity-35 ${
                    settings.isJulia && meta.supportsJulia
                      ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-200"
                      : "border-slate-400/20 text-slate-300 hover:bg-white/5"
                  }`}
                >
                  Julia Set (z₀)
                </button>
              </div>
            </div>

            {/* Interactive Julia C Drag Pad */}
            {meta.supportsJulia && (
              <div className="space-y-2 p-2.5 rounded-xl bg-black/35 border border-slate-400/15">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-300">
                    Julia Seed c
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Drag pad or Shift+Click
                  </span>
                </div>

                <div
                  ref={juliaPadRef}
                  onPointerDown={e => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    juliaDraggingRef.current = true;
                    updateJuliaFromPad(e.clientX, e.clientY, false);
                  }}
                  onPointerMove={e => {
                    if (juliaDraggingRef.current) updateJuliaFromPad(e.clientX, e.clientY, false);
                  }}
                  onPointerUp={e => {
                    if (!juliaDraggingRef.current) return;
                    juliaDraggingRef.current = false;
                    updateJuliaFromPad(e.clientX, e.clientY, true);
                  }}
                  className="relative h-24 rounded-lg border border-slate-400/20 bg-gradient-to-br from-[#07071a] via-[#100a28] to-[#061322] cursor-crosshair overflow-hidden"
                >
                  {/* Reference crosshairs */}
                  <div className="absolute inset-x-0 top-1/2 h-px bg-slate-400/20" />
                  <div className="absolute left-[56.25%] inset-y-0 w-px bg-slate-400/20" />
                  <div
                    className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-300 bg-fuchsia-500/70 shadow-[0_0_10px_rgba(0,195,245,0.85)]"
                    style={{ left: `${jPadLeft}%`, top: `${jPadTop}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400">Re(c)</span>
                    <input
                      type="number"
                      step="0.005"
                      value={Number(settings.juliaCx.toFixed(6))}
                      onChange={e =>
                        onCommitChange(s => ({
                          ...s,
                          juliaCx: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="fe-input font-mono"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400">Im(c)</span>
                    <input
                      type="number"
                      step="0.005"
                      value={Number(settings.juliaCy.toFixed(6))}
                      onChange={e =>
                        onCommitChange(s => ({
                          ...s,
                          juliaCy: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="fe-input font-mono"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Exponent d & Parameter p */}
            {(meta.supportsPower || meta.supportsParamP) && (
              <div className="space-y-3 p-2.5 rounded-xl bg-black/35 border border-slate-400/15">
                {meta.supportsPower && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{meta.powerLabel}</span>
                      <span className="font-mono text-cyan-300">{settings.power.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={meta.powerMin}
                      max={meta.powerMax}
                      step={meta.powerStep}
                      value={settings.power}
                      onChange={e =>
                        onLiveChange(s => ({ ...s, power: parseFloat(e.target.value) }))
                      }
                      onPointerUp={() => onCommitChange(s => s)}
                      className="fe-range"
                    />
                  </div>
                )}

                {meta.supportsParamP && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{meta.paramPLabel}</span>
                      <span className="font-mono text-violet-300">
                        {settings.paramP.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={meta.paramPMin}
                      max={meta.paramPMax}
                      step={meta.paramPStep}
                      value={settings.paramP}
                      onChange={e =>
                        onLiveChange(s => ({ ...s, paramP: parseFloat(e.target.value) }))
                      }
                      onPointerUp={() => onCommitChange(s => s)}
                      className="fe-range"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Live KaTeX Formula & Mathematical Notes */}
            <div className="p-3 rounded-xl bg-black/45 border border-cyan-400/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                  Recurrence Map
                </span>
                <span className="text-[9px] font-mono text-slate-400">{meta.badge}</span>
              </div>
              <div
                className="fe-katex py-1.5 px-2 rounded-lg bg-black/50 border border-slate-400/10"
                dangerouslySetInnerHTML={{ __html: latexHtml }}
              />
              <p className="text-[11px] text-slate-300 leading-relaxed">{meta.description}</p>
              {meta.physicsNote && (
                <p className="text-[11px] text-cyan-200/90 leading-relaxed border-t border-slate-400/15 pt-1.5">
                  <span className="font-mono text-[9px] uppercase text-cyan-300 mr-1">
                    Physics:
                  </span>
                  {meta.physicsNote}
                </p>
              )}
            </div>
          </>
        )}

        {/* ── TAB 2: VISUALS ─────────────────────────────────────────────── */}
        {activeTab === "visuals" && (
          <>
            {/* Exterior Coloring */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Exterior Coloring (8)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {COLORING_MODE_ORDER.map(cm => (
                  <button
                    key={cm.id}
                    onClick={() =>
                      onCommitChange(s => ({ ...s, coloring: cm.id as ColoringMode }))
                    }
                    title={cm.desc}
                    className={`text-left px-2 py-1.5 rounded-lg border transition-all ${
                      settings.coloring === cm.id
                        ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100"
                        : "border-slate-400/15 bg-black/30 text-slate-300 hover:border-slate-300/30"
                    }`}
                  >
                    <div className="text-[11px] font-medium truncate">{cm.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contextual Trap / Stripe sliders */}
            {(settings.coloring === "trap-cross" ||
              settings.coloring === "trap-ring" ||
              settings.coloring === "trap-point") && (
              <div className="p-2.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                  Orbit Trap Target
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400">
                      Trap X ({settings.trap.x.toFixed(2)})
                    </span>
                    <input
                      type="range"
                      min={-2}
                      max={2}
                      step={0.02}
                      value={settings.trap.x}
                      onChange={e =>
                        onLiveChange(s => ({
                          ...s,
                          trap: { ...s.trap, x: parseFloat(e.target.value) },
                        }))
                      }
                      className="fe-range"
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400">
                      Trap Y ({settings.trap.y.toFixed(2)})
                    </span>
                    <input
                      type="range"
                      min={-2}
                      max={2}
                      step={0.02}
                      value={settings.trap.y}
                      onChange={e =>
                        onLiveChange(s => ({
                          ...s,
                          trap: { ...s.trap, y: parseFloat(e.target.value) },
                        }))
                      }
                      className="fe-range"
                    />
                  </label>
                </div>
                {settings.coloring === "trap-ring" && (
                  <label className="block space-y-0.5">
                    <span className="text-[9px] font-mono text-slate-400">
                      Ring Radius ({settings.trap.radius.toFixed(2)})
                    </span>
                    <input
                      type="range"
                      min={0.1}
                      max={2.5}
                      step={0.05}
                      value={settings.trap.radius}
                      onChange={e =>
                        onLiveChange(s => ({
                          ...s,
                          trap: { ...s.trap, radius: parseFloat(e.target.value) },
                        }))
                      }
                      className="fe-range"
                    />
                  </label>
                )}
              </div>
            )}

            {settings.coloring === "stripe" && (
              <div className="p-2.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Stripe Harmonics</span>
                  <span className="font-mono text-cyan-300">{settings.stripeDensity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={16}
                  step={0.5}
                  value={settings.stripeDensity}
                  onChange={e =>
                    onLiveChange(s => ({ ...s, stripeDensity: parseFloat(e.target.value) }))
                  }
                  className="fe-range"
                />
              </div>
            )}

            {/* Interior Mode */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Interior Fill
                </span>
                <input
                  type="color"
                  value={settings.interiorColor}
                  onChange={e =>
                    onLiveChange(s => ({ ...s, interiorColor: e.target.value }))
                  }
                  title="Interior Base Color"
                  className="w-6 h-5 rounded border border-slate-400/25 bg-transparent cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-4 gap-1">
                {INTERIOR_MODE_ORDER.map(im => (
                  <button
                    key={im.id}
                    onClick={() =>
                      onCommitChange(s => ({ ...s, interior: im.id as InteriorMode }))
                    }
                    className={`py-1 text-[10px] rounded border transition-all ${
                      settings.interior === im.id
                        ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                        : "border-slate-400/15 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    {im.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Relief Lighting */}
            <div className="p-2.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-300">
                  <Sun size={11} /> 3D Relief Shading
                </span>
                <input
                  type="checkbox"
                  checked={settings.lighting.enabled}
                  onChange={e =>
                    onCommitChange(s => ({
                      ...s,
                      lighting: { ...s.lighting, enabled: e.target.checked },
                    }))
                  }
                  className="accent-cyan-400"
                />
              </div>

              {settings.lighting.enabled && (
                <div className="grid grid-cols-[64px_1fr] gap-2.5 items-center">
                  {/* Interactive Azimuth/Elevation Sphere Pad */}
                  <div
                    ref={lightPadRef}
                    onPointerDown={e => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      lightDraggingRef.current = true;
                      updateLightFromPad(e.clientX, e.clientY, false);
                    }}
                    onPointerMove={e => {
                      if (lightDraggingRef.current) updateLightFromPad(e.clientX, e.clientY, false);
                    }}
                    onPointerUp={e => {
                      if (!lightDraggingRef.current) return;
                      lightDraggingRef.current = false;
                      updateLightFromPad(e.clientX, e.clientY, true);
                    }}
                    className="relative w-16 h-16 rounded-full border border-slate-400/25 bg-radial from-slate-800/80 to-black cursor-pointer"
                    title={`Azimuth ${settings.lighting.azimuth}° · Elevation ${settings.lighting.elevation}°`}
                  >
                    <div
                      className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                      style={{ left: `${lPadX}%`, top: `${lPadY}%` }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block space-y-0.5">
                      <div className="flex justify-between text-[10px] text-slate-300">
                        <span>Relief Depth</span>
                        <span className="font-mono">{Math.round(settings.lighting.strength * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={settings.lighting.strength}
                        onChange={e =>
                          onLiveChange(s => ({
                            ...s,
                            lighting: { ...s.lighting, strength: parseFloat(e.target.value) },
                          }))
                        }
                        className="fe-range"
                      />
                    </label>
                    <label className="block space-y-0.5">
                      <div className="flex justify-between text-[10px] text-slate-300">
                        <span>Specular</span>
                        <span className="font-mono">{Math.round(settings.lighting.specular * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={settings.lighting.specular}
                        onChange={e =>
                          onLiveChange(s => ({
                            ...s,
                            lighting: { ...s.lighting, specular: parseFloat(e.target.value) },
                          }))
                        }
                        className="fe-range"
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Palette Swatch Grid & Transfer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Color Palette
                </span>
                <div className="flex gap-1">
                  {(["linear", "log", "sqrt"] as TransferScale[]).map(tr => (
                    <button
                      key={tr}
                      onClick={() => onCommitChange(s => ({ ...s, transfer: tr }))}
                      className={`px-1.5 py-0.5 text-[9px] font-mono uppercase rounded border ${
                        settings.transfer === tr
                          ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                          : "border-slate-400/20 text-slate-400 hover:text-white"
                      }`}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Palette Category Pills */}
              <div className="flex flex-wrap gap-1">
                {(["All", "Celestial", "Scientific", "Classic", "Custom"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setPalCat(cat)}
                    className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                      palCat === cat
                        ? "border-cyan-400/45 bg-cyan-400/15 text-cyan-200"
                        : "border-slate-400/15 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Visual Gradient Swatches */}
              <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto fe-scroll pr-0.5">
                {filteredPalettes.map((pal, i) => {
                  const isActive =
                    (pal.id && settings.palette.id === pal.id) || pal.name === settings.palette.name;
                  return (
                    <button
                      key={pal.id ?? `${pal.name}-${i}`}
                      onClick={() => onCommitChange(s => ({ ...s, palette: pal }))}
                      className={`group rounded-lg border p-1.5 text-left transition-all ${
                        isActive
                          ? "border-cyan-400/65 bg-cyan-400/10"
                          : "border-slate-400/15 bg-black/30 hover:border-slate-300/35"
                      }`}
                    >
                      <div
                        className="h-3.5 w-full rounded mb-1"
                        style={{
                          background: `linear-gradient(to right, ${paletteGradientCSS(pal, 24)})`,
                        }}
                      />
                      <div className="text-[10px] text-slate-200 truncate">{pal.name ?? "Palette"}</div>
                    </button>
                  );
                })}
              </div>

              {/* Density & Offset */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-400">
                    Density ({(settings.paletteScale * 100).toFixed(1)})
                  </span>
                  <input
                    type="range"
                    min={0.006}
                    max={0.22}
                    step={0.002}
                    value={settings.paletteScale}
                    onChange={e =>
                      onLiveChange(s => ({ ...s, paletteScale: parseFloat(e.target.value) }))
                    }
                    className="fe-range"
                  />
                </label>
                <label className="space-y-0.5">
                  <span className="text-[9px] font-mono text-slate-400">
                    Phase ({Math.round(settings.paletteOffset * 100)}%)
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.005}
                    value={settings.paletteOffset}
                    onChange={e =>
                      onLiveChange(s => ({ ...s, paletteOffset: parseFloat(e.target.value) }))
                    }
                    className="fe-range"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={onRandomPalette}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border border-slate-400/20 bg-white/[0.04] text-slate-200 hover:bg-white/10"
                >
                  <Shuffle size={12} /> Random
                </button>
                <button
                  onClick={onOpenPaletteEditor}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border border-cyan-400/35 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
                >
                  <Settings2 size={12} /> Studio
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── TAB 3: ATLAS ───────────────────────────────────────────────── */}
        {activeTab === "atlas" && (
          <>
            {/* Search & Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={atlasSearch}
                  onChange={e => setAtlasSearch(e.target.value)}
                  placeholder="Filter 26 atlas sites…"
                  className="fe-input pl-7"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {(["All", "Mandelbrot", "Julia", "Exotic", "Newton & Nova", "Physics"] as const).map(
                  cat => (
                    <button
                      key={cat}
                      onClick={() => setAtlasCat(cat)}
                      className={`px-2 py-0.5 text-[10px] rounded-full border transition-colors ${
                        atlasCat === cat
                          ? "border-cyan-400/45 bg-cyan-400/15 text-cyan-200"
                          : "border-slate-400/15 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Bookmarks */}
            <div className="space-y-2 p-2.5 rounded-xl bg-black/35 border border-slate-400/15">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-300">
                  <Bookmark size={11} /> Bookmarks ({bookmarks.length})
                </span>
                <button
                  onClick={onSaveBookmark}
                  className="px-2 py-1 rounded text-[10px] font-mono border border-cyan-400/40 bg-cyan-400/15 text-cyan-200 hover:bg-cyan-400/25"
                >
                  + Save View
                </button>
              </div>

              {bookmarks.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  Save any deep coordinates, palette, and 3D lighting configuration locally.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto fe-scroll">
                  {bookmarks.map(bm => (
                    <div
                      key={bm.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-black/40 border border-slate-400/15"
                    >
                      {bm.thumbnail && (
                        <Image
                          src={bm.thumbnail}
                          alt={bm.name}
                          width={40}
                          height={28}
                          unoptimized
                          className="w-10 h-7 rounded object-cover border border-white/10 shrink-0"
                        />
                      )}
                      <button
                        onClick={() => onLoadBookmark(bm)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="text-[11px] font-medium text-slate-100 truncate">
                          {bm.name}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400">
                          {bm.settings.family} · {formatZoom(bm.settings.camera.zoom)}
                        </div>
                      </button>
                      <button
                        onClick={() => onDeleteBookmark(bm.id)}
                        className="p-1 text-slate-400 hover:text-red-300"
                        title="Delete bookmark"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Atlas Cards */}
            <div className="space-y-2">
              {filteredPresets.map(preset => {
                const pal = getPaletteById(preset.settings.paletteId);
                return (
                  <button
                    key={preset.id}
                    onClick={() => onFlyToPreset(preset)}
                    className="w-full text-left rounded-xl border border-slate-400/15 bg-black/35 hover:border-cyan-400/45 hover:bg-cyan-400/[0.06] transition-all overflow-hidden group"
                  >
                    <div
                      className="h-1.5 w-full"
                      style={{
                        background: `linear-gradient(to right, ${preset.accentGradient[0]}, ${preset.accentGradient[1]}, ${paletteGradientCSS(pal, 8)})`,
                      }}
                    />
                    <div className="p-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-100 group-hover:text-cyan-200 truncate">
                          {preset.name}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-cyan-300 shrink-0">
                          {formatZoom(preset.settings.camera.zoom)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── TAB 4: LAB ─────────────────────────────────────────────────── */}
        {activeTab === "lab" && (
          <>
            {/* Rendering Engine */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Precision Engine
                </span>
                <span className="text-[10px] font-mono text-cyan-300 uppercase">
                  Active: {activeEngine}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: "auto", label: "Auto Hybrid", sub: "F32 → DS64 → CPU64" },
                    { id: "gpu-f32", label: "WebGL2 F32", sub: "60fps shader" },
                    { id: "gpu-ds64", label: "WebGL2 DS64", sub: "Emulated 48-bit" },
                    { id: "cpu-f64", label: "CPU Float64", sub: "Multi-core deep" },
                  ] as { id: EngineMode; label: string; sub: string }[]
                ).map(eng => (
                  <button
                    key={eng.id}
                    onClick={() => onCommitChange(s => ({ ...s, engine: eng.id }))}
                    className={`text-left px-2.5 py-1.5 rounded-lg border transition-all ${
                      settings.engine === eng.id
                        ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100"
                        : "border-slate-400/15 bg-black/30 text-slate-300 hover:border-slate-300/30"
                    }`}
                  >
                    <div className="text-[11px] font-medium">{eng.label}</div>
                    <div className="text-[9px] font-mono text-slate-400">{eng.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Iterations */}
            <div className="p-2.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Iterations
                </span>
                <label className="flex items-center gap-1.5 text-[10px] text-cyan-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoIter}
                    onChange={e =>
                      onCommitChange(s => ({ ...s, autoIter: e.target.checked }))
                    }
                    className="accent-cyan-400"
                  />
                  Auto-scale
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={48}
                  max={2048}
                  step={16}
                  value={Math.min(2048, settings.maxIter)}
                  onChange={e =>
                    onLiveChange(s => ({ ...s, maxIter: parseInt(e.target.value) || 256 }))
                  }
                  className="fe-range flex-1"
                />
                <input
                  type="number"
                  min={16}
                  max={8192}
                  value={settings.maxIter}
                  onChange={e =>
                    onCommitChange(s => ({
                      ...s,
                      maxIter: Math.max(16, Math.min(8192, parseInt(e.target.value) || 256)),
                    }))
                  }
                  className="fe-input w-16 font-mono text-center"
                />
              </div>
            </div>

            {/* Anti-Aliasing & Resolution Scale */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Anti-Aliasing
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {([1, 2, 4] as const).map(aa => (
                    <button
                      key={aa}
                      onClick={() => onCommitChange(s => ({ ...s, aa }))}
                      className={`py-1 text-[10px] font-mono rounded border ${
                        settings.aa === aa
                          ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                          : "border-slate-400/15 text-slate-300"
                      }`}
                    >
                      {aa === 1 ? "1×" : aa === 2 ? "2×2" : "4×4"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  DPR Quality
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { v: 0.75, l: "Fast" },
                    { v: 1, l: "1×" },
                    { v: 2, l: "HiDPI" },
                  ].map(d => (
                    <button
                      key={d.l}
                      onClick={() => onCommitChange(s => ({ ...s, dprScale: d.v }))}
                      className={`py-1 text-[10px] font-mono rounded border ${
                        settings.dprScale === d.v
                          ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100"
                          : "border-slate-400/15 text-slate-300"
                      }`}
                    >
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rotation & Bailout */}
            <div className="p-2.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-2.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Compass size={11} /> Viewport Rotation
                  </span>
                  <span className="font-mono text-cyan-300">
                    {Math.round((settings.camera.rotation * 180) / Math.PI)}°
                  </span>
                </div>
                <input
                  type="range"
                  min={-Math.PI}
                  max={Math.PI}
                  step={0.01745}
                  value={settings.camera.rotation}
                  onChange={e =>
                    onLiveChange(s => ({
                      ...s,
                      camera: { ...s.camera, rotation: parseFloat(e.target.value) },
                    }))
                  }
                  className="fe-range"
                />
                <div className="flex gap-1 pt-0.5">
                  {[0, 90, 180].map(deg => (
                    <button
                      key={deg}
                      onClick={() =>
                        onCommitChange(s => ({
                          ...s,
                          camera: { ...s.camera, rotation: (deg * Math.PI) / 180 },
                        }))
                      }
                      className="flex-1 py-0.5 text-[10px] font-mono rounded border border-slate-400/20 text-slate-300 hover:bg-white/5"
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  Escape Bailout (R²)
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[16, 64, 256, 4096].map(b => (
                    <button
                      key={b}
                      onClick={() => onCommitChange(s => ({ ...s, bailout: b }))}
                      className={`py-1 text-[10px] font-mono rounded border ${
                        settings.bailout === b
                          ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-100"
                          : "border-slate-400/15 text-slate-300"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Overlays */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-400">
                <Layers size={11} /> Observatory Overlays
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { key: "grid", label: "Complex Grid" },
                    { key: "orbitProbe", label: "Orbit Probe" },
                    { key: "pipJulia", label: "Live Julia PiP" },
                    { key: "splitView", label: "50/50 Split View" },
                    { key: "minimap", label: "Minimap" },
                    { key: "hud", label: "HUD Telemetry" },
                  ] as { key: keyof OverlaySettings; label: string }[]
                ).map(item => (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                      overlays[item.key]
                        ? "border-cyan-400/45 bg-cyan-400/10 text-cyan-100"
                        : "border-slate-400/15 bg-black/25 text-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={overlays[item.key]}
                      onChange={e =>
                        onOverlaysChange(o => ({ ...o, [item.key]: e.target.checked }))
                      }
                      className="accent-cyan-400"
                    />
                    <span className="truncate">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB 5: ANIMATE ─────────────────────────────────────────────── */}
        {activeTab === "animate" && (
          <>
            {/* Palette Cycling */}
            <div className="p-2.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-100">Palette Color Cycling</span>
                <button
                  onClick={() =>
                    onAnimationsChange(a => ({ ...a, cyclePalette: !a.cyclePalette }))
                  }
                  className={`px-2.5 py-1 rounded text-[10px] font-mono border ${
                    animations.cyclePalette
                      ? "border-cyan-400/50 bg-cyan-400/20 text-cyan-200"
                      : "border-slate-400/20 text-slate-300"
                  }`}
                >
                  {animations.cyclePalette ? "Active" : "Off"}
                </button>
              </div>
              <label className="block space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Cycle Velocity</span>
                  <span>{animations.cycleSpeed.toFixed(2)}×</span>
                </div>
                <input
                  type="range"
                  min={-2}
                  max={2}
                  step={0.05}
                  value={animations.cycleSpeed}
                  onChange={e =>
                    onAnimationsChange(a => ({ ...a, cycleSpeed: parseFloat(e.target.value) }))
                  }
                  className="fe-range"
                />
              </label>
            </div>

            {/* Auto-Zoom Dive */}
            <div className="p-2.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-100">Continuous Zoom Dive</span>
                <button
                  onClick={() => onAnimationsChange(a => ({ ...a, autoZoom: !a.autoZoom }))}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono border ${
                    animations.autoZoom
                      ? "border-cyan-400/50 bg-cyan-400/20 text-cyan-200"
                      : "border-slate-400/20 text-slate-300"
                  }`}
                >
                  {animations.autoZoom ? "Diving" : "Off"}
                </button>
              </div>
              <label className="block space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Zoom Rate</span>
                  <span>{animations.zoomSpeed.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.15}
                  max={2.2}
                  step={0.05}
                  value={animations.zoomSpeed}
                  onChange={e =>
                    onAnimationsChange(a => ({ ...a, zoomSpeed: parseFloat(e.target.value) }))
                  }
                  className="fe-range"
                />
              </label>

              <div className="pt-1 space-y-1">
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">
                  Cinematic Deep-Dive Tours
                </span>
                <div className="space-y-1">
                  {DEEP_ZOOM_TOURS.map(tour => (
                    <button
                      key={tour.id}
                      onClick={() => onStartDeepTour(tour)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-slate-400/15 bg-black/40 hover:border-cyan-400/45 text-left transition-colors"
                    >
                      <div>
                        <div className="text-[11px] font-medium text-slate-100">{tour.name}</div>
                        <div className="text-[9px] text-slate-400">{tour.subtitle}</div>
                      </div>
                      <Play size={11} className="text-cyan-300 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Julia & Exponent Morphs */}
            <div className="p-2.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-100">Julia Boundary Morph</span>
                <button
                  onClick={() =>
                    onAnimationsChange(a => ({ ...a, juliaMorph: !a.juliaMorph }))
                  }
                  className={`px-2.5 py-1 rounded text-[10px] font-mono border ${
                    animations.juliaMorph
                      ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-200"
                      : "border-slate-400/20 text-slate-300"
                  }`}
                >
                  {animations.juliaMorph ? "Morphing" : "Off"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(["cardioid", "circle", "figure8"] as const).map(path => (
                  <button
                    key={path}
                    onClick={() => onAnimationsChange(a => ({ ...a, morphPath: path }))}
                    className={`py-1 text-[10px] capitalize rounded border ${
                      animations.morphPath === path
                        ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-100"
                        : "border-slate-400/15 text-slate-300"
                    }`}
                  >
                    {path}
                  </button>
                ))}
              </div>

              {meta.supportsPower && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-400/15">
                  <span className="text-xs font-medium text-slate-100">Exponent d Morph</span>
                  <button
                    onClick={() =>
                      onAnimationsChange(a => ({ ...a, powerMorph: !a.powerMorph }))
                    }
                    className={`px-2.5 py-1 rounded text-[10px] font-mono border ${
                      animations.powerMorph
                        ? "border-violet-400/50 bg-violet-500/20 text-violet-200"
                        : "border-slate-400/20 text-slate-300"
                    }`}
                  >
                    {animations.powerMorph ? "Active" : "Off"}
                  </button>
                </div>
              )}

              <button
                onClick={() =>
                  onAnimationsChange(a => ({
                    ...a,
                    cyclePalette: false,
                    autoZoom: false,
                    juliaMorph: false,
                    powerMorph: false,
                  }))
                }
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] border border-slate-400/20 text-slate-300 hover:bg-white/5"
              >
                <RotateCcw size={11} /> Stop All Motions
              </button>
            </div>

            {/* WebM Video Capture */}
            <div className="p-2.5 rounded-xl bg-black/35 border border-slate-400/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-100">
                  <Video size={13} className="text-cyan-300" /> Canvas Video Capture
                </span>
                {isRecording && (
                  <span className="text-[10px] font-mono text-red-300 animate-pulse">
                    REC {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:
                    {String(recordSeconds % 60).padStart(2, "0")}
                  </span>
                )}
              </div>
              <button
                onClick={onToggleRecord}
                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  isRecording
                    ? "border-red-400/50 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                    : "border-cyan-400/45 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25"
                }`}
              >
                {isRecording ? (
                  <>
                    <Square size={12} /> Stop & Save WebM
                  </>
                ) : (
                  <>
                    <Video size={12} /> Record WebM Animation
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
