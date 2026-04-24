"use client";

import { Code2, Copy, Check, X, Download } from "lucide-react";
import { useState, useRef } from "react";
import { generateSVG } from "../lib/latex"; // We actually get the raw SVG from DOM, but just in case
import type { DiagramState } from "../lib/types";

interface Props {
  latex: string;
  onClose: () => void;
  svgElementId: string;
}

export function ExportModal({ latex, onClose, svgElementId }: Props) {
  const [copied, setCopied] = useState(false);
  const [svgCopied, setSvgCopied] = useState(false);

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const extractAndCleanSVG = () => {
    const el = document.getElementById(svgElementId);
    if (!el) return "";
    
    // Clone and clean up internal interactive elements
    const clone = el.cloneNode(true) as SVGSVGElement;
    clone.removeAttribute("class");
    clone.style.background = "transparent";
    
    // Remove UI selection outlines, resize handles, drop previews etc.
    const handles = clone.querySelectorAll('circle[class*="cursor-"], rect[style*="pointer-events"], circle[style*="pointer-events"]');
    handles.forEach(h => h.remove());

    const svgString = new XMLSerializer().serializeToString(clone);
    return svgString;
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#0d0d1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6 bg-white/[0.02]">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code2 size={18} className="text-[#22d3ee]" />
            Export Diagram
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-foreground/50 hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          <p className="text-xs text-foreground/60 mb-3 px-1">
            Copy the LaTeX code below to use in your document. Requires the <code className="text-[#22d3ee] bg-[#22d3ee]/10 px-1 py-0.5 rounded">tikz-feynman</code> package.
          </p>
          <div className="relative group">
            <pre className="p-4 bg-black/50 border border-white/6 rounded-xl overflow-x-auto text-xs font-mono text-foreground/80 leading-relaxed selection:bg-quantum/30">
              <code>{latex}</code>
            </pre>
            <button 
              onClick={handleCopyLatex}
              className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center gap-2 text-xs font-medium"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy Code"}
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Vector Graphic Export</h3>
              <p className="text-xs text-foreground/50">Export as an SVG image for presentations or graphic editors.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleCopySVG}
                className="px-4 py-2 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                {svgCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                Copy SVG Code
              </button>
              <button 
                onClick={handleDownloadSVG}
                className="px-4 py-2 text-xs font-medium bg-[#22d3ee] text-black hover:bg-[#1bb8d0] rounded-lg transition-colors flex items-center gap-2"
              >
                <Download size={14} />
                Download .svg
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
