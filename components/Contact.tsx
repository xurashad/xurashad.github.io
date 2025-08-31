
import React from 'react';

const socialLinks = [
  {
    name: 'Email',
    url: 'mailto:johndoe@email.com',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    handle: 'johndoe@email.com'
  },
  {
    name: 'GitHub',
    url: 'https://github.com',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
      </svg>
    ),
    handle: 'johndoe'
  },
  {
    name: 'LinkedIn',
    url: 'https://linkedin.com',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
    ),
    handle: 'john-doe-dev'
  },
];

const ContactLink: React.FC<typeof socialLinks[0]> = ({ name, url, icon, handle }) => (
    <a 
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 transition-all duration-300 hover:border-teal-400/50 hover:bg-slate-800"
    >
        <div className="text-slate-400 group-hover:text-teal-400">{icon}</div>
        <div className="ml-4">
            <p className="text-lg font-semibold text-slate-100">{name}</p>
            <p className="text-slate-400">{handle}</p>
        </div>
    </a>
);


const Contact: React.FC = () => {
  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-4">Get In Touch</h2>
      <p className="text-slate-400 mb-8 max-w-2xl">
        I'm always open to discussing new projects, creative ideas, or opportunities to be part of an ambitious vision. Feel free to reach out.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {socialLinks.map(link => <ContactLink key={link.name} {...link} />)}
      </div>
    </section>
  );
};

export default Contact;
