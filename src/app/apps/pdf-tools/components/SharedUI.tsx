"use client";

import { useCallback, useState, DragEvent, ChangeEvent, useRef } from "react";
import { Upload, CloudUpload } from "lucide-react";

interface DropZoneProps {
  accept: string;
  multiple?: boolean;
  label: string;
  hint?: string;
  onFiles: (files: File[]) => void;
}

export function DropZone({ accept, multiple = false, label, hint, onFiles }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }, [onFiles]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full min-h-52 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
        isDragging
          ? "border-quantum/70 bg-quantum/8 shadow-[0_0_30px_rgba(0,195,245,0.12)]"
          : "border-white/12 bg-black/20 hover:border-quantum/40 hover:bg-quantum/4"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={onChange}
      />
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        {isDragging ? (
          <CloudUpload size={40} className="text-quantum" />
        ) : (
          <Upload size={36} className="text-foreground/30" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground/60">
            <span className="text-quantum">Click to upload</span> or drag &amp; drop
          </p>
          <p className="text-xs text-foreground/30 mt-1">{label}</p>
          {hint && <p className="text-xs text-foreground/25 mt-0.5">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── Page thumbnail ─────────────────────────────────────────────────────── */
interface ThumbProps {
  page: { id: number; imageUrl: string };
  isSelected: boolean;
  onSelect: (id: number) => void;
}

export function PageThumbnail({ page, isSelected, onSelect }: ThumbProps) {
  return (
    <div
      onClick={() => onSelect(page.id)}
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-150 ${
        isSelected
          ? "ring-2 ring-quantum shadow-[0_0_16px_rgba(0,195,245,0.3)] scale-[1.02]"
          : "ring-1 ring-white/10 hover:ring-quantum/50 hover:scale-[1.02]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={page.imageUrl} alt={`Page ${page.id + 1}`} className="w-full h-auto block" />
      <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] font-mono font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {page.id + 1}
      </div>
      {isSelected && (
        <div className="absolute inset-0 bg-quantum/20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-quantum flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────────── */
export function ProgressBar({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="space-y-1.5 w-full max-w-xs">
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-quantum to-quantum/50 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs font-mono text-foreground/40 text-center">{label} ({pct}%)</p>
    </div>
  );
}

/* ─── Toolbar button ─────────────────────────────────────────────────────── */
type BtnVariant = "primary" | "secondary" | "danger";

interface ToolbarBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  children: React.ReactNode;
}

const variantCls: Record<BtnVariant, string> = {
  primary: "border-quantum/30 bg-quantum/15 text-quantum hover:bg-quantum/25 hover:shadow-[0_0_16px_rgba(0,195,245,0.15)]",
  secondary: "border-white/10 bg-white/5 text-foreground/60 hover:bg-white/8 hover:text-foreground/80",
  danger: "border-crimson/30 bg-crimson/10 text-crimson hover:bg-crimson/20",
};

export function ToolbarBtn({ variant = "primary", className = "", children, ...rest }: ToolbarBtnProps) {
  return (
    <button
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${variantCls[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ─── Select input ───────────────────────────────────────────────────────── */
interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: React.ReactNode;
}

export function SelectField({ label, children, ...rest }: SelectFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono text-foreground/35 uppercase tracking-widest">{label}</span>
      <select
        className="px-3 py-1.5 rounded-lg glass border border-white/10 bg-transparent text-xs text-foreground/70 focus:outline-none focus:border-quantum/40 transition-all cursor-pointer"
        {...rest}
      >
        {children}
      </select>
    </label>
  );
}

/* ─── Error box ──────────────────────────────────────────────────────────── */
export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-5 rounded-2xl border border-crimson/30 bg-crimson/8 space-y-3 max-w-md mx-auto text-center">
      <p className="text-sm font-semibold text-crimson">An error occurred</p>
      <p className="text-xs text-foreground/50">{message}</p>
      <ToolbarBtn variant="primary" onClick={onRetry}>Try Again</ToolbarBtn>
    </div>
  );
}
