"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import {
  Keyboard, FileUp, Trash2, Globe, StopCircle, CloudUpload, Loader2,
} from "lucide-react";
import { extractTextFromFile } from "./lib/fileParser";

interface InputPanelProps {
  text: string;
  excludeUrls: string;
  phase: "idle" | "scanning" | "done" | "cancelled";
  onTextChange: (v: string) => void;
  onExcludeChange: (v: string) => void;
  onScan: () => void;
  onStop: () => void;
  onError: (msg: string) => void;
}

export function InputPanel({
  text,
  excludeUrls,
  phase,
  onTextChange,
  onExcludeChange,
  onScan,
  onStop,
  onError,
}: InputPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const charCount = text.length;

  const isScanning = phase === "scanning";

  /* ── File handling ── */
  async function handleFile(file: File | undefined) {
    if (!file) return;
    setIsParsing(true);
    try {
      const extracted = await extractTextFromFile(file);
      onTextChange(extracted);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not read file.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground/60 text-sm font-semibold">
          <Keyboard size={15} className="text-quantum" />
          Document Input
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.html,.csv,.pdf,.docx,.doc"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleFile(e.target.files?.[0])
            }
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning || isParsing}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-foreground/50 hover:text-foreground/80 hover:bg-white/8 transition-all disabled:opacity-40"
          >
            <FileUp size={13} />
            Upload File
          </button>
        </div>
      </div>

      {/* Textarea wrapper with drag-drop overlay */}
      <div
        className="relative flex-1 min-h-0"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-quantum/10 border-2 border-dashed border-quantum/60 pointer-events-none">
            <CloudUpload size={32} className="text-quantum mb-2" />
            <p className="text-sm text-quantum font-medium">Drop file here to extract text</p>
          </div>
        )}

        {/* Parsing overlay */}
        {isParsing && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm">
            <Loader2 size={28} className="text-quantum animate-spin mb-2" />
            <p className="text-sm text-foreground/60">Extracting text from document…</p>
          </div>
        )}

        <textarea
          id="plagiarism-text-input"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={isScanning || isParsing}
          placeholder="Paste your document here, or drag & drop a PDF, DOCX, or TXT file…"
          className="w-full h-72 p-4 font-mono text-sm bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-quantum/40 focus:border-quantum/40 transition-colors resize-none text-foreground/80 placeholder:text-foreground/25 disabled:opacity-50"
        />

        {/* Clear button */}
        {text && !isScanning && (
          <button
            onClick={() => onTextChange("")}
            title="Clear text"
            className="absolute top-2 right-3 p-1.5 rounded-lg text-foreground/25 hover:text-crimson/70 hover:bg-crimson/10 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Exclude URLs */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="exclude-urls"
          className="text-[10px] font-mono text-foreground/35 uppercase tracking-widest"
        >
          Exclude URLs (comma-separated)
        </label>
        <input
          id="exclude-urls"
          type="text"
          value={excludeUrls}
          onChange={(e) => onExcludeChange(e.target.value)}
          placeholder="e.g., wikipedia.org, mywebsite.com"
          disabled={isScanning}
          className="px-3 py-2 text-sm bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-quantum/40 transition-colors text-foreground/70 placeholder:text-foreground/25 disabled:opacity-50"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-foreground/30">
          {wordCount.toLocaleString()} words &nbsp;·&nbsp; {charCount.toLocaleString()} chars
        </div>
        <div className="flex gap-2">
          {isScanning ? (
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-crimson/30 bg-crimson/10 text-crimson hover:bg-crimson/20 transition-all"
            >
              <StopCircle size={15} />
              Stop Scan
            </button>
          ) : (
            <button
              onClick={onScan}
              disabled={wordCount < 10}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl border border-quantum/30 bg-quantum/15 text-quantum hover:bg-quantum/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,195,245,0.15)]"
            >
              <Globe size={15} />
              {phase === "done" || phase === "cancelled"
                ? "Re-Check Plagiarism"
                : "Check Plagiarism"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
