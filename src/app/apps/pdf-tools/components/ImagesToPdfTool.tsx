"use client";

import { useState, useCallback, useRef } from "react";
import { Loader2, GripVertical, Trash2, ChevronRight, Plus } from "lucide-react";
import { DropZone, ToolbarBtn, SelectField, ErrorBox, ProgressBar } from "./SharedUI";
import { imagesToPdf, downloadBlob } from "../lib/pdfOperations";
import type { ImageFileItem, PageSize, Orientation, MarginSize } from "../lib/types";

interface Props { onBack: () => void; }
type Phase = "upload" | "ready" | "processing" | "error";

export function ImagesToPdfTool({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("upload");
  const [images, setImages] = useState<ImageFileItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [margin, setMargin] = useState<MarginSize>("small");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);

  const addFiles = useCallback((files: File[]) => {
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (!valid.length) { setError("No valid image files found."); setPhase("error"); return; }
    const items: ImageFileItem[] = valid.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
    }));
    setImages((prev) => [...prev, ...items]);
    setPhase("ready");
  }, []);

  const removeImage = (id: string) =>
    setImages((prev) => prev.filter((img) => img.id !== id));

  const handleSort = () => {
    if (dragIdx.current === null || overIdx.current === null) return;
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(dragIdx.current!, 1);
      arr.splice(overIdx.current!, 0, item);
      return arr;
    });
    dragIdx.current = null;
    overIdx.current = null;
  };

  const handleCreate = async () => {
    if (!images.length) return;
    setPhase("processing");
    setProgress(0);
    try {
      const blob = await imagesToPdf(images, pageSize, orientation, margin, setProgress);
      downloadBlob(blob, "converted_images.pdf");
      setPhase("ready");
    } catch {
      setError("Failed to create PDF from images.");
      setPhase("error");
    }
  };

  if (phase === "upload") return (
    <div className="max-w-2xl mx-auto space-y-4">
      <DropZone
        accept="image/*"
        multiple
        label="JPG, PNG, WEBP, and other image formats"
        hint="Multiple files supported — drag to reorder"
        onFiles={addFiles}
      />
    </div>
  );

  if (phase === "error") return (
    <ErrorBox message={error} onRetry={() => { setPhase("upload"); setImages([]); }} />
  );

  return (
    <div className="flex flex-col gap-0">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 glass border-b border-white/8 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
          <div className="text-sm font-bold text-quantum shrink-0">
            {images.length} image{images.length !== 1 ? "s" : ""} — drag to reorder
          </div>

          {/* PDF options */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <SelectField label="Page size" value={pageSize} onChange={(e) => setPageSize(e.target.value as PageSize)}>
              <option value="fit">Fit image</option>
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </SelectField>
            <SelectField label="Orientation" value={orientation} onChange={(e) => setOrientation(e.target.value as Orientation)} disabled={pageSize === "fit"}>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </SelectField>
            <SelectField label="Margin" value={margin} onChange={(e) => setMargin(e.target.value as MarginSize)} disabled={pageSize === "fit"}>
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="big">Large</option>
            </SelectField>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-center">
            <label className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-foreground/60 hover:bg-white/8 cursor-pointer transition-all">
              <Plus size={13} /> Add more
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) addFiles(f); e.target.value = ""; }} />
            </label>
            <ToolbarBtn variant="danger" onClick={onBack}>← Back</ToolbarBtn>
            <ToolbarBtn variant="primary" onClick={handleCreate} disabled={!images.length || phase === "processing"}>
              {phase === "processing" ? (
                <><Loader2 size={13} className="animate-spin" /> <ProgressBar pct={progress} label="Creating" /></>
              ) : (
                <><ChevronRight size={13} /> Create PDF</>
              )}
            </ToolbarBtn>
          </div>
        </div>
      </div>

      {/* Image grid */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => { dragIdx.current = idx; }}
              onDragEnter={() => { overIdx.current = idx; }}
              onDragEnd={handleSort}
              onDragOver={(e) => e.preventDefault()}
              className="relative rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-quantum/40 cursor-move group transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.previewUrl} alt={img.file.name} className="w-full aspect-[3/4] object-cover" />
              <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-mono font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {idx + 1}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={12} className="text-white/50" />
                <button onClick={() => removeImage(img.id)} className="text-crimson hover:text-crimson/80">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
