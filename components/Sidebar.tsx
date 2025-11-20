import React from 'react';
import { NewChatIcon } from './icons/NewChatIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { SearchIcon } from './icons/SearchIcon';
import { SettingsIcon } from './icons/SettingsIcon';

const Sidebar: React.FC = () => {
  return (
    <aside className="w-16 bg-zinc-900/50 flex flex-col items-center py-4 px-2 border-r border-zinc-800">
      <div className="flex flex-col items-center space-y-4">
        {/* Placeholder for a main action or logo */}
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
        </button>
      </div>
      <nav className="flex flex-col items-center space-y-3 mt-8">
        <a href="#" className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="New Chat">
          <NewChatIcon className="w-6 h-6" />
        </a>
        <a href="#" className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="Search">
          <SearchIcon className="w-6 h-6" />
        </a>
        <a href="#" className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="History">
          <HistoryIcon className="w-6 h-6" />
        </a>
      </nav>
      <div className="mt-auto flex flex-col items-center space-y-3">
        <button className="p-2 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors" aria-label="Settings">
            <SettingsIcon className="w-6 h-6" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold">
            K
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
