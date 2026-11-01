import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, type Post } from "@/lib/blogData";
import { ArrowLeft, ArrowRight, Calendar, Clock, Share2, Tag, BookOpen, User } from "lucide-react";
import { TagBadge, WaveDivider } from "@/components/ui";
import { BlogTableViewer } from "@/components/BlogTableViewer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return POSTS.map((post) => ({
    id: post.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = POSTS.find((p) => p.id === id);

  if (!post) {
    return {
      title: "Post Not Found | Rashad Hamidi",
    };
  }

  return {
    title: `${post.title} | Rashad Hamidi`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      authors: ["Rashad Hamidi"],
      tags: post.tags,
    },
  };
}

function renderInlineText(text: string) {
  // Regex splits on markdown tokens: [link](url), **bold**, *italic*, `code`, and $math$
  // URL matching handles balanced parentheses inside URLs (e.g. Wikipedia pages like .../Columbia_(supercontinent))
  const regex = /(\[[^\]]+\]\((?:[^\s()]|\([^\s()]*\))+\)|\*\*.*?\*\*|\*[^*]+?\*|`[^`]+?`|\$[^\$]+?\$)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith(")")) {
      const splitIdx = part.indexOf("](");
      if (splitIdx !== -1) {
        const label = part.slice(1, splitIdx);
        const href = part.slice(splitIdx + 2, -1);
        const isExternal = href.startsWith("http://") || href.startsWith("https://");
        return (
          <a
            key={i}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-quantum hover:underline underline-offset-4 decoration-quantum/40 hover:decoration-quantum transition-colors font-medium"
          >
            {label}
          </a>
        );
      }
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="text-foreground font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={i} className="italic text-foreground/90 font-serif">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={i} className="font-mono text-xs sm:text-sm text-quantum bg-quantum/10 px-1.5 py-0.5 rounded">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("$") && part.endsWith("$") && part.length >= 2) {
      return (
        <span key={i} className="font-mono text-xs sm:text-sm text-foreground/95 bg-white/5 px-1 py-0.5 rounded">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const postIndex = POSTS.findIndex((p) => p.id === id);

  if (postIndex === -1) {
    notFound();
  }

  const post = POSTS[postIndex];
  const prevPost = postIndex > 0 ? POSTS[postIndex - 1] : null;
  const nextPost = postIndex < POSTS.length - 1 ? POSTS[postIndex + 1] : null;

  const accentBorder =
    post.accent === "quantum"
      ? "border-quantum/30"
      : post.accent === "olive"
        ? "border-olive/30"
        : "border-crimson/30";

  const accentText =
    post.accent === "quantum"
      ? "text-quantum"
      : post.accent === "olive"
        ? "text-olive-400"
        : "text-crimson";

  const accentBg =
    post.accent === "quantum"
      ? "bg-quantum/10"
      : post.accent === "olive"
        ? "bg-olive/10"
        : "bg-crimson/10";

  return (
    <article className="min-h-screen keffiyeh-bg">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-quantum/4 blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-olive/4 blur-[130px]" />
      </div>

      <div className="section-container py-16 pb-32 max-w-4xl">
        {/* Back navigation */}
        <div className="mb-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-mono text-foreground/50 hover:text-quantum transition-colors duration-200 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to All Articles
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono mb-4">
            <span
              className={`px-2.5 py-1 rounded-full border ${accentBg} ${accentText} ${accentBorder} uppercase tracking-wider text-[11px] font-semibold`}
            >
              {post.category}
            </span>
            <span className="flex items-center gap-1.5 text-foreground/45">
              <Calendar size={13} /> {post.date}
            </span>
            <span className="text-foreground/20">·</span>
            <span className="flex items-center gap-1.5 text-foreground/45">
              <Clock size={13} /> {post.readTime} min read
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold leading-tight mb-6">
            {post.title}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <TagBadge key={tag} label={tag} />
            ))}
          </div>

          {/* Excerpt Lead Box */}
          <div
            className={`glass-card p-6 rounded-2xl border ${accentBorder} ${accentBg} relative overflow-hidden`}
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 mb-2">
              Abstract & Core Thesis
            </div>
            <p className="text-base sm:text-lg leading-relaxed text-foreground/80 font-serif italic">
              &ldquo;{post.excerpt}&rdquo;
            </p>
          </div>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="mt-8 rounded-2xl overflow-hidden border border-white/10 glass-card relative shadow-2xl group">
              <img
                src={post.coverImage.src}
                alt={post.coverImage.alt}
                className="w-full h-auto object-cover max-h-[460px]"
              />
              {post.coverImage.caption && (
                <div className="p-3 bg-black/60 backdrop-blur-md text-xs font-mono text-foreground/65 border-t border-white/8 text-center">
                  {post.coverImage.caption}
                </div>
              )}
            </div>
          )}
        </header>

        <WaveDivider variant={post.accent} />

        {/* Article Body Content */}
        <div className="space-y-12 my-12 text-foreground/80 leading-relaxed text-base sm:text-lg font-sans">
          {post.sections && post.sections.length > 0 ? (
            post.sections.map((section, idx) => (
              <section key={idx} className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pt-2 border-b border-white/6 pb-2">
                  <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground tracking-tight">
                    {section.heading}
                  </h2>
                  {section.readTime !== undefined && (
                    <span className="text-[11px] font-mono text-foreground/40 whitespace-nowrap flex items-center gap-1 shrink-0">
                      <Clock size={11} className={accentText} /> ~{section.readTime} min read
                    </span>
                  )}
                </div>

                {section.image && (
                  <div className="my-6 rounded-2xl overflow-hidden border border-white/10 glass-card relative shadow-xl">
                    <img
                      src={section.image.src}
                      alt={section.image.alt}
                      className="w-full h-auto object-cover max-h-[440px]"
                    />
                    {section.image.caption && (
                      <div className="p-3 bg-black/55 backdrop-blur-md text-xs font-mono text-foreground/65 border-t border-white/8 text-center">
                        {section.image.caption}
                      </div>
                    )}
                  </div>
                )}

                {section.body.map((para, pIdx) => {
                  const isCitation = /^\d+\.\s+\*\*/.test(para);
                  if (isCitation) {
                    return (
                      <div
                        key={pIdx}
                        className="pl-4 pr-3 py-2.5 my-2 border-l-2 border-quantum/40 hover:border-quantum bg-white/[0.02] hover:bg-white/[0.04] rounded-r-xl transition-all duration-200 text-sm sm:text-base leading-relaxed text-foreground/85 font-sans"
                      >
                        {renderInlineText(para)}
                      </div>
                    );
                  }
                  return (
                    <p key={pIdx} className="leading-relaxed text-foreground/75 text-base sm:text-lg">
                      {renderInlineText(para)}
                    </p>
                  );
                })}

                {section.table && (
                  <BlogTableViewer table={section.table} accent={post.accent} />
                )}

                {section.callout && (
                  <div
                    className={`my-6 p-5 sm:p-6 rounded-2xl border ${accentBorder} ${accentBg} glass-card relative overflow-hidden`}
                  >
                    {section.callout.tag && (
                      <div className="text-[10px] font-mono uppercase tracking-widest text-quantum mb-1.5 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-quantum" />
                        {section.callout.tag}
                      </div>
                    )}
                    <div className="text-base sm:text-lg font-serif font-bold text-foreground mb-1.5">
                      {section.callout.title}
                    </div>
                    <p className="text-sm text-foreground/75 leading-relaxed font-sans">
                      {section.callout.text}
                    </p>
                  </div>
                )}

                {section.quote && (
                  <blockquote
                    className={`border-l-2 pl-5 py-2 my-6 font-serif italic text-foreground/90 ${accentBorder} ${accentBg} rounded-r-lg`}
                  >
                    {section.quote}
                  </blockquote>
                )}
              </section>
            ))
          ) : (
            <p className="text-foreground/75 leading-relaxed">{post.excerpt}</p>
          )}

          {/* End of article notice */}
          <div className="mt-12 p-6 rounded-xl border border-white/8 glass text-center space-y-3">
            <div className="text-xs font-mono text-quantum tracking-wider uppercase">
              // Theoretical Physics & Longform Reflections
            </div>
            <p className="text-sm text-foreground/60 max-w-xl mx-auto">
              Have feedback, questions, or extensions to discuss? Feel free to reach out.
            </p>
            <div className="pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-xs font-mono px-4 py-2 rounded-lg bg-quantum/15 text-quantum hover:bg-quantum/25 border border-quantum/30 transition-all duration-200"
              >
                Start a Discussion <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        <WaveDivider variant="olive" />

        {/* Author Bio Box */}
        <div className="glass-card border border-white/8 p-6 rounded-2xl my-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-quantum via-nebula to-olive p-0.5 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-quantum font-serif font-bold text-lg">
              RH
            </div>
          </div>
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="text-base font-serif font-bold text-foreground">Rashad Hamidi</div>
            <div className="text-xs font-mono text-foreground/45">
              PhD Researcher at Durham University · Mathematical & Theoretical Physics
            </div>
            <p className="text-xs text-foreground/60 pt-1 leading-relaxed">
              Researching sigma models, integrability, quantum field theories, and exploring mathematical
              geometry in culture, algorithms, and open science.
            </p>
            <div className="pt-2 flex flex-wrap gap-3 justify-center sm:justify-start text-xs font-mono">
              <Link href="/cv" className="text-quantum hover:underline">
                View Academic CV →
              </Link>
              <Link href="/documents" className="text-olive-400 hover:underline">
                Research Papers →
              </Link>
            </div>
          </div>
        </div>

        {/* Pagination: Prev / Next */}
        <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 pt-6 border-t border-white/8">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.id}`}
              className="glass-card p-5 rounded-xl border border-white/6 hover:border-white/15 transition-all duration-200 group flex flex-col"
            >
              <div className="text-[10px] font-mono text-foreground/40 uppercase mb-1 flex items-center gap-1 group-hover:text-quantum transition-colors">
                <ArrowLeft size={10} /> Previous Article
              </div>
              <div className="text-sm font-semibold text-foreground/80 group-hover:text-foreground line-clamp-1">
                {prevPost.title}
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextPost ? (
            <Link
              href={`/blog/${nextPost.id}`}
              className="glass-card p-5 rounded-xl border border-white/6 hover:border-white/15 transition-all duration-200 group flex flex-col items-start sm:items-end text-left sm:text-right"
            >
              <div className="text-[10px] font-mono text-foreground/40 uppercase mb-1 flex items-center gap-1 group-hover:text-quantum transition-colors">
                Next Article <ArrowRight size={10} />
              </div>
              <div className="text-sm font-semibold text-foreground/80 group-hover:text-foreground line-clamp-1">
                {nextPost.title}
              </div>
            </Link>
          ) : (
            <div className="hidden sm:block" />
          )}
        </nav>
      </div>
    </article>
  );
}
