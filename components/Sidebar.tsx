
import React from 'react';
import { NewChatIcon } from './icons/NewChatIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { SearchIcon } from './icons/SearchIcon';
// Added missing UpgradeIcon import
import { UpgradeIcon } from './icons/UpgradeIcon';
import type { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  activeSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession
}) => {
  return (
    <aside className="hidden md:flex w-[260px] bg-[#0d0d0d] flex-col h-full shrink-0 border-r border-white/5">
      <div className="p-3">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-white text-sm font-medium group"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <NewChatIcon className="w-4 h-4 text-white" />
            </div>
            New Chat
          </div>
          <svg className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 py-2 custom-scrollbar">
        {sessions.length > 0 && (
           <div className="px-3 mb-2">
             <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Recent Chats</span>
           </div>
        )}
        
        {sessions.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="text-zinc-600 text-xs">History will appear here</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                activeSessionId === session.id 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <div className="flex-1 truncate text-sm">
                {session.title || 'Untitled Chat'}
              </div>
              
              <button 
                onClick={(e) => onDeleteSession(session.id, e)}
                className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all ${activeSessionId === session.id ? 'opacity-100' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto p-3 flex flex-col gap-1">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors text-sm group">
          <div className="w-7 h-7 rounded-lg bg-zinc-800/50 flex items-center justify-center group-hover:bg-zinc-700">
            <UpgradeIcon className="w-4 h-4" />
          </div>
          Upgrade Plan
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors text-sm group">
           <div className="w-7 h-7 rounded-lg bg-zinc-800/50 flex items-center justify-center group-hover:bg-zinc-700">
             <SettingsIcon className="w-4 h-4" />
           </div>
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
