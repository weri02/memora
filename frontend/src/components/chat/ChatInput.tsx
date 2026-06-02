import { useState, useRef, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { useChatStore } from "@/stores/chatStore";

export default function ChatInput() {
  const { sendMessage, isStreaming, activeConversationId } = useChatStore();
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = text.trim() && !isStreaming && activeConversationId;

  const handleSend = () => {
    if (!canSend) return;
    sendMessage(text.trim());
    setText("");
    // Reset altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Enter envia, Shift+Enter nueva linea
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize del textarea
  const handleInput = (value: string) => {
    setText(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

  return (
    <div
      className="flex items-end gap-2 p-3 bg-white border-[3px] border-pencil"
      style={{
        borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
      }}
    >
      <label htmlFor="chat-input" className="sr-only">
        Escribe tu pregunta
      </label>
      <textarea
        id="chat-input"
        ref={textareaRef}
        value={text}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          activeConversationId
            ? "Escribe tu pregunta..."
            : "Selecciona o crea una conversacion"
        }
        disabled={!activeConversationId || isStreaming}
        rows={1}
        className="flex-1 resize-none bg-transparent font-body text-lg text-pencil
          placeholder:text-pencil/30 focus:outline-none disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Enviar mensaje"
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center
          border-2 border-pencil bg-white text-pencil
          hover:bg-accent hover:text-white hover:border-accent
          disabled:opacity-30 disabled:cursor-not-allowed
          transition-all duration-100"
        style={{
          borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
        }}
      >
        <Send size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
