import type { BoardThemeId } from "./types";

export type TextureStyle = "nebula" | "marble" | "wood" | "crystal";

export interface ChessTheme {
  id: BoardThemeId;
  name: string;
  subtitle: string;
  swatch: {
    light: string;
    dark: string;
    accent: string;
    frame: string;
  };
  board2d: {
    frameBackground: string;
    frameBorder: string;
    frameGlow: string;
    innerFrameBorder: string;
    lightSquare: string;
    darkSquare: string;
    veinOpacity: number;
    veinPattern: string;
    coordOnLight: string;
    coordOnDark: string;
    coordRimText: string;
    selectedBg: string;
    selectedRing: string;
    lastMoveFrom: string;
    lastMoveTo: string;
    validDot: string;
    captureRing: string;
    checkBg: string;
    checkRing: string;
    hintColor: string;
    accentGlow: string;
  };
  svgPieces: {
    lightGrad: [string, string, string];
    lightStroke: string;
    lightDetail: string;
    lightTrim: string;
    lightHighlight: string;
    lightShadow: string;
    darkGrad: [string, string, string];
    darkStroke: string;
    darkDetail: string;
    darkTrim: string;
    darkHighlight: string;
    darkShadow: string;
  };
  scene3d: {
    textureStyle: TextureStyle;
    backdropGradient: string;
    lightTile: {
      color: string;
      veinColor: string;
      secondaryVein: string;
      roughness: number;
      metalness: number;
      clearcoat: number;
      emissive: string;
      emissiveIntensity: number;
    };
    darkTile: {
      color: string;
      veinColor: string;
      secondaryVein: string;
      roughness: number;
      metalness: number;
      clearcoat: number;
      emissive: string;
      emissiveIntensity: number;
    };
    whitePiece: {
      color: string;
      roughness: number;
      metalness: number;
      clearcoat: number;
      emissive: string;
      emissiveIntensity: number;
    };
    blackPiece: {
      color: string;
      roughness: number;
      metalness: number;
      clearcoat: number;
      emissive: string;
      emissiveIntensity: number;
    };
    trimMetal: {
      color: string;
      roughness: number;
      metalness: number;
      emissive: string;
      emissiveIntensity: number;
    };
    plinthBase: string;
    plinthTrim: string;
    plinthGrout: string;
    railBg: string;
    railInk: string;
    railBorder: string;
    lighting: {
      ambientColor: string;
      ambientIntensity: number;
      hemiSky: string;
      hemiGround: string;
      hemiIntensity: number;
      keyColor: string;
      keyIntensity: number;
      rimCoolColor: string;
      rimCoolIntensity: number;
      rimWarmColor: string;
      rimWarmIntensity: number;
    };
    astrolabeRingColor: string;
    astrolabeAccentColor: string;
    stardustColors: [string, string, string];
    selectColor: string;
    hintColor: string;
    lastMoveFromColor: string;
    lastMoveToColor: string;
  };
}

export const THEME_ORDER: BoardThemeId[] = [
  "celestial",
  "marble",
  "emerald",
  "quantum",
];

