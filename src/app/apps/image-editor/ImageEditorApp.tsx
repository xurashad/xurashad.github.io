"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Upload, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Download, Image as ImageIcon,
  RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2, Check, X,
  ChevronDown, FileImage, Clipboard, RefreshCw, ImagePlus, Info,
} from "lucide-react";
import { useImageEditor } from "./useImageEditor";
import { EditorToolbar } from "./EditorToolbar";
import { CropPanel } from "./CropPanel";
import { FilterPanel } from "./FilterPanel";
import { DrawPanel, TextPanel } from "./DrawPanel";
import type { CropRect, DrawStroke } from "./types";

type CropDragType = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface CropDragState {
  type: CropDragType;
  startX: number;
  startY: number;
  startCrop: CropRect;
}

function getCropHitZone(
  imgX: number, imgY: number, crop: CropRect, tolerance: number
): CropDragType | null {
  const { x, y, width, height } = crop;
  const right = x + width;
  const bottom = y + height;

  const nearLeft = Math.abs(imgX - x) < tolerance;
  const nearRight = Math.abs(imgX - right) < tolerance;
  const nearTop = Math.abs(imgY - y) < tolerance;
  const nearBottom = Math.abs(imgY - bottom) < tolerance;
  const insideX = imgX > x - tolerance && imgX < right + tolerance;
  const insideY = imgY > y - tolerance && imgY < bottom + tolerance;

  // Corners first (higher priority)
  if (nearLeft && nearTop) return 'nw';
  if (nearRight && nearTop) return 'ne';
  if (nearLeft && nearBottom) return 'sw';
  if (nearRight && nearBottom) return 'se';

  // Edges
  if (nearTop && insideX) return 'n';
  if (nearBottom && insideX) return 's';
  if (nearLeft && insideY) return 'w';
  if (nearRight && insideY) return 'e';

  // Body (move)
  if (imgX > x && imgX < right && imgY > y && imgY < bottom) return 'move';

  return null;
}

