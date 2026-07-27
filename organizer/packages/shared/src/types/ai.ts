export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  userId: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

/** Long-lived facts the AI assistant remembers about a user across conversations. */
export interface AiMemoryItem {
  id: string;
  userId: string;
  key: string;
  value: string;
  updatedAt: string;
}

export interface AiChatRequest {
  conversationId?: string;
  message: string;
}

export interface AiChatResponse {
  conversationId: string;
  reply: string;
  createdAt: string;
}

export interface AiSuggestion {
  id: string;
  userId: string;
  category: string;
  title: string;
  body: string;
  createdAt: string;
  dismissed: boolean;
}

export interface AiUsageRecord {
  id: string;
  userId: string;
  endpoint: string;
  promptTokens: number;
  completionTokens: number;
  createdAt: string;
}
