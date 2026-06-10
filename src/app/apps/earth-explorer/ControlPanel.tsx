"use client";

import { motion } from "framer-motion";
import {
  Home, Maximize, Minimize, Sun, Moon, Cloud, Navigation,
  Compass, Layers,
} from "lucide-react";
import type { CameraInfo, MapStyle } from "./CesiumGlobe";

/* Bookmarks */
const BOOKMARKS = [
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
];

/* Helpers */
function formatCoord(val: number, pos: string, neg: string) {
  const dir = val >= 0 ? pos : neg;
  return `${Math.abs(val).toFixed(4)}\u00B0${dir}`;
}

function formatAlt(meters: number) {
  if (meters > 1_000_000) return `${(meters / 1_000_000).toFixed(1)}M m`;
  if (meters > 1_000) return `${(meters / 1_000).toFixed(1)} km`;
  return `${meters.toFixed(0)} m`;
}

/* Props */
interface ControlPanelProps {
  camera: CameraInfo;
  enableLighting: boolean;
  enableAtmosphere: boolean;
  mapStyle: MapStyle;
  onToggleLighting: () => void;
  onToggleAtmosphere: () => void;
  onSetMapStyle: (style: MapStyle) => void;
  onFlyTo: (lat: number, lon: number, alt: number) => void;
  onResetView: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

/* Component */
export default function ControlPanel({
  camera,
  enableLighting,
  enableAtmosphere,
  mapStyle,
  onToggleLighting,
  onToggleAtmosphere,
  onSetMapStyle,
  onFlyTo,
  onResetView,
  onToggleFullscreen,
  isFullscreen,
}: ControlPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="ee-panel p-3"
      style={{ width: 260 }}
    >
      {/* Camera Info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <Compass size={13} style={{ color: "rgba(0,195,245,0.7)" }} />
        <span
          style={{
            fontSize: "0.65rem",
            fontFamily: '"JetBrains Mono", monospace',
            color: "rgba(248,249,250,0.35)",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Camera
        </span>
      </div>

      <div className="ee-info-grid">
        <div className="ee-info-item">
          <span className="ee-info-label">Lat</span>
          <span className="ee-info-value">
            {formatCoord(camera.lat, "N", "S")}
          </span>
        </div>
        <div className="ee-info-item">
          <span className="ee-info-label">Lon</span>
          <span className="ee-info-value">
            {formatCoord(camera.lon, "E", "W")}
          </span>
        </div>
        <div className="ee-info-item">
          <span className="ee-info-label">Altitude</span>
          <span className="ee-info-value">{formatAlt(camera.alt)}</span>
        </div>
        <div className="ee-info-item">
          <span className="ee-info-label">Heading</span>
          <span className="ee-info-value">{camera.heading.toFixed(1)}&deg;</span>
        </div>
      </div>

      <div className="ee-divider" />

      {/* Quick Actions */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 8,
        }}
      >
        <button className="ee-ctrl-btn" onClick={onResetView} title="Reset view">
          <Home size={14} />
        </button>
        <button
          className="ee-ctrl-btn"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>
        <button
          className={`ee-ctrl-btn ${enableLighting ? "active" : ""}`}
          onClick={onToggleLighting}
          title="Day/Night lighting"
        >
          {enableLighting ? <Moon size={14} /> : <Sun size={14} />}
        </button>
        <button
          className={`ee-ctrl-btn ${enableAtmosphere ? "active" : ""}`}
          onClick={onToggleAtmosphere}
          title="Atmosphere"
        >
          <Cloud size={14} />
        </button>
      </div>

      {/* Map Style */}
      <div className="ee-section-label">
        <Layers size={11} />
        <span>Map Style</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {(["osm", "satellite", "dark"] as MapStyle[]).map((s) => (
          <button
            key={s}
            className={`ee-style-btn ${mapStyle === s ? "active" : ""}`}
            onClick={() => onSetMapStyle(s)}
          >
            {s === "osm" ? "Street" : s === "satellite" ? "Satellite" : "Dark"}
          </button>
        ))}
      </div>

      <div className="ee-divider" />

      {/* Bookmarks */}
      <div className="ee-section-label">
        <Navigation size={11} />
        <span>Quick Bookmarks</span>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
        }}
      >
        {BOOKMARKS.map((b) => (
          <button
            key={b.name}
            className="ee-bookmark-btn"
            onClick={() => onFlyTo(b.lat, b.lon, b.alt)}
          >
            <span>{b.emoji}</span> {b.name}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
