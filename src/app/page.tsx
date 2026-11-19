"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Atom, Database, BookOpen, FileText, User, Mail,
  ArrowRight, ChevronDown, Zap, Star, Code2, Sparkles,
  GitFork, Infinity as InfinityIcon, Calendar,
} from "lucide-react";
import { ParticleField } from "@/components/ParticleField";
import { WaveCanvas } from "@/components/WaveCanvas";
import { StarfieldCanvas } from "@/components/StarfieldCanvas";

/* ─── Typing Headline ─────────────────────────────────────────────────────── */
const TITLES = [
  "Theoretical Physicist",
  "Mathematician",
  "Data Scientist",
  "AI Enthusiast",
];

function TypedTitle() {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (pause) {
      const t = setTimeout(() => { setPause(false); setDeleting(true); }, 2000);
      return () => clearTimeout(t);
    }
    const full = TITLES[index % TITLES.length];
    const speed = deleting ? 40 : 80;

    const t = setTimeout(() => {
      if (!deleting) {
        const next = full.slice(0, display.length + 1);
        setDisplay(next);
        if (next === full) setPause(true);
      } else {
        const next = display.slice(0, -1);
        setDisplay(next);
        if (next === "") {
          setDeleting(false);
          setIndex((i) => i + 1);
        }
      }
    }, speed);

    return () => clearTimeout(t);
  }, [display, deleting, index, pause]);

  return (
    <span className="text-quantum font-mono">
      {display}
      <span className="animate-blink border-r-2 border-quantum ml-0.5">&nbsp;</span>
    </span>
  );
}

