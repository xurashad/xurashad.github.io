"use client";

import {
  useState, useRef, useCallback, useEffect,
} from "react";
import {
  ZoomIn, ZoomOut, Home, Download, Grid, Keyboard, Layers,
} from "lucide-react";
import { GraphCanvas } from "./GraphCanvas";
import { EquationSidebar } from "./EquationSidebar";
import { MathKeypad } from "./MathKeypad";
import {
  COLORS, INITIAL_VIEWBOX, parseEquation,
  type Equation, type ViewBox,
} from "./lib/types";

const INITIAL_EQ_TEXTS = ["y = sin(x)", "x^2 + y^2 = 25", "y = x^2 - 4"];

function getSlidersMap(eqs: Equation[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const eq of eqs) {
    if (eq.type === "slider" && eq.slider && eq.visible) {
      map[eq.slider.name] = eq.slider.value;
    }
  }
  return map;
}

function makeEquation(text: string, id: number, sliders?: Record<string, number>): Equation {
  const parsed = parseEquation(text, sliders);
  return {
    id,
    text,
    color: COLORS[(id - 1) % COLORS.length],
    visible: true,
    ...parsed,
  };
}

export function GraphingCalculator() {
  const [equations, setEquations] = useState<Equation[]>(() =>
    INITIAL_EQ_TEXTS.map((t, i) => makeEquation(t, i + 1)),
  );
  const [nextId, setNextId] = useState(INITIAL_EQ_TEXTS.length + 1);
  const [activeEqId, setActiveEqId] = useState<number | null>(1);
  const [viewBox, setViewBox] = useState<ViewBox>(INITIAL_VIEWBOX);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pinchDist = useRef<number | null>(null);

  const isMobile = dims.width > 0 && dims.width < 768;

  // Measure container dimensions safely with ResizeObserver
  const hasInitializedMobile = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          const w = Math.round(width);
          const h = Math.round(height);
          setDims((prev) => {
            if (prev.width === w && prev.height === h) return prev;
            return { width: w, height: h };
          });

          if (!hasInitializedMobile.current) {
            hasInitializedMobile.current = true;
            if (w < 768) {
              setIsSidebarOpen(false);
            }
          }

          setViewBox((v) => {
            const curWidth = Math.max(0, w - (w >= 768 && isSidebarOpen ? 320 : 0));
            const targetRatio = curWidth / h;
            const xRange = v.xMax - v.xMin;
            const yRange = v.yMax - v.yMin;
            if (Math.abs(xRange / yRange - targetRatio) > 1e-4) {
              const cx = (v.xMin + v.xMax) / 2;
              const newX = yRange * targetRatio;
              return { ...v, xMin: cx - newX / 2, xMax: cx + newX / 2 };
            }
            return v;
          });
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [isSidebarOpen]);

  // Close export menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Actual visible canvas width (excluding desktop sidebar if open)
  const canvasWidth = !isMobile && isSidebarOpen ? Math.max(0, dims.width - 320) : dims.width;

  // Toggle sidebar and adjust aspect ratio
  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      if (!isMobile && dims.height > 0) {
        const nextWidth = Math.max(0, dims.width - (next ? 320 : 0));
        const targetRatio = nextWidth / dims.height;
        setViewBox((v) => {
          const xRange = v.xMax - v.xMin;
          const yRange = v.yMax - v.yMin;
          if (Math.abs(xRange / yRange - targetRatio) > 1e-4) {
            const cx = (v.xMin + v.xMax) / 2;
            const newX = yRange * targetRatio;
            return { ...v, xMin: cx - newX / 2, xMax: cx + newX / 2 };
          }
          return v;
        });
      }
      return next;
    });
  }, [isMobile, dims.width, dims.height]);

  // Slider animation loop (only runs when playing sliders exist)
  useEffect(() => {
    const hasPlaying = equations.some((e) => e.type === "slider" && e.slider?.isPlaying);
    if (!hasPlaying) return;

    const interval = setInterval(() => {
      setEquations((prev) => {
        let changed = false;
        const updated = prev.map((eq) => {
          if (eq.type === "slider" && eq.slider?.isPlaying) {
            changed = true;
            const { min, max, step, value } = eq.slider;
            let nextVal = value + step * 2;
            if (nextVal > max) nextVal = min;
            return {
              ...eq,
              slider: { ...eq.slider, value: nextVal },
            };
          }
          return eq;
        });

        if (!changed) return prev;

        const newSliders = getSlidersMap(updated);
        return updated.map((eq) => {
          if (eq.type === "slider") return eq;
          const parsed = parseEquation(eq.text, newSliders);
          return { ...eq, ...parsed };
        });
      });
    }, 50);

    return () => clearInterval(interval);
  }, [equations]);

  /* ── Equation CRUD ──────────────────────────────────────────────────────── */
  const addEquation = useCallback((text: string) => {
    setEquations((prev) => {
      const sliders = getSlidersMap(prev);
      const newEq = makeEquation(text, nextId, sliders);
      const nextList = [...prev, newEq];
      if (newEq.type === "slider") {
        const updatedSliders = getSlidersMap(nextList);
        return nextList.map((eq) => {
          if (eq.type === "slider") return eq;
          const parsed = parseEquation(eq.text, updatedSliders);
          return { ...eq, ...parsed };
        });
      }
      return nextList;
    });
    setActiveEqId(nextId);
    setNextId((n) => n + 1);
  }, [nextId]);

  const removeEquation = useCallback((id: number) => {
    setEquations((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      const sliders = getSlidersMap(filtered);
      return filtered.map((eq) => {
        if (eq.type === "slider") return eq;
        const parsed = parseEquation(eq.text, sliders);
        return { ...eq, ...parsed };
      });
    });
    if (activeEqId === id) setActiveEqId(null);
  }, [activeEqId]);

  const duplicateEquation = useCallback((id: number) => {
    setEquations((prev) => {
      const source = prev.find((e) => e.id === id);
      if (!source) return prev;
      const sliders = getSlidersMap(prev);
      const duplicated = makeEquation(source.text, nextId, sliders);
      return [...prev, duplicated];
    });
    setActiveEqId(nextId);
    setNextId((n) => n + 1);
  }, [nextId]);

  const updateText = useCallback((id: number, text: string) => {
    setEquations((prev) => {
      const sliders = getSlidersMap(prev);
      const updated = prev.map((e) => {
        if (e.id !== id) return e;
        const parsed = parseEquation(text, sliders);
        return { ...e, text, ...parsed };
      });

      const newSliders = getSlidersMap(updated);
      return updated.map((eq) => {
        if (eq.type === "slider") return eq;
        const parsed = parseEquation(eq.text, newSliders);
        return { ...eq, ...parsed };
      });
    });
  }, []);

  const updateColor = useCallback((id: number, color: string) => {
    setEquations((prev) => prev.map((e) => (e.id === id ? { ...e, color } : e)));
  }, []);

  const toggleVisible = useCallback((id: number) => {
    setEquations((prev) => {
      const updated = prev.map((e) => (e.id === id ? { ...e, visible: !e.visible } : e));
      const sliders = getSlidersMap(updated);
      return updated.map((eq) => {
        if (eq.type === "slider") return eq;
        const parsed = parseEquation(eq.text, sliders);
        return { ...eq, ...parsed };
      });
    });
  }, []);

  const updateSlider = useCallback((id: number, value: number) => {
    setEquations((prev) => {
      const updated = prev.map((e) =>
        e.id === id && e.slider
          ? { ...e, slider: { ...e.slider, value } }
          : e,
      );
      const sliders = getSlidersMap(updated);
      return updated.map((eq) => {
        if (eq.type === "slider") return eq;
        const parsed = parseEquation(eq.text, sliders);
        return { ...eq, ...parsed };
      });
    });
  }, []);

  const toggleSliderPlay = useCallback((id: number) => {
    setEquations((prev) =>
      prev.map((e) =>
        e.id === id && e.slider
          ? { ...e, slider: { ...e.slider, isPlaying: !e.slider.isPlaying } }
          : e,
      ),
    );
  }, []);

  /* ── Math Keypad Handlers ───────────────────────────────────────────────── */
  const handleKeypadInsert = useCallback((char: string) => {
    if (!activeEqId) {
      if (equations.length > 0) {
        setActiveEqId(equations[0].id);
        updateText(equations[0].id, equations[0].text + char);
      } else {
        addEquation(char);
      }
      return;
    }
    const target = equations.find((e) => e.id === activeEqId);
    if (target) {
      updateText(activeEqId, target.text + char);
    }
  }, [activeEqId, equations, updateText, addEquation]);

  const handleKeypadBackspace = useCallback(() => {
    if (!activeEqId) return;
    const target = equations.find((e) => e.id === activeEqId);
    if (target && target.text.length > 0) {
      updateText(activeEqId, target.text.slice(0, -1));
    }
  }, [activeEqId, equations, updateText]);

  const handleKeypadClear = useCallback(() => {
    if (!activeEqId) return;
    updateText(activeEqId, "");
  }, [activeEqId, updateText]);

  /* ── Pan & Zoom ─────────────────────────────────────────────────────────── */
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

  const clientToWorld = useCallback((cx: number, cy: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { wx: 0, wy: 0 };
    return {
      wx: viewBox.xMin + ((cx - r.left) / r.width) * (viewBox.xMax - viewBox.xMin),
      wy: viewBox.yMin + (1 - (cy - r.top) / r.height) * (viewBox.yMax - viewBox.yMin),
    };
  }, [viewBox]);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const { wx, wy } = clientToWorld(e.clientX, e.clientY);
    zoom(e.deltaY < 0 ? 0.85 : 1.15, wx, wy);
  }, [clientToWorld, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isPanning.current || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const xRange = viewBox.xMax - viewBox.xMin;
    const yRange = viewBox.yMax - viewBox.yMin;
    const dx = ((e.clientX - panStart.current.x) / r.width) * xRange;
    const dy = ((e.clientY - panStart.current.y) / r.height) * yRange;
    panStart.current = { x: e.clientX, y: e.clientY };
    setViewBox((v) => ({
      xMin: v.xMin - dx,
      xMax: v.xMax - dx,
      yMin: v.yMin + dy,
      yMax: v.yMax + dy,
    }));
  }, [viewBox]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  /* Touch support: 1-finger pan, 2-finger pinch zoom */
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
    if (e.touches.length === 1 && isPanning.current && svgRef.current) {
      const r = svgRef.current.getBoundingClientRect();
      const xRange = viewBox.xMax - viewBox.xMin;
      const yRange = viewBox.yMax - viewBox.yMin;
      const dx = ((e.touches[0].clientX - panStart.current.x) / r.width) * xRange;
      const dy = ((e.touches[0].clientY - panStart.current.y) / r.height) * yRange;
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setViewBox((v) => ({
        xMin: v.xMin - dx,
        xMax: v.xMax - dx,
        yMin: v.yMin + dy,
        yMax: v.yMax + dy,
      }));
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
  }, [viewBox, clientToWorld, zoom]);

  const handleTouchEnd = useCallback(() => {
    isPanning.current = false;
    pinchDist.current = null;
  }, []);

  /* ── Export functions ───────────────────────────────────────────────────── */
  const exportSVG = () => {
    if (!svgRef.current) return;
    const node = svgRef.current.cloneNode(true) as SVGSVGElement;
    node.removeAttribute("style");
    node.setAttribute("width", String(canvasWidth));
    node.setAttribute("height", String(dims.height));
    node.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const s = new XMLSerializer().serializeToString(node);
    if (!s) return;
    const blob = new Blob([s], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "desmos-graph.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  };

  const exportPNG = () => {
    if (!svgRef.current) return;
    const { width, height } = svgRef.current.getBoundingClientRect();
    const node = svgRef.current.cloneNode(true) as SVGSVGElement;
    node.removeAttribute("style");
    node.setAttribute("width", String(canvasWidth));
    node.setAttribute("height", String(dims.height));
    node.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const s = new XMLSerializer().serializeToString(node);
    if (!s) return;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#050510";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "desmos-graph.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsExportOpen(false);
    };
    img.src = url;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-void rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
      style={{
        height: isMobile ? "calc(100vh - 200px)" : "calc(100vh - 240px)",
        minHeight: isMobile ? 480 : 560,
      }}
    >
      {/* Mobile Top Navigation Bar */}
      {isMobile && (
        <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between pointer-events-none">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-white shadow-lg active:scale-95 transition-all"
            aria-label="Open Expressions"
          >
            <Layers size={14} className="text-quantum" />
            <span className="text-xs font-semibold">Expressions</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/15 text-white/80">
              {equations.length}
            </span>
          </button>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              onClick={() => setIsKeypadOpen((k) => !k)}
              className={`p-2 rounded-xl backdrop-blur-md border shadow-lg transition-all ${
                isKeypadOpen
                  ? "bg-quantum text-black border-quantum"
                  : "bg-black/75 text-white/80 border-white/15"
              }`}
              title="Toggle Keypad"
              aria-label="Toggle Keypad"
            >
              <Keyboard size={16} />
            </button>
            <button
              onClick={() => setViewBox(INITIAL_VIEWBOX)}
              className="p-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-white/80 shadow-lg active:scale-95 transition-all"
              title="Reset View"
              aria-label="Reset View"
            >
              <Home size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Equations Sidebar / Mobile Drawer */}
      <EquationSidebar
        equations={equations}
        activeEqId={activeEqId}
        onSetActiveEqId={setActiveEqId}
        onAdd={addEquation}
        onRemove={removeEquation}
        onDuplicate={duplicateEquation}
        onUpdateText={updateText}
        onUpdateColor={updateColor}
        onToggleVisible={toggleVisible}
        onUpdateSlider={updateSlider}
        onToggleSliderPlay={toggleSliderPlay}
        isOpen={isSidebarOpen}
        onToggle={handleToggleSidebar}
        isMobile={isMobile}
        onOpenKeypad={() => setIsKeypadOpen(true)}
      />

      {/* Graph SVG Canvas */}
      <div
        className="w-full h-full"
        style={{
          marginLeft: !isMobile && isSidebarOpen ? 320 : 0,
          width: !isMobile && isSidebarOpen ? "calc(100% - 320px)" : "100%",
          transition: "all 0.3s ease-in-out",
        }}
      >
        <GraphCanvas
          equations={equations}
          viewBox={viewBox}
          svgRef={svgRef}
          isGridVisible={isGridVisible}
          width={canvasWidth}
          height={dims.height}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          activeEqId={activeEqId}
        />
      </div>

      {/* Floating Toolbar — Bottom Right */}
      <div
        className="absolute bottom-3 right-3 z-20 flex flex-col items-end gap-2"
        ref={exportMenuRef}
      >
        {/* Export Dropdown Menu */}
        {isExportOpen && (
          <div className="bg-black/90 backdrop-blur-xl rounded-xl border border-white/15 p-1.5 flex flex-col gap-1 shadow-2xl min-w-40 animate-in fade-in zoom-in-95">
            <button
              onClick={exportPNG}
              className="text-left text-xs px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all flex items-center justify-between"
            >
              <span>Export PNG (High-Res)</span>
              <span className="text-[10px] font-mono text-white/40">2×</span>
            </button>
            <button
              onClick={exportSVG}
              className="text-left text-xs px-3 py-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all flex items-center justify-between"
            >
              <span>Export SVG (Vector)</span>
              <span className="text-[10px] font-mono text-white/40">svg</span>
            </button>
          </div>
        )}

        {/* Toolbar Pills */}
        <div className="flex flex-col gap-1 p-1 bg-black/75 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl">
          <button
            onClick={() => zoom(0.8)}
            className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => zoom(1.25)}
            className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={() => setViewBox(INITIAL_VIEWBOX)}
            className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            aria-label="Reset view to origin"
            title="Reset View (Home)"
          >
            <Home size={18} />
          </button>

          <div className="w-full h-px bg-white/10 my-0.5" />

          {/* Desktop Keypad Toggle */}
          {!isMobile && (
            <button
              onClick={() => setIsKeypadOpen((k) => !k)}
              className={`p-2 rounded-xl transition-all ${
                isKeypadOpen
                  ? "bg-quantum text-black font-semibold shadow-md"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              aria-label="Toggle Virtual Math Keypad"
              title="Virtual Math Keypad"
            >
              <Keyboard size={18} />
            </button>
          )}

          {/* Grid Toggle */}
          <button
            onClick={() => setIsGridVisible((g) => !g)}
            className={`p-2 rounded-xl transition-all ${
              isGridVisible
                ? "bg-quantum/20 text-quantum"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            aria-label="Toggle Grid"
            title="Toggle Grid Lines"
          >
            <Grid size={18} />
          </button>

          {/* Export Button */}
          <button
            onClick={() => setIsExportOpen((o) => !o)}
            className="p-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all"
            aria-label="Export graph"
            title="Export Graph Image"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Virtual Math Keypad (Desmos style dockable keyboard) */}
      <MathKeypad
        isOpen={isKeypadOpen}
        onClose={() => setIsKeypadOpen(false)}
        onInsert={handleKeypadInsert}
        onBackspace={handleKeypadBackspace}
        onClear={handleKeypadClear}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
      />
    </div>
  );
}
