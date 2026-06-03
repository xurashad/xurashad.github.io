import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        cosmos: {
          50:  "#eef0f7",
          100: "#d5d9ee",
          200: "#aab3dd",
          300: "#7f8dcc",
          400: "#5467bb",
          500: "#2941aa",
          600: "#213488",
          700: "#192766",
          800: "#101a44",
          900: "#080d22",
          950: "#0a0a0f",
        },
        // Palestinian flag tones — Olive Green
        olive: {
          50:  "#f4f7ee",
          100: "#e5eccc",
          200: "#c9d998",
          300: "#a8c261",
          400: "#8bac35",
          500: "#6b8f27",
          600: "#537120",
          700: "#3e541a",
          800: "#293714",
          900: "#141b0a",
          DEFAULT: "#6b8f27",
        },
        // Palestinian flag — Crimson Red
        crimson: {
          50:  "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#dc143c",
          600: "#b91c1c",
          700: "#991b1b",
          800: "#7f1d1d",
          900: "#450a0a",
          DEFAULT: "#dc143c",
        },
        // Nebula purple — CELESTIAL MIRAGE
        nebula: {
          50:  "#f3e8ff",
          100: "#e9d5ff",
          200: "#d8b4fe",
          300: "#c084fc",
          400: "#a855f7",
          500: "#9333ea",
          600: "#7b2ff7",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#3b0764",
          DEFAULT: "#9333ea",
        },
        // Aurora indigo — CELESTIAL MIRAGE
        aurora: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          DEFAULT: "#6366f1",
        },
        // Stardust shimmer
        stardust: {
          DEFAULT: "#e0c3fc",
          warm: "#fbc2eb",
        },
        // Dark matter black
        void: {
          DEFAULT: "#050510",
          50:  "#1a1a2e",
          100: "#16213e",
          200: "#0f3460",
        },
        // Photon white
        photon: {
          DEFAULT: "#f8f9fa",
          dim:     "#e9ecef",
          muted:   "#adb5bd",
        },
        // Quantum accent — electric blue/teal
        quantum: {
          50:  "#e0f7ff",
          100: "#b2edff",
          200: "#66d9ff",
          300: "#00c3f5",
          400: "#00a8d6",
          500: "#0088b3",
          600: "#006a8e",
          700: "#004d69",
          800: "#003144",
          900: "#001522",
          DEFAULT: "#00c3f5",
        },
      },
      fontFamily: {
        sans:  ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        mono:  ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "quantum-grid":
          "linear-gradient(rgba(0,195,245,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,195,245,0.06) 1px, transparent 1px)",
        "keffiyeh-grid":
          "linear-gradient(rgba(0,195,245,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,195,245,0.04) 1px, transparent 1px), linear-gradient(rgba(107,143,39,0.04) 2px, transparent 2px), linear-gradient(90deg, rgba(107,143,39,0.04) 2px, transparent 2px)",
        "olive-gradient":
          "linear-gradient(135deg, #3e541a 0%, #6b8f27 50%, #a8c261 100%)",
        "cosmos-gradient":
          "linear-gradient(135deg, #050510 0%, #101a44 50%, #080d22 100%)",
        "crimson-glow":
          "radial-gradient(ellipse at center, rgba(220,20,60,0.15) 0%, transparent 70%)",
        "quantum-glow":
          "radial-gradient(ellipse at center, rgba(0,195,245,0.12) 0%, transparent 70%)",
        "nebula-gradient":
          "linear-gradient(135deg, rgba(147,51,234,0.15) 0%, rgba(99,102,241,0.1) 50%, rgba(0,195,245,0.08) 100%)",
        "celestial-gradient":
          "linear-gradient(135deg, #050510 0%, #1a0a2e 25%, #0f1a3e 50%, #050510 100%)",
        "aurora-gradient":
          "linear-gradient(135deg, rgba(147,51,234,0.12) 0%, rgba(99,102,241,0.08) 33%, rgba(0,195,245,0.1) 66%, rgba(192,132,252,0.08) 100%)",
      },
      backgroundSize: {
        "grid-sm": "20px 20px",
        "grid-md": "40px 40px",
        "grid-lg": "60px 60px",
        "keffiyeh": "40px 40px, 40px 40px, 10px 10px, 10px 10px",
      },
      keyframes: {
        // Particle float
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)", opacity: "0.7" },
          "33%":       { transform: "translateY(-20px) rotate(120deg)", opacity: "1" },
          "66%":       { transform: "translateY(-10px) rotate(240deg)", opacity: "0.8" },
        },
        // Orbital spin
        orbit: {
          "0%":   { transform: "rotate(0deg) translateX(var(--orbit-radius, 60px)) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(var(--orbit-radius, 60px)) rotate(-360deg)" },
        },
        // Wave pulse
        wave: {
          "0%, 100%": { transform: "scaleY(1)" },
          "50%":      { transform: "scaleY(0.3)" },
        },
        // Quantum shimmer
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // Pulse ring
        pulseRing: {
          "0%":   { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        // Gradient shift
        gradientShift: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        // Slide in from left
        slideInLeft: {
          "0%":   { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        // Typing blink
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
        // Particle drift
        drift: {
          "0%":   { transform: "translate(0, 0) scale(1)", opacity: "0" },
          "10%":  { opacity: "1" },
          "90%":  { opacity: "1" },
          "100%": { transform: "translate(var(--drift-x, 200px), var(--drift-y, -300px)) scale(0)", opacity: "0" },
        },
        // Glow pulse
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(0,195,245,0.3), 0 0 10px rgba(0,195,245,0.1)" },
          "50%":      { boxShadow: "0 0 20px rgba(0,195,245,0.6), 0 0 40px rgba(0,195,245,0.3)" },
        },
        // CELESTIAL MIRAGE keyframes
        twinkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%":      { opacity: "1", transform: "scale(1.3)" },
        },
        nebulaPulse: {
          "0%, 100%": { opacity: "0.15", transform: "scale(1)" },
          "50%":      { opacity: "0.35", transform: "scale(1.08)" },
        },
        auroraShift: {
          "0%":   { backgroundPosition: "0% 50%", filter: "hue-rotate(0deg)" },
          "33%":  { backgroundPosition: "50% 100%", filter: "hue-rotate(15deg)" },
          "66%":  { backgroundPosition: "100% 50%", filter: "hue-rotate(-10deg)" },
          "100%": { backgroundPosition: "0% 50%", filter: "hue-rotate(0deg)" },
        },
        cosmicDrift: {
          "0%":   { transform: "translate(0, 0) rotate(0deg)" },
          "25%":  { transform: "translate(30px, -20px) rotate(2deg)" },
          "50%":  { transform: "translate(-10px, 15px) rotate(-1deg)" },
          "75%":  { transform: "translate(-25px, -10px) rotate(1.5deg)" },
          "100%": { transform: "translate(0, 0) rotate(0deg)" },
        },
        nebulaGlowPulse: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(147,51,234,0.3), 0 0 16px rgba(147,51,234,0.1)" },
          "50%":      { boxShadow: "0 0 25px rgba(147,51,234,0.6), 0 0 50px rgba(147,51,234,0.25)" },
        },
      },
      animation: {
        float:            "float 6s ease-in-out infinite",
        "float-slow":     "float 10s ease-in-out infinite",
        "float-fast":     "float 4s ease-in-out infinite",
        orbit:            "orbit 12s linear infinite",
        "orbit-slow":     "orbit 20s linear infinite",
        "orbit-reverse":  "orbit 15s linear infinite reverse",
        wave:             "wave 1.2s ease-in-out infinite",
        shimmer:          "shimmer 2s linear infinite",
        "pulse-ring":     "pulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "slide-in-left":  "slideInLeft 0.5s ease-out forwards",
        blink:            "blink 1s step-start infinite",
        drift:            "drift 8s ease-in infinite",
        "glow-pulse":     "glowPulse 3s ease-in-out infinite",
        twinkle:          "twinkle 3s ease-in-out infinite",
        "nebula-pulse":   "nebulaPulse 8s ease-in-out infinite",
        "aurora-shift":   "auroraShift 12s ease infinite",
        "cosmic-drift":   "cosmicDrift 20s ease-in-out infinite",
        "nebula-glow":    "nebulaGlowPulse 4s ease-in-out infinite",
      },
      boxShadow: {
        "glass":          "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        "quantum":        "0 0 20px rgba(0,195,245,0.4), 0 0 40px rgba(0,195,245,0.2)",
        "olive-glow":     "0 0 20px rgba(107,143,39,0.4), 0 0 40px rgba(107,143,39,0.2)",
        "crimson-glow":   "0 0 20px rgba(220,20,60,0.4), 0 0 40px rgba(220,20,60,0.2)",
        "card-dark":      "0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset",
        "card-light":     "0 4px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
        "nebula":         "0 0 20px rgba(147,51,234,0.4), 0 0 40px rgba(147,51,234,0.2)",
        "aurora":         "0 0 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.2)",
        "celestial":      "0 0 15px rgba(0,195,245,0.3), 0 0 30px rgba(147,51,234,0.2), 0 0 50px rgba(99,102,241,0.1)",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
