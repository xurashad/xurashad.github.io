"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import SearchPanel from "./SearchPanel";
import ControlPanel from "./ControlPanel";
import type { CameraInfo, MapStyle } from "./CesiumGlobe";
import "./earth-explorer.css";

/* ── Dynamically import CesiumGlobe (client-only, no SSR) ──────────── */
const CesiumGlobe = dynamic(() => import("./CesiumGlobe"), { ssr: false });

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function EarthExplorer() {
  /* ── State ───────────────────────────────────────────────────────── */
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
  const rootRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  /* ── Handlers ────────────────────────────────────────────────────── */
  const handleCameraChange = useCallback((info: CameraInfo) => {
    setCamera(info);
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
  }, []);

  const handleFlyTo = useCallback(
    (lat: number, lon: number, alt?: number) => {
      // Change reference to trigger useEffect in CesiumGlobe
      setFlyTarget({ lat, lon, alt: alt ?? 150000 });
    },
    []
  );

  const handleSearchSelect = useCallback(
    (lat: number, lon: number, _name: string) => {
      handleFlyTo(lat, lon);
    },
    [handleFlyTo]
  );

  const handleCoordinateCopied = useCallback(
    (lat: number, lon: number) => {
      const text = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
      navigator.clipboard.writeText(text).catch(() => {});
      showToast(`📋 Copied: ${text}`);
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

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div ref={rootRef} className="earth-explorer-root">
      {/* ── Loading Screen ────────────────────────────────────────── */}
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
              Loading CesiumJS + OpenStreetMap tiles…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Globe ─────────────────────────────────────────────────── */}
      <CesiumGlobe
        onCameraChange={handleCameraChange}
        onReady={handleReady}
        onCoordinateCopied={handleCoordinateCopied}
        flyToTarget={flyTarget}
        enableLighting={enableLighting}
        enableAtmosphere={enableAtmosphere}
        mapStyle={mapStyle}
      />

      {/* ── Overlay Panels ────────────────────────────────────────── */}
      {ready && (
        <>
          {/* Search Panel — top left */}
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 30,
            }}
          >
            <SearchPanel onSelect={handleSearchSelect} />
          </div>

          {/* Control Panel — top right */}
          <div
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 30,
            }}
          >
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

          {/* Bottom-center branding */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 12px",
              borderRadius: 8,
              background: "rgba(8,6,20,0.6)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span
              style={{
                fontSize: "0.6rem",
                fontFamily: '"JetBrains Mono", monospace',
                color: "rgba(248,249,250,0.2)",
              }}
            >
              🌍 Earth Explorer
            </span>
            <span
              style={{
                fontSize: "0.5rem",
                color: "rgba(248,249,250,0.12)",
              }}
            >
              •
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
        </>
      )}

      {/* ── Coordinate Toast ──────────────────────────────────────── */}
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
