"use client";

import { useState, useCallback, memo } from "react";
import { Copy, Check } from "lucide-react";

interface FontCardProps {
  name: string;
  category: string;
  text: string;
  highlight: boolean;
}

export const FontCard = memo(function FontCard({ name, category, text, highlight }: FontCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <div
      className={`glass-card flex flex-col gap-3 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] ${
        highlight ? "border-quantum/35 shadow-[0_0_16px_rgba(0,195,245,0.08)]" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground/70 leading-none">{name}</h3>
          <span className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mt-0.5 block">
            {category}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
            copied
              ? "border-olive/30 bg-olive/10 text-olive-400"
              : "border-quantum/25 bg-quantum/10 text-quantum hover:bg-quantum/20"
          }`}
          aria-label={copied ? "Copied!" : `Copy ${name} text`}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Rendered text */}
      <div
        className="flex-1 min-h-[80px] p-3 rounded-xl bg-black/20 border border-white/5 text-xl leading-relaxed whitespace-pre-wrap break-words text-foreground/85"
        style={{ fontFamily: "'Noto Sans', 'Noto Color Emoji', sans-serif" }}
      >
        {text || <span className="text-foreground/20 text-sm italic">Start typing…</span>}
      </div>
    </div>
  );
});
