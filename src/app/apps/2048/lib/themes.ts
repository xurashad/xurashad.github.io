import { tileRank } from "./engine";
import type { GameVariant, ThemeId } from "./types";

export interface TileVisualStyle {
  bg: string;
  text: string;
  border: string;
  shadow: string;
  glow?: string;
  shimmer?: boolean;
}

export interface Theme2048 {
  id: ThemeId;
  name: string;
  subtitle: string;
  swatches: [string, string, string, string];
  boardBg: string;
  boardBorder: string;
  boardShadow: string;
  emptyCellBg: string;
  emptyCellBorder: string;
  accentColor: string;
  accentSoft: string;
  scoreFlashColor: string;
  particleColors: string[];
  obstacleStyle: {
    bg: string;
    border: string;
    text: string;
    shadow: string;
  };
  rankStyles: TileVisualStyle[];
}

export const THEME_ORDER: ThemeId[] = [
  "celestial",
  "quantum",
  "solar",
  "emerald",
  "parchment",
];

export const THEMES_2048: Record<ThemeId, Theme2048> = {
  celestial: {
    id: "celestial",
    name: "Astro-Celestial",
    subtitle: "Cosmic violet to magenta & stardust gold",
    swatches: ["#5b21b6", "#9333ea", "#ec4899", "#fbbf24"],
    boardBg: "linear-gradient(145deg, rgba(16, 10, 38, 0.94), rgba(8, 5, 22, 0.97))",
    boardBorder: "rgba(167, 139, 250, 0.34)",
    boardShadow:
      "0 24px 60px rgba(4, 2, 16, 0.55), 0 0 48px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
    emptyCellBg: "rgba(139, 92, 246, 0.11)",
    emptyCellBorder: "rgba(167, 139, 250, 0.14)",
    accentColor: "#e879f9",
    accentSoft: "rgba(232, 121, 249, 0.18)",
    scoreFlashColor: "#f0abfc",
    particleColors: ["#c084fc", "#f472b6", "#38bdf8", "#fde047"],
    obstacleStyle: {
      bg: "radial-gradient(circle at 38% 35%, #2e1065 0%, #090314 70%, #020108 100%)",
      border: "rgba(192, 132, 252, 0.45)",
      text: "#e9d5ff",
      shadow: "inset 0 0 16px rgba(168, 85, 247, 0.5), 0 4px 12px rgba(0,0,0,0.6)",
    },
    rankStyles: [
      { bg: "linear-gradient(135deg, #4338ca, #312e81)", text: "#eef2ff", border: "rgba(165, 180, 252, 0.28)", shadow: "0 4px 12px rgba(49, 46, 129, 0.45)" },
      { bg: "linear-gradient(135deg, #5b21b6, #4c1d95)", text: "#f5f3ff", border: "rgba(196, 181, 253, 0.32)", shadow: "0 4px 14px rgba(91, 33, 182, 0.45)" },
      { bg: "linear-gradient(135deg, #7c3aed, #6d28d9)", text: "#ffffff", border: "rgba(216, 180, 254, 0.36)", shadow: "0 6px 16px rgba(124, 58, 237, 0.45)" },
      { bg: "linear-gradient(135deg, #9333ea, #7e22ce)", text: "#ffffff", border: "rgba(233, 213, 255, 0.4)", shadow: "0 6px 18px rgba(147, 51, 234, 0.48)" },
      { bg: "linear-gradient(135deg, #c084fc, #a855f7)", text: "#14072b", border: "rgba(255, 255, 255, 0.45)", shadow: "0 6px 18px rgba(168, 85, 247, 0.45)" },
      { bg: "linear-gradient(135deg, #e9d5ff, #d8b4fe)", text: "#1e0b3b", border: "rgba(255, 255, 255, 0.7)", shadow: "0 6px 18px rgba(216, 180, 254, 0.45)" },
      { bg: "linear-gradient(135deg, #f472b6, #db2777)", text: "#ffffff", border: "rgba(251, 207, 232, 0.48)", shadow: "0 8px 22px rgba(219, 39, 119, 0.5)", glow: "0 0 20px rgba(244, 114, 182, 0.38)" },
      { bg: "linear-gradient(135deg, #ec4899, #be185d)", text: "#ffffff", border: "rgba(249, 168, 212, 0.5)", shadow: "0 8px 24px rgba(190, 24, 93, 0.55)", glow: "0 0 24px rgba(236, 72, 153, 0.44)" },
      { bg: "linear-gradient(135deg, #fb7185, #e11d48)", text: "#ffffff", border: "rgba(254, 205, 211, 0.5)", shadow: "0 8px 26px rgba(225, 29, 72, 0.55)", glow: "0 0 26px rgba(251, 113, 133, 0.46)" },
      { bg: "linear-gradient(135deg, #f59e0b, #db2777)", text: "#ffffff", border: "rgba(253, 224, 71, 0.6)", shadow: "0 10px 28px rgba(219, 39, 119, 0.6)", glow: "0 0 30px rgba(245, 158, 11, 0.5)", shimmer: true },
      { bg: "linear-gradient(135deg, #fde047 0%, #f472b6 55%, #a855f7 100%)", text: "#140624", border: "rgba(255, 255, 255, 0.85)", shadow: "0 12px 34px rgba(244, 114, 182, 0.65)", glow: "0 0 36px rgba(253, 224, 71, 0.65)", shimmer: true },
      { bg: "linear-gradient(135deg, #22d3ee 0%, #c084fc 52%, #f472b6 100%)", text: "#090418", border: "rgba(255, 255, 255, 0.9)", shadow: "0 12px 36px rgba(34, 211, 238, 0.6)", glow: "0 0 40px rgba(56, 189, 248, 0.68)", shimmer: true },
      { bg: "linear-gradient(135deg, #ffffff 0%, #e0f2fe 45%, #f5d0fe 100%)", text: "#0f0722", border: "rgba(255, 255, 255, 0.95)", shadow: "0 12px 38px rgba(245, 208, 254, 0.65)", glow: "0 0 44px rgba(255, 255, 255, 0.7)", shimmer: true },
      { bg: "linear-gradient(135deg, #0ea5e9, #6366f1)", text: "#ffffff", border: "rgba(186, 230, 253, 0.7)", shadow: "0 12px 34px rgba(14, 165, 233, 0.6)", glow: "0 0 38px rgba(99, 102, 241, 0.6)", shimmer: true },
      { bg: "linear-gradient(135deg, #14b8a6, #7c3aed)", text: "#ffffff", border: "rgba(153, 246, 228, 0.7)", shadow: "0 12px 34px rgba(20, 184, 166, 0.6)", glow: "0 0 38px rgba(124, 58, 237, 0.6)", shimmer: true },
      { bg: "linear-gradient(135deg, #f97316, #7c3aed)", text: "#ffffff", border: "rgba(254, 215, 170, 0.75)", shadow: "0 12px 34px rgba(249, 115, 22, 0.6)", glow: "0 0 40px rgba(249, 115, 22, 0.65)", shimmer: true },
      { bg: "linear-gradient(135deg, #eab308, #14b8a6)", text: "#061214", border: "rgba(254, 240, 138, 0.85)", shadow: "0 12px 36px rgba(234, 179, 8, 0.6)", glow: "0 0 42px rgba(234, 179, 8, 0.7)", shimmer: true },
      { bg: "linear-gradient(135deg, #fef08a, #ffffff)", text: "#140724", border: "rgba(255, 255, 255, 1)", shadow: "0 14px 40px rgba(254, 240, 138, 0.7)", glow: "0 0 48px rgba(255, 255, 255, 0.8)", shimmer: true },
    ],
  },

  quantum: {
    id: "quantum",
    name: "Quantum Frost",
    subtitle: "Abyssal sapphire to electric diamond cyan",
    swatches: ["#0f172a", "#0284c7", "#00c3f5", "#bae6fd"],
    boardBg: "linear-gradient(145deg, rgba(6, 19, 38, 0.95), rgba(3, 10, 22, 0.98))",
    boardBorder: "rgba(0, 195, 245, 0.36)",
    boardShadow:
      "0 24px 60px rgba(2, 8, 24, 0.6), 0 0 48px rgba(0, 195, 245, 0.18), inset 0 1px 0 rgba(186,230,253,0.1)",
    emptyCellBg: "rgba(0, 195, 245, 0.08)",
    emptyCellBorder: "rgba(56, 189, 248, 0.14)",
    accentColor: "#00c3f5",
    accentSoft: "rgba(0, 195, 245, 0.18)",
    scoreFlashColor: "#67e8f9",
    particleColors: ["#00c3f5", "#67e8f9", "#818cf8", "#f0f9ff"],
    obstacleStyle: {
      bg: "radial-gradient(circle at 38% 35%, #0c4a6e 0%, #041222 72%, #02060d 100%)",
      border: "rgba(56, 189, 248, 0.48)",
      text: "#bae6fd",
      shadow: "inset 0 0 16px rgba(0, 195, 245, 0.45), 0 4px 12px rgba(0,0,0,0.65)",
    },
    rankStyles: [
      { bg: "linear-gradient(135deg, #1e3a5f, #0f2544)", text: "#e0f2fe", border: "rgba(125, 211, 252, 0.25)", shadow: "0 4px 12px rgba(15, 37, 68, 0.5)" },
      { bg: "linear-gradient(135deg, #0c4a6e, #082f49)", text: "#f0f9ff", border: "rgba(56, 189, 248, 0.32)", shadow: "0 4px 14px rgba(12, 74, 110, 0.5)" },
      { bg: "linear-gradient(135deg, #0369a1, #075985)", text: "#ffffff", border: "rgba(125, 211, 252, 0.4)", shadow: "0 6px 16px rgba(3, 105, 161, 0.48)" },
      { bg: "linear-gradient(135deg, #0284c7, #0369a1)", text: "#ffffff", border: "rgba(186, 230, 253, 0.45)", shadow: "0 6px 18px rgba(2, 132, 199, 0.5)" },
      { bg: "linear-gradient(135deg, #0ea5e9, #0284c7)", text: "#ffffff", border: "rgba(224, 242, 254, 0.5)", shadow: "0 6px 20px rgba(14, 165, 233, 0.5)" },
      { bg: "linear-gradient(135deg, #38bdf8, #00c3f5)", text: "#041e33", border: "rgba(255, 255, 255, 0.65)", shadow: "0 6px 20px rgba(0, 195, 245, 0.45)" },
      { bg: "linear-gradient(135deg, #67e8f9, #22d3ee)", text: "#042336", border: "rgba(255, 255, 255, 0.78)", shadow: "0 8px 22px rgba(34, 211, 238, 0.5)", glow: "0 0 20px rgba(103, 232, 249, 0.4)" },
      { bg: "linear-gradient(135deg, #a5f3fc, #67e8f9)", text: "#042438", border: "rgba(255, 255, 255, 0.85)", shadow: "0 8px 24px rgba(103, 232, 249, 0.5)", glow: "0 0 24px rgba(165, 243, 252, 0.45)" },
      { bg: "linear-gradient(135deg, #6366f1, #06b6d4)", text: "#ffffff", border: "rgba(199, 210, 254, 0.6)", shadow: "0 8px 26px rgba(99, 102, 241, 0.55)", glow: "0 0 28px rgba(6, 182, 212, 0.5)" },
      { bg: "linear-gradient(135deg, #818cf8, #00c3f5)", text: "#030b1c", border: "rgba(255, 255, 255, 0.85)", shadow: "0 10px 28px rgba(0, 195, 245, 0.6)", glow: "0 0 32px rgba(129, 140, 248, 0.55)", shimmer: true },
      { bg: "linear-gradient(135deg, #ffffff 0%, #67e8f9 50%, #38bdf8 100%)", text: "#04162b", border: "rgba(255, 255, 255, 0.96)", shadow: "0 12px 34px rgba(0, 195, 245, 0.72)", glow: "0 0 42px rgba(103, 232, 249, 0.78)", shimmer: true },
      { bg: "linear-gradient(135deg, #e0f2fe 0%, #c084fc 55%, #00c3f5 100%)", text: "#070b24", border: "rgba(255, 255, 255, 0.96)", shadow: "0 12px 36px rgba(192, 132, 252, 0.65)", glow: "0 0 44px rgba(0, 195, 245, 0.75)", shimmer: true },
      { bg: "linear-gradient(135deg, #2dd4bf, #0ea5e9)", text: "#031e24", border: "rgba(204, 251, 241, 0.9)", shadow: "0 12px 36px rgba(45, 212, 191, 0.6)", glow: "0 0 44px rgba(45, 212, 191, 0.65)", shimmer: true },
      { bg: "linear-gradient(135deg, #4f46e5, #06b6d4)", text: "#ffffff", border: "rgba(199, 210, 254, 0.8)", shadow: "0 12px 36px rgba(79, 70, 229, 0.65)", glow: "0 0 42px rgba(6, 182, 212, 0.65)", shimmer: true },
      { bg: "linear-gradient(135deg, #06b6d4, #3b82f6)", text: "#ffffff", border: "rgba(186, 230, 253, 0.85)", shadow: "0 12px 36px rgba(59, 130, 246, 0.65)", glow: "0 0 44px rgba(59, 130, 246, 0.7)", shimmer: true },
      { bg: "linear-gradient(135deg, #f0f9ff, #38bdf8)", text: "#041c33", border: "rgba(255, 255, 255, 0.95)", shadow: "0 14px 40px rgba(56, 189, 248, 0.7)", glow: "0 0 48px rgba(240, 249, 255, 0.75)", shimmer: true },
      { bg: "linear-gradient(135deg, #a5f3fc, #f5d0fe)", text: "#0f0726", border: "rgba(255, 255, 255, 0.98)", shadow: "0 14px 42px rgba(165, 243, 252, 0.75)", glow: "0 0 50px rgba(245, 208, 254, 0.75)", shimmer: true },
      { bg: "linear-gradient(135deg, #ffffff, #cffafe)", text: "#041629", border: "rgba(255, 255, 255, 1)", shadow: "0 14px 44px rgba(255, 255, 255, 0.8)", glow: "0 0 52px rgba(255, 255, 255, 0.9)", shimmer: true },
    ],
  },

  solar: {
    id: "solar",
    name: "Solar Nebula",
    subtitle: "Molten obsidian ember to supernova gold",
    swatches: ["#7c2d12", "#ea580c", "#f59e0b", "#fef08a"],
    boardBg: "linear-gradient(145deg, rgba(32, 12, 8, 0.95), rgba(16, 6, 4, 0.98))",
    boardBorder: "rgba(251, 146, 60, 0.36)",
    boardShadow:
      "0 24px 60px rgba(20, 6, 2, 0.62), 0 0 48px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(254,215,170,0.1)",
    emptyCellBg: "rgba(251, 146, 60, 0.09)",
    emptyCellBorder: "rgba(251, 146, 60, 0.14)",
    accentColor: "#fb923c",
    accentSoft: "rgba(251, 146, 60, 0.18)",
    scoreFlashColor: "#fde047",
    particleColors: ["#fb923c", "#fbbf24", "#f87171", "#fef08a"],
    obstacleStyle: {
      bg: "radial-gradient(circle at 38% 35%, #451a03 0%, #1c0802 72%, #090200 100%)",
      border: "rgba(251, 146, 60, 0.45)",
      text: "#fed7aa",
      shadow: "inset 0 0 16px rgba(249, 115, 22, 0.45), 0 4px 12px rgba(0,0,0,0.65)",
    },
    rankStyles: [
      { bg: "linear-gradient(135deg, #431407, #2c0b03)", text: "#ffedd5", border: "rgba(253, 186, 116, 0.24)", shadow: "0 4px 12px rgba(44, 11, 3, 0.5)" },
      { bg: "linear-gradient(135deg, #7c2d12, #5a1e0a)", text: "#fff7ed", border: "rgba(253, 186, 116, 0.3)", shadow: "0 4px 14px rgba(124, 45, 18, 0.5)" },
      { bg: "linear-gradient(135deg, #9a3412, #7c2d12)", text: "#ffffff", border: "rgba(254, 215, 170, 0.36)", shadow: "0 6px 16px rgba(154, 52, 18, 0.5)" },
      { bg: "linear-gradient(135deg, #c2410c, #9a3412)", text: "#ffffff", border: "rgba(254, 215, 170, 0.42)", shadow: "0 6px 18px rgba(194, 65, 12, 0.5)" },
      { bg: "linear-gradient(135deg, #ea580c, #c2410c)", text: "#ffffff", border: "rgba(254, 215, 170, 0.48)", shadow: "0 6px 20px rgba(234, 88, 12, 0.52)" },
      { bg: "linear-gradient(135deg, #f97316, #ea580c)", text: "#ffffff", border: "rgba(255, 237, 213, 0.55)", shadow: "0 8px 20px rgba(249, 115, 22, 0.52)" },
      { bg: "linear-gradient(135deg, #fb923c, #f59e0b)", text: "#230c02", border: "rgba(255, 255, 255, 0.65)", shadow: "0 8px 22px rgba(245, 158, 11, 0.48)", glow: "0 0 20px rgba(251, 146, 60, 0.42)" },
      { bg: "linear-gradient(135deg, #fbbf24, #f59e0b)", text: "#291102", border: "rgba(255, 255, 255, 0.72)", shadow: "0 8px 24px rgba(251, 191, 36, 0.5)", glow: "0 0 24px rgba(251, 191, 36, 0.46)" },
      { bg: "linear-gradient(135deg, #facc15, #eab308)", text: "#271402", border: "rgba(255, 255, 255, 0.8)", shadow: "0 8px 26px rgba(234, 179, 8, 0.55)", glow: "0 0 28px rgba(250, 204, 21, 0.52)" },
      { bg: "linear-gradient(135deg, #ef4444, #f59e0b)", text: "#ffffff", border: "rgba(254, 240, 138, 0.65)", shadow: "0 10px 28px rgba(239, 68, 68, 0.58)", glow: "0 0 32px rgba(245, 158, 11, 0.56)", shimmer: true },
      { bg: "linear-gradient(135deg, #fef08a 0%, #f97316 55%, #dc2626 100%)", text: "#230802", border: "rgba(255, 255, 255, 0.92)", shadow: "0 12px 34px rgba(249, 115, 22, 0.68)", glow: "0 0 42px rgba(254, 240, 138, 0.7)", shimmer: true },
      { bg: "linear-gradient(135deg, #ffffff 0%, #fde047 50%, #fb7185 100%)", text: "#290906", border: "rgba(255, 255, 255, 0.96)", shadow: "0 12px 36px rgba(253, 224, 71, 0.7)", glow: "0 0 44px rgba(255, 255, 255, 0.7)", shimmer: true },
      { bg: "linear-gradient(135deg, #e11d48, #9333ea)", text: "#ffffff", border: "rgba(254, 205, 211, 0.7)", shadow: "0 12px 36px rgba(225, 29, 72, 0.65)", glow: "0 0 42px rgba(225, 29, 72, 0.6)", shimmer: true },
      { bg: "linear-gradient(135deg, #f59e0b, #be185d)", text: "#ffffff", border: "rgba(254, 240, 138, 0.75)", shadow: "0 12px 36px rgba(190, 24, 93, 0.65)", glow: "0 0 42px rgba(245, 158, 11, 0.65)", shimmer: true },
      { bg: "linear-gradient(135deg, #fef9c3, #fb923c)", text: "#290e02", border: "rgba(255, 255, 255, 0.92)", shadow: "0 12px 38px rgba(251, 146, 60, 0.65)", glow: "0 0 44px rgba(254, 249, 195, 0.7)", shimmer: true },
      { bg: "linear-gradient(135deg, #fde047, #ffffff)", text: "#2b1202", border: "rgba(255, 255, 255, 0.98)", shadow: "0 14px 40px rgba(253, 224, 71, 0.75)", glow: "0 0 48px rgba(255, 255, 255, 0.8)", shimmer: true },
      { bg: "linear-gradient(135deg, #fed7aa, #f43f5e)", text: "#24040a", border: "rgba(255, 255, 255, 0.94)", shadow: "0 14px 40px rgba(244, 63, 94, 0.7)", glow: "0 0 48px rgba(254, 215, 170, 0.75)", shimmer: true },
      { bg: "linear-gradient(135deg, #ffffff, #fef08a)", text: "#241102", border: "rgba(255, 255, 255, 1)", shadow: "0 14px 44px rgba(255, 255, 255, 0.8)", glow: "0 0 52px rgba(254, 240, 138, 0.9)", shimmer: true },
    ],
  },

  emerald: {
    id: "emerald",
    name: "Emerald Alchemy",
    subtitle: "Deep forest velvet to gilded olive & jade",
    swatches: ["#14532d", "#059669", "#8bac35", "#fde047"],
    boardBg: "linear-gradient(145deg, rgba(8, 28, 19, 0.95), rgba(4, 15, 10, 0.98))",
    boardBorder: "rgba(52, 211, 153, 0.34)",
    boardShadow:
      "0 24px 60px rgba(2, 14, 8, 0.6), 0 0 48px rgba(16, 185, 129, 0.18), inset 0 1px 0 rgba(167,243,208,0.09)",
    emptyCellBg: "rgba(52, 211, 153, 0.08)",
    emptyCellBorder: "rgba(110, 231, 183, 0.13)",
    accentColor: "#34d399",
    accentSoft: "rgba(52, 211, 153, 0.18)",
    scoreFlashColor: "#6ee7b7",
    particleColors: ["#34d399", "#a3e635", "#2dd4bf", "#fde047"],
    obstacleStyle: {
      bg: "radial-gradient(circle at 38% 35%, #064e3b 0%, #022018 72%, #010d0a 100%)",
      border: "rgba(52, 211, 153, 0.45)",
      text: "#a7f3d0",
      shadow: "inset 0 0 16px rgba(16, 185, 129, 0.45), 0 4px 12px rgba(0,0,0,0.65)",
    },
    rankStyles: [
      { bg: "linear-gradient(135deg, #14532d, #0d3b1f)", text: "#dcfce7", border: "rgba(134, 239, 172, 0.25)", shadow: "0 4px 12px rgba(13, 59, 31, 0.5)" },
      { bg: "linear-gradient(135deg, #065f46, #064e3b)", text: "#ecfdf5", border: "rgba(110, 231, 183, 0.3)", shadow: "0 4px 14px rgba(6, 78, 59, 0.5)" },
      { bg: "linear-gradient(135deg, #047857, #065f46)", text: "#ffffff", border: "rgba(167, 243, 208, 0.36)", shadow: "0 6px 16px rgba(4, 120, 87, 0.48)" },
      { bg: "linear-gradient(135deg, #059669, #047857)", text: "#ffffff", border: "rgba(167, 243, 208, 0.42)", shadow: "0 6px 18px rgba(5, 150, 105, 0.5)" },
      { bg: "linear-gradient(135deg, #10b981, #059669)", text: "#04261c", border: "rgba(209, 250, 229, 0.55)", shadow: "0 6px 20px rgba(16, 185, 129, 0.48)" },
      { bg: "linear-gradient(135deg, #34d399, #10b981)", text: "#042419", border: "rgba(255, 255, 255, 0.68)", shadow: "0 6px 20px rgba(52, 211, 153, 0.46)" },
      { bg: "linear-gradient(135deg, #6ee7b7, #34d399)", text: "#05261a", border: "rgba(255, 255, 255, 0.78)", shadow: "0 8px 22px rgba(110, 231, 183, 0.48)", glow: "0 0 20px rgba(52, 211, 153, 0.4)" },
      { bg: "linear-gradient(135deg, #a3e635, #65a30d)", text: "#142202", border: "rgba(255, 255, 255, 0.72)", shadow: "0 8px 24px rgba(132, 204, 22, 0.5)", glow: "0 0 24px rgba(163, 230, 53, 0.45)" },
      { bg: "linear-gradient(135deg, #2dd4bf, #0d9488)", text: "#042624", border: "rgba(204, 251, 241, 0.78)", shadow: "0 8px 26px rgba(45, 212, 191, 0.52)", glow: "0 0 26px rgba(45, 212, 191, 0.48)" },
      { bg: "linear-gradient(135deg, #facc15, #10b981)", text: "#062112", border: "rgba(254, 249, 195, 0.85)", shadow: "0 10px 28px rgba(16, 185, 129, 0.58)", glow: "0 0 32px rgba(250, 204, 21, 0.55)", shimmer: true },
      { bg: "linear-gradient(135deg, #fef08a 0%, #34d399 52%, #059669 100%)", text: "#042112", border: "rgba(255, 255, 255, 0.94)", shadow: "0 12px 34px rgba(52, 211, 153, 0.7)", glow: "0 0 42px rgba(254, 240, 138, 0.72)", shimmer: true },
      { bg: "linear-gradient(135deg, #ffffff 0%, #a7f3d0 50%, #2dd4bf 100%)", text: "#04221a", border: "rgba(255, 255, 255, 0.98)", shadow: "0 12px 36px rgba(167, 243, 208, 0.7)", glow: "0 0 44px rgba(110, 231, 183, 0.75)", shimmer: true },
      { bg: "linear-gradient(135deg, #14b8a6, #0284c7)", text: "#ffffff", border: "rgba(186, 230, 253, 0.75)", shadow: "0 12px 36px rgba(20, 184, 166, 0.62)", glow: "0 0 42px rgba(20, 184, 166, 0.6)", shimmer: true },
      { bg: "linear-gradient(135deg, #84cc16, #059669)", text: "#05220d", border: "rgba(236, 252, 203, 0.85)", shadow: "0 12px 36px rgba(132, 204, 22, 0.6)", glow: "0 0 42px rgba(132, 204, 22, 0.65)", shimmer: true },
      { bg: "linear-gradient(135deg, #fde047, #65a30d)", text: "#142102", border: "rgba(254, 249, 195, 0.92)", shadow: "0 12px 38px rgba(253, 224, 71, 0.65)", glow: "0 0 44px rgba(253, 224, 71, 0.7)", shimmer: true },
      { bg: "linear-gradient(135deg, #d9f99d, #34d399)", text: "#052617", border: "rgba(255, 255, 255, 0.95)", shadow: "0 14px 40px rgba(52, 211, 153, 0.7)", glow: "0 0 48px rgba(217, 249, 157, 0.75)", shimmer: true },
      { bg: "linear-gradient(135deg, #ecfccb, #2dd4bf)", text: "#04241e", border: "rgba(255, 255, 255, 0.98)", shadow: "0 14px 42px rgba(45, 212, 191, 0.72)", glow: "0 0 50px rgba(236, 252, 203, 0.8)", shimmer: true },
      { bg: "linear-gradient(135deg, #ffffff, #d1fae5)", text: "#031e14", border: "rgba(255, 255, 255, 1)", shadow: "0 14px 44px rgba(255, 255, 255, 0.8)", glow: "0 0 52px rgba(209, 250, 229, 0.9)", shimmer: true },
    ],
  },

  parchment: {
    id: "parchment",
    name: "Classic Ivory",
    subtitle: "Warm editorial cream, terracotta & royal gold",
    swatches: ["#eee4da", "#f59563", "#f65e3b", "#edc22e"],
    boardBg: "linear-gradient(145deg, #bbada0, #a8998a)",
    boardBorder: "rgba(120, 108, 96, 0.45)",
    boardShadow:
      "0 22px 52px rgba(45, 38, 30, 0.28), inset 0 1px 0 rgba(255,255,255,0.28)",
    emptyCellBg: "rgba(238, 228, 218, 0.38)",
    emptyCellBorder: "rgba(255, 255, 255, 0.16)",
    accentColor: "#d97706",
    accentSoft: "rgba(217, 119, 6, 0.16)",
    scoreFlashColor: "#f59e0b",
    particleColors: ["#f59e0b", "#f97316", "#ef4444", "#fde047"],
    obstacleStyle: {
      bg: "radial-gradient(circle at 38% 35%, #57534e 0%, #292524 75%, #1c1917 100%)",
      border: "rgba(168, 162, 158, 0.55)",
      text: "#e7e5e4",
      shadow: "inset 0 0 12px rgba(0, 0, 0, 0.55), 0 4px 10px rgba(0,0,0,0.35)",
    },
    rankStyles: [
      { bg: "linear-gradient(135deg, #f3ece4, #eee4da)", text: "#574f48", border: "rgba(255, 255, 255, 0.65)", shadow: "0 3px 8px rgba(60, 50, 40, 0.14)" },
      { bg: "linear-gradient(135deg, #f3e4cb, #ede0c8)", text: "#574f48", border: "rgba(255, 255, 255, 0.6)", shadow: "0 3px 10px rgba(60, 50, 40, 0.16)" },
      { bg: "linear-gradient(135deg, #f5b983, #f2b179)", text: "#ffffff", border: "rgba(255, 240, 220, 0.45)", shadow: "0 4px 12px rgba(242, 177, 121, 0.38)" },
      { bg: "linear-gradient(135deg, #f79d6e, #f59563)", text: "#ffffff", border: "rgba(255, 235, 215, 0.45)", shadow: "0 5px 14px rgba(245, 149, 99, 0.42)" },
      { bg: "linear-gradient(135deg, #f8856c, #f67c5f)", text: "#ffffff", border: "rgba(255, 225, 215, 0.48)", shadow: "0 6px 16px rgba(246, 124, 95, 0.45)" },
      { bg: "linear-gradient(135deg, #f76b48, #f65e3b)", text: "#ffffff", border: "rgba(255, 220, 210, 0.5)", shadow: "0 6px 18px rgba(246, 94, 59, 0.48)" },
      { bg: "linear-gradient(135deg, #f1d47e, #edcf72)", text: "#3b2c06", border: "rgba(255, 255, 255, 0.72)", shadow: "0 6px 18px rgba(237, 207, 114, 0.45)", glow: "0 0 18px rgba(237, 207, 114, 0.4)" },
      { bg: "linear-gradient(135deg, #f0cf6b, #edcc61)", text: "#3b2c06", border: "rgba(255, 255, 255, 0.75)", shadow: "0 8px 20px rgba(237, 204, 97, 0.48)", glow: "0 0 22px rgba(237, 204, 97, 0.45)" },
      { bg: "linear-gradient(135deg, #f0ca59, #edc850)", text: "#382804", border: "rgba(255, 255, 255, 0.8)", shadow: "0 8px 22px rgba(237, 200, 80, 0.52)", glow: "0 0 24px rgba(237, 200, 80, 0.48)" },
      { bg: "linear-gradient(135deg, #f0c748, #edc53f)", text: "#332203", border: "rgba(255, 255, 255, 0.85)", shadow: "0 10px 24px rgba(237, 197, 63, 0.56)", glow: "0 0 28px rgba(237, 197, 63, 0.55)", shimmer: true },
      { bg: "linear-gradient(135deg, #f6d344 0%, #edc22e 60%, #d97706 100%)", text: "#2c1b02", border: "rgba(255, 255, 255, 0.92)", shadow: "0 12px 30px rgba(237, 194, 46, 0.65)", glow: "0 0 36px rgba(237, 194, 46, 0.7)", shimmer: true },
      { bg: "linear-gradient(135deg, #3c3a32, #292722)", text: "#fef9c3", border: "rgba(253, 224, 71, 0.65)", shadow: "0 12px 32px rgba(41, 39, 34, 0.55)", glow: "0 0 32px rgba(253, 224, 71, 0.45)", shimmer: true },
      { bg: "linear-gradient(135deg, #1f1e1a, #11100e)", text: "#fde047", border: "rgba(250, 204, 21, 0.75)", shadow: "0 12px 34px rgba(17, 16, 14, 0.6)", glow: "0 0 36px rgba(250, 204, 21, 0.5)", shimmer: true },
      { bg: "linear-gradient(135deg, #7c2d12, #431407)", text: "#ffedd5", border: "rgba(253, 186, 116, 0.7)", shadow: "0 12px 34px rgba(67, 20, 7, 0.55)", glow: "0 0 36px rgba(251, 146, 60, 0.5)", shimmer: true },
      { bg: "linear-gradient(135deg, #b91c1c, #7f1d1d)", text: "#fef2f2", border: "rgba(254, 202, 202, 0.75)", shadow: "0 12px 34px rgba(127, 29, 29, 0.58)", glow: "0 0 38px rgba(239, 68, 68, 0.55)", shimmer: true },
      { bg: "linear-gradient(135deg, #0f766e, #115e59)", text: "#f0fdfa", border: "rgba(153, 246, 228, 0.75)", shadow: "0 12px 34px rgba(17, 94, 89, 0.58)", glow: "0 0 38px rgba(45, 212, 191, 0.55)", shimmer: true },
      { bg: "linear-gradient(135deg, #6d28d9, #4c1d95)", text: "#f5f3ff", border: "rgba(221, 214, 254, 0.78)", shadow: "0 12px 34px rgba(76, 29, 149, 0.6)", glow: "0 0 40px rgba(167, 139, 250, 0.6)", shimmer: true },
      { bg: "linear-gradient(135deg, #fef08a, #f59e0b)", text: "#291402", border: "rgba(255, 255, 255, 0.98)", shadow: "0 14px 40px rgba(245, 158, 11, 0.7)", glow: "0 0 46px rgba(254, 240, 138, 0.8)", shimmer: true },
    ],
  },
};

export function getTileVisualStyle(
  theme: Theme2048,
  value: number,
  variant: GameVariant
): TileVisualStyle {
  if (value < 0) {
    return {
      bg: theme.obstacleStyle.bg,
      text: theme.obstacleStyle.text,
      border: theme.obstacleStyle.border,
      shadow: theme.obstacleStyle.shadow,
    };
  }
  const rank = tileRank(value, variant);
  const clamped = Math.max(0, Math.min(theme.rankStyles.length - 1, rank));
  return theme.rankStyles[clamped];
}
