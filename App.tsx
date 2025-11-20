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

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
      const chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a helpful and friendly AI assistant. Format your responses using Markdown, especially for code blocks.',
        },
      });
      setChat(chatSession);
    } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError('An unknown error occurred during initialization.');
        }
        console.error("Initialization error:", e);
    }
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
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Sorry, something went wrong: ${errorMessage}`);
      setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'model') {
            newMessages[newMessages.length - 1] = { ...lastMessage, content: "Sorry, I couldn't process your request. Please try again." };
          }
          return newMessages;
      });
      console.error("Gemini API error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [chat, isLoading]);


  return (
    <div className="flex h-screen bg-zinc-900 text-zinc-300 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <button className="flex items-center gap-2 bg-purple-600/80 text-white text-sm py-2 px-4 rounded-full hover:bg-purple-700 transition-colors">
                <UpgradeIcon className="w-4 h-4" />
                Upgrade for free
            </button>
        </div>

        <main className="flex-1 flex flex-col overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-3xl md:text-4xl font-medium mb-8 text-zinc-400">What are you working on?</h1>
              <div className="w-full max-w-3xl">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} variant="initial" />
              </div>
            </div>
          ) : (
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))}
            </div>
          )}
        </main>
        
        {messages.length > 0 && (
          <footer className="p-4">
            <div className="w-full max-w-4xl mx-auto">
                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} variant="chat" />
            </div>
          </footer>
        )}
        
        {error && (
            <div className="absolute w-full bottom-0 p-4 bg-red-800 text-white text-center text-sm">
                {error}
            </div>
        )}
      </div>
    </div>
  );
};

export default App;