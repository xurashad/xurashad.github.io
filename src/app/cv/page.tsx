"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Briefcase, Award, BookOpen,
  MapPin, Globe, Code2, Zap, Download,
  Atom, Mic2, Layers, Search, Printer,
  Users, Trophy, Database, Cpu, ExternalLink,
  CheckCircle2, ChevronDown, ChevronRight, School,
  Sparkles,
} from "lucide-react";
import {
  cvData,
  personalInfo,
  getConsolidatedAwardsAndGrants,
  getAllCourseProjects,
  getAllCoursework,
  formatPeriod,
  getMonthName,
} from "@/lib/cvData";
import type { SeriesEdition } from "@/lib/cvTypes";

/* ─── CV List Navigation Items ────────────────────────────────────────────── */
const CV_SECTIONS = [
  { id: "profile", label: "Research Profile", icon: Atom, count: "Overview" },
  { id: "education", label: "Education", icon: GraduationCap, count: `${cvData.education.length} Degrees` },
  { id: "publications", label: "Publications", icon: BookOpen, count: `${cvData.publications.length} Paper` },
  { id: "experience", label: "Experience & Teaching", icon: Briefcase, count: `${cvData.work_experience.length} Roles` },
  { id: "awards-grants", label: "Honours, Awards & Grants", icon: Award, count: "9 Awards" },
  { id: "groups", label: "Research Groups", icon: Users, count: `${cvData.groups.length} Groups` },
  { id: "conferences", label: "Conferences", icon: Mic2, count: `${cvData.conferences.length} Series` },
  { id: "seminars", label: "Seminars", icon: Mic2, count: `${cvData.seminars.length} Series` },
  { id: "schools-workshops", label: "Schools & Workshops", icon: School, count: `${cvData.schools_and_workshops.length} Events` },
  { id: "competitions", label: "Competitions & Programs", icon: Trophy, count: "10 Items" },
  { id: "skills", label: "Technical Skills", icon: Cpu, count: `${cvData.skills.length} Categories` },
  { id: "apps-datasets", label: "Apps & Datasets", icon: Database, count: "6 App Suites" },
  { id: "projects", label: "Course & Tech Projects", icon: Code2, count: "10 Projects" },
  { id: "coursework", label: "Comprehensive Coursework", icon: Layers, count: "13 Areas" },
  { id: "referees", label: "Academic Referees", icon: Users, count: `${cvData.referees.length} Referees` },
];

