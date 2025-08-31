
import React, { useState } from 'react';
import { Page } from './types';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Apps from './components/Apps';
import Posts from './components/Posts';
import Documents from './components/Documents';
import CV from './components/CV';
import Contact from './components/Contact';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Home');

  const renderContent = () => {
    switch (activePage) {
      case 'Home':
        return <Home />;
      case 'Apps':
        return <Apps />;
      case 'Posts':
        return <Posts />;
      case 'Documents':
        return <Documents />;
      case 'CV':
        return <CV />;
      case 'Contact':
        return <Contact />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 font-sans">
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
