import React from 'react';
import type { Message } from '../types';
import { UserIcon } from './icons/UserIcon';
import { GeminiIcon } from './icons/GeminiIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`group flex items-start gap-4 ${isModel ? 'bg-transparent' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${isModel ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-100 border-zinc-200'}`}>
        {isModel ? (
          <GeminiIcon className="w-5 h-5 text-indigo-400" />
        ) : (
          <UserIcon className="w-5 h-5 text-zinc-900" />
        )}
      </div>
      
      <div className={`flex flex-col max-w-[85%] ${isModel ? 'items-start' : 'items-end'}`}>
        <div className={`px-4 py-2.5 rounded-2xl ${
          isModel 
            ? 'text-zinc-200 leading-relaxed' 
            : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
        }`}>
          {message.image && (
            <img src={message.image} alt="User upload" className="mb-3 rounded-xl max-w-full h-auto border border-zinc-700 shadow-lg" />
          )}
          
          {isModel && !message.content ? (
            <div className="flex items-center space-x-1.5 py-2">
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          ) : message.content ? (
            <MarkdownRenderer content={message.content} />
          ) : null}
        </div>
        
        {isModel && message.content && (
          <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300 transition-colors" title="Copy">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;