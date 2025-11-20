
export type MessageRole = 'user' | 'model';

export interface Message {
  role: MessageRole;
  content: string;
  image?: string;
}