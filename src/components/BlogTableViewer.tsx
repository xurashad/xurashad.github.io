"use client";

import { useState, useMemo } from "react";
import { Search, X, Calendar, Clock, Filter, Sparkles, AlertTriangle } from "lucide-react";
import type { BlogTable } from "@/lib/blogData";
import katex from "katex";

interface BlogTableViewerProps {
  table: BlogTable;
  accent?: "quantum" | "olive" | "crimson";
}

type EraKey = "all" | "cosmic" | "precambrian" | "evolution" | "human";

interface EraDef {
  key: EraKey;
  label: string;
  badge: string;
  months: string;
}

const ERAS: EraDef[] = [
  { key: "all", label: "All Epochs", badge: "50", months: "Jan 01 – Dec 31" },
  { key: "cosmic", label: "Cosmic Dawn", badge: "5", months: "Jan – Aug" },
  { key: "precambrian", label: "Precambrian Earth", badge: "15", months: "Sep – Nov" },
  { key: "evolution", label: "Evolution & Dinosaurs", badge: "22", months: "Dec 01 – 30" },
  { key: "human", label: "Human Civilization", badge: "8", months: "Dec 31" },
];

function getRowEra(dateStr: string): EraKey {
  const lower = dateStr.toLowerCase();
  if (lower.startsWith("january") || lower.startsWith("march") || lower.startsWith("april") || lower.startsWith("august")) {
    return "cosmic";
  }
  if (lower.startsWith("september") || lower.startsWith("october") || lower.startsWith("november")) {
    return "precambrian";
  }
  if (lower.startsWith("december 31") || lower.startsWith("new year")) {
    return "human";
  }
  if (lower.startsWith("december")) {
    return "evolution";
  }
  return "all";
}

