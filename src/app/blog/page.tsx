import { POSTS, CATEGORIES } from "@/lib/blogData";
import { BlogClient, type PostSummary } from "./BlogClient";

export default function BlogPage() {
  const summaries: PostSummary[] = POSTS.map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    tags: post.tags,
    date: post.date,
    readTime: post.readTime,
    characterCount: post.characterCount,
    accent: post.accent,
    featured: post.featured,
    category: post.category,
    coverImage: post.coverImage,
  }));

  return <BlogClient posts={summaries} categories={CATEGORIES} />;
}
