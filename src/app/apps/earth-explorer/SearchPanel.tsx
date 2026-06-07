"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, X } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

interface SearchPanelProps {
  onSelect: (lat: number, lon: number, name: string) => void;
}

/* ─── Debounce hook ─────────────────────────────────────────────────────── */
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function SearchPanel({ onSelect }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<
    { name: string; lat: number; lon: number }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 400);

  /* ── Fetch from Nominatim ────────────────────────────────────────── */
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(
        debouncedQuery
      )}`,
      {
        headers: { "Accept-Language": "en" },
      }
    )
      .then((r) => r.json())
      .then((data: SearchResult[]) => {
        if (!cancelled) {
          setResults(data);
          setOpen(data.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  /* ── Handle selection ────────────────────────────────────────────── */
  const handleSelect = useCallback(
    (result: SearchResult) => {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      const name = result.display_name.split(",")[0];

      onSelect(lat, lon, name);
      setQuery(name);
      setOpen(false);

      // Add to recent searches (max 5)
      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (r) => !(r.lat === lat && r.lon === lon)
        );
        return [{ name, lat, lon }, ...filtered].slice(0, 5);
      });
    },
    [onSelect]
  );

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="ee-panel p-3"
      style={{ width: 280 }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-2.5">
        <MapPin size={13} style={{ color: "rgba(0,195,245,0.7)" }} />
        <span
          style={{
            fontSize: "0.65rem",
            fontFamily: '"JetBrains Mono", monospace',
            color: "rgba(248,249,250,0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Search Location
        </span>
      </div>

      {/* Search input */}
      <div style={{ position: "relative" }}>
        <Search
          size={13}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(248,249,250,0.25)",
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 2) setOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder="Search any place…"
          className="ee-search-input"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(248,249,250,0.3)",
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 2,
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div
          style={{
            height: 2,
            marginTop: 4,
            borderRadius: 999,
            overflow: "hidden",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, #00c3f5, #9333ea)",
              animation: "ee-loading-slide 1.2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      {/* Results dropdown */}
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: 6,
              maxHeight: 220,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {results.map((r) => (
              <div
                key={r.place_id}
                className="ee-search-result"
                onClick={() => handleSelect(r)}
              >
                <div className="ee-search-result-name">
                  {r.display_name.split(",")[0]}
                </div>
                <div className="ee-search-result-detail">
                  {r.display_name.split(",").slice(1, 3).join(",")}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent searches */}
      {!open && recentSearches.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: "0.55rem",
              fontFamily: '"JetBrains Mono", monospace',
              color: "rgba(248,249,250,0.2)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Clock size={9} />
            Recent
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recentSearches.map((r, i) => (
              <div
                key={i}
                className="ee-search-result"
                onClick={() => onSelect(r.lat, r.lon, r.name)}
              >
                <span className="ee-search-result-name">{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
