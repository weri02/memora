// Autenticación

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Documentos

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size_bytes: number;
  status: "pending" | "processing" | "indexed" | "error";
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentStats {
  total_documents: number;
  total_chunks: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
}

// Chat

export interface SourceExcerpt {
  chunk_id: number;
  preview: string;
  score: number | null;
  rerank_score: number | null;
}

export interface Source {
  document_name: string;
  excerpts: SourceExcerpt[];
  best_score: number | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[] | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  titulo: string;
  document_ids: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}
