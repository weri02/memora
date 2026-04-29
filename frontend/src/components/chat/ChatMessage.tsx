import { useState } from "react";
import { User, Bot, ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/types";
import MarkdownMessage from "./MarkdownMessage";

interface Props {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: Props) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";
  const hasSources = message.sources && message.sources.length > 0;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-9 h-9 flex items-center justify-center border-2 border-pencil
          ${isUser ? "bg-accent-blue text-white" : "bg-muted text-pencil"}`}
        style={{
          borderRadius: isUser
            ? "255px 15px 225px 15px / 15px 225px 15px 255px"
            : "15px 255px 15px 225px / 225px 15px 255px 15px",
        }}
      >
        {isUser ? (
          <User size={18} strokeWidth={2.5} />
        ) : (
          <Bot size={18} strokeWidth={2.5} />
        )}
      </div>

      {/* Contenido */}
      <div className={`flex-1 max-w-[80%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block text-left px-4 py-3 border-2 border-pencil font-body text-[17px]
            ${isUser ? "bg-accent-blue/10" : "bg-white shadow-hand-card"}`}
          style={{
            borderRadius: isUser
              ? "255px 15px 225px 15px / 15px 225px 15px 255px"
              : "15px 255px 15px 225px / 225px 15px 255px 15px",
          }}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownMessage content={message.content} />
          )}
        </div>

        {/* Sources */}
        {hasSources && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1 font-body text-sm text-pencil/50 hover:text-accent-blue transition-colors"
            >
              <FileText size={14} strokeWidth={2.5} />
              {message.sources!.length} fuentes
              {showSources ? (
                <ChevronUp size={14} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={14} strokeWidth={2.5} />
              )}
            </button>

            {showSources && (
              <div className="mt-1 space-y-1">
                {message.sources!.map((source, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 bg-muted/30 border border-pencil/10 font-body text-sm text-pencil/70"
                    style={{
                      borderRadius:
                        "255px 15px 225px 15px / 15px 225px 15px 255px",
                    }}
                  >
                    <span className="font-heading text-pencil font-bold text-xs">
                      {source.document_name}
                    </span>
                    <p className="mt-0.5 text-xs leading-relaxed">
                      {source.preview}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
