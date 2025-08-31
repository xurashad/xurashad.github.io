
import React from 'react';

const projects = [
  {
    title: 'AI Story Generator',
    description: 'A web app that uses the Gemini API to generate short stories for children based on user prompts.',
    imageUrl: 'https://picsum.photos/seed/app1/400/300',
    liveUrl: '#',
    sourceUrl: '#',
  },
  {
    title: 'Interactive Data Dashboard',
    description: 'A complex dashboard for visualizing real-time data using React and D3.js, with customizable charts.',
    imageUrl: 'https://picsum.photos/seed/app2/400/300',
    liveUrl: '#',
    sourceUrl: '#',
  },
  {
    title: 'E-commerce Platform UI',
    description: 'A sleek, modern, and fully responsive user interface for an online store, built with Next.js.',
    imageUrl: 'https://picsum.photos/seed/app3/400/300',
    liveUrl: '#',
    sourceUrl: '#',
  },
  {
    title: 'Personal Finance Tracker',
    description: 'A PWA to track expenses and manage budgets, featuring secure authentication and data persistence.',
    imageUrl: 'https://picsum.photos/seed/app4/400/300',
    liveUrl: '#',
    sourceUrl: '#',
  },
];

const AppCard: React.FC<typeof projects[0]> = ({ title, description, imageUrl, liveUrl, sourceUrl }) => (
  <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50 transition-all duration-300 hover:shadow-xl hover:border-teal-400/50 hover:scale-[1.02]">
    <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
    <div className="p-6">
      <h3 className="text-xl font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-400 mb-4">{description}</p>
      <div className="flex space-x-4">
        <a href={liveUrl} className="bg-teal-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-teal-600 transition-colors">View Live</a>
        <a href={sourceUrl} className="bg-slate-700 text-slate-200 py-2 px-4 rounded-md text-sm font-medium hover:bg-slate-600 transition-colors">Source Code</a>
      </div>
    </div>
  </div>
);

const Apps: React.FC = () => {
  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-8">My Applications</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <AppCard key={project.title} {...project} />
        ))}
      </div>
    </section>
  );
};

export default Apps;
