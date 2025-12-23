import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import type { Message, ChatSession } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';
import { UpgradeIcon } from './components/icons/UpgradeIcon';
// Import GeminiIcon to fix "Cannot find name 'GeminiIcon'" error
import { GeminiIcon } from './components/icons/GeminiIcon';

const MODELS = {
  FLASH: 'gemini-3-flash-preview',
  PRO: 'gemini-3-pro-preview'
};

const SUGGESTIONS = [
  "Summarize a long article",
  "Write a Python script for data analysis",
  "Plan a 3-day trip to Tokyo",
  "Explain quantum physics to a 5-year old"
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
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persistence: Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gemini_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  // Persistence: Save to localStorage
  useEffect(() => {
    localStorage.setItem('gemini_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // Initialize or re-sync chat session when model or active chat changes
  useEffect(() => {
    const initChat = async () => {
      if (!activeSessionId) {
        setActiveChat(null);
        return;
      }

      try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) return;

        const ai = new GoogleGenAI({ apiKey });
        
        // Note: The SDK's Chat maintains history. We pass it on creation.
        const chatSession = ai.chats.create({
          model: currentModel,
          config: {
            systemInstruction: 'You are Gemini, a highly capable AI assistant developed by Google. You aim to be helpful, concise, and provide high-quality information. Format your responses using beautiful Markdown. If asked to code, provide full, runnable snippets in blocks.',
          },
        });
        
        setActiveChat(chatSession);
      } catch (e) {
        console.error("Chat init error", e);
      }
    };

    initChat();
  }, [activeSessionId, currentModel]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeSession?.messages, isLoading]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setActiveChat(null);
  };

  const createSession = (firstMsg: string): string => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: firstMsg.slice(0, 40) + (firstMsg.length > 40 ? '...' : ''),
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

    // Update session with user message and placeholder for model
    setSessions(prev => prev.map(s => s.id === sid ? {
      ...s,
      messages: [...s.messages, userMsg, { role: 'model', content: '', timestamp: Date.now() }],
      lastUpdated: Date.now()
    } : s));

    try {
      const apiKey = process.env.API_KEY;
      const ai = new GoogleGenAI({ apiKey: apiKey! });
      
      // Fix: messageParts should be typed as Part[] to match SDK expectations
      const messageParts: Part[] = [{ text: messageText }];
      if (imageBase64) {
        messageParts.push(parseBase64(imageBase64));
      }

      // Fix: Cast contents to any to resolve complex union type mismatch (PartUnion vs Content)
      const stream = await ai.models.generateContentStream({
        model: currentModel,
        contents: [
            ...((sessions.find(s => s.id === sid)?.messages || []).map(m => ({
                role: m.role,
                parts: [{ text: m.content }]
            }))),
            { role: 'user', parts: messageParts }
        ] as any,
        config: {
           systemInstruction: 'You are Gemini. Respond clearly and concisely.'
        }
      });
      
      let accumulatedText = '';
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          accumulatedText += text;
          setSessions(prev => prev.map(s => s.id === sid ? {
            ...s,
            messages: s.messages.map((m, idx) => 
              idx === s.messages.length - 1 ? { ...m, content: accumulatedText } : m
            )
          } : s));
        }
      }
    } catch (e: any) {
      setError(`Failed to get response: ${e.message || 'Unknown error'}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, currentModel, sessions]);

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
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-800/50 p-1 rounded-xl border border-zinc-700/50">
              <button 
                onClick={() => setCurrentModel(MODELS.FLASH)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${currentModel === MODELS.FLASH ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Gemini 3 Flash
              </button>
              <button 
                onClick={() => setCurrentModel(MODELS.PRO)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${currentModel === MODELS.PRO ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Gemini 3 Pro
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="hidden md:flex items-center gap-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-medium py-1.5 px-4 rounded-full border border-zinc-700 transition-colors">
              <UpgradeIcon className="w-3.5 h-3.5" />
              Upgrade
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative flex flex-col">
          {!activeSessionId && sessions.find(s => s.id === activeSessionId) === undefined ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto w-full">
              <div className="mb-6 p-4 bg-zinc-800/30 rounded-2xl border border-zinc-700/50 shadow-2xl">
                <GeminiIcon className="w-12 h-12" />
              </div>
              <h1 className="text-3xl font-semibold mb-10 text-zinc-100">How can I help you today?</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {SUGGESTIONS.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSendMessage(s)}
                    className="p-4 text-left rounded-2xl border border-zinc-800 bg-zinc-800/20 hover:bg-zinc-800/50 transition-all text-sm text-zinc-400 hover:text-zinc-200 border-dashed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pt-6 pb-32 px-4 scroll-smooth custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-10">
                {activeSession?.messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} />
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-950 border border-red-900 text-red-200 text-xs rounded-lg shadow-2xl animate-in fade-in zoom-in duration-300">
              {error}
              <button onClick={() => setError(null)} className="ml-3 hover:text-white">✕</button>
            </div>
          )}

          {/* Floating Input Area */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#171717] via-[#171717] to-transparent pt-12 pb-6 px-4">
            <div className="max-w-3xl mx-auto relative">
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
                Gemini can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-message { animation: fade-in-up 0.3s ease-out forwards; }
      `}} />
    </div>
  );
};

export default App;