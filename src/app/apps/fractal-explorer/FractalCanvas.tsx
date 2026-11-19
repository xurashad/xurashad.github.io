"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  complexSpanPerPixel,
  complexToScreen,
  computeAutoIterations,
  computeGridStep,
  fitBoxToCamera,
  panCamera,
  screenToComplex,
  zoomAtPoint,
} from "./lib/camera";
import { FRACTAL_FORMULAS } from "./lib/formulas";
import type {
  ActiveEngine,
  CameraState,
  FractalSettings,
  OrbitAnalysis,
  OverlaySettings,
  ToolMode,
} from "./lib/types";
import { WebGLFractalRenderer, canUseDS64 } from "./lib/webglRenderer";
import { CPUFloat64Engine } from "./lib/workerEngine";

export interface CanvasHandle {
  getActiveCanvas: () => HTMLCanvasElement | null;
  cancelRender: () => void;
  captureThumbnail: () => string | undefined;
  getActiveEngine: () => ActiveEngine;
}

interface Props {
  settings: FractalSettings;
  overlays: OverlaySettings;
  tool: ToolMode;
  orbitAnalysis: OrbitAnalysis | null;
  label?: string;
  onLiveCamera: (camera: CameraState) => void;
  onCommitCamera: (camera: CameraState) => void;
  onSmoothZoomTo: (camera: CameraState) => void;
  onShiftClick: (re: number, im: number) => void;
  onHoverComplex: (pt: { re: number; im: number } | null) => void;
  onTogglePinOrbit: (re: number, im: number) => void;
  onCancelAnimations: () => void;
  onStatsChange?: (stats: {
    activeEngine: ActiveEngine;
    renderMs: number;
    fps: number;
    effectiveIter: number;
    width: number;
    height: number;
    progress: number;
    busy: boolean;
  }) => void;
  onStatus?: (msg: string) => void;
}

export function resolveActiveEngine(
  settings: FractalSettings,
  glAvailable: boolean,
  ds64Available: boolean,
): ActiveEngine {
  const ds64Ok = ds64Available && canUseDS64(settings);
  if (settings.engine === "cpu-f64") return "cpu-f64";
  if (!glAvailable) return "cpu-f64";
  if (settings.engine === "gpu-f32") return "gpu-f32";
  if (settings.engine === "gpu-ds64") return ds64Ok ? "gpu-ds64" : "cpu-f64";

  // Auto threshold
  if (settings.camera.zoom < 3e4) return "gpu-f32";
  if (settings.camera.zoom < 5e10 && ds64Ok) return "gpu-ds64";
  return "cpu-f64";
}

function formatAxisTick(v: number): string {
  if (Math.abs(v) < 1e-13) return "0";
  if (Math.abs(v) >= 100 || Math.abs(v) < 1e-3) return v.toExponential(1);
  return parseFloat(v.toPrecision(5)).toString();
}

