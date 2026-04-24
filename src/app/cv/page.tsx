"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import {
  GraduationCap, Briefcase, Award, BookOpen,
  MapPin, Star, Globe, Code2, Zap,
  Download, ChevronRight, Atom, Mic2, Layers,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */
type EventType = "education" | "work" | "award" | "publication" | "talk" | "milestone";

interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  org: string;
  location: string;
  type: EventType;
  desc: string;
  tags?: string[];
  highlight?: boolean;
  link?: string;
}

/* ─── Real Data: Rashad Hamidi ────────────────────────────────────────────── */
const TIMELINE: TimelineEvent[] = [
  {
    id: "phd",
    year: "2022 – Present",
    title: "PhD — Mathematical and Theoretical Physics",
    org: "Durham University",
    location: "Durham, UK",
    type: "education",
    highlight: true,
    desc: "Doctoral research on integrable sigma models, their deformations, and connections to 4d Chern-Simons theory. Supervised by Prof. Ben Hoare. Focus: quantum groups, Yang-Baxter equations, and the mathematical structures underlying integrable systems.",
    tags: ["Integrable Models", "String Theory", "Supersymmetry", "QFT"],
  },
  {
    id: "jhep-paper",
    year: "2025",
    title: "Twists of Trigonometric Sigma Models",
    org: "Journal of High Energy Physics",
    location: "JHEP 2025, 90 (2025)",
    type: "publication",
    highlight: true,
    desc: "Peer-reviewed journal article co-authored with Prof. Ben Hoare. Constructs and classifies integrable 2d trigonometric ℤN-twisted σ-models via the 4d Chern-Simons framework.",
    tags: ["Publication", "Integrable Models", "σ-models"],
    link: "https://doi.org/10.1007/JHEP08(2025)090",
  },
  {
    id: "idd25",
    year: "2025",
    title: "Poster — Integrability, Dualities and Deformations (IDD25)",
    org: "Nordita",
    location: "Stockholm, Sweden",
    type: "talk",
    desc: "Poster presentation: ‘Integrable 2d trigonometric ℤN-twisted σ-models.’ International conference on integrable field theories and string theory dualities.",
    tags: ["Conference", "Poster", "Nordita"],
  },
  {
    id: "nbmps74",
    year: "2025",
    title: "Talk — North British Mathematical Physics Seminars (74th Edition)",
    org: "York University",
    location: "York, UK",
    type: "talk",
    highlight: true,
    desc: "‘Twists of trigonometric sigma models.’ Contributed talk at the long-running NBMPS series, presenting main PhD research results to the UK mathematical physics community.",
    tags: ["Seminar", "Talk", "UK Mathematical Physics"],
  },
  {
    id: "ta",
    year: "2023 – Present",
    title: "Teaching Assistant",
    org: "Durham University — Dept. of Mathematical Sciences",
    location: "Durham, UK",
    type: "work",
    highlight: true,
    desc: "Teaching across 10 modules spanning 5 terms: Discrete Mathematics, Analysis I, Maths for Engineers & Scientists, Single Mathematics A & B, Mathematical Physics II, Special Relativity & Electromagnetism II.",
    tags: ["Teaching", "Mathematics", "Physics"],
  },
  {
    id: "hep4p-talk",
    year: "2024",
    title: "Online Talk — High-Energy Physics for Palestine Seminars",
    org: "HEP for Palestine Group",
    location: "Online",
    type: "talk",
    desc: "‘Integrable models from 4d Chern-Simons action.’ Talk delivered to the HEP for Palestine community, connecting recent research to the broader physics community in solidarity.",
    tags: ["Talk", "Palestine", "4d CS Theory"],
  },
  {
    id: "msc",
    year: "2021 – 2022",
    title: "MSc in Particles, Strings and Cosmology (Distinction)",
    org: "Durham University",
    location: "Durham, UK",
    type: "education",
    highlight: true,
    desc: "One-year masters with Distinction. Covered QFT I & II, QED, Supersymmetry, General Relativity, String Theory, Conformal Field Theory, Standard Model, Scattering Amplitudes, AdS/CFT. Thesis: ‘BTZ Black Hole: Holographic Duality, Entropy, and AdS₃/CFT₂’ (supervised by Prof. Nabil Iqbal).",
    tags: ["MSc", "QFT", "String Theory", "AdS/CFT", "Distinction"],
  },
  {
    id: "msc-global-scholarship",
    year: "2021",
    title: "Global Masters Scholarship",
    org: "Durham University",
    location: "Durham, UK",
    type: "award",
    highlight: true,
    desc: "Competitive merit-based scholarship awarded by Durham University to fund MSc studies. Alongside: STFC Scholarship (2022) for PhD research.",
    tags: ["Scholarship", "Award"],
  },
  {
    id: "bsc",
    year: "2017 – 2021",
    title: "BSc in Physics (Minor: Mathematics) — Distinction",
    org: "Birzeit University",
    location: "Palestine 🇵🇸",
    type: "education",
    highlight: true,
    desc: "Four-year honours degree with Distinction. Coursework spans Classical/Quantum/Computational Mechanics, Electromagnetic Theory, Astronomy, Nanophysics, and full Mathematics minor. Thesis: ‘Fractional Quantum Mechanics’ (supervised by Prof. Sayyed-Ahmad). On the Honor List for all 8 consecutive terms (Fall 2017 – Spring 2021).",
    tags: ["BSc", "Physics", "Mathematics", "Birzeit", "Distinction", "Palestine"],
  },
  {
    id: "observatory",
    year: "2017 – 2021",
    title: "Astronomical Observatory Tour Guide",
    org: "Michel & Sanieh Hakim Observatory, Birzeit University",
    location: "Palestine 🇵🇸",
    type: "work",
    desc: "Led public observatory tours, operated the main telescope for planets/stars/nebulae/galaxies, delivered accessible astronomy presentations, and co-organised public outreach events (eclipse viewings, meteor showers).",
    tags: ["Astronomy", "Outreach", "Teaching"],
  },
  {
    id: "bzu-talk",
    year: "2021",
    title: "Talk — Physics Department Seminars",
    org: "Birzeit University",
    location: "Palestine 🇵🇸",
    type: "talk",
    desc: "‘Fractional Quantum Mechanics.’ Departmental seminar presenting BSc thesis research to peers and faculty.",
    tags: ["Talk", "Seminar", "Palestine"],
  },
  {
    id: "born",
    year: "Palestine",
    title: "Origin — رشاد حميدي",
    org: "Birzeit, Palestine",
    location: "Palestine 🇵🇸",
    type: "milestone",
    desc: "From Palestine to the world. Physics begins with curiosity; resilience keeps it going. The wavefunction of Palestinian scholarship has never collapsed.",
    tags: ["Origin", "Palestine"],
  },
];

