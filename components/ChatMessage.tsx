
import React from 'react';
import type { Message } from '../types';
import { GeminiIcon } from './icons/GeminiIcon';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`group animate-message ${isModel ? 'w-full' : 'max-w-fit ml-auto'}`}>
      <div className={`flex items-start gap-4 ${isModel ? 'max-w-full' : 'flex-row-reverse'}`}>
        {isModel && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-zinc-800 bg-zinc-900 mt-1 shadow-sm overflow-hidden">
            <GeminiIcon className="w-5 h-5" />
          </div>
        )}
        
        <div className={`flex-1 min-w-0 ${isModel ? 'space-y-4' : ''}`}>
          <div className={`text-zinc-200 ${isModel ? 'text-base leading-relaxed' : 'bg-[#2f2f2f] px-4 py-2.5 rounded-3xl text-sm max-w-[85vw] md:max-w-md ml-auto'}`}>
            {message.image && (
              <div className="mb-4 inline-block">
                <img src={message.image} alt="User upload" className="rounded-2xl max-h-72 object-contain border border-zinc-800 shadow-xl" />
              </div>
            )}
            
            {isModel && !message.content ? (
              <div className="flex items-center space-x-1.5 py-4">
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            ) : (
              <div className="markdown-container">
                <MarkdownRenderer content={message.content} />
              </div>
            )}
          </div>

          {/* Search Grounding Sources */}
          {isModel && message.groundingChunks && message.groundingChunks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800/50 flex flex-wrap gap-2">
               <span className="w-full text-[10px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Sources</span>
               {message.groundingChunks.map((chunk, idx) => {
                  const title = chunk.web?.title || chunk.maps?.title || 'Source';
                  const uri = chunk.web?.uri || chunk.maps?.uri;
                  if (!uri) return null;
                  return (
                    <a 
                      key={idx} 
                      href={uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/40 hover:bg-zinc-800 text-[11px] text-zinc-400 hover:text-white transition-all border border-zinc-800/50"
                    >
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      <span className="truncate max-w-[120px]">{title}</span>
                    </a>
                  );
               })}
            </div>
          )}
          
          {isModel && message.content && (
            <div className="flex items-center gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => navigator.clipboard.writeText(message.content)}
                className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all" title="Copy"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
              </button>
               <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.017a2 2 0 011.485.64l3.762 4.302c.293.336.14.862-.315.862H10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2" /></svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