export function ImageEditorApp() {
  const editor = useImageEditor();
  const { state } = editor;
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const cropDragRef = useRef<CropDragState | null>(null);
  const [cropHoverZone, setCropHoverZone] = useState<CropDragType | null>(null);

  // Map crop zones to CSS cursor values
  const CROP_CURSORS: Record<CropDragType, string> = {
    nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
    w: 'w-resize', move: 'move', e: 'e-resize',
    sw: 'sw-resize', s: 's-resize', se: 'se-resize',
  };

  // Dynamic cursor based on tool + hover zone
  const canvasCursor = useMemo(() => {
    if (state.activeTool === 'select') return 'grab';
    if (state.activeTool === 'draw') return 'crosshair';
    if (state.activeTool === 'crop') {
      if (cropDragRef.current) return CROP_CURSORS[cropDragRef.current.type];
      if (cropHoverZone) return CROP_CURSORS[cropHoverZone];
      return 'crosshair';
    }
    return 'default';
  }, [state.activeTool, cropHoverZone]);

  // Status bar tips
  const STATUS_TIPS: Record<string, string> = {
    select: 'Drag to pan · Scroll to zoom · Press 0 to reset view',
    crop: 'Drag inside to move · Drag handles to resize · Click Apply when done',
    resize: 'Enter dimensions or pick a preset · Click Apply to resize',
    rotate: 'Click a rotation or flip button to transform the image',
    filters: 'Click a filter to preview · Click Apply to commit',
    adjust: 'Drag sliders for real-time preview · Click Apply to commit',
    draw: 'Click and drag on the canvas to draw · Click Apply when done',
    text: 'Add text overlays · Set font, size, colour, and position',
  };

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      editor.loadImage(file);
    },
    [editor]
  );

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  // Clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) editor.loadImage(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state.originalImage) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          editor.undo();
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          editor.redo();
        } else if (e.key === "s") {
          e.preventDefault();
          editor.exportImage();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "v": editor.setTool("select"); break;
        case "c": editor.setTool("crop"); break;
        case "r": editor.setTool("resize"); break;
        case "t": editor.setTool("rotate"); break;
        case "f": editor.setTool("filters"); break;
        case "a": editor.setTool("adjust"); break;
        case "b": editor.setTool("draw"); break;
        case "x": editor.setTool("text"); break;
        case "+": case "=": editor.setZoom(state.zoom + 0.1); break;
        case "-": editor.setZoom(state.zoom - 0.1); break;
        case "0": editor.resetView(); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.originalImage, state.zoom, editor]);

  // Canvas mouse interactions (pan, zoom, draw)
  // Zoom toward mouse position
  const handleCanvasWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(5, state.zoom + delta));
      if (newZoom === state.zoom) return;

      // Zoom toward mouse position
      const canvas = editor.canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        // Adjust pan so the point under the mouse stays fixed
        const zoomRatio = newZoom / state.zoom;
        const newPanX = cx - zoomRatio * (cx - state.panOffset.x) + (mx - cx) * (1 - zoomRatio);
        const newPanY = cy - zoomRatio * (cy - state.panOffset.y) + (my - cy) * (1 - zoomRatio);
        editor.setPan(
          state.panOffset.x + (newPanX - (cx - zoomRatio * (cx - state.panOffset.x))),
          state.panOffset.y + (newPanY - (cy - zoomRatio * (cy - state.panOffset.y)))
        );
      }
      editor.setZoom(newZoom);
    },
    [state.zoom, state.panOffset, editor]
  );

  const isPanningRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });

  const getCanvasImageCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = editor.canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();

      const baseCanvas = editor.getBaseCanvas();
      if (!baseCanvas) return null;

      const imgAspect = baseCanvas.width / baseCanvas.height;
      const canvasAspect = rect.width / rect.height;
      let drawW: number, drawH: number;
      if (imgAspect > canvasAspect) {
        drawW = rect.width * 0.9;
        drawH = drawW / imgAspect;
      } else {
        drawH = rect.height * 0.9;
        drawW = drawH * imgAspect;
      }

      const drawX = (rect.width - drawW) / 2 + state.panOffset.x;
      const drawY = (rect.height - drawH) / 2 + state.panOffset.y;

      // Account for zoom
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const mx = (clientX - rect.left - cx) / state.zoom + cx;
      const my = (clientY - rect.top - cy) / state.zoom + cy;

      const imgX = ((mx - drawX) / drawW) * baseCanvas.width;
      const imgY = ((my - drawY) / drawH) * baseCanvas.height;

      return { x: imgX, y: imgY };
    },
    [editor, state.panOffset, state.zoom]
  );

  // Compute the tolerance in image-space for crop handle hit detection
  const getCropTolerance = useCallback((): number => {
    const canvas = editor.canvasRef.current;
    const baseCanvas = editor.getBaseCanvas();
    if (!canvas || !baseCanvas) return 15;
    const rect = canvas.getBoundingClientRect();
    const imgAspect = baseCanvas.width / baseCanvas.height;
    const canvasAspect = rect.width / rect.height;
    const drawW = imgAspect > canvasAspect ? rect.width * 0.9 : rect.height * 0.9 * imgAspect;
    const scaleX = baseCanvas.width / drawW;
    return 12 * scaleX / state.zoom; // 12px screen tolerance → image pixels
  }, [editor, state.zoom]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Crop interaction
      if (state.activeTool === "crop" && state.currentCrop && state.originalImage) {
        const coords = getCanvasImageCoords(e.clientX, e.clientY);
        if (coords) {
          const tolerance = getCropTolerance();
          const zone = getCropHitZone(coords.x, coords.y, state.currentCrop, tolerance);
          if (zone) {
            cropDragRef.current = {
              type: zone,
              startX: coords.x,
              startY: coords.y,
              startCrop: { ...state.currentCrop },
            };
            return;
          }
        }
      }

      if (state.activeTool === "draw" && state.originalImage) {
        setIsDrawing(true);
        const coords = getCanvasImageCoords(e.clientX, e.clientY);
        if (coords) {
          currentStrokeRef.current = [coords];
        }
        return;
      }

      if (state.activeTool === "select") {
        isPanningRef.current = true;
        lastPanRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [state.activeTool, state.originalImage, state.currentCrop, getCanvasImageCoords, getCropTolerance]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Crop dragging
      if (cropDragRef.current && state.activeTool === "crop" && state.currentCrop) {
        const coords = getCanvasImageCoords(e.clientX, e.clientY);
        if (!coords) return;

        const { type, startX, startY, startCrop } = cropDragRef.current;
        const dx = coords.x - startX;
        const dy = coords.y - startY;

        const dims = editor.getCurrentDimensions();
        const canvasW = dims.width;
        const canvasH = dims.height;

        let newCrop: CropRect;

        if (type === 'move') {
          // Move the entire crop rect
          let nx = startCrop.x + dx;
          let ny = startCrop.y + dy;
          // Clamp to canvas bounds
          nx = Math.max(0, Math.min(nx, canvasW - startCrop.width));
          ny = Math.max(0, Math.min(ny, canvasH - startCrop.height));
          newCrop = { x: nx, y: ny, width: startCrop.width, height: startCrop.height };
        } else {
          // Resize from handles
          let { x, y, width, height } = startCrop;
          let newX = x, newY = y, newW = width, newH = height;

          if (type.includes('w')) {
            newX = Math.max(0, Math.min(x + dx, x + width - 20));
            newW = x + width - newX;
          }
          if (type.includes('e')) {
            newW = Math.max(20, Math.min(width + dx, canvasW - x));
          }
          if (type.includes('n')) {
            newY = Math.max(0, Math.min(y + dy, y + height - 20));
            newH = y + height - newY;
          }
          if (type.includes('s')) {
            newH = Math.max(20, Math.min(height + dy, canvasH - y));
          }

          newCrop = { x: newX, y: newY, width: newW, height: newH };
        }

        editor.setCrop(newCrop);
        return;
      }

      // Crop hover detection (for dynamic cursor)
      if (state.activeTool === "crop" && state.currentCrop && !cropDragRef.current) {
        const coords = getCanvasImageCoords(e.clientX, e.clientY);
        if (coords) {
          const tolerance = getCropTolerance();
          const zone = getCropHitZone(coords.x, coords.y, state.currentCrop, tolerance);
          setCropHoverZone(zone);
        } else {
          setCropHoverZone(null);
        }
      }

      if (isDrawing && state.activeTool === "draw") {
        const coords = getCanvasImageCoords(e.clientX, e.clientY);
        if (coords) {
          currentStrokeRef.current.push(coords);
          // Live preview stroke
          const canvas = editor.canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx && currentStrokeRef.current.length >= 2) {
              editor.render();
            }
          }
        }
        return;
      }

      if (isPanningRef.current) {
        const dx = e.clientX - lastPanRef.current.x;
        const dy = e.clientY - lastPanRef.current.y;
        editor.setPan(state.panOffset.x + dx, state.panOffset.y + dy);
        lastPanRef.current = { x: e.clientX, y: e.clientY };
      }
    },
    [isDrawing, state.activeTool, state.currentCrop, state.panOffset, editor, getCanvasImageCoords, getCropTolerance]
  );

  const handleCanvasMouseUp = useCallback(() => {
    cropDragRef.current = null;

    if (isDrawing && currentStrokeRef.current.length >= 2) {
      const stroke: DrawStroke = {
        points: [...currentStrokeRef.current],
        color: state.drawColor,
        size: state.drawSize,
        opacity: state.drawOpacity,
        tool: state.drawTool,
      };
      editor.addStroke(stroke);
      currentStrokeRef.current = [];
      setIsDrawing(false);
    } else {
      setIsDrawing(false);
    }
    isPanningRef.current = false;
  }, [isDrawing, state.drawColor, state.drawSize, state.drawOpacity, state.drawTool, editor]);

  // ── Resize tool state ──────────────────────────────────────────────────────
  const dims = editor.getCurrentDimensions();
  const [resizeW, setResizeW] = useState(dims.width.toString());
  const [resizeH, setResizeH] = useState(dims.height.toString());
  const [resizeLock, setResizeLock] = useState(true);

  useEffect(() => {
    if (state.activeTool === "resize" && dims.width > 0) {
      setResizeW(dims.width.toString());
      setResizeH(dims.height.toString());
    }
  }, [state.activeTool, dims.width, dims.height]);

  const handleResize = () => {
    const w = parseInt(resizeW);
    const h = parseInt(resizeH);
    if (w > 0 && h > 0) {
      editor.resize(w, h);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const canUndo = state.historyIndex >= 0;
  const canRedo = state.historyIndex < state.editHistory.length - 1;

  // Right panel title
  const panelTitles: Record<string, string> = {
    select: "Navigate",
    crop: "Crop Image",
    resize: "Resize Image",
    rotate: "Rotate & Flip",
    flip: "Flip",
    filters: "Filters",
    adjust: "Adjustments",
    draw: "Draw",
    text: "Text Overlay",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] min-h-[600px]">
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-4 py-2.5 glass-card rounded-2xl mb-3">
        <div className="flex items-center gap-3">
          {/* New Image */}
          {state.originalImage && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Open new image"
                className="p-2 rounded-lg text-foreground/40 hover:text-quantum hover:bg-quantum/5 transition-all"
              >
                <ImagePlus size={16} />
              </button>
              <div className="w-px h-5 bg-white/8" />
            </>
          )}

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={editor.undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-2 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-white/5
                transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={editor.redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="p-2 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-white/5
                transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {canUndo && (
            <>
              <div className="w-px h-5 bg-white/8" />
              <button
                onClick={() => { for (let i = state.historyIndex; i >= 0; i--) editor.undo(); }}
                title="Reset all edits"
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-mono text-foreground/30
                  hover:text-crimson hover:bg-crimson/5 border border-transparent hover:border-crimson/20 transition-all"
              >
                <RefreshCw size={11} />
                Reset
              </button>
            </>
          )}

          <div className="w-px h-5 bg-white/8" />

          {/* File info */}
          {state.originalImage && (
            <div className="flex items-center gap-2">
              <FileImage size={13} className="text-foreground/25" />
              <span className="text-[11px] text-foreground/40 font-mono max-w-[200px] truncate">
                {state.fileName}
              </span>
              <span className="text-[10px] text-foreground/20 font-mono">
                {dims.width} × {dims.height}
              </span>
              {state.editHistory.length > 0 && (
                <span className="text-[9px] font-mono text-quantum/50 px-1.5 py-0.5 bg-quantum/8 rounded-full">
                  {state.historyIndex + 1} edit{state.historyIndex !== 0 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          {state.originalImage && (
            <>
              <div className="flex items-center gap-1 bg-black/20 rounded-lg px-1 border border-white/5">
                <button
                  onClick={() => editor.setZoom(state.zoom - 0.1)}
                  className="p-1.5 text-foreground/30 hover:text-foreground/60 transition-colors"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="text-[10px] font-mono text-foreground/35 w-10 text-center">
                  {Math.round(state.zoom * 100)}%
                </span>
                <button
                  onClick={() => editor.setZoom(state.zoom + 0.1)}
                  className="p-1.5 text-foreground/30 hover:text-foreground/60 transition-colors"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  onClick={editor.resetView}
                  className="p-1.5 text-foreground/30 hover:text-foreground/60 transition-colors"
                  title="Fit to screen (0)"
                >
                  <Maximize size={13} />
                </button>
              </div>

              <div className="w-px h-5 bg-white/8" />
            </>
          )}

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => state.originalImage && setShowExport(!showExport)}
              disabled={!state.originalImage}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-quantum/15 border border-quantum/30
                text-quantum text-xs font-semibold hover:bg-quantum/25 transition-all
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download size={13} />
              Export
              <ChevronDown size={11} className={`transition-transform ${showExport ? "rotate-180" : ""}`} />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-2 w-64 p-4 glass-card rounded-2xl z-50 space-y-3
                shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10">
                <h4 className="text-[10px] font-mono text-foreground/35 uppercase tracking-widest">Export Settings</h4>

                {/* Format */}
                <div className="flex gap-1">
                  {(["png", "jpeg", "webp"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => editor.setExportFormat(fmt)}
                      className={`flex-1 py-2 text-xs rounded-lg border font-mono uppercase transition-all ${
                        state.exportFormat === fmt
                          ? "bg-quantum/20 border-quantum/40 text-quantum"
                          : "border-white/8 text-foreground/30 hover:border-white/15"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {/* Quality (for JPEG/WebP) */}
                {state.exportFormat !== "png" && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-foreground/35">Quality</span>
                      <span className="text-[10px] font-mono text-foreground/25">{state.exportQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={state.exportQuality}
                      onChange={(e) => editor.setExportQuality(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/8 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-quantum [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                  </div>
                )}

                <button
                  onClick={() => {
                    editor.exportImage();
                    setShowExport(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                    bg-quantum/20 border border-quantum/40 text-quantum text-sm font-semibold
                    hover:bg-quantum/30 transition-all"
                >
                  <Download size={14} />
                  Download .{state.exportFormat === "jpeg" ? "jpg" : state.exportFormat}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex flex-1 gap-3 min-h-0">
        {/* Left toolbar */}
        <div className="glass-card rounded-2xl flex-shrink-0 overflow-visible z-10">
          <EditorToolbar
            activeTool={state.activeTool}
            onSelectTool={editor.setTool}
            hasImage={!!state.originalImage}
          />
        </div>

        {/* Canvas viewport */}
        <div
          ref={dropRef}
          className="flex-1 glass-card rounded-2xl overflow-hidden relative"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!state.originalImage ? (
            /* Upload prompt */
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center transition-all ${
                isDragging ? "bg-quantum/5" : ""
              }`}
            >
              <div
                className={`flex flex-col items-center gap-5 p-10 rounded-3xl border-2 border-dashed
                  transition-all duration-300 ${
                    isDragging
                      ? "border-quantum/50 bg-quantum/5 scale-105"
                      : "border-white/10 hover:border-white/20"
                  }`}
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-quantum/15 to-nebula/15
                    flex items-center justify-center border border-white/8">
                    <ImageIcon size={32} className="text-quantum/60" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-quantum/20 border border-quantum/30
                    flex items-center justify-center animate-pulse">
                    <Upload size={10} className="text-quantum" />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-foreground/60">
                    Drop an image here
                  </h3>
                  <p className="text-sm text-foreground/30 max-w-xs">
                    Drag & drop, paste from clipboard, or browse to upload
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-quantum/15 border border-quantum/30
                      text-quantum text-sm font-semibold hover:bg-quantum/25 transition-all"
                  >
                    <Upload size={14} />
                    Browse Files
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.read().then((items) => {
                        for (const item of items) {
                          const imageType = item.types.find((t) => t.startsWith("image/"));
                          if (imageType) {
                            item.getType(imageType).then((blob) => {
                              const file = new File([blob], "pasted-image.png", { type: imageType });
                              editor.loadImage(file);
                            });
                          }
                        }
                      }).catch(() => {});
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10
                      text-foreground/40 text-sm hover:border-white/20 hover:text-foreground/60 transition-all"
                  >
                    <Clipboard size={14} />
                    Paste
                  </button>
                </div>

                <p className="text-[10px] text-foreground/20 font-mono">
                  Supports PNG, JPEG, WebP, GIF, BMP, SVG
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          ) : (
            /* Canvas */
            <canvas
              ref={editor.canvasRef}
              className="w-full h-full"
              style={{ cursor: canvasCursor }}
              onWheel={handleCanvasWheel}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={() => { handleCanvasMouseUp(); setCropHoverZone(null); }}
            />
          )}

          {/* Status bar */}
          {state.originalImage && (
            <div className="absolute bottom-0 left-0 right-0 px-4 py-1.5 bg-black/40 backdrop-blur-sm
              flex items-center justify-between border-t border-white/5 z-10">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/30">
                <Info size={10} className="text-quantum/40" />
                {STATUS_TIPS[state.activeTool] || ''}
              </div>
              <div className="text-[10px] font-mono text-foreground/20">
                {Math.round(state.zoom * 100)}% · {dims.width}×{dims.height}
              </div>
            </div>
          )}

          {/* Drag overlay */}
          {isDragging && state.originalImage && (
            <div className="absolute inset-0 bg-quantum/10 border-2 border-dashed border-quantum/40
              flex items-center justify-center z-10 backdrop-blur-sm rounded-2xl">
              <div className="text-quantum font-semibold text-lg flex items-center gap-2">
                <Upload size={20} />
                Drop to replace image
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        {state.originalImage && (
          <div className="w-64 flex-shrink-0 glass-card rounded-2xl p-4 overflow-y-auto
            scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            <h3 className="text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-4">
              {panelTitles[state.activeTool] || "Tools"}
            </h3>

            {/* Select tool */}
            {state.activeTool === "select" && (
              <div className="space-y-3 text-[11px] text-foreground/35">
                <p>Use your mouse to navigate:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                    <span className="text-[10px] font-mono text-quantum px-1.5 py-0.5 bg-quantum/10 rounded">Drag</span>
                    <span>Pan the canvas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                    <span className="text-[10px] font-mono text-quantum px-1.5 py-0.5 bg-quantum/10 rounded">Scroll</span>
                    <span>Zoom in/out</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3">
                    <span className="text-[10px] font-mono text-quantum px-1.5 py-0.5 bg-quantum/10 rounded">0</span>
                    <span>Reset view</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <p className="text-foreground/25 text-[10px]">
                    History: {state.historyIndex + 1} / {state.editHistory.length} edits
                  </p>
                </div>
              </div>
            )}

            {/* Crop tool */}
            {state.activeTool === "crop" && (
              <CropPanel
                currentCrop={state.currentCrop}
                cropPresetIndex={state.cropPresetIndex}
                onSetCrop={editor.setCrop}
                onSetPreset={editor.setCropPreset}
                onApply={editor.applyCrop}
                canvasWidth={dims.width}
                canvasHeight={dims.height}
              />
            )}

            {/* Resize tool */}
            {state.activeTool === "resize" && (
              <div className="space-y-4">
                <div className="text-[10px] font-mono text-foreground/25 mb-2">
                  Current: {dims.width} × {dims.height} px
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] text-foreground/25 uppercase mb-1 block">Width (px)</label>
                    <input
                      type="number"
                      value={resizeW}
                      onChange={(e) => {
                        setResizeW(e.target.value);
                        if (resizeLock && dims.width > 0) {
                          const ratio = dims.height / dims.width;
                          setResizeH(Math.round(parseInt(e.target.value) * ratio).toString());
                        }
                      }}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm
                        text-foreground/80 font-mono focus:outline-none focus:border-quantum/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-foreground/25 uppercase mb-1 block">Height (px)</label>
                    <input
                      type="number"
                      value={resizeH}
                      onChange={(e) => {
                        setResizeH(e.target.value);
                        if (resizeLock && dims.height > 0) {
                          const ratio = dims.width / dims.height;
                          setResizeW(Math.round(parseInt(e.target.value) * ratio).toString());
                        }
                      }}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm
                        text-foreground/80 font-mono focus:outline-none focus:border-quantum/40 transition-all"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resizeLock}
                      onChange={(e) => setResizeLock(e.target.checked)}
                      className="accent-cyan-400"
                    />
                    <span className="text-[11px] text-foreground/40">Maintain aspect ratio</span>
                  </label>
                </div>

                {/* Common presets */}
                <div>
                  <label className="block text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-2">
                    Presets
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "HD", w: 1280, h: 720 },
                      { label: "Full HD", w: 1920, h: 1080 },
                      { label: "2K", w: 2560, h: 1440 },
                      { label: "4K", w: 3840, h: 2160 },
                      { label: "Square", w: 1080, h: 1080 },
                      { label: "Story", w: 1080, h: 1920 },
                    ].map(({ label, w, h }) => (
                      <button
                        key={label}
                        onClick={() => {
                          setResizeW(w.toString());
                          setResizeH(h.toString());
                        }}
                        className="py-2 text-[10px] rounded-lg border border-white/8 text-foreground/30
                          hover:border-white/15 hover:text-foreground/50 transition-all"
                      >
                        {label}
                        <span className="block text-[8px] text-foreground/15 font-mono">{w}×{h}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleResize}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                    bg-quantum/15 border border-quantum/30 text-quantum text-sm font-semibold
                    hover:bg-quantum/25 hover:border-quantum/50 transition-all"
                >
                  <Check size={14} />
                  Apply Resize
                </button>
              </div>
            )}

            {/* Rotate / Flip tool */}
            {state.activeTool === "rotate" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-2">
                    Rotate
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => editor.rotate(90)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8
                        text-foreground/35 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
                    >
                      <RotateCw size={16} />
                      <span className="text-[10px]">90° CW</span>
                    </button>
                    <button
                      onClick={() => editor.rotate(180)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8
                        text-foreground/35 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
                    >
                      <RotateCw size={16} />
                      <span className="text-[10px]">180°</span>
                    </button>
                    <button
                      onClick={() => editor.rotate(270)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8
                        text-foreground/35 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
                    >
                      <RotateCcw size={16} />
                      <span className="text-[10px]">90° CCW</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-2">
                    Flip
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => editor.flip("horizontal")}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/8
                        text-foreground/35 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
                    >
                      <FlipHorizontal2 size={16} />
                      <span className="text-[11px]">Horizontal</span>
                    </button>
                    <button
                      onClick={() => editor.flip("vertical")}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/8
                        text-foreground/35 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
                    >
                      <FlipVertical2 size={16} />
                      <span className="text-[11px]">Vertical</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            {state.activeTool === "filters" && (
              <FilterPanel
                mode="filters"
                currentFilter={state.currentFilter}
                currentAdjustments={state.currentAdjustments}
                onSetFilter={editor.setFilter}
                onApplyFilter={editor.applyFilter}
                onSetAdjustment={editor.setAdjustment}
                onResetAdjustments={editor.resetAdjustments}
                onApplyAdjustments={editor.applyAdjustmentsAction}
                getBaseCanvas={editor.getBaseCanvas}
                hasImage={!!state.originalImage}
              />
            )}

            {/* Adjustments */}
            {state.activeTool === "adjust" && (
              <FilterPanel
                mode="adjust"
                currentFilter={state.currentFilter}
                currentAdjustments={state.currentAdjustments}
                onSetFilter={editor.setFilter}
                onApplyFilter={editor.applyFilter}
                onSetAdjustment={editor.setAdjustment}
                onResetAdjustments={editor.resetAdjustments}
                onApplyAdjustments={editor.applyAdjustmentsAction}
                getBaseCanvas={editor.getBaseCanvas}
                hasImage={!!state.originalImage}
              />
            )}

            {/* Draw */}
            {state.activeTool === "draw" && (
              <DrawPanel
                drawColor={state.drawColor}
                drawSize={state.drawSize}
                drawOpacity={state.drawOpacity}
                drawTool={state.drawTool}
                onSetColor={editor.setDrawColor}
                onSetSize={editor.setDrawSize}
                onSetOpacity={editor.setDrawOpacity}
                onSetTool={editor.setDrawTool}
                onApply={editor.applyDrawing}
                hasStrokes={state.currentStrokes.length > 0}
              />
            )}

            {/* Text */}
            {state.activeTool === "text" && (
              <TextPanel
                textOverlays={state.currentTextOverlays}
                onAdd={editor.addTextOverlay}
                onUpdate={editor.updateTextOverlay}
                onRemove={editor.removeTextOverlay}
                onApply={editor.applyTextOverlays}
                canvasWidth={dims.width}
                canvasHeight={dims.height}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
