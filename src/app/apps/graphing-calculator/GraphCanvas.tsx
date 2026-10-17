"use client";

import { useMemo, useState, useCallback, type RefObject } from "react";
import {
  getNiceStep,
  formatCoordinate,
  type Equation,
  type ViewBox,
  type KeyPoint,
} from "./lib/types";

interface Props {
  equations: Equation[];
  viewBox: ViewBox;
  svgRef: RefObject<SVGSVGElement | null>;
  isGridVisible: boolean;
  width: number;
  height: number;
  onWheel: React.WheelEventHandler<SVGSVGElement>;
  onMouseDown: React.MouseEventHandler<SVGSVGElement>;
  onMouseMove: React.MouseEventHandler<SVGSVGElement>;
  onMouseUp: React.MouseEventHandler<SVGSVGElement>;
  onMouseLeave: React.MouseEventHandler<SVGSVGElement>;
  onTouchStart: React.TouchEventHandler<SVGSVGElement>;
  onTouchMove: React.TouchEventHandler<SVGSVGElement>;
  onTouchEnd: React.TouchEventHandler<SVGSVGElement>;
  activeEqId: number | null;
}

export function GraphCanvas({
  equations,
  viewBox,
  svgRef,
  isGridVisible,
  width,
  height,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  activeEqId,
}: Props) {
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; sx: number; sy: number; color: string } | null>(null);
  const [selectedKeyPoint, setSelectedKeyPoint] = useState<KeyPoint | null>(null);

  // Coordinate transforms
  const tx = useCallback(
    (x: number) => ((x - viewBox.xMin) / (viewBox.xMax - viewBox.xMin)) * width,
    [viewBox, width],
  );
  const ty = useCallback(
    (y: number) => height - ((y - viewBox.yMin) / (viewBox.yMax - viewBox.yMin)) * height,
    [viewBox, height],
  );

  const invTx = useCallback(
    (sx: number) => viewBox.xMin + (sx / width) * (viewBox.xMax - viewBox.xMin),
    [viewBox, width],
  );

  // Grid lines & Sticky Labels
  const { majorLines, minorLines, xLabels, yLabels, origin } = useMemo(() => {
    if (width === 0 || height === 0) {
      return { majorLines: [], minorLines: [], xLabels: [], yLabels: [], origin: { x: 0, y: 0 } };
    }

    const majorLines: { x1: number; y1: number; x2: number; y2: number; isAxis: boolean }[] = [];
    const minorLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const xLabels: { x: number; y: number; text: string }[] = [];
    const yLabels: { x: number; y: number; text: string }[] = [];

    const rangeX = viewBox.xMax - viewBox.xMin;
    const rangeY = viewBox.yMax - viewBox.yMin;
    const { major: stepX, minor: minorStepX } = getNiceStep(rangeX);
    const { major: stepY, minor: minorStepY } = getNiceStep(rangeY);

    const x0 = tx(0);
    const y0 = ty(0);

    // Sticky coordinates for axis labels
    const stickyY = Math.max(16, Math.min(height - 10, y0 + 14));
    const stickyX = Math.max(8, Math.min(width - 36, x0 + 6));

    // Minor vertical grid lines
    if (isGridVisible) {
      const startMinorX = Math.floor(viewBox.xMin / minorStepX) * minorStepX;
      for (let x = startMinorX; x <= viewBox.xMax + 1e-9; x += minorStepX) {
        const sx = tx(x);
        minorLines.push({ x1: sx, y1: 0, x2: sx, y2: height });
      }
      const startMinorY = Math.floor(viewBox.yMin / minorStepY) * minorStepY;
      for (let y = startMinorY; y <= viewBox.yMax + 1e-9; y += minorStepY) {
        const sy = ty(y);
        minorLines.push({ x1: 0, y1: sy, x2: width, y2: sy });
      }
    }

    // Major vertical lines
    const startMajorX = Math.floor(viewBox.xMin / stepX) * stepX;
    for (let x = startMajorX; x <= viewBox.xMax + 1e-9; x += stepX) {
      const sx = tx(x);
      const isAxis = Math.abs(x) < stepX * 0.001;
      majorLines.push({ x1: sx, y1: 0, x2: sx, y2: height, isAxis });
      if (!isAxis) {
        xLabels.push({ x: sx, y: stickyY, text: formatCoordinate(x) });
      }
    }

    // Major horizontal lines
    const startMajorY = Math.floor(viewBox.yMin / stepY) * stepY;
    for (let y = startMajorY; y <= viewBox.yMax + 1e-9; y += stepY) {
      const sy = ty(y);
      const isAxis = Math.abs(y) < stepY * 0.001;
      majorLines.push({ x1: 0, y1: sy, x2: width, y2: sy, isAxis });
      if (!isAxis) {
        yLabels.push({ x: stickyX, y: sy - 4, text: formatCoordinate(y) });
      }
    }

    return { majorLines, minorLines, xLabels, yLabels, origin: { x: x0, y: y0 } };
  }, [viewBox, width, height, tx, ty, isGridVisible]);

  // Key Points: Extrema & Intercepts for visible explicit curves
  const keyPoints = useMemo<KeyPoint[]>(() => {
    if (width === 0 || height === 0) return [];

    const visibleExplicit = equations.filter(
      (eq) => eq.visible && eq.fn && (eq.type === "explicit" || eq.type === "inequality"),
    );

    const points: KeyPoint[] = [];

    // Also include explicit Point items
    equations.filter((e) => e.visible && e.type === "point" && e.point).forEach((e) => {
      points.push({
        x: e.point!.x,
        y: e.point!.y,
        type: "point",
        label: e.point!.label || `(${e.point!.x}, ${e.point!.y})`,
        equationId: e.id,
        color: e.color,
      });
    });

    visibleExplicit.forEach((eq) => {
      const fn = eq.fn as (x: number) => number;
      const samples = 160;
      const step = (viewBox.xMax - viewBox.xMin) / samples;

      // 1. Y-intercept (x = 0)
      if (viewBox.xMin <= 0 && viewBox.xMax >= 0) {
        try {
          const yAtZero = fn(0);
          if (Number.isFinite(yAtZero) && yAtZero >= viewBox.yMin && yAtZero <= viewBox.yMax) {
            points.push({
              x: 0,
              y: yAtZero,
              type: "intercept",
              label: `(0, ${formatCoordinate(yAtZero)})`,
              equationId: eq.id,
              color: eq.color,
            });
          }
        } catch { /* ignore */ }
      }

      // Sample along curve to find roots and extrema
      let prevX = viewBox.xMin;
      let prevY = NaN;
      try { prevY = fn(prevX); } catch { /* ignore */ }

      let prevSlope = NaN;

      for (let s = 1; s <= samples; s++) {
        const curX = viewBox.xMin + s * step;
        let curY = NaN;
        try { curY = fn(curX); } catch { /* ignore */ }

        if (!Number.isFinite(curY) || !Number.isFinite(prevY)) {
          prevX = curX;
          prevY = curY;
          prevSlope = NaN;
          continue;
        }

        // Roots (X-intercepts): sign change
        if (prevY * curY <= 0 && Math.abs(curY - prevY) < (viewBox.yMax - viewBox.yMin)) {
          // Bisection root search
          let a = prevX, b = curX;
          for (let iter = 0; iter < 8; iter++) {
            const mid = (a + b) / 2;
            const yMid = fn(mid);
            if (prevY * yMid <= 0) { b = mid; } else { a = mid; }
          }
          const rootX = (a + b) / 2;
          const rootY = fn(rootX);
          if (Number.isFinite(rootX) && Math.abs(rootY) < 0.1) {
            points.push({
              x: rootX,
              y: 0,
              type: "root",
              label: `(${formatCoordinate(rootX)}, 0)`,
              equationId: eq.id,
              color: eq.color,
            });
          }
        }

        // Extrema: slope sign change
        const slope = (curY - prevY) / step;
        if (Number.isFinite(prevSlope) && prevSlope * slope < 0 && Math.abs(slope - prevSlope) < 50) {
          const extX = (prevX + curX) / 2;
          const extY = fn(extX);
          if (Number.isFinite(extY) && extY >= viewBox.yMin && extY <= viewBox.yMax) {
            points.push({
              x: extX,
              y: extY,
              type: prevSlope > 0 ? "max" : "min",
              label: `(${formatCoordinate(extX)}, ${formatCoordinate(extY)})`,
              equationId: eq.id,
              color: eq.color,
            });
          }
        }

        prevSlope = slope;
        prevX = curX;
        prevY = curY;
      }
    });

    return points.slice(0, 20); // Limit to avoid screen clutter
  }, [equations, viewBox, width, height]);

  // Paths rendering
  const { renderedPaths, inequalityRegions } = useMemo(() => {
    if (width === 0 || height === 0) return { renderedPaths: [], inequalityRegions: [] };

    const renderedPaths: { id: number; d: string; color: string; isDashed?: boolean }[] = [];
    const inequalityRegions: { id: number; d: string; color: string }[] = [];

    const rangeX = viewBox.xMax - viewBox.xMin;
    const rangeY = viewBox.yMax - viewBox.yMin;

    equations.filter((e) => e.visible && !e.error).forEach((eq) => {
      // 1. Vertical Line x = c
      if (eq.type === "vertical" && eq.xVal !== undefined) {
        const sx = tx(eq.xVal);
        renderedPaths.push({
          id: eq.id,
          d: `M ${sx} 0 L ${sx} ${height}`,
          color: eq.color,
        });
        return;
      }

      // 2. Explicit Function or Inequality curve
      if ((eq.type === "explicit" || eq.type === "inequality") && eq.fn) {
        const fn = eq.fn as (x: number) => number;
        const pts: string[] = [];
        const ineqPts: { x: number; y: number }[] = [];
        let cont = false;
        let prevY = NaN;

        for (let i = 0; i <= width; i++) {
          const x = viewBox.xMin + (i / width) * rangeX;
          try {
            const y = fn(x);
            if (Number.isFinite(y)) {
              const sy = ty(y);

              // Asymptote discontinuity check (e.g. tan(x), 1/x)
              let isAsymptote = false;
              if (Number.isFinite(prevY) && Math.abs(y - prevY) > rangeY * 0.4) {
                // Check midpoint
                const midX = x - (0.5 / width) * rangeX;
                const midY = fn(midX);
                if (!Number.isFinite(midY) || Math.abs(midY - prevY) > rangeY * 0.5) {
                  isAsymptote = true;
                }
              }

              if (isAsymptote) {
                cont = false;
              }

              if (sy >= -height * 1.5 && sy <= height * 2.5) {
                pts.push(cont ? `L ${i} ${sy}` : `M ${i} ${sy}`);
                cont = true;
                if (eq.type === "inequality") ineqPts.push({ x: i, y: sy });
              } else {
                cont = false;
              }
              prevY = y;
            } else {
              cont = false;
              prevY = NaN;
            }
          } catch {
            cont = false;
            prevY = NaN;
          }
        }

        renderedPaths.push({
          id: eq.id,
          d: pts.join(" "),
          color: eq.color,
          isDashed: eq.inequalityOp === "<" || eq.inequalityOp === ">",
        });

        // Generate polygon for inequality shading
        if (eq.type === "inequality" && ineqPts.length > 1) {
          const isLess = eq.inequalityOp === "<" || eq.inequalityOp === "<=";
          const baselineY = isLess ? height : 0;
          const first = ineqPts[0];
          const last = ineqPts[ineqPts.length - 1];

          const poly = [
            `M ${first.x} ${baselineY}`,
            `L ${first.x} ${first.y}`,
            ...ineqPts.map((p) => `L ${p.x} ${p.y}`),
            `L ${last.x} ${baselineY}`,
            "Z",
          ].join(" ");

          inequalityRegions.push({ id: eq.id, d: poly, color: eq.color });
        }
        return;
      }

      // 3. Implicit Equation: Marching Squares with smooth 60fps adaptive grid
      if (eq.type === "implicit" && eq.fn) {
        const fn = eq.fn as (x: number, y: number) => number;
        const segs: string[] = [];
        // Adaptive resolution: 140 grid gives crisp curves with instantaneous evaluations
        const res = Math.min(140, Math.max(80, Math.floor(width / 6)));
        const stepX = rangeX / res;
        const stepY = rangeY / res;

        const v: number[][] = Array.from({ length: res + 1 }, (_, i) =>
          Array.from({ length: res + 1 }, (__, j) => {
            try {
              return fn(viewBox.xMin + i * stepX, viewBox.yMin + j * stepY);
            } catch {
              return NaN;
            }
          }),
        );

        const safeInterp = (a: number, b: number) => {
          const diff = a - b;
          if (Math.abs(diff) < 1e-12) return 0.5;
          const t = a / diff;
          return Math.max(0, Math.min(1, t));
        };

        for (let i = 0; i < res; i++) {
          for (let j = 0; j < res; j++) {
            const corners = [v[i][j], v[i + 1][j], v[i + 1][j + 1], v[i][j + 1]];
            if (corners.some((val) => !Number.isFinite(val))) continue;
            let idx = 0;
            if (corners[0] > 0) idx |= 1;
            if (corners[1] > 0) idx |= 2;
            if (corners[2] > 0) idx |= 4;
            if (corners[3] > 0) idx |= 8;
            if (idx === 0 || idx === 15) continue;

            const x0c = viewBox.xMin + i * stepX;
            const y0c = viewBox.yMin + j * stepY;

            const p = [
              { x: x0c + stepX * safeInterp(corners[0], corners[1]), y: y0c },
              { x: x0c + stepX, y: y0c + stepY * safeInterp(corners[1], corners[2]) },
              { x: x0c + stepX * (1 - safeInterp(corners[2], corners[3])), y: y0c + stepY },
              { x: x0c, y: y0c + stepY * safeInterp(corners[0], corners[3]) },
            ];

            const seg = (a: typeof p[0], b: typeof p[0]) =>
              `M ${tx(a.x)} ${ty(a.y)} L ${tx(b.x)} ${ty(b.y)}`;

            switch (idx) {
              case 1: case 14: segs.push(seg(p[3], p[0])); break;
              case 2: case 13: segs.push(seg(p[0], p[1])); break;
              case 3: case 12: segs.push(seg(p[3], p[1])); break;
              case 4: case 11: segs.push(seg(p[1], p[2])); break;
              case 5: segs.push(seg(p[3], p[0]), seg(p[1], p[2])); break;
              case 6: case 9: segs.push(seg(p[0], p[2])); break;
              case 7: case 8: segs.push(seg(p[3], p[2])); break;
              case 10: segs.push(seg(p[0], p[1]), seg(p[3], p[2])); break;
            }
          }
        }

        renderedPaths.push({
          id: eq.id,
          d: segs.join(" "),
          color: eq.color,
        });
      }
    });

    return { renderedPaths, inequalityRegions };
  }, [equations, viewBox, width, height, tx, ty]);

  // Interactive curve tracing on pointer move
  const handlePointerMove = (e: React.MouseEvent<SVGSVGElement>) => {
    onMouseMove(e);
    if (!svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const wx = invTx(sx);

    // Find active or first visible explicit equation
    const candidate =
      equations.find((eq) => eq.id === activeEqId && eq.visible && eq.fn && eq.type === "explicit") ||
      equations.find((eq) => eq.visible && eq.fn && eq.type === "explicit");

    if (candidate && candidate.fn) {
      try {
        const wy = (candidate.fn as (x: number) => number)(wx);
        if (Number.isFinite(wy)) {
          const sy = ty(wy);
          if (sy >= 0 && sy <= height) {
            setHoverCoord({ x: wx, y: wy, sx, sy, color: candidate.color });
            return;
          }
        }
      } catch { /* ignore */ }
    }
    setHoverCoord(null);
  };

  const handlePointerLeave = (e: React.MouseEvent<SVGSVGElement>) => {
    onMouseLeave(e);
    setHoverCoord(null);
    setSelectedKeyPoint(null);
  };

  const visibleEquations = equations.filter((e) => e.visible && !e.error);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full touch-none select-none"
        style={{ cursor: "crosshair" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={handlePointerMove}
        onMouseUp={onMouseUp}
        onMouseLeave={handlePointerLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <defs>
          {/* Subtle grid pattern / gradients */}
          <radialGradient id="graphGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient center background glow */}
        <rect width={width} height={height} fill="url(#graphGlow)" />

        {/* Minor grid lines */}
        {isGridVisible &&
          minorLines.map((l, i) => (
            <line
              key={`minor-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="0.5"
            />
          ))}

        {/* Major grid lines & Axes */}
        {isGridVisible &&
          majorLines.map((l, i) => (
            <line
              key={`major-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={l.isAxis ? "rgba(255, 255, 255, 0.45)" : "rgba(255, 255, 255, 0.12)"}
              strokeWidth={l.isAxis ? 1.5 : 0.8}
            />
          ))}

        {/* Inequality Shaded Regions */}
        {inequalityRegions.map((r) => (
          <path
            key={`ineq-${r.id}`}
            d={r.d}
            fill={r.color}
            fillOpacity="0.18"
            stroke="none"
          />
        ))}

        {/* Curve Paths */}
        {renderedPaths.map((p) => (
          <path
            key={`path-${p.id}`}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth="2.5"
            strokeDasharray={p.isDashed ? "6 4" : undefined}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Key Points: Roots, Y-Intercepts, Extrema, Points */}
        {keyPoints.map((kp, idx) => {
          const sx = tx(kp.x);
          const sy = ty(kp.y);
          if (sx < -10 || sx > width + 10 || sy < -10 || sy > height + 10) return null;

          const isHovered = selectedKeyPoint === kp;

          return (
            <g
              key={`kp-${idx}`}
              className="cursor-pointer"
              onMouseEnter={() => setSelectedKeyPoint(kp)}
              onClick={() => setSelectedKeyPoint(kp)}
            >
              {/* Outer halo */}
              <circle
                cx={sx}
                cy={sy}
                r={isHovered ? 8 : 4.5}
                fill={kp.color}
                fillOpacity={isHovered ? 0.35 : 0.2}
                className="transition-all"
              />
              {/* Inner core */}
              <circle
                cx={sx}
                cy={sy}
                r={isHovered ? 4.5 : 3}
                fill={kp.color}
                stroke="#000"
                strokeWidth="1.5"
              />
              {/* Coordinate label tooltip */}
              {isHovered && (
                <g transform={`translate(${sx}, ${sy - 12})`}>
                  <rect
                    x="-42"
                    y="-22"
                    width="84"
                    height="20"
                    rx="6"
                    fill="rgba(10, 10, 15, 0.9)"
                    stroke={kp.color}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="-8"
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="11"
                    fontFamily="monospace"
                  >
                    {kp.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Interactive Tracing Crosshair & Glow Point */}
        {hoverCoord && (
          <g>
            {/* Dashed guidelines to axes */}
            <line
              x1={hoverCoord.sx}
              y1={0}
              x2={hoverCoord.sx}
              y2={height}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeDasharray="4 4"
            />
            <line
              x1={0}
              y1={hoverCoord.sy}
              x2={width}
              y2={hoverCoord.sy}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeDasharray="4 4"
            />
            {/* Snap point */}
            <circle
              cx={hoverCoord.sx}
              cy={hoverCoord.sy}
              r="6"
              fill={hoverCoord.color}
              stroke="#fff"
              strokeWidth="2"
              className="shadow-lg animate-pulse"
            />
            {/* Coordinate tooltip */}
            <g
              transform={`translate(${Math.max(60, Math.min(width - 60, hoverCoord.sx))}, ${
                hoverCoord.sy < 40 ? hoverCoord.sy + 28 : hoverCoord.sy - 16
              })`}
            >
              <rect
                x="-55"
                y="-14"
                width="110"
                height="24"
                rx="8"
                fill="rgba(5, 5, 12, 0.92)"
                stroke={hoverCoord.color}
                strokeWidth="1.5"
                className="shadow-xl"
              />
              <text
                x="0"
                y="2"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
              >
                ({formatCoordinate(hoverCoord.x)}, {formatCoordinate(hoverCoord.y)})
              </text>
            </g>
          </g>
        )}

        {/* Sticky Grid Tick Labels */}
        {isGridVisible &&
          xLabels.map((l, i) => (
            <text
              key={`xl-${i}`}
              x={l.x}
              y={l.y}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.65)"
              fontSize="10"
              fontFamily="monospace"
              className="select-none pointer-events-none"
            >
              {l.text}
            </text>
          ))}

        {isGridVisible &&
          yLabels.map((l, i) => (
            <text
              key={`yl-${i}`}
              x={l.x}
              y={l.y}
              fill="rgba(255, 255, 255, 0.65)"
              fontSize="10"
              fontFamily="monospace"
              className="select-none pointer-events-none"
            >
              {l.text}
            </text>
          ))}

        {/* Origin (0, 0) indicator */}
        {isGridVisible &&
          origin.x >= 0 &&
          origin.x <= width &&
          origin.y >= 0 &&
          origin.y <= height && (
            <text
              x={origin.x - 12}
              y={origin.y + 14}
              fill="rgba(255, 255, 255, 0.5)"
              fontSize="10"
              fontFamily="monospace"
              className="select-none pointer-events-none"
            >
              0
            </text>
          )}
      </svg>

      {/* Floating Legend in Top-Right (never collides with left sidebar) */}
      {visibleEquations.length > 0 && (
        <div className="absolute top-3 right-3 max-w-[220px] pointer-events-none hidden sm:flex flex-col gap-1 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg">
          {visibleEquations.slice(0, 5).map((eq) => (
            <div key={eq.id} className="flex items-center gap-2 overflow-hidden">
              <span
                className="w-3 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: eq.color }}
              />
              <span className="text-[11px] font-mono text-white/80 truncate">
                {eq.text}
              </span>
            </div>
          ))}
          {visibleEquations.length > 5 && (
            <span className="text-[9px] font-mono text-white/40">
              +{visibleEquations.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
