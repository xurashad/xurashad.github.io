"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import localFont from "next/font/local";
import { Map, Globe, BookOpen, Heart, Star, MapPin, ExternalLink, Shield, Landmark, Mountain } from "lucide-react";

const palestineFont = localFont({
  src: "../../../fonts/Palestine-Regular.ttf",
  display: "swap",
});
import { WaveDivider } from "@/components/ui";

/* ─── Poetry ─────────────────────────────────────────────────────────────── */
const POEMS = [
  {
    text: `On this earth is what makes life worth living:\nApril's hesitation, the aroma of bread\nat dawn, a woman's point of view about men,\nthe works of Aeschylus, the beginning of love,\ngrass on a stone, mothers living on a flute's sigh\nand the invaders' fear of memories.`,
    author: "Mahmoud Darwish",
    source: "On This Earth What Makes Life Worth Living",
    accent: "olive" as const,
  },
  {
    text: `If I must die,\nyou must live\nto tell my story\nto sell my things\nto buy a piece of cloth\nand some strings,\n(make it white with a long tail)\nso that a child, somewhere in Gaza\nwhile looking heaven in the eye\nawaiting his dad who left in a blaze—\nand bid no one farewell\nnot even to his flesh\nnot even to himself—\nsees the kite, my kite you made, flying up above\nand thinks for a moment an angel is there\nbringing back love\nIf I must die\nlet it bring hope\nlet it be a tale`,
    author: "Refaat Alareer",
    source: "If I Must Die",
    accent: "indigo" as const,
  },
  {
    text: `Everything in this world can be robbed and stolen, except one thing; this one thing is the love that emanates from a human being towards a solid commitment to a conviction or cause.`,
    author: "Ghassan Kanafani",
    source: "Return to Haifa",
    accent: "emerald" as const,
  }
];

/* ─── Historical moments ─────────────────────────────────────────────────── */
export const HISTORY = [
  {
    id: "stone-age",
    sortIndex: -15000,
    year: "15,000 BCE – 4500 BCE",
    title: "Stone Age",
    desc: "Early Natufian agricultural activities mark the beginnings of settled human life. Tell es-Sultan (Jericho) emerges as one of the world's first fortified cities, establishing a profound, millennia-long connection to the land.",
    icon: Mountain,
    accent: "olive",
  },
  {
    id: "bronze-age",
    sortIndex: -4500,
    year: "4500 BCE – 1150 BCE",
    title: "Bronze Age",
    desc: "The indigenous Canaanite civilisation flourishes across the Levant. They established powerful city-states, engaged in regional trade across the Mediterranean, and developed the earliest phonetic alphabets.",
    icon: Star,
    accent: "olive",
  },
  {
    id: "iron-age",
    sortIndex: -1150,
    year: "1150 BCE – 332 BCE",
    title: "Iron Age",
    desc: "The 'Sea Peoples', including the Philistines (Peleset), settle the coastal plain, giving the region the name 'Philistia' (Palestine). This era saw various local kingdoms and conquests by Assyrians, Babylonians, and Persians.",
    icon: Map,
    accent: "quantum",
  },
  {
    id: "classical-antiquity",
    sortIndex: -332,
    year: "332 BCE – 637 CE",
    title: "Classical Antiquity",
    desc: "Spanning Greek and Roman rule, the region was officially named Syria Palaestina. During the Byzantine period, it transformed into a major centre of early Christianity, dotted with monasteries and basilicas.",
    icon: Landmark,
    accent: "quantum",
  },
  {
    id: "arab-empires",
    sortIndex: 637,
    year: "637 CE – 1099 CE",
    title: "Arab Empires",
    desc: "Under the Umayyad and Abbasid caliphates, Palestine experienced an Islamic golden age. It flourished as a centre of scholarship, architecture, and trade, marked by the completion of Jerusalem's Dome of the Rock in 692 CE.",
    icon: BookOpen,
    accent: "quantum",
  },
  {
    id: "crusades-sultanates",
    sortIndex: 1099,
    year: "1099 CE – 1517 CE",
    title: "Crusades & Sultanates",
    desc: "A turbulent era of Crusader invasions, eventually repelled by Salah al-Din. The subsequent Mamluk sultanate period left an indelible architectural and cultural mark, particularly in the Old City of Jerusalem.",
    icon: Shield,
    accent: "olive",
  },
  {
    id: "ottoman-empire",
    sortIndex: 1517,
    year: "1517 CE – 1918 CE",
    title: "Ottoman Empire",
    desc: "For four centuries, Palestine experienced relative stability. Cities like Nablus and Gaza thrived through regional trade, agriculture, and the famous olive oil soap industry, deeply shaping modern Palestinian culture.",
    icon: Landmark,
    accent: "olive",
  },
  {
    id: "colonialism-1",
    sortIndex: 1918,
    year: "1918 CE – 1948 CE",
    title: "Colonialism I",
    desc: "Following WWI, the British Mandate facilitated mass European Zionist immigration against the wishes of the indigenous majority. This period included the Great Arab Revolt (1936-1939), a grassroots anti-colonial uprising demanding independence.",
    icon: MapPin,
    accent: "crimson",
  },
  {
    id: "colonialism-2",
    sortIndex: 1948,
    year: "1948 CE – Today",
    title: "Colonialism II",
    desc: "Beginning with the Nakba in 1948, where 750,000 Palestinians were expelled and 530+ villages destroyed. This era encompasses the 1967 occupation, the Intifadas, the Gaza blockade, and ongoing resistance.",
    icon: Heart,
    accent: "crimson",
  },
  {
    id: "sumud",
    sortIndex: 9999,
    year: "Eternal",
    title: "Resilience — صمود — Sumud",
    desc: "Sumud (صمود) — steadfastness — is the Palestinian philosophy of remaining rooted in the land, refusing to be erased, continuing to plant olive trees, to tell stories, to have children, to dream.",
    icon: Globe,
    accent: "olive",
  },
];

