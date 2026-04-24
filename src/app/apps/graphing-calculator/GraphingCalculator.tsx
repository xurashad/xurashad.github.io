"use client";

import {
  useState, useRef, useCallback, useEffect, useRef as useRefAlias,
} from "react";
import {
  ZoomIn, ZoomOut, Home, Download, Grid,
} from "lucide-react";
import { GraphCanvas } from "./GraphCanvas";
import { EquationSidebar } from "./EquationSidebar";
import {
  COLORS, INITIAL_VIEWBOX, parseEquation,
  type Equation, type ViewBox,
} from "./lib/types";

const INITIAL_EQ_TEXTS = ["sin(x)", "x^2 + y^2 = 9"];

/* ── helpers ──────────────────────────────────────────────────────────────── */
function makeEquation(text: string, id: number): Equation {
  const { fn, error, type } = parseEquation(text);
  return { id, text, color: COLORS[(id - 1) % COLORS.length], fn, error, type };
}

/* ── main calculator ─────────────────────────────────────────────────────── */
export function GraphingCalculator() {
  const [equations, setEquations] = useState<Equation[]>(() =>
    INITIAL_EQ_TEXTS.map((t, i) => makeEquation(t, i + 1)),
  );
  const [nextId, setNextId] = useState(INITIAL_EQ_TEXTS.length + 1);
  const [viewBox, setViewBox] = useState<ViewBox>(INITIAL_VIEWBOX);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pinchDist = useRef<number | null>(null);

  /* Close export menu on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Maintain aspect ratio when canvas resizes */
  useEffect(() => {
    if (!dims.width || !dims.height) return;
    const xRange = viewBox.xMax - viewBox.xMin;
    const yRange = viewBox.yMax - viewBox.yMin;
    const targetRatio = dims.width / dims.height;
    if (Math.abs(xRange / yRange - targetRatio) > 1e-4) {
      const cx = (viewBox.xMin + viewBox.xMax) / 2;
      const newX = yRange * targetRatio;
      setViewBox((v) => ({ ...v, xMin: cx - newX / 2, xMax: cx + newX / 2 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims]);

  /* ── equation CRUD ──────────────────────────────────────────────────────── */
  const addEquation = useCallback((text: string) => {
    setEquations((prev) => [...prev, makeEquation(text, nextId)]);
    setNextId((n) => n + 1);
  }, [nextId]);

  const removeEquation = useCallback((id: number) => {
    setEquations((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const updateText = useCallback((id: number, text: string) => {
    const { fn, error, type } = parseEquation(text);
    setEquations((prev) =>
      prev.map((e) => e.id === id ? { ...e, text, fn, error, type } : e),
    );
  }, []);

  const updateColor = useCallback((id: number, color: string) => {
    setEquations((prev) => prev.map((e) => e.id === id ? { ...e, color } : e));
  }, []);

  /* ── pan / zoom ─────────────────────────────────────────────────────────── */
  const zoom = useCallback((factor: number, cx?: number, cy?: number) => {
    setViewBox((v) => {
      const px = cx ?? (v.xMin + v.xMax) / 2;
      const py = cy ?? (v.yMin + v.yMax) / 2;
      return {
        xMin: px - (px - v.xMin) * factor,
        xMax: px + (v.xMax - px) * factor,
        yMin: py - (py - v.yMin) * factor,
        yMax: py + (v.yMax - py) * factor,
      };
    });
  }, []);

  const svgCoords = (clientX: number, clientY: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return null;
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const clientToWorld = (cx: number, cy: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { wx: 0, wy: 0 };
    return {
      wx: viewBox.xMin + (cx - r.left) / r.width * (viewBox.xMax - viewBox.xMin),
      wy: viewBox.yMin + (1 - (cy - r.top) / r.height) * (viewBox.yMax - viewBox.yMin),
    };
  };

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const { wx, wy } = clientToWorld(e.clientX, e.clientY);
    zoom(e.deltaY < 0 ? 0.85 : 1.15, wx, wy);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewBox, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as SVGSVGElement).style.cursor = "grabbing";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning.current || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const xRange = viewBox.xMax - viewBox.xMin;
    const yRange = viewBox.yMax - viewBox.yMin;
    const dx = (e.clientX - panStart.current.x) / r.width * xRange;
    const dy = (e.clientY - panStart.current.y) / r.height * yRange;
    panStart.current = { x: e.clientX, y: e.clientY };
    setViewBox((v) => ({ xMin: v.xMin - dx, xMax: v.xMax - dx, yMin: v.yMin + dy, yMax: v.yMax + dy }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewBox]);

  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    isPanning.current = false;
    (e.currentTarget as SVGSVGElement).style.cursor = "grab";
  }, []);

  /* Touch support */
  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      isPanning.current = true;
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      isPanning.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDist.current = Math.hypot(dx, dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (e.touches.length === 1 && isPanning.current && svgRef.current) {
      const r = svgRef.current.getBoundingClientRect();
      const xRange = viewBox.xMax - viewBox.xMin;
      const yRange = viewBox.yMax - viewBox.yMin;
      const dx = (e.touches[0].clientX - panStart.current.x) / r.width * xRange;
      const dy = (e.touches[0].clientY - panStart.current.y) / r.height * yRange;
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setViewBox((v) => ({ xMin: v.xMin - dx, xMax: v.xMax - dx, yMin: v.yMin + dy, yMax: v.yMax + dy }));
    } else if (e.touches.length === 2 && pinchDist.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const factor = pinchDist.current / newDist;
      pinchDist.current = newDist;
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const { wx, wy } = clientToWorld(mx, my);
      zoom(factor, wx, wy);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewBox, zoom]);

  const handleTouchEnd = useCallback(() => {
    isPanning.current = false;
    pinchDist.current = null;
  }, []);

  /* ── export ─────────────────────────────────────────────────────────────── */
  const getCleanSvg = () => {
    if (!svgRef.current) return null;
    const node = svgRef.current.cloneNode(true) as SVGSVGElement;
    node.removeAttribute("style");
    node.setAttribute("width", String(dims.width));
    node.setAttribute("height", String(dims.height));
    node.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(node);
  };

  const exportSVG = useCallback(() => {
    const s = getCleanSvg();
    if (!s) return;
    const blob = new Blob([s], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "graph.svg";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims]);

  const exportPNG = useCallback(() => {
    const s = getCleanSvg();
    if (!s || !svgRef.current) return;
    const { width, height } = svgRef.current.getBoundingClientRect();
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    const canvas = document.createElement("canvas");
    canvas.width = width * 2; canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = "graph.png";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setIsExportOpen(false);
    };
    img.src = url;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims]);

  return (
    <div className="relative w-full bg-black/40 rounded-2xl border border-white/8 overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: 480 }}>

      {/* Sidebar */}
      <EquationSidebar
        equations={equations}
        nextId={nextId}
        onAdd={addEquation}
        onRemove={removeEquation}
        onUpdateText={updateText}
        onUpdateColor={updateColor}
        onSetNextId={setNextId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((o) => !o)}
      />

      {/* Canvas */}
      <GraphCanvas
        equations={equations}
        viewBox={viewBox}
        svgRef={svgRef}
        isGridVisible={isGridVisible}
        onResize={setDims}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Controls — bottom-right */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2" ref={exportMenuRef}>
        {/* Export dropdown */}
        {isExportOpen && (
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-white/10 p-1.5 flex flex-col gap-1 shadow-xl min-w-36">
            <button onClick={exportPNG} className="text-left text-xs px-3 py-2 rounded-lg text-foreground/60 hover:bg-white/8 hover:text-foreground/90 transition-all">
              Export PNG (2×)
            </button>
            <button onClick={exportSVG} className="text-left text-xs px-3 py-2 rounded-lg text-foreground/60 hover:bg-white/8 hover:text-foreground/90 transition-all">
              Export SVG
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1.5 p-1.5 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-xl">
          <button onClick={() => zoom(0.8)} className="p-2 rounded-lg text-foreground/50 hover:bg-white/8 hover:text-foreground/90 transition-all" aria-label="Zoom in">
            <ZoomIn size={18} />
          </button>
          <button onClick={() => zoom(1.2)} className="p-2 rounded-lg text-foreground/50 hover:bg-white/8 hover:text-foreground/90 transition-all" aria-label="Zoom out">
            <ZoomOut size={18} />
          </button>
          <button onClick={() => setViewBox(INITIAL_VIEWBOX)} className="p-2 rounded-lg text-foreground/50 hover:bg-white/8 hover:text-foreground/90 transition-all" aria-label="Reset view">
            <Home size={18} />
          </button>
          <div className="w-full h-px bg-white/8" />
          <button
            onClick={() => setIsGridVisible((g) => !g)}
            className={`p-2 rounded-lg transition-all ${isGridVisible ? "bg-quantum/20 text-quantum" : "text-foreground/50 hover:bg-white/8 hover:text-foreground/90"}`}
            aria-label="Toggle grid"
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setIsExportOpen((o) => !o)}
            className="p-2 rounded-lg text-foreground/50 hover:bg-white/8 hover:text-foreground/90 transition-all"
            aria-label="Export graph"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
