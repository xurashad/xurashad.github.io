"use client";

import { useState } from "react";
import { FileText, Images, FileDown, Combine, ArrowLeft } from "lucide-react";
import { ExtractTool } from "./components/ExtractTool";
import { ImagesToPdfTool } from "./components/ImagesToPdfTool";
import { PdfToImagesTool } from "./components/PdfToImagesTool";
import { MergeTool } from "./components/MergeTool";
import type { AppMode } from "./lib/types";

const TOOLS: {
  mode: AppMode;
  title: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent: string;
}[] = [
  {
    mode: "extract",
    title: "Extract Pages",
    desc: "Select specific pages from a PDF and save them as a new document.",
    icon: FileText,
    accent: "quantum",
  },
  {
    mode: "images-to-pdf",
    title: "Images → PDF",
    desc: "Combine JPG, PNG, or WEBP images into a single PDF with custom page sizes.",
    icon: Images,
    accent: "olive",
  },
  {
    mode: "pdf-to-images",
    title: "PDF → Images",
    desc: "Export every page of a PDF as high-quality JPG, PNG, or WEBP images in a ZIP.",
    icon: FileDown,
    accent: "crimson",
  },
  {
    mode: "merge",
    title: "Merge PDFs",
    desc: "Drag and drop to reorder, then combine multiple PDF files into one.",
    icon: Combine,
    accent: "quantum",
  },
];

export function PdfToolsApp() {
  const [mode, setMode] = useState<AppMode>("select");

  const back = () => setMode("select");

  // ── Tool selector ──────────────────────────────────────────────────────────
  if (mode === "select") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TOOLS.map(({ mode: m, title, desc, icon: Icon, accent }) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`glass-card p-6 flex flex-col items-center text-center gap-4 cursor-pointer hover:-translate-y-1 hover:shadow-[0_0_24px_rgba(0,0,0,0.3)] transition-all duration-200 hover:border-${accent}/30`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${accent}/10 border border-${accent}/20`}>
              <Icon size={24} className={`text-${accent}`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground/80 mb-1">{title}</h3>
              <p className="text-xs text-foreground/40 leading-relaxed">{desc}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // ── Back bar common header ─────────────────────────────────────────────────
  const tool = TOOLS.find((t) => t.mode === mode)!;

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-xs font-mono text-foreground/35">
        <button onClick={back} className="flex items-center gap-1 hover:text-quantum transition-colors">
          <ArrowLeft size={12} /> Tools
        </button>
        <span>/</span>
        <span className="text-foreground/60">{tool.title}</span>
      </div>

      {mode === "extract" && <ExtractTool onBack={back} />}
      {mode === "images-to-pdf" && <ImagesToPdfTool onBack={back} />}
      {mode === "pdf-to-images" && <PdfToImagesTool onBack={back} />}
      {mode === "merge" && <MergeTool onBack={back} />}
    </div>
  );
}
