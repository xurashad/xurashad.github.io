"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  type EditorState,
  type EditorTool,
  type EditOperation,
  type FilterType,
  type AdjustmentValues,
  type AdjustmentType,
  type CropRect,
  type DrawStroke,
  type TextOverlay,
  type ExportFormat,
  DEFAULT_ADJUSTMENTS,
  CROP_PRESETS,
} from "./types";

// ── Filter application helpers ───────────────────────────────────────────────
function applyFilterToCtx(
  ctx: CanvasRenderingContext2D,
  filter: FilterType,
  w: number,
  h: number
) {
  if (filter === "none") return;

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  switch (filter) {
    case "vivid":
      for (let i = 0; i < d.length; i += 4) {
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        d[i] = clamp(d[i] + (d[i] - avg) * 0.5);
        d[i + 1] = clamp(d[i + 1] + (d[i + 1] - avg) * 0.5);
        d[i + 2] = clamp(d[i + 2] + (d[i + 2] - avg) * 0.5);
        // boost contrast
        d[i] = clamp((d[i] - 128) * 1.15 + 128);
        d[i + 1] = clamp((d[i + 1] - 128) * 1.15 + 128);
        d[i + 2] = clamp((d[i + 2] - 128) * 1.15 + 128);
      }
      break;
    case "warm":
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] + 18);
        d[i + 1] = clamp(d[i + 1] + 8);
        d[i + 2] = clamp(d[i + 2] - 12);
      }
      break;
    case "cool":
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] - 12);
        d[i + 1] = clamp(d[i + 1] + 4);
        d[i + 2] = clamp(d[i + 2] + 22);
      }
      break;
    case "noir":
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const c = clamp((lum - 128) * 1.4 + 128);
        d[i] = d[i + 1] = d[i + 2] = c;
      }
      break;
    case "sepia":
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        d[i] = clamp(r * 0.393 + g * 0.769 + b * 0.189);
        d[i + 1] = clamp(r * 0.349 + g * 0.686 + b * 0.168);
        d[i + 2] = clamp(r * 0.272 + g * 0.534 + b * 0.131);
      }
      break;
    case "vintage":
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] * 1.1 + 15);
        d[i + 1] = clamp(d[i + 1] * 0.95 + 10);
        d[i + 2] = clamp(d[i + 2] * 0.8 + 5);
        // lift blacks
        d[i] = clamp(d[i] * 0.9 + 20);
        d[i + 1] = clamp(d[i + 1] * 0.9 + 15);
        d[i + 2] = clamp(d[i + 2] * 0.9 + 12);
      }
      break;
    case "dramatic":
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp((d[i] - 128) * 1.5 + 128 - 10);
        d[i + 1] = clamp((d[i + 1] - 128) * 1.5 + 128 - 10);
        d[i + 2] = clamp((d[i + 2] - 128) * 1.5 + 128 - 10);
      }
      break;
    case "fade":
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] * 0.85 + 30);
        d[i + 1] = clamp(d[i + 1] * 0.85 + 30);
        d[i + 2] = clamp(d[i + 2] * 0.85 + 30);
      }
      break;
    case "cyberpunk":
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = clamp(d[i] * 0.7 + lum * 0.3 + (d[i] > 128 ? 30 : -10));
        d[i + 1] = clamp(d[i + 1] * 1.2 - 10);
        d[i + 2] = clamp(d[i + 2] * 1.3 + 15);
        // contrast boost
        d[i] = clamp((d[i] - 128) * 1.2 + 128);
        d[i + 1] = clamp((d[i + 1] - 128) * 1.2 + 128);
        d[i + 2] = clamp((d[i + 2] - 128) * 1.2 + 128);
      }
      break;
    case "film":
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] * 1.05 + 8);
        d[i + 1] = clamp(d[i + 1] * 1.0 + 5);
        d[i + 2] = clamp(d[i + 2] * 0.95 + 12);
        // slight lift
        d[i] = clamp(d[i] * 0.92 + 18);
        d[i + 1] = clamp(d[i + 1] * 0.92 + 15);
        d[i + 2] = clamp(d[i + 2] * 0.92 + 18);
      }
      break;
    case "sunset":
      for (let i = 0; i < d.length; i += 4) {
        d[i] = clamp(d[i] * 1.15 + 20);
        d[i + 1] = clamp(d[i + 1] * 0.9 + 10);
        d[i + 2] = clamp(d[i + 2] * 0.7);
        // warm saturation
        const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
        d[i] = clamp(d[i] + (d[i] - avg) * 0.3);
        d[i + 1] = clamp(d[i + 1] + (d[i + 1] - avg) * 0.15);
      }
      break;
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyAdjustments(
  ctx: CanvasRenderingContext2D,
  adj: AdjustmentValues,
  w: number,
  h: number
) {
  const hasPixelAdj =
    adj.brightness !== 0 ||
    adj.contrast !== 0 ||
    adj.saturation !== 0 ||
    adj.exposure !== 0 ||
    adj.temperature !== 0 ||
    adj.highlights !== 0 ||
    adj.shadows !== 0;

  if (hasPixelAdj) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;

    for (let i = 0; i < d.length; i += 4) {
      let r = d[i],
        g = d[i + 1],
        b = d[i + 2];

      // Exposure
      if (adj.exposure !== 0) {
        const f = Math.pow(2, adj.exposure / 100);
        r *= f;
        g *= f;
        b *= f;
      }

      // Brightness
      if (adj.brightness !== 0) {
        const bv = (adj.brightness / 100) * 80;
        r += bv;
        g += bv;
        b += bv;
      }

      // Contrast
      if (adj.contrast !== 0) {
        const cf = (adj.contrast + 100) / 100;
        r = (r - 128) * cf + 128;
        g = (g - 128) * cf + 128;
        b = (b - 128) * cf + 128;
      }

      // Saturation
      if (adj.saturation !== 0) {
        const avg = 0.299 * r + 0.587 * g + 0.114 * b;
        const sf = 1 + adj.saturation / 100;
        r = avg + (r - avg) * sf;
        g = avg + (g - avg) * sf;
        b = avg + (b - avg) * sf;
      }

      // Temperature
      if (adj.temperature !== 0) {
        const t = adj.temperature / 100;
        r += t * 25;
        b -= t * 25;
        g += t * 5;
      }

      // Highlights
      if (adj.highlights !== 0) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 160) {
          const factor = ((lum - 160) / 95) * (adj.highlights / 100) * 40;
          r += factor;
          g += factor;
          b += factor;
        }
      }

      // Shadows
      if (adj.shadows !== 0) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum < 90) {
          const factor = ((90 - lum) / 90) * (adj.shadows / 100) * 40;
          r += factor;
          g += factor;
          b += factor;
        }
      }

      d[i] = clamp(r);
      d[i + 1] = clamp(g);
      d[i + 2] = clamp(b);
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Blur (CSS filter on re-draw)
  if (adj.blur > 0) {
    const blurPx = (adj.blur / 100) * 10;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.filter = `blur(${blurPx}px)`;
    tempCtx.drawImage(ctx.canvas, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(tempCanvas, 0, 0);
  }

  // Sharpness (unsharp mask approximation)
  if (adj.sharpness > 0) {
    const amount = adj.sharpness / 100;
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;
    const copy = new Uint8ClampedArray(d);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const center = copy[idx + c] * 5;
          const neighbors =
            copy[idx - 4 + c] +
            copy[idx + 4 + c] +
            copy[idx - w * 4 + c] +
            copy[idx + w * 4 + c];
          const sharpened = center - neighbors;
          d[idx + c] = clamp(copy[idx + c] + sharpened * amount * 0.15);
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  // Vignette
  if (adj.vignette > 0) {
    const intensity = adj.vignette / 100;
    const cx = w / 2,
      cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);
    const gradient = ctx.createRadialGradient(cx, cy, maxR * (0.5 - intensity * 0.3), cx, cy, maxR);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${0.3 + intensity * 0.5})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

// ── Main hook ────────────────────────────────────────────────────────────────
export function useImageEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const [state, setState] = useState<EditorState>({
    originalImage: null,
    fileName: "",
    editHistory: [],
    historyIndex: -1,
    activeTool: "select",
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    currentFilter: "none",
    currentAdjustments: { ...DEFAULT_ADJUSTMENTS },
    currentCrop: null,
    cropPresetIndex: 0,
    currentStrokes: [],
    currentTextOverlays: [],
    drawColor: "#ff3366",
    drawSize: 6,
    drawOpacity: 100,
    drawTool: "brush",
    exportFormat: "png",
    exportQuality: 92,
  });

  // Get the current working canvas (after all committed edits)
  const getBaseCanvas = useCallback((): HTMLCanvasElement | null => {
    if (!state.originalImage) return null;

    const canvas = document.createElement("canvas");
    let w = state.originalImage.naturalWidth;
    let h = state.originalImage.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(state.originalImage, 0, 0);

    // Apply committed edit history
    const ops = state.editHistory.slice(0, state.historyIndex + 1);
    for (const op of ops) {
      applyOperation(canvas, ctx, op);
      w = canvas.width;
      h = canvas.height;
    }

    return canvas;
  }, [state.originalImage, state.editHistory, state.historyIndex]);

  // Render to the display canvas
  const render = useCallback(() => {
    const displayCanvas = canvasRef.current;
    if (!displayCanvas || !state.originalImage) return;

    const baseCanvas = getBaseCanvas();
    if (!baseCanvas) return;

    // Apply current (uncommitted) operations for live preview
    const previewCanvas = document.createElement("canvas");
    previewCanvas.width = baseCanvas.width;
    previewCanvas.height = baseCanvas.height;
    const previewCtx = previewCanvas.getContext("2d")!;
    previewCtx.drawImage(baseCanvas, 0, 0);

    // Apply current filter
    if (state.currentFilter !== "none") {
      applyFilterToCtx(previewCtx, state.currentFilter, previewCanvas.width, previewCanvas.height);
    }

    // Apply current adjustments
    const hasAdj = Object.values(state.currentAdjustments).some((v) => v !== 0);
    if (hasAdj) {
      applyAdjustments(previewCtx, state.currentAdjustments, previewCanvas.width, previewCanvas.height);
    }

    // Draw strokes
    if (state.currentStrokes.length > 0) {
      drawStrokes(previewCtx, state.currentStrokes);
    }

    // Draw text overlays
    if (state.currentTextOverlays.length > 0) {
      drawTextOverlays(previewCtx, state.currentTextOverlays);
    }

    // Save reference for export
    offscreenRef.current = previewCanvas;

    // Render to display canvas with zoom/pan
    const dpr = window.devicePixelRatio || 1;
    const rect = displayCanvas.getBoundingClientRect();
    displayCanvas.width = rect.width * dpr;
    displayCanvas.height = rect.height * dpr;
    const ctx = displayCanvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // Clear with checkerboard
    drawCheckerboard(ctx, rect.width, rect.height);

    // Calculate fitted dimensions
    const imgAspect = previewCanvas.width / previewCanvas.height;
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

    ctx.save();
    // Apply zoom from center
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    ctx.translate(cx, cy);
    ctx.scale(state.zoom, state.zoom);
    ctx.translate(-cx, -cy);

    ctx.drawImage(previewCanvas, drawX, drawY, drawW, drawH);

    // Draw crop overlay if cropping
    if (state.activeTool === "crop" && state.currentCrop) {
      const scaleX = drawW / previewCanvas.width;
      const scaleY = drawH / previewCanvas.height;
      const crop = state.currentCrop;

      const cropScreenX = drawX + crop.x * scaleX;
      const cropScreenY = drawY + crop.y * scaleY;
      const cropScreenW = crop.width * scaleX;
      const cropScreenH = crop.height * scaleY;

      // Dark overlay outside crop
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      // Top
      ctx.fillRect(drawX, drawY, drawW, crop.y * scaleY);
      // Bottom
      ctx.fillRect(
        drawX,
        cropScreenY + cropScreenH,
        drawW,
        drawH - (crop.y + crop.height) * scaleY
      );
      // Left
      ctx.fillRect(drawX, cropScreenY, crop.x * scaleX, cropScreenH);
      // Right
      ctx.fillRect(
        cropScreenX + cropScreenW,
        cropScreenY,
        drawW - (crop.x + crop.width) * scaleX,
        cropScreenH
      );

      // Glow border
      ctx.save();
      ctx.shadowColor = "rgba(0,195,245,0.4)";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "#00c3f5";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cropScreenX, cropScreenY, cropScreenW, cropScreenH);
      ctx.restore();

      // Secondary inner border (white subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cropScreenX + 1, cropScreenY + 1, cropScreenW - 2, cropScreenH - 2);

      // Rule of thirds lines
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 4]);
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(cropScreenX + (cropScreenW * i) / 3, cropScreenY);
        ctx.lineTo(cropScreenX + (cropScreenW * i) / 3, cropScreenY + cropScreenH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cropScreenX, cropScreenY + (cropScreenH * i) / 3);
        ctx.lineTo(cropScreenX + cropScreenW, cropScreenY + (cropScreenH * i) / 3);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // L-shaped corner brackets (professional look)
      const bracketLen = Math.min(20, cropScreenW * 0.15, cropScreenH * 0.15);
      const bracketW = 3;
      ctx.save();
      ctx.shadowColor = "rgba(0,195,245,0.5)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = "#00c3f5";

      // Top-left
      ctx.fillRect(cropScreenX - 1, cropScreenY - 1, bracketLen, bracketW);
      ctx.fillRect(cropScreenX - 1, cropScreenY - 1, bracketW, bracketLen);
      // Top-right
      ctx.fillRect(cropScreenX + cropScreenW - bracketLen + 1, cropScreenY - 1, bracketLen, bracketW);
      ctx.fillRect(cropScreenX + cropScreenW - bracketW + 1, cropScreenY - 1, bracketW, bracketLen);
      // Bottom-left
      ctx.fillRect(cropScreenX - 1, cropScreenY + cropScreenH - bracketW + 1, bracketLen, bracketW);
      ctx.fillRect(cropScreenX - 1, cropScreenY + cropScreenH - bracketLen + 1, bracketW, bracketLen);
      // Bottom-right
      ctx.fillRect(cropScreenX + cropScreenW - bracketLen + 1, cropScreenY + cropScreenH - bracketW + 1, bracketLen, bracketW);
      ctx.fillRect(cropScreenX + cropScreenW - bracketW + 1, cropScreenY + cropScreenH - bracketLen + 1, bracketW, bracketLen);
      ctx.restore();

      // Edge midpoint handles (small bars)
      ctx.fillStyle = "rgba(0,195,245,0.8)";
      const midW = 16, midH = 4;
      // Top mid
      ctx.fillRect(cropScreenX + cropScreenW / 2 - midW / 2, cropScreenY - midH / 2, midW, midH);
      // Bottom mid
      ctx.fillRect(cropScreenX + cropScreenW / 2 - midW / 2, cropScreenY + cropScreenH - midH / 2, midW, midH);
      // Left mid
      ctx.fillRect(cropScreenX - midH / 2, cropScreenY + cropScreenH / 2 - midW / 2, midH, midW);
      // Right mid
      ctx.fillRect(cropScreenX + cropScreenW - midH / 2, cropScreenY + cropScreenH / 2 - midW / 2, midH, midW);

      // Dimension label inside crop area
      const cropW = Math.round(crop.width);
      const cropH = Math.round(crop.height);
      const dimLabel = `${cropW} × ${cropH}`;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const labelMetrics = ctx.measureText(dimLabel);
      const labelPadX = 8, labelPadY = 4;
      const labelX = cropScreenX + cropScreenW / 2;
      const labelY = cropScreenY + cropScreenH + 16;
      // Only draw if there's room below the crop
      if (labelY + 10 < drawY + drawH) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.beginPath();
        ctx.roundRect(
          labelX - labelMetrics.width / 2 - labelPadX,
          labelY - 8 - labelPadY,
          labelMetrics.width + labelPadX * 2,
          16 + labelPadY * 2,
          4
        );
        ctx.fill();
        ctx.fillStyle = "rgba(0,195,245,0.9)";
        ctx.fillText(dimLabel, labelX, labelY);
      }
    }

    ctx.restore();
  }, [state, getBaseCanvas]);

  // Render on state changes
  useEffect(() => {
    const raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [render]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const loadImage = useCallback((source: File | string) => {
    if (typeof source === "string") {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const crop: CropRect = { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
        const fileName = source.split("/").pop() || "sample-image.jpg";
        setState((prev) => ({
          ...prev,
          originalImage: img,
          fileName,
          editHistory: [],
          historyIndex: -1,
          currentFilter: "none",
          currentAdjustments: { ...DEFAULT_ADJUSTMENTS },
          currentCrop: crop,
          cropPresetIndex: 0,
          currentStrokes: [],
          currentTextOverlays: [],
          zoom: 1,
          panOffset: { x: 0, y: 0 },
          activeTool: "select",
        }));
      };
      img.src = source;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Initialize crop to full image
        const crop: CropRect = { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight };
        setState((prev) => ({
          ...prev,
          originalImage: img,
          fileName: source.name,
          editHistory: [],
          historyIndex: -1,
          currentFilter: "none",
          currentAdjustments: { ...DEFAULT_ADJUSTMENTS },
          currentCrop: crop,
          cropPresetIndex: 0,
          currentStrokes: [],
          currentTextOverlays: [],
          zoom: 1,
          panOffset: { x: 0, y: 0 },
          activeTool: "select",
        }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(source);
  }, []);

  const setTool = useCallback((tool: EditorTool) => {
    setState((prev) => {
      const next = { ...prev, activeTool: tool };
      // Initialize crop rect if switching to crop tool
      if (tool === "crop" && !prev.currentCrop && prev.originalImage) {
        const baseCanvas = document.createElement("canvas");
        let w = prev.originalImage.naturalWidth;
        let h = prev.originalImage.naturalHeight;
        baseCanvas.width = w;
        baseCanvas.height = h;
        const ctx = baseCanvas.getContext("2d")!;
        ctx.drawImage(prev.originalImage, 0, 0);
        const ops = prev.editHistory.slice(0, prev.historyIndex + 1);
        for (const op of ops) {
          applyOperation(baseCanvas, ctx, op);
          w = baseCanvas.width;
          h = baseCanvas.height;
        }
        next.currentCrop = { x: 0, y: 0, width: w, height: h };
      }
      return next;
    });
  }, []);

  const commitOperation = useCallback((op: EditOperation) => {
    setState((prev) => {
      const newHistory = prev.editHistory.slice(0, prev.historyIndex + 1);
      newHistory.push(op);
      return {
        ...prev,
        editHistory: newHistory,
        historyIndex: newHistory.length - 1,
        // Reset current working state after commit
        currentFilter: op.type === "filter" ? "none" : prev.currentFilter,
        currentAdjustments: op.type === "adjustments" ? { ...DEFAULT_ADJUSTMENTS } : prev.currentAdjustments,
        currentCrop:
          op.type === "crop"
            ? (() => {
                // Recalculate canvas size after crop
                const w = op.rect.width;
                const h = op.rect.height;
                return { x: 0, y: 0, width: w, height: h };
              })()
            : prev.currentCrop,
        currentStrokes: op.type === "draw" ? [] : prev.currentStrokes,
        currentTextOverlays: op.type === "text" ? [] : prev.currentTextOverlays,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex < 0) return prev;
      const newIndex = prev.historyIndex - 1;
      // Recalculate crop rect for new canvas size
      let w = prev.originalImage?.naturalWidth ?? 0;
      let h = prev.originalImage?.naturalHeight ?? 0;
      if (prev.originalImage) {
        const ops = prev.editHistory.slice(0, newIndex + 1);
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = w;
        tmpCanvas.height = h;
        const tmpCtx = tmpCanvas.getContext("2d")!;
        tmpCtx.drawImage(prev.originalImage, 0, 0);
        for (const op of ops) {
          applyOperation(tmpCanvas, tmpCtx, op);
          w = tmpCanvas.width;
          h = tmpCanvas.height;
        }
      }
      return {
        ...prev,
        historyIndex: newIndex,
        currentCrop: { x: 0, y: 0, width: w, height: h },
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.editHistory.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      let w = prev.originalImage?.naturalWidth ?? 0;
      let h = prev.originalImage?.naturalHeight ?? 0;
      if (prev.originalImage) {
        const ops = prev.editHistory.slice(0, newIndex + 1);
        const tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = w;
        tmpCanvas.height = h;
        const tmpCtx = tmpCanvas.getContext("2d")!;
        tmpCtx.drawImage(prev.originalImage, 0, 0);
        for (const op of ops) {
          applyOperation(tmpCanvas, tmpCtx, op);
          w = tmpCanvas.width;
          h = tmpCanvas.height;
        }
      }
      return {
        ...prev,
        historyIndex: newIndex,
        currentCrop: { x: 0, y: 0, width: w, height: h },
      };
    });
  }, []);

  const setFilter = useCallback((filter: FilterType) => {
    setState((prev) => ({ ...prev, currentFilter: filter }));
  }, []);

  const setAdjustment = useCallback((key: AdjustmentType, value: number) => {
    setState((prev) => ({
      ...prev,
      currentAdjustments: { ...prev.currentAdjustments, [key]: value },
    }));
  }, []);

  const resetAdjustments = useCallback(() => {
    setState((prev) => ({ ...prev, currentAdjustments: { ...DEFAULT_ADJUSTMENTS } }));
  }, []);

  const setCrop = useCallback((crop: CropRect) => {
    setState((prev) => ({ ...prev, currentCrop: crop }));
  }, []);

  const setCropPreset = useCallback(
    (index: number) => {
      setState((prev) => {
        const preset = CROP_PRESETS[index];
        if (!prev.originalImage) return { ...prev, cropPresetIndex: index };

        const baseCanvas = getBaseCanvas();
        if (!baseCanvas) return prev;
        const w = baseCanvas.width;
        const h = baseCanvas.height;

        let cropRect: CropRect;
        if (preset.ratio === null) {
          cropRect = { x: 0, y: 0, width: w, height: h };
        } else {
          const canvasRatio = w / h;
          if (preset.ratio > canvasRatio) {
            const cropW = w;
            const cropH = w / preset.ratio;
            cropRect = { x: 0, y: (h - cropH) / 2, width: cropW, height: cropH };
          } else {
            const cropH = h;
            const cropW = h * preset.ratio;
            cropRect = { x: (w - cropW) / 2, y: 0, width: cropW, height: cropH };
          }
        }

        return { ...prev, cropPresetIndex: index, currentCrop: cropRect };
      });
    },
    [getBaseCanvas]
  );

  const applyCrop = useCallback(() => {
    if (!state.currentCrop) return;
    commitOperation({ type: "crop", rect: { ...state.currentCrop } });
  }, [state.currentCrop, commitOperation]);

  const rotate = useCallback(
    (degrees: 90 | 180 | 270) => {
      commitOperation({ type: "rotate", degrees });
    },
    [commitOperation]
  );

  const flip = useCallback(
    (axis: "horizontal" | "vertical") => {
      commitOperation({ type: "flip", axis });
    },
    [commitOperation]
  );

  const applyFilter = useCallback(() => {
    if (state.currentFilter === "none") return;
    commitOperation({ type: "filter", filter: state.currentFilter });
  }, [state.currentFilter, commitOperation]);

  const applyAdjustmentsAction = useCallback(() => {
    const hasAdj = Object.values(state.currentAdjustments).some((v) => v !== 0);
    if (!hasAdj) return;
    commitOperation({ type: "adjustments", values: { ...state.currentAdjustments } });
  }, [state.currentAdjustments, commitOperation]);

  const addStroke = useCallback((stroke: DrawStroke) => {
    setState((prev) => ({
      ...prev,
      currentStrokes: [...prev.currentStrokes, stroke],
    }));
  }, []);

  const applyDrawing = useCallback(() => {
    if (state.currentStrokes.length === 0) return;
    commitOperation({ type: "draw", strokes: [...state.currentStrokes] });
  }, [state.currentStrokes, commitOperation]);

  const addTextOverlay = useCallback((overlay: TextOverlay) => {
    setState((prev) => ({
      ...prev,
      currentTextOverlays: [...prev.currentTextOverlays, overlay],
    }));
  }, []);

  const updateTextOverlay = useCallback((id: string, updates: Partial<TextOverlay>) => {
    setState((prev) => ({
      ...prev,
      currentTextOverlays: prev.currentTextOverlays.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  const removeTextOverlay = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      currentTextOverlays: prev.currentTextOverlays.filter((t) => t.id !== id),
    }));
  }, []);

  const applyTextOverlays = useCallback(() => {
    if (state.currentTextOverlays.length === 0) return;
    commitOperation({ type: "text", overlays: [...state.currentTextOverlays] });
  }, [state.currentTextOverlays, commitOperation]);

  const setZoom = useCallback((zoom: number | ((prev: number) => number)) => {
    setState((prev) => {
      const val = typeof zoom === "function" ? zoom(prev.zoom) : zoom;
      return { ...prev, zoom: Math.max(0.1, Math.min(5, val)) };
    });
  }, []);

  const setPan = useCallback((x: number, y: number) => {
    setState((prev) => ({ ...prev, panOffset: { x, y } }));
  }, []);

  const resetView = useCallback(() => {
    setState((prev) => ({ ...prev, zoom: 1, panOffset: { x: 0, y: 0 } }));
  }, []);

  const setDrawColor = useCallback((color: string) => {
    setState((prev) => ({ ...prev, drawColor: color }));
  }, []);

  const setDrawSize = useCallback((size: number) => {
    setState((prev) => ({ ...prev, drawSize: size }));
  }, []);

  const setDrawOpacity = useCallback((opacity: number) => {
    setState((prev) => ({ ...prev, drawOpacity: opacity }));
  }, []);

  const setDrawTool = useCallback((tool: "brush" | "eraser") => {
    setState((prev) => ({ ...prev, drawTool: tool }));
  }, []);

  const exportImage = useCallback(() => {
    const canvas = offscreenRef.current;
    if (!canvas) return;

    const format = state.exportFormat;
    const quality = state.exportQuality / 100;
    const mimeType =
      format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
    const ext = format === "jpeg" ? "jpg" : format;

    const dataUrl = canvas.toDataURL(mimeType, quality);
    const a = document.createElement("a");
    const baseName = state.fileName.replace(/\.[^.]+$/, "") || "edited-image";
    a.download = `${baseName}-edited.${ext}`;
    a.href = dataUrl;
    a.click();
  }, [state.exportFormat, state.exportQuality, state.fileName]);

  const setExportFormat = useCallback((format: ExportFormat) => {
    setState((prev) => ({ ...prev, exportFormat: format }));
  }, []);

  const setExportQuality = useCallback((quality: number) => {
    setState((prev) => ({ ...prev, exportQuality: quality }));
  }, []);

  // Get current image dimensions (after all committed edits)
  const getCurrentDimensions = useCallback((): { width: number; height: number } => {
    const baseCanvas = getBaseCanvas();
    if (!baseCanvas) return { width: 0, height: 0 };
    return { width: baseCanvas.width, height: baseCanvas.height };
  }, [getBaseCanvas]);

  const resize = useCallback(
    (width: number, height: number) => {
      commitOperation({ type: "resize", width, height });
    },
    [commitOperation]
  );

  return {
    state,
    canvasRef,
    loadImage,
    setTool,
    undo,
    redo,
    setFilter,
    applyFilter,
    setAdjustment,
    resetAdjustments,
    applyAdjustmentsAction,
    setCrop,
    setCropPreset,
    applyCrop,
    rotate,
    flip,
    resize,
    addStroke,
    applyDrawing,
    addTextOverlay,
    updateTextOverlay,
    removeTextOverlay,
    applyTextOverlays,
    setZoom,
    setPan,
    resetView,
    setDrawColor,
    setDrawSize,
    setDrawOpacity,
    setDrawTool,
    exportImage,
    setExportFormat,
    setExportQuality,
    getCurrentDimensions,
    getBaseCanvas,
    render,
  };
}

// ── Helper: Apply a committed operation to a canvas ──────────────────────────
function applyOperation(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  op: EditOperation
) {
  const w = canvas.width;
  const h = canvas.height;

  switch (op.type) {
    case "crop": {
      const { x, y, width, height } = op.rect;
      const imageData = ctx.getImageData(x, y, width, height);
      canvas.width = width;
      canvas.height = height;
      ctx.putImageData(imageData, 0, 0);
      break;
    }
    case "rotate": {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(canvas, 0, 0);

      if (op.degrees === 90 || op.degrees === 270) {
        canvas.width = h;
        canvas.height = w;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((op.degrees * Math.PI) / 180);
      ctx.drawImage(tempCanvas, -w / 2, -h / 2);
      ctx.restore();
      break;
    }
    case "flip": {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(canvas, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      if (op.axis === "horizontal") {
        ctx.scale(-1, 1);
        ctx.drawImage(tempCanvas, -w, 0);
      } else {
        ctx.scale(1, -1);
        ctx.drawImage(tempCanvas, 0, -h);
      }
      ctx.restore();
      break;
    }
    case "resize": {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(canvas, 0, 0);
      canvas.width = op.width;
      canvas.height = op.height;
      ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, op.width, op.height);
      break;
    }
    case "filter":
      applyFilterToCtx(ctx, op.filter, canvas.width, canvas.height);
      break;
    case "adjustments":
      applyAdjustments(ctx, op.values, canvas.width, canvas.height);
      break;
    case "draw":
      drawStrokes(ctx, op.strokes);
      break;
    case "text":
      drawTextOverlays(ctx, op.overlays);
      break;
  }
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: DrawStroke[]) {
  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;
    ctx.save();
    ctx.globalAlpha = stroke.opacity / 100;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.size;

    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.strokeStyle = stroke.color;
    }

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawTextOverlays(ctx: CanvasRenderingContext2D, overlays: TextOverlay[]) {
  for (const overlay of overlays) {
    ctx.save();
    const style = `${overlay.italic ? "italic " : ""}${overlay.bold ? "bold " : ""}${overlay.fontSize}px ${overlay.fontFamily}`;
    ctx.font = style;
    ctx.fillStyle = overlay.color;
    ctx.textBaseline = "top";
    ctx.fillText(overlay.text, overlay.x, overlay.y);
    ctx.restore();
  }
}

function drawCheckerboard(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const size = 12;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#222240";
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
        ctx.fillRect(x, y, size, size);
      }
    }
  }
}
