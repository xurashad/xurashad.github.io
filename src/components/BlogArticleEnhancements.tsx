"use client";

import { useState, useEffect, useCallback } from "react";
import { List, Link2, Check, ArrowUp, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface ArticleOutlineSection {
  id: string;
  heading: string;
  readTime?: number;
}

interface BlogArticleEnhancementsProps {
  sections: ArticleOutlineSection[];
  accent?: "quantum" | "olive" | "crimson";
}

export function BlogArticleEnhancements({
  sections,
  accent = "quantum",
}: BlogArticleEnhancementsProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 420);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (sections.length === 0) return;

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0].target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0.01 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const jumpToSection = useCallback((id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  const copyArticleLink = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const accentPill =
    accent === "quantum"
      ? "bg-quantum/15 text-quantum border-quantum/40"
      : accent === "olive"
      ? "bg-olive/15 text-olive-400 border-olive/40"
      : "bg-crimson/15 text-crimson border-crimson/40";

  const accentIcon =
    accent === "quantum"
      ? "text-quantum"
      : accent === "olive"
      ? "text-olive-400"
      : "text-crimson";

  return (
    <>
      {/* Article Outline & Share Controls Bar */}
      <div className="my-6 glass-card border border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          >
            <List size={14} className={accentIcon} />
            <span>Article Outline ({sections.length} Sections)</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={copyArticleLink}
            className={`inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              copied
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/35"
                : "bg-white/5 text-foreground/70 border-white/10 hover:border-quantum/35 hover:text-quantum"
            }`}
          >
            {copied ? <Check size={12} /> : <Link2 size={12} />}
            <span>{copied ? "Link Copied!" : "Copy Article Link"}</span>
          </button>
        </div>

        {expanded && sections.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/8 flex flex-wrap gap-2">
            {sections.map((sec, i) => {
              const isActive = activeId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => jumpToSection(sec.id)}
                  className={`text-left text-xs font-mono px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? `${accentPill} font-semibold`
                      : "bg-white/[0.03] border-white/8 text-foreground/55 hover:text-foreground hover:border-white/20"
                  }`}
                >
                  <span className="opacity-50">{String(i + 1).padStart(2, "0")}.</span>
                  <span className="truncate max-w-[230px] sm:max-w-[300px]">{sec.heading}</span>
                  {sec.readTime !== undefined && (
                    <span className="text-[10px] opacity-55">({sec.readTime}m)</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full glass border border-emerald-500/40 bg-black/80 text-emerald-400 text-xs font-mono flex items-center gap-2 shadow-lg pointer-events-none"
          >
            <Check size={13} />
            Link Copied to Clipboard
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Back to Top Button */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 12 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            title="Back to top"
            className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full glass border border-quantum/35 text-quantum hover:bg-quantum/15 hover:border-quantum/60 shadow-lg flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
