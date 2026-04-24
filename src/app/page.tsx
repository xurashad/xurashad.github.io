"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Atom, Database, BookOpen, FileText, User, Globe, Mail,
  ArrowRight, ChevronDown, Zap, Star, Code2
} from "lucide-react";
import { ParticleField } from "@/components/ParticleField";
import { WaveCanvas } from "@/components/WaveCanvas";

/* ─── Typing Headline ─────────────────────────────────────────────────────── */
const TITLES = [
  "Theoretical Physicist",
  "Mathematician",
  "Data Scientist",
  "AI Enthusiast",
  "Palestinian Scholar",
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

/* ─── Orbiting Atom ───────────────────────────────────────────────────────── */
function AtomicOrbital() {
  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      {/* Nucleus */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {/* Orbital ring 1 */}
        <div
          className="absolute rounded-full border border-quantum/25"
          style={{ width: "100%", height: "40%", transform: "rotateX(75deg)" }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {/* Orbital ring 2 */}
        <div
          className="absolute rounded-full border border-olive/25"
          style={{ width: "80%", height: "80%", transform: "rotateY(75deg)" }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {/* Orbital ring 3 */}
        <div
          className="absolute rounded-full border border-crimson/15"
          style={{ width: "90%", height: "90%", transform: "rotateX(60deg) rotateZ(45deg)" }}
        />
      </motion.div>

      {/* Electron 1 */}
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
        </motion.div>
      </motion.div>

      {/* Electron 2 */}
      <motion.div
        className="absolute"
        style={{ top: "50%", left: "50%", marginTop: -3, marginLeft: -3 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <motion.div
          style={{ x: 60, y: 0 }}
          className="w-2.5 h-2.5 rounded-full bg-olive-400"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          <div className="absolute inset-0 rounded-full bg-olive blur-sm opacity-70" />
        </motion.div>
      </motion.div>

      {/* Electron 3 */}
      <motion.div
        className="absolute"
        style={{ top: "50%", left: "50%", marginTop: -3, marginLeft: -3 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 2 }}
      >
        <motion.div
          style={{ x: 100, y: 0 }}
          className="w-2 h-2 rounded-full bg-crimson"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
        >
          <div className="absolute inset-0 rounded-full bg-crimson blur-sm opacity-60" />
        </motion.div>
      </motion.div>

      {/* Nucleus core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-12 h-12 rounded-full bg-gradient-to-br from-quantum/80 to-olive/60 flex items-center justify-center"
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: [
              "0 0 10px rgba(0,195,245,0.4), 0 0 20px rgba(0,195,245,0.2)",
              "0 0 20px rgba(0,195,245,0.6), 0 0 40px rgba(0,195,245,0.3)",
              "0 0 10px rgba(0,195,245,0.4), 0 0 20px rgba(0,195,245,0.2)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Atom size={24} className="text-white" />
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
  { href: "/datasets", icon: Database, label: "Datasets", color: "text-olive-400", bg: "bg-olive/10", border: "hover:border-olive/40", desc: "Research data nodes" },
  { href: "/blog", icon: BookOpen, label: "Blog", color: "text-quantum", bg: "bg-quantum/10", border: "hover:border-quantum/40", desc: "Thoughts & theory" },
  { href: "/documents", icon: FileText, label: "Documents", color: "text-crimson", bg: "bg-crimson/10", border: "hover:border-crimson/40", desc: "Papers & whitepapers" },
  { href: "/cv", icon: User, label: "CV", color: "text-olive-400", bg: "bg-olive/10", border: "hover:border-olive/40", desc: "Orbital career path" },
  { href: "/palestine", icon: Globe, label: "Palestine", color: "text-olive-300", bg: "bg-olive/10", border: "hover:border-olive/50", desc: "Cultural tribute 🇵🇸" },
  { href: "/contact", icon: Mail, label: "Contact", color: "text-quantum", bg: "bg-quantum/10", border: "hover:border-quantum/40", desc: "Quantum entanglement" },
];

/* ─── Equations ───────────────────────────────────────────────────────────── */
const EQUATIONS = [
  { label: "Schrödinger", eq: "iℏ ∂ψ/∂t = Ĥψ", color: "text-quantum" },
  { label: "Dirac", eq: "(iγᵘ∂ᵤ − m)ψ = 0", color: "text-olive-400" },
  { label: "Klein-Gordon", eq: "(□ + m²)φ = 0", color: "text-quantum" },
  { label: "Resilience", eq: "∀t: Resilience(t) > 0", color: "text-crimson" },
];

/* ─── Featured Publications ───────────────────────────────────────────────── */
const FEATURED_PUBS = [
  {
    title: "Twists of Trigonometric Sigma Models",
    journal: "Journal of High Energy Physics",
    year: "2025",
    tags: ["Integrable Models", "σ-models", "Publication"],
    color: "border-quantum/30",
    link: "https://doi.org/10.1007/JHEP08(2025)090",
  },
];

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
      <section className="relative min-h-screen flex items-center keffiyeh-bg overflow-hidden">

        {/* Canvas layers */}
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY, opacity: heroOp }}
        >
          <ParticleField count={80} />
          <WaveCanvas />
        </motion.div>

        {/* Color blobs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-quantum/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-olive/8 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-crimson/3 blur-[120px] pointer-events-none" />

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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-quantum/20 text-xs font-mono text-quantum/80 mb-6"
              >
                <Zap size={12} className="text-quantum" />
                Physics × Palestine × Code
                <span className="w-2 h-2 rounded-full bg-olive-400 animate-pulse" />
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
                I explore the deepest mysteries of existence — from the theoretical physics
                of the cosmos to the philosophies that shape human reality.
                My heritage is Palestinian.
                My expertise is in theoretical physics.
                My work focuses on integrable models, string theory and quantum field theories.
                My hopies are in the realms of programming and AI.
                My philosophies are anything logical and humane.
                My portfolio lives at the confluence of
                fundamental <span className="text-quantum font-medium">science</span>,
                tomorrow's <span className="text-olive-400 font-medium">technologies</span>,
                and human <span className="text-crimson font-medium">thought</span>.
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
                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0,195,245,0.4)" }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-quantum to-quantum/70 text-white font-semibold text-sm"
                  >
                    <Atom size={15} />
                    Explore My Work
                    <ArrowRight size={13} />
                  </motion.button>
                </Link>
                <Link href="/palestine">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(107,143,39,0.3)" }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl glass border border-olive/30 hover:border-olive/60 text-foreground/80 hover:text-olive-400 font-semibold text-sm transition-all duration-300"
                  >
                    🌿 Palestine
                  </motion.button>
                </Link>
                <Link href="/cv">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl glass border border-white/10 hover:border-white/20 text-foreground/60 hover:text-foreground font-semibold text-sm transition-all duration-300"
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
                  <span
                    key={eq.label}
                    className={`text-xs font-mono px-2 py-1 rounded-md glass border border-white/5 ${eq.color}`}
                    title={eq.label}
                  >
                    {eq.eq}
                  </span>
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
      <section className="py-14 border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-quantum/3 via-transparent to-olive/3" />
        <div className="section-container">
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
                    <Icon size={16} className="text-foreground/30 group-hover:text-quantum transition-colors duration-300" />
                  </div>
                  <div className="text-4xl font-serif font-bold gradient-text-quantum mb-1">
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
      <section className="py-20 keffiyeh-bg">
        <div className="section-container">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">
              // Navigate the field
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Explore the <span className="gradient-text-quantum">Portoilo</span>
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
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={`glass-card p-6 cursor-pointer group border border-white/5 ${border} transition-all duration-300`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${bg} border border-transparent group-hover:border-current flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110`}>
                      <Icon size={20} className={color} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{label}</h3>
                    <p className="text-xs text-foreground/35 leading-relaxed">{desc}</p>
                    <div className="mt-4 flex items-center gap-1 text-xs text-foreground/25 group-hover:text-quantum transition-colors duration-200">
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
      <section className="py-24">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: About text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-3">
                // About Me
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-6 leading-tight">
                Physicist. Researcher.{" "}
                <span className="gradient-text-olive">Palestinian.</span>
              </h2>
              <div className="space-y-4 text-foreground/55 leading-relaxed text-sm sm:text-base">
                <p>
                  I am a PhD candidate in{" "}
                  <span className="text-quantum font-medium">theoretical physics</span> at Durham University.
                  My research focuses on integrable field theories, and spans quantum field theories and string theory.
                </p>
                <p>
                  Beyond physics, I carry the identity of a{" "}
                  <span className="text-olive-400 font-medium">Palestinian</span> — a people
                  whose intellectual tradition, cultural resilience, and enduring presence
                  mirrors the most fundamental laws of nature: conserved, invariant, and
                  impossible to erase.
                </p>
                <p>
                  This portfolio is my lab notebook, my archive, and my act of memory.
                </p>
              </div>
              <div className="mt-8 flex gap-4">
                <Link href="/cv">
                  <motion.button
                    whileHover={{ scale: 1.04, x: 4 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 text-sm font-semibold text-quantum hover:text-quantum/70 transition-colors"
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
              <motion.div
                className="glass-card p-8 relative overflow-hidden"
                whileHover={{ scale: 1.01 }}
              >
                <div className="text-xs font-mono text-foreground/25 mb-5 tracking-widest">
                  Ψ(x,t) — QUANTUM STATE ANALYSIS
                </div>

                {/* Animated wave SVG */}
                <div className="relative h-24 mb-6 overflow-hidden rounded-lg bg-black/10">
                  <svg
                    viewBox="0 0 400 60"
                    className="absolute inset-0 w-full h-full"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(0,195,245,0)" />
                        <stop offset="25%" stopColor="rgba(0,195,245,0.8)" />
                        <stop offset="75%" stopColor="rgba(107,143,39,0.8)" />
                        <stop offset="100%" stopColor="rgba(220,20,60,0)" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M0,30 C50,10 100,50 150,30 C200,10 250,50 300,30 C350,10 380,20 400,30"
                      stroke="url(#wg1)"
                      strokeWidth="2"
                      fill="none"
                      animate={{
                        d: [
                          "M0,30 C50,10 100,50 150,30 C200,10 250,50 300,30 C350,10 380,20 400,30",
                          "M0,30 C50,50 100,10 150,30 C200,50 250,10 300,30 C350,50 380,40 400,30",
                          "M0,30 C50,10 100,50 150,30 C200,10 250,50 300,30 C350,10 380,20 400,30",
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.path
                      d="M0,30 C40,22 80,38 120,30 C160,22 200,38 240,30 C280,22 320,38 360,30 C380,24 395,28 400,30"
                      stroke="rgba(107,143,39,0.4)"
                      strokeWidth="1"
                      fill="none"
                      animate={{
                        d: [
                          "M0,30 C40,22 80,38 120,30 C160,22 200,38 240,30 C280,22 320,38 360,30 C380,24 395,28 400,30",
                          "M0,30 C40,38 80,22 120,30 C160,38 200,22 240,30 C280,38 320,22 360,30 C380,36 395,32 400,30",
                          "M0,30 C40,22 80,38 120,30 C160,22 200,38 240,30 C280,22 320,38 360,30 C380,24 395,28 400,30",
                        ]
                      }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </svg>
                </div>

                {/* Equations */}
                <div className="space-y-3">
                  {EQUATIONS.map((eq) => (
                    <motion.div
                      key={eq.label}
                      className="flex items-center justify-between text-xs font-mono p-2 rounded-lg hover:bg-white/3 transition-colors"
                      whileHover={{ x: 4 }}
                    >
                      <span className="text-foreground/30">{eq.label}</span>
                      <span className={`${eq.color} tracking-wider`}>{eq.eq}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Decorative glows */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-quantum/8 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-olive/8 blur-2xl pointer-events-none" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED PUBLICATIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-20 keffiyeh-bg">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">
              // Recent Research
            </div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-3xl font-serif font-bold">
                Featured <span className="gradient-text-quantum">Publications</span>
              </h2>
              <Link href="/documents" className="text-xs text-foreground/40 hover:text-quantum transition-colors font-mono flex items-center gap-1">
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
                  whileHover={{ y: -5 }}
                  className={`glass-card p-6 h-full flex flex-col border ${pub.color} transition-all duration-300 hover:border-quantum/50 cursor-pointer block`}
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {pub.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-foreground/40 border border-white/10">
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
          SOLIDARITY BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 relative overflow-hidden">
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-olive-50 via-white to-olive-50 dark:from-black dark:via-void-50 dark:to-black" />
        {/* Keffiyeh grid on top */}
        <div className="absolute inset-0 keffiyeh-bg opacity-30 dark:opacity-60" />

        {/* Palestinian flag vertical stripes */}
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
      </section>
    </div>
  );
}