/* ─── Cultural elements ──────────────────────────────────────────────────── */
const CULTURE_ITEMS = [
  {
    title: "Embroidery — التطريز",
    desc: "Palestinian tatreez (cross-stitch embroidery) encodes village identity, marital status, and regional origin in its patterns. Each dress is a data archive of belonging.",
    emoji: "🪡",
    accent: "olive",
  },
  {
    title: "Olive trees — الزيتون",
    desc: "Palestinians have cultivated olive trees for 6,000 years. An olive tree can live for 3,000 years. To uproot an olive tree is to attempt to erase memory. Trees resist.",
    emoji: "🫒",
    accent: "olive",
  },
  {
    title: "Keffiyeh — الكوفية",
    desc: "The black-and-white fishnet pattern is not decoration — it is topological invariant. Mathematically, its p4mm symmetry group is the same as graphene. A cloth that carries both culture and physics.",
    emoji: "🧣",
    accent: "quantum",
  },
  {
    title: "Dabke — الدبكة",
    desc: "A folk dance where participants lock arms and stomp in unison. Dabke is practised at weddings, celebrations, and protests. It is joy encoded in collective motion — physics of belonging.",
    emoji: "💃",
    accent: "crimson",
  },
  {
    title: "Poetry — الشعر",
    desc: "Palestinian poetry — especially the work of Mahmoud Darwish — is among the most translated in the world. Poetry survived when borders did not. Verse outlasts occupation.",
    emoji: "📜",
    accent: "olive",
  },
  {
    title: "Food — الطعام",
    desc: "Musakhan, knafeh, maqluba, freekeh. Palestinian cuisine is a geography lesson — dishes carry the names of cities, the memory of harvests, and the warmth of displaced kitchens.",
    emoji: "🍽️",
    accent: "crimson",
  },
];

/* ─── Resources ──────────────────────────────────────────────────────────── */
const RESOURCES = [
  { label: "Visualising Palestine", href: "https://visualizingpalestine.org", desc: "Data visualisations about the Palestinian experience" },
  { label: "Palestine Open Maps", href: "https://palopenmaps.org/en", desc: "Historical maps and geospatial data of Palestine" },
  { label: "The Electronic Intifada", href: "https://electronicintifada.net", desc: "Independent news publication on Palestine" },
  { label: "Medical Aid for Palestinians", href: "https://www.map.org.uk/", desc: "NGO providing health and medical services in Palestine" },
  { label: "Al-Haq", href: "https://www.alhaq.org/", desc: "Palestinian human rights organization monitoring the West Bank" },
  { label: "BDS Movement", href: "https://bdsmovement.net/", desc: "Campaign for boycott, divestment, and sanctions" },
  { label: "PCHR Palestine", href: "https://pchrgaza.org/en/", desc: "Palestinian Centre for Human Rights based in Gaza" },
  { label: "Who Profits", href: "https://www.whoprofits.org/", desc: "Research center monitoring corporate involvement in the occupation" },
];

