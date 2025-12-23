
import React from 'react';
import { NewChatIcon } from './icons/NewChatIcon';
import { SettingsIcon } from './icons/SettingsIcon';
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
    <aside className="w-[260px] bg-zinc-950 flex flex-col h-full border-r border-zinc-800/50">
      <div className="p-3">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all text-zinc-200 text-sm font-medium group"
        >
          <NewChatIcon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-200" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2 custom-scrollbar">
        {sessions.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <p className="text-zinc-500 text-xs">No recent chats</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                activeSessionId === session.id 
                ? 'bg-zinc-800/80 text-zinc-100' 
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
              }`}
            >
              <div className="flex-1 truncate text-sm">
                {session.title || 'Untitled Chat'}
              </div>
              
              <button 
                onClick={(e) => onDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-zinc-800/50 mt-auto">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors text-sm">
          <SettingsIcon className="w-5 h-5" />
          Settings
        </button>
        <div className="mt-4 flex items-center gap-3 px-3 py-2">
           <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
            U
           </div>
           <div className="flex-1 truncate text-xs font-medium text-zinc-300">User Account</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
