"use client";

import { useState, useEffect, useCallback, useMemo, type RefObject } from "react";
import { getNiceStep, type Equation, type ViewBox } from "./lib/types";

interface GridLine {
  x1: number; y1: number;
  x2: number; y2: number;
  type: "axis" | "grid";
}

interface GridLabel { x: number; y: number; text: string }
interface PathData  { id: number; d: string; color: string }

interface Dims { width: number; height: number }

interface Props {
  equations: Equation[];
  viewBox: ViewBox;
  svgRef: RefObject<SVGSVGElement | null>;
  isGridVisible: boolean;
  onResize: (d: Dims) => void;
  onWheel: React.WheelEventHandler<SVGSVGElement>;
  onMouseDown: React.MouseEventHandler<SVGSVGElement>;
  onMouseMove: React.MouseEventHandler<SVGSVGElement>;
  onMouseUp: React.MouseEventHandler<SVGSVGElement>;
  onMouseLeave: React.MouseEventHandler<SVGSVGElement>;
  onTouchStart: React.TouchEventHandler<SVGSVGElement>;
  onTouchMove: React.TouchEventHandler<SVGSVGElement>;
  onTouchEnd: React.TouchEventHandler<SVGSVGElement>;
}

export function GraphCanvas({
  equations, viewBox, svgRef, isGridVisible, onResize,
  onWheel, onMouseDown, onMouseMove, onMouseUp, onMouseLeave,
  onTouchStart, onTouchMove, onTouchEnd,
}: Props) {
  const [dims, setDims] = useState<Dims>({ width: 0, height: 0 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!svgRef.current) return;
      const { width, height } = svgRef.current.getBoundingClientRect();
      setDims((prev) => {
        if (prev.width === width && prev.height === height) return prev;
        onResize({ width, height });
        return { width, height };
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [svgRef, onResize]);

  const { width, height } = dims;

  const tx = useCallback(
    (x: number) => ((x - viewBox.xMin) / (viewBox.xMax - viewBox.xMin)) * width,
    [viewBox, width],
  );
  const ty = useCallback(
    (y: number) => height - ((y - viewBox.yMin) / (viewBox.yMax - viewBox.yMin)) * height,
    [viewBox, height],
  );

  const { lines, labels } = useMemo<{ lines: GridLine[]; labels: GridLabel[] }>(() => {
    if (width === 0) return { lines: [], labels: [] };
    const lines: GridLine[] = [];
    const labels: GridLabel[] = [];
    const stepX = getNiceStep(viewBox.xMax - viewBox.xMin);
    const stepY = getNiceStep(viewBox.yMax - viewBox.yMin);

    const x0 = tx(0), y0 = ty(0);

    for (let x = Math.ceil(viewBox.xMin / stepX) * stepX; x <= viewBox.xMax + 1e-9; x += stepX) {
      const sx = tx(x);
      const isAxis = Math.abs(x) < stepX * 0.01;
      lines.push({ x1: sx, y1: 0, x2: sx, y2: height, type: isAxis ? "axis" : "grid" });
      if (!isAxis) labels.push({ x: sx + 2, y: y0 - 2, text: parseFloat(x.toPrecision(4)).toString() });
    }
    for (let y = Math.ceil(viewBox.yMin / stepY) * stepY; y <= viewBox.yMax + 1e-9; y += stepY) {
      const sy = ty(y);
      const isAxis = Math.abs(y) < stepY * 0.01;
      lines.push({ x1: 0, y1: sy, x2: width, y2: sy, type: isAxis ? "axis" : "grid" });
      if (!isAxis) labels.push({ x: x0 + 2, y: sy - 2, text: parseFloat(y.toPrecision(4)).toString() });
    }
    return { lines, labels };
  }, [viewBox, width, height, tx, ty]);

  const paths = useMemo<PathData[]>(() => {
    if (width === 0) return [];

    const explicit = equations
      .filter((eq) => eq.type === "explicit" && eq.fn)
      .map((eq) => {
        const pts: string[] = [];
        let cont = false;
        const rangeX = viewBox.xMax - viewBox.xMin;
        for (let i = 0; i <= width; i++) {
          const x = viewBox.xMin + (i / width) * rangeX;
          try {
            const y = (eq.fn as (x: number) => number)(x);
            if (Number.isFinite(y)) {
              const sy = ty(y);
              if (sy >= -height * 2 && sy <= height * 3) {
                pts.push(cont ? `L ${i} ${sy}` : `M ${i} ${sy}`);
                cont = true;
              } else { cont = false; }
            } else { cont = false; }
          } catch { cont = false; }
        }
        return { id: eq.id, d: pts.join(" "), color: eq.color };
      });

    const implicit = equations
      .filter((eq) => eq.type === "implicit" && eq.fn)
      .map((eq) => {
        const fn = eq.fn as (x: number, y: number) => number;
        const segs: string[] = [];
        const res = Math.min(width, 300);
        const stepX = (viewBox.xMax - viewBox.xMin) / res;
        const stepY = (viewBox.yMax - viewBox.yMin) / res;

        const v: number[][] = Array.from({ length: res + 1 }, (_, i) =>
          Array.from({ length: res + 1 }, (__, j) => {
            try { return fn(viewBox.xMin + i * stepX, viewBox.yMin + j * stepY); }
            catch { return NaN; }
          }),
        );

        for (let i = 0; i < res; i++) {
          for (let j = 0; j < res; j++) {
            const corners = [v[i][j], v[i+1][j], v[i+1][j+1], v[i][j+1]];
            if (corners.some(isNaN)) continue;
            let idx = 0;
            if (corners[0] > 0) idx |= 1; if (corners[1] > 0) idx |= 2;
            if (corners[2] > 0) idx |= 4; if (corners[3] > 0) idx |= 8;
            if (idx === 0 || idx === 15) continue;

            const x0c = viewBox.xMin + i * stepX;
            const y0c = viewBox.yMin + j * stepY;
            const it = (a: number, b: number) => a / (a - b);
            const p = [
              { x: x0c + stepX * it(corners[0], corners[1]), y: y0c },
              { x: x0c + stepX, y: y0c + stepY * it(corners[1], corners[2]) },
              { x: x0c + stepX * (1 - it(corners[2], corners[3])), y: y0c + stepY },
              { x: x0c, y: y0c + stepY * it(corners[0], corners[3]) },
            ];
            const seg = (a: typeof p[0], b: typeof p[0]) =>
              `M ${tx(a.x)} ${ty(a.y)} L ${tx(b.x)} ${ty(b.y)}`;

            switch (idx) {
              case  1: case 14: segs.push(seg(p[3], p[0])); break;
              case  2: case 13: segs.push(seg(p[0], p[1])); break;
              case  3: case 12: segs.push(seg(p[3], p[1])); break;
              case  4: case 11: segs.push(seg(p[1], p[2])); break;
              case  5: segs.push(seg(p[3], p[0]), seg(p[1], p[2])); break;
              case  6: case  9: segs.push(seg(p[0], p[2])); break;
              case  7: case  8: segs.push(seg(p[3], p[2])); break;
              case 10: segs.push(seg(p[0], p[1]), seg(p[3], p[2])); break;
            }
          }
        }
        return { id: eq.id, d: segs.join(" "), color: eq.color };
      });

    return [...explicit, ...implicit];
  }, [equations, viewBox, width, height, tx, ty]);

  const legendEqs = equations.filter((eq) => eq.fn && !eq.error);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full touch-none select-none"
      style={{ cursor: "grab" }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Grid lines */}
      {isGridVisible && lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={l.type === "axis" ? "rgba(180,180,200,0.55)" : "rgba(120,120,140,0.18)"}
          strokeWidth={l.type === "axis" ? 1 : 0.5}
        />
      ))}

      {/* Equation paths */}
      {paths.map((p) => (
        <path key={p.id} d={p.d} fill="none" stroke={p.color}
          strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      ))}

      {/* Grid labels */}
      {isGridVisible && labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} fill="rgba(180,180,200,0.7)" fontSize="10" className="select-none">
          {l.text}
        </text>
      ))}

      {/* Legend */}
      {legendEqs.length > 0 && (
        <g transform="translate(16,16)">
          {legendEqs.map((eq, i) => (
            <g key={eq.id} transform={`translate(0,${i * 22})`}>
              <line x1="0" y1="9" x2="22" y2="9" stroke={eq.color} strokeWidth="3" strokeLinecap="round" />
              <text x="30" y="13" fill="rgba(230,232,240,0.9)" fontSize="13" className="select-none">
                {eq.text}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}