/* ─── Websites to support ────────────────────────────────────────────────── */
const SUPPORT_ORGS = [
  {
    name: "Scientists for Palestine",
    href: "https://www.scientists4palestine.org/",
    desc: "An international network of scientists committed to upholding the rights of Palestinian scholars, facilitating mentorship and academic collaboration across borders.",
    emoji: "🔬",
  },
  {
    name: "Durham Palestine Educational Trust",
    href: "https://durhampalestine.webspace.durham.ac.uk/",
    desc: "A trust supporting Palestinian students with scholarships and educational resources, fostering academic exchange between Durham University and Palestinian institutions.",
    emoji: "🎓",
  },
  {
    name: "Friends of Palestinian Universities",
    href: "https://friendsofpalunis.org/",
    desc: "An organisation dedicated to supporting Palestinian universities through fundraising, academic partnerships, and advocacy for the right to education under occupation.",
    emoji: "🏛️",
  },
];

/* ─── Floating olive leaf SVG ─────────────────────────────────────────────── */
function OliveLeaf({ style, delay = 0 }: { style?: React.CSSProperties; delay?: number }) {
  return (
    <motion.div
      style={style}
      className="absolute pointer-events-none select-none text-olive/30"
      animate={{
        y: [0, -20, 0],
        rotate: [0, 15, -10, 0],
        opacity: [0.2, 0.5, 0.2],
      }}
      transition={{ duration: 6 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      🫒
    </motion.div>
  );
}

/* ─── Keffiyeh background pattern ────────────────────────────────────────── */
function KeffiyehHero() {
  return (
    <div className="relative min-h-[60vh] flex items-center overflow-hidden">
      {/* Flag gradient bars */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a1a] to-[#0c1a0c]" />
        {/* Keffiyeh grid */}
        <div className="absolute inset-0 keffiyeh-bg opacity-80" />
        {/* Colour washes */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-black via-white/20 to-black" />
        <div className="absolute top-1.5 left-0 w-full h-1.5 bg-gradient-to-r from-black via-white/10 to-black" />
        <div className="absolute bottom-2 left-0 w-full h-8 bg-gradient-to-t from-crimson/15 to-transparent" />
        <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-olive/30 to-transparent" />
      </div>

      {/* Floating olives */}
      <OliveLeaf style={{ top: "15%", left: "8%", fontSize: "2rem" }} delay={0} />
      <OliveLeaf style={{ top: "60%", left: "85%", fontSize: "1.5rem" }} delay={1.5} />
      <OliveLeaf style={{ top: "30%", left: "72%", fontSize: "2.5rem" }} delay={3} />
      <OliveLeaf style={{ top: "75%", left: "20%", fontSize: "1.8rem" }} delay={2} />
      <OliveLeaf style={{ top: "10%", left: "50%", fontSize: "1.2rem" }} delay={4} />

      {/* Content */}
      <div className="section-container relative z-10 py-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
          className="max-w-3xl"
        >
          {/* Flag emoji large */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl mb-6 select-none"
          >
            🇵🇸
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-serif font-bold leading-tight mb-6">
            <span className="gradient-text-olive">Palestine</span>
            <br />
            <span className="text-white/90 text-4xl sm:text-5xl font-light">will be free.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mb-8 font-light">
            This page is an act of memory. Palestine is not a political opinion —
            it is a{" "}
            <span className="text-olive-400 font-medium">people</span>,
            a{" "}
            <span className="text-crimson font-medium">land</span>,
            a{" "}
            <span className="text-quantum font-medium">civilisation</span>.
            Physics cannot be separated from conscience. Knowledge without justice is noise.
          </p>

          {/* Palestinian flag colour strip */}
          <div className="flex h-2 w-48 rounded-full overflow-hidden gap-0.5">
            <div className="flex-1 bg-black/80" />
            <div className="flex-1 bg-white/60" />
            <div className="flex-1 bg-olive-500" />
            <div className="flex-1 bg-crimson" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Physics-Palestine bridge ───────────────────────────────────────────── */
function PhysicsBridge() {
  const equations = [
    { eq: "∀t: Sumud(t) > 0", label: "Sumud (Steadfastness) is positive definite — it cannot go to zero." },
    { eq: "dMemory/dt = Resistance(t)", label: "Memory is not static — it increases with each act of resistance." },
    { eq: "[Occupation, Justice] ≠ 0", label: "Occupation and justice do not commute. They cannot coexist." },
    { eq: "E[Liberation] = ħω (quantised)", label: "Liberation comes in quanta — each act of solidarity counts." },
    { eq: "Ψ_Palestine ≠ 0 (unitarity holds)", label: "The Palestinian wave-function cannot collapse. Unitarity forbids it." },
  ];

  return (
    <section className="py-20">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">
            // Physics × Palestine
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold">
            The <span className="gradient-text-quantum">Mathematics</span> of Resilience
          </h2>
        </motion.div>

        <div className="glass-card border border-white/6 p-6 overflow-x-auto">
          <div className="space-y-4">
            {equations.map((item, i) => (
              <motion.div
                key={item.eq}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl hover:bg-white/2 transition-colors group"
              >
                <code className="font-mono text-sm sm:text-base text-quantum whitespace-nowrap group-hover:text-quantum/90 min-w-[280px]">
                  {item.eq}
                </code>
                <span className="text-xs text-foreground/40 leading-relaxed">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function PalestinePage() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <KeffiyehHero />

      {/* ── Quote bar ─────────────────────────────────────────────────────── */}
      <section className="py-10 bg-olive/8 border-y border-olive/15 relative overflow-hidden">
        <div className="absolute inset-0 keffiyeh-bg opacity-30" />
        <div className="section-container relative z-10">
          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-xl sm:text-2xl font-serif text-foreground/80 leading-relaxed italic mb-3">
              &ldquo;We have on this earth what makes life worth living.&rdquo;
            </p>
            <cite className="text-sm text-olive-400 font-mono not-italic">— Mahmoud Darwish</cite>
          </motion.blockquote>
        </div>
      </section>

      {/* ── History timeline ───────────────────────────────────────────────── */}
      <section className="py-20 keffiyeh-bg">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// History</div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              A Brief <span className="gradient-text-olive">History</span>
            </h2>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-olive/30 to-transparent hidden sm:block" />

            <div className="space-y-8">
              {HISTORY.map((item, i) => {
                const Icon = item.icon;
                const accentColor = item.accent === "olive" ? "text-olive-400" : item.accent === "crimson" ? "text-crimson" : "text-quantum";
                const accentBg = item.accent === "olive" ? "bg-olive/12" : item.accent === "crimson" ? "bg-crimson/12" : "bg-quantum/12";
                const accentBorder = item.accent === "olive" ? "border-olive/25" : item.accent === "crimson" ? "border-crimson/25" : "border-quantum/25";

                return (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.07, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
                    className="flex gap-6 sm:gap-8 items-start group"
                  >
                    {/* Timeline node */}
                    <div className="relative flex-shrink-0 hidden sm:flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-xl ${accentBg} border ${accentBorder} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={18} className={accentColor} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`flex-1 glass-card border ${accentBorder} p-5 transition-all duration-300 group-hover:${accentBorder.replace("/25", "/40")}`}>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`text-xs font-mono font-bold ${accentColor} tracking-widest`}>{item.year}</span>
                      </div>
                      <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                      <p className="text-sm text-foreground/55 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Physics bridge ────────────────────────────────────────────────── */}
      <PhysicsBridge />

      {/* ── Poetry ────────────────────────────────────────────────────────── */}
      <section className="py-20 keffiyeh-bg">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="text-xs font-mono text-olive/50 tracking-widest uppercase mb-2">// Poetry</div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Words That <span className="gradient-text-olive">Survive</span>
            </h2>
            <p className="text-foreground/45 text-sm mt-2">From Mahmoud Darwish — poet of resistance and longing</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {POEMS.map((poem, i) => {
              const border = poem.accent === "olive" ? "border-olive/25 hover:border-olive/50" : poem.accent === "crimson" ? "border-crimson/25 hover:border-crimson/50" : "border-quantum/25 hover:border-quantum/50";
              const accentText = poem.accent === "olive" ? "text-olive-400" : poem.accent === "crimson" ? "text-crimson" : "text-quantum";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.6 }}
                  whileHover={{ y: -4 }}
                  className={`glass-card border ${border} p-6 transition-all duration-300 flex flex-col`}
                >
                  <div className="text-3xl mb-4 opacity-30 font-serif leading-none">&ldquo;</div>
                  <blockquote className="flex-1 text-sm text-foreground/70 leading-relaxed italic mb-5 whitespace-pre-line">
                    {poem.text}
                  </blockquote>
                  <div className="border-t border-white/5 pt-4">
                    <p className={`text-xs font-semibold ${accentText}`}>{poem.author}</p>
                    <p className="text-[11px] text-foreground/30 font-mono mt-0.5">{poem.source}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <WaveDivider variant="olive" />

      {/* ── Culture ───────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="text-xs font-mono text-olive/50 tracking-widest uppercase mb-2">// Culture</div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              What We <span className="gradient-text-olive">Carry</span>
            </h2>
            <p className="text-foreground/45 text-sm mt-2">Culture is a form of resistance that cannot be bombed</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CULTURE_ITEMS.map((item, i) => {
              const border = item.accent === "olive" ? "border-olive/20 hover:border-olive/40" : item.accent === "crimson" ? "border-crimson/20 hover:border-crimson/40" : "border-quantum/20 hover:border-quantum/40";
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.92 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 22 }}
                  whileHover={{ y: -5 }}
                  className={`glass-card border ${border} p-6 transition-all duration-300`}
                >
                  <div className="text-4xl mb-4">{item.emoji}</div>
                  <h3 className="font-semibold text-sm mb-2">{item.title}</h3>
                  <p className="text-xs text-foreground/50 leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Science for Palestine ─────────────────────────────────────────── */}
      <section className="py-20 keffiyeh-bg">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-3">// Initiatives</div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-5">
                Science for <span className="gradient-text-olive">Palestine</span>
              </h2>
              <div className="space-y-4 text-sm text-foreground/55 leading-relaxed">
                <p>
                  The need of support to{" "}
                  <span className="text-olive-400 font-medium">Science for Palestinians</span> is
                  more than an initiative, it is a movement that aims to create an international
                  network connecting Palestinian students and early-career researchers with global
                  academic mentors.
                </p>
                <p>
                  The premise is simple: knowledge is not neutral, but it can be weaponised for justice
                  just as easily as for oppression. Palestinian scientists, despite facing movement
                  restrictions, universities under siege, and the violence of occupation, continue
                  to produce research. They deserve support.
                </p>
                <p>
                  Here are some initiatives and organisations that support Palestinian scientists:
                </p>
              </div>

            </motion.div>

            {/* Support organisations */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="space-y-4"
            >
              {SUPPORT_ORGS.map((org, i) => (
                <motion.a
                  key={org.name}
                  href={org.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 260, damping: 22 }}
                  whileHover={{ y: -3 }}
                  className="glass-card border border-olive/20 p-5 hover:border-olive/45 hover:shadow-[0_0_24px_rgba(107,143,39,0.1)] transition-all duration-300 group block cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{org.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm text-foreground/85 group-hover:text-olive-400 transition-colors">{org.name}</h3>
                        <ExternalLink size={12} className="text-foreground/25 group-hover:text-olive-400 transition-colors flex-shrink-0" />
                      </div>
                      <p className="text-xs text-foreground/40 leading-relaxed">{org.desc}</p>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <WaveDivider variant="crimson" />

      {/* ── Resources / Links ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <div className="text-xs font-mono text-quantum/50 tracking-widest uppercase mb-2">// Resources</div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Learn & <span className="gradient-text-quantum">Act</span>
            </h2>
            <p className="text-foreground/45 text-sm mt-2">
              Verified organisations and resources for learning, donating, and advocating
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RESOURCES.map((r, i) => (
              <motion.a
                key={r.label}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
                className="glass-card border border-white/6 p-4 hover:border-olive/35 hover:shadow-[0_0_20px_rgba(107,143,39,0.1)] transition-all duration-300 group cursor-pointer block"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-foreground/85 group-hover:text-olive-400 transition-colors leading-snug">{r.label}</h3>
                  <ExternalLink size={12} className="text-foreground/25 group-hover:text-olive-400 transition-colors flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-foreground/40 leading-relaxed">{r.desc}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final solidarity banner ────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a100a] to-black" />
        <div className="absolute inset-0 keffiyeh-bg opacity-60" />

        {/* Vertical flag stripes */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-black via-white/10 to-black" />
        <div className="absolute left-2 top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-olive/60 to-transparent" />
        <div className="absolute right-2 top-0 bottom-0 w-2 bg-gradient-to-b from-transparent via-crimson/60 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-black via-black/50 to-black" />

        <div className="section-container relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="space-y-5"
          >
            <div className="text-5xl">🇵🇸</div>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white">
              <span className={`text-olive-400 ${palestineFont.className}`}
                style={{
                  lineHeight: 1.6,
                  textAlign: "center",
                  direction: "rtl",
                }}>فَلَسْطِيْن حُرَّة</span>
            </h2>
            <p className="text-xl text-white/70 font-light">Palestine will be free.</p>
            <p className="text-sm text-white/35 font-mono max-w-lg mx-auto leading-relaxed">
              This is not a slogan. It is a declaration of the right of return,
              the right to exist, the right to be free — which belongs to all people
              and cannot be made illegal by those who violate it.
            </p>
            <div className="pt-4">
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-olive/40 hover:border-olive/70 text-olive-400 hover:text-olive-300 font-semibold text-sm transition-all duration-300"
                >
                  <Heart size={14} />
                  Get in touch
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
