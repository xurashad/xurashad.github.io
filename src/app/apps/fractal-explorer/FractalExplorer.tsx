"use client";

import {
  useState, useCallback, useRef, useMemo,
} from "react";
import {
  Undo2, Redo2, Download, Shuffle, Settings2,
  PanelLeftClose, PanelLeftOpen, Square,
  Infinity as InfinityIcon, Repeat2, MapPin,
} from "lucide-react";
import { FractalCanvas, type CanvasHandle } from "./FractalCanvas";
import { PaletteEditor } from "./PaletteEditor";
import {
  STANDARD_PALETTES, DEFAULT_SETTINGS, PRESETS, paletteGradientCSS,
} from "./lib/palette";
import type { Settings, FractalView, Palette } from "./lib/types";

// ── Tiny UI helpers ───────────────────────────────────────────────────────────

function Btn({
  onClick, disabled, title, active, danger, children,
}: {
  onClick?: () => void; disabled?: boolean; title?: string;
  active?: boolean; danger?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      className={`
        flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
        border transition-all select-none
        ${disabled
          ? "opacity-25 cursor-not-allowed border-white/5 text-foreground/30"
          : danger
            ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            : active
              ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-300"
              : "border-white/10 text-foreground/55 hover:border-white/20 hover:text-foreground/80 bg-white/[0.03]"
        }
      `}
    >
      {children}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[9px] font-mono text-foreground/30 uppercase tracking-widest">{label}</span>
      {children}
    </label>
  );
}

function Inp({
  value, onChange, disabled, type = "number", min, max, step,
}: {
  value: string | number; onChange: (v: string) => void; disabled?: boolean;
  type?: string; min?: string; max?: string; step?: string;
}) {
  return (
    <input
      type={type} value={value} disabled={disabled} min={min} max={max} step={step}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-black/30 border border-white/8 rounded-md px-2 py-1.5 text-xs text-foreground/70
                 focus:outline-none focus:border-cyan-400/40 disabled:opacity-30 transition-colors"
    />
  );
}

function Sel({ value, onChange, disabled, children }: {
  value: string | number; onChange: (v: string) => void;
  disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <select
      value={value} disabled={disabled} onChange={e => onChange(e.target.value)}
      className="w-full bg-black/30 border border-white/8 rounded-md px-2 py-1.5 text-xs text-foreground/70
                 focus:outline-none focus:border-cyan-400/40 disabled:opacity-30 transition-colors"
    >
      {children}
    </select>
  );
}

// ── Main Explorer ─────────────────────────────────────────────────────────────

type UndoEntry = Settings;