export const CHESS_THEMES: Record<BoardThemeId, ChessTheme> = {
  celestial: {
    id: "celestial",
    name: "Celestial Nebula",
    subtitle: "Pearl moonstone & amethyst obsidian",
    swatch: {
      light: "#e5dcfa",
      dark: "#261448",
      accent: "#38bdf8",
      frame: "#140928",
    },
    board2d: {
      frameBackground:
        "linear-gradient(145deg, #1b0e36 0%, #0d061f 55%, #160a30 100%)",
      frameBorder: "rgba(167, 139, 250, 0.42)",
      frameGlow:
        "0 24px 64px rgba(5, 2, 18, 0.72), 0 0 56px rgba(124, 58, 237, 0.24), inset 0 1px 0 rgba(255,255,255,0.12)",
      innerFrameBorder: "rgba(212, 175, 55, 0.32)",
      lightSquare:
        "linear-gradient(135deg, #ebe3fc 0%, #d9cef4 52%, #cfc0ef 100%)",
      darkSquare:
        "linear-gradient(135deg, #2d1857 0%, #201041 55%, #170a32 100%)",
      veinOpacity: 0.16,
      veinPattern:
        "radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.22) 0%, transparent 55%), linear-gradient(125deg, transparent 42%, rgba(167,139,250,0.14) 50%, transparent 58%)",
      coordOnLight: "rgba(56, 33, 108, 0.75)",
      coordOnDark: "rgba(216, 204, 255, 0.7)",
      coordRimText: "rgba(214, 198, 255, 0.72)",
      selectedBg: "rgba(56, 189, 248, 0.46)",
      selectedRing: "rgba(103, 232, 249, 0.95)",
      lastMoveFrom: "rgba(167, 139, 250, 0.28)",
      lastMoveTo: "rgba(56, 189, 248, 0.34)",
      validDot: "rgba(56, 189, 248, 0.85)",
      captureRing: "rgba(56, 189, 248, 0.85)",
      checkBg: "rgba(239, 68, 68, 0.56)",
      checkRing: "rgba(254, 100, 100, 0.95)",
      hintColor: "#fbbf24",
      accentGlow: "rgba(56, 189, 248, 0.45)",
    },
    svgPieces: {
      lightGrad: ["#fffdf8", "#f3eadb", "#d9cab0"],
      lightStroke: "#3e2f1e",
      lightDetail: "#8f754f",
      lightTrim: "#d4a64a",
      lightHighlight: "#ffffff",
      lightShadow: "rgba(18, 8, 36, 0.55)",
      darkGrad: ["#48317a", "#26164a", "#110824"],
      darkStroke: "#c7b2ff",
      darkDetail: "#a78bfa",
      darkTrim: "#eab308",
      darkHighlight: "#ede9fe",
      darkShadow: "rgba(6, 2, 16, 0.78)",
    },
    scene3d: {
      textureStyle: "nebula",
      backdropGradient:
        "radial-gradient(circle at 50% 42%, #1d0f3d 0%, #0d061f 58%, #04020a 100%)",
      lightTile: {
        color: "#ece5fb",
        veinColor: "#c8b7ee",
        secondaryVein: "#fffbfe",
        roughness: 0.22,
        metalness: 0.08,
        clearcoat: 0.62,
        emissive: "#26174a",
        emissiveIntensity: 0.08,
      },
      darkTile: {
        color: "#221244",
        veinColor: "#4f2d96",
        secondaryVein: "#130929",
        roughness: 0.24,
        metalness: 0.28,
        clearcoat: 0.72,
        emissive: "#1b0b38",
        emissiveIntensity: 0.14,
      },
      whitePiece: {
        color: "#fcf8f0",
        roughness: 0.16,
        metalness: 0.1,
        clearcoat: 0.85,
        emissive: "#6b5a42",
        emissiveIntensity: 0.08,
      },
      blackPiece: {
        color: "#1e103b",
        roughness: 0.18,
        metalness: 0.45,
        clearcoat: 0.88,
        emissive: "#4b2896",
        emissiveIntensity: 0.22,
      },
      trimMetal: {
        color: "#f2c15a",
        roughness: 0.2,
        metalness: 0.92,
        emissive: "#8c6111",
        emissiveIntensity: 0.22,
      },
      plinthBase: "#0b0518",
      plinthTrim: "#8b5cf6",
      plinthGrout: "#2a1654",
      railBg: "#120926",
      railInk: "#e2d4ff",
      railBorder: "#d4a64a",
      lighting: {
        ambientColor: "#311c5e",
        ambientIntensity: 0.55,
        hemiSky: "#d8c8ff",
        hemiGround: "#14092a",
        hemiIntensity: 0.75,
        keyColor: "#fff8eb",
        keyIntensity: 2.35,
        rimCoolColor: "#38bdf8",
        rimCoolIntensity: 1.5,
        rimWarmColor: "#c084fc",
        rimWarmIntensity: 1.25,
      },
      astrolabeRingColor: "#7c3aed",
      astrolabeAccentColor: "#38bdf8",
      stardustColors: ["#c4b5fd", "#67e8f9", "#f5d0fe"],
      selectColor: "#22d3ee",
      hintColor: "#fbbf24",
      lastMoveFromColor: "#a78bfa",
      lastMoveToColor: "#38bdf8",
    },
  },

  marble: {
    id: "marble",
    name: "Royal Marble",
    subtitle: "Carrara alabaster & Nero Marquina",
    swatch: {
      light: "#f2efe9",
      dark: "#202226",
      accent: "#eab308",
      frame: "#141416",
    },
    board2d: {
      frameBackground:
        "linear-gradient(145deg, #242120 0%, #121113 55%, #1d1a19 100%)",
      frameBorder: "rgba(234, 179, 8, 0.38)",
      frameGlow:
        "0 24px 64px rgba(0, 0, 0, 0.72), 0 0 42px rgba(234, 179, 8, 0.14), inset 0 1px 0 rgba(255,255,255,0.12)",
      innerFrameBorder: "rgba(234, 179, 8, 0.4)",
      lightSquare:
        "linear-gradient(135deg, #f8f5ef 0%, #ebe6dc 52%, #ded7ca 100%)",
      darkSquare:
        "linear-gradient(135deg, #2b2c31 0%, #1d1e22 55%, #151619 100%)",
      veinOpacity: 0.2,
      veinPattern:
        "linear-gradient(118deg, transparent 35%, rgba(160,152,140,0.2) 48%, transparent 56%), linear-gradient(35deg, transparent 58%, rgba(255,255,255,0.16) 66%, transparent 72%)",
      coordOnLight: "rgba(54, 48, 42, 0.72)",
      coordOnDark: "rgba(229, 224, 214, 0.68)",
      coordRimText: "rgba(234, 218, 176, 0.78)",
      selectedBg: "rgba(234, 179, 8, 0.38)",
      selectedRing: "rgba(250, 204, 21, 0.95)",
      lastMoveFrom: "rgba(234, 179, 8, 0.22)",
      lastMoveTo: "rgba(234, 179, 8, 0.36)",
      validDot: "rgba(234, 179, 8, 0.88)",
      captureRing: "rgba(245, 158, 11, 0.9)",
      checkBg: "rgba(220, 38, 38, 0.56)",
      checkRing: "rgba(248, 113, 113, 0.95)",
      hintColor: "#38bdf8",
      accentGlow: "rgba(234, 179, 8, 0.42)",
    },
    svgPieces: {
      lightGrad: ["#ffffff", "#f5f0e6", "#d8cfc0"],
      lightStroke: "#3b352c",
      lightDetail: "#8a7b66",
      lightTrim: "#d9a441",
      lightHighlight: "#ffffff",
      lightShadow: "rgba(18, 16, 14, 0.55)",
      darkGrad: ["#3f4149", "#22242a", "#0f1014"],
      darkStroke: "#d6c394",
      darkDetail: "#b89f6b",
      darkTrim: "#f5c451",
      darkHighlight: "#f3ead4",
      darkShadow: "rgba(0, 0, 0, 0.82)",
    },
    scene3d: {
      textureStyle: "marble",
      backdropGradient:
        "radial-gradient(circle at 50% 42%, #231f24 0%, #111014 60%, #050507 100%)",
      lightTile: {
        color: "#f4f1ea",
        veinColor: "#c5beb2",
        secondaryVein: "#ffffff",
        roughness: 0.16,
        metalness: 0.05,
        clearcoat: 0.86,
        emissive: "#24201a",
        emissiveIntensity: 0.04,
      },
      darkTile: {
        color: "#1a1b1f",
        veinColor: "#756a58",
        secondaryVein: "#3a3d45",
        roughness: 0.18,
        metalness: 0.12,
        clearcoat: 0.88,
        emissive: "#0d0d10",
        emissiveIntensity: 0.05,
      },
      whitePiece: {
        color: "#fbf8f1",
        roughness: 0.14,
        metalness: 0.06,
        clearcoat: 0.92,
        emissive: "#4f4638",
        emissiveIntensity: 0.05,
      },
      blackPiece: {
        color: "#1b1c20",
        roughness: 0.16,
        metalness: 0.25,
        clearcoat: 0.92,
        emissive: "#201c16",
        emissiveIntensity: 0.08,
      },
      trimMetal: {
        color: "#f3c75e",
        roughness: 0.18,
        metalness: 0.94,
        emissive: "#7c5812",
        emissiveIntensity: 0.18,
      },
      plinthBase: "#121113",
      plinthTrim: "#c99b3b",
      plinthGrout: "#2a2723",
      railBg: "#151417",
      railInk: "#f1dfc0",
      railBorder: "#d4a64a",
      lighting: {
        ambientColor: "#36322e",
        ambientIntensity: 0.55,
        hemiSky: "#fff7e8",
        hemiGround: "#18161a",
        hemiIntensity: 0.8,
        keyColor: "#fffaf0",
        keyIntensity: 2.45,
        rimCoolColor: "#bae6fd",
        rimCoolIntensity: 1.15,
        rimWarmColor: "#fde68a",
        rimWarmIntensity: 1.35,
      },
      astrolabeRingColor: "#b48a34",
      astrolabeAccentColor: "#fde68a",
      stardustColors: ["#fef3c7", "#e5e7eb", "#fcd34d"],
      selectColor: "#facc15",
      hintColor: "#38bdf8",
      lastMoveFromColor: "#eab308",
      lastMoveToColor: "#f59e0b",
    },
  },

  emerald: {
    id: "emerald",
    name: "Grandmaster Walnut",
    subtitle: "Satin maple & tournament walnut",
    swatch: {
      light: "#e9d4b0",
      dark: "#476049",
      accent: "#34d399",
      frame: "#241710",
    },
    board2d: {
      frameBackground:
        "linear-gradient(145deg, #321f14 0%, #1d120b 55%, #2a1a10 100%)",
      frameBorder: "rgba(217, 169, 98, 0.38)",
      frameGlow:
        "0 24px 64px rgba(0, 0, 0, 0.7), 0 0 42px rgba(16, 185, 129, 0.14), inset 0 1px 0 rgba(255,230,190,0.12)",
      innerFrameBorder: "rgba(217, 169, 98, 0.36)",
      lightSquare:
        "linear-gradient(135deg, #f0ddc0 0%, #e4caa3 55%, #d6b689 100%)",
      darkSquare:
        "linear-gradient(135deg, #4b6a4e 0%, #39533c 55%, #2d4330 100%)",
      veinOpacity: 0.14,
      veinPattern:
        "repeating-linear-gradient(12deg, rgba(120,75,30,0.08) 0px, rgba(120,75,30,0.08) 2px, transparent 2px, transparent 9px)",
      coordOnLight: "rgba(62, 42, 22, 0.78)",
      coordOnDark: "rgba(235, 225, 200, 0.75)",
      coordRimText: "rgba(236, 205, 155, 0.8)",
      selectedBg: "rgba(52, 211, 153, 0.42)",
      selectedRing: "rgba(110, 231, 183, 0.95)",
      lastMoveFrom: "rgba(250, 204, 21, 0.25)",
      lastMoveTo: "rgba(250, 204, 21, 0.4)",
      validDot: "rgba(52, 211, 153, 0.88)",
      captureRing: "rgba(52, 211, 153, 0.9)",
      checkBg: "rgba(220, 38, 38, 0.58)",
      checkRing: "rgba(252, 165, 165, 0.95)",
      hintColor: "#fbbf24",
      accentGlow: "rgba(52, 211, 153, 0.4)",
    },
    svgPieces: {
      lightGrad: ["#fdf7e7", "#efdec0", "#d4b787"],
      lightStroke: "#4a321a",
      lightDetail: "#8a6640",
      lightTrim: "#d49b42",
      lightHighlight: "#fffcf2",
      lightShadow: "rgba(24, 14, 6, 0.55)",
      darkGrad: ["#4a3222", "#2d1d13", "#190f09"],
      darkStroke: "#e6c89a",
      darkDetail: "#b8915c",
      darkTrim: "#e0ab53",
      darkHighlight: "#f5dec0",
      darkShadow: "rgba(10, 6, 3, 0.82)",
    },
    scene3d: {
      textureStyle: "wood",
      backdropGradient:
        "radial-gradient(circle at 50% 42%, #1d2821 0%, #101511 60%, #050705 100%)",
      lightTile: {
        color: "#ead2ad",
        veinColor: "#cca777",
        secondaryVein: "#f7e7cb",
        roughness: 0.34,
        metalness: 0.04,
        clearcoat: 0.45,
        emissive: "#24190c",
        emissiveIntensity: 0.04,
      },
      darkTile: {
        color: "#36503a",
        veinColor: "#233626",
        secondaryVein: "#4e7052",
        roughness: 0.36,
        metalness: 0.06,
        clearcoat: 0.42,
        emissive: "#0c190f",
        emissiveIntensity: 0.05,
      },
      whitePiece: {
        color: "#f6e8ce",
        roughness: 0.24,
        metalness: 0.04,
        clearcoat: 0.65,
        emissive: "#4d3d26",
        emissiveIntensity: 0.04,
      },
      blackPiece: {
        color: "#2c1b12",
        roughness: 0.24,
        metalness: 0.08,
        clearcoat: 0.68,
        emissive: "#1f1008",
        emissiveIntensity: 0.06,
      },
      trimMetal: {
        color: "#deb059",
        roughness: 0.24,
        metalness: 0.88,
        emissive: "#6b4a14",
        emissiveIntensity: 0.16,
      },
      plinthBase: "#1e120b",
      plinthTrim: "#b5853c",
      plinthGrout: "#2a1b11",
      railBg: "#21140c",
      railInk: "#f2dbb6",
      railBorder: "#c59245",
      lighting: {
        ambientColor: "#332a20",
        ambientIntensity: 0.58,
        hemiSky: "#fff3db",
        hemiGround: "#161b16",
        hemiIntensity: 0.82,
        keyColor: "#fff5e4",
        keyIntensity: 2.35,
        rimCoolColor: "#6ee7b7",
        rimCoolIntensity: 1.05,
        rimWarmColor: "#fcd34d",
        rimWarmIntensity: 1.35,
      },
      astrolabeRingColor: "#2e6b4a",
      astrolabeAccentColor: "#fbbf24",
      stardustColors: ["#a7f3d0", "#fde68a", "#d9f99d"],
      selectColor: "#34d399",
      hintColor: "#fbbf24",
      lastMoveFromColor: "#facc15",
      lastMoveToColor: "#eab308",
    },
  },

  quantum: {
    id: "quantum",
    name: "Quantum Frost",
    subtitle: "Crystalline quartz & sapphire titanium",
    swatch: {
      light: "#d7f2ff",
      dark: "#0f2744",
      accent: "#00e5ff",
      frame: "#071426",
    },
    board2d: {
      frameBackground:
        "linear-gradient(145deg, #0b203a 0%, #050d1a 55%, #091a31 100%)",
      frameBorder: "rgba(34, 211, 238, 0.42)",
      frameGlow:
        "0 24px 64px rgba(2, 8, 22, 0.78), 0 0 56px rgba(6, 182, 212, 0.24), inset 0 1px 0 rgba(186,230,253,0.16)",
      innerFrameBorder: "rgba(56, 189, 248, 0.35)",
      lightSquare:
        "linear-gradient(135deg, #e2f6ff 0%, #c6ebfc 54%, #addff8 100%)",
      darkSquare:
        "linear-gradient(135deg, #133154 0%, #0c213b 56%, #07162b 100%)",
      veinOpacity: 0.18,
      veinPattern:
        "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 45%, rgba(0,229,255,0.12) 100%)",
      coordOnLight: "rgba(10, 42, 74, 0.76)",
      coordOnDark: "rgba(165, 235, 255, 0.74)",
      coordRimText: "rgba(165, 243, 252, 0.78)",
      selectedBg: "rgba(0, 229, 255, 0.44)",
      selectedRing: "rgba(103, 232, 249, 0.98)",
      lastMoveFrom: "rgba(56, 189, 248, 0.25)",
      lastMoveTo: "rgba(34, 211, 238, 0.38)",
      validDot: "rgba(0, 229, 255, 0.9)",
      captureRing: "rgba(244, 114, 182, 0.92)",
      checkBg: "rgba(239, 68, 68, 0.58)",
      checkRing: "rgba(254, 100, 100, 0.95)",
      hintColor: "#fbbf24",
      accentGlow: "rgba(0, 229, 255, 0.48)",
    },
    svgPieces: {
      lightGrad: ["#f8fdff", "#dcf3fc", "#a9d9f0"],
      lightStroke: "#153d5c",
      lightDetail: "#3c7da6",
      lightTrim: "#38bdf8",
      lightHighlight: "#ffffff",
      lightShadow: "rgba(4, 16, 32, 0.55)",
      darkGrad: ["#1b4778", "#0e294a", "#061426"],
      darkStroke: "#7dd3fc",
      darkDetail: "#38bdf8",
      darkTrim: "#67e8f9",
      darkHighlight: "#e0f2fe",
      darkShadow: "rgba(2, 8, 20, 0.84)",
    },
    scene3d: {
      textureStyle: "crystal",
      backdropGradient:
        "radial-gradient(circle at 50% 42%, #0a2540 0%, #051120 60%, #02060d 100%)",
      lightTile: {
        color: "#d9f2ff",
        veinColor: "#9bd7f5",
        secondaryVein: "#ffffff",
        roughness: 0.14,
        metalness: 0.14,
        clearcoat: 0.92,
        emissive: "#0e3b5c",
        emissiveIntensity: 0.1,
      },
      darkTile: {
        color: "#0d2542",
        veinColor: "#1d5b91",
        secondaryVein: "#061529",
        roughness: 0.16,
        metalness: 0.45,
        clearcoat: 0.9,
        emissive: "#07213d",
        emissiveIntensity: 0.16,
      },
      whitePiece: {
        color: "#eef9ff",
        roughness: 0.12,
        metalness: 0.18,
        clearcoat: 0.95,
        emissive: "#2f6b8c",
        emissiveIntensity: 0.1,
      },
      blackPiece: {
        color: "#0b223d",
        roughness: 0.15,
        metalness: 0.65,
        clearcoat: 0.92,
        emissive: "#0ea5e9",
        emissiveIntensity: 0.2,
      },
      trimMetal: {
        color: "#67e8f9",
        roughness: 0.16,
        metalness: 0.94,
        emissive: "#0284c7",
        emissiveIntensity: 0.3,
      },
      plinthBase: "#040d1a",
      plinthTrim: "#0ea5e9",
      plinthGrout: "#0d2a4a",
      railBg: "#061426",
      railInk: "#cffafe",
      railBorder: "#38bdf8",
      lighting: {
        ambientColor: "#163c5e",
        ambientIntensity: 0.56,
        hemiSky: "#bae6fd",
        hemiGround: "#061426",
        hemiIntensity: 0.8,
        keyColor: "#f8fdff",
        keyIntensity: 2.35,
        rimCoolColor: "#00e5ff",
        rimCoolIntensity: 1.65,
        rimWarmColor: "#818cf8",
        rimWarmIntensity: 1.25,
      },
      astrolabeRingColor: "#0284c7",
      astrolabeAccentColor: "#67e8f9",
      stardustColors: ["#67e8f9", "#a5f3fc", "#93c5fd"],
      selectColor: "#00f0ff",
      hintColor: "#fbbf24",
      lastMoveFromColor: "#38bdf8",
      lastMoveToColor: "#06b6d4",
    },
  },
};
