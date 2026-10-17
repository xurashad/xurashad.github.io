"use client";

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";

/* Types */
export interface CameraInfo {
  lat: number;
  lon: number;
  alt: number;
  heading: number;
  pitch: number;
}

export type MapStyle =
  | "satellite"
  | "street"
  | "topo"
  | "dark"
  | "light"
  | "night"
  | "natgeo"
  | "ocean";

export interface CesiumGlobeHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  resetNorth: () => void;
  toggleTilt: () => void;
}

interface CesiumGlobeProps {
  onCameraChange: (info: CameraInfo) => void;
  onReady: () => void;
  onCoordinateCopied: (lat: number, lon: number) => void;
  flyToTarget: { lat: number; lon: number; alt?: number; name?: string } | null;
  enableLighting: boolean;
  enableAtmosphere: boolean;
  enableAutoRotate: boolean;
  showLabels: boolean;
  mapStyle: MapStyle;
}

/* Cesium CDN */
const CESIUM_VERSION = "1.122";
const CESIUM_BASE = `https://cesium.com/downloads/cesiumjs/releases/${CESIUM_VERSION}/Build/Cesium`;

/* Load Cesium via CDN */
function loadCesium(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Cesium) {
      resolve();
      return;
    }

    // Load Cesium CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${CESIUM_BASE}/Widgets/widgets.css`;
    document.head.appendChild(link);

    // Load Cesium JS
    const script = document.createElement("script");
    script.src = `${CESIUM_BASE}/Cesium.js`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load CesiumJS from CDN"));
    document.head.appendChild(script);
  });
}

/* Create Base Imagery Provider using 100% Free Public Map Tile Servers (No API keys, No watermarks) */
function createImageryProvider(Cesium: any, style: MapStyle) {
  switch (style) {
    case "satellite":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri, Maxar, Earthstar Geographics, USDA, USGS",
        maximumLevel: 19,
      });
    case "street":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, METI",
        maximumLevel: 19,
      });
    case "topo":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS",
        maximumLevel: 19,
      });
    case "dark":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri, HERE, Garmin, © OpenStreetMap contributors",
        maximumLevel: 16,
      });
    case "light":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri, HERE, Garmin, © OpenStreetMap contributors",
        maximumLevel: 16,
      });
    case "night":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
        credit: "NASA Earth Science Data Systems / VIIRS Black Marble",
        maximumLevel: 8,
      });
    case "natgeo":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}",
        credit: "National Geographic, Esri, DeLorme, HERE, UNEP-WCMC, USGS, NASA, ESA",
        maximumLevel: 16,
      });
    case "ocean":
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri, GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org",
        maximumLevel: 13,
      });
    default:
      return new Cesium.UrlTemplateImageryProvider({
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        credit: "Esri, Maxar, Earthstar Geographics",
        maximumLevel: 19,
      });
  }
}

/* Create Borders & City Labels Transparent Overlay (100% Free, Zero API Key) */
function createLabelsOverlayProvider(Cesium: any) {
  return new Cesium.UrlTemplateImageryProvider({
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    credit: "Esri, HERE, Garmin, © OpenStreetMap contributors",
    maximumLevel: 19,
  });
}

