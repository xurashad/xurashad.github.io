"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Upload, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, Minimize, Download, Image as ImageIcon,
  RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2, Check, X,
  ChevronDown, ChevronUp, FileImage, Clipboard, RefreshCw, ImagePlus, Info,
  SlidersHorizontal,
} from "lucide-react";
import { useImageEditor } from "./useImageEditor";
import { EditorToolbar } from "./EditorToolbar";
import { CropPanel } from "./CropPanel";
import { FilterPanel } from "./FilterPanel";
import { DrawPanel, TextPanel } from "./DrawPanel";
import type { CropRect, DrawStroke, EditorTool } from "./types";

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

/* Mobile viewport hook */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

export function ImageEditorApp() {
  const editor = useImageEditor();
  const { state } = editor;
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isMobile = useIsMobile();

  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const cropDragRef = useRef<CropDragState | null>(null);
  const [cropHoverZone, setCropHoverZone] = useState<CropDragType | null>(null);
  const isPanningRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const pinchStartRef = useRef<{ dist: number; zoom: number } | null>(null);

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
      if (cropHoverZone) return CROP_CURSORS[cropHoverZone];
      return 'crosshair';
    }
    return 'default';
  }, [state.activeTool, cropHoverZone]);



  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        editor.redo();
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        editor.resetView();
        return;
      }

      // Tool shortcuts
      const shortcuts: Record<string, EditorTool> = {
        v: 'select', c: 'crop', r: 'resize', t: 'rotate',
        f: 'filters', a: 'adjust', b: 'draw', x: 'text',
      };
      const tool = shortcuts[e.key.toLowerCase()];
      if (tool && state.originalImage) {
        editor.setTool(tool);
        if (isMobile && tool !== 'select') setMobileDrawerOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, state.originalImage, isMobile]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        editor.loadImage(files[0]);
      }
    },
    [editor]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) {
        editor.loadImage(files[0]);
      }
    },
    [editor]
  );

  // Paste handler
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

  // Coordinate conversion: client coords → canvas image coords
  const getCanvasImageCoords = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = editor.canvasRef.current;
      const baseCanvas = editor.getBaseCanvas();
      if (!canvas || !baseCanvas) return null;

      const rect = canvas.getBoundingClientRect();
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

  // Compute tolerance in image-space for crop handle hit detection
  const getCropTolerance = useCallback((isTouch = false): number => {
    const canvas = editor.canvasRef.current;
    const baseCanvas = editor.getBaseCanvas();
    if (!canvas || !baseCanvas) return isTouch ? 28 : 15;
    const rect = canvas.getBoundingClientRect();
    const imgAspect = baseCanvas.width / baseCanvas.height;
    const canvasAspect = rect.width / rect.height;
    const drawW = imgAspect > canvasAspect ? rect.width * 0.9 : rect.height * 0.9 * imgAspect;
    const scaleX = baseCanvas.width / drawW;
    const screenTolerance = isTouch ? 28 : 14;
    return (screenTolerance * scaleX) / state.zoom;
  }, [editor, state.zoom]);

  // Non-passive wheel zoom: when pointer is inside canvas viewport, zoom image and prevent page scrolling
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      editor.setZoom((prev) => {
        const next = Math.round((prev + delta) * 100) / 100;
        return Math.max(0.1, Math.min(5, next));
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [editor.setZoom, state.originalImage]);

  // Mouse Down
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Crop interaction
      if (state.activeTool === "crop" && state.currentCrop && state.originalImage) {
        const coords = getCanvasImageCoords(e.clientX, e.clientY);
        if (coords) {
          const tolerance = getCropTolerance(false);
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

  // Mouse Move
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
          let nx = startCrop.x + dx;
          let ny = startCrop.y + dy;
          nx = Math.max(0, Math.min(nx, canvasW - startCrop.width));
          ny = Math.max(0, Math.min(ny, canvasH - startCrop.height));
          newCrop = { x: nx, y: ny, width: startCrop.width, height: startCrop.height };
        } else {
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

      // Crop hover detection
      if (state.activeTool === "crop" && state.currentCrop && !cropDragRef.current) {
        const coords = getCanvasImageCoords(e.clientX, e.clientY);
        if (coords) {
          const tolerance = getCropTolerance(false);
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

  // Mouse Up
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

  // Touch Start (Mobile & Tablet)
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        if (state.activeTool === "crop" && state.currentCrop && state.originalImage) {
          const coords = getCanvasImageCoords(t.clientX, t.clientY);
          if (coords) {
            const tolerance = getCropTolerance(true);
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
          const coords = getCanvasImageCoords(t.clientX, t.clientY);
          if (coords) {
            currentStrokeRef.current = [coords];
          }
          return;
        }

        if (state.activeTool === "select") {
          isPanningRef.current = true;
          lastPanRef.current = { x: t.clientX, y: t.clientY };
        }
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchStartRef.current = { dist, zoom: state.zoom };
      }
    },
    [state.activeTool, state.originalImage, state.currentCrop, state.zoom, getCanvasImageCoords, getCropTolerance]
  );

  // Touch Move (Mobile & Tablet)
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];

        // Crop drag
        if (cropDragRef.current && state.activeTool === "crop" && state.currentCrop) {
          const coords = getCanvasImageCoords(t.clientX, t.clientY);
          if (!coords) return;

          const { type, startX, startY, startCrop } = cropDragRef.current;
          const dx = coords.x - startX;
          const dy = coords.y - startY;

          const dims = editor.getCurrentDimensions();
          const canvasW = dims.width;
          const canvasH = dims.height;

          let newCrop: CropRect;
          if (type === 'move') {
            let nx = startCrop.x + dx;
            let ny = startCrop.y + dy;
            nx = Math.max(0, Math.min(nx, canvasW - startCrop.width));
            ny = Math.max(0, Math.min(ny, canvasH - startCrop.height));
            newCrop = { x: nx, y: ny, width: startCrop.width, height: startCrop.height };
          } else {
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

        // Draw
        if (isDrawing && state.activeTool === "draw") {
          const coords = getCanvasImageCoords(t.clientX, t.clientY);
          if (coords) {
            currentStrokeRef.current.push(coords);
            const canvas = editor.canvasRef.current;
            if (canvas && currentStrokeRef.current.length >= 2) {
              editor.render();
            }
          }
          return;
        }

        // Pan
        if (isPanningRef.current) {
          const dx = t.clientX - lastPanRef.current.x;
          const dy = t.clientY - lastPanRef.current.y;
          editor.setPan(state.panOffset.x + dx, state.panOffset.y + dy);
          lastPanRef.current = { x: t.clientX, y: t.clientY };
        }
      } else if (e.touches.length === 2 && pinchStartRef.current) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const scale = dist / pinchStartRef.current.dist;
        const newZoom = Math.max(0.15, Math.min(5, pinchStartRef.current.zoom * scale));
        editor.setZoom(newZoom);
      }
    },
    [isDrawing, state.activeTool, state.currentCrop, state.panOffset, editor, getCanvasImageCoords]
  );

  // Touch End (Mobile & Tablet)
  const handleTouchEnd = useCallback(() => {
    cropDragRef.current = null;
    pinchStartRef.current = null;

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

  // Fullscreen toggle with fallback
  const handleToggleFullscreen = useCallback(() => {
    if (!rootRef.current) return;
    if (!document.fullscreenElement) {
      rootRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Resize tool state
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

  const canUndo = state.historyIndex >= 0;
  const canRedo = state.historyIndex < state.editHistory.length - 1;

  const STATUS_TIPS: Record<EditorTool, string> = {
    select: "Drag to pan · Scroll or pinch to zoom · Press 0 to fit",
    crop: "Drag handles to resize · Drag inside to move · Apply to confirm",
    resize: "Set dimensions · Maintain aspect ratio · Apply to scale",
    rotate: "Rotate 90° clockwise/counter-clockwise or flip",
    filters: "Select a filter to preview · Click apply to save",
    adjust: "Tweak brightness, contrast, and colours with sliders",
    draw: "Choose brush or eraser · Click & drag on image to paint",
    text: "Add custom text overlays with custom styles and fonts",
    flip: "Flip horizontally or vertically",
  };

  const panelTitles: Record<EditorTool, string> = {
    select: "Navigation",
    crop: "Crop & Framing",
    resize: "Resize Dimensions",
    rotate: "Rotate & Flip",
    flip: "Flip",
    filters: "Photo Filters",
    adjust: "Colour Adjustments",
    draw: "Drawing Tools",
    text: "Text Overlay",
  };

  const handleToolSelect = (tool: EditorTool) => {
    editor.setTool(tool);
    if (tool !== 'select') {
      setMobileDrawerOpen(true);
    } else {
      setMobileDrawerOpen(false);
    }
  };

  // Render Tool Controls Panel (used in sidebar on desktop, and in bottom sheet on mobile)
  const renderToolControls = () => {
    return (
      <div className="space-y-4">
        {/* Select tool */}
        {state.activeTool === "select" && (
          <div className="space-y-3 text-[11px] text-foreground/45">
            <p>Canvas navigation controls:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3 border border-white/5">
                <span className="text-[10px] font-mono text-quantum px-1.5 py-0.5 bg-quantum/10 rounded">Drag</span>
                <span>Pan the canvas</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3 border border-white/5">
                <span className="text-[10px] font-mono text-quantum px-1.5 py-0.5 bg-quantum/10 rounded">Scroll / Pinch</span>
                <span>Zoom in and out</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-white/3 border border-white/5">
                <span className="text-[10px] font-mono text-quantum px-1.5 py-0.5 bg-quantum/10 rounded">0 / Fit</span>
                <span>Reset view to center</span>
              </div>
            </div>
            <div className="pt-3 border-t border-white/5">
              <p className="text-foreground/30 text-[10px] font-mono">
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
            onApply={() => {
              editor.applyCrop();
              if (isMobile) setMobileDrawerOpen(false);
            }}
            canvasWidth={dims.width}
            canvasHeight={dims.height}
          />
        )}

        {/* Resize tool */}
        {state.activeTool === "resize" && (
          <div className="space-y-4">
            <div className="text-[10px] font-mono text-foreground/35 mb-2">
              Original: {dims.width} × {dims.height} px
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-foreground/40 font-mono uppercase mb-1 block">Width (px)</label>
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
                <label className="text-[9px] text-foreground/40 font-mono uppercase mb-1 block">Height (px)</label>
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
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={resizeLock}
                  onChange={(e) => setResizeLock(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span className="text-[11px] text-foreground/50">Maintain aspect ratio</span>
              </label>
            </div>

            {/* Presets */}
            <div>
              <label className="block text-[10px] font-mono text-foreground/40 uppercase tracking-widest mb-2">
                Standard Presets
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "HD", w: 1280, h: 720 },
                  { label: "FHD", w: 1920, h: 1080 },
                  { label: "2K", w: 2560, h: 1440 },
                  { label: "Square", w: 1080, h: 1080 },
                  { label: "Story", w: 1080, h: 1920 },
                  { label: "Icon", w: 512, h: 512 },
                ].map(({ label, w, h }) => (
                  <button
                    key={label}
                    onClick={() => {
                      setResizeW(w.toString());
                      setResizeH(h.toString());
                    }}
                    className="py-1.5 px-2 text-[10px] rounded-lg border border-white/8 text-foreground/40
                      hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all text-center"
                  >
                    <span className="font-semibold">{label}</span>
                    <span className="block text-[8px] text-foreground/30 font-mono">{w}×{h}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                handleResize();
                if (isMobile) setMobileDrawerOpen(false);
              }}
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
              <label className="block text-[10px] font-mono text-foreground/40 uppercase tracking-widest mb-2">
                Rotate
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => editor.rotate(90)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8
                    text-foreground/50 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
                >
                  <RotateCw size={16} />
                  <span className="text-[10px] font-mono">90° CW</span>
                </button>
                <button
                  onClick={() => editor.rotate(180)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8
                    text-foreground/50 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
                >
                  <RotateCw size={16} />
                  <span className="text-[10px] font-mono">180°</span>
                </button>
                <button
                  onClick={() => editor.rotate(270)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-white/8
                    text-foreground/50 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
                >
                  <RotateCcw size={16} />
                  <span className="text-[10px] font-mono">90° CCW</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-foreground/40 uppercase tracking-widest mb-2">
                Flip Mirror
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => editor.flip("horizontal")}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/8
                    text-foreground/50 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
                >
                  <FlipHorizontal2 size={16} />
                  <span className="text-[11px]">Horizontal</span>
                </button>
                <button
                  onClick={() => editor.flip("vertical")}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/8
                    text-foreground/50 hover:border-quantum/30 hover:text-quantum hover:bg-quantum/5 transition-all"
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
            onApplyFilter={() => {
              editor.applyFilter();
              if (isMobile) setMobileDrawerOpen(false);
            }}
            onSetAdjustment={editor.setAdjustment}
            onResetAdjustments={editor.resetAdjustments}
            onApplyAdjustments={() => {
              editor.applyAdjustmentsAction();
              if (isMobile) setMobileDrawerOpen(false);
            }}
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
            onApplyFilter={() => {
              editor.applyFilter();
              if (isMobile) setMobileDrawerOpen(false);
            }}
            onSetAdjustment={editor.setAdjustment}
            onResetAdjustments={editor.resetAdjustments}
            onApplyAdjustments={() => {
              editor.applyAdjustmentsAction();
              if (isMobile) setMobileDrawerOpen(false);
            }}
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
            onApply={() => {
              editor.applyDrawing();
              if (isMobile) setMobileDrawerOpen(false);
            }}
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
            onApply={() => {
              editor.applyTextOverlays();
              if (isMobile) setMobileDrawerOpen(false);
            }}
            canvasWidth={dims.width}
            canvasHeight={dims.height}
          />
        )}
      </div>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`relative ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#060410] p-2 sm:p-4 h-screen w-screen max-w-none flex flex-col"
          : "flex flex-col h-[calc(100vh-8.5rem)] sm:h-[calc(100vh-10rem)] min-h-[520px] sm:min-h-[600px]"
      }`}
    >
      {/* ── TOP BAR ── */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 glass-card rounded-2xl mb-2 sm:mb-3 z-20 flex-shrink-0 border border-white/8">
        {/* Left side actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* New Image */}
          {state.originalImage && (
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Open new image"
              className="p-1.5 sm:p-2 rounded-lg text-foreground/50 hover:text-quantum hover:bg-quantum/10 transition-all flex-shrink-0"
            >
              <ImagePlus size={16} />
            </button>
          )}

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <button
              onClick={editor.undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="p-1.5 sm:p-2 rounded-lg text-foreground/50 hover:text-foreground/80 hover:bg-white/5
                transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={editor.redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="p-1.5 sm:p-2 rounded-lg text-foreground/50 hover:text-foreground/80 hover:bg-white/5
                transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Redo2 size={16} />
            </button>
          </div>

          {canUndo && (
            <button
              onClick={() => { for (let i = state.historyIndex; i >= 0; i--) editor.undo(); }}
              title="Reset all edits"
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg text-[10px] font-mono text-foreground/40
                hover:text-crimson hover:bg-crimson/10 border border-transparent hover:border-crimson/25 transition-all flex-shrink-0"
            >
              <RefreshCw size={11} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          {/* Desktop File info */}
          {state.originalImage && !isMobile && (
            <>
              <div className="w-px h-5 bg-white/8 hidden md:block" />
              <div className="hidden md:flex items-center gap-2 min-w-0">
                <FileImage size={13} className="text-foreground/30 flex-shrink-0" />
                <span className="text-[11px] text-foreground/50 font-mono max-w-[160px] truncate">
                  {state.fileName}
                </span>
                <span className="text-[10px] text-foreground/30 font-mono">
                  {dims.width} × {dims.height}
                </span>
                {state.editHistory.length > 0 && (
                  <span className="text-[9px] font-mono text-quantum/60 px-1.5 py-0.5 bg-quantum/10 rounded-full border border-quantum/20">
                    {state.historyIndex + 1} edit{state.historyIndex !== 0 ? 's' : ''}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Zoom controls */}
          {state.originalImage && (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-black/30 rounded-xl px-1 sm:px-1.5 py-0.5 border border-white/8">
              <button
                onClick={() => editor.setZoom(state.zoom - 0.1)}
                className="p-1 sm:p-1.5 text-foreground/40 hover:text-foreground/80 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-[10px] font-mono text-foreground/60 w-8 sm:w-10 text-center font-medium">
                {Math.round(state.zoom * 100)}%
              </span>
              <button
                onClick={() => editor.setZoom(state.zoom + 0.1)}
                className="p-1 sm:p-1.5 text-foreground/40 hover:text-foreground/80 transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                onClick={editor.resetView}
                className="p-1 sm:p-1.5 text-foreground/40 hover:text-foreground/80 transition-colors"
                title="Fit to screen (0)"
              >
                <Maximize size={12} />
              </button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 sm:p-2 rounded-xl border border-white/8 text-foreground/40 hover:text-foreground/80
              hover:bg-white/5 transition-all"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => state.originalImage && setShowExport(!showExport)}
              disabled={!state.originalImage}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-quantum/15 border border-quantum/35
                text-quantum text-xs font-semibold hover:bg-quantum/25 transition-all
                disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
            >
              <Download size={13} />
              <span>Export</span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${showExport ? "rotate-180" : ""}`} />
            </button>

            {showExport && (
              <div className="absolute right-0 top-full mt-2 w-64 p-4 glass-card rounded-2xl z-50 space-y-3
                shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-white/12">
                <h4 className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest font-semibold">
                  Export Settings
                </h4>

                {/* Format buttons */}
                <div className="flex gap-1">
                  {(["png", "jpeg", "webp"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => editor.setExportFormat(fmt)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border font-mono uppercase transition-all ${
                        state.exportFormat === fmt
                          ? "bg-quantum/20 border-quantum/50 text-quantum font-semibold"
                          : "border-white/8 text-foreground/40 hover:border-white/20"
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                {/* Quality Slider (JPEG/WebP) */}
                {state.exportFormat !== "png" && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-foreground/50">Quality</span>
                      <span className="text-[10px] font-mono text-quantum font-medium">{state.exportQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={state.exportQuality}
                      onChange={(e) => editor.setExportQuality(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
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
                    bg-quantum/20 border border-quantum/45 text-quantum text-sm font-semibold
                    hover:bg-quantum/30 transition-all shadow-[0_0_15px_rgba(0,195,245,0.2)]"
                >
                  <Download size={14} />
                  Download .{state.exportFormat === "jpeg" ? "jpg" : state.exportFormat}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex flex-1 gap-2 sm:gap-3 min-h-0 relative overflow-hidden">
        {/* Desktop Left Toolbar */}
        {!isMobile && (
          <div className="glass-card rounded-2xl flex-shrink-0 overflow-visible z-10 border border-white/8">
            <EditorToolbar
              activeTool={state.activeTool}
              onSelectTool={editor.setTool}
              hasImage={!!state.originalImage}
              orientation="vertical"
            />
          </div>
        )}

        {/* Canvas Viewport (Takes full remaining space) */}
        <div
          ref={dropRef}
          className="flex-1 glass-card rounded-2xl overflow-hidden relative border border-white/8 bg-black/40 flex flex-col"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!state.originalImage ? (
            /* Upload / Drag prompt */
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center p-4 transition-all ${
                isDragging ? "bg-quantum/5" : ""
              }`}
            >
              <div
                className={`flex flex-col items-center gap-4 sm:gap-5 p-6 sm:p-10 rounded-3xl border-2 border-dashed
                  transition-all duration-300 max-w-md w-full ${
                    isDragging
                      ? "border-quantum/50 bg-quantum/5 scale-105"
                      : "border-white/12 hover:border-white/25 bg-black/20"
                  }`}
              >
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-quantum/20 to-nebula/20
                    flex items-center justify-center border border-white/10">
                    <ImageIcon size={30} className="text-quantum" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-quantum/30 border border-quantum/40
                    flex items-center justify-center animate-pulse">
                    <Upload size={11} className="text-quantum" />
                  </div>
                </div>

                <div className="text-center space-y-1.5">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground/80">
                    Drop an image here
                  </h3>
                  <p className="text-xs text-foreground/45 max-w-xs">
                    Drag & drop, paste from clipboard, or choose a file to edit
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-quantum/20 border border-quantum/40
                      text-quantum text-xs sm:text-sm font-semibold hover:bg-quantum/30 transition-all shadow-sm"
                  >
                    <Upload size={14} />
                    Browse File
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard?.read().then((items) => {
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
                    className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/10
                      text-foreground/50 text-xs sm:text-sm hover:border-white/20 hover:text-foreground/80 transition-all"
                  >
                    <Clipboard size={14} />
                    Paste
                  </button>
                  <button
                    onClick={() => editor.loadImage("/images/apps_backgrounds/image-editor.jfif")}
                    className="flex items-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl border border-white/10
                      text-foreground/50 text-xs sm:text-sm hover:border-quantum/40 hover:text-quantum transition-all"
                  >
                    <ImageIcon size={14} />
                    Try Sample
                  </button>
                </div>

                <p className="text-[10px] text-foreground/30 font-mono">
                  PNG · JPEG · WebP · GIF · BMP · SVG
                </p>
              </div>


            </div>
          ) : (
            /* Active Interactive Canvas */
            <div
              ref={canvasContainerRef}
              className="relative w-full h-full flex-1 touch-none overflow-hidden"
            >
              <canvas
                ref={editor.canvasRef}
                className="w-full h-full block"
                style={{ cursor: canvasCursor, touchAction: "none" }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={() => { handleCanvasMouseUp(); setCropHoverZone(null); }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />

              {/* Mobile Floating Drawer Trigger (When drawer is collapsed and tool is active) */}
              {isMobile && !mobileDrawerOpen && state.activeTool !== "select" && (
                <button
                  onClick={() => setMobileDrawerOpen(true)}
                  className="absolute bottom-10 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                    bg-quantum/20 border border-quantum/45 text-quantum text-xs font-mono shadow-[0_4px_20px_rgba(0,0,0,0.5)]
                    backdrop-blur-md animate-bounce"
                >
                  <SlidersHorizontal size={13} />
                  <span>{panelTitles[state.activeTool]}</span>
                  <ChevronUp size={12} />
                </button>
              )}
            </div>
          )}

          {/* Status bar */}
          {state.originalImage && (
            <div className="px-3 sm:px-4 py-1.5 bg-black/60 backdrop-blur-md
              flex items-center justify-between border-t border-white/8 z-10 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-foreground/45 min-w-0 pr-2">
                <Info size={11} className="text-quantum/60 flex-shrink-0" />
                <span className="truncate">{STATUS_TIPS[state.activeTool] || ''}</span>
              </div>
              <div className="text-[10px] font-mono text-foreground/35 flex-shrink-0 whitespace-nowrap">
                {Math.round(state.zoom * 100)}% · {dims.width}×{dims.height}
              </div>
            </div>
          )}

          {/* Drag-over overlay */}
          {isDragging && state.originalImage && (
            <div className="absolute inset-0 bg-quantum/15 border-2 border-dashed border-quantum/50
              flex items-center justify-center z-40 backdrop-blur-sm rounded-2xl">
              <div className="text-quantum font-semibold text-lg flex items-center gap-2 bg-black/60 px-5 py-3 rounded-2xl border border-quantum/30">
                <Upload size={22} />
                Drop to replace image
              </div>
            </div>
          )}
        </div>

        {/* Desktop Right Sidebar */}
        {state.originalImage && !isMobile && (
          <div className="w-72 flex-shrink-0 glass-card rounded-2xl p-4 overflow-y-auto
            border border-white/8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            <h3 className="text-[10px] font-mono text-foreground/45 uppercase tracking-widest font-semibold mb-4 flex items-center justify-between">
              <span>{panelTitles[state.activeTool] || "Tools"}</span>
              <span className="text-[9px] text-quantum/60 font-normal">Active</span>
            </h3>
            {renderToolControls()}
          </div>
        )}
      </div>

      {/* ── MOBILE CONTROLS & BOTTOM DOCK ── */}
      {isMobile && state.originalImage && (
        <div className="flex flex-col mt-2 z-20 flex-shrink-0">
          {/* Slide-Up Bottom Drawer for Active Tool Settings */}
          {mobileDrawerOpen && state.activeTool !== "select" && (
            <div className="glass-card rounded-2xl p-3 mb-2 border border-quantum/30 bg-[#0a081a]/95
              backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.6)] max-h-[46vh] overflow-y-auto
              scrollbar-thin scrollbar-thumb-white/10 animate-in slide-in-from-bottom-6 duration-200">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 sticky top-0 bg-[#0a081a]/90 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-quantum animate-pulse" />
                  <span className="text-xs font-semibold text-foreground/90 font-mono">
                    {panelTitles[state.activeTool]}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground/80 hover:bg-white/5 transition-colors"
                    title="Minimize Settings"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      editor.setTool("select");
                    }}
                    className="p-1.5 rounded-lg text-foreground/40 hover:text-crimson hover:bg-crimson/10 transition-colors"
                    title="Close Tool"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div>{renderToolControls()}</div>
            </div>
          )}

          {/* Horizontal Bottom Tool Dock */}
          <div className="glass-card rounded-2xl p-1 border border-white/10 bg-[#080614]/90 backdrop-blur-lg shadow-lg">
            <EditorToolbar
              activeTool={state.activeTool}
              onSelectTool={handleToolSelect}
              hasImage={!!state.originalImage}
              orientation="horizontal"
            />
          </div>
        </div>
      )}

      {/* Hidden file input for open / browse anytime */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
