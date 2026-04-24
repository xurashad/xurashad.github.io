"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight, BookOpen, Tag, Calendar } from "lucide-react";
import Link from "next/link";
import { TagBadge, WaveDivider } from "@/components/ui";
import { useState } from "react";

/* ─── Data ───────────────────────────────────────────────────────────────── */
interface Post {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
  readTime: number;
  accent: "quantum" | "olive" | "crimson";
  featured?: boolean;
  category: string;
}

const POSTS: Post[] = [
  {
    id: "wavefunction-collapse-and-resistance",
    title: "Wave-Function Collapse and the Physics of Resistance",
    excerpt:
      "What does quantum measurement have in common with the experience of Palestinian resilience? In both cases, an observer imposes a definite outcome on a system that exists in superposition — yet the wavefunction does not disappear. It entangles. It persists. This is not metaphor; it is mathematics.",
    tags: ["Quantum Mechanics", "Philosophy", "Palestine"],
    date: "2024-03-15",
    readTime: 12,
    accent: "quantum",
    featured: true,
    category: "Physics × Culture",
  },
  {
    id: "keffiyeh-and-crystallography",
    title: "The Keffiyeh and Crystallography: A Love Story",
    excerpt:
      "The Keffiyeh's fishnet pattern is not merely decorative — it belongs to the wallpaper symmetry group p4mm, the same symmetry governing salt crystals, graphene, and superconducting cuprate lattices. This mathematical beauty encoded in Palestinian fabric has survived colonisation, exile, and erasure.",
    tags: ["Culture", "Symmetry", "Mathematics"],
    date: "2024-02-08",
    readTime: 8,
    accent: "olive",
    featured: true,
    category: "Culture × Science",
  },
  {
    id: "lattice-qcd-beginners",
    title: "Lattice QCD for the Impatient: A Practical Introduction",
    excerpt:
      "Quantum Chromodynamics cannot be solved analytically for low-energy bound states. The lattice is our only first-principles tool — discretise spacetime, compute path integrals numerically, take the continuum limit. Here I walk you through the method from Wilson action to hadron masses.",
    tags: ["QCD", "Tutorial", "Lattice"],
    date: "2024-01-20",
    readTime: 25,
    accent: "quantum",
    category: "Tutorials",
  },
  {
    id: "topological-defects-cosmology",
    title: "Topological Defects: When the Universe Got Confused",
    excerpt:
      "In the early universe, as the temperature dropped below critical values, the vacuum settled into different field configurations in causally disconnected regions. Where they met, topological defects formed: cosmic strings, monopoles, domain walls. The mathematics is beautiful; the observational hunt is ongoing.",
    tags: ["Cosmology", "QFT", "Topology"],
    date: "2023-12-05",
    readTime: 18,
    accent: "crimson",
    featured: true,
    category: "Research",
  },
  {
    id: "open-data-palestine",
    title: "Why Open Data is an Act of Palestinian Resistance",
    excerpt:
      "Data about Palestine has historically been controlled by entities with interests in its suppression or distortion. Building open, freely accessible, verifiable datasets of Palestinian demography, history, and geography is not merely a technical choice — it is a political and moral one.",
    tags: ["Palestine", "Open Data", "Policy"],
    date: "2023-11-12",
    readTime: 10,
    accent: "olive",
    category: "Palestine",
  },
  {
    id: "ml-for-orbital-mechanics",
    title: "Machine Learning for Orbital Mechanics: Gaussian Processes in Space",
    excerpt:
      "Classical numerical methods solve orbital mechanics equations exactly but are computationally expensive. Gaussian Process Regression offers a probabilistic surrogate that runs in milliseconds and provides calibrated uncertainty estimates — critical for collision avoidance and mission planning.",
    tags: ["ML", "Astrodynamics", "Tutorial"],
    date: "2023-10-28",
    readTime: 20,
    accent: "quantum",
    category: "Tutorials",
  },
  {
    id: "physics-grief",
    title: "Physics and Grief: Notes from Gaza",
    excerpt:
      "Energy is conserved. Momentum is conserved. Information, according to unitarity, is conserved. Yet people die and the universe seems indifferent. These are notes written in the margins of research papers during a period when physics felt both more and less meaningful than it ever had.",
    tags: ["Palestine", "Personal", "Philosophy"],
    date: "2023-10-07",
    readTime: 6,
    accent: "crimson",
    featured: true,
    category: "Palestine",
  },
  {
    id: "quantum-computing-hype",
    title: "Quantum Computing: Separating Signal from the Noise",
    excerpt:
      "Every week brings a new headline announcing quantum supremacy, quantum advantage, or revolutionary breakthroughs. As a physicist, let me offer a grounded assessment: what is actually happening, what the timelines realistically look like, and where the genuine excitement should be directed.",
    tags: ["Quantum Computing", "Analysis"],
    date: "2023-09-14",
    readTime: 15,
    accent: "quantum",
    category: "Analysis",
  },
];

const CATEGORIES = Array.from(new Set(POSTS.map((p) => p.category)));

