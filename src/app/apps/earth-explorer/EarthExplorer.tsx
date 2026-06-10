"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Settings, X, Home, Maximize, Minimize, Sun, Moon, Cloud,
  Layers, Navigation, Search as SearchIcon,
} from "lucide-react";
import SearchPanel from "./SearchPanel";
import ControlPanel from "./ControlPanel";
import type { CameraInfo, MapStyle } from "./CesiumGlobe";
import "./earth-explorer.css";

/* Dynamically import CesiumGlobe (client-only, no SSR) */
const CesiumGlobe = dynamic(() => import("./CesiumGlobe"), { ssr: false });

/* Detect mobile via matchMedia */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

export default function EarthExplorer() {
  /* State */
  const [ready, setReady] = useState(false);
  const [camera, setCamera] = useState<CameraInfo>({
    lat: 31.9,
    lon: 35.2,
    alt: 15000000,
    heading: 0,
  });
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lon: number;
    alt?: number;
  } | null>(null);
  const [enableLighting, setEnableLighting] = useState(false);
  const [enableAtmosphere, setEnableAtmosphere] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>("osm");
  const [toast, setToast] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  /* Handlers */
  const handleCameraChange = useCallback((info: CameraInfo) => {
    setCamera(info);
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
  }, []);

  const handleFlyTo = useCallback(
    (lat: number, lon: number, alt?: number) => {
      setFlyTarget({ lat, lon, alt: alt ?? 150000 });
      setMobileSheet(false);
    },
    []
  );

  const handleSearchSelect = useCallback(
    (lat: number, lon: number, _name: string) => {
      handleFlyTo(lat, lon);
      setMobileSearch(false);
    },
    [handleFlyTo]
  );

  const handleCoordinateCopied = useCallback(
    (lat: number, lon: number) => {
      const text = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      navigator.clipboard.writeText(text).catch(() => {});
      showToast(`Copied: ${text}`);
    },
    []
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const handleResetView = useCallback(() => {
    setFlyTarget({ lat: 31.9, lon: 35.2, alt: 15000000 });
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!rootRef.current) return;
    if (!document.fullscreenElement) {
      rootRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  /* Render */
  return (
    <div ref={rootRef} className="earth-explorer-root">
      {/* Loading Screen */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            className="ee-loading"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="ee-loading-globe" />
            <div className="ee-loading-text">Initializing Globe</div>
            <div className="ee-loading-bar">
              <div className="ee-loading-bar-fill" />
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: "0.6rem",
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(248,249,250,0.2)",
              }}
            >
              Loading CesiumJS + OpenStreetMap tiles...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Globe */}
      <CesiumGlobe
        onCameraChange={handleCameraChange}
        onReady={handleReady}
        onCoordinateCopied={handleCoordinateCopied}
        flyToTarget={flyTarget}
        enableLighting={enableLighting}
        enableAtmosphere={enableAtmosphere}
        mapStyle={mapStyle}
      />

      {/* Desktop Overlay Panels */}
      {ready && (
        <>
          {/* Search Panel - top left (desktop always visible, mobile toggled) */}
          {(!isMobile || mobileSearch) && (
            <div className="ee-search-wrapper">
              <SearchPanel onSelect={handleSearchSelect} />
            </div>
          )}

          {/* Control Panel - top right (desktop only) */}
          <div className="ee-control-wrapper">
            <ControlPanel
              camera={camera}
              enableLighting={enableLighting}
              enableAtmosphere={enableAtmosphere}
              mapStyle={mapStyle}
              onToggleLighting={() => setEnableLighting((v) => !v)}
              onToggleAtmosphere={() => setEnableAtmosphere((v) => !v)}
              onSetMapStyle={setMapStyle}
              onFlyTo={handleFlyTo}
              onResetView={handleResetView}
              onToggleFullscreen={handleToggleFullscreen}
              isFullscreen={isFullscreen}
            />
          </div>

          {/* Bottom branding (desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="ee-branding"
          >
            <span
              style={{
                fontSize: "0.6rem",
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(248,249,250,0.2)",
              }}
            >
              Earth Explorer
            </span>
            <span
              style={{
                fontSize: "0.5rem",
                color: "rgba(248,249,250,0.12)",
              }}
            >
              |
            </span>
            <span
              style={{
                fontSize: "0.5rem",
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(248,249,250,0.12)",
              }}
            >
              Click globe to copy coordinates
            </span>
          </motion.div>

          {/* ---- Mobile UI ---- */}

          {/* Mobile bottom toolbar */}
          <div className="ee-mobile-toolbar">
            <button
              className="ee-ctrl-btn"
              onClick={() => { setMobileSearch((v) => !v); setMobileSheet(false); }}
              title="Search"
            >
              <SearchIcon size={16} />
            </button>
            <button className="ee-ctrl-btn" onClick={handleResetView} title="Home">
              <Home size={16} />
            </button>
            <button
              className={`ee-ctrl-btn ${enableLighting ? "active" : ""}`}
              onClick={() => setEnableLighting((v) => !v)}
              title="Day/Night"
            >
              {enableLighting ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <button
              className={`ee-ctrl-btn ${enableAtmosphere ? "active" : ""}`}
              onClick={() => setEnableAtmosphere((v) => !v)}
              title="Atmosphere"
            >
              <Cloud size={16} />
            </button>
            <button
              className="ee-ctrl-btn"
              onClick={handleToggleFullscreen}
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
            <button
              className="ee-ctrl-btn"
              onClick={() => { setMobileSheet((v) => !v); setMobileSearch(false); }}
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>

          {/* Mobile overlay backdrop */}
          <div
            className={`ee-mobile-overlay ${mobileSheet ? "open" : ""}`}
            onClick={() => setMobileSheet(false)}
          />

          {/* Mobile slide-up sheet */}
          <AnimatePresence>
            {mobileSheet && isMobile && (
              <motion.div
                className="ee-mobile-sheet open"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
              >
                <div className="ee-mobile-sheet-handle" />

                {/* Close button */}
                <button
                  onClick={() => setMobileSheet(false)}
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "none",
                    border: "none",
                    color: "rgba(248,249,250,0.4)",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <X size={18} />
                </button>

                {/* Map Style */}
                <div className="ee-section-label" style={{ marginTop: 4 }}>
                  <Layers size={12} />
                  <span>Map Style</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {(["osm", "satellite", "dark"] as MapStyle[]).map((s) => (
                    <button
                      key={s}
                      className={`ee-style-btn ${mapStyle === s ? "active" : ""}`}
                      onClick={() => setMapStyle(s)}
                      style={{ flex: 1 }}
                    >
                      {s === "osm" ? "Street" : s === "satellite" ? "Satellite" : "Dark"}
                    </button>
                  ))}
                </div>

                {/* Bookmarks */}
                <div className="ee-section-label">
                  <Navigation size={12} />
                  <span>Bookmarks</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {[
                    { name: "Palestine",  emoji: "\uD83C\uDDF5\uD83C\uDDF8", lat: 31.9,   lon: 35.2,   alt: 80000  },
                    { name: "Birzeit",    emoji: "\uD83C\uDFEB",             lat: 31.95,  lon: 35.19,  alt: 15000  },
                    { name: "Mecca",      emoji: "\uD83D\uDD4B",             lat: 21.4225,lon: 39.8262,alt: 25000  },
                    { name: "Durham",     emoji: "\uD83C\uDFF0",             lat: 54.776, lon: -1.574, alt: 30000  },
                    { name: "London",     emoji: "\uD83C\uDDEC\uD83C\uDDE7", lat: 51.507, lon: -0.128, alt: 60000  },
                    { name: "New York",   emoji: "\uD83C\uDDFA\uD83C\uDDF8", lat: 40.713, lon: -74.006,alt: 80000  },
                    { name: "Tokyo",      emoji: "\uD83C\uDDEF\uD83C\uDDF5", lat: 35.682, lon: 139.692,alt: 80000  },
                    { name: "Cairo",      emoji: "\uD83C\uDDEA\uD83C\uDDEC", lat: 30.044, lon: 31.236, alt: 60000  },
                    { name: "Paris",      emoji: "\uD83C\uDDEB\uD83C\uDDF7", lat: 48.857, lon: 2.352,  alt: 50000  },
                    { name: "Sydney",     emoji: "\uD83C\uDDE6\uD83C\uDDFA", lat: -33.868,lon: 151.207,alt: 80000  },
                  ].map((b) => (
                    <button
                      key={b.name}
                      className="ee-bookmark-btn"
                      onClick={() => handleFlyTo(b.lat, b.lon, b.alt)}
                    >
                      <span>{b.emoji}</span> {b.name}
                    </button>
                  ))}
                </div>

                {/* Camera Info */}
                <div className="ee-section-label">
                  <span style={{ color: "rgba(0,195,245,0.5)" }}>&#x1F4CD;</span>
                  <span>Camera</span>
                </div>
                <div className="ee-info-grid" style={{ marginBottom: 8 }}>
                  <div className="ee-info-item">
                    <span className="ee-info-label">Lat</span>
                    <span className="ee-info-value">
                      {Math.abs(camera.lat).toFixed(4)}&deg;{camera.lat >= 0 ? "N" : "S"}
                    </span>
                  </div>
                  <div className="ee-info-item">
                    <span className="ee-info-label">Lon</span>
                    <span className="ee-info-value">
                      {Math.abs(camera.lon).toFixed(4)}&deg;{camera.lon >= 0 ? "E" : "W"}
                    </span>
                  </div>
                  <div className="ee-info-item">
                    <span className="ee-info-label">Altitude</span>
                    <span className="ee-info-value">
                      {camera.alt > 1e6 ? `${(camera.alt / 1e6).toFixed(1)}M m` : camera.alt > 1000 ? `${(camera.alt / 1000).toFixed(1)} km` : `${camera.alt.toFixed(0)} m`}
                    </span>
                  </div>
                  <div className="ee-info-item">
                    <span className="ee-info-label">Heading</span>
                    <span className="ee-info-value">{camera.heading.toFixed(1)}&deg;</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Coordinate Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="ee-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
