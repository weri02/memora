import { create } from "zustand";
import api from "@/lib/api";
import { TOKEN_KEY } from "@/lib/constants";
import type { Conversation, ChatMessage, Source } from "@/types";

interface ChatState {
  // Conversaciones
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];

  // Streaming
  isStreaming: boolean;
  streamingContent: string;

  // Loading
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // Acciones
  fetchConversations: () => Promise<void>;
  createConversation: (titulo?: string, documentIds?: number[]) => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  isLoadingConversations: false,
  isLoadingMessages: false,

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const { data } = await api.get<Conversation[]>("/chat/conversations");
      set({ conversations: data, isLoadingConversations: false });
    } catch {
      set({ isLoadingConversations: false });
    }
  },

  createConversation: async (titulo, documentIds) => {
    const { data } = await api.post<Conversation>("/chat/conversations", {
      titulo: titulo || "Nueva conversacion",
      document_ids: documentIds || null,
    });
    set((s) => ({ conversations: [data, ...s.conversations] }));
    return data;
  },

  deleteConversation: async (id) => {
    await api.delete(`/chat/conversations/${id}`);
    const state = get();
    set({
      conversations: state.conversations.filter((c) => c.id !== id),
      // Si era la activa, limpiar
      ...(state.activeConversationId === id
        ? { activeConversationId: null, messages: [] }
        : {}),
    });
  },

  selectConversation: async (id) => {
    set({ activeConversationId: id, isLoadingMessages: true, messages: [] });
    try {
      const { data } = await api.get<ChatMessage[]>(
        `/chat/conversations/${id}/messages`,
      );
      set({ messages: data, isLoadingMessages: false });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content) => {
    const { activeConversationId } = get();
    if (!activeConversationId || get().isStreaming) return;

    // Agregar mensaje del usuario
    const userMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: activeConversationId,
      role: "user",
      content,
      sources: null,
      created_at: new Date().toISOString(),
    };
    set((s) => ({
      messages: [...s.messages, userMsg],
      isStreaming: true,
      streamingContent: "",
    }));

    // Conectar al SSE
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      const response = await fetch(
        `/api/v1/chat/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        },
      );

      if (!response.ok || !response.body) {
        throw new Error("Error en la respuesta del servidor");
      }

      // Leer el stream SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Guardar la ultima linea incompleta
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "token") {
              accumulated += event.content;
              set({ streamingContent: accumulated });
            }

            if (event.type === "done") {
              const assistantMsg: ChatMessage = {
                id: event.message_id,
                conversation_id: activeConversationId,
                role: "assistant",
                content: accumulated,
                sources: event.sources as Source[],
                created_at: new Date().toISOString(),
              };
              set((s) => ({
                messages: [...s.messages, assistantMsg],
                isStreaming: false,
                streamingContent: "",
              }));
            }
          } catch {
            // Ignorar
          }
        }
      }
    } catch {
      set({ isStreaming: false, streamingContent: "" });
    }
  },
}));
