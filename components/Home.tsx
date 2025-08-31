
import React from 'react';

const Home: React.FC = () => {
  return (
    <section className="animate-fade-in space-y-8">
      <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
        <img
          src="https://picsum.photos/seed/homepage/200/200"
          alt="Profile"
          className="w-40 h-40 rounded-full object-cover border-4 border-slate-700 shadow-lg"
        />
        <div className="text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">John Doe</h1>
          <p className="text-xl text-teal-400 mt-2">World-Class Senior Frontend React Engineer</p>
        </div>
      </div>
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
        <h2 className="text-2xl font-semibold text-slate-200 mb-4">About Me</h2>
        <p className="text-slate-300 leading-relaxed">
          I am a passionate frontend engineer with over a decade of experience in building beautiful, responsive, and highly performant web applications. My expertise lies in the React ecosystem, TypeScript, and modern UI/UX design principles. I thrive on solving complex problems and creating intuitive user experiences. I have a deep understanding of Gemini API and how to leverage its power to build next-generation AI-powered applications.
        </p>
      </div>
       <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
        <h2 className="text-2xl font-semibold text-slate-200 mb-4">What I Do</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="flex items-start space-x-3">
                <span className="text-teal-400 mt-1">&#10003;</span>
                <p>Developing scalable single-page applications with React & TypeScript.</p>
            </div>
            <div className="flex items-start space-x-3">
                <span className="text-teal-400 mt-1">&#10003;</span>
                <p>Crafting pixel-perfect, responsive UIs with Tailwind CSS.</p>
            </div>
            <div className="flex items-start space-x-3">
                <span className="text-teal-400 mt-1">&#10003;</span>
                <p>Integrating with AI services like Gemini for intelligent features.</p>
            </div>
            <div className="flex items-start space-x-3">
                <span className="text-teal-400 mt-1">&#10003;</span>
                <p>Focusing on code quality, performance, and accessibility.</p>
            </div>
        </div>
       </div>
    </section>
  );
};

export default Home;
