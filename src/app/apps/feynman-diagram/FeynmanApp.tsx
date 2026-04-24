"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Download, Trash2, Copy } from "lucide-react";
import { Palette } from "./components/Palette";
import { DiagramCanvas } from "./components/DiagramCanvas";
import { ExportModal } from "./components/ExportModal";
import { generateLatex } from "./lib/latex";
import { GRID_SPACING, DEFAULT_ELLIPSE_RADIUS, DEFAULT_RECT_WIDTH, DEFAULT_RECT_HEIGHT } from "./lib/constants";
import type { DiagramState, Selection, DragPayload } from "./lib/types";

const INITIAL_STATE: DiagramState = { vertices: [], particles: [], textLabels: [], ellipses: [], rectangles: [] };

export function FeynmanApp() {
  const [state, setState] = useState<DiagramState>(INITIAL_STATE);
  const [selection, setSelection] = useState<Selection>({
    vertices: new Set(), particles: new Set(), textLabels: new Set(), ellipses: new Set(), rectangles: new Set()
  });
  const [showExport, setShowExport] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const activeSelection = 
    selection.vertices.size > 0 || 
    selection.particles.size > 0 || 
    selection.textLabels.size > 0 || 
    selection.ellipses.size > 0 || 
    selection.rectangles.size > 0;

  // ── Drop Handler ────────────────────────────────────────────────────────
  const handleDrop = useCallback((item: DragPayload, pos: { x: number; y: number }) => {
    setState(prev => {
      const id = Date.now();
      if (item.type === "vertex") {
        return { ...prev, vertices: [...prev.vertices, { id, x: pos.x, y: pos.y }] };
      }
      if (item.type === "text") {
        return { ...prev, textLabels: [...prev.textLabels, { id, x: pos.x, y: pos.y, text: "Label" }] };
      }
      if (item.type === "ellipse") {
        return { ...prev, ellipses: [...prev.ellipses, { id, x: pos.x, y: pos.y, rx: DEFAULT_ELLIPSE_RADIUS, ry: DEFAULT_ELLIPSE_RADIUS }] };
      }
      if (item.type === "rectangle") {
        return { ...prev, rectangles: [...prev.rectangles, { id, x: pos.x, y: pos.y, width: DEFAULT_RECT_WIDTH, height: DEFAULT_RECT_HEIGHT }] };
      }
      
      // Particles
      const half = 1.5 * GRID_SPACING;
      return {
        ...prev,
        particles: [...prev.particles, {
          id, type: item.type as any,
          startX: pos.x - half, startY: pos.y,
          endX: pos.x + half, endY: pos.y,
          startVertex: null, endVertex: null,
          bend: 0
        }]
      };
    });
  }, []);

  // ── Delete Handler ──────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    setState(prev => {
      // 1. Remove selected components
      const vertices = prev.vertices.filter(v => !selection.vertices.has(v.id));
      const textLabels = prev.textLabels.filter(l => !selection.textLabels.has(l.id));
      const ellipses = prev.ellipses.filter(e => !selection.ellipses.has(e.id));
      const rectangles = prev.rectangles.filter(r => !selection.rectangles.has(r.id));
      
      const unselectedParticles = prev.particles.filter(p => !selection.particles.has(p.id));
      
      // 2. Detach unselected particles from deleted vertices
      const particles = unselectedParticles.map(p => {
        const np = { ...p };
        if (p.startVertex && selection.vertices.has(p.startVertex)) np.startVertex = null;
        if (p.endVertex && selection.vertices.has(p.endVertex)) np.endVertex = null;
        return np;
      });

      return { vertices, particles, textLabels, ellipses, rectangles };
    });
    
    // Clear selection
    setSelection({ vertices: new Set(), particles: new Set(), textLabels: new Set(), ellipses: new Set(), rectangles: new Set() });
  }, [selection]);

  // ── Duplicate Handler ───────────────────────────────────────────────────
  const handleDuplicate = useCallback(() => {
    if (!activeSelection) return;

    const offset = GRID_SPACING;
    const now = Date.now();
    let counter = 0;
    
    const ns: Selection = { vertices: new Set(), particles: new Set(), textLabels: new Set(), ellipses: new Set(), rectangles: new Set() };
    const vidMap = new Map<number, number>();

    setState(prev => {
      const vertices = prev.vertices.filter(v => selection.vertices.has(v.id)).map(v => {
        const id = now + (++counter);
        vidMap.set(v.id, id);
        ns.vertices.add(id);
        return { ...v, id, x: v.x + offset, y: v.y + offset };
      });

      const particles = prev.particles.filter(p => selection.particles.has(p.id)).map(p => {
        const id = now + (++counter);
        ns.particles.add(id);
        return {
          ...p, id,
          startX: p.startX + offset, startY: p.startY + offset,
          endX: p.endX + offset, endY: p.endY + offset,
          startVertex: p.startVertex && vidMap.has(p.startVertex) ? vidMap.get(p.startVertex)! : null,
          endVertex: p.endVertex && vidMap.has(p.endVertex) ? vidMap.get(p.endVertex)! : null,
        };
      });

      const textLabels = prev.textLabels.filter(t => selection.textLabels.has(t.id)).map(t => {
        const id = now + (++counter);
        ns.textLabels.add(id);
        return { ...t, id, x: t.x + offset, y: t.y + offset };
      });

      const ellipses = prev.ellipses.filter(e => selection.ellipses.has(e.id)).map(e => {
        const id = now + (++counter);
        ns.ellipses.add(id);
        return { ...e, id, x: e.x + offset, y: e.y + offset };
      });

      const rectangles = prev.rectangles.filter(r => selection.rectangles.has(r.id)).map(r => {
        const id = now + (++counter);
        ns.rectangles.add(id);
        return { ...r, id, x: r.x + offset, y: r.y + offset };
      });

      return {
        vertices: [...prev.vertices, ...vertices],
        particles: [...prev.particles, ...particles],
        textLabels: [...prev.textLabels, ...textLabels],
        ellipses: [...prev.ellipses, ...ellipses],
        rectangles: [...prev.rectangles, ...rectangles],
      };
    });

    setSelection(ns);
  }, [activeSelection, selection]);

  // ── Reverse Particle Handler ──────────────────────────────────────────── (New feature!)
  const handleReverse = useCallback(() => {
    setState(prev => ({
      ...prev,
      particles: prev.particles.map(p => {
        if (selection.particles.has(p.id)) {
          return { ...p, reversed: !p.reversed };
        }
        return p;
      })
    }));
  }, [selection]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeType = document.activeElement?.tagName.toLowerCase();
      if (activeType === "input" || activeType === "textarea") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault(); handleDelete();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault(); handleDuplicate();
      }
      if (e.key === "r" && selection.particles.size > 0) {
        // Pressing "R" reverses fermion arrows
        e.preventDefault(); handleReverse();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDelete, handleDuplicate, handleReverse, selection.particles.size]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] mt-20 pt-2 px-4 pb-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-serif font-bold gradient-text-quantum tracking-wider">
            Feynman Diagram Visualizer
          </h1>
          <p className="text-xs text-foreground/50 tracking-wider font-mono">
            Draw, compose, and export vector diagrams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selection.particles.size > 0 && (
             <button
              onClick={handleReverse}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all text-white/80"
             >
               Flip Arrow ('R')
             </button>
          )}
          <button
            onClick={handleDuplicate}
            disabled={!activeSelection}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
          >
            <Copy size={13} />
            Duplicate
          </button>
          <button
            onClick={handleDelete}
            disabled={!activeSelection}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40"
          >
            <Trash2 size={13} />
            Delete
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-semibold rounded-lg bg-[#22d3ee] text-black hover:bg-[#1bb8d0] transition-colors ml-2"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 border border-white/6 rounded-xl overflow-hidden glass shadow-2xl relative">
        <Palette />
        <div className="flex-1 relative w-full h-full p-2 lg:p-4 overflow-hidden bg-black/20">
          <DiagramCanvas 
            state={state} 
            selection={selection} 
            onStateChange={setState} 
            onSelectionChange={setSelection} 
            onDrop={handleDrop}
            svgRef={svgRef}
          />
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <ExportModal 
          latex={generateLatex(state)} 
          onClose={() => setShowExport(false)} 
          svgElementId="feynman-svg"
        />
      )}
    </div>
  );
}