/* ─── Orbiting Atom with Celestial Enhancement ───────────────────────────── */
function AtomicOrbital() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">

      {/* Sacred geometry hexagon ring (outer) */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 320 320"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <polygon
          points="160,20 280,90 280,230 160,300 40,230 40,90"
          fill="none"
          stroke="rgba(147,51,234,0.08)"
          strokeWidth="1"
        />
        <polygon
          points="160,50 256,100 256,220 160,270 64,220 64,100"
          fill="none"
          stroke="rgba(99,102,241,0.06)"
          strokeWidth="0.5"
        />
        {/* Connecting lines */}
        <line x1="160" y1="20" x2="160" y2="50" stroke="rgba(0,195,245,0.05)" strokeWidth="0.3" />
        <line x1="280" y1="90" x2="256" y2="100" stroke="rgba(0,195,245,0.05)" strokeWidth="0.3" />
        <line x1="280" y1="230" x2="256" y2="220" stroke="rgba(0,195,245,0.05)" strokeWidth="0.3" />
        <line x1="160" y1="300" x2="160" y2="270" stroke="rgba(0,195,245,0.05)" strokeWidth="0.3" />
        <line x1="40" y1="230" x2="64" y2="220" stroke="rgba(0,195,245,0.05)" strokeWidth="0.3" />
        <line x1="40" y1="90" x2="64" y2="100" stroke="rgba(0,195,245,0.05)" strokeWidth="0.3" />
      </motion.svg>

      {/* Nucleus glow backdrop */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-40 h-40 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(147,51,234,0.12) 0%, rgba(0,195,245,0.06) 50%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Orbital ring 1 — quantum cyan */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute rounded-full border border-quantum/25"
          style={{ width: "100%", height: "40%", transform: "rotateX(75deg)" }}
        />
      </motion.div>

      {/* Orbital ring 2 — nebula purple */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute rounded-full border border-nebula/20"
          style={{ width: "80%", height: "80%", transform: "rotateY(75deg)" }}
        />
      </motion.div>

      {/* Orbital ring 3 — aurora indigo */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute rounded-full border border-aurora/15"
          style={{ width: "90%", height: "90%", transform: "rotateX(60deg) rotateZ(45deg)" }}
        />
      </motion.div>

      {/* Orbital ring 4 — olive (keeping original) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute rounded-full border border-olive/12"
          style={{ width: "95%", height: "55%", transform: "rotateX(65deg) rotateZ(-30deg)" }}
        />
      </motion.div>

      {/* Electron 1 — quantum */}
      <motion.div
        className="absolute"
        style={{ top: "50%", left: "50%", marginTop: -4, marginLeft: -4 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          style={{ x: 80, y: 0 }}
          className="w-3 h-3 rounded-full bg-quantum"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="absolute inset-0 rounded-full bg-quantum blur-sm opacity-70" />
          <motion.div
            className="absolute inset-0 rounded-full bg-quantum/30 blur-md"
            animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>

      {/* Electron 2 — nebula purple */}
      <motion.div
        className="absolute"
        style={{ top: "50%", left: "50%", marginTop: -3, marginLeft: -3 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          style={{ x: 60, y: 0 }}
          className="w-2.5 h-2.5 rounded-full bg-nebula-400"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <div className="absolute inset-0 rounded-full bg-nebula blur-sm opacity-70" />
          <motion.div
            className="absolute inset-0 rounded-full bg-nebula/30 blur-md"
            animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
        </motion.div>
      </motion.div>

      {/* Electron 3 — aurora */}
      <motion.div
        className="absolute"
        style={{ top: "50%", left: "50%", marginTop: -3, marginLeft: -3 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2 }}
      >
        <motion.div
          style={{ x: 100, y: 0 }}
          className="w-2 h-2 rounded-full bg-aurora"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        >
          <div className="absolute inset-0 rounded-full bg-aurora blur-sm opacity-60" />
        </motion.div>
      </motion.div>

      {/* Electron 4 — stardust (new) */}
      <motion.div
        className="absolute"
        style={{ top: "50%", left: "50%", marginTop: -2, marginLeft: -2 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 3 }}
      >
        <motion.div
          style={{ x: 120, y: 0 }}
          className="w-1.5 h-1.5 rounded-full bg-stardust"
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <div className="absolute inset-0 rounded-full bg-stardust blur-sm opacity-50" />
        </motion.div>
      </motion.div>

      {/* Nucleus core — enhanced with nebula gradient */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(0,195,245,0.8), rgba(147,51,234,0.6), rgba(107,143,39,0.4))",
          }}
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: [
              "0 0 10px rgba(0,195,245,0.4), 0 0 20px rgba(147,51,234,0.2)",
              "0 0 25px rgba(0,195,245,0.6), 0 0 45px rgba(147,51,234,0.35)",
              "0 0 10px rgba(0,195,245,0.4), 0 0 20px rgba(147,51,234,0.2)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Atom size={26} className="text-white drop-shadow-lg" />
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Stats ───────────────────────────────────────────────────────────────── */
const STATS = [
  { value: "3+", label: "Research Papers", icon: Star },
  { value: "3", label: "Open Datasets", icon: Database },
  { value: "17", label: "Apps Built", icon: Code2 },
  { value: "∞", label: "Passion", icon: Zap },
];

/* ─── Quick Links ─────────────────────────────────────────────────────────── */
const QUICK_LINKS = [
  { href: "/apps", icon: Atom, label: "Apps", color: "text-quantum", bg: "bg-quantum/10", border: "hover:border-quantum/40", desc: "Software & tools" },
  { href: "/datasets", icon: Database, label: "Datasets", color: "text-nebula-300", bg: "bg-nebula/10", border: "hover:border-nebula/40", desc: "Research data nodes" },
  { href: "/blog", icon: BookOpen, label: "Blog", color: "text-quantum", bg: "bg-quantum/10", border: "hover:border-quantum/40", desc: "Thoughts & theory" },
  { href: "/documents", icon: FileText, label: "Documents", color: "text-aurora-400", bg: "bg-aurora/10", border: "hover:border-aurora/40", desc: "Papers & whitepapers" },
  { href: "/art", icon: Star, label: "Art", color: "text-aurora-400", bg: "bg-aurora/10", border: "hover:border-aurora/40", desc: "Artsy stuff" },
  { href: "/cv", icon: User, label: "CV", color: "text-olive-400", bg: "bg-olive/10", border: "hover:border-olive/40", desc: "Orbital career path" },
  //  { href: "/palestine", icon: Globe, label: "Palestine", color: "text-olive-300", bg: "bg-olive/10", border: "hover:border-olive/50", desc: "Cultural tribute 🇵🇸" },
  { href: "/contact", icon: Mail, label: "Contact", color: "text-stardust", bg: "bg-nebula/10", border: "hover:border-nebula/40", desc: "Quantum entanglement" },
];

/* ─── Equations ───────────────────────────────────────────────────────────── */
interface PhysicsEquation {
  id: string;
  label: string;
  domain: string;
  eq: string;
  color: string;
  insight: string;
  wavePrimary: [string, string, string];
  waveSecondary: [string, string, string];
  duration: number;
}

const EQUATIONS: PhysicsEquation[] = [
  {
    id: "yang-baxter",
    label: "Yang-Baxter",
    domain: "Integrable Models",
    eq: "R₁₂ R₁₃ R₂₃ = R₂₃ R₁₃ R₁₂",
    color: "text-quantum",
    insight: "Guarantees multi-particle scattering factorizes into two-body interactions, unlocking exact solvability in 1+1D quantum field theories.",
    wavePrimary: [
      "M0,30 C45,8 95,52 150,30 C205,8 255,52 300,30 C345,8 380,22 400,30",
      "M0,30 C45,52 95,8 150,30 C205,52 255,8 300,30 C345,52 380,38 400,30",
      "M0,30 C45,8 95,52 150,30 C205,8 255,52 300,30 C345,8 380,22 400,30",
    ],
    waveSecondary: [
      "M0,30 C40,20 80,40 120,30 C160,20 200,40 240,30 C280,20 320,40 360,30 C380,24 395,28 400,30",
      "M0,30 C40,40 80,20 120,30 C160,40 200,20 240,30 C280,40 320,20 360,30 C380,36 395,32 400,30",
      "M0,30 C40,20 80,40 120,30 C160,20 200,40 240,30 C280,20 320,40 360,30 C380,24 395,28 400,30",
    ],
    duration: 2.8,
  },
  {
    id: "lax",
    label: "Lax Connection",
    domain: "Classical Integrability",
    eq: "∂₊L₋ − ∂₋L₊ + [L₊, L₋] = 0",
    color: "text-nebula-300",
    insight: "Zero-curvature condition in light-cone coordinates whose monodromy matrix generates an infinite tower of conserved charges.",
    wavePrimary: [
      "M0,30 C60,12 120,48 200,30 C280,12 340,48 400,30",
      "M0,30 C60,48 120,12 200,30 C280,48 340,12 400,30",
      "M0,30 C60,12 120,48 200,30 C280,12 340,48 400,30",
    ],
    waveSecondary: [
      "M0,30 C50,24 100,36 160,30 C220,24 280,36 340,30 C370,27 385,29 400,30",
      "M0,30 C50,36 100,24 160,30 C220,36 280,24 340,30 C370,33 385,31 400,30",
      "M0,30 C50,24 100,36 160,30 C220,24 280,36 340,30 C370,27 385,29 400,30",
    ],
    duration: 3.4,
  },
  {
    id: "schrodinger",
    label: "Schrödinger",
    domain: "Quantum Mechanics",
    eq: "iℏ ∂ψ/∂t = Ĥψ",
    color: "text-aurora-400",
    insight: "Governs unitary time evolution of quantum states, linking energy eigenstates directly to interference frequencies.",
    wavePrimary: [
      "M0,30 C50,10 100,50 150,30 C200,10 250,50 300,30 C350,10 380,20 400,30",
      "M0,30 C50,50 100,10 150,30 C200,50 250,10 300,30 C350,50 380,40 400,30",
      "M0,30 C50,10 100,50 150,30 C200,10 250,50 300,30 C350,10 380,20 400,30",
    ],
    waveSecondary: [
      "M0,30 C40,22 80,38 120,30 C160,22 200,38 240,30 C280,22 320,38 360,30 C380,24 395,28 400,30",
      "M0,30 C40,38 80,22 120,30 C160,38 200,22 240,30 C280,38 320,22 360,30 C380,36 395,32 400,30",
      "M0,30 C40,22 80,38 120,30 C160,22 200,38 240,30 C280,22 320,38 360,30 C380,24 395,28 400,30",
    ],
    duration: 3.0,
  },
  {
    id: "dirac",
    label: "Dirac",
    domain: "Relativistic Fermions",
    eq: "(iγᵘ∂ᵤ − m)ψ = 0",
    color: "text-quantum",
    insight: "Unifies special relativity and quantum mechanics for spin-½ particles, naturally predicting spinors and antimatter.",
    wavePrimary: [
      "M0,30 C35,14 70,46 105,30 C140,14 175,46 210,30 C245,14 280,46 315,30 C350,14 375,40 400,30",
      "M0,30 C35,46 70,14 105,30 C140,46 175,14 210,30 C245,46 280,14 315,30 C350,46 375,20 400,30",
      "M0,30 C35,14 70,46 105,30 C140,14 175,46 210,30 C245,14 280,46 315,30 C350,14 375,40 400,30",
    ],
    waveSecondary: [
      "M0,30 C30,22 60,38 90,30 C120,22 150,38 180,30 C210,22 240,38 270,30 C300,22 330,38 360,30 C380,25 390,32 400,30",
      "M0,30 C30,38 60,22 90,30 C120,38 150,22 180,30 C210,38 240,22 270,30 C300,38 330,22 360,30 C380,35 390,28 400,30",
      "M0,30 C30,22 60,38 90,30 C120,22 150,38 180,30 C210,22 240,38 270,30 C300,22 330,38 360,30 C380,25 390,32 400,30",
    ],
    duration: 2.3,
  },
  {
    id: "polyakov",
    label: "Polyakov Action",
    domain: "String Theory",
    eq: "S = −T/2 ∫ d²σ √−h hᵃᵇ ∂ₐXᵘ ∂ᵦXᵤ",
    color: "text-olive-400",
    insight: "Describes a 1D string sweeping out a 2D worldsheet in target spacetime with Weyl and diffeomorphism invariance.",
    wavePrimary: [
      "M0,30 C80,6 160,54 240,30 C300,12 350,42 400,30",
      "M0,30 C80,54 160,6 240,30 C300,48 350,18 400,30",
      "M0,30 C80,6 160,54 240,30 C300,12 350,42 400,30",
    ],
    waveSecondary: [
      "M0,30 C55,16 110,44 175,30 C240,16 300,44 360,30 C380,24 392,28 400,30",
      "M0,30 C55,44 110,16 175,30 C240,44 300,16 360,30 C380,36 392,32 400,30",
      "M0,30 C55,16 110,44 175,30 C240,16 300,44 360,30 C380,24 392,28 400,30",
    ],
    duration: 3.8,
  },
];

/* ─── Featured Publications ───────────────────────────────────────────────── */
const FEATURED_PUBS = [
  {
    title: "Twists of Trigonometric Sigma Models",
    journal: "Journal of High Energy Physics",
    year: "2025",
    tags: ["Integrable Models", "σ-models", "Publication"],
    color: "border-nebula/30",
    link: "https://doi.org/10.1007/JHEP08(2025)090",
  },
];

/* ─── Featured Interactive Lab ────────────────────────────────────────────── */
const FEATURED_LAB_APPS = [
  {
    title: "Particle Physics Visualizer",
    category: "Scientific",
    desc: "Explore 49 particles across the Standard Model, Supersymmetry, and Hadrons — filter and sort by mass, charge, and spin.",
    href: "/apps/particle-physics",
    image: "/images/apps_backgrounds/particle-physics.jfif",
    icon: Atom,
    accent: "text-quantum border-quantum/25 hover:border-quantum/45",
  },
  {
    title: "Feynman Diagram Generator",
    category: "QFT · LaTeX",
    desc: "Compose interactive Feynman diagrams in the browser and export publication-ready TikZ LaTeX code or crisp SVGs.",
    href: "/apps/feynman-diagram",
    image: "/images/apps_backgrounds/feynman-diagram.jfif",
    icon: GitFork,
    accent: "text-nebula-300 border-nebula/25 hover:border-nebula/45",
  },
  {
    title: "Fractal Explorer",
    category: "Mathematics · WebGL2",
    desc: "GPU-accelerated fractal observatory spanning 10 complex families, DS64 deep zoom, 3D relief lighting, Orbit Probe Lyapunov analysis, and 4K export.",
    href: "/apps/fractal-explorer",
    image: "/images/apps_backgrounds/fractal-explorer.jfif",
    icon: InfinityIcon,
    accent: "text-aurora-400 border-aurora/25 hover:border-aurora/45",
  },
];

/* ─── Latest Longform Essays ──────────────────────────────────────────────── */
const FEATURED_ESSAYS = [
  {
    id: "physicists-toolkit-sanity-checks",
    title: "The Physicist's Toolkit: 7 Quick Tricks to Check Your Work When There's No Answer Key",
    category: "Theoretical Physics",
    date: "2026-11-09",
    image: "/images/blog/physicists-tricks/physicists-toolkit-hero.jpg",
    excerpt: "Dimensional analysis, compatibility conditions, extreme limits, and Noether symmetry checks for catching errors without an answer key.",
  },
  {
    id: "recommended-physics-reading-list",
    title: "The Theoretical Physicist's Roadmap: Recommended Books & Papers",
    category: "Reading Guides",
    date: "2026-11-01",
    image: "/images/blog/books/physics-library-cover.jpg",
    excerpt: "A curated pedagogical guide from Conformal Field Theory and Integrability to General Relativity, Supersymmetry, and Quantum Gravity.",
  },
  {
    id: "scale-of-the-universe",
    title: "From Planck to the Cosmic Web",
    category: "Cosmology",
    date: "2026-11-01",
    image: "/images/blog/scale/quantum-to-galaxy.jpg",
    excerpt: "Mapping 62 orders of magnitude from spacetime foam at 10⁻³⁵ m to the 93-billion-light-year observable cosmos.",
  },
  {
    id: "the-cosmic-calendar",
    title: "The Cosmic Calendar",
    category: "Cosmology",
    date: "2026-11-01",
    image: "/images/blog/calendar/cosmic-calendar-cover.jpg",
    excerpt: "Compressing 13.8 billion years of cosmic history into a single calendar year — where human history occupies the final ten seconds.",
  },
];

/* ─── Interactive Quantum State Analysis Card ────────────────────────────── */
function QuantumStateCard() {
  const [selectedId, setSelectedId] = useState<string>(EQUATIONS[0].id);
  const activeEq = EQUATIONS.find((e) => e.id === selectedId) ?? EQUATIONS[0];

  return (
    <motion.div
      className="glass-card p-6 sm:p-8 relative overflow-hidden"
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="text-xs font-mono text-foreground/40 tracking-widest">
          Ψ(x,t) — QUANTUM STATE ANALYSIS
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-quantum/10 text-quantum border border-quantum/25">
          {activeEq.domain}
        </span>
      </div>

      {/* Animated wave SVG modulated by selected equation */}
      <div className="relative h-24 mb-5 overflow-hidden rounded-lg bg-black/15 dark:bg-black/25 border border-foreground/5 dark:border-white/5">
        <svg
          key={activeEq.id}
          viewBox="0 0 400 60"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,195,245,0)" />
              <stop offset="20%" stopColor="rgba(0,195,245,0.85)" />
              <stop offset="50%" stopColor="rgba(147,51,234,0.75)" />
              <stop offset="80%" stopColor="rgba(99,102,241,0.65)" />
              <stop offset="100%" stopColor="rgba(107,143,39,0)" />
            </linearGradient>
            <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(147,51,234,0)" />
              <stop offset="30%" stopColor="rgba(147,51,234,0.45)" />
              <stop offset="70%" stopColor="rgba(99,102,241,0.35)" />
              <stop offset="100%" stopColor="rgba(0,195,245,0)" />
            </linearGradient>
          </defs>
          <motion.path
            d={activeEq.wavePrimary[0]}
            stroke="url(#wg1)"
            strokeWidth="2"
            fill="none"
            animate={{ d: activeEq.wavePrimary }}
            transition={{ duration: activeEq.duration, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d={activeEq.waveSecondary[0]}
            stroke="url(#wg2)"
            strokeWidth="1"
            fill="none"
            animate={{ d: activeEq.waveSecondary }}
            transition={{ duration: activeEq.duration * 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      {/* Interactive Equations List */}
      <div className="space-y-1.5" role="listbox" aria-label="Select physics equation">
        {EQUATIONS.map((eq) => {
          const isSelected = eq.id === activeEq.id;
          return (
            <motion.button
              key={eq.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => setSelectedId(eq.id)}
              whileHover={{ x: 4 }}
              className={`w-full flex items-center justify-between gap-3 text-xs font-mono px-3 py-2 rounded-lg border transition-all cursor-pointer text-left ${isSelected
                ? "bg-quantum/10 border-quantum/35 shadow-[0_0_16px_rgba(0,195,245,0.08)]"
                : "border-transparent hover:bg-nebula/5 hover:border-nebula/15"
                }`}
            >
              <span className={isSelected ? "text-foreground/85 font-semibold" : "text-foreground/45"}>
                {eq.label}
              </span>
              <span className={`${eq.color} tracking-wider truncate`}>{eq.eq}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Physical Insight Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEq.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-4 p-3.5 rounded-xl bg-foreground/[0.03] dark:bg-black/25 border border-foreground/10 dark:border-white/8"
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-quantum/80 mb-1">
            {"// "}{activeEq.label} · {activeEq.domain}
          </div>
          <p className="text-xs text-foreground/65 leading-relaxed">
            {activeEq.insight}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Decorative glows — celestial */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-nebula/8 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-aurora/8 blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-quantum/5 blur-xl pointer-events-none" />
    </motion.div>
  );
}

/* ─── Floating Cosmic Elements ───────────────────────────────────────────── */
function FloatingCosmicElements() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-[15%] left-[8%] w-3 h-3 border border-nebula/20 rotate-45"
        animate={{
          y: [-10, 10, -10],
          rotate: [45, 225, 45],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[35%] right-[12%] w-2 h-2 rounded-full bg-aurora/15"
        animate={{
          y: [0, -15, 0],
          x: [0, 8, 0],
          scale: [1, 1.5, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute bottom-[25%] left-[15%] w-4 h-4 border border-quantum/10 rounded-full"
        animate={{
          y: [0, -20, 0],
          scale: [1, 0.8, 1],
          opacity: [0.15, 0.4, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute top-[60%] right-[20%] w-1.5 h-1.5 bg-stardust/30 rounded-full"
        animate={{
          y: [0, -12, 0],
          opacity: [0.2, 0.6, 0.2],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute top-[80%] left-[40%]"
        animate={{ rotate: 360, opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <polygon points="10,0 12.5,7.5 20,10 12.5,12.5 10,20 7.5,12.5 0,10 7.5,7.5" fill="rgba(192,132,252,0.15)" />
        </svg>
      </motion.div>
    </div>
  );
}

/* ─── Main Hero Page ─────────────────────────────────────────────────────── */
export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOp = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={containerRef} className="relative overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center celestial-bg overflow-hidden">

        {/* Starfield (bottom layer) */}
        <StarfieldCanvas starCount={180} />

        {/* Canvas layers */}
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY, opacity: heroOp }}
        >
          <ParticleField count={80} />
          <WaveCanvas />
        </motion.div>

        {/* Nebula color blobs — static GPU-accelerated ambient layers */}
        <div
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-[100px] opacity-65 transform-gpu pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(147,51,234,0.12), transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-55 transform-gpu pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[140px] transform-gpu pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,195,245,0.06), rgba(147,51,234,0.04), transparent 60%)" }}
        />
        <div
          className="absolute top-[10%] right-[30%] w-60 h-60 rounded-full blur-[90px] opacity-45 transform-gpu pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(192,132,252,0.08), transparent 70%)" }}
        />

        {/* Floating cosmic elements */}
        <FloatingCosmicElements />

        {/* Content */}
        <div className="section-container relative z-10 py-20 w-full">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center min-h-[80vh]">

            {/* Left copy */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-nebula/20 text-xs font-mono text-quantum/80 mb-6"
              >
                <Sparkles size={12} className="text-nebula-300" />
                Physics × Math × Code
                <span className="w-2 h-2 rounded-full bg-nebula-400 animate-pulse" />
              </motion.div>

              {/* Name — English + Arabic */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                className="mb-4"
              >
                <h1 className="font-serif font-bold leading-tight text-center">
                  <span className="block text-5xl sm:text-6xl lg:text-7xl gradient-text-quantum">
                    Rashad Hamidi
                  </span>
                  <span
                    className="block text-4xl sm:text-5xl lg:text-6xl gradient-text-quantum overflow-visible pb-6"
                    style={{
                      fontFamily: '"DecoTypeThuluth", serif',
                      lineHeight: 1.6,
                      textAlign: "center",
                      direction: "rtl",
                    }}
                  >
                    رشاد حميدي
                  </span>
                </h1>
              </motion.div>

              {/* Typed subtitle */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-xl sm:text-2xl mb-5 h-8 font-light"
              >
                <TypedTitle />
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-base text-foreground/55 leading-relaxed mb-3 max-w-2xl"
              >
                I&apos;m a Theoretical Physicist. My work focuses on integrable models, string
                theory and quantum field theories. My hobbies are in the realms of programming
                and AI. My portfolio lives at the confluence of
                fundamental <span className="text-quantum font-medium">science</span>,
                tomorrow&apos;s <span className="text-nebula-300 font-medium">technologies</span>,
                and human <span className="text-aurora-400 font-medium">thought</span>.
                Welcome; feel free to explore and connect.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-xs text-foreground/35 font-mono mb-8 tracking-wide"
              >
                &gt; PhD Researcher · Theoretical Physics · Durham University · UK
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="flex flex-wrap gap-3"
              >
                <Link href="/apps">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(147,51,234,0.3), 0 0 50px rgba(0,195,245,0.2)" }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm"
                    style={{
                      background: "linear-gradient(135deg, #00c3f5 0%, #9333ea 50%, #6366f1 100%)",
                    }}
                  >
                    <Atom size={15} />
                    Explore My Work
                    <ArrowRight size={13} />
                  </motion.button>
                </Link>
                {/*<Link href="/palestine">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(107,143,39,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl glass border border-olive/30 hover:border-olive/60 text-foreground/80 hover:text-olive-400 font-semibold text-sm transition-all duration-300"
                  >
                    🌿 Palestine
                  </motion.button>
                </Link>*/}
                <Link href="/cv">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl glass border border-nebula/10 hover:border-nebula/30 text-foreground/60 hover:text-foreground font-semibold text-sm transition-all duration-300"
                  >
                    <User size={13} />
                    View CV
                  </motion.button>
                </Link>
              </motion.div>

              {/* Mini equations */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="flex flex-wrap gap-2 mt-8"
              >
                {EQUATIONS.map((eq) => (
                  <motion.span
                    key={eq.label}
                    className={`text-xs font-mono px-2 py-1 rounded-md glass border border-nebula/10 ${eq.color}`}
                    title={eq.label}
                    whileHover={{
                      borderColor: "rgba(147,51,234,0.3)",
                      boxShadow: "0 0 12px rgba(147,51,234,0.15)",
                    }}
                  >
                    {eq.eq}
                  </motion.span>
                ))}
              </motion.div>
            </div>

            {/* Right: Atomic Orbital */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="hidden xl:flex justify-center items-center"
            >
              <AtomicOrbital />
            </motion.div>
          </div>
        </div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-foreground/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{ delay: 2, duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] font-mono tracking-widest">SCROLL</span>
          <ChevronDown size={14} />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS STRIP
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-14 border-y border-nebula/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-nebula/5 via-transparent to-quantum/5" />
        <div className="absolute inset-0 aurora-gradient opacity-30" />
        <div className="section-container relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="text-center group"
                >
                  <div className="flex justify-center mb-2">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    >
                      <Icon size={16} className="text-foreground/30 group-hover:text-nebula-300 transition-colors duration-300" />
                    </motion.div>
                  </div>
                  <div className="text-4xl font-serif font-bold gradient-text-celestial mb-1">
                    {s.value}
                  </div>
                  <div className="text-xs text-foreground/40 uppercase tracking-widest">{s.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK LINKS GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 celestial-bg relative">
        <StarfieldCanvas starCount={80} />
        <div className="section-container relative z-10">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="text-xs font-mono text-nebula-300/50 tracking-widest uppercase mb-2">
              {"// Navigate the field"}
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Explore the <span className="gradient-text-celestial">Portfolio</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {QUICK_LINKS.map(({ href, icon: Icon, label, color, bg, border, desc }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, scale: 0.88 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
              >
                <Link href={href}>
                  <motion.div
                    whileHover={{
                      y: -6,
                      scale: 1.02,
                      boxShadow: "0 0 25px rgba(147,51,234,0.12), 0 0 40px rgba(0,195,245,0.08)",
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={`glass-card p-6 cursor-pointer group border border-white/5 ${border} transition-all duration-300`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${bg} border border-transparent group-hover:border-current flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110`}>
                      <Icon size={20} className={color} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{label}</h3>
                    <p className="text-xs text-foreground/35 leading-relaxed">{desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-foreground/25 group-hover:text-nebula-300 transition-colors duration-200">
                      <span>Open</span>
                      <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          ABOUT + QUANTUM CARD
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden">
        {/* Subtle cosmic background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-10 right-10 w-64 h-64 rounded-full blur-[80px]"
            style={{ background: "radial-gradient(circle, rgba(147,51,234,0.06), transparent 70%)" }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-10 left-10 w-48 h-48 rounded-full blur-[60px]"
            style={{ background: "radial-gradient(circle, rgba(0,195,245,0.05), transparent 70%)" }}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 8, repeat: Infinity, delay: 3 }}
          />
        </div>

        <FloatingCosmicElements />

        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: About text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="text-xs font-mono text-nebula-300/50 tracking-widest uppercase mb-3">
                {"// About Me"}
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-6 leading-tight">
                Theoretical Physics{" "}
                <span className="gradient-text-celestial">Researcher.</span>
              </h2>
              <div className="space-y-4 text-foreground/55 leading-relaxed text-sm sm:text-base">
                <p>
                  I am a PhD candidate in{" "}
                  <span className="text-quantum font-medium">theoretical physics</span>{" "}
                  at Durham University.
                  My research focuses on integrable field theories, and spans quantum field theories
                  and string theory.
                </p>
                {/*<p>
                  Beyond physics, I carry the identity of a{" "}
                  <span className="text-olive-400 font-medium">Palestinian</span> — a people
                  whose intellectual tradition, cultural resilience, and enduring presence
                  mirrors the most fundamental laws of nature: conserved, invariant, and
                  impossible to erase.
                </p>*/}
                <p>
                  This portfolio is my lab notebook, my archive, and my act of memory.
                </p>
              </div>
              <div className="mt-8 flex gap-4">
                <Link href="/cv">
                  <motion.button
                    whileHover={{ scale: 1.04, x: 4 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 text-sm font-semibold text-nebula-300 hover:text-nebula-200 transition-colors"
                  >
                    View full CV <ArrowRight size={14} />
                  </motion.button>
                </Link>
                <Link href="/contact">
                  <motion.button
                    whileHover={{ scale: 1.04, x: 4 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 text-sm font-semibold text-foreground/40 hover:text-foreground/70 transition-colors"
                  >
                    Say hello <Mail size={13} />
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Quantum equation card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative"
            >
              <QuantumStateCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED PUBLICATIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 celestial-bg relative">
        <div className="section-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="text-xs font-mono text-nebula-300/50 tracking-widest uppercase mb-2">
              {"// Recent Research"}
            </div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl font-serif font-bold">
                Featured <span className="gradient-text-celestial">Publications</span>
              </h2>
              <Link href="/documents" className="text-xs text-foreground/40 hover:text-nebula-300 transition-colors font-mono flex items-center gap-1">
                View all <ArrowRight size={10} />
              </Link>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-2xl">
            {FEATURED_PUBS.map((pub, i) => (
              <motion.div
                key={pub.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
              >
                <motion.a
                  href={(pub as { link?: string }).link ?? "/documents"}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -5, boxShadow: "0 0 30px rgba(147,51,234,0.12), 0 0 50px rgba(0,195,245,0.06)" }}
                  className={`glass-card p-6 h-full flex flex-col border ${pub.color} transition-all duration-300 hover:border-nebula/40 cursor-pointer block`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {pub.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-nebula/5 text-foreground/40 border border-nebula/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm font-semibold leading-snug mb-3 text-foreground/85">
                      {pub.title}
                    </h3>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-foreground/35 font-mono">
                    <span className="italic">{pub.journal}</span>
                    <span>{pub.year}</span>
                  </div>
                </motion.a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED INTERACTIVE LAB
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 relative border-t border-nebula/10">
        <div className="section-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="text-xs font-mono text-quantum/60 tracking-widest uppercase mb-2">
              {"// Browser-Native Science & Engineering"}
            </div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl font-serif font-bold">
                Featured <span className="gradient-text-quantum">Interactive Lab</span>
              </h2>
              <Link href="/apps" className="text-xs text-foreground/45 hover:text-quantum transition-colors font-mono flex items-center gap-1">
                All 23 apps <ArrowRight size={10} />
              </Link>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_LAB_APPS.map((app, i) => {
              const Icon = app.icon;
              return (
                <motion.div
                  key={app.href}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                >
                  <Link href={app.href} className="block h-full group">
                    <div className={`glass-card p-5 h-full flex flex-col border transition-all duration-300 ${app.accent}`}>
                      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-4 border border-foreground/10 dark:border-white/10 bg-black/40">
                        <Image
                          src={app.image}
                          alt={app.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-white/85 border border-white/15">
                          {app.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <Icon size={16} className="flex-shrink-0" />
                        <h3 className="font-semibold text-sm text-foreground/90 group-hover:text-quantum transition-colors">
                          {app.title}
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/55 leading-relaxed flex-1 mb-4">
                        {app.desc}
                      </p>
                      <div className="flex items-center gap-1 text-xs font-mono text-quantum/80 group-hover:gap-2 transition-all">
                        <span>Launch tool</span>
                        <ArrowRight size={11} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LATEST LONGFORM ESSAYS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 celestial-bg relative border-t border-nebula/10">
        <div className="section-container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="text-xs font-mono text-nebula-300/60 tracking-widest uppercase mb-2">
              {"// Essays & Research Notes"}
            </div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl font-serif font-bold">
                Latest <span className="gradient-text-celestial">Longform Essays</span>
              </h2>
              <Link href="/blog" className="text-xs text-foreground/45 hover:text-nebula-300 transition-colors font-mono flex items-center gap-1">
                Read all essays <ArrowRight size={10} />
              </Link>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURED_ESSAYS.map((essay, i) => (
              <motion.div
                key={essay.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
              >
                <Link href={`/blog/${essay.id}`} className="block h-full group">
                  <div className="glass-card p-5 h-full flex flex-col sm:flex-row gap-4 border border-foreground/10 dark:border-white/8 hover:border-quantum/40 transition-all duration-300">
                    <div className="relative w-full sm:w-40 aspect-[16/10] sm:aspect-square rounded-xl overflow-hidden flex-shrink-0 border border-foreground/10 dark:border-white/10">
                      <Image
                        src={essay.image}
                        alt={essay.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 160px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-foreground/45 mb-2">
                        <span className="px-2 py-0.5 rounded-full bg-quantum/10 text-quantum border border-quantum/25 uppercase">
                          {essay.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {essay.date}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-base leading-snug mb-2 text-foreground/90 group-hover:text-quantum transition-colors line-clamp-2">
                        {essay.title}
                      </h3>
                      <p className="text-xs text-foreground/55 leading-relaxed line-clamp-2 flex-1 mb-3">
                        {essay.excerpt}
                      </p>
                      <div className="flex items-center gap-1 text-xs font-mono text-quantum group-hover:gap-2 transition-all mt-auto">
                        <span>Read essay</span>
                        <ArrowRight size={11} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SOLIDARITY BANNER
      ═══════════════════════════════════════════════════════════════════
      <section className="py-16 relative overflow-hidden">
        //Overlay//
        <div className="absolute inset-0 bg-gradient-to-r from-olive-50 via-white to-olive-50 dark:from-black dark:via-void-50 dark:to-black" />
        //Keffiyeh grid on top//
        <div className="absolute inset-0 keffiyeh-bg opacity-30 dark:opacity-60" />

        //Palestinian flag vertical stripes//
        <div className="absolute left-0 top-0 bottom-0 flex">
          <div className="w-3 bg-black/80" />
          <div className="w-3 bg-white/15" />
          <div className="w-3 bg-olive/60" />
          <div className="w-3 bg-crimson/60" />
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex">
          <div className="w-3 bg-crimson/60" />
          <div className="w-3 bg-olive/60" />
          <div className="w-3 bg-white/15" />
          <div className="w-3 bg-black/80" />
        </div>
        
        <div className="section-container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="text-4xl mb-2">🇵🇸</div>
            <p className="text-2xl sm:text-3xl font-serif text-foreground dark:text-white font-bold leading-tight">
              <span className="text-olive-400">Palestine</span> will be{" "}
              <span className="text-crimson">free</span>.
            </p>
            <p className="text-sm text-foreground/40 dark:text-white/40 font-mono max-w-lg mx-auto leading-relaxed">
              Science cannot be separated from conscience.
              Knowledge without justice is noise.
              <br className="hidden sm:block" />
              The wave-function of justice does not collapse — it only superimposes.
            </p>
            <Link href="/palestine">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(107,143,39,0.3)" }}
                whileTap={{ scale: 0.97 }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-olive/40 hover:border-olive/70 text-olive-400 text-sm font-semibold transition-all duration-300"
              >
                🌿 Explore the Palestine Tribute
                <ArrowRight size={13} />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section >
      */}
    </div >
  );
}
