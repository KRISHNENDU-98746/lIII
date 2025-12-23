
import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from './icons/SendIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';

interface ChatInputProps {
  onSendMessage: (message: string, image?: string) => void;
  isLoading: boolean;
  variant?: 'initial' | 'chat';
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, variant = 'chat' }) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsRecording(true);
      recognition.onend = () => setIsRecording(false);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setText(transcript);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);
  
  const handleSubmit = () => {
    if ((text.trim() || imagePreview) && !isLoading) {
      onSendMessage(text.trim(), imagePreview ?? undefined);
      setText('');
      setImagePreview(null);
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
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="w-full relative">
        {imagePreview && (
            <div className="absolute bottom-full left-0 mb-4 p-2 bg-zinc-800 rounded-2xl border border-zinc-700 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="relative group">
                  <img src={imagePreview} alt="Selected preview" className="max-h-32 rounded-xl object-contain shadow-sm" />
                  <button 
                    onClick={() => setImagePreview(null)} 
                    className="absolute -top-2 -right-2 bg-zinc-900 text-white border border-zinc-700 rounded-full w-6 h-6 flex items-center justify-center hover:bg-zinc-800 transition-all shadow-lg"
                  >
                    &times;
                  </button>
                </div>
            </div>
        )}

        <div className="flex items-end w-full bg-[#2f2f2f] border border-white/5 rounded-[26px] p-2 pr-3 transition-all focus-within:ring-1 focus-within:ring-white/10 shadow-lg">
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
                className="p-2 mb-0.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                aria-label="Attach file"
            >
                <PlusIcon className="w-5 h-5" />
            </button>

            <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Gemini..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-zinc-500 resize-none py-2.5 px-3 max-h-60 scrollbar-hide text-[15px] leading-relaxed"
                rows={1}
                disabled={isLoading}
            />

            <div className="flex items-center gap-1.5 mb-0.5">
                <button
                    onClick={toggleRecording}
                    disabled={isLoading}
                    className={`p-2 rounded-full transition-all ${
                        isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <MicrophoneIcon className="w-5 h-5" />
                </button>

                <button
                    onClick={handleSubmit}
                    disabled={isLoading || (!text.trim() && !imagePreview)}
                    className={`p-2 rounded-full transition-all ${
                        (text.trim() || imagePreview) && !isLoading
                        ? 'bg-white text-black hover:bg-zinc-200'
                        : 'bg-zinc-600 text-zinc-400 cursor-not-allowed opacity-50'
                    }`}
                >
                    <SendIcon className="w-5 h-5 fill-current" />
                </button>
            </div>
        </div>
    </div>
  );
};

export default ChatInput;
