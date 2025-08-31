
import React from 'react';

const posts = [
  {
    title: "Mastering React Hooks: A Deep Dive into useEffect",
    date: "October 26, 2023",
    excerpt: "Explore the intricacies of the useEffect hook in React. Learn about dependency arrays, cleanup functions, and common pitfalls to avoid infinite loops and memory leaks.",
    url: "#"
  },
  {
    title: "Building AI-Powered Apps with the Gemini API and React",
    date: "September 15, 2023",
    excerpt: "A step-by-step guide to integrating Google's Gemini API into a React application to create dynamic, intelligent, and interactive user experiences.",
    url: "#"
  },
  {
    title: "Why Tailwind CSS is a Game-Changer for Frontend Development",
    date: "August 02, 2023",
    excerpt: "An opinion piece on the benefits of utility-first CSS frameworks like Tailwind, and how they can drastically improve development speed and maintainability.",
    url: "#"
  }
];

const PostItem: React.FC<typeof posts[0]> = ({ title, date, excerpt, url }) => (
  <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50 transition-all duration-300 hover:border-teal-400/50">
    <p className="text-sm text-slate-400 mb-2">{date}</p>
    <h3 className="text-xl font-semibold text-slate-100 mb-3">{title}</h3>
    <p className="text-slate-300 mb-4">{excerpt}</p>
    <a href={url} className="text-teal-400 font-medium hover:text-teal-300 transition-colors">
      Read More &rarr;
    </a>
  </div>
);

const Posts: React.FC = () => {
  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-8">Recent Posts</h2>
      <div className="space-y-6">
        {posts.map(post => <PostItem key={post.title} {...post} />)}
      </div>
    </section>
  );
};

export default Posts;
