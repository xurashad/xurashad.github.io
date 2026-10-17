"use client";

import { Code2, Copy, Check, X, Download, Image as ImageIcon } from "lucide-react";
import { useState, useCallback } from "react";
import type { DiagramState } from "../lib/types";

interface Props {
  latex: string;
  state: DiagramState;
  onClose: () => void;
  svgElementId: string;
}

export function ExportModal({ latex, state, onClose, svgElementId }: Props) {
  const [copied, setCopied] = useState(false);
  const [svgCopied, setSvgCopied] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Compute tight bounding box of all diagram components
  const computeBoundingBox = useCallback(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    state.vertices.forEach((v) => {
      minX = Math.min(minX, v.x - 15);
      minY = Math.min(minY, v.y - 15);
      maxX = Math.max(maxX, v.x + 15);
      maxY = Math.max(maxY, v.y + 15);
    });

    state.particles.forEach((p) => {
      const bendExtra = Math.abs(p.bend) + 20;
      minX = Math.min(minX, p.startX - bendExtra, p.endX - bendExtra);
      minY = Math.min(minY, p.startY - bendExtra, p.endY - bendExtra);
      maxX = Math.max(maxX, p.startX + bendExtra, p.endX + bendExtra);
      maxY = Math.max(maxY, p.startY + bendExtra, p.endY + bendExtra);
    });

    state.textLabels.forEach((t) => {
      minX = Math.min(minX, t.x - 60);
      minY = Math.min(minY, t.y - 30);
      maxX = Math.max(maxX, t.x + 60);
      maxY = Math.max(maxY, t.y + 30);
    });

    state.ellipses.forEach((e) => {
      minX = Math.min(minX, e.x - e.rx - 10);
      minY = Math.min(minY, e.y - e.ry - 10);
      maxX = Math.max(maxX, e.x + e.rx + 10);
      maxY = Math.max(maxY, e.y + e.ry + 10);
    });

    state.rectangles.forEach((r) => {
      minX = Math.min(minX, r.x - r.width / 2 - 10);
      minY = Math.min(minY, r.y - r.height / 2 - 10);
      maxX = Math.max(maxX, r.x + r.width / 2 + 10);
      maxY = Math.max(maxY, r.y + r.height / 2 + 10);
    });

    if (!isFinite(minX) || !isFinite(minY)) {
      return { x: 0, y: 0, width: 800, height: 600 };
    }

    const padding = 35;
    const x = Math.max(0, Math.floor(minX - padding));
    const y = Math.max(0, Math.floor(minY - padding));
    const width = Math.ceil(maxX - minX + padding * 2);
    const height = Math.ceil(maxY - minY + padding * 2);

    return { x, y, width, height };
  }, [state]);

  const extractAndCleanSVG = useCallback(() => {
    const el = document.getElementById(svgElementId);
    if (!el) return "";

    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.removeAttribute("class");
    clone.removeAttribute("style");
    clone.style.backgroundColor = "#0d0d1a";

    // Crop viewBox tightly to diagram elements
    const bb = computeBoundingBox();
    clone.setAttribute("viewBox", `${bb.x} ${bb.y} ${bb.width} ${bb.height}`);
    clone.setAttribute("width", `${bb.width}`);
    clone.setAttribute("height", `${bb.height}`);

    // Remove interactive UI handles, snap markers, selection outlines, and foreignObjects
    const handles = clone.querySelectorAll(
      'circle[class*="cursor-"], rect[style*="pointer-events"], circle[style*="pointer-events"], foreignObject, rect[stroke-dasharray="4 3"], [data-handle]'
    );
    handles.forEach((h) => h.remove());

    return new XMLSerializer().serializeToString(clone);
  }, [computeBoundingBox, svgElementId]);

  const handleDownloadSVG = () => {
    const svgString = extractAndCleanSVG();
    if (!svgString) return;

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "feynman-diagram.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySVG = () => {
    const svgString = extractAndCleanSVG();
    if (!svgString) return;
    navigator.clipboard.writeText(svgString).then(() => {
      setSvgCopied(true);
      setTimeout(() => setSvgCopied(false), 2000);
    });
  };

  const handleDownloadPNG = () => {
    const svgString = extractAndCleanSVG();
    if (!svgString) return;

    setIsExportingPng(true);
    const bb = computeBoundingBox();
    const scale = 2; // 2x retina crispness

    const canvas = document.createElement("canvas");
    canvas.width = bb.width * scale;
    canvas.height = bb.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExportingPng(false);
      return;
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = "#0d0d1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) {
          setIsExportingPng(false);
          return;
        }
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = "feynman-diagram.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
        setIsExportingPng(false);
      }, "image/png");
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setIsExportingPng(false);
    };

    img.src = url;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6 bg-white/[0.02]">
          <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Code2 size={18} className="text-[#22d3ee]" />
            <span>Export Feynman Diagram</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-foreground/50 hover:text-foreground"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-6">
          {/* LaTeX Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs sm:text-sm font-semibold font-mono text-quantum">
                1. LaTeX TikZ Code (tikz-feynman)
              </h3>
              <button
                type="button"
                onClick={handleCopyLatex}
                className="px-3 py-1 bg-quantum/15 hover:bg-quantum/25 text-quantum border border-quantum/30 rounded-md text-xs font-mono font-medium transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                <span>{copied ? "Copied!" : "Copy TikZ Code"}</span>
              </button>
            </div>
            <p className="text-xs text-foreground/55 mb-2">
              Requires the <code className="text-[#22d3ee] bg-[#22d3ee]/10 px-1 py-0.5 rounded font-mono">tikz-feynman</code> package. Compile with LuaLaTeX or pdfLaTeX.
            </p>
            <pre className="p-3.5 bg-black/60 border border-white/8 rounded-xl overflow-x-auto text-xs font-mono text-foreground/80 leading-relaxed selection:bg-quantum/30 max-h-48">
              <code>{latex}</code>
            </pre>
          </div>

          {/* Graphics Section */}
          <div className="pt-4 border-t border-white/6">
            <h3 className="text-xs sm:text-sm font-semibold font-mono text-quantum mb-1">
              2. Vector & Raster Graphics Export
            </h3>
            <p className="text-xs text-foreground/55 mb-3">
              Diagrams are automatically cropped with zero wasted canvas margins.
            </p>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleDownloadSVG}
                className="flex-1 min-w-[130px] px-3.5 py-2.5 text-xs font-mono font-semibold bg-[#22d3ee] text-black hover:bg-[#1bb8d0] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10"
              >
                <Download size={14} />
                <span>Download .svg</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPNG}
                disabled={isExportingPng}
                className="flex-1 min-w-[130px] px-3.5 py-2.5 text-xs font-mono font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ImageIcon size={14} />
                <span>{isExportingPng ? "Rendering..." : "Download .png (2×)"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySVG}
                className="px-3.5 py-2.5 text-xs font-mono font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-foreground/80 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                {svgCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span>{svgCopied ? "Copied!" : "Copy SVG"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
