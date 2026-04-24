"use client";

import { useEffect, useCallback } from "react";
import { X, Scale, ExternalLink } from "lucide-react";
import type { MatchGroup } from "./lib/scanner";

interface ProofModalProps {
  matchGroup: MatchGroup;
  sourceIndex: number;
  onClose: () => void;
}

function highlightMatchingWords(userText: string, sourceText: string): string {
  const sourceLower = sourceText.toLowerCase();
  return userText
    .split(/\s+/)
    .map((word) => {
      const clean = word.toLowerCase().replace(/[^\w]/g, "");
      if (clean.length > 3 && sourceLower.includes(clean)) {
        return `<mark class="diff-match">${word}</mark>`;
      }
      return word;
    })
    .join(" ");
}

export function ProofModal({ matchGroup, sourceIndex, onClose }: ProofModalProps) {
  const source = matchGroup.sources[sourceIndex];

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!source) return null;

  const highlightedUser = highlightMatchingWords(
    matchGroup.sentence,
    source.snippet
  );

  const isExact = matchGroup.isExact;
  const badgeColour = isExact
    ? "bg-crimson/15 text-crimson border-crimson/30"
    : "bg-olive/15 text-olive-400 border-olive/30";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Plagiarism proof comparison"
    >
      <div className="glass-card w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <Scale size={18} className="text-quantum" />
            <h3 className="font-semibold text-foreground/80">Plagiarism Proof Comparison</h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColour}`}>
              {isExact ? "Exact Copy" : "Paraphrased"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-foreground/40 hover:text-foreground/70 hover:bg-white/8 transition-colors"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Left: User text */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono text-foreground/40 uppercase tracking-widest">
                Your Document
              </h4>
              <div
                className="flex-1 p-4 rounded-xl bg-black/20 border border-white/8 text-sm text-foreground/70 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightedUser }}
              />
            </div>

            {/* Right: Source */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono text-foreground/40 uppercase tracking-widest">
                  Source · {source.sourceType}
                </h4>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-quantum hover:underline"
                >
                  View original <ExternalLink size={10} />
                </a>
              </div>
              <div className="flex-1 p-4 rounded-xl bg-black/20 border border-white/8 text-sm text-foreground/70 leading-relaxed overflow-auto max-h-72">
                {source.snippet.slice(0, 1500)}
                {source.snippet.length > 1500 && (
                  <span className="text-foreground/30">…</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/8 text-[11px] font-mono text-foreground/25 text-center">
          Press Esc or click outside to close · Similarity:{" "}
          {Math.round(source.similarity * 100)}%
        </div>
      </div>

      <style>{`
        mark.diff-match {
          background: rgba(0, 195, 245, 0.25);
          color: inherit;
          border-radius: 2px;
          padding: 0 1px;
        }
      `}</style>
    </div>
  );
}
