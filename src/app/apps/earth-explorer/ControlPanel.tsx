"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home,
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
  Eye,
  Mountain,
} from "lucide-react";
import type { CameraInfo, MapStyle } from "./CesiumGlobe";

/* Categorized Bookmarks */
export interface Bookmark {
  name: string;
  category: "Palestine" | "Holy Sites" | "Capitals" | "Wonders";
  emoji: string;
  lat: number;
  lon: number;
  alt: number;
}

export const BOOKMARKS: Bookmark[] = [
  // Palestine & Levant
  { name: "Al-Quds (Jerusalem)", category: "Palestine", emoji: "🇵🇸", lat: 31.7767, lon: 35.2345, alt: 25000 },
  { name: "Birzeit University", category: "Palestine", emoji: "🏫", lat: 31.95, lon: 35.19, alt: 15000 },
  { name: "Gaza", category: "Palestine", emoji: "🇵🇸", lat: 31.50, lon: 34.46, alt: 35000 },
  { name: "Bethlehem", category: "Palestine", emoji: "⭐", lat: 31.705, lon: 35.202, alt: 20000 },
  { name: "Petra, Jordan", category: "Palestine", emoji: "🏛️", lat: 30.3285, lon: 35.4444, alt: 20000 },

  // Holy & Spiritual Sites
  { name: "Mecca (Kaaba)", category: "Holy Sites", emoji: "🕋", lat: 21.4225, lon: 39.8262, alt: 20000 },
  { name: "Medina (Nabawi)", category: "Holy Sites", emoji: "🕌", lat: 24.4672, lon: 39.6111, alt: 25000 },
  { name: "Pyramids of Giza", category: "Holy Sites", emoji: "🔺", lat: 29.9792, lon: 31.1342, alt: 15000 },
  { name: "Taj Mahal", category: "Holy Sites", emoji: "🕌", lat: 27.1751, lon: 78.0421, alt: 15000 },
  { name: "Colosseum, Rome", category: "Holy Sites", emoji: "🏟️", lat: 41.8902, lon: 12.4922, alt: 15000 },

  // World Metropolises
  { name: "Durham, UK", category: "Capitals", emoji: "🏰", lat: 54.776, lon: -1.574, alt: 25000 },
  { name: "London", category: "Capitals", emoji: "🇬🇧", lat: 51.507, lon: -0.128, alt: 45000 },
  { name: "Tokyo", category: "Capitals", emoji: "🇯🇵", lat: 35.682, lon: 139.692, alt: 50000 },
  { name: "New York City", category: "Capitals", emoji: "🇺🇸", lat: 40.713, lon: -74.006, alt: 50000 },
  { name: "Paris", category: "Capitals", emoji: "🇫🇷", lat: 48.857, lon: 2.352, alt: 40000 },
  { name: "Cairo", category: "Capitals", emoji: "🇪🇬", lat: 30.044, lon: 31.236, alt: 45000 },
  { name: "Istanbul", category: "Capitals", emoji: "🇹🇷", lat: 41.0082, lon: 28.9784, alt: 45000 },
  { name: "Sydney", category: "Capitals", emoji: "🇦🇺", lat: -33.868, lon: 151.207, alt: 50000 },

  // Natural Wonders
  { name: "Mount Everest", category: "Wonders", emoji: "🏔️", lat: 27.9881, lon: 86.925, alt: 30000 },
  { name: "Grand Canyon", category: "Wonders", emoji: "🏜️", lat: 36.1069, lon: -112.1129, alt: 40000 },
  { name: "Mount Fuji", category: "Wonders", emoji: "🗻", lat: 35.3606, lon: 138.7274, alt: 25000 },
  { name: "Victoria Falls", category: "Wonders", emoji: "🌊", lat: -17.9243, lon: 25.8572, alt: 25000 },
  { name: "Aurora / Tromsø", category: "Wonders", emoji: "🌌", lat: 69.6492, lon: 18.9553, alt: 60000 },
];

