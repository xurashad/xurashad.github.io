"use client";

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import { Preview } from "./Preview";
import {
  Upload, Copy, Check, Download, FileImage, FileAudio,
  FileVideo, File, X, ArrowRight,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
type FileTypeFilter = "all" | "image" | "audio" | "video";

interface FileTypeConfig {
  accept: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const FILE_TYPE_CONFIGS: Record<FileTypeFilter, FileTypeConfig> = {
  all:   { accept: "image/*,video/*,audio/*",  label: "All",   icon: File },
  image: { accept: "image/*",                  label: "Image", icon: FileImage },
  audio: { accept: "audio/*",                  label: "Audio", icon: FileAudio },
  video: { accept: "video/*",                  label: "Video", icon: FileVideo },
};

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

/* ─── Sub-component: FilterTabs ──────────────────────────────────────────── */
function FilterTabs({
  current,
  onChange,
}: {
  current: FileTypeFilter;
  onChange: (v: FileTypeFilter) => void;
}) {
  return (
    <div className="flex p-1 gap-1 rounded-xl bg-black/20 border border-white/8">
      {(Object.keys(FILE_TYPE_CONFIGS) as FileTypeFilter[]).map((key) => {
        const cfg = FILE_TYPE_CONFIGS[key];
        const Icon = cfg.icon;
        const active = current === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1.5 flex-1 justify-center py-1.5 px-2 text-xs font-mono rounded-lg transition-all duration-200 ${
              active
                ? "bg-quantum/20 text-quantum border border-quantum/30 shadow-[0_0_10px_rgba(0,195,245,0.1)]"
                : "text-foreground/40 hover:text-foreground/65 hover:bg-white/5"
            }`}
          >
            <Icon size={12} />
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Sub-component: DropZone ────────────────────────────────────────────── */
function DropZone({
  filter,
  onFile,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
}: {
  filter: FileTypeFilter;
  onFile: (f: File) => void;
  isDragging: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onClick: () => void;
}) {
  const cfg = FILE_TYPE_CONFIGS[filter];
  const Icon = cfg.icon;
  return (
    <div
      onClick={onClick}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
        isDragging
          ? "border-quantum bg-quantum/8 shadow-[0_0_30px_rgba(0,195,245,0.15)]"
          : "border-white/15 bg-white/3 hover:border-quantum/50 hover:bg-quantum/5"
      }`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors duration-300 ${
          isDragging ? "bg-quantum/20 text-quantum" : "bg-white/5 text-foreground/30"
        }`}
      >
        {isDragging ? <Upload size={26} /> : <Icon size={26} />}
      </div>
      <p className="text-sm text-foreground/60 font-medium">
        {isDragging ? "Drop it!" : <><span className="text-quantum font-semibold">Click to upload</span> or drag & drop</>}
      </p>
      <p className="text-xs text-foreground/30 mt-1 font-mono">
        {cfg.label} files · max {MAX_FILE_SIZE_MB} MB
      </p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function Encoder() {
  const [encodeMode, setEncodeMode] = useState<"file" | "text">("file");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [isDragging, setIsDragging] = useState(false);

  const [file, setFile]           = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [base64, setBase64]       = useState("");
  const [inputText, setInputText] = useState("");
  const [error, setError]         = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied]   = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── helpers ── */
  const clearState = () => {
    setFile(null);
    setPreviewSrc("");
    setBase64("");
    setInputText("");
    setError("");
    setIsCopied(false);
    setIsDownloaded(false);
    setIsLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const switchMode = (mode: "file" | "text") => {
    if (mode !== encodeMode) { clearState(); setEncodeMode(mode); }
  };

  const handleFilterChange = (f: FileTypeFilter) => {
    if (f !== fileTypeFilter) { clearState(); setFileTypeFilter(f); }
  };

  /* ── file handling ── */
  const handleFileChange = useCallback(
    async (selectedFile: File | null | undefined) => {
      if (!selectedFile) return;

      const fileMediaType = selectedFile.type.split("/")[0];
      if (fileTypeFilter !== "all" && fileMediaType !== fileTypeFilter) {
        setError(`Invalid file type. Please select an ${fileTypeFilter} file.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large (max ${MAX_FILE_SIZE_MB} MB).`);
        return;
      }

      setError("");
      setFile(selectedFile);
      setIsLoading(true);
      setPreviewSrc(URL.createObjectURL(selectedFile));

      try {
        const b64 = await fileToBase64(selectedFile);
        setBase64(b64);
      } catch {
        setError("Failed to read and convert file.");
      } finally {
        setIsLoading(false);
      }
    },
    [fileTypeFilter]
  );

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files?.[0]);
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files?.[0]);
  };

  /* ── text encode ── */
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    setIsCopied(false);
    if (text) {
      try {
        const b64str = btoa(unescape(encodeURIComponent(text)));
        setBase64(`data:text/plain;charset=utf-8;base64,${b64str}`);
        setError("");
      } catch {
        setError("Failed to encode text.");
        setBase64("");
      }
    } else {
      setBase64("");
      setError("");
    }
  };

  /* ── copy ── */
  const handleCopy = () => {
    if (!base64) return;
    navigator.clipboard.writeText(base64).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  /* ── download as txt ── */
  const handleDownload = () => {
    if (!base64) return;
    const blob = new Blob([base64], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name ?? "encoded"}.b64.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setIsDownloaded(true);
    setTimeout(() => setIsDownloaded(false), 2500);
  };

  /* ── computed ── */
  const rawSize  = file?.size ?? inputText.length;
  const b64Size  = base64 ? Math.ceil((rawSize * 4) / 3) : 0;
  const overhead = rawSize > 0 ? (((b64Size - rawSize) / rawSize) * 100).toFixed(0) : 0;

  /* ── render ── */
  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex p-1 gap-1 rounded-xl bg-black/20 border border-white/8 max-w-xs mx-auto">
        {(["file", "text"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => switchMode(mode)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
              encodeMode === mode
                ? "bg-quantum/20 text-quantum border border-quantum/30"
                : "text-foreground/40 hover:text-foreground/65"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* ── File mode ── */}
      {encodeMode === "file" && (
        <>
          <div className="space-y-2">
            <p className="text-xs font-mono text-foreground/40 uppercase tracking-widest text-center">
              Accepted file type
            </p>
            <FilterTabs current={fileTypeFilter} onChange={handleFilterChange} />
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileInputChange}
            className="hidden"
            accept={FILE_TYPE_CONFIGS[fileTypeFilter].accept}
          />
          <DropZone
            filter={fileTypeFilter}
            onFile={handleFileChange}
            isDragging={isDragging}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          />
        </>
      )}

      {/* ── Text mode ── */}
      {encodeMode === "text" && (
        <div className="space-y-2">
          <label htmlFor="enc-text-input" className="text-xs font-mono text-foreground/40 uppercase tracking-widest block">
            Text to encode
          </label>
          <textarea
            id="enc-text-input"
            value={inputText}
            onChange={handleTextChange}
            className="w-full h-44 p-3 font-mono text-sm bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-quantum/40 focus:border-quantum/40 transition-colors resize-none text-foreground/80 placeholder:text-foreground/25"
            placeholder="Type or paste your text here…"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-crimson/30 bg-crimson/8 text-crimson text-sm">
          <X size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* File preview */}
      {file && encodeMode === "file" && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/70">Preview</h3>
            <div className="text-xs font-mono text-foreground/30">
              {file.name} · {formatBytes(file.size)}
            </div>
          </div>
          <div className="flex justify-center items-center p-3 rounded-xl bg-black/20 min-h-[8rem]">
            <Preview src={previewSrc} mimeType={file.type} />
          </div>
        </div>
      )}

      {/* Base64 output */}
      {(isLoading || base64) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="enc-b64-output" className="text-xs font-mono text-foreground/40 uppercase tracking-widest">
              Base64 output
            </label>
            {base64 && rawSize > 0 && (
              <span className="text-[10px] font-mono text-olive-400 bg-olive/10 border border-olive/20 px-2 py-0.5 rounded-full">
                +{overhead}% size · {formatBytes(b64Size)}
              </span>
            )}
          </div>

          <textarea
            id="enc-b64-output"
            readOnly
            value={isLoading ? "Converting…" : base64}
            className="w-full h-44 p-3 font-mono text-xs bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-quantum/40 transition-colors resize-none text-foreground/60 placeholder:text-foreground/25"
            placeholder="Your Base64 string will appear here…"
          />

          {base64 && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-200 flex-1 justify-center ${
                  isCopied
                    ? "bg-olive/15 text-olive-400 border-olive/30"
                    : "bg-quantum/10 text-quantum border-quantum/25 hover:bg-quantum/20"
                }`}
              >
                {isCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
              <button
                onClick={handleDownload}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-200 flex-1 justify-center ${
                  isDownloaded
                    ? "bg-olive/15 text-olive-400 border-olive/30"
                    : "bg-white/5 text-foreground/50 border-white/10 hover:bg-white/8 hover:text-foreground/70"
                }`}
              >
                {isDownloaded ? <><Check size={13} /> Saved!</> : <><Download size={13} /> Save .txt</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
