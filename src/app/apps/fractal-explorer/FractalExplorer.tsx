"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bookmark,
  BoxSelect,
  Check,
  Columns2,
  Download,
  Hand,
  HelpCircle,
  Maximize2,
  Minimize2,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  PictureInPicture2,
  Pin,
  PinOff,
  Plus,
  Redo2,
  RotateCcw,
  Share2,
  Sparkles,
  Square,
  Undo2,
} from "lucide-react";
import { ExportModal } from "./ExportModal";
import { FractalCanvas, type CanvasHandle } from "./FractalCanvas";
import { InspectorSidebar, type SidebarTab } from "./InspectorSidebar";
import { JuliaMiniCanvas } from "./JuliaMiniCanvas";
import { PaletteEditor } from "./PaletteEditor";
import { ShortcutsModal } from "./ShortcutsModal";
import {
  clampZoom,
  complexSpanPerPixel,
  computeAutoIterations,
  formatComplex,
  formatZoom,
  interpolateCamera,
  panCamera,
  zoomAtPoint,
} from "./lib/camera";
import { FRACTAL_FORMULAS } from "./lib/formulas";
import { traceOrbit } from "./lib/orbitMath";
import {
  DEFAULT_SETTINGS,
  generateHarmoniousPalette,
  getPaletteById,
} from "./lib/palette";
import {
  decodeStateFromHash,
  encodeStateToHash,
  loadBookmarks,
  loadCustomPalettes,
  saveBookmarks,
  saveCustomPalettes,
} from "./lib/persistence";
import type { DeepZoomTour } from "./lib/presets";
import type {
  AnimationState,
  CameraState,
  FractalFamily,
  FractalSettings,
  OverlaySettings,
  Palette,
  PresetLocation,
  RenderStats,
  ToolMode,
  UserBookmark,
} from "./lib/types";
import "./fractal-explorer.css";

interface HistoryState {
  current: FractalSettings;
  past: FractalSettings[];
  future: FractalSettings[];
}

