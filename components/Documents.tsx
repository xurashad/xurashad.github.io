
import React from 'react';

const documents = [
  {
    name: 'Whitepaper: The Future of AI in Web Development',
    description: 'An in-depth analysis of emerging AI trends and their impact on frontend engineering.',
    fileUrl: '#',
    fileType: 'PDF'
  },
  {
    name: 'Case Study: Performance Optimization for a Large-Scale React App',
    description: 'Details on how we improved load times by 50% and reduced bundle size.',
    fileUrl: '#',
    fileType: 'PDF'
  },
  {
    name: 'Certification: Advanced TypeScript Specialist',
    description: 'Official certification demonstrating expert-level proficiency in TypeScript.',
    fileUrl: '#',
    fileType: 'PNG'
  }
];

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);


const DocumentItem: React.FC<typeof documents[0]> = ({ name, description, fileUrl, fileType }) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-800/50 p-6 rounded-lg border border-slate-700/50">
    <div>
      <h3 className="text-lg font-semibold text-slate-100">{name}</h3>
      <p className="text-slate-400 mt-1">{description}</p>
    </div>
    <a 
      href={fileUrl} 
      download
      className="flex items-center justify-center mt-4 sm:mt-0 sm:ml-6 bg-slate-700 text-slate-200 py-2 px-4 rounded-md text-sm font-medium hover:bg-slate-600 transition-colors flex-shrink-0"
    >
      <DownloadIcon />
      Download ({fileType})
    </a>
  </div>
);


const Documents: React.FC = () => {
  return (
    <section className="animate-fade-in">
      <h2 className="text-3xl font-bold text-white mb-8">Documents & Resources</h2>
      <div className="space-y-6">
        {documents.map(doc => <DocumentItem key={doc.name} {...doc} />)}
      </div>
    </section>
  );
};

export default Documents;