export default function CVPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [awardFilter, setAwardFilter] = useState<"all" | "grant" | "scholarship" | "distinction" | "honor">("all");
  const [activeSection, setActiveSection] = useState("profile");

  const awardsList = useMemo(() => getConsolidatedAwardsAndGrants(), []);
  const allProjects = useMemo(() => getAllCourseProjects(), []);
  const allCoursework = useMemo(() => getAllCoursework(), []);

  const filteredAwards = useMemo(() => {
    if (awardFilter === "all") return awardsList;
    return awardsList.filter((a) => a.type === awardFilter);
  }, [awardsList, awardFilter]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-cosmos-950 text-foreground pt-24 pb-28 selection:bg-quantum/30 selection:text-quantum">

      {/* ── Top Ambient Atmosphere ────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[550px] h-[550px] bg-quantum/4 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 w-[450px] h-[450px] bg-olive/4 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-crimson/4 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── HERO HEADER & QUICK ACTIONS ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card border border-quantum/20 p-6 sm:p-8 lg:p-10 mb-8 relative overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

            {/* Identity Info */}
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-quantum/10 border border-quantum/30 text-quantum font-medium flex items-center gap-1.5">
                  <Atom size={12} className="animate-spin-slow" />
                  Curriculum Vitae · Theoretical Physics
                </span>
                <span className="text-xs font-mono text-foreground/40">
                  Updated: March 2026
                </span>
              </div>

              <div className="flex items-baseline gap-4 flex-wrap">
                <h1 className="flex items-baseline gap-4 flex-wrap">
                  <span className="block text-3xl sm:text-5xl gradient-text-quantum">
                    {personalInfo.name}
                  </span>
                  <span
                    className="block text-2xl sm:text-4xl gradient-text-quantum overflow-visible pb-6"
                    style={{
                      fontFamily: '"DecoTypeThuluth", serif',
                      lineHeight: 1.6,
                      textAlign: "center",
                      direction: "rtl",
                    }}
                  >
                    {personalInfo.name_ar}
                  </span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-foreground/80 font-medium">
                {personalInfo.title} · {personalInfo.institution}
              </p>

              {/* Links & Contact Chips */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-foreground/50 pt-2">
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="flex items-center gap-1.5 hover:text-quantum transition-colors"
                >
                  <span className="text-quantum font-sans">✉</span> {personalInfo.email}
                </a>
                <a
                  href={personalInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-quantum transition-colors"
                >
                  <Globe size={13} className="text-quantum" /> {personalInfo.website.replace("https://", "").replace(/\/$/, "")}
                </a>
                <a
                  href={`https://orcid.org/${personalInfo.orcid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-quantum transition-colors"
                >
                  <span className="text-emerald-400 font-bold">ID</span> ORCID: {personalInfo.orcid}
                </a>
                <a
                  href={`https://inspirehep.net/authors/${personalInfo.inspirehep}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-quantum transition-colors"
                >
                  <Sparkles size={13} className="text-quantum" /> InspireHEP: {personalInfo.inspirehep}
                </a>
                <span className="flex items-center gap-1 text-foreground/45">
                  <MapPin size={13} className="text-crimson/80" /> {personalInfo.location}
                </span>
              </div>
            </div>

            {/* Action Buttons (Download & Print) */}
            <div className="flex flex-wrap sm:flex-col lg:flex-col gap-3 flex-shrink-0">
              <a
                href="/documents/cv.pdf"
                download="Rashad_Hamidi_CV.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(0,195,245,0.35)" }}
                  whileTap={{ scale: 0.97 }}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-quantum/25 to-quantum/15 border border-quantum/40 text-quantum font-semibold text-sm hover:bg-quantum/30 transition-all shadow-lg cursor-pointer"
                >
                  <Download size={16} />
                  <span>Download Full CV (PDF)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-quantum/20 text-quantum/90 border border-quantum/30">
                    A4
                  </span>
                </motion.button>
              </a>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/8 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-quantum/10 flex items-center justify-center text-quantum border border-quantum/20">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="text-lg font-bold text-white">1 Peer-Reviewed</div>
                <div className="text-xs text-foreground/45 font-mono">JHEP Article (2025)</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-olive/10 flex items-center justify-center text-olive-400 border border-olive/20">
                <Mic2 size={18} />
              </div>
              <div>
                <div className="text-lg font-bold text-white">13 Conferences/Seminars</div>
                <div className="text-xs text-foreground/45 font-mono">NBMPS, IDD, IGST</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-crimson/10 flex items-center justify-center text-crimson border border-crimson/20">
                <Award size={18} />
              </div>
              <div>
                <div className="text-lg font-bold text-white">9 Awards & Grants</div>
                <div className="text-xs text-foreground/45 font-mono">STFC, Global Masters, Distinction</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Briefcase size={18} />
              </div>
              <div>
                <div className="text-lg font-bold text-white">7 Modules Taught</div>
                <div className="text-xs text-foreground/45 font-mono">Teaching Assistant at Durham</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── SEARCH & INTERACTIVE CV LIST BAR ───────────────────────────── */}
        <div className="sticky top-20 z-30 mb-10 py-3 bg-cosmos-950/85 backdrop-blur-md border-y border-white/6 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">

            {/* Live Filter Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search CV (e.g. Chern-Simons, Python, JHEP, Birzeit, Durham, NBMPS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/4 border border-white/10 text-xs text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-quantum/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground/40 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick-Jump Section Directory */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-[11px] font-mono text-quantum/60 uppercase tracking-wider pl-1 pr-2 flex-shrink-0 flex items-center gap-1">
                <Layers size={12} /> CV List:
              </span>
              {CV_SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${activeSection === sec.id
                    ? "bg-quantum/20 text-quantum border border-quantum/40 font-semibold"
                    : "bg-white/3 text-foreground/50 hover:text-foreground/90 hover:bg-white/6 border border-white/5"
                    }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT LAYOUT ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 items-start">

          {/* Desktop Sticky Table of Contents (CV List) */}
          <aside className="hidden lg:block sticky top-36 glass-card p-4 border border-white/8 space-y-1">
            <div className="text-xs font-mono text-quantum font-semibold uppercase tracking-wider px-3 py-2 border-b border-white/8 mb-2 flex items-center justify-between">
              <span>CV Directory</span>
              <span className="text-[10px] text-foreground/40">15 Sections</span>
            </div>
            <nav className="space-y-0.5 text-xs">
              {CV_SECTIONS.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${isActive
                      ? "bg-quantum/15 text-quantum border-l-2 border-quantum font-semibold pl-2.5"
                      : "text-foreground/55 hover:text-white hover:bg-white/4"
                      }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon size={13} className={isActive ? "text-quantum" : "text-foreground/40"} />
                      <span className="truncate">{sec.label}</span>
                    </span>
                    <span className="text-[10px] font-mono text-foreground/30 flex-shrink-0 ml-1">
                      {sec.count}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-white/8 mt-4">
              <a
                href="/documents/cv.pdf"
                download="Rashad_Hamidi_CV.pdf"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-quantum/10 border border-quantum/25 text-quantum hover:bg-quantum/20 text-xs font-medium transition-colors"
              >
                <Download size={13} /> Download PDF
              </a>
            </div>
          </aside>

          {/* Detailed Content Stream */}
          <main className="space-y-16 min-w-0">

            {/* ── 1. RESEARCH PROFILE & VISION ───────────────────────────── */}
            <section id="profile" className="scroll-mt-36">
              <SectionTitle
                badge="01 // Overview"
                title="Research Profile & Interests"
                icon={Atom}
                accent="quantum"
              />
              <div className="glass-card border border-quantum/20 p-6 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="flex flex-wrap gap-2">
                  {cvData.research_interests.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-quantum/15 text-quantum border border-quantum/30"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
                <div>
                  <h4 className="text-xs font-mono text-foreground/40 uppercase tracking-widest mb-2">
                    Primary Focus
                  </h4>
                  <p className="text-foreground/80 leading-relaxed text-sm sm:text-base">
                    {cvData.research_interests.description}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-quantum/5 border border-quantum/15">
                  <h4 className="text-xs font-mono text-quantum font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Sparkles size={13} /> Long-Term Vision
                  </h4>
                  <p className="text-xs sm:text-sm text-foreground/75 leading-relaxed italic">
                    &ldquo;{cvData.research_interests.vision}&rdquo;
                  </p>
                </div>
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-quantum/5 rounded-full blur-3xl pointer-events-none" />
              </div>
            </section>

            {/* ── 2. EDUCATION & ACADEMIC BACKGROUND ──────────────────────── */}
            <section id="education" className="scroll-mt-36">
              <SectionTitle
                badge="02 // Academic Training"
                title="Education & Degrees"
                icon={GraduationCap}
                accent="quantum"
              />
              <div className="space-y-6">
                {cvData.education.map((edu, idx) => (
                  <motion.div
                    key={edu.degree}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                    className="glass-card border border-white/8 hover:border-quantum/30 transition-all p-6 relative overflow-hidden group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-quantum transition-colors">
                            {edu.degree}
                          </h3>
                          {edu.degree_achievement && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-quantum/20 text-quantum border border-quantum/40">
                              {edu.degree_achievement}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/70 font-medium mt-0.5">
                          {edu.institution} · <span className="text-foreground/50">{edu.department}</span>
                        </p>
                        <p className="text-xs text-foreground/45 flex items-center gap-1 mt-1">
                          <MapPin size={11} /> {edu.location}
                        </p>
                      </div>
                      <div className="text-xs font-mono text-quantum bg-quantum/10 px-3 py-1.5 rounded-lg border border-quantum/20 whitespace-nowrap self-start">
                        {formatPeriod(edu.start_year, edu.start_month, edu.end_year, edu.end_month, !edu.end_year)}
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm text-foreground/75 mt-4 pt-4 border-t border-white/6">
                      {edu.supervisor && (
                        <p>
                          <span className="text-foreground/40 font-mono text-xs">Supervisor: </span>
                          <span className="font-semibold text-foreground/90">{edu.supervisor}</span>
                        </p>
                      )}
                      {edu.thesis_title && (
                        <p>
                          <span className="text-foreground/40 font-mono text-xs">Thesis: </span>
                          <span className="italic text-foreground/90 font-serif">&ldquo;{edu.thesis_title}&rdquo;</span>
                        </p>
                      )}
                      {edu.research_topics && edu.research_topics.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="text-foreground/40 font-mono text-xs">Key Topics:</span>
                          {edu.research_topics.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded text-[11px] bg-white/4 text-foreground/70 border border-white/5">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Pre-University Section */}
                <div className="mt-8 pt-4">
                  <h4 className="text-xs font-mono text-foreground/40 uppercase tracking-widest mb-4">
                    Pre-University Education
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cvData.pre_university_education.map((pre) => (
                      <div key={pre.degree} className="p-4 rounded-xl glass border border-white/5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{pre.degree}</span>
                          <span className="font-mono text-[10px] text-foreground/35">{pre.start_year} – {pre.end_year}</span>
                        </div>
                        <p className="text-foreground/70">{pre.institution} ({pre.school_type})</p>
                        <p className="text-foreground/40">{pre.location} · <span className="text-olive-400 font-mono">Grades: {pre.grades}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── 3. PUBLICATIONS & PREPRINTS ────────────────────────────── */}
            <section id="publications" className="scroll-mt-36">
              <SectionTitle
                badge="03 // Research Output"
                title="Publications & Preprints"
                icon={BookOpen}
                accent="quantum"
              />
              <div className="space-y-4">
                {cvData.publications.map((pub, idx) => (
                  <motion.div
                    key={pub.article}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="glass-card border border-quantum/25 p-6 hover:border-quantum/50 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-quantum/20 text-quantum border border-quantum/30">
                        Peer-Reviewed Journal Article [{idx + 1}]
                      </span>
                      <span className="text-xs font-mono text-foreground/40 font-bold">{pub.year}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-snug">
                      &ldquo;{pub.title}&rdquo;
                    </h3>

                    <p className="text-xs sm:text-sm text-foreground/75 font-medium">
                      Authors: <span className="text-quantum font-semibold">{pub.authors.join(", ")}</span>
                    </p>

                    <div className="text-xs font-mono text-foreground/50 leading-relaxed">
                      Published in <span className="text-foreground/90 font-bold">{pub.journal} {pub.volume} ({pub.year}) {pub.pages}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-quantum/15 text-quantum border border-quantum/30 hover:bg-quantum/25 text-xs font-mono font-medium transition-colors"
                      >
                        <ExternalLink size={12} /> DOI: {pub.doi}
                      </a>
                      <a
                        href={`https://arxiv.org/abs/${pub.eprint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/10 hover:border-quantum/30 text-xs font-mono text-foreground/70 hover:text-white transition-colors"
                      >
                        <ExternalLink size={12} /> arXiv:{pub.eprint} [{pub.primaryClass}]
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── 4. APPOINTMENTS & WORK EXPERIENCE ──────────────────────── */}
            <section id="experience" className="scroll-mt-36">
              <SectionTitle
                badge="04 // Professional Roles"
                title="Academic Appointments & Experience"
                icon={Briefcase}
                accent="quantum"
              />
              <div className="space-y-6">
                {cvData.work_experience.map((work) => (
                  <motion.div
                    key={work.position}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="glass-card border border-white/8 hover:border-quantum/25 p-6 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white">{work.position}</h3>
                        <p className="text-xs sm:text-sm text-foreground/70 font-medium mt-0.5">
                          {work.institutions.join(" · ")} · <span className="text-foreground/45">{work.location} ({work.working_time})</span>
                        </p>
                      </div>
                      <span className="text-xs font-mono text-quantum bg-quantum/10 px-3 py-1.5 rounded-lg border border-quantum/20 whitespace-nowrap self-start">
                        {formatPeriod(work.start_year, work.start_month, work.end_year, work.end_month, work.current)}
                      </span>
                    </div>

                    {work.courses && work.courses.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-white/6">
                        <span className="text-xs font-mono text-quantum font-semibold uppercase tracking-wider block mb-2">
                          Teaching Modules Taught:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {work.courses.map((c) => (
                            <span key={c} className="px-2.5 py-1 rounded-md text-xs bg-white/4 text-foreground/80 border border-white/6 font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {work.tasks && work.tasks.length > 0 && (
                      <ul className="mt-4 pt-3 border-t border-white/6 space-y-2 text-xs sm:text-sm text-foreground/70">
                        {work.tasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-quantum mt-1">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── 5. HONOURS, AWARDS & GRANTS (DEDICATED SECTION) ────────── */}
            <section id="awards-grants" className="scroll-mt-36">
              <SectionTitle
                badge="05 // Funding & Recognitions"
                title="Honours, Awards & Grants"
                icon={Award}
                accent="olive"
              />

              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-2 mb-6">
                {[
                  { id: "all", label: "All Awards & Grants" },
                  { id: "grant", label: "Grants & Fellowships" },
                  { id: "scholarship", label: "Scholarships" },
                  { id: "distinction", label: "Degree Distinctions" },
                  { id: "honor", label: "Honor Rolls" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAwardFilter(f.id as typeof awardFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${awardFilter === f.id
                      ? "bg-olive-500/20 text-olive-400 border border-olive-500/40 font-semibold"
                      : "bg-white/3 text-foreground/50 hover:text-white border border-white/5"
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAwards.map((item, i) => {
                  const borderClass =
                    item.accent === "quantum"
                      ? "border-quantum/25 hover:border-quantum/45"
                      : item.accent === "olive"
                        ? "border-olive/25 hover:border-olive/45"
                        : "border-crimson/25 hover:border-crimson/45";
                  const textClass =
                    item.accent === "quantum"
                      ? "text-quantum"
                      : item.accent === "olive"
                        ? "text-olive-400"
                        : "text-crimson";
                  const iconBg =
                    item.accent === "quantum"
                      ? "bg-quantum/10"
                      : item.accent === "olive"
                        ? "bg-olive/10"
                        : "bg-crimson/10";

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className={`glass-card p-5 border ${borderClass} transition-all space-y-2`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Award size={16} className={textClass} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{item.title}</h4>
                            <p className="text-xs text-foreground/50 font-mono mt-0.5">{item.organization}</p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono text-foreground/40 font-semibold px-2 py-0.5 rounded bg-white/4 border border-white/5 whitespace-nowrap">
                          {item.period}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-foreground/70 pl-11">{item.description}</p>
                      )}
                      {item.sponsors && item.sponsors.length > 0 && (
                        <div className="pl-11 pt-1 flex flex-wrap gap-1.5">
                          {item.sponsors.map((s) => (
                            <span key={s} className="px-2 py-0.5 rounded text-[10px] bg-white/4 text-foreground/60 border border-white/5">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* ── 6. RESEARCH GROUPS & MEMBERSHIPS ───────────────────────── */}
            <section id="groups" className="scroll-mt-36">
              <SectionTitle
                badge="06 // Community & Collaborations"
                title="Research Groups & Memberships"
                icon={Users}
                accent="quantum"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cvData.groups.map((grp) => (
                  <div
                    key={grp.name}
                    className="p-4 rounded-xl glass border border-white/8 hover:border-quantum/30 transition-all flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-quantum" />
                        <h4 className="text-sm font-bold text-white">{grp.name}</h4>
                      </div>
                      <p className="text-xs text-foreground/60 pl-4">{grp.institution}</p>
                    </div>
                    <span className="text-[11px] font-mono text-quantum bg-quantum/10 px-2.5 py-1 rounded border border-quantum/20 whitespace-nowrap">
                      {grp.current ? `${grp.start_year} – Present` : `${grp.start_year} – ${grp.end_year}`}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 7. CONFERENCES (SEPARATED & SERIES-GROUPED) ─────────────── */}
            <section id="conferences" className="scroll-mt-36">
              <SectionTitle
                badge="07 // Academic Symposia"
                title="Conferences & Symposia"
                icon={Mic2}
                accent="quantum"
              />
              <p className="text-xs sm:text-sm text-foreground/60 mb-6 -mt-3">
                Separated series categories. Recurring international conferences are grouped with individual edition roles and sponsors.
              </p>

              <div className="space-y-6">
                {cvData.conferences.map((series) => (
                  <SeriesCard key={series.title} title={series.title} editions={series.editions} type="conference" />
                ))}
              </div>
            </section>

            {/* ── 8. SEMINARS (SEPARATED & SERIES-GROUPED) ───────────────── */}
            <section id="seminars" className="scroll-mt-36">
              <SectionTitle
                badge="08 // Colloquia & Talks"
                title="Seminars & Colloquia"
                icon={Mic2}
                accent="quantum"
              />
              <p className="text-xs sm:text-sm text-foreground/60 mb-6 -mt-3">
                Distinct seminars series. North British Mathematical Physics Seminars (NBMPS) and departmental seminar editions.
              </p>

              <div className="space-y-6">
                {cvData.seminars.map((series) => (
                  <SeriesCard key={series.title} title={series.title} editions={series.editions} type="seminar" />
                ))}
              </div>
            </section>

            {/* ── 9. SCHOOLS AND ADVANCED WORKSHOPS ──────────────────────── */}
            <section id="schools-workshops" className="scroll-mt-36">
              <SectionTitle
                badge="09 // Advanced Training"
                title="Schools & Advanced Workshops"
                icon={School}
                accent="quantum"
              />
              <div className="space-y-4">
                {cvData.schools_and_workshops.map((sw) => (
                  <div key={sw.title} className="glass-card p-5 border border-white/8 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm sm:text-base font-bold text-white">{sw.title}</h4>
                      <span className="text-xs font-mono text-quantum bg-quantum/10 px-2 py-0.5 rounded border border-quantum/20">
                        {sw.editions.length} edition{sw.editions.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-white/6">
                      {sw.editions.map((ed, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 bg-white/2 p-2.5 rounded-lg">
                          <div>
                            <span className="font-semibold text-foreground/90">{ed.edition}</span>
                            {ed.location && <span className="text-foreground/50"> · {ed.location}</span>}
                            {ed.sponsors && (
                              <p className="text-[11px] text-foreground/40 font-mono mt-0.5">
                                Sponsors: {ed.sponsors.join(", ")}
                              </p>
                            )}
                          </div>
                          <span className="font-mono text-quantum text-[11px] whitespace-nowrap self-start sm:self-center">
                            {getMonthName(ed.month)} {ed.year}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 10. COMPETITIONS & CERTIFICATION PROGRAMS ──────────────── */}
            <section id="competitions" className="scroll-mt-36">
              <SectionTitle
                badge="10 // Hackathons & Programs"
                title="Competitions & Certifications"
                icon={Trophy}
                accent="olive"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Competitions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono text-quantum uppercase tracking-widest font-semibold">
                    Competitions & Hackathons
                  </h4>
                  {cvData.competitions.map((comp) => (
                    <div key={comp.title} className="glass-card p-4 border border-white/8 space-y-2">
                      <div className="font-bold text-sm text-white">{comp.title}</div>
                      <div className="space-y-1.5 text-xs text-foreground/70">
                        {comp.editions.map((ed, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 border-b border-white/4 pb-1.5 last:border-0 last:pb-0">
                            <div>
                              <span>{ed.name ? `${ed.name} · ` : ""}{ed.location}</span>
                              {ed.sponsors && (
                                <p className="text-[10px] text-foreground/40 font-mono">{ed.sponsors.slice(0, 3).join(", ")}</p>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-foreground/40">{getMonthName(ed.month)} {ed.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Certification Programs */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono text-olive-400 uppercase tracking-widest font-semibold">
                    Certification Programs
                  </h4>
                  {cvData.certification_programs.map((cp) => (
                    <div key={cp.title} className="glass-card p-4 border border-white/8 space-y-2">
                      <div className="font-bold text-sm text-white">{cp.title}</div>
                      <div className="space-y-1.5 text-xs text-foreground/70">
                        {cp.editions.map((ed, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 border-b border-white/4 pb-1.5 last:border-0 last:pb-0">
                            <div>
                              <span>{ed.location} · <span className="text-olive-400 font-mono">{ed.duration}</span></span>
                              {ed.sponsors && (
                                <p className="text-[10px] text-foreground/40 font-mono">{ed.sponsors.join(", ")}</p>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-foreground/40">{ed.start_year} – {ed.end_year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 11. TECHNICAL SKILLS ───────────────────────────────────── */}
            <section id="skills" className="scroll-mt-36">
              <SectionTitle
                badge="11 // Competencies"
                title="Technical & Scientific Skills"
                icon={Cpu}
                accent="quantum"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cvData.skills.map((sk) => (
                  <div key={sk.category} className="glass-card p-4 border border-white/8 hover:border-quantum/25 transition-all space-y-2">
                    <h4 className="text-xs font-mono text-quantum font-semibold uppercase tracking-wider">
                      {sk.category}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {sk.skills.map((s) => (
                        <span key={s} className="px-2.5 py-1 rounded-md text-xs bg-white/4 text-foreground/80 border border-white/5 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 12. DEVELOPED APPLICATIONS & DATASETS ──────────────────── */}
            <section id="apps-datasets" className="scroll-mt-36">
              <SectionTitle
                badge="12 // Software & Data Assets"
                title="Developed Applications & Scientific Datasets"
                icon={Database}
                accent="quantum"
              />

              <div className="space-y-6">

                {/* Apps Header & Categories */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono text-quantum uppercase tracking-wider font-semibold">
                      Software Applications Suite ({cvData.developed_applications.applications.length} Categories)
                    </h4>
                    <a
                      href={cvData.developed_applications.applications_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-quantum hover:underline flex items-center gap-1"
                    >
                      View Live Apps <ChevronRight size={12} />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cvData.developed_applications.applications.map((cat) => (
                      <div key={cat.category} className="glass-card p-4 border border-white/8 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">{cat.category}</span>
                          <span className="text-[10px] font-mono text-foreground/40">{cat.apps.length} tools</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          {cat.apps.map((app) => (
                            <div key={app.name} className="p-2 rounded bg-white/2 border border-white/3 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-foreground/90">{app.name}</span>
                                {app.link && (
                                  <a href={app.link} target="_blank" rel="noopener noreferrer" className="text-quantum hover:underline flex items-center gap-0.5 text-[10px]">
                                    Open <ExternalLink size={9} />
                                  </a>
                                )}
                              </div>
                              <p className="text-foreground/50 text-[11px] leading-relaxed">{app.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Datasets */}
                <div className="space-y-4 pt-4 border-t border-white/8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono text-olive-400 uppercase tracking-wider font-semibold">
                      Curated Scientific Datasets
                    </h4>
                    <a
                      href={cvData.generated_datasets.datasets_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-olive-400 hover:underline flex items-center gap-1"
                    >
                      Explore Datasets <ChevronRight size={12} />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {cvData.generated_datasets.datasets.map((ds) => (
                      <div key={ds.name} className="glass-card p-4 border border-olive/20 space-y-1.5">
                        <h5 className="font-bold text-sm text-white">{ds.name}</h5>
                        <p className="text-xs text-foreground/60 leading-relaxed">{ds.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── 13. COURSE-BASED & TECHNICAL PROJECTS ──────────────────── */}
            {/* User requirement: Projects just before Coursework! */}
            <section id="projects" className="scroll-mt-36">
              <SectionTitle
                badge="13 // Computational & Theoretical Projects"
                title="Course-Based & Technical Projects"
                icon={Code2}
                accent="olive"
              />
              <p className="text-xs sm:text-sm text-foreground/60 mb-6 -mt-3">
                Research dissertations, computational physics simulations, astrophysics models, and nanotechnology projects completed across BSc and MSc programs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allProjects.map((proj, idx) => (
                  <motion.div
                    key={proj.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.04 }}
                    className="glass-card p-5 border border-olive/20 hover:border-olive/40 transition-all space-y-2 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-olive/10 flex items-center justify-center text-olive-400 flex-shrink-0 mt-0.5 group-hover:bg-olive/20 transition-colors">
                        <Code2 size={16} />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-sm font-bold text-white group-hover:text-olive-300 transition-colors leading-snug">
                          {proj.title}
                        </h4>
                        <p className="text-xs text-foreground/50 font-mono">
                          <span className="text-olive-400/80 italic">{proj.course}</span> · {proj.semester} {proj.year}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── 14. COMPREHENSIVE COURSEWORK ───────────────────────────── */}
            {/* User requirement: Coursework just before References! */}
            <section id="coursework" className="scroll-mt-36">
              <SectionTitle
                badge="14 // Curriculum"
                title="Comprehensive Academic Coursework"
                icon={Layers}
                accent="quantum"
              />
              <p className="text-xs sm:text-sm text-foreground/60 mb-6 -mt-3">
                Classified graduate (MSc Durham) and undergraduate (BSc Birzeit) coursework covering theoretical physics, mathematical methods, and computing.
              </p>

              <div className="space-y-8">
                {allCoursework.map((degree) => (
                  <div key={degree.degreeTitle} className="glass-card p-6 border border-white/8 space-y-5">
                    <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                      <div className="w-9 h-9 rounded-xl bg-quantum/15 flex items-center justify-center text-quantum">
                        <GraduationCap size={18} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white">{degree.degreeTitle}</h4>
                        <p className="text-xs text-foreground/50 font-mono">{degree.institution} · {degree.location}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {degree.categories.map((cat) => (
                        <div key={cat.category} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 text-xs border-b border-white/4 pb-3 last:border-0 last:pb-0">
                          <span className="sm:w-56 font-semibold text-quantum flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                            <Layers size={11} className="text-quantum/60" /> {cat.category}
                          </span>
                          <span className="text-foreground/75 leading-relaxed">
                            {cat.courses.join(", ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 15. ACADEMIC REFEREES ──────────────────────────────────── */}
            <section id="referees" className="scroll-mt-36">
              <SectionTitle
                badge="15 // Academic Contacts"
                title="Academic Referees"
                icon={Users}
                accent="quantum"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cvData.referees.map((ref) => (
                  <div
                    key={ref.name}
                    className="glass-card p-5 border border-white/8 hover:border-quantum/30 transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white">{ref.name}</h4>
                        <span className="text-[10px] font-mono text-quantum/80 px-2 py-0.5 rounded bg-quantum/10 border border-quantum/20">
                          {ref.relationship}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/50 font-medium mb-3">{ref.affiliation}</p>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-white/6 text-xs font-mono">
                      <a
                        href={`mailto:${ref.email}`}
                        className="text-quantum hover:underline flex items-center gap-1 truncate"
                      >
                        ✉ {ref.email}
                      </a>
                      {ref.webpage && (
                        <a
                          href={ref.webpage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground/45 hover:text-quantum flex items-center gap-1 truncate transition-colors"
                        >
                          <Globe size={11} /> {ref.webpage.replace("https://", "").replace("http://", "")}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}

/* ─── Series Card Component (For Conferences & Seminars) ──────────────────── */
function SeriesCard({
  title,
  editions,
  type,
}: {
  title: string;
  editions: SeriesEdition[];
  type: "conference" | "seminar";
}) {
  const [expanded, setExpanded] = useState(true);

  const speakerCount = editions.filter((e) => e.presentation_type === "Speaker").length;
  const posterCount = editions.filter((e) => e.presentation_type === "Poster").length;

  return (
    <div className="glass-card border border-white/8 hover:border-quantum/25 transition-all overflow-hidden">

      {/* Series Header Banner */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/2 hover:bg-white/4 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-quantum/15 flex items-center justify-center text-quantum flex-shrink-0">
            <Mic2 size={16} />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">{title}</h4>
            <div className="flex items-center gap-2 text-xs font-mono text-foreground/45 mt-0.5">
              <span>{editions.length} edition{editions.length > 1 ? "s" : ""}</span>
              {speakerCount > 0 && (
                <span className="text-amber-400 font-bold">· {speakerCount} Talk (Speaker)</span>
              )}
              {posterCount > 0 && (
                <span className="text-quantum font-bold">· {posterCount} Poster</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-mono text-foreground/40">
            {expanded ? "Collapse" : "Expand"}
          </span>
          <ChevronDown
            size={16}
            className={`text-foreground/40 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Editions List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 pt-0 space-y-3"
          >
            <div className="border-t border-white/6 pt-4 space-y-3">
              {editions.map((ed, idx) => {
                const role = ed.presentation_type || "Attendee";
                const isSpeaker = role === "Speaker";
                const isPoster = role === "Poster";

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs transition-all ${isSpeaker
                      ? "bg-amber-500/5 border-amber-500/25 hover:border-amber-500/40"
                      : isPoster
                        ? "bg-quantum/5 border-quantum/25 hover:border-quantum/40"
                        : "bg-white/2 border-white/5 hover:border-white/10"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-bold text-sm text-foreground/95">{ed.edition}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${isSpeaker
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : isPoster
                              ? "bg-quantum/20 text-quantum border border-quantum/30"
                              : "bg-white/5 text-foreground/60 border border-white/10"
                            }`}
                        >
                          {role}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-quantum whitespace-nowrap">
                        {getMonthName(ed.month)} {ed.year}
                      </span>
                    </div>

                    {ed.location && (
                      <p className="text-foreground/60 text-xs flex items-center gap-1 mb-2">
                        <MapPin size={11} className="text-foreground/35" /> {ed.location}
                      </p>
                    )}

                    {ed.sponsors && ed.sponsors.length > 0 && (
                      <div className="pt-2 border-t border-white/4 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono text-foreground/35">Sponsors:</span>
                        {ed.sponsors.map((sp) => (
                          <span
                            key={sp}
                            className="px-2 py-0.5 rounded text-[10px] bg-white/4 text-foreground/60 border border-white/5"
                          >
                            {sp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Section Header Helper ───────────────────────────────────────────────── */
function SectionTitle({
  badge,
  title,
  icon: Icon,
  accent = "quantum",
}: {
  badge: string;
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accent?: "quantum" | "olive" | "crimson";
}) {
  const accentClass =
    accent === "quantum"
      ? "gradient-text-quantum"
      : accent === "olive"
        ? "gradient-text-olive"
        : "gradient-text-crimson";

  return (
    <div className="mb-6">
      <div className="text-xs font-mono text-quantum/60 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
        <Icon size={13} className="text-quantum" />
        <span>{badge}</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
        <span className={accentClass}>{title}</span>
      </h2>
    </div>
  );
}
