
export type MessageRole = 'user' | 'model';

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  role: MessageRole;
  content: string;
  image?: string;
  timestamp: number;
  groundingChunks?: GroundingChunk[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  lastUpdated: number;
}
