
import React from 'react';

const CVSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-2xl font-semibold text-teal-400 mb-4 pb-2 border-b-2 border-slate-700">{title}</h3>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const CVEntry: React.FC<{ title: string; subtitle: string; date: string; children: React.ReactNode }> = ({ title, subtitle, date, children }) => (
  <div>
    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1">
      <h4 className="text-xl font-bold text-slate-100">{title}</h4>
      <p className="text-slate-400 text-sm sm:text-base">{date}</p>
    </div>
    <p className="text-lg text-slate-300 italic mb-2">{subtitle}</p>
    <ul className="list-disc list-inside text-slate-400 space-y-1">
      {children}
    </ul>
  </div>
);

const skills = [
  "React", "TypeScript", "JavaScript (ES6+)", "Next.js", "Node.js", "Tailwind CSS",
  "GraphQL", "REST APIs", "Jest", "React Testing Library", "Webpack", "Vite"
];

const CV: React.FC = () => {
  return (
    <section className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white">Curriculum Vitae</h2>
        <a href="#" className="bg-teal-500 text-white py-2 px-4 rounded-md font-medium hover:bg-teal-600 transition-colors">Download PDF</a>
      </div>

      <div className="bg-slate-800/50 p-6 sm:p-8 rounded-lg border border-slate-700/50">
        <CVSection title="Experience">
          <CVEntry title="Senior Frontend Engineer" subtitle="Tech Solutions Inc." date="2018 - Present">
            <ul>
              <li>Led the development of a high-traffic e-commerce platform using React and Next.js.</li>
              <li>Architected and implemented a state management solution with Redux Toolkit, improving performance by 30%.</li>
              <li>Mentored junior developers and established best practices for code reviews and testing.</li>
            </ul>
          </CVEntry>
          <CVEntry title="Frontend Developer" subtitle="Digital Innovations LLC" date="2015 - 2018">
            <ul>
              <li>Developed and maintained client-facing dashboards using React and D3.js.</li>
              <li>Collaborated with UI/UX designers to create responsive and accessible user interfaces.</li>
              <li>Migrated a legacy AngularJS application to a modern React codebase.</li>
            </ul>
          </CVEntry>
        </CVSection>

        <CVSection title="Education">
          <CVEntry title="B.S. in Computer Science" subtitle="State University" date="2011 - 2015">
            <ul>
              <li>Graduated with honors, focusing on human-computer interaction and software engineering principles.</li>
            </ul>
          </CVEntry>
        </CVSection>

        <CVSection title="Skills">
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill} className="bg-slate-700 text-teal-300 text-sm font-medium px-3 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </CVSection>
      </div>
    </section>
  );
};

export default CV;
