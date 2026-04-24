"use client";

import {
  useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState,
} from "react";
import { buildPaletteRGBA, getWorkerScript } from "./lib/palette";
import type { Settings, FractalView } from "./lib/types";

export interface CanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

interface Props {
  settings: Settings;
  onViewChange: (v: FractalView) => void;        // commit new view after pan/zoom
  onShiftClick: (cx: number, cy: number) => void; // shift+click → Julia
  onStatus:   (s: string)  => void;
  onProgress: (p: number)  => void;
  onBusy:     (b: boolean) => void;
}

export const FractalCanvas = forwardRef<CanvasHandle, Props>(function FractalCanvas(
  { settings, onViewChange, onShiftClick, onStatus, onProgress, onBusy },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const offRef       = useRef<OffscreenCanvas | null>(null);
  const workersRef   = useRef<Worker[]>([]);
  const jobIdRef     = useRef(0);

  // Canvas logical pixel size (matches container)
  const sizeRef = useRef({ w: 0, h: 0 });

  // Pan/zoom CSS transform (local — for instant feedback)
  const [vt, setVT] = useState({ x: 0, y: 0, scale: 1 });
  const vtRef        = useRef({ x: 0, y: 0, scale: 1 });
  const isPanning    = useRef(false);
  const panStart     = useRef({ x: 0, y: 0, vtSnap: { x: 0, y: 0, scale: 1 } });
  const debounce     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always-fresh refs (avoid stale closures)
  const settingsRef     = useRef(settings);
  settingsRef.current   = settings;
  const onViewRef       = useRef(onViewChange);
  onViewRef.current     = onViewChange;
  const onShiftRef      = useRef(onShiftClick);
  onShiftRef.current    = onShiftClick;
  const onStatusRef     = useRef(onStatus);
  onStatusRef.current   = onStatus;
  const onProgressRef   = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onBusyRef       = useRef(onBusy);
  onBusyRef.current     = onBusy;

  useImperativeHandle(ref, () => ({ getCanvas: () => canvasRef.current }));

  // ── Render ──────────────────────────────────────────────────────────────────
  const startRender = useCallback((w: number, h: number) => {
    if (w < 4 || h < 4) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure canvas element matches container
    canvas.width  = w;
    canvas.height = h;

    // Reset pan/zoom so we see the new frame from scratch
    setVT({ x: 0, y: 0, scale: 1 });
    vtRef.current = { x: 0, y: 0, scale: 1 };

    jobIdRef.current++;
    const jobId = jobIdRef.current;

    workersRef.current.forEach(wk => wk.terminate());
    workersRef.current = [];

    onBusyRef.current(true);
    onProgressRef.current(0);
    onStatusRef.current("Initialising…");

    // Offscreen canvas for compositing
    if (!offRef.current || offRef.current.width !== w || offRef.current.height !== h) {
      offRef.current = new OffscreenCanvas(w, h);
    }
    const oc    = offRef.current;
    const octx  = oc.getContext("2d")!;
    octx.fillStyle = "#0a0a14";
    octx.fillRect(0, 0, w, h);

    const s       = settingsRef.current;
    const { view, maxIter, palette, paletteLen, paletteOffset, interlaced, fractalType, cx, cy } = s;
    const paletteRGBA = buildPaletteRGBA(palette, paletteLen, paletteOffset);

    // Adjust y-range to match canvas aspect ratio while keeping x-range
    const xRange = view.xmax - view.xmin;
    const aspect = h / w;
    const yRange = xRange * aspect;
    const ycenter = (view.ymin + view.ymax) / 2;
    const adjView = {
      xmin: view.xmin, xmax: view.xmax,
      ymin: ycenter - yRange / 2, ymax: ycenter + yRange / 2,
    };

    let done = 0;
    const total = h;

    const drawRow = (row: number, counts: Int32Array) => {
      const ctx = offRef.current?.getContext("2d");
      if (!ctx) return;
      const img  = ctx.createImageData(w, 1);
      const pLen = paletteLen;

      for (let i = 0; i < w; i++) {
        const itr = counts[i];
        const p   = i * 4;
        if (itr === -1) {
          img.data[p] = 0; img.data[p+1] = 0; img.data[p+2] = 0; img.data[p+3] = 255;
        } else {
          const idx = ((itr % pLen) + pLen) % pLen;
          img.data[p]   = paletteRGBA[idx * 4];
          img.data[p+1] = paletteRGBA[idx * 4 + 1];
          img.data[p+2] = paletteRGBA[idx * 4 + 2];
          img.data[p+3] = 255;
        }
      }

      ctx.putImageData(img, 0, row);
      const mc = canvasRef.current?.getContext("2d");
      if (mc && offRef.current) mc.drawImage(offRef.current, 0, 0);
    };

    const numWorkers = Math.min(navigator.hardwareConcurrency || 4, 8);
    const blobUrl = URL.createObjectURL(new Blob([getWorkerScript()], { type: "application/javascript" }));
    const workers = Array.from({ length: numWorkers }, () => new Worker(blobUrl));
    workersRef.current = workers;

    workers.forEach(wk => {
      wk.onmessage = (e: MessageEvent) => {
        if (e.data.jobId !== jobId) return;
        if (e.data.error) { onStatusRef.current(e.data.error); onBusyRef.current(false); return; }
        drawRow(e.data.row, e.data.counts);
        done++;
        const pct = done / total;
        onProgressRef.current(pct);
        if (done >= total) {
          onBusyRef.current(false);
          onStatusRef.current(`Done — ${w}×${h} @ ${maxIter} iter`);
          URL.revokeObjectURL(blobUrl);
          workersRef.current = [];
        }
      };
    });

    // Build row queue (interlaced: even rows first for faster preview)
    const rows = Array.from({ length: h }, (_, i) => i);
    if (interlaced) rows.sort((a, b) => (a % 4) - (b % 4)); // 4-phase interlacing

    let qi = 0;
    const job = (row: number, wk: Worker) => ({
      row, jobId, width: w, height: h,
      xmin: adjView.xmin, xmax: adjView.xmax,
      ymin: adjView.ymin, ymax: adjView.ymax,
      maxIter, fractalType, cx, cy,
    });

    workers.forEach(wk => {
      if (qi < rows.length) wk.postMessage(job(rows[qi++], wk));
      wk.addEventListener("message", function pump() {
        if (qi < rows.length) wk.postMessage(job(rows[qi++], wk));
        else wk.removeEventListener("message", pump);
      });
    });
  }, []); // no deps — reads everything via refs

  // ── Trigger render when settings change or size changes ────────────────────
  // We track a render request number to avoid calling startRender with stale size
  const renderCntRef = useRef(0);
  useEffect(() => {
    renderCntRef.current++;
    const id = renderCntRef.current;
    // Small delay so ResizeObserver and settings can settle
    const t = setTimeout(() => {
      if (id !== renderCntRef.current) return;
      const { w, h } = sizeRef.current;
      startRender(w, h);
    }, 50);
    return () => clearTimeout(t);
  }, [settings, startRender]);

  // ── ResizeObserver ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      const w = Math.round(width), h = Math.round(height);
      // Hysteresis: ignore sub-5px changes to avoid re-render loops caused by
      // minor layout reflows (e.g. scrollbar appearing, status bar content
      // shifting) that don't meaningfully change the canvas size.
      if (
        Math.abs(w - sizeRef.current.w) <= 4 &&
        Math.abs(h - sizeRef.current.h) <= 4
      ) return;
      sizeRef.current = { w, h };
      renderCntRef.current++;
      const id = renderCntRef.current;
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => {
        if (id !== renderCntRef.current) return;
        startRender(w, h);
      }, 250); // debounce resize
    });
    ro.observe(el);
    return () => { ro.disconnect(); if (debounce.current) clearTimeout(debounce.current); };
  }, [startRender]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => () => {
    workersRef.current.forEach(wk => wk.terminate());
  }, []);

  // ── Commit view transform → new fractal limits ──────────────────────────────
  const commitVT = useCallback((transform: { x: number; y: number; scale: number }) => {
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    const s = settingsRef.current;
    const v = s.view;

    const xRange = v.xmax - v.xmin;
    const aspect = h / w;
    const yRange = xRange * aspect;
    const yc = (v.ymin + v.ymax) / 2;
    const adjYmin = yc - yRange / 2, adjYmax = yc + yRange / 2;

    // New view: figure out where the center of the viewport ended up
    const newXRange = xRange / transform.scale;
    const newYRange = yRange / transform.scale;

    // Center of the new view in pixels (accounting for pan)
    const pcx = w / 2 - transform.x;
    const pcy = h / 2 - transform.y;

    // Center in fractal coords
    const fcx = v.xmin  + (pcx / w / transform.scale + (transform.scale - 1) / (2 * transform.scale)) * xRange;
    const fcy = adjYmax - (pcy / h / transform.scale + (transform.scale - 1) / (2 * transform.scale)) * yRange;

    // Actually: translate pixel (cx, cy) from original frame to fractal coords
    // With transform scale(s) translate(tx, ty) at origin top-left:
    // canvas pixel p → screen pos: p * scale + translate
    // To find what fractal point is at screen center (w/2, h/2):
    // screen center / scale - translate/scale = canvas pixel
    const canvasCx = (w / 2 - transform.x) / transform.scale;
    const canvasCy = (h / 2 - transform.y) / transform.scale;
    const fracCx   = v.xmin  + (canvasCx / w) * xRange;
    const fracCy   = adjYmax - (canvasCy / h) * yRange;

    onViewRef.current({
      xmin: fracCx - newXRange / 2,
      xmax: fracCx + newXRange / 2,
      ymin: fracCy - newYRange / 2,
      ymax: fracCy + newYRange / 2,
    });
  }, []);

  // ── Pointer events ──────────────────────────────────────────────────────────
  const [cursor, setCursor] = useState("grab");

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.shiftKey && settingsRef.current.fractalType === "Mandelbrot") {
      const rect = canvasRef.current!.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top)  / rect.height;
      const v  = settingsRef.current.view;
      const xR = v.xmax - v.xmin;
      const { w, h } = sizeRef.current;
      const aspect = h / w;
      const yR = xR * aspect;
      const yc = (v.ymin + v.ymax) / 2;
      const nx = v.xmin + px * xR;
      const ny = (yc + yR / 2) - py * yR;
      onShiftRef.current(nx, ny);
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, vtSnap: { ...vtRef.current } };
    setCursor("grabbing");
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current) return;
    e.preventDefault();
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    const nv = { ...panStart.current.vtSnap, x: panStart.current.vtSnap.x + dx, y: panStart.current.vtSnap.y + dy };
    setVT(nv); vtRef.current = nv;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isPanning.current) return;
    isPanning.current = false;
    setCursor("grab");
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
      setVT(panStart.current.vtSnap); vtRef.current = panStart.current.vtSnap; return;
    }
    commitVT(vtRef.current);
  };

  // Wheel zoom (non-passive, attached imperatively)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.25 : 0.8;
      const cur = vtRef.current;
      const nv = {
        scale: cur.scale * factor,
        x: mx + (cur.x - mx) * factor,
        y: my + (cur.y - my) * factor,
      };
      setVT(nv); vtRef.current = nv;
      if (debounce.current) clearTimeout(debounce.current);
      debounce.current = setTimeout(() => commitVT(vtRef.current), 300);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [commitVT]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#0a0a14] touch-none"
      style={{ cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        if (isPanning.current) {
          isPanning.current = false; setCursor("grab");
          setVT(panStart.current.vtSnap); vtRef.current = panStart.current.vtSnap;
        }
      }}
      onContextMenu={e => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{
          transform: `translate(${vt.x}px,${vt.y}px) scale(${vt.scale})`,
          transformOrigin: "0 0",
        }}
      />
    </div>
  );
});
