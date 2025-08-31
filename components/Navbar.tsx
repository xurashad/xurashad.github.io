
import React from 'react';
import { Page } from '../types';
import { NAV_ITEMS, NavItem } from '../constants';

interface NavbarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  return (
    <nav className="bg-slate-800/50 backdrop-blur-sm p-2 sm:p-4 flex flex-col items-center sm:items-start space-y-2 border-r border-slate-700/50 sticky top-0 h-screen">
      <div className="p-2 mb-6 hidden sm:block">
        <h1 className="text-2xl font-bold text-teal-400">J. Doe</h1>
        <p className="text-slate-400 text-sm">Frontend Engineer</p>
      </div>
       <div className="p-2 mb-6 sm:hidden">
        <div className="w-10 h-10 bg-teal-400 rounded-full flex items-center justify-center text-slate-900 font-bold text-lg">
          JD
        </div>
      </div>
      <ul className="flex flex-col space-y-2">
        {NAV_ITEMS.map((item: NavItem) => (
          <li key={item.name}>
            <button
              onClick={() => setActivePage(item.name)}
              className={`flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group ${
                activePage === item.name
                  ? 'bg-teal-400/10 text-teal-300'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span className="hidden sm:inline-block font-medium">{item.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
