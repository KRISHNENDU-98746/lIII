
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Part } from '@google/genai';
import type { Message, ChatSession, GroundingChunk } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import { UpgradeIcon } from './components/icons/UpgradeIcon';
import { GeminiIcon } from './components/icons/GeminiIcon';

const MODELS = {
  FLASH: 'gemini-3-flash-preview',
  PRO: 'gemini-3-pro-preview'
};

const SUGGESTIONS = [
  "Write a travel itinerary for a week in Italy",
  "How do I explain recursion to a toddler?",
  "Help me debug a React useEffect hook",
  "Summarize the latest trends in AI"
];

const parseBase64 = (base64String: string): Part => {
  const match = base64String.match(/data:(.*);base64,(.*)/);
  if (!match) throw new Error('Invalid base64 string');
  const [, mimeType, data] = match;
  return { inlineData: { mimeType, data } };
};

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState(MODELS.FLASH);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [useSearch, setUseSearch] = useState<boolean>(true);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('gemini_chatgpt_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('gemini_chatgpt_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeSession?.messages, isLoading]);

  const handleNewChat = () => {
    setActiveSessionId(null);
  };

  const createSession = (firstMsg: string): string => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: firstMsg.slice(0, 35) + (firstMsg.length > 35 ? '...' : ''),
      messages: [],
      model: currentModel,
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    return newId;
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) setActiveSessionId(null);
  };

  const handleSendMessage = useCallback(async (messageText: string, imageBase64?: string) => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);

    let sid = activeSessionId;
    if (!sid) {
      sid = createSession(messageText);
    }

    const userMsg: Message = { 
      role: 'user', 
      content: messageText, 
      image: imageBase64, 
      timestamp: Date.now() 
    };

    setSessions(prev => prev.map(s => s.id === sid ? {
      ...s,
      messages: [...s.messages, userMsg, { role: 'model', content: '', timestamp: Date.now() }],
      lastUpdated: Date.now()
    } : s));

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const messageParts: Part[] = [{ text: messageText }];
      if (imageBase64) {
        messageParts.push(parseBase64(imageBase64));
      }

      const history = sessions.find(s => s.id === sid)?.messages || [];
      const contents = [
        ...history.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: messageParts }
      ];

      const stream = await ai.models.generateContentStream({
        model: currentModel,
        contents: contents as any,
        config: {
          systemInstruction: 'You are Gemini, a helpful AI built by Google. You are professional, concise, and accurate. Format your output using Markdown.',
          tools: useSearch ? [{ googleSearch: {} }] : undefined,
        }
      });
      
      let accumulatedText = '';
      let chunks: GroundingChunk[] = [];

      for await (const chunk of stream) {
        const text = chunk.text;
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        
        if (groundingMetadata?.groundingChunks) {
          chunks = groundingMetadata.groundingChunks as GroundingChunk[];
        }

        if (text) {
          accumulatedText += text;
          setSessions(prev => prev.map(s => s.id === sid ? {
            ...s,
            messages: s.messages.map((m, idx) => 
              idx === s.messages.length - 1 
                ? { ...m, content: accumulatedText, groundingChunks: chunks.length > 0 ? chunks : m.groundingChunks } 
                : m
            )
          } : s));
        }
      }
    } catch (e: any) {
      setError(`Error: ${e.message || 'The AI is currently unavailable.'}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, currentModel, sessions, useSearch, isLoading]);

  return (
    <div className="flex h-screen bg-[#0d0d0d] text-zinc-300 font-sans overflow-hidden">
      <Sidebar 
        sessions={sessions} 
        activeSessionId={activeSessionId || ''} 
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#171717]">
        <header className="h-14 flex items-center justify-between px-4 z-30 shrink-0">
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
               <span className="text-lg font-bold text-white group-hover:text-zinc-200">Gemini</span>
               <span className="text-zinc-500 text-sm font-medium">3.0 {currentModel === MODELS.PRO ? 'Pro' : 'Flash'}</span>
               <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-800/50 p-1 rounded-xl border border-zinc-700/50 mr-4">
              <button 
                onClick={() => setCurrentModel(MODELS.FLASH)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${currentModel === MODELS.FLASH ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Flash
              </button>
              <button 
                onClick={() => setCurrentModel(MODELS.PRO)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${currentModel === MODELS.PRO ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Pro
              </button>
            </div>
            <button className="hidden md:flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium py-1.5 px-4 rounded-full border border-zinc-700 transition-colors">
              <UpgradeIcon className="w-3.5 h-3.5" />
              Upgrade
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative flex flex-col">
          {!activeSessionId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto w-full">
              <div className="mb-6 p-4 bg-zinc-800/30 rounded-3xl border border-zinc-700/50 shadow-2xl animate-in fade-in zoom-in duration-700">
                <GeminiIcon className="w-12 h-12" />
              </div>
              <h1 className="text-3xl font-semibold mb-10 text-white tracking-tight">What can I help with?</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {SUGGESTIONS.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSendMessage(s)}
                    className="p-4 text-left rounded-2xl border border-zinc-800/50 bg-zinc-800/20 hover:bg-zinc-800/60 transition-all text-sm text-zinc-400 hover:text-zinc-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pt-6 pb-40 px-4 scroll-smooth custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-12">
                {activeSession?.messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} />
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-950 border border-red-900 text-red-200 text-xs rounded-lg shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
              {error}
              <button onClick={() => setError(null)} className="ml-3 hover:text-white">✕</button>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#171717] via-[#171717]/95 to-transparent pt-12 pb-6 px-4">
            <div className="max-w-3xl mx-auto relative group">
              <div className="absolute -top-8 left-4 flex items-center gap-4">
                 <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={useSearch} 
                      onChange={(e) => setUseSearch(e.target.checked)} 
                      className="w-3 h-3 rounded bg-zinc-800 border-zinc-700 text-indigo-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 hover:text-zinc-300 transition-colors">Search Web</span>
                 </label>
              </div>

              {isLoading && (
                 <button 
                    onClick={() => abortControllerRef.current?.abort()}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-xs text-zinc-300 transition-all shadow-xl"
                  >
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                   Stop Generating
                 </button>
              )}
              <ChatInput 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                variant={!activeSessionId ? 'initial' : 'chat'} 
              />
              <p className="text-[10px] text-center text-zinc-500 mt-3 font-medium">
                Gemini can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-message { animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}} />
    </div>
  );
};

export default App;