export const MAP_STYLES_INFO: { id: MapStyle; label: string; tag: string; icon: string }[] = [
  { id: "satellite", label: "Satellite", tag: "ArcGIS Imagery", icon: "🛰️" },
  { id: "street", label: "Street Map", tag: "Esri World Street", icon: "🌍" },
  { id: "topo", label: "Topographic", tag: "Esri World Topo", icon: "⛰️" },
  { id: "dark", label: "Dark Canvas", tag: "Esri Dark Matter", icon: "🌑" },
  { id: "light", label: "Clean Light", tag: "Esri Light Canvas", icon: "☀️" },
  { id: "night", label: "Earth at Night", tag: "NASA Black Marble", icon: "🌌" },
  { id: "natgeo", label: "NatGeo Atlas", tag: "National Geographic", icon: "📜" },
  { id: "ocean", label: "Ocean Floor", tag: "Esri Bathymetry", icon: "🌊" },
];

interface ControlPanelProps {
  camera: CameraInfo;
  mapStyle: MapStyle;
  onMapStyleChange: (style: MapStyle) => void;
  enableLighting: boolean;
  onToggleLighting: () => void;
  enableAtmosphere: boolean;
  onToggleAtmosphere: () => void;
  enableAutoRotate: boolean;
  onToggleAutoRotate: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onFlyTo: (lat: number, lon: number, alt?: number, name?: string) => void;
  onResetView: () => void;
  onResetNorth: () => void;
  onToggleTilt: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  className?: string;
}

