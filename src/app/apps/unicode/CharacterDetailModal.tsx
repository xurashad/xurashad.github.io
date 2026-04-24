"use client";

import { useEffect, useCallback } from "react";
import { X, Copy, Check, ExternalLink } from "lucide-react";
import { getCategoryName } from "./lib/categories";
import type { UnicodeChar } from "./lib/unicodeService";
import { useState } from "react";

interface Props {
  character: UnicodeChar;
  blockName?: string;
  onClose: () => void;
}

interface DetailRowProps {
  label: string;
  value: string | undefined;
}

function DetailRow({ label, value }: DetailRowProps) {
  if (!value?.trim()) return null;
  return (
    <div className="py-2.5 border-b border-white/8">
      <p className="text-xs font-mono text-foreground/40 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm text-foreground/80 font-medium">{value}</p>
    </div>
  );
}

export function CharacterDetailModal({ character, blockName, onClose }: Props) {
  const [isCopied, setIsCopied] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(character.character).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleCopyCodePoint = () => {
    navigator.clipboard.writeText(`U+${character.codePoint}`);
  };

  const hexValue = parseInt(character.codePoint, 16);
  const wikiUrl = `https://www.compart.com/en/unicode/U+${character.codePoint}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${character.name}`}
    >
      <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        {/* Header */}
        <div className="sticky top-0 glass flex items-center justify-between p-5 border-b border-white/8 z-10">
          <h2 className="font-semibold text-foreground/80 truncate pr-4">{character.name}</h2>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-white/8 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Character display */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-28 h-28 rounded-2xl bg-black/30 border border-white/10 flex items-center justify-center text-7xl select-none shrink-0">
              {character.character}
            </div>
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                <span className="text-2xl font-mono text-quantum font-bold">
                  U+{character.codePoint}
                </span>
                <span className="text-xs font-mono text-foreground/35">
                  Dec: {hexValue}
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <button
                  onClick={handleCopy}
                  disabled={isCopied}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                    isCopied
                      ? "bg-olive/15 text-olive-400 border-olive/30"
                      : "bg-quantum/10 text-quantum border-quantum/25 hover:bg-quantum/20"
                  }`}
                >
                  {isCopied ? <Check size={12} /> : <Copy size={12} />}
                  {isCopied ? "Copied!" : "Copy character"}
                </button>
                <button
                  onClick={handleCopyCodePoint}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-foreground/50 hover:bg-white/8 transition-all"
                >
                  <Copy size={12} />
                  Copy U+code
                </button>
                <a
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-foreground/50 hover:bg-white/8 transition-all"
                >
                  <ExternalLink size={12} />
                  compart.com
                </a>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <DetailRow label="Script / Block" value={blockName} />
            <DetailRow
              label="General Category"
              value={`${getCategoryName(character.category)} (${character.category})`}
            />
            <DetailRow label="Bidi Class" value={character.bidiClass} />
            <DetailRow label="Canonical Combining Class" value={character.combiningClass} />
            <DetailRow label="Bidi Mirrored" value={character.bidiMirrored} />
            <DetailRow label="Decomposition" value={character.decomposition} />
            <DetailRow label="Numeric Value" value={character.numericValue} />
            <DetailRow
              label="Simple Uppercase"
              value={character.uppercase ? `U+${character.uppercase}` : undefined}
            />
            <DetailRow
              label="Simple Lowercase"
              value={character.lowercase ? `U+${character.lowercase}` : undefined}
            />
            <DetailRow
              label="Simple Titlecase"
              value={character.titlecase ? `U+${character.titlecase}` : undefined}
            />
          </div>

          {/* HTML entities */}
          <div className="p-3 rounded-xl bg-black/20 border border-white/8 space-y-1">
            <p className="text-xs font-mono text-foreground/40 uppercase tracking-widest mb-2">
              HTML Encodings
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                `&#x${character.codePoint};`,
                `&#${hexValue};`,
                character.codePoint.length <= 4
                  ? `\\u${character.codePoint.padStart(4, "0")}`
                  : `\\u{${character.codePoint}}`,
              ].map((enc) => (
                <code
                  key={enc}
                  className="text-xs font-mono text-quantum bg-quantum/8 px-2 py-1 rounded cursor-pointer hover:bg-quantum/15 transition-colors"
                  onClick={() => navigator.clipboard.writeText(enc)}
                  title="Click to copy"
                >
                  {enc}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
