"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  X,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Cloud,
  Navigation,
  Compass,
  Layers,
  RotateCw,
  Plus,
  Minus,
  Mountain,
  Search as SearchIcon,
  MapPin,
  Copy,
  Check,
  Globe2,
} from "lucide-react";
import SearchPanel from "./SearchPanel";
import ControlPanel, { BOOKMARKS, MAP_STYLES_INFO } from "./ControlPanel";
import type { CameraInfo, MapStyle, CesiumGlobeHandle } from "./CesiumGlobe";
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
    pitch: -90,
  });
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lon: number;
    alt?: number;
    name?: string;
  } | null>(null);

  /* Visual toggles */
  const [enableLighting, setEnableLighting] = useState(false);
  const [enableAtmosphere, setEnableAtmosphere] = useState(true);
  const [enableAutoRotate, setEnableAutoRotate] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [mapStyle, setMapStyle] = useState<MapStyle>("satellite");

  /* UI feedback & modal states */
  const [toast, setToast] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* Mobile drawers: null | 'search' | 'bookmarks' | 'layers' | 'telemetry' */
  const [activeMobileDrawer, setActiveMobileDrawer] = useState<
    "search" | "bookmarks" | "layers" | "telemetry" | null
  >(null);
  const [activeBookmarkCategory, setActiveBookmarkCategory] = useState<string>("Palestine");

  const rootRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<CesiumGlobeHandle>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  /* Toast Helper */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  /* Handlers */
  const handleCameraChange = useCallback((info: CameraInfo) => {
    setCamera(info);
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
  }, []);

  const handleFlyTo = useCallback(
    (lat: number, lon: number, alt?: number, name?: string) => {
      setFlyTarget({ lat, lon, alt: alt ?? 120000, name });
      setActiveMobileDrawer(null);
    },
    []
  );

  const handleSearchSelect = useCallback(
    (lat: number, lon: number, name: string) => {
      handleFlyTo(lat, lon, 100000, name);
      setActiveMobileDrawer(null);
    },
    [handleFlyTo]
  );

  const handleCoordinateCopied = useCallback(
    (lat: number, lon: number) => {
      const text = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      navigator.clipboard.writeText(text).catch(() => {});
      showToast(`Copied: ${text}`);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    },
    [showToast]
  );

  const handleResetView = useCallback(() => {
    setFlyTarget({ lat: 31.9, lon: 35.2, alt: 15000000, name: "Palestine" });
    setActiveMobileDrawer(null);
  }, []);

  const handleResetNorth = useCallback(() => {
    globeRef.current?.resetNorth();
    showToast("Heading reset to True North");
  }, [showToast]);

  const handleToggleTilt = useCallback(() => {
    globeRef.current?.toggleTilt();
  }, []);

  const handleZoomIn = useCallback(() => {
    globeRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    globeRef.current?.zoomOut();
  }, []);

  /* Fullscreen toggle with fallback for iOS / mobile browsers */
  const handleToggleFullscreen = useCallback(() => {
    if (!rootRef.current) return;

    if (!document.fullscreenElement && !(rootRef.current as any).webkitFullscreenElement) {
      if (rootRef.current.requestFullscreen) {
        rootRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
        setIsFullscreen(true);
      } else if ((rootRef.current as any).webkitRequestFullscreen) {
        (rootRef.current as any).webkitRequestFullscreen();
        setIsFullscreen(true);
      } else {
        // Fallback to fixed CSS fullscreen
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, []);

  /* Keep isFullscreen in sync with Esc or native change */
  useEffect(() => {
    const onFsChange = () => {
      const isFs = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      setIsFullscreen(isFs);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  /* Active style metadata */
  const currentStyleMeta =
    MAP_STYLES_INFO.find((s) => s.id === mapStyle) || MAP_STYLES_INFO[0];

  const categories = ["Palestine", "Holy Sites", "Capitals", "Wonders"];
  const filteredBookmarks = BOOKMARKS.filter(
    (b) => b.category === activeBookmarkCategory
  );

  return (
    <div
      ref={rootRef}
      className={`earth-explorer-root ${isFullscreen ? "ee-fullscreen-active" : ""}`}
    >
      {/* Loading Screen */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            className="ee-loading"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="ee-loading-globe" />
            <div className="ee-loading-text">Initializing Earth Explorer</div>
            <div className="ee-loading-bar">
              <div className="ee-loading-bar-fill" />
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: "0.65rem",
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(248,249,250,0.4)",
                textAlign: "center",
                padding: "0 20px",
              }}
            >
              Loading High-Res Open Source Satellite & Vector Map Tiles...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Globe with ref */}
      <CesiumGlobe
        ref={globeRef}
        onCameraChange={handleCameraChange}
        onReady={handleReady}
        onCoordinateCopied={handleCoordinateCopied}
        flyToTarget={flyTarget}
        enableLighting={enableLighting}
        enableAtmosphere={enableAtmosphere}
        enableAutoRotate={enableAutoRotate}
        showLabels={showLabels}
        mapStyle={mapStyle}
      />

      {/* Desktop Overlay Panels */}
      {ready && !isMobile && (
        <>
          {/* Search Panel - Top Left */}
          <div className="ee-search-wrapper">
            <SearchPanel onSelect={handleSearchSelect} />
          </div>

          {/* Control Panel - Top Right */}
          <div className="ee-control-wrapper">
            <ControlPanel
              camera={camera}
              mapStyle={mapStyle}
              onMapStyleChange={setMapStyle}
              enableLighting={enableLighting}
              onToggleLighting={() => setEnableLighting((v) => !v)}
              enableAtmosphere={enableAtmosphere}
              onToggleAtmosphere={() => setEnableAtmosphere((v) => !v)}
              enableAutoRotate={enableAutoRotate}
              onToggleAutoRotate={() => setEnableAutoRotate((v) => !v)}
              showLabels={showLabels}
              onToggleLabels={() => setShowLabels((v) => !v)}
              onFlyTo={handleFlyTo}
              onResetView={handleResetView}
              onResetNorth={handleResetNorth}
              onToggleTilt={handleToggleTilt}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </div>

          {/* Bottom branding (Desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="ee-branding"
          >
            <Globe2 size={13} style={{ color: "#00c3f5" }} />
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(248,249,250,0.7)",
              }}
            >
              Earth Explorer
            </span>
            <span style={{ fontSize: "0.6rem", color: "rgba(248,249,250,0.2)" }}>|</span>
            <span
              style={{
                fontSize: "0.6rem",
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(0,195,245,0.7)",
              }}
            >
              {currentStyleMeta.label}
            </span>
            <span style={{ fontSize: "0.6rem", color: "rgba(248,249,250,0.2)" }}>|</span>
            <span
              style={{
                fontSize: "0.55rem",
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(248,249,250,0.4)",
              }}
            >
              Click surface to copy coordinates
            </span>
          </motion.div>
        </>
      )}

      {/* ================================================================ */}
      {/* MOBILE INTERFACE (Ultra Polish, Zero Cosmetics Clutter)          */}
      {/* ================================================================ */}
      {ready && isMobile && (
        <>
          {/* 1. Mobile Top Floating Bar */}
          <div className="ee-mob-top-bar">
            {/* Search Pill */}
            <button
              className="ee-mob-search-pill"
              onClick={() => setActiveMobileDrawer("search")}
              aria-label="Search places or coordinates"
            >
              <SearchIcon size={15} style={{ color: "#00c3f5", flexShrink: 0 }} />
              <span className="ee-mob-search-text">Search place or coords...</span>
            </button>

            {/* Quick Map Layer Pill */}
            <button
              className="ee-mob-layer-pill"
              onClick={() => setActiveMobileDrawer("layers")}
              aria-label="Change map layer"
            >
              <span>{currentStyleMeta.icon}</span>
              <span className="ee-mob-layer-name">{currentStyleMeta.label}</span>
            </button>

            {/* Fullscreen Expand/Exit */}
            <button
              className="ee-mob-icon-btn"
              onClick={handleToggleFullscreen}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
            </button>
          </div>

          {/* 2. Mobile Ergonomic Right Floating Stack (Thumb-friendly) */}
          <div className="ee-mob-right-stack">
            {/* Zoom In */}
            <button
              className="ee-mob-action-btn"
              onClick={handleZoomIn}
              aria-label="Zoom In"
            >
              <Plus size={18} />
            </button>

            {/* Zoom Out */}
            <button
              className="ee-mob-action-btn"
              onClick={handleZoomOut}
              aria-label="Zoom Out"
            >
              <Minus size={18} />
            </button>

            {/* Compass (Live Heading Angle) */}
            <button
              className="ee-mob-action-btn"
              onClick={handleResetNorth}
              aria-label="Reset to North"
              title="Compass Heading"
            >
              <Compass
                size={18}
                style={{
                  color: "#00c3f5",
                  transform: `rotate(${-camera.heading}deg)`,
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {/* 3D Tilt toggle */}
            <button
              className={`ee-mob-action-btn ${camera.pitch > -80 ? "active" : ""}`}
              onClick={handleToggleTilt}
              aria-label="Toggle 3D Tilt"
            >
              <Mountain size={17} />
            </button>

            {/* Auto-rotate toggle */}
            <button
              className={`ee-mob-action-btn ${enableAutoRotate ? "active" : ""}`}
              onClick={() => setEnableAutoRotate((v) => !v)}
              aria-label="Auto Rotate Globe"
            >
              <RotateCw size={16} />
            </button>
          </div>

          {/* 3. Mobile Bottom Dock (Floating Capsule) */}
          <div className="ee-mob-bottom-dock">
            {/* Home (Palestine / Origin) */}
            <button
              className="ee-mob-dock-btn"
              onClick={handleResetView}
              aria-label="Reset to Home"
            >
              <span className="ee-mob-dock-icon">🇵🇸</span>
              <span className="ee-mob-dock-label">Home</span>
            </button>

            {/* Bookmarks */}
            <button
              className={`ee-mob-dock-btn ${activeMobileDrawer === "bookmarks" ? "active" : ""}`}
              onClick={() =>
                setActiveMobileDrawer((curr) =>
                  curr === "bookmarks" ? null : "bookmarks"
                )
              }
              aria-label="Open Bookmarks"
            >
              <Navigation size={18} className="ee-mob-dock-icon" />
              <span className="ee-mob-dock-label">Bookmarks</span>
            </button>

            {/* Map Styles & Layers */}
            <button
              className={`ee-mob-dock-btn ${activeMobileDrawer === "layers" ? "active" : ""}`}
              onClick={() =>
                setActiveMobileDrawer((curr) =>
                  curr === "layers" ? null : "layers"
                )
              }
              aria-label="Open Layers"
            >
              <Layers size={18} className="ee-mob-dock-icon" />
              <span className="ee-mob-dock-label">Layers</span>
            </button>

            {/* Telemetry / Coordinates HUD */}
            <button
              className={`ee-mob-dock-btn ${activeMobileDrawer === "telemetry" ? "active" : ""}`}
              onClick={() =>
                setActiveMobileDrawer((curr) =>
                  curr === "telemetry" ? null : "telemetry"
                )
              }
              aria-label="Open HUD Info"
            >
              <MapPin size={18} className="ee-mob-dock-icon" />
              <span className="ee-mob-dock-label">Coordinates</span>
            </button>
          </div>

          {/* 4. Backdrop Overlay for active mobile drawer */}
          <AnimatePresence>
            {activeMobileDrawer && (
              <motion.div
                className="ee-mob-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveMobileDrawer(null)}
              />
            )}
          </AnimatePresence>

          {/* 5. Mobile Drawer Sheets */}
          <AnimatePresence>
            {/* A. Search Sheet */}
            {activeMobileDrawer === "search" && (
              <motion.div
                className="ee-mob-sheet ee-mob-sheet-search"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
              >
                <div className="ee-mob-sheet-handle" />
                <div className="ee-mob-sheet-header">
                  <div className="ee-mob-sheet-title">
                    <SearchIcon size={16} style={{ color: "#00c3f5" }} />
                    <span>Search Global Locations</span>
                  </div>
                  <button
                    className="ee-mob-sheet-close"
                    onClick={() => setActiveMobileDrawer(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="ee-mob-sheet-content">
                  <SearchPanel
                    onSelect={handleSearchSelect}
                    isMobileModal={true}
                    onCloseMobile={() => setActiveMobileDrawer(null)}
                  />
                </div>
              </motion.div>
            )}

            {/* B. Bookmarks Sheet */}
            {activeMobileDrawer === "bookmarks" && (
              <motion.div
                className="ee-mob-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
              >
                <div className="ee-mob-sheet-handle" />
                <div className="ee-mob-sheet-header">
                  <div className="ee-mob-sheet-title">
                    <Navigation size={16} style={{ color: "#9333ea" }} />
                    <span>World Landmarks & Places</span>
                  </div>
                  <button
                    className="ee-mob-sheet-close"
                    onClick={() => setActiveMobileDrawer(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Category tabs */}
                <div className="ee-mob-category-tabs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`ee-mob-tab-btn ${activeBookmarkCategory === cat ? "active" : ""}`}
                      onClick={() => setActiveBookmarkCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Bookmark list */}
                <div className="ee-mob-bookmark-grid">
                  {filteredBookmarks.map((b) => (
                    <button
                      key={b.name}
                      className="ee-mob-bookmark-card"
                      onClick={() => handleFlyTo(b.lat, b.lon, b.alt, b.name)}
                    >
                      <span className="ee-mob-bm-emoji">{b.emoji}</span>
                      <div className="ee-mob-bm-info">
                        <span className="ee-mob-bm-name">{b.name}</span>
                        <span className="ee-mob-bm-coords">
                          {b.lat.toFixed(2)}°, {b.lon.toFixed(2)}°
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* C. Layers & Map Styles Sheet */}
            {activeMobileDrawer === "layers" && (
              <motion.div
                className="ee-mob-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
              >
                <div className="ee-mob-sheet-handle" />
                <div className="ee-mob-sheet-header">
                  <div className="ee-mob-sheet-title">
                    <Layers size={16} style={{ color: "#00c3f5" }} />
                    <span>Free Open-Source Imagery Layers</span>
                  </div>
                  <button
                    className="ee-mob-sheet-close"
                    onClick={() => setActiveMobileDrawer(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Map style cards */}
                <div className="ee-mob-layers-grid">
                  {MAP_STYLES_INFO.map((style) => {
                    const isSelected = mapStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        className={`ee-mob-layer-card ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          setMapStyle(style.id);
                          showToast(`Layer: ${style.label}`);
                        }}
                      >
                        <div className="ee-mob-layer-header">
                          <span style={{ fontSize: "1.2rem" }}>{style.icon}</span>
                          {isSelected && (
                            <span className="ee-mob-check-badge">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <div className="ee-mob-layer-title">{style.label}</div>
                        <div className="ee-mob-layer-source">{style.tag}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Layer Overlays & Atmosphere */}
                <div className="ee-divider" style={{ margin: "14px 0 10px" }} />
                <div className="ee-mob-switches-row">
                  <button
                    className={`ee-mob-switch-btn ${showLabels ? "active" : ""}`}
                    onClick={() => {
                      setShowLabels((v) => !v);
                      showToast(showLabels ? "Labels hidden" : "Labels overlay active");
                    }}
                  >
                    <MapPin size={15} />
                    <span>Borders & Names</span>
                  </button>

                  <button
                    className={`ee-mob-switch-btn ${enableAtmosphere ? "active" : ""}`}
                    onClick={() => setEnableAtmosphere((v) => !v)}
                  >
                    <Cloud size={15} />
                    <span>Atmosphere</span>
                  </button>

                  <button
                    className={`ee-mob-switch-btn ${enableLighting ? "active" : ""}`}
                    onClick={() => setEnableLighting((v) => !v)}
                  >
                    {enableLighting ? <Moon size={15} /> : <Sun size={15} />}
                    <span>Sun Shadow</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* D. Telemetry & Coordinates Sheet */}
            {activeMobileDrawer === "telemetry" && (
              <motion.div
                className="ee-mob-sheet"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 280 }}
              >
                <div className="ee-mob-sheet-handle" />
                <div className="ee-mob-sheet-header">
                  <div className="ee-mob-sheet-title">
                    <MapPin size={16} style={{ color: "#00c3f5" }} />
                    <span>Live Orbital Telemetry</span>
                  </div>
                  <button
                    className="ee-mob-sheet-close"
                    onClick={() => setActiveMobileDrawer(null)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="ee-info-grid" style={{ gap: "8px", marginBottom: "12px" }}>
                  <div className="ee-info-item">
                    <span className="ee-info-label">Latitude</span>
                    <span className="ee-info-value">
                      {Math.abs(camera.lat).toFixed(4)}°{camera.lat >= 0 ? "N" : "S"}
                    </span>
                  </div>
                  <div className="ee-info-item">
                    <span className="ee-info-label">Longitude</span>
                    <span className="ee-info-value">
                      {Math.abs(camera.lon).toFixed(4)}°{camera.lon >= 0 ? "E" : "W"}
                    </span>
                  </div>
                  <div className="ee-info-item">
                    <span className="ee-info-label">Altitude</span>
                    <span className="ee-info-value">
                      {camera.alt > 1e6
                        ? `${(camera.alt / 1e6).toFixed(2)}M m`
                        : camera.alt > 1000
                        ? `${(camera.alt / 1000).toFixed(1)} km`
                        : `${camera.alt.toFixed(0)} m`}
                    </span>
                  </div>
                  <div className="ee-info-item">
                    <span className="ee-info-label">Heading / Tilt</span>
                    <span className="ee-info-value">
                      {camera.heading.toFixed(0)}° / {Math.round(camera.pitch)}°
                    </span>
                  </div>
                </div>

                <button
                  className="ee-mob-copy-btn"
                  onClick={() => handleCoordinateCopied(camera.lat, camera.lon)}
                >
                  {copiedCoords ? <Check size={16} /> : <Copy size={16} />}
                  <span>
                    {copiedCoords
                      ? "Coordinates Copied!"
                      : `Copy Current: ${camera.lat.toFixed(5)}, ${camera.lon.toFixed(5)}`}
                  </span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Floating Coordinate / Action Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="ee-toast"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
