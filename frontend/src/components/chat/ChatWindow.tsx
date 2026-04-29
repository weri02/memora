import { useEffect, useRef } from "react";
import { MessageCircle, Bot } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import MarkdownMessage from "./MarkdownMessage";

export default function ChatWindow() {
  const {
    activeConversationId,
    messages,
    isLoadingMessages,
    isStreaming,
    streamingContent,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al final cuando llegan mensajes o streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Sin conversacion seleccionada
  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle
            size={64}
            strokeWidth={1.5}
            className="text-pencil/15 mx-auto mb-4"
          />
          <p className="font-heading text-2xl text-pencil/30">
            Selecciona o crea una conversacion
          </p>
          <p className="font-body text-pencil/20 mt-1">
            Chatea con tus documentos usando IA
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Area de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages && (
          <p className="text-center font-body text-pencil/40 py-8">
            Cargando mensajes...
          </p>
        )}

        {!isLoadingMessages && messages.length === 0 && (
          <div className="text-center py-12">
            <Bot
              size={48}
              strokeWidth={1.5}
              className="text-pencil/15 mx-auto mb-3"
            />
            <p className="font-heading text-xl text-pencil/30">
              Haz una pregunta sobre tus documentos
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Mensaje de streaming en progreso */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3">
            <div
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center border-2 border-pencil bg-muted text-pencil"
              style={{
                borderRadius:
                  "15px 255px 15px 225px / 225px 15px 255px 15px",
              }}
            >
              <Bot size={18} strokeWidth={2.5} />
            </div>
            <div
              className="flex-1 max-w-[80%] inline-block px-4 py-3 border-2 border-pencil bg-white shadow-hand-card font-body text-[17px]"
              style={{
                borderRadius:
                  "15px 255px 15px 225px / 225px 15px 255px 15px",
              }}
            >
              <MarkdownMessage content={streamingContent} />
              <span className="inline-block w-2 h-5 bg-pencil/60 animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {/* Indicador de "pensando" antes de que lleguen tokens */}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center border-2 border-pencil bg-muted text-pencil"
              style={{
                borderRadius:
                  "15px 255px 15px 225px / 225px 15px 255px 15px",
              }}
            >
              <Bot size={18} strokeWidth={2.5} />
            </div>
            <div
              className="px-4 py-3 border-2 border-pencil bg-white shadow-hand-card font-body"
              style={{
                borderRadius:
                  "15px 255px 15px 225px / 225px 15px 255px 15px",
              }}
            >
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-pencil/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-pencil/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-pencil/40 rounded-full animate-bounce [animation-delay:0.3s]" />
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 pt-0">
        <ChatInput />
      </div>
    </div>
  );
}