export function FractalExplorer() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [past,    setPast]    = useState<UndoEntry[]>([]);
  const [future,  setFuture]  = useState<UndoEntry[]>([]);

  const [status,   setStatus]   = useState("Ready — scroll to zoom, drag to pan, Shift+click for Julia");
  const [progress, setProgress] = useState(0);
  const [busy,     setBusy]     = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorOpen,  setEditorOpen]  = useState(false);

  const canvasRef = useRef<CanvasHandle>(null);

  // ── History helpers ─────────────────────────────────────────────────────────
  const commit = useCallback((next: Settings) => {
    setPast(p => [...p.slice(-49), settings]);
    setFuture([]);
    setSettings(next);
  }, [settings]);

  const undo = useCallback(() => {
    if (!past.length) return;
    setFuture(f => [settings, ...f]);
    setSettings(past[past.length - 1]);
    setPast(p => p.slice(0, -1));
  }, [settings, past]);

  const redo = useCallback(() => {
    if (!future.length) return;
    setPast(p => [...p, settings]);
    setSettings(future[0]);
    setFuture(f => f.slice(1));
  }, [settings, future]);

  // ── Callbacks for canvas ────────────────────────────────────────────────────
  const onViewChange = useCallback((v: FractalView) => {
    commit({ ...settings, view: v });
  }, [commit, settings]);                            // stable enough: commit already captures settings

  const onShiftClick = useCallback((cx: number, cy: number) => {
    commit({ ...settings, fractalType: "Julia", cx, cy, view: DEFAULT_SETTINGS.view });
  }, [commit, settings]);

  // ── Palette ─────────────────────────────────────────────────────────────────
  const gradientCSS = useMemo(() => paletteGradientCSS(settings.palette), [settings.palette]);

  const curPaletteName = useMemo(() =>
    Object.keys(STANDARD_PALETTES).find(
      k => JSON.stringify(STANDARD_PALETTES[k]) === JSON.stringify(settings.palette)
    ) ?? "Custom",
  [settings.palette]);

  const randomPalette = useCallback(() => {
    const c0: [number,number,number] = [Math.random(), Math.random(), Math.random()];
    const stops = [
      { pos: 0, color: c0 },
      ...Array.from({ length: 4 }, (_, i) => ({
        pos: (i + 1) / 5,
        color: [Math.random(), Math.random(), Math.random()] as [number,number,number],
      })),
      { pos: 1, color: c0 },
    ];
    commit({ ...settings, palette: { colorType: "RGB", stops } });
  }, [commit, settings]);

  // ── Save PNG ────────────────────────────────────────────────────────────────
  const saveImage = () => {
    const c = canvasRef.current?.getCanvas();
    if (!c) return;
    const a = document.createElement("a");
    a.download = `${settings.fractalType.toLowerCase()}-fractal.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  };

  // ── Preset ──────────────────────────────────────────────────────────────────
  const applyPreset = (name: string) => {
    const p = PRESETS.find(p => p.name === name);
    if (!p) return;
    commit({ ...settings, ...p.settings } as Settings);
  };

  // ── Sidebar sections ─────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: "calc(100dvh - 5rem)" }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-black/30 backdrop-blur-sm">
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="p-1.5 rounded-lg border border-white/8 text-foreground/40 hover:text-foreground/70 hover:border-white/15 transition-all"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>

        <span className="font-serif font-bold text-sm bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
          Fractal Explorer
        </span>

        <div className="flex-1" />

        <Btn onClick={undo}     disabled={!past.length}   title="Undo"><Undo2 size={13} /></Btn>
        <Btn onClick={redo}     disabled={!future.length}  title="Redo"><Redo2 size={13}/></Btn>
        <Btn onClick={saveImage} disabled={busy} title="Download PNG"><Download size={13}/> Save</Btn>
      </div>

      {/* ── Main layout ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside
          className={`flex-shrink-0 bg-[#08080f]/95 border-r border-white/6 overflow-y-auto transition-all duration-300 ${sidebarOpen ? "w-[220px]" : "w-0 overflow-hidden"}`}
          style={{ scrollbarWidth: "thin" }}
        >
          <div className="w-[220px] p-3 space-y-5">

            {/* Fractal type */}
            <div className="space-y-2">
              <div className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest">Fractal</div>
              <div className="grid grid-cols-2 gap-1.5">
                <Btn active={settings.fractalType === "Mandelbrot"}
                  onClick={() => commit({ ...settings, fractalType: "Mandelbrot", view: DEFAULT_SETTINGS.view })}>
                  <InfinityIcon size={11}/> Mandelbrot
                </Btn>
                <Btn active={settings.fractalType === "Julia"}
                  onClick={() => commit({ ...settings, fractalType: "Julia" })}>
                  <Repeat2 size={11}/> Julia
                </Btn>
              </div>

              {settings.fractalType === "Julia" && (
                <div className="space-y-2 mt-1">
                  <Field label="C real">
                    <Inp value={settings.cx.toPrecision(6)} step="0.005"
                      onChange={v => commit({ ...settings, cx: parseFloat(v) || 0 })} />
                  </Field>
                  <Field label="C imaginary">
                    <Inp value={settings.cy.toPrecision(6)} step="0.005"
                      onChange={v => commit({ ...settings, cy: parseFloat(v) || 0 })} />
                  </Field>
                  <p className="text-[9px] text-foreground/20 leading-relaxed">
                    Shift+click in Mandelbrot mode to jump here
                  </p>
                </div>
              )}
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <div className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin size={9}/> Presets
              </div>
              <Field label="Famous Locations">
                <Sel value="" onChange={applyPreset}>
                  <option value="" disabled>Choose preset…</option>
                  {PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </Sel>
              </Field>
            </div>

            {/* Rendering */}
            <div className="space-y-2">
              <div className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest">Render</div>
              <Field label="Max Iterations">
                <Inp value={settings.maxIter} min="10" step="64"
                  onChange={v => commit({ ...settings, maxIter: Math.max(10, parseInt(v) || 256) })} />
              </Field>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={settings.interlaced} className="accent-cyan-400"
                  onChange={e => commit({ ...settings, interlaced: e.target.checked })} />
                <span className="text-xs text-foreground/45">Interlaced preview</span>
              </label>
            </div>

            {/* Palette */}
            <div className="space-y-2">
              <div className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest">Palette</div>

              {/* Gradient preview */}
              <div className="h-5 rounded-md shadow-inner border border-white/10"
                style={{ background: `linear-gradient(to right, ${gradientCSS})` }} />

              <Field label="Preset Palette">
                <Sel value={curPaletteName}
                  onChange={v => { if (STANDARD_PALETTES[v]) commit({ ...settings, palette: STANDARD_PALETTES[v] }); }}>
                  {Object.keys(STANDARD_PALETTES).map(k => <option key={k} value={k}>{k}</option>)}
                  {curPaletteName === "Custom" && <option value="Custom">Custom</option>}
                </Sel>
              </Field>

              <Field label="Colour Count">
                <Inp value={settings.paletteLen} min="8" max="1024" step="32"
                  onChange={v => commit({ ...settings, paletteLen: Math.max(8, parseInt(v) || 256) })} />
              </Field>

              <Field label="Offset">
                <input type="range" min={0} max={100}
                  value={Math.round(settings.paletteOffset * 100)}
                  onChange={e => setSettings(s => ({ ...s, paletteOffset: parseInt(e.target.value) / 100 }))}
                  className="w-full accent-cyan-400 cursor-pointer" />
              </Field>

              <div className="grid grid-cols-2 gap-1.5">
                <Btn onClick={randomPalette}><Shuffle size={11}/> Random</Btn>
                <Btn onClick={() => setEditorOpen(true)}><Settings2 size={11}/> Edit</Btn>
              </div>
            </div>

            {/* Help */}
            <div className="space-y-1 text-[9px] text-foreground/20 leading-relaxed border-t border-white/6 pt-3">
              <p><span className="text-foreground/35">Scroll</span> — zoom in/out</p>
              <p><span className="text-foreground/35">Drag</span> — pan</p>
              <p><span className="text-foreground/35">Shift+click</span> — open Julia set</p>
              <p><span className="text-foreground/35">Undo/Redo</span> — navigate history</p>
            </div>

          </div>
        </aside>

        {/* ── Canvas area ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Canvas fills remaining space */}
          <div className="flex-1 min-h-0">
            <FractalCanvas
              ref={canvasRef}
              settings={settings}
              onViewChange={onViewChange}
              onShiftClick={onShiftClick}
              onStatus={setStatus}
              onProgress={setProgress}
              onBusy={setBusy}
            />
          </div>

          {/* Status bar — FIXED height so it never causes ResizeObserver to fire */}
          <div
            className="flex-shrink-0 flex items-center justify-between gap-3 px-4 border-t border-white/6 bg-black/30 text-[10px]"
            style={{ height: "2rem" }}
          >
            <span className="text-foreground/30 font-mono truncate">{status}</span>
            <div className="flex items-center gap-2 shrink-0">
              {/* Always render progress bar — just empty when idle */}
              <div className="w-24 h-1 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{
                    width: busy ? `${Math.round(progress * 100)}%` : "0%",
                    transition: progress > 0.02 ? "width 0.1s" : "none",
                  }}
                />
              </div>
              {/* Always render Stop — invisible when idle so layout is stable */}
              <button
                onClick={() => { setBusy(false); setProgress(0); setStatus("Cancelled."); }}
                disabled={!busy}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] transition-all ${
                  busy
                    ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    : "opacity-0 pointer-events-none border-transparent text-transparent"
                }`}
              >
                <Square size={9}/> Stop
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Palette editor modal */}
      {editorOpen && (
        <PaletteEditor
          palette={settings.palette}
          onSave={p => { commit({ ...settings, palette: p }); setEditorOpen(false); }}
          onCancel={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
