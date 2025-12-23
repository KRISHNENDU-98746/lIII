import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

// Web Speech API Types
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface ChatInputProps {
  onSendMessage: (message: string, image?: string) => void;
  isLoading: boolean;
  variant?: 'initial' | 'chat';
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, variant = 'chat' }) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setSpeechError(null);
    };
    
    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      
      setText(transcript);
      
      // Auto-focus and scroll textarea as text grows
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') {
            setSpeechError("Microphone access denied. Enable it in settings.");
        } else if (event.error === 'network') {
            setSpeechError("Network error during speech recognition.");
        }
        setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
        recognitionRef.current?.stop();
    };
  }, []);

  // Sync textarea height with text content (especially useful for transcription)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [text]);
  
  const handleSubmit = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    }
    
    if ((text.trim() || imagePreview) && !isLoading) {
      onSendMessage(text.trim(), imagePreview ?? undefined);
      setText('');
      setImagePreview(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
      setImagePreview(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
  };
  
  const handleToggleRecording = () => {
    if (!recognitionRef.current) {
        setSpeechError("Speech recognition not supported.");
        return;
    };
    
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };
  
  const baseClasses = "flex items-center w-full bg-zinc-800/80 border border-zinc-700 transition-all duration-200 focus-within:border-indigo-500 shadow-xl";
  const variantClasses = {
      initial: `rounded-full p-4 text-lg`,
      chat: `rounded-2xl p-2 text-base`
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2">
        <div className={`${baseClasses} ${variantClasses[variant]}`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />
            
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isRecording}
                className="p-2.5 rounded-full text-zinc-400 disabled:opacity-30 hover:text-white hover:bg-zinc-700/50 transition-all"
                aria-label="Attach file"
            >
                <PlusIcon className="w-5 h-5" />
            </button>

            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Listening..." : (variant === 'initial' ? "Ask anything..." : "Message Gemini...")}
                className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-100 placeholder-zinc-500 resize-none max-h-60 py-2.5 scrollbar-hide"
                rows={1}
                disabled={isLoading}
            />

             <div className="relative flex items-center justify-center mr-1">
                {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping scale-150"></span>
                )}
                <button
                    onClick={handleToggleRecording}
                    disabled={isLoading}
                    className={`p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${
                        isRecording 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50 disabled:opacity-30'
                    }`}
                    aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                    <MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                </button>
            </div>

            {(variant === 'chat' || text.trim() || imagePreview) && (
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || (!text.trim() && !imagePreview)}
                    className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
                    aria-label="Send message"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            )}
        </div>
        
        {imagePreview && (
            <div className="mt-4 p-2 relative w-fit group bg-zinc-800 rounded-2xl border border-zinc-700 shadow-2xl">
                <img src={imagePreview} alt="Selected preview" className="max-h-48 rounded-xl object-contain shadow-sm" />
                <button 
                  onClick={handleRemoveImage} 
                  className="absolute -top-2 -right-2 bg-zinc-900 text-zinc-300 border border-zinc-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-colors shadow-lg"
                >
                  &times;
                </button>
            </div>
        )}

      {speechError && (
          <p className="text-[11px] font-medium text-red-400 text-center mt-2 animate-pulse">
            {speechError}
          </p>
      )}
    </div>
  );
};

export default ChatInput;