"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Download,
  Trash2,
  Copy,
  RotateCw,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Grid,
  Magnet,
  ChevronDown,
} from "lucide-react";
import { Palette } from "./components/Palette";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { ExportModal } from "./components/ExportModal";
import { PropertyInspector } from "./components/PropertyInspector";
import { generateLatex } from "./lib/latex";
import { PRESETS } from "./lib/presets";
import {
  GRID_SPACING,
  DEFAULT_ELLIPSE_RADIUS,
  DEFAULT_RECT_WIDTH,
  DEFAULT_RECT_HEIGHT,
} from "./lib/constants";
import type {
  DiagramState,
  Selection,
  DragPayload,
  PaletteItem,
  Particle,
} from "./lib/types";

const EMPTY_SELECTION: Selection = {
  vertices: new Set(),
  particles: new Set(),
  textLabels: new Set(),
  ellipses: new Set(),
  rectangles: new Set(),
};

// Initial state starts with the textbook electron-positron annihilation diagram
const DEFAULT_PRESET = PRESETS[0];

export function FeynmanApp() {
  const [state, setState] = useState<DiagramState>(DEFAULT_PRESET.state);
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [showExport, setShowExport] = useState(false);
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<"canvas" | "palette" | "presets">("canvas");
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFAULT_PRESET.id);

  // Undo / Redo history
  const [history, setHistory] = useState<DiagramState[]>([DEFAULT_PRESET.state]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const svgRef = useRef<SVGSVGElement>(null);

  // Helper to commit new state with undo history
  const commitState = useCallback((newState: DiagramState) => {
    setState(newState);
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      const nextHistory = [...upToCurrent, newState];
      if (nextHistory.length > 30) nextHistory.shift();
      return nextHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 29));
  }, [historyIndex]);

  // Direct state updates from dragging (without filling history on every pixel)
  const handleLiveStateChange = useCallback((newState: DiagramState) => {
    setState(newState);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setState(history[nextIndex]);
      setSelection(EMPTY_SELECTION);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setState(history[nextIndex]);
      setSelection(EMPTY_SELECTION);
    }
  }, [history, historyIndex]);

  const activeSelection =
    selection.vertices.size > 0 ||
    selection.particles.size > 0 ||
    selection.textLabels.size > 0 ||
    selection.ellipses.size > 0 ||
    selection.rectangles.size > 0;

  // Add Item to Canvas (both for Drop and 1-Tap Click-to-Add)
  const handleAddItem = useCallback(
    (item: DragPayload | PaletteItem, customPos?: { x: number; y: number }) => {
      // Default position is center of diagram (540, 360) with small random offset
      const pos = customPos || {
        x: Math.round((520 + Math.random() * 80) / GRID_SPACING) * GRID_SPACING,
        y: Math.round((320 + Math.random() * 80) / GRID_SPACING) * GRID_SPACING,
      };

      const now = Date.now();
      let updated: DiagramState;

      if (item.type === "vertex") {
        updated = {
          ...state,
          vertices: [...state.vertices, { id: now, x: pos.x, y: pos.y }],
        };
      } else if (item.type === "text") {
        updated = {
          ...state,
          textLabels: [
            ...state.textLabels,
            { id: now, x: pos.x, y: pos.y, text: "Label" },
          ],
        };
      } else if (item.type === "ellipse") {
        updated = {
          ...state,
          ellipses: [
            ...state.ellipses,
            {
              id: now,
              x: pos.x,
              y: pos.y,
              rx: DEFAULT_ELLIPSE_RADIUS,
              ry: DEFAULT_ELLIPSE_RADIUS,
            },
          ],
        };
      } else if (item.type === "rectangle") {
        updated = {
          ...state,
          rectangles: [
            ...state.rectangles,
            {
              id: now,
              x: pos.x,
              y: pos.y,
              width: DEFAULT_RECT_WIDTH,
              height: DEFAULT_RECT_HEIGHT,
            },
          ],
        };
      } else {
        // Particle line
        const half = 2 * GRID_SPACING;
        updated = {
          ...state,
          particles: [
            ...state.particles,
            {
              id: now,
              type: item.type,
              startX: pos.x - half,
              startY: pos.y,
              endX: pos.x + half,
              endY: pos.y,
              startVertex: null,
              endVertex: null,
              bend: 0,
            },
          ],
        };
      }

      commitState(updated);
      setMobileTab("canvas");
    },
    [state, commitState]
  );

  // Delete Selection
  const handleDelete = useCallback(() => {
    const vertices = state.vertices.filter((v) => !selection.vertices.has(v.id));
    const textLabels = state.textLabels.filter((l) => !selection.textLabels.has(l.id));
    const ellipses = state.ellipses.filter((e) => !selection.ellipses.has(e.id));
    const rectangles = state.rectangles.filter((r) => !selection.rectangles.has(r.id));
    const unselectedParticles = state.particles.filter(
      (p) => !selection.particles.has(p.id)
    );

    // Detach unselected particles from deleted vertices
    const particles = unselectedParticles.map((p) => {
      const np = { ...p };
      if (p.startVertex && selection.vertices.has(p.startVertex)) np.startVertex = null;
      if (p.endVertex && selection.vertices.has(p.endVertex)) np.endVertex = null;
      return np;
    });

    const updated = { vertices, particles, textLabels, ellipses, rectangles };
    commitState(updated);
    setSelection(EMPTY_SELECTION);
  }, [state, selection, commitState]);

  // Duplicate Selection
  const handleDuplicate = useCallback(() => {
    if (!activeSelection) return;

    const offset = GRID_SPACING * 2;
    const now = Date.now();
    let counter = 0;

    const ns: Selection = {
      vertices: new Set(),
      particles: new Set(),
      textLabels: new Set(),
      ellipses: new Set(),
      rectangles: new Set(),
    };
    const vidMap = new Map<number, number>();

    const vertices = state.vertices
      .filter((v) => selection.vertices.has(v.id))
      .map((v) => {
        const id = now + ++counter;
        vidMap.set(v.id, id);
        ns.vertices.add(id);
        return { ...v, id, x: v.x + offset, y: v.y + offset };
      });

    const particles = state.particles
      .filter((p) => selection.particles.has(p.id))
      .map((p) => {
        const id = now + ++counter;
        ns.particles.add(id);
        return {
          ...p,
          id,
          startX: p.startX + offset,
          startY: p.startY + offset,
          endX: p.endX + offset,
          endY: p.endY + offset,
          startVertex:
            p.startVertex && vidMap.has(p.startVertex)
              ? vidMap.get(p.startVertex)!
              : null,
          endVertex:
            p.endVertex && vidMap.has(p.endVertex)
              ? vidMap.get(p.endVertex)!
              : null,
        };
      });

    const textLabels = state.textLabels
      .filter((t) => selection.textLabels.has(t.id))
      .map((t) => {
        const id = now + ++counter;
        ns.textLabels.add(id);
        return { ...t, id, x: t.x + offset, y: t.y + offset };
      });

    const ellipses = state.ellipses
      .filter((e) => selection.ellipses.has(e.id))
      .map((e) => {
        const id = now + ++counter;
        ns.ellipses.add(id);
        return { ...e, id, x: e.x + offset, y: e.y + offset };
      });

    const rectangles = state.rectangles
      .filter((r) => selection.rectangles.has(r.id))
      .map((r) => {
        const id = now + ++counter;
        ns.rectangles.add(id);
        return { ...r, id, x: r.x + offset, y: r.y + offset };
      });

    const updated = {
      vertices: [...state.vertices, ...vertices],
      particles: [...state.particles, ...particles],
      textLabels: [...state.textLabels, ...textLabels],
      ellipses: [...state.ellipses, ...ellipses],
      rectangles: [...state.rectangles, ...rectangles],
    };

    commitState(updated);
    setSelection(ns);
  }, [activeSelection, selection, state, commitState]);

  // Flip arrow on selected particles
  const handleReverse = useCallback(() => {
    const updated = {
      ...state,
      particles: state.particles.map((p) => {
        if (selection.particles.has(p.id)) {
          return { ...p, reversed: !p.reversed };
        }
        return p;
      }),
    };
    commitState(updated);
  }, [state, selection, commitState]);

  // Clear Canvas
  const handleClearAll = useCallback(() => {
    if (confirm("Clear all elements on the canvas?")) {
      const empty: DiagramState = {
        vertices: [],
        particles: [],
        textLabels: [],
        ellipses: [],
        rectangles: [],
      };
      commitState(empty);
      setSelection(EMPTY_SELECTION);
    }
  }, [commitState]);

  // Load a physics preset
  const handleLoadPreset = useCallback(
    (presetId: string) => {
      const preset = PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      setSelectedPresetId(presetId);
      commitState(preset.state);
      setSelection(EMPTY_SELECTION);
      setMobileTab("canvas");
    },
    [commitState]
  );

  // Property Inspector updates
  const handleUpdateParticle = useCallback(
    (id: number, patch: Partial<Particle>) => {
      const updated = {
        ...state,
        particles: state.particles.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      };
      commitState(updated);
    },
    [state, commitState]
  );

  const handleUpdateTextLabel = useCallback(
    (id: number, text: string) => {
      const updated = {
        ...state,
        textLabels: state.textLabels.map((t) => (t.id === id ? { ...t, text } : t)),
      };
      commitState(updated);
    },
    [state, commitState]
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeType = document.activeElement?.tagName.toLowerCase();
      if (activeType === "input" || activeType === "textarea" || activeType === "select") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDelete();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        handleDuplicate();
      }
      if (e.key === "r" && selection.particles.size > 0) {
        e.preventDefault();
        handleReverse();
      }
      if (e.key === "Escape") {
        setSelection(EMPTY_SELECTION);
        setShowExport(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDelete, handleDuplicate, handleReverse, handleUndo, handleRedo, selection.particles.size]);

  return (
    <div className="min-h-screen keffiyeh-bg flex flex-col justify-between">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/4 blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-olive/5 blur-[120px]" />
      </div>

      <div className="section-container pt-1 pb-4 flex-1 flex flex-col min-h-0">
        {/* Header & Feature Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/apps"
                className="inline-flex items-center gap-1 text-xs font-mono text-quantum/70 hover:text-quantum transition-colors group mr-2"
              >
                <span className="transition-transform group-hover:-translate-x-1">←</span>
                <span>Apps</span>
              </Link>
              <span className="text-white/20">/</span>
              <span className="text-[11px] font-mono text-quantum/60 uppercase tracking-widest">
                QFT & Particle Physics
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              <span className="gradient-text-quantum">Feynman Diagram</span>{" "}
              <span className="text-foreground/75">Studio</span>
            </h1>
          </div>

          {/* Feature Pills */}
          <div className="hidden md:flex flex-wrap items-center gap-1.5">
            {[
              "Standard Model Presets",
              "TikZ-Feynman LaTeX",
              "Vector SVG & 2× PNG",
              "Interactive Curves",
            ].map((pill) => (
              <span
                key={pill}
                className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-quantum/20 bg-quantum/5 text-quantum/70 shadow-sm"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* ── Toolbar ────────────────────────────────────────────────────────── */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 bg-black/40 border border-white/8 rounded-xl p-2.5 backdrop-blur-xl">
          {/* Left: Presets & History */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Presets dropdown */}
            <div className="relative">
              <select
                value={selectedPresetId}
                onChange={(e) => handleLoadPreset(e.target.value)}
                className="appearance-none bg-quantum/10 border border-quantum/30 rounded-lg px-3 py-1.5 pr-8 text-xs font-mono text-quantum font-medium cursor-pointer hover:bg-quantum/20 transition-all focus:outline-none"
              >
                <optgroup label="⚡ Standard Model Presets">
                  {PRESETS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#0d0d1a] text-foreground">
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-quantum pointer-events-none"
              />
            </div>

            {/* Undo / Redo */}
            <div className="flex items-center border border-white/8 rounded-lg overflow-hidden bg-white/[0.02]">
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 hover:bg-white/10 text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
              >
                <Undo2 size={15} />
              </button>
              <div className="w-[1px] h-4 bg-white/10" />
              <button
                type="button"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 hover:bg-white/10 text-foreground/70 hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Y)"
                aria-label="Redo"
              >
                <Redo2 size={15} />
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center border border-white/8 rounded-lg overflow-hidden bg-white/[0.02] text-xs font-mono">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, Math.round((z - 0.1) * 10) / 10))}
                className="p-1.5 hover:bg-white/10 text-foreground/70 hover:text-foreground transition-colors"
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="px-2 py-1 hover:bg-white/10 text-foreground/70 hover:text-foreground transition-colors"
                title="Reset Zoom (100%)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.8, Math.round((z + 0.1) * 10) / 10))}
                className="p-1.5 hover:bg-white/10 text-foreground/70 hover:text-foreground transition-colors"
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Grid & Snap toggles */}
            <div className="hidden sm:flex items-center gap-1 border border-white/8 rounded-lg p-0.5 bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setShowGrid((g) => !g)}
                className={`p-1.5 rounded transition-all ${
                  showGrid ? "bg-quantum/15 text-quantum" : "text-foreground/40 hover:text-foreground/70"
                }`}
                title={showGrid ? "Hide Grid" : "Show Grid"}
                aria-label="Toggle grid"
              >
                <Grid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setSnapToGrid((s) => !s)}
                className={`p-1.5 rounded transition-all ${
                  snapToGrid ? "bg-quantum/15 text-quantum" : "text-foreground/40 hover:text-foreground/70"
                }`}
                title={snapToGrid ? "Disable Snap-to-Grid" : "Enable Snap-to-Grid"}
                aria-label="Toggle snap to grid"
              >
                <Magnet size={14} />
              </button>
            </div>
          </div>

          {/* Right: Actions & Export */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Mobile Tab Toggle Buttons */}
            <div className="flex sm:hidden border border-white/10 rounded-lg overflow-hidden text-[11px] font-mono mr-1">
              <button
                type="button"
                onClick={() => setMobileTab("canvas")}
                className={`px-2 py-1 ${mobileTab === "canvas" ? "bg-quantum text-black font-semibold" : "text-foreground/60"}`}
              >
                Canvas
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("palette")}
                className={`px-2 py-1 ${mobileTab === "palette" ? "bg-quantum text-black font-semibold" : "text-foreground/60"}`}
              >
                Tools
              </button>
            </div>

            {selection.particles.size > 0 && (
              <button
                type="button"
                onClick={handleReverse}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-white/10 hover:border-quantum/40 hover:bg-quantum/5 transition-all text-white/80"
                title="Flip arrow direction (R)"
              >
                <RotateCw size={13} />
                <span className="hidden sm:inline">Flip Arrow (&apos;R&apos;)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDuplicate}
              disabled={!activeSelection}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
              title="Duplicate (Ctrl+D)"
            >
              <Copy size={13} />
              <span className="hidden sm:inline">Duplicate</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!activeSelection}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40"
              title="Delete (Del)"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Delete</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded-lg transition-all bg-white/5 border border-white/10 hover:border-red-500/30 hover:text-red-400 text-foreground/60"
              title="Clear Canvas"
            >
              Clear
            </button>

            <button
              id="feynman-export-btn"
              type="button"
              onClick={() => setShowExport(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold rounded-lg bg-[#22d3ee] text-black hover:bg-[#1bb8d0] transition-colors shadow-lg shadow-cyan-500/15 ml-1"
            >
              <Download size={13} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* ── Main Workspace ─────────────────────────────────────────────────── */}
        <div className="w-full flex flex-col h-[calc(100vh-215px)] min-h-[480px] max-h-[860px] border border-white/10 rounded-2xl overflow-hidden glass shadow-2xl relative">
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
            {/* Palette: visible on desktop, or when mobileTab === 'palette' on mobile */}
            <Palette
              onAddItem={handleAddItem}
              className={`w-64 flex-shrink-0 transition-all ${
                mobileTab === "palette" ? "block w-full sm:w-64 absolute inset-0 z-20 sm:relative sm:z-auto" : "hidden sm:flex"
              }`}
            />

            {/* Canvas */}
            <div className="flex-1 min-h-0 relative w-full h-full p-2 sm:p-2.5 overflow-hidden bg-[#070710]/60 flex flex-col">
              <DiagramCanvas
                state={state}
                selection={selection}
                onStateChange={handleLiveStateChange}
                onCommitState={commitState}
                onSelectionChange={setSelection}
                onDrop={(payload, pos) => handleAddItem(payload, pos)}
                svgRef={svgRef}
                zoom={zoom}
                showGrid={showGrid}
                snapToGrid={snapToGrid}
              />
            </div>
          </div>

          {/* Bottom Property Inspector Bar */}
          <PropertyInspector
            state={state}
            selection={selection}
            onUpdateParticle={handleUpdateParticle}
            onUpdateTextLabel={handleUpdateTextLabel}
            onDeleteSelection={handleDelete}
            onFlipSelection={handleReverse}
            className="flex-shrink-0"
          />
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          latex={generateLatex(state)}
          state={state}
          onClose={() => setShowExport(false)}
          svgElementId="feynman-svg"
        />
      )}
    </div>
  );
}