/* ─── Featured Post ──────────────────────────────────────────────────────── */
function FeaturedPost({ post }: { post: Post }) {
  const accentClass = post.accent === "quantum" ? "from-quantum/20 to-quantum/5 border-quantum/25"
    : post.accent === "olive" ? "from-olive/20 to-olive/5 border-olive/25"
      : "from-crimson/20 to-crimson/5 border-crimson/25";
  const accentText = post.accent === "quantum" ? "text-quantum" : post.accent === "olive" ? "text-olive-400" : "text-crimson";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -4 }}
      className={`glass-card border bg-gradient-to-br ${accentClass} p-8 relative overflow-hidden group`}
    >
      <div className="absolute top-4 right-4">
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${post.accent === "quantum" ? "bg-quantum/15 text-quantum border-quantum/30" : post.accent === "olive" ? "bg-olive/15 text-olive-400 border-olive/30" : "bg-crimson/15 text-crimson border-crimson/30"} uppercase tracking-widest`}>
          Featured
        </span>
      </div>
      <div className="text-xs font-mono text-foreground/30 mb-3 uppercase tracking-widest">{post.category}</div>
      <h2 className="text-xl sm:text-2xl font-serif font-bold leading-tight mb-4">{post.title}</h2>
      <p className="text-sm text-foreground/55 leading-relaxed mb-5 line-clamp-3">{post.excerpt}</p>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {post.tags.map((t) => <TagBadge key={t} label={t} />)}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-foreground/35 font-mono">
          <span className="flex items-center gap-1"><Calendar size={10} /> {post.date}</span>
          <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime} min</span>
        </div>
        <Link href={`/blog/${post.id}`} className={`flex items-center gap-1.5 text-xs font-semibold ${accentText} group-hover:gap-2.5 transition-all duration-200`}>
          Read <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${post.accent === "quantum" ? "bg-quantum/20" : post.accent === "olive" ? "bg-olive/15" : "bg-crimson/15"}`} />
    </motion.div>
  );
}

/* ─── Post Card ──────────────────────────────────────────────────────────── */
function PostCard({ post, index }: { post: Post; index: number }) {
  const accentText = post.accent === "quantum" ? "text-quantum" : post.accent === "olive" ? "text-olive-400" : "text-crimson";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45 }}
      whileHover={{ y: -3 }}
      className="glass-card border border-white/6 p-5 transition-all duration-300 hover:border-white/12 group"
    >
      <div className="text-[10px] font-mono text-foreground/25 uppercase tracking-widest mb-2">{post.category}</div>
      <h3 className="font-semibold text-sm leading-snug mb-2 group-hover:text-foreground transition-colors">{post.title}</h3>
      <p className="text-xs text-foreground/40 leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {post.tags.map((t) => <TagBadge key={t} label={t} />)}
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-foreground/30">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Calendar size={9} /> {post.date}</span>
          <span className="flex items-center gap-1"><Clock size={9} /> {post.readTime} min</span>
        </div>
        <Link href={`/blog/${post.id}`} className={`flex items-center gap-1 ${accentText} text-xs opacity-70 hover:opacity-100 transition-opacity`}>
          Read <ArrowRight size={10} />
        </Link>
      </div>
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const featured = POSTS.filter((p) => p.featured);
  const regular = POSTS.filter((p) =>
    (!p.featured || activeCategory) &&
    (!activeCategory || p.category === activeCategory)
  );
  const filteredRegular = activeCategory
    ? POSTS.filter((p) => p.category === activeCategory)
    : POSTS.filter((p) => !p.featured);

  return (
    <div className="min-h-screen keffiyeh-bg">
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/5 w-96 h-96 rounded-full bg-quantum/3 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full bg-olive/4 blur-[100px]" />
      </div>

      <div className="section-container py-16 pb-32">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">// Longform Writing</div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Blog</span>
          </h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">
            Long-form essays on quantum physics, Palestinian culture, machine learning, and the intersections where they blur.
            {" "}{POSTS.length} articles and counting.
          </p>
        </motion.div>

        {/* Category filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${!activeCategory ? "bg-quantum/15 text-quantum border-quantum/30" : "border-white/8 text-foreground/35 hover:border-white/20"}`}
          >
            <BookOpen size={11} /> All ({POSTS.length})
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-all ${activeCategory === c ? "bg-quantum/15 text-quantum border-quantum/30" : "border-white/8 text-foreground/35 hover:border-white/20"}`}
            >
              <Tag size={10} /> {c} ({POSTS.filter((p) => p.category === c).length})
            </button>
          ))}
        </motion.div>

        {/* Featured posts — always shown unless category filter active */}
        {!activeCategory && (
          <>
            <div className="text-xs font-mono text-foreground/30 uppercase tracking-widest mb-4">// Featured</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {featured.slice(0, 4).map((post) => (
                <FeaturedPost key={post.id} post={post} />
              ))}
            </div>
            <WaveDivider variant="olive" />
            <div className="text-xs font-mono text-foreground/30 uppercase tracking-widest mb-6">// All Posts</div>
          </>
        )}

        {/* Post list */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(activeCategory ? POSTS.filter((p) => p.category === activeCategory) : POSTS.filter((p) => !p.featured)).map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>

        {/* Wave footer */}
        <WaveDivider variant="crimson" />
        <div className="text-center py-8">
          <p className="text-xs font-mono text-foreground/25">
            More articles being written — check back soon. ψ
          </p>
        </div>
      </div>
    </div>
  );
}
