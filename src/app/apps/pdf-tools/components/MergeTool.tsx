"use client";

import { useState, useRef, useCallback } from "react";
import { GripVertical, Trash2, FileText, Loader2, ChevronRight, Plus } from "lucide-react";
import { DropZone, ToolbarBtn, ErrorBox, ProgressBar } from "./SharedUI";
import { mergePdfs, downloadBlob } from "../lib/pdfOperations";
import type { MergePdfItem } from "../lib/types";

interface Props { onBack: () => void; }
type Phase = "upload" | "ready" | "processing" | "error";

export function MergeTool({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [pdfFiles, setPdfFiles] = useState<MergePdfItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);

  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter((f) => f.type === "application/pdf");
    if (!valid.length) { setError("No valid PDF files found."); setPhase("error"); return; }
    setPdfFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({ id: crypto.randomUUID(), file: f })),
    ]);
    setPhase("ready");
  }, []);

  const removeFile = (id: string) =>
    setPdfFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (!next.length) setPhase("upload");
      return next;
    });

  const handleSort = () => {
    if (dragIdx.current === null || overIdx.current === null) return;
    setPdfFiles((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(dragIdx.current!, 1);
      arr.splice(overIdx.current!, 0, item);
      return arr;
    });
    dragIdx.current = null;
    overIdx.current = null;
  };

  const handleMerge = async () => {
    if (pdfFiles.length < 2) return;
    setPhase("processing");
    setProgress(0);
    try {
      const blob = await mergePdfs(pdfFiles.map((f) => f.file), setProgress);
      downloadBlob(blob, "merged_document.pdf");
      setPhase("ready");
    } catch {
      setError("Failed to merge PDFs.");
      setPhase("error");
    }
  };

  if (phase === "upload") return (
    <div className="max-w-2xl mx-auto">
      <DropZone accept="application/pdf" multiple label="PDF files only · minimum 2 files" onFiles={addFiles} />
    </div>
  );

  if (phase === "error") return (
    <ErrorBox message={error} onRetry={() => { setPhase("upload"); setPdfFiles([]); }} />
  );

  const isProcessing = phase === "processing";

  return (
    <div className="flex flex-col gap-0">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 glass border-b border-white/8 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-bold text-quantum shrink-0">
            {pdfFiles.length} PDF{pdfFiles.length !== 1 ? "s" : ""} — drag to reorder
          </p>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-foreground/60 hover:bg-white/8 cursor-pointer transition-all">
              <Plus size={13} /> Add more PDFs
              <input type="file" accept="application/pdf" multiple className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) addFiles(f); e.target.value = ""; }} />
            </label>
            <ToolbarBtn variant="danger" onClick={onBack}>← Back</ToolbarBtn>
            <ToolbarBtn
              variant="primary"
              onClick={handleMerge}
              disabled={pdfFiles.length < 2 || isProcessing}
              title={pdfFiles.length < 2 ? "Add at least 2 PDFs" : ""}
            >
              {isProcessing ? (
                <><Loader2 size={13} className="animate-spin" /> <ProgressBar pct={progress} label="Merging" /></>
              ) : (
                <><ChevronRight size={13} /> Merge {pdfFiles.length} PDFs</>
              )}
            </ToolbarBtn>
          </div>
        </div>
      </div>

      {/* PDF list */}
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-2 max-w-2xl mx-auto">
          {pdfFiles.map((pdf, idx) => (
            <div
              key={pdf.id}
              draggable
              onDragStart={() => { dragIdx.current = idx; }}
              onDragEnter={() => { overIdx.current = idx; }}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
              className="glass-card flex items-center gap-3 p-3 cursor-move hover:border-quantum/30 transition-colors group"
            >
              <GripVertical size={16} className="text-foreground/25 shrink-0" />
              <span className="text-xs font-mono text-quantum w-5 shrink-0">{idx + 1}</span>
              <FileText size={16} className="text-crimson/70 shrink-0" />
              <p className="text-sm text-foreground/70 truncate flex-1" title={pdf.file.name}>
                {pdf.file.name}
              </p>
              <span className="text-xs font-mono text-foreground/30 shrink-0">
                {(pdf.file.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => removeFile(pdf.id)}
                className="shrink-0 text-foreground/25 hover:text-crimson transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {pdfFiles.length < 2 && (
          <p className="text-center text-xs text-foreground/30 mt-4">
            Add at least 2 PDF files to enable merging.
          </p>
        )}
      </div>
    </div>
  );
}
