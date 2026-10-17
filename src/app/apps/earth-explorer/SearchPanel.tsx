"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Clock, X, Compass } from "lucide-react";

/* Types */
interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
}

interface SearchPanelProps {
  onSelect: (lat: number, lon: number, name: string) => void;
  className?: string;
  isMobileModal?: boolean;
  onCloseMobile?: () => void;
}

/* Debounce hook */
function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* Parse coordinates if entered by user */
function parseCoordinates(query: string): { lat: number; lon: number } | null {
  const clean = query.trim();
  const m = clean.match(/^([+-]?\d+(?:\.\d+)?)\s*[, ]\s*([+-]?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lon = parseFloat(m[2]);
  if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    return { lat, lon };
  }
  return null;
}

export default function SearchPanel({
  onSelect,
  className = "",
  isMobileModal = false,
  onCloseMobile,
}: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<
    { name: string; lat: number; lon: number }[]
  >([
    { name: "Al-Quds (Jerusalem), Palestine", lat: 31.7767, lon: 35.2345 },
    { name: "Birzeit University, Palestine", lat: 31.95, lon: 35.19 },
    { name: "Mecca, Saudi Arabia", lat: 21.4225, lon: 39.8262 },
    { name: "Durham, United Kingdom", lat: 54.776, lon: -1.574 },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 350);

  /* Auto-focus on mobile sheet open */
  useEffect(() => {
    if (isMobileModal) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isMobileModal]);

  /* Close results dropdown when clicking outside */
  useEffect(() => {
    if (isMobileModal) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileModal]);

  /* Detect coordinate input */
  const parsedCoord = parseCoordinates(query);

  /* Fetch geocoding results via OSM Nominatim */
  useEffect(() => {
    if (parsedCoord) {
      setResults([]);
      setLoading(false);
      setOpen(true);
      return;
    }

    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        debouncedQuery
      )}&limit=6&addressdetails=1`,
      {
        headers: { "Accept-Language": "en" },
      }
    )
      .then((r) => r.json())
      .then((data: SearchResult[]) => {
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
          setOpen(true);
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
  }, [debouncedQuery, parsedCoord]);

  /* Handle selection */
  const handleSelect = useCallback(
    (lat: number, lon: number, name: string) => {
      onSelect(lat, lon, name);
      setQuery(name);
      setOpen(false);

      // Add to recent searches (max 5)
      setRecentSearches((prev) => {
        const filtered = prev.filter(
          (r) => !(Math.abs(r.lat - lat) < 0.001 && Math.abs(r.lon - lon) < 0.001)
        );
        return [{ name, lat, lon }, ...filtered].slice(0, 5);
      });

      if (onCloseMobile) onCloseMobile();
    },
    [onSelect, onCloseMobile]
  );

  return (
    <div
      ref={panelRef}
      className={isMobileModal ? "w-full" : `ee-panel p-3.5 ${className}`}
      style={isMobileModal ? { width: "100%" } : { width: 320 }}
    >
      {/* Title / Header (Only for desktop panel) */}
      {!isMobileModal && (
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-[#00c3f5]" />
            <span className="text-[10px] font-mono text-foreground/50 tracking-widest uppercase font-semibold">
              Location Search
            </span>
          </div>
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/35 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length >= 1) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && parsedCoord) {
              handleSelect(
                parsedCoord.lat,
                parsedCoord.lon,
                `Coord (${parsedCoord.lat.toFixed(4)}, ${parsedCoord.lon.toFixed(4)})`
              );
            }
          }}
          placeholder="Search city, landmark, or coordinates..."
          className="ee-search-input pr-8 text-xs font-mono"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-white transition-colors p-1"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Direct coordinate suggestion */}
      {parsedCoord && (
        <div className="mt-2 p-2 rounded-lg bg-[#00c3f5]/10 border border-[#00c3f5]/30">
          <button
            type="button"
            onClick={() =>
              handleSelect(
                parsedCoord.lat,
                parsedCoord.lon,
                `Coord (${parsedCoord.lat.toFixed(4)}, ${parsedCoord.lon.toFixed(4)})`
              )
            }
            className="w-full flex items-center justify-between text-left text-xs font-mono text-[#00c3f5] hover:underline"
          >
            <span className="flex items-center gap-1.5">
              <Compass size={13} />
              Jump to Coords: {parsedCoord.lat.toFixed(4)}°, {parsedCoord.lon.toFixed(4)}°
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider">Fly ✈</span>
          </button>
        </div>
      )}

      {/* Search results dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="ee-search-results"
          >
            {loading && (
              <div className="p-3 text-center text-xs font-mono text-foreground/40">
                Searching OpenStreetMap...
              </div>
            )}

            {!loading && results.length > 0 && (
              <div>
                {results.map((r) => {
                  const parts = r.display_name.split(",");
                  const mainName = parts[0]?.trim() || r.display_name;
                  const subtitle = parts.slice(1, 4).join(",").trim();

                  return (
                    <button
                      key={r.place_id}
                      type="button"
                      onClick={() =>
                        handleSelect(parseFloat(r.lat), parseFloat(r.lon), mainName)
                      }
                      className="ee-search-item"
                    >
                      <MapPin
                        size={14}
                        className="text-[#00c3f5] shrink-0 mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="ee-search-item-title truncate">
                          {mainName}
                        </div>
                        {subtitle && (
                          <div className="ee-search-item-sub truncate">
                            {subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && !parsedCoord && (
              <div className="p-3 text-center text-xs font-mono text-foreground/40">
                No locations found. Try city name or lat, lon
              </div>
            )}

            {/* Recent Searches */}
            {query.length === 0 && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono text-foreground/40 uppercase tracking-wider">
                  <Clock size={11} />
                  <span>Recent / Featured</span>
                </div>
                {recentSearches.map((rec) => (
                  <button
                    key={rec.name}
                    type="button"
                    onClick={() => handleSelect(rec.lat, rec.lon, rec.name)}
                    className="ee-search-item rounded-md"
                  >
                    <Compass size={13} className="text-[#9333ea] shrink-0 mt-0.5" />
                    <span className="ee-search-item-title truncate flex-1">
                      {rec.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
