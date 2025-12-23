import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import type { Message } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import { UpgradeIcon } from './components/icons/UpgradeIcon';

const parseBase64 = (base64String: string): Part => {
  const match = base64String.match(/data:(.*);base64,(.*)/);
  if (!match) {
    throw new Error('Invalid base64 string');
  }
  const [, mimeType, data] = match;
  return { inlineData: { mimeType, data } };
};

const SUGGESTIONS = [
  "Summarize a long article",
  "Write a Python script for data analysis",
  "Plan a 3-day trip to Tokyo",
  "Explain quantum physics to a 5-year old"
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initAI = async () => {
      try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) return;

        const ai = new GoogleGenAI({ apiKey });
        const chatSession = ai.chats.create({
          model: 'gemini-3-pro-preview',
          config: {
            systemInstruction: 'You are Gemini, a highly capable AI assistant developed by Google. You aim to be helpful, concise, and provide high-quality information. Format your responses using beautiful Markdown. If asked to code, provide full, runnable snippets in blocks.',
          },
        });
        setChat(chatSession);
      } catch (e) {
        console.error("Initialization error:", e);
      }
    };
    
    initAI();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText: string, imageBase64?: string) => {
    if (!chat || isLoading) return;

    setError(null);
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: messageText, image: imageBase64 };
    setMessages(prev => [...prev, userMessage, { role: 'model', content: '' }]);

    try {
      const messageParts: (string | Part)[] = [{ text: messageText }];
      if (imageBase64) {
        messageParts.push(parseBase64(imageBase64));
      }

      const stream = await chat.sendMessageStream({ message: messageParts });
      
      let accumulatedText = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          accumulatedText += chunk.text;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'model') {
              newMessages[newMessages.length - 1] = { ...lastMessage, content: accumulatedText };
            }
            return newMessages;
          });
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Error: ${errorMessage}`);
      console.error("Gemini API error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [chat, isLoading]);

  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-300 font-sans overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Navigation / Model Switcher */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md z-30">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors group">
            <span className="text-zinc-100 font-medium">Gemini 3 Pro</span>
            {isLoading && (
              <div className="flex items-center gap-1.5 ml-2 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-tighter text-indigo-400 font-bold">Thinking</span>
              </div>
            )}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-semibold py-1.5 px-4 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/10">
            <UpgradeIcon className="w-3.5 h-3.5" />
            Upgrade
          </button>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {/* Global Loading Bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-zinc-800 z-50 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-1/2 animate-[loading-bar_1.5s_infinite_linear]"></div>
            </div>
          )}

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes loading-bar {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          `}} />

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-4xl font-semibold mb-10 text-zinc-100">What can I help with?</h1>
              <div className="w-full mb-8">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} variant="initial" />
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSendMessage(s)}
                    className="p-3 text-left rounded-xl border border-zinc-800 bg-zinc-800/30 hover:bg-zinc-800 transition-colors text-sm text-zinc-400 hover:text-zinc-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div ref={chatContainerRef} className="h-full overflow-y-auto pt-6 pb-32 px-4 scroll-smooth">
              <div className="max-w-3xl mx-auto space-y-8">
                {messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} />
                ))}
              </div>
            </div>
          )}
          
          {/* Persistent Bottom Input for Chat View */}
          {messages.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent pt-10 pb-6 px-4">
              <div className="max-w-3xl mx-auto">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} variant="chat" />
                <p className="text-[10px] text-center text-zinc-500 mt-3">
                  Gemini can make mistakes. Check important info.
                </p>
              </div>
            </div>
          )}
        </main>
        
        {error && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-900/90 text-red-100 rounded-lg shadow-2xl border border-red-700 text-sm backdrop-blur-sm animate-bounce z-50">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;