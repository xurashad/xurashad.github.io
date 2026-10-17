"use client";

import { Trash2, RotateCw } from "lucide-react";
import { ParticleType, type DiagramState, type Selection, type Particle } from "../lib/types";
import { QUICK_SYMBOLS, PARTICLE_COLOR } from "../lib/constants";

interface Props {
  state: DiagramState;
  selection: Selection;
  onUpdateParticle: (id: number, patch: Partial<Particle>) => void;
  onUpdateTextLabel: (id: number, text: string) => void;
  onDeleteSelection: () => void;
  onFlipSelection: () => void;
  className?: string;
}

export function PropertyInspector({
  state,
  selection,
  onUpdateParticle,
  onUpdateTextLabel,
  onDeleteSelection,
  onFlipSelection,
  className = "",
}: Props) {
  const selectedParticleId = selection.particles.size === 1 ? Array.from(selection.particles)[0] : null;
  const selectedParticle = selectedParticleId ? state.particles.find((p) => p.id === selectedParticleId) : null;

  const selectedTextId = selection.textLabels.size === 1 ? Array.from(selection.textLabels)[0] : null;
  const selectedText = selectedTextId ? state.textLabels.find((t) => t.id === selectedTextId) : null;

  const selectedVertexId = selection.vertices.size === 1 ? Array.from(selection.vertices)[0] : null;
  const selectedVertex = selectedVertexId ? state.vertices.find((v) => v.id === selectedVertexId) : null;

  const selectedEllipseId = selection.ellipses.size === 1 ? Array.from(selection.ellipses)[0] : null;
  const selectedEllipse = selectedEllipseId ? state.ellipses.find((e) => e.id === selectedEllipseId) : null;

  const selectedRectId = selection.rectangles.size === 1 ? Array.from(selection.rectangles)[0] : null;
  const selectedRectangle = selectedRectId ? state.rectangles.find((r) => r.id === selectedRectId) : null;

  const totalSelected =
    selection.vertices.size +
    selection.particles.size +
    selection.textLabels.size +
    selection.ellipses.size +
    selection.rectangles.size;

  if (totalSelected === 0) {
    return (
      <div className={`p-3 bg-black/40 border-t sm:border-t-0 sm:border-l border-white/6 text-xs text-foreground/50 flex items-center justify-between gap-4 font-mono ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-quantum/70">Canvas:</span>
          <span>{state.vertices.length} Vertices</span>
          <span>•</span>
          <span>{state.particles.length} Particles</span>
          <span>•</span>
          <span>{state.textLabels.length} Labels</span>
        </div>
        <span className="text-[11px] text-foreground/40 hidden md:inline">
          Click an element to inspect & edit
        </span>
      </div>
    );
  }

  return (
    <div className={`p-3 bg-black/60 border-t sm:border-t-0 sm:border-l border-white/8 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs select-none ${className}`}>
      {/* ── Single Particle Selected ── */}
      {selectedParticle && (
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 font-mono font-semibold text-quantum">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: PARTICLE_COLOR[selectedParticle.type] }}
            />
            <span>Propagator</span>
          </div>

          {/* Type Selector */}
          <div className="flex items-center gap-1.5">
            <label className="text-foreground/50 font-mono text-[11px]">Type:</label>
            <select
              value={selectedParticle.type}
              onChange={(e) =>
                onUpdateParticle(selectedParticle.id, {
                  type: e.target.value as ParticleType,
                })
              }
              className="bg-black/60 border border-white/10 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-quantum font-mono"
            >
              <option value={ParticleType.Fermion}>Fermion (Matter)</option>
              <option value={ParticleType.Photon}>Photon (γ)</option>
              <option value={ParticleType.Gluon}>Gluon (g)</option>
              <option value={ParticleType.WBoson}>W Boson (W±)</option>
              <option value={ParticleType.ZBoson}>Z Boson (Z⁰)</option>
              <option value={ParticleType.Higgs}>Higgs (H⁰)</option>
              <option value={ParticleType.Ghost}>Ghost (c)</option>
              <option value={ParticleType.Scalar}>Scalar (φ)</option>
            </select>
          </div>

          {/* Label Input */}
          <div className="flex items-center gap-1.5">
            <label className="text-foreground/50 font-mono text-[11px]">Label:</label>
            <input
              type="text"
              value={selectedParticle.label || ""}
              onChange={(e) =>
                onUpdateParticle(selectedParticle.id, { label: e.target.value })
              }
              placeholder="e.g. e⁻, γ"
              className="w-20 bg-black/60 border border-white/10 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-quantum font-mono"
            />
          </div>

          {/* Quick Symbol Chips */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto max-w-xs py-0.5">
            {QUICK_SYMBOLS.slice(0, 10).map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() =>
                  onUpdateParticle(selectedParticle.id, { label: sym })
                }
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-quantum/20 border border-white/5 hover:border-quantum/40 font-mono text-[10px] text-foreground/80 hover:text-quantum transition-colors"
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Curvature / Bend Slider */}
          <div className="flex items-center gap-1.5">
            <label className="text-foreground/50 font-mono text-[11px]">Bend:</label>
            <input
              type="range"
              min="-80"
              max="80"
              step="5"
              value={selectedParticle.bend}
              onChange={(e) =>
                onUpdateParticle(selectedParticle.id, {
                  bend: parseInt(e.target.value, 10),
                })
              }
              className="w-20 accent-quantum"
            />
            <span className="font-mono text-[10px] text-foreground/50 w-7">
              {selectedParticle.bend}
            </span>
          </div>

          {/* Flip Arrow */}
          {selectedParticle.type === ParticleType.Fermion && (
            <button
              type="button"
              onClick={onFlipSelection}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-foreground/80 hover:text-foreground transition-all"
              title="Flip arrow direction (R)"
            >
              <RotateCw size={12} />
              <span>Flip Arrow</span>
            </button>
          )}
        </div>
      )}

      {/* ── Text Label Selected ── */}
      {selectedText && (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-mono font-semibold text-quantum">Text Label</span>
          <div className="flex items-center gap-1.5 flex-1 max-w-sm">
            <label className="text-foreground/50 font-mono text-[11px]">Text:</label>
            <input
              type="text"
              value={selectedText.text}
              onChange={(e) => onUpdateTextLabel(selectedText.id, e.target.value)}
              className="flex-1 bg-black/60 border border-white/10 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-quantum font-mono"
            />
          </div>
        </div>
      )}

      {/* ── Vertex Selected ── */}
      {selectedVertex && (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-mono font-semibold text-quantum">Vertex</span>
          <span className="font-mono text-foreground/60 text-xs">
            X: {Math.round(selectedVertex.x)}, Y: {Math.round(selectedVertex.y)}
          </span>
          <span className="text-[11px] text-foreground/45">
            (Drag particle endpoints here to connect)
          </span>
        </div>
      )}

      {/* ── Blob / Ellipse Selected ── */}
      {selectedEllipse && (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-mono font-semibold text-quantum">Blob / Hadron</span>
          <span className="font-mono text-foreground/60 text-xs">
            Center: ({Math.round(selectedEllipse.x)}, {Math.round(selectedEllipse.y)}), Radius: ({Math.round(selectedEllipse.rx)}, {Math.round(selectedEllipse.ry)})
          </span>
          <span className="text-[11px] text-foreground/45">
            (Drag perimeter handles to resize)
          </span>
        </div>
      )}

      {/* ── Boundary Box Selected ── */}
      {selectedRectangle && (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-mono font-semibold text-quantum">Boundary Box</span>
          <span className="font-mono text-foreground/60 text-xs">
            Dimensions: {Math.round(selectedRectangle.width)} × {Math.round(selectedRectangle.height)}
          </span>
          <span className="text-[11px] text-foreground/45">
            (Drag corner handles to resize)
          </span>
        </div>
      )}

      {/* ── Multi-selection summary ── */}
      {totalSelected > 1 && (
        <div className="flex items-center gap-2 font-mono text-xs text-foreground/70">
          <span className="text-quantum font-semibold">{totalSelected} items</span>
          <span>selected</span>
        </div>
      )}

      {/* Action buttons (Delete) */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={onDeleteSelection}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-mono transition-colors"
          title="Delete selected item(s)"
        >
          <Trash2 size={13} />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
