"use client";

import { memo, useState } from "react";
import { Copy, Check } from "lucide-react";
import { getCategoryName } from "./lib/categories";
import type { UnicodeChar } from "./lib/unicodeService";

/* ─── Shared copy button ─────────────────────────────────────────────────── */
function CopyBtn({ char }: { char: string }) {
  const [copied, setCopied] = useState(false);
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(char).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleClick}
      disabled={copied}
      aria-label="Copy character"
      className={`p-1.5 rounded-lg transition-colors ${
        copied
          ? "text-olive-400 bg-olive/15"
          : "text-foreground/30 hover:text-quantum hover:bg-quantum/10"
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

/* ─── Grid card ──────────────────────────────────────────────────────────── */
export const CharacterCard = memo(function CharacterCard({
  character,
  onSelect,
}: {
  character: UnicodeChar;
  onSelect: (c: UnicodeChar) => void;
}) {
  return (
    <div
      onClick={() => onSelect(character)}
      className="group relative glass-card p-2 flex flex-col items-center justify-center text-center cursor-pointer aspect-square transition-all duration-200 hover:border-quantum/30 hover:shadow-[0_0_14px_rgba(0,195,245,0.1)] hover:-translate-y-0.5"
    >
      {/* Hover copy button */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyBtn char={character.character} />
      </div>

      <div className="text-4xl mb-1.5 flex-grow flex items-center select-none leading-none">
        {character.character}
      </div>
      <p className="text-[10px] font-mono text-quantum truncate w-full text-center">
        U+{character.codePoint}
      </p>
      <p
        className="text-[9px] text-foreground/40 h-5 leading-tight truncate w-full text-center"
        title={character.name}
      >
        {character.name}
      </p>
    </div>
  );
});

/* ─── List row ───────────────────────────────────────────────────────────── */
export const CharacterListItem = memo(function CharacterListItem({
  character,
  onSelect,
}: {
  character: UnicodeChar;
  onSelect: (c: UnicodeChar) => void;
}) {
  return (
    <div
      onClick={() => onSelect(character)}
      className="group glass-card flex items-center gap-4 p-3 cursor-pointer transition-all duration-200 hover:border-quantum/30 hover:shadow-[0_0_14px_rgba(0,195,245,0.08)]"
    >
      {/* Character display */}
      <div className="w-14 h-14 rounded-xl bg-black/20 border border-white/8 flex items-center justify-center text-3xl select-none shrink-0">
        {character.character}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/80 font-semibold truncate" title={character.name}>
          {character.name}
        </p>
        <p className="text-xs font-mono text-quantum">U+{character.codePoint}</p>
        <p className="text-xs text-foreground/35">{getCategoryName(character.category)}</p>
      </div>

      {/* Copy button */}
      <div className="shrink-0">
        <CopyBtn char={character.character} />
      </div>
    </div>
  );
});