export default function ControlPanel({
  camera,
  mapStyle,
  onMapStyleChange,
  enableLighting,
  onToggleLighting,
  enableAtmosphere,
  onToggleAtmosphere,
  enableAutoRotate,
  onToggleAutoRotate,
  showLabels,
  onToggleLabels,
  onFlyTo,
  onResetView,
  onResetNorth,
  onToggleTilt,
  onZoomIn,
  onZoomOut,
  isFullscreen,
  onToggleFullscreen,
  className = "",
}: ControlPanelProps) {
  const [selectedCat, setSelectedCat] = useState<string>("All");

  const categories = ["All", "Palestine", "Holy Sites", "Capitals", "Wonders"];

  const filteredBookmarks =
    selectedCat === "All"
      ? BOOKMARKS
      : BOOKMARKS.filter((b) => b.category === selectedCat);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className={`ee-panel p-3.5 flex flex-col gap-3 ${className}`}
      style={{ width: 330, maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
    >
      {/* ── Camera Telemetry ── */}
      <div>
        <div className="ee-section-label mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass size={12} className="text-[#00c3f5]" />
            <span>Camera Telemetry</span>
          </div>
          <span className="text-[9px] font-mono text-quantum/70">CesiumJS 3D</span>
        </div>

        <div className="ee-info-grid">
          <div className="ee-info-item">
            <span className="ee-info-label">LAT</span>
            <span className="ee-info-value font-mono">
              {Math.abs(camera.lat).toFixed(4)}°{camera.lat >= 0 ? "N" : "S"}
            </span>
          </div>
          <div className="ee-info-item">
            <span className="ee-info-label">LON</span>
            <span className="ee-info-value font-mono">
              {Math.abs(camera.lon).toFixed(4)}°{camera.lon >= 0 ? "E" : "W"}
            </span>
          </div>
          <div className="ee-info-item">
            <span className="ee-info-label">ALTITUDE</span>
            <span className="ee-info-value font-mono">
              {camera.alt > 1e6
                ? `${(camera.alt / 1e6).toFixed(1)}M m`
                : camera.alt > 1000
                ? `${(camera.alt / 1000).toFixed(1)} km`
                : `${camera.alt.toFixed(0)} m`}
            </span>
          </div>
          <div className="ee-info-item">
            <span className="ee-info-label">HEADING</span>
            <span className="ee-info-value font-mono">{camera.heading.toFixed(0)}°</span>
          </div>
        </div>
      </div>

      {/* ── Quick Action Buttons ── */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] border border-white/6 rounded-xl justify-between">
        <button
          type="button"
          onClick={onResetView}
          className="ee-ctrl-btn flex-1"
          title="Reset Camera to Overview"
        >
          <Home size={14} />
        </button>
        <button
          type="button"
          onClick={onResetNorth}
          className="ee-ctrl-btn flex-1"
          title="Align to North (Heading 0°)"
        >
          <Compass
            size={14}
            style={{ transform: `rotate(${-camera.heading}deg)`, transition: "transform 0.2s" }}
          />
        </button>
        <button
          type="button"
          onClick={onToggleTilt}
          className="ee-ctrl-btn flex-1"
          title="Toggle 3D Perspective Tilt"
        >
          <Mountain size={14} />
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          className="ee-ctrl-btn flex-1"
          title="Zoom In"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className="ee-ctrl-btn flex-1"
          title="Zoom Out"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={onToggleAutoRotate}
          className={`ee-ctrl-btn flex-1 ${enableAutoRotate ? "active" : ""}`}
          title="Auto-Rotate Globe"
        >
          <RotateCw size={14} className={enableAutoRotate ? "animate-spin" : ""} />
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="ee-ctrl-btn flex-1"
          title="Fullscreen Mode"
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>
      </div>

      <div className="ee-divider" />

      {/* ── Map Style Selector ── */}
      <div>
        <div className="ee-section-label mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={12} className="text-[#00c3f5]" />
            <span>Map Style (Free & Open Source)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {MAP_STYLES_INFO.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onMapStyleChange(s.id)}
              className={`ee-style-btn flex flex-col items-start p-2 text-left transition-all ${
                mapStyle === s.id ? "active ring-1 ring-[#00c3f5]/50" : ""
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span>{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </div>
              <span className="text-[9px] text-foreground/40 font-mono mt-0.5 truncate w-full">
                {s.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Overlays & Environmental Toggles ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onToggleLabels}
          className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all ${
            showLabels
              ? "bg-[#00c3f5]/20 border-[#00c3f5]/40 text-[#00c3f5]"
              : "bg-white/[0.03] border-white/8 text-foreground/50 hover:text-foreground"
          }`}
          title="Toggle Country Borders & City Labels"
        >
          <Eye size={12} />
          <span>Labels & Borders</span>
        </button>

        <button
          type="button"
          onClick={onToggleLighting}
          className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all ${
            enableLighting
              ? "bg-[#00c3f5]/20 border-[#00c3f5]/40 text-[#00c3f5]"
              : "bg-white/[0.03] border-white/8 text-foreground/50 hover:text-foreground"
          }`}
          title="Toggle Real-Time Sun & Day/Night Shadow"
        >
          {enableLighting ? <Sun size={12} className="text-amber-400" /> : <Moon size={12} />}
          <span>Day/Night</span>
        </button>

        <button
          type="button"
          onClick={onToggleAtmosphere}
          className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all ${
            enableAtmosphere
              ? "bg-[#00c3f5]/20 border-[#00c3f5]/40 text-[#00c3f5]"
              : "bg-white/[0.03] border-white/8 text-foreground/50 hover:text-foreground"
          }`}
          title="Toggle Atmospheric Horizon Glow"
        >
          <Cloud size={12} />
          <span>Atmosphere</span>
        </button>
      </div>

      <div className="ee-divider" />

      {/* ── Landmarks & Bookmarks ── */}
      <div>
        <div className="ee-section-label mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Navigation size={12} className="text-[#00c3f5]" />
            <span>Landmarks & Wonders</span>
          </div>
          <span className="text-[10px] text-foreground/40 font-mono">
            {filteredBookmarks.length} sites
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors whitespace-nowrap ${
                selectedCat === cat
                  ? "bg-[#00c3f5] text-black font-semibold"
                  : "bg-white/[0.04] text-foreground/60 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bookmarks List */}
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
          {filteredBookmarks.map((b) => (
            <button
              key={b.name}
              type="button"
              onClick={() => onFlyTo(b.lat, b.lon, b.alt, b.name)}
              className="ee-bookmark-btn hover:border-[#00c3f5]/40 hover:bg-[#00c3f5]/10 hover:text-white transition-all text-left"
              title={`Fly to ${b.name}`}
            >
              <span>{b.emoji}</span>
              <span className="truncate max-w-[130px]">{b.name}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
