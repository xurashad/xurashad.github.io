"use client";

import { useState, useCallback } from "react";
import { FileText, Loader2, ChevronRight } from "lucide-react";
import { DropZone, PageThumbnail, ToolbarBtn, ErrorBox, ProgressBar } from "./SharedUI";
import { renderPdfThumbnails } from "../lib/pdfRenderer";
import { extractPages, downloadBlob } from "../lib/pdfOperations";
import type { PdfPage } from "../lib/types";

interface Props { onBack: () => void; }

type Phase = "upload" | "loading" | "loaded" | "processing" | "error";

export function ExtractTool({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    if (f.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      setPhase("error");
      return;
    }
    setFile(f);
    setPhase("loading");
    try {
      const rendered = await renderPdfThumbnails(f);
      setPages(rendered);
      setSelected(new Set());
      setPhase("loaded");
    } catch {
      setError("Failed to render the PDF. The file may be corrupted or password-protected.");
      setPhase("error");
    }
  }, []);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const applyRange = () => {
    if (!rangeInput.trim()) { setSelected(new Set()); return; }
    const next = new Set<number>();
    for (const part of rangeInput.split(",")) {
      const t = part.trim();
      if (t.includes("-")) {
        const [a, b] = t.split("-").map(Number);
        for (let i = a; i <= b; i++) if (i >= 1 && i <= pages.length) next.add(i - 1);
      } else {
        const n = Number(t);
        if (n >= 1 && n <= pages.length) next.add(n - 1);
      }
    }
    setSelected(next);
  };

  const handleExtract = async () => {
    if (!file || selected.size === 0) return;
    setPhase("processing");
    setProgress(0);
    try {
      const blob = await extractPages(file, Array.from(selected));
      downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_extracted.pdf`);
      setPhase("loaded");
    } catch {
      setError("Extraction failed.");
      setPhase("error");
    }
  };

  if (phase === "upload") return (
    <div className="max-w-2xl mx-auto space-y-4">
      <DropZone accept="application/pdf" label="PDF files only" onFiles={handleFiles} />
    </div>
  );

  if (phase === "loading") return (
    <div className="flex flex-col items-center gap-4 py-20">
      <Loader2 size={36} className="text-quantum animate-spin" />
      <p className="text-sm text-foreground/50">Rendering PDF pages…</p>
    </div>
  );

  if (phase === "error") return (
    <ErrorBox message={error} onRetry={() => { setPhase("upload"); setFile(null); }} />
  );

  return (
    <div className="flex flex-col gap-0">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 glass border-b border-white/8 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
          <div className="shrink-0">
            <p className="text-xs text-foreground/40 font-mono truncate max-w-xs">{file?.name}</p>
            <p className="text-sm font-bold text-quantum">
              {selected.size} / {pages.length} pages selected
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <ToolbarBtn variant="secondary" onClick={() => setSelected(new Set(pages.map(p => p.id)))}>All</ToolbarBtn>
            <ToolbarBtn variant="secondary" onClick={() => setSelected(new Set())}>None</ToolbarBtn>
            <form onSubmit={(e) => { e.preventDefault(); applyRange(); }} className="flex gap-1">
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder="e.g. 1-5, 8"
                className="text-xs px-2 py-1.5 rounded-lg glass border border-white/10 bg-transparent text-foreground/70 focus:outline-none focus:border-quantum/40 w-32"
              />
              <ToolbarBtn variant="secondary" type="submit">Apply</ToolbarBtn>
            </form>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ToolbarBtn variant="danger" onClick={onBack}>← Back</ToolbarBtn>
            <ToolbarBtn
              variant="primary"
              onClick={handleExtract}
              disabled={selected.size === 0 || phase === "processing"}
            >
              {phase === "processing" ? (
                <><Loader2 size={13} className="animate-spin" /> <ProgressBar pct={progress} label="Extracting" /></>
              ) : (
                <><ChevronRight size={13} /> Extract {selected.size} page{selected.size !== 1 ? "s" : ""}</>
              )}
            </ToolbarBtn>
          </div>
        </div>
      </div>

      {/* Page grid */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
          {pages.map((p) => (
            <PageThumbnail key={p.id} page={p} isSelected={selected.has(p.id)} onSelect={toggle} />
          ))}
        </div>
      </div>
    </div>
  );
}