/* ─── Type Config ─────────────────────────────────────────────────────────── */
const TYPE_CONFIG: Record<EventType, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string; bg: string; border: string; label: string;
}> = {
  education: { icon: GraduationCap, color: "text-quantum", bg: "bg-quantum/15", border: "border-quantum/30", label: "Education" },
  work: { icon: Briefcase, color: "text-olive-400", bg: "bg-olive/15", border: "border-olive/30", label: "Experience" },
  award: { icon: Award, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", label: "Award" },
  publication: { icon: BookOpen, color: "text-quantum", bg: "bg-quantum/10", border: "border-quantum/20", label: "Publication" },
  talk: { icon: Mic2, color: "text-olive-400", bg: "bg-olive/10", border: "border-olive/20", label: "Talk / Poster" },
  milestone: { icon: Star, color: "text-crimson", bg: "bg-crimson/10", border: "border-crimson/20", label: "Milestone" },
};

/* ─── Real Skills ─────────────────────────────────────────────────────────── */
const SKILLS = [
  { label: "QFT & String Theory", level: 95, color: "bg-quantum" },
  { label: "Integrable Systems & Yang-Baxter", level: 92, color: "bg-quantum" },
  { label: "Python & Mathematica", level: 88, color: "bg-olive-500" },
  { label: "LaTeX (Scientific Writing)", level: 96, color: "bg-quantum" },
  { label: "Web Dev (HTML/JS/CSS/PHP)", level: 80, color: "bg-olive-500" },
  { label: "3D Design (Blender/Unity/UE)", level: 72, color: "bg-olive-500" },
  { label: "Arabic (Native) / English (Fluent)", level: 100, color: "bg-crimson" },
  { label: "Teaching & Science Communication", level: 90, color: "bg-crimson" },
];

/* ─── Timeline Node ───────────────────────────────────────────────────────── */
function TimelineNode({ event, index, isLeft }: { event: TimelineEvent; index: number; isLeft: boolean }) {
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: isLeft ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.04, ease: [0.34, 1.56, 0.64, 1] }}
      className={`relative flex ${isLeft ? "lg:flex-row-reverse" : "lg:flex-row"} items-start gap-4 group`}
    >
      <div className={`flex-1 ${isLeft ? "lg:mr-8" : "lg:ml-8"}`}>
        <motion.div
          whileHover={{ scale: 1.015, y: -3 }}
          className={`glass-card p-5 border ${event.highlight ? cfg.border : "border-white/5"} transition-all duration-300 hover:${cfg.border} relative overflow-hidden`}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={14} className={cfg.color} />
              </div>
              <span className={`text-[10px] font-mono uppercase tracking-widest ${cfg.color} opacity-80`}>
                {cfg.label}
              </span>
            </div>
            <span className="text-[10px] font-mono text-foreground/30 whitespace-nowrap flex-shrink-0">{event.year}</span>
          </div>

          <h3 className="font-semibold text-sm sm:text-base leading-snug mb-1">{event.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/40 mb-3">
            <span className="font-medium text-foreground/60">{event.org}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><MapPin size={10} /> {event.location}</span>
          </div>

          <p className="text-xs text-foreground/50 leading-relaxed">{event.desc}</p>

          {event.link && (
            <a
              href={event.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1 text-[11px] mt-2 ${cfg.color} hover:opacity-70 transition-opacity font-mono`}
            >
              <Globe size={10} /> {event.link.replace("https://doi.org/", "doi:")}
            </a>
          )}

          {event.tags && (
            <div className="flex flex-wrap gap-1 mt-3">
              {event.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-foreground/35 border border-white/8 font-mono">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {event.highlight && (
            <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${cfg.bg}`}>
              <span className={`absolute inset-0 rounded-full animate-ping ${cfg.bg} opacity-50`} />
            </span>
          )}
        </motion.div>
      </div>

      {/* Centre dot — desktop only */}
      <div className="hidden lg:flex flex-col items-center justify-start pt-4 flex-shrink-0" style={{ zIndex: 20 }}>
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 20 }}
          className={`w-4 h-4 rounded-full ${cfg.bg} border-2 ${cfg.border}`}
        >
          {event.highlight && (
            <span className={`absolute w-4 h-4 rounded-full animate-ping ${cfg.bg} opacity-50`} />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Skill Bar ────────────────────────────────────────────────────────────── */
function SkillBar({ label, level, color, index }: { label: string; level: number; color: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
    >
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-foreground/60">{label}</span>
        <span className="font-mono text-foreground/35">{level}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.06 + 0.3, duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function CVPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative min-h-screen keffiyeh-bg">

      {/* Background glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-quantum/4 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-olive/5 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-3">
            // Curriculum Vitae
          </div>

          {/* Name + Arabic */}
          <div className="flex flex-wrap items-baseline gap-4 mb-3">
            <h1 className="text-5xl sm:text-6xl font-serif font-bold gradient-text-quantum">
              Rashad Hamidi
            </h1>
            <span
              className="text-5xl sm:text-6xl gradient-text-quantum overflow-visible"
              style={{
                fontFamily: '"DecoTypeThuluth", serif',
                lineHeight: 1.8,
                direction: "rtl",
                display: "inline-block",
                paddingBottom: "0.25rem",
              }}
            >رشاد حميدي</span>
          </div>

          <p className="text-xl text-foreground/55 mb-1">PhD Researcher — Theoretical Physics</p>
          <p className="text-sm text-foreground/35 font-mono mb-6">
            Integrable Models · String Theory · Supersymmetry
          </p>

          {/* Contact row */}
          <div className="flex flex-wrap gap-4 text-xs font-mono text-foreground/45 mb-6">
            <a href="mailto:xurashad@gmail.com" className="flex items-center gap-1 hover:text-quantum transition-colors">
              ✉ xurashad@gmail.com
            </a>
            <a href="https://xurashad.github.io/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-quantum transition-colors">
              🌐 xurashad.github.io
            </a>
            <a href="https://orcid.org/0000-0002-0719-3269" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-quantum transition-colors">
              🆔 ORCID 0000-0002-0719-3269
            </a>
            <a href="https://inspirehep.net/authors/2915639" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-quantum transition-colors">
              🔬 InspireHEP
            </a>
            <span className="flex items-center gap-1">
              <MapPin size={10} /> Newcastle upon Tyne, UK
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <a href="https://xurashad.github.io/" target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(0,195,245,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-quantum/20 border border-quantum/30 text-quantum text-sm font-semibold hover:bg-quantum/30 transition-all"
              >
                <Download size={14} /> View Full CV (PDF)
              </motion.button>
            </a>
            <a href="https://inspirehep.net/authors/2915639" target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-white/10 text-foreground/60 text-sm font-semibold transition-all"
              >
                <Globe size={14} /> InspireHEP Profile
              </motion.button>
            </a>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { icon: BookOpen, label: "1 JHEP Publication" },
              { icon: Mic2, label: "4 Talks & Posters" },
              { icon: Award, label: "9 Scholarships / Distinctions" },
              { icon: Zap, label: "Supervisor: Prof. Ben Hoare" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-foreground/40">
                <Icon size={14} className="text-quantum/60" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Legend ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-12">
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs text-foreground/40">
                <div className={`w-5 h-5 rounded-md ${cfg.bg} flex items-center justify-center`}>
                  <Icon size={11} className={cfg.color} />
                </div>
                {cfg.label}
              </div>
            );
          })}
        </div>

        {/* ── Profile blurb ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card border border-quantum/15 p-6 mb-16 relative overflow-hidden"
        >
          <div className="text-xs font-mono text-quantum/50 uppercase tracking-widest mb-3">// Research Profile</div>
          <p className="text-sm text-foreground/65 leading-relaxed max-w-4xl">
            My primary research interests lie in{" "}
            <span className="text-quantum font-medium">integrable systems</span>,{" "}
            <span className="text-olive-400 font-medium">supersymmetry</span>, and{" "}
            <span className="text-quantum font-medium">string theory</span>. I am particularly focused on
            exploring integrable sigma models, their deformations, and their connections to higher-dimensional
            gauge theories such as <span className="font-medium text-foreground/80">4d Chern-Simons theory</span>.
            My work involves studying the mathematical structures underlying these models — including
            quantum groups and Yang-Baxter equations — and investigating their physical applications.
            I am currently a PhD student in the Mathematical and Theoretical Physics group at{" "}
            <span className="text-foreground/80 font-medium">Durham University</span>, supervised by{" "}
            <a href="https://www.benhoare.info/" target="_blank" rel="noopener noreferrer" className="text-quantum hover:text-quantum/70 underline transition-colors">
              Prof. Ben Hoare
            </a>. Expected completion: August 2026.
          </p>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-quantum/6 blur-3xl pointer-events-none" />
        </motion.div>

        {/* ── Orbital Timeline ────────────────────────────────────────── */}
        <div className="relative mb-20">

          {/* Central gradient line (desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, transparent, rgba(0,195,245,0.4) 10%, rgba(107,143,39,0.3) 50%, rgba(220,20,60,0.2) 90%, transparent)",
              }}
              initial={{ scaleY: 0, originY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {/* Travelling particle */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-quantum"
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <div className="absolute inset-0 rounded-full bg-quantum blur-sm animate-ping opacity-50" />
            </motion.div>
          </div>

          <div className="space-y-8 lg:space-y-10">
            {TIMELINE.map((event, i) => (
              <div
                key={event.id}
                className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-0 items-start"
              >
                {i % 2 === 0 ? (
                  <>
                    <TimelineNode event={event} index={i} isLeft={true} />
                    <div className="hidden lg:flex flex-col items-center justify-start pt-4" style={{ zIndex: 20 }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                        className={`w-4 h-4 rounded-full ${TYPE_CONFIG[event.type].bg} border-2 ${TYPE_CONFIG[event.type].border}`}
                      />
                    </div>
                    <div className="hidden lg:block" />
                  </>
                ) : (
                  <>
                    <div className="hidden lg:block" />
                    <div className="hidden lg:flex flex-col items-center justify-start pt-4" style={{ zIndex: 20 }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 20 }}
                        className={`w-4 h-4 rounded-full ${TYPE_CONFIG[event.type].bg} border-2 ${TYPE_CONFIG[event.type].border}`}
                      />
                    </div>
                    <TimelineNode event={event} index={i} isLeft={false} />
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Origin marker */}
          <motion.div
            className="hidden lg:flex justify-center mt-10"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-crimson/40 to-olive/40 border border-crimson/30 flex items-center justify-center">
                <Atom size={15} className="text-crimson" />
              </div>
              <span className="text-xs font-mono text-foreground/25">Palestine 🇵🇸</span>
            </div>
          </motion.div>
        </div>

        {/* ── Skills + Profile Info ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">

          {/* Skills */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// Competencies</div>
              <h2 className="text-2xl font-serif font-bold">
                Skills & <span className="gradient-text-quantum">Expertise</span>
              </h2>
            </motion.div>
            <div className="space-y-4">
              {SKILLS.map((s, i) => <SkillBar key={s.label} {...s} index={i} />)}
            </div>
          </div>

          {/* Profile card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// Profile</div>
            <h2 className="text-2xl font-serif font-bold mb-6">
              Quick <span className="gradient-text-olive">Facts</span>
            </h2>

            <div className="glass-card p-6 space-y-3.5">
              {[
                { label: "Current Position", value: "PhD Researcher, Theoretical Physics" },
                { label: "Institution", value: "Durham University, UK" },
                { label: "Research Focus", value: "Integrable σ-models, String Theory, Yang-Baxter" },
                { label: "Supervisor", value: "Prof. Ben Hoare" },
                { label: "Expected PhD", value: "August 2026" },
                { label: "Location", value: "Newcastle upon Tyne, UK" },
                { label: "Languages", value: "Arabic (native), English (fluent)" },
                { label: "Nationality", value: "Palestinian 🇵🇸" },
                { label: "Email", value: "xurashad@gmail.com" },
                { label: "Website", value: "xurashad.github.io" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm border-b border-white/3 pb-3 last:border-0 last:pb-0">
                  <span className="text-foreground/30 font-mono text-xs w-32 flex-shrink-0">{label}</span>
                  <span className="text-foreground/70">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Awards & Scholarships ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// Honours</div>
          <h2 className="text-2xl font-serif font-bold mb-8">
            Awards & <span className="gradient-text-olive">Scholarships</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { title: "STFC Scholarship", org: "Durham University", year: "2022", accent: "quantum" as const },
              { title: "MSc Distinction Certificate", org: "Durham University", year: "2022", accent: "quantum" as const },
              { title: "Global Masters Scholarship", org: "Durham University", year: "2021", accent: "quantum" as const },
              { title: "BSc Distinction Certificate", org: "Birzeit University", year: "2021", accent: "olive" as const },
              { title: "Mosa Naser Scholarship for Physics", org: "Birzeit University", year: "2018–2021 (×3)", accent: "olive" as const },
              { title: "Science Faculty Scholarship", org: "Birzeit University", year: "2017/2018", accent: "olive" as const },
              { title: "Paltel Scholarship", org: "Paltel Group", year: "2017", accent: "olive" as const },
              { title: "Honor Scholarship", org: "Birzeit University", year: "7 terms", accent: "crimson" as const },
              { title: "Honor Roll (8 consecutive terms)", org: "Birzeit University", year: "2017–2021", accent: "crimson" as const },
            ].map((award, i) => {
              const borderClass = award.accent === "quantum" ? "border-quantum/20 hover:border-quantum/40" : award.accent === "olive" ? "border-olive/20 hover:border-olive/40" : "border-crimson/20 hover:border-crimson/40";
              const textClass = award.accent === "quantum" ? "text-quantum" : award.accent === "olive" ? "text-olive-400" : "text-crimson";
              return (
                <motion.div
                  key={award.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={`flex items-start gap-3 p-4 rounded-xl glass border ${borderClass} transition-all duration-300`}
                >
                  <Award size={14} className={`${textClass} flex-shrink-0 mt-0.5`} />
                  <div>
                    <p className="text-sm font-medium text-foreground/80">{award.title}</p>
                    <p className="text-xs text-foreground/35 font-mono mt-0.5">{award.org} · {award.year}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Groups & Memberships ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// Community</div>
          <h2 className="text-2xl font-serif font-bold mb-6">
            Groups & <span className="gradient-text-quantum">Memberships</span>
          </h2>
          <div className="space-y-3">
            {[
              { name: "Ben Hoare Integrability Group, Durham University", period: "2022 – Present" },
              { name: "Mathematical and Theoretical Physics Group, Durham University", period: "2022 – Present" },
              { name: "High Energy Physics for Palestine Group", period: "2022 – Present" },
              { name: "Centre of Particle Theory (CPT), Durham University", period: "2021 – Present" },
              { name: "Physics Club & Astronomy Club, Birzeit University", period: "2017 – 2021" },
            ].map((g, i) => (
              <motion.div
                key={g.name}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center justify-between gap-4 p-3.5 rounded-xl glass border border-white/5 hover:border-quantum/20 transition-all duration-300"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-quantum/60 flex-shrink-0" />
                  <span className="text-sm text-foreground/70">{g.name}</span>
                </div>
                <span className="text-xs font-mono text-foreground/30 flex-shrink-0">{g.period}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Conferences, Workshops & Schools ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// Events</div>
          <h2 className="text-2xl font-serif font-bold mb-8">
            Conferences, Workshops &amp; <span className="gradient-text-quantum">Schools</span>
          </h2>

          <div className="space-y-2.5 mb-10">
            {[
              { name: "North British Mathematical Physics Seminars", detail: "6 editions: 75 Durham 2025, 74 York 2025, 72 Durham 2024, 71 York 2024, 69 Durham 2023, 66 Durham 2022" },
              { name: "Integrability, Dualities and Deformations Conference", detail: "3 editions: Nordita 2025; Swansea 2024; Durham 2023" },
              { name: "Integrability in Gauge and String Theory", detail: "2 editions: King's College London 2025; ETH Zurich 2023" },
              { name: "Durham Hackathon (DurHack) 2024", detail: "Durham University, 2024" },
              { name: "Paths to Quantum Field Theory Workshop", detail: "2 editions: Durham 2023, Durham 2022" },
              { name: "Young Researchers Integrability School and Workshop", detail: "Durham University, 2023" },
              { name: "Meteorology Conference", detail: "Birzeit University, 2020" },
              { name: "Palestinian Advanced Physics School by Scientists for Palestine", detail: "Birzeit University, 2019" },
              { name: "Condensed Matter Conference", detail: "Birzeit University, 2019" },
              { name: "Hands-on Molecular Dynamics Workshop by Palestinian-German Science Bridge", detail: "Birzeit University, 2019" },
              { name: "Computational Multiphysics Conference", detail: "Birzeit University, 2019" },
              { name: "Physics Without Frontiers Workshop by ICTP", detail: "Birzeit University, 2017" },
              { name: "Black Holes Conference by Harvard-Smithsonian Center for Astrophysics", detail: "Birzeit University, 2017" },
            ].map((evt, i) => (
              <motion.div
                key={evt.name}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-3.5 rounded-xl glass border border-white/5 hover:border-quantum/20 transition-all duration-300 group"
              >
                <div className="w-6 h-6 rounded-md bg-quantum/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-quantum/20 transition-colors">
                  <Mic2 size={12} className="text-quantum" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground/80 leading-snug">{evt.name}</p>
                  <p className="text-xs text-foreground/35 font-mono mt-1">{evt.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pre-University */}
          <div className="text-xs font-mono text-foreground/30 tracking-widest uppercase mb-4">Pre-University Participation</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { name: "Access Programme by AMIDEAST", year: "2014–2016" },
              { name: "Physics Olympiad, Ramallah", year: "2015" },
              { name: "Science Exhibition, Tulkarm", year: "2015" },
              { name: "Science and Technology Entrepreneurship Program (STEP)", year: "2014" },
              { name: "First Lego League (FLL) Robotics", year: "2013 & 2014" },
              { name: "Intel ISEF, Ramallah", year: "2012" },
              { name: "SyscoLab Competition, Ramallah", year: "2012" },
              { name: "SEEK Electronic Bag Training, Ramallah", year: "2012" },
            ].map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-2.5 p-3 rounded-lg glass border border-white/4 hover:border-crimson/15 transition-all duration-300"
              >
                <Zap size={10} className="text-crimson/60 flex-shrink-0" />
                <span className="text-xs text-foreground/60 leading-snug">{item.name}</span>
                <span className="ml-auto text-[10px] font-mono text-foreground/25 flex-shrink-0">{item.year}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Selected Coursework ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// Coursework</div>
          <h2 className="text-2xl font-serif font-bold mb-8">
            Selected <span className="gradient-text-quantum">Coursework</span>
          </h2>

          <div className="space-y-6">
            {/* MSc — Durham */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="glass-card border border-quantum/15 p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-quantum/15 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={16} className="text-quantum" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground/90">MSc in Particles, Strings and Cosmology</h3>
                  <p className="text-xs text-foreground/40 font-mono">Durham University</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { cat: "Quantum Field Theory", courses: "Introductory Field Theory, QFT I & II, QED, Supersymmetry." },
                  { cat: "General Relativity & Cosmology", courses: "General Relativity, Cosmology I & II, Neutrino Physics, Astroparticle Physics." },
                  { cat: "Gauge Field Theory", courses: "Group Theory, Standard Model, Renormalisation Group, Scattering Amplitudes, Non-Perturbative Physics." },
                  { cat: "Superstring Theory", courses: "Conformal Field Theory, String Theory." },
                  { cat: "Phenomenology", courses: "QCD, Flavour Physics and Effective Field Theories, Higgs Physics." },
                  { cat: "Extra", courses: "Introduction to AdS/CFT, Analytic loop integration." },
                ].map((row, i) => (
                  <motion.div
                    key={row.cat}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.04 }}
                    className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm border-b border-white/4 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-quantum font-semibold text-xs sm:w-52 flex-shrink-0 flex items-center gap-1.5 pt-0.5">
                      <Layers size={10} className="text-quantum/50" />
                      {row.cat}
                    </span>
                    <span className="text-foreground/55 text-xs leading-relaxed">{row.courses}</span>
                  </motion.div>
                ))}
              </div>
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-quantum/5 blur-3xl pointer-events-none" />
            </motion.div>

            {/* BSc — Birzeit */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="glass-card border border-olive/15 p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-olive/15 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={16} className="text-olive-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground/90">BSc in Major Physics Minor Mathematics</h3>
                  <p className="text-xs text-foreground/40 font-mono">Birzeit University 🇵🇸</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { cat: "Physics", courses: "General Physics I–III, Modern Physics, Medical Physics, Astronomy, Vibrations & Waves, Optics, Analog Electronics, Mathematical Physics, Classical Mechanics I & II & master, Electromagnetic Theory I & II, Quantum Mechanics I & II, Thermal & Statistical Mechanics, Computational Physics." },
                  { cat: "Physics Labs", courses: "General Physics I–III Lab, Modern Physics Lab, Analogue Electronics Lab, Advanced Physics Lab." },
                  { cat: "Mathematics", courses: "Calculus I–III, Foundations of Mathematics (Logic), Linear Algebra I & II, ODEs, PDEs, Numerical Methods, Abstract Algebra I, Mathematical Analysis I." },
                  { cat: "Statistics & CS", courses: "Statistics I & III (Probability Theory), Programming C." },
                  { cat: "Extra Scientific", courses: "General Chemistry I, General Biology I." },
                  { cat: "Extra Labs", courses: "General Chemistry Lab I, General Biology Lab I." },
                  { cat: "Philosophy", courses: "Modern and Contemporary European Civilisation, Modern and Contemporary Arab Thought." },
                ].map((row, i) => (
                  <motion.div
                    key={row.cat}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.25 + i * 0.04 }}
                    className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm border-b border-white/4 pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-olive-400 font-semibold text-xs sm:w-52 flex-shrink-0 flex items-center gap-1.5 pt-0.5">
                      <Layers size={10} className="text-olive-400/50" />
                      {row.cat}
                    </span>
                    <span className="text-foreground/55 text-xs leading-relaxed">{row.courses}</span>
                  </motion.div>
                ))}
              </div>
              <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-olive/5 blur-3xl pointer-events-none" />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Course-Based Projects ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// Projects</div>
          <h2 className="text-2xl font-serif font-bold mb-8">
            Course-Based <span className="gradient-text-olive">Projects</span>
          </h2>

          <div className="space-y-2.5">
            {[
              { title: "BTZ Black Hole: Holographic Duality, Entropy, and AdS₃/CFT₂", course: "Particles, Strings and Cosmology", term: "Summer 2022" },
              { title: "Fractional Quantum Mechanics", course: "Quantum Mechanics", term: "Spring 2021" },
              { title: "Computational Planetary Motion", course: "Computational Physics", term: "Fall 2020" },
              { title: "Many Body Problem", course: "Computational Physics", term: "Fall 2020" },
              { title: "Cellular Automata", course: "Computational Physics", term: "Fall 2020" },
              { title: "Interactive Visualization of the Logistic Map", course: "Computational Physics", term: "Fall 2020" },
              { title: "Stellar Spectroscopy – Rigil, Betelgeuse and Sirius", course: "Astronomy", term: "Spring 2020" },
              { title: "Magnetic Fluids", course: "Nanophysics", term: "Fall 2019" },
              { title: "Vantablack – Optical Coating and 3D Light Microscopy", course: "Medical Physics", term: "Spring 2019" },
            ].map((proj, i) => (
              <motion.div
                key={proj.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3.5 rounded-xl glass border border-white/5 hover:border-olive/20 transition-all duration-300 group"
              >
                <div className="w-6 h-6 rounded-md bg-olive/10 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-olive/20 transition-colors">
                  <Code2 size={12} className="text-olive-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground/80 leading-snug">{proj.title}</p>
                  <p className="text-xs text-foreground/35 font-mono mt-1">
                    <span className="text-olive-400/60 italic">{proj.course}</span>
                    <span className="mx-1.5">·</span>
                    {proj.term}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Referees ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// References</div>
          <h2 className="text-2xl font-serif font-bold mb-6">
            <span className="gradient-text-quantum">Referees</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Prof. Ben Hoare", affil: "Durham University", email: "ben.hoare@durham.ac.uk", web: "https://www.benhoare.info/" },
              { name: "Dr. Ana Retore", affil: "DESY", email: "ana.retore@desy.de", web: null },
              { name: "Prof. Nabil Iqbal", affil: "Durham University", email: "nabil.iqbal@durham.ac.uk", web: "https://www.nabiliqbal.com/" },
              { name: "Prof. Benoît Vicedo", affil: "York University", email: "b.vicedo@york.ac.uk", web: null },
              { name: "Prof. Hazem Abusara", affil: "Birzeit University 🇵🇸", email: "habusara@birzeit.edu", web: null },
            ].map((ref, i) => (
              <motion.div
                key={ref.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                className="glass-card border border-white/6 p-4 hover:border-quantum/25 transition-all duration-300"
              >
                <p className="font-semibold text-sm mb-0.5">{ref.name}</p>
                <p className="text-xs text-foreground/40 mb-2">{ref.affil}</p>
                <a href={`mailto:${ref.email}`} className="text-[11px] font-mono text-quantum/60 hover:text-quantum transition-colors block">
                  {ref.email}
                </a>
                {ref.web && (
                  <a href={ref.web} target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono text-foreground/30 hover:text-quantum/60 transition-colors flex items-center gap-1 mt-1">
                    <Globe size={9} /> {ref.web.replace("https://", "")}
                  </a>
                )}
              </motion.div>
            ))}
          </div>

          {/* Collaboration CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 glass-card p-5 border border-quantum/20"
            whileHover={{ borderColor: "rgba(0,195,245,0.4)" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-quantum/15 flex items-center justify-center flex-shrink-0">
                <Atom size={16} className="text-quantum" />
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Open to Collaboration</p>
                <p className="text-xs text-foreground/45 leading-relaxed">
                  I actively seek collaborations in integrable systems, sigma models, and related areas of
                  mathematical physics. Also interested in outreach:
                </p>
                <a href="/contact" className="inline-flex items-center gap-1 text-xs text-quantum mt-2 hover:text-quantum/70 transition-colors">
                  Get in touch <ChevronRight size={10} />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
