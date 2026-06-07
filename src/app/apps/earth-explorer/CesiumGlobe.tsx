"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface CameraInfo {
  lat: number;
  lon: number;
  alt: number;
  heading: number;
}

export type MapStyle = "osm" | "dark" | "satellite";

interface CesiumGlobeProps {
  onCameraChange: (info: CameraInfo) => void;
  onReady: () => void;
  onCoordinateCopied: (lat: number, lon: number) => void;
  flyToTarget: { lat: number; lon: number; alt?: number } | null;
  enableLighting: boolean;
  enableAtmosphere: boolean;
  mapStyle: MapStyle;
}

/* Cesium CDN */
const CESIUM_VERSION = "1.122";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

/* ─── Load Cesium via CDN ───────────────────────────────────────────────── */
function loadCesium(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if ((window as any).Cesium) {
      resolve();
      return;
    }

    // CSS
    if (!document.querySelector('link[href*="cesium"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${CESIUM_BASE}/Widgets/widgets.css`;
      document.head.appendChild(link);
    }

    // JS
    const existing = document.querySelector('script[src*="cesium"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }

    const script = document.createElement("script");
    script.src = `${CESIUM_BASE}/Cesium.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load CesiumJS"));
    document.head.appendChild(script);
  });
}

/* ─── Imagery Providers ─────────────────────────────────────────────────── */
function createImageryProvider(Cesium: any, style: MapStyle) {
  switch (style) {
    case "osm":
      return new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
      });
    case "dark":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png",
        credit: "Stadia Maps, OpenStreetMap",
        maximumLevel: 18,
      });
    case "satellite":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri, USGS, NOAA",
        maximumLevel: 18,
      });
    default:
      return new Cesium.OpenStreetMapImageryProvider({
        url: "https://tile.openstreetmap.org/",
      });
  }
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function CesiumGlobe({
  onCameraChange,
  onReady,
  onCoordinateCopied,
  flyToTarget,
  enableLighting,
  enableAtmosphere,
  mapStyle,
}: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const labelEntityRef = useRef<any>(null);
  const cameraTimerRef = useRef<ReturnType<typeof setInterval>>();
  const [loadError, setLoadError] = useState<string | null>(null);

  /* ── Initialize Cesium ─────────────────────────────────────────────── */
  useEffect(() => {
    let destroyed = false;

    async function init() {
      try {
        await loadCesium();
        if (destroyed || !containerRef.current) return;

        const Cesium = (window as any).Cesium;

        // Set base URL for Cesium assets
        (window as any).CESIUM_BASE_URL = `${CESIUM_BASE}/`;

        const viewer = new Cesium.Viewer(containerRef.current, {
          imageryProvider: createImageryProvider(Cesium, mapStyle),
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          animation: false,
          fullscreenButton: false,
          vrButton: false,
          navigationHelpButton: false,
          infoBox: false,
          creditContainer: document.createElement("div"), // hide credits container
          terrainProvider: new Cesium.EllipsoidTerrainProvider(),
          skyBox: new Cesium.SkyBox({
            sources: {
              positiveX: `${CESIUM_BASE}/Assets/Textures/SkyBox/tycho2t3_80_px.jpg`,
              negativeX: `${CESIUM_BASE}/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg`,
              positiveY: `${CESIUM_BASE}/Assets/Textures/SkyBox/tycho2t3_80_py.jpg`,
              negativeY: `${CESIUM_BASE}/Assets/Textures/SkyBox/tycho2t3_80_my.jpg`,
              positiveZ: `${CESIUM_BASE}/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg`,
              negativeZ: `${CESIUM_BASE}/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg`,
            },
          }),
          skyAtmosphere: enableAtmosphere ? new Cesium.SkyAtmosphere() : undefined,
          requestRenderMode: false,
          maximumRenderTimeChange: Infinity,
        });

        // Enable atmosphere glow
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = enableAtmosphere;
        }

        // Enable lighting
        viewer.scene.globe.enableLighting = enableLighting;

        // Set initial camera — looking at full Earth
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(35.2, 31.9, 15000000),
        });

        // Handle click — copy coordinates
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((click: any) => {
          const cartesian = viewer.camera.pickEllipsoid(
            click.position,
            viewer.scene.globe.ellipsoid
          );
          if (cartesian) {
            const carto = Cesium.Cartographic.fromCartesian(cartesian);
            const lat = Cesium.Math.toDegrees(carto.latitude);
            const lon = Cesium.Math.toDegrees(carto.longitude);
            onCoordinateCopied(lat, lon);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // ── Override "Israel" label with correct name ──────────────────
        labelEntityRef.current = viewer.entities.add({
          show: mapStyle !== "satellite",
          position: Cesium.Cartesian3.fromDegrees(34.85, 30.8),
          label: {
            text: "THE ZIONIST COLONY\n(OCCUPIED PALESTINE)",
            font: "bold 13px Inter, sans-serif",
            fillColor: Cesium.Color.fromCssColorString("#dc143c"),
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(0, 0),
            scaleByDistance: new Cesium.NearFarScalar(5e4, 1.4, 3e6, 0.8),
            showBackground: true,
            backgroundColor: Cesium.Color.fromCssColorString("rgba(30,30,30,0.95)"),
            backgroundPadding: new Cesium.Cartesian2(12, 8),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(5e4, 3.5e6),
          },
        });

        viewerRef.current = viewer;

        // Camera tracking interval
        cameraTimerRef.current = setInterval(() => {
          if (!viewer || viewer.isDestroyed()) return;
          const cam = viewer.camera;
          const carto = cam.positionCartographic;
          if (carto) {
            onCameraChange({
              lat: Cesium.Math.toDegrees(carto.latitude),
              lon: Cesium.Math.toDegrees(carto.longitude),
              alt: carto.height,
              heading: Cesium.Math.toDegrees(cam.heading),
            });
          }
        }, 300);

        onReady();
      } catch (e: any) {
        if (!destroyed) {
          setLoadError(e.message || "Failed to initialize globe");
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      if (cameraTimerRef.current) clearInterval(cameraTimerRef.current);
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Fly-to target ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!flyToTarget || !viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    const alt = flyToTarget.alt ?? 150000;
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        flyToTarget.lon,
        flyToTarget.lat,
        alt
      ),
      duration: 2.5,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }, [flyToTarget]);

  /* ── Lighting toggle ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!viewerRef.current) return;
    viewerRef.current.scene.globe.enableLighting = enableLighting;
    viewerRef.current.scene.requestRender();
  }, [enableLighting]);

  /* ── Atmosphere toggle ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!viewerRef.current) return;
    if (viewerRef.current.scene.skyAtmosphere) {
      viewerRef.current.scene.skyAtmosphere.show = enableAtmosphere;
      viewerRef.current.scene.requestRender();
    }
  }, [enableAtmosphere]);

  /* ── Map style change ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    const layers = viewerRef.current.imageryLayers;
    layers.removeAll();
    layers.addImageryProvider(createImageryProvider(Cesium, mapStyle));

    // Hide label on satellite (no text to cover)
    if (labelEntityRef.current) {
      labelEntityRef.current.show = mapStyle !== "satellite";
    }
  }, [mapStyle]);

  /* ── Error state ───────────────────────────────────────────────────── */
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-cosmos-950 text-foreground/50">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Failed to load globe</p>
          <p className="text-sm text-foreground/30">{loadError}</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="cesium-container" />;
}
