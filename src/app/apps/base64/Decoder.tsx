"use client";

import { useState, ChangeEvent } from "react";
import { Preview } from "./Preview";
import { Search, Download, X, ChevronDown, ArrowRight } from "lucide-react";

/* ─── MIME helpers ───────────────────────────────────────────────────────── */
const COMMON_MIME_TYPES = [
  // Images
  "image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml",
  "image/bmp", "image/avif",
  // Audio
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac", "audio/webm",
  // Video
  "video/mp4", "video/webm", "video/ogg", "video/avi", "video/quicktime",
  // Text
  "text/plain", "text/html", "text/css", "text/javascript",
  // Documents
  "application/pdf", "application/json", "application/xml",
] as const;

const DATA_URL_REGEX = /^data:([a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.+]*);base64,([A-Za-z0-9+/=\s]+)$/;
const RAW_BASE64_REGEX = /^[A-Za-z0-9+/\s]+=*$/;

function isValidBase64(str: string): boolean {
  try { atob(str.replace(/\s/g, "")); return true; } catch { return false; }
}

function buildDataUrl(base64: string, mime: string): string {
  return `data:${mime};base64,${base64.replace(/\s/g, "")}`;
}

function downloadBlob(dataUrl: string, mime: string) {
  const ext = mime.split("/")[1]?.split("+")[0] ?? "bin";
  const byteStr = atob(dataUrl.split(",")[1] ?? "");
  const arr = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `decoded.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Component ──────────────────────────────────────────────────────────── */
export function Decoder() {
  const [input, setInput]               = useState("");
  const [manualMime, setManualMime]     = useState("image/png");
  const [mode, setMode]                 = useState<"auto" | "manual">("auto");
  const [error, setError]               = useState("");
  const [decodedMedia, setDecodedMedia] = useState<{ src: string; mimeType: string } | null>(null);

  // --- decode logic ---
  const handleDecode = () => {
    setError("");
    setDecodedMedia(null);
    const trimmed = input.trim();
    if (!trimmed) { setError("Please paste a Base64 string or data URL."); return; }

    // Mode: auto — try to parse as data URL
    if (mode === "auto") {
      if (!trimmed.startsWith("data:")) {
        setError('Input must be a data URL starting with "data:". Switch to Manual mode to supply raw Base64.');
        return;
      }
      const match = DATA_URL_REGEX.exec(trimmed);
      if (!match) {
        setError("Invalid data URL format. Ensure it is: data:<type>;base64,<data>");
        return;
      }
      if (!isValidBase64(match[2])) {
        setError("The Base64 data section is corrupted or invalid.");
        return;
      }
      setDecodedMedia({ src: trimmed, mimeType: match[1] });
      return;
    }

    // Mode: manual — raw Base64 + chosen MIME
    if (!RAW_BASE64_REGEX.test(trimmed) || !isValidBase64(trimmed)) {
      setError("Input does not appear to be valid Base64. Check for stray characters.");
      return;
    }
    setDecodedMedia({ src: buildDataUrl(trimmed, manualMime), mimeType: manualMime });
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setError("");
    setDecodedMedia(null);
  };

  const handleDownload = () => {
    if (!decodedMedia) return;
    downloadBlob(decodedMedia.src, decodedMedia.mimeType);
  };

  const switchMode = (m: "auto" | "manual") => {
    if (m !== mode) {
      setMode(m);
      setError("");
      setDecodedMedia(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode tabs */}
      <div className="flex p-1 gap-1 rounded-xl bg-black/20 border border-white/8 max-w-xs mx-auto">
        {(["auto", "manual"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
              mode === m
                ? "bg-quantum/20 text-quantum border border-quantum/30"
                : "text-foreground/40 hover:text-foreground/65"
            }`}
          >
            {m === "auto" ? "Data URL" : "Raw Base64"}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="space-y-2">
        <label htmlFor="dec-input" className="text-xs font-mono text-foreground/40 uppercase tracking-widest block">
          {mode === "auto" ? "Paste data URL" : "Paste raw Base64"}
        </label>
        <textarea
          id="dec-input"
          value={input}
          onChange={handleInputChange}
          className="w-full h-44 p-3 font-mono text-xs bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-quantum/40 focus:border-quantum/40 transition-colors resize-none text-foreground/70 placeholder:text-foreground/25"
          placeholder={
            mode === "auto"
              ? "data:image/png;base64,iVBORw0KGgo…"
              : "iVBORw0KGgoAAAANSUhEUgAA…"
          }
        />
      </div>

      {/* Manual MIME selector */}
      {mode === "manual" && (
        <div className="space-y-2">
          <label htmlFor="dec-mime" className="text-xs font-mono text-foreground/40 uppercase tracking-widest block">
            MIME type
          </label>
          <div className="relative">
            <select
              id="dec-mime"
              value={manualMime}
              onChange={(e) => setManualMime(e.target.value)}
              className="w-full appearance-none p-3 pl-4 pr-10 font-mono text-sm bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-quantum/40 focus:border-quantum/40 transition-colors text-foreground/70"
            >
              {COMMON_MIME_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none" />
          </div>
          <p className="text-xs text-foreground/30 font-mono">
            Select the MIME type matching your Base64 data.
          </p>
        </div>
      )}

      {/* Decode button */}
      <div className="flex justify-center">
        <button
          onClick={handleDecode}
          disabled={!input.trim()}
          className="flex items-center gap-2 bg-quantum/15 hover:bg-quantum/25 text-quantum font-semibold py-2.5 px-7 rounded-xl border border-quantum/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,195,245,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Search size={15} />
          Decode & Preview
          <ArrowRight size={14} className="opacity-60" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-crimson/30 bg-crimson/8 text-crimson text-sm">
          <X size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Preview */}
      {decodedMedia && (
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground/70">Decoded Preview</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-quantum bg-quantum/10 border border-quantum/20 px-2 py-0.5 rounded-full">
                {decodedMedia.mimeType}
              </span>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-olive/25 bg-olive/10 text-olive-400 hover:bg-olive/20 transition-colors"
              >
                <Download size={12} />
                Download
              </button>
            </div>
          </div>
          <div className="flex justify-center items-center p-3 rounded-xl bg-black/20 min-h-[8rem]">
            <Preview src={decodedMedia.src} mimeType={decodedMedia.mimeType} />
          </div>
        </div>
      )}
    </div>
  );
}