/* Component */
const CesiumGlobe = forwardRef<CesiumGlobeHandle, CesiumGlobeProps>(function CesiumGlobe(
  {
    onCameraChange,
    onReady,
    onCoordinateCopied,
    flyToTarget,
    enableLighting,
    enableAtmosphere,
    enableAutoRotate,
    showLabels,
    mapStyle,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const labelEntityRef = useRef<any>(null);
  const markerEntityRef = useRef<any>(null);
  const cameraTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* Expose camera actions via ref */
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (!viewerRef.current) return;
      const cam = viewerRef.current.camera;
      cam.zoomIn(Math.max(1000, cam.positionCartographic.height * 0.4));
    },
    zoomOut: () => {
      if (!viewerRef.current) return;
      const cam = viewerRef.current.camera;
      cam.zoomOut(Math.max(2000, cam.positionCartographic.height * 0.4));
    },
    resetNorth: () => {
      if (!viewerRef.current) return;
      const cam = viewerRef.current.camera;
      cam.flyTo({
        destination: cam.position,
        orientation: {
          heading: 0,
          pitch: cam.pitch,
          roll: 0,
        },
        duration: 0.8,
      });
    },
    toggleTilt: () => {
      if (!viewerRef.current) return;
      const Cesium = (window as any).Cesium;
      if (!Cesium) return;
      const cam = viewerRef.current.camera;
      const curPitchDeg = Cesium.Math.toDegrees(cam.pitch);
      const targetPitch = curPitchDeg > -60 ? Cesium.Math.toRadians(-90) : Cesium.Math.toRadians(-45);
      cam.flyTo({
        destination: cam.position,
        orientation: {
          heading: cam.heading,
          pitch: targetPitch,
          roll: 0,
        },
        duration: 0.8,
      });
    },
  }));

  /* Initialize Cesium */
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
          baseLayer: false, // Explicitly avoid Cesium Ion default imagery
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
          creditContainer: document.createElement("div"),
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
          skyAtmosphere: new Cesium.SkyAtmosphere(),
          requestRenderMode: false,
          maximumRenderTimeChange: Infinity,
        });

        // Add base map layer
        viewer.imageryLayers.addImageryProvider(createImageryProvider(Cesium, mapStyle));
        if (showLabels) {
          viewer.imageryLayers.addImageryProvider(createLabelsOverlayProvider(Cesium));
        }

        // Enable atmosphere glow
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = enableAtmosphere;
        }

        // Enable lighting
        viewer.scene.globe.enableLighting = enableLighting;

        // Set initial camera - looking at full Earth
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(35.2, 31.9, 15000000),
        });

        // Handle click - copy coordinates
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

        // Palestine annotation
        labelEntityRef.current = viewer.entities.add({
          show: mapStyle !== "satellite" || showLabels,
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
              pitch: Cesium.Math.toDegrees(cam.pitch),
            });
          }
        }, 200);

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

  /* Fly-to target with animated pin marker */
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
      duration: 2.2,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });

    // Add glowing destination pin if named
    if (markerEntityRef.current) {
      viewerRef.current.entities.remove(markerEntityRef.current);
      markerEntityRef.current = null;
    }

    if (flyToTarget.name) {
      markerEntityRef.current = viewerRef.current.entities.add({
        position: Cesium.Cartesian3.fromDegrees(flyToTarget.lon, flyToTarget.lat),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString("#00c3f5"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `📍 ${flyToTarget.name}`,
          font: "bold 13px Inter, sans-serif",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          showBackground: true,
          backgroundColor: Cesium.Color.fromCssColorString("rgba(10,10,25,0.85)"),
          backgroundPadding: new Cesium.Cartesian2(8, 5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }, [flyToTarget]);

  /* Lighting toggle */
  useEffect(() => {
    if (!viewerRef.current) return;
    viewerRef.current.scene.globe.enableLighting = enableLighting;
    viewerRef.current.scene.requestRender();
  }, [enableLighting]);

  /* Atmosphere toggle */
  useEffect(() => {
    if (!viewerRef.current) return;
    if (viewerRef.current.scene.skyAtmosphere) {
      viewerRef.current.scene.skyAtmosphere.show = enableAtmosphere;
      viewerRef.current.scene.requestRender();
    }
  }, [enableAtmosphere]);

  /* Auto-rotate globe */
  useEffect(() => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    let lastTime = Date.now();
    const onTick = () => {
      if (!enableAutoRotate) return;
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      viewer.scene.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.04 * dt);
    };

    viewer.clock.onTick.addEventListener(onTick);
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.clock.onTick.removeEventListener(onTick);
      }
    };
  }, [enableAutoRotate]);

  /* Map style & Labels overlay change */
  useEffect(() => {
    if (!viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    const layers = viewerRef.current.imageryLayers;
    layers.removeAll();
    layers.addImageryProvider(createImageryProvider(Cesium, mapStyle));

    if (showLabels) {
      layers.addImageryProvider(createLabelsOverlayProvider(Cesium));
    }

    if (labelEntityRef.current) {
      labelEntityRef.current.show = mapStyle !== "satellite" || showLabels;
    }
  }, [mapStyle, showLabels]);

  /* Error state */
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-[#050510] text-foreground/50">
        <div className="text-center p-6 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md">
          <p className="text-lg font-semibold mb-2 text-red-400">Failed to load globe</p>
          <p className="text-sm text-foreground/40 font-mono mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-quantum/20 border border-quantum/40 text-quantum rounded-xl text-xs font-mono"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="cesium-container" />;
});

export default CesiumGlobe;
