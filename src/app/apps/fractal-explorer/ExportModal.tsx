"use client";

import { useRef, useState } from "react";
import { Download, FileJson, Upload, X } from "lucide-react";
import { parseSettingsJSON, serializeSettingsJSON } from "./lib/persistence";
import { renderOfflineExport } from "./lib/workerEngine";
import type { ExportConfig, FractalSettings } from "./lib/types";

interface Props {
  settings: FractalSettings;
  viewportSize: { w: number; h: number };
  getActiveCanvas: () => HTMLCanvasElement | null;
  onImportSettings: (s: FractalSettings) => void;
  onClose: () => void;
}

const RES_PRESETS = [
  { label: "Viewport", w: 0, h: 0 },
  { label: "1920×1080 (HD)", w: 1920, h: 1080 },
  { label: "2560×1440 (QHD)", w: 2560, h: 1440 },
  { label: "3840×2160 (4K)", w: 3840, h: 2160 },
  { label: "2048×2048 (Square)", w: 2048, h: 2048 },
];

export function ExportModal({
  settings,
  viewportSize,
  getActiveCanvas,
  onImportSettings,
  onClose,
}: Props) {
  const [width, setWidth] = useState(Math.max(800, viewportSize.w || 1920));
  const [height, setHeight] = useState(Math.max(600, viewportSize.h || 1080));
  const [format, setFormat] = useState<"png" | "webp" | "jpeg">("png");
  const [aa, setAa] = useState<1 | 2 | 4>(2);
  const [watermark, setWatermark] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerDownload = (blob: Blob, ext: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${settings.family}-${settings.isJulia ? "julia-" : ""}${width}x${height}.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleRenderAndDownload = async () => {
    setErrorMsg(null);
    const activeCanvas = getActiveCanvas();
    // Fast direct canvas grab when matching viewport and 1x AA without watermark
    if (
      activeCanvas &&
      Math.abs(width - viewportSize.w) <= 2 &&
      Math.abs(height - viewportSize.h) <= 2 &&
      aa === 1 &&
      !watermark
    ) {
      const mime =
        format === "webp" ? "image/webp" : format === "jpeg" ? "image/jpeg" : "image/png";
      activeCanvas.toBlob(
        blob => {
          if (blob) triggerDownload(blob, format);
        },
        mime,
        0.94,
      );
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setRendering(true);
    setProgress(0);

    try {
      const cfg: ExportConfig = {
        width,
        height,
        format,
        quality: 0.94,
        aa,
        watermark,
      };
      const blob = await renderOfflineExport(
        settings,
        cfg,
        p => setProgress(p),
        controller.signal,
      );
      triggerDownload(blob, format);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setErrorMsg("Render failed — try lower resolution or 2× AA.");
      }
    } finally {
      setRendering(false);
      abortRef.current = null;
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([serializeSettingsJSON(settings)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${settings.family}-preset.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = parseSettingsJSON(text);
      if (!parsed) {
        setImportError("Invalid Fractal Explorer preset JSON.");
        return;
      }
      onImportSettings(parsed);
      onClose();
    } catch {
      setImportError("Could not read file.");
    }
  };

  return (
    <div className="fe-modal-backdrop" onClick={() => !rendering && onClose()}>
      <div
        className="fe-glass rounded-2xl w-full max-w-lg overflow-hidden text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-400/15">
          <div>
            <h2 className="font-serif font-bold text-base">Studio Export & Presets</h2>
            <p className="text-[11px] font-mono text-slate-400">
              High-precision Float64 offline render up to 4K UHD
            </p>
          </div>
          <button
            onClick={() => {
              abortRef.current?.abort();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Resolution Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Resolution
            </span>
            <div className="flex flex-wrap gap-1.5">
              {RES_PRESETS.map(p => {
                const pw = p.w || Math.max(128, viewportSize.w || 1280);
                const ph = p.h || Math.max(128, viewportSize.h || 720);
                const active = width === pw && height === ph;
                return (
                  <button
                    key={p.label}
                    onClick={() => {
                      setWidth(pw);
                      setHeight(ph);
                    }}
                    disabled={rendering}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all ${
                      active
                        ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                        : "border-slate-400/20 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <label className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Width (px)</span>
                <input
                  type="number"
                  min={128}
                  max={7680}
                  value={width}
                  disabled={rendering}
                  onChange={e => setWidth(Math.max(128, Math.min(7680, parseInt(e.target.value) || 1280)))}
                  className="fe-input font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400">Height (px)</span>
                <input
                  type="number"
                  min={128}
                  max={4320}
                  value={height}
                  disabled={rendering}
                  onChange={e => setHeight(Math.max(128, Math.min(4320, parseInt(e.target.value) || 720)))}
                  className="fe-input font-mono"
                />
              </label>
            </div>
          </div>

          {/* Format + AA */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Format
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(["png", "webp", "jpeg"] as const).map(f => (
                  <button
                    key={f}
                    disabled={rendering}
                    onClick={() => setFormat(f)}
                    className={`py-1.5 text-[11px] font-mono uppercase rounded-lg border transition-all ${
                      format === f
                        ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-200"
                        : "border-slate-400/20 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Supersampling AA
              </span>
              <div className="grid grid-cols-3 gap-1">
                {([1, 2, 4] as const).map(val => (
                  <button
                    key={val}
                    disabled={rendering}
                    onClick={() => setAa(val)}
                    className={`py-1.5 text-[11px] font-mono rounded-lg border transition-all ${
                      aa === val
                        ? "border-violet-400/50 bg-violet-500/20 text-violet-200"
                        : "border-slate-400/20 text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    {val === 1 ? "1×" : val === 2 ? "2×2" : "4×4"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={watermark}
              disabled={rendering}
              onChange={e => setWatermark(e.target.checked)}
              className="accent-cyan-400"
            />
            Include mathematical coordinate caption watermark
          </label>

          {rendering && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-cyan-300">
                <span>Rendering Float64 offline frame…</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all duration-100"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          )}

          {errorMsg && <p className="text-xs text-red-300">{errorMsg}</p>}
          {importError && <p className="text-xs text-red-300">{importError}</p>}

          {/* JSON Preset Export / Import */}
          <div className="pt-3 border-t border-slate-400/15 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleExportJson}
                disabled={rendering}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-400/25 text-slate-200 hover:bg-white/5"
              >
                <FileJson size={13} /> Export JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={rendering}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-400/25 text-slate-200 hover:bg-white/5"
              >
                <Upload size={13} /> Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            {rendering ? (
              <button
                onClick={() => abortRef.current?.abort()}
                className="px-4 py-1.5 text-xs rounded-lg border border-red-400/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 font-semibold"
              >
                Cancel Render
              </button>
            ) : (
              <button
                onClick={handleRenderAndDownload}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs rounded-lg border border-cyan-400/50 bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/30 font-semibold"
              >
                <Download size={13} /> Render & Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
