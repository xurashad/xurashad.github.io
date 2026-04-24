"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  ChangeEvent,
} from "react";
import {
  Search,
  LayoutGrid,
  LayoutList,
  Loader2,
  BookOpen,
  X,
  AlertCircle,
  RefreshCw,
  Hash,
  Layers,
} from "lucide-react";
import { CATEGORIES_HIERARCHY } from "./lib/categories";
import {
  fetchUnicodeData,
  fetchUnicodeBlocks,
  type UnicodeChar,
  type UnicodeBlock,
} from "./lib/unicodeService";
import { CharacterCard, CharacterListItem } from "./CharacterViews";
import { CharacterDetailModal } from "./CharacterDetailModal";

const CHARS_PER_PAGE = 120;

/* ─── Pagination ─────────────────────────────────────────────────────────── */
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const [input, setInput] = useState(String(currentPage));
  useEffect(() => setInput(String(currentPage)), [currentPage]);

  if (totalPages <= 1) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(input, 10);
    if (!isNaN(n)) onPageChange(Math.max(1, Math.min(n, totalPages)));
    else setInput(String(currentPage));
  };

  const btnCls =
    "px-3 py-1.5 rounded-lg text-xs font-mono border border-white/10 bg-white/5 text-foreground/50 hover:bg-quantum/10 hover:text-quantum hover:border-quantum/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed";

  // Page window — show up to 5 page numbers around current
  const pageNums: (number | "…")[] = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pageNums.push(i);
    } else if (pageNums[pageNums.length - 1] !== "…") {
      pageNums.push("…");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 my-8">
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={btnCls}
        >
          «
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={btnCls}
        >
          ‹ Prev
        </button>

        {pageNums.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-foreground/25 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-8 h-8 rounded-lg text-xs font-mono transition-all border ${
                p === currentPage
                  ? "bg-quantum/20 text-quantum border-quantum/30 font-bold"
                  : "border-white/10 bg-white/5 text-foreground/40 hover:bg-quantum/10 hover:text-quantum hover:border-quantum/30"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={btnCls}
        >
          Next ›
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={btnCls}
        >
          »
        </button>
      </div>

      {/* Jump-to-page form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <span className="text-xs font-mono text-foreground/30">
          Page
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={input}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          className="w-14 text-center text-xs font-mono bg-black/20 border border-white/10 rounded-lg py-1.5 focus:ring-2 focus:ring-quantum/40 outline-none text-foreground/70"
        />
        <span className="text-xs font-mono text-foreground/30">of {totalPages.toLocaleString()}</span>
        <button type="submit" className={btnCls}>Go</button>
      </form>
    </div>
  );
}

/* ─── Loading skeleton ───────────────────────────────────────────────────── */
function LoadingSkeleton({ mode }: { mode: "grid" | "list" }) {
  if (mode === "list") {
    return (
      <div className="flex flex-col gap-2 max-w-3xl mx-auto">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="glass-card flex items-center gap-4 p-3 h-20 animate-pulse">
            <div className="w-14 h-14 rounded-xl bg-white/5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-white/5 rounded w-2/3" />
              <div className="h-2.5 bg-white/5 rounded w-1/4" />
              <div className="h-2 bg-white/5 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
      {Array.from({ length: 60 }).map((_, i) => (
        <div
          key={i}
          className="glass-card aspect-square animate-pulse"
          style={{ animationDelay: `${(i % 12) * 40}ms` }}
        />
      ))}
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────────────────────── */
export function UnicodeApp() {
  const [allChars, setAllChars] = useState<UnicodeChar[]>([]);
  const [blocks, setBlocks] = useState<UnicodeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Connecting to unicode.org…");
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedChar, setSelectedChar] = useState<UnicodeChar | null>(null);
  const [selectedCharBlock, setSelectedCharBlock] = useState<string | undefined>();

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLoadingMessage("Fetching Unicode character database…");

    try {
      const [charData, blockData] = await Promise.all([
        fetchUnicodeData(),
        fetchUnicodeBlocks(),
      ]);
      setAllChars(charData);
      setBlocks(blockData);
      setLoadingMessage(`Loaded ${charData.length.toLocaleString()} characters`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load Unicode data."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    let chars = allChars;

    if (selectedBlock !== "All") {
      const block = blocks.find((b) => b.name === selectedBlock);
      if (block) {
        chars = chars.filter((c) => {
          const code = parseInt(c.codePoint, 16);
          return code >= block.startCode && code <= block.endCode;
        });
      }
    }

    if (selectedCategory !== "All") {
      chars =
        selectedCategory.length === 1
          ? chars.filter((c) => c.category.startsWith(selectedCategory))
          : chars.filter((c) => c.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const normalised = q.startsWith("u+") ? q.slice(2) : q;
      chars = chars.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.codePoint.toLowerCase().includes(normalised) ||
          c.character === search.trim()
      );
    }

    return chars;
  }, [allChars, blocks, selectedBlock, selectedCategory, search]);

  const totalPages = Math.ceil(filtered.length / CHARS_PER_PAGE);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * CHARS_PER_PAGE;
    return filtered.slice(start, start + CHARS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset page when filters change
  const resetPage = useCallback(() => setCurrentPage(1), []);

  /* ── Handlers ── */
  const handleSelect = useCallback(
    (char: UnicodeChar) => {
      const code = parseInt(char.codePoint, 16);
      const block = blocks.find((b) => code >= b.startCode && code <= b.endCode);
      setSelectedCharBlock(block?.name);
      setSelectedChar(char);
    },
    [blocks]
  );

  const handleCloseModal = useCallback(() => {
    setSelectedChar(null);
    setSelectedCharBlock(undefined);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      if (page > 0 && page <= totalPages) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [totalPages]
  );

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("All");
    setSelectedBlock("All");
    resetPage();
  };

  const hasActiveFilters =
    search !== "" || selectedCategory !== "All" || selectedBlock !== "All";

  /* ── Stats ── */
  const stats = useMemo(() => {
    if (allChars.length === 0) return null;
    const categories = new Set(allChars.map((c) => c.category.charAt(0))).size;
    return {
      total: allChars.length,
      blocks: blocks.length,
      categories,
    };
  }, [allChars, blocks]);

  /* ─────────────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Stats bar */}
      {stats && !isLoading && !error && (
        <div className="flex flex-wrap gap-4 text-xs font-mono text-foreground/35">
          <span className="flex items-center gap-1.5">
            <Hash size={11} className="text-quantum/60" />
            {stats.total.toLocaleString()} characters
          </span>
          <span className="flex items-center gap-1.5">
            <Layers size={11} className="text-quantum/60" />
            {stats.blocks} script blocks
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen size={11} className="text-quantum/60" />
            {stats.categories} major categories
          </span>
        </div>
      )}

      {/* ── Search bar ── */}
      <div className="relative max-w-2xl">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by name, U+ code point, or paste a character…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          className="w-full pl-11 pr-10 py-3 rounded-2xl glass border border-white/8 bg-transparent text-sm text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 focus:ring-2 focus:ring-quantum/15 transition-all"
        />
        {search && (
          <button
            onClick={() => { setSearch(""); resetPage(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/70 transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Filters row ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Category select */}
        <select
          value={selectedCategory}
          onChange={(e) => { setSelectedCategory(e.target.value); resetPage(); }}
          className="flex-1 px-4 py-2.5 rounded-xl glass border border-white/8 bg-transparent text-sm text-foreground/70 focus:outline-none focus:border-quantum/40 transition-all cursor-pointer"
        >
          <option value="All">All Categories</option>
          {Object.entries(CATEGORIES_HIERARCHY).map(([mainCode, { name, subgroups }]) => (
            <optgroup key={mainCode} label={name}>
              <option value={mainCode}>All {name}s</option>
              {subgroups.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </optgroup>
          ))}
        </select>

        {/* Block select */}
        <select
          value={selectedBlock}
          onChange={(e) => { setSelectedBlock(e.target.value); resetPage(); }}
          className="flex-1 px-4 py-2.5 rounded-xl glass border border-white/8 bg-transparent text-sm text-foreground/70 focus:outline-none focus:border-quantum/40 transition-all cursor-pointer"
        >
          <option value="All">All Script Blocks</option>
          {blocks.map((b) => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>

        {/* Right controls */}
        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs font-mono text-crimson/70 hover:text-crimson border border-crimson/20 bg-crimson/8 px-3 py-2 rounded-xl transition-colors"
            >
              <X size={11} /> Clear filters
            </button>
          )}

          {/* View toggle */}
          <div className="flex items-center gap-1 glass rounded-xl p-1 border border-white/8">
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                aria-label={v === "grid" ? "Grid view" : "List view"}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === v
                    ? "bg-quantum/20 text-quantum"
                    : "text-foreground/40 hover:text-foreground/70"
                }`}
              >
                {v === "grid" ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results count + found range ── */}
      {!isLoading && !error && allChars.length > 0 && (
        <div className="flex items-center justify-between text-xs font-mono text-foreground/30">
          <span>
            Showing {((currentPage - 1) * CHARS_PER_PAGE + 1).toLocaleString()}–
            {Math.min(currentPage * CHARS_PER_PAGE, filtered.length).toLocaleString()}
            {" "}of{" "}
            <span className="text-quantum/60">
              {filtered.length.toLocaleString()}
            </span>
            {hasActiveFilters && (
              <span className="text-foreground/25"> (filtered from {allChars.length.toLocaleString()})</span>
            )}
          </span>
          {totalPages > 1 && (
            <span>Page {currentPage} / {totalPages.toLocaleString()}</span>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-quantum/20 bg-quantum/5">
            <Loader2 size={18} className="text-quantum animate-spin shrink-0" />
            <div>
              <p className="text-sm text-foreground/70 font-medium">{loadingMessage}</p>
              <p className="text-xs text-foreground/35 mt-0.5">
                Fetching from unicode.org via secure server proxy…
              </p>
            </div>
          </div>
          <LoadingSkeleton mode={viewMode} />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl border border-crimson/30 bg-crimson/8 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-crimson shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-crimson">Failed to load Unicode data</p>
              <p className="text-xs text-foreground/50 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-xl border border-quantum/30 bg-quantum/10 text-quantum hover:bg-quantum/20 transition-colors"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-foreground/30">
          <BookOpen size={40} className="text-foreground/12" />
          <p className="text-sm font-medium">No characters found</p>
          <p className="text-xs">Try a different search term or filter.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-xs text-quantum/60 hover:text-quantum underline transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
            {paginated.map((char) => (
              <CharacterCard
                key={char.codePoint}
                character={char}
                onSelect={handleSelect}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2 max-w-3xl mx-auto">
            {paginated.map((char) => (
              <CharacterListItem
                key={char.codePoint}
                character={char}
                onSelect={handleSelect}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Character detail modal */}
      {selectedChar && (
        <CharacterDetailModal
          character={selectedChar}
          blockName={selectedCharBlock}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
