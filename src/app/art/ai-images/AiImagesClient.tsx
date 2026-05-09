"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, ArrowUpDown, X, Tag,
  ChevronLeft, ChevronRight, ImageIcon, Cpu, Calendar,
  Sparkles, Layers, Copy, Check,
} from "lucide-react";
import { IMAGE_POSTS, type ImagePost } from "./data";

/* ─── Derived filter options ──────────────────────────────────────────────── */
const ALL_TAGS = [...new Set(IMAGE_POSTS.flatMap((p) => p.tags))].sort();
const ALL_MODELS = [...new Set(IMAGE_POSTS.map((p) => p.model))].sort();

/* ─── Sort options ────────────────────────────────────────────────────────── */
type SortOrder = "newest" | "oldest";

/* ─── Image Card ──────────────────────────────────────────────────────────── */
function ImageCard({
  post,
  index,
  onClick,
}: {
  post: ImagePost;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer relative overflow-hidden rounded-2xl border border-white/8 hover:border-quantum/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,195,245,0.12)]"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-void/30">
        <Image
          src={post.images[0]}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Multi-image badge */}
        {post.images.length > 1 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono border border-white/10">
            <Layers size={10} />
            {post.images.length}
          </div>
        )}

        {/* Title overlay on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-sm font-semibold text-white truncate">
            {post.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono text-white/60">
              {post.model}
            </span>
            {post.tags.length > 0 && (
              <span className="text-[10px] font-mono text-quantum/80">
                {post.tags[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Detail Modal ────────────────────────────────────────────────────────── */
function DetailModal({
  post,
  onClose,
}: {
  post: ImagePost;
  onClose: () => void;
}) {
  const [currentImg, setCurrentImg] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentImg > 0) setCurrentImg((i) => i - 1);
      if (e.key === "ArrowRight" && currentImg < post.images.length - 1)
        setCurrentImg((i) => i + 1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, currentImg, post.images.length]);

  const copyPrompt = useCallback(() => {
    if (post.prompt) {
      navigator.clipboard.writeText(post.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [post.prompt]);

  /* Gather optional metadata fields */
  const metaFields: { label: string; value: string }[] = [];
  if (post.seed) metaFields.push({ label: "Seed", value: post.seed });
  if (post.steps) metaFields.push({ label: "Steps", value: String(post.steps) });
  if (post.cfg) metaFields.push({ label: "CFG Scale", value: String(post.cfg) });
  if (post.sampler) metaFields.push({ label: "Sampler", value: post.sampler });
  if (post.width && post.height)
    metaFields.push({ label: "Dimensions", value: `${post.width} × ${post.height}` });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-y-auto glass-card border border-white/10 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Image section */}
          <div className="flex-1 p-4 lg:p-6 flex flex-col items-center justify-center min-h-[300px] lg:min-h-[500px]">
            {/* Main image */}
            <div className="relative w-full aspect-auto max-h-[60vh] flex items-center justify-center">
              <Image
                src={post.images[currentImg]}
                alt={`${post.title} - image ${currentImg + 1}`}
                width={900}
                height={900}
                className="object-contain max-h-[60vh] rounded-xl"
                priority
              />
            </div>

            {/* Multi-image navigation */}
            {post.images.length > 1 && (
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setCurrentImg((i) => Math.max(0, i - 1))}
                  disabled={currentImg === 0}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Thumbnail strip */}
                <div className="flex gap-2">
                  {post.images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        i === currentImg
                          ? "border-quantum shadow-[0_0_10px_rgba(0,195,245,0.3)]"
                          : "border-white/10 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentImg((i) => Math.min(post.images.length - 1, i + 1))
                  }
                  disabled={currentImg === post.images.length - 1}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>

                <span className="text-xs font-mono text-foreground/30 ml-2">
                  {currentImg + 1} / {post.images.length}
                </span>
              </div>
            )}
          </div>

          {/* Metadata panel */}
          <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-white/8 p-6 space-y-5 bg-black/20">
            {/* Title */}
            <div>
              <h2 className="text-xl font-serif font-bold mb-1">{post.title}</h2>
              <div className="flex items-center gap-2 text-xs text-foreground/40 font-mono">
                <Calendar size={11} />
                {new Date(post.date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>

            {/* Description */}
            {post.description && (
              <div>
                <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-1">
                  Description
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  {post.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Tag size={10} />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-quantum/10 text-quantum border border-quantum/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Model */}
            <div>
              <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-1 flex items-center gap-1">
                <Cpu size={10} />
                Model
              </div>
              <span className="text-sm font-medium text-foreground/70">
                {post.model}
              </span>
            </div>

            {/* Prompt */}
            {post.prompt && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={10} />
                    Prompt
                  </div>
                  <button
                    onClick={copyPrompt}
                    className="flex items-center gap-1 text-[10px] font-mono text-foreground/30 hover:text-quantum transition-colors"
                  >
                    {copied ? <Check size={10} /> : <Copy size={10} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/6">
                  <p className="text-xs font-mono text-foreground/50 leading-relaxed break-words whitespace-pre-wrap">
                    {post.prompt}
                  </p>
                </div>
              </div>
            )}

            {/* Negative prompt */}
            {post.negativePrompt && (
              <div>
                <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-1">
                  Negative Prompt
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/6">
                  <p className="text-xs font-mono text-crimson/50 leading-relaxed break-words whitespace-pre-wrap">
                    {post.negativePrompt}
                  </p>
                </div>
              </div>
            )}

            {/* Optional metadata fields */}
            {metaFields.length > 0 && (
              <div>
                <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-2">
                  Generation Parameters
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {metaFields.map(({ label, value }) => (
                    <div
                      key={label}
                      className="p-2 rounded-lg bg-black/20 border border-white/5"
                    >
                      <div className="text-[9px] font-mono text-foreground/25 uppercase">
                        {label}
                      </div>
                      <div className="text-xs font-mono text-foreground/60 mt-0.5">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Gallery Component ──────────────────────────────────────────────── */
export default function AiImagesClient() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<ImagePost | null>(null);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setSelectedTags(new Set());
    setSelectedModel(null);
  }, []);

  const filtered = useMemo(() => {
    let posts = [...IMAGE_POSTS];

    // Search
    if (search) {
      const q = search.toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          p.prompt?.toLowerCase().includes(q) ||
          p.model.toLowerCase().includes(q)
      );
    }

    // Tag filter
    if (selectedTags.size > 0) {
      posts = posts.filter((p) =>
        [...selectedTags].every((t) => p.tags.includes(t))
      );
    }

    // Model filter
    if (selectedModel) {
      posts = posts.filter((p) => p.model === selectedModel);
    }

    // Sort
    posts.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sort === "newest" ? db - da : da - db;
    });

    return posts;
  }, [search, selectedTags, selectedModel, sort]);

  const hasFilters = search || selectedTags.size > 0 || selectedModel;

  return (
    <div className="min-h-screen keffiyeh-bg">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-quantum/3 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 rounded-full bg-olive/4 blur-[100px]" />
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
            // Art / AI Image Generations
          </div>
          <h1 className="text-5xl sm:text-6xl font-serif font-bold mb-4">
            <span className="gradient-text-quantum">AI Images</span>
          </h1>
          <p className="text-foreground/50 max-w-2xl leading-relaxed">
            Browse AI-generated artwork. Click any image for full details — prompt,
            model, tags, and generation parameters.
          </p>

          <div className="flex items-center gap-4 mt-5 text-sm text-foreground/40">
            <div className="flex items-center gap-2">
              <ImageIcon size={13} className="text-quantum/50" />
              <span className="text-foreground/70 font-semibold">
                {IMAGE_POSTS.length}
              </span>{" "}
              total images
            </div>
            <div className="flex items-center gap-2">
              <Cpu size={13} className="text-olive/50" />
              <span className="text-foreground/70 font-semibold">
                {ALL_MODELS.length}
              </span>{" "}
              models
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4 mb-8"
        >
          {/* Search + Sort + Filter toggle */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30"
              />
              <input
                type="text"
                placeholder="Search images, tags, prompts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl glass border border-white/8 bg-transparent text-sm text-foreground/80 placeholder:text-foreground/25 focus:outline-none focus:border-quantum/40 transition-all"
              />
            </div>

            {/* Sort toggle */}
            <button
              onClick={() =>
                setSort((s) => (s === "newest" ? "oldest" : "newest"))
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-white/8 text-sm text-foreground/60 hover:text-foreground hover:border-quantum/30 transition-all"
            >
              <ArrowUpDown size={14} />
              {sort === "newest" ? "Newest First" : "Oldest First"}
            </button>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl glass border text-sm transition-all ${
                showFilters || hasFilters
                  ? "border-quantum/30 text-quantum bg-quantum/5"
                  : "border-white/8 text-foreground/60 hover:text-foreground"
              }`}
            >
              <SlidersHorizontal size={14} />
              Filters
              {hasFilters && (
                <span className="w-2 h-2 rounded-full bg-quantum animate-pulse" />
              )}
            </button>
          </div>

          {/* Filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="glass-card border border-white/8 p-5 space-y-4">
                  {/* Tags */}
                  <div>
                    <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Tag size={10} />
                      Tags
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                            selectedTags.has(tag)
                              ? "bg-quantum/15 text-quantum border-quantum/30"
                              : "border-white/8 text-foreground/35 hover:border-white/20"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Models */}
                  <div>
                    <div className="text-[10px] font-mono text-foreground/30 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <Cpu size={10} />
                      Model
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setSelectedModel(null)}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                          !selectedModel
                            ? "bg-quantum/15 text-quantum border-quantum/30"
                            : "border-white/8 text-foreground/35 hover:border-white/20"
                        }`}
                      >
                        All
                      </button>
                      {ALL_MODELS.map((model) => (
                        <button
                          key={model}
                          onClick={() =>
                            setSelectedModel(
                              selectedModel === model ? null : model
                            )
                          }
                          className={`text-[11px] font-mono px-2.5 py-1 rounded-full border transition-all ${
                            selectedModel === model
                              ? "bg-quantum/15 text-quantum border-quantum/30"
                              : "border-white/8 text-foreground/35 hover:border-white/20"
                          }`}
                        >
                          {model}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear */}
                  {hasFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-xs font-mono text-foreground/30 hover:text-quantum transition-colors"
                    >
                      Clear all filters ×
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <div className="text-xs font-mono text-foreground/30 flex items-center gap-2">
            Showing {filtered.length} of {IMAGE_POSTS.length} images
          </div>
        </motion.div>

        {/* Gallery Grid */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 text-foreground/25 font-mono"
            >
              <ImageIcon size={40} className="mx-auto mb-4 opacity-30" />
              <p>No images match your filters.</p>
              <button
                onClick={clearFilters}
                className="text-xs text-quantum/60 hover:text-quantum mt-2 underline"
              >
                Clear filters
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={`grid-${sort}-${selectedModel}-${[...selectedTags].join()}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
            >
              {filtered.map((post, i) => (
                <ImageCard
                  key={post.id}
                  post={post}
                  index={i}
                  onClick={() => setSelected(post)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selected && (
          <DetailModal
            post={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
