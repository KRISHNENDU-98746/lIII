
export type MessageRole = 'user' | 'model';

export interface Message {
  role: MessageRole;
  content: string;
  image?: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  lastUpdated: number;
}