function ToolbarBtn({
  onClick,
  disabled,
  active,
  title,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all select-none shrink-0 ${disabled
        ? "opacity-30 cursor-not-allowed border-slate-500/20 text-slate-400"
        : active
          ? "border-cyan-400/55 bg-cyan-400/20 text-cyan-100 shadow-[0_0_12px_rgba(0,195,245,0.16)]"
          : "border-slate-400/20 bg-white/[0.04] text-slate-200 hover:border-slate-300/35 hover:bg-white/10"
        }`}
    >
      {children}
    </button>
  );
}

export function FractalExplorer() {
  const [history, setHistory] = useState<HistoryState>(() => {
    const initial =
      typeof window !== "undefined"
        ? decodeStateFromHash(window.location.hash) ?? DEFAULT_SETTINGS
        : DEFAULT_SETTINGS;
    return { current: initial, past: [], future: [] };
  });

  const settings = history.current;

  // Separate camera for right-hand Julia pane in 50/50 Split View
  const [splitJuliaCam, setSplitJuliaCam] = useState<CameraState>({
    centerX: 0,
    centerY: 0,
    zoom: 1.0,
    rotation: 0,
  });

  const [overlays, setOverlays] = useState<OverlaySettings>({
    grid: false,
    hud: true,
    orbitProbe: false,
    pipJulia: false,
    splitView: false,
    minimap: false,
  });

  const [animations, setAnimations] = useState<AnimationState>({
    cyclePalette: false,
    cycleSpeed: 0.65,
    autoZoom: false,
    zoomSpeed: 0.75,
    juliaMorph: false,
    morphPath: "cardioid",
    morphSpeed: 0.7,
    powerMorph: false,
  });

  const [tool, setTool] = useState<ToolMode>("pan");
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 960 : true,
  );
  const [activeTab, setActiveTab] = useState<SidebarTab>("fractal");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [paletteEditorOpen, setPaletteEditorOpen] = useState(false);
  const [paletteBeforeEdit, setPaletteBeforeEdit] = useState<Palette | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const [customPalettes, setCustomPalettes] = useState<Palette[]>(() => loadCustomPalettes());
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>(() => loadBookmarks());

  const [hoverComplex, setHoverComplex] = useState<{ re: number; im: number } | null>(null);
  const [pinnedOrbitPt, setPinnedOrbitPt] = useState<{ re: number; im: number } | null>(null);
  const [pipPinned, setPipPinned] = useState(false);

  const [statusMsg, setStatusMsg] = useState(
    "Scroll to zoom · Drag to pan · Shift+Click for Julia · ? for shortcuts",
  );
  const [toast, setToast] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const [renderStats, setRenderStats] = useState<RenderStats>({
    activeEngine: "gpu-f32",
    renderMs: 0,
    fps: 60,
    effectiveIter: settings.maxIter,
    width: 1280,
    height: 720,
    progress: 1,
    busy: false,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const mainCanvasRef = useRef<CanvasHandle>(null);
  const settingsRef = useRef(settings);
  const gestureAnchorRef = useRef<FractalSettings | null>(null);
  const flyCancelRef = useRef<(() => void) | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const morphPhaseRef = useRef(0);
  const recorderRef = useRef<{
    mr: MediaRecorder;
    chunks: Blob[];
    timer: ReturnType<typeof setInterval>;
  } | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // ── History helpers ────────────────────────────────────────────────────────
  const liveChange = useCallback((updater: (s: FractalSettings) => FractalSettings) => {
    setHistory(prev => ({
      ...prev,
      current: updater(prev.current),
    }));
  }, []);

  const commitChange = useCallback((updater: (s: FractalSettings) => FractalSettings) => {
    gestureAnchorRef.current = null;
    setHistory(prev => {
      const next = updater(prev.current);
      if (next === prev.current) return prev;
      return {
        current: next,
        past: [...prev.past.slice(-59), prev.current],
        future: [],
      };
    });
  }, []);

  const handleLiveCamera = useCallback((camera: CameraState) => {
    setHistory(prev => {
      if (!gestureAnchorRef.current) {
        gestureAnchorRef.current = prev.current;
      }
      return {
        ...prev,
        current: { ...prev.current, camera },
      };
    });
  }, []);

  const handleCommitCamera = useCallback((camera: CameraState) => {
    setHistory(prev => {
      const anchor = gestureAnchorRef.current ?? prev.current;
      gestureAnchorRef.current = null;
      return {
        current: { ...prev.current, camera },
        past: [...prev.past.slice(-59), anchor],
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    flyCancelRef.current?.();
    gestureAnchorRef.current = null;
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        current: previous,
        past: prev.past.slice(0, -1),
        future: [prev.current, ...prev.future.slice(0, 59)],
      };
    });
  }, []);

  const redo = useCallback(() => {
    flyCancelRef.current?.();
    gestureAnchorRef.current = null;
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        current: next,
        past: [...prev.past.slice(-59), prev.current],
        future: prev.future.slice(1),
      };
    });
  }, []);

  // ── Smooth Fly-To Camera Animator ──────────────────────────────────────────
  const cancelFly = useCallback(() => {
    flyCancelRef.current?.();
    flyCancelRef.current = null;
  }, []);

  const flyTo = useCallback(
    (targetCamera: CameraState, nextBase?: Partial<FractalSettings>, durationMs = 850) => {
      cancelFly();
      let cancelled = false;
      let rafId = 0;
      const startCam = settingsRef.current.camera;
      const t0 = performance.now();

      setHistory(prev => {
        const merged: FractalSettings = nextBase
          ? {
            ...prev.current,
            ...nextBase,
            camera: prev.current.camera,
          }
          : prev.current;
        return {
          current: merged,
          past: [...prev.past.slice(-59), prev.current],
          future: [],
        };
      });

      const step = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - t0) / durationMs);
        const cam = interpolateCamera(startCam, targetCamera, t);
        setHistory(h => ({ ...h, current: { ...h.current, camera: cam } }));
        if (t < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          flyCancelRef.current = null;
        }
      };

      rafId = requestAnimationFrame(step);
      flyCancelRef.current = () => {
        cancelled = true;
        if (rafId) cancelAnimationFrame(rafId);
      };
    },
    [cancelFly],
  );

  // ── Cancel All Motion / Fly on user gesture ────────────────────────────────
  const cancelAllAnimations = useCallback(() => {
    cancelFly();
    setAnimations(a =>
      a.autoZoom || a.juliaMorph || a.powerMorph
        ? { ...a, autoZoom: false, juliaMorph: false, powerMorph: false }
        : a,
    );
  }, [cancelFly]);

  // ── Unified Animation Loop (Palette Cycle, Auto-Zoom, Julia Morph, Power) ─
  const anyAnimActive =
    animations.cyclePalette ||
    animations.autoZoom ||
    animations.juliaMorph ||
    animations.powerMorph;

  useEffect(() => {
    if (!anyAnimActive) return;
    let rafId = 0;
    let lastTs = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      let reachedZoomLimit = false;
      setHistory(prev => {
        const s = prev.current;
        let next = s;

        if (animations.cyclePalette) {
          const offset = (((s.paletteOffset + dt * 0.14 * animations.cycleSpeed) % 1) + 1) % 1;
          next = { ...next, paletteOffset: offset };
        }

        if (animations.autoZoom) {
          const nextZoom = clampZoom(s.camera.zoom * Math.exp(dt * 0.72 * animations.zoomSpeed));
          if (nextZoom >= 1e14) reachedZoomLimit = true;
          next = {
            ...next,
            camera: { ...next.camera, zoom: nextZoom },
          };
        }

        if (animations.juliaMorph) {
          morphPhaseRef.current += dt * 0.75 * animations.morphSpeed;
          const th = morphPhaseRef.current;
          let cx = s.juliaCx;
          let cy = s.juliaCy;
          if (animations.morphPath === "cardioid") {
            cx = 0.515 * Math.cos(th) - 0.255 * Math.cos(2 * th);
            cy = 0.515 * Math.sin(th) - 0.255 * Math.sin(2 * th);
          } else if (animations.morphPath === "circle") {
            cx = -1.0 + 0.254 * Math.cos(th);
            cy = 0.254 * Math.sin(th);
          } else {
            cx = -0.55 + 0.45 * Math.sin(th);
            cy = 0.52 * Math.sin(2 * th);
          }
          next = { ...next, juliaCx: cx, juliaCy: cy };
        }

        if (animations.powerMorph && FRACTAL_FORMULAS[s.family].supportsPower) {
          morphPhaseRef.current += dt * 0.55;
          const d = 2.0 + 2.5 * (0.5 - 0.5 * Math.cos(morphPhaseRef.current));
          next = { ...next, power: Number(d.toFixed(3)) };
        }

        return next === s ? prev : { ...prev, current: next };
      });

      if (reachedZoomLimit) {
        setAnimations(a => ({ ...a, autoZoom: false }));
        showToast("Reached Float64 precision floor (10¹⁴×)");
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [anyAnimActive, animations, showToast]);

  // ── Formula, Preset, Bookmark & Coupling Actions ──────────────────────────
  const handleSelectFormula = useCallback(
    (family: FractalFamily) => {
      cancelAllAnimations();
      const meta = FRACTAL_FORMULAS[family];
      commitChange(s => ({
        ...s,
        family,
        isJulia: meta.supportsJulia ? s.isJulia : false,
        power: meta.defaultPower,
        paramP: meta.defaultParamP,
        juliaCx: meta.defaultJuliaC[0],
        juliaCy: meta.defaultJuliaC[1],
        camera: s.isJulia && meta.supportsJulia
          ? { centerX: 0, centerY: 0, zoom: 1.0, rotation: 0 }
          : meta.defaultCamera,
        bailout: meta.defaultBailout,
      }));
      setStatusMsg(`${meta.name} loaded`);
    },
    [cancelAllAnimations, commitChange],
  );

  const handleFlyToPreset = useCallback(
    (preset: PresetLocation) => {
      cancelAllAnimations();
      const { paletteId, camera, ...rest } = preset.settings;
      const nextPalette = paletteId ? getPaletteById(paletteId) : settings.palette;
      const samePlane =
        (rest.family ?? settings.family) === settings.family &&
        (rest.isJulia ?? settings.isJulia) === settings.isJulia;

      if (samePlane) {
        flyTo(camera, { ...rest, palette: nextPalette }, 900);
      } else {
        commitChange(s => ({
          ...s,
          ...rest,
          palette: nextPalette,
          camera,
        }));
      }
      setStatusMsg(`Atlas: ${preset.name}`);
    },
    [cancelAllAnimations, commitChange, flyTo, settings.family, settings.isJulia, settings.palette],
  );

  const handleStartDeepTour = useCallback(
    (tour: DeepZoomTour) => {
      cancelFly();
      const { camera, ...rest } = tour.target;
      const startZoom = Math.min(camera.zoom * 0.0005, 4);
      commitChange(s => ({
        ...s,
        ...rest,
        autoIter: true,
        camera: { ...camera, zoom: Math.max(1.15, startZoom) },
      }));
      setTimeout(() => {
        flyTo(camera, undefined, 2600);
      }, 60);
      showToast(`Diving into ${tour.name}…`);
    },
    [cancelFly, commitChange, flyTo, showToast],
  );

  const handleShiftClick = useCallback(
    (re: number, im: number) => {
      const meta = FRACTAL_FORMULAS[settings.family];
      if (!meta.supportsJulia) {
        showToast(`${meta.shortName} does not have a Julia c-parameter`);
        return;
      }
      if (overlays.splitView) {
        commitChange(s => ({ ...s, juliaCx: re, juliaCy: im }));
        showToast(`Julia c updated: ${formatComplex(re, im, 10)}`);
      } else {
        commitChange(s => ({
          ...s,
          isJulia: true,
          juliaCx: re,
          juliaCy: im,
          camera: { centerX: 0, centerY: 0, zoom: 1.0, rotation: 0 },
        }));
        setStatusMsg(`Julia set at c = ${formatComplex(re, im, 10)}`);
      }
    },
    [commitChange, overlays.splitView, settings.family, showToast],
  );

  const handleSaveBookmark = useCallback(() => {
    const thumb = mainCanvasRef.current?.captureThumbnail();
    const meta = FRACTAL_FORMULAS[settings.family];
    const bm: UserBookmark = {
      id: `bm-${Date.now()}`,
      name: `${meta.shortName}${settings.isJulia ? " Julia" : ""} @ ${formatZoom(settings.camera.zoom)}`,
      createdAt: Date.now(),
      thumbnail: thumb,
      settings,
    };
    const next = [bm, ...bookmarks].slice(0, 40);
    setBookmarks(next);
    saveBookmarks(next);
    showToast("View bookmarked to Atlas");
  }, [bookmarks, settings, showToast]);

  const handleDeleteBookmark = useCallback(
    (id: string) => {
      const next = bookmarks.filter(b => b.id !== id);
      setBookmarks(next);
      saveBookmarks(next);
    },
    [bookmarks],
  );

  const handleRandomPalette = useCallback(() => {
    const pal = generateHarmoniousPalette();
    commitChange(s => ({ ...s, palette: pal }));
    showToast(`Palette: ${pal.name}`);
  }, [commitChange, showToast]);

  const handleShareLink = useCallback(async () => {
    const hash = encodeStateToHash(settings);
    try {
      window.history.replaceState(null, "", hash);
      await navigator.clipboard.writeText(window.location.href);
      showToast("Shareable permalink copied to clipboard!");
    } catch {
      showToast("URL hash updated in address bar");
    }
  }, [settings, showToast]);

  const handleCopyCoords = useCallback(async () => {
    const text = `${settings.camera.centerX}, ${settings.camera.centerY} (${formatZoom(settings.camera.zoom)})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 1600);
    } catch {
      // ignore clipboard denial
    }
  }, [settings.camera.centerX, settings.camera.centerY, settings.camera.zoom]);

  const handleToggleRecord = useCallback(() => {
    if (isRecording && recorderRef.current) {
      recorderRef.current.mr.stop();
      return;
    }

    const canvas = mainCanvasRef.current?.getActiveCanvas();
    if (!canvas || typeof canvas.captureStream !== "function" || typeof MediaRecorder === "undefined") {
      showToast("Canvas video recording is unavailable in this browser.");
      return;
    }

    try {
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const mr = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];

      mr.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mr.onstop = () => {
        if (recorderRef.current) clearInterval(recorderRef.current.timer);
        recorderRef.current = null;
        setIsRecording(false);
        setRecordSeconds(0);
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${settings.family}-capture.webm`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showToast("WebM video downloaded!");
      };

      mr.start(250);
      setIsRecording(true);
      setRecordSeconds(0);
      const timer = setInterval(() => setRecordSeconds(s => s + 1), 1000);
      recorderRef.current = { mr, chunks, timer };
      showToast("Recording WebM canvas stream…");
    } catch {
      showToast("Could not start video recorder.");
    }
  }, [isRecording, settings.family, showToast]);

  // Cleanup recorder on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        clearInterval(recorderRef.current.timer);
        if (recorderRef.current.mr.state !== "inactive") recorderRef.current.mr.stop();
      }
    };
  }, []);

  // ── Orbit Probe Computation ────────────────────────────────────────────────
  const activeOrbitTarget = pinnedOrbitPt ?? hoverComplex;
  const orbitAnalysis = useMemo(() => {
    if (!overlays.orbitProbe || !activeOrbitTarget) return null;
    return traceOrbit(activeOrbitTarget.re, activeOrbitTarget.im, settings, 220);
  }, [overlays.orbitProbe, activeOrbitTarget, settings]);

  // ── Global Keyboard Shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === "Escape") {
        if (shortcutsOpen) setShortcutsOpen(false);
        else if (exportOpen) setExportOpen(false);
        else if (paletteEditorOpen) {
          if (paletteBeforeEdit) liveChange(s => ({ ...s, palette: paletteBeforeEdit }));
          setPaletteEditorOpen(false);
        } else if (isFullscreen) setIsFullscreen(false);
        return;
      }

      if (paletteEditorOpen || exportOpen || shortcutsOpen) return;

      const k = e.key.toLowerCase();
      if (k === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShortcutsOpen(s => !s);
      } else if (k === "f") {
        setIsFullscreen(f => !f);
      } else if (k === "g") {
        setOverlays(o => ({ ...o, grid: !o.grid }));
      } else if (k === "h") {
        setOverlays(o => ({ ...o, hud: !o.hud }));
      } else if (k === "o") {
        setOverlays(o => ({ ...o, orbitProbe: !o.orbitProbe }));
      } else if (k === "p") {
        setOverlays(o => ({ ...o, pipJulia: !o.pipJulia }));
      } else if (k === "v") {
        setOverlays(o => ({ ...o, splitView: !o.splitView }));
      } else if (k === "m") {
        setOverlays(o => ({ ...o, minimap: !o.minimap }));
      } else if (k === "b") {
        setTool(t => (t === "box-zoom" ? "pan" : "box-zoom"));
      } else if (k === "l") {
        commitChange(s => ({ ...s, lighting: { ...s.lighting, enabled: !s.lighting.enabled } }));
      } else if (k === "c") {
        handleRandomPalette();
      } else if (k === "s") {
        e.preventDefault();
        setExportOpen(true);
      } else if (k === "j") {
        const meta = FRACTAL_FORMULAS[settings.family];
        if (meta.supportsJulia) {
          commitChange(s => ({
            ...s,
            isJulia: !s.isJulia,
            camera: !s.isJulia
              ? { centerX: 0, centerY: 0, zoom: 1.0, rotation: 0 }
              : meta.defaultCamera,
          }));
        }
      } else if (k === "r" || k === "0") {
        const meta = FRACTAL_FORMULAS[settings.family];
        flyTo(
          settings.isJulia
            ? { centerX: 0, centerY: 0, zoom: 1.0, rotation: 0 }
            : meta.defaultCamera,
        );
      } else if (k === " ") {
        e.preventDefault();
        setAnimations(a => {
          const anyOn = a.cyclePalette || a.autoZoom || a.juliaMorph || a.powerMorph;
          return anyOn
            ? { ...a, cyclePalette: false, autoZoom: false, juliaMorph: false, powerMorph: false }
            : { ...a, cyclePalette: true };
        });
      } else if (e.key === "+" || e.key === "=") {
        const nextCam = zoomAtPoint(
          settings.camera,
          renderStats.width * 0.5,
          renderStats.height * 0.5,
          renderStats.width,
          renderStats.height,
          1.6,
        );
        flyTo(nextCam, undefined, 260);
      } else if (e.key === "-") {
        const nextCam = zoomAtPoint(
          settings.camera,
          renderStats.width * 0.5,
          renderStats.height * 0.5,
          renderStats.width,
          renderStats.height,
          0.625,
        );
        flyTo(nextCam, undefined, 260);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = 75;
        const dx = e.key === "ArrowLeft" ? step : e.key === "ArrowRight" ? -step : 0;
        const dy = e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0;
        commitChange(s => ({
          ...s,
          camera: panCamera(s.camera, dx, dy, Math.max(400, renderStats.height)),
        }));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    commitChange,
    exportOpen,
    flyTo,
    handleRandomPalette,
    isFullscreen,
    liveChange,
    paletteBeforeEdit,
    paletteEditorOpen,
    redo,
    renderStats.height,
    renderStats.width,
    settings.camera,
    settings.family,
    settings.isJulia,
    shortcutsOpen,
    undo,
  ]);

  // ── Scale Bar Calculation ──────────────────────────────────────────────────
  const scaleBar = useMemo(() => {
    const dprMult =
      typeof window !== "undefined"
        ? Math.min(Math.min(window.devicePixelRatio || 1, 2), settings.dprScale)
        : 1;
    const cssH = Math.max(200, renderStats.height / Math.max(0.5, dprMult));
    const pxPerUnit = 1 / complexSpanPerPixel(cssH, settings.camera.zoom);
    const targetPx = 68;
    const rawUnits = targetPx / Math.max(1e-20, pxPerUnit);
    const pow10 = Math.pow(10, Math.floor(Math.log10(rawUnits)));
    const norm = rawUnits / pow10;
    const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
    const units = nice * pow10;
    const widthPx = Math.max(24, Math.min(110, Math.round(units * pxPerUnit)));
    const label =
      units >= 0.01 && units < 100
        ? `${parseFloat(units.toPrecision(2))}`
        : units.toExponential(0);
    return { widthPx, label };
  }, [renderStats.height, settings.camera.zoom, settings.dprScale]);

  const effectiveIter = computeAutoIterations(
    settings.maxIter,
    settings.camera.zoom,
    settings.autoIter,
  );
  const formulaMeta = FRACTAL_FORMULAS[settings.family];

  // Sparkline SVG points for Orbit Probe
  const sparklinePath = useMemo(() => {
    if (!orbitAnalysis || orbitAnalysis.points.length < 2) return "";
    const mags = orbitAnalysis.points.slice(0, 64).map(p => Math.min(4, Math.hypot(p.x, p.y)));
    const maxM = Math.max(0.5, ...mags);
    return mags
      .map((m, idx) => {
        const x = (idx / Math.max(1, mags.length - 1)) * 188;
        const y = 34 - (m / maxM) * 30;
        return `${idx === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [orbitAnalysis]);

  return (
    <div className={`fe-root ${isFullscreen ? "fe-fullscreen-active" : ""}`}>
      {/* ── Studio Top Toolbar ─────────────────────────────────────────────── */}
      <header className="fe-toolbar flex-shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 overflow-x-auto fe-scroll">
        <ToolbarBtn
          onClick={() => setSidebarOpen(o => !o)}
          title={sidebarOpen ? "Collapse inspector" : "Expand inspector"}
        >
          {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
        </ToolbarBtn>

        <div className="flex items-center gap-1.5 px-1.5 shrink-0">
          <Sparkles size={14} className="text-cyan-300" />
          <span className="font-serif font-bold text-sm bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent hidden sm:inline">
            Fractal Observatory
          </span>
        </div>

        <div className="h-4 w-px bg-slate-400/20 mx-0.5 shrink-0" />

        {/* Tool Mode */}
        <ToolbarBtn
          active={tool === "pan"}
          onClick={() => setTool("pan")}
          title="Pan & Zoom Tool"
        >
          <Hand size={13} />
          <span className="hidden md:inline">Pan</span>
        </ToolbarBtn>
        <ToolbarBtn
          active={tool === "box-zoom"}
          onClick={() => setTool(t => (t === "box-zoom" ? "pan" : "box-zoom"))}
          title="Box Zoom Tool (B or Ctrl+Drag)"
        >
          <BoxSelect size={13} />
          <span className="hidden md:inline">Box</span>
        </ToolbarBtn>
        <ToolbarBtn
          active={overlays.orbitProbe || tool === "orbit"}
          onClick={() => {
            const next = !overlays.orbitProbe;
            setOverlays(o => ({ ...o, orbitProbe: next }));
            setTool(next ? "orbit" : "pan");
          }}
          title="Orbit Probe & Lyapunov Trace (O)"
        >
          <Activity size={13} />
          <span className="hidden md:inline">Orbit</span>
        </ToolbarBtn>

        <div className="h-4 w-px bg-slate-400/20 mx-0.5 shrink-0" />

        {/* Quick Zoom & Coupling */}
        <ToolbarBtn
          onClick={() =>
            flyTo(
              zoomAtPoint(
                settings.camera,
                Math.max(200, renderStats.width) * 0.5,
                Math.max(200, renderStats.height) * 0.5,
                Math.max(200, renderStats.width),
                Math.max(200, renderStats.height),
                2,
              ),
              undefined,
              280,
            )
          }
          title="Zoom In (+)"
        >
          <Plus size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            flyTo(
              zoomAtPoint(
                settings.camera,
                Math.max(200, renderStats.width) * 0.5,
                Math.max(200, renderStats.height) * 0.5,
                Math.max(200, renderStats.width),
                Math.max(200, renderStats.height),
                0.5,
              ),
              undefined,
              280,
            )
          }
          title="Zoom Out (−)"
        >
          <Minus size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() =>
            flyTo(
              settings.isJulia
                ? { centerX: 0, centerY: 0, zoom: 1.0, rotation: 0 }
                : formulaMeta.defaultCamera,
            )
          }
          title="Reset View (R)"
        >
          <RotateCcw size={13} />
        </ToolbarBtn>

        {formulaMeta.supportsJulia && (
          <>
            <ToolbarBtn
              active={overlays.pipJulia && !overlays.splitView}
              onClick={() =>
                setOverlays(o => ({ ...o, pipJulia: !o.pipJulia, splitView: false }))
              }
              title="Live Picture-in-Picture Julia Preview (P)"
            >
              <PictureInPicture2 size={13} />
              <span className="hidden lg:inline">PiP Julia</span>
            </ToolbarBtn>
            <ToolbarBtn
              active={overlays.splitView}
              onClick={() => setOverlays(o => ({ ...o, splitView: !o.splitView }))}
              title="50/50 Split Parameter & Coupled Julia (V)"
            >
              <Columns2 size={13} />
              <span className="hidden lg:inline">Split</span>
            </ToolbarBtn>
          </>
        )}

        <div className="flex-1 min-w-2" />

        {/* History, Share, Export, Fullscreen */}
        <ToolbarBtn onClick={undo} disabled={!history.past.length} title="Undo (Ctrl+Z)">
          <Undo2 size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={redo} disabled={!history.future.length} title="Redo (Ctrl+Y)">
          <Redo2 size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleSaveBookmark} title="Bookmark View">
          <Bookmark size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleShareLink} title="Copy Permalink">
          <Share2 size={13} />
          <span className="hidden md:inline">Share</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setExportOpen(true)} title="4K Studio Export & JSON (S)">
          <Download size={13} />
          <span className="hidden sm:inline">Export</span>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => setShortcutsOpen(true)} title="Shortcuts (?)">
          <HelpCircle size={13} />
        </ToolbarBtn>
        <ToolbarBtn
          active={isFullscreen}
          onClick={() => setIsFullscreen(f => !f)}
          title="Toggle Studio Fullscreen (F)"
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </ToolbarBtn>
      </header>

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <div className="relative flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar Inspector */}
        <aside
          className={`fe-sidebar fe-sidebar-mobile flex-shrink-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? "w-[288px]" : "w-0 border-r-0"
            }`}
        >
          <div className="w-[288px] h-full">
            <InspectorSidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              settings={settings}
              overlays={overlays}
              animations={animations}
              activeEngine={renderStats.activeEngine}
              customPalettes={customPalettes}
              bookmarks={bookmarks}
              isRecording={isRecording}
              recordSeconds={recordSeconds}
              onLiveChange={liveChange}
              onCommitChange={commitChange}
              onSelectFormula={handleSelectFormula}
              onFlyToPreset={handleFlyToPreset}
              onStartDeepTour={handleStartDeepTour}
              onSaveBookmark={handleSaveBookmark}
              onLoadBookmark={bm => {
                commitChange(() => bm.settings);
                setStatusMsg(`Loaded bookmark: ${bm.name}`);
              }}
              onDeleteBookmark={handleDeleteBookmark}
              onOverlaysChange={setOverlays}
              onAnimationsChange={setAnimations}
              onRandomPalette={handleRandomPalette}
              onOpenPaletteEditor={() => {
                setPaletteBeforeEdit(settings.palette);
                setPaletteEditorOpen(true);
              }}
              onToggleRecord={handleToggleRecord}
            />
          </div>
        </aside>

        {/* Canvas Viewport Stage */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <div className="flex-1 min-h-0 flex relative">
            {/* Primary Canvas (or Left Parameter Plane in Split View) */}
            <div className="flex-1 min-w-0 h-full relative">
              <FractalCanvas
                ref={mainCanvasRef}
                settings={
                  overlays.splitView && formulaMeta.supportsJulia
                    ? { ...settings, isJulia: false }
                    : settings
                }
                overlays={overlays}
                tool={tool}
                orbitAnalysis={orbitAnalysis}
                label={
                  overlays.splitView && formulaMeta.supportsJulia
                    ? `${formulaMeta.shortName} · Parameter Plane (Shift+Click)`
                    : undefined
                }
                onLiveCamera={handleLiveCamera}
                onCommitCamera={handleCommitCamera}
                onSmoothZoomTo={cam => flyTo(cam, undefined, 420)}
                onShiftClick={handleShiftClick}
                onHoverComplex={pt => {
                  setHoverComplex(pt);
                  if (
                    pt &&
                    overlays.pipJulia &&
                    !pipPinned &&
                    !overlays.splitView &&
                    !settings.isJulia &&
                    formulaMeta.supportsJulia
                  ) {
                    liveChange(s => ({ ...s, juliaCx: pt.re, juliaCy: pt.im }));
                  }
                }}
                onTogglePinOrbit={(re, im) =>
                  setPinnedOrbitPt(prev => (prev ? null : { re, im }))
                }
                onCancelAnimations={cancelAllAnimations}
                onStatsChange={setRenderStats}
                onStatus={setStatusMsg}
              />
            </div>

            {/* Right Coupled Julia Canvas in 50/50 Split View */}
            {overlays.splitView && formulaMeta.supportsJulia && (
              <div className="flex-1 min-w-0 h-full relative border-l border-cyan-400/30">
                <FractalCanvas
                  settings={{
                    ...settings,
                    isJulia: true,
                    camera: splitJuliaCam,
                  }}
                  overlays={{ ...overlays, pipJulia: false, minimap: false }}
                  tool={tool === "box-zoom" ? "box-zoom" : "pan"}
                  orbitAnalysis={null}
                  label={`Coupled Julia · c = ${formatComplex(settings.juliaCx, settings.juliaCy, 10)}`}
                  onLiveCamera={setSplitJuliaCam}
                  onCommitCamera={setSplitJuliaCam}
                  onSmoothZoomTo={setSplitJuliaCam}
                  onShiftClick={(re, im) =>
                    setSplitJuliaCam({ centerX: re, centerY: im, zoom: 2, rotation: 0 })
                  }
                  onHoverComplex={() => { }}
                  onTogglePinOrbit={() => { }}
                  onCancelAnimations={cancelAllAnimations}
                />
              </div>
            )}

            {/* Floating Live Julia PiP */}
            {overlays.pipJulia &&
              !overlays.splitView &&
              !settings.isJulia &&
              formulaMeta.supportsJulia && (
                <div className="absolute bottom-3 right-3 z-20">
                  <JuliaMiniCanvas
                    mode="julia-pip"
                    settings={settings}
                    previewCx={settings.juliaCx}
                    previewCy={settings.juliaCy}
                    pinned={pipPinned}
                    onTogglePin={() => setPipPinned(p => !p)}
                    onPromote={() =>
                      commitChange(s => ({
                        ...s,
                        isJulia: true,
                        camera: { centerX: 0, centerY: 0, zoom: 1.0, rotation: 0 },
                      }))
                    }
                    onClose={() => setOverlays(o => ({ ...o, pipJulia: false }))}
                  />
                </div>
              )}

            {/* Floating Minimap */}
            {overlays.minimap && (
              <div className="absolute bottom-3 left-3 z-20 hidden sm:block">
                <JuliaMiniCanvas
                  mode="minimap"
                  settings={settings}
                  mainSize={{ w: renderStats.width, h: renderStats.height }}
                  onJumpTo={(re, im) =>
                    flyTo({ ...settings.camera, centerX: re, centerY: im }, undefined, 450)
                  }
                  onClose={() => setOverlays(o => ({ ...o, minimap: false }))}
                />
              </div>
            )}

            {/* Floating Orbit Probe Telemetry Card */}
            {overlays.orbitProbe && orbitAnalysis && (
              <div className="fe-glass absolute top-3 right-3 z-20 w-56 rounded-xl p-3 space-y-2 text-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                    Orbit Telemetry
                  </span>
                  <button
                    onClick={() =>
                      setPinnedOrbitPt(prev =>
                        prev
                          ? null
                          : { re: orbitAnalysis.startRe, im: orbitAnalysis.startIm },
                      )
                    }
                    className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${pinnedOrbitPt
                      ? "border-amber-400/50 bg-amber-400/15 text-amber-200"
                      : "border-slate-400/20 text-slate-300"
                      }`}
                  >
                    {pinnedOrbitPt ? <Pin size={10} /> : <PinOff size={10} />}
                    {pinnedOrbitPt ? "Pinned" : "Live"}
                  </button>
                </div>

                <div className="space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">z₀</span>
                    <span className="text-slate-100">
                      {formatComplex(orbitAnalysis.startRe, orbitAnalysis.startIm, settings.camera.zoom)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Outcome</span>
                    <span
                      className={
                        orbitAnalysis.escaped
                          ? "text-cyan-300"
                          : orbitAnalysis.converged
                            ? "text-emerald-300"
                            : "text-fuchsia-300"
                      }
                    >
                      {orbitAnalysis.escaped
                        ? `Escaped (${orbitAnalysis.escapeIter})`
                        : orbitAnalysis.converged
                          ? `Root #${orbitAnalysis.convergedRoot + 1}`
                          : "Bounded"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Period</span>
                    <span className="text-amber-300">
                      {orbitAnalysis.detectedPeriod ? `p = ${orbitAnalysis.detectedPeriod}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lyapunov λ</span>
                    <span
                      className={orbitAnalysis.lyapunov > 0 ? "text-rose-300" : "text-emerald-300"}
                    >
                      {orbitAnalysis.lyapunov.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* |z_n| Sparkline */}
                {sparklinePath && (
                  <div className="pt-1 border-t border-slate-400/15">
                    <div className="text-[9px] font-mono text-slate-400 mb-0.5">
                      |zₙ| trajectory (first 64 steps)
                    </div>
                    <svg viewBox="0 0 188 36" className="w-full h-9 overflow-visible">
                      <path
                        d={sparklinePath}
                        fill="none"
                        stroke="#00c3f5"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                )}
              </div>
            )}

            {/* Toast Notification */}
            {toast && (
              <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full fe-glass border border-cyan-400/40 text-xs font-mono text-cyan-200 shadow-xl">
                {toast}
              </div>
            )}
          </div>

          {/* ── Fixed-Height Status & HUD Telemetry Bar ─────────────────────── */}
          <footer
            className="flex-shrink-0 flex items-center justify-between gap-2 px-3 border-t border-slate-400/15 bg-[#060612]/95 text-[10px] font-mono text-slate-300"
            style={{ height: "2.25rem" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {overlays.hud ? (
                <>
                  {/* Scale Bar */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0">
                    <div
                      className="h-1.5 border-x border-b border-cyan-400/70"
                      style={{ width: `${scaleBar.widthPx}px` }}
                    />
                    <span className="text-slate-400">{scaleBar.label}</span>
                  </div>

                  {/* Magnification */}
                  <span className="px-1.5 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/25 text-cyan-200 shrink-0">
                    {formatZoom(settings.camera.zoom)}
                  </span>

                  {/* Center (Click to copy) */}
                  <button
                    onClick={handleCopyCoords}
                    className="hidden sm:flex items-center gap-1 hover:text-cyan-200 truncate transition-colors"
                    title="Click to copy center coordinates"
                  >
                    {copiedCoords ? (
                      <Check size={10} className="text-emerald-400 shrink-0" />
                    ) : null}
                    <span className="truncate">
                      Center: {formatComplex(settings.camera.centerX, settings.camera.centerY, settings.camera.zoom)}
                    </span>
                  </button>

                  {/* Hover z */}
                  {hoverComplex && (
                    <span className="hidden xl:inline text-slate-400 truncate">
                      Cursor: {formatComplex(hoverComplex.re, hoverComplex.im, settings.camera.zoom)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-400 truncate">{statusMsg}</span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Effective Iterations */}
              <span className="hidden sm:inline text-slate-400">{effectiveIter} iter</span>

              {/* Active Engine & Timing Badge */}
              <span
                className={`px-2 py-0.5 rounded border uppercase text-[9px] ${renderStats.activeEngine === "gpu-ds64"
                  ? "border-violet-400/45 bg-violet-500/15 text-violet-200"
                  : renderStats.activeEngine === "cpu-f64"
                    ? "border-amber-400/45 bg-amber-500/15 text-amber-200"
                    : "border-cyan-400/35 bg-cyan-400/10 text-cyan-200"
                  }`}
              >
                {renderStats.activeEngine}
                {renderStats.renderMs > 0 ? ` · ${renderStats.renderMs.toFixed(1)}ms` : ""}
              </span>

              {/* CPU Progress & Cancel */}
              <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-100"
                  style={{ width: renderStats.busy ? `${Math.round(renderStats.progress * 100)}%` : "0%" }}
                />
              </div>
              <button
                onClick={() => mainCanvasRef.current?.cancelRender()}
                disabled={!renderStats.busy}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] transition-all ${renderStats.busy
                  ? "border-red-400/45 bg-red-500/20 text-red-200 hover:bg-red-500/30"
                  : "opacity-0 pointer-events-none border-transparent text-transparent"
                  }`}
              >
                <Square size={8} /> Stop
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {paletteEditorOpen && (
        <PaletteEditor
          palette={settings.palette}
          onPreview={p => liveChange(s => ({ ...s, palette: p }))}
          onSave={p => {
            commitChange(s => ({ ...s, palette: p }));
            setPaletteBeforeEdit(null);
            setPaletteEditorOpen(false);
          }}
          onSaveCustomPreset={p => {
            const next = [p, ...customPalettes].slice(0, 30);
            setCustomPalettes(next);
            saveCustomPalettes(next);
            showToast(`Saved "${p.name}" to My Palettes`);
          }}
          onCancel={() => {
            if (paletteBeforeEdit) liveChange(s => ({ ...s, palette: paletteBeforeEdit }));
            setPaletteBeforeEdit(null);
            setPaletteEditorOpen(false);
          }}
        />
      )}

      {exportOpen && (
        <ExportModal
          settings={settings}
          viewportSize={{ w: renderStats.width, h: renderStats.height }}
          getActiveCanvas={() => mainCanvasRef.current?.getActiveCanvas() ?? null}
          onImportSettings={s => {
            commitChange(() => s);
            showToast("Imported JSON preset!");
          }}
          onClose={() => setExportOpen(false)}
        />
      )}

      {shortcutsOpen && <ShortcutsModal onClose={() => setShortcutsOpen(false)} />}
    </div>
  );
}
