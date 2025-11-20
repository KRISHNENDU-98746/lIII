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
    <div className={`flex items-start gap-4 ${isModel ? '' : 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-zinc-700' : 'bg-purple-600'}`}>
        {isModel ? <GeminiIcon className="w-5 h-5 text-white" /> : <UserIcon className="w-5 h-5 text-white" />}
      </div>
      <div className={`w-full max-w-4xl px-4 py-3 rounded-lg shadow ${isModel ? 'bg-zinc-800 text-zinc-200' : 'bg-purple-600 text-white'}`}>
        {message.image && (
          <img src={message.image} alt="User upload" className="mb-2 rounded-lg max-w-xs" />
        )}
        {isModel && !message.content ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        ) : message.content ? (
          <MarkdownRenderer content={message.content} />
        ) : null}
      </div>
    </div>
  );
};

export default ChatMessage;