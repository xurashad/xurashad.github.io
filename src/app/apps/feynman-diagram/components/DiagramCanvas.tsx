"use client";

import { useState, useRef, useCallback, type SetStateAction, type Dispatch } from "react";
import { ParticleLine } from "./ParticleLine";
import {
  CANVAS_W, CANVAS_H, GRID_SPACING, HANDLE_RADIUS,
  VERTEX_RADIUS, SNAP_RADIUS, BEND_SNAP_VALUE, PARTICLE_COLOR,
} from "../lib/constants";
import type {
  DiagramState, Selection, Particle, DraggingObject, DragPayload,
} from "../lib/types";
import { ParticleType } from "../lib/types";

interface Props {
  state:           DiagramState;
  selection:       Selection;
  onStateChange:   (s: DiagramState) => void;
  onSelectionChange: Dispatch<SetStateAction<Selection>>;
  onDrop:          (payload: DragPayload, pos: { x: number; y: number }) => void;
  svgRef:          React.RefObject<SVGSVGElement | null>;
}

const EMPTY_SEL = (): Selection => ({
  vertices: new Set(), particles: new Set(), textLabels: new Set(),
  ellipses: new Set(), rectangles: new Set(),
});

export function DiagramCanvas({ state, selection, onStateChange, onSelectionChange, onDrop, svgRef }: Props) {
  const [dragging,      setDragging]      = useState<DraggingObject | null>(null);
  const [editingLabel,  setEditingLabel]  = useState<{ id: number; text: string } | null>(null);
  const [snapPos,       setSnapPos]       = useState<{ x: number; y: number } | null>(null);
  const [selBox,        setSelBox]        = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragRef = useRef<{
    mousePos: { x: number; y: number };
    initState: DiagramState;
    sel: Selection;
    shiftKey: boolean;
  } | null>(null);

  // ── Coordinate helpers ──────────────────────────────────────────────────────
  const svgCoords = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
  };
  const snap = (v: number) => Math.round(v / GRID_SPACING) * GRID_SPACING;

  // ── Drop from palette ───────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const c = svgCoords(e);
    setSnapPos({ x: snap(c.x), y: snap(c.y) });
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setSnapPos(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload = JSON.parse(raw) as DragPayload;
    const c = svgCoords(e);
    onDrop(payload, { x: snap(c.x), y: snap(c.y) });
    onSelectionChange(EMPTY_SEL());
  };

  // ── Selection box on background ─────────────────────────────────────────────
  const handleBgMouseDown = (e: React.MouseEvent) => {
    if (e.target !== svgRef.current) return;
    setEditingLabel(null);
    const pos = svgCoords(e);
    setSelBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
    dragRef.current = { mousePos: pos, initState: state, sel: selection, shiftKey: e.shiftKey };
  };

  // ── Item mouse down ──────────────────────────────────────────────────────────
  const handleItemMouseDown = (e: React.MouseEvent, itemType: string, id: number) => {
    e.stopPropagation();
    if (editingLabel?.id === id && itemType === "text") return;
    setEditingLabel(null);

    const isSelected =
      (itemType === "vertex"    && selection.vertices.has(id))   ||
      (itemType === "particle"  && selection.particles.has(id))  ||
      (itemType === "text"      && selection.textLabels.has(id)) ||
      (itemType === "ellipse"   && selection.ellipses.has(id))   ||
      (itemType === "rectangle" && selection.rectangles.has(id));

    let curSel = selection;

    if (e.shiftKey) {
      const ns: Selection = {
        vertices:   new Set(selection.vertices),
        particles:  new Set(selection.particles),
        textLabels: new Set(selection.textLabels),
        ellipses:   new Set(selection.ellipses),
        rectangles: new Set(selection.rectangles),
      };
      if (itemType === "vertex")    isSelected ? ns.vertices.delete(id)   : ns.vertices.add(id);
      if (itemType === "particle")  isSelected ? ns.particles.delete(id)  : ns.particles.add(id);
      if (itemType === "text")      isSelected ? ns.textLabels.delete(id) : ns.textLabels.add(id);
      if (itemType === "ellipse")   isSelected ? ns.ellipses.delete(id)   : ns.ellipses.add(id);
      if (itemType === "rectangle") isSelected ? ns.rectangles.delete(id) : ns.rectangles.add(id);
      onSelectionChange(ns); curSel = ns;
    } else {
      // Particle handle shortcuts (drag endpoint/bend without selecting first)
      const handle = (e.target as HTMLElement).dataset?.handle;
      if (itemType === "particle" && !isSelected && handle) {
        setDragging({ type: handle as DraggingObject["type"], id });
        return;
      }
      if (!isSelected) {
        const ns = EMPTY_SEL();
        if (itemType === "vertex")    ns.vertices.add(id);
        if (itemType === "particle")  ns.particles.add(id);
        if (itemType === "text")      ns.textLabels.add(id);
        if (itemType === "ellipse")   ns.ellipses.add(id);
        if (itemType === "rectangle") ns.rectangles.add(id);
        onSelectionChange(ns); curSel = ns;
      }
    }
    setDragging({ type: "selection" });
    dragRef.current = {
      mousePos: svgCoords(e), initState: JSON.parse(JSON.stringify(state)),
      sel: curSel, shiftKey: e.shiftKey,
    };
  };

  // ── Resize handle mouse down ──────────────────────────────────────────────
  const handleResizeMouseDown = (e: React.MouseEvent, kind: "ellipse" | "rectangle", id: number, handle: string) => {
    e.stopPropagation();
    setDragging(
      kind === "ellipse"
        ? { type: "resize-ellipse",    id, handle }
        : { type: "resize-rectangle",  id, corner: handle },
    );
  };

  // ── Mouse move ────────────────────────────────────────────────────────────
  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = svgCoords(e);
    const sx = snap(x), sy = snap(y);

    // Selection box drawing
    if (selBox && !dragging) {
      setSelBox({ x: selBox.x, y: selBox.y, w: x - selBox.x, h: y - selBox.y });
      return;
    }
    if (!dragging) return;

    const { vertices, particles } = state;

    if (dragging.type === "selection") {
      if (!dragRef.current) return;
      const { mousePos, initState, sel: dragSel } = dragRef.current;
      const dx = x - mousePos.x, dy = y - mousePos.y;
      const sdx = snap(dx), sdy = snap(dy);

      const newV = initState.vertices.map(v =>
        dragSel.vertices.has(v.id) ? { ...v, x: v.x + sdx, y: v.y + sdy } : v);
      const newP = initState.particles.map(p => {
        if (dragSel.particles.has(p.id)) {
          const np = { ...p, startX: p.startX+sdx, startY: p.startY+sdy, endX: p.endX+sdx, endY: p.endY+sdy };
          if (p.startVertex && !dragSel.vertices.has(p.startVertex)) np.startVertex = null;
          if (p.endVertex   && !dragSel.vertices.has(p.endVertex))   np.endVertex   = null;
          return np;
        }
        const np = { ...p };
        if (p.startVertex && dragSel.vertices.has(p.startVertex)) {
          const v = newV.find(v => v.id === p.startVertex);
          if (v) { np.startX = v.x; np.startY = v.y; }
        }
        if (p.endVertex && dragSel.vertices.has(p.endVertex)) {
          const v = newV.find(v => v.id === p.endVertex);
          if (v) { np.endX = v.x; np.endY = v.y; }
        }
        return np;
      });
      const newT  = initState.textLabels.map(l => dragSel.textLabels.has(l.id) ? { ...l, x: l.x+sdx, y: l.y+sdy} : l);
      const newEl = initState.ellipses.map(el => dragSel.ellipses.has(el.id)   ? { ...el, x: el.x+sdx, y: el.y+sdy} : el);
      const newR  = initState.rectangles.map(r => dragSel.rectangles.has(r.id) ? { ...r, x: r.x+sdx, y: r.y+sdy} : r);
      onStateChange({ vertices: newV, particles: newP, textLabels: newT, ellipses: newEl, rectangles: newR });
    }

    else if (dragging.type === "resize-ellipse" && dragging.id != null) {
      const h = dragging.handle ?? "";
      onStateChange({
        ...state,
        ellipses: state.ellipses.map(el => {
          if (el.id !== dragging.id) return el;
          const gs = GRID_SPACING / 2;
          let { rx, ry } = el;
          if (h.includes("e") || h.includes("w")) rx = Math.max(gs, snap(Math.abs(x - el.x)));
          if (h.includes("n") || h.includes("s")) ry = Math.max(gs, snap(Math.abs(y - el.y)));
          return { ...el, rx, ry };
        }),
      });
    }

    else if (dragging.type === "resize-rectangle" && dragging.id != null) {
      const corner = dragging.corner ?? "";
      onStateChange({
        ...state,
        rectangles: state.rectangles.map(r => {
          if (r.id !== dragging.id) return r;
          let { x: cx, y: cy, width: w, height: h } = r;
          if (corner.includes("left") || corner.includes("right")) {
            const fx = corner.includes("left") ? cx + w/2 : cx - w/2;
            w  = Math.max(GRID_SPACING, Math.abs(sx - fx));
            cx = (sx + fx) / 2;
          }
          if (corner.includes("top") || corner.includes("bottom")) {
            const fy = corner.includes("top") ? cy + h/2 : cy - h/2;
            h  = Math.max(GRID_SPACING, Math.abs(sy - fy));
            cy = (sy + fy) / 2;
          }
          return { ...r, x: cx, y: cy, width: w, height: h };
        }),
      });
    }

    else if (dragging.type === "particle_bend" && dragging.id != null) {
      onStateChange({
        ...state,
        particles: particles.map(p => {
          if (p.id !== dragging.id) return p;
          const { startX: sx0, startY: sy0, endX: ex0, endY: ey0 } = p;
          const pdx = ex0 - sx0, pdy = ey0 - sy0;
          const plen = Math.sqrt(pdx*pdx + pdy*pdy);
          if (!plen) return p;
          const mx0 = sx0 + pdx/2, my0 = sy0 + pdy/2;
          const mdx = x - mx0, mdy = y - my0;
          const nx = -pdy / plen, ny = pdx / plen;
          const bend = mdx * nx + mdy * ny;
          return { ...p, bend: Math.round(bend / BEND_SNAP_VALUE) * BEND_SNAP_VALUE };
        }),
      });
    }

    else if ((dragging.type === "particle_start" || dragging.type === "particle_end") && dragging.id != null) {
      let closest: typeof vertices[0] | null = null, minDist = SNAP_RADIUS;
      vertices.forEach(v => {
        const d = Math.hypot(v.x - x, v.y - y);
        if (d < minDist) { minDist = d; closest = v; }
      });
      const isStart = dragging.type === "particle_start";
      onStateChange({
        ...state,
        particles: particles.map(p => {
          if (p.id !== dragging.id) return p;
          return isStart
            ? { ...p, startX: closest?.x ?? sx, startY: closest?.y ?? sy, startVertex: closest?.id ?? null }
            : { ...p, endX:   closest?.x ?? sx, endY:   closest?.y ?? sy, endVertex:   closest?.id ?? null };
        }),
      });
    }
  };

  // ── Mouse up ──────────────────────────────────────────────────────────────
  const handleMouseUp = () => {
    if (selBox) {
      const { x: bx, y: by, w: bw, h: bh } = selBox;
      if (Math.hypot(bw, bh) > 5) {
        const x1 = Math.min(bx, bx+bw), y1 = Math.min(by, by+bh);
        const x2 = Math.max(bx, bx+bw), y2 = Math.max(by, by+bh);
        const ns = EMPTY_SEL();
        state.vertices.forEach(v => { if (v.x>=x1 && v.x<=x2 && v.y>=y1 && v.y<=y2) ns.vertices.add(v.id); });
        state.particles.forEach(p => {
          const minX = Math.min(p.startX, p.endX), maxX = Math.max(p.startX, p.endX);
          const minY = Math.min(p.startY, p.endY), maxY = Math.max(p.startY, p.endY);
          if (x1<maxX && x2>minX && y1<maxY && y2>minY) ns.particles.add(p.id);
        });
        state.textLabels.forEach(l => { if (l.x>=x1 && l.x<=x2 && l.y>=y1 && l.y<=y2) ns.textLabels.add(l.id); });
        state.ellipses.forEach(el => { if (x1<el.x+el.rx && x2>el.x-el.rx && y1<el.y+el.ry && y2>el.y-el.ry) ns.ellipses.add(el.id); });
        state.rectangles.forEach(r => { if (x1<r.x+r.width/2 && x2>r.x-r.width/2 && y1<r.y+r.height/2 && y2>r.y-r.height/2) ns.rectangles.add(r.id); });
        if (dragRef.current?.shiftKey) {
          onSelectionChange(prev => ({
            vertices:   new Set([...prev.vertices,   ...ns.vertices]),
            particles:  new Set([...prev.particles,  ...ns.particles]),
            textLabels: new Set([...prev.textLabels, ...ns.textLabels]),
            ellipses:   new Set([...prev.ellipses,   ...ns.ellipses]),
            rectangles: new Set([...prev.rectangles, ...ns.rectangles]),
          }));
        } else {
          onSelectionChange(ns);
        }
      } else if (!dragRef.current?.shiftKey) {
        onSelectionChange(EMPTY_SEL());
      }
    }
    setSelBox(null); setDragging(null); dragRef.current = null;
  };

  // ── Single-type selection check ───────────────────────────────────────────
  const isSingleOf = (kind: "ellipses" | "rectangles") => {
    const total = selection.vertices.size + selection.particles.size +
      selection.textLabels.size + selection.ellipses.size + selection.rectangles.size;
    return total === 1 && selection[kind].size === 1;
  };

  const cursor = dragging ? "cursor-grabbing" : "cursor-default";

  return (
    <div className="w-full h-full bg-[#0d0d1a] rounded-lg border border-white/8 overflow-auto shadow-inner">
      <svg
        id="feynman-svg"
        ref={svgRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={`block ${cursor}`}
        onDragOver={handleDragOver}
        onDragLeave={() => setSnapPos(null)}
        onDrop={handleDrop}
        onMouseDown={handleBgMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid */}
        <defs>
          <pattern id="fg-grid" width={GRID_SPACING} height={GRID_SPACING} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID_SPACING} 0 L 0 0 0 ${GRID_SPACING}`} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fg-grid)" />

        {/* Rectangles */}
        {state.rectangles.map(r => {
          const sel = selection.rectangles.has(r.id);
          return (
            <rect
              key={r.id}
              x={r.x - r.width/2} y={r.y - r.height/2}
              width={r.width} height={r.height}
              fill="rgba(148,163,184,0.08)"
              stroke={sel ? "#fff" : "#94a3b8"} strokeWidth={sel ? 2 : 1.5}
              className="cursor-move"
              onMouseDown={ev => handleItemMouseDown(ev, "rectangle", r.id)}
            />
          );
        })}
        {/* Rectangle resize handles */}
        {isSingleOf("rectangles") && (() => {
          const r = state.rectangles.find(r => selection.rectangles.has(r.id))!;
          const lx = r.x - r.width/2, rx2 = r.x + r.width/2;
          const ty = r.y - r.height/2, by2 = r.y + r.height/2;
          const handles = {
            "top-left": [lx, ty], "top": [r.x, ty], "top-right": [rx2, ty],
            "left": [lx, r.y], "right": [rx2, r.y],
            "bottom-left": [lx, by2], "bottom": [r.x, by2], "bottom-right": [rx2, by2],
          } as Record<string, [number, number]>;
          return Object.entries(handles).map(([key, [cx, cy]]) => (
            <circle key={key} cx={cx} cy={cy} r={HANDLE_RADIUS}
              fill="#fff" stroke="#22d3ee" strokeWidth="2"
              className="cursor-pointer"
              onMouseDown={ev => handleResizeMouseDown(ev, "rectangle", r.id, key)}
            />
          ));
        })()}

        {/* Ellipses */}
        {state.ellipses.map(el => {
          const sel = selection.ellipses.has(el.id);
          return (
            <ellipse
              key={el.id} cx={el.x} cy={el.y} rx={el.rx} ry={el.ry}
              fill="rgba(148,163,184,0.07)"
              stroke={sel ? "#fff" : "#94a3b8"} strokeWidth={sel ? 2 : 1.5}
              className="cursor-move"
              onMouseDown={ev => handleItemMouseDown(ev, "ellipse", el.id)}
            />
          );
        })}
        {/* Ellipse resize handles */}
        {isSingleOf("ellipses") && (() => {
          const el = state.ellipses.find(e => selection.ellipses.has(e.id))!;
          const handles = {
            n: [el.x, el.y-el.ry], s: [el.x, el.y+el.ry],
            w: [el.x-el.rx, el.y], e: [el.x+el.rx, el.y],
            nw: [el.x-el.rx, el.y-el.ry], ne: [el.x+el.rx, el.y-el.ry],
            sw: [el.x-el.rx, el.y+el.ry], se: [el.x+el.rx, el.y+el.ry],
          } as Record<string, [number, number]>;
          return Object.entries(handles).map(([k, [cx, cy]]) => (
            <circle key={k} cx={cx} cy={cy} r={HANDLE_RADIUS}
              fill="#fff" stroke="#22d3ee" strokeWidth="2"
              className="cursor-pointer"
              onMouseDown={ev => handleResizeMouseDown(ev, "ellipse", el.id, k)}
            />
          ));
        })()}

        {/* Particle lines */}
        {state.particles.map(p => <ParticleLine key={p.id} particle={p} />)}

        {/* Particle handles */}
        {state.particles.map(p => {
          const sel = selection.particles.has(p.id);
          const hFill = sel ? "#22d3ee" : "#f59e0b";
          const { startX: sx0, startY: sy0, endX: ex0, endY: ey0, bend: b } = p;
          const dx = ex0-sx0, dy = ey0-sy0, len = Math.sqrt(dx*dx+dy*dy);
          if (!len) return null;
          const bhx = sx0 + dx/2 - (dy/len)*b;
          const bhy = sy0 + dy/2 + (dx/len)*b;
          return (
            <g key={`h-${p.id}`}>
              <circle cx={sx0} cy={sy0} r={HANDLE_RADIUS} fill={hFill} className="cursor-move"
                onMouseDown={ev => handleItemMouseDown(ev, "particle", p.id)}
                data-handle="particle_start" />
              <circle cx={ex0} cy={ey0} r={HANDLE_RADIUS} fill={hFill} className="cursor-move"
                onMouseDown={ev => handleItemMouseDown(ev, "particle", p.id)}
                data-handle="particle_end" />
              <circle cx={bhx} cy={bhy} r={HANDLE_RADIUS} fill={sel ? "#22d3ee" : "#8b5cf6"} className="cursor-move"
                onMouseDown={ev => handleItemMouseDown(ev, "particle", p.id)}
                data-handle="particle_bend" />
            </g>
          );
        })}

        {/* Vertices */}
        {state.vertices.map(v => {
          const sel = selection.vertices.has(v.id);
          return (
            <g key={v.id} onMouseDown={ev => handleItemMouseDown(ev, "vertex", v.id)}>
              {sel && <circle cx={v.x} cy={v.y} r={VERTEX_RADIUS + 5} fill="rgba(34,211,238,0.15)" className="cursor-move" />}
              <circle cx={v.x} cy={v.y} r={VERTEX_RADIUS}
                fill="#22d3ee" stroke={sel ? "#fff" : "rgba(34,211,238,0.4)"} strokeWidth="2"
                style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.6))" }}
                className="cursor-move" />
            </g>
          );
        })}

        {/* Text labels */}
        {state.textLabels.map(label => {
          const sel = selection.textLabels.has(label.id);
          if (editingLabel?.id === label.id) {
            return (
              <foreignObject key={`edit-${label.id}`} x={label.x-90} y={label.y-16} width="180" height="32">
                <input
                  type="text"
                  value={editingLabel.text}
                  onChange={ev => setEditingLabel({ ...editingLabel, text: ev.target.value })}
                  onBlur={() => {
                    onStateChange({
                      ...state,
                      textLabels: state.textLabels.map(l => l.id === label.id ? { ...l, text: editingLabel.text } : l),
                    });
                    setEditingLabel(null);
                  }}
                  onKeyDown={ev => {
                    if (ev.key === "Enter" || ev.key === "Escape") {
                      onStateChange({
                        ...state,
                        textLabels: state.textLabels.map(l => l.id === label.id ? { ...l, text: editingLabel.text } : l),
                      });
                      setEditingLabel(null);
                    }
                  }}
                  autoFocus
                  className="w-full h-full bg-gray-800 text-white text-center border border-cyan-400 rounded text-sm focus:outline-none px-1"
                />
              </foreignObject>
            );
          }
          return (
            <g key={label.id}
              onMouseDown={ev => handleItemMouseDown(ev, "text", label.id)}
              onDoubleClick={() => {
                setDragging(null);
                onSelectionChange(EMPTY_SEL());
                setEditingLabel({ id: label.id, text: label.text });
              }}
              className="cursor-move"
            >
              {sel && <rect x={label.x-30} y={label.y-14} width="60" height="28" fill="none" stroke="white" strokeWidth="1" strokeDasharray="2 2"/>}
              <text x={label.x} y={label.y} fill="white" dominantBaseline="middle" textAnchor="middle"
                fontSize="16" fontFamily="sans-serif" className="select-none"
                style={{ filter: sel ? "drop-shadow(0 0 3px rgba(255,255,255,0.5))" : "none" }}>
                {label.text}
              </text>
            </g>
          );
        })}

        {/* Drop preview */}
        {snapPos && (
          <circle cx={snapPos.x} cy={snapPos.y} r={VERTEX_RADIUS}
            fill="rgba(34,211,238,0.35)" stroke="#22d3ee" strokeWidth="2" style={{ pointerEvents: "none" }} />
        )}

        {/* Selection rubber-band box */}
        {selBox && (
          <rect
            x={selBox.w >= 0 ? selBox.x : selBox.x + selBox.w}
            y={selBox.h >= 0 ? selBox.y : selBox.y + selBox.h}
            width={Math.abs(selBox.w)} height={Math.abs(selBox.h)}
            fill="rgba(34,211,238,0.1)" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 3"
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>
    </div>
  );
}
