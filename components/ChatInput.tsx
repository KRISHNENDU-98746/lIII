import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

// Fix: Add types for the Web Speech API to resolve TypeScript errors.
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

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setText(transcript);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error, event.message);
        if (event.error === 'not-allowed') {
            setSpeechError("Microphone access denied. Please enable it in your browser settings.");
        } else {
            setSpeechError(`An error occurred: ${event.error}`);
        }
        setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
        recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [text]);
  
  const handleSubmit = () => {
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
        setSpeechError("Speech recognition is not supported in this browser.");
        return;
    };
    setSpeechError(null);
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };
  
  const baseClasses = "flex items-center w-full bg-zinc-800/80 border border-zinc-700 transition-colors focus-within:border-purple-500";
  const variantClasses = {
      initial: `rounded-full p-3 text-lg`,
      chat: `rounded-xl p-2 text-base`
  };

  return (
    <div className="w-full">
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
                disabled={isLoading}
                className="p-2 rounded-full text-zinc-400 disabled:text-zinc-600 hover:text-white transition-colors"
                aria-label="Attach file"
            >
                <PlusIcon className="w-6 h-6" />
            </button>
            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={variant === 'initial' ? "Ask anything" : "Type your message..."}
                className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-200 placeholder-zinc-500 resize-none max-h-48"
                rows={1}
                disabled={isLoading}
            />
             <button
                onClick={handleToggleRecording}
                disabled={isLoading}
                className={`p-2 rounded-full text-zinc-400 disabled:text-zinc-600 hover:text-white transition-colors ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
                <MicrophoneIcon className="w-6 h-6" />
            </button>
            {variant === 'chat' && (
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || (!text.trim() && !imagePreview)}
                    className="ml-2 p-2 rounded-full bg-purple-600 text-white disabled:bg-zinc-600 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                    aria-label="Send message"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            )}
        </div>
        {imagePreview && (
            <div className="mt-4 p-2 relative w-fit mx-auto bg-zinc-800 rounded-xl">
                <img src={imagePreview} alt="Selected preview" className="max-h-40 rounded-lg" />
                <button onClick={handleRemoveImage} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center leading-none">&times;</button>
            </div>
        )}
      {speechError && (
          <p className="text-xs text-red-400 text-center mt-2">{speechError}</p>
      )}
    </div>
  );
};

export default ChatInput;