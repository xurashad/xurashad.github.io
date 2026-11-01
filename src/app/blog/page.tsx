"use client";

import { motion } from "framer-motion";
import { Clock, ArrowRight, BookOpen, Tag, Calendar, Search, X } from "lucide-react";
import Link from "next/link";
import { TagBadge, WaveDivider } from "@/components/ui";
import { useState, useMemo } from "react";

import { type Post, POSTS, CATEGORIES } from "@/lib/blogData";

/* ─── Featured Post ──────────────────────────────────────────────────────── */
function FeaturedPost({ post }: { post: Post }) {
  const accentClass =
    post.accent === "quantum"
      ? "from-quantum/20 to-quantum/5 border-quantum/25 hover:border-quantum/45"
      : post.accent === "olive"
      ? "from-olive/20 to-olive/5 border-olive/25 hover:border-olive/45"
      : "from-crimson/20 to-crimson/5 border-crimson/25 hover:border-crimson/45";

  const accentText =
    post.accent === "quantum"
      ? "text-quantum"
      : post.accent === "olive"
      ? "text-olive-400"
      : "text-crimson";

  const badgeBg =
    post.accent === "quantum"
      ? "bg-quantum/15 text-quantum border-quantum/30"
      : post.accent === "olive"
      ? "bg-olive/15 text-olive-400 border-olive/30"
      : "bg-crimson/15 text-crimson border-crimson/30";

  return (
    <Link href={`/blog/${post.id}`} className="block h-full group focus:outline-none cursor-pointer">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -4 }}
        className={`glass-card border bg-gradient-to-br ${accentClass} p-5 sm:p-6 relative overflow-hidden h-full flex flex-col justify-between transition-all duration-300 rounded-2xl`}
      >
        <div>
          {post.coverImage && (
            <div className="relative w-full h-48 sm:h-52 mb-4 rounded-xl overflow-hidden border border-white/10 group-hover:border-quantum/40 transition-colors shadow-lg">
              <img
                src={post.coverImage.src}
                alt={post.coverImage.alt}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute top-3 left-3">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-foreground/85 uppercase tracking-widest font-medium">
                  {post.category}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span
                  className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${badgeBg} uppercase tracking-widest font-medium backdrop-blur-md`}
                >
                  Featured
                </span>
              </div>
            </div>
          )}

          {!post.coverImage && (
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs font-mono text-foreground/45 uppercase tracking-widest">
                {post.category}
              </span>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border ${badgeBg} uppercase tracking-widest font-medium`}
              >
                Featured
              </span>
            </div>
          )}

          <h2 className="text-lg sm:text-xl font-serif font-bold leading-tight mb-2.5 group-hover:text-foreground text-foreground/90 transition-colors">
            {post.title}
          </h2>

          <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed mb-5 line-clamp-3 font-sans">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {post.tags.slice(0, 4).map((t) => (
              <TagBadge key={t} label={t} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/8 mt-auto">
          <div className="flex items-center gap-3 text-xs text-foreground/40 font-mono">
            <span className="flex items-center gap-1">
              <Calendar size={11} /> {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {post.readTime} min
            </span>
          </div>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold ${accentText} group-hover:gap-2.5 transition-all duration-200`}
          >
            Read Article <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </span>
        </div>

        {/* Ambient glow with pointer-events-none so it never blocks clicks */}
        <div
          className={`pointer-events-none absolute -bottom-10 -right-10 w-36 h-36 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
            post.accent === "quantum"
              ? "bg-quantum/25"
              : post.accent === "olive"
              ? "bg-olive/20"
              : "bg-crimson/20"
          }`}
        />
      </motion.div>
    </Link>
  );
}

/* ─── Post Card ──────────────────────────────────────────────────────────── */
function PostCard({ post, index }: { post: Post; index: number }) {
  const accentText =
    post.accent === "quantum"
      ? "text-quantum"
      : post.accent === "olive"
      ? "text-olive-400"
      : "text-crimson";

  return (
    <Link href={`/blog/${post.id}`} className="block h-full group focus:outline-none cursor-pointer">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.4 }}
        whileHover={{ y: -3 }}
        className="glass-card border border-white/8 p-5 sm:p-6 transition-all duration-300 hover:border-white/20 h-full flex flex-col justify-between rounded-xl relative overflow-hidden"
      >
        <div>
          {post.coverImage && (
            <div className="relative w-full h-40 sm:h-44 mb-4 rounded-lg overflow-hidden border border-white/10 group-hover:border-quantum/30 transition-colors shadow-md">
              <img
                src={post.coverImage.src}
                alt={post.coverImage.alt}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute top-2.5 left-2.5">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-foreground/80 uppercase tracking-widest">
                  {post.category}
                </span>
              </div>
              {post.featured && (
                <div className="absolute top-2.5 right-2.5">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-quantum/40 text-quantum bg-black/60 backdrop-blur-md">
                    Featured
                  </span>
                </div>
              )}
            </div>
          )}

          {!post.coverImage && (
            <div className="flex items-center justify-between text-[10px] font-mono text-foreground/35 uppercase tracking-widest mb-2.5">
              <span>{post.category}</span>
              {post.featured && (
                <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-quantum/30 text-quantum bg-quantum/10">
                  Featured
                </span>
              )}
            </div>
          )}

          <h3 className="font-serif font-bold text-base leading-snug mb-2.5 text-foreground/90 group-hover:text-quantum transition-colors">
            {post.title}
          </h3>

          <p className="text-xs text-foreground/50 leading-relaxed mb-4 line-clamp-2">
            {post.excerpt}
          </p>

          <div className="flex flex-wrap gap-1 mb-4">
            {post.tags.slice(0, 3).map((t) => (
              <TagBadge key={t} label={t} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-foreground/35 pt-3 border-t border-white/6 mt-auto">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar size={10} /> {post.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {post.readTime} min
            </span>
          </div>
          <span
            className={`flex items-center gap-1 ${accentText} text-xs font-medium group-hover:translate-x-0.5 transition-transform`}
          >
            Read <ArrowRight size={11} />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const featured = useMemo(() => POSTS.filter((p) => p.featured), []);

  const filteredPosts = useMemo(() => {
    return POSTS.filter((p) => {
      const matchesCategory = !activeCategory || p.category === activeCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.excerpt.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const isFiltering = activeCategory !== null || searchQuery.trim() !== "";

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
          className="mb-10"
        >
          <div className="text-xs font-mono text-quantum/55 tracking-widest uppercase mb-3">
            // Longform Writing & Research
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">Blog</span>
          </h1>
          <p className="text-foreground/55 max-w-2xl leading-relaxed text-sm sm:text-base">
            Long-form essays on physics, cosmology, culture, computation, and the intersections where they blur.
            {" "}All {POSTS.length} articles are available below.
          </p>
        </motion.div>

        {/* Search & Category Filter Controls */}
        <div className="space-y-4 mb-10">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title, tag, or topic..."
              className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/4 border border-white/10 text-xs sm:text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:border-quantum/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                !activeCategory
                  ? "bg-quantum/15 text-quantum border-quantum/30 font-medium"
                  : "border-white/8 text-foreground/40 hover:border-white/20 hover:text-foreground/70"
              }`}
            >
              <BookOpen size={11} /> All ({POSTS.length})
            </button>
            {CATEGORIES.map((c) => {
              const count = POSTS.filter((p) => p.category === c).length;
              const isActive = activeCategory === c;
              return (
                <button
                  key={c}
                  onClick={() => setActiveCategory(isActive ? null : c)}
                  className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                    isActive
                      ? "bg-quantum/15 text-quantum border-quantum/30 font-medium"
                      : "border-white/8 text-foreground/40 hover:border-white/20 hover:text-foreground/70"
                  }`}
                >
                  <Tag size={10} /> {c} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── CASE A: Active Filter or Search ─── */}
        {isFiltering ? (
          <div>
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/8">
              <div className="text-xs font-mono text-foreground/40 uppercase tracking-widest">
                // {activeCategory ? `Category: ${activeCategory}` : "Search Results"} ({filteredPosts.length})
              </div>
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setSearchQuery("");
                }}
                className="text-xs font-mono text-quantum hover:underline flex items-center gap-1"
              >
                <X size={12} /> Clear all filters
              </button>
            </div>

            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredPosts.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))}
              </div>
            ) : (
              <div className="glass-card border border-white/8 rounded-2xl p-12 text-center my-8">
                <p className="text-sm font-mono text-foreground/50 mb-3">
                  No articles matched your criteria.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory(null);
                    setSearchQuery("");
                  }}
                  className="text-xs font-mono px-4 py-2 rounded-lg bg-quantum/15 text-quantum border border-quantum/30 hover:bg-quantum/25 transition-all"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ─── CASE B: Default "All" View ─── */
          <>
            {/* Top Featured Highlights */}
            {featured.length > 0 && (
              <div className="mb-14">
                <div className="text-xs font-mono text-quantum tracking-widest uppercase mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-quantum animate-pulse" />
                  // Featured Highlights
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featured.map((post) => (
                    <FeaturedPost key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            <WaveDivider variant="olive" />

            {/* Complete Post Library — All articles displayed */}
            <div className="my-10">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/8">
                <div className="text-xs font-mono text-foreground/45 uppercase tracking-widest">
                  // Complete Archive ({POSTS.length} Articles)
                </div>
                <span className="text-xs font-mono text-foreground/35">
                  Chronological order
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {POSTS.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Wave footer */}
        <WaveDivider variant="crimson" />
        <div className="text-center py-8">
          <p className="text-xs font-mono text-foreground/30">
            More essays and research notes are currently being drafted. ψ
          </p>
        </div>
      </div>
    </div>
  );
}