export const FractalCanvas = forwardRef<CanvasHandle, Props>(function FractalCanvas(
  {
    settings,
    overlays,
    tool,
    orbitAnalysis,
    label,
    onLiveCamera,
    onCommitCamera,
    onSmoothZoomTo,
    onShiftClick,
    onHoverComplex,
    onTogglePinOrbit,
    onCancelAnimations,
    onStatsChange,
    onStatus,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const glRendererRef = useRef<WebGLFractalRenderer | null>(null);
  const cpuEngineRef = useRef<CPUFloat64Engine | null>(null);

  const [size, setSize] = useState({ w: 0, h: 0, dpr: 1 });
  const sizeRef = useRef(size);

  const [glCaps, setGlCaps] = useState({ available: true, ds64: true });

  // CPU preview CSS transform during drag/wheel
  const [cpuVt, setCpuVt] = useState({ x: 0, y: 0, scale: 1 });
  const cpuVtRef = useRef({ x: 0, y: 0, scale: 1 });

  // Interactive gesture state
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const isPanningRef = useRef(false);
  const panAnchorRef = useRef({
    x: 0,
    y: 0,
    camera: settings.camera,
    vt: { x: 0, y: 0, scale: 1 },
    moved: false,
  });
  const pinchStartRef = useRef<{
    dist: number;
    midX: number;
    midY: number;
    camera: CameraState;
  } | null>(null);

  const [boxRect, setBoxRect] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const boxRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastWheelCamRef = useRef<CameraState | null>(null);
  const cpuRenderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fpsCounterRef = useRef({ lastTs: 0, emaFps: 60 });

  // Sync latest callbacks/props safely inside useEffect (React 19 strict-hooks compliant)
  const latestRef = useRef({
    settings,
    overlays,
    tool,
    onLiveCamera,
    onCommitCamera,
    onSmoothZoomTo,
    onShiftClick,
    onHoverComplex,
    onTogglePinOrbit,
    onCancelAnimations,
    onStatsChange,
    onStatus,
  });

  useEffect(() => {
    latestRef.current = {
      settings,
      overlays,
      tool,
      onLiveCamera,
      onCommitCamera,
      onSmoothZoomTo,
      onShiftClick,
      onHoverComplex,
      onTogglePinOrbit,
      onCancelAnimations,
      onStatsChange,
      onStatus,
    };
  });

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const activeEngine = useMemo(
    () => resolveActiveEngine(settings, glCaps.available, glCaps.ds64),
    [settings, glCaps],
  );
  const activeEngineRef = useRef<ActiveEngine>(activeEngine);
  useEffect(() => {
    activeEngineRef.current = activeEngine;
  }, [activeEngine]);

  useImperativeHandle(ref, () => ({
    getActiveCanvas: () =>
      activeEngineRef.current === "cpu-f64" ? cpuCanvasRef.current : glCanvasRef.current,
    cancelRender: () => {
      cpuEngineRef.current?.cancel();
      latestRef.current.onStatsChange?.({
        activeEngine: activeEngineRef.current,
        renderMs: 0,
        fps: fpsCounterRef.current.emaFps,
        effectiveIter: computeAutoIterations(
          latestRef.current.settings.maxIter,
          latestRef.current.settings.camera.zoom,
          latestRef.current.settings.autoIter,
        ),
        width: sizeRef.current.w,
        height: sizeRef.current.h,
        progress: 0,
        busy: false,
      });
      latestRef.current.onStatus?.("Render cancelled.");
    },
    captureThumbnail: () => {
      const src =
        activeEngineRef.current === "cpu-f64" ? cpuCanvasRef.current : glCanvasRef.current;
      if (!src || src.width === 0 || src.height === 0) return undefined;
      try {
        const thumb = document.createElement("canvas");
        thumb.width = 160;
        thumb.height = 100;
        const ctx = thumb.getContext("2d");
        if (!ctx) return undefined;
        ctx.drawImage(src, 0, 0, 160, 100);
        return thumb.toDataURL("image/jpeg", 0.72);
      } catch {
        return undefined;
      }
    },
    getActiveEngine: () => activeEngineRef.current,
  }));

  // ── Initialize Renderers once on mount ────────────────────────────────────
  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const cpuEngine = new CPUFloat64Engine();
    cpuEngineRef.current = cpuEngine;

    let renderer: WebGLFractalRenderer | null = null;
    if (glCanvas) {
      renderer = new WebGLFractalRenderer(glCanvas);
      glRendererRef.current = renderer;
      setGlCaps({
        available: renderer.isAvailable(),
        ds64: renderer.isDS64Available(),
      });
    }

    return () => {
      renderer?.dispose();
      cpuEngine.dispose();
      glRendererRef.current = null;
      cpuEngineRef.current = null;
    };
  }, []);

  // ── ResizeObserver with hysteresis ────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(0, Math.round(rect.width));
      const h = Math.max(0, Math.round(rect.height));
      const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      setSize(prev => {
        if (Math.abs(prev.w - w) <= 2 && Math.abs(prev.h - h) <= 2 && prev.dpr === dpr) {
          return prev;
        }
        return { w, h, dpr };
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Trigger GPU or CPU Render whenever settings / size / engine changes ──
  useEffect(() => {
    if (size.w < 4 || size.h < 4) return;
    const scaleMult = Math.min(size.dpr, settings.dprScale);
    const pxW = Math.max(4, Math.round(size.w * scaleMult));
    const pxH = Math.max(4, Math.round(size.h * scaleMult));

    if (activeEngine !== "cpu-f64") {
      cpuEngineRef.current?.cancel();
      const renderer = glRendererRef.current;
      if (renderer && renderer.isAvailable()) {
        const t0 = performance.now();
        const res = renderer.render(
          settings,
          pxW,
          pxH,
          activeEngine === "gpu-ds64" ? "ds64" : "f32",
        );
        const dt = performance.now() - t0;
        const now = performance.now();
        if (fpsCounterRef.current.lastTs > 0) {
          const frameDt = Math.max(1, now - fpsCounterRef.current.lastTs);
          const instFps = Math.min(120, 1000 / frameDt);
          fpsCounterRef.current.emaFps =
            fpsCounterRef.current.emaFps * 0.8 + instFps * 0.2;
        }
        fpsCounterRef.current.lastTs = now;

        if (res.ok) {
          setGlCaps(prev =>
            prev.ds64 !== renderer.isDS64Available()
              ? { ...prev, ds64: renderer.isDS64Available() }
              : prev,
          );
          onStatsChange?.({
            activeEngine,
            renderMs: dt,
            fps: fpsCounterRef.current.emaFps,
            effectiveIter: res.effectiveIter,
            width: pxW,
            height: pxH,
            progress: 1,
            busy: false,
          });
          return;
        }
      }
    }

    // CPU Float64 path (debounced slightly for smooth resize / typing)
    const cpuCanvas = cpuCanvasRef.current;
    const cpuEngine = cpuEngineRef.current;
    if (!cpuCanvas || !cpuEngine) return;

    setCpuVt({ x: 0, y: 0, scale: 1 });
    cpuVtRef.current = { x: 0, y: 0, scale: 1 };

    const effectiveIter = computeAutoIterations(
      settings.maxIter,
      settings.camera.zoom,
      settings.autoIter,
    );
    onStatsChange?.({
      activeEngine: "cpu-f64",
      renderMs: 0,
      fps: 0,
      effectiveIter,
      width: pxW,
      height: pxH,
      progress: 0.05,
      busy: true,
    });
    onStatus?.(`Rendering CPU Float64 (${pxW}×${pxH})…`);

    if (cpuRenderDebounceRef.current) clearTimeout(cpuRenderDebounceRef.current);
    cpuRenderDebounceRef.current = setTimeout(() => {
      cpuEngine.render(cpuCanvas, settings, pxW, pxH, {
        onProgress: p => {
          onStatsChange?.({
            activeEngine: "cpu-f64",
            renderMs: 0,
            fps: 0,
            effectiveIter,
            width: pxW,
            height: pxH,
            progress: p,
            busy: p < 1,
          });
        },
        onComplete: (effIter, durationMs) => {
          onStatsChange?.({
            activeEngine: "cpu-f64",
            renderMs: durationMs,
            fps: 0,
            effectiveIter: effIter,
            width: pxW,
            height: pxH,
            progress: 1,
            busy: false,
          });
        },
        onStatus: msg => onStatus?.(msg),
      });
    }, 30);

    return () => {
      if (cpuRenderDebounceRef.current) clearTimeout(cpuRenderDebounceRef.current);
    };
  }, [settings, size, activeEngine, onStatsChange, onStatus]);

  // ── Draw 2D Overlay (Grid, Orbit Probe, Box Zoom, Coupled Julia Marker) ───
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || size.w < 4 || size.h < 4) return;
    const dpr = size.dpr;
    const targetW = Math.round(size.w * dpr);
    const targetH = Math.round(size.h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    const { camera } = settings;

    // 1. Adaptive Complex Grid
    if (overlays.grid) {
      const spanPerPx = complexSpanPerPixel(size.h, camera.zoom);
      const corners = [
        screenToComplex(0, 0, size.w, size.h, camera),
        screenToComplex(size.w, 0, size.w, size.h, camera),
        screenToComplex(0, size.h, size.w, size.h, camera),
        screenToComplex(size.w, size.h, size.w, size.h, camera),
      ];
      const minRe = Math.min(...corners.map(c => c.re));
      const maxRe = Math.max(...corners.map(c => c.re));
      const minIm = Math.min(...corners.map(c => c.im));
      const maxIm = Math.max(...corners.map(c => c.im));
      const step = computeGridStep(Math.max(maxRe - minRe, maxIm - minIm));

      const startRe = Math.floor(minRe / step) * step;
      const startIm = Math.floor(minIm / step) * step;

      ctx.save();
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.lineWidth = 1;

      let count = 0;
      for (let re = startRe; re <= maxRe + step * 0.5 && count < 40; re += step, count++) {
        const isAxis = Math.abs(re) < step * 0.01;
        const p1 = complexToScreen(re, minIm, size.w, size.h, camera);
        const p2 = complexToScreen(re, maxIm, size.w, size.h, camera);
        ctx.strokeStyle = isAxis ? "rgba(0, 195, 245, 0.45)" : "rgba(148, 163, 184, 0.16)";
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Tick label along bottom
        const topEdge = complexToScreen(re, camera.centerY, size.w, size.h, camera);
        const labelX = Math.max(24, Math.min(size.w - 36, topEdge.x));
        const txt = formatAxisTick(re);
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = "rgba(5, 5, 16, 0.68)";
        ctx.fillRect(labelX - tw * 0.5 - 3, size.h - 20, tw + 6, 14);
        ctx.fillStyle = isAxis ? "#67e8f9" : "rgba(226, 232, 240, 0.72)";
        ctx.textAlign = "center";
        ctx.fillText(txt, labelX, size.h - 10);
      }

      count = 0;
      for (let im = startIm; im <= maxIm + step * 0.5 && count < 40; im += step, count++) {
        const isAxis = Math.abs(im) < step * 0.01;
        const p1 = complexToScreen(minRe, im, size.w, size.h, camera);
        const p2 = complexToScreen(maxRe, im, size.w, size.h, camera);
        ctx.strokeStyle = isAxis ? "rgba(192, 132, 252, 0.45)" : "rgba(148, 163, 184, 0.16)";
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        const edge = complexToScreen(camera.centerX, im, size.w, size.h, camera);
        if (edge.y > 18 && edge.y < size.h - 26) {
          const txt = `${formatAxisTick(im)}i`;
          const tw = ctx.measureText(txt).width;
          ctx.fillStyle = "rgba(5, 5, 16, 0.68)";
          ctx.fillRect(6, edge.y - 7, tw + 6, 14);
          ctx.fillStyle = isAxis ? "#e879f9" : "rgba(226, 232, 240, 0.72)";
          ctx.textAlign = "left";
          ctx.fillText(txt, 9, edge.y + 3);
        }
      }

      // Reference circles |z| = 1 and |z| = 2 when within view
      if (camera.zoom < 40) {
        const origin = complexToScreen(0, 0, size.w, size.h, camera);
        ctx.setLineDash([4, 4]);
        for (const r of [1, 2]) {
          const rPx = r / spanPerPx;
          if (rPx > 8 && rPx < Math.max(size.w, size.h) * 2) {
            ctx.strokeStyle = r === 1 ? "rgba(0, 195, 245, 0.28)" : "rgba(244, 114, 182, 0.24)";
            ctx.beginPath();
            ctx.arc(origin.x, origin.y, rPx, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // 2. Coupled Julia Crosshair Marker in parameter mode
    const meta = FRACTAL_FORMULAS[settings.family];
    if ((overlays.pipJulia || overlays.splitView) && !settings.isJulia && meta.supportsJulia) {
      const jp = complexToScreen(settings.juliaCx, settings.juliaCy, size.w, size.h, camera);
      if (jp.x >= -24 && jp.x <= size.w + 24 && jp.y >= -24 && jp.y <= size.h + 24) {
        ctx.save();
        ctx.strokeStyle = "#f472b6";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(jp.x, jp.y, 9, 0, Math.PI * 2);
        ctx.moveTo(jp.x - 14, jp.y);
        ctx.lineTo(jp.x + 14, jp.y);
        ctx.moveTo(jp.x, jp.y - 14);
        ctx.lineTo(jp.x, jp.y + 14);
        ctx.stroke();
        ctx.fillStyle = "#00c3f5";
        ctx.beginPath();
        ctx.arc(jp.x, jp.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 3. Orbit Probe Polyline
    if (overlays.orbitProbe && orbitAnalysis && orbitAnalysis.points.length > 0) {
      const pts = orbitAnalysis.points.map(pt =>
        complexToScreen(pt.x, pt.y, size.w, size.h, camera),
      );
      ctx.save();
      ctx.lineWidth = 1.6;
      const grad = ctx.createLinearGradient(0, 0, size.w, size.h);
      grad.addColorStop(0, "rgba(0, 195, 245, 0.92)");
      grad.addColorStop(0.5, "rgba(192, 132, 252, 0.88)");
      grad.addColorStop(1, "rgba(251, 191, 36, 0.92)");
      ctx.strokeStyle = grad;
      ctx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Highlight periodic attractor cycle in gold if detected
      if (orbitAnalysis.detectedPeriod && pts.length > orbitAnalysis.detectedPeriod + 1) {
        const startIdx = pts.length - 1 - orbitAnalysis.detectedPeriod;
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let i = startIdx; i < pts.length; i++) {
          if (i === startIdx) ctx.moveTo(pts[i].x, pts[i].y);
          else ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      }

      // Orbit nodes (first 24 points)
      const nodeCap = Math.min(pts.length, 24);
      for (let i = 0; i < nodeCap; i++) {
        const p = pts[i];
        ctx.fillStyle = i === 0 ? "#00c3f5" : "#f8fafc";
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === 0 ? 4.5 : 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Box Zoom Marquee
    if (boxRect) {
      const x = Math.min(boxRect.x1, boxRect.x2);
      const y = Math.min(boxRect.y1, boxRect.y2);
      const w = Math.abs(boxRect.x2 - boxRect.x1);
      const h = Math.abs(boxRect.y2 - boxRect.y1);
      const zoomGain = Math.min(size.w / Math.max(8, w), size.h / Math.max(8, h));
      ctx.save();
      ctx.fillStyle = "rgba(0, 195, 245, 0.12)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#00c3f5";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(x, y, w, h);
      if (w > 40 && h > 20) {
        const tag = `${zoomGain.toFixed(1)}× zoom`;
        ctx.setLineDash([]);
        ctx.font = '600 10px "JetBrains Mono", monospace';
        const tw = ctx.measureText(tag).width;
        ctx.fillStyle = "rgba(5, 5, 16, 0.85)";
        ctx.fillRect(x + 6, y + 6, tw + 10, 16);
        ctx.fillStyle = "#67e8f9";
        ctx.fillText(tag, x + 11, y + 18);
      }
      ctx.restore();
    }
  }, [settings, overlays, orbitAnalysis, boxRect, size]);

  // ── Pointer & Gesture Interactions ────────────────────────────────────────
  const [cursorStyle, setCursorStyle] = useState("grab");

  const getLocalXY = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    latestRef.current.onCancelAnimations();
    const { x, y } = getLocalXY(e.clientX, e.clientY);
    const { w, h } = sizeRef.current;

    if (e.shiftKey && w > 0 && h > 0) {
      const pt = screenToComplex(x, y, w, h, latestRef.current.settings.camera);
      latestRef.current.onShiftClick(pt.re, pt.im);
      return;
    }

    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x, y });

    // Multi-touch pinch initialization
    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartRef.current = {
        dist: Math.max(10, dist),
        midX: (pts[0].x + pts[1].x) * 0.5,
        midY: (pts[0].y + pts[1].y) * 0.5,
        camera: latestRef.current.settings.camera,
      };
      isPanningRef.current = false;
      setBoxRect(null);
      boxRef.current = null;
      return;
    }

    // Box zoom mode (explicit tool OR Ctrl/Meta drag)
    if (latestRef.current.tool === "box-zoom" || e.ctrlKey || e.metaKey) {
      const initBox = { x1: x, y1: y, x2: x, y2: y };
      boxRef.current = initBox;
      setBoxRect(initBox);
      setCursorStyle("crosshair");
      return;
    }

    isPanningRef.current = true;
    panAnchorRef.current = {
      x,
      y,
      camera: latestRef.current.settings.camera,
      vt: { ...cpuVtRef.current },
      moved: false,
    };
    setCursorStyle(latestRef.current.tool === "orbit" ? "crosshair" : "grabbing");
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const { x, y } = getLocalXY(e.clientX, e.clientY);
    const { w, h } = sizeRef.current;

    if (w > 0 && h > 0) {
      const pt = screenToComplex(x, y, w, h, latestRef.current.settings.camera);
      latestRef.current.onHoverComplex(pt);
    }

    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x, y });
    }

    // Pinch-to-zoom
    if (pointersRef.current.size === 2 && pinchStartRef.current && w > 0 && h > 0) {
      const pts = Array.from(pointersRef.current.values());
      const dist = Math.max(10, Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y));
      const midX = (pts[0].x + pts[1].x) * 0.5;
      const midY = (pts[0].y + pts[1].y) * 0.5;
      const factor = dist / pinchStartRef.current.dist;
      const panned = panCamera(
        pinchStartRef.current.camera,
        midX - pinchStartRef.current.midX,
        midY - pinchStartRef.current.midY,
        h,
      );
      const nextCam = zoomAtPoint(panned, midX, midY, w, h, factor);
      latestRef.current.onLiveCamera(nextCam);
      return;
    }

    // Box zoom drag
    if (boxRef.current) {
      const updated = { ...boxRef.current, x2: x, y2: y };
      boxRef.current = updated;
      setBoxRect(updated);
      return;
    }

    if (!isPanningRef.current || w === 0 || h === 0) return;
    const dx = x - panAnchorRef.current.x;
    const dy = y - panAnchorRef.current.y;
    if (Math.hypot(dx, dy) > 3) panAnchorRef.current.moved = true;

    if (activeEngineRef.current !== "cpu-f64") {
      const nextCam = panCamera(panAnchorRef.current.camera, dx, dy, h);
      latestRef.current.onLiveCamera(nextCam);
    } else {
      const nv = {
        ...panAnchorRef.current.vt,
        x: panAnchorRef.current.vt.x + dx,
        y: panAnchorRef.current.vt.y + dy,
      };
      cpuVtRef.current = nv;
      setCpuVt(nv);
    }
  };

  const commitCpuTransform = useCallback((vt: { x: number; y: number; scale: number }) => {
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    const cam = latestRef.current.settings.camera;
    const px = (w * 0.5 - vt.x) / vt.scale;
    const py = (h * 0.5 - vt.y) / vt.scale;
    const center = screenToComplex(px, py, w, h, cam);
    latestRef.current.onCommitCamera({
      centerX: center.re,
      centerY: center.im,
      zoom: Math.max(0.15, Math.min(1e14, cam.zoom * vt.scale)),
      rotation: cam.rotation,
    });
  }, []);

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const { x, y } = getLocalXY(e.clientX, e.clientY);
    const { w, h } = sizeRef.current;

    pointersRef.current.delete(e.pointerId);

    if (pinchStartRef.current && pointersRef.current.size < 2) {
      pinchStartRef.current = null;
      latestRef.current.onCommitCamera(latestRef.current.settings.camera);
      return;
    }

    if (boxRef.current) {
      const b = boxRef.current;
      boxRef.current = null;
      setBoxRect(null);
      setCursorStyle(latestRef.current.tool === "box-zoom" ? "crosshair" : "grab");
      if (Math.abs(b.x2 - b.x1) > 12 && Math.abs(b.y2 - b.y1) > 12 && w > 0 && h > 0) {
        const nextCam = fitBoxToCamera(
          latestRef.current.settings.camera,
          b.x1,
          b.y1,
          b.x2,
          b.y2,
          w,
          h,
        );
        latestRef.current.onSmoothZoomTo(nextCam);
      }
      return;
    }

    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    setCursorStyle(latestRef.current.tool === "orbit" ? "crosshair" : "grab");

    if (!panAnchorRef.current.moved) {
      if (
        (latestRef.current.tool === "orbit" || e.altKey) &&
        w > 0 &&
        h > 0
      ) {
        const pt = screenToComplex(x, y, w, h, latestRef.current.settings.camera);
        latestRef.current.onTogglePinOrbit(pt.re, pt.im);
      }
      return;
    }

    if (activeEngineRef.current !== "cpu-f64") {
      latestRef.current.onCommitCamera(latestRef.current.settings.camera);
    } else {
      commitCpuTransform(cpuVtRef.current);
    }
  };

  // ── Non-passive Wheel Zoom ────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      latestRef.current.onCancelAnimations();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;

      const delta = Math.max(-120, Math.min(120, e.deltaY));
      const factor = Math.pow(1.0018, -delta);

      if (activeEngineRef.current !== "cpu-f64") {
        const base = lastWheelCamRef.current ?? latestRef.current.settings.camera;
        const nextCam = zoomAtPoint(base, mx, my, w, h, factor);
        lastWheelCamRef.current = nextCam;
        latestRef.current.onLiveCamera(nextCam);

        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
        wheelTimerRef.current = setTimeout(() => {
          if (lastWheelCamRef.current) {
            latestRef.current.onCommitCamera(lastWheelCamRef.current);
            lastWheelCamRef.current = null;
          }
        }, 260);
      } else {
        const cur = cpuVtRef.current;
        const nv = {
          scale: cur.scale * factor,
          x: mx + (cur.x - mx) * factor,
          y: my + (cur.y - my) * factor,
        };
        cpuVtRef.current = nv;
        setCpuVt(nv);
        if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
        wheelTimerRef.current = setTimeout(() => commitCpuTransform(cpuVtRef.current), 280);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [commitCpuTransform]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    latestRef.current.onCancelAnimations();
    const { x, y } = getLocalXY(e.clientX, e.clientY);
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    const factor = e.altKey ? 0.4 : 2.5;
    const nextCam = zoomAtPoint(settings.camera, x, y, w, h, factor);
    onSmoothZoomTo(nextCam);
  };

  const resolvedCursor =
    tool === "box-zoom" || tool === "orbit" ? "crosshair" : cursorStyle;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#050510] touch-none select-none"
      style={{ cursor: resolvedCursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => {
        onHoverComplex(null);
        if (isPanningRef.current) {
          isPanningRef.current = false;
          setCursorStyle("grab");
        }
      }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={e => e.preventDefault()}
    >
      {/* WebGL2 GPU Canvas */}
      <canvas
        ref={glCanvasRef}
        className={`absolute inset-0 w-full h-full block transition-opacity duration-150 ${
          activeEngine === "cpu-f64" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {/* CPU Float64 Progressive Canvas */}
      <canvas
        ref={cpuCanvasRef}
        className={`absolute top-0 left-0 w-full h-full will-change-transform ${
          activeEngine === "cpu-f64" ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          transform: `translate(${cpuVt.x}px, ${cpuVt.y}px) scale(${cpuVt.scale})`,
          transformOrigin: "0 0",
        }}
      />

      {/* Transparent 2D Overlay (Grid, Orbit Probe, Box Zoom, Coupled Crosshair) */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Optional Split-View Label Badge */}
      {label && (
        <div className="pointer-events-none absolute top-2.5 left-2.5 z-10 px-2.5 py-1 rounded-full fe-glass text-[10px] font-mono tracking-wider uppercase text-cyan-300 border border-cyan-400/30">
          {label}
        </div>
      )}
    </div>
  );
});