function renderTableCellContent(text: string) {
  // Handles markdown links, bold, italic, code, and LaTeX math ($...$)
  const regex = /(\$[^\$\n]+?\$|\[[^\]]+\]\((?:[^\s()]|\([^\s()]*\))+\)|\*\*.*?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length >= 2) {
      try {
        const html = katex.renderToString(part.slice(1, -1), { throwOnError: false });
        return (
          <span
            key={i}
            className="inline-math inline-block align-baseline px-0.5 text-foreground/95"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } catch {
        return <span key={i}>{part}</span>;
      }
    }
    if (part.startsWith("[") && part.endsWith(")")) {
      const splitIdx = part.indexOf("](");
      if (splitIdx !== -1) {
        const label = part.slice(1, splitIdx);
        const href = part.slice(splitIdx + 2, -1);
        const isExternal = href.startsWith("http://") || href.startsWith("https://");
        return (
          <a
            key={i}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-quantum hover:underline underline-offset-2 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {label}
          </a>
        );
      }
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={i} className="italic text-foreground/90 font-serif">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={i} className="font-mono text-xs text-quantum bg-quantum/10 px-1 py-0.5 rounded">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function BlogTableViewer({ table, accent = "olive" }: BlogTableViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEra, setSelectedEra] = useState<EraKey>("all");

  const isCosmicCalendarTable = useMemo(() => {
    if (!table.headers || table.headers.length < 3) return false;
    const h0 = table.headers[0].toLowerCase();
    const h1 = table.headers[1].toLowerCase();
    const h2 = table.headers[2].toLowerCase();
    return h0.includes("event") && h1.includes("time") && h2.includes("calendar");
  }, [table.headers]);

  // Categorize & filter rows
  const filteredRows = useMemo(() => {
    return table.rows.filter((row) => {
      const eventText = row[0] || "";
      const timeText = row[1] || "";
      const dateText = row[2] || "";

      // Era filter (if cosmic calendar table)
      if (isCosmicCalendarTable && selectedEra !== "all") {
        const rowEra = getRowEra(dateText);
        if (rowEra !== selectedEra) return false;
      }

      // Keyword search
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesEvent = eventText.toLowerCase().includes(q);
        const matchesTime = timeText.toLowerCase().includes(q);
        const matchesDate = dateText.toLowerCase().includes(q);
        if (!matchesEvent && !matchesTime && !matchesDate) return false;
      }

      return true;
    });
  }, [table.rows, isCosmicCalendarTable, selectedEra, searchQuery]);

  const accentColor =
    accent === "quantum"
      ? "text-quantum"
      : accent === "olive"
      ? "text-olive-400"
      : "text-crimson";

  const accentBorder =
    accent === "quantum"
      ? "border-quantum/30"
      : accent === "olive"
      ? "border-olive/30"
      : "border-crimson/30";

  const accentActiveBtn =
    accent === "quantum"
      ? "bg-quantum/20 text-quantum border-quantum/50 shadow-[0_0_12px_rgba(0,195,245,0.2)]"
      : accent === "olive"
      ? "bg-olive/20 text-olive-400 border-olive/50 shadow-[0_0_12px_rgba(107,143,39,0.2)]"
      : "bg-crimson/20 text-crimson border-crimson/50 shadow-[0_0_12px_rgba(220,20,60,0.2)]";

  return (
    <div className="my-8 rounded-2xl border border-white/10 glass-card overflow-hidden shadow-2xl transition-all">
      {/* Header & Controls Bar */}
      <div className="p-4 sm:p-6 border-b border-white/8 bg-white/[0.02]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-foreground/50 mb-1">
              {isCosmicCalendarTable ? (
                <Calendar size={13} className={accentColor} />
              ) : (
                <Clock size={13} className={accentColor} />
              )}
              <span>// {table.title || (isCosmicCalendarTable ? "Cosmic Timeline Master Index" : "Conversion Scale")}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-foreground">
              {table.title || (isCosmicCalendarTable ? "Master Chronology: 50 Milestones Across 13.8 Billion Years" : "Conversion Scale")}
            </h3>
          </div>

          {/* Quick Search Input */}
          {(table.rows.length > 8 || isCosmicCalendarTable) && (
            <div className="relative w-full md:w-72">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isCosmicCalendarTable ? "Search event, date, or year..." : "Search unit or scale..."}
                className="w-full pl-9 pr-8 py-2 text-xs font-mono rounded-xl bg-black/40 border border-white/10 focus:border-quantum/60 focus:outline-none text-foreground placeholder:text-foreground/35 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-0.5"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Era Filter Pills (For Cosmic Calendar Table) */}
        {isCosmicCalendarTable && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2">
            <span className="text-[11px] font-mono text-foreground/40 mr-1 flex items-center gap-1">
              <Filter size={11} /> Epoch:
            </span>
            {ERAS.map((era) => {
              const active = selectedEra === era.key;
              return (
                <button
                  key={era.key}
                  onClick={() => setSelectedEra(era.key)}
                  className={`text-xs font-mono px-3 py-1 rounded-lg border transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? accentActiveBtn
                      : "border-white/8 bg-white/[0.02] text-foreground/60 hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <span>{era.label}</span>
                  <span className="text-[10px] opacity-70 px-1 py-0.2 rounded bg-black/40">
                    {era.badge}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Stats counter & mobile swipe hint */}
        <div className="flex items-center justify-between text-[11px] font-mono text-foreground/40 pt-3 border-t border-white/5 mt-3">
          <div>
            Showing <span className="text-foreground font-semibold">{filteredRows.length}</span> of{" "}
            {table.rows.length} {isCosmicCalendarTable ? "milestones" : "entries"}
            {searchQuery && (
              <span className="ml-1 text-quantum">
                (filtered by &ldquo;{searchQuery}&rdquo;)
              </span>
            )}
          </div>
          <div className="sm:hidden text-[10px] text-foreground/40 italic">
            Swipe table horizontally →
          </div>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto max-h-[620px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-white/10">
            <tr>
              <th className="py-3 px-4 sm:px-6 text-[11px] font-mono uppercase tracking-widest text-foreground/50 w-12 text-center">
                #
              </th>
              {table.headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`py-3 px-4 sm:px-6 text-[11px] font-mono uppercase tracking-widest text-foreground/60 ${
                    isCosmicCalendarTable
                      ? idx === 1
                        ? "text-right w-48"
                        : idx === 2
                        ? "text-left w-64"
                        : "text-left"
                      : "text-left"
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {filteredRows.length > 0 ? (
              filteredRows.map((row, rIdx) => {
                if (!isCosmicCalendarTable) {
                  return (
                    <tr key={rIdx} className="hover:bg-white/[0.035] transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 text-xs font-mono text-foreground/30 text-center">
                        {String(rIdx + 1).padStart(2, "0")}
                      </td>
                      {row.map((cell, cIdx) => {
                        const trimmed = cell.trim();
                        const isBold = trimmed.startsWith("**") && trimmed.endsWith("**") && trimmed.length >= 4;
                        const displayVal = isBold ? trimmed.slice(2, -2) : cell;
                        return (
                          <td
                            key={cIdx}
                            className={`py-3.5 px-4 sm:px-6 text-sm ${
                              cIdx === 0
                                ? "font-semibold text-foreground font-sans"
                                : cIdx === 1
                                ? "font-mono text-quantum"
                                : "font-mono text-foreground/80 text-xs sm:text-sm"
                            }`}
                          >
                            {isBold ? (
                              <strong className="text-foreground font-semibold">
                                {renderTableCellContent(displayVal)}
                              </strong>
                            ) : (
                              renderTableCellContent(displayVal)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                }

                const eventTitle = row[0] || "";
                const timeStr = row[1] || "";
                const dateStr = row[2] || "";

                const isExtinction =
                  eventTitle.toLowerCase().includes("extinction") ||
                  eventTitle.toLowerCase().includes("great dying") ||
                  eventTitle.toLowerCase().includes("chicxulub");

                const isBigBang = eventTitle.toLowerCase().includes("big bang");
                const isPresentDay = eventTitle.toLowerCase() === "present day";
                const isDecember31 = dateStr.toLowerCase().startsWith("december 31");
                const isNewYear =
                  dateStr.toLowerCase().includes("new year") ||
                  (isPresentDay && dateStr.toLowerCase().includes("00:00:00"));

                // Determine subtle row background
                let rowBg = "hover:bg-white/[0.035] transition-colors";
                if (isBigBang) {
                  rowBg = "bg-quantum/[0.04] hover:bg-quantum/[0.08] transition-colors";
                } else if (isNewYear || isPresentDay) {
                  rowBg = "bg-emerald-500/[0.05] hover:bg-emerald-500/[0.08] transition-colors";
                } else if (isExtinction) {
                  rowBg = "hover:bg-crimson/[0.05] transition-colors";
                } else if (isDecember31) {
                  rowBg = "bg-amber-500/[0.02] hover:bg-amber-500/[0.05] transition-colors";
                }

                return (
                  <tr key={rIdx} className={rowBg}>
                    {/* Index */}
                    <td className="py-3 px-4 sm:px-6 text-xs font-mono text-foreground/30 text-center">
                      {String(rIdx + 1).padStart(2, "0")}
                    </td>

                    {/* Column 0: Event */}
                    <td className="py-3 px-4 sm:px-6 text-foreground/90 font-medium font-sans">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isBigBang && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-quantum/15 text-quantum border border-quantum/30">
                            <Sparkles size={10} /> Cosmic Genesis
                          </span>
                        )}
                        {isExtinction && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-crimson/15 text-crimson border border-crimson/30">
                            <AlertTriangle size={10} /> Mass Extinction
                          </span>
                        )}
                        {isPresentDay && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Clock size={10} /> Now
                          </span>
                        )}
                        <span className="text-foreground leading-snug">
                          {renderTableCellContent(eventTitle)}
                        </span>
                      </div>
                    </td>

                    {/* Column 1: Time (Years Ago) */}
                    <td className="py-3 px-4 sm:px-6 text-right font-mono text-xs sm:text-sm text-quantum whitespace-nowrap">
                      {timeStr}
                    </td>

                    {/* Column 2: Cosmic Calendar Date */}
                    <td className="py-3 px-4 sm:px-6 text-left whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs ${
                          isNewYear
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                            : "bg-black/40 border border-white/10"
                        }`}
                      >
                        {isNewYear ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Clock size={11} className="text-emerald-400" />
                            {dateStr}
                          </span>
                        ) : isDecember31 ? (
                          <span className="text-amber-300 font-semibold flex items-center gap-1">
                            <Clock size={11} className="text-amber-400" />
                            {dateStr}
                          </span>
                        ) : (
                          <span className="text-foreground/85">{dateStr}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={table.headers.length + 1}
                  className="py-12 px-6 text-center text-foreground/50 font-mono text-xs space-y-2"
                >
                  <p>No cosmic events found matching &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedEra("all");
                    }}
                    className="text-quantum hover:underline text-xs inline-flex items-center gap-1 mt-2"
                  >
                    Reset all filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Caption */}
      <div className="p-3.5 sm:p-4 bg-black/60 border-t border-white/8 text-center text-xs font-mono text-foreground/55">
        {table.caption || (
          <span>
            {isCosmicCalendarTable
              ? "Calculated on a standard 365-day cosmic year (1 second ≈ 437.6 years, 1 hour ≈ 1.58 million years, 1 day ≈ 37.8 million years)."
              : "Cosmic unit conversions based on a 13.8-billion-year cosmic calendar year."}
          </span>
        )}
      </div>
    </div>
  );
}
